import { useState, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { useApp } from "../app-context";
import { useTheme } from "../theme";
import { ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import { useNavigate } from "react-router";
import type { BingoCard, BingoCell } from "../use-app-store";
import { GlassPanel } from "../ambient-elements";
import { AppIcon } from "../app-icon";

const allActivities: { text: string; icon: string }[] = [
  { text: "Выпить стакан воды", icon: "💧" },
  { text: "Погулять 10 минут", icon: "🚶" },
  { text: "Написать комплимент себе", icon: "💌" },
  { text: "5 минут тишины", icon: "🤫" },
  { text: "Потянуться 3 минуты", icon: "🤸" },
  { text: "Записать 3 благодарности", icon: "🙏" },
  { text: "Послушать любимую песню", icon: "🎵" },
  { text: "Съесть фрукт", icon: "🍎" },
  { text: "Позвонить близкому", icon: "📞" },
  { text: "10 глубоких вдохов", icon: "🌬️" },
  { text: "Прочитать 5 страниц", icon: "📖" },
  { text: "Убрать стол", icon: "🧹" },
  { text: "Без телефона 30 мин", icon: "📵" },
  { text: "Тёплый душ", icon: "🚿" },
  { text: "Записать настроение", icon: "😊" },
  { text: "Улыбнуться в зеркало", icon: "🪞" },
  { text: "Выпить чай осознанно", icon: "🍵" },
  { text: "Нарисовать что-нибудь", icon: "🎨" },
  { text: "Обнять кого-нибудь", icon: "🤗" },
  { text: "Посмотреть на небо", icon: "☁️" },
  { text: "Лечь пораньше", icon: "😴" },
  { text: "Сделать 20 приседаний", icon: "💪" },
  { text: "Написать в дневник", icon: "📝" },
  { text: "Полить растение", icon: "🌱" },
  { text: "Проветрить комнату", icon: "🪟" },
  { text: "Сказать кому-то спасибо", icon: "💛" },
  { text: "Помедитировать 5 мин", icon: "🧘" },
  { text: "Съесть овощ", icon: "🥕" },
  { text: "Сделать что-то впервые", icon: "✨" },
  { text: "Отпустить одну тревогу", icon: "🎈" },
  { text: "Погладить животное", icon: "🐱" },
  { text: "Пойти другой дорогой", icon: "🛤️" },
];

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

function generateCard(): BingoCell[] {
  const shuffled = [...allActivities].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 16).map((a) => ({
    text: a.text,
    icon: a.icon,
    completed: false,
  }));
}

function checkLines(cells: BingoCell[]): number {
  let lines = 0;
  // Rows
  for (let r = 0; r < 4; r++) {
    if (cells[r * 4].completed && cells[r * 4 + 1].completed && cells[r * 4 + 2].completed && cells[r * 4 + 3].completed) lines++;
  }
  // Cols
  for (let c = 0; c < 4; c++) {
    if (cells[c].completed && cells[c + 4].completed && cells[c + 8].completed && cells[c + 12].completed) lines++;
  }
  // Diags
  if (cells[0].completed && cells[5].completed && cells[10].completed && cells[15].completed) lines++;
  if (cells[3].completed && cells[6].completed && cells[9].completed && cells[12].completed) lines++;
  return lines;
}

export function BingoPage() {
  const { bingoCards, saveBingoCards, addXP, triggerCelebration, darkMode } = useApp();
  const t = useTheme();
  const navigate = useNavigate();

  const weekStart = getWeekStart();

  // Find or create current week card
  const currentCard = useMemo(() => {
    const existing = bingoCards.find((c) => c.weekStart === weekStart);
    if (existing) return existing;
    const newCard: BingoCard = {
      id: "bingo-" + Date.now(),
      weekStart,
      cells: generateCard(),
      completedLines: 0,
    };
    return newCard;
  }, [bingoCards, weekStart]);

  // Save if new
  useMemo(() => {
    if (!bingoCards.find((c) => c.weekStart === weekStart)) {
      saveBingoCards([...bingoCards, currentCard]);
    }
  }, []);

  const toggleCell = useCallback((idx: number) => {
    const updated = { ...currentCard };
    updated.cells = [...updated.cells];
    updated.cells[idx] = {
      ...updated.cells[idx],
      completed: !updated.cells[idx].completed,
      completedAt: !updated.cells[idx].completed ? new Date().toISOString() : undefined,
    };

    const oldLines = currentCard.completedLines;
    const newLines = checkLines(updated.cells);
    updated.completedLines = newLines;

    if (updated.cells[idx].completed) {
      addXP(10);
    }
    if (newLines > oldLines) {
      addXP(30);
      triggerCelebration("bingo-line");
    }

    const updatedCards = bingoCards.map((c) => c.weekStart === weekStart ? updated : c);
    if (!updatedCards.find((c) => c.weekStart === weekStart)) {
      updatedCards.push(updated);
    }
    saveBingoCards(updatedCards);
  }, [currentCard, bingoCards, weekStart, saveBingoCards, addXP, triggerCelebration]);

  const regenerateCard = useCallback(() => {
    const newCard: BingoCard = {
      id: "bingo-" + Date.now(),
      weekStart,
      cells: generateCard(),
      completedLines: 0,
    };
    const updatedCards = bingoCards.filter((c) => c.weekStart !== weekStart);
    updatedCards.push(newCard);
    saveBingoCards(updatedCards);
  }, [bingoCards, weekStart, saveBingoCards]);

  const completedCount = currentCard.cells.filter((c) => c.completed).length;
  const allCompleted = completedCount === 16;

  // Previous weeks stats
  const prevCards = bingoCards.filter((c) => c.weekStart !== weekStart).slice(-4);

  return (
    <div className="px-5 pt-14 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl" style={{ backgroundColor: t.bgSecondary }}>
          <ArrowLeft className="w-5 h-5" style={{ color: t.text }} />
        </button>
        <div className="flex-1">
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: t.text }}>Self-Care Бинго</h1>
          <p style={{ fontSize: "0.7rem", color: t.textMuted }}>Заполните линию — получите бонус!</p>
        </div>
        <button onClick={regenerateCard} className="p-2 rounded-xl" style={{ backgroundColor: t.bgSecondary }}>
          <RefreshCw className="w-4 h-4" style={{ color: t.textFaint }} />
        </button>
      </div>

      {/* Progress */}
      <GlassPanel darkMode={darkMode} color={t.lavender} className="rounded-2xl p-4 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: t.gold }} />
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text }}>Эта неделя</span>
            </div>
            <span style={{ fontSize: "0.75rem", color: t.textMuted }}>
              {completedCount}/16 · {currentCard.completedLines} {currentCard.completedLines === 1 ? "линия" : currentCard.completedLines >= 2 && currentCard.completedLines <= 4 ? "линии" : "линий"}
            </span>
          </div>
          <div className="w-full rounded-full h-2" style={{ backgroundColor: t.border }}>
            <motion.div className="h-2 rounded-full"
              style={{ background: allCompleted ? "linear-gradient(90deg, #C4A86C, #8DB596)" : "linear-gradient(90deg, #9B8EC4, #7EA8BE)" }}
              animate={{ width: `${(completedCount / 16) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>
      </GlassPanel>

      {/* Bingo grid 4x4 */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {currentCard.cells.map((cell, idx) => (
          <GlassPanel
            key={idx}
            darkMode={darkMode}
            color={cell.completed ? t.sage : undefined}
            className="rounded-xl"
          >
            <motion.button
              className="w-full p-2 flex flex-col items-center justify-center text-center relative overflow-hidden"
              style={{ height: 90 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => toggleCell(idx)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.02 }}
            >
              {cell.completed && (
                <motion.div className="absolute inset-0 flex items-center justify-center"
                  initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <div className="w-full h-full absolute" style={{ backgroundColor: t.sage + "08" }} />
                </motion.div>
              )}
              <span style={{ fontSize: "1.3rem", marginBottom: 2 }}><AppIcon icon={cell.icon} size={22} /></span>
              <span style={{
                fontSize: "0.55rem",
                color: cell.completed ? t.sage : t.textMuted,
                fontWeight: cell.completed ? 600 : 400,
                lineHeight: 1.2,
                textDecoration: cell.completed ? "none" : "none",
              }}>
                {cell.text}
              </span>
              {cell.completed && (
                <motion.div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: t.sage }}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <span style={{ fontSize: "0.5rem", color: "#fff" }}>✓</span>
                </motion.div>
              )}
            </motion.button>
          </GlassPanel>
        ))}
      </div>

      {/* All completed celebration */}
      {allCompleted && (
        <GlassPanel darkMode={darkMode} color={t.gold} className="rounded-2xl p-5 mb-4 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <span style={{ fontSize: "2rem" }}>🎉</span>
          <p style={{ fontSize: "0.95rem", fontWeight: 700, color: t.text, marginTop: 8 }}>
            Полное бинго!
          </p>
          <p style={{ fontSize: "0.75rem", color: t.textMuted, marginTop: 4 }}>
            Невероятно! Вы позаботились о себе по всем фронтам!
          </p>
          </motion.div>
        </GlassPanel>
      )}

      {/* Previous weeks */}
      {prevCards.length > 0 && (
        <>
          <h2 style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text, marginBottom: 8 }}>Прошлые недели</h2>
          <div className="space-y-2">
            {prevCards.map((card) => {
              const done = card.cells.filter((c) => c.completed).length;
              return (
                <GlassPanel key={card.id} darkMode={darkMode} color={t.dustyBlue} className="rounded-xl p-3">
                  <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontSize: "0.78rem", color: t.text, fontWeight: 500 }}>
                      Неделя от {new Date(card.weekStart).toLocaleDateString("ru")}
                    </p>
                    <p style={{ fontSize: "0.65rem", color: t.textFaint }}>
                      {done}/16 выполнено · {card.completedLines} линий
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-0.5">
                    {card.cells.map((c, i) => (
                      <div key={i} className="w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: c.completed ? t.sage : t.border }} />
                    ))}
                  </div>
                  </div>
                </GlassPanel>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}