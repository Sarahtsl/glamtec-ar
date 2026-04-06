import { useState, useRef, useCallback } from "react";
import QRCode from "qrcode";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const TRIPO_API_KEY  = "tsk_DQ7k2EzwmXKujethIalzjk1vcOOYg6mcIFpApLsoK9o";   // 🔑 remplace ici
const TRIPO_BASE     = "https://api.tripo3d.ai/v2/openapi";
const AR_VIEWER_BASE = typeof window !== "undefined"
  ? window.location.origin
  : "http://localhost:5173";
// ─────────────────────────────────────────────────────────────────────────────

// ─── TRIPO HELPERS ────────────────────────────────────────────────────────────

/** Étape 1 — upload image → file_token */
async function tripoUploadImage(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${TRIPO_BASE}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TRIPO_API_KEY}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Upload Tripo échoué (${res.status})`);
  const data = await res.json();
  return data.data.image_token;
}

/** Étape 2 — créer tâche image_to_model → task_id */
async function tripoCreateModelTask(imageToken) {
  const res = await fetch(`${TRIPO_BASE}/task`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TRIPO_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "image_to_model",
      file: { type: "jpg", file_token: imageToken },
      model_version: "v2.5-20250123",
      texture: true,
      pbr: true,
    }),
  });
  if (!res.ok) throw new Error(`Création tâche GLB (${res.status})`);
  const data = await res.json();
  return data.data.task_id;
}

/** Étape 3 — créer tâche convert_model → USDZ */
async function tripoCreateUsdzTask(originalTaskId) {
  const res = await fetch(`${TRIPO_BASE}/task`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TRIPO_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "convert_model",
      original_model_task_id: originalTaskId,
      format: "USDZ",
    }),
  });
  if (!res.ok) throw new Error(`Création tâche USDZ (${res.status})`);
  const data = await res.json();
  return data.data.task_id;
}

/** Poll une tâche Tripo jusqu'à success */
async function tripoPollTask(taskId, onProgress, label = "") {
  const MAX = 120;
  for (let i = 0; i < MAX; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const res = await fetch(`${TRIPO_BASE}/task/${taskId}`, {
      headers: { Authorization: `Bearer ${TRIPO_API_KEY}` },
    });
    if (!res.ok) throw new Error(`Poll ${label} (${res.status})`);
    const data = await res.json();
    const { status, progress, output } = data.data;
    onProgress(Math.round(progress || 0));
    if (status === "success") return output;
    if (status === "failed" || status === "cancelled")
      throw new Error(`Tâche ${label} ${status}`);
  }
  throw new Error(`Timeout ${label} (2 min)`);
}

/** Construit l'URL AR avec GLB + USDZ optionnel */
function buildArUrl(glbUrl, usdzUrl, title) {
  const params = new URLSearchParams({
    model: glbUrl,
    title: title || "Modèle AR",
  });
  if (usdzUrl) params.set("ios_model", usdzUrl);
  return `${AR_VIEWER_BASE}/ar-product.html?${params.toString()}`;
}

// ─── STEPPER CONFIG ───────────────────────────────────────────────────────────
const STEPS = [
  { id: "upload", label: "Upload" },
  { id: "glb",    label: "Génération GLB" },
  { id: "usdz",   label: "Conversion USDZ" },
  { id: "qr",     label: "QR Code" },
];

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function ArGenerator() {
  const [step, setStep]           = useState("upload");
  const [dragOver, setDragOver]   = useState(false);
  const [preview, setPreview]     = useState(null);
  const [file, setFile]           = useState(null);
  const [modelName, setModelName] = useState("");
  const [progress, setProgress]   = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [arUrl, setArUrl]         = useState("");
  const [glbUrl, setGlbUrl]       = useState("");
  const [usdzUrl, setUsdzUrl]     = useState("");
  const [error, setError]         = useState(null);
  const inputRef = useRef();

  const handleFile = useCallback((f) => {
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
    setModelName(f.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "));
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const reset = () => {
    setStep("upload"); setPreview(null); setFile(null);
    setModelName(""); setProgress(0); setStatusMsg("");
    setQrDataUrl(null); setArUrl(""); setGlbUrl("");
    setUsdzUrl(""); setError(null);
  };

  const generate = async () => {
    if (!file) return;
    setError(null);
    try {
      // ── 1. Upload image ──────────────────────────────────────────
      setStep("glb");
      setStatusMsg("Upload de l'image vers Tripo…");
      setProgress(5);
      const imageToken = await tripoUploadImage(file);

      // ── 2. Génération GLB ────────────────────────────────────────
      setStatusMsg("Démarrage génération 3D…");
      setProgress(10);
      const glbTaskId = await tripoCreateModelTask(imageToken);

      const glbOutput = await tripoPollTask(
        glbTaskId,
        (p) => {
          setProgress(10 + Math.round(p * 0.55));
          setStatusMsg(`Génération GLB… ${p}%`);
        },
        "GLB"
      );
      const glb = glbOutput.model;
      setGlbUrl(glb);
      setProgress(65);

      // ── 3. Conversion USDZ via Tripo ─────────────────────────────
      setStep("usdz");
      setStatusMsg("Démarrage conversion USDZ pour iPhone…");
      setProgress(67);
      let usdz = "";
      try {
        const usdzTaskId = await tripoCreateUsdzTask(glbTaskId);
        const usdzOutput = await tripoPollTask(
          usdzTaskId,
          (p) => {
            setProgress(67 + Math.round(p * 0.25));
            setStatusMsg(`Conversion USDZ… ${p}%`);
          },
          "USDZ"
        );
        usdz = usdzOutput.model;
        setUsdzUrl(usdz);
        setProgress(92);
        setStatusMsg("USDZ prêt ✓");
      } catch (e) {
        setStatusMsg("⚠️ USDZ non disponible — GLB seulement");
      }

      // ── 4. QR Code ───────────────────────────────────────────────
      setStep("qr");
      setStatusMsg("Génération du QR Code…");
      setProgress(95);
      const url = buildArUrl(glb, usdz, modelName || "Modèle AR");
      setArUrl(url);
      const qr = await QRCode.toDataURL(url, {
        width: 280, margin: 2,
        color: { dark: "#0f2557", light: "#ffffff" },
        errorCorrectionLevel: "H",
      });
      setQrDataUrl(qr);
      setProgress(100);
      setStatusMsg("Prêt !");

    } catch (e) {
      setError(e.message);
      setStep("upload");
    }
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.download = `ar-qr-${(modelName || "model").replace(/\s+/g, "_")}.png`;
    a.href = qrDataUrl; a.click();
  };

  const stepIdx = STEPS.findIndex(s => s.id === step);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        :root{
          --accent:#7c6dfa;--accentB:#fa6d9f;
          --bg:#07080f;--surface:rgba(255,255,255,0.04);
          --border:rgba(255,255,255,0.08);--border2:rgba(255,255,255,0.14);
          --text:#eeeef5;--muted:rgba(255,255,255,0.4);
          --success:#00c878;--error:#ff6b6b;
          --ios:#00c878;--android:#60a5fa;
        }
        html,body,#root{width:100%;min-height:100vh;background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;}
        .ag-top{position:sticky;top:0;z-index:20;height:56px;display:flex;align-items:center;
          justify-content:space-between;padding:0 32px;
          background:rgba(7,8,15,0.92);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);}
        .ag-logo{font-family:'Syne',sans-serif;font-size:1rem;font-weight:800;
          background:linear-gradient(135deg,var(--accent),var(--accentB));
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .ag-back{font-size:.75rem;color:var(--muted);text-decoration:none;transition:color .2s;}
        .ag-back:hover{color:var(--text);}
        .ag-hero{padding:48px 32px 28px;text-align:center;}
        .ag-eyebrow{font-family:'DM Mono',monospace;font-size:.65rem;letter-spacing:.2em;
          text-transform:uppercase;color:var(--accent);margin-bottom:12px;}
        .ag-h1{font-family:'Syne',sans-serif;font-size:clamp(1.8rem,4vw,2.6rem);
          font-weight:800;line-height:1.05;margin-bottom:10px;}
        .ag-h1 span{background:linear-gradient(135deg,var(--accent),var(--accentB));
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .ag-sub{font-size:.83rem;color:var(--muted);line-height:1.7;max-width:500px;margin:0 auto;}
        .ag-stepper{display:flex;justify-content:center;align-items:center;gap:0;padding:24px 20px 0;flex-wrap:wrap;}
        .ag-step{display:flex;align-items:center;}
        .ag-dot{width:26px;height:26px;border-radius:50%;border:1.5px solid var(--border2);
          display:flex;align-items:center;justify-content:center;
          font-family:'DM Mono',monospace;font-size:.6rem;color:var(--muted);
          transition:all .3s;background:var(--surface);flex-shrink:0;}
        .ag-dot.active{border-color:var(--accent);color:var(--accent);background:rgba(124,109,250,0.12);}
        .ag-dot.done{border-color:var(--success);background:rgba(0,200,120,0.1);color:var(--success);}
        .ag-slabel{font-size:.6rem;color:var(--muted);margin-left:6px;white-space:nowrap;letter-spacing:.04em;}
        .ag-slabel.active{color:var(--text);}
        .ag-line{width:32px;height:1px;background:var(--border);margin:0 4px;transition:background .4s;}
        .ag-line.done{background:var(--success);}
        @media(max-width:480px){.ag-slabel{display:none;}.ag-line{width:18px;}}
        .ag-main{max-width:700px;margin:28px auto;padding:0 20px 60px;width:100%;}
        .ag-drop{border:1.5px dashed var(--border2);border-radius:16px;padding:48px 24px;
          text-align:center;cursor:pointer;transition:all .25s;background:var(--surface);
          position:relative;overflow:hidden;}
        .ag-drop:hover,.ag-drop.over{border-color:var(--accent);background:rgba(124,109,250,0.06);}
        .ag-drop-icon{font-size:2.4rem;margin-bottom:14px;opacity:.5;}
        .ag-drop-title{font-family:'Syne',sans-serif;font-size:1.05rem;font-weight:700;margin-bottom:6px;}
        .ag-drop-hint{font-size:.74rem;color:var(--muted);}
        .ag-drop input{position:absolute;inset:0;opacity:0;cursor:pointer;}
        .ag-prev-wrap{display:flex;gap:18px;align-items:flex-start;margin-bottom:18px;}
        .ag-prev-img{width:130px;height:130px;object-fit:cover;border-radius:12px;border:1px solid var(--border2);flex-shrink:0;}
        .ag-prev-info{flex:1;}
        .ag-lbl{font-size:.62rem;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px;}
        .ag-name-input{width:100%;background:rgba(255,255,255,0.05);border:1px solid var(--border2);
          border-radius:8px;padding:10px 14px;color:var(--text);font-family:'DM Sans',sans-serif;
          font-size:.88rem;outline:none;transition:border .2s;}
        .ag-name-input:focus{border-color:var(--accent);}
        .ag-prev-meta{font-size:.68rem;color:var(--muted);margin-top:7px;}
        .ag-change{font-size:.7rem;color:var(--accent);cursor:pointer;margin-top:8px;background:none;border:none;font-family:'DM Sans',sans-serif;}
        .ag-change:hover{text-decoration:underline;}
        .ag-fmt-row{display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;}
        .ag-fmt{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:10px;flex:1;min-width:140px;transition:opacity .3s;}
        .ag-fmt-glb{background:rgba(96,165,250,0.08);border:1px solid rgba(96,165,250,0.2);}
        .ag-fmt-usdz{background:rgba(0,200,120,0.08);border:1px solid rgba(0,200,120,0.2);}
        .ag-fmt-icon{font-size:1.1rem;flex-shrink:0;}
        .ag-fmt-name{font-family:'DM Mono',monospace;font-size:.72rem;font-weight:500;margin-bottom:1px;}
        .ag-fmt-glb .ag-fmt-name{color:var(--android);}
        .ag-fmt-usdz .ag-fmt-name{color:var(--ios);}
        .ag-fmt-desc{font-size:.62rem;color:var(--muted);}
        .ag-fmt-status{margin-left:auto;font-size:.68rem;font-weight:600;padding:2px 9px;border-radius:10px;white-space:nowrap;}
        .ag-fmt-glb .ag-fmt-status.ready{background:rgba(96,165,250,0.15);color:var(--android);}
        .ag-fmt-usdz .ag-fmt-status.ready{background:rgba(0,200,120,0.15);color:var(--ios);}
        .ag-fmt-status.wait{color:var(--muted);background:transparent;}
        .ag-fmt-status.spin-wrap{display:flex;align-items:center;gap:4px;color:var(--muted);}
        .ag-btn-gen{width:100%;padding:15px;border:none;border-radius:12px;
          background:linear-gradient(135deg,var(--accent),var(--accentB));
          font-family:'Syne',sans-serif;font-size:.95rem;font-weight:800;
          color:#fff;cursor:pointer;box-shadow:0 8px 28px rgba(124,109,250,0.3);
          transition:all .2s;}
        .ag-btn-gen:hover{transform:translateY(-2px);box-shadow:0 12px 36px rgba(124,109,250,0.4);}
        .ag-btn-gen:disabled{opacity:.35;cursor:not-allowed;transform:none;}
        .ag-prog-box{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:26px;margin-bottom:16px;}
        .ag-prog-title{font-family:'Syne',sans-serif;font-size:.95rem;font-weight:700;margin-bottom:5px;display:flex;align-items:center;gap:8px;}
        .ag-prog-msg{font-size:.72rem;color:var(--muted);margin-bottom:16px;font-family:'DM Mono',monospace;min-height:18px;}
        .ag-bar-track{height:5px;background:rgba(255,255,255,0.07);border-radius:5px;overflow:hidden;}
        .ag-bar-fill{height:100%;border-radius:5px;transition:width .5s ease;background:linear-gradient(90deg,var(--accent),var(--accentB));}
        .ag-prog-pct{font-family:'DM Mono',monospace;font-size:.68rem;color:var(--muted);margin-top:7px;text-align:right;}
        .ag-spinner{display:inline-block;width:13px;height:13px;border:2px solid rgba(124,109,250,0.2);
          border-top-color:var(--accent);border-radius:50%;animation:spin 1s linear infinite;flex-shrink:0;}
        @keyframes spin{to{transform:rotate(360deg)}}
        .ag-result{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:28px;}
        .ag-result-top{display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;margin-bottom:22px;}
        .ag-qr-frame{background:#fff;border-radius:12px;padding:12px;flex-shrink:0;box-shadow:0 12px 40px rgba(0,0,0,0.4);}
        .ag-qr-frame img{display:block;border-radius:6px;}
        .ag-result-info{flex:1;min-width:200px;}
        .ag-result-badge{display:inline-flex;align-items:center;gap:6px;font-size:.6rem;
          padding:3px 10px;border-radius:20px;letter-spacing:.08em;margin-bottom:12px;
          background:rgba(0,200,120,0.1);border:1px solid rgba(0,200,120,0.2);color:var(--success);}
        .ag-result-name{font-family:'Syne',sans-serif;font-size:1.25rem;font-weight:800;margin-bottom:6px;}
        .ag-result-hint{font-size:.74rem;color:var(--muted);line-height:1.7;margin-bottom:16px;}
        .ag-url-box{background:rgba(0,0,0,0.3);border:1px solid var(--border);border-radius:8px;padding:10px 14px;}
        .ag-url-label{font-size:.58rem;color:var(--muted);letter-spacing:.12em;text-transform:uppercase;margin-bottom:3px;}
        .ag-url-val{font-family:'DM Mono',monospace;font-size:.64rem;color:var(--muted);word-break:break-all;line-height:1.6;}
        .ag-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:16px;}
        .ag-btn-dl{padding:13px;background:linear-gradient(135deg,var(--accent),var(--accentB));
          border:none;border-radius:8px;font-family:'Syne',sans-serif;font-weight:700;
          font-size:.85rem;color:#fff;cursor:pointer;transition:all .2s;grid-column:1/-1;}
        .ag-btn-dl:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(124,109,250,0.3);}
        .ag-btn-sec{padding:11px;background:transparent;border:1px solid var(--border2);
          border-radius:8px;font-family:'DM Sans',sans-serif;font-size:.78rem;color:var(--text);
          cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:5px;}
        .ag-btn-sec:hover{border-color:var(--accent);background:rgba(124,109,250,0.06);}
        .ag-btn-new{padding:11px;background:transparent;border:1px solid var(--border);
          border-radius:8px;font-family:'DM Sans',sans-serif;font-size:.78rem;color:var(--muted);
          cursor:pointer;transition:all .2s;margin-top:10px;width:100%;}
        .ag-btn-new:hover{border-color:var(--border2);color:var(--text);}
        .ag-error{background:rgba(255,107,107,0.07);border:1px solid rgba(255,107,107,0.2);
          border-radius:10px;padding:13px 16px;margin-bottom:14px;
          font-size:.76rem;color:var(--error);font-family:'DM Mono',monospace;line-height:1.6;}
        .ag-error strong{display:block;margin-bottom:3px;}
        .ag-info{background:rgba(124,109,250,0.05);border:1px solid rgba(124,109,250,0.14);
          border-radius:10px;padding:13px 16px;margin-top:18px;font-size:.7rem;color:var(--muted);line-height:1.9;}
        .ag-info strong{color:var(--accent);font-family:'DM Mono',monospace;}
      `}</style>

      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>

        {/* TOPBAR */}
        <div className="ag-top">
          <div className="ag-logo">AR·STUDIO</div>
          <a href="/" className="ag-back">← Accueil</a>
        </div>

        {/* HERO */}
        <div className="ag-hero">
          <div className="ag-eyebrow">Image → GLB + USDZ → AR</div>
          <h1 className="ag-h1">Créez votre <span>expérience AR</span></h1>
          <p className="ag-sub">
            Une photo · Tripo génère{" "}
            <strong style={{color:"var(--android)"}}>GLB</strong> pour Android &{" "}
            <strong style={{color:"var(--ios)"}}>USDZ</strong> pour iPhone · Un seul QR pour les deux
          </p>
        </div>

        {/* STEPPER */}
        <div className="ag-stepper">
          {STEPS.map((s, i) => (
            <div key={s.id} className="ag-step">
              {i > 0 && <div className={`ag-line${i <= stepIdx ? " done" : ""}`}/>}
              <div className={`ag-dot${i < stepIdx ? " done" : i === stepIdx ? " active" : ""}`}>
                {i < stepIdx ? "✓" : i + 1}
              </div>
              <span className={`ag-slabel${i === stepIdx ? " active" : ""}`}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="ag-main">

          {error && (
            <div className="ag-error">
              <strong>Erreur</strong>{error}
            </div>
          )}

          {/* ── UPLOAD ── */}
          {step === "upload" && (
            <>
              {!preview ? (
                <div
                  className={`ag-drop${dragOver ? " over" : ""}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => inputRef.current?.click()}
                >
                  <input ref={inputRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files[0])}/>
                  <div className="ag-drop-icon">🖼️</div>
                  <div className="ag-drop-title">Déposez une image ici</div>
                  <div className="ag-drop-hint">ou cliquez · JPG, PNG, WEBP</div>
                </div>
              ) : (
                <>
                  <div className="ag-prev-wrap">
                    <img src={preview} alt="preview" className="ag-prev-img"/>
                    <div className="ag-prev-info">
                      <div className="ag-lbl">Nom du modèle</div>
                      <input
                        className="ag-name-input"
                        value={modelName}
                        onChange={e => setModelName(e.target.value)}
                        placeholder="Ex: Chaise design…"
                      />
                      <div className="ag-prev-meta">{file?.name} · {(file?.size/1024).toFixed(0)} KB</div>
                      <button className="ag-change" onClick={reset}>↩ Changer</button>
                    </div>
                  </div>

                  {/* FORMAT BADGES — ce qu'on va générer */}
                  <div className="ag-fmt-row">
                    <div className="ag-fmt ag-fmt-glb">
                      <div className="ag-fmt-icon">🤖</div>
                      <div>
                        <div className="ag-fmt-name">.GLB</div>
                        <div className="ag-fmt-desc">Android · Chrome AR · Scene Viewer</div>
                      </div>
                      <div className="ag-fmt-status ready">à générer</div>
                    </div>
                    <div className="ag-fmt ag-fmt-usdz">
                      <div className="ag-fmt-icon">🍎</div>
                      <div>
                        <div className="ag-fmt-name">.USDZ</div>
                        <div className="ag-fmt-desc">iPhone · Safari · QuickLook AR</div>
                      </div>
                      <div className="ag-fmt-status ready">à générer</div>
                    </div>
                  </div>

                  <button className="ag-btn-gen" onClick={generate} disabled={!file}>
                    🚀 Générer GLB + USDZ
                  </button>
                </>
              )}

              <div className="ag-info">
                <strong>Tâche 1</strong> image_to_model → <strong>.GLB</strong> ·{" "}
                <strong>Tâche 2</strong> convert_model → <strong>.USDZ</strong> ·
                Le QR détecte <strong>iOS</strong> ou <strong>Android</strong> automatiquement
              </div>
            </>
          )}

          {/* ── GLB EN COURS ── */}
          {step === "glb" && (
            <div className="ag-prog-box">
              <div className="ag-prog-title">
                <div className="ag-spinner"/>Génération du modèle 3D…
              </div>
              <div className="ag-prog-msg">{statusMsg}</div>
              <div className="ag-bar-track">
                <div className="ag-bar-fill" style={{width:`${progress}%`}}/>
              </div>
              <div className="ag-prog-pct">{progress}%</div>
              <div className="ag-fmt-row" style={{marginTop:20,marginBottom:0}}>
                <div className="ag-fmt ag-fmt-glb">
                  <div className="ag-fmt-icon">🤖</div>
                  <div><div className="ag-fmt-name">.GLB</div><div className="ag-fmt-desc">Android AR</div></div>
                  <div className="ag-fmt-status spin-wrap"><div className="ag-spinner" style={{width:10,height:10}}/>génération</div>
                </div>
                <div className="ag-fmt ag-fmt-usdz" style={{opacity:.4}}>
                  <div className="ag-fmt-icon">🍎</div>
                  <div><div className="ag-fmt-name">.USDZ</div><div className="ag-fmt-desc">iPhone AR</div></div>
                  <div className="ag-fmt-status wait">en attente</div>
                </div>
              </div>
            </div>
          )}

          {/* ── USDZ EN COURS ── */}
          {step === "usdz" && (
            <div className="ag-prog-box">
              <div className="ag-prog-title">
                <div className="ag-spinner"/>Conversion USDZ pour iPhone…
              </div>
              <div className="ag-prog-msg">{statusMsg}</div>
              <div className="ag-bar-track">
                <div className="ag-bar-fill" style={{width:`${progress}%`}}/>
              </div>
              <div className="ag-prog-pct">{progress}%</div>
              <div className="ag-fmt-row" style={{marginTop:20,marginBottom:0}}>
                <div className="ag-fmt ag-fmt-glb">
                  <div className="ag-fmt-icon">🤖</div>
                  <div><div className="ag-fmt-name">.GLB</div><div className="ag-fmt-desc">Android AR</div></div>
                  <div className="ag-fmt-status ready">✓ prêt</div>
                </div>
                <div className="ag-fmt ag-fmt-usdz">
                  <div className="ag-fmt-icon">🍎</div>
                  <div><div className="ag-fmt-name">.USDZ</div><div className="ag-fmt-desc">iPhone AR</div></div>
                  <div className="ag-fmt-status spin-wrap"><div className="ag-spinner" style={{width:10,height:10}}/>conversion</div>
                </div>
              </div>
            </div>
          )}

          {/* ── QR RÉSULTAT FINAL ── */}
          {step === "qr" && qrDataUrl && (
            <div className="ag-result">
              <div className="ag-result-top">
                <div className="ag-qr-frame">
                  <img src={qrDataUrl} alt="QR Code AR" width={200} height={200}/>
                </div>
                <div className="ag-result-info">
                  <div className="ag-result-badge">✓ Modèle AR prêt</div>
                  <div className="ag-result-name">{modelName || "Modèle AR"}</div>
                  <div className="ag-result-hint">
                    Scannez avec n'importe quel appareil photo.<br/>
                    <strong style={{color:"var(--ios)"}}>iPhone</strong> → QuickLook USDZ ·{" "}
                    <strong style={{color:"var(--android)"}}>Android</strong> → Chrome AR GLB
                  </div>
                  <div className="ag-url-box">
                    <div className="ag-url-label">URL AR encodée</div>
                    <div className="ag-url-val">{arUrl}</div>
                  </div>
                </div>
              </div>

              {/* STATUS DES DEUX FORMATS */}
              <div className="ag-fmt-row">
                <div className="ag-fmt ag-fmt-glb">
                  <div className="ag-fmt-icon">🤖</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="ag-fmt-name">.GLB — Android</div>
                    <div className="ag-fmt-desc" style={{fontSize:".58rem",wordBreak:"break-all"}}>
                      {glbUrl ? glbUrl.slice(0,55)+"…" : "—"}
                    </div>
                  </div>
                  <div className="ag-fmt-status ready">✓</div>
                </div>
                <div className="ag-fmt ag-fmt-usdz" style={{opacity: usdzUrl ? 1 : 0.45}}>
                  <div className="ag-fmt-icon">🍎</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="ag-fmt-name">.USDZ — iPhone</div>
                    <div className="ag-fmt-desc" style={{fontSize:".58rem",wordBreak:"break-all"}}>
                      {usdzUrl ? usdzUrl.slice(0,55)+"…" : "Non disponible"}
                    </div>
                  </div>
                  {usdzUrl
                    ? <div className="ag-fmt-status ready">✓</div>
                    : <div className="ag-fmt-status wait">⚠️</div>
                  }
                </div>
              </div>

              <div className="ag-actions">
                <button className="ag-btn-dl" onClick={downloadQR}>↓ Télécharger QR Code PNG</button>
                <button className="ag-btn-sec" onClick={() => navigator.clipboard.writeText(arUrl)}>⎘ Copier URL</button>
                <button className="ag-btn-sec" onClick={() => window.open(arUrl,"_blank")}>↗ Tester le viewer</button>
              </div>

              <button className="ag-btn-new" onClick={reset}>+ Générer un nouveau modèle</button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}