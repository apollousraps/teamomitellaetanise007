let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playDigitalTone(
  type: 'click' | 'confirm' | 'error',
  enabled: boolean
): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.start(now);
      osc.stop(now + 0.07);
    } else if (type === 'confirm') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(783.99, now + 0.07);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      osc.start(now);
      osc.stop(now + 0.13);
    }
  } catch {
    // Audio playback blocked or unavailable
  }
}

export const SELECTION_THEME_MUSIC_URL =
  '/assets/aistudio/Digimon_Data_Squad_-_Vem_Comigo__Daniel_Quirino__MP3_160K__6db659da.mp3';

const SELECTION_THEME_TARGET_VOL = 0.42;

class SelectionThemeController {
  private audio: HTMLAudioElement | null = null;
  private active = false;
  private muted = false;
  private fadeTimer: number | null = null;
  private unlockHandler: (() => void) | null = null;

  private ensureAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.audio) {
      const el = new Audio(SELECTION_THEME_MUSIC_URL);
      el.loop = true;
      el.preload = 'auto';
      el.volume = this.muted ? 0 : SELECTION_THEME_TARGET_VOL;
      this.audio = el;
    }
    return this.audio;
  }

  private clearFade() {
    if (this.fadeTimer !== null) {
      window.clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
  }

  private clearUnlockListener() {
    if (this.unlockHandler && typeof window !== 'undefined') {
      window.removeEventListener('pointerdown', this.unlockHandler);
      window.removeEventListener('keydown', this.unlockHandler);
      this.unlockHandler = null;
    }
  }

  private attachUnlockListener() {
    if (this.unlockHandler || typeof window === 'undefined') return;
    this.unlockHandler = () => {
      if (!this.active || this.muted) {
        this.clearUnlockListener();
        return;
      }
      const el = this.ensureAudio();
      if (!el) return;
      el.volume = SELECTION_THEME_TARGET_VOL;
      el.play()
        .then(() => {
          this.clearUnlockListener();
        })
        .catch(() => {
          // Will retry on next user gesture
        });
    };
    window.addEventListener('pointerdown', this.unlockHandler, { passive: true });
    window.addEventListener('keydown', this.unlockHandler, { passive: true });
  }

  start(soundEnabled: boolean): void {
    this.clearFade();
    this.active = true;
    this.muted = !soundEnabled;
    const el = this.ensureAudio();
    if (!el) return;

    el.volume = this.muted ? 0 : SELECTION_THEME_TARGET_VOL;
    if (this.muted) {
      return;
    }

    // If already playing smoothly (e.g. moving from Tamer Select -> Digimon Select), keep going without restarting!
    if (!el.paused && el.currentTime > 0) {
      return;
    }

    el.play()
      .then(() => {
        this.clearUnlockListener();
      })
      .catch(() => {
        this.attachUnlockListener();
      });
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    const el = this.audio;
    if (!el) return;
    if (muted) {
      el.volume = 0;
      return;
    }
    if (this.active) {
      this.clearFade();
      el.volume = SELECTION_THEME_TARGET_VOL;
      if (el.paused) {
        el.play()
          .then(() => {
            this.clearUnlockListener();
          })
          .catch(() => {
            this.attachUnlockListener();
          });
      }
    }
  }

  stop(): void {
    this.active = false;
    this.clearUnlockListener();
    this.clearFade();
    const el = this.audio;
    if (!el) return;

    if (el.paused || el.volume <= 0.01) {
      try {
        el.pause();
        el.currentTime = 0;
      } catch {
        // Ignore reset error
      }
      return;
    }

    // Smooth ~240ms fade-out when spawning into DATS Center
    const startVol = el.volume;
    let step = 0;
    const totalSteps = 8;
    this.fadeTimer = window.setInterval(() => {
      step += 1;
      const nextVol = Math.max(0, startVol * (1 - step / totalSteps));
      el.volume = nextVol;
      if (step >= totalSteps || !this.audio) {
        this.clearFade();
        try {
          el.pause();
          el.currentTime = 0;
        } catch {
          // Ignore pause error
        }
      }
    }, 30);
  }
}

export const selectionThemePlayer = new SelectionThemeController();

export const EVOLUTION_AUDIO_TRACKS = {
  /** Voice pronouncing "EVOLUTION!" triggered at exact 2.0s mark */
  voiceEvolutionUrl:
    '/assets/aistudio/Digimon_Tamers_Evolution_Sound_MP3_160K__97d4621a.mp3',
  /** Epic Digivolution theme music triggered at exact 10.0s mark */
  themeMusicUrl:
    '/assets/aistudio/digibay_evolucion_-_tono_para_celular_-_digimon_aventure_1_MP3_160K__4c7d2388.mp3',
} as const;

export const EVOLUTION_TIMELINE = {
  VOICE_AT_SEC: 2.0,
  THEME_AT_SEC: 10.0,
  MORPH_START_SEC: 10.55,
  REVEAL_AT_SEC: 12.6,
} as const;

const decodedBufferCache = new Map<string, AudioBuffer>();
const pendingDecodePromises = new Map<string, Promise<AudioBuffer | null>>();

function loadAudioBuffer(
  ctx: AudioContext,
  url: string
): Promise<AudioBuffer | null> {
  const cached = decodedBufferCache.get(url);
  if (cached) return Promise.resolve(cached);

  const inFlight = pendingDecodePromises.get(url);
  if (inFlight) return inFlight;

  const task = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.arrayBuffer();
    })
    .then((arr) => ctx.decodeAudioData(arr))
    .then((decoded) => {
      decodedBufferCache.set(url, decoded);
      return decoded;
    })
    .catch(() => null)
    .finally(() => {
      pendingDecodePromises.delete(url);
    });

  pendingDecodePromises.set(url, task);
  return task;
}

/**
 * Call synchronously inside a user tap/click handler (e.g. clicking "Evoluir")
 * to unlock Web Audio on iOS Safari / Android Chrome and preload both MP3 tracks.
 */
export function preloadAndUnlockEvolutionAudio(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  void loadAudioBuffer(ctx, EVOLUTION_AUDIO_TRACKS.voiceEvolutionUrl);
  void loadAudioBuffer(ctx, EVOLUTION_AUDIO_TRACKS.themeMusicUrl);
}

export interface EvolutionAudioController {
  start: () => void;
  setMuted: (muted: boolean) => void;
  stop: () => void;
}

/**
 * Universal Cinematic Digivolution Audio Engine:
 * - 0.0s - 2.0s: Cybernetic charge hum & rising digital pulses
 * - Exact 2.0s:  Real "EVOLUTION!" voice MP3 + synchronized impact pulse
 * - 2.0s - 10.0s: Escalating energy spirals, lightning crackles & dramatic build-up
 * - Exact 10.0s: Real Digivolution Theme MP3 with epic impact, continuing through Reveal
 */
export function createEvolutionAudioController(
  initialEnabled: boolean
): EvolutionAudioController {
  let masterGain: GainNode | null = null;
  let stopped = false;
  let started = false;
  let muted = !initialEnabled;
  const scheduledNodes: AudioScheduledSourceNode[] = [];
  const fallbackElements: HTMLAudioElement[] = [];
  const fallbackTimers: number[] = [];

  function trackNode<T extends AudioScheduledSourceNode>(node: T): T {
    scheduledNodes.push(node);
    return node;
  }

  function scheduleTone(
    ctx: AudioContext,
    dest: AudioNode,
    baseTime: number,
    opts: {
      type: OscillatorType;
      startOffset: number;
      duration: number;
      freqStart: number;
      freqEnd?: number;
      peakGain: number;
      attack?: number;
    }
  ) {
    const t0 = baseTime + opts.startOffset;
    const t1 = t0 + opts.duration;
    const osc = trackNode(ctx.createOscillator());
    const gain = ctx.createGain();
    osc.type = opts.type;
    osc.frequency.setValueAtTime(opts.freqStart, t0);
    if (opts.freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, opts.freqEnd),
        t1
      );
    }

    const attack = Math.min(opts.attack ?? 0.03, opts.duration * 0.45);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(opts.peakGain, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t1);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t0);
    osc.stop(t1 + 0.02);
  }

  function scheduleNoiseBurst(
    ctx: AudioContext,
    dest: AudioNode,
    baseTime: number,
    opts: {
      startOffset: number;
      duration: number;
      filterFreqStart: number;
      filterFreqEnd: number;
      q: number;
      peakGain: number;
    }
  ) {
    const sampleRate = ctx.sampleRate;
    const length = Math.max(1, Math.floor(sampleRate * opts.duration));
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const t0 = baseTime + opts.startOffset;
    const t1 = t0 + opts.duration;

    const src = trackNode(ctx.createBufferSource());
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(opts.q, t0);
    filter.frequency.setValueAtTime(opts.filterFreqStart, t0);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(40, opts.filterFreqEnd),
      t1
    );

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(opts.peakGain, t0 + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, t1);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start(t0);
    src.stop(t1 + 0.02);
  }

  function scheduleMp3Track(
    ctx: AudioContext,
    dest: AudioNode,
    baseTime: number,
    url: string,
    targetOffsetSec: number,
    volume: number
  ) {
    const scheduleBuffer = (buf: AudioBuffer) => {
      if (stopped) return;
      const src = trackNode(ctx.createBufferSource());
      src.buffer = buf;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      src.connect(gain);
      gain.connect(dest);

      const scheduledAt = baseTime + targetOffsetSec;
      const now = ctx.currentTime;
      if (scheduledAt >= now) {
        src.start(scheduledAt);
      } else {
        const missed = now - scheduledAt;
        if (missed < buf.duration - 0.1) {
          src.start(now, missed);
        }
      }
    };

    const cached = decodedBufferCache.get(url);
    if (cached) {
      scheduleBuffer(cached);
      return;
    }

    void loadAudioBuffer(ctx, url).then((buf) => {
      if (stopped) return;
      if (buf) {
        scheduleBuffer(buf);
      } else {
        // Resilient HTML5 Audio fallback if Web Audio decode fails
        const remainingMs = Math.max(
          0,
          (baseTime + targetOffsetSec - ctx.currentTime) * 1000
        );
        const timerId = window.setTimeout(() => {
          if (stopped) return;
          const el = new Audio(url);
          el.volume = muted ? 0 : Math.min(1, volume);
          el.preload = 'auto';
          fallbackElements.push(el);
          el.play().catch(() => {});
        }, remainingMs);
        fallbackTimers.push(timerId);
      }
    });
  }

  return {
    start() {
      if (started || stopped) return;
      started = true;
      const ctx = getAudioContext();

      if (!ctx) {
        // Pure HTML5 Audio fallback when Web Audio API is unavailable
        const scheduleEl = (url: string, delayMs: number, vol: number) => {
          const id = window.setTimeout(() => {
            if (stopped) return;
            const el = new Audio(url);
            el.volume = muted ? 0 : vol;
            fallbackElements.push(el);
            el.play().catch(() => {});
          }, delayMs);
          fallbackTimers.push(id);
        };
        scheduleEl(
          EVOLUTION_AUDIO_TRACKS.voiceEvolutionUrl,
          EVOLUTION_TIMELINE.VOICE_AT_SEC * 1000,
          0.95
        );
        scheduleEl(
          EVOLUTION_AUDIO_TRACKS.themeMusicUrl,
          EVOLUTION_TIMELINE.THEME_AT_SEC * 1000,
          0.88
        );
        return;
      }

      try {
        masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(muted ? 0 : 0.85, ctx.currentTime);
        masterGain.connect(ctx.destination);

        const baseTime = ctx.currentTime;

        // 1) 0.0s - 2.0s: Portal Ignition + Rising Cyber Energy Charge
        scheduleTone(ctx, masterGain, baseTime, {
          type: 'sawtooth',
          startOffset: 0.0,
          duration: 2.05,
          freqStart: 55.0, // A1
          freqEnd: 220.0, // A3
          peakGain: 0.048,
          attack: 0.45,
        });
        scheduleTone(ctx, masterGain, baseTime, {
          type: 'sine',
          startOffset: 0.0,
          duration: 2.05,
          freqStart: 110.0, // A2
          freqEnd: 440.0, // A4
          peakGain: 0.055,
          attack: 0.35,
        });
        const introArp = [
          261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5, 1318.51,
        ];
        introArp.forEach((freq, i) => {
          scheduleTone(ctx, masterGain!, baseTime, {
            type: 'triangle',
            startOffset: 0.12 + i * 0.21,
            duration: 0.22,
            freqStart: freq,
            freqEnd: freq * 1.03,
            peakGain: 0.025 + i * 0.0025,
            attack: 0.015,
          });
        });

        // 2) EXACT 2.0s: "EVOLUTION!" Voice MP3 + Synchronized Energy Flash Impact
        scheduleMp3Track(
          ctx,
          masterGain,
          baseTime,
          EVOLUTION_AUDIO_TRACKS.voiceEvolutionUrl,
          EVOLUTION_TIMELINE.VOICE_AT_SEC,
          1.0
        );
        scheduleTone(ctx, masterGain, baseTime, {
          type: 'sine',
          startOffset: EVOLUTION_TIMELINE.VOICE_AT_SEC,
          duration: 0.65,
          freqStart: 160,
          freqEnd: 42,
          peakGain: 0.14,
          attack: 0.01,
        });
        scheduleNoiseBurst(ctx, masterGain, baseTime, {
          startOffset: EVOLUTION_TIMELINE.VOICE_AT_SEC,
          duration: 0.42,
          filterFreqStart: 3200,
          filterFreqEnd: 420,
          q: 1.4,
          peakGain: 0.065,
        });

        // 3) 2.0s - 10.0s: Escalating Energy Spirals, Shockwaves & Silhouette Tension
        // Keep 2.0s - 4.1s lighter so "EVOLUTION!" voice cuts through with maximum clarity
        scheduleTone(ctx, masterGain, baseTime, {
          type: 'sine',
          startOffset: 4.1,
          duration: 5.9,
          freqStart: 73.42, // D2
          freqEnd: 293.66, // D4
          peakGain: 0.068,
          attack: 1.2,
        });
        scheduleTone(ctx, masterGain, baseTime, {
          type: 'sawtooth',
          startOffset: 4.6,
          duration: 5.4,
          freqStart: 146.83, // D3
          freqEnd: 587.33, // D5
          peakGain: 0.042,
          attack: 1.4,
        });

        // Periodic shockwave surges & crimson electric crackles during 4.2s - 9.8s
        for (const tWave of [4.4, 6.2, 7.8, 9.0, 9.55]) {
          scheduleNoiseBurst(ctx, masterGain, baseTime, {
            startOffset: tWave,
            duration: 0.48,
            filterFreqStart: 1200 + (tWave - 4) * 380,
            filterFreqEnd: 4800,
            q: 2.6,
            peakGain: 0.032 + (tWave - 4) * 0.0065,
          });
          scheduleTone(ctx, masterGain, baseTime, {
            type: 'sine',
            startOffset: tWave,
            duration: 0.42,
            freqStart: 125 + (tWave - 4) * 14,
            freqEnd: 48,
            peakGain: 0.07 + (tWave - 4) * 0.01,
            attack: 0.012,
          });
        }

        // Accelerating digital resonance pulses from 6.5s to 9.9s leading into 10.0s drop
        const tensionSteps = 14;
        for (let i = 0; i < tensionSteps; i++) {
          const frac = i / tensionSteps;
          const offset = 6.5 + Math.pow(frac, 0.85) * 3.35;
          const freq = 330 * Math.pow(2, frac * 1.65);
          scheduleTone(ctx, masterGain, baseTime, {
            type: 'triangle',
            startOffset: offset,
            duration: 0.16,
            freqStart: freq,
            freqEnd: freq * 1.04,
            peakGain: 0.022 + frac * 0.024,
            attack: 0.01,
          });
        }

        // 4) EXACT 10.0s: Epic Digivolution Theme MP3 + Explosive Transformation Drop
        scheduleMp3Track(
          ctx,
          masterGain,
          baseTime,
          EVOLUTION_AUDIO_TRACKS.themeMusicUrl,
          EVOLUTION_TIMELINE.THEME_AT_SEC,
          0.95
        );
        scheduleTone(ctx, masterGain, baseTime, {
          type: 'sine',
          startOffset: EVOLUTION_TIMELINE.THEME_AT_SEC,
          duration: 0.85,
          freqStart: 195,
          freqEnd: 36,
          peakGain: 0.16,
          attack: 0.008,
        });
        scheduleNoiseBurst(ctx, masterGain, baseTime, {
          startOffset: EVOLUTION_TIMELINE.THEME_AT_SEC,
          duration: 0.72,
          filterFreqStart: 4200,
          filterFreqEnd: 280,
          q: 1.0,
          peakGain: 0.085,
        });

        // 5) 12.6s: Final Form Reveal Light Explosion Accent (underneath the epic theme!)
        scheduleTone(ctx, masterGain, baseTime, {
          type: 'sine',
          startOffset: EVOLUTION_TIMELINE.REVEAL_AT_SEC,
          duration: 0.7,
          freqStart: 155,
          freqEnd: 40,
          peakGain: 0.12,
          attack: 0.01,
        });
        scheduleNoiseBurst(ctx, masterGain, baseTime, {
          startOffset: EVOLUTION_TIMELINE.REVEAL_AT_SEC,
          duration: 0.5,
          filterFreqStart: 5000,
          filterFreqEnd: 650,
          q: 1.2,
          peakGain: 0.06,
        });
      } catch {
        // Ignore audio scheduling errors cleanly
      }
    },

    setMuted(nextMuted: boolean) {
      muted = nextMuted;
      for (const el of fallbackElements) {
        el.volume = muted ? 0 : 0.9;
      }
      if (!masterGain || stopped) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        masterGain.gain.cancelScheduledValues(ctx.currentTime);
        masterGain.gain.setTargetAtTime(muted ? 0 : 0.85, ctx.currentTime, 0.03);
      } catch {
        // Ignore gain update errors
      }
    },

    stop() {
      if (stopped) return;
      stopped = true;
      for (const id of fallbackTimers) {
        window.clearTimeout(id);
      }
      fallbackTimers.length = 0;

      for (const el of fallbackElements) {
        try {
          el.pause();
          el.currentTime = 0;
        } catch {
          // Ignore stop errors
        }
      }
      fallbackElements.length = 0;

      const ctx = getAudioContext();
      if (masterGain && ctx) {
        try {
          masterGain.gain.cancelScheduledValues(ctx.currentTime);
          masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
        } catch {
          // Ignore fade-out errors
        }
      }
      for (const node of scheduledNodes) {
        try {
          node.stop();
          node.disconnect();
        } catch {
          // Already stopped
        }
      }
      scheduledNodes.length = 0;
    },
  };
}
