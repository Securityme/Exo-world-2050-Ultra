import { useRef, useState } from 'react';
import { useSetAtom } from 'jotai';
import { Download, Eye, Film, Play, Square, Video } from 'lucide-react';
import { useExoStore } from '../../stores/game.store.ts';
import { activeSubscreenAtom, toastNoticeAtom } from '../../stores/selection.atoms.ts';
import {
  CLIMATE_DISASTER_12_CATALOG,
  type ClimateDisasterVideoSpec,
} from '../../systems/biosphere/video-studio-catalog.ts';

interface CapturedClip {
  readonly id: string;
  readonly specId: string;
  readonly title: string;
  readonly url: string;
  readonly mimeType: string;
  readonly createdAt: string;
  readonly durationSec: number;
}

/**
 * [L7] EXW.L7.VIDEO_STUDIO_PANEL | v5.0.0 | SADT A4.2/A5.3
 * 100% Free-Tier Video Studio:
 * - 12 Climate & Disaster Categories with live 3D scale/weather preview
 * - Real WebM 3D Live Canvas capture (canvas.captureStream(30) + MediaRecorder)
 * - Automatic procedural Canvas storyboard fallback if WebGL MediaRecorder is unavailable
 */
export function VideoStudioPanel() {
  const world = useExoStore((s) => s.world);
  const setWorld = useExoStore((s) => s.setWorld);
  const setActiveScale = useExoStore((s) => s.setActiveScale);
  const setSubscreen = useSetAtom(activeSubscreenAtom);
  const setToast = useSetAtom(toastNoticeAtom);

  const [selectedId, setSelectedId] = useState<string>(CLIMATE_DISASTER_12_CATALOG[0]!.id);
  const [recording, setRecording] = useState(false);
  const [clips, setClips] = useState<readonly CapturedClip[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const activeSpec: ClimateDisasterVideoSpec =
    CLIMATE_DISASTER_12_CATALOG.find((c) => c.id === selectedId) ?? CLIMATE_DISASTER_12_CATALOG[0]!;

  const previewIn3D = (spec: ClimateDisasterVideoSpec) => {
    setWorld({
      ...world,
      weatherState: spec.weatherPreview,
    });
    setActiveScale(spec.targetScale);
    setSubscreen('NONE');
    setToast({
      id: Date.now(),
      tone: 'info',
      text: `Prévisualisation 3D (${spec.label}) · Échelle ${spec.targetScale}.`,
    });
  };

  const generateStoryboardFallbackClip = (spec: ClimateDisasterVideoSpec) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#190d1f"/>
          <stop offset="100%" stop-color="#6b1d45"/>
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#bg)"/>
      <circle cx="510" cy="95" r="56" fill="#ff73b8" opacity="0.28"/>
      <text x="28" y="54" fill="#ffb8d9" font-family="monospace" font-size="14" font-weight="bold">EXO WORLD : 2050 · STUDIO VIDÉO 3D (FREE TIER)</text>
      <text x="28" y="102" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold">${spec.label}</text>
      <text x="28" y="142" fill="#f7dce9" font-family="sans-serif" font-size="14">${spec.cameraBrief}</text>
      <text x="28" y="318" fill="#5eead4" font-family="monospace" font-size="13">${spec.telemetryTag} · Échelle ${spec.targetScale}</text>
    </svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    setClips((prev) => [
      {
        id: `clip-${Date.now()}`,
        specId: spec.id,
        title: spec.label,
        url,
        mimeType: 'image/svg+xml',
        createdAt: new Date().toLocaleTimeString(),
        durationSec: spec.durationSec,
      },
      ...prev,
    ]);
    setToast({
      id: Date.now(),
      tone: 'success',
      text: `Storyboard 3D « ${spec.label} » archivé dans la médiathèque.`,
    });
  };

  const startWebmCapture = () => {
    if (recording) return;
    const canvas = document.querySelector('canvas');
    if (!canvas || typeof canvas.captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
      generateStoryboardFallbackClip(activeSpec);
      return;
    }

    try {
      setWorld({ ...world, weatherState: activeSpec.weatherPreview });
      setActiveScale(activeSpec.targetScale);
      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };
      recorder.onstop = () => {
        setRecording(false);
        recorderRef.current = null;
        if (chunks.length === 0) {
          generateStoryboardFallbackClip(activeSpec);
          return;
        }
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setClips((prev) => [
          {
            id: `clip-${Date.now()}`,
            specId: activeSpec.id,
            title: activeSpec.label,
            url,
            mimeType,
            createdAt: new Date().toLocaleTimeString(),
            durationSec: 4,
          },
          ...prev,
        ]);
        setToast({
          id: Date.now(),
          tone: 'success',
          text: `Clip WebM 3D « ${activeSpec.label} » capturé (Free Tier local) !`,
        });
      };

      setRecording(true);
      recorder.start();
      window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 4000);
    } catch {
      setRecording(false);
      generateStoryboardFallbackClip(activeSpec);
    }
  };

  const stopWebmCapture = () => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
  };

  return (
    <div className="space-y-4" data-testid="video-studio-panel">
      <div className="exo-bento-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase exo-accent-text">
            <Film className="h-3.5 w-3.5" />
            <span>Studio Vidéo Climat &amp; Catastrophes (12 Catégories · Capture WebM 3D Free Tier)</span>
          </div>
          <h3 className="mt-0.5 font-display text-base font-bold text-[var(--exo-text)]">
            {activeSpec.label}
          </h3>
          <p className="text-xs exo-muted-text">{activeSpec.cameraBrief}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => previewIn3D(activeSpec)}
            className="exo-accent-chip inline-flex min-h-[38px] items-center gap-1.5 px-3 font-mono text-[11px] font-bold"
          >
            <Eye className="h-3.5 w-3.5 exo-accent-text" />
            <span>Voir sur Scène 3D</span>
          </button>

          {recording ? (
            <button
              type="button"
              onClick={stopWebmCapture}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 font-mono text-[11px] font-bold text-white"
            >
              <Square className="h-3.5 w-3.5" />
              <span>Arrêter Capture…</span>
            </button>
          ) : (
            <button
              type="button"
              data-testid="capture-webm-3d-btn"
              onClick={startWebmCapture}
              className="exo-accent-btn inline-flex min-h-[38px] items-center gap-1.5 px-3.5 font-mono text-[11px] font-bold"
            >
              <Video className="h-3.5 w-3.5" />
              <span>Capturer Clip WebM 3D (4s)</span>
            </button>
          )}
        </div>
      </div>

      {/* 12 Categories Selector */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {CLIMATE_DISASTER_12_CATALOG.map((spec) => {
          const active = spec.id === activeSpec.id;
          return (
            <button
              key={spec.id}
              type="button"
              onClick={() => setSelectedId(spec.id)}
              className={`rounded-xl border p-3 text-left text-xs transition ${
                active
                  ? 'exo-accent-chip-active ring-1 ring-[var(--exo-accent)]'
                  : 'exo-surface-sub hover:border-[var(--exo-accent)]'
              }`}
            >
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="exo-accent-text font-bold">{spec.category}</span>
                <span className="exo-muted-text">
                  Éch. {spec.targetScale} · Niv. {spec.severity}/5
                </span>
              </div>
              <div className="mt-1 font-display font-bold text-[var(--exo-text)]">{spec.label}</div>
              <div className="mt-0.5 text-[10.5px] exo-muted-text">{spec.telemetryTag}</div>
            </button>
          );
        })}
      </div>

      {/* Media Library */}
      <div className="exo-bento-card space-y-2.5 p-4 text-xs">
        <div className="flex items-center justify-between">
          <h4 className="font-display text-sm font-bold text-[var(--exo-text)]">
            Médiathèque Locale ({clips.length} clip(s))
          </h4>
          <span className="font-mono text-[10px] exo-muted-text">
            100% Free Tier · Aucun coût API vidéo payant
          </span>
        </div>

        {clips.length === 0 ? (
          <p className="exo-muted-text">
            Sélectionnez une des 12 catégories ci-dessus puis cliquez « Capturer Clip WebM 3D » pour enregistrer un extrait depuis la scène WebGL active.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {clips.map((clip) => (
              <div key={clip.id} className="exo-surface-sub space-y-2 rounded-xl border exo-accent-border p-3">
                <div className="flex items-center justify-between font-mono text-[10.5px]">
                  <strong className="truncate text-[var(--exo-text)]">{clip.title}</strong>
                  <span className="exo-muted-text">{clip.createdAt}</span>
                </div>
                {clip.mimeType.startsWith('video/') ? (
                  <video
                    src={clip.url}
                    controls
                    playsInline
                    className="h-36 w-full rounded-lg bg-black object-cover"
                  />
                ) : (
                  <img
                    src={clip.url}
                    alt={clip.title}
                    className="h-36 w-full rounded-lg object-cover"
                  />
                )}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-500">
                    <Play className="h-3 w-3" /> {clip.durationSec}s · {clip.mimeType}
                  </span>
                  <a
                    href={clip.url}
                    download={`${clip.specId}.${clip.mimeType.startsWith('video/') ? 'webm' : 'svg'}`}
                    className="exo-accent-chip inline-flex items-center gap-1 px-2.5 py-1 font-mono text-[10px] font-bold"
                  >
                    <Download className="h-3 w-3" />
                    Télécharger
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
