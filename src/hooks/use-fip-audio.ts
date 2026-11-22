import { useEffect } from 'react';
import { fipRadioService, type FipStationId } from '../services/audio/fip-radio.service.ts';
import { useExoStore } from '../stores/game.store.ts';

/**
 * [L6] EXW.L6.FIP_AUDIO_HOOK | v4.0.0-rc.1 | SADT A4.2
 * Arms FIP Web Radio auto-activation on first user gesture and syncs volume/station.
 */
const VALID_STATIONS = new Set<FipStationId>(['DIRECT', 'JAZZ', 'ELECTRO', 'GROOVE', 'MONDE', 'ROCK']);

function normalizeStation(raw: string): FipStationId {
  const cleaned = raw.replace(/^FIP_/, '').toUpperCase() as FipStationId;
  return VALID_STATIONS.has(cleaned) ? cleaned : 'DIRECT';
}

export function useFipAudio(): void {
  const audio = useExoStore((s) => s.audio);

  useEffect(() => {
    fipRadioService.armAutoStartOnFirstGesture();
  }, []);

  useEffect(() => {
    fipRadioService.setVolume(audio.volume);
    const station = normalizeStation(audio.stationId);
    if (audio.muted) {
      fipRadioService.pause();
    } else if (fipRadioService.getState().station !== station && fipRadioService.getState().playing) {
      void fipRadioService.play(station);
    }
  }, [audio.muted, audio.stationId, audio.volume]);
}
