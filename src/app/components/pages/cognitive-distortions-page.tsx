import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../app-context";
import { useTheme } from "../theme";
import { ArrowLeft, Plus, X, Trash2, BookOpen, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router";
import { GlassPanel } from "../ambient-elements";
import { AppIcon } from "../app-icon";

const distortions = [
  {
    id: "catastrophizing",
    name: "Катастрофизация",
    icon: "🌪️",
    color: "#C4876C",
    description: "Ожидание худшего исхода без достаточных оснований.",
    example: "«Если я провалю экзамен, моя жизнь закончится»",
    antidote: "Спросите себя: какой наиболее вероятный исход? Что самое худшее, и насколько вы справитесь?",
  },
  {
    id: "black_white",
    name: "Чёрно-белое мышление",
    icon: "⬛",
    color: "#7A6B5E",
    description: "Мышление в крайностях: всё или ничего, идеально или ужасно.",
    example: "«Я съел торт — диета провалена, нет смысла продолжать»",
    antidote: "Ищите оттенки серого. Один промах не отменяет всех ваших усилий.",
  },
  {
    id: "mind_reading",
    name: "Чтение мыслей",
    icon: "🔮",
    color: "#9B8EC4",
    description: "Убеждённость, что вы знаете, что думают другие.",
    example: "«Они точно подумали, что я глупый»",
    antidote: "Мы не умеем читать мысли. Спросите прямо или допустите нейтральный вариант.",
  },
  {
    id: "overgeneralization",
    name: "Сверхобобщение",
    icon: "♾️",
    color: "#7EA8BE",
    description: "Один негативный случай = правило для всей жизни.",
    example: "«У меня всегда так! Ничего никогда не получается»",
    antidote: "Замените «всегда» и «никогда» на «в этот раз». Вспомните исключения.",
  },
  {
    id: "personalization",
    name: "Персонализация",
    icon: "👤",
    color: "#C4A86C",
    description: "Принятие ответственности за то, что вне вашего контроля.",
    example: "«Друг расстроен — наверное, я что-то сделал не так»",
    antidote: "Не всё о вас. Люди имеют свои причины для своих эмоций.",
  },
  {
    id: "emotional_reasoning",
    name: "Эмоциональное рассуждение",
    icon: "💔",
    color: "#B8696C",
    description: "«Я чувствую это — значит, так и есть».",
    example: "«Я чувствую себя глупым, значит, я глупый»",
    antidote: "Чувства — не факты. Что бы сказал друг? Есть ли объективные данные?",
  },
  {
    id: "should",
    name: "Долженствование",
    icon: "📏",
    color: "#8DB596",
    description: "Жёсткие правила о том, как должно быть.",
    example: "«Я должен быть всегда продуктивным»",
    antidote: "Замените «должен» на «хотел бы». Будьте мягче к себе.",
  },
  {
    id: "magnification",
    name: "Преувеличение/преуменьшение",
    icon: "🔍",
    color: "#7BAFB0",
    description: "Раздувание негатива и обесценивание позитива.",
    example: "«Ошибка — катастрофа, а похвала — ерунда, мне просто повезло»",
    antidote: "Если бы друг рассказал вам это — что бы вы ответили?",
  },
  {
    id: "labeling",
    name: "Навешивание ярлыков",
    icon: "🏷️",
    color: "#B88FA7",
    description: "Приравнивание себя или других к одному действию.",
    example: "«Я неудачник» вместо «Я допустил ошибку»",
    antidote: "Отделяйте поступок от личности. Одна ошибка не определяет вас.",
  },
  {
    id: "filter",
    name: "Ментальный фильтр",
    icon: "🕳️",
    color: "#A3907A",
    description: "Фокус только на негативном, игнорирование позитивного.",
    example: "«10 комплиментов и 1 критика — весь день испорчен из-за критики»",
    antidote: "Запишите 3 хороших момента дня. Расширяйте фокус.",
  },
];

export function CognitiveDistortionsPage() {
  const { cogDistortionTags, addCogDistortionTag, deleteCogDistortionTag, darkMode } = useApp();
  const t = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"guide" | "log" | "patterns">("guide");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [selectedDistortion, setSelectedDistortion] = useState("");
  const [context, setContext] = useState("");

  // Pattern analysis
  const patterns = useMemo(() => {
    const counts: Record<string, number> = {};
    cogDistortionTags.forEach((tag) => {
      counts[tag.distortion] = (counts[tag.distortion] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({
        distortion: distortions.find((d) => d.id === id),
        count,
      }))
      .filter((p) => p.distortion);
  }, [cogDistortionTags]);

  // By week
  const weeklyTrend = useMemo(() => {
    const weeks: Record<string, number> = {};
    cogDistortionTags.forEach((tag) => {
      const d = new Date(tag.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay() + 1);
      const key = weekStart.toISOString().split("T")[0];
      weeks[key] = (weeks[key] || 0) + 1;
    });
    return Object.entries(weeks).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
  }, [cogDistortionTags]);

  const handleLog = () => {
    if (!selectedDistortion) return;
    addCogDistortionTag(selectedDistortion, undefined, context.trim() || undefined);
    setSelectedDistortion("");
    setContext("");
    setShowLogForm(false);
  };

  return (
    <div className="px-5 pt-14 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl" style={{ backgroundColor: t.bgSecondary }}>
          <ArrowLeft className="w-5 h-5" style={{ color: t.text }} />
        </button>
        <div className="flex-1">
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: t.text }}>Ловушки мышления</h1>
          <p style={{ fontSize: "0.7rem", color: t.textMuted }}>Замечайте искажения — освобождайтесь</p>
        </div>
        <button onClick={() => setShowLogForm(true)} className="p-2 rounded-xl" style={{ backgroundColor: t.lavender + "18" }}>
          <Plus className="w-5 h-5" style={{ color: t.lavender }} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 mt-3 rounded-xl p-1" style={{ backgroundColor: t.bgSecondary }}>
        {([
          { id: "guide" as const, label: "Справочник", icon: "📖" },
          { id: "log" as const, label: "Мой журнал", icon: "📝" },
          { id: "patterns" as const, label: "Паттерны", icon: "📊" },
        ]).map((tb) => (
          <button key={tb.id} className="flex-1 rounded-lg py-2 flex items-center justify-center gap-1"
            style={{
              backgroundColor: tab === tb.id ? t.card : "transparent",
              fontSize: "0.75rem",
              fontWeight: tab === tb.id ? 600 : 400,
              color: tab === tb.id ? t.text : t.textMuted,
            }}
            onClick={() => setTab(tb.id)}>
            <span style={{ fontSize: "0.7rem" }}>{tb.icon}</span> {tb.label}
          </button>
        ))}
      </div>

      {/* Guide tab */}
      {tab === "guide" && (
        <div className="space-y-2">
          {distortions.map((d, i) => (
            <GlassPanel key={d.id} darkMode={darkMode} color={d.color} className="rounded-xl">
            <motion.div
              className="overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <button
                className="w-full px-4 py-3 flex items-center gap-3 text-left"
                onClick={() => setExpanded(expanded === d.id ? null : d.id)}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: d.color + "18" }}>
                  <AppIcon icon={d.icon} size={18} color={d.color} />
                </div>
                <div className="flex-1">
                  <p style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text }}>{d.name}</p>
                  <p style={{ fontSize: "0.65rem", color: t.textFaint }}>{d.description}</p>
                </div>
                <span style={{ fontSize: "0.8rem", color: t.textFaint, transform: expanded === d.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                  ▾
                </span>
              </button>

              <AnimatePresence>
                {expanded === d.id && (
                  <motion.div
                    className="px-4 pb-4"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <div className="rounded-xl p-3 mb-2" style={{ backgroundColor: d.color + "08" }}>
                      <p style={{ fontSize: "0.7rem", fontWeight: 600, color: d.color, marginBottom: 4 }}>Пример:</p>
                      <p style={{ fontSize: "0.72rem", color: t.textMuted, fontStyle: "italic" }}>{d.example}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ backgroundColor: "#8DB59608" }}>
                      <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#8DB596", marginBottom: 4 }}>Противоядие:</p>
                      <p style={{ fontSize: "0.72rem", color: t.textMuted }}>{d.antidote}</p>
                    </div>
                    <button
                      className="mt-3 w-full rounded-xl py-2 text-center"
                      style={{ backgroundColor: d.color + "15", fontSize: "0.78rem", fontWeight: 600, color: d.color }}
                      onClick={() => {
                        setSelectedDistortion(d.id);
                        setShowLogForm(true);
                      }}
                    >
                      Заметил у себя
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            </GlassPanel>
          ))}
        </div>
      )}

      {/* Log tab */}
      {tab === "log" && (
        <div className="space-y-2">
          {cogDistortionTags.length === 0 ? (
            <GlassPanel darkMode={darkMode} className="rounded-2xl p-6 text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-3" style={{ color: t.textFaint }} />
              <p style={{ fontSize: "0.82rem", color: t.textMuted }}>Пока пусто</p>
              <p style={{ fontSize: "0.72rem", color: t.textFaint }}>
                Когда заметите искажение — запишите его. Со временем вы увидите свои паттерны.
              </p>
            </GlassPanel>
          ) : (
            cogDistortionTags.map((tag, i) => {
              const d = distortions.find((dd) => dd.id === tag.distortion);
              if (!d) return null;
              return (
                <GlassPanel key={tag.id} darkMode={darkMode} color={d.color} className="rounded-xl">
                <motion.div className="p-3 flex items-start gap-3"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: d.color + "18" }}>
                    <AppIcon icon={d.icon} size={16} color={d.color} />
                  </div>
                  <div className="flex-1">
                    <p style={{ fontSize: "0.78rem", fontWeight: 600, color: t.text }}>{d.name}</p>
                    {tag.context && (
                      <p style={{ fontSize: "0.7rem", color: t.textMuted, marginTop: 2, fontStyle: "italic" }}>
                        "{tag.context}"
                      </p>
                    )}
                    <p style={{ fontSize: "0.6rem", color: t.textFaint, marginTop: 4 }}>
                      {new Date(tag.date).toLocaleDateString("ru")}
                    </p>
                  </div>
                  <button onClick={() => deleteCogDistortionTag(tag.id)} className="p-1">
                    <Trash2 className="w-3 h-3" style={{ color: t.textFaint }} />
                  </button>
                </motion.div>
                </GlassPanel>
              );
            })
          )}
        </div>
      )}

      {/* Patterns tab */}
      {tab === "patterns" && (
        <div>
          {patterns.length === 0 ? (
            <GlassPanel darkMode={darkMode} className="rounded-2xl p-6 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-3" style={{ color: t.textFaint }} />
              <p style={{ fontSize: "0.82rem", color: t.textMuted }}>Недостаточно данных</p>
              <p style={{ fontSize: "0.72rem", color: t.textFaint }}>
                Записывайте замеченные искажения — здесь появятся ваши паттерны.
              </p>
            </GlassPanel>
          ) : (
            <>
              {/* Top distortions */}
              <h3 style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text, marginBottom: 8 }}>
                Частые ловушки
              </h3>
              <div className="space-y-2 mb-5">
                {patterns.slice(0, 5).map((p, i) => {
                  const maxCount = patterns[0].count;
                  const pct = (p.count / maxCount) * 100;
                  return (
                    <GlassPanel key={p.distortion!.id} darkMode={darkMode} color={p.distortion!.color} className="rounded-xl">
                    <motion.div className="p-3"
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <div className="flex items-center gap-2 mb-2">
                        <AppIcon icon={p.distortion!.icon} size={16} color={p.distortion!.color} />
                        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: t.text }}>{p.distortion!.name}</span>
                        <span className="ml-auto px-2 py-0.5 rounded-full" style={{
                          fontSize: "0.62rem", fontWeight: 600,
                          backgroundColor: p.distortion!.color + "18", color: p.distortion!.color,
                        }}>
                          {p.count}x
                        </span>
                      </div>
                      <div className="w-full rounded-full h-1.5" style={{ backgroundColor: t.border }}>
                        <motion.div className="h-1.5 rounded-full" style={{ backgroundColor: p.distortion!.color }}
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
                      </div>
                    </motion.div>
                    </GlassPanel>
                  );
                })}
              </div>

              {/* Weekly trend */}
              {weeklyTrend.length >= 2 && (
                <GlassPanel darkMode={darkMode} className="rounded-2xl p-4">
                  <h3 style={{ fontSize: "0.78rem", fontWeight: 600, color: t.text, marginBottom: 12 }}>
                    Тренд по неделям
                  </h3>
                  <div className="flex items-end gap-2" style={{ height: 60 }}>
                    {weeklyTrend.map(([week, count]) => {
                      const maxW = Math.max(...weeklyTrend.map(([, c]) => c));
                      const h = Math.max(8, (count / maxW) * 50);
                      return (
                        <div key={week} className="flex-1 flex flex-col items-center gap-1">
                          <span style={{ fontSize: "0.55rem", color: t.textFaint }}>{count}</span>
                          <motion.div className="w-full rounded-t-md"
                            style={{ backgroundColor: t.lavender + "40" }}
                            initial={{ height: 0 }} animate={{ height: h }} transition={{ duration: 0.5 }} />
                          <span style={{ fontSize: "0.5rem", color: t.textFaint }}>
                            {new Date(week).toLocaleDateString("ru", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: "0.65rem", color: t.textMuted, marginTop: 8, fontStyle: "italic", textAlign: "center" }}>
                    Замечать искажения — это уже большой шаг к свободе от них.
                  </p>
                </GlassPanel>
              )}

              {/* Insight */}
              <GlassPanel darkMode={darkMode} color={t.sage} className="rounded-2xl mt-4">
              <motion.div className="p-4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <p style={{ fontSize: "0.75rem", color: t.text, lineHeight: 1.6 }}>
                  💡 <strong>Инсайт:</strong> Ваша главная ловушка — <strong style={{ color: patterns[0].distortion!.color }}>{patterns[0].distortion!.name}</strong>.
                  {" "}{patterns[0].distortion!.antidote}
                </p>
              </motion.div>
              </GlassPanel>
            </>
          )}
        </div>
      )}

      {/* Log form modal */}
      <AnimatePresence>
        {showLogForm && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowLogForm(false)}>
            <motion.div className="w-full max-w-[430px] rounded-t-3xl p-6"
              style={{ backgroundColor: t.card, maxHeight: "80vh", overflowY: "auto" }}
              initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: t.text }}>Заметил искажение</h3>
                <button onClick={() => setShowLogForm(false)}>
                  <X className="w-5 h-5" style={{ color: t.textFaint }} />
                </button>
              </div>

              <p style={{ fontSize: "0.78rem", fontWeight: 600, color: t.text, marginBottom: 8 }}>Какое искажение?</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {distortions.map((d) => (
                  <button key={d.id}
                    className="px-3 py-1.5 rounded-full flex items-center gap-1"
                    style={{
                      backgroundColor: selectedDistortion === d.id ? d.color + "20" : t.bgSecondary,
                      border: `1px solid ${selectedDistortion === d.id ? d.color + "40" : t.border}`,
                      fontSize: "0.72rem",
                      color: selectedDistortion === d.id ? d.color : t.textMuted,
                      fontWeight: selectedDistortion === d.id ? 600 : 400,
                    }}
                    onClick={() => setSelectedDistortion(d.id)}>
                    <AppIcon icon={d.icon} size={13} color={selectedDistortion === d.id ? d.color : t.textMuted} /> {d.name}
                  </button>
                ))}
              </div>

              <p style={{ fontSize: "0.78rem", fontWeight: 600, color: t.text, marginBottom: 8 }}>Контекст (необязательно)</p>
              <textarea className="w-full rounded-xl px-4 py-3 mb-4 outline-none resize-none"
                style={{ backgroundColor: t.bgSecondary, color: t.text, fontSize: "0.85rem", border: `1px solid ${t.border}` }}
                rows={2} placeholder="О чём вы думали?"
                value={context} onChange={(e) => setContext(e.target.value)} />

              <button className="w-full rounded-xl py-3 font-semibold"
                style={{ backgroundColor: t.lavender, color: "#fff", fontSize: "0.9rem", opacity: selectedDistortion ? 1 : 0.5 }}
                onClick={handleLog} disabled={!selectedDistortion}>
                Записать
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}