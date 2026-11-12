import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ChevronRight, Wind, Hand, LifeBuoy, PenLine, CloudRain, Brain, Moon, BarChart3, Bell, Headphones, MessageCircle, Activity, CalendarCheck, FileDown } from "lucide-react";
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
      { label: "Разбор недели", hint: "Две минуты: посмотреть, ответить, поправить", path: "/app/week", icon: CalendarCheck },
      { label: "Статистика", hint: "Задачи, привычки, настроение", path: "/app/stats", icon: BarChart3 },
      { label: "Выгрузка для специалиста", hint: "Настроение, тревога и дневник одним PDF", path: "/app/export", icon: FileDown },
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
    <div style={{ paddingLeft: 22, paddingRight: 22, paddingTop: 26, paddingBottom: 32 }}>
      <h1 className="display mb-5" style={{ fontSize: "1.5rem", fontWeight: 700, color: t.text }}>Практики</h1>
      {groups.map((g) => (
        <div key={g.title} style={{ marginBottom: 36 }}>
          <p style={{ fontSize: "0.72rem", color: t.textMuted, marginBottom: 6 }}>{g.title}</p>
          <div style={{ borderTop: `0.5px solid ${t.borderLight}` }}>
            {g.items.map((it) => (
              <motion.button
                key={it.label}
                onClick={() => open(it)}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 240, damping: 26 }}
                className="w-full flex items-center gap-3 text-left"
                style={{ paddingTop: 13, paddingBottom: 13, borderBottom: `0.5px solid ${t.borderLight}` }}
              >
                <it.icon size={17} color={t.textSecondary} strokeWidth={1.7} />
                <span className="flex-1">
                  <span style={{ display: "block", fontSize: "0.95rem", color: t.text }}>{it.label}</span>
                  <span style={{ display: "block", fontSize: "0.72rem", color: t.textMuted, marginTop: 1 }}>{it.hint}</span>
                </span>
                <ChevronRight size={15} color={t.textFaint} />
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
