import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "./theme";
import { Droplets, Heart, Pencil, X, Sparkles } from "lucide-react";
import type { PlantState } from "./use-app-store";

// ═══ CONSTANTS ═══

// 10 growth stages — full bloom at ~1000 pts (~30 days moderate use, 35pts/day cap)
const stages = [
  { name: "Семечко", min: 0, maxH: 0 },
  { name: "Росток", min: 30, maxH: 18 },
  { name: "Побег", min: 80, maxH: 30 },
  { name: "Молодой цветок", min: 150, maxH: 45 },
  { name: "Растение", min: 250, maxH: 58 },
  { name: "Кустик", min: 380, maxH: 68 },
  { name: "Деревце", min: 520, maxH: 78 },
  { name: "Дерево", min: 680, maxH: 86 },
  { name: "Цветущее дерево", min: 850, maxH: 92 },
  { name: "Волшебный сад", min: 1000, maxH: 100 },
];

function getStageIndex(pts: number) {
  let idx = 0;
  for (let i = stages.length - 1; i >= 0; i--) {
    if (pts >= stages[i].min) { idx = i; break; }
  }
  return idx;
}

type HealthState = "thriving" | "healthy" | "thirsty" | "wilting" | "dying";

function getHealthState(health: number): HealthState {
  if (health >= 80) return "thriving";
  if (health >= 60) return "healthy";
  if (health >= 40) return "thirsty";
  if (health >= 20) return "wilting";
  return "dying";
}

const healthColors: Record<HealthState, { stem: string; leaf: string; flower: string; bg: string }> = {
  thriving: { stem: "#6B9F5E", leaf: "#8DB596", flower: "#B88FA7", bg: "#8DB59612" },
  healthy: { stem: "#7B9F72", leaf: "#8DB596", flower: "#B88FA7", bg: "#8DB59610" },
  thirsty: { stem: "#A89B6B", leaf: "#B5A875", flower: "#C4A86C", bg: "#C4A86C10" },
  wilting: { stem: "#9B8B7A", leaf: "#A8997A", flower: "#B5A08A", bg: "#A8997A10" },
  dying: { stem: "#7A6B5E", leaf: "#887A6B", flower: "#8A7B6E", bg: "#7A6B5E10" },
};

const statusMessages: Record<HealthState, string[]> = {
  thriving: ["Сияет от счастья!", "Чувствует вашу заботу", "Полон жизни и энергии"],
  healthy: ["Чувствует себя хорошо", "Растёт с удовольствием", "Рад вас видеть"],
  thirsty: ["Хочет пить...", "Немного грустит", "Нуждается во внимании"],
  wilting: ["Увядает без заботы...", "Скучает по вам", "Просит о помощи..."],
  dying: ["Еле держится...", "Не оставляйте меня...", "Нуждается в срочном уходе"],
};

// ═══ WEB AUDIO API SOUNDS ═══

const audioCtxRef = { current: null as AudioContext | null };

function getAudioCtx(): AudioContext {
  if (!audioCtxRef.current) {
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtxRef.current;
}

function playWaterSound() {
  try {
    const ctx = getAudioCtx();
    // Bubbling water sound
    for (let i = 0; i < 5; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(400 + Math.random() * 300, ctx.currentTime + i * 0.12);
      osc.frequency.exponentialRampToValueAtTime(200 + Math.random() * 100, ctx.currentTime + i * 0.12 + 0.15);
      osc.type = "sine";
      gain.gain.setValueAtTime(0.06, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.2);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.25);
    }
  } catch {}
}

function playTouchSound() {
  try {
    const ctx = getAudioCtx();
    // Soft leaf rustle
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3)) * 0.03;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 3000;
    filter.Q.value = 0.5;
    source.connect(filter);
    filter.connect(ctx.destination);
    source.start();
  } catch {}
}

function playGrowthChime() {
  try {
    const ctx = getAudioCtx();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "triangle";
      gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.5);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.6);
    });
  } catch {}
}

function playHeartSound() {
  try {
    const ctx = getAudioCtx();
    [392, 440].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.05, ctx.currentTime + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.35);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.4);
    });
  } catch {}
}

// ═══ PARTICLES ═══

interface Particle {
  id: number;
  x: number;
  y: number;
  type: "drop" | "sparkle" | "heart" | "leaf";
}

// ═══ COMPONENT ═══

interface CompanionPlantProps {
  plantState: PlantState;
  onWater: () => void;
  onInteract: () => void;
  onRename: (name: string) => void;
}

export function CompanionPlant({ plantState, onWater, onInteract, onRename }: CompanionPlantProps) {
  const th = useTheme();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(plantState.name);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [plantWiggle, setPlantWiggle] = useState(0);
  const pidRef = useRef(0);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout>>();

  const stageIdx = useMemo(() => getStageIndex(plantState.growthPoints), [plantState.growthPoints]);
  const stage = stages[stageIdx];
  const nextStage = stageIdx < stages.length - 1 ? stages[stageIdx + 1] : null;
  const healthState = useMemo(() => getHealthState(plantState.health), [plantState.health]);
  const colors = healthColors[healthState];

  const progressToNext = useMemo(() => {
    if (!nextStage) return 1;
    const range = nextStage.min - stage.min;
    return Math.min((plantState.growthPoints - stage.min) / range, 1);
  }, [plantState.growthPoints, stage, nextStage]);

  const statusMsg = useMemo(() => {
    const msgs = statusMessages[healthState];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }, [healthState]);

  const daysAlive = useMemo(() => {
    const created = new Date(plantState.createdAt + "T12:00:00");
    const now = new Date();
    return Math.max(1, Math.round((now.getTime() - created.getTime()) / 86400000));
  }, [plantState.createdAt]);

  // Spawn particles
  const spawnParticles = useCallback((type: Particle["type"], count: number) => {
    const newP: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newP.push({
        id: ++pidRef.current,
        x: 40 + Math.random() * 120,
        y: type === "drop" ? 10 + Math.random() * 30 : 20 + Math.random() * 60,
        type,
      });
    }
    setParticles((p) => [...p, ...newP]);
    setTimeout(() => {
      setParticles((p) => p.filter((pp) => !newP.some((np) => np.id === pp.id)));
    }, 1500);
  }, []);

  // Flash tooltip
  const flash = useCallback((msg: string) => {
    setShowTooltip(msg);
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    tooltipTimer.current = setTimeout(() => setShowTooltip(null), 2500);
  }, []);

  const handleWater = useCallback(() => {
    if (plantState.waterLevel >= 100) {
      flash("Достаточно воды на сегодня!");
      return;
    }
    onWater();
    playWaterSound();
    spawnParticles("drop", 8);
    flash("Полили! 💧 +30 воды");
  }, [onWater, spawnParticles, flash, plantState.waterLevel]);

  const handleTouch = useCallback(() => {
    onInteract();
    playTouchSound();
    setPlantWiggle((w) => w + 1);
    spawnParticles("sparkle", 4);
    const msgs = ["Щекотно!", "Приятно! 🌿", "Люблю объятия!", "Это здорово!"];
    flash(msgs[Math.floor(Math.random() * msgs.length)]);
  }, [onInteract, spawnParticles, flash]);

  const handleLove = useCallback(() => {
    onInteract();
    playHeartSound();
    spawnParticles("heart", 6);
    flash("Чувствует вашу любовь! ❤️");
  }, [onInteract, spawnParticles, flash]);

  const handleRename = useCallback(() => {
    if (nameInput.trim()) {
      onRename(nameInput.trim());
      setIsEditing(false);
      flash(`Теперь меня зовут ${nameInput.trim()}!`);
    }
  }, [nameInput, onRename, flash]);

  // Ambient particles for thriving plant
  useEffect(() => {
    if (healthState !== "thriving" || stageIdx < 3) return;
    const interval = setInterval(() => {
      spawnParticles("sparkle", 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [healthState, stageIdx, spawnParticles]);

  // ═══ SVG PLANT RENDERING ═══
  const stemHeight = useMemo(() => {
    if (stageIdx === 0) return 0;
    return 10 + stageIdx * 9; // 19 to 91
  }, [stageIdx]);

  const leafCount = Math.min(stageIdx, 6);
  const hasFlowers = stageIdx >= 3;
  const hasCrown = stageIdx >= 5;
  const hasFruit = stageIdx >= 8;
  const isMaxed = stageIdx >= 9;

  // Drooping factor for wilting
  const droop = healthState === "dying" ? 15 : healthState === "wilting" ? 8 : healthState === "thirsty" ? 3 : 0;

  return (
    <motion.div
      className="rounded-2xl border overflow-hidden"
      style={{ backgroundColor: th.card, borderColor: th.border }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  className="rounded-lg px-2 py-0.5 text-sm font-semibold outline-none"
                  style={{ backgroundColor: th.bgSecondary, color: th.text, width: 120, border: `1px solid ${th.border}` }}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                  autoFocus
                  maxLength={20}
                />
                <motion.button whileTap={{ scale: 0.9 }} onClick={handleRename}
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: th.sage + "20" }}>
                  <span style={{ fontSize: "0.7rem" }}>✓</span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsEditing(false)}
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: th.border + "40" }}>
                  <X className="w-3 h-3" style={{ color: th.textFaint }} />
                </motion.button>
              </div>
            ) : (
              <>
                <motion.button
                  onClick={() => { setNameInput(plantState.name); setIsEditing(true); }}
                  className="flex items-center gap-1.5"
                  whileTap={{ scale: 0.95 }}
                >
                  <span style={{ fontSize: "0.9rem", fontWeight: 600, color: th.text }}>{plantState.name}</span>
                  <Pencil className="w-3 h-3" style={{ color: th.textFaint }} />
                </motion.button>
              </>
            )}
          </div>
          <span className="px-2 py-0.5 rounded-full" style={{
            fontSize: "0.62rem", fontWeight: 600,
            backgroundColor: colors.bg,
            color: colors.stem,
          }}>
            {stage.name}
          </span>
        </div>

        {/* Status message */}
        <AnimatePresence mode="wait">
          <motion.p
            key={statusMsg}
            style={{ fontSize: "0.72rem", color: th.textMuted, fontStyle: "italic" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {statusMsg} · День {daysAlive}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* ═══ PLANT SCENE ═══ */}
      <div
        className="relative flex items-end justify-center cursor-pointer select-none"
        style={{ height: 180, overflow: "hidden" }}
        onClick={handleTouch}
      >
        {/* Background gradient */}
        <div className="absolute inset-0" style={{
          background: healthState === "thriving"
            ? "linear-gradient(180deg, #E8F5E910, #C8E6C920)"
            : healthState === "dying"
              ? "linear-gradient(180deg, #D7CCC810, #BCAAA410)"
              : "transparent",
        }} />

        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 rounded-t-[50%]"
          style={{
            height: 35,
            background: healthState === "dying"
              ? "linear-gradient(180deg, #8D7B6A20, #7A6B5E30)"
              : "linear-gradient(180deg, #8DB59615, #6B9F5E20)",
          }}
        />

        {/* Floating tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-full shadow-lg"
              style={{ backgroundColor: th.card, border: `1px solid ${th.border}`, fontSize: "0.72rem", fontWeight: 500, color: th.text, whiteSpace: "nowrap" }}
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.8 }}
            >
              {showTooltip}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Particles */}
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute z-20 pointer-events-none"
              style={{ left: p.x, top: p.y }}
              initial={{ opacity: 1, scale: 0.5 }}
              animate={{
                opacity: 0,
                y: p.type === "drop" ? 80 : p.type === "heart" ? -40 : [-10, -20],
                x: p.type === "sparkle" ? [0, (Math.random() - 0.5) * 30] : 0,
                scale: p.type === "heart" ? [0.5, 1.2, 0] : [0.5, 1, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
            >
              {p.type === "drop" && <span style={{ fontSize: "0.9rem" }}>💧</span>}
              {p.type === "sparkle" && <span style={{ fontSize: "0.7rem" }}>✨</span>}
              {p.type === "heart" && <span style={{ fontSize: "0.8rem" }}>❤️</span>}
              {p.type === "leaf" && <span style={{ fontSize: "0.7rem" }}>🍃</span>}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ═══ SVG PLANT ═══ */}
        <motion.svg
          viewBox="0 0 200 150"
          width="200"
          height="150"
          className="relative z-10 mb-0"
          key={plantWiggle}
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, -2, 2, -1, 0] }}
          transition={{ duration: 0.5 }}
        >
          {/* ── SEED ── */}
          {stageIdx === 0 && (
            <motion.g>
              <motion.ellipse
                cx="100" cy="135" rx="10" ry="7"
                fill="#A3907A"
                animate={{ y: [0, -2, 0], scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
              />
              <motion.ellipse
                cx="100" cy="133" rx="6" ry="4"
                fill="#8D7F6B"
                opacity={0.5}
                animate={{ y: [0, -2, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
              />
              {/* Tiny crack for imminent sprout */}
              {plantState.growthPoints > 15 && (
                <motion.line
                  x1="100" y1="130" x2="100" y2="126"
                  stroke="#7B9F72" strokeWidth={1.5}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2 }}
                />
              )}
            </motion.g>
          )}

          {/* ── STEM ── */}
          {stageIdx >= 1 && (
            <motion.path
              d={`M100,145 Q${100 + droop * 0.3},${145 - stemHeight / 2} ${100 + droop * 0.5},${145 - stemHeight}`}
              stroke={colors.stem}
              strokeWidth={stageIdx >= 6 ? 5 : stageIdx >= 4 ? 3.5 : 2.5}
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          )}

          {/* ── BRANCHES (tree stages) ── */}
          {stageIdx >= 5 && (
            <>
              <motion.line
                x1={100 + droop * 0.4} y1={145 - stemHeight * 0.65}
                x2={70 + droop} y2={145 - stemHeight * 0.65 - 18}
                stroke={colors.stem} strokeWidth={2} strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              />
              <motion.line
                x1={100 + droop * 0.4} y1={145 - stemHeight * 0.55}
                x2={135 + droop} y2={145 - stemHeight * 0.55 - 15}
                stroke={colors.stem} strokeWidth={2} strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              />
            </>
          )}
          {stageIdx >= 7 && (
            <>
              <motion.line
                x1={100 + droop * 0.3} y1={145 - stemHeight * 0.8}
                x2={60 + droop} y2={145 - stemHeight * 0.8 - 12}
                stroke={colors.stem} strokeWidth={1.5} strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
              />
              <motion.line
                x1={100 + droop * 0.3} y1={145 - stemHeight * 0.75}
                x2={145 + droop} y2={145 - stemHeight * 0.75 - 14}
                stroke={colors.stem} strokeWidth={1.5} strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              />
            </>
          )}

          {/* ── LEAVES ── */}
          {leafCount >= 1 && (
            <motion.ellipse
              cx={85 + droop * 0.3} cy={145 - stemHeight * 0.6 + droop * 0.5}
              rx="14" ry="6"
              fill={colors.leaf} opacity={0.7}
              transform={`rotate(${-30 + droop}, ${85 + droop * 0.3}, ${145 - stemHeight * 0.6 + droop * 0.5})`}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
            />
          )}
          {leafCount >= 2 && (
            <motion.ellipse
              cx={115 + droop * 0.3} cy={145 - stemHeight * 0.55 + droop * 0.3}
              rx="13" ry="6"
              fill={colors.leaf} opacity={0.65}
              transform={`rotate(${25 + droop}, ${115 + droop * 0.3}, ${145 - stemHeight * 0.55 + droop * 0.3})`}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.9, type: "spring" }}
            />
          )}
          {leafCount >= 3 && (
            <motion.ellipse
              cx={90 + droop * 0.2} cy={145 - stemHeight * 0.75 + droop * 0.3}
              rx="11" ry="5"
              fill="#7BAFB0" opacity={0.55}
              transform={`rotate(${-20 + droop}, ${90 + droop * 0.2}, ${145 - stemHeight * 0.75 + droop * 0.3})`}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 1, type: "spring" }}
            />
          )}
          {leafCount >= 4 && (
            <motion.ellipse
              cx={112 + droop * 0.2} cy={145 - stemHeight * 0.8 + droop * 0.3}
              rx="11" ry="5"
              fill="#7BAFB0" opacity={0.55}
              transform={`rotate(${22 + droop}, ${112 + droop * 0.2}, ${145 - stemHeight * 0.8 + droop * 0.3})`}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 1.05, type: "spring" }}
            />
          )}
          {leafCount >= 5 && (
            <>
              <motion.ellipse cx={78} cy={145 - stemHeight * 0.5} rx="9" ry="4"
                fill={colors.leaf} opacity={0.5} transform={`rotate(-35, 78, ${145 - stemHeight * 0.5})`}
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.1, type: "spring" }}
              />
              <motion.ellipse cx={122} cy={145 - stemHeight * 0.65} rx="9" ry="4"
                fill={colors.leaf} opacity={0.5} transform={`rotate(30, 122, ${145 - stemHeight * 0.65})`}
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.15, type: "spring" }}
              />
            </>
          )}

          {/* ── TREE CROWN ── */}
          {hasCrown && (
            <>
              <motion.circle cx={100 + droop * 0.4} cy={145 - stemHeight + 5} r={stageIdx >= 7 ? 26 : 20}
                fill={colors.leaf} opacity={0.25}
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1, type: "spring" }}
              />
              <motion.circle cx={80 + droop * 0.3} cy={145 - stemHeight + 12} r={stageIdx >= 7 ? 18 : 14}
                fill="#7BAFB0" opacity={0.2}
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.1, type: "spring" }}
              />
              <motion.circle cx={120 + droop * 0.3} cy={145 - stemHeight + 10} r={stageIdx >= 7 ? 19 : 15}
                fill={colors.leaf} opacity={0.2}
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2, type: "spring" }}
              />
            </>
          )}

          {/* ── FLOWERS ── */}
          {hasFlowers && healthState !== "dying" && (
            <>
              <motion.circle
                cx={95 + droop * 0.3} cy={145 - stemHeight * 0.85}
                r={stageIdx >= 6 ? 4.5 : 3.5}
                fill={colors.flower} opacity={0.8}
                initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 1.3 }}
              />
              {stageIdx >= 5 && (
                <>
                  <motion.circle cx={75 + droop * 0.2} cy={145 - stemHeight * 0.6} r={3.5}
                    fill="#C4876C" opacity={0.7}
                    initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }}
                    transition={{ delay: 1.4 }}
                  />
                  <motion.circle cx={125 + droop * 0.2} cy={145 - stemHeight * 0.7} r={3.5}
                    fill="#9B8EC4" opacity={0.7}
                    initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }}
                    transition={{ delay: 1.5 }}
                  />
                </>
              )}
              {stageIdx >= 8 && (
                <>
                  <motion.circle cx={65} cy={145 - stemHeight * 0.5} r={3}
                    fill="#C4A86C" opacity={0.7}
                    initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ delay: 1.6 }}
                  />
                  <motion.circle cx={140} cy={145 - stemHeight * 0.65} r={3}
                    fill="#B88FA7" opacity={0.7}
                    initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ delay: 1.7 }}
                  />
                  <motion.circle cx={105 + droop * 0.2} cy={145 - stemHeight - 5} r={4.5}
                    fill="#C4876C" opacity={0.85}
                    initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ delay: 1.8 }}
                  />
                </>
              )}
            </>
          )}

          {/* ── FRUIT (stage 8+) ── */}
          {hasFruit && (
            <>
              <motion.circle cx={82} cy={145 - stemHeight * 0.45} r={4}
                fill="#E8A87C" opacity={0.9}
                initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ delay: 2 }}
              />
              <motion.circle cx={118} cy={145 - stemHeight * 0.55} r={3.5}
                fill="#E8A87C" opacity={0.85}
                initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ delay: 2.1 }}
              />
            </>
          )}

          {/* ── SPARKLE PARTICLES (thriving) ── */}
          {healthState === "thriving" && stageIdx >= 4 && (
            <>
              {[0, 1, 2, 3].map((i) => (
                <motion.circle
                  key={`sp-${i}`}
                  cx={70 + i * 20 + Math.sin(i * 2) * 5}
                  cy={145 - stemHeight + 5 + i * 8}
                  r="1.5"
                  fill="#C4A86C"
                  opacity={0.6}
                  animate={{ opacity: [0.2, 0.8, 0.2], y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 2 + i * 0.5, delay: i * 0.4 }}
                />
              ))}
            </>
          )}

          {/* ── MAGICAL AURA (max stage) ── */}
          {isMaxed && (
            <motion.circle
              cx="100" cy={145 - stemHeight + 5}
              r="35"
              fill="none"
              stroke="#C4A86C"
              strokeWidth={0.5}
              opacity={0.3}
              animate={{ r: [30, 38, 30], opacity: [0.15, 0.35, 0.15] }}
              transition={{ repeat: Infinity, duration: 3 }}
            />
          )}

          {/* ── BUTTERFLIES ── */}
          {plantState.butterflies > 0 && healthState !== "dying" && (
            <>
              {Array.from({ length: Math.min(plantState.butterflies, 3) }).map((_, i) => (
                <motion.g key={`bf-${i}`}>
                  <motion.text
                    x={60 + i * 30}
                    y={145 - stemHeight * 0.5 + i * 10}
                    style={{ fontSize: "10px" }}
                    animate={{
                      x: [60 + i * 30, 70 + i * 25, 55 + i * 35, 60 + i * 30],
                      y: [145 - stemHeight * 0.5 + i * 10, 140 - stemHeight * 0.6 + i * 8, 145 - stemHeight * 0.4 + i * 12, 145 - stemHeight * 0.5 + i * 10],
                    }}
                    transition={{ repeat: Infinity, duration: 6 + i * 2, ease: "easeInOut" }}
                  >
                    🦋
                  </motion.text>
                </motion.g>
              ))}
            </>
          )}

          {/* ── WILTING EFFECTS ── */}
          {healthState === "dying" && (
            <>
              {/* Fallen leaves */}
              <motion.text x={60} y={142} style={{ fontSize: "8px" }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 2 }}>🍂</motion.text>
              <motion.text x={130} y={140} style={{ fontSize: "7px" }}
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ repeat: Infinity, duration: 2.5 }}>🍂</motion.text>
            </>
          )}
          {healthState === "wilting" && (
            <motion.text x={125} y={141} style={{ fontSize: "7px" }}
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ repeat: Infinity, duration: 3 }}>🍂</motion.text>
          )}
        </motion.svg>
      </div>

      {/* ═══ STATUS BARS ═══ */}
      <div className="px-4 pt-1 pb-2 space-y-2">
        {/* Health, Water, Happiness mini bars */}
        <div className="grid grid-cols-3 gap-2">
          {([
            { label: "Здоровье", value: plantState.health, color: "#8DB596", icon: "💚" },
            { label: "Вода", value: plantState.waterLevel, color: "#7EA8BE", icon: "💧" },
            { label: "Счастье", value: plantState.happiness, color: "#C4A86C", icon: "😊" },
          ]).map((bar) => (
            <div key={bar.label}>
              <div className="flex items-center gap-1 mb-0.5">
                <span style={{ fontSize: "0.55rem" }}>{bar.icon}</span>
                <span style={{ fontSize: "0.58rem", color: th.textFaint }}>{bar.label}</span>
              </div>
              <div className="w-full rounded-full h-1.5" style={{ backgroundColor: th.border }}>
                <motion.div
                  className="h-1.5 rounded-full"
                  style={{ backgroundColor: bar.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${bar.value}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Growth progress */}
        {nextStage ? (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontSize: "0.65rem", color: th.textMuted }}>
                До «{nextStage.name}»
              </span>
              <span style={{ fontSize: "0.62rem", color: th.textFaint }}>
                {plantState.growthPoints} / {nextStage.min}
              </span>
            </div>
            <div className="w-full rounded-full h-2" style={{ backgroundColor: th.border }}>
              <motion.div
                className="h-2 rounded-full"
                style={{
                  background: healthState === "dying"
                    ? "linear-gradient(90deg, #7A6B5E, #887A6B)"
                    : "linear-gradient(90deg, #8DB596, #7BAFB0)",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        ) : (
          <p style={{ fontSize: "0.72rem", color: th.sage, fontWeight: 500, textAlign: "center" }}>
            ✨ Максимальный расцвет! Ваш сад прекрасен
          </p>
        )}
      </div>

      {/* ═══ ACTION BUTTONS ═══ */}
      <div className="px-4 pb-4 pt-1 flex gap-2">
        <motion.button
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5"
          style={{
            backgroundColor: plantState.waterLevel >= 100 ? th.border + "30" : "#7EA8BE18",
            border: `1px solid ${plantState.waterLevel >= 100 ? th.border : "#7EA8BE30"}`,
          }}
          whileTap={{ scale: 0.95 }}
          onClick={handleWater}
        >
          <Droplets className="w-4 h-4" style={{ color: plantState.waterLevel >= 100 ? th.textFaint : "#7EA8BE" }} />
          <span style={{
            fontSize: "0.78rem", fontWeight: 600,
            color: plantState.waterLevel >= 100 ? th.textFaint : "#7EA8BE",
          }}>
            Полить
          </span>
        </motion.button>

        <motion.button
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5"
          style={{ backgroundColor: "#B88FA718", border: "1px solid #B88FA730" }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLove}
        >
          <Heart className="w-4 h-4" style={{ color: "#B88FA7" }} />
          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#B88FA7" }}>
            Обнять
          </span>
        </motion.button>

        {healthState === "dying" || healthState === "wilting" ? (
          <motion.button
            className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3"
            style={{ backgroundColor: "#C4876C18", border: "1px solid #C4876C30" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              handleWater();
              handleLove();
              flash("Экстренная помощь! 🌿");
            }}
          >
            <Sparkles className="w-4 h-4" style={{ color: "#C4876C" }} />
          </motion.button>
        ) : null}
      </div>
    </motion.div>
  );
}
