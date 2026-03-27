import { Link } from "react-router-dom";

export default function FaceFilterPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0f13",
      display: "flex",
      flexDirection: "column",
      fontFamily: "system-ui, sans-serif",
    }}>

      {/* ── Barre de navigation */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 28px",
        background: "rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}>
        <Link to="/" style={{
          color: "#fff",
          textDecoration: "none",
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "22px",
          fontWeight: 700,
        }}>
          GlamTec
        </Link>

        <span style={{
          fontSize: "13px",
          color: "rgba(255,255,255,0.4)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <span style={{
            width: 7, height: 7,
            borderRadius: "50%",
            background: "#4ade80",
            display: "inline-block",
            animation: "blink 2s infinite",
          }} />
          Face Filter AR — Lunettes Live
        </span>

        <Link to="/" style={{
          color: "rgba(255,255,255,0.45)",
          textDecoration: "none",
          fontSize: "13px",
          padding: "6px 14px",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "6px",
          transition: "all 0.2s",
        }}>
          ← Retour
        </Link>
      </div>

      {/* ── iframe vers /public/face-filter-ar.html */}
      <iframe
        src="/face-filter-ar.html"
        title="Face Filter AR"
        style={{
          flex: 1,
          width: "100%",
          border: "none",
          minHeight: "calc(100vh - 56px)",
        }}
        allow="camera; microphone"
      />

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}