import { GlassPanel } from "../ambient-elements";
import { AvatarCropper } from "../avatar-cropper";
import { PdfExportModal } from "../pdf-export-modal";
import { clearLocalUserData, flushSync } from "../supabase-sync";
import { useState, useRef, useEffect } from "react";
import { useApp } from "../app-context";
import { useTheme } from "../theme";
import { motion, AnimatePresence } from "motion/react";
import { Flame, Star, Lock, CheckCircle2, Coins, ChevronRight, Edit3, Moon, Sun, Download, Bell, BookOpen, RotateCcw, Droplets, Heart, LogOut, Camera, Loader2, FileText, Eye, EyeOff, KeyRound, UserPen, X, Check } from "lucide-react";
import { useNavigate } from "react-router";
import { supabase, projectId, publicAnonKey } from "../supabase-client";
import { AppIcon } from "../app-icon";

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-ff738703`;

const goalOptions = [
  { value: "health", label: "Здоровье", icon: "🌿" },
  { value: "career", label: "Карьера", icon: "📊" },
  { value: "relationships", label: "Отношения", icon: "💕" },
  { value: "selfdevelopment", label: "Саморазвитие", icon: "📖" },
  { value: "balance", label: "Баланс", icon: "☯️" },
  { value: "creativity", label: "Творчество", icon: "🎨" },
  { value: "finance", label: "Финансы", icon: "🌱" },
  { value: "mindfulness", label: "Осознанность", icon: "🧘" },
];

const blockerOptions = ["Прокрастинация", "Недостаток времени", "Усталость", "Отвлечения", "Стресс", "Неуверенность", "Перфекционизм", "Одиночество"];
const habitOptions = ["Медитация", "Спорт", "Чтение", "Ранний подъём", "Здоровое питание", "Прогулки", "Благодарность", "Дневник"];
const relaxOptions = ["Музыка", "Прогулки", "Книги", "Природа", "Ванна", "Готовка", "Рисование", "Сон"];

const peakTimeOptions = [
  { value: "morning", label: "Утро (6–12)" },
  { value: "afternoon", label: "День (12–18)" },
  { value: "evening", label: "Вечер (18–24)" },
  { value: "night", label: "Ночь (0–6)" },
];

const exerciseOptions = [
  { value: "daily", label: "Каждый день" },
  { value: "3-4", label: "3–4 раза в неделю" },
  { value: "1-2", label: "1–2 раза в неделю" },
  { value: "rarely", label: "Редко" },
  { value: "never", label: "Пока не занимаюсь" },
];

const supportStyleOptions = [
  { value: "gentle", label: "Мягко и бережно", icon: "🌸" },
  { value: "encouraging", label: "С мотивацией", icon: "✨" },
  { value: "structured", label: "Чётко и по делу", icon: "📋" },
  { value: "playful", label: "Легко и с юмором", icon: "😊" },
];

const motivationOptions = [
  { value: "results", label: "Видеть результаты" },
  { value: "streaks", label: "Не прерывать серии" },
  { value: "community", label: "Чувство общности" },
  { value: "rewards", label: "Награды и достижения" },
  { value: "health", label: "Забота о здоровье" },
  { value: "growth", label: "Личностный рост" },
];

export function ProfilePage() {
  const { profile, tasks, habits, moods, questionnaire, saveQuestionnaire, resetQuestionnaire, darkMode, toggleDarkMode, exportData, resetTours, seenTours, seenTips, softAchievements, plantState, waterPlant, interactPlant, renamePlant, journalEntries, pomodoroStats, anxietyEntries, worryEntries, sleepEntries } = useApp();
  const t = useTheme();
  const navigate = useNavigate();
  const [showQuestionnaire, setShowQuestionnaire] = useState(!questionnaire.filled);
  const [step, setStep] = useState(0);
  const [profileTab, setProfileTab] = useState<"profile" | "plant" | "achievements">("profile");

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Account management state
  const [showChangeName, setShowChangeName] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [accountSuccess, setAccountSuccess] = useState("");
  const isAdmin = (() => {
    try { return JSON.parse(localStorage.getItem("routine_auth_user") || "{}").id === "admin"; } catch { return false; }
  })();

  const getAccessToken = () => {
    try { return JSON.parse(localStorage.getItem("routine_auth_user") || "{}").accessToken; } catch { return null; }
  };

  const handleChangeName = async () => {
    if (!newDisplayName.trim()) { setAccountError("Введите новое имя"); return; }
    setAccountLoading(true);
    setAccountError("");
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_BASE}/change-name`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newName: newDisplayName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setAccountError(data.error || "Ошибка смены имени"); return; }
      // Update local auth data
      const authData = JSON.parse(localStorage.getItem("routine_auth_user") || "{}");
      authData.name = newDisplayName.trim();
      localStorage.setItem("routine_auth_user", JSON.stringify(authData));
      // Update questionnaire name too
      saveQuestionnaire({ ...questionnaire, name: newDisplayName.trim() });
      setAccountSuccess("Имя успешно изменено");
      setTimeout(() => { setShowChangeName(false); setAccountSuccess(""); setNewDisplayName(""); }, 1200);
    } catch (e: any) {
      console.error("Change name error:", e);
      setAccountError("Ошибка соединения: " + e.message);
    } finally {
      setAccountLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw) { setAccountError("Заполните все поля"); return; }
    if (newPw.length < 6) { setAccountError("Новый пароль должен быть не менее 6 символов"); return; }
    if (newPw !== confirmPw) { setAccountError("Пароли не совпадают"); return; }
    setAccountLoading(true);
    setAccountError("");
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_BASE}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { setAccountError(data.error || "Ошибка смены пароля"); return; }
      setAccountSuccess("Пароль успешно изменён");
      setTimeout(() => { setShowChangePassword(false); setAccountSuccess(""); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }, 1200);
    } catch (e: any) {
      console.error("Change password error:", e);
      setAccountError("Ошибка соединения: " + e.message);
    } finally {
      setAccountLoading(false);
    }
  };

  const handleLogout = () => {
    supabase.auth.signOut().catch(() => {});
    flushSync();
    clearLocalUserData();
    window.location.reload();
  };

  // Load avatar on mount
  useEffect(() => {
    const cached = localStorage.getItem("routine_avatar_url");
    if (cached) setAvatarUrl(cached);

    const authData = localStorage.getItem("routine_auth_user");
    if (authData) {
      try {
        const { id } = JSON.parse(authData);
        if (id && id !== "admin") {
          fetch(`${API_BASE}/avatar/${id}`, {
            headers: { Authorization: `Bearer ${publicAnonKey}` },
          })
            .then(r => r.json())
            .then(data => {
              if (data.url) {
                setAvatarUrl(data.url);
                localStorage.setItem("routine_avatar_url", data.url);
              }
            })
            .catch(() => {});
        }
      } catch {}
    }
  }, []);

  // When file is selected, open cropper instead of direct upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return; // 10MB pre-crop limit
    setCropFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Upload the cropped blob
  const handleCroppedUpload = async (blob: Blob) => {
    setCropFile(null);
    setAvatarUploading(true);

    try {
      const authData = localStorage.getItem("routine_auth_user");
      if (!authData) throw new Error("Not authenticated");
      const { accessToken } = JSON.parse(authData);

      const formData = new FormData();
      formData.append("avatar", blob, "avatar.jpg");

      const res = await fetch(`${API_BASE}/avatar/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        setAvatarUrl(data.url);
        localStorage.setItem("routine_avatar_url", data.url);
      } else {
        console.error("Avatar upload failed:", data.error);
      }
    } catch (err) {
      console.error("Avatar upload error:", err);
    } finally {
      setAvatarUploading(false);
    }
  };

  const [formData, setFormData] = useState({
    name: questionnaire.name || "", age: questionnaire.age || "", goals: questionnaire.goals || [],
    stressLevel: questionnaire.stressLevel || 3, sleepHours: questionnaire.sleepHours || "",
    productivityBlockers: questionnaire.productivityBlockers || [], desiredHabits: questionnaire.desiredHabits || [],
    peakTime: questionnaire.peakTime || "", exerciseFrequency: questionnaire.exerciseFrequency || "",
    relaxMethods: questionnaire.relaxMethods || [], healthNotes: questionnaire.healthNotes || "",
    monthGoals: questionnaire.monthGoals || "", motivation: questionnaire.motivation || "",
    supportStyle: questionnaire.supportStyle || "",
  });

  const toggleMulti = (field: "goals" | "productivityBlockers" | "desiredHabits" | "relaxMethods", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field].filter((v: string) => v !== value) : [...prev[field], value],
    }));
  };

  const completedTasks = tasks.filter((tk) => tk.completed).length;
  const levelProgress = (profile.xp / profile.xpToNext) * 100;

  const getTier = (level: number) => {
    if (level >= 50) return { name: "Легенда", icon: "👑", color: "#C4A86C", gradient: "linear-gradient(135deg, #C4A86C, #D4B896)", minLevel: 50 };
    if (level >= 40) return { name: "Мудрец", icon: "🧙", color: "#9B8EC4", gradient: "linear-gradient(135deg, #9B8EC4, #B88FA7)", minLevel: 40 };
    if (level >= 30) return { name: "Хранитель", icon: "🦋", color: "#B88FA7", gradient: "linear-gradient(135deg, #B88FA7, #9B8EC4)", minLevel: 30 };
    if (level >= 25) return { name: "Лес", icon: "🌲", color: "#6B8F71", gradient: "linear-gradient(135deg, #6B8F71, #7B8F71)", minLevel: 25 };
    if (level >= 20) return { name: "Роща", icon: "🌳", color: "#7BAFB0", gradient: "linear-gradient(135deg, #7BAFB0, #8DB596)", minLevel: 20 };
    if (level >= 17) return { name: "Сад", icon: "🏡", color: "#C4A86C", gradient: "linear-gradient(135deg, #C4A86C, #C4876C)", minLevel: 17 };
    if (level >= 14) return { name: "Дерево", icon: "🌴", color: "#8DB596", gradient: "linear-gradient(135deg, #8DB596, #6B8F71)", minLevel: 14 };
    if (level >= 11) return { name: "Куст", icon: "🌿", color: "#7EA8BE", gradient: "linear-gradient(135deg, #7EA8BE, #7BAFB0)", minLevel: 11 };
    if (level >= 8) return { name: "Цветок", icon: "🌸", color: "#B88FA7", gradient: "linear-gradient(135deg, #B88FA7, #C4876C)", minLevel: 8 };
    if (level >= 5) return { name: "Побег", icon: "🌱", color: "#8DB596", gradient: "linear-gradient(135deg, #8DB596, #7BAFB0)", minLevel: 5 };
    if (level >= 3) return { name: "Росток", icon: "🌾", color: "#C4A86C", gradient: "linear-gradient(135deg, #C4A86C, #C4876C)", minLevel: 3 };
    return { name: "Семечко", icon: "🌰", color: "#A3ADB8", gradient: "linear-gradient(135deg, #A3ADB8, #B5AFA6)", minLevel: 0 };
  };

  const allTiers = [
    { name: "Семечко", icon: "🌰", minLevel: 0, color: "#A3ADB8" },
    { name: "Росток", icon: "🌾", minLevel: 3, color: "#C4A86C" },
    { name: "Побег", icon: "🌱", minLevel: 5, color: "#8DB596" },
    { name: "Цветок", icon: "🌸", minLevel: 8, color: "#B88FA7" },
    { name: "Куст", icon: "🌿", minLevel: 11, color: "#7EA8BE" },
    { name: "Дерево", icon: "🌴", minLevel: 14, color: "#8DB596" },
    { name: "Сад", icon: "🏡", minLevel: 17, color: "#C4A86C" },
    { name: "Роща", icon: "🌳", minLevel: 20, color: "#7BAFB0" },
    { name: "Лес", icon: "🌲", minLevel: 25, color: "#6B8F71" },
    { name: "Хранитель", icon: "🦋", minLevel: 30, color: "#B88FA7" },
    { name: "Мудрец", icon: "🧙", minLevel: 40, color: "#9B8EC4" },
    { name: "Легенда", icon: "👑", minLevel: 50, color: "#C4A86C" },
  ];

  const currentTierIndex = allTiers.findIndex((tr, i) => {
    const next = allTiers[i + 1];
    return !next || profile.level < next.minLevel;
  });

  const tier = getTier(profile.level);
  const stats = [
    { label: "Задач выполнено", value: completedTasks, icon: CheckCircle2, color: t.sage },
    { label: "Привычек", value: habits.length, icon: Star, color: t.gold },
    { label: "Дней подряд", value: profile.streak, icon: Flame, color: t.terracotta },
    { label: "Монет", value: profile.coins, icon: Coins, color: t.lavender },
  ];

  const handleSave = () => { saveQuestionnaire(formData); setShowQuestionnaire(false); };
  const totalSteps = 6;

  const chipStyle = (active: boolean, activeColor: string) => ({
    borderColor: active ? activeColor : t.borderLight,
    backgroundColor: active ? activeColor + "18" : t.inputBg,
    color: active ? activeColor : t.textMuted,
    fontSize: "0.78rem" as const,
    fontWeight: 500 as const,
  });

  const steps = [
    // Step 0: Name & Age
    <div key="step0">
      <div className="text-center mb-6">
        <span style={{ fontSize: "2rem" }}>🌿</span>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: t.text, marginTop: 8 }}>Давайте познакомимся</h3>
        <p style={{ fontSize: "0.78rem", color: t.textMuted, marginTop: 4 }}>Расскажите немного о себе</p>
      </div>
      <div className="space-y-4">
        <div>
          <label style={{ fontSize: "0.8rem", fontWeight: 500, color: t.textSecondary, marginBottom: 6, display: "block" }}>Как к вам обращаться?</label>
          <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ваше имя..."
            className="w-full rounded-xl px-4 py-3 border outline-none" style={{ fontSize: "0.9rem", backgroundColor: t.inputBg, borderColor: t.borderLight, color: t.text }} />
        </div>
        <div>
          <label style={{ fontSize: "0.8rem", fontWeight: 500, color: t.textSecondary, marginBottom: 6, display: "block" }}>Ваш возраст</label>
          <input value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} placeholder="Необязательно..."
            className="w-full rounded-xl px-4 py-3 border outline-none" style={{ fontSize: "0.9rem", backgroundColor: t.inputBg, borderColor: t.borderLight, color: t.text }} />
        </div>
        <div>
          <label style={{ fontSize: "0.8rem", fontWeight: 500, color: t.textSecondary, marginBottom: 6, display: "block" }}>Стиль поддержки</label>
          <div className="grid grid-cols-2 gap-2">
            {supportStyleOptions.map((opt) => (
              <button key={opt.value} className="p-3 rounded-xl border text-left transition-all" style={chipStyle(formData.supportStyle === opt.value, t.sage)}
                onClick={() => setFormData({ ...formData, supportStyle: opt.value })}>
                <span style={{ fontSize: "1.1rem" }}><AppIcon icon={opt.icon} size={18} /></span>
                <span className="block" style={{ fontSize: "0.75rem", fontWeight: 500, color: t.text, marginTop: 4 }}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    // Step 1: Goals
    <div key="step1">
      <div className="text-center mb-6">
        <span style={{ fontSize: "2rem" }}>🎯</span>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: t.text, marginTop: 8 }}>Что для вас важно?</h3>
        <p style={{ fontSize: "0.78rem", color: t.textMuted, marginTop: 4 }}>Выберите направления</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {goalOptions.map((goal) => (
          <button key={goal.value} className="p-3.5 rounded-xl border text-left transition-all"
            style={chipStyle(formData.goals.includes(goal.value), t.sage)}
            onClick={() => toggleMulti("goals", goal.value)}>
            <span style={{ fontSize: "1.3rem" }}><AppIcon icon={goal.icon} size={22} /></span>
            <span className="block" style={{ fontSize: "0.8rem", fontWeight: 500, color: t.text, marginTop: 4 }}>{goal.label}</span>
          </button>
        ))}
      </div>
    </div>,
    // Step 2: Stress & Sleep
    <div key="step2">
      <div className="text-center mb-6">
        <span style={{ fontSize: "2rem" }}>🌊</span>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: t.text, marginTop: 8 }}>Как вы себя чувствуете?</h3>
      </div>
      <div className="space-y-5">
        <div>
          <label style={{ fontSize: "0.8rem", fontWeight: 500, color: t.textSecondary, marginBottom: 8, display: "block" }}>Уровень стресса</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button key={level} className="flex-1 py-3 rounded-xl border text-center" style={chipStyle(formData.stressLevel === level, t.lavender)}
                onClick={() => setFormData({ ...formData, stressLevel: level })}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{level}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span style={{ fontSize: "0.65rem", color: t.textFaint }}>Спокойно</span>
            <span style={{ fontSize: "0.65rem", color: t.textFaint }}>Сильный стресс</span>
          </div>
        </div>
        <div>
          <label style={{ fontSize: "0.8rem", fontWeight: 500, color: t.textSecondary, marginBottom: 8, display: "block" }}>Часов сна</label>
          <div className="flex flex-wrap gap-2">
            {["<5", "5-6", "6-7", "7-8", "8-9", ">9"].map((h) => (
              <button key={h} className="px-4 py-2.5 rounded-xl border" style={chipStyle(formData.sleepHours === h, t.teal)}
                onClick={() => setFormData({ ...formData, sleepHours: h })}>{h}ч</button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize: "0.8rem", fontWeight: 500, color: t.textSecondary, marginBottom: 8, display: "block" }}>Пик продуктивности</label>
          <div className="grid grid-cols-2 gap-2">
            {peakTimeOptions.map((opt) => (
              <button key={opt.value} className="p-3 rounded-xl border text-center" style={chipStyle(formData.peakTime === opt.value, t.gold)}
                onClick={() => setFormData({ ...formData, peakTime: opt.value })}>{opt.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    // Step 3: Habits & Exercise
    <div key="step3">
      <div className="text-center mb-6">
        <span style={{ fontSize: "2rem" }}>🌱</span>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: t.text, marginTop: 8 }}>Привычки и движение</h3>
      </div>
      <div className="space-y-5">
        <div>
          <label style={{ fontSize: "0.8rem", fontWeight: 500, color: t.textSecondary, marginBottom: 8, display: "block" }}>Желаемые привычки</label>
          <div className="flex flex-wrap gap-2">
            {habitOptions.map((h) => (
              <button key={h} className="px-3.5 py-2 rounded-full border" style={chipStyle(formData.desiredHabits.includes(h), t.sage)}
                onClick={() => toggleMulti("desiredHabits", h)}>{h}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize: "0.8rem", fontWeight: 500, color: t.textSecondary, marginBottom: 8, display: "block" }}>Физическая активность</label>
          <div className="space-y-2">
            {exerciseOptions.map((opt) => (
              <button key={opt.value} className="w-full p-3 rounded-xl border text-left" style={chipStyle(formData.exerciseFrequency === opt.value, t.terracotta)}
                onClick={() => setFormData({ ...formData, exerciseFrequency: opt.value })}>{opt.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    // Step 4: Blockers & Relax
    <div key="step4">
      <div className="text-center mb-6">
        <span style={{ fontSize: "2rem" }}>🦋</span>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: t.text, marginTop: 8 }}>Сложности и ресурсы</h3>
      </div>
      <div className="space-y-5">
        <div>
          <label style={{ fontSize: "0.8rem", fontWeight: 500, color: t.textSecondary, marginBottom: 8, display: "block" }}>Что мешает?</label>
          <div className="flex flex-wrap gap-2">
            {blockerOptions.map((b) => (
              <button key={b} className="px-3.5 py-2 rounded-full border" style={chipStyle(formData.productivityBlockers.includes(b), t.lavender)}
                onClick={() => toggleMulti("productivityBlockers", b)}>{b}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize: "0.8rem", fontWeight: 500, color: t.textSecondary, marginBottom: 8, display: "block" }}>Что помогает расслабиться?</label>
          <div className="flex flex-wrap gap-2">
            {relaxOptions.map((r) => (
              <button key={r} className="px-3.5 py-2 rounded-full border" style={chipStyle(formData.relaxMethods.includes(r), t.teal)}
                onClick={() => toggleMulti("relaxMethods", r)}>{r}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize: "0.8rem", fontWeight: 500, color: t.textSecondary, marginBottom: 8, display: "block" }}>Мотивация</label>
          <div className="flex flex-wrap gap-2">
            {motivationOptions.map((m) => (
              <button key={m.value} className="px-3.5 py-2 rounded-full border" style={chipStyle(formData.motivation === m.value, t.gold)}
                onClick={() => setFormData({ ...formData, motivation: m.value })}>{m.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    // Step 5: Free text
    <div key="step5">
      <div className="text-center mb-6">
        <span style={{ fontSize: "2rem" }}>✨</span>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: t.text, marginTop: 8 }}>Последние штрихи</h3>
      </div>
      <div className="space-y-4">
        <div>
          <label style={{ fontSize: "0.8rem", fontWeight: 500, color: t.textSecondary, marginBottom: 6, display: "block" }}>Цели на месяц</label>
          <textarea value={formData.monthGoals} onChange={(e) => setFormData({ ...formData, monthGoals: e.target.value })}
            placeholder="Что бы вы хотели достичь?..." className="w-full rounded-xl px-4 py-3 border outline-none resize-none"
            style={{ fontSize: "0.85rem", backgroundColor: t.inputBg, borderColor: t.borderLight, color: t.text }} rows={3} />
        </div>
        <div>
          <label style={{ fontSize: "0.8rem", fontWeight: 500, color: t.textSecondary, marginBottom: 6, display: "block" }}>Здоровье (необязательно)</label>
          <textarea value={formData.healthNotes} onChange={(e) => setFormData({ ...formData, healthNotes: e.target.value })}
            placeholder="Ограничения, особенности..." className="w-full rounded-xl px-4 py-3 border outline-none resize-none"
            style={{ fontSize: "0.85rem", backgroundColor: t.inputBg, borderColor: t.borderLight, color: t.text }} rows={3} />
        </div>
      </div>
    </div>,
  ];

  return (
    <div className="px-5 pt-14 pb-8">
      <AnimatePresence mode="wait">
        {showQuestionnaire ? (
          <motion.div key="questionnaire" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: "0.75rem", color: t.textMuted }}>Шаг {step + 1} из {totalSteps}</span>
              {questionnaire.filled && (
                <button onClick={() => setShowQuestionnaire(false)} style={{ fontSize: "0.75rem", color: t.sage, fontWeight: 500 }}>Пропустить</button>
              )}
            </div>
            <div className="w-full rounded-full h-1.5 mb-6" style={{ backgroundColor: t.border }}>
              <motion.div className="h-1.5 rounded-full" style={{ backgroundColor: t.sage }} animate={{ width: `${((step + 1) / totalSteps) * 100}%` }} transition={{ duration: 0.3 }} />
            </div>
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              {steps[step]}
            </motion.div>
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <button className="flex-1 py-3 rounded-xl border" style={{ borderColor: t.borderLight, fontSize: "0.9rem", fontWeight: 500, color: t.textMuted }}
                  onClick={() => setStep(step - 1)}>Назад</button>
              )}
              {step < totalSteps - 1 ? (
                <button className="flex-1 py-3 rounded-xl text-white" style={{ backgroundColor: t.sage, fontSize: "0.9rem", fontWeight: 600 }}
                  onClick={() => setStep(step + 1)}>Дальше</button>
              ) : (
                <button className="flex-1 py-3 rounded-xl text-white"
                  style={{ background: "linear-gradient(135deg, #8DB596, #7BAFB0)", fontSize: "0.9rem", fontWeight: 600 }}
                  onClick={handleSave}>Сохранить ✓</button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Profile header */}
            <motion.div className="text-center mb-6">
              <div className="relative inline-block mb-3">
                {/* Avatar circle */}
                <motion.div
                  className="w-24 h-24 rounded-full shadow-md mx-auto overflow-hidden relative"
                  style={{ background: tier.gradient }}
                  whileTap={{ scale: 0.95 }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Аватар"
                      className="w-full h-full object-cover"
                      onError={() => setAvatarUrl(null)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span style={{ fontSize: "2.5rem", fontWeight: 800 }} className="text-white">{profile.level}</span>
                    </div>
                  )}
                </motion.div>

                {/* Camera upload button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <motion.button
                  className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center border-2 shadow-sm"
                  style={{
                    backgroundColor: t.sage,
                    borderColor: t.bg,
                  }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                >
                  {avatarUploading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-4 h-4 text-white" />
                    </motion.div>
                  ) : (
                    <Camera className="w-4 h-4 text-white" />
                  )}
                </motion.button>
              </div>
              <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: t.text }}>
                {questionnaire.filled && questionnaire.name ? questionnaire.name : profile.name}
              </h1>
              <span className="inline-block px-3 py-1 rounded-full mt-1"
                style={{ backgroundColor: tier.color + "18", color: tier.color, fontSize: "0.75rem", fontWeight: 600 }}>
                <AppIcon icon={tier.icon} size={13} color={tier.color} className="inline-block mr-1" /> {tier.name}
              </span>
            </motion.div>

            {/* Settings section */}
            <GlassPanel darkMode={darkMode} className="rounded-2xl mb-5 overflow-hidden"
              style={{ padding: 0 }}>
              {/* Dark mode */}
              <button className="w-full p-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${t.border}` }}
                onClick={toggleDarkMode}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.bgSecondary }}>
                  {darkMode ? <Moon className="w-5 h-5" style={{ color: t.lavender }} /> : <Sun className="w-5 h-5" style={{ color: t.gold }} />}
                </div>
                <div className="flex-1 text-left">
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text }}>Тёмная тема</span>
                  <p style={{ fontSize: "0.72rem", color: t.textMuted }}>{darkMode ? "Включена" : "Выключена"}</p>
                </div>
                <div className="w-11 h-6 rounded-full transition-colors" style={{ backgroundColor: darkMode ? t.sage : t.textFaint }}>
                  <motion.div className="w-5 h-5 rounded-full bg-white shadow-sm mt-0.5"
                    animate={{ x: darkMode ? 22 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                </div>
              </button>
              {/* Edit questionnaire */}
              <button className="w-full p-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${t.border}` }}
                onClick={() => { setShowQuestionnaire(true); setStep(0); }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.bgSecondary }}>
                  <Edit3 className="w-5 h-5" style={{ color: t.textMuted }} />
                </div>
                <div className="flex-1 text-left">
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text }}>
                    {questionnaire.filled ? "Изменить анкету" : "Заполнить анкету"}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5" style={{ color: t.textFaint }} />
              </button>
              {/* Notifications */}
              <button className="w-full p-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${t.border}` }}
                onClick={() => navigate("/notifications")}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.bgSecondary }}>
                  <Bell className="w-5 h-5" style={{ color: t.terracotta }} />
                </div>
                <div className="flex-1 text-left">
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text }}>Напоминания</span>
                </div>
                <ChevronRight className="w-5 h-5" style={{ color: t.textFaint }} />
              </button>
              {/* Journal */}
              <button className="w-full p-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${t.border}` }}
                onClick={() => navigate("/journal")}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.bgSecondary }}>
                  <BookOpen className="w-5 h-5" style={{ color: t.lavender }} />
                </div>
                <div className="flex-1 text-left">
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text }}>Дневник</span>
                </div>
                <ChevronRight className="w-5 h-5" style={{ color: t.textFaint }} />
              </button>
              {/* Export JSON */}
              <button className="w-full p-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${t.border}` }} onClick={exportData}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.bgSecondary }}>
                  <Download className="w-5 h-5" style={{ color: t.dustyBlue }} />
                </div>
                <div className="flex-1 text-left">
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text }}>Экспорт данных</span>
                  <p style={{ fontSize: "0.72rem", color: t.textMuted }}>Скачать в JSON</p>
                </div>
                <ChevronRight className="w-5 h-5" style={{ color: t.textFaint }} />
              </button>
              {/* Export PDF */}
              <button className="w-full p-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${t.border}` }}
                onClick={() => setShowPdfModal(true)}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.sage + "12" }}>
                  <FileText className="w-5 h-5" style={{ color: t.sage }} />
                </div>
                <div className="flex-1 text-left">
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text }}>PDF-отчёт</span>
                  <p style={{ fontSize: "0.72rem", color: t.textMuted }}>Красивый отчёт о прогрессе</p>
                </div>
                <ChevronRight className="w-5 h-5" style={{ color: t.textFaint }} />
              </button>
              {/* Reset tours */}
              {(seenTours.length > 0 || seenTips.length > 0) && (
                <button className="w-full p-4 flex items-center gap-3" onClick={resetTours}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.bgSecondary }}>
                    <RotateCcw className="w-5 h-5" style={{ color: t.warm }} />
                  </div>
                  <div className="flex-1 text-left">
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text }}>Сбросить подсказки</span>
                    <p style={{ fontSize: "0.72rem", color: t.textMuted }}>Показать все туры и советы заново</p>
                  </div>
                  <ChevronRight className="w-5 h-5" style={{ color: t.textFaint }} />
                </button>
              )}
            </GlassPanel>

            {/* Account Management Section */}
            {!isAdmin && (
              <GlassPanel darkMode={darkMode} className="rounded-2xl mb-5 overflow-hidden" style={{ padding: 0 }}>
                <div className="px-4 pt-3 pb-1">
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, color: t.textFaint, letterSpacing: "0.5px", textTransform: "uppercase" as const }}>Аккаунт</span>
                </div>
                {/* Change Name */}
                <button className="w-full p-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${t.border}` }}
                  onClick={() => { setShowChangeName(true); setNewDisplayName(questionnaire.name || profile.name || ""); setAccountError(""); setAccountSuccess(""); }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.dustyBlue + "12" }}>
                    <UserPen className="w-5 h-5" style={{ color: t.dustyBlue }} />
                  </div>
                  <div className="flex-1 text-left">
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text }}>Сменить имя</span>
                    <p style={{ fontSize: "0.72rem", color: t.textMuted }}>Изменить отображаемое имя</p>
                  </div>
                  <ChevronRight className="w-5 h-5" style={{ color: t.textFaint }} />
                </button>
                {/* Change Password */}
                <button className="w-full p-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${t.border}` }}
                  onClick={() => { setShowChangePassword(true); setCurrentPw(""); setNewPw(""); setConfirmPw(""); setAccountError(""); setAccountSuccess(""); }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.lavender + "12" }}>
                    <KeyRound className="w-5 h-5" style={{ color: t.lavender }} />
                  </div>
                  <div className="flex-1 text-left">
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text }}>Сменить пароль</span>
                    <p style={{ fontSize: "0.72rem", color: t.textMuted }}>Обновить пароль входа</p>
                  </div>
                  <ChevronRight className="w-5 h-5" style={{ color: t.textFaint }} />
                </button>
                {/* Logout */}
                <button className="w-full p-4 flex items-center gap-3" onClick={() => setShowLogoutConfirm(true)}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.terracotta + "12" }}>
                    <LogOut className="w-5 h-5" style={{ color: t.terracotta }} />
                  </div>
                  <div className="flex-1 text-left">
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: t.terracotta }}>Выйти из аккаунта</span>
                    <p style={{ fontSize: "0.72rem", color: t.textMuted }}>Данные сохранятся на сервере</p>
                  </div>
                  <ChevronRight className="w-5 h-5" style={{ color: t.textFaint }} />
                </button>
              </GlassPanel>
            )}

            {/* Admin Logout (simplified) */}
            {isAdmin && (
              <motion.button
                className="w-full rounded-2xl p-4 flex items-center gap-3 mb-5 border"
                style={{ backgroundColor: t.terracotta + "08", borderColor: t.terracotta + "20" }}
                onClick={handleLogout} whileTap={{ scale: 0.98 }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.terracotta + "12" }}>
                  <LogOut className="w-5 h-5" style={{ color: t.terracotta }} />
                </div>
                <div className="flex-1 text-left">
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: t.terracotta }}>Выйти из аккаунта</span>
                </div>
              </motion.button>
            )}

            {/* Questionnaire summary */}
            {questionnaire.filled && (
              <motion.div className="rounded-2xl p-4 mb-5 border"
                style={{ backgroundColor: t.sage + "10", borderColor: t.sage + "25" }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text, marginBottom: 8, display: "block" }}>О вас 🌿</span>
                <div className="space-y-2">
                  {questionnaire.goals.length > 0 && (
                    <p style={{ fontSize: "0.78rem", color: t.textSecondary }}>
                      <span style={{ color: t.textMuted }}>Фокус:</span> {questionnaire.goals.map(g => goalOptions.find(o => o.value === g)?.label).filter(Boolean).join(", ")}
                    </p>
                  )}
                  {questionnaire.peakTime && (
                    <p style={{ fontSize: "0.78rem", color: t.textSecondary }}>
                      <span style={{ color: t.textMuted }}>Пик:</span> {peakTimeOptions.find(o => o.value === questionnaire.peakTime)?.label}
                    </p>
                  )}
                  {questionnaire.desiredHabits.length > 0 && (
                    <p style={{ fontSize: "0.78rem", color: t.textSecondary }}>
                      <span style={{ color: t.textMuted }}>Хочет:</span> {questionnaire.desiredHabits.join(", ")}
                    </p>
                  )}
                  {questionnaire.monthGoals && (
                    <p style={{ fontSize: "0.78rem", color: t.textSecondary, fontStyle: "italic" }}>«{questionnaire.monthGoals}»</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* ═══ Plant Companion Widget ═══ */}
            <motion.div className="rounded-2xl p-4 mb-5 border overflow-hidden relative"
              style={{ backgroundColor: t.card, borderColor: t.sage + "30" }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
              <div className="flex items-start gap-4">
                {/* Plant visual */}
                <motion.div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 relative"
                  style={{ background: `linear-gradient(135deg, ${t.sage}15, ${t.sage}08)`, border: `1px solid ${t.sage}20` }}
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span style={{ fontSize: "2.5rem" }}>
                    {(() => {
                      const gp = plantState.growthPoints;
                      if (gp >= 200) return "🌳";
                      if (gp >= 150) return "🌴";
                      if (gp >= 100) return "🌿";
                      if (gp >= 70) return "🌸";
                      if (gp >= 40) return "🌱";
                      if (gp >= 15) return "🌾";
                      return "🌰";
                    })()}
                  </span>
                  {plantState.butterflies > 0 && (
                    <motion.span
                      className="absolute -top-1 -right-1"
                      style={{ fontSize: "0.8rem" }}
                      animate={{ y: [0, -3, 0], x: [0, 2, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      🦋
                    </motion.span>
                  )}
                </motion.div>

                {/* Plant info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: t.text }}>{plantState.name}</span>
                    <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "0.6rem", fontWeight: 600, backgroundColor: t.sage + "18", color: t.sage }}>
                      {plantState.growthPoints} GP
                    </span>
                  </div>

                  {/* Health bar */}
                  <div className="mb-1.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <span style={{ fontSize: "0.6rem", color: t.textMuted }}>Здоровье</span>
                      <span style={{ fontSize: "0.6rem", color: plantState.health > 50 ? t.sage : t.terracotta }}>{plantState.health}%</span>
                    </div>
                    <div className="w-full rounded-full h-1.5" style={{ backgroundColor: t.border }}>
                      <motion.div className="h-1.5 rounded-full" style={{ backgroundColor: plantState.health > 50 ? "#8DB596" : plantState.health > 25 ? "#C4A86C" : "#C4876C" }}
                        animate={{ width: `${plantState.health}%` }} transition={{ duration: 0.5 }} />
                    </div>
                  </div>

                  {/* Water bar */}
                  <div className="mb-1.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <span style={{ fontSize: "0.6rem", color: t.textMuted }}>Вода</span>
                      <span style={{ fontSize: "0.6rem", color: "#7EA8BE" }}>{plantState.waterLevel}%</span>
                    </div>
                    <div className="w-full rounded-full h-1.5" style={{ backgroundColor: t.border }}>
                      <motion.div className="h-1.5 rounded-full" style={{ backgroundColor: "#7EA8BE" }}
                        animate={{ width: `${plantState.waterLevel}%` }} transition={{ duration: 0.5 }} />
                    </div>
                  </div>

                  {/* Happiness bar */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <span style={{ fontSize: "0.6rem", color: t.textMuted }}>Счастье</span>
                      <span style={{ fontSize: "0.6rem", color: "#B88FA7" }}>{plantState.happiness}%</span>
                    </div>
                    <div className="w-full rounded-full h-1.5" style={{ backgroundColor: t.border }}>
                      <motion.div className="h-1.5 rounded-full" style={{ backgroundColor: "#B88FA7" }}
                        animate={{ width: `${plantState.happiness}%` }} transition={{ duration: 0.5 }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-3">
                <motion.button
                  className="flex-1 py-2 rounded-xl border flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: "#7EA8BE12", borderColor: "#7EA8BE30" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={waterPlant}
                >
                  <Droplets className="w-3.5 h-3.5" style={{ color: "#7EA8BE" }} />
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#7EA8BE" }}>Полить</span>
                </motion.button>
                <motion.button
                  className="flex-1 py-2 rounded-xl border flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: "#B88FA712", borderColor: "#B88FA730" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={interactPlant}
                >
                  <Heart className="w-3.5 h-3.5" style={{ color: "#B88FA7" }} />
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#B88FA7" }}>Погладить</span>
                </motion.button>
              </div>

              {/* Plant age */}
              {plantState.createdAt && (
                <p style={{ fontSize: "0.6rem", color: t.textFaint, textAlign: "center", marginTop: 6 }}>
                  С вами {Math.max(1, Math.round((Date.now() - new Date(plantState.createdAt + "T12:00:00").getTime()) / 86400000))} {
                    (() => {
                      const d = Math.max(1, Math.round((Date.now() - new Date(plantState.createdAt + "T12:00:00").getTime()) / 86400000));
                      if (d % 10 === 1 && d % 100 !== 11) return "день";
                      if ([2,3,4].includes(d % 10) && ![12,13,14].includes(d % 100)) return "дня";
                      return "дней";
                    })()
                  } {plantState.totalInteractions > 0 && `· ${plantState.totalInteractions} взаимодействий`}
                </p>
              )}
            </motion.div>

            {/* XP bar */}
            <GlassPanel darkMode={darkMode} color={t.sage} className="rounded-2xl p-4 mb-5"
              style={{}}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: "0.8rem", fontWeight: 500, color: t.textMuted }}>Уровень {profile.level} → {profile.level + 1}</span>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: t.sage }}>{profile.xp}/{profile.xpToNext} XP</span>
              </div>
              <div className="w-full rounded-full h-3" style={{ backgroundColor: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
                <motion.div className="h-3 rounded-full" style={{ background: "linear-gradient(90deg, #8DB596, #7BAFB0)" }}
                  initial={{ width: 0 }} animate={{ width: `${levelProgress}%` }} transition={{ delay: 0.3, duration: 1 }} />
              </div>
              <p style={{ fontSize: "0.7rem", color: t.textFaint, marginTop: 6 }}>Ещё {profile.xpToNext - profile.xp} XP — вы почти у цели!</p>
            </GlassPanel>

            {/* Tier roadmap */}
            <GlassPanel darkMode={darkMode} color={tier.color} className="rounded-2xl p-4 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <AppIcon icon={tier.icon} size={18} color={tier.color} />
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text }}>Путь роста</span>
                <span className="ml-auto px-2 py-0.5 rounded-full" style={{ fontSize: "0.65rem", fontWeight: 600, backgroundColor: tier.color + "18", color: tier.color }}>
                  {tier.name}
                </span>
              </div>
              <div className="flex items-center gap-0.5 overflow-x-auto pb-2 -mx-1 px-1">
                {allTiers.map((tr, i) => {
                  const isReached = i <= currentTierIndex;
                  const isCurrent = i === currentTierIndex;
                  const nextTier = allTiers[i + 1];
                  const tierProgress = isCurrent && nextTier
                    ? Math.min(((profile.level - tr.minLevel) / (nextTier.minLevel - tr.minLevel)) * 100, 100)
                    : isReached ? 100 : 0;

                  return (
                    <div key={tr.name} className="flex flex-col items-center shrink-0" style={{ width: 32 }}>
                      <motion.div
                        className="w-7 h-7 rounded-full flex items-center justify-center mb-1 relative"
                        style={{
                          backgroundColor: isReached ? tr.color + "25" : t.bgSecondary,
                          border: isCurrent ? `2px solid ${tr.color}` : `1px solid ${isReached ? tr.color + "40" : t.border}`,
                        }}
                        animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <span style={{ fontSize: "0.7rem", opacity: isReached ? 1 : 0.4 }}><AppIcon icon={tr.icon} size={12} color={isReached ? tr.color : undefined} /></span>
                      </motion.div>
                      <span style={{
                        fontSize: "0.45rem",
                        fontWeight: isCurrent ? 700 : 500,
                        color: isCurrent ? tr.color : isReached ? t.textMuted : t.textFaint,
                        textAlign: "center",
                        lineHeight: 1.1,
                      }}>
                        {tr.minLevel}
                      </span>
                    </div>
                  );
                })}
              </div>
              {allTiers[currentTierIndex + 1] && (
                <p style={{ fontSize: "0.68rem", color: t.textMuted, marginTop: 4, textAlign: "center" }}>
                  До «{allTiers[currentTierIndex + 1].name}» {allTiers[currentTierIndex + 1].icon} — ещё {allTiers[currentTierIndex + 1].minLevel - profile.level} {
                    (() => {
                      const n = allTiers[currentTierIndex + 1].minLevel - profile.level;
                      if (n % 10 === 1 && n % 100 !== 11) return "уровень";
                      if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return "уровня";
                      return "уровней";
                    })()
                  }
                </p>
              )}
            </GlassPanel>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {stats.map((stat, i) => (
                <GlassPanel key={stat.label} darkMode={darkMode} color={stat.color} className="rounded-2xl p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + i * 0.05 }}>
                    <stat.icon className="w-5 h-5 mb-2" style={{ color: stat.color }} />
                    <span className="block" style={{ fontSize: "1.3rem", fontWeight: 700, color: t.text }}>{stat.value.toLocaleString()}</span>
                    <span style={{ fontSize: "0.7rem", color: t.textMuted }}>{stat.label}</span>
                  </motion.div>
                </GlassPanel>
              ))}
            </div>

            {/* Soft Achievements - care-focused */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="flex items-center justify-between mb-4">
                <span style={{ fontSize: "0.95rem", fontWeight: 600, color: t.text }}>Достижения заботы</span>
                <span className="px-2.5 py-1 rounded-full" style={{ fontSize: "0.75rem", fontWeight: 600, backgroundColor: t.lavender + "18", color: t.lavender }}>
                  {softAchievements.filter((a) => a.unlocked).length}/{softAchievements.length}
                </span>
              </div>
              <p style={{ fontSize: "0.72rem", color: t.textMuted, marginBottom: 10, fontStyle: "italic" }}>
                Не за продуктивность, а за заботу о себе
              </p>
              <div className="grid grid-cols-2 gap-3">
                {softAchievements.map((ach, i) => {
                  const catColors: Record<string, string> = {
                    care: "#B88FA7", growth: "#8DB596", courage: "#C4876C", connection: "#7EA8BE", awareness: "#9B8EC4",
                  };
                  const catLabels: Record<string, string> = {
                    care: "Забота", growth: "Рост", courage: "Смелость", connection: "Связь", awareness: "Осознанность",
                  };
                  const color = catColors[ach.category] || t.textFaint;
                  return (
                    <motion.div key={ach.id} className="rounded-2xl p-3.5 border"
                      style={{
                        backgroundColor: ach.unlocked ? color + "10" : t.bgSecondary,
                        borderColor: ach.unlocked ? color + "25" : t.border,
                        opacity: ach.unlocked ? 1 : 0.55,
                      }}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: ach.unlocked ? 1 : 0.55, y: 0 }} transition={{ delay: 0.4 + i * 0.03 }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <AppIcon icon={ach.icon} size={20} color={ach.unlocked ? ach.color : undefined} />
                        {!ach.unlocked && <Lock className="w-3 h-3" style={{ color: t.textFaint }} />}
                      </div>
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: ach.unlocked ? t.text : t.textFaint }}>{ach.title}</span>
                      <p style={{ fontSize: "0.62rem", lineHeight: 1.3, color: t.textMuted, marginTop: 2 }}>{ach.description}</p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full"
                        style={{ fontSize: "0.55rem", fontWeight: 600, backgroundColor: color + "15", color }}>
                        {catLabels[ach.category]}
                      </span>
                      {ach.unlocked && ach.unlockedAt && (
                        <span className="block" style={{ fontSize: "0.55rem", color, marginTop: 3 }}>
                          ✓ {new Date(ach.unlockedAt).toLocaleDateString("ru-RU")}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>


          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Change Name Modal ═══ */}
      <AnimatePresence>
        {showChangeName && (
          <motion.div className="fixed inset-0 z-[150] flex items-center justify-center px-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowChangeName(false)} />
            <motion.div className="relative w-full max-w-[380px] rounded-2xl p-5 border shadow-xl"
              style={{ backgroundColor: t.bg, borderColor: t.border }}
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.dustyBlue + "15" }}>
                    <UserPen className="w-4 h-4" style={{ color: t.dustyBlue }} />
                  </div>
                  <span style={{ fontSize: "1rem", fontWeight: 700, color: t.text }}>Сменить имя</span>
                </div>
                <button onClick={() => setShowChangeName(false)} className="p-1.5 rounded-lg" style={{ backgroundColor: t.bgSecondary }}>
                  <X className="w-4 h-4" style={{ color: t.textMuted }} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 500, color: t.textMuted, marginBottom: 4, display: "block" }}>Новое имя</label>
                  <input value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder="Введите новое имя..." className="w-full rounded-xl px-4 py-3 border outline-none"
                    style={{ fontSize: "0.9rem", backgroundColor: t.inputBg, borderColor: t.borderLight, color: t.text }}
                    onKeyDown={(e) => e.key === "Enter" && handleChangeName()} />
                </div>
                {accountError && (
                  <p style={{ fontSize: "0.75rem", color: t.terracotta, padding: "8px 12px", borderRadius: 10, backgroundColor: t.terracotta + "10" }}>{accountError}</p>
                )}
                {accountSuccess && (
                  <motion.p initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                    style={{ fontSize: "0.75rem", color: t.sage, padding: "8px 12px", borderRadius: 10, backgroundColor: t.sage + "10", display: "flex", alignItems: "center", gap: 6 }}>
                    <Check className="w-3.5 h-3.5" /> {accountSuccess}
                  </motion.p>
                )}
                <button className="w-full py-3 rounded-xl text-white flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${t.dustyBlue}, ${t.teal})`, fontSize: "0.9rem", fontWeight: 600, opacity: accountLoading ? 0.7 : 1 }}
                  onClick={handleChangeName} disabled={accountLoading}>
                  {accountLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {accountLoading ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Change Password Modal ═══ */}
      <AnimatePresence>
        {showChangePassword && (
          <motion.div className="fixed inset-0 z-[150] flex items-center justify-center px-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowChangePassword(false)} />
            <motion.div className="relative w-full max-w-[380px] rounded-2xl p-5 border shadow-xl"
              style={{ backgroundColor: t.bg, borderColor: t.border }}
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.lavender + "15" }}>
                    <KeyRound className="w-4 h-4" style={{ color: t.lavender }} />
                  </div>
                  <span style={{ fontSize: "1rem", fontWeight: 700, color: t.text }}>Сменить пароль</span>
                </div>
                <button onClick={() => setShowChangePassword(false)} className="p-1.5 rounded-lg" style={{ backgroundColor: t.bgSecondary }}>
                  <X className="w-4 h-4" style={{ color: t.textMuted }} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 500, color: t.textMuted, marginBottom: 4, display: "block" }}>Текущий пароль</label>
                  <div className="relative">
                    <input type={showCurrentPw ? "text" : "password"} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                      placeholder="Введите текущий пароль..." className="w-full rounded-xl px-4 py-3 pr-11 border outline-none"
                      style={{ fontSize: "0.9rem", backgroundColor: t.inputBg, borderColor: t.borderLight, color: t.text }} />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowCurrentPw(!showCurrentPw)}>
                      {showCurrentPw ? <EyeOff className="w-4 h-4" style={{ color: t.textFaint }} /> : <Eye className="w-4 h-4" style={{ color: t.textFaint }} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 500, color: t.textMuted, marginBottom: 4, display: "block" }}>Новый пароль</label>
                  <div className="relative">
                    <input type={showNewPw ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)}
                      placeholder="Не менее 6 символов..." className="w-full rounded-xl px-4 py-3 pr-11 border outline-none"
                      style={{ fontSize: "0.9rem", backgroundColor: t.inputBg, borderColor: t.borderLight, color: t.text }} />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowNewPw(!showNewPw)}>
                      {showNewPw ? <EyeOff className="w-4 h-4" style={{ color: t.textFaint }} /> : <Eye className="w-4 h-4" style={{ color: t.textFaint }} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 500, color: t.textMuted, marginBottom: 4, display: "block" }}>Подтвердите пароль</label>
                  <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="Повторите новый пароль..." className="w-full rounded-xl px-4 py-3 border outline-none"
                    style={{ fontSize: "0.9rem", backgroundColor: t.inputBg, borderColor: t.borderLight, color: t.text }}
                    onKeyDown={(e) => e.key === "Enter" && handleChangePassword()} />
                  {newPw && confirmPw && newPw !== confirmPw && (
                    <p style={{ fontSize: "0.68rem", color: t.terracotta, marginTop: 4 }}>Пароли не совпадают</p>
                  )}
                  {newPw && confirmPw && newPw === confirmPw && (
                    <p style={{ fontSize: "0.68rem", color: t.sage, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <Check className="w-3 h-3" /> Пароли совпадают
                    </p>
                  )}
                </div>
                {accountError && (
                  <p style={{ fontSize: "0.75rem", color: t.terracotta, padding: "8px 12px", borderRadius: 10, backgroundColor: t.terracotta + "10" }}>{accountError}</p>
                )}
                {accountSuccess && (
                  <motion.p initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                    style={{ fontSize: "0.75rem", color: t.sage, padding: "8px 12px", borderRadius: 10, backgroundColor: t.sage + "10", display: "flex", alignItems: "center", gap: 6 }}>
                    <Check className="w-3.5 h-3.5" /> {accountSuccess}
                  </motion.p>
                )}
                <button className="w-full py-3 rounded-xl text-white flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${t.lavender}, ${t.dustyBlue})`, fontSize: "0.9rem", fontWeight: 600, opacity: accountLoading ? 0.7 : 1 }}
                  onClick={handleChangePassword} disabled={accountLoading}>
                  {accountLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {accountLoading ? "Сохранение..." : "Изменить пароль"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Logout Confirmation Modal ═══ */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div className="fixed inset-0 z-[150] flex items-center justify-center px-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowLogoutConfirm(false)} />
            <motion.div className="relative w-full max-w-[340px] rounded-2xl p-5 border shadow-xl text-center"
              style={{ backgroundColor: t.bg, borderColor: t.border }}
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: t.terracotta + "12" }}>
                <LogOut className="w-7 h-7" style={{ color: t.terracotta }} />
              </div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: t.text, marginBottom: 6 }}>Выйти из аккаунта?</h3>
              <p style={{ fontSize: "0.8rem", color: t.textMuted, marginBottom: 20, lineHeight: 1.5 }}>
                Ваши данные сохранены на сервере и будут доступны при следующем входе
              </p>
              <div className="flex gap-3">
                <button className="flex-1 py-3 rounded-xl border"
                  style={{ borderColor: t.borderLight, fontSize: "0.88rem", fontWeight: 500, color: t.textMuted }}
                  onClick={() => setShowLogoutConfirm(false)}>Отмена</button>
                <motion.button className="flex-1 py-3 rounded-xl text-white"
                  style={{ backgroundColor: t.terracotta, fontSize: "0.88rem", fontWeight: 600 }}
                  onClick={handleLogout} whileTap={{ scale: 0.97 }}>Выйти</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar Cropper Modal */}
      {cropFile && (
        <AvatarCropper
          file={cropFile}
          onCrop={handleCroppedUpload}
          onCancel={() => setCropFile(null)}
        />
      )}

      {/* PDF Export Modal */}
      <PdfExportModal
        open={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        data={{
          profile, tasks, habits, moods, questionnaire, journalEntries,
          plantState, softAchievements, anxietyEntries, worryEntries,
          pomodoroStats, sleepEntries,
        }}
      />
    </div>
  );
}