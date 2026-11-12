import { useSearchParams } from "react-router";
import { AuthPage } from "./auth-page";
import { fullLoadFromServer, pushAllLocalToServer } from "../supabase-sync";

export function AuthRoutePage() {
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") || "app";

  const handleAuth = async (user: { id: string; name: string; accessToken: string }) => {
    localStorage.setItem("routine_auth_user", JSON.stringify(user));

    if (user.id !== "admin") {
      try {
        const loaded = await fullLoadFromServer(user.id);
        if (!loaded) pushAllLocalToServer();
      } catch {}
    }

    // Full page reload so AppProvider reinitialises with fresh localStorage data
    window.location.href = next === "pay" ? "/?action=pay" : "/app";
  };

  return <AuthPage onAuth={handleAuth} />;
}
