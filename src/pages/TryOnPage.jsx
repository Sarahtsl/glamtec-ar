import { useEffect, useRef, useState, startTransition, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// ─────────────────────────────────────────────────────────────
//  CONFIG
//  offsetY: décalage vertical par modèle (+ = monte, - = descend)
// ─────────────────────────────────────────────────────────────
const GLASSES_CONFIG = [
  { id: "black",                      label: "Black",         path: "/models/black_sunglasses.glb",              scale: 4.5,      offsetY: -0,    fixedRotationY: 0 },
  { id: "white",                      label: "White",         path: "/models/white_sunglasses.glb",              scale: 0.7,    offsetY: -0,    fixedRotationY: 0 },
  { id: "balenciaga",                 label: "Balenciaga",    path: "/models/balenciaga_sunglasses.glb",         scale: 4,    offsetY: 0.1,  fixedRotationY: Math.PI },
  { id: "flow",                       label: "Flow",          path: "/models/sunglasses_flow.glb",               scale: 0.001, offsetY: 0, fixedRotationY: 0 },
  { id: "black_glasses",              label: "Black Glasses", path: "/models/black_glasses.glb",                 scale: 0.4,   offsetY: 0.1,  fixedRotationY: 0 },
  { id: "glasses",                    label: "Glasses",       path: "/models/glasses.glb",                       scale: 0.6,    offsetY: 0.1, fixedRotationY: 0 },
  { id: "prada_vintage_star_glasses", label: "Prada Vintage", path: "/models/prada_vintage_star_glasses.glb",    scale: 0.25,    offsetY: 0.16, fixedRotationY: 0 },
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

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
//  OCCLUSION FACE MASK
//  FIX: Réutilise le BufferGeometry au lieu d'en créer un nouveau
//       à chaque frame → élimine le GC pressure
// ─────────────────────────────────────────────────────────────
const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
  397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
];

const ALL_MASK_POINTS = [...new Set(FACE_OVAL)];
const CENTER_IDX = ALL_MASK_POINTS.length;

// Pré-calculer les indices (ils ne changent jamais)
const MASK_INDICES = [];
for (let i = 0; i < ALL_MASK_POINTS.length; i++) {
  MASK_INDICES.push(CENTER_IDX, i, (i + 1) % ALL_MASK_POINTS.length);
}

function OcclusionFaceMask({ landmarks }) {
  const meshRef = useRef();
  const posRef  = useRef(null); // référence stable au Float32Array

  useFrame(() => {
    if (!landmarks || !meshRef.current) return;

    const totalVerts = ALL_MASK_POINTS.length + 1; // +1 pour le centre
    const positions  = new Float32Array(totalVerts * 3);

    // Points du contour
    for (let i = 0; i < ALL_MASK_POINTS.length; i++) {
      const lm = landmarks[ALL_MASK_POINTS[i]];
      positions[i * 3]     = (0.5 - lm.x) * 4;
      positions[i * 3 + 1] = -(lm.y - 0.5) * 4;
      positions[i * 3 + 2] = lm.z * -1;
    }

    // Centre (nez — landmark 1)
    const cn = landmarks[1];
    positions[CENTER_IDX * 3]     = (0.5 - cn.x) * 4;
    positions[CENTER_IDX * 3 + 1] = -(cn.y - 0.5) * 4;
    positions[CENTER_IDX * 3 + 2] = cn.z * -1 + 0.02;

    const geo = meshRef.current.geometry;
    const attr = geo.getAttribute("position");

    // FIX: Réutiliser le buffer existant si possible
    if (!attr || attr.array.length !== positions.length) {
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setIndex(MASK_INDICES);
    } else {
      attr.array.set(positions);
      attr.needsUpdate = true;
    }

    geo.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} renderOrder={1}>
      <bufferGeometry />
      <meshBasicMaterial
        colorWrite={false}
        depthWrite={true}
        depthTest={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────
//  GLASSES — FACE TRACKED
//
//  CORRECTIONS MAJEURES :
//  1. Utilise facialTransformationMatrixes (poseMatrix) pour la
//     rotation 3D exacte — bien plus précis que les angles manuels
//  2. Position basée sur les TEMPES (127/356) pas les yeux (33/263)
//     → les branches se posent correctement sur les oreilles
//  3. Rotation Y : signe corrigé (vidéo miroir scaleX(-1))
//  4. Fallback angles manuels si poseMatrix indisponible
// ─────────────────────────────────────────────────────────────
function GlassesFaceTracked({ landmarks, poseMatrix, config, frameColor, calibScale, calibY, calibZ }) {
  const { scene }  = useGLTF(config.path);
  const group      = useRef();
  const [clonedScene, setClonedScene] = useState(null);

  const smoothPos  = useRef(new THREE.Vector3());
  const smoothQuat = useRef(new THREE.Quaternion());

  // Matrice réutilisable (évite allocation par frame)
  const mat4Ref    = useRef(new THREE.Matrix4());
  const posVec     = useRef(new THREE.Vector3());
  const quatRef    = useRef(new THREE.Quaternion());
  const scaleVec   = useRef(new THREE.Vector3());

  useEffect(() => {
    const clone = scene.clone(true);
    applyColor(clone, frameColor);
    startTransition(() => setClonedScene(clone));
    return () => {
      clone.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else child.material?.dispose();
        }
      });
    };
  }, [scene]);

  useEffect(() => {
    applyColor(clonedScene, frameColor);
  }, [frameColor, clonedScene]);

  useFrame(() => {
    if (!group.current || !landmarks) return;

    // ── POSITION : basée sur les TEMPES ──────────────────────
    // FIX #1 : 127 = tempe gauche, 356 = tempe droite
    // Ces points correspondent à l'endroit où les branches
    // des lunettes reposent sur le visage — pas les yeux.
    const lTemple    = landmarks[127];   // tempe gauche
    const rTemple    = landmarks[356];   // tempe droite
    const noseBridge = landmarks[6];     // FIX #2 : pont du nez (pas 168)

    const midX = (lTemple.x + rTemple.x) / 2;
    const midY = (lTemple.y + rTemple.y) / 2;

    const targetX = (0.5 - midX) * 4;
    const targetY = -(midY - 0.5) * 4 + (config.offsetY ?? 0) + calibY;
    const targetZ = noseBridge.z * -2 + calibZ;

    smoothPos.current.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.25);
    group.current.position.copy(smoothPos.current);

    // ── ROTATION ─────────────────────────────────────────────
    if (poseMatrix && poseMatrix.length === 16) {
      // ✅ MÉTHODE PRINCIPALE : facialTransformationMatrixes
      // MediaPipe fournit une matrice 4x4 complète qui encode
      // précisément la pose de la tête dans l'espace 3D.
      // C'est la méthode la plus précise et stable.
      mat4Ref.current.fromArray(poseMatrix);
      mat4Ref.current.decompose(posVec.current, quatRef.current, scaleVec.current);

      // Correction d'axes : MediaPipe utilise un repère différent de Three.js
      // On inverse X et Y pour aligner les systèmes de coordonnées
      quatRef.current.x *= -1;
      quatRef.current.y *= -1;

      smoothQuat.current.slerp(quatRef.current, 0.3);
    } else {
      // ⚠️ FALLBACK : angles calculés depuis les landmarks
      // Utilisé si poseMatrix n'est pas disponible
      const rotZ = -Math.atan2(
        rTemple.y - lTemple.y,
        rTemple.x - lTemple.x
      );
      // FIX #3 : signe négatif car la vidéo est en scaleX(-1)
      // Sans ce correctif, la rotation gauche/droite est inversée
      const rotY = -(noseBridge.x - 0.5) * Math.PI * 0.6;
      const rotX =  (noseBridge.y - 0.5) * Math.PI * 0.15;

      const tQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(rotX, rotY, rotZ, "YXZ")
      );
      smoothQuat.current.slerp(tQuat, 0.3);
    }

    group.current.quaternion.copy(smoothQuat.current);

    // Rotation fixe par modèle (ex: Balenciaga à 180°)
    if (config.fixedRotationY) group.current.rotateY(config.fixedRotationY);

    // Scale final
    group.current.scale.setScalar(config.scale * calibScale);

    // Assurer que les lunettes passent par-dessus le masque
    group.current.traverse((child) => {
      if (child.isMesh) child.renderOrder = 2;
    });
  });

  if (!clonedScene) return null;
  return (
    <group ref={group}>
      <primitive object={clonedScene} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
//  MODE VIEWER 3D LIBRE
// ─────────────────────────────────────────────────────────────
function GlassesFree({ config, frameColor }) {
  const { scene } = useGLTF(config.path);
  const [clonedScene, setClonedScene] = useState(null);

  useEffect(() => {
    const clone = scene.clone(true);
    applyColor(clone, frameColor);
    startTransition(() => setClonedScene(clone));
    return () => {
      clone.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
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

// ─────────────────────────────────────────────────────────────
//  PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────
export default function TryOnPage() {
  const videoRef      = useRef();
  const landmarkerRef = useRef(null);
  const animFrameRef  = useRef(null);

  const [landmarks,        setLandmarks]       = useState(null);
  const [poseMatrix,       setPoseMatrix]       = useState(null);
  const [selected,         setSelected]         = useState(GLASSES_CONFIG[0]);
  const [frameColor,       setFrameColor]       = useState(null);
  const [mode,             setMode]             = useState("face");
  const [loading,          setLoading]          = useState(true);
  const [landmarkerReady,  setLandmarkerReady]  = useState(false);
  const [faceDetected,     setFaceDetected]     = useState(false);

  // Calibration globale
  const [calibScale, setCalibScale] = useState(1.0);
  const [calibY,     setCalibY]     = useState(0);
  const [calibZ,     setCalibZ]     = useState(0.06);

  // offsetY par modèle — éditable en temps réel
  const [offsetYMap, setOffsetYMap] = useState(
    Object.fromEntries(GLASSES_CONFIG.map((g) => [g.id, g.offsetY]))
  );
  const updateOffsetY = useCallback((id, val) =>
    setOffsetYMap((prev) => ({ ...prev, [id]: val })), []);

  // Config actif avec offsetY dynamique
  const activeConfig = { ...selected, offsetY: offsetYMap[selected.id] ?? 0 };

  // ── FaceLandmarker init ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function initLandmarker() {
      setLoading(true);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const fl = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: true, // ← nécessaire pour poseMatrix
          runningMode: "VIDEO",
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        if (!cancelled) {
          landmarkerRef.current = fl;
          setLoading(false);
          setLandmarkerReady(true);
        }
      } catch (err) {
        console.error("Erreur init FaceLandmarker:", err);
        if (!cancelled) setLoading(false);
      }
    }
    initLandmarker();
    return () => { cancelled = true; };
  }, []);

  // ── Boucle détection ─────────────────────────────────────
  useEffect(() => {
    if (mode !== "face" || !landmarkerRef.current) return;
    let lastVideoTime = -1;

    function detect() {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }
      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const result = landmarkerRef.current.detectForVideo(video, performance.now());

        // FIX: poseMatrix correctement extrait
        if (result.facialTransformationMatrixes?.length > 0) {
          setPoseMatrix(result.facialTransformationMatrixes[0].data);
        } else {
          setPoseMatrix(null);
        }

        if (result.faceLandmarks?.length > 0) {
          setLandmarks(result.faceLandmarks[0]);
          setFaceDetected(true);
        } else {
          setLandmarks(null);
          setFaceDetected(false);
        }
      }
      animFrameRef.current = requestAnimationFrame(detect);
    }

    animFrameRef.current = requestAnimationFrame(detect);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [mode, landmarkerReady]);

  // ── Caméra ───────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    navigator.mediaDevices
      .getUserMedia({ video: { width: 1280, height: 720, facingMode: "user" } })
      .then((stream) => { video.srcObject = stream; })
      .catch(console.error);

    const onVisibility = () => {
      if (!video.srcObject) return;
      video.srcObject.getTracks().forEach((t) => (t.enabled = !document.hidden));
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // ─────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div style={{
      display: "flex", width: "100vw", height: "100vh",
      background: "#0f172a", overflow: "hidden",
    }}>

      {/* ══ SIDEBAR ══ */}
      <div style={{
        width: 280, flexShrink: 0,
        background: "linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)",
        display: "flex", flexDirection: "column",
        padding: "24px 20px", gap: 20, zIndex: 10,
        boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
        overflowY: "auto", overflowX: "hidden",
        scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.2) transparent",
      }}>

        {/* Logo */}
        <div style={{
          fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700,
          color: "#fff", letterSpacing: "-0.02em",
          paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}>
          GlamTec
          <span style={{
            display: "block", fontSize: 10,
            fontFamily: "system-ui, sans-serif", fontWeight: 400,
            color: "rgba(255,255,255,0.45)", letterSpacing: "0.2em",
            textTransform: "uppercase", marginTop: 2,
          }}>AR Try-On</span>
        </div>

        

        {/* Toggle Mode */}
        <div style={{
          background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 4,
          display: "flex", gap: 2,
        }}>
          {[
            { id: "face", icon: "📷", label: "Caméra AR" },
            { id: "free", icon: "🔄", label: "Viewer 3D" },
          ].map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)} style={{
              flex: 1, padding: "8px 4px",
              background: mode === m.id ? "#fff" : "transparent",
              color: mode === m.id ? "#1e3a8a" : "rgba(255,255,255,0.55)",
              border: "none", borderRadius: 9, cursor: "pointer",
              fontFamily: "system-ui, sans-serif", fontWeight: 700,
              fontSize: 11, transition: "all 0.2s",
            }}>{m.icon} {m.label}</button>
          ))}
        </div>

        {/* Sélecteur de modèle */}
        <div style={{
          background: "rgba(255,255,255,0.07)", borderRadius: 14,
          padding: "14px 16px", border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.2em", textTransform: "uppercase",
            fontFamily: "system-ui, sans-serif", marginBottom: 12,
          }}>👓 Modèle</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {GLASSES_CONFIG.map((g) => (
              <button key={g.id} onClick={() => { setSelected(g); setFrameColor(null); }} style={{
                padding: "9px 14px",
                background: selected.id === g.id ? "#fff" : "rgba(255,255,255,0.08)",
                color: selected.id === g.id ? "#1e3a8a" : "rgba(255,255,255,0.8)",
                border: `1.5px solid ${selected.id === g.id ? "#fff" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 10, fontFamily: "system-ui, sans-serif",
                fontWeight: 700, fontSize: 13, cursor: "pointer",
                textAlign: "left", transition: "all 0.18s",
              }}>
                {selected.id === g.id ? "✓ " : ""}{g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Couleur monture */}
        <div style={{
          background: "rgba(255,255,255,0.07)", borderRadius: 14,
          padding: "14px 16px", border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.2em", textTransform: "uppercase",
            fontFamily: "system-ui, sans-serif", marginBottom: 12,
          }}>🎨 Couleur monture</div>
          <button onClick={() => setFrameColor(null)} style={{
            width: "100%", padding: "8px 14px", marginBottom: 10,
            background: frameColor === null ? "#fff" : "rgba(255,255,255,0.08)",
            color: frameColor === null ? "#1e3a8a" : "rgba(255,255,255,0.8)",
            border: `1.5px solid ${frameColor === null ? "#fff" : "rgba(255,255,255,0.1)"}`,
            borderRadius: 10, fontFamily: "system-ui, sans-serif",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            transition: "all 0.15s", textAlign: "left",
          }}>
            {frameColor === null ? "✓ " : ""}Original
          </button>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {FRAME_COLORS.filter((fc) => fc.id !== "original").map((fc) => (
              <div key={fc.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <button onClick={() => setFrameColor(fc.color)} title={fc.label} style={{
                  width: 32, height: 32, background: fc.color,
                  border: frameColor === fc.color
                    ? "2px solid #fff"
                    : "2px solid rgba(255,255,255,0.15)",
                  borderRadius: "50%", cursor: "pointer",
                  transform: frameColor === fc.color ? "scale(1.2)" : "scale(1)",
                  transition: "all 0.15s",
                  boxShadow: frameColor === fc.color ? "0 0 0 3px rgba(255,255,255,0.3)" : "none",
                }} />
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontFamily: "system-ui, sans-serif" }}>
                  {fc.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Calibration */}
        {mode === "face" && (
          <div style={{
            background: "rgba(255,255,255,0.07)", borderRadius: 14,
            padding: "14px 16px", border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <div style={{
              fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.2em", textTransform: "uppercase",
              fontFamily: "system-ui, sans-serif", marginBottom: 12,
            }}>⚙️ Calibration</div>

            {[
              { label: "Taille",    val: calibScale, set: setCalibScale, min: 0.1,  max: 3,   step: 0.05, fmt: (v) => v.toFixed(2) },
              { label: "Y global",  val: calibY,     set: setCalibY,     min: -0.5, max: 0.5, step: 0.01, fmt: (v) => (v >= 0 ? "+" : "") + v.toFixed(2) },
              { label: "Profond.",  val: calibZ,     set: setCalibZ,     min: -0.2, max: 0.3, step: 0.01, fmt: (v) => v.toFixed(2) },
            ].map(({ label, val, set, min, max, step, fmt }) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  fontFamily: "system-ui, sans-serif", fontSize: 11,
                  color: "rgba(255,255,255,0.7)", marginBottom: 4,
                }}>
                  <span>{label}</span>
                  <span style={{ color: "#fff", fontWeight: 700 }}>{fmt(val)}</span>
                </div>
                <input type="range" min={min} max={max} step={step} value={val}
                  onChange={(e) => set(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#fff" }} />
              </div>
            ))}

            {/* Offset Y par modèle */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{
                fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.45)",
                letterSpacing: "0.2em", textTransform: "uppercase",
                fontFamily: "system-ui, sans-serif", marginBottom: 10,
              }}>
                📐 Offset Y — {selected.label}
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontFamily: "system-ui, sans-serif", fontSize: 11,
                color: "rgba(255,255,255,0.7)", marginBottom: 4,
              }}>
                <span>Position Y</span>
                <span style={{ color: "#fff", fontWeight: 700 }}>
                  {((offsetYMap[selected.id] ?? 0) >= 0 ? "+" : "") +
                    (offsetYMap[selected.id] ?? 0).toFixed(2)}
                </span>
              </div>
              <input type="range" min={-0.5} max={0.5} step={0.005}
                value={offsetYMap[selected.id] ?? 0}
                onChange={(e) => updateOffsetY(selected.id, parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "#facc15" }} />
              <div style={{
                fontSize: 10, color: "rgba(255,255,255,0.3)",
                fontFamily: "system-ui, sans-serif", marginTop: 4,
              }}>
                ↑ + = monte &nbsp;·&nbsp; − = descend
              </div>
            </div>

            <button onClick={() => {
              setCalibScale(1);
              setCalibY(0);
              setCalibZ(0.06);
              setOffsetYMap(Object.fromEntries(GLASSES_CONFIG.map((g) => [g.id, g.offsetY])));
            }} style={{
              width: "100%", padding: "6px", marginTop: 12,
              background: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8,
              fontFamily: "system-ui, sans-serif", fontSize: 11, cursor: "pointer",
            }}>↺ Reset tout</button>
          </div>
        )}

        <div style={{
          fontSize: 10, color: "rgba(255,255,255,0.2)",
          fontFamily: "system-ui, sans-serif", textAlign: "center",
          letterSpacing: "0.1em",
        }}>
          PFE · Webcom Casablanca 2025
        </div>
      </div>

      {/* ══ ZONE DROITE ══ */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

        {/* Vidéo — miroir horizontal */}
        <video
          ref={videoRef}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)",        // miroir
            display: mode === "face" ? "block" : "none",
          }}
          autoPlay playsInline muted
        />

        {/* Canvas AR */}
        {mode === "face" && (
          <Canvas
            style={{ position: "absolute", inset: 0, zIndex: 2 }}
            camera={{ fov: 60, near: 0.01, far: 100, position: [0, 0, 2] }}
            gl={{ alpha: true, antialias: true }}
          >
            <ambientLight intensity={1.5} />
            <directionalLight position={[0, 2, 4]} intensity={1} />

            {/* Masque d'occlusion (renderOrder=1) */}
            {landmarks && <OcclusionFaceMask landmarks={landmarks} />}

            {/* Lunettes (renderOrder=2) */}
            {landmarks && (
              <GlassesFaceTracked
                landmarks={landmarks}
                poseMatrix={poseMatrix}
                config={activeConfig}
                frameColor={frameColor}
                calibScale={calibScale}
                calibY={calibY}
                calibZ={calibZ}
              />
            )}
          </Canvas>
        )}

        {/* Viewer 3D libre */}
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
              <directionalLight position={[5, 5, 5]}   intensity={1.5} />
              <directionalLight position={[-5, 3, 3]}  intensity={1.0} />
              <directionalLight position={[0, -3, 5]}  intensity={0.8} />
              <GlassesFree config={selected} frameColor={frameColor} />
              <OrbitControls
                enablePan={false} enableZoom={true} enableRotate={true}
                autoRotate={true} autoRotateSpeed={1.5}
                minDistance={1.5} maxDistance={8}
              />
            </Canvas>
            <div style={{
              position: "absolute", bottom: 24, left: "50%",
              transform: "translateX(-50%)",
              color: "#94a3b8", fontFamily: "system-ui, sans-serif",
              fontSize: 11, letterSpacing: "0.1em",
              background: "rgba(255,255,255,0.8)", padding: "5px 14px",
              borderRadius: 20, zIndex: 5, pointerEvents: "none",
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