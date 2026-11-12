import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { useApp } from "./app-context";
import { useTheme } from "./theme";
import { AppIcon } from "./app-icon";
import { suggestedHabits } from "./use-app-store";

/**
 * Онбординг в два шага: имя → стартовые привычки.
 * Всё остальное пользователь узнаёт по ходу работы.
 */
export function Onboarding() {
  const { setOnboardingDone, saveQuestionnaire, questionnaire, addHabit, habits } = useApp();
  const t = useTheme();
  const [step, setStep] = useState<0 | 1>(0);
  const [name, setName] = useState(questionnaire.name || "");
  const [picked, setPicked] = useState<Set<string>>(new Set(suggestedHabits.slice(0, 2).map((h) => h.title)));

  const finish = () => {
    const existing = new Set(habits.map((h) => h.title.toLowerCase()));
    suggestedHabits.forEach((h) => {
      if (picked.has(h.title) && !existing.has(h.title.toLowerCase())) addHabit(h);
    });
    setOnboardingDone();
  };

  const next = () => {
    if (step === 0) {
      if (name.trim()) saveQuestionnaire({ ...questionnaire, name: name.trim() });
      setStep(1);
    } else finish();
  };

  const toggle = (title: string) =>
    setPicked((p) => {
      const n = new Set(p);
      n.has(title) ? n.delete(title) : n.add(title);
      return n;
    });

  return (
    <div className="h-dvh flex flex-col px-6 pt-14 pb-8" style={{ background: t.bg, maxWidth: 430, margin: "0 auto" }}>
      <p style={{ fontSize: "0.75rem", color: t.textMuted }}>Шаг {step + 1} из 2</p>

      {step === 0 ? (
        <div className="flex-1 flex flex-col justify-center">
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: t.text, marginBottom: 8 }}>Как к вам обращаться?</h1>
          <p style={{ fontSize: "0.9rem", color: t.textMuted, marginBottom: 20 }}>Имя появится на главном экране. Можно пропустить.</p>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && next()}
            placeholder="Имя"
            className="w-full px-4 py-3 rounded-xl outline-none"
            style={{ background: t.card, border: `1px solid ${t.border}`, color: t.text, fontSize: "1rem" }}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center">
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: t.text, marginBottom: 8 }}>С чего начнём?</h1>
          <p style={{ fontSize: "0.9rem", color: t.textMuted, marginBottom: 20 }}>Выберите одну-две привычки. Остальные добавите позже.</p>
          <div className="space-y-2">
            {suggestedHabits.map((h) => {
              const on = picked.has(h.title);
              return (
                <button
                  key={h.title}
                  onClick={() => toggle(h.title)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left"
                  style={{ background: t.card, border: `1px solid ${on ? "#5B8A64" : t.border}` }}
                >
                  <AppIcon icon={h.icon} size={18} color={h.color} />
                  <span className="flex-1" style={{ fontSize: "0.92rem", color: t.text }}>{h.title}</span>
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: on ? "#5B8A64" : "transparent", border: `1.5px solid ${on ? "#5B8A64" : t.borderLight}` }}
                  >
                    {on && <Check size={14} color="white" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={next}
        className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2"
        style={{ background: "#5B8A64", color: "white", fontWeight: 600, fontSize: "0.95rem" }}
      >
        {step === 0 ? "Дальше" : "Начать"} <ArrowRight size={16} />
      </button>
      {step === 0 && (
        <button onClick={() => setStep(1)} className="w-full py-3 mt-1" style={{ fontSize: "0.85rem", color: t.textMuted }}>
          Пропустить
        </button>
      )}
    </div>
  );
}
