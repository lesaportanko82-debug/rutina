import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "./app-context";

const tierForLevel = (level: number) => {
  if (level >= 50) return { name: "Легенда", icon: "👑" };
  if (level >= 40) return { name: "Мудрец", icon: "🧙" };
  if (level >= 30) return { name: "Хранитель", icon: "🦋" };
  if (level >= 25) return { name: "Лес", icon: "🌲" };
  if (level >= 20) return { name: "Роща", icon: "🌳" };
  if (level >= 17) return { name: "Сад", icon: "🏡" };
  if (level >= 14) return { name: "Дерево", icon: "🌴" };
  if (level >= 11) return { name: "Куст", icon: "🌿" };
  if (level >= 8) return { name: "Цветок", icon: "🌸" };
  if (level >= 5) return { name: "Побег", icon: "🌱" };
  if (level >= 3) return { name: "Росток", icon: "🌾" };
  return { name: "Семечко", icon: "🌰" };
};

const messages: Record<string, { title: string; subtitle: string; emoji: string }> = {
  "level-up": { title: "Новый уровень!", subtitle: "Вы становитесь сильнее с каждым днём", emoji: "⭐" },
  "streak-7": { title: "7 дней подряд!", subtitle: "Привычка укрепляется — так держать", emoji: "🔥" },
  "streak-30": { title: "30 дней!", subtitle: "Это невероятная дисциплина", emoji: "🏔️" },
  "streak-100": { title: "100 дней!", subtitle: "Вы — легенда", emoji: "🏆" },
  "pomodoro-10": { title: "10 сессий фокуса!", subtitle: "Мастер концентрации", emoji: "🍅" },
};

function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const colors = ["#8DB596", "#9B8EC4", "#C4876C", "#7EA8BE", "#C4A86C", "#7BAFB0", "#B88FA7", "#D4B896"];
    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; color: string; rotation: number; rotSpeed: number; life: number;
    }> = [];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: canvas.offsetWidth / 2 + (Math.random() - 0.5) * 100,
        y: canvas.offsetHeight / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 12 - 4,
        size: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        life: 1,
      });
    }

    let animFrame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      let alive = false;
      for (const p of particles) {
        if (p.life <= 0) continue;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25;
        p.vx *= 0.99;
        p.rotation += p.rotSpeed;
        p.life -= 0.012;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (alive) animFrame = requestAnimationFrame(animate);
    };
    animFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animFrame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}

export function CelebrationOverlay() {
  const { celebrationEvent, profile } = useApp();
  
  // Dynamic level-up message with tier
  const getLevelUpMsg = () => {
    const tier = tierForLevel(profile.level);
    const prevTier = tierForLevel(profile.level - 1);
    const tierChanged = tier.name !== prevTier.name;
    return {
      title: tierChanged ? `${tier.icon} ${tier.name}!` : `Уровень ${profile.level}!`,
      subtitle: tierChanged
        ? `Новый ранг! Вы теперь — ${tier.name}`
        : "Вы растёте с каждым днём",
      emoji: tierChanged ? tier.icon : "⭐",
    };
  };

  const msg = celebrationEvent
    ? celebrationEvent === "level-up"
      ? getLevelUpMsg()
      : messages[celebrationEvent] || { title: "Отлично!", subtitle: "Продолжайте в том же духе", emoji: "✨" }
    : null;

  return (
    <AnimatePresence>
      {celebrationEvent && msg && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ConfettiCanvas />
          <motion.div
            className="relative z-10 text-center px-8 py-6 rounded-3xl shadow-2xl"
            style={{ backgroundColor: "rgba(250, 248, 245, 0.95)", maxWidth: 300 }}
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <motion.span
              style={{ fontSize: "3rem", display: "block" }}
              animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.6 }}
            >
              {msg.emoji}
            </motion.span>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#4A4540", marginTop: 8 }}>
              {msg.title}
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#9B9489", marginTop: 4 }}>
              {msg.subtitle}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}