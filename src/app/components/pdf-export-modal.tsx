import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "./theme";
import { X, FileText, Calendar, CalendarDays, Infinity, BarChart3, Loader2, CheckCircle2 } from "lucide-react";
import { generatePDFReport, getPeriodCounts, type ExportData, type PdfPeriod } from "./pdf-export";

interface PdfExportModalProps {
  open: boolean;
  onClose: () => void;
  data: ExportData;
}

const periods: { id: PdfPeriod; label: string; desc: string; icon: typeof Calendar }[] = [
  { id: "week", label: "За неделю", desc: "Последние 7 дней", icon: Calendar },
  { id: "month", label: "За месяц", desc: "Последние 30 дней", icon: CalendarDays },
  { id: "all", label: "За всё время", desc: "Полный отчёт", icon: Infinity },
];

export function PdfExportModal({ open, onClose, data }: PdfExportModalProps) {
  const t = useTheme();
  const [selected, setSelected] = useState<PdfPeriod>("month");
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const counts = useMemo(() => getPeriodCounts(data), [data]);

  const sectionCounts = useMemo(() => {
    const threshold = (p: PdfPeriod) => {
      const now = new Date();
      if (p === "week") { now.setDate(now.getDate() - 7); return now; }
      if (p === "month") { now.setMonth(now.getMonth() - 1); return now; }
      return new Date(0);
    };
    const t = threshold(selected);
    const inP = (d: string) => { try { return new Date(d) >= t; } catch { return true; } };
    return {
      tasks: data.tasks.filter(x => inP(x.createdAt)).length,
      moods: data.moods.filter(x => inP(x.date)).length,
      habits: data.habits.filter(h => h.completedDates.some(d => inP(d))).length,
      journal: data.journalEntries.filter(x => inP(x.date)).length,
      anxiety: data.anxietyEntries.filter(x => inP(x.date)).length,
      sleep: (data.sleepEntries || []).filter(x => inP(x.date)).length,
    };
  }, [data, selected]);

  const handleGenerate = async () => {
    setGenerating(true);
    setDone(false);
    // Small delay to show loading state
    await new Promise(r => setTimeout(r, 300));
    try {
      generatePDFReport(data, selected);
      setDone(true);
      setTimeout(() => { setDone(false); onClose(); }, 1200);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setGenerating(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-[400px] mx-4 mb-[env(safe-area-inset-bottom,8px)] sm:mb-0 rounded-3xl overflow-hidden shadow-2xl max-h-[85vh] overflow-y-auto"
          style={{ backgroundColor: t.card, border: `1px solid ${t.border}` }}
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          {/* Header */}
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${t.sage}20, ${t.teal}20)` }}>
                <FileText className="w-5 h-5" style={{ color: t.sage }} />
              </div>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: t.text }}>PDF-отчёт</h3>
                <p style={{ fontSize: "0.7rem", color: t.textMuted }}>Выберите период</p>
              </div>
            </div>
            <motion.button
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: t.bgSecondary }}
              onClick={onClose}
              whileTap={{ scale: 0.85 }}
            >
              <X className="w-4 h-4" style={{ color: t.textMuted }} />
            </motion.button>
          </div>

          {/* Period selector */}
          <div className="px-5 pb-3 space-y-2">
            {periods.map((p) => {
              const isSelected = selected === p.id;
              const count = counts[p.id];
              const Icon = p.icon;
              return (
                <motion.button
                  key={p.id}
                  className="w-full p-3.5 rounded-2xl flex items-center gap-3 text-left transition-all"
                  style={{
                    backgroundColor: isSelected ? t.sage + "12" : t.bgSecondary,
                    border: `1.5px solid ${isSelected ? t.sage + "50" : "transparent"}`,
                  }}
                  onClick={() => setSelected(p.id)}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: isSelected ? t.sage + "20" : t.border + "60" }}>
                    <Icon className="w-4 h-4" style={{ color: isSelected ? t.sage : t.textMuted }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: isSelected ? t.text : t.textSecondary, display: "block" }}>
                      {p.label}
                    </span>
                    <span style={{ fontSize: "0.68rem", color: t.textMuted }}>{p.desc}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded-full"
                      style={{ fontSize: "0.65rem", fontWeight: 600, backgroundColor: isSelected ? t.sage + "18" : t.border + "80", color: isSelected ? t.sage : t.textFaint }}>
                      {count} записей
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Content preview */}
          <div className="px-5 pb-3">
            <div className="rounded-2xl p-3" style={{ backgroundColor: t.bgSecondary, border: `1px solid ${t.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-3.5 h-3.5" style={{ color: t.textMuted }} />
                <span style={{ fontSize: "0.72rem", fontWeight: 600, color: t.textMuted }}>Содержимое отчёта</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Задачи", value: sectionCounts.tasks, color: t.sage },
                  { label: "Настроение", value: sectionCounts.moods, color: t.lavender },
                  { label: "Привычки", value: sectionCounts.habits, color: t.teal },
                  { label: "Дневник", value: sectionCounts.journal, color: t.dustyBlue },
                  { label: "Тревога", value: sectionCounts.anxiety, color: t.terracotta },
                  { label: "Сон", value: sectionCounts.sleep, color: t.gold },
                ].map((s) => (
                  <div key={s.label} className="text-center py-1.5 rounded-xl"
                    style={{ backgroundColor: s.value > 0 ? s.color + "10" : "transparent" }}>
                    <span className="block" style={{ fontSize: "1rem", fontWeight: 700, color: s.value > 0 ? s.color : t.textFaint }}>
                      {s.value}
                    </span>
                    <span style={{ fontSize: "0.58rem", color: t.textMuted }}>{s.label}</span>
                  </div>
                ))}
              </div>
              {/* Charts indicator */}
              {(sectionCounts.moods >= 2 || sectionCounts.anxiety >= 2 || sectionCounts.sleep >= 2) && (
                <div className="mt-2 flex items-center gap-1.5 justify-center">
                  <BarChart3 className="w-3 h-3" style={{ color: t.sage }} />
                  <span style={{ fontSize: "0.6rem", color: t.sage, fontWeight: 500 }}>
                    Включает графики и диаграммы
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Generate button */}
          <div className="px-5 pb-5">
            <motion.button
              className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-white"
              style={{
                background: done
                  ? `linear-gradient(135deg, ${t.sage}, ${t.teal})`
                  : `linear-gradient(135deg, ${t.sage}, ${t.teal})`,
                opacity: generating && !done ? 0.85 : 1,
              }}
              onClick={handleGenerate}
              disabled={generating}
              whileTap={generating ? {} : { scale: 0.97 }}
            >
              {done ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Готово!</span>
                </>
              ) : generating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-5 h-5" />
                  </motion.div>
                  <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Генерация…</span>
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Сгенерировать PDF</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}