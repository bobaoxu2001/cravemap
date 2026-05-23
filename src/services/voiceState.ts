import { VoiceIntent } from './voice';
import { Restaurant } from '../../types';

// Ephemeral module-level store — lives only for the current session.
// Used to pass voice results from VoiceMic → voice-results screen without
// URL-encoding Chinese text into route params.

let _intent: VoiceIntent | null = null;
let _results: Restaurant[] = [];

export function setVoiceState(intent: VoiceIntent, results: Restaurant[]): void {
  _intent = intent;
  _results = results;
}

export function getVoiceState(): { intent: VoiceIntent | null; results: Restaurant[] } {
  return { intent: _intent, results: _results };
}

export function clearVoiceState(): void {
  _intent = null;
  _results = [];
}
