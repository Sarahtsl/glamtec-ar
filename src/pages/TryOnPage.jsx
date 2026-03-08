import { useEffect, useRef, useState, startTransition } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

const GLASSES_CONFIG = [
  { id: "black",      label: "Black",      path: "/models/black_sunglasses.glb",      scale: 10, offsetY: 0.75, fixedRotationY: 0 },
  { id: "white",      label: "White",      path: "/models/white_sunglasses.glb",      scale: 1.5, offsetY: 0.5, fixedRotationY: 0 },
  { id: "balenciaga", label: "Balenciaga", path: "/models/balenciaga_sunglasses.glb", scale: 9, offsetY: -0.1, fixedRotationY: Math.PI },
  { id: "flow",       label: "Flow",       path: "/models/sunglasses_flow.glb",       scale: 0.0025, offsetY: 0.55, fixedRotationY: 0 },
];
const FRAME_COLORS = [
  { id: "original", label: "Original", color: null },
  { id: "black",    label: "Noir",     color: "#111111" },
  { id: "gold",     label: "Or",       color: "#d4af37" },
  { id: "silver",   label: "Argent",   color: "#C0C0C0" },
  { id: "brown",    label: "Marron",   color: "#8B4513" },
  { id: "red",      label: "Rouge",    color: "#cc2200" },
  { id: "blue",     label: "Bleu",     color: "#1a3a8a" },
];

GLASSES_CONFIG.forEach((g) => useGLTF.preload(g.path));

// ─── Applique couleur sur un clone ────────────────
function applyColor(clonedScene, frameColor) {
  if (!clonedScene) return;
  clonedScene.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    if (child.material.transparent && child.material.opacity < 0.8) return;
    const mat = child.material.clone();
    if (frameColor === null) {
      if (child.userData.originalColor !== undefined)
        mat.color.setHex(child.userData.originalColor);
    } else {
      if (child.userData.originalColor === undefined)
        child.userData.originalColor = child.material.color.getHex();
      mat.color.set(frameColor);
    }
    child.material = mat;
  });
}

// ─── Mode FACE TRACKING ───────────────────────────
function GlassesFaceTracked({ faceData, config, frameColor }) {
  const { scene } = useGLTF(config.path);
  const group = useRef();
  const [clonedScene, setClonedScene] = useState(null);

  useEffect(() => {
    const clone = scene.clone(true);
    applyColor(clone, frameColor);
    startTransition(() => setClonedScene(clone)); // ✅ pas de cascading render
    return () => {
      clone.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
          else child.material?.dispose();
        }
      });
    };
  }, [scene]);

  useEffect(() => {
    applyColor(clonedScene, frameColor);
  }, [frameColor, clonedScene]);

  useFrame(() => {
    if (!faceData || !group.current) return;
    group.current.position.set(faceData.x, faceData.y, faceData.z);
    group.current.rotation.set(
      faceData.rx,
      faceData.ry + (config.fixedRotationY ?? 0),
      faceData.rz
    );
    group.current.scale.setScalar(config.scale);
  });

  if (!clonedScene) return null;
  return <group ref={group}><primitive object={clonedScene} /></group>;
}

// ─── Mode ROTATION LIBRE ──────────────────────────
function GlassesFree({ config, frameColor }) {
  const { scene } = useGLTF(config.path);
  const [clonedScene, setClonedScene] = useState(null);

  useEffect(() => {
    const clone = scene.clone(true);
    applyColor(clone, frameColor);
    startTransition(() => setClonedScene(clone)); // ✅ pas de cascading render
    return () => {
      clone.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
          else child.material?.dispose();
        }
      });
    };
  }, [scene]);

  useEffect(() => {
    applyColor(clonedScene, frameColor);
  }, [frameColor, clonedScene]);

  if (!clonedScene) return null;
  return (
    <group scale={config.scale * 2} rotation={[0, config.fixedRotationY ?? 0, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
}

const lerp = (a, b, t) => a + (b - a) * t;

// ─── Page principale ──────────────────────────────
export default function TryOnPage() {
  const videoRef  = useRef();
  const [faceData, setFaceData]       = useState(null);
  const [selected, setSelected]       = useState(GLASSES_CONFIG[0]);
  const [frameColor, setFrameColor]   = useState(null);
  const [mode, setMode]               = useState("face");   // "face" | "free"


  const handleModeChange = (newMode) => {
    setMode(newMode);
  };

  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (f) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    faceMesh.onResults((results) => {
      if (!results.multiFaceLandmarks?.length) {
        return;
      }
      const lm          = results.multiFaceLandmarks[0];
      const leftOuter   = lm[33];
      const rightOuter  = lm[263];
      const leftEyeTop  = lm[159];
      const rightEyeTop = lm[386];
      const noseBridge  = lm[168];
      const cx      = (leftOuter.x + rightOuter.x) / 2;
      const eyeDist = Math.abs(rightOuter.x - leftOuter.x);
      const cy      = (leftEyeTop.y + rightEyeTop.y) / 2 + eyeDist * selected.offsetY;
      const rotZ = -Math.atan2(rightOuter.y - leftOuter.y, rightOuter.x - leftOuter.x);
      const rotY = (noseBridge.x - 0.5) * -Math.PI * 0.6;
      const rotX = (noseBridge.y - 0.5) * Math.PI * 0.15;
      const newData = {
        x: -(cx - 0.5) * 4, y: -(cy - 0.5) * 4,
        z: noseBridge.z * -1, rx: rotX, ry: rotY, rz: rotZ,
      };
      setFaceData((prev) => {
        if (!prev) return newData;
        return {
          x:  lerp(prev.x,  newData.x,  0.3),
          y:  lerp(prev.y,  newData.y,  0.3),
          z:  lerp(prev.z,  newData.z,  0.3),
          rx: lerp(prev.rx, newData.rx, 0.3),
          ry: lerp(prev.ry, newData.ry, 0.3),
          rz: lerp(prev.rz, newData.rz, 0.3),
        };
      });
    });

    // Pause quand l'onglet est caché
    const handleVisibility = () => {
      if (document.hidden) cam?.stop();
      else cam?.start();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const cam = new Camera(videoRef.current, {
      onFrame: async () => {
        if (mode === "face") await faceMesh.send({ image: videoRef.current });
      },
      width: 640, height: 480,
    });
    cam.start();
    return () => {
      cam.stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [selected, mode]);


  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", background: "#0f172a", overflow: "hidden" }}>

      {/* ══════════════════════
          SIDEBAR GAUCHE
      ══════════════════════ */}
      <div style={{
        width: 280,
        flexShrink: 0,
        background: "linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)",
        display: "flex",
        flexDirection: "column",
        padding: "24px 20px",
        gap: 20,
        zIndex: 10,
        boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
        overflowY: "auto",
        overflowX: "hidden",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255,255,255,0.2) transparent",
      }}>

        {/* Logo */}
        <div style={{
          fontFamily: "Georgia, serif",
          fontSize: 22, fontWeight: 700,
          color: "#fff", letterSpacing: "-0.02em",
          paddingBottom: 16,
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}>
          GlamTec
          <span style={{
            display: "block", fontSize: 10,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 400, color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.2em", textTransform: "uppercase",
            marginTop: 2,
          }}>AR Try-On</span>
        </div>

        {/* Toggle Mode */}
        <div style={{
          background: "rgba(0,0,0,0.2)",
          borderRadius: 12, padding: 4,
          display: "flex", gap: 2,
        }}>
          {[
            { id: "face", icon: "📷", label: "Caméra AR" },
            { id: "free", icon: "🔄", label: "Viewer 3D" },
          ].map((m) => (
            <button key={m.id} onClick={() => handleModeChange(m.id)} style={{
              flex: 1, padding: "8px 4px",
              background: mode === m.id ? "#fff" : "transparent",
              color: mode === m.id ? "#1e3a8a" : "rgba(255,255,255,0.55)",
              border: "none", borderRadius: 9,
              cursor: "pointer",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 700, fontSize: 11,
              transition: "all 0.2s",
            }}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {/* Card Modèle */}
        <div style={{
          background: "rgba(255,255,255,0.07)",
          borderRadius: 14, padding: "14px 16px",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.2em", textTransform: "uppercase",
            fontFamily: "system-ui, sans-serif", marginBottom: 12,
          }}>👓 Modèle</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {GLASSES_CONFIG.map((g) => (
              <button key={g.id}
                onClick={() => { setSelected(g); setFrameColor(null); }}
                style={{
                  padding: "9px 14px",
                  background: selected.id === g.id ? "#fff" : "rgba(255,255,255,0.08)",
                  color: selected.id === g.id ? "#1e3a8a" : "rgba(255,255,255,0.8)",
                  border: "1.5px solid " + (selected.id === g.id ? "#fff" : "rgba(255,255,255,0.1)"),
                  borderRadius: 10,
                  fontFamily: "system-ui, sans-serif",
                  fontWeight: 700, fontSize: 13,
                  cursor: "pointer", textAlign: "left",
                  transition: "all 0.18s",
                  boxShadow: selected.id === g.id ? "0 2px 12px rgba(0,0,0,0.2)" : "none",
                }}
              >
                {selected.id === g.id ? "✓ " : ""}{g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Card Couleur */}
        <div style={{
          background: "rgba(255,255,255,0.07)",
          borderRadius: 14, padding: "14px 16px",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.2em", textTransform: "uppercase",
            fontFamily: "system-ui, sans-serif", marginBottom: 12,
          }}>🎨 Couleur monture</div>

          {/* Original */}
          <button onClick={() => setFrameColor(null)} style={{
            width: "100%", padding: "8px 14px", marginBottom: 10,
            background: frameColor === null ? "#fff" : "rgba(255,255,255,0.08)",
            color: frameColor === null ? "#1e3a8a" : "rgba(255,255,255,0.8)",
            border: "1.5px solid " + (frameColor === null ? "#fff" : "rgba(255,255,255,0.1)"),
            borderRadius: 10, fontFamily: "system-ui, sans-serif",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            transition: "all 0.15s", textAlign: "left",
          }}>
            {frameColor === null ? "✓ " : ""}Original
          </button>

          {/* Cercles couleurs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {FRAME_COLORS.filter(fc => fc.id !== "original").map((fc) => (
              <div key={fc.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <button onClick={() => setFrameColor(fc.color)} title={fc.label}
                  style={{
                    width: 32, height: 32,
                    background: fc.color,
                    border: frameColor === fc.color ? "2px solid #fff" : "2px solid rgba(255,255,255,0.15)",
                    borderRadius: "50%",
                    cursor: "pointer",
                    transform: frameColor === fc.color ? "scale(1.2)" : "scale(1)",
                    transition: "all 0.15s",
                    boxShadow: frameColor === fc.color ? "0 0 0 3px rgba(255,255,255,0.3)" : "none",
                  }}
                />
                <span style={{
                  fontSize: 9, color: "rgba(255,255,255,0.4)",
                  fontFamily: "system-ui, sans-serif",
                }}>
                  {fc.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer sidebar */}
        <div style={{
          fontSize: 10, color: "rgba(255,255,255,0.2)",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center", letterSpacing: "0.1em",
        }}>
          PFE · Webcom Casablanca 2025
        </div>
      </div>

      {/* ══════════════════════
          ZONE DROITE — Caméra / 3D
      ══════════════════════ */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

        {/* Vidéo */}
        <video
          ref={videoRef}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)",
            display: mode === "face" ? "block" : "none",
          }}
          autoPlay playsInline muted
        />

        {/* Mode FACE — Canvas AR */}
        {mode === "face" && (
          <Canvas
            style={{ position: "absolute", inset: 0, zIndex: 2 }}
            camera={{ fov: 45, position: [0, 0, 5] }}
          >
            <ambientLight intensity={1.5} />
            <directionalLight position={[0, 2, 4]} intensity={1} />
            {faceData && (
              <GlassesFaceTracked
                faceData={faceData}
                config={selected}
                frameColor={frameColor}
              />
            )}
          </Canvas>
        )}

        {/* Mode FREE — Viewer 3D */}
        {mode === "free" && (
          <>
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(ellipse at 50% 40%, #f8fafc 0%, #e2e8f0 100%)",
            }} />
            <Canvas
              style={{ position: "absolute", inset: 0, zIndex: 2 }}
              camera={{ fov: 30, position: [0, 0, 6] }}
            >
              <color attach="background" args={["#f0f4f8"]} />
              <ambientLight intensity={2} />
              <directionalLight position={[5, 5, 5]} intensity={1.5} />
              <directionalLight position={[-5, 3, 3]} intensity={1.0} />
              <directionalLight position={[0, -3, 5]} intensity={0.8} />
              <GlassesFree config={selected} frameColor={frameColor} />
              <OrbitControls
                enablePan={false} enableZoom={true} enableRotate={true}
                autoRotate={true} autoRotateSpeed={1.5}
                minDistance={1.5} maxDistance={8}
              />
            </Canvas>
            {/* Hint */}
            <div style={{
              position: "absolute", bottom: 24, left: "50%",
              transform: "translateX(-50%)",
              color: "#94a3b8", fontFamily: "system-ui, sans-serif",
              fontSize: 11, letterSpacing: "0.1em",
              background: "rgba(255,255,255,0.8)",
              padding: "5px 14px", borderRadius: 20,
              zIndex: 5, pointerEvents: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}>
              🖱 Glisser · Scroll pour zoomer
            </div>
          </>
        )}
      </div>
    </div>
  );
}