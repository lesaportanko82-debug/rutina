import { useNavigate } from "react-router";
import { ChevronRight, Wind, Hand, LifeBuoy, PenLine, CloudRain, Brain, Moon, BarChart3, Bell, Headphones, MessageCircle, Activity } from "lucide-react";
import { useTheme } from "../theme";

type Item = { label: string; hint: string; path?: string; event?: string; icon: React.ComponentType<{ size?: number; color?: string }> };

const groups: { title: string; items: Item[] }[] = [
  {
    title: "Если тревожно",
    items: [
      { label: "SOS", hint: "Быстрая помощь при панике", path: "/app/sos", icon: LifeBuoy },
      { label: "Дыхание", hint: "4-7-8, 2 минуты", event: "open-breathing", icon: Wind },
      { label: "Заземление 5-4-3-2-1", hint: "Вернуться в момент", path: "/app/anxiety/grounding", icon: Hand },
      { label: "Мышечная релаксация", hint: "Техника Джейкобсона, 4 минуты", path: "/app/pmr", icon: Activity },
    ],
  },
  {
    title: "Разобраться с мыслями",
    items: [
      { label: "Дневник", hint: "Записи и заметки", path: "/app/journal", icon: PenLine },
      { label: "Дневник тревог", hint: "Записать и проверить позже", path: "/app/worry", icon: CloudRain },
      { label: "Трекер тревоги", hint: "Уровень и триггеры", path: "/app/anxiety", icon: Activity },
      { label: "Ловушки мышления", hint: "Справочник когнитивных искажений", path: "/app/distortions", icon: Brain },
      { label: "Чат с Листиком", hint: "Поддерживающий собеседник", event: "open-mascot", icon: MessageCircle },
    ],
  },
  {
    title: "Отдых и сон",
    items: [
      { label: "Медитации", hint: "С озвучкой", path: "/app/meditation", icon: Headphones },
      { label: "Сон", hint: "Качество и факторы", path: "/app/sleep", icon: Moon },
    ],
  },
  {
    title: "Обзор",
    items: [
      { label: "Статистика", hint: "Задачи, привычки, настроение", path: "/app/stats", icon: BarChart3 },
      { label: "Напоминания", hint: "Время и дни", path: "/app/notifications", icon: Bell },
    ],
  },
];

export function PracticesPage() {
  const t = useTheme();
  const navigate = useNavigate();
  const open = (it: Item) => {
    if (it.event) document.dispatchEvent(new CustomEvent(it.event));
    else if (it.path) navigate(it.path);
  };
  return (
    <div className="px-5 pt-6 pb-8">
      <h1 className="mb-5" style={{ fontSize: "1.5rem", fontWeight: 700, color: t.text }}>Практики</h1>
      {groups.map((g) => (
        <div key={g.title} className="mb-5">
          <p className="mb-2" style={{ fontSize: "0.72rem", fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {g.title}
          </p>
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, overflow: "hidden" }}>
            {g.items.map((it, i) => (
              <button
                key={it.label}
                onClick={() => open(it)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                style={{ borderTop: i ? `1px solid ${t.border}` : "none" }}
              >
                <it.icon size={18} color="#5B8A64" />
                <span className="flex-1">
                  <span style={{ display: "block", fontSize: "0.9rem", color: t.text }}>{it.label}</span>
                  <span style={{ display: "block", fontSize: "0.72rem", color: t.textMuted }}>{it.hint}</span>
                </span>
                <ChevronRight size={16} color={t.textFaint} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
