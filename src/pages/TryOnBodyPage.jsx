import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";

// ── Modèle affiché en 3D viewer simple ──
function TShirtModel({ path, scale, color }) {
  const { scene } = useGLTF(path);

  useEffect(() => {
    if (!color) return;
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(m => { m.color?.set(color); });
      }
    });
  }, [color, scene]);

  return <primitive object={scene} scale={scale} position={[0, -2.2, 0]} />;
}

const TSHIRT_MODELS = [
  { id: "basic",     label: "Basic",     path: "/models/male_basic_t_shirt.glb",  scale: 1.8 },
  { id: "tshirt",    label: "T-Shirt",   path: "/models/t_shirt.glb",             scale: 1.8 },
  { id: "oversized", label: "Oversized", path: "/models/oversized_t-shirt.glb",   scale: 1.8 },
];

const COLORS = [
  { id: "original", label: "Original", color: null },
  { id: "white",    label: "Blanc",    color: "#ffffff" },
  { id: "black",    label: "Noir",     color: "#111111" },
  { id: "navy",     label: "Marine",   color: "#1e3a8a" },
  { id: "red",      label: "Rouge",    color: "#cc2200" },
  { id: "green",    label: "Vert",     color: "#16a34a" },
  { id: "gray",     label: "Gris",     color: "#6b7280" },
  { id: "beige",    label: "Beige",    color: "#d4b896" },
];

TSHIRT_MODELS.forEach(m => useGLTF.preload(m.path));

export default function TryOnBodyPage() {
  const [selected, setSelected] = useState(TSHIRT_MODELS[0]);
  const [color, setColor]       = useState(null);

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", background: "#0f172a", overflow: "hidden" }}>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: 280, flexShrink: 0,
        background: "linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)",
        display: "flex", flexDirection: "column",
        padding: "24px 20px", gap: 20, zIndex: 10,
        boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
        overflowY: "auto", overflowX: "hidden",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255,255,255,0.2) transparent",
      }}>

        {/* Logo */}
        <div style={{
          fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700,
          color: "#fff", letterSpacing: "-0.02em",
          paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}>
          GlamTec
          <span style={{
            display: "block", fontSize: 10, fontFamily: "system-ui, sans-serif",
            fontWeight: 400, color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 2,
          }}>AR T-Shirt</span>
        </div>

        {/* Info mode */}
        <div style={{
          background: "rgba(255,255,255,0.07)",
          borderRadius: 12, padding: "12px 14px",
          border: "1px solid rgba(255,255,255,0.1)",
          fontSize: 12, color: "rgba(255,255,255,0.7)",
          fontFamily: "system-ui, sans-serif", lineHeight: 1.6,
        }}>
          🔄 Viewer 3D interactif<br/>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
            Glisser pour tourner · Scroll pour zoomer
          </span>
        </div>

        {/* Card Modèle */}
        <div style={{
          background: "rgba(255,255,255,0.07)", borderRadius: 14,
          padding: "14px 16px", border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.2em", textTransform: "uppercase",
            fontFamily: "system-ui, sans-serif", marginBottom: 12,
          }}>👕 Modèle</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {TSHIRT_MODELS.map((m) => (
              <button key={m.id}
                onClick={() => { setSelected(m); setColor(null); }}
                style={{
                  padding: "9px 14px",
                  background: selected.id === m.id ? "#fff" : "rgba(255,255,255,0.08)",
                  color: selected.id === m.id ? "#1e3a8a" : "rgba(255,255,255,0.8)",
                  border: "1.5px solid " + (selected.id === m.id ? "#fff" : "rgba(255,255,255,0.1)"),
                  borderRadius: 10, fontFamily: "system-ui, sans-serif",
                  fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left",
                  transition: "all 0.18s",
                  boxShadow: selected.id === m.id ? "0 2px 12px rgba(0,0,0,0.2)" : "none",
                }}
              >
                {selected.id === m.id ? "✓ " : ""}{m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Card Couleur */}
        <div style={{
          background: "rgba(255,255,255,0.07)", borderRadius: 14,
          padding: "14px 16px", border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.2em", textTransform: "uppercase",
            fontFamily: "system-ui, sans-serif", marginBottom: 12,
          }}>🎨 Couleur</div>

          <button onClick={() => setColor(null)} style={{
            width: "100%", padding: "8px 14px", marginBottom: 10,
            background: color === null ? "#fff" : "rgba(255,255,255,0.08)",
            color: color === null ? "#1e3a8a" : "rgba(255,255,255,0.8)",
            border: "1.5px solid " + (color === null ? "#fff" : "rgba(255,255,255,0.1)"),
            borderRadius: 10, fontFamily: "system-ui, sans-serif",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            transition: "all 0.15s", textAlign: "left",
          }}>
            {color === null ? "✓ " : ""}Original
          </button>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {COLORS.filter(c => c.id !== "original").map((c) => (
              <div key={c.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <button onClick={() => setColor(c.color)} title={c.label}
                  style={{
                    width: 32, height: 32,
                    background: c.color,
                    border: color === c.color ? "2px solid #fff" : "2px solid rgba(255,255,255,0.15)",
                    borderRadius: "50%", cursor: "pointer",
                    transform: color === c.color ? "scale(1.2)" : "scale(1)",
                    transition: "all 0.15s",
                    boxShadow: color === c.color ? "0 0 0 3px rgba(255,255,255,0.3)" : "none",
                  }}
                />
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontFamily: "system-ui, sans-serif" }}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          fontSize: 10, color: "rgba(255,255,255,0.2)",
          fontFamily: "system-ui, sans-serif", textAlign: "center", letterSpacing: "0.1em",
        }}>
          PFE · Webcom Casablanca 2025
        </div>
      </div>

      {/* ── VIEWER 3D ── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

        {/* Fond showroom */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 50% 35%, #f8fafc 0%, #e2e8f0 100%)",
        }} />

        <Canvas
          style={{ position: "absolute", inset: 0, zIndex: 2 }}
          camera={{ fov: 35, position: [0, 0.5, 4] }}
        >
          <color attach="background" args={["#f0f4f8"]} />
          <ambientLight intensity={2.5} />
          <directionalLight position={[5, 8, 5]}  intensity={1.5} />
          <directionalLight position={[-5, 3, 3]} intensity={0.8} />
          <directionalLight position={[0, -2, 5]} intensity={0.5} />
          <pointLight position={[0, 5, 2]} intensity={0.6} color="#fff8e7" />

          <TShirtModel path={selected.path} scale={selected.scale} color={color} />

          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            autoRotate={true}
            autoRotateSpeed={1.2}
            minDistance={2}
            maxDistance={7}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 1.8}
          />
        </Canvas>

        {/* Label modèle */}
        <div style={{
          position: "absolute", bottom: 20, left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(8px)",
          borderRadius: 20, padding: "6px 18px",
          fontFamily: "system-ui, sans-serif",
          fontSize: 12, fontWeight: 600, color: "#1e3a8a",
          zIndex: 5, pointerEvents: "none",
          boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
        }}>
          {selected.label} {color ? "· Couleur personnalisée" : "· Original"}
        </div>

        {/* Hint */}
        <div style={{
          position: "absolute", top: 16, left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(8px)",
          borderRadius: 20, padding: "5px 14px",
          fontFamily: "system-ui, sans-serif",
          fontSize: 11, color: "#94a3b8",
          zIndex: 5, pointerEvents: "none",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          🖱 Glisser · Scroll pour zoomer
        </div>
      </div>
    </div>
  );
}