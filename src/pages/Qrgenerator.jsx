import { useState } from "react";
import QRCode from "qrcode";
import { Link } from "react-router-dom";

const AR_MODELS = [
  { id: "chair",            file: "chair.glb",                                 label: "Chaise",             icon: "🪑", category: "Chaises" },
  { id: "cover_chair",      file: "cover_chair.glb",                            label: "Housse de Chaise",   icon: "🪑", category: "Chaises" },
  { id: "gothic_chair",     file: "gothic_chair.glb",                           label: "Chaise Gothique",    icon: "🪑", category: "Chaises" },
  { id: "office_chair",     file: "office_chair.glb",                           label: "Chaise de Bureau",   icon: "🪑", category: "Chaises" },
  { id: "table",            file: "table.glb",                                  label: "Table",              icon: "🪵", category: "Tables" },
  { id: "antique_table",    file: "antique_table.glb",                          label: "Table Antique",      icon: "🪵", category: "Tables" },
  { id: "folding_table",    file: "folding_table.glb",                          label: "Table Pliante",      icon: "🪵", category: "Tables" },
  { id: "industrial_table", file: "industrial_table.glb",                       label: "Table Industrielle", icon: "🪵", category: "Tables" },
  { id: "mahogany_table",   file: "mahogany_table.glb",                         label: "Table Acajou",       icon: "🪵", category: "Tables" },
  { id: "victorian_table",  file: "victorian_table.glb",                        label: "Table Victorienne",  icon: "🪵", category: "Tables" },
  { id: "wooden_table",     file: "wooden_table._practical_model_-_yadira.glb", label: "Table en Bois",      icon: "🪵", category: "Tables" },
  { id: "makeup_dresser",   file: "makeup_dresser_white.glb",                   label: "Coiffeuse Blanche",  icon: "🪞", category: "Mobilier" },
  { id: "makeup_table",     file: "makeup_table--low_poly.glb",                 label: "Table Maquillage",   icon: "🪞", category: "Mobilier" },
  { id: "male_tshirt",      file: "male_basic_t_shirt.glb",                     label: "T-Shirt Basique",    icon: "👕", category: "Vêtements" },
  { id: "oversized_tshirt", file: "oversized_t-shirt.glb",                      label: "T-Shirt Oversize",   icon: "👕", category: "Vêtements" },
  { id: "tshirt",           file: "t_shirt.glb",                                label: "T-Shirt",            icon: "👕", category: "Vêtements" },
];

function buildArUrl(file, label) {
  return `${window.location.origin}/ar-product.html?model=${encodeURIComponent(file)}&title=${encodeURIComponent(label)}`;
}

export default function QrGenerator() {
  const [selected, setSelected]           = useState(null);
  const [qrDataUrl, setQrDataUrl]         = useState(null);
  const [toast, setToast]                 = useState("");
  const [toastVisible, setToastVisible]   = useState(false);

  function showToast(msg) {
    setToast(msg); setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }

  async function generateQR(model) {
    const url = buildArUrl(model.file, model.label);
    const dataUrl = await QRCode.toDataURL(url, {
      width: 240, margin: 2,
      color: { dark: "#0f2557", light: "#ffffff" },
      errorCorrectionLevel: "H",
    });
    setQrDataUrl(dataUrl);
    setSelected({ ...model, arUrl: url });
  }

  function downloadQR() {
    if (!qrDataUrl || !selected) return;
    const a = document.createElement("a");
    a.download = `ar-qr-${selected.id}.png`;
    a.href = qrDataUrl; a.click();
    showToast("QR Code téléchargé");
  }

  function copyUrl() {
    if (!selected) return;
    navigator.clipboard.writeText(selected.arUrl);
    showToast("URL copiée");
  }

  async function downloadAll() {
    showToast("Génération en cours…");
    for (const model of AR_MODELS) {
      const url = buildArUrl(model.file, model.label);
      const dataUrl = await QRCode.toDataURL(url, {
        width: 240, margin: 2,
        color: { dark: "#0f2557", light: "#ffffff" },
        errorCorrectionLevel: "H",
      });
      const a = document.createElement("a");
      a.download = `ar-qr-${model.id}.png`;
      a.href = dataUrl; a.click();
      await new Promise(r => setTimeout(r, 280));
    }
    showToast(`${AR_MODELS.length} QR codes téléchargés`);
  }

  const categories = [...new Set(AR_MODELS.map(m => m.category))];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        :root {
          --navy:#0f2557; --navy-mid:#1e3a8a; --navy-light:#3b5fc0;
          --gold:#c9a84c; --gold-light:#e8c97e;
          --cream:#faf8f5; --white:#ffffff;
          --text:#0f172a; --muted:#64748b; --border:#e2e8f0;
          --shadow:0 4px 24px rgba(15,37,87,0.08);
          --shadow-lg:0 16px 48px rgba(15,37,87,0.14);
        }
        html, body, #root { width:100%; margin:0; padding:0; }
        .qp { min-height:100vh; width:100%; background:var(--cream); font-family:'DM Sans',sans-serif; color:var(--text); overflow-x:hidden; }

        /* Nav */
        .qp-nav { position:sticky;top:0;z-index:50; width:100%; height:68px; display:flex;align-items:center;justify-content:space-between; padding:0 64px; background:rgba(255,255,255,0.97); backdrop-filter:blur(20px); border-bottom:1px solid var(--border); }
        .qp-logo { font-family:'Cormorant Garamond',serif; font-size:24px; font-weight:700; color:var(--navy); text-decoration:none; }
        .qp-back { display:flex;align-items:center;gap:7px; color:var(--muted); text-decoration:none; font-size:13px; font-weight:500; transition:color 0.2s; }
        .qp-back:hover { color:var(--navy); }

        /* Hero */
        .qp-hero { background:var(--navy); width:100%; padding:60px 64px 52px; position:relative; overflow:hidden; }
        .qp-hero::before { content:''; position:absolute; top:-60px;right:-60px; width:260px;height:260px; border:1px solid rgba(255,255,255,0.05); border-radius:50%; }
        .qp-hero::after  { content:''; position:absolute; bottom:-80px;right:140px; width:180px;height:180px; border:1px solid rgba(201,168,76,0.08); border-radius:50%; }
        .qp-hero-inner { max-width:1200px; margin:0 auto; position:relative; z-index:1; }
        .qp-eyebrow { display:inline-flex;align-items:center;gap:10px; font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase; color:var(--gold); margin-bottom:18px; }
        .qp-eyebrow::before { content:''; width:28px;height:1px;background:var(--gold); }
        .qp-h1 { font-family:'Cormorant Garamond',serif; font-size:clamp(34px,3.5vw,52px); font-weight:600; color:#fff; letter-spacing:-0.02em; line-height:1.08; }
        .qp-h1 em { font-style:italic; color:var(--gold-light); }
        .qp-hero-meta { display:flex;align-items:center;gap:14px; margin-top:18px; flex-wrap:wrap; }
        .qp-badge { display:inline-flex;align-items:center;gap:6px; padding:4px 12px; border-radius:4px; font-size:10px;font-weight:600;letter-spacing:0.08em; }
        .qp-badge-ios     { background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.2);color:#4ade80; }
        .qp-badge-android { background:rgba(96,165,250,0.1);border:1px solid rgba(96,165,250,0.2);color:#60a5fa; }
        .qp-bdot { width:5px;height:5px;border-radius:50%;background:currentColor;animation:bdot 2s infinite; }
        @keyframes bdot { 0%,100%{opacity:1} 50%{opacity:.3} }

        /* Layout */
        .qp-main { max-width:1200px; margin:0 auto; padding:48px 64px 80px; display:grid; grid-template-columns:1fr 352px; gap:32px; align-items:start; }
        @media(max-width:900px){ .qp-main{grid-template-columns:1fr;padding:28px 20px 60px;} .qp-nav{padding:0 20px;} .qp-hero{padding:44px 20px 36px;} }

        /* Section label */
        .qp-sec-label { font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase; color:var(--muted); display:flex;align-items:center;gap:10px; margin-bottom:20px; }
        .qp-sec-label::after { content:'';flex:1;height:1px;background:var(--border); }

        /* Category */
        .qp-cat { font-family:'Cormorant Garamond',serif; font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase; color:var(--navy-light); margin:28px 0 10px; }
        .qp-cat:first-child { margin-top:0; }

        /* Model cards */
        .qp-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(144px,1fr)); gap:10px; }
        .qp-card { background:var(--white); border:1.5px solid var(--border); border-radius:10px; padding:18px 12px 14px; text-align:center; cursor:pointer; position:relative; transition:all 0.2s cubic-bezier(.4,0,.2,1); }
        .qp-card:hover { border-color:var(--navy-mid); transform:translateY(-2px); box-shadow:var(--shadow); }
        .qp-card.on { border-color:var(--navy); background:#eef2ff; box-shadow:var(--shadow); }
        .qp-card-icon { font-size:26px; margin-bottom:9px; display:block; }
        .qp-card-name { font-family:'Cormorant Garamond',serif; font-size:15px; font-weight:700; color:var(--navy); line-height:1.2; }
        .qp-card-file { font-size:9px; color:var(--muted); margin-top:3px; word-break:break-all; }
        .qp-card.on .qp-card-name { color:var(--navy-mid); }
        .qp-tick { position:absolute;top:8px;right:8px; width:17px;height:17px;border-radius:50%; background:var(--navy);color:#fff; display:flex;align-items:center;justify-content:center; font-size:8px;font-weight:700; opacity:0;transform:scale(0);transition:all 0.18s; }
        .qp-card.on .qp-tick { opacity:1;transform:scale(1); }

        /* Right */
        .qp-right { display:flex;flex-direction:column;gap:14px; position:sticky;top:84px; }

        /* Panel */
        .qp-panel { background:var(--white); border:1px solid var(--border); border-radius:12px; overflow:hidden; box-shadow:var(--shadow); }
        .qp-panel-head { padding:14px 18px; border-bottom:1px solid var(--border); display:flex;align-items:center;gap:10px; }
        .qp-panel-dot { width:7px;height:7px;border-radius:50%;background:var(--navy); }
        .qp-panel-title { font-family:'Cormorant Garamond',serif; font-size:16px;font-weight:700; color:var(--navy); }
        .qp-panel-body { padding:18px; }

        /* QR box */
        .qp-qr-box { display:flex;flex-direction:column;align-items:center; gap:14px; padding:22px; background:var(--cream); border-radius:8px; border:1px solid var(--border); margin-bottom:14px; }
        .qp-qr-frame { background:#fff; border-radius:8px; padding:10px; border:1px solid var(--border); box-shadow:0 8px 28px rgba(15,37,87,0.1); }
        .qp-qr-frame img { display:block; border-radius:4px; }
        .qp-qr-name { font-family:'Cormorant Garamond',serif; font-size:19px;font-weight:700; color:var(--navy); text-align:center; }
        .qp-qr-hint { font-size:11px;color:var(--muted);text-align:center;line-height:1.7; }
        .qp-qr-tags { display:flex;gap:8px;justify-content:center; }
        .qp-tag { padding:3px 10px; border-radius:4px; font-size:10px;font-weight:600; }
        .qp-tag-ios     { background:rgba(22,163,74,0.07);border:1px solid rgba(22,163,74,0.18);color:#15803d; }
        .qp-tag-android { background:rgba(37,99,235,0.07);border:1px solid rgba(37,99,235,0.18);color:#1d4ed8; }

        /* Empty */
        .qp-empty { display:flex;flex-direction:column;align-items:center;justify-content:center; padding:36px 16px;gap:12px; background:var(--cream); border-radius:8px; border:1.5px dashed var(--border); margin-bottom:14px; }
        .qp-empty-icon { font-size:32px;opacity:0.18; }
        .qp-empty-text { font-size:12px;color:var(--muted);text-align:center;line-height:1.7; }

        /* URL */
        .qp-url { background:var(--cream);border:1px solid var(--border);border-radius:6px;padding:9px 12px;margin-bottom:12px; }
        .qp-url-label { font-size:9px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:var(--navy-light);margin-bottom:3px; }
        .qp-url-val { font-size:10px;color:var(--muted);word-break:break-all;line-height:1.6;font-family:monospace; }

        /* Buttons */
        .qp-btn-main { width:100%;padding:13px;background:var(--navy);color:#fff;border:none;border-radius:7px; font-family:'DM Sans',sans-serif;font-weight:600;font-size:13px;letter-spacing:0.03em; cursor:pointer;transition:all 0.2s;margin-bottom:8px; }
        .qp-btn-main:hover { background:var(--navy-mid);transform:translateY(-1px);box-shadow:0 8px 20px rgba(15,37,87,0.18); }
        .qp-btn-row { display:grid;grid-template-columns:1fr 1fr;gap:8px; }
        .qp-btn-sec { padding:10px;background:#fff;border:1.5px solid var(--border);border-radius:7px; font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;color:var(--navy); cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:5px; }
        .qp-btn-sec:hover { border-color:var(--navy);background:var(--cream); }

        /* All download */
        .qp-all { background:var(--navy);border-radius:12px;padding:22px;margin-top:28px; }
        .qp-all-title { font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:700;color:#fff;margin-bottom:6px; }
        .qp-all-sub { font-size:12px;color:rgba(255,255,255,0.4);line-height:1.7;margin-bottom:18px; }
        .qp-all-btn { width:100%;padding:12px;background:var(--gold);color:var(--navy);border:none;border-radius:7px; font-family:'DM Sans',sans-serif;font-weight:700;font-size:13px;letter-spacing:0.03em; cursor:pointer;transition:all 0.2s; }
        .qp-all-btn:hover { background:var(--gold-light);transform:translateY(-1px); }
        .qp-all-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:12px; }
        .qp-all-item { background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:6px; padding:9px 4px;text-align:center;cursor:pointer;transition:all 0.2s; }
        .qp-all-item:hover { background:rgba(255,255,255,0.1); }
        .qp-all-item-icon { font-size:14px;margin-bottom:3px; }
        .qp-all-item-name { font-size:8px;color:rgba(255,255,255,0.4);line-height:1.3; }

        /* Compat */
        .qp-compat { background:var(--white);border:1px solid var(--border);border-radius:12px;overflow:hidden; }
        .qp-compat-row { display:flex;gap:12px;padding:14px 18px;border-bottom:1px solid var(--border);align-items:flex-start; }
        .qp-compat-row:last-child { border-bottom:none; }
        .qp-compat-emoji { font-size:18px;flex-shrink:0;margin-top:1px; }
        .qp-compat-title { font-family:'Cormorant Garamond',serif;font-size:15px;font-weight:700;color:var(--navy);margin-bottom:2px; }
        .qp-compat-detail { font-size:11px;color:var(--muted);line-height:1.7; }

        /* Toast */
        .qp-toast { position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(60px); background:var(--navy);color:#fff;padding:11px 22px;border-radius:6px; font-size:13px;font-weight:500;letter-spacing:0.02em; box-shadow:var(--shadow-lg);transition:transform 0.3s cubic-bezier(.4,0,.2,1);z-index:999;white-space:nowrap; }
        .qp-toast.on { transform:translateX(-50%) translateY(0); }
      `}</style>

      <div className="qp">

        {/* Navbar */}
        <nav className="qp-nav">
          <Link to="/" className="qp-logo">GlamTec</Link>
          <Link to="/" className="qp-back">
            ← Retour à l'accueil
          </Link>
        </nav>

        {/* Hero */}
        <div className="qp-hero">
          <div className="qp-hero-inner">
            <div className="qp-eyebrow">QR Code · Réalité Augmentée</div>
            <h1 className="qp-h1">Générez vos QR codes <em>AR</em></h1>
            <div className="qp-hero-meta">
              <span className="qp-badge qp-badge-ios"><span className="qp-bdot" />iOS QuickLook</span>
              <span className="qp-badge qp-badge-android"><span className="qp-bdot" />Android AR</span>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.28)", letterSpacing:"0.05em" }}>{AR_MODELS.length} modèles</span>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="qp-main">

          {/* LEFT */}
          <div>
            <div className="qp-sec-label">Sélectionner un modèle</div>

            {categories.map(cat => (
              <div key={cat}>
                <div className="qp-cat">{cat}</div>
                <div className="qp-grid">
                  {AR_MODELS.filter(m => m.category === cat).map(model => (
                    <div
                      key={model.id}
                      className={`qp-card ${selected?.id === model.id ? "on" : ""}`}
                      onClick={() => generateQR(model)}
                    >
                      <div className="qp-tick">✓</div>
                      <span className="qp-card-icon">{model.icon}</span>
                      <div className="qp-card-name">{model.label}</div>
                      <div className="qp-card-file">{model.file}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* All download */}
            <div className="qp-all">
              <div className="qp-all-title">Tout télécharger</div>
              <div className="qp-all-sub">Générez les {AR_MODELS.length} QR codes en une seule fois.</div>
              <button className="qp-all-btn" onClick={downloadAll}>↓ Télécharger tous ({AR_MODELS.length})</button>
              <div className="qp-all-grid">
                {AR_MODELS.map(m => (
                  <div key={m.id} className="qp-all-item" onClick={() => generateQR(m)}>
                    <div className="qp-all-item-icon">{m.icon}</div>
                    <div className="qp-all-item-name">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="qp-right">

            {/* QR panel */}
            <div className="qp-panel">
              <div className="qp-panel-head">
                <div className="qp-panel-dot" />
                <div className="qp-panel-title">QR Code AR</div>
              </div>
              <div className="qp-panel-body">
                {qrDataUrl && selected ? (
                  <>
                    <div className="qp-qr-box">
                      <div className="qp-qr-frame">
                        <img src={qrDataUrl} alt="QR" width={174} height={174} />
                      </div>
                      <div className="qp-qr-name">{selected.label}</div>
                      <div className="qp-qr-hint">Scanner avec l'appareil photo</div>
                      <div className="qp-qr-tags">
                        <span className="qp-tag qp-tag-ios">✓ iOS</span>
                        <span className="qp-tag qp-tag-android">✓ Android</span>
                      </div>
                    </div>
                    <div className="qp-url">
                      <div className="qp-url-label">URL encodée</div>
                      <div className="qp-url-val">{selected.arUrl}</div>
                    </div>
                    <button className="qp-btn-main" onClick={downloadQR}>↓ Télécharger PNG</button>
                    <div className="qp-btn-row">
                      <button className="qp-btn-sec" onClick={copyUrl}>⎘ Copier URL</button>
                      <button className="qp-btn-sec" onClick={() => window.open(selected.arUrl, "_blank")}>↗ Tester</button>
                    </div>
                  </>
                ) : (
                  <div className="qp-empty">
                    <div className="qp-empty-icon">◈</div>
                    <div className="qp-empty-text">Sélectionnez un modèle<br />pour générer son QR Code</div>
                  </div>
                )}
              </div>
            </div>

            {/* Compat */}
            <div className="qp-compat">
              <div className="qp-compat-row">
                <div className="qp-compat-emoji">🍎</div>
                <div>
                  <div className="qp-compat-title">iOS — QuickLook</div>
                  <div className="qp-compat-detail">iPhone 12+ · iOS 14+ · Safari</div>
                </div>
              </div>
              <div className="qp-compat-row">
                <div className="qp-compat-emoji">🤖</div>
                <div>
                  <div className="qp-compat-title">Android — Scene Viewer</div>
                  <div className="qp-compat-detail">Chrome 79+ · ARCore installé</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className={`qp-toast ${toastVisible ? "on" : ""}`}>{toast}</div>
    </>
  );
}