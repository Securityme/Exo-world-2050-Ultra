/**
 * [L5] EXW.L5.FIP_AUDIO | v4.0.0-rc.1 | SADT A4.2
 * Radio France FIP 6-Stream Web Radio + <500ms WebAudio Ambient Synth Fallback + <25ms UI SFX:
 * - Auto-activates ON by default upon the first user gesture (pointerdown / keydown)
 * - 6 FIP stations: Direct, Jazz, Électro, Groove, Monde, Rock
 * - Seamless WebAudio ambient harmonic fallback if remote audio stream is blocked/offline
 */

export type FipStationId = 'DIRECT' | 'JAZZ' | 'ELECTRO' | 'GROOVE' | 'MONDE' | 'ROCK';

export interface FipStationSpec {
  readonly id: FipStationId;
  readonly label: string;
  readonly mood: string;
  readonly streamUrl: string;
}

export const FIP_STATIONS: readonly FipStationSpec[] = Object.freeze([
  { id: 'DIRECT', label: 'FIP Direct', mood: 'Éclectique · Ambiance orbitale continue', streamUrl: 'https://icecast.radiofrance.fr/fip-midfi.mp3' },
  { id: 'JAZZ', label: 'FIP Jazz', mood: 'Jazz moderne & acoustique feutré', streamUrl: 'https://icecast.radiofrance.fr/fipjazz-midfi.mp3' },
  { id: 'ELECTRO', label: 'FIP Électro', mood: 'Synthés spatiaux & downtempo', streamUrl: 'https://icecast.radiofrance.fr/fipelectro-midfi.mp3' },
  { id: 'GROOVE', label: 'FIP Groove', mood: 'Soul, funk & rythmes chaleureux', streamUrl: 'https://icecast.radiofrance.fr/fipgroove-midfi.mp3' },
  { id: 'MONDE', label: 'FIP Monde', mood: 'Musiques du monde & horizon planétaire', streamUrl: 'https://icecast.radiofrance.fr/fipworld-midfi.mp3' },
  { id: 'ROCK', label: 'FIP Rock', mood: 'Rock indépendant & énergie industrielle', streamUrl: 'https://icecast.radiofrance.fr/fiprock-midfi.mp3' },
]);

export type UiCueKind = 'CLICK' | 'SIGNATURE' | 'CHIME' | 'PULSE' | 'FANFARE' | 'ALERT_P0';

class FipRadioService {
  private audioEl: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private synthGain: GainNode | null = null;
  private synthOscs: OscillatorNode[] = [];
  private station: FipStationId = 'DIRECT';
  private enabled = true;
  private sfxEnabled = true;
  private volume = 0.35;
  private playing = false;
  private fallbackActive = false;
  private gestureArmed = false;
  private listeners = new Set<() => void>();

  public armAutoStartOnFirstGesture(): void {
    if (this.gestureArmed || typeof window === 'undefined') return;
    this.gestureArmed = true;
    const onFirstGesture = () => {
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
      if (this.enabled && !this.playing) {
        void this.play(this.station);
      }
    };
    window.addEventListener('pointerdown', onFirstGesture, { once: true, passive: true });
    window.addEventListener('keydown', onFirstGesture, { once: true, passive: true });
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  public getState() {
    return {
      station: this.station,
      playing: this.playing,
      enabled: this.enabled,
      sfxEnabled: this.sfxEnabled,
      volume: this.volume,
      fallbackActive: this.fallbackActive,
      stations: FIP_STATIONS,
    };
  }

  public setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.audioEl) this.audioEl.volume = this.volume;
    if (this.synthGain) this.synthGain.gain.value = this.volume * 0.14;
    this.emit();
  }

  public toggleSfx(): void {
    this.sfxEnabled = !this.sfxEnabled;
    this.emit();
  }

  public async play(stationId?: FipStationId): Promise<void> {
    if (stationId) this.station = stationId;
    this.enabled = true;
    const spec = FIP_STATIONS.find((s) => s.id === this.station) ?? FIP_STATIONS[0]!;

    if (typeof window === 'undefined') return;
    this.stopSynthFallback();

    if (!this.audioEl) {
      this.audioEl = new Audio();
      this.audioEl.crossOrigin = 'anonymous';
    }
    this.audioEl.src = spec.streamUrl;
    this.audioEl.volume = this.volume;

    // <500ms fallback guard if stream is blocked in sandbox/headless
    let settled = false;
    const fallbackTimer = window.setTimeout(() => {
      if (!settled) {
        this.startSynthFallback();
      }
    }, 480);

    try {
      await this.audioEl.play();
      settled = true;
      window.clearTimeout(fallbackTimer);
      this.playing = true;
      this.fallbackActive = false;
      this.emit();
    } catch {
      settled = true;
      window.clearTimeout(fallbackTimer);
      this.startSynthFallback();
    }
  }

  public pause(): void {
    this.enabled = false;
    this.playing = false;
    this.audioEl?.pause();
    this.stopSynthFallback();
    this.emit();
  }

  public toggle(): void {
    if (this.playing) {
      this.pause();
    } else {
      void this.play(this.station);
    }
  }

  private ensureAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => undefined);
    }
    return this.ctx;
  }

  private startSynthFallback(): void {
    const ctx = this.ensureAudioContext();
    if (!ctx) return;
    this.stopSynthFallback();

    const gain = ctx.createGain();
    gain.gain.value = this.volume * 0.12;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    gain.connect(filter);
    filter.connect(ctx.destination);

    // Warm solarpunk major-7th ambient pad chord
    const freqs = [174.61, 220.0, 261.63, 329.63];
    this.synthOscs = freqs.map((f) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      osc.connect(gain);
      osc.start();
      return osc;
    });
    this.synthGain = gain;
    this.playing = true;
    this.fallbackActive = true;
    this.emit();
  }

  private stopSynthFallback(): void {
    for (const osc of this.synthOscs) {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // already stopped
      }
    }
    this.synthOscs = [];
    this.synthGain?.disconnect();
    this.synthGain = null;
    this.fallbackActive = false;
  }

  public playUiCue(cue: UiCueKind): void {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const toneMap: Record<UiCueKind, { f1: number; f2: number; dur: number; type: OscillatorType }> = {
      CLICK: { f1: 520, f2: 680, dur: 0.045, type: 'triangle' },
      SIGNATURE: { f1: 440, f2: 660, dur: 0.14, type: 'sine' },
      CHIME: { f1: 587, f2: 880, dur: 0.18, type: 'sine' },
      PULSE: { f1: 280, f2: 360, dur: 0.12, type: 'triangle' },
      FANFARE: { f1: 523, f2: 1046, dur: 0.28, type: 'sine' },
      ALERT_P0: { f1: 310, f2: 220, dur: 0.22, type: 'sawtooth' },
    };
    const cfg = toneMap[cue];
    osc.type = cfg.type;
    osc.frequency.setValueAtTime(cfg.f1, now);
    osc.frequency.exponentialRampToValueAtTime(cfg.f2, now + cfg.dur);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(Math.max(0.03, this.volume * 0.16), now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + cfg.dur);

    osc.start(now);
    osc.stop(now + cfg.dur + 0.01);
  }
}

export const fipRadioService = new FipRadioService();
