import { useState, useEffect } from "react";
import QRCode from "qrcode";

// ─── Models AR (lunettes exclues) ───────────────────────────────────
const AR_MODELS = [
  { id: "chair",             file: "chair.glb",              label: "Chaise",           icon: "🪑", category: "Mobilier" },
  { id: "cover_chair",       file: "cover_chair.glb",        label: "Housse de chaise", icon: "🪑", category: "Mobilier" },
  { id: "table",             file: "table.glb",              label: "Table",            icon: "🪞", category: "Mobilier" },
  { id: "male_basic_tshirt", file: "male_basic_t_shirt.glb", label: "T-Shirt Basique",  icon: "👕", category: "Vêtements" },
  { id: "oversized_tshirt",  file: "oversized_t-shirt.glb",  label: "T-Shirt Oversize", icon: "👕", category: "Vêtements" },
  { id: "tshirt",            file: "t_shirt.glb",            label: "T-Shirt",          icon: "👕", category: "Vêtements" },
];

function getBaseUrl() {
  return window.location.origin; // https://glamtec-ar.vercel.app en prod
}

function buildArUrl(file, label) {
  return `${getBaseUrl()}/ar-product.html?model=${encodeURIComponent(file)}&title=${encodeURIComponent(label)}`;
}

// ─── Styles ─────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@400;500&display=swap');

  .qrgen-root {
    --bg: #07080f;
    --surf: #0f1018;
    --card: #13141e;
    --border: #22243a;
    --accent: #7c6dfa;
    --accentB: #fa6d9f;
    --text: #eeeef5;
    --muted: #5a5a7a;
    --glow: 0 0 60px rgba(124,109,250,0.2);
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Mono', monospace;
    padding: 0 0 80px;
    position: relative;
    overflow-x: hidden;
  }

  .qrgen-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 40% at 20% 10%, rgba(124,109,250,0.08) 0%, transparent 60%),
      radial-gradient(ellipse 50% 30% at 80% 80%, rgba(250,109,159,0.06) 0%, transparent 60%);
    pointer-events: none;
    z-index: 0;
  }

  .qrgen-wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 1; }

  .qrgen-header { padding: 52px 0 40px; text-align: center; }
  .qrgen-logo {
    font-family: 'Syne', sans-serif; font-weight: 800;
    font-size: clamp(2rem, 5vw, 3.5rem); letter-spacing: -1.5px; line-height: 1;
    background: linear-gradient(135deg, var(--accent), var(--accentB));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .qrgen-sub { color: var(--muted); font-size: 0.75rem; letter-spacing: 3px; text-transform: uppercase; margin-top: 10px; }

  .live-badge {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 6px 16px; border-radius: 100px; margin-bottom: 20px;
    background: rgba(124,109,250,0.08); border: 1px solid rgba(124,109,250,0.2);
    font-size: 0.7rem; color: var(--accent); letter-spacing: 1.5px; text-transform: uppercase;
  }
  .live-dot { width:6px;height:6px;border-radius:50%;background:var(--accent);animation:livepulse 2s infinite; }
  @keyframes livepulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }

  /* Back button */
  .back-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: 50px;
    border: 1px solid var(--border); background: var(--surf);
    color: var(--muted); font-family: 'DM Mono', monospace; font-size: 0.75rem;
    cursor: pointer; text-decoration: none; transition: all 0.2s; margin-bottom: 32px;
  }
  .back-btn:hover { border-color: var(--accent); color: var(--accent); }

  .qrgen-grid { display: grid; grid-template-columns: 1fr 380px; gap: 24px; align-items: start; }
  @media(max-width:860px){ .qrgen-grid{grid-template-columns:1fr;} }

  .sec-title {
    font-family: 'Syne', sans-serif; font-weight: 700;
    font-size: 0.7rem; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 16px;
  }

  .cat-label {
    font-size: 0.62rem; text-transform: uppercase; letter-spacing: 2px;
    color: var(--muted); margin: 24px 0 10px; padding-left: 4px;
  }
  .cat-label:first-child { margin-top: 0; }

  .models-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }

  .model-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 14px; padding: 20px 16px; text-align: center; cursor: pointer;
    transition: all 0.22s cubic-bezier(.4,0,.2,1); position: relative; overflow: hidden;
  }
  .model-card::before {
    content: ''; position: absolute; inset: 0; opacity: 0;
    background: linear-gradient(135deg, rgba(124,109,250,0.12), rgba(250,109,159,0.08));
    transition: opacity 0.22s;
  }
  .model-card:hover { border-color: rgba(124,109,250,0.4); transform: translateY(-3px); box-shadow: var(--glow); }
  .model-card:hover::before { opacity: 1; }
  .model-card.active { border-color: var(--accent); background: rgba(124,109,250,0.08); }
  .model-card.active::before { opacity: 1; }
  .model-card .m-icon { font-size: 32px; margin-bottom: 10px; display: block; }
  .model-card .m-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.82rem; color: var(--text); }
  .model-card .m-file { font-size: 0.6rem; color: var(--muted); margin-top: 4px; letter-spacing: 0.5px; }
  .model-card.active .m-name { color: var(--accent); }
  .check-badge {
    position: absolute; top: 10px; right: 10px;
    width: 20px; height: 20px; border-radius: 50%;
    background: var(--accent); display: flex; align-items: center; justify-content: center;
    font-size: 10px; opacity: 0; transform: scale(0); transition: all 0.2s;
  }
  .model-card.active .check-badge { opacity: 1; transform: scale(1); }

  .right-panel { display: flex; flex-direction: column; gap: 20px; position: sticky; top: 24px; }

  .panel { background: var(--card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
  .panel-head {
    padding: 16px 20px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 10px;
  }
  .panel-icon {
    width: 30px; height: 30px; border-radius: 8px;
    background: linear-gradient(135deg, var(--accent), var(--accentB));
    display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;
  }
  .panel-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.9rem; }
  .panel-body { padding: 20px; }

  .qr-box {
    display: flex; flex-direction: column; align-items: center;
    background: var(--surf); border-radius: 12px; padding: 24px;
    border: 1px solid var(--border); gap: 16px; margin-bottom: 16px;
  }
  .qr-canvas-wrap {
    background: #fff; border-radius: 10px; padding: 10px;
    box-shadow: 0 0 40px rgba(124,109,250,0.3); transition: box-shadow 0.3s;
  }
  .qr-canvas-wrap:hover { box-shadow: 0 0 60px rgba(124,109,250,0.5); }
  .qr-info { text-align: center; }
  .qr-info .qi-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1rem; margin-bottom: 4px; }
  .qr-info .qi-hint { font-size: 0.68rem; color: var(--muted); line-height: 1.7; }

  .empty-qr {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 40px 20px; gap: 12px;
    background: var(--surf); border-radius: 12px;
    border: 2px dashed var(--border); margin-bottom: 16px;
  }
  .empty-qr .eq-icon { font-size: 40px; opacity: 0.25; }
  .empty-qr .eq-text { font-size: 0.72rem; color: var(--muted); text-align: center; line-height: 1.7; }

  .btn-primary {
    width: 100%; padding: 14px; border: none; border-radius: 10px;
    background: linear-gradient(135deg, var(--accent), var(--accentB));
    color: #fff; font-family: 'Syne', sans-serif; font-weight: 800;
    font-size: 0.9rem; letter-spacing: 0.5px; cursor: pointer;
    transition: all 0.2s; text-transform: uppercase; margin-bottom: 10px;
  }
  .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: var(--glow); }
  .btn-primary:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }

  .btn-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .btn-sec {
    padding: 11px; border-radius: 8px; border: 1px solid var(--border);
    background: var(--surf); color: var(--text); font-family: 'DM Mono', monospace;
    font-size: 0.72rem; cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .btn-sec:hover { border-color: var(--accent); color: var(--accent); }

  .url-display {
    background: var(--bg); border: 1px solid var(--border);
    border-radius: 8px; padding: 10px 14px;
    font-size: 0.65rem; color: var(--muted); word-break: break-all; line-height: 1.6;
  }
  .url-label { color: var(--accent); font-size: 0.6rem; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; display: block; }

  .batch-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .batch-item {
    background: var(--surf); border: 1px solid var(--border);
    border-radius: 10px; padding: 12px 8px; text-align: center; cursor: pointer; transition: all 0.2s;
  }
  .batch-item:hover { border-color: var(--accent); }
  .batch-item .bi-icon { font-size: 20px; margin-bottom: 6px; }
  .batch-item .bi-name { font-size: 0.6rem; color: var(--muted); }

  .toast {
    position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%) translateY(80px);
    background: var(--card); border: 1px solid var(--accent);
    padding: 12px 24px; border-radius: 50px; font-size: 0.78rem;
    color: var(--accent); box-shadow: var(--glow);
    transition: transform 0.3s cubic-bezier(.4,0,.2,1); z-index: 999;
  }
  .toast.show { transform: translateX(-50%) translateY(0); }
`;

export default function QrGenerator() {
  const [selected, setSelected] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [toast, setToast] = useState("");
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
        width: 220,
        margin: 2,
        color: { dark: "#0f1018", light: "#ffffff" },
        errorCorrectionLevel: "H",
      });
      setQrDataUrl(dataUrl);
      setSelected({ ...model, arUrl: url });
    } catch (e) {
      console.error(e);
    }
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
    showToast("✅ Tous les QR codes téléchargés !");
  }

  const categories = [...new Set(AR_MODELS.map(m => m.category))];

  return (
    <div className="qrgen-root">
      <div className="qrgen-wrap">

        <div className="qrgen-header">
          <div><span className="live-badge"><span className="live-dot" />AR SYSTEM — glamtec-ar.vercel.app</span></div>
          <div className="qrgen-logo">QR·AR GENERATOR</div>
          <div className="qrgen-sub">Scannez → Modèle 3D sur surface réelle</div>
        </div>

        {/* Back to home */}
        <a href="/" className="back-btn">← Retour à l'accueil</a>

        <div className="qrgen-grid">

          {/* LEFT */}
          <div>
            <div className="sec-title">↗ Sélectionner un modèle</div>

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

            {/* Batch */}
            <div style={{ marginTop: 32 }}>
              <div className="sec-title">⬇ Téléchargement groupé</div>
              <div className="panel">
                <div className="panel-body">
                  <p style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.7, marginBottom: 16 }}>
                    Téléchargez tous les QR codes en une fois pour impression ou partage.
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

          {/* RIGHT */}
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
                      <div className="qr-info">
                        <div className="qi-name">{selected.label}</div>
                        <div className="qi-hint">
                          Scanner avec l'appareil photo<br />
                          <span style={{ color: "var(--accent)" }}>iOS Safari · Android Chrome</span>
                        </div>
                      </div>
                    </div>

                    <div className="url-display">
                      <span className="url-label">URL encodée dans le QR</span>
                      {selected.arUrl}
                    </div>

                    <div style={{ height: 14 }} />
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

            {/* Steps */}
            <div className="panel">
              <div className="panel-head">
                <div className="panel-icon">◎</div>
                <div className="panel-title">Comment ça marche</div>
              </div>
              <div className="panel-body">
                {[
                  ["1", "Sélectionner", "Choisissez un modèle dans la liste"],
                  ["2", "QR Généré", "Le QR pointe vers glamtec-ar.vercel.app"],
                  ["3", "Scanner", "L'utilisateur scanne avec son téléphone"],
                  ["4", "Voir en AR", "Le modèle 3D s'affiche sur une surface réelle"],
                ].map(([n, t, d]) => (
                  <div key={n} style={{ display: "flex", gap: 14, marginBottom: 16 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: "linear-gradient(135deg,rgba(124,109,250,.2),rgba(250,109,159,.2))",
                      border: "1px solid rgba(124,109,250,.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "0.8rem", color: "var(--accent)"
                    }}>{n}</div>
                    <div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "0.82rem", marginBottom: 2 }}>{t}</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--muted)", lineHeight: 1.6 }}>{d}</div>
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