import { useState, useEffect } from "react";
import QRCode from "qrcode";

// ─── Tous les modèles (lunettes exclues — déjà gérées par TryOnPage) ───
const AR_MODELS = [
  // Chaises
  { id: "chair",         file: "chair.glb",         label: "Chaise",                    icon: "🪑", category: "Chaises" },
  { id: "cover_chair",   file: "cover_chair.glb",    label: "Housse de Chaise",          icon: "🪑", category: "Chaises" },
  { id: "gothic_chair",  file: "gothic_chair.glb",   label: "Chaise Gothique",           icon: "🪑", category: "Chaises" },
  { id: "office_chair",  file: "office_chair.glb",   label: "Chaise de Bureau",          icon: "🪑", category: "Chaises" },
  // Tables
  { id: "table",              file: "table.glb",                           label: "Table",                  icon: "🪵", category: "Tables" },
  { id: "antique_table",      file: "antique_table.glb",                   label: "Table Antique",          icon: "🪵", category: "Tables" },
  { id: "folding_table",      file: "folding_table.glb",                   label: "Table Pliante",          icon: "🪵", category: "Tables" },
  { id: "industrial_table",   file: "industrial_table.glb",                label: "Table Industrielle",     icon: "🪵", category: "Tables" },
  { id: "mahogany_table",     file: "mahogany_table.glb",                  label: "Table Acajou",           icon: "🪵", category: "Tables" },
  { id: "victorian_table",    file: "victorian_table.glb",                 label: "Table Victorienne",      icon: "🪵", category: "Tables" },
  { id: "wooden_table",       file: "wooden_table._practical_model_-_yadira.glb", label: "Table en Bois",  icon: "🪵", category: "Tables" },
  // Mobilier
  { id: "makeup_dresser",     file: "makeup_dresser_white.glb",            label: "Coiffeuse Blanche",      icon: "🪞", category: "Mobilier" },
  { id: "makeup_table",       file: "makeup_table--low_poly.glb",          label: "Table Maquillage",       icon: "🪞", category: "Mobilier" },
  // Vêtements
  { id: "male_basic_tshirt",  file: "male_basic_t_shirt.glb",              label: "T-Shirt Basique",        icon: "👕", category: "Vêtements" },
  { id: "oversized_tshirt",   file: "oversized_t-shirt.glb",               label: "T-Shirt Oversize",       icon: "👕", category: "Vêtements" },
  { id: "tshirt",             file: "t_shirt.glb",                         label: "T-Shirt",                icon: "👕", category: "Vêtements" },
];

function getBaseUrl() {
  return window.location.origin;
}

function buildArUrl(file, label) {
  return `${getBaseUrl()}/ar-product.html?model=${encodeURIComponent(file)}&title=${encodeURIComponent(label)}`;
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@400;500&display=swap');

  .qrgen-root {
    --bg: #07080f; --surf: #0f1018; --card: #13141e; --border: #22243a;
    --accent: #7c6dfa; --accentB: #fa6d9f; --text: #eeeef5; --muted: #5a5a7a;
    --glow: 0 0 60px rgba(124,109,250,0.2);
    min-height: 100vh; background: var(--bg); color: var(--text);
    font-family: 'DM Mono', monospace; padding: 0 0 80px;
    position: relative; overflow-x: hidden;
  }
  .qrgen-root::before {
    content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
    background:
      radial-gradient(ellipse 60% 40% at 20% 10%, rgba(124,109,250,0.08) 0%, transparent 60%),
      radial-gradient(ellipse 50% 30% at 80% 80%, rgba(250,109,159,0.06) 0%, transparent 60%);
  }
  .qrgen-wrap { max-width:1100px; margin:0 auto; padding:0 24px; position:relative; z-index:1; }

  /* Header */
  .qrgen-header { padding:48px 0 36px; text-align:center; }
  .qrgen-logo {
    font-family:'Syne',sans-serif; font-weight:800;
    font-size:clamp(1.8rem,5vw,3.2rem); letter-spacing:-1.5px; line-height:1;
    background:linear-gradient(135deg,var(--accent),var(--accentB));
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .qrgen-sub { color:var(--muted); font-size:0.72rem; letter-spacing:3px; text-transform:uppercase; margin-top:10px; }
  .live-badge {
    display:inline-flex; align-items:center; gap:8px; padding:6px 16px;
    border-radius:100px; margin-bottom:18px;
    background:rgba(124,109,250,0.08); border:1px solid rgba(124,109,250,0.2);
    font-size:0.68rem; color:var(--accent); letter-spacing:1.5px; text-transform:uppercase;
  }
  .live-dot { width:6px;height:6px;border-radius:50%;background:var(--accent);animation:livepulse 2s infinite; }
  @keyframes livepulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }

  /* Back */
  .back-btn {
    display:inline-flex; align-items:center; gap:8px; padding:9px 18px; border-radius:50px;
    border:1px solid var(--border); background:var(--surf); color:var(--muted);
    font-family:'DM Mono',monospace; font-size:0.72rem; cursor:pointer;
    text-decoration:none; transition:all 0.2s; margin-bottom:28px;
  }
  .back-btn:hover { border-color:var(--accent); color:var(--accent); }

  /* Grid */
  .qrgen-grid { display:grid; grid-template-columns:1fr 370px; gap:24px; align-items:start; }
  @media(max-width:860px){ .qrgen-grid{grid-template-columns:1fr;} }

  .sec-title {
    font-family:'Syne',sans-serif; font-weight:700; font-size:0.68rem;
    letter-spacing:3px; text-transform:uppercase; color:var(--muted); margin-bottom:14px;
  }

  /* Category */
  .cat-label { font-size:0.6rem; text-transform:uppercase; letter-spacing:2px; color:var(--muted); margin:20px 0 8px; padding-left:2px; }
  .cat-label:first-child { margin-top:0; }

  /* Model cards */
  .models-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:10px; }
  .model-card {
    background:var(--card); border:1px solid var(--border); border-radius:12px;
    padding:18px 14px; text-align:center; cursor:pointer; position:relative; overflow:hidden;
    transition:all 0.22s cubic-bezier(.4,0,.2,1);
  }
  .model-card::before {
    content:''; position:absolute; inset:0; opacity:0;
    background:linear-gradient(135deg,rgba(124,109,250,0.12),rgba(250,109,159,0.08));
    transition:opacity 0.22s;
  }
  .model-card:hover { border-color:rgba(124,109,250,0.4); transform:translateY(-3px); box-shadow:var(--glow); }
  .model-card:hover::before { opacity:1; }
  .model-card.active { border-color:var(--accent); background:rgba(124,109,250,0.08); }
  .model-card.active::before { opacity:1; }
  .model-card .m-icon { font-size:28px; margin-bottom:8px; display:block; }
  .model-card .m-name { font-family:'Syne',sans-serif; font-weight:700; font-size:0.75rem; color:var(--text); }
  .model-card .m-file { font-size:0.55rem; color:var(--muted); margin-top:3px; }
  .model-card.active .m-name { color:var(--accent); }
  .check-badge {
    position:absolute; top:8px; right:8px; width:18px; height:18px; border-radius:50%;
    background:var(--accent); display:flex; align-items:center; justify-content:center;
    font-size:9px; opacity:0; transform:scale(0); transition:all 0.2s;
  }
  .model-card.active .check-badge { opacity:1; transform:scale(1); }

  /* Right panel */
  .right-panel { display:flex; flex-direction:column; gap:18px; position:sticky; top:24px; }
  .panel { background:var(--card); border:1px solid var(--border); border-radius:16px; overflow:hidden; }
  .panel-head {
    padding:14px 18px; border-bottom:1px solid var(--border);
    display:flex; align-items:center; gap:10px;
  }
  .panel-icon {
    width:28px; height:28px; border-radius:7px; flex-shrink:0;
    background:linear-gradient(135deg,var(--accent),var(--accentB));
    display:flex; align-items:center; justify-content:center; font-size:13px;
  }
  .panel-title { font-family:'Syne',sans-serif; font-weight:700; font-size:0.88rem; }
  .panel-body { padding:18px; }

  /* QR */
  .qr-box {
    display:flex; flex-direction:column; align-items:center;
    background:var(--surf); border-radius:12px; padding:22px;
    border:1px solid var(--border); gap:14px; margin-bottom:14px;
  }
  .qr-canvas-wrap {
    background:#fff; border-radius:10px; padding:10px;
    box-shadow:0 0 40px rgba(124,109,250,0.3); transition:box-shadow 0.3s;
  }
  .qr-canvas-wrap:hover { box-shadow:0 0 60px rgba(124,109,250,0.5); }
  .qi-name { font-family:'Syne',sans-serif; font-weight:700; font-size:0.95rem; margin-bottom:4px; text-align:center; }
  .qi-hint { font-size:0.65rem; color:var(--muted); line-height:1.7; text-align:center; }

  /* Compat badges */
  .compat-row { display:flex; gap:8px; justify-content:center; margin-top:6px; }
  .compat-badge {
    padding:3px 10px; border-radius:20px; font-size:0.6rem; font-weight:600;
    letter-spacing:0.5px;
  }
  .compat-ios { background:rgba(0,200,120,0.12); border:1px solid rgba(0,200,120,0.3); color:#00c878; }
  .compat-android { background:rgba(0,180,255,0.12); border:1px solid rgba(0,180,255,0.3); color:#00b4ff; }

  .empty-qr {
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding:36px 20px; gap:10px; background:var(--surf); border-radius:12px;
    border:2px dashed var(--border); margin-bottom:14px;
  }
  .empty-qr .eq-icon { font-size:36px; opacity:0.2; }
  .empty-qr .eq-text { font-size:0.7rem; color:var(--muted); text-align:center; line-height:1.7; }

  /* Buttons */
  .btn-primary {
    width:100%; padding:13px; border:none; border-radius:10px;
    background:linear-gradient(135deg,var(--accent),var(--accentB));
    color:#fff; font-family:'Syne',sans-serif; font-weight:800;
    font-size:0.88rem; cursor:pointer; transition:all 0.2s;
    text-transform:uppercase; margin-bottom:9px; letter-spacing:0.5px;
  }
  .btn-primary:hover { opacity:0.9; transform:translateY(-1px); box-shadow:var(--glow); }
  .btn-row { display:grid; grid-template-columns:1fr 1fr; gap:9px; }
  .btn-sec {
    padding:10px; border-radius:8px; border:1px solid var(--border);
    background:var(--surf); color:var(--text); font-family:'DM Mono',monospace;
    font-size:0.7rem; cursor:pointer; transition:all 0.2s;
    display:flex; align-items:center; justify-content:center; gap:6px;
  }
  .btn-sec:hover { border-color:var(--accent); color:var(--accent); }

  .url-display {
    background:var(--bg); border:1px solid var(--border); border-radius:8px;
    padding:9px 13px; font-size:0.62rem; color:var(--muted);
    word-break:break-all; line-height:1.6;
  }
  .url-label { color:var(--accent); font-size:0.58rem; letter-spacing:1px; text-transform:uppercase; margin-bottom:3px; display:block; }

  /* Batch */
  .batch-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-top:12px; }
  .batch-item {
    background:var(--surf); border:1px solid var(--border); border-radius:8px;
    padding:10px 6px; text-align:center; cursor:pointer; transition:all 0.2s;
  }
  .batch-item:hover { border-color:var(--accent); }
  .batch-item .bi-icon { font-size:18px; margin-bottom:4px; }
  .batch-item .bi-name { font-size:0.55rem; color:var(--muted); line-height:1.3; }

  /* Toast */
  .toast {
    position:fixed; bottom:28px; left:50%; transform:translateX(-50%) translateY(80px);
    background:var(--card); border:1px solid var(--accent); padding:11px 22px;
    border-radius:50px; font-size:0.76rem; color:var(--accent);
    box-shadow:var(--glow); transition:transform 0.3s cubic-bezier(.4,0,.2,1); z-index:999;
  }
  .toast.show { transform:translateX(-50%) translateY(0); }
`;

export default function QrGenerator() {
  const [selected, setSelected]       = useState(null);
  const [qrDataUrl, setQrDataUrl]     = useState(null);
  const [toast, setToast]             = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  function showToast(msg) {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }

  async function generateQR(model) {
    const url = buildArUrl(model.file, model.label);
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 220, margin: 2,
        color: { dark: "#0f1018", light: "#ffffff" },
        errorCorrectionLevel: "H",
      });
      setQrDataUrl(dataUrl);
      setSelected({ ...model, arUrl: url });
    } catch (e) { console.error(e); }
  }

  function downloadQR() {
    if (!qrDataUrl || !selected) return;
    const link = document.createElement("a");
    link.download = `ar-qr-${selected.id}.png`;
    link.href = qrDataUrl;
    link.click();
    showToast("✅ QR Code téléchargé !");
  }

  function copyUrl() {
    if (!selected) return;
    navigator.clipboard.writeText(selected.arUrl);
    showToast("⎘ URL copiée !");
  }

  async function downloadAllQR() {
    showToast("⏳ Génération en cours...");
    for (const model of AR_MODELS) {
      const url = buildArUrl(model.file, model.label);
      const dataUrl = await QRCode.toDataURL(url, {
        width: 220, margin: 2,
        color: { dark: "#0f1018", light: "#ffffff" },
        errorCorrectionLevel: "H",
      });
      const link = document.createElement("a");
      link.download = `ar-qr-${model.id}.png`;
      link.href = dataUrl;
      link.click();
      await new Promise(r => setTimeout(r, 300));
    }
    showToast(`✅ ${AR_MODELS.length} QR codes téléchargés !`);
  }

  const categories = [...new Set(AR_MODELS.map(m => m.category))];

  return (
    <div className="qrgen-root">
      <div className="qrgen-wrap">

        <div className="qrgen-header">
          <div><span className="live-badge"><span className="live-dot" />iOS QuickLook · Android WebXR · READY</span></div>
          <div className="qrgen-logo">QR·AR GENERATOR</div>
          <div className="qrgen-sub">Scannez → Modèle 3D sur surface réelle</div>
        </div>

        <a href="/" className="back-btn">← Retour à l'accueil</a>

        <div className="qrgen-grid">

          {/* LEFT — modèles */}
          <div>
            <div className="sec-title">↗ Sélectionner un modèle ({AR_MODELS.length} disponibles)</div>

            {categories.map(cat => (
              <div key={cat}>
                <div className="cat-label">{cat}</div>
                <div className="models-grid">
                  {AR_MODELS.filter(m => m.category === cat).map(model => (
                    <div
                      key={model.id}
                      className={`model-card ${selected?.id === model.id ? "active" : ""}`}
                      onClick={() => generateQR(model)}
                    >
                      <div className="check-badge">✓</div>
                      <span className="m-icon">{model.icon}</span>
                      <div className="m-name">{model.label}</div>
                      <div className="m-file">{model.file}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Batch download */}
            <div style={{ marginTop: 28 }}>
              <div className="sec-title">⬇ Télécharger tous les QR codes</div>
              <div className="panel">
                <div className="panel-body">
                  <p style={{ fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.7, marginBottom: 14 }}>
                    Générez et téléchargez les {AR_MODELS.length} QR codes en une seule fois.
                  </p>
                  <button className="btn-primary" onClick={downloadAllQR}>
                    ⬡ Télécharger tous ({AR_MODELS.length} QR codes)
                  </button>
                  <div className="batch-grid">
                    {AR_MODELS.map(m => (
                      <div key={m.id} className="batch-item" onClick={() => generateQR(m)}>
                        <div className="bi-icon">{m.icon}</div>
                        <div className="bi-name">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — QR output */}
          <div className="right-panel">
            <div className="panel">
              <div className="panel-head">
                <div className="panel-icon">◈</div>
                <div className="panel-title">QR Code AR</div>
              </div>
              <div className="panel-body">
                {qrDataUrl && selected ? (
                  <>
                    <div className="qr-box">
                      <div className="qr-canvas-wrap">
                        <img src={qrDataUrl} alt="QR Code AR" width={180} height={180} />
                      </div>
                      <div>
                        <div className="qi-name">{selected.label}</div>
                        <div className="qi-hint">Scanner avec l'appareil photo</div>
                        <div className="compat-row">
                          <span className="compat-badge compat-ios">✓ iOS QuickLook</span>
                          <span className="compat-badge compat-android">✓ Android WebXR</span>
                        </div>
                      </div>
                    </div>

                    <div className="url-display">
                      <span className="url-label">URL encodée</span>
                      {selected.arUrl}
                    </div>

                    <div style={{ height: 12 }} />
                    <button className="btn-primary" onClick={downloadQR}>⬇ Télécharger PNG</button>
                    <div className="btn-row">
                      <button className="btn-sec" onClick={copyUrl}>⎘ Copier URL</button>
                      <button className="btn-sec" onClick={() => window.open(selected.arUrl, "_blank")}>↗ Tester</button>
                    </div>
                  </>
                ) : (
                  <div className="empty-qr">
                    <div className="eq-icon">◈</div>
                    <div className="eq-text">Cliquez sur un modèle<br />pour générer son QR Code AR</div>
                  </div>
                )}
              </div>
            </div>

            {/* Compatibilité info */}
            <div className="panel">
              <div className="panel-head">
                <div class="panel-icon">◎</div>
                <div className="panel-title">Compatibilité AR</div>
              </div>
              <div className="panel-body">
                {[
                  { icon: "🍎", title: "iOS — QuickLook", desc: "iPhone 12+ · iOS 14+ · Safari\nFichier .usdz dans /models-usdz/", color: "#00c878" },
                  { icon: "🤖", title: "Android — WebXR", desc: "Chrome 79+ · ARCore installé\nFichier .glb dans /models/", color: "#00b4ff" },
                ].map(({ icon, title, desc, color }) => (
                  <div key={title} style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 22, flexShrink: 0 }}>{icon}</div>
                    <div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "0.8rem", color, marginBottom: 3 }}>{title}</div>
                      <div style={{ fontSize: "0.65rem", color: "var(--muted)", lineHeight: 1.7, whiteSpace: "pre-line" }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div className="panel">
              <div className="panel-head">
                <div className="panel-icon">⚡</div>
                <div className="panel-title">Comment ça marche</div>
              </div>
              <div className="panel-body">
                {[
                  ["1", "Sélectionner", "Choisissez un modèle dans la liste"],
                  ["2", "QR Généré", "Le QR pointe vers glamtec-ar.vercel.app"],
                  ["3", "Scanner", "Appareil photo du téléphone"],
                  ["4", "AR Live", "Modèle 3D posé sur une surface réelle"],
                ].map(([n, t, d]) => (
                  <div key={n} style={{ display: "flex", gap: 12, marginBottom: 13 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                      background: "linear-gradient(135deg,rgba(124,109,250,.2),rgba(250,109,159,.2))",
                      border: "1px solid rgba(124,109,250,.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "0.75rem", color: "var(--accent)"
                    }}>{n}</div>
                    <div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "0.78rem", marginBottom: 1 }}>{t}</div>
                      <div style={{ fontSize: "0.65rem", color: "var(--muted)", lineHeight: 1.5 }}>{d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`toast ${toastVisible ? "show" : ""}`}>{toast}</div>
    </div>
  );
}