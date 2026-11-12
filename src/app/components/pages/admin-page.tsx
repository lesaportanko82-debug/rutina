import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, Activity, RefreshCw, Loader2, Search, ChevronDown, ChevronUp,
  LogOut, ShieldBan, ShieldCheck, KeyRound, Mail, UserPen, Trash2, X,
  Check, Eye, EyeOff, AlertTriangle,
} from "lucide-react";
import { projectId, publicAnonKey } from "../supabase-client";

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-ff738703`;
// Admin key — read from env var (set VITE_ADMIN_SECRET_KEY in your environment)
// Falls back to empty string so requests fail rather than use a weak default
const ADMIN_KEY = import.meta.env.VITE_ADMIN_SECRET_KEY ?? "";

const C = {
  bg: "#FAF8F5",
  sage: "#8DB596",
  lavender: "#9B8EC4",
  terracotta: "#C4876C",
  dustyBlue: "#7EA8BE",
  teal: "#7BAFB0",
  gold: "#C4A86C",
  text: "#4A4540",
  textMuted: "#9B9489",
  textFaint: "#B5AFA6",
  card: "#F5F0E8",
  border: "#E8E3DC",
  inputBg: "#FAF8F5",
};

interface AdminPageProps {
  onLogout: () => void;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  level: number;
  xp: number;
  tasksCount: number;
  habitsCount: number;
  moodsCount: number;
  streak: number;
  banned: boolean;
  lastSignIn: string;
}

type ModalType = null | "password" | "email" | "name" | "delete";

export function AdminPage({ onLogout }: AdminPageProps) {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalUsers: 0, activeToday: 0, avgLevel: 0 });

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [modalInput, setModalInput] = useState("");
  const [modalInput2, setModalInput2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [toast, setToast] = useState("");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${publicAnonKey}`,
    "X-Admin-Key": ADMIN_KEY,
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users`, { headers });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setStats(data.stats || { totalUsers: 0, activeToday: 0, avgLevel: 0 });
      }
    } catch (e) {
      console.error("Admin load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Actions ───

  const handleBanToggle = async (user: UserInfo) => {
    setActionLoading(user.id);
    try {
      const res = await fetch(`${API_BASE}/admin/ban-user`, {
        method: "POST",
        headers,
        body: JSON.stringify({ userId: user.id, ban: !user.banned }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, banned: !u.banned } : u));
        showToast(user.banned ? `${user.name} разблокирован` : `${user.name} заблокирован`);
      } else {
        showToast(`Ошибка: ${data.error}`);
      }
    } catch (e) {
      console.error("Ban toggle error:", e);
    } finally {
      setActionLoading(null);
    }
  };

  const openModal = (type: ModalType, user: UserInfo) => {
    setSelectedUser(user);
    setModal(type);
    setModalInput(type === "email" ? user.email : type === "name" ? user.name : "");
    setModalInput2("");
    setModalError("");
    setModalSuccess("");
    setShowPw(false);
  };

  const closeModal = () => {
    setModal(null);
    setSelectedUser(null);
    setModalInput("");
    setModalInput2("");
    setModalError("");
    setModalSuccess("");
  };

  const handleModalAction = async () => {
    if (!selectedUser) return;
    setModalLoading(true);
    setModalError("");

    try {
      let endpoint = "";
      let body: Record<string, string> = { userId: selectedUser.id };

      if (modal === "password") {
        if (!modalInput || modalInput.length < 6) {
          setModalError("Пароль должен быть не менее 6 символов");
          setModalLoading(false);
          return;
        }
        endpoint = "/admin/change-user-password";
        body.newPassword = modalInput;
      } else if (modal === "email") {
        if (!modalInput) {
          setModalError("Введите email");
          setModalLoading(false);
          return;
        }
        endpoint = "/admin/change-user-email";
        body.newEmail = modalInput;
      } else if (modal === "name") {
        if (!modalInput.trim()) {
          setModalError("Введите имя");
          setModalLoading(false);
          return;
        }
        endpoint = "/admin/change-user-name";
        body.newName = modalInput.trim();
      } else if (modal === "delete") {
        if (modalInput !== selectedUser.name) {
          setModalError("Введите имя пользователя для подтверждения");
          setModalLoading(false);
          return;
        }
        endpoint = "/admin/delete-user";
      }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok) {
        setModalSuccess(
          modal === "password" ? "Пароль изменён"
            : modal === "email" ? "Email изменён"
            : modal === "name" ? "Имя изменено"
            : "Пользователь удалён"
        );

        if (modal === "email") {
          setUsers((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, email: modalInput } : u));
        } else if (modal === "name") {
          setUsers((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, name: modalInput.trim() } : u));
        } else if (modal === "delete") {
          setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
          setStats((s) => ({ ...s, totalUsers: s.totalUsers - 1 }));
        }

        setTimeout(closeModal, 1000);
      } else {
        setModalError(data.error || "Ошибка");
      }
    } catch (e: any) {
      setModalError("Ошибка соединения: " + e.message);
    } finally {
      setModalLoading(false);
    }
  };

  // ─── Render ───

  const bannedCount = users.filter((u) => u.banned).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4" style={{ background: `linear-gradient(180deg, ${C.lavender}15, transparent)` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: C.lavender + "20" }}>
              <span style={{ fontSize: "1.2rem" }}>&#128737;</span>
            </div>
            <div>
              <h1 style={{ fontSize: "1.2rem", fontWeight: 800, color: C.text }}>Админ-панель</h1>
              <p style={{ fontSize: "0.7rem", color: C.textMuted }}>Управление пользователями</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: C.card }}
          >
            <LogOut className="w-4 h-4" style={{ color: C.terracotta }} />
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: "Всего", value: stats.totalUsers, color: C.sage },
            { label: "Активны", value: stats.activeToday, color: C.dustyBlue },
            { label: "Ср. ур.", value: stats.avgLevel, color: C.lavender },
            { label: "Забан.", value: bannedCount, color: C.terracotta },
          ].map((s, i) => (
            <motion.div
              key={i}
              className="rounded-2xl p-2.5 text-center"
              style={{ backgroundColor: s.color + "10", border: `1px solid ${s.color}15` }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <p style={{ fontSize: "1.1rem", fontWeight: 800, color: s.color }}>{s.value}</p>
              <p style={{ fontSize: "0.55rem", color: C.textMuted }}>{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Search + Refresh */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: C.textFaint }} />
            <input
              type="text"
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none"
              style={{ fontSize: "0.8rem", backgroundColor: C.card, border: `1px solid ${C.border}`, color: C.text }}
            />
          </div>
          <button
            onClick={loadUsers}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} style={{ color: C.textMuted }} />
          </button>
        </div>
      </div>

      {/* Users list */}
      <div className="px-5 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: C.lavender }} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 mx-auto mb-3" style={{ color: C.textFaint }} />
            <p style={{ fontSize: "0.85rem", color: C.textMuted }}>
              {search ? "Пользователи не найдены" : "Пока нет пользователей"}
            </p>
          </div>
        ) : (
          <div className="space-y-2 mt-4">
            {filteredUsers.map((user, i) => (
              <motion.div
                key={user.id}
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: user.banned ? C.terracotta + "08" : C.card,
                  border: `1px solid ${user.banned ? C.terracotta + "25" : C.border}`,
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                {/* User row */}
                <button
                  className="w-full flex items-center gap-3 p-3.5 text-left"
                  onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 relative"
                    style={{
                      background: user.banned
                        ? `linear-gradient(135deg, ${C.terracotta}, ${C.textFaint})`
                        : `linear-gradient(135deg, ${C.sage}, ${C.dustyBlue})`,
                      fontSize: "0.85rem",
                      fontWeight: 700,
                    }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                    {user.banned && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                        <ShieldBan className="w-3 h-3" style={{ color: C.terracotta }} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate" style={{ fontSize: "0.85rem", fontWeight: 600, color: user.banned ? C.terracotta : C.text }}>
                        {user.name}
                      </p>
                      {user.banned && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded" style={{ fontSize: "0.5rem", fontWeight: 700, backgroundColor: C.terracotta + "18", color: C.terracotta }}>
                          BAN
                        </span>
                      )}
                    </div>
                    <p className="truncate" style={{ fontSize: "0.65rem", color: C.textFaint }}>{user.email}</p>
                  </div>
                  <div className="text-right mr-1 shrink-0">
                    <p style={{ fontSize: "0.7rem", fontWeight: 700, color: C.sage }}>Ур. {user.level}</p>
                    <p style={{ fontSize: "0.55rem", color: C.textFaint }}>{user.streak}d</p>
                  </div>
                  {expandedUser === user.id
                    ? <ChevronUp className="w-3.5 h-3.5 shrink-0" style={{ color: C.textFaint }} />
                    : <ChevronDown className="w-3.5 h-3.5 shrink-0" style={{ color: C.textFaint }} />
                  }
                </button>

                {/* Expanded user details + actions */}
                <AnimatePresence>
                  {expandedUser === user.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ borderTop: `1px solid ${C.border}` }}
                      className="overflow-hidden"
                    >
                      <div className="px-3.5 pt-3 pb-1">
                        {/* Stats grid */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {[
                            { label: "XP", value: user.xp, color: C.gold },
                            { label: "Задач", value: user.tasksCount, color: C.sage },
                            { label: "Привычек", value: user.habitsCount, color: C.dustyBlue },
                            { label: "Настроение", value: user.moodsCount, color: C.lavender },
                            { label: "Регистр.", value: user.createdAt, color: C.textMuted },
                            { label: "Посл. вход", value: user.lastSignIn, color: C.textMuted },
                          ].map((item, j) => (
                            <div key={j} className="rounded-lg p-2 text-center" style={{ backgroundColor: C.bg }}>
                              <p style={{ fontSize: "0.75rem", fontWeight: 700, color: item.color }}>{item.value}</p>
                              <p style={{ fontSize: "0.5rem", color: C.textFaint }}>{item.label}</p>
                            </div>
                          ))}
                        </div>

                        {/* User ID */}
                        <p className="mb-3 px-2 py-1.5 rounded-lg truncate" style={{ fontSize: "0.55rem", color: C.textFaint, backgroundColor: C.bg, fontFamily: "monospace" }}>
                          ID: {user.id}
                        </p>

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {/* Ban/Unban */}
                          <motion.button
                            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border"
                            style={{
                              backgroundColor: user.banned ? C.sage + "10" : C.terracotta + "08",
                              borderColor: user.banned ? C.sage + "30" : C.terracotta + "20",
                            }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => handleBanToggle(user)}
                            disabled={actionLoading === user.id}
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: C.textMuted }} />
                            ) : user.banned ? (
                              <ShieldCheck className="w-3.5 h-3.5" style={{ color: C.sage }} />
                            ) : (
                              <ShieldBan className="w-3.5 h-3.5" style={{ color: C.terracotta }} />
                            )}
                            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: user.banned ? C.sage : C.terracotta }}>
                              {user.banned ? "Разбанить" : "Забанить"}
                            </span>
                          </motion.button>

                          {/* Change Password */}
                          <motion.button
                            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border"
                            style={{ backgroundColor: C.lavender + "08", borderColor: C.lavender + "20" }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => openModal("password", user)}
                          >
                            <KeyRound className="w-3.5 h-3.5" style={{ color: C.lavender }} />
                            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: C.lavender }}>Пароль</span>
                          </motion.button>

                          {/* Change Email */}
                          <motion.button
                            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border"
                            style={{ backgroundColor: C.dustyBlue + "08", borderColor: C.dustyBlue + "20" }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => openModal("email", user)}
                          >
                            <Mail className="w-3.5 h-3.5" style={{ color: C.dustyBlue }} />
                            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: C.dustyBlue }}>Email</span>
                          </motion.button>

                          {/* Change Name */}
                          <motion.button
                            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border"
                            style={{ backgroundColor: C.sage + "08", borderColor: C.sage + "20" }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => openModal("name", user)}
                          >
                            <UserPen className="w-3.5 h-3.5" style={{ color: C.sage }} />
                            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: C.sage }}>Имя</span>
                          </motion.button>
                        </div>

                        {/* Delete button */}
                        <motion.button
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border mb-2"
                          style={{ backgroundColor: C.terracotta + "05", borderColor: C.terracotta + "15" }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => openModal("delete", user)}
                        >
                          <Trash2 className="w-3.5 h-3.5" style={{ color: C.terracotta + "90" }} />
                          <span style={{ fontSize: "0.7rem", fontWeight: 500, color: C.terracotta + "90" }}>Удалить пользователя</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Modal ═══ */}
      <AnimatePresence>
        {modal && selectedUser && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center px-5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
            <motion.div
              className="relative w-full max-w-[380px] rounded-2xl p-5 border shadow-xl"
              style={{ backgroundColor: C.bg, borderColor: C.border }}
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
                    backgroundColor: (
                      modal === "password" ? C.lavender
                        : modal === "email" ? C.dustyBlue
                        : modal === "name" ? C.sage
                        : C.terracotta
                    ) + "15",
                  }}>
                    {modal === "password" && <KeyRound className="w-4 h-4" style={{ color: C.lavender }} />}
                    {modal === "email" && <Mail className="w-4 h-4" style={{ color: C.dustyBlue }} />}
                    {modal === "name" && <UserPen className="w-4 h-4" style={{ color: C.sage }} />}
                    {modal === "delete" && <Trash2 className="w-4 h-4" style={{ color: C.terracotta }} />}
                  </div>
                  <div>
                    <span style={{ fontSize: "0.95rem", fontWeight: 700, color: C.text }}>
                      {modal === "password" ? "Сменить пароль"
                        : modal === "email" ? "Изменить email"
                        : modal === "name" ? "Изменить имя"
                        : "Удалить пользователя"}
                    </span>
                    <p style={{ fontSize: "0.68rem", color: C.textMuted }}>{selectedUser.name}</p>
                  </div>
                </div>
                <button onClick={closeModal} className="p-1.5 rounded-lg" style={{ backgroundColor: C.card }}>
                  <X className="w-4 h-4" style={{ color: C.textMuted }} />
                </button>
              </div>

              {/* Modal content */}
              <div className="space-y-3">
                {modal === "delete" ? (
                  <>
                    <div className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: C.terracotta + "08", border: `1px solid ${C.terracotta}15` }}>
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: C.terracotta }} />
                      <div>
                        <p style={{ fontSize: "0.8rem", fontWeight: 600, color: C.terracotta }}>Внимание!</p>
                        <p style={{ fontSize: "0.72rem", color: C.text, lineHeight: 1.5 }}>
                          Все данные пользователя будут удалены без возможности восстановления. Введите имя пользователя <strong>{selectedUser.name}</strong> для подтверждения.
                        </p>
                      </div>
                    </div>
                    <input
                      value={modalInput}
                      onChange={(e) => setModalInput(e.target.value)}
                      placeholder={`Введите "${selectedUser.name}"`}
                      className="w-full rounded-xl px-4 py-3 border outline-none"
                      style={{ fontSize: "0.88rem", backgroundColor: C.inputBg, borderColor: C.border, color: C.text }}
                    />
                  </>
                ) : modal === "password" ? (
                  <>
                    <label style={{ fontSize: "0.75rem", fontWeight: 500, color: C.textMuted, display: "block" }}>Новый пароль</label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        value={modalInput}
                        onChange={(e) => setModalInput(e.target.value)}
                        placeholder="Не менее 6 символов..."
                        className="w-full rounded-xl px-4 py-3 pr-11 border outline-none"
                        style={{ fontSize: "0.88rem", backgroundColor: C.inputBg, borderColor: C.border, color: C.text }}
                        onKeyDown={(e) => e.key === "Enter" && handleModalAction()}
                      />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPw(!showPw)}>
                        {showPw ? <EyeOff className="w-4 h-4" style={{ color: C.textFaint }} /> : <Eye className="w-4 h-4" style={{ color: C.textFaint }} />}
                      </button>
                    </div>
                  </>
                ) : modal === "email" ? (
                  <>
                    <label style={{ fontSize: "0.75rem", fontWeight: 500, color: C.textMuted, display: "block" }}>Новый email</label>
                    <input
                      type="email"
                      value={modalInput}
                      onChange={(e) => setModalInput(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full rounded-xl px-4 py-3 border outline-none"
                      style={{ fontSize: "0.88rem", backgroundColor: C.inputBg, borderColor: C.border, color: C.text }}
                      onKeyDown={(e) => e.key === "Enter" && handleModalAction()}
                    />
                    <p style={{ fontSize: "0.65rem", color: C.textFaint }}>Текущий: {selectedUser.email}</p>
                  </>
                ) : modal === "name" ? (
                  <>
                    <label style={{ fontSize: "0.75rem", fontWeight: 500, color: C.textMuted, display: "block" }}>Новое имя</label>
                    <input
                      value={modalInput}
                      onChange={(e) => setModalInput(e.target.value)}
                      placeholder="Введите имя..."
                      className="w-full rounded-xl px-4 py-3 border outline-none"
                      style={{ fontSize: "0.88rem", backgroundColor: C.inputBg, borderColor: C.border, color: C.text }}
                      onKeyDown={(e) => e.key === "Enter" && handleModalAction()}
                    />
                  </>
                ) : null}

                {/* Error / Success */}
                {modalError && (
                  <p style={{ fontSize: "0.75rem", color: C.terracotta, padding: "8px 12px", borderRadius: 10, backgroundColor: C.terracotta + "10" }}>
                    {modalError}
                  </p>
                )}
                {modalSuccess && (
                  <motion.p
                    initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                    style={{ fontSize: "0.75rem", color: C.sage, padding: "8px 12px", borderRadius: 10, backgroundColor: C.sage + "10", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Check className="w-3.5 h-3.5" /> {modalSuccess}
                  </motion.p>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    className="flex-1 py-3 rounded-xl border"
                    style={{ borderColor: C.border, fontSize: "0.85rem", fontWeight: 500, color: C.textMuted }}
                    onClick={closeModal}
                  >
                    Отмена
                  </button>
                  <motion.button
                    className="flex-1 py-3 rounded-xl text-white flex items-center justify-center gap-2"
                    style={{
                      background: modal === "delete"
                        ? C.terracotta
                        : modal === "password" ? `linear-gradient(135deg, ${C.lavender}, ${C.dustyBlue})`
                        : modal === "email" ? `linear-gradient(135deg, ${C.dustyBlue}, ${C.teal})`
                        : `linear-gradient(135deg, ${C.sage}, ${C.teal})`,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      opacity: modalLoading ? 0.7 : 1,
                    }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleModalAction}
                    disabled={modalLoading}
                  >
                    {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {modal === "delete" ? "Удалить" : "Сохранить"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[250] px-5 py-3 rounded-2xl shadow-lg"
            style={{ backgroundColor: C.text, color: "#fff", fontSize: "0.82rem", fontWeight: 600, maxWidth: "90%" }}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}