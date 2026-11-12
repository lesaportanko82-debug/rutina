import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { useTheme } from "../theme";
import { useApp } from "../app-context";
import { ArrowLeft, Play, Pause, Timer, Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router";
import { GlassPanel } from "../ambient-elements";
import { AppIcon } from "../app-icon";

interface SoundDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  desc: string;
}

const sounds: SoundDef[] = [
  { id: "rain", name: "Дождь", icon: "🌧️", color: "#7EA8BE", desc: "Мягкий дождь за окном" },
  { id: "forest", name: "Лес", icon: "🌲", color: "#8DB596", desc: "Птицы и шелест листьев" },
  { id: "ocean", name: "Океан", icon: "🌊", color: "#7BAFB0", desc: "Волны на берегу" },
  { id: "fire", name: "Камин", icon: "🔥", color: "#C4876C", desc: "Потрескивание огня" },
  { id: "white", name: "Белый шум", icon: "☁️", color: "#A3ADB8", desc: "Ровный фоновый шум" },
  { id: "night", name: "Ночь", icon: "🌙", color: "#9B8EC4", desc: "Сверчки и тишина" },
];

const timerOptions = [
  { min: 0, label: "Без таймера" },
  { min: 5, label: "5 мин" },
  { min: 15, label: "15 мин" },
  { min: 30, label: "30 мин" },
  { min: 60, label: "1 час" },
];

// ═══ WEB AUDIO API SOUND GENERATORS ═══
class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private nodes: AudioNode[] = [];
  private sources: AudioBufferSourceNode[] = [];
  private running = false;
  private animFrame: number | null = null;

  start(soundId: string, volume: number) {
    this.stop();
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = volume;
    this.masterGain.connect(this.ctx.destination);
    this.running = true;

    switch (soundId) {
      case "rain": this.createRain(); break;
      case "forest": this.createForest(); break;
      case "ocean": this.createOcean(); break;
      case "fire": this.createFire(); break;
      case "white": this.createWhiteNoise(); break;
      case "night": this.createNight(); break;
    }
  }

  setVolume(v: number) {
    if (this.masterGain) this.masterGain.gain.value = v;
  }

  stop() {
    this.running = false;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.sources.forEach((s) => { try { s.stop(); } catch {} });
    this.sources = [];
    this.nodes = [];
    if (this.ctx) { try { this.ctx.close(); } catch {} }
    this.ctx = null;
    this.masterGain = null;
  }

  private createNoiseBuffer(seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(2, ctx.sampleRate * seconds, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return buf;
  }

  private createFilteredNoise(freq: number, q: number, gain: number, type: BiquadFilterType = "bandpass") {
    const ctx = this.ctx!;
    const buf = this.createNoiseBuffer(4);
    const source = ctx.createBufferSource();
    source.buffer = buf;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const gn = ctx.createGain();
    gn.gain.value = gain;
    source.connect(filter);
    filter.connect(gn);
    gn.connect(this.masterGain!);
    source.start();
    this.sources.push(source);
    this.nodes.push(filter, gn);
  }

  private createRain() {
    // Multi-layer rain: broadband with gentle filtering
    this.createFilteredNoise(800, 0.3, 0.12, "lowpass");
    this.createFilteredNoise(3500, 0.8, 0.06, "bandpass");
    this.createFilteredNoise(8000, 0.5, 0.03, "highpass");
    // Gentle thunder rumble (very low frequency hum)
    const ctx = this.ctx!;
    const rumble = ctx.createOscillator();
    const rumbleGn = ctx.createGain();
    rumble.type = "sine";
    rumble.frequency.value = 45;
    rumbleGn.gain.value = 0.015;
    rumble.connect(rumbleGn);
    rumbleGn.connect(this.masterGain!);
    rumble.start();
    this.sources.push(rumble as any);
    this.nodes.push(rumbleGn);
    this.scheduleDrips();
  }

  private scheduleDrips() {
    if (!this.running || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    // Varied drop sounds — more natural with pitch variety
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const gn = ctx.createGain();
      const t = now + Math.random() * 3;
      const baseFreq = 600 + Math.random() * 800;
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.3, t + 0.12);
      osc.type = "sine";
      gn.gain.setValueAtTime(0.008 + Math.random() * 0.012, t);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      osc.connect(gn);
      gn.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.18);
    }
    setTimeout(() => this.scheduleDrips(), 1500 + Math.random() * 2000);
  }

  private createForest() {
    // Layered wind at different frequencies
    this.createFilteredNoise(200, 0.4, 0.05, "lowpass");
    this.createFilteredNoise(800, 0.6, 0.03, "bandpass");
    // Rustling leaves — higher frequency noise
    this.createFilteredNoise(3000, 1.2, 0.025, "bandpass");
    // Gentle stream in background
    this.createFilteredNoise(1200, 0.8, 0.02, "bandpass");
    // Bird chirps — more varied and melodic
    this.scheduleBirds();
    // Occasional distant bird call
    this.scheduleDistantBirds();
  }

  private scheduleBirds() {
    if (!this.running || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    // Multi-note bird song
    const baseFreq = 1600 + Math.random() * 1400;
    const notes = 2 + Math.floor(Math.random() * 4);
    for (let n = 0; n < notes; n++) {
      const osc = ctx.createOscillator();
      const gn = ctx.createGain();
      const t = now + n * (0.08 + Math.random() * 0.06);
      const noteFreq = baseFreq * (0.8 + Math.random() * 0.4);
      osc.frequency.setValueAtTime(noteFreq, t);
      osc.frequency.linearRampToValueAtTime(noteFreq * (1 + Math.random() * 0.3), t + 0.06);
      osc.frequency.linearRampToValueAtTime(noteFreq * (0.85 + Math.random() * 0.3), t + 0.12);
      osc.type = "sine";
      gn.gain.setValueAtTime(0, t);
      gn.gain.linearRampToValueAtTime(0.012 + Math.random() * 0.008, t + 0.03);
      gn.gain.linearRampToValueAtTime(0, t + 0.15);
      osc.connect(gn);
      gn.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.18);
    }
    setTimeout(() => this.scheduleBirds(), 4000 + Math.random() * 6000);
  }

  private scheduleDistantBirds() {
    if (!this.running || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gn = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2000;
    const freq = 1200 + Math.random() * 800;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.linearRampToValueAtTime(freq * 1.3, now + 0.3);
    osc.frequency.linearRampToValueAtTime(freq * 0.7, now + 0.6);
    osc.type = "sine";
    gn.gain.setValueAtTime(0, now);
    gn.gain.linearRampToValueAtTime(0.006, now + 0.1);
    gn.gain.linearRampToValueAtTime(0, now + 0.7);
    osc.connect(filter);
    filter.connect(gn);
    gn.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.8);
    setTimeout(() => this.scheduleDistantBirds(), 8000 + Math.random() * 12000);
  }

  private createOcean() {
    const ctx = this.ctx!;
    // Deep ocean base
    const buf = this.createNoiseBuffer(10);
    const source = ctx.createBufferSource();
    source.buffer = buf;
    source.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 400;
    lp.Q.value = 0.3;
    const gn = ctx.createGain();
    gn.gain.value = 0.1;
    // Slow LFO for wave breathing
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.07; // very slow wave
    lfoGain.gain.value = 250;
    lfo.connect(lfoGain);
    lfoGain.connect(lp.frequency);
    lfo.start();
    source.connect(lp);
    lp.connect(gn);
    gn.connect(this.masterGain!);
    source.start();
    this.sources.push(source);
    this.nodes.push(lp, gn);
    // Second wave layer — slightly offset phase
    const buf2 = this.createNoiseBuffer(12);
    const src2 = ctx.createBufferSource();
    src2.buffer = buf2;
    src2.loop = true;
    const lp2 = ctx.createBiquadFilter();
    lp2.type = "lowpass";
    lp2.frequency.value = 600;
    lp2.Q.value = 0.2;
    const gn2 = ctx.createGain();
    gn2.gain.value = 0.06;
    const lfo2 = ctx.createOscillator();
    const lfoG2 = ctx.createGain();
    lfo2.frequency.value = 0.12;
    lfoG2.gain.value = 350;
    lfo2.connect(lfoG2);
    lfoG2.connect(lp2.frequency);
    lfo2.start();
    src2.connect(lp2);
    lp2.connect(gn2);
    gn2.connect(this.masterGain!);
    src2.start();
    this.sources.push(src2);
    this.nodes.push(lp2, gn2);
    // Foam hiss
    this.createFilteredNoise(4000, 0.3, 0.02, "highpass");
  }

  private createFire() {
    // Warm crackle layers
    this.createFilteredNoise(800, 1.5, 0.06, "bandpass");
    this.createFilteredNoise(200, 0.3, 0.07, "lowpass");
    // Warm low hum (embers)
    const ctx = this.ctx!;
    const hum = ctx.createOscillator();
    const humGn = ctx.createGain();
    hum.type = "sine";
    hum.frequency.value = 60;
    humGn.gain.value = 0.012;
    hum.connect(humGn);
    humGn.connect(this.masterGain!);
    hum.start();
    this.sources.push(hum as any);
    this.nodes.push(humGn);
    this.schedulePops();
  }

  private schedulePops() {
    if (!this.running || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    // Natural crackle — multiple micro-bursts
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const t = now + Math.random() * 0.3;
      const osc = ctx.createOscillator();
      const gn = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 200 + Math.random() * 400;
      filter.Q.value = 2;
      osc.frequency.value = 80 + Math.random() * 150;
      osc.type = "sawtooth";
      gn.gain.setValueAtTime(0.02 + Math.random() * 0.015, t);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.04 + Math.random() * 0.03);
      osc.connect(filter);
      filter.connect(gn);
      gn.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.08);
    }
    setTimeout(() => this.schedulePops(), 300 + Math.random() * 1500);
  }

  private createWhiteNoise() {
    // Pink noise approximation (more natural than white)
    this.createFilteredNoise(200, 0.2, 0.08, "lowpass");
    this.createFilteredNoise(800, 0.3, 0.06, "bandpass");
    this.createFilteredNoise(3000, 0.2, 0.03, "bandpass");
    // Gentle binaural beat for meditation (10 Hz alpha)
    const ctx = this.ctx!;
    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();
    const gnL = ctx.createGain();
    const gnR = ctx.createGain();
    const merger = ctx.createChannelMerger(2);
    oscL.frequency.value = 200;
    oscR.frequency.value = 210; // 10 Hz difference = alpha
    oscL.type = "sine";
    oscR.type = "sine";
    gnL.gain.value = 0.015;
    gnR.gain.value = 0.015;
    oscL.connect(gnL);
    oscR.connect(gnR);
    gnL.connect(merger, 0, 0);
    gnR.connect(merger, 0, 1);
    merger.connect(this.masterGain!);
    oscL.start();
    oscR.start();
    this.sources.push(oscL as any, oscR as any);
    this.nodes.push(gnL, gnR, merger);
  }

  private createNight() {
    // Deep, quiet background
    this.createFilteredNoise(150, 0.4, 0.025, "lowpass");
    // Gentle wind
    this.createFilteredNoise(500, 0.6, 0.015, "bandpass");
    // Cricket sounds — more rhythmic and varied
    this.scheduleCrickets();
    // Occasional owl
    this.scheduleOwl();
  }

  private scheduleCrickets() {
    if (!this.running || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    // Two cricket types with different frequencies
    const freq = 3800 + Math.random() * 1200;
    const pulses = 4 + Math.floor(Math.random() * 6);
    for (let i = 0; i < pulses; i++) {
      const osc = ctx.createOscillator();
      const gn = ctx.createGain();
      const t = now + i * (0.06 + Math.random() * 0.03);
      osc.frequency.value = freq + Math.random() * 100;
      osc.type = "sine";
      gn.gain.setValueAtTime(0, t);
      gn.gain.linearRampToValueAtTime(0.01 + Math.random() * 0.005, t + 0.015);
      gn.gain.linearRampToValueAtTime(0, t + 0.04);
      osc.connect(gn);
      gn.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.05);
    }
    // Second cricket (different rhythm)
    if (Math.random() > 0.5) {
      const freq2 = 4500 + Math.random() * 800;
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gn = ctx.createGain();
        const t = now + 0.5 + i * 0.1;
        osc.frequency.value = freq2;
        osc.type = "sine";
        gn.gain.setValueAtTime(0, t);
        gn.gain.linearRampToValueAtTime(0.007, t + 0.01);
        gn.gain.linearRampToValueAtTime(0, t + 0.035);
        osc.connect(gn);
        gn.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.04);
      }
    }
    setTimeout(() => this.scheduleCrickets(), 1200 + Math.random() * 2500);
  }

  private scheduleOwl() {
    if (!this.running || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    // "Hoo-hoo" pattern
    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      const gn = ctx.createGain();
      const t = now + i * 0.4;
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.linearRampToValueAtTime(380, t + 0.25);
      osc.type = "sine";
      gn.gain.setValueAtTime(0, t);
      gn.gain.linearRampToValueAtTime(0.008, t + 0.05);
      gn.gain.linearRampToValueAtTime(0.006, t + 0.15);
      gn.gain.linearRampToValueAtTime(0, t + 0.3);
      osc.connect(gn);
      gn.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.35);
    }
    setTimeout(() => this.scheduleOwl(), 15000 + Math.random() * 20000);
  }
}

export function SoundscapesPage() {
  const t = useTheme();
  const { darkMode } = useApp();
  const navigate = useNavigate();
  const engineRef = useRef<SoundEngine | null>(null);
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [timerMin, setTimerMin] = useState(0);
  const [timerLeft, setTimerLeft] = useState(0); // seconds
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSound = useCallback((id: string) => {
    if (!engineRef.current) engineRef.current = new SoundEngine();
    engineRef.current.start(id, volume);
    setActiveSound(id);
    // Track play count for achievement
    const count = parseInt(localStorage.getItem("routine_soundscape_count") || "0");
    localStorage.setItem("routine_soundscape_count", String(count + 1));
    if (timerMin > 0) {
      setTimerLeft(timerMin * 60);
    }
  }, [volume, timerMin]);

  const stopSound = useCallback(() => {
    engineRef.current?.stop();
    setActiveSound(null);
    setTimerLeft(0);
  }, []);

  const toggleSound = useCallback((id: string) => {
    if (activeSound === id) {
      stopSound();
    } else {
      startSound(id);
    }
  }, [activeSound, startSound, stopSound]);

  // Volume change
  useEffect(() => {
    engineRef.current?.setVolume(volume);
  }, [volume]);

  // Timer countdown
  useEffect(() => {
    if (timerLeft <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimerLeft((prev) => {
        if (prev <= 1) {
          stopSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerLeft > 0]);

  // Cleanup
  useEffect(() => () => { engineRef.current?.stop(); }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const activeDef = sounds.find((s) => s.id === activeSound);

  return (
    <div className="px-5 pt-14 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl" style={{ backgroundColor: t.bgSecondary }}>
          <ArrowLeft className="w-5 h-5" style={{ color: t.text }} />
        </button>
        <div className="flex-1">
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: t.text }}>Звуки природы</h1>
          <p style={{ fontSize: "0.7rem", color: t.textMuted }}>Фоновые звуки для расслабления и фокуса</p>
        </div>
      </div>

      {/* Now playing */}
      {activeDef && (
        <GlassPanel darkMode={darkMode} color={activeDef.color} className="rounded-2xl p-5 mb-5 text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <motion.span style={{ fontSize: "2.5rem", display: "block" }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}>
            <AppIcon icon={activeDef.icon} size={36} color={activeDef.color} />
          </motion.span>
          <p style={{ fontSize: "0.95rem", fontWeight: 700, color: t.text, marginTop: 8 }}>
            {activeDef.name}
          </p>
          <p style={{ fontSize: "0.72rem", color: t.textMuted }}>{activeDef.desc}</p>
          {timerLeft > 0 && (
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: activeDef.color, marginTop: 8 }}>
              Осталось {formatTime(timerLeft)}
            </p>
          )}

          {/* Animated wave bars */}
          <div className="flex items-end justify-center gap-1 mt-4" style={{ height: 24 }}>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full"
                style={{ backgroundColor: activeDef.color + "60" }}
                animate={{ height: [4 + Math.random() * 6, 12 + Math.random() * 12, 4 + Math.random() * 6] }}
                transition={{ repeat: Infinity, duration: 0.8 + i * 0.15, ease: "easeInOut" }}
              />
            ))}
          </div>
          </motion.div>
        </GlassPanel>
      )}

      {/* Sounds grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {sounds.map((sound, i) => {
          const isActive = activeSound === sound.id;
          return (
            <GlassPanel
              key={sound.id}
              darkMode={darkMode}
              color={isActive ? sound.color : undefined}
              className="rounded-2xl"
            >
              <motion.button
                className="w-full p-4 text-left relative overflow-hidden"
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleSound(sound.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <AppIcon icon={sound.icon} size={24} color={isActive ? sound.color : t.textMuted} />
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: isActive ? sound.color + "20" : t.bgSecondary }}>
                    {isActive
                      ? <Pause className="w-3.5 h-3.5" style={{ color: sound.color }} />
                      : <Play className="w-3.5 h-3.5" style={{ color: t.textFaint }} />
                    }
                  </div>
                </div>
                <p style={{ fontSize: "0.85rem", fontWeight: 600, color: isActive ? sound.color : t.text }}>
                  {sound.name}
                </p>
                <p style={{ fontSize: "0.65rem", color: t.textFaint }}>{sound.desc}</p>
              </motion.button>
            </GlassPanel>
          );
        })}
      </div>

      {/* Controls */}
      <GlassPanel darkMode={darkMode} color={t.sage} className="rounded-2xl p-4 space-y-4">
        {/* Volume */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {volume === 0
                ? <VolumeX className="w-4 h-4" style={{ color: t.textFaint }} />
                : <Volume2 className="w-4 h-4" style={{ color: t.text }} />
              }
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: t.text }}>Громкость</span>
            </div>
            <span style={{ fontSize: "0.68rem", color: t.textFaint }}>
              {Math.round(volume * 100)}%
            </span>
          </div>
          <input type="range" min={0} max={1} step={0.05} value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full" style={{ accentColor: "#8DB596" }} />
        </div>

        {/* Sleep timer */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Timer className="w-4 h-4" style={{ color: t.text }} />
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: t.text }}>Таймер отключения</span>
          </div>
          <div className="flex gap-2">
            {timerOptions.map((opt) => (
              <button key={opt.min} className="flex-1 rounded-lg py-2 text-center"
                style={{
                  backgroundColor: timerMin === opt.min ? t.sage + "20" : t.bgSecondary,
                  border: `1px solid ${timerMin === opt.min ? t.sage + "40" : t.border}`,
                  fontSize: "0.68rem",
                  fontWeight: timerMin === opt.min ? 600 : 400,
                  color: timerMin === opt.min ? t.sage : t.textMuted,
                }}
                onClick={() => setTimerMin(opt.min)}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </GlassPanel>

      {/* Tip */}
      <motion.p className="mt-4 text-center" style={{ fontSize: "0.68rem", color: t.textFaint, fontStyle: "italic" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        Звуки работают параллельно с Помидоро-таймером
      </motion.p>
    </div>
  );
}