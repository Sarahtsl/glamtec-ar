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