import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Volume2, VolumeX, Trash2, ArrowRight } from "lucide-react";
import { useTheme } from "./theme";
import { useApp } from "./app-context";
import { useNavigate } from "react-router";
import { projectId, publicAnonKey } from "./supabase-client";
import { syncToServer } from "./supabase-sync";

// ─── Types ───

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  emotion?: LeafMood;
  navLinks?: NavLink[];
}

type LeafMood = "idle" | "happy" | "thinking" | "sleeping" | "waving" | "love" | "listening" | "worried" | "proud" | "surprised";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  type: "leaf" | "sparkle" | "heart" | "glow";
  delay: number;
  duration: number;
}

// ─── Sound Engine (disabled) ───

class MascotSounds {
  enabled = false;
  pop() {}
  pet() {}
  open() {}
  close() {}
  send() {}
  receive() {}
  love() {}
}

const sounds = new MascotSounds();

// ─── Particle System ───

function useParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const idRef = useRef(0);

  const burst = useCallback((type: Particle["type"], count = 6) => {
    const newP: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newP.push({
        id: idRef.current++,
        x: 20 + Math.random() * 16,
        y: 10 + Math.random() * 30,
        size: 6 + Math.random() * 8,
        type,
        delay: i * 0.08,
        duration: 1 + Math.random() * 0.8,
      });
    }
    setParticles((prev) => [...prev, ...newP]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newP.find((n) => n.id === p.id)));
    }, 2500);
  }, []);

  return { particles, burst };
}

function ParticleLayer({ particles }: { particles: Particle[] }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute"
            style={{ left: p.x, top: p.y, fontSize: p.size }}
            initial={{ opacity: 0, scale: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0.3, 1, 0.6], y: -40 - Math.random() * 30, x: (Math.random() - 0.5) * 30, rotate: Math.random() * 360 }}
            exit={{ opacity: 0 }}
            transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
          >
            {p.type === "leaf" ? "🍃" : p.type === "sparkle" ? "✨" : p.type === "heart" ? "💚" : "🌟"}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Animated SVG Leaf Character ───

function LeafCharacter({ mood, size = 48, onClick, darkMode = false }: { mood: LeafMood; size?: number; onClick?: () => void; darkMode?: boolean }) {
  const eyeProps = useMemo(() => {
    switch (mood) {
      case "happy": return { isArc: true, isHeart: false };
      case "sleeping": return { isArc: false, isHeart: false, ry: 0.5 };
      case "thinking": return { isArc: false, isHeart: false, ry: 3, lookUp: true };
      case "love": return { isArc: false, isHeart: true };
      case "listening": return { isArc: false, isHeart: false, ry: 3.2 };
      case "worried": return { isArc: false, isHeart: false, ry: 3.5, worried: true };
      case "proud": return { isArc: true, isHeart: false };
      case "surprised": return { isArc: false, isHeart: false, ry: 4, surprised: true };
      default: return { isArc: false, isHeart: false, ry: 3 };
    }
  }, [mood]);

  const svgAnimation = useMemo(() => {
    switch (mood) {
      case "happy": case "proud": return { rotate: [0, -8, 8, -4, 0], transition: { duration: 0.6, repeat: 2 } };
      case "waving": return { rotate: [0, -15, 15, -10, 5, 0], transition: { duration: 0.8 } };
      case "thinking": return { y: [0, -3, 0], transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" as const } };
      case "sleeping": return { rotate: [0, 5, 0], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const } };
      case "love": return { scale: [1, 1.15, 1, 1.1, 1], transition: { duration: 0.8 } };
      case "worried": return { x: [-1, 1, -1, 0], transition: { duration: 0.4, repeat: 3 } };
      case "surprised": return { scale: [1, 1.2, 1], y: [0, -5, 0], transition: { duration: 0.5 } };
      default: return { rotate: [0, 2, -2, 0], y: [0, -2, 0], transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const } };
    }
  }, [mood]);

  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);

  return (
    <motion.svg
      key={mood + uid}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      animate={svgAnimation}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : undefined, filter: `drop-shadow(0 2px 8px rgba(109,163,120,${darkMode ? "0.5" : "0.3"}))` }}
      whileTap={onClick ? { scale: 0.85 } : undefined}
    >
      <defs>
        <radialGradient id={`lg-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8DB596" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8DB596" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`lb-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#B8DBBF" />
          <stop offset="40%" stopColor="#8DB596" />
          <stop offset="100%" stopColor="#5F9E6C" />
        </linearGradient>
        <linearGradient id={`lh-${uid}`} x1="0.2" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#D4F0DA" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#A8D5B0" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Outer glow */}
      <circle cx="32" cy="34" r="28" fill={`url(#lg-${uid})`} />

      {/* Body */}
      <path
        d="M32 7 C16 12, 6 25, 11 39 C13 46, 20 52, 28 54 C30 54.5, 34 54.5, 36 54 C44 52, 51 46, 53 39 C58 25, 48 12, 32 7Z"
        fill={`url(#lb-${uid})`}
        stroke="#5A8F63"
        strokeWidth="0.8"
      />

      {/* Inner highlight */}
      <path
        d="M32 11 C20 15, 12 25, 15 37 C16 42, 22 48, 28 50 L32 50"
        fill={`url(#lh-${uid})`}
        opacity="0.5"
      />

      {/* Veins */}
      <path d="M32 13 L32 48" stroke="#5A8F63" strokeWidth="0.7" opacity="0.3" fill="none" />
      <path d="M32 21 L20 30" stroke="#5A8F63" strokeWidth="0.5" opacity="0.2" fill="none" />
      <path d="M32 21 L44 30" stroke="#5A8F63" strokeWidth="0.5" opacity="0.2" fill="none" />
      <path d="M32 30 L18 38" stroke="#5A8F63" strokeWidth="0.4" opacity="0.18" fill="none" />
      <path d="M32 30 L46 38" stroke="#5A8F63" strokeWidth="0.4" opacity="0.18" fill="none" />

      {/* Face glow area */}
      <ellipse cx="32" cy="35" rx="13" ry="11" fill="#D4F0DA" opacity="0.3" />

      {/* Eyes */}
      {eyeProps.isArc ? (
        <>
          <path d="M23 33 Q26 29.5, 29 33" stroke="#2D4A30" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M35 33 Q38 29.5, 41 33" stroke="#2D4A30" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      ) : eyeProps.isHeart ? (
        <>
          <path d="M23 32 C23 29.5, 25.5 28, 26 30.5 C26.5 28, 29 29.5, 29 32 L26 36Z" fill="#E88A8A" />
          <path d="M35 32 C35 29.5, 37.5 28, 38 30.5 C38.5 28, 41 29.5, 41 32 L38 36Z" fill="#E88A8A" />
        </>
      ) : eyeProps.surprised ? (
        <>
          <circle cx="26" cy="33" r="3.5" fill="none" stroke="#2D4A30" strokeWidth="1.8" />
          <circle cx="26" cy="33" r="1.5" fill="#2D4A30" />
          <circle cx="38" cy="33" r="3.5" fill="none" stroke="#2D4A30" strokeWidth="1.8" />
          <circle cx="38" cy="33" r="1.5" fill="#2D4A30" />
          <circle cx="27" cy="31.5" r="0.8" fill="white" opacity="0.9" />
          <circle cx="39" cy="31.5" r="0.8" fill="white" opacity="0.9" />
        </>
      ) : (
        <>
          <motion.ellipse
            cx="26" cy="33" rx="2.8" ry={eyeProps.ry || 3}
            fill="#2D4A30"
            animate={mood === "idle" ? { ry: [eyeProps.ry || 3, eyeProps.ry || 3, 0.4, eyeProps.ry || 3] } : {}}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.92, 0.96, 1] }}
          />
          <motion.ellipse
            cx="38" cy="33" rx="2.8" ry={eyeProps.ry || 3}
            fill="#2D4A30"
            animate={mood === "idle" ? { ry: [eyeProps.ry || 3, eyeProps.ry || 3, 0.4, eyeProps.ry || 3] } : {}}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.92, 0.96, 1] }}
          />
          <circle cx="27.2" cy="31.5" r="1" fill="white" opacity="0.85" />
          <circle cx="39.2" cy="31.5" r="1" fill="white" opacity="0.85" />
          {/* Worried eyebrows */}
          {eyeProps.worried && (
            <>
              <path d="M22 28 L28 30" stroke="#2D4A30" strokeWidth="1" strokeLinecap="round" />
              <path d="M42 28 L36 30" stroke="#2D4A30" strokeWidth="1" strokeLinecap="round" />
            </>
          )}
        </>
      )}

      {/* Mouth */}
      {mood === "happy" || mood === "love" || mood === "proud" ? (
        <path d="M27 39 Q32 44, 37 39" stroke="#2D4A30" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      ) : mood === "thinking" ? (
        <circle cx="35" cy="40" r="1.8" fill="none" stroke="#2D4A30" strokeWidth="1" />
      ) : mood === "sleeping" ? (
        <>
          <path d="M29 40 Q32 41.5, 35 40" stroke="#2D4A30" strokeWidth="0.8" fill="none" strokeLinecap="round" />
          <motion.text x="44" y="26" fontSize="7" fill="#9B8EC4" fontWeight="bold" animate={{ opacity: [0, 1, 0], y: [28, 20, 14] }} transition={{ duration: 2.5, repeat: Infinity }}>z</motion.text>
          <motion.text x="49" y="20" fontSize="5.5" fill="#9B8EC4" fontWeight="bold" animate={{ opacity: [0, 1, 0], y: [22, 16, 10] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.6 }}>z</motion.text>
        </>
      ) : mood === "worried" ? (
        <path d="M28 41 Q32 38, 36 41" stroke="#2D4A30" strokeWidth="1" fill="none" strokeLinecap="round" />
      ) : mood === "surprised" ? (
        <ellipse cx="32" cy="41" rx="2.5" ry="3" fill="none" stroke="#2D4A30" strokeWidth="1.2" />
      ) : (
        <path d="M29 39 Q32 42, 35 39" stroke="#2D4A30" strokeWidth="1" fill="none" strokeLinecap="round" />
      )}

      {/* Blush */}
      {(mood === "happy" || mood === "love" || mood === "listening" || mood === "proud") && (
        <>
          <ellipse cx="21" cy="37" rx="3.5" ry="1.8" fill="#E8A0A0" opacity="0.28" />
          <ellipse cx="43" cy="37" rx="3.5" ry="1.8" fill="#E8A0A0" opacity="0.28" />
        </>
      )}

      {/* Stem + tiny leaf sprout */}
      <path d="M32 7 Q34.5 3, 37 1" stroke="#5A8F63" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M35.5 3 Q38 2, 39 4 Q37 3.5, 35.5 3Z" fill="#8DB596" stroke="#5A8F63" strokeWidth="0.4" />

      {/* Thinking dots */}
      {mood === "thinking" && (
        <>
          <motion.circle cx="46" cy="22" r="1.5" fill="#9B8EC4" opacity={0.6}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0 }} />
          <motion.circle cx="50" cy="18" r="2" fill="#9B8EC4" opacity={0.5}
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }} />
          <motion.circle cx="55" cy="14" r="2.5" fill="#9B8EC4" opacity={0.4}
            animate={{ opacity: [0.15, 0.5, 0.15] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }} />
        </>
      )}
    </motion.svg>
  );
}

// ─── Quick Action Chips ───

const quickActions = [
  { id: "breathe", label: "Подышать", color: "#7EA8BE", emoji: "🌬️" },
  { id: "mood", label: "Как дела?", color: "#B88FA7", emoji: "💚" },
  { id: "journal", label: "Записать мысль", color: "#9B8EC4", emoji: "📝" },
  { id: "encourage", label: "Поддержи меня", color: "#C4A86C", emoji: "✨" },
];

// ─── Typing indicator ───

function TypingDots() {
  return (
    <div className="flex gap-1.5 px-3 py-2.5 items-center">
      {[0, 1, 2].map((i) => (
        <motion.div key={i} className="w-2 h-2 rounded-full"
          style={{ backgroundColor: "#8DB596" }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }} />
      ))}
    </div>
  );
}

// ─── Contextual greeting from data ───

function useContextualGreeting() {
  const { moods, habits, anxietyEntries, sleepEntries, dailyIntentions, eveningCheckins } = useApp();
  
  return useCallback(() => {
    const now = new Date();
    const h = now.getHours();
    const todayStr = now.toISOString().split("T")[0];
    const todayMood = moods.find((m) => m.date === todayStr);
    const todayAnxiety = anxietyEntries.find((a) => a.date === todayStr);
    const lastSleep = sleepEntries[0];
    const totalStreak = habits.reduce((s, h) => s + h.streak, 0);
    const todayIntention = dailyIntentions.find((i) => i.date === todayStr);
    const todayCheckin = eveningCheckins.find((c) => c.date === todayStr);

    // Priority: urgent signals first
    if (todayAnxiety && todayAnxiety.level >= 7) return { text: "Вижу, тревога сегодня высокая... Я рядом 💚", mood: "worried" as LeafMood };
    if (lastSleep && lastSleep.quality <= 2) return { text: "Плохой сон? Давай поговорим 🌙", mood: "worried" as LeafMood };

    // Time-of-day contextual tips
    if (h >= 5 && h < 9) {
      // Morning rituals
      if (!todayIntention) return { text: "Доброе утро! Запиши намерение на день 🌅", mood: "waving" as LeafMood };
      if (!todayMood) return { text: "Утро! Как настроение? Отметь его 🌞", mood: "happy" as LeafMood };
      const uncheckedHabits = habits.filter((hb) => !hb.completedDates.includes(todayStr));
      if (uncheckedHabits.length > 0) return { text: "Утренние привычки ждут тебя 🌿", mood: "waving" as LeafMood };
      return { text: "Отличное утро! Ты уже всё отметил 🌱", mood: "proud" as LeafMood };
    }
    if (h >= 9 && h < 12) {
      if (!todayMood) return { text: "Как проходит утро? Отметь настроение 😊", mood: "listening" as LeafMood };
      if (todayIntention) return { text: `Помни своё намерение на сегодня 💫`, mood: "happy" as LeafMood };
    }
    if (h >= 12 && h < 15) {
      const completedToday = habits.filter((hb) => hb.completedDates.includes(todayStr)).length;
      if (completedToday > 0) return { text: `Уже ${completedToday} привычек сегодня! Так держать 🌿`, mood: "proud" as LeafMood };
      return { text: "Середина дня. Может, подышать? 🌬️", mood: "listening" as LeafMood };
    }
    if (h >= 15 && h < 18) {
      return { text: "Как день? Впереди тихий вечер 🍃", mood: "listening" as LeafMood };
    }
    if (h >= 18 && h < 21) {
      // Evening rituals
      if (!todayCheckin) return { text: "Вечер. Время для рефлексии 🌇", mood: "listening" as LeafMood };
      return { text: "Рефлексия записана. Ты молодец 💚", mood: "happy" as LeafMood };
    }
    if (h >= 21 || h < 1) {
      if (!todayCheckin) return { text: "Перед сном запиши вечерний чекин 🌙", mood: "sleeping" as LeafMood };
      return { text: "Спокойной ночи. Ты сделал достаточно 🌙", mood: "sleeping" as LeafMood };
    }
    if (h >= 1 && h < 5) {
      return { text: "Не спится? Попробуй подышать 🌬️", mood: "worried" as LeafMood };
    }

    // Fallback data-driven
    if (todayMood && ["Радость", "Энергия"].includes(todayMood.mood)) return { text: "Классное настроение сегодня! 🌟", mood: "happy" as LeafMood };
    if (totalStreak > 20) return { text: "Ты так стабильно держишься! Горжусь 🌿", mood: "proud" as LeafMood };
    return null;
  }, [moods, habits, anxietyEntries, sleepEntries, dailyIntentions, eveningCheckins]);
}

// ─── Ambient floating leaves around the button ───

function AmbientLeaves({ darkMode }: { darkMode: boolean }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{
            fontSize: 8 + i * 2,
            left: i * 18 - 6,
            top: -8 - i * 4,
            opacity: darkMode ? 0.4 : 0.25,
          }}
          animate={{
            y: [0, -8, 0, 6, 0],
            x: [0, 4 * (i % 2 ? 1 : -1), 0],
            rotate: [0, 15, -10, 5, 0],
          }}
          transition={{ duration: 5 + i * 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 1.2 }}
        >
          🍃
        </motion.div>
      ))}
    </>
  );
}

// ─── Chat message component with animated reveal ───

function ChatBubble({ msg, t, isLast, onNavigate }: { msg: ChatMessage; t: ReturnType<typeof useTheme>; isLast: boolean; onNavigate?: (path: string) => void }) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
      initial={isLast ? { opacity: 0, y: 12, scale: 0.95 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}>
        {!isUser && (
          <motion.div
            className="w-7 h-7 rounded-full flex items-center justify-center mr-2 mt-1 shrink-0"
            style={{ background: "radial-gradient(circle at 35% 35%, #D4F0DA, #8DB596)" }}
            initial={isLast ? { scale: 0 } : false}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
          >
            <LeafCharacter mood={msg.emotion || "happy"} size={20} />
          </motion.div>
        )}
        <div
          className="rounded-2xl px-3.5 py-2.5 max-w-[82%] shadow-sm"
          style={{
            backgroundColor: isUser ? "#8DB596" : t.bgSecondary,
            color: isUser ? "#fff" : t.text,
            borderBottomRightRadius: isUser ? 4 : undefined,
            borderBottomLeftRadius: !isUser ? 4 : undefined,
            border: !isUser ? `1px solid ${t.border}` : undefined,
          }}
        >
          <p style={{ fontSize: "0.82rem", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
            {msg.content}
          </p>
          <span style={{
            fontSize: "0.52rem",
            color: isUser ? "rgba(255,255,255,0.55)" : t.textFaint,
            display: "block", textAlign: "right", marginTop: 3,
          }}>
            {new Date(msg.timestamp).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Navigation links — only for assistant messages */}
      {!isUser && msg.navLinks && msg.navLinks.length > 0 && onNavigate && (
        <motion.div
          className="flex flex-wrap gap-1.5 mt-1.5 ml-9"
          initial={isLast ? { opacity: 0, y: 6 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {msg.navLinks.map((link) => (
            <motion.button
              key={link.path}
              className="rounded-lg px-2.5 py-1.5 border flex items-center gap-1.5"
              style={{
                backgroundColor: link.color + "12",
                borderColor: link.color + "35",
              }}
              whileTap={{ scale: 0.93 }}
              onClick={() => onNavigate(link.path)}
            >
              <span style={{ fontSize: "0.75rem" }}>{link.emoji}</span>
              <span style={{ fontSize: "0.68rem", fontWeight: 600, color: link.color }}>{link.label}</span>
              <ArrowRight className="w-3 h-3" style={{ color: link.color, opacity: 0.7 }} />
            </motion.button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════
// ─── Main Component ───
// ══════════════════════════════════════════

export function LeafMascot() {
  const t = useTheme();
  const { profile, moods, habits, sleepEntries, anxietyEntries, questionnaire, darkMode } = useApp();
  const navigate = useNavigate();
  const getContextualGreeting = useContextualGreeting();
  const { particles, burst } = useParticles();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(loadChatHistory);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [mascotMood, setMascotMood] = useState<LeafMood>("idle");
  const [petCount, setPetCount] = useState(0);
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleText, setBubbleText] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bubbleTimeout = useRef<ReturnType<typeof setTimeout>>();
  const petTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Sound toggle
  useEffect(() => { sounds.enabled = soundEnabled; }, [soundEnabled]);

  // ─── Persist chat history to localStorage ───
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages);
    }
  }, [messages]);

  // ─── Navigation handler for in-chat links ───
  const handleChatNavigate = useCallback((path: string) => {
    if (path === "__breathing__") {
      // Open the breathing widget via custom event
      setIsOpen(false);
      setMascotMood("idle");
      sounds.close();
      setTimeout(() => document.dispatchEvent(new Event("open-breathing")), 300);
    } else {
      setIsOpen(false);
      setMascotMood("idle");
      sounds.close();
      setTimeout(() => navigate(path), 300);
    }
  }, [navigate]);

  // ─── Clear chat history ───
  const handleClearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
    syncToServer(CHAT_STORAGE_KEY, []);
    sounds.pop();
    setMascotMood("surprised");
    setTimeout(() => setMascotMood("listening"), 800);
  }, []);

  // ─── Time greeting ───
  const getTimeGreeting = useCallback(() => {
    const h = new Date().getHours();
    if (h < 6) return "Не спится? Я рядом 🌙";
    if (h < 12) return "Доброе утро! Как начинается день? ☀️";
    if (h < 18) return "Привет! Как проходит день? 🍃";
    if (h < 22) return "Добрый вечер! Время замедлиться 🌿";
    return "Уже поздно... Как ты? 🌙";
  }, []);

  // ─── Random idle bubbles with contextual awareness ───
  useEffect(() => {
    if (isOpen) return;
    const idlePhrases = [
      "Привет! 🌿", "Как ты?", "Поболтаем? 💚", "Я тут!", "🍃",
      "Подышим?", "Всё ок?", "Обними себя 🤗", "Ты молодец 🌱", "Потянись! 🌸",
    ];
    const showRandomBubble = () => {
      if (Math.random() > 0.35) return;
      // Try contextual greeting first
      const ctx = getContextualGreeting();
      if (ctx && Math.random() > 0.5) {
        setBubbleText(ctx.text);
        setMascotMood(ctx.mood);
      } else {
        const phrase = idlePhrases[Math.floor(Math.random() * idlePhrases.length)];
        setBubbleText(phrase);
        setMascotMood("waving");
      }
      setShowBubble(true);
      sounds.pop();
      bubbleTimeout.current = setTimeout(() => {
        setShowBubble(false);
        setMascotMood("idle");
      }, 3500);
    };
    const interval = setInterval(showRandomBubble, 20000 + Math.random() * 20000);
    return () => {
      clearInterval(interval);
      if (bubbleTimeout.current) clearTimeout(bubbleTimeout.current);
    };
  }, [isOpen, getContextualGreeting]);

  // ─── Time-based mood ───
  useEffect(() => {
    if (isOpen) return;
    const h = new Date().getHours();
    if (h >= 23 || h < 6) setMascotMood("sleeping");
    else setMascotMood("idle");
  }, [isOpen]);

  // ─── Auto-scroll (on messages change AND on chat open) ───
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // ─── Focus input + scroll to bottom when chat opens ───
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "instant" as ScrollBehavior });
        }
      }, 400);
    }
  }, [isOpen]);

  // ─── Pet interaction with escalating reactions ───
  const handlePet = useCallback(() => {
    if (isOpen) return;
    const count = petCount + 1;
    setPetCount(count);
    sounds.pet();
    
    if (count >= 7) {
      setMascotMood("love");
      setBubbleText("Я тебя обожаю!! 💚✨🌿");
      burst("heart", 8);
      sounds.love();
    } else if (count >= 5) {
      setMascotMood("love");
      setBubbleText("Мне так хорошо с тобой! 💚");
      burst("heart", 5);
    } else if (count >= 3) {
      setMascotMood("happy");
      setBubbleText("Ещё-ещё! 🥰");
      burst("sparkle", 4);
    } else {
      setMascotMood("happy");
      setBubbleText(count === 1 ? "Хи-хи! 🌱" : "Щекотно! 😄");
      burst("leaf", 3);
    }
    setShowBubble(true);
    
    if (petTimeout.current) clearTimeout(petTimeout.current);
    petTimeout.current = setTimeout(() => {
      setShowBubble(false);
      setMascotMood("idle");
      setPetCount(0);
    }, 2800);
  }, [petCount, isOpen, burst]);

  // ─── Build AI context ───
  const buildContext = useCallback(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayMood = moods.find((m) => m.date === todayStr);
    const habitStreak = habits.reduce((sum, h) => sum + h.streak, 0);
    const lastSleep = sleepEntries?.[0];
    const todayAnxiety = anxietyEntries.find((a) => a.date === todayStr);
    return {
      name: questionnaire.name || profile.name,
      todayMood: todayMood ? `${todayMood.mood} (энергия ${todayMood.energy}/5)` : undefined,
      habitStreak,
      level: profile.level,
      lastSleep: lastSleep ? `${lastSleep.quality}/5 качество, ${lastSleep.hours}ч` : undefined,
      todayAnxiety: todayAnxiety ? `уровень ${todayAnxiety.level}/10, триггер: ${todayAnxiety.trigger}` : undefined,
    };
  }, [moods, habits, sleepEntries, anxietyEntries, questionnaire, profile]);

  // ─── Send message ───
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    sounds.send();

    const userMsg: ChatMessage = { id: "u" + Date.now(), role: "user", content: text.trim(), timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setMascotMood("thinking");

    try {
      const allMessages = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ff738703/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
          body: JSON.stringify({ messages: allMessages, context: buildContext() }),
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const rawReply = data.reply || "Прости, я задумался... Попробуй ещё раз 🍃";

      // Clean up any markdown/formatting artifacts the model might still produce
      const reply = rawReply
        .replace(/\*\*(.+?)\*\*/g, "$1")   // **bold**
        .replace(/\*(.+?)\*/g, "$1")       // *italic*
        .replace(/__(.+?)__/g, "$1")       // __underline__
        .replace(/_(.+?)_/g, "$1")         // _italic_
        .replace(/^#{1,6}\s+/gm, "")       // # headings
        .replace(/^[-•]\s+/gm, "")         // - bullet lists
        .replace(/^\d+\.\s+/gm, "")        // 1. numbered lists
        .replace(/```[\s\S]*?```/g, "")    // ```code blocks```
        .replace(/`(.+?)`/g, "$1")         // `inline code`
        .replace(/[«»""'']/g, "")          // all types of quotes
        .replace(/\n{3,}/g, "\n\n")        // collapse excessive newlines
        .trim();

      // Determine emotion from reply content
      let emotion: LeafMood = "happy";
      if (/сочувст|сожале|труд|тяжел|понима/i.test(reply)) emotion = "worried";
      if (/горжусь|молод|класс|замечат|супер/i.test(reply)) emotion = "proud";
      if (/подыш|дыхан|вдох|выдох/i.test(reply)) emotion = "listening";

      sounds.receive();
      burst("sparkle", 3);
      setMessages((prev) => [
        ...prev,
        { id: "a" + Date.now(), role: "assistant", content: reply, timestamp: Date.now(), emotion, navLinks: detectNavLinks(reply) },
      ]);
      setMascotMood(emotion);
      setTimeout(() => setMascotMood("listening"), 2000);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { id: "e" + Date.now(), role: "assistant", content: "Ой, что-то пошло не так... Но я всё равно рядом! Попробуй ещё раз 🌿", timestamp: Date.now(), emotion: "worried" },
      ]);
      setMascotMood("idle");
    } finally {
      setIsTyping(false);
    }
  }, [messages, buildContext, burst]);

  // ─── Quick actions ───
  const handleQuickAction = useCallback((id: string) => {
    const actionMessages: Record<string, string> = {
      breathe: "Мне нужно подышать и успокоиться",
      mood: "Расскажи, как у меня дела судя по данным?",
      journal: "Помоги мне сформулировать мысли для дневника",
      encourage: "Мне нужна поддержка прямо сейчас",
    };
    sendMessage(actionMessages[id] || "Привет!");
  }, [sendMessage]);

  // ─── Open chat ───
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setShowBubble(false);
    setMascotMood("happy");
    sounds.open();
    burst("sparkle", 4);

    if (messages.length === 0) {
      setTimeout(() => {
        const ctx = getContextualGreeting();
        const greeting = ctx
          ? `${ctx.text}\n\nЯ Листик — твой маленький компаньон. Могу поддержать, выслушать или просто побыть рядом. О чём хочешь поговорить? 🌿`
          : `${getTimeGreeting()}\n\nЯ Листик — твой маленький компаньон. Могу поддержать, выслушать или просто побыть рядом. О чём хочешь поговорить? 🌿`;
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: greeting,
          timestamp: Date.now(),
          emotion: ctx?.mood || "happy",
        }]);
        setMascotMood("listening");
      }, 350);
    } else {
      setMascotMood("listening");
    }
  }, [messages.length, getTimeGreeting, getContextualGreeting, burst]);

  // ─── Close chat ───
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setMascotMood("idle");
    sounds.close();
  }, []);

  // Hour-based icon
  const h = new Date().getHours();
  const isNight = h >= 21 || h < 6;

  // Listen for open-mascot event from FloatingDock
  useEffect(() => {
    const handler = () => handleOpen();
    document.addEventListener("open-mascot", handler);
    return () => document.removeEventListener("open-mascot", handler);
  }, [handleOpen]);

  return (
    <>
      {/* ═══ Chat bottom sheet ═══ */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 z-40"
              style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl"
              style={{ backgroundColor: t.bg, maxHeight: "65vh", boxShadow: "0 -8px 30px rgba(0,0,0,0.15)" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  handleClose();
                }
              }}
            >
            {/* Handle */}
            <div className="flex justify-center pt-2 pb-0.5">
              <div className="w-8 h-1 rounded-full" style={{ backgroundColor: t.border }} />
            </div>
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 pt-1 pb-2"
              style={{ borderBottom: `1px solid ${t.border}` }}>
              <motion.div
                className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm"
                style={{
                  background: darkMode
                    ? "radial-gradient(circle at 35% 35%, #3A6B45, #2D5038)"
                    : "radial-gradient(circle at 35% 35%, #D4F0DA, #8DB596)",
                }}
                animate={{ rotate: [0, 3, -3, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <LeafCharacter mood={mascotMood} size={26} darkMode={darkMode} />
              </motion.div>
              <div className="flex-1">
                <p style={{ fontSize: "0.85rem", fontWeight: 700, color: t.text }}>
                  Листик
                </p>
                <div className="flex items-center gap-1.5">
                  <motion.div className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "#8DB596" }}
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity }} />
                  <span style={{ fontSize: "0.62rem", color: t.textMuted }}>
                    {isTyping ? "печатает..." : "всегда рядом"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 1 && (
                  <motion.button
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: t.bgSecondary }}
                    onClick={handleClearHistory}
                    whileTap={{ scale: 0.88 }}
                    title="Очистить историю"
                  >
                    <Trash2 className="w-3.5 h-3.5" style={{ color: t.textFaint }} />
                  </motion.button>
                )}
                <motion.button
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: t.bgSecondary }}
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  whileTap={{ scale: 0.88 }}
                >
                  {soundEnabled
                    ? <Volume2 className="w-3.5 h-3.5" style={{ color: t.textMuted }} />
                    : <VolumeX className="w-3.5 h-3.5" style={{ color: t.textFaint }} />}
                </motion.button>
                <motion.button
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: t.bgSecondary }}
                  onClick={handleClose}
                  whileTap={{ scale: 0.88 }}
                >
                  <X className="w-4 h-4" style={{ color: t.textMuted }} />
                </motion.button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg, i) => (
                <ChatBubble key={msg.id} msg={msg} t={t} isLast={i === messages.length - 1} onNavigate={handleChatNavigate} />
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div className="flex items-center gap-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <motion.div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "radial-gradient(circle, #D4F0DA, #8DB596)" }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <LeafCharacter mood="thinking" size={20} darkMode={darkMode} />
                  </motion.div>
                  <div className="rounded-2xl" style={{ backgroundColor: t.bgSecondary, borderBottomLeftRadius: 4, border: `1px solid ${t.border}` }}>
                    <TypingDots />
                  </div>
                </motion.div>
              )}

              {/* Quick actions — compact horizontal */}
              {messages.length <= 1 && !isTyping && (
                <motion.div className="pt-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, type: "spring" }}>
                  <div className="flex gap-1.5 flex-wrap">
                    {quickActions.map((action, i) => (
                      <motion.button key={action.id}
                        className="rounded-full px-3 py-1.5 border flex items-center gap-1.5"
                        style={{
                          backgroundColor: action.color + "0A",
                          borderColor: action.color + "25",
                        }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.06 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => handleQuickAction(action.id)}>
                        <span style={{ fontSize: "0.75rem" }}>{action.emoji}</span>
                        <span style={{ fontSize: "0.68rem", fontWeight: 500, color: t.textSecondary }}>{action.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input area */}
            <div className="px-3 py-2.5" style={{ borderTop: `1px solid ${t.border}` }}>
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => {
                    // Controlled scroll to input — prevent keyboard-triggered layout jumps
                    requestAnimationFrame(() => {
                      inputRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="Напиши Листику..."
                  className="flex-1 rounded-xl px-3.5 py-2 border outline-none focus:ring-2 focus:ring-[#8DB59640]"
                  style={{ fontSize: "0.82rem", backgroundColor: t.inputBg, borderColor: t.border, color: t.text }}
                />
                <motion.button
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: input.trim() ? "#8DB596" : t.bgSecondary,
                    transition: "background-color 0.2s",
                  }}
                  whileTap={{ scale: 0.88, rotate: -10 }}
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isTyping}
                >
                  <Send className="w-3.5 h-3.5" style={{ color: input.trim() ? "#fff" : t.textFaint }} />
                </motion.button>
              </div>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── localStorage persistence ───

const CHAT_STORAGE_KEY = "leaf_chat_history";
const CHAT_MAX_STORED = 100;

function loadChatHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-CHAT_MAX_STORED);
  } catch {
    return [];
  }
}

function saveChatHistory(messages: ChatMessage[]) {
  try {
    const trimmed = messages.slice(-CHAT_MAX_STORED);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(trimmed));
    // Also sync to Supabase for backup/restore across devices
    syncToServer(CHAT_STORAGE_KEY, trimmed);
  } catch { /* quota exceeded — silently ignore */ }
}

// ─── Navigation links detection ───

interface NavLink {
  label: string;
  path: string;
  emoji: string;
  color: string;
}

const NAV_PATTERNS: { pattern: RegExp; link: NavLink }[] = [
  { pattern: /подыш|дыхан|вдох|выдох|дышать|breath/i, link: { label: "Дыхание", path: "__breathing__", emoji: "🌬️", color: "#7EA8BE" } },
  { pattern: /дневник|запис|journal|мысл[иь] записать/i, link: { label: "Дневник", path: "/app/journal", emoji: "📝", color: "#9B8EC4" } },
  { pattern: /заземл|grounding|5.?4.?3.?2.?1/i, link: { label: "Заземление 5-4-3-2-1", path: "/app/app/anxiety/grounding", emoji: "🌍", color: "#7BAFB0" } },
  { pattern: /тревог|тревож|anxiety|беспокой/i, link: { label: "Трекер тревоги", path: "/app/anxiety", emoji: "📊", color: "#C4876C" } },
  { pattern: /настроен|mood|чувств/i, link: { label: "Настроение", path: "/app/mood", emoji: "😊", color: "#B88FA7" } },
  { pattern: /SOS|экстренн|крити[чк]/i, link: { label: "SOS-карточка", path: "/app/sos", emoji: "🆘", color: "#E88A8A" } },
  { pattern: /привыч|habit|рутин/i, link: { label: "Привычки", path: "/app/habits", emoji: "🔄", color: "#8DB596" } },
  { pattern: /расслаб|мышеч|PMR|релаксац/i, link: { label: "Релаксация", path: "/app/pmr", emoji: "🧘", color: "#9B8EC4" } },
  { pattern: /сон|sleep|спать|уснуть|бессонниц/i, link: { label: "Трекер сна", path: "/app/sleep", emoji: "🌙", color: "#7EA8BE" } },
  { pattern: /worry|беспокойств|когнитив|CBT/i, link: { label: "Worry Journal", path: "/app/worry", emoji: "🧠", color: "#C4A86C" } },
  { pattern: /bingo|self.?care|забот.*себ/i, link: { label: "Self-Care Bingo", path: "/app/bingo", emoji: "🎯", color: "#B88FA7" } },
  { pattern: /колесо жизни|life.?wheel|баланс/i, link: { label: "Колесо жизни", path: "/app/lifewheel", emoji: "🎡", color: "#7BAFB0" } },
  { pattern: /челлендж|challenge|30.?дн|мягкост/i, link: { label: "30-дневный челлендж", path: "/app/challenge", emoji: "🌸", color: "#C4876C" } },
  { pattern: /капсул|capsul|письмо.?буду|будущ/i, link: { label: "Капсула времени", path: "/app/capsule", emoji: "💌", color: "#B88FA7" } },
  { pattern: /skill.?tree|дерево.?навык|ветк|RPG|прокач/i, link: { label: "Дерево навыков", path: "/app/skills", emoji: "🌳", color: "#8DB596" } },
];

function detectNavLinks(text: string): NavLink[] {
  const found: NavLink[] = [];
  const seenPaths = new Set<string>();
  for (const { pattern, link } of NAV_PATTERNS) {
    if (pattern.test(text) && !seenPaths.has(link.path)) {
      found.push(link);
      seenPaths.add(link.path);
    }
  }
  return found.slice(0, 3); // max 3 links per message
}