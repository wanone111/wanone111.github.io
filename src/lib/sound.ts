// src/lib/sound.ts
export type SoundKind = 'tick' | 'pop' | 'close' | 'chime' | 'thud';

const STORAGE_KEY = 'wanone-sound-enabled';
let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx) ctx = new AudioCtx();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// 默认开启轻量微交互音效，可在顶栏随时静音
export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === null ? true : saved === 'true';
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, String(enabled));
}

export function playSound(kind: SoundKind): void {
  if (!isSoundEnabled()) return;
  const audio = getContext();
  if (!audio) return;

  const now = audio.currentTime;
  const master = audio.createGain();
  master.gain.value = 0.12;
  master.connect(audio.destination);

  if (kind === 'tick') {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1150, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.018);
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    osc.connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + 0.022);
  } else if (kind === 'pop') {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.055);
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    osc.connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + 0.07);
  } else if (kind === 'close') {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(210, now + 0.05);
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    osc.connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + 0.06);
  } else if (kind === 'chime') {
    [660, 880].forEach((freq, i) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      const t = now + i * 0.055;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.42, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain).connect(master);
      osc.start(t);
      osc.stop(t + 0.13);
    });
  } else if (kind === 'thud') {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(68, now + 0.065);
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
    osc.connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + 0.08);
  }
}
