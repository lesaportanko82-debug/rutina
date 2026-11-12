import { useState } from "react";
import { useApp } from "../app-context";
import { useTheme } from "../theme";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X, Trash2, Brain } from "lucide-react";
import { GlassPanel } from "../ambient-elements";
import { AppIcon } from "../app-icon";

const moodTags = ["😊 Хорошо", "😌 Спокойно", "🤔 Задумчиво", "😔 Грустно", "✨ Вдохновлённо", "😴 Устало"];

const distortionOptions = [
  { id: "catastrophizing", name: "Катастрофизация", icon: "🌪️" },
  { id: "black_white", name: "Чёрно-белое мышление", icon: "⬛" },
  { id: "mind_reading", name: "Чтение мыслей", icon: "🔮" },
  { id: "fortune_telling", name: "Предсказание будущего", icon: "🔭" },
  { id: "emotional_reasoning", name: "Эмоциональное мышление", icon: "💭" },
  { id: "should_statements", name: "Долженствование", icon: "📜" },
  { id: "labeling", name: "Навешивание ярлыков", icon: "🏷️" },
  { id: "personalization", name: "Персонализация", icon: "🪞" },
];

export function JournalPage() {
  const { journalEntries, addJournalEntry, deleteJournalEntry, addCogDistortionTag, cogDistortionTags, darkMode } = useApp();
  const t = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [mood, setMood] = useState("");
  const [selectedDistortions, setSelectedDistortions] = useState<string[]>([]);
  const [showDistortions, setShowDistortions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleSave = () => {
    if (!text.trim()) return;
    addJournalEntry(text.trim(), mood || undefined);
    // Link distortions to this journal entry
    const entryId = "j" + Date.now(); // approximate id
    for (const d of selectedDistortions) {
      addCogDistortionTag(d, entryId, text.trim().slice(0, 100));
    }
    setText("");
    setMood("");
    setSelectedDistortions([]);
    setShowDistortions(false);
    setShowForm(false);
  };

  const toggleDistortion = (id: string) => {
    setSelectedDistortions((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);
  };

  // Get distortions linked to a journal entry
  const getEntryDistortions = (entryId: string) => {
    return cogDistortionTags.filter((t) => t.journalEntryId === entryId);
  };

  return (
    <div className="px-5 pt-14 pb-8">
      <div className="flex items-center justify-between mb-2">
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: t.text }}>
          Дневник
        </h1>
        <motion.button
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
          style={{ backgroundColor: t.sage }}
          onClick={() => setShowForm(!showForm)}
          whileTap={{ scale: 0.9 }}
        >
          {showForm ? <X className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
        </motion.button>
      </div>
      <p style={{ fontSize: "0.78rem", color: t.textMuted, marginBottom: 16 }}>
        Запишите мысли, чувства, всё что хочется сохранить
      </p>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlassPanel darkMode={darkMode} color={t.sage} className="rounded-2xl p-4 mb-5">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Что у вас на душе?..."
                className="w-full rounded-xl px-4 py-3 border outline-none resize-none"
                style={{ fontSize: "0.9rem", backgroundColor: t.inputBg, borderColor: t.borderLight, color: t.text }}
                rows={4}
              />
              <div className="mt-3 mb-3">
                <p style={{ fontSize: "0.75rem", fontWeight: 500, color: t.textMuted, marginBottom: 8 }}>
                  Как вы себя чувствуете?
                </p>
                <div className="flex flex-wrap gap-2">
                  {moodTags.map((m) => (
                    <button
                      key={m}
                      className="px-3 py-1.5 rounded-full border transition-all"
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        borderColor: mood === m ? t.sage : t.borderLight,
                        backgroundColor: mood === m ? t.sage + "18" : t.inputBg,
                        color: mood === m ? t.sage : t.textMuted,
                      }}
                      onClick={() => setMood(mood === m ? "" : m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3 mb-3">
                <p style={{ fontSize: "0.75rem", fontWeight: 500, color: t.textMuted, marginBottom: 8 }}>
                  Распознайте когнитивные искажения
                </p>
                <div className="flex flex-wrap gap-2">
                  {distortionOptions.map((d) => (
                    <button
                      key={d.id}
                      className="px-3 py-1.5 rounded-full border transition-all"
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        borderColor: selectedDistortions.includes(d.id) ? t.sage : t.borderLight,
                        backgroundColor: selectedDistortions.includes(d.id) ? t.sage + "18" : t.inputBg,
                        color: selectedDistortions.includes(d.id) ? t.sage : t.textMuted,
                      }}
                      onClick={() => toggleDistortion(d.id)}
                    >
                      <AppIcon icon={d.icon} size={12} color={selectedDistortions.includes(d.id) ? t.sage : t.textMuted} /> {d.name}
                    </button>
                  ))}
                </div>
              </div>
              <motion.button
                className="w-full text-white rounded-xl py-3"
                style={{ fontSize: "0.9rem", fontWeight: 600, backgroundColor: t.sage }}
                onClick={handleSave}
                whileTap={{ scale: 0.98 }}
              >
                Сохранить
              </motion.button>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {journalEntries.map((entry, i) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <GlassPanel darkMode={darkMode} color={entry.mood ? t.lavender : t.dustyBlue} className="rounded-2xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: "0.7rem", color: t.textFaint }}>
                    {new Date(entry.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {entry.mood && (
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{ fontSize: "0.65rem", backgroundColor: t.bgSecondary, color: t.textMuted }}
                    >
                      {entry.mood}
                    </span>
                  )}
                </div>
                {confirmDelete === entry.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      className="px-2 py-1 rounded-lg text-white"
                      style={{ fontSize: "0.65rem", backgroundColor: t.terracotta }}
                      onClick={() => { deleteJournalEntry(entry.id); setConfirmDelete(null); }}
                    >
                      Удалить
                    </button>
                    <button
                      className="px-2 py-1 rounded-lg"
                      style={{ fontSize: "0.65rem", backgroundColor: t.bgSecondary, color: t.textMuted }}
                      onClick={() => setConfirmDelete(null)}
                    >
                      Нет
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(entry.id)}>
                    <Trash2 className="w-3.5 h-3.5" style={{ color: t.textFaint }} />
                  </button>
                )}
              </div>
              <p style={{ fontSize: "0.85rem", color: t.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {entry.text}
              </p>
              {getEntryDistortions(entry.id).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {getEntryDistortions(entry.id).map((tag) => {
                    const def = distortionOptions.find((d) => d.id === tag.distortion);
                    return (
                      <span key={tag.id} className="px-2 py-0.5 rounded-full"
                        style={{ fontSize: "0.6rem", fontWeight: 500, backgroundColor: t.lavender + "12", color: t.lavender }}>
                        {def?.icon || "🧠"} {def?.name || tag.distortion}
                      </span>
                    );
                  })}
                </div>
              )}
            </GlassPanel>
          </motion.div>
        ))}
      </div>

      {journalEntries.length === 0 && !showForm && (
        <div className="text-center py-12">
          <span style={{ fontSize: "2.5rem" }}>📓</span>
          <p style={{ fontSize: "0.9rem", color: t.textMuted, marginTop: 8 }}>
            Ваш дневник пока пуст
          </p>
          <p style={{ fontSize: "0.78rem", color: t.textFaint, marginTop: 4 }}>
            Запишите первую мысль — она может стать началом чего-то важного
          </p>
        </div>
      )}
    </div>
  );
}