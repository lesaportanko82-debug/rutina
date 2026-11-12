import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, Loader2, Sparkles, ArrowRight, User, Lock, Shield, Mail } from "lucide-react";
import { supabase } from "../supabase-client";
import { AmbientBlobs, SparkleField, GradientOrb, MeshGradientBg } from "../ambient-elements";

const C = {
  bg: "#FAF8F5",
  sage: "#8DB596",
  lavender: "#9B8EC4",
  terracotta: "#C4876C",
  dustyBlue: "#7EA8BE",
  text: "#4A4540",
  textMuted: "#9B9489",
  textFaint: "#B5AFA6",
  card: "#F5F0E8",
  border: "#E8E3DC",
};

interface AuthPageProps {
  onAuth: (user: { id: string; name: string; accessToken: string }) => void | Promise<void>;
}

export function AuthPage({ onAuth }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPw, setAdminPw] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const [stableHeight, setStableHeight] = useState<number | null>(null);
  useEffect(() => {
    const h = window.innerHeight;
    setStableHeight(h);
    const vv = window.visualViewport;
    if (vv) {
      let initialH = vv.height;
      const onResize = () => {
        if (vv.height > initialH) {
          initialH = vv.height;
          setStableHeight(vv.height);
        }
      };
      vv.addEventListener("resize", onResize);
      return () => vv.removeEventListener("resize", onResize);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => {
      if (mode === "signup") {
        nameRef.current?.focus();
      } else {
        emailRef.current?.focus();
      }
    }, 500);
  }, [mode]);

  const handleSubmit = async () => {
    // Валидация для регистрации
    if (mode === "signup") {
      if (!name.trim()) {
        setError("Введите ваше имя");
        return;
      }
      if (!email.trim()) {
        setError("Введите email");
        return;
      }
      // Простая проверка email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError("Введите корректный email");
        return;
      }
      if (!password.trim()) {
        setError("Введите пароль");
        return;
      }
      if (password.length < 6) {
        setError("Пароль должен быть не менее 6 символов");
        return;
      }
    } else {
      // Валидация для входа
      if (!email.trim()) {
        setError("Введите email");
        return;
      }
      if (!password.trim()) {
        setError("Введите пароль");
        return;
      }
    }
    
    setLoading(true);
    setError("");

    try {
      if (mode === "signup") {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim() } },
        });
        if (signUpErr) {
          setError(
            signUpErr.message.includes("already registered") || signUpErr.message.includes("already been registered")
              ? "Этот email уже зарегистрирован"
              : signUpErr.message || "Ошибка регистрации"
          );
          setLoading(false);
          return;
        }
        // If session returned immediately (email confirm disabled), use it
        if (signUpData.session) {
          await onAuth({
            id: signUpData.session.user.id,
            name: name.trim(),
            accessToken: signUpData.session.access_token,
          });
          return;
        }
        // Otherwise sign in explicitly
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInErr || !signInData.session) {
          setError("Регистрация успешна, но не удалось войти: " + (signInErr?.message || ""));
          setLoading(false);
          return;
        }
        await onAuth({
          id: signInData.session.user.id,
          name: name.trim(),
          accessToken: signInData.session.access_token,
        });
      } else {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInErr || !signInData.session) {
          setError(signInErr?.message === "Invalid login credentials"
            ? "Неверный email или пароль"
            : (signInErr?.message || "Ошибка входа"));
          setLoading(false);
          return;
        }
        await onAuth({
          id: signInData.session.user.id,
          name: signInData.session.user.user_metadata?.name || "Пользователь",
          accessToken: signInData.session.access_token,
        });
      }
    } catch (e: any) {
      console.error("Auth error:", e);
      setError("Ошибка соединения: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = () => {
    if (adminPw === "admin") {
      onAuth({ id: "admin", name: "Администратор", accessToken: "admin-key" });
    } else {
      setError("Неверный пароль администратора");
    }
  };

  const MotionDiv = motion.div;
  const MotionH1 = motion.h1;
  const MotionP = motion.p;
  const MotionButton = motion.button;

  return (
    <div
      className="flex flex-col items-center justify-center px-6 relative overflow-y-auto overflow-x-hidden"
      style={{
        height: stableHeight ? `${stableHeight}px` : "100dvh",
        minHeight: stableHeight ? `${stableHeight}px` : "100dvh",
      }}
    >
      <MeshGradientBg darkMode={false} variant="calm" />

      <AmbientBlobs variant="calm" />
      <SparkleField count={15} />
      <GradientOrb color1="#8DB596" color2="#9B8EC4" size={300} x="20%" y="15%" />
      <GradientOrb color1="#7EA8BE" color2="#C4876C" size={250} x="80%" y="75%" />

      <div className="relative z-[1] flex flex-col items-center">
        <MotionDiv
          className="relative w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: `linear-gradient(135deg, ${C.sage}25, ${C.lavender}20)` }}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <span style={{ fontSize: "3rem" }}>🌿</span>
          {[0, 1, 2].map((i) => (
            <MotionDiv
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{ backgroundColor: [C.sage, C.lavender, C.dustyBlue][i] }}
              animate={{
                x: [0, Math.cos(i * 2.09) * 45, 0],
                y: [0, Math.sin(i * 2.09) * 45, 0],
                opacity: [0, 0.6, 0],
              }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.8 }}
            />
          ))}
        </MotionDiv>

        <MotionH1
          style={{ fontSize: "1.6rem", fontWeight: 800, color: C.text, marginBottom: 4 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Рутина
        </MotionH1>
        <MotionP
          style={{ fontSize: "0.85rem", color: C.textMuted, marginBottom: 32, textAlign: "center", maxWidth: 280 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Ваше пространство для заботы о себе
        </MotionP>

        <MotionDiv
          className="flex rounded-2xl p-1 mb-6 w-full max-w-sm"
          style={{ backgroundColor: C.card }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              className="flex-1 py-2.5 rounded-xl transition-all relative"
              style={{
                fontSize: "0.82rem",
                fontWeight: 600,
                color: mode === m ? C.text : C.textFaint,
                backgroundColor: mode === m ? "#fff" : "transparent",
                boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
              }}
              onClick={() => { setMode(m); setError(""); }}
            >
              {m === "login" ? "Вход" : "Регистрация"}
            </button>
          ))}
        </MotionDiv>

        <MotionDiv
          className="w-full max-w-sm space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <AnimatePresence mode="sync">
            {mode === "signup" && (
              <MotionDiv
                className="relative"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.textFaint }} />
                <input
                  ref={nameRef}
                  type="text"
                  placeholder="Ваше имя"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl outline-none"
                  style={{
                    fontSize: "0.88rem",
                    backgroundColor: C.card,
                    border: `1.5px solid ${C.border}`,
                    color: C.text,
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </MotionDiv>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.textFaint }} />
            <input
              ref={emailRef}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 rounded-2xl outline-none"
              style={{
                fontSize: "0.88rem",
                backgroundColor: C.card,
                border: `1.5px solid ${C.border}`,
                color: C.text,
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.textFaint }} />
            <input
              type={showPw ? "text" : "password"}
              placeholder="Пароль (мин. 6 символов)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-3.5 rounded-2xl outline-none"
              style={{
                fontSize: "0.88rem",
                backgroundColor: C.card,
                border: `1.5px solid ${C.border}`,
                color: C.text,
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <button
              className="absolute right-3.5 top-1/2 -translate-y-1/2"
              onClick={() => setShowPw(!showPw)}
            >
              {showPw
                ? <EyeOff className="w-4 h-4" style={{ color: C.textFaint }} />
                : <Eye className="w-4 h-4" style={{ color: C.textFaint }} />
              }
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <MotionP
                className="text-center px-3 py-2 rounded-xl"
                style={{ fontSize: "0.75rem", color: C.terracotta, backgroundColor: C.terracotta + "10" }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {error}
              </MotionP>
            )}
          </AnimatePresence>

          <MotionButton
            className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-white shadow-md"
            style={{
              background: `linear-gradient(135deg, ${C.sage}, #6B8F71)`,
              fontSize: "0.9rem",
              fontWeight: 700,
            }}
            onClick={handleSubmit}
            disabled={loading}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {mode === "signup" ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Начать путь
                  </>
                ) : (
                  <>
                    Войти
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </>
            )}
          </MotionButton>
        </MotionDiv>

        <MotionDiv
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <button
            className="flex items-center gap-1.5"
            style={{ fontSize: "0.7rem", color: C.textFaint }}
            onClick={() => setShowAdmin(!showAdmin)}
          >
            <Shield className="w-3 h-3" />
            Вход для администратора
          </button>

          <AnimatePresence>
            {showAdmin && (
              <MotionDiv
                className="mt-2 flex gap-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <input
                  type="password"
                  placeholder="PIN"
                  value={adminPw}
                  onChange={(e) => setAdminPw(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl outline-none"
                  style={{
                    fontSize: "0.8rem",
                    backgroundColor: C.card,
                    border: `1px solid ${C.border}`,
                    color: C.text,
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                />
                <button
                  className="px-4 py-2 rounded-xl text-white"
                  style={{ fontSize: "0.75rem", fontWeight: 600, backgroundColor: C.lavender }}
                  onClick={handleAdminLogin}
                >
                  Войти
                </button>
              </MotionDiv>
            )}
          </AnimatePresence>
        </MotionDiv>
      </div>
    </div>
  );
}