import { motion } from "motion/react";
import { useMemo } from "react";

/**
 * Floating ambient decorative elements — soft, semi-transparent, dreamy.
 * Adds visual depth with glass-morphism blobs, sparkle dots, 
 * organic gradient rings, and gentle flowing shapes.
 */

interface AmbientBackgroundProps {
  variant?: "default" | "calm" | "focus" | "night";
  density?: "low" | "medium" | "high";
  darkMode?: boolean;
}

// Soft color palettes
const palettes = {
  default: ["#8DB596", "#9B8EC4", "#7EA8BE", "#C4876C", "#C4A86C", "#B88FA7", "#7BAFB0"],
  calm: ["#8DB596", "#7EA8BE", "#7BAFB0", "#9B8EC4"],
  focus: ["#C4876C", "#C4A86C", "#B88FA7", "#9B8EC4"],
  night: ["#9B8EC4", "#7EA8BE", "#7BAFB0", "#B88FA7"],
};

function seededRandom(seed: number) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/** Large glass-morphism blobs that float slowly */
export function AmbientBlobs({ variant = "default", darkMode = false }: AmbientBackgroundProps) {
  const colors = palettes[variant];
  const opacity = darkMode ? "08" : "12";

  const blobs = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => ({
      id: i,
      color: colors[i % colors.length],
      size: 120 + seededRandom(i * 7) * 180,
      x: seededRandom(i * 13) * 100,
      y: seededRandom(i * 19) * 100,
      delay: i * 2.5,
      duration: 18 + seededRandom(i * 3) * 12,
    }));
  }, [variant]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {blobs.map((b) => (
        <motion.div
          key={b.id}
          className="absolute rounded-full"
          style={{
            width: b.size,
            height: b.size,
            left: `${b.x}%`,
            top: `${b.y}%`,
            background: `radial-gradient(circle, ${b.color}${opacity} 0%, transparent 70%)`,
            filter: "blur(40px)",
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            x: [0, 30 * (b.id % 2 === 0 ? 1 : -1), -20 * (b.id % 2 === 0 ? -1 : 1), 0],
            y: [0, -25 * (b.id % 3 === 0 ? 1 : -1), 15, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{
            duration: b.duration,
            repeat: Infinity,
            delay: b.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/** Tiny floating sparkle dots */
export function SparkleField({ count = 12, darkMode = false }: { count?: number; darkMode?: boolean }) {
  const dots = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: seededRandom(i * 17 + 3) * 100,
      y: seededRandom(i * 23 + 7) * 100,
      size: 2 + seededRandom(i * 11) * 4,
      delay: seededRandom(i * 31) * 6,
      duration: 3 + seededRandom(i * 37) * 4,
      color: palettes.default[i % palettes.default.length],
    }));
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {dots.map((d) => (
        <motion.div
          key={d.id}
          className="absolute rounded-full"
          style={{
            width: d.size,
            height: d.size,
            left: `${d.x}%`,
            top: `${d.y}%`,
            backgroundColor: d.color,
            opacity: 0,
          }}
          animate={{
            opacity: [0, darkMode ? 0.2 : 0.35, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: d.duration,
            repeat: Infinity,
            delay: d.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/** Soft gradient ring — organic orbital element */
export function GradientOrb({ 
  color1 = "#8DB596", 
  color2 = "#9B8EC4",
  size = 200,
  x = "50%",
  y = "50%",
  darkMode = false,
}: { color1?: string; color2?: string; size?: number; x?: string; y?: string; darkMode?: boolean }) {
  const alpha = darkMode ? "06" : "10";
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        background: `conic-gradient(from 0deg, ${color1}${alpha}, ${color2}${alpha}, transparent, ${color1}${alpha})`,
        filter: "blur(30px)",
        zIndex: 0,
      }}
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
    />
  );
}

/** Floating glass card — a decorative translucent panel */
export function GlassPanel({
  children,
  className = "",
  darkMode = false,
  color,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  darkMode?: boolean;
  color?: string;
  style?: React.CSSProperties;
}) {
  const accent = color || "#8DB596";
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: darkMode
          ? `linear-gradient(135deg, rgba(36,34,32,0.8), rgba(36,34,32,0.5))`
          : `linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.3))`,
        backdropFilter: "blur(20px) saturate(1.2)",
        WebkitBackdropFilter: "blur(20px) saturate(1.2)",
        border: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.5)"}`,
        boxShadow: darkMode
          ? `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`
          : `0 8px 32px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)`,
        ...style,
      }}
    >
      {/* Subtle accent glow in corner */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${accent}${darkMode ? "0A" : "15"} 0%, transparent 70%)`,
        }}
      />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

/** Floating leaf / petal particles — nature theme */
export function FloatingPetals({ darkMode = false }: { darkMode?: boolean }) {
  const petals = useMemo(() => {
    const shapes = ["🍃", "🌿", "✨", "·", "·", "·"];
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      char: shapes[i % shapes.length],
      x: seededRandom(i * 41 + 5) * 90 + 5,
      delay: seededRandom(i * 47) * 10,
      duration: 12 + seededRandom(i * 53) * 10,
      size: i < 3 ? 10 + seededRandom(i * 59) * 6 : 3 + seededRandom(i * 59) * 3,
      isEmoji: i < 3,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {petals.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: "-5%",
            fontSize: p.isEmoji ? `${p.size}px` : undefined,
            width: p.isEmoji ? undefined : p.size,
            height: p.isEmoji ? undefined : p.size,
            borderRadius: "50%",
            backgroundColor: p.isEmoji ? undefined : (darkMode ? "rgba(141,181,150,0.12)" : "rgba(141,181,150,0.2)"),
          }}
          animate={{
            y: ["0vh", "110vh"],
            x: [0, 30 * (p.id % 2 === 0 ? 1 : -1), -20 * (p.id % 2 === 0 ? -1 : 1), 10],
            rotate: [0, 360 * (p.id % 2 === 0 ? 1 : -1)],
            opacity: [0, darkMode ? 0.25 : 0.45, darkMode ? 0.25 : 0.45, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

/** Wavy gradient divider */
export function WaveDivider({ color = "#8DB596", darkMode = false }: { color?: string; darkMode?: boolean }) {
  const alpha = darkMode ? "08" : "12";
  return (
    <div className="relative w-full h-8 overflow-hidden pointer-events-none my-2">
      <svg viewBox="0 0 400 30" className="w-full h-full" preserveAspectRatio="none">
        <motion.path
          d="M0,15 C80,5 120,25 200,15 C280,5 320,25 400,15"
          fill="none"
          stroke={`${color}${alpha}`}
          strokeWidth="1.5"
          animate={{
            d: [
              "M0,15 C80,5 120,25 200,15 C280,5 320,25 400,15",
              "M0,15 C80,25 120,5 200,15 C280,25 320,5 400,15",
              "M0,15 C80,5 120,25 200,15 C280,5 320,25 400,15",
            ],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}

/** Ambient header aurora — soft gradients at the top of pages */
export function AuroraHeader({
  colors = ["#8DB596", "#9B8EC4", "#7EA8BE"],
  height = 180,
  darkMode = false,
}: { colors?: string[]; height?: number; darkMode?: boolean }) {
  const alpha = darkMode ? "0A" : "15";
  return (
    <div
      className="absolute top-0 left-0 right-0 pointer-events-none overflow-hidden"
      style={{ height, zIndex: 0 }}
    >
      {colors.map((c, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 200 + i * 60,
            height: 200 + i * 60,
            left: `${15 + i * 28}%`,
            top: -60 - i * 20,
            background: `radial-gradient(circle, ${c}${alpha} 0%, transparent 70%)`,
            filter: "blur(35px)",
            transform: "translate(-50%, 0)",
          }}
          animate={{
            x: [0, 20 * (i % 2 === 0 ? 1 : -1), 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10 + i * 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1.5,
          }}
        />
      ))}
      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-16"
        style={{
          background: `linear-gradient(to top, ${darkMode ? "#1A1918" : "#FAF8F5"}, transparent)`,
        }}
      />
    </div>
  );
}

/** Glassmorphism stat bubble — for showing a single metric */
export function GlassBubble({
  emoji,
  value,
  label,
  color = "#8DB596",
  darkMode = false,
  onClick,
}: {
  emoji: string;
  value: string | number;
  label: string;
  color?: string;
  darkMode?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      className="relative overflow-hidden rounded-2xl px-3 py-3 flex flex-col items-center gap-1 flex-1"
      style={{
        background: darkMode
          ? `linear-gradient(145deg, rgba(36,34,32,0.7), rgba(36,34,32,0.4))`
          : `linear-gradient(145deg, rgba(255,255,255,0.75), rgba(255,255,255,0.35))`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.6)"}`,
        boxShadow: darkMode
          ? `0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)`
          : `0 4px 20px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8)`,
      }}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      onClick={onClick}
    >
      {/* Accent dot glow */}
      <div
        className="absolute -top-4 -right-4 w-12 h-12 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${color}${darkMode ? "12" : "20"} 0%, transparent 70%)` }}
      />
      <span style={{ fontSize: "1.15rem" }}>{emoji}</span>
      <span style={{ fontSize: "1rem", fontWeight: 700, color: darkMode ? "#E8E3DC" : "#4A4540" }}>{value}</span>
      <span style={{ fontSize: "0.58rem", fontWeight: 500, color: darkMode ? "#9B9489" : "#9B9489", lineHeight: 1.2, textAlign: "center" }}>{label}</span>
    </motion.button>
  );
}

/** Breathing ring — a pulsing ring for ambient decoration */
export function PulsingRing({
  size = 80,
  color = "#8DB596",
  darkMode = false,
}: { size?: number; color?: string; darkMode?: boolean }) {
  const alpha = darkMode ? "0C" : "18";
  return (
    <motion.div
      className="pointer-events-none"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `1.5px solid ${color}${alpha}`,
        position: "relative",
      }}
      animate={{
        scale: [1, 1.15, 1],
        opacity: [0.6, 1, 0.6],
      }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.div
        className="absolute inset-2 rounded-full"
        style={{ border: `1px solid ${color}${alpha}` }}
        animate={{
          scale: [1, 0.9, 1],
          opacity: [1, 0.5, 1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />
    </motion.div>
  );
}

/** Animated mesh gradient background — the main bg layer for the whole app */
export function MeshGradientBg({ darkMode = false, variant = "default" }: { darkMode?: boolean; variant?: "default" | "calm" | "warm" | "night" }) {
  const configs = {
    default: {
      light: [
        { color: "rgba(141,181,150,0.07)", x: "10%", y: "5%", size: 420 },
        { color: "rgba(155,142,196,0.06)", x: "85%", y: "15%", size: 380 },
        { color: "rgba(126,168,190,0.05)", x: "50%", y: "55%", size: 500 },
        { color: "rgba(196,135,108,0.04)", x: "20%", y: "80%", size: 350 },
        { color: "rgba(123,175,176,0.05)", x: "75%", y: "70%", size: 300 },
      ],
      dark: [
        { color: "rgba(141,181,150,0.03)", x: "10%", y: "5%", size: 420 },
        { color: "rgba(155,142,196,0.025)", x: "85%", y: "15%", size: 380 },
        { color: "rgba(126,168,190,0.02)", x: "50%", y: "55%", size: 500 },
        { color: "rgba(196,135,108,0.02)", x: "20%", y: "80%", size: 350 },
        { color: "rgba(123,175,176,0.025)", x: "75%", y: "70%", size: 300 },
      ],
    },
    calm: {
      light: [
        { color: "rgba(141,181,150,0.08)", x: "15%", y: "10%", size: 450 },
        { color: "rgba(126,168,190,0.07)", x: "80%", y: "30%", size: 400 },
        { color: "rgba(123,175,176,0.06)", x: "40%", y: "70%", size: 480 },
      ],
      dark: [
        { color: "rgba(141,181,150,0.03)", x: "15%", y: "10%", size: 450 },
        { color: "rgba(126,168,190,0.025)", x: "80%", y: "30%", size: 400 },
        { color: "rgba(123,175,176,0.02)", x: "40%", y: "70%", size: 480 },
      ],
    },
    warm: {
      light: [
        { color: "rgba(196,168,108,0.07)", x: "20%", y: "8%", size: 400 },
        { color: "rgba(196,135,108,0.06)", x: "75%", y: "25%", size: 360 },
        { color: "rgba(184,143,167,0.05)", x: "45%", y: "65%", size: 450 },
        { color: "rgba(141,181,150,0.04)", x: "80%", y: "80%", size: 320 },
      ],
      dark: [
        { color: "rgba(196,168,108,0.03)", x: "20%", y: "8%", size: 400 },
        { color: "rgba(196,135,108,0.025)", x: "75%", y: "25%", size: 360 },
        { color: "rgba(184,143,167,0.02)", x: "45%", y: "65%", size: 450 },
        { color: "rgba(141,181,150,0.015)", x: "80%", y: "80%", size: 320 },
      ],
    },
    night: {
      light: [
        { color: "rgba(155,142,196,0.08)", x: "25%", y: "10%", size: 440 },
        { color: "rgba(126,168,190,0.06)", x: "70%", y: "35%", size: 400 },
        { color: "rgba(184,143,167,0.05)", x: "40%", y: "75%", size: 380 },
      ],
      dark: [
        { color: "rgba(155,142,196,0.035)", x: "25%", y: "10%", size: 440 },
        { color: "rgba(126,168,190,0.025)", x: "70%", y: "35%", size: 400 },
        { color: "rgba(184,143,167,0.02)", x: "40%", y: "75%", size: 380 },
      ],
    },
  };

  const spots = configs[variant][darkMode ? "dark" : "light"];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Base gradient wash */}
      <div
        className="absolute inset-0"
        style={{
          background: darkMode
            ? "linear-gradient(160deg, #1E1D1B 0%, #1A1918 30%, #1C1B1A 60%, #1A1918 100%)"
            : "linear-gradient(160deg, #FBF9F6 0%, #FAF8F5 25%, #F8F5F0 50%, #FAF7F2 75%, #FBF9F6 100%)",
        }}
      />
      {/* Soft radial spots */}
      {spots.map((spot, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: spot.size,
            height: spot.size,
            left: spot.x,
            top: spot.y,
            background: `radial-gradient(circle, ${spot.color} 0%, transparent 70%)`,
            filter: "blur(60px)",
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            x: [0, 25 * (i % 2 === 0 ? 1 : -1), -15 * (i % 2 === 0 ? -1 : 1), 0],
            y: [0, -20 * (i % 3 === 0 ? 1 : -1), 10, 0],
            scale: [1, 1.08, 0.95, 1],
          }}
          transition={{
            duration: 20 + i * 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 2,
          }}
        />
      ))}
      {/* Top-left soft light flare */}
      <div
        className="absolute"
        style={{
          width: 300,
          height: 300,
          top: -80,
          left: -60,
          background: darkMode
            ? "radial-gradient(circle, rgba(141,181,150,0.02) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      {/* Bottom-right warm glow */}
      <div
        className="absolute"
        style={{
          width: 250,
          height: 250,
          bottom: -60,
          right: -40,
          background: darkMode
            ? "radial-gradient(circle, rgba(196,135,108,0.015) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(196,168,108,0.06) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />
    </div>
  );
}