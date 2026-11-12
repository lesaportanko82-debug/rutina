import { useState } from "react";
import { useApp } from "../app-context";
import { useTheme } from "../theme";
import { motion, AnimatePresence } from "motion/react";
import { Bell, BellRing, Plus, Trash2, X, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";
import { GlassPanel } from "../ambient-elements";
import { AppIcon } from "../app-icon";

const dayLabels = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const typeOptions = [
  { value: "habit", label: "Привычка", icon: "🔄" },
  { value: "task", label: "Задача", icon: "📋" },
  { value: "mood", label: "Настроение", icon: "😊" },
  { value: "water", label: "Вода", icon: "💧" },
  { value: "custom", label: "Другое", icon: "✨" },
] as const;

const iconOptions = ["🧘", "📚", "💪", "💧", "📋", "😊", "🍽️", "🛏️", "🏃", "🎯", "☀️", "🌙", "⏰", "🔔", "✨", "🧠"];

export function NotificationsPage() {
  const { reminders, toggleReminder, addReminder, deleteReminder, updateReminder, darkMode } = useApp();
  const t = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>(
    "Notification" in window ? Notification.permission : "unsupported"
  );

  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("09:00");
  const [newDays, setNewDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [newType, setNewType] = useState<"habit" | "task" | "mood" | "water" | "custom">("custom");
  const [newIcon, setNewIcon] = useState("🔔");

  const requestPermission = async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      setPermissionStatus(result);
      if (result === "granted") {
        toast.success("Уведомления включены!");
      }
    }
  };

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addReminder({ title: newTitle.trim(), time: newTime, days: newDays, enabled: true, type: newType, icon: newIcon });
    resetForm();
    toast.success("Напоминание добавлено!");
  };

  const handleUpdate = () => {
    if (!editingId || !newTitle.trim()) return;
    updateReminder(editingId, { title: newTitle.trim(), time: newTime, days: newDays, type: newType, icon: newIcon });
    resetForm();
    toast.success("Обновлено!");
  };

  const resetForm = () => {
    setNewTitle(""); setNewTime("09:00"); setNewDays([1, 2, 3, 4, 5]);
    setNewType("custom"); setNewIcon("🔔"); setShowForm(false); setEditingId(null);
  };

  const startEdit = (id: string) => {
    const r = reminders.find((rem) => rem.id === id);
    if (!r) return;
    setNewTitle(r.title); setNewTime(r.time); setNewDays(r.days);
    setNewType(r.type); setNewIcon(r.icon); setEditingId(id); setShowForm(true);
  };

  const toggleDay = (day: number) => {
    setNewDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort());
  };

  const activeReminders = reminders.filter((r) => r.enabled).length;

  return (
    <div className="px-5 pt-14 pb-8">
      <div className="flex items-center justify-between mb-2">
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: t.text }}>
          Напоминания
        </h1>
        <motion.button
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
          style={{ backgroundColor: t.sage }}
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          whileTap={{ scale: 0.9 }}
        >
          {showForm ? <X className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
        </motion.button>
      </div>
      <p style={{ fontSize: "0.78rem", color: t.textMuted, marginBottom: 16 }}>
        Мягкие напоминания, чтобы не забывать о важном
      </p>

      {permissionStatus !== "granted" && permissionStatus !== "unsupported" && (
        <motion.div
          className="rounded-2xl p-4 mb-5 flex items-center gap-3 border"
          style={{ backgroundColor: t.bgSecondary, borderColor: t.border }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <BellRing className="w-5 h-5 shrink-0" style={{ color: t.gold }} />
          <div className="flex-1">
            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: t.text }}>
              Разрешите уведомления
            </span>
            <p style={{ fontSize: "0.7rem", color: t.textMuted }}>
              Чтобы получать напоминания вовремя
            </p>
          </div>
          <button
            className="px-3 py-1.5 text-white rounded-lg"
            style={{ fontSize: "0.75rem", fontWeight: 600, backgroundColor: t.gold }}
            onClick={requestPermission}
          >
            Включить
          </button>
        </motion.div>
      )}

      {/* Stats */}
      <div className="flex gap-3 mb-5">
        <GlassPanel darkMode={darkMode} color="#9B8EC4" className="flex-1 rounded-2xl">
          <div className="p-3 text-center">
          <Bell className="w-5 h-5 mx-auto mb-1" style={{ color: t.lavender }} />
          <span className="block" style={{ fontSize: "1.2rem", fontWeight: 700, color: t.text }}>{reminders.length}</span>
          <span style={{ fontSize: "0.65rem", color: t.textMuted }}>Всего</span>
          </div>
        </GlassPanel>
        <GlassPanel darkMode={darkMode} color="#8DB596" className="flex-1 rounded-2xl">
          <div className="p-3 text-center">
          <BellRing className="w-5 h-5 mx-auto mb-1" style={{ color: t.sage }} />
          <span className="block" style={{ fontSize: "1.2rem", fontWeight: 700, color: t.text }}>{activeReminders}</span>
          <span style={{ fontSize: "0.65rem", color: t.textMuted }}>Активных</span>
          </div>
        </GlassPanel>
        <GlassPanel darkMode={darkMode} color="#7EA8BE" className="flex-1 rounded-2xl">
          <div className="p-3 text-center">
          <Clock className="w-5 h-5 mx-auto mb-1" style={{ color: t.dustyBlue }} />
          <span className="block" style={{ fontSize: "1.2rem", fontWeight: 700, color: t.text }}>
            {permissionStatus === "granted" ? "Вкл" : "Выкл"}
          </span>
          <span style={{ fontSize: "0.65rem", color: t.textMuted }}>Статус</span>
          </div>
        </GlassPanel>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="rounded-2xl p-4 mb-5 border"
            style={{ backgroundColor: t.bgSecondary, borderColor: t.border }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="О чём напомнить?..."
              className="w-full rounded-xl px-4 py-3 border outline-none mb-3"
              style={{ fontSize: "0.9rem", backgroundColor: t.inputBg, borderColor: t.borderLight, color: t.text }}
            />
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-4 h-4" style={{ color: t.textFaint }} />
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="rounded-xl px-4 py-2.5 border outline-none flex-1"
                style={{ fontSize: "0.85rem", backgroundColor: t.inputBg, borderColor: t.borderLight, color: t.text }}
              />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 shrink-0" style={{ color: t.textFaint }} />
              <div className="flex gap-1.5 flex-1">
                {dayLabels.map((label, i) => (
                  <button
                    key={i}
                    className="flex-1 py-2 rounded-lg text-center transition-all"
                    style={{
                      fontSize: "0.65rem", fontWeight: 500,
                      backgroundColor: newDays.includes(i) ? t.sage : t.inputBg,
                      color: newDays.includes(i) ? "#fff" : t.textMuted,
                      border: newDays.includes(i) ? "none" : `1px solid ${t.borderLight}`,
                    }}
                    onClick={() => toggleDay(i)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              {[
                { label: "Каждый день", days: [0, 1, 2, 3, 4, 5, 6] },
                { label: "Будни", days: [1, 2, 3, 4, 5] },
                { label: "Выходные", days: [0, 6] },
              ].map((preset) => (
                <button
                  key={preset.label}
                  className="px-3 py-1.5 rounded-full border"
                  style={{ fontSize: "0.7rem", fontWeight: 500, borderColor: t.borderLight, color: t.textMuted, backgroundColor: t.inputBg }}
                  onClick={() => setNewDays(preset.days)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: "0.75rem", fontWeight: 500, color: t.textMuted, marginBottom: 8 }}>Тип</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {typeOptions.map((tItem) => (
                <button
                  key={tItem.value}
                  className="px-3 py-1.5 rounded-full border transition-all"
                  style={{
                    fontSize: "0.75rem", fontWeight: 500,
                    borderColor: newType === tItem.value ? t.sage : t.borderLight,
                    backgroundColor: newType === tItem.value ? t.sage + "18" : t.inputBg,
                    color: newType === tItem.value ? "#6B8F71" : t.textMuted,
                  }}
                  onClick={() => setNewType(tItem.value)}
                >
                  {tItem.icon} {tItem.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: "0.75rem", fontWeight: 500, color: t.textMuted, marginBottom: 8 }}>Иконка</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {iconOptions.map((ic) => (
                <button
                  key={ic}
                  className="w-9 h-9 rounded-lg flex items-center justify-center border transition-all"
                  style={{
                    borderColor: newIcon === ic ? t.sage : t.borderLight,
                    backgroundColor: newIcon === ic ? t.sage + "18" : t.inputBg,
                  }}
                  onClick={() => setNewIcon(ic)}
                >
                  <AppIcon icon={ic} size={18} />
                </button>
              ))}
            </div>
            <motion.button
              className="w-full text-white rounded-xl py-3"
              style={{ fontSize: "0.9rem", fontWeight: 600, backgroundColor: t.sage }}
              onClick={editingId ? handleUpdate : handleAdd}
              whileTap={{ scale: 0.98 }}
            >
              {editingId ? "Обновить" : "Добавить"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reminders list */}
      <div className="space-y-2.5">
        {reminders.map((reminder, i) => (
          <motion.div
            key={reminder.id}
            className="rounded-2xl p-4 border transition-all"
            style={{
              backgroundColor: reminder.enabled ? t.card : t.bgSecondary,
              borderColor: t.border,
              opacity: reminder.enabled ? 1 : 0.6,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: reminder.enabled ? 1 : 0.6, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <div className="flex items-center gap-3">
              <button
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: reminder.enabled ? t.bgSecondary : t.border }}
                onClick={() => startEdit(reminder.id)}
              >
                <AppIcon icon={reminder.icon} size={20} />
              </button>
              <div className="flex-1 min-w-0">
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: reminder.enabled ? t.text : t.textFaint }}>
                  {reminder.title}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-1" style={{ fontSize: "0.8rem", fontWeight: 600, color: t.sage }}>
                    <Clock className="w-3 h-3" />
                    {reminder.time}
                  </span>
                  <span style={{ fontSize: "0.65rem", color: t.textFaint }}>
                    {reminder.days.length === 7 ? "Каждый день"
                      : reminder.days.length === 5 && !reminder.days.includes(0) && !reminder.days.includes(6) ? "Будни"
                      : reminder.days.map((d) => dayLabels[d]).join(", ")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="w-11 h-6 rounded-full transition-colors"
                  style={{ backgroundColor: reminder.enabled ? t.sage : t.textFaint }}
                  onClick={() => toggleReminder(reminder.id)}
                >
                  <motion.div
                    className="w-5 h-5 rounded-full bg-white shadow-sm"
                    animate={{ x: reminder.enabled ? 22 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
                <button onClick={() => deleteReminder(reminder.id)}>
                  <Trash2 className="w-4 h-4 transition-colors" style={{ color: t.textFaint }} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {reminders.length === 0 && (
        <div className="text-center py-12">
          <span style={{ fontSize: "2.5rem" }}>🔔</span>
          <p style={{ fontSize: "0.9rem", color: t.textMuted, marginTop: 8 }}>Нет напоминаний</p>
          <p style={{ fontSize: "0.78rem", color: t.textFaint, marginTop: 4 }}>Добавьте первое, нажав +</p>
        </div>
      )}

      <motion.div
        className="rounded-2xl p-5 mt-6 text-white"
        style={{ background: "linear-gradient(135deg, #7B8F71, #6B917B)" }}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <BellRing className="w-5 h-5" />
          <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>Как это работает</span>
        </div>
        <div className="space-y-1.5">
          {[
            "Напоминания приходят через уведомления браузера",
            "Включите разрешения, чтобы ничего не пропустить",
            "Настройте дни и время — мы подстроимся под вас",
          ].map((text, i) => (
            <p key={i} style={{ fontSize: "0.75rem", opacity: 0.85, lineHeight: 1.4 }}>• {text}</p>
          ))}
        </div>
      </motion.div>
    </div>
  );
}