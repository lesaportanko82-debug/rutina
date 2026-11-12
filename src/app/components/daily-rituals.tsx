import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sunrise, Moon, Check, Sparkles, Edit3, X } from "lucide-react";
import { useTheme } from "./theme";

interface MorningIntentionProps {
  todayIntention: { text: string } | null;
  onSave: (text: string) => void;
}

const intentionSuggestions = [
  "Быть спокойнее",
  "Замечать хорошее",
  "Не торопиться",
  "Быть добрее к себе",
  "Слушать своё тело",
  "Делать паузы",
  "Быть в моменте",
  "Радоваться мелочам",
];

export function MorningIntention({ todayIntention, onSave }: MorningIntentionProps) {
  const th = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(todayIntention?.text || "");

  const handleSave = () => {
    if (text.trim()) {
      onSave(text.trim());
      setIsEditing(false);
    }
  };

  if (todayIntention && !isEditing) {
    return (
      <motion.div
        className="rounded-2xl p-4 border"
        style={{
          background: `linear-gradient(135deg, ${th.gold}08, ${th.warm}08)`,
          borderColor: th.gold + "25",
        }}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sunrise className="w-4 h-4" style={{ color: th.gold }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: th.textMuted }}>
              Намерение дня
            </span>
          </div>
          <button
            onClick={() => { setText(todayIntention.text); setIsEditing(true); }}
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: th.border + "60" }}
          >
            <Edit3 className="w-3 h-3" style={{ color: th.textMuted }} />
          </button>
        </div>
        <p style={{ fontSize: "0.88rem", fontWeight: 500, color: th.text, fontStyle: "italic" }}>
          «{todayIntention.text}»
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="rounded-2xl p-4 border"
      style={{
        background: `linear-gradient(135deg, ${th.gold}08, ${th.warm}08)`,
        borderColor: th.gold + "25",
      }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sunrise className="w-4 h-4" style={{ color: th.gold }} />
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: th.text }}>
          Какое намерение на сегодня?
        </span>
      </div>
      <p style={{ fontSize: "0.7rem", color: th.textMuted, marginBottom: 10 }}>
        Не задача, а состояние. Как вы хотите себя чувствовать?
      </p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {intentionSuggestions.map((s) => (
          <button
            key={s}
            className="px-2.5 py-1 rounded-full border"
            style={{
              fontSize: "0.68rem",
              fontWeight: 500,
              borderColor: text === s ? th.gold + "50" : th.border,
              backgroundColor: text === s ? th.gold + "12" : "transparent",
              color: text === s ? th.gold : th.textMuted,
            }}
            onClick={() => setText(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Или введите своё..."
          className="flex-1 rounded-xl px-3 py-2.5 border outline-none"
          style={{
            fontSize: "0.8rem",
            backgroundColor: th.inputBg,
            borderColor: th.border,
            color: th.text,
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
        <motion.button
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            backgroundColor: text.trim() ? th.gold : th.border,
          }}
          onClick={handleSave}
          whileTap={{ scale: 0.9 }}
          disabled={!text.trim()}
        >
          <Check className="w-4.5 h-4.5 text-white" />
        </motion.button>
      </div>

      {isEditing && (
        <button
          className="mt-2 w-full text-center py-1"
          style={{ fontSize: "0.72rem", color: th.textFaint }}
          onClick={() => setIsEditing(false)}
        >
          Отмена
        </button>
      )}
    </motion.div>
  );
}

// ──────────────────────────────────────────

interface EveningCheckinProps {
  todayCheckin: { good: string; hard: string; word: string } | null;
  onSave: (good: string, hard: string, word: string) => void;
}

const wordSuggestions = [
  "Спокойно", "Продуктивно", "Тяжело", "Радостно",
  "Нежно", "Суетно", "Ровно", "Тепло",
];

export function EveningCheckin({ todayCheckin, onSave }: EveningCheckinProps) {
  const th = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [good, setGood] = useState("");
  const [hard, setHard] = useState("");
  const [word, setWord] = useState("");

  const handleSave = () => {
    if (good.trim() || hard.trim() || word.trim()) {
      onSave(good.trim(), hard.trim(), word.trim());
      setIsOpen(false);
    }
  };

  // Already filled today
  if (todayCheckin) {
    return (
      <motion.div
        className="rounded-2xl p-4 border"
        style={{
          background: `linear-gradient(135deg, ${th.lavender}08, ${th.dustyBlue}08)`,
          borderColor: th.lavender + "20",
        }}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <Moon className="w-4 h-4" style={{ color: th.lavender }} />
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: th.textMuted }}>
            Вечерний чекин
          </span>
          <Sparkles className="w-3 h-3" style={{ color: th.gold }} />
        </div>
        {todayCheckin.good && (
          <div className="mb-2">
            <span style={{ fontSize: "0.65rem", color: th.textFaint }}>Хорошее:</span>
            <p style={{ fontSize: "0.8rem", color: th.text }}>{todayCheckin.good}</p>
          </div>
        )}
        {todayCheckin.hard && (
          <div className="mb-2">
            <span style={{ fontSize: "0.65rem", color: th.textFaint }}>Сложное:</span>
            <p style={{ fontSize: "0.8rem", color: th.text }}>{todayCheckin.hard}</p>
          </div>
        )}
        {todayCheckin.word && (
          <div className="flex items-center gap-2">
            <span style={{ fontSize: "0.65rem", color: th.textFaint }}>Одно слово:</span>
            <span
              className="px-2.5 py-0.5 rounded-full"
              style={{ fontSize: "0.75rem", fontWeight: 600, backgroundColor: th.lavender + "15", color: th.lavender }}
            >
              {todayCheckin.word}
            </span>
          </div>
        )}
      </motion.div>
    );
  }

  // Show prompt (only after 18:00)
  const hour = new Date().getHours();
  // Always show for demo, but visually indicate evening context
  const isEvening = hour >= 18 || hour < 4;

  return (
    <>
      <motion.button
        className="w-full rounded-2xl p-4 border flex items-center gap-3 text-left"
        style={{
          background: `linear-gradient(135deg, ${th.lavender}06, ${th.dustyBlue}06)`,
          borderColor: th.lavender + "20",
        }}
        onClick={() => setIsOpen(true)}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: th.lavender + "15" }}
        >
          <Moon className="w-5 h-5" style={{ color: th.lavender }} />
        </div>
        <div className="flex-1 min-w-0">
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: th.text }}>
            {isEvening ? "Как прошёл день?" : "Вечерний чекин"}
          </span>
          <p style={{ fontSize: "0.7rem", color: th.textMuted }}>
            2 минуты рефлексии для спокойного завершения дня
          </p>
        </div>
      </motion.button>

      {/* Checkin modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ backgroundColor: th.overlay }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="w-full max-w-[430px] rounded-t-3xl p-6 shadow-xl"
              style={{ backgroundColor: th.bg }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Moon className="w-5 h-5" style={{ color: th.lavender }} />
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: th.text }}>
                    Вечерний чекин
                  </h3>
                </div>
                <button
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: th.border }}
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" style={{ color: th.textMuted }} />
                </button>
              </div>

              <p style={{ fontSize: "0.75rem", color: th.textMuted, marginBottom: 16 }}>
                Не нужно много слов. Просто побудьте с этим днём.
              </p>

              {/* Good */}
              <div className="mb-4">
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: th.text, display: "block", marginBottom: 6 }}>
                  Что было хорошо сегодня? 🌸
                </label>
                <textarea
                  value={good}
                  onChange={(e) => setGood(e.target.value)}
                  placeholder="Даже мелочь считается..."
                  rows={2}
                  className="w-full rounded-xl px-3 py-2.5 border outline-none resize-none"
                  style={{ fontSize: "0.8rem", backgroundColor: th.inputBg, borderColor: th.border, color: th.text }}
                />
              </div>

              {/* Hard */}
              <div className="mb-4">
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: th.text, display: "block", marginBottom: 6 }}>
                  Что было сложно? 🌧️
                </label>
                <textarea
                  value={hard}
                  onChange={(e) => setHard(e.target.value)}
                  placeholder="Это нормально — не всё бывает легко"
                  rows={2}
                  className="w-full rounded-xl px-3 py-2.5 border outline-none resize-none"
                  style={{ fontSize: "0.8rem", backgroundColor: th.inputBg, borderColor: th.border, color: th.text }}
                />
              </div>

              {/* One word */}
              <div className="mb-5">
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: th.text, display: "block", marginBottom: 6 }}>
                  Одно слово про этот день
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {wordSuggestions.map((w) => (
                    <button
                      key={w}
                      className="px-2.5 py-1 rounded-full border"
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 500,
                        borderColor: word === w ? th.lavender + "50" : th.border,
                        backgroundColor: word === w ? th.lavender + "12" : "transparent",
                        color: word === w ? th.lavender : th.textMuted,
                      }}
                      onClick={() => setWord(w)}
                    >
                      {w}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  placeholder="Или своё слово..."
                  className="w-full rounded-xl px-3 py-2.5 border outline-none"
                  style={{ fontSize: "0.8rem", backgroundColor: th.inputBg, borderColor: th.border, color: th.text }}
                />
              </div>

              {/* Save */}
              <motion.button
                className="w-full text-white rounded-2xl py-3.5 shadow-md"
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${th.lavender}, ${th.dustyBlue})`,
                  opacity: (good.trim() || hard.trim() || word.trim()) ? 1 : 0.5,
                }}
                onClick={handleSave}
                whileTap={{ scale: 0.98 }}
                disabled={!good.trim() && !hard.trim() && !word.trim()}
              >
                Сохранить
              </motion.button>

              <p style={{ fontSize: "0.65rem", color: th.textFaint, textAlign: "center", marginTop: 8 }}>
                +10 XP за заботу о себе
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
