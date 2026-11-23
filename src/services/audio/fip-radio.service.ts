/**
 * [L5] EXW.L5.FIP_AUDIO | v5.0.0 | SADT A4.2
 * Radio France FIP 6-Stream Web Radio + Clickless Fade-In/Fade-Out + Clean Ambient Fallback + UI SFX:
 * - Auto-activates ON by default upon the first user gesture (pointerdown / keydown)
 * - 6 FIP stations: Direct, Jazz, Électro, Groove, Monde, Rock
 * - Zero startup thud: gentle volume ramp on stream start, 4.5s buffer grace before fallback,
 *   automatic synth stop on stream start, and high-passed smooth-ramped ambient pad if offline.
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

const STREAM_FALLBACK_GRACE_MS = 4500;
const STREAM_FADE_IN_MS = 360;
const SYNTH_GAIN_SCALE = 0.045;

class FipRadioService {
  private audioEl: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private synthGain: GainNode | null = null;
  private synthOscs: OscillatorNode[] = [];
  private fadeTimer: number | null = null;
  private fallbackTimer: number | null = null;
  private playSeq = 0;
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

  private clearTimers(): void {
    if (typeof window === 'undefined') return;
    if (this.fadeTimer !== null) {
      window.clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
    if (this.fallbackTimer !== null) {
      window.clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }
  }

  private fadeInAudioElement(targetVolume: number): void {
    if (typeof window === 'undefined' || !this.audioEl) return;
    if (this.fadeTimer !== null) {
      window.clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
    const el = this.audioEl;
    el.volume = 0;
    const steps = 12;
    const stepMs = Math.max(16, Math.round(STREAM_FADE_IN_MS / steps));
    let currentStep = 0;
    this.fadeTimer = window.setInterval(() => {
      currentStep += 1;
      const ratio = Math.min(1, currentStep / steps);
      // Smooth ease-out curve prevents any sudden DC jump / thud at stream start
      el.volume = Math.max(0, Math.min(1, targetVolume * ratio * ratio));
      if (ratio >= 1 && this.fadeTimer !== null) {
        window.clearInterval(this.fadeTimer);
        this.fadeTimer = null;
      }
    }, stepMs);
  }

  public setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.audioEl && this.fadeTimer === null) {
      this.audioEl.volume = this.volume;
    }
    if (this.synthGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.synthGain.gain.cancelScheduledValues(now);
      this.synthGain.gain.setTargetAtTime(Math.max(0.0001, this.volume * SYNTH_GAIN_SCALE), now, 0.08);
    }
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
    const seq = ++this.playSeq;
    this.clearTimers();
    this.stopSynthFallback();

    if (!this.audioEl) {
      this.audioEl = new Audio();
      this.audioEl.crossOrigin = 'anonymous';
      this.audioEl.preload = 'none';
    }
    this.audioEl.volume = 0;
    this.audioEl.src = spec.streamUrl;

    // Wait generously for real Icecast buffering so we never fire a thud/drone while FIP loads
    let settled = false;
    this.fallbackTimer = window.setTimeout(() => {
      if (!settled && seq === this.playSeq && this.enabled) {
        this.startSynthFallback();
      }
    }, STREAM_FALLBACK_GRACE_MS);

    try {
      await this.audioEl.play();
      settled = true;
      if (this.fallbackTimer !== null) {
        window.clearTimeout(this.fallbackTimer);
        this.fallbackTimer = null;
      }
      if (seq !== this.playSeq || !this.enabled) {
        this.audioEl.pause();
        return;
      }
      // Always stop fallback synth cleanly if it had started during a slow buffer
      this.stopSynthFallback();
      this.fadeInAudioElement(this.volume);
      this.playing = true;
      this.fallbackActive = false;
      this.emit();
    } catch {
      settled = true;
      if (this.fallbackTimer !== null) {
        window.clearTimeout(this.fallbackTimer);
        this.fallbackTimer = null;
      }
      if (seq !== this.playSeq || !this.enabled) return;
      this.startSynthFallback();
    }
  }

  public pause(): void {
    this.playSeq += 1;
    this.enabled = false;
    this.playing = false;
    this.clearTimers();
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.volume = 0;
    }
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
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    // Smooth fade-in from near-silence eliminates any DC click or low-frequency thud
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(Math.max(0.001, this.volume * SYNTH_GAIN_SCALE), now + 0.65);

    // High-pass removes muddy bass rumble; gentle low-pass keeps the pad airy and calm
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(220, now);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1400, now);

    gain.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(ctx.destination);

    // Light, airy Cmaj7 ambient pad (no sub-200Hz rumble)
    const freqs = [261.63, 329.63, 392.0, 493.88];
    this.synthOscs = freqs.map((f) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      osc.connect(gain);
      osc.start(now);
      return osc;
    });
    this.synthGain = gain;
    this.playing = true;
    this.fallbackActive = true;
    this.emit();
  }

  private stopSynthFallback(): void {
    const oscs = this.synthOscs;
    const gain = this.synthGain;
    this.synthOscs = [];
    this.synthGain = null;
    this.fallbackActive = false;

    if (oscs.length === 0) return;

    if (gain && this.ctx) {
      const now = this.ctx.currentTime;
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      } catch {
        // ignore ramp edge cases
      }
      for (const osc of oscs) {
        try {
          osc.stop(now + 0.14);
        } catch {
          // already stopped
        }
      }
      return;
    }

    for (const osc of oscs) {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // already stopped
      }
    }
    gain?.disconnect();
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
    gain.gain.linearRampToValueAtTime(Math.max(0.025, this.volume * 0.14), now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + cfg.dur);

    osc.start(now);
    osc.stop(now + cfg.dur + 0.01);
  }
}

export const fipRadioService = new FipRadioService();
