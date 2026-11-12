import { useState, useEffect } from "react";
import { Outlet } from "react-router";
import { AppProvider } from "./app-context";
import { AuthPage } from "./pages/auth-page";
import { AdminPage } from "./pages/admin-page";
import { supabase } from "./supabase-client";
import { clearLocalUserData, fullLoadFromServer, pushAllLocalToServer } from "./supabase-sync";
import { AmbientBlobs, SparkleField, MeshGradientBg } from "./ambient-elements";
import { motion } from "motion/react";
import { ErrorBoundary } from "./error-boundary";

interface AuthUser {
  id: string;
  name: string;
  accessToken: string;
}

export function RootLayout() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  // key to force-remount AppProvider when user changes
  const [appKey, setAppKey] = useState(0);

  // Check for existing session on mount
  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      // 1) Check localStorage for saved auth
      const stored = localStorage.getItem("routine_auth_user");
      let restoredUser: AuthUser | null = null;
      if (stored) {
        try {
          restoredUser = JSON.parse(stored);
        } catch {}
      }

      // 2) Check Supabase session
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          // Invalid refresh token or expired session — clear stale auth
          console.log("Session restore error (clearing stale session):", error.message);
          await supabase.auth.signOut().catch(() => {});
          localStorage.removeItem("routine_auth_user");
          restoredUser = null;
        } else if (data.session) {
          restoredUser = {
            id: data.session.user.id,
            name: data.session.user.user_metadata?.name || "User",
            accessToken: data.session.access_token,
          };
          localStorage.setItem("routine_auth_user", JSON.stringify(restoredUser));
        } else {
          // No active session — clear saved auth if any
          if (restoredUser) {
            localStorage.removeItem("routine_auth_user");
            restoredUser = null;
          }
        }
      } catch (e: any) {
        console.log("Session check failed (clearing stale session):", e?.message || e);
        await supabase.auth.signOut().catch(() => {});
        localStorage.removeItem("routine_auth_user");
        restoredUser = null;
      }

      if (cancelled) return;

      // 3) If we have a user, load their data from server before rendering the app
      if (restoredUser && restoredUser.id !== "admin") {
        setLoadingData(true);
        try {
          const loaded = await fullLoadFromServer(restoredUser.id);
          if (!loaded) {
            // First time or no server data — push local defaults
            pushAllLocalToServer();
          }
        } catch (e) {
          console.log("Initial data load error:", e);
        }
        if (cancelled) return;
        setLoadingData(false);
      }

      setAuthUser(restoredUser);
      setChecking(false);
    }

    checkAuth();
    return () => { cancelled = true; };
  }, []);

  // Listen for auth state changes (token refresh failures, sign-outs)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" && session) {
        // Update stored access token
        const stored = localStorage.getItem("routine_auth_user");
        if (stored) {
          try {
            const user = JSON.parse(stored);
            user.accessToken = session.access_token;
            localStorage.setItem("routine_auth_user", JSON.stringify(user));
          } catch {}
        }
      }
      if (event === "SIGNED_OUT") {
        // Session invalidated — redirect to login
        setAuthUser(null);
        clearLocalUserData();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (user: AuthUser) => {
    // If switching to a different user, clear previous user's local data
    const prevUser = localStorage.getItem("routine_auth_user");
    if (prevUser) {
      try {
        const prev = JSON.parse(prevUser);
        if (prev.id && prev.id !== user.id && prev.id !== "admin") {
          clearLocalUserData();
        }
      } catch {}
    }

    // Save auth info FIRST (so sync module can read user ID)
    localStorage.setItem("routine_auth_user", JSON.stringify(user));

    if (user.id === "admin") {
      setAuthUser(user);
      return;
    }

    // Show loading while we fetch user data
    setLoadingData(true);

    try {
      const loaded = await fullLoadFromServer(user.id);
      if (!loaded) {
        pushAllLocalToServer();
      }
    } catch (e) {
      console.log("Data load after auth error:", e);
    }

    // Now set the user and force remount AppProvider with fresh localStorage data
    setLoadingData(false);
    setAppKey(k => k + 1);
    setAuthUser(user);
  };

  const handleLogout = () => {
    setAuthUser(null);
    clearLocalUserData();
    supabase.auth.signOut().catch(() => {});
  };

  // Временно убрана проверка авторизации — сразу показываем приложение
  // if (checking || loadingData) {
  //   return (
  //     <div className="h-dvh flex items-center justify-center relative overflow-hidden">
  //       <MeshGradientBg darkMode={false} variant="calm" />
  //       <AmbientBlobs variant="calm" />
  //       <SparkleField count={8} />
  //       <div className="text-center relative z-[1]">
  //         <motion.div
  //           className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
  //           style={{
  //             background: "linear-gradient(135deg, rgba(141,181,150,0.15), rgba(155,142,196,0.12))",
  //             boxShadow: "0 8px 32px rgba(141,181,150,0.1)",
  //           }}
  //           animate={{ scale: [1, 1.08, 1] }}
  //           transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
  //         >
  //           <span style={{ fontSize: "2.2rem" }}>🌿</span>
  //         </motion.div>
  //         <motion.p
  //           style={{ fontSize: "0.82rem", color: "#9B9489", fontWeight: 500 }}
  //           animate={{ opacity: [0.5, 1, 0.5] }}
  //           transition={{ duration: 1.5, repeat: Infinity }}
  //         >
  //           {loadingData ? "Загружаем ваши данные..." : "Загрузка..."}
  //         </motion.p>
  //       </div>
  //     </div>
  //   );
  // }

  // if (!authUser) {
  //   return <AuthPage onAuth={handleAuth} />;
  // }

  // if (authUser.id === "admin") {
  //   return <AdminPage onLogout={handleLogout} />;
  // }

  return (
    <AppProvider key={appKey}>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </AppProvider>
  );
}