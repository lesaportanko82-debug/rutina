import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../app-context";
import { useTheme } from "../theme";
import { InkCheck } from "../ink";

const PERIODS = [
  { days: 14, label: "2 недели" },
  { days: 30, label: "Месяц" },
  { days: 90, label: "3 месяца" },
];

const SECTIONS = [
  { key: "mood", label: "Настроение", hint: "По дням, с энергией и заметками" },
  { key: "anxiety", label: "Тревога", hint: "Эпизоды, уровень, триггеры, что помогло" },
  { key: "sleep", label: "Сон", hint: "Часы и качество" },
  { key: "journal", label: "Дневник", hint: "Тексты записей целиком" },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

export function ExportPage() {
  const { moods, anxietyEntries, sleepEntries, journalEntries, profile, questionnaire } = useApp();
  const t = useTheme();
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  // Дневник по умолчанию выключен: это самое личное, включать его — осознанное решение
  const [include, setInclude] = useState<Record<SectionKey, boolean>>({ mood: true, anxiety: true, sleep: true, journal: false });
  const [busy, setBusy] = useState(false);

  const card: React.CSSProperties = { background: t.card, border: `1px solid ${t.border}`, borderRadius: 12 };
  const name = questionnaire.filled && questionnaire.name ? questionnaire.name : profile.name === "Пользователь" ? "" : profile.name;

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceKey = since.toISOString().split("T")[0];
  const count: Record<SectionKey, number> = {
    mood: moods.filter((x) => x.date >= sinceKey).length,
    anxiety: anxietyEntries.filter((x) => x.date >= sinceKey).length,
    sleep: sleepEntries.filter((x) => x.date >= sinceKey).length,
    journal: journalEntries.filter((x) => x.date >= sinceKey).length,
  };
  const total = SECTIONS.reduce((n, s) => n + (include[s.key] ? count[s.key] : 0), 0);

  const run = async () => {
    setBusy(true);
    try {
      const { generateClinicalPdf } = await import("../../lib/clinical-pdf");
      await generateClinicalPdf({ name, days, moods, anxiety: anxietyEntries, sleep: sleepEntries, journal: journalEntries, include });
      toast.success("PDF сохранён");
    } catch (e) {
      console.error(e);
      toast.error("Не получилось собрать PDF");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ paddingLeft: 22, paddingRight: 22, paddingTop: 26, paddingBottom: 32 }}>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 mb-4" style={{ fontSize: "0.82rem", color: t.textMuted }}>
        <ChevronLeft size={16} /> Назад
      </button>
      <h1 className="display" style={{ fontSize: "1.3rem", color: t.ink, marginBottom: 4 }}>Выгрузка для специалиста</h1>
      <p style={{ fontSize: "0.85rem", color: t.textSecondary, marginBottom: 18, lineHeight: 1.45 }}>
        Ваши записи одним PDF — чтобы показать психологу или врачу. Файл собирается на вашем устройстве и никуда не отправляется.
      </p>

      <p style={{ fontSize: "0.8rem", fontWeight: 700, color: t.text, marginBottom: 8 }}>Период</p>
      <div className="flex gap-2 mb-5">
        {PERIODS.map((p) => (
          <button
            key={p.days}
            onClick={() => setDays(p.days)}
            className="flex-1 py-2.5 rounded-lg"
            style={{
              background: days === p.days ? t.accent : t.card,
              border: `1px solid ${days === p.days ? t.accent : t.border}`,
              color: days === p.days ? t.onInk : t.text,
              fontSize: "0.84rem", fontWeight: 600,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <p style={{ fontSize: "0.8rem", fontWeight: 700, color: t.text, marginBottom: 8 }}>Что включить</p>
      <div className="space-y-2 mb-5">
        {SECTIONS.map((s) => {
          const on = include[s.key];
          return (
            <button
              key={s.key}
              onClick={() => setInclude((prev) => ({ ...prev, [s.key]: !prev[s.key] }))}
              className="w-full flex items-center gap-3 px-4 py-3 text-left"
              style={card}
            >
              <span
                className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ border: `1.5px solid ${on ? t.accent : t.control}`, background: on ? t.accent : "transparent" }}
              >
                {on && <InkCheck size={15} />}
              </span>
              <span className="flex-1">
                <span style={{ display: "block", fontSize: "0.9rem", color: t.text }}>{s.label}</span>
                <span style={{ fontSize: "0.74rem", color: t.textMuted }}>{s.hint}</span>
              </span>
              <span style={{ fontSize: "0.76rem", color: t.textMuted }}>{count[s.key]} зап.</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={run}
        disabled={busy || total === 0}
        className="w-full py-3 rounded-xl flex items-center justify-center gap-2"
        style={{ background: t.accent, color: t.onInk, fontWeight: 600, opacity: busy || total === 0 ? 0.5 : 1 }}
      >
        {busy ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
        {total === 0 ? "За период записей нет" : "Собрать PDF"}
      </button>
    </div>
  );
}
