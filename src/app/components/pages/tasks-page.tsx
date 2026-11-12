import { useState, useRef } from "react";
import { useApp } from "../app-context";
import { useTheme } from "../theme";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, CheckCircle2, Circle, ChevronDown, ChevronUp, Trash2, Repeat, X, Edit3,
} from "lucide-react";
import { InlineTip } from "../feature-tour";
import { GlassPanel } from "../ambient-elements";

const categoryLabels: Record<string, { label: string; color: string; bg: string }> = {
  work: { label: "Работа", color: "#7EA8BE", bg: "#EEF3F6" },
  personal: { label: "Личное", color: "#9B8EC4", bg: "#F2EFF8" },
  health: { label: "Здоровье", color: "#8DB596", bg: "#EDF5EF" },
  study: { label: "Учёба", color: "#C4A86C", bg: "#F8F3EA" },
};

const priorityLabels: Record<string, { label: string; color: string }> = {
  high: { label: "Важно", color: "#C4876C" },
  medium: { label: "Средне", color: "#C4A86C" },
  low: { label: "Спокойно", color: "#8DB596" },
};

export function TasksPage() {
  const { tasks, toggleTask, toggleSubtask, addTask, updateTask, deleteTask, addSubtask, deleteSubtask, seenTips, dismissTip, darkMode } = useApp();
  const t = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [newSubtaskText, setNewSubtaskText] = useState("");
  const [addingSubtaskFor, setAddingSubtaskFor] = useState<string | null>(null);

  // Add form state
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<"work" | "personal" | "health" | "study">("personal");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium");
  const [newRecurring, setNewRecurring] = useState<"" | "daily" | "weekly" | "monthly">("");

  // Swipe state
  const touchStartX = useRef(0);
  const [swipedId, setSwipedId] = useState<string | null>(null);

  const filtered = tasks.filter((tk) => {
    if (filter === "active") return !tk.completed;
    if (filter === "done") return tk.completed;
    return true;
  });

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addTask({ title: newTitle.trim(), category: newCategory, priority: newPriority, recurring: newRecurring || undefined });
    setNewTitle("");
    setShowForm(false);
  };

  const handleStartEdit = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  const handleSaveEdit = (id: string) => {
    if (editTitle.trim()) updateTask(id, { title: editTitle.trim() });
    setEditingId(null);
  };

  const handleAddSubtask = (taskId: string) => {
    if (!newSubtaskText.trim()) return;
    addSubtask(taskId, newSubtaskText.trim());
    setNewSubtaskText("");
    setAddingSubtaskFor(null);
  };

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    touchStartX.current = e.touches[0].clientX;
    setSwipedId(null);
  };

  const handleTouchEnd = (e: React.TouchEvent, id: string) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff > 80) {
      const task = tasks.find((tk) => tk.id === id);
      if (task && !task.completed) toggleTask(id);
    } else if (diff < -80) {
      setSwipedId(id);
    }
  };

  return (
    <div className="px-5 pt-14 pb-8">
      <div className="flex items-center justify-between mb-2">
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: t.text }}>
          Ваши дела
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
      <p style={{ fontSize: "0.78rem", color: t.textMuted, marginBottom: 12 }}>
        Свайп → для выполнения, ← для удаления
      </p>

      {/* Inline tip */}
      <InlineTip
        tipKey="tip-tasks-priority"
        text="Цветная полоска слева — приоритет: красная = важно, жёлтая = средне, зелёная = спокойно. Нажмите ▼ чтобы изменить."
        emoji="🎨"
        seenTips={seenTips}
        onDismiss={dismissTip}
        color="#7EA8BE"
      />

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlassPanel darkMode={darkMode} color={t.sage} className="rounded-2xl p-4 mb-5">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Что хотите сделать?..."
                className="w-full rounded-xl px-4 py-3 border outline-none"
                style={{ fontSize: "0.9rem", backgroundColor: t.inputBg, borderColor: t.borderLight, color: t.text }}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <div className="flex flex-wrap gap-2 mt-3 mb-3">
                {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map((cat) => (
                  <button
                    key={cat}
                    className="px-3 py-1.5 rounded-full border transition-all"
                    style={{
                      fontSize: "0.75rem", fontWeight: 500,
                      borderColor: newCategory === cat ? categoryLabels[cat].color : t.borderLight,
                      backgroundColor: newCategory === cat ? categoryLabels[cat].bg : t.inputBg,
                      color: newCategory === cat ? categoryLabels[cat].color : t.textMuted,
                    }}
                    onClick={() => setNewCategory(cat as any)}
                  >
                    {categoryLabels[cat].label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {(Object.keys(priorityLabels) as Array<keyof typeof priorityLabels>).map((p) => (
                  <button
                    key={p}
                    className="px-3 py-1.5 rounded-full border transition-all"
                    style={{
                      fontSize: "0.75rem", fontWeight: 500,
                      borderColor: newPriority === p ? priorityLabels[p].color : t.borderLight,
                      backgroundColor: t.inputBg,
                      color: newPriority === p ? priorityLabels[p].color : t.textMuted,
                    }}
                    onClick={() => setNewPriority(p as any)}
                  >
                    {priorityLabels[p].label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  { val: "", label: "Однократно" },
                  { val: "daily", label: "🔄 Ежедневно" },
                  { val: "weekly", label: "🔄 Еженедельно" },
                  { val: "monthly", label: "🔄 Ежемесячно" },
                ].map((r) => (
                  <button
                    key={r.val}
                    className="px-3 py-1.5 rounded-full border transition-all"
                    style={{
                      fontSize: "0.75rem", fontWeight: 500,
                      borderColor: newRecurring === r.val ? t.sage : t.borderLight,
                      backgroundColor: t.inputBg,
                      color: newRecurring === r.val ? "#6B8F71" : t.textMuted,
                    }}
                    onClick={() => setNewRecurring(r.val as any)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <motion.button
                className="w-full text-white rounded-xl py-3"
                style={{ fontSize: "0.9rem", fontWeight: 600, backgroundColor: t.sage }}
                onClick={handleAdd}
                whileTap={{ scale: 0.98 }}
              >
                Добавить
              </motion.button>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {([
          { key: "all", label: "Все" },
          { key: "active", label: "Активные" },
          { key: "done", label: "Готово" },
        ] as const).map((f) => (
          <button
            key={f.key}
            className="px-4 py-2 rounded-full transition-all"
            style={{
              fontSize: "0.8rem", fontWeight: 500,
              backgroundColor: filter === f.key ? t.sage : t.bgTertiary,
              color: filter === f.key ? "#fff" : t.textMuted,
            }}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tasks list */}
      <div className="space-y-2.5">
        <AnimatePresence>
          {filtered.map((task) => {
            const cat = categoryLabels[task.category];
            const isExpanded = expanded === task.id;
            const isSwiped = swipedId === task.id;
            const subProgress =
              task.subtasks.length > 0
                ? task.subtasks.filter((s) => s.completed).length / task.subtasks.length
                : 0;

            return (
              <motion.div
                key={task.id}
                className="rounded-2xl overflow-hidden relative"
                style={{
                  background: darkMode
                    ? "linear-gradient(135deg, rgba(36,34,32,0.7), rgba(36,34,32,0.4))"
                    : "linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.35))",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.55)"}`,
                  boxShadow: darkMode
                    ? "0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)"
                    : "0 4px 16px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.7)",
                }}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
              >
                {/* Swipe delete overlay */}
                {isSwiped && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-end pr-4 z-10"
                    style={{ backgroundColor: t.terracotta + "20" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-2 rounded-xl text-white"
                        style={{ fontSize: "0.75rem", fontWeight: 600, backgroundColor: t.terracotta }}
                        onClick={() => { deleteTask(task.id); setSwipedId(null); }}
                      >
                        Удалить
                      </button>
                      <button
                        className="px-3 py-2 rounded-xl"
                        style={{ fontSize: "0.75rem", fontWeight: 600, backgroundColor: t.bgSecondary, color: t.textMuted }}
                        onClick={() => setSwipedId(null)}
                      >
                        Отмена
                      </button>
                    </div>
                  </motion.div>
                )}

                <div
                  className="p-4"
                  onTouchStart={(e) => handleTouchStart(e, task.id)}
                  onTouchEnd={(e) => handleTouchEnd(e, task.id)}
                >
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleTask(task.id)} className="mt-0.5">
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5" style={{ color: t.sage }} />
                      ) : (
                        <Circle className="w-5 h-5" style={{ color: t.textFaint }} />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      {editingId === task.id ? (
                        <div className="flex gap-2">
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="flex-1 rounded-lg px-2 py-1 border outline-none"
                            style={{ fontSize: "0.85rem", backgroundColor: t.inputBg, borderColor: t.borderLight, color: t.text }}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(task.id)}
                            autoFocus
                          />
                          <button
                            className="px-3 py-1 rounded-lg text-white"
                            style={{ fontSize: "0.75rem", backgroundColor: t.sage }}
                            onClick={() => handleSaveEdit(task.id)}
                          >
                            ✓
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            style={{
                              fontSize: "0.9rem", fontWeight: 500,
                              color: task.completed ? t.textFaint : t.text,
                              textDecoration: task.completed ? "line-through" : "none",
                            }}
                          >
                            {task.title}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: cat.bg, color: cat.color, fontSize: "0.65rem", fontWeight: 500 }}
                        >
                          {cat.label}
                        </span>
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: priorityLabels[task.priority].color, opacity: 0.7 }}
                        />
                        {task.recurring && (
                          <span className="flex items-center gap-0.5" style={{ fontSize: "0.65rem", color: t.textMuted }}>
                            <Repeat className="w-3 h-3" />
                            {task.recurring === "daily" ? "Ежедневно" : task.recurring === "weekly" ? "Еженедельно" : "Ежемесячно"}
                          </span>
                        )}
                      </div>
                      {task.subtasks.length > 0 && (
                        <div className="mt-2">
                          <div className="w-full rounded-full h-1.5" style={{ backgroundColor: t.border }}>
                            <div
                              className="h-1.5 rounded-full transition-all"
                              style={{ width: `${subProgress * 100}%`, backgroundColor: t.sage }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {editingId !== task.id && (
                        <button onClick={() => handleStartEdit(task.id, task.title)}>
                          <Edit3 className="w-3.5 h-3.5" style={{ color: t.textFaint }} />
                        </button>
                      )}
                      <button onClick={() => setExpanded(isExpanded ? null : task.id)}>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" style={{ color: t.textFaint }} />
                        ) : (
                          <ChevronDown className="w-4 h-4" style={{ color: t.textFaint }} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      className="px-4 pb-3"
                      style={{ borderTop: `1px solid ${t.bgTertiary}` }}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="pt-3 space-y-2 pl-8">
                        {task.subtasks.map((sub) => (
                          <div key={sub.id} className="flex items-center gap-2.5">
                            <button
                              className="flex items-center gap-2.5 flex-1 text-left"
                              onClick={() => toggleSubtask(task.id, sub.id)}
                            >
                              {sub.completed ? (
                                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: t.sage }} />
                              ) : (
                                <Circle className="w-4 h-4 shrink-0" style={{ color: t.textFaint }} />
                              )}
                              <span
                                style={{
                                  fontSize: "0.8rem",
                                  color: sub.completed ? t.textFaint : t.textSecondary,
                                  textDecoration: sub.completed ? "line-through" : "none",
                                }}
                              >
                                {sub.title}
                              </span>
                            </button>
                            <button onClick={() => deleteSubtask(task.id, sub.id)}>
                              <X className="w-3.5 h-3.5" style={{ color: t.textFaint }} />
                            </button>
                          </div>
                        ))}
                        {/* Add subtask */}
                        {addingSubtaskFor === task.id ? (
                          <div className="flex gap-2 mt-1">
                            <input
                              value={newSubtaskText}
                              onChange={(e) => setNewSubtaskText(e.target.value)}
                              placeholder="Новая подзадача..."
                              className="flex-1 rounded-lg px-3 py-1.5 border outline-none"
                              style={{ fontSize: "0.78rem", backgroundColor: t.inputBg, borderColor: t.borderLight, color: t.text }}
                              onKeyDown={(e) => e.key === "Enter" && handleAddSubtask(task.id)}
                              autoFocus
                            />
                            <button
                              className="px-2 py-1 rounded-lg text-white"
                              style={{ fontSize: "0.7rem", backgroundColor: t.sage }}
                              onClick={() => handleAddSubtask(task.id)}
                            >
                              +
                            </button>
                            <button
                              className="px-2 py-1 rounded-lg"
                              style={{ fontSize: "0.7rem", backgroundColor: t.bgSecondary, color: t.textMuted }}
                              onClick={() => { setAddingSubtaskFor(null); setNewSubtaskText(""); }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            className="flex items-center gap-1.5 mt-1"
                            style={{ fontSize: "0.75rem", color: t.sage }}
                            onClick={() => setAddingSubtaskFor(task.id)}
                          >
                            <Plus className="w-3.5 h-3.5" /> Подзадача
                          </button>
                        )}
                        {/* Category/Priority edit */}
                        <div className="flex flex-wrap gap-1.5 mt-2 pt-2" style={{ borderTop: `1px solid ${t.border}` }}>
                          {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map((cat) => (
                            <button
                              key={cat}
                              className="px-2 py-1 rounded-full"
                              style={{
                                fontSize: "0.6rem",
                                backgroundColor: task.category === cat ? categoryLabels[cat].bg : t.bgSecondary,
                                color: task.category === cat ? categoryLabels[cat].color : t.textFaint,
                              }}
                              onClick={() => updateTask(task.id, { category: cat as any })}
                            >
                              {categoryLabels[cat].label}
                            </button>
                          ))}
                          <span style={{ fontSize: "0.6rem", color: t.textFaint, padding: "4px 0" }}>|</span>
                          {(Object.keys(priorityLabels) as Array<keyof typeof priorityLabels>).map((p) => (
                            <button
                              key={p}
                              className="px-2 py-1 rounded-full"
                              style={{
                                fontSize: "0.6rem",
                                backgroundColor: task.priority === p ? priorityLabels[p].color + "18" : t.bgSecondary,
                                color: task.priority === p ? priorityLabels[p].color : t.textFaint,
                              }}
                              onClick={() => updateTask(task.id, { priority: p as any })}
                            >
                              {priorityLabels[p].label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <span style={{ fontSize: "2.5rem" }}>🌿</span>
          <p style={{ fontSize: "0.9rem", color: t.textMuted, marginTop: 8 }}>
            Здесь пока тихо и спокойно
          </p>
          <p style={{ fontSize: "0.78rem", color: t.textFaint, marginTop: 4 }}>
            Добавьте дело, когда будете готовы
          </p>
        </div>
      )}
    </div>
  );
}