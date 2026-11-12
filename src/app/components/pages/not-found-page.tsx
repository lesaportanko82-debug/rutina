import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Home, ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "#FAF8F5",
      }}
    >
      {/* Animated leaf */}
      <motion.div
        style={{ fontSize: "4rem", marginBottom: "1.5rem" }}
        animate={{ rotate: [-5, 5, -5], y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        🍃
      </motion.div>

      {/* 404 number */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          fontSize: "5rem",
          fontWeight: 800,
          color: "#E8E3DC",
          lineHeight: 1,
          marginBottom: "0.5rem",
          letterSpacing: "-0.04em",
        }}
      >
        404
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{
          fontSize: "1.2rem",
          fontWeight: 600,
          color: "#4A4540",
          marginBottom: "0.5rem",
          textAlign: "center",
        }}
      >
        Страница не найдена
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{
          fontSize: "0.88rem",
          color: "#9B9489",
          textAlign: "center",
          maxWidth: "280px",
          lineHeight: 1.65,
          marginBottom: "2rem",
        }}
      >
        Кажется, этот листик улетел. Вернёмся туда, где тепло и уютно? 🌱
      </motion.p>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.65rem 1.25rem",
            borderRadius: "999px",
            border: "1.5px solid #E8E3DC",
            background: "transparent",
            color: "#9B9489",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={15} />
          Назад
        </button>

        <button
          onClick={() => navigate("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.65rem 1.5rem",
            borderRadius: "999px",
            border: "none",
            background: "linear-gradient(135deg, #8DB596, #7BAFB0)",
            color: "#fff",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(141,181,150,0.3)",
          }}
        >
          <Home size={15} />
          На главную
        </button>
      </motion.div>
    </div>
  );
}
