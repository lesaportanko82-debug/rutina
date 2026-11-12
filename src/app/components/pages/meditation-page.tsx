import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../theme";
import { useApp } from "../app-context";
import { ArrowLeft, Play, Pause, SkipForward, Volume2, VolumeX, RotateCcw, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import { projectId, publicAnonKey } from "../supabase-client";
import { GlassPanel } from "../ambient-elements";
import { AppIcon } from "../app-icon";

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-ff738703`;

// ═══════════════════════════════════════════════
// MEDITATION SCRIPTS
// ═══════════════════════════════════════════════

interface MeditationStep {
  text: string;
  pauseAfter: number; // seconds of silence after audio ends
}

interface Meditation {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  colorEnd: string;
  durationMin: number;
  ambientType: "rain" | "waves" | "wind";
  steps: MeditationStep[];
}

const meditations: Meditation[] = [
  {
    id: "relax",
    title: "Глубокое расслабление",
    subtitle: "Отпустите напряжение из тела",
    emoji: "🌊",
    color: "#7EA8BE",
    colorEnd: "#9B8EC4",
    durationMin: 12,
    ambientType: "waves",
    steps: [
      { text: "Найдите удобное положение. Закройте глаза. Позвольте себе просто быть здесь, в этом моменте.", pauseAfter: 6 },
      { text: "Сделайте глубокий вдох через нос. Считайте вместе со мной.", pauseAfter: 2 },
      { text: "Один.", pauseAfter: 2 },
      { text: "Два.", pauseAfter: 2 },
      { text: "Три.", pauseAfter: 2 },
      { text: "Четыре.", pauseAfter: 3 },
      { text: "Медленно выдохните через рот. Считайте.", pauseAfter: 2 },
      { text: "Один.", pauseAfter: 2 },
      { text: "Два.", pauseAfter: 2 },
      { text: "Три.", pauseAfter: 2 },
      { text: "Четыре.", pauseAfter: 2 },
      { text: "Пять.", pauseAfter: 2 },
      { text: "Шесть.", pauseAfter: 4 },
      { text: "Ещё один вдох. Представьте, что вы вдыхаете спокойствие — мягкий, тёплый свет наполняет вас изнутри.", pauseAfter: 7 },
      { text: "Выдыхайте всё напряжение. Оно уходит как облако — легко и незаметно.", pauseAfter: 7 },
      { text: "Обратите внимание на лоб и виски. Если там есть напряжение — мысленно скажите ему: я тебя замечаю, ты можешь уйти.", pauseAfter: 7 },
      { text: "Почувствуйте, как мышцы лица расслабляются. Челюсть слегка приоткрывается. Язык лежит мягко.", pauseAfter: 6 },
      { text: "Теперь плечи. Позвольте им опуститься вниз, подальше от ушей. Тяжёлые и спокойные.", pauseAfter: 7 },
      { text: "Руки становятся тёплыми и тяжёлыми. Каждый палец расслабляется. Ладони раскрыты и мягки.", pauseAfter: 7 },
      { text: "Грудная клетка. Дыхание становится естественным, лёгким. Вам не нужно его контролировать — тело знает, как дышать.", pauseAfter: 8 },
      { text: "Живот расслабляется. Отпустите всё сжатие. Пусть живот дышит свободно.", pauseAfter: 7 },
      { text: "Бёдра, колени, голени. Волна расслабления проходит по каждой мышце ног. Ноги становятся тёплыми и тяжёлыми.", pauseAfter: 8 },
      { text: "Стопы. Пальцы ног расслабляются. Каждая точка стопы отдыхает.", pauseAfter: 6 },
      { text: "Всё тело расслаблено. Вы словно парите — безопасно, легко, свободно. Побудьте в этом ощущении.", pauseAfter: 12 },
      { text: "Если пришли мысли — это нормально. Представьте, что они — как лодочки, плывущие по реке. Вы наблюдаете, но не садитесь в них.", pauseAfter: 10 },
      { text: "Вы в безопасности. Этот момент — только ваш. Здесь не нужно ничего делать, не нужно быть кем-то. Просто быть.", pauseAfter: 12 },
      { text: "Сделайте глубокий вдох. Медленно пошевелите пальцами рук и ног.", pauseAfter: 5 },
      { text: "Когда будете готовы — мягко откройте глаза. Вы отдохнули. Вы позаботились о себе. Это важно.", pauseAfter: 3 },
    ],
  },
  {
    id: "focus",
    title: "Ясный фокус",
    subtitle: "Соберите внимание, успокойте ум",
    emoji: "🎯",
    color: "#8DB596",
    colorEnd: "#7BAFB0",
    durationMin: 11,
    ambientType: "rain",
    steps: [
      { text: "Сядьте удобно. Спина прямая, но не напряжённая. Руки лежат свободно.", pauseAfter: 5 },
      { text: "Закройте глаза или опустите взгляд. Сделайте три глубоких вдоха и выдоха вместе со мной.", pauseAfter: 2 },
      { text: "Вдох.", pauseAfter: 3 },
      { text: "Выдох.", pauseAfter: 3 },
      { text: "Вдох.", pauseAfter: 3 },
      { text: "Выдох.", pauseAfter: 3 },
      { text: "Вдох.", pauseAfter: 3 },
      { text: "Выдох.", pauseAfter: 4 },
      { text: "Представьте перед собой свечу. Маленькое, тёплое, ровное пламя. Сосредоточьте всё внимание на этом огоньке.", pauseAfter: 7 },
      { text: "Пламя не колышется. Оно устойчивое. Спокойное. Такое же, как ваше внимание сейчас.", pauseAfter: 8 },
      { text: "Если мысли уводят вас — это нормально. Мягко, без осуждения, верните взгляд к пламени свечи.", pauseAfter: 7 },
      { text: "С каждым вдохом пламя становится чуть ярче. С каждым выдохом — пространство вокруг вас становится тише.", pauseAfter: 8 },
      { text: "Теперь представьте, что этот свет расширяется и наполняет вашу голову. Мягкое, тёплое сияние проясняет мысли.", pauseAfter: 8 },
      { text: "Все лишние мысли мягко отступают к краям. В центре — ясность. Тишина. Готовность.", pauseAfter: 10 },
      { text: "Вы можете выбрать одну задачу, одну цель, одно намерение. Поместите его в этот свет в центре.", pauseAfter: 8 },
      { text: "Почувствуйте ясность. Вы знаете, что делать. Вы готовы. Не нужно спешить — просто начать.", pauseAfter: 8 },
      { text: "Сделайте вдох энергии.", pauseAfter: 3 },
      { text: "Выдох покоя.", pauseAfter: 3 },
      { text: "Ещё раз. Вдох.", pauseAfter: 3 },
      { text: "Выдох.", pauseAfter: 3 },
      { text: "И ещё раз. Вдох.", pauseAfter: 3 },
      { text: "Выдох.", pauseAfter: 4 },
      { text: "Свет остаётся с вами. Даже когда вы откроете глаза — ясность никуда не уйдёт.", pauseAfter: 6 },
      { text: "Пошевелите пальцами. Почувствуйте своё тело. Медленно откройте глаза.", pauseAfter: 4 },
      { text: "Вы сосредоточены. Вы спокойны. У вас есть всё, что нужно, чтобы начать.", pauseAfter: 3 },
    ],
  },
  {
    id: "tension",
    title: "Снятие напряжения",
    subtitle: "Освободите тело от стресса",
    emoji: "🍃",
    color: "#C4876C",
    colorEnd: "#C4A86C",
    durationMin: 14,
    ambientType: "wind",
    steps: [
      { text: "Найдите тихое место. Сядьте или лягте — как вам удобнее. Это время только для вас.", pauseAfter: 5 },
      { text: "Закройте глаза. Сделайте вдох через нос на четыре счёта.", pauseAfter: 2 },
      { text: "Один.", pauseAfter: 2 },
      { text: "Два.", pauseAfter: 2 },
      { text: "Три.", pauseAfter: 2 },
      { text: "Четыре.", pauseAfter: 2 },
      { text: "Задержите дыхание.", pauseAfter: 3 },
      { text: "Выдохните через рот.", pauseAfter: 2 },
      { text: "Один.", pauseAfter: 2 },
      { text: "Два.", pauseAfter: 2 },
      { text: "Три.", pauseAfter: 2 },
      { text: "Четыре.", pauseAfter: 2 },
      { text: "Пять.", pauseAfter: 2 },
      { text: "Шесть.", pauseAfter: 4 },
      { text: "Теперь мы пройдём по телу и отпустим всё напряжение. Начнём с рук.", pauseAfter: 5 },
      { text: "Сожмите кулаки. Сильно. Почувствуйте напряжение в пальцах, ладонях, предплечьях.", pauseAfter: 2 },
      { text: "Один.", pauseAfter: 2 },
      { text: "Два.", pauseAfter: 2 },
      { text: "Три.", pauseAfter: 2 },
      { text: "Четыре.", pauseAfter: 2 },
      { text: "Пять.", pauseAfter: 2 },
      { text: "И отпустите. Полностью. Почувствуйте контраст — тепло, мягкость, лёгкость в руках.", pauseAfter: 7 },
      { text: "Теперь плечи. Поднимите их к ушам. Высоко. Сожмите. Держите.", pauseAfter: 6 },
      { text: "И отпустите. Плечи падают вниз. Вся тяжесть уходит. Шея свободна.", pauseAfter: 7 },
      { text: "Лицо. Зажмурьте глаза, сожмите губы, напрягите лоб. Всё лицо — в напряжении.", pauseAfter: 5 },
      { text: "И отпустите. Лоб разглаживается. Глаза отдыхают. Челюсть слегка приоткрыта. Лицо мягкое, как у спящего ребёнка.", pauseAfter: 8 },
      { text: "Живот. Напрягите мышцы живота, как будто готовитесь к удару. Сильно. Держите.", pauseAfter: 6 },
      { text: "И отпустите. Живот мягкий. Дыхание свободное. Глубокое.", pauseAfter: 7 },
      { text: "Ноги. Вытяните и напрягите ноги. Носки тянутся вперёд. Бёдра, голени — всё в напряжении.", pauseAfter: 6 },
      { text: "И отпустите. Ноги тяжёлые и тёплые. Каждая мышца расслаблена.", pauseAfter: 8 },
      { text: "Теперь всё тело. Представьте, что вы лежите на тёплом песке у моря. Солнце мягко согревает кожу.", pauseAfter: 8 },
      { text: "Волны ритмично набегают и отступают. Каждая волна уносит ещё немного напряжения.", pauseAfter: 10 },
      { text: "Вы чувствуете себя легко. Спокойно. Тело благодарно вам за эту заботу.", pauseAfter: 10 },
      { text: "Стресс — это не ваша вина. Напряжение — это сигнал тела, что ему нужна пауза. И вы эту паузу дали.", pauseAfter: 8 },
      { text: "Сделайте глубокий вдох. Потянитесь всем телом. Медленно откройте глаза.", pauseAfter: 5 },
      { text: "Вы справились. Вы позаботились о себе. Это и есть настоящая сила.", pauseAfter: 3 },
    ],
  },
];

// ═══════════════════════════════════════════════
// AMBIENT SOUND ENGINE — Web Audio API
// ═══════════════════════════════════════════════

class AmbientEngine {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private nodes: AudioNode[] = [];
  private running = false;
  private baseVolume = 0.15;

  start(type: "rain" | "waves" | "wind", volume = 0.15) {
    if (this.running) this.stop();
    this.baseVolume = volume;
    this.ctx = new AudioContext();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = volume;
    this.gainNode.connect(this.ctx.destination);
    this.running = true;

    if (type === "rain") this.createRain();
    else if (type === "waves") this.createWaves();
    else this.createWind();
  }

  // Ducking: reduce volume during voice, restore during pauses
  duck() {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(this.baseVolume * 0.25, this.ctx.currentTime, 0.8);
    }
  }

  unduck() {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(this.baseVolume, this.ctx.currentTime, 1.2);
    }
  }

  setVolume(v: number) {
    this.baseVolume = v;
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
    }
  }

  private createRain() {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 800; lp.Q.value = 0.5;
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 200;
    source.connect(hp); hp.connect(lp); lp.connect(this.gainNode!);
    source.start();
    this.nodes.push(source);
  }

  private createWaves() {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / this.ctx.sampleRate;
      const wave = Math.sin(t * 0.3) * 0.5 + Math.sin(t * 0.7) * 0.3;
      data[i] = (Math.random() * 2 - 1) * 0.15 * (0.5 + wave * 0.5);
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer; source.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 500;
    source.connect(lp); lp.connect(this.gainNode!);
    source.start();
    this.nodes.push(source);
  }

  private createWind() {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / this.ctx.sampleRate;
      const env = 0.3 + 0.2 * Math.sin(t * 0.4) + 0.1 * Math.sin(t * 1.1);
      data[i] = (Math.random() * 2 - 1) * env * 0.2;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer; source.loop = true;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 350; bp.Q.value = 0.3;
    source.connect(bp); bp.connect(this.gainNode!);
    source.start();
    this.nodes.push(source);
  }

  stop() {
    this.running = false;
    this.nodes.forEach((n) => { try { (n as AudioBufferSourceNode).stop(); } catch {} });
    this.nodes = [];
    if (this.ctx) { try { this.ctx.close(); } catch {} }
    this.ctx = null;
    this.gainNode = null;
  }
}

// ═══════════════════════════════════════════════
// TTS via OpenAI API
// ═══════════════════════════════════════════════

async function fetchTTSAudio(text: string): Promise<string> {
  // Add natural pauses between phrases: insert commas after every ~3-4 words
  // and ellipses between sentences for meditative pacing
  const pausedText = text
    .replace(/\. /g, "... ")          // longer pauses between sentences
    .replace(/\, /g, ",... ")         // extend comma pauses  
    .replace(/— /g, "—... ")         // extend dash pauses
    .replace(/\? /g, "?... ");        // extend question pauses

  const res = await fetch(`${API_BASE}/tts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify({ text: pausedText, voice: "shimmer" }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("TTS fetch error:", err);
    throw new Error(`TTS error: ${res.status}`);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// ═══════════════════════════════════════════════
// BINAURAL BEATS — alpha/theta waves for deep meditation
// ═══════════════════════════════════════════════

class BinauralEngine {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private oscL: OscillatorNode | null = null;
  private oscR: OscillatorNode | null = null;
  private merger: ChannelMergerNode | null = null;
  private running = false;

  // baseFreq ~200Hz, beatFreq 6-10Hz for alpha/theta
  start(baseFreq = 200, beatFreq = 7, volume = 0.04) {
    if (this.running) this.stop();
    this.ctx = new AudioContext();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0;
    this.gainNode.connect(this.ctx.destination);
    this.running = true;

    // Stereo split: left ear = baseFreq, right ear = baseFreq + beatFreq
    this.merger = this.ctx.createChannelMerger(2);
    this.merger.connect(this.gainNode);

    const gL = this.ctx.createGain();
    gL.gain.value = 1;
    this.oscL = this.ctx.createOscillator();
    this.oscL.type = "sine";
    this.oscL.frequency.value = baseFreq;
    this.oscL.connect(gL);
    gL.connect(this.merger, 0, 0); // left channel

    const gR = this.ctx.createGain();
    gR.gain.value = 1;
    this.oscR = this.ctx.createOscillator();
    this.oscR.type = "sine";
    this.oscR.frequency.value = baseFreq + beatFreq;
    this.oscR.connect(gR);
    gR.connect(this.merger, 0, 1); // right channel

    this.oscL.start();
    this.oscR.start();

    // Gentle fade in
    this.gainNode.gain.setTargetAtTime(volume, this.ctx.currentTime, 2);
  }

  stop() {
    this.running = false;
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
    }
    setTimeout(() => {
      try { this.oscL?.stop(); } catch {}
      try { this.oscR?.stop(); } catch {}
      try { this.ctx?.close(); } catch {}
      this.oscL = null;
      this.oscR = null;
      this.ctx = null;
      this.gainNode = null;
      this.merger = null;
    }, 800);
  }
}

// ═══════════════════════════════════════════════
// PAUSE FILLER — soft meditative tones during silences
// ═══════════════════════════════════════════════

class PauseFillerEngine {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private interval: ReturnType<typeof setInterval> | null = null;
  private running = false;

  start(ctx?: AudioContext) {
    if (this.running) this.stop();
    this.ctx = ctx || new AudioContext();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0;
    this.gainNode.connect(this.ctx.destination);
    this.running = true;
    // Fade in
    this.gainNode.gain.setTargetAtTime(0.06, this.ctx.currentTime, 0.8);
    this.playChime();
    this.interval = setInterval(() => {
      if (this.running) this.playChime();
    }, 3500 + Math.random() * 2500);
  }

  private playChime() {
    if (!this.ctx || !this.gainNode || !this.running) return;
    const now = this.ctx.currentTime;
    // Pentatonic scale notes for meditative feel
    const notes = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3]; // C4 D4 E4 G4 A4 C5
    const freq = notes[Math.floor(Math.random() * notes.length)];
    
    // Main tone
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.045, now + 0.15);
    g.gain.exponentialRampToValueAtTime(0.001, now + 3);
    osc.connect(g);
    g.connect(this.gainNode);
    osc.start(now);
    osc.stop(now + 3.2);

    // Soft harmonic overtone (octave above, very quiet)
    const osc2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 2, now);
    g2.gain.setValueAtTime(0, now);
    g2.gain.linearRampToValueAtTime(0.015, now + 0.2);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    osc2.connect(g2);
    g2.connect(this.gainNode);
    osc2.start(now);
    osc2.stop(now + 2.7);

    // Fifth harmonic (very subtle)
    if (Math.random() > 0.5) {
      const osc3 = this.ctx.createOscillator();
      const g3 = this.ctx.createGain();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(freq * 1.5, now);
      g3.gain.setValueAtTime(0, now);
      g3.gain.linearRampToValueAtTime(0.01, now + 0.3);
      g3.gain.exponentialRampToValueAtTime(0.001, now + 2);
      osc3.connect(g3);
      g3.connect(this.gainNode);
      osc3.start(now + 0.1);
      osc3.stop(now + 2.2);
    }
  }

  stop() {
    this.running = false;
    if (this.interval) { clearInterval(this.interval); this.interval = null; }
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
    }
    // Don't close ctx — it may be shared with ambient engine
    setTimeout(() => {
      this.gainNode = null;
      this.ctx = null;
    }, 500);
  }
}

// ═══════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════

export function MeditationPage() {
  const t = useTheme();
  const navigate = useNavigate();
  const { addXP, darkMode } = useApp();

  const [selected, setSelected] = useState<Meditation | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepPhase, setStepPhase] = useState<"loading" | "speaking" | "pause" | "idle">("idle");
  const [ambientOn, setAmbientOn] = useState(true);
  const [completed, setCompleted] = useState(false);

  const ambientRef = useRef(new AmbientEngine());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);
  // Cache of already-fetched audio URLs per meditation step
  const audioCacheRef = useRef<Map<string, string>>(new Map());
  // Pre-fetch queue
  const prefetchingRef = useRef<Set<string>>(new Set());
  const pauseFillerRef = useRef(new PauseFillerEngine());
  const binauralRef = useRef(new BinauralEngine());

  // Start/stop pause filler chimes based on stepPhase
  useEffect(() => {
    if (stepPhase === "pause" && playing && ambientOn) {
      pauseFillerRef.current.start();
      ambientRef.current.unduck();
    } else if (stepPhase === "speaking" && playing && ambientOn) {
      pauseFillerRef.current.stop();
      ambientRef.current.duck();
    } else {
      pauseFillerRef.current.stop();
    }
  }, [stepPhase, playing, ambientOn]);

  useEffect(() => {
    return () => {
      stopAll();
      pauseFillerRef.current.stop();
      // Revoke cached blob URLs
      audioCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      audioCacheRef.current.clear();
    };
  }, []);

  const cacheKey = (medId: string, stepIdx: number) => `${medId}_${stepIdx}`;

  // Pre-fetch the next N steps' audio in background
  const prefetchAhead = useCallback((med: Meditation, fromStep: number, count = 2) => {
    for (let i = fromStep; i < Math.min(fromStep + count, med.steps.length); i++) {
      const key = cacheKey(med.id, i);
      if (audioCacheRef.current.has(key) || prefetchingRef.current.has(key)) continue;
      prefetchingRef.current.add(key);
      fetchTTSAudio(med.steps[i].text)
        .then((url) => {
          audioCacheRef.current.set(key, url);
        })
        .catch((e) => console.error(`Prefetch error step ${i}:`, e))
        .finally(() => prefetchingRef.current.delete(key));
    }
  }, []);

  const stopAll = useCallback(() => {
    cancelledRef.current = true;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    ambientRef.current.stop();
    binauralRef.current.stop();
    setPlaying(false);
    setStepPhase("idle");
  }, []);

  const playStep = useCallback(async (med: Meditation, stepIdx: number) => {
    if (cancelledRef.current) return;

    if (stepIdx >= med.steps.length) {
      setCompleted(true);
      setPlaying(false);
      setStepPhase("idle");
      ambientRef.current.stop();
      binauralRef.current.stop();
      addXP(20);
      return;
    }

    setCurrentStep(stepIdx);
    setStepPhase("loading");

    // Pre-fetch upcoming steps
    prefetchAhead(med, stepIdx + 1, 2);

    const key = cacheKey(med.id, stepIdx);
    let audioUrl = audioCacheRef.current.get(key);

    if (!audioUrl) {
      try {
        audioUrl = await fetchTTSAudio(med.steps[stepIdx].text);
        audioCacheRef.current.set(key, audioUrl);
      } catch (e) {
        console.error("TTS error, skipping step:", e);
        // On error, show text for a few seconds then move on
        setStepPhase("pause");
        pauseTimerRef.current = setTimeout(() => {
          if (!cancelledRef.current) playStep(med, stepIdx + 1);
        }, med.steps[stepIdx].pauseAfter * 1000 + 3000);
        return;
      }
    }

    if (cancelledRef.current) return;
    setStepPhase("speaking");

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      if (cancelledRef.current) return;
      setStepPhase("pause");
      pauseTimerRef.current = setTimeout(() => {
        if (!cancelledRef.current) playStep(med, stepIdx + 1);
      }, med.steps[stepIdx].pauseAfter * 1000);
    };

    audio.onerror = () => {
      if (cancelledRef.current) return;
      // Skip on playback error
      setStepPhase("pause");
      pauseTimerRef.current = setTimeout(() => {
        if (!cancelledRef.current) playStep(med, stepIdx + 1);
      }, 3000);
    };

    try {
      await audio.play();
    } catch (e) {
      console.error("Audio play error:", e);
      if (!cancelledRef.current) {
        pauseTimerRef.current = setTimeout(() => {
          if (!cancelledRef.current) playStep(med, stepIdx + 1);
        }, 3000);
      }
    }
  }, [addXP, prefetchAhead]);

  const startMeditation = useCallback((med: Meditation) => {
    cancelledRef.current = false;
    setCompleted(false);
    setCurrentStep(0);
    setPlaying(true);

    if (ambientOn) {
      ambientRef.current.start(med.ambientType, 0.12);
    }

    // Start binaural beats (theta 7Hz for deep relaxation)
    binauralRef.current.start(200, 7, 0.04);

    // Pre-fetch first 3 steps immediately
    prefetchAhead(med, 0, 3);

    playStep(med, 0);
  }, [ambientOn, playStep, prefetchAhead]);

  const pauseMeditation = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    cancelledRef.current = true;
    setPlaying(false);
    ambientRef.current.stop();
    binauralRef.current.stop();
  }, []);

  const resumeMeditation = useCallback(() => {
    if (!selected) return;
    cancelledRef.current = false;
    setPlaying(true);
    if (ambientOn) {
      ambientRef.current.start(selected.ambientType, 0.12);
    }
    binauralRef.current.start(200, 7, 0.04);
    playStep(selected, currentStep);
  }, [selected, currentStep, ambientOn, playStep]);

  const skipStep = useCallback(() => {
    if (!selected) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    const next = currentStep + 1;
    if (next >= selected.steps.length) {
      setCompleted(true);
      setPlaying(false);
      setStepPhase("idle");
      ambientRef.current.stop();
      binauralRef.current.stop();
      addXP(20);
    } else {
      playStep(selected, next);
    }
  }, [selected, currentStep, playStep, addXP]);

  const resetMeditation = useCallback(() => {
    stopAll();
    setCurrentStep(0);
    setCompleted(false);
  }, [stopAll]);

  const goBack = useCallback(() => {
    stopAll();
    if (selected) {
      setSelected(null);
      setCurrentStep(0);
      setCompleted(false);
    } else {
      navigate(-1);
    }
  }, [stopAll, selected, navigate]);

  const progress = selected ? ((currentStep + (stepPhase === "pause" ? 0.5 : 0)) / selected.steps.length) * 100 : 0;

  // ─── List view ───
  if (!selected) {
    return (
      <div className="px-5 pt-14 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.bgSecondary }}>
            <ArrowLeft className="w-4 h-4" style={{ color: t.textMuted }} />
          </button>
          <div>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: t.text }}>Медитации</h1>
            <p style={{ fontSize: "0.72rem", color: t.textMuted }}>Голосовые практики на русском языке</p>
          </div>
        </div>

        <div className="space-y-3">
          {meditations.map((med, i) => (
            <GlassPanel key={med.id} darkMode={darkMode} color={med.color} className="rounded-2xl">
            <motion.button
              className="w-full p-5 text-left relative overflow-hidden"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(med)}
            >
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10" style={{ backgroundColor: med.color }} />
              <div className="flex items-start gap-3">
                <motion.div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: med.color + "20" }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                >
                  <span style={{ fontSize: "1.4rem" }}><AppIcon icon={med.emoji} size={24} color={med.color} /></span>
                </motion.div>
                <div className="flex-1">
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: t.text, marginBottom: 2 }}>{med.title}</h3>
                  <p style={{ fontSize: "0.72rem", color: t.textMuted, lineHeight: 1.4 }}>{med.subtitle}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "0.6rem", fontWeight: 600, backgroundColor: med.color + "15", color: med.color }}>
                      ~{med.durationMin} мин
                    </span>
                    <span style={{ fontSize: "0.6rem", color: t.textFaint }}>
                      {med.steps.length} шагов
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
            </GlassPanel>
          ))}
        </div>

        <GlassPanel darkMode={darkMode} color="#9B8EC4" className="rounded-xl mt-6">
          <div className="p-3.5">
          <p style={{ fontSize: "0.7rem", color: t.textMuted, lineHeight: 1.6 }}>
            🎙 Медитации озвучиваются голосом AI (OpenAI). Для лучшего опыта используйте наушники. Фоновые звуки природы создают атмосферу для расслабления.
          </p>
          </div>
        </GlassPanel>
      </div>
    );
  }

  // ─── Player view ───
  return (
    <div className="min-h-full flex flex-col" style={{ background: `linear-gradient(180deg, ${selected.color}12, ${selected.colorEnd}08, ${t.bg})` }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <button onClick={goBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.bgSecondary }}>
          <ArrowLeft className="w-4 h-4" style={{ color: t.textMuted }} />
        </button>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: t.textMuted }}>
          {currentStep + 1} / {selected.steps.length}
        </span>
        <button
          onClick={() => {
            setAmbientOn(!ambientOn);
            if (playing) {
              if (ambientOn) ambientRef.current.stop();
              else ambientRef.current.start(selected.ambientType, 0.12);
            }
          }}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: t.bgSecondary }}
        >
          {ambientOn ? <Volume2 className="w-4 h-4" style={{ color: t.textMuted }} /> : <VolumeX className="w-4 h-4" style={{ color: t.textFaint }} />}
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-5 mb-6">
        <div className="w-full rounded-full h-1.5" style={{ backgroundColor: t.border }}>
          <motion.div
            className="h-1.5 rounded-full"
            style={{ background: `linear-gradient(90deg, ${selected.color}, ${selected.colorEnd})` }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Central visualization */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Breathing circle */}
        <motion.div
          className="relative mb-8"
          animate={playing ? {
            scale: stepPhase === "speaking" ? [1, 1.08, 1] : [1, 1.15, 1],
          } : {}}
          transition={{
            duration: stepPhase === "speaking" ? 3 : 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div
            className="w-36 h-36 rounded-full flex items-center justify-center relative"
            style={{
              background: `radial-gradient(circle, ${selected.color}30, ${selected.color}10)`,
              boxShadow: playing ? `0 0 60px ${selected.color}20` : "none",
            }}
          >
            <motion.div
              className="absolute inset-4 rounded-full"
              style={{ background: `radial-gradient(circle, ${selected.color}25, transparent)` }}
              animate={playing ? { opacity: [0.3, 0.7, 0.3] } : { opacity: 0.3 }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            {stepPhase === "loading" ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} style={{ position: "relative", zIndex: 1 }}>
                <Loader2 className="w-8 h-8" style={{ color: selected.color }} />
              </motion.div>
            ) : (
              <span style={{ fontSize: "2.5rem", position: "relative", zIndex: 1 }}><AppIcon icon={selected.emoji} size={40} color={selected.color} /></span>
            )}
          </div>

          {playing && [0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{ backgroundColor: selected.color, opacity: 0.4, top: "50%", left: "50%" }}
              animate={{
                x: [0, Math.cos(i * 2.09) * 80, 0],
                y: [0, Math.sin(i * 2.09) * 80, 0],
              }}
              transition={{ duration: 6, repeat: Infinity, delay: i * 2, ease: "easeInOut" }}
            />
          ))}
        </motion.div>

        {/* Title */}
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: t.text, textAlign: "center", marginBottom: 6 }}>
          {selected.title}
        </h2>

        {/* Current step text */}
        <AnimatePresence mode="wait">
          {!completed && (
            <motion.p
              key={currentStep}
              className="text-center max-w-xs"
              style={{ fontSize: "0.82rem", color: t.textSecondary, lineHeight: 1.7 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              {selected.steps[currentStep]?.text}
            </motion.p>
          )}
          {completed && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.span
                style={{ fontSize: "2rem", display: "block", marginBottom: 8 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5 }}
              >
                ✨
              </motion.span>
              <p style={{ fontSize: "0.9rem", fontWeight: 600, color: t.text, marginBottom: 4 }}>Медитация завершена</p>
              <p style={{ fontSize: "0.75rem", color: t.textMuted }}>Вы позаботились о себе. +20 XP</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase indicator */}
        {playing && !completed && (
          <motion.div
            className="mt-4 px-3 py-1 rounded-full"
            style={{ backgroundColor: selected.color + "12" }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span style={{ fontSize: "0.6rem", fontWeight: 600, color: selected.color }}>
              {stepPhase === "loading" ? "Подготовка голоса..." : stepPhase === "speaking" ? "Слушайте..." : "Пауза — дышите..."}
            </span>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="px-5 pb-8 pt-4">
        {!completed ? (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={resetMeditation}
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ backgroundColor: t.bgSecondary }}
            >
              <RotateCcw className="w-4.5 h-4.5" style={{ color: t.textMuted }} />
            </button>

            <motion.button
              onClick={() => {
                if (!playing) {
                  if (currentStep === 0 && stepPhase === "idle") startMeditation(selected);
                  else resumeMeditation();
                } else {
                  pauseMeditation();
                }
              }}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${selected.color}, ${selected.colorEnd})` }}
              whileTap={{ scale: 0.92 }}
            >
              {playing ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-0.5" />}
            </motion.button>

            <button
              onClick={skipStep}
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ backgroundColor: t.bgSecondary }}
              disabled={!playing}
            >
              <SkipForward className="w-4.5 h-4.5" style={{ color: playing ? t.textMuted : t.textFaint }} />
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={resetMeditation}
              className="flex-1 py-3.5 rounded-xl border"
              style={{ fontSize: "0.82rem", fontWeight: 600, color: t.textSecondary, borderColor: t.border }}
            >
              Повторить
            </button>
            <button
              onClick={() => { stopAll(); setSelected(null); setCompleted(false); setCurrentStep(0); }}
              className="flex-1 py-3.5 rounded-xl text-white"
              style={{ fontSize: "0.82rem", fontWeight: 600, background: `linear-gradient(135deg, ${selected.color}, ${selected.colorEnd})` }}
            >
              Готово
            </button>
          </div>
        )}
      </div>
    </div>
  );
}