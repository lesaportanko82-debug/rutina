import { useState, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { useApp } from "../app-context";
import { useTheme } from "../theme";
import { ArrowLeft, Play, Trophy } from "lucide-react";
import { useNavigate } from "react-router";
import type { Challenge, ChallengeDay } from "../use-app-store";
import { GlassPanel } from "../ambient-elements";
import { AppIcon } from "../app-icon";

const challengeTasks: { task: string; icon: string }[] = [
  { task: "Скажите себе 3 комплимента", icon: "💌" },
  { task: "Выпейте стакан тёплой воды утром", icon: "💧" },
  { task: "5 минут тишины с закрытыми глазами", icon: "🤫" },
  { task: "Напишите 3 благодарности", icon: "🙏" },
  { task: "Прогулка без телефона 15 минут", icon: "🚶" },
  { task: "Послушайте любимую песню осознанно", icon: "🎵" },
  { task: "Потянитесь 5 минут утром", icon: "🤸" },
  { task: "Откажитесь от одного «должен»", icon: "🎈" },
  { task: "Приготовьте себе вкусный чай", icon: "🍵" },
  { task: "Проведите 10 минут на свежем воздухе", icon: "🌤️" },
  { task: "Запишите 1 страницу в дневник", icon: "📝" },
  { task: "Позвоните кому-то дорогому", icon: "📞" },
  { task: "Сделайте 10 глубоких вдохов", icon: "🌬️" },
  { task: "Посмотрите на закат или рассвет", icon: "🌅" },
  { task: "Обнимите кого-нибудь (или себя)", icon: "🤗" },
  { task: "Уберите 1 вещь, которая вас не радует", icon: "🧹" },
  { task: "Съешьте что-то полезное и вкусное", icon: "🥗" },
  { task: "Без соцсетей до обеда", icon: "📵" },
  { task: "Нарисуйте что-нибудь (любое)", icon: "🎨" },
  { task: "Прочитайте 10 страниц книги", icon: "📖" },
  { task: "Сделайте что-то впервые сегодня", icon: "✨" },
  { task: "Улыбнитесь незнакомцу", icon: "😊" },
  { task: "Помедитируйте 10 минут", icon: "🧘" },
  { task: "Лягте спать на 30 мин раньше", icon: "😴" },
  { task: "Сделайте 20 приседаний", icon: "💪" },
  { task: "Проветрите комнату и вдохните глубоко", icon: "🪟" },
  { task: "Скажите «нет» одной лишней задаче", icon: "🚫" },
  { task: "Полейте растение (реальное или виртуальное)", icon: "🌱" },
  { task: "Поблагодарите кого-нибудь лично", icon: "💛" },
  { task: "Посидите 5 мин ничего не делая", icon: "🪷" },
];

function generateChallenge(): Challenge {
  const shuffled = [...challengeTasks].sort(() => Math.random() - 0.5);
  const days: ChallengeDay[] = shuffled.slice(0, 30).map((t, i) => ({
    day: i + 1,
    task: t.task,
    icon: t.icon,
    completed: false,
  }));
  return {
    id: "ch-" + Date.now(),
    name: "30 дней мягкости",
    startDate: new Date().toISOString().split("T")[0],
    days,
    active: true,
  };
}

export function ChallengePage() {
  const { challenges, saveChallenges, addXP, triggerCelebration, darkMode } = useApp();
  const t = useTheme();
  const navigate = useNavigate();

  const activeChallenge = useMemo(() => challenges.find((c) => c.active), [challenges]);

  const currentDay = useMemo(() => {
    if (!activeChallenge) return 0;
    const start = new Date(activeChallenge.startDate + "T12:00:00");
    const now = new Date();
    return Math.max(1, Math.min(30, Math.ceil((now.getTime() - start.getTime()) / 86400000)));
  }, [activeChallenge]);

  const completedCount = useMemo(() =>
    activeChallenge ? activeChallenge.days.filter((d) => d.completed).length : 0,
    [activeChallenge]
  );

  const startChallenge = useCallback(() => {
    const ch = generateChallenge();
    const updated = challenges.map((c) => ({ ...c, active: false }));
    updated.push(ch);
    saveChallenges(updated);
  }, [challenges, saveChallenges]);

  const toggleDay = useCallback((dayNum: number) => {
    if (!activeChallenge) return;
    const updated = challenges.map((c) => {
      if (c.id !== activeChallenge.id) return c;
      const newDays = c.days.map((d) => {
        if (d.day !== dayNum) return d;
        const newCompleted = !d.completed;
        if (newCompleted) addXP(12);
        return { ...d, completed: newCompleted, completedAt: newCompleted ? new Date().toISOString() : undefined };
      });
      const newCompletedCount = newDays.filter((d) => d.completed).length;
      if (newCompletedCount === 30) {
        setTimeout(() => triggerCelebration("challenge-complete"), 200);
      }
      return { ...c, days: newDays };
    });
    saveChallenges(updated);
  }, [activeChallenge, challenges, saveChallenges, addXP, triggerCelebration]);

  // Past challenges
  const pastChallenges = challenges.filter((c) => !c.active);

  return (
    <div className="px-5 pt-14 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl" style={{ backgroundColor: t.bgSecondary }}>
          <ArrowLeft className="w-5 h-5" style={{ color: t.text }} />
        </button>
        <div className="flex-1">
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: t.text }}>Челлендж</h1>
          <p style={{ fontSize: "0.7rem", color: t.textMuted }}>30 дней мягкости к себе</p>
        </div>
        {activeChallenge && (
          <div className="px-3 py-1.5 rounded-full" style={{ backgroundColor: t.sage + "18" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: t.sage }}>
              {completedCount}/30
            </span>
          </div>
        )}
      </div>

      {!activeChallenge ? (
        /* No active challenge */
        <GlassPanel darkMode={darkMode} color={t.sage} className="rounded-2xl p-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span style={{ fontSize: "3rem" }}>🌸</span>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: t.text, marginTop: 12 }}>
            30 дней мягкости
          </h2>
          <p style={{ fontSize: "0.8rem", color: t.textMuted, marginTop: 8, lineHeight: 1.6 }}>
            Каждый день — маленькое задание по заботе о себе.
            Нет строгих правил, можно пропускать. Главное — начать.
          </p>
          <motion.button
            className="mt-6 px-8 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto"
            style={{ backgroundColor: t.sage, color: "#fff", fontSize: "0.9rem" }}
            whileTap={{ scale: 0.95 }}
            onClick={startChallenge}
          >
            <Play className="w-4 h-4" /> Начать челлендж
          </motion.button>
          </motion.div>
        </GlassPanel>
      ) : (
        <>
          {/* Progress bar */}
          <GlassPanel darkMode={darkMode} color={t.lavender} className="rounded-2xl p-4 mb-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: t.text }}>
                День {currentDay} из 30
              </span>
              <span style={{ fontSize: "0.68rem", color: t.textMuted }}>
                {completedCount === 30 ? "Завершён!" : `${Math.round((completedCount / 30) * 100)}%`}
              </span>
            </div>
            <div className="w-full rounded-full h-2.5" style={{ backgroundColor: t.border }}>
              <motion.div className="h-2.5 rounded-full"
                style={{ background: "linear-gradient(90deg, #9B8EC4, #8DB596)" }}
                animate={{ width: `${(completedCount / 30) * 100}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            </motion.div>
          </GlassPanel>

          {/* Today's task highlight */}
          {currentDay <= 30 && !activeChallenge.days[currentDay - 1]?.completed && (
            <GlassPanel darkMode={darkMode} color={t.lavender} className="rounded-2xl p-5 mb-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <p style={{ fontSize: "0.68rem", fontWeight: 600, color: t.lavender, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                Задание на сегодня
              </p>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: "2rem" }}><AppIcon icon={activeChallenge.days[currentDay - 1]?.icon || "🌸"} size={32} /></span>
                <p style={{ fontSize: "0.95rem", fontWeight: 600, color: t.text, lineHeight: 1.4 }}>
                  {activeChallenge.days[currentDay - 1]?.task}
                </p>
              </div>
              <motion.button
                className="mt-4 w-full rounded-xl py-2.5 font-semibold"
                style={{ backgroundColor: t.sage, color: "#fff", fontSize: "0.85rem" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleDay(currentDay)}
              >
                Выполнено!
              </motion.button>
              </motion.div>
            </GlassPanel>
          )}

          {/* Visual progress map */}
          <h3 style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text, marginBottom: 10 }}>
            Карта прогресса
          </h3>
          <div className="grid grid-cols-6 gap-2 mb-5">
            {activeChallenge.days.map((day, i) => {
              const isToday = day.day === currentDay;
              const isPast = day.day < currentDay;
              const isFuture = day.day > currentDay;
              return (
                <motion.button
                  key={day.day}
                  className="rounded-xl p-1.5 flex flex-col items-center justify-center relative"
                  style={{
                    backgroundColor: day.completed ? t.sage + "15" : isToday ? t.lavender + "10" : t.card,
                    border: `1.5px solid ${day.completed ? t.sage + "40" : isToday ? t.lavender + "40" : t.border}`,
                    height: 62,
                    opacity: isFuture && !day.completed ? 0.5 : 1,
                  }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleDay(day.day)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: isFuture && !day.completed ? 0.5 : 1, scale: 1 }}
                  transition={{ delay: i * 0.015 }}
                >
                  <span style={{ fontSize: "0.55rem", color: t.textFaint, marginBottom: 1 }}>
                    {day.day}
                  </span>
                  <span style={{ fontSize: day.completed ? "0.85rem" : "0.75rem" }}>
                    {day.completed ? "✅" : <AppIcon icon={day.icon} size={day.completed ? 14 : 12} />}
                  </span>
                  {isToday && !day.completed && (
                    <motion.div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                      style={{ backgroundColor: t.lavender }}
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Completion celebration */}
          {completedCount === 30 && (
            <motion.div className="rounded-2xl p-5 text-center border mb-4"
              style={{ background: `linear-gradient(135deg, ${t.gold}10, ${t.sage}10)`, borderColor: t.gold + "30" }}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Trophy className="w-10 h-10 mx-auto mb-3" style={{ color: t.gold }} />
              <p style={{ fontSize: "1.1rem", fontWeight: 700, color: t.text }}>
                Челлендж завершён!
              </p>
              <p style={{ fontSize: "0.78rem", color: t.textMuted, marginTop: 4 }}>
                30 дней заботы о себе. Вы невероятны!
              </p>
              <button
                className="mt-4 px-6 py-2.5 rounded-xl font-semibold"
                style={{ backgroundColor: t.lavender + "20", color: t.lavender, fontSize: "0.82rem" }}
                onClick={() => {
                  const updated = challenges.map((c) => c.id === activeChallenge.id ? { ...c, active: false } : c);
                  saveChallenges(updated);
                }}
              >
                Завершить и начать новый
              </button>
            </motion.div>
          )}
        </>
      )}

      {/* Past challenges */}
      {pastChallenges.length > 0 && (
        <>
          <h3 style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text, marginBottom: 8, marginTop: 16 }}>
            Прошлые челленджи
          </h3>
          <div className="space-y-2">
            {pastChallenges.slice(-3).map((ch) => {
              const done = ch.days.filter((d) => d.completed).length;
              return (
                <div key={ch.id} className="rounded-xl p-3 flex items-center justify-between border"
                  style={{ backgroundColor: t.card, borderColor: t.border }}>
                  <div>
                    <p style={{ fontSize: "0.78rem", fontWeight: 500, color: t.text }}>{ch.name}</p>
                    <p style={{ fontSize: "0.62rem", color: t.textFaint }}>
                      {new Date(ch.startDate).toLocaleDateString("ru")} · {done}/30
                    </p>
                  </div>
                  <div className="grid grid-cols-6 gap-0.5">
                    {ch.days.slice(0, 12).map((d, i) => (
                      <div key={i} className="w-2 h-2 rounded-sm"
                        style={{ backgroundColor: d.completed ? t.sage : t.border }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}