import { useState, useRef } from 'react';
import QRCode from 'qrcode';
import { generateModelFromImage } from '../services/tripoService';

const STEPS = {
  IDLE:       'idle',
  UPLOADING:  'uploading',
  GENERATING: 'generating',
  DONE:       'done',
  ERROR:      'error',
};

function buildArUrl(glbUrl, usdzUrl, title) {
  let url = `${window.location.origin}/ar-product.html`;
  url += `?model=${encodeURIComponent(glbUrl)}`;
  url += `&title=${encodeURIComponent(title)}`;
  if (usdzUrl) {
    url += `&ios_model=${encodeURIComponent(usdzUrl)}`;
  }
  return url;
}

export default function TripoUpload() {
  const [step, setStep]           = useState(STEPS.IDLE);
  const [preview, setPreview]     = useState(null);
  const [modelName, setModelName] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [arUrl, setArUrl]         = useState(null);
  const [error, setError]         = useState(null);
  const [progress, setProgress]   = useState('');
  const fileRef = useRef();

  function onFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setStep(STEPS.IDLE);
    setQrDataUrl(null);
  }

  async function handleGenerate() {
    const file = fileRef.current.files[0];
    if (!file) return;
    const name = modelName.trim() || 'Modèle AR';

    try {
      setStep(STEPS.UPLOADING);
      setProgress('Envoi de l\'image vers Tripo AI...');

      const model = await generateModelFromImage(file, name);

      setProgress('Génération du QR code...');
      setStep(STEPS.GENERATING);

      const url = buildArUrl(model.glb_url, model.usdz_url, name);
      const qr  = await QRCode.toDataURL(url, {
        width: 260, margin: 2,
        color: { dark: '#5b4bff', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });

      setArUrl(url);
      setQrDataUrl(qr);
      setStep(STEPS.DONE);

    } catch (err) {
      setError(err.message);
      setStep(STEPS.ERROR);
    }
  }

  function downloadQR() {
    const a = document.createElement('a');
    a.download = `ar-qr-${modelName || 'model'}.png`;
    a.href = qrDataUrl;
    a.click();
  }

  function reset() {
    setStep(STEPS.IDLE);
    setPreview(null);
    setQrDataUrl(null);
    setArUrl(null);
    setError(null);
    setModelName('');
    fileRef.current.value = '';
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --accent: #5b4bff;
          --accentB: #7c6dfa;
          --accentLight: #ede9ff;
          --accentBorder: #ccc5ff;
          --bg: #f5f5f7;
          --surface: #ffffff;
          --text: #0a0a14;
          --textSub: #6b6b80;
          --border: #e4e4ec;
          --shadow: 0 2px 16px rgba(0,0,0,0.06);
          --shadowMd: 0 8px 40px rgba(91,75,255,0.10);
          --radius: 14px;
        }
        .tu-page { min-height: 100vh; background: var(--bg); font-family: 'Manrope', sans-serif; color: var(--text); -webkit-font-smoothing: antialiased; }

        /* NAV */
        .tu-nav { height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; background: rgba(255,255,255,0.88); border-bottom: 1px solid var(--border); backdrop-filter: blur(20px); position: sticky; top: 0; z-index: 10; }
        .tu-logo { font-family: 'Manrope', sans-serif; font-size: 20px; font-weight: 900; color: var(--text); text-decoration: none; letter-spacing: -0.5px; }
        .tu-logo span { color: var(--accent); }

        /* HERO */
        .tu-hero { background: var(--surface); border-bottom: 1px solid var(--border); padding: 48px 48px 40px; }
        .tu-eyebrow { display: inline-flex; align-items: center; gap: 8px; background: var(--accentLight); border: 1px solid var(--accentBorder); border-radius: 100px; padding: 5px 14px; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); margin-bottom: 20px; }
        .tu-h1 { font-size: clamp(26px, 3vw, 40px); font-weight: 900; color: var(--text); letter-spacing: -1px; line-height: 1.15; }
        .tu-h1 em { font-style: normal; color: var(--accent); }

        /* MAIN GRID */
        .tu-main { max-width: 880px; margin: 0 auto; padding: 40px 48px 80px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        @media(max-width: 700px) {
          .tu-main { grid-template-columns: 1fr; padding: 24px 20px; }
          .tu-nav { padding: 0 20px; }
          .tu-hero { padding: 36px 20px 32px; }
        }

        /* CARDS */
        .tu-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); }
        .tu-card-head { padding: 14px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; background: var(--bg); }
        .tu-card-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); }
        .tu-card-title { font-size: 13px; font-weight: 800; color: var(--text); letter-spacing: -0.2px; }
        .tu-card-body { padding: 20px; }

        /* DROP ZONE */
        .tu-drop { border: 2px dashed var(--border); border-radius: 10px; padding: 36px 20px; text-align: center; cursor: pointer; transition: all 0.2s; margin-bottom: 16px; background: var(--bg); display: block; width: 100%; }
        .tu-drop:hover { border-color: var(--accent); background: var(--accentLight); }
        .tu-drop-icon { font-size: 30px; margin-bottom: 10px; }
        .tu-drop-text { font-size: 13px; color: var(--textSub); line-height: 1.7; font-weight: 500; }

        /* PREVIEW */
        .tu-preview { width: 100%; border-radius: 8px; object-fit: cover; max-height: 200px; margin-bottom: 16px; border: 1px solid var(--border); }

        /* FORM */
        .tu-label { font-size: 11px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text); margin-bottom: 6px; display: block; }
        .tu-input { width: 100%; padding: 10px 14px; border: 1.5px solid var(--border); border-radius: 8px; font-family: 'Manrope', sans-serif; font-size: 14px; font-weight: 500; color: var(--text); background: var(--surface); margin-bottom: 16px; outline: none; transition: border-color 0.2s; }
        .tu-input:focus { border-color: var(--accent); }
        .tu-input::placeholder { color: var(--textSub); }

        /* BUTTONS */
        .tu-btn { width: 100%; padding: 13px; background: var(--accent); color: #fff; border: none; border-radius: 100px; font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(91,75,255,0.28); }
        .tu-btn:hover:not(:disabled) { background: var(--accentB); transform: translateY(-1px); box-shadow: 0 6px 28px rgba(91,75,255,0.38); }
        .tu-btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
        .tu-btn-sec { width: 100%; padding: 11px; background: transparent; border: 1.5px solid var(--border); border-radius: 100px; font-family: 'Manrope', sans-serif; font-size: 13px; font-weight: 700; color: var(--text); cursor: pointer; margin-top: 8px; transition: all 0.2s; }
        .tu-btn-sec:hover { border-color: var(--accent); color: var(--accent); background: var(--accentLight); }

        /* PROGRESS */
        .tu-progress { background: var(--accentLight); border: 1px solid var(--accentBorder); border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 16px; }
        .tu-spinner { width: 34px; height: 34px; border: 3px solid rgba(91,75,255,0.15); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.9s linear infinite; margin: 0 auto 12px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .tu-progress-text { font-size: 13px; color: var(--accent); font-weight: 600; line-height: 1.7; }

        /* QR BOX */
        .tu-qr-box { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 24px; background: var(--bg); border-radius: 10px; border: 1px solid var(--border); margin-bottom: 16px; }
        .tu-qr-frame { background: #fff; border-radius: 10px; padding: 10px; border: 1px solid var(--border); box-shadow: var(--shadowMd); }
        .tu-qr-name { font-size: 18px; font-weight: 900; color: var(--text); letter-spacing: -0.4px; }
        .tu-qr-hint { font-size: 11px; color: var(--textSub); font-weight: 500; text-align: center; }
        .tu-tags { display: flex; gap: 8px; }
        .tu-tag { padding: 4px 11px; border-radius: 100px; font-size: 10px; font-weight: 800; letter-spacing: 0.05em; }
        .tu-tag-ios { background: #e6faf3; border: 1px solid #a3e6cc; color: #1a9b64; }
        .tu-tag-and { background: #e6f4ff; border: 1px solid #a3d0f5; color: #1a72b8; }

        /* ERROR */
        .tu-error { background: #fff1f1; border: 1px solid #fecaca; border-radius: 8px; padding: 14px 16px; color: #b91c1c; font-size: 13px; font-weight: 500; line-height: 1.7; margin-bottom: 16px; }

        /* URL */
        .tu-url { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; }
        .tu-url-label { font-size: 9px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: var(--accent); margin-bottom: 4px; }
        .tu-url-val { font-size: 10px; color: var(--textSub); word-break: break-all; font-family: monospace; }

        /* EMPTY */
        .tu-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 16px; gap: 12px; background: var(--bg); border-radius: 10px; border: 1.5px dashed var(--border); }
        .tu-empty-icon { font-size: 28px; opacity: 0.25; }
        .tu-empty-text { font-size: 12px; color: var(--textSub); text-align: center; line-height: 1.8; font-weight: 500; }
      `}</style>

      <div className="tu-page">

        <nav className="tu-nav">
          <a href="/" className="tu-logo">Glam<span>Tec</span></a>
        </nav>

        <div className="tu-hero">
          <div className="tu-eyebrow">✦ Image vers 3D · Tripo AI</div>
          <h1 className="tu-h1">Génère un modèle <em>AR</em><br />depuis une photo</h1>
        </div>

        <div className="tu-main">

          {/* LEFT — Upload */}
          <div className="tu-card">
            <div className="tu-card-head">
              <div className="tu-card-dot" />
              <div className="tu-card-title">Votre image</div>
            </div>
            <div className="tu-card-body">

              <div className="tu-drop" onClick={() => fileRef.current.click()}>
                {preview
                  ? <img src={preview} className="tu-preview" alt="preview" />
                  : <>
                      <div className="tu-drop-icon">📷</div>
                      <div className="tu-drop-text">
                        Cliquez pour choisir une image<br />
                        <span style={{fontSize:11}}>JPG, PNG, WEBP — max 10MB</span>
                      </div>
                    </>
                }
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                style={{display:'none'}}
              />

              <label className="tu-label" htmlFor="mname">Nom du modèle</label>
              <input
                id="mname"
                className="tu-input"
                placeholder="ex: Chaise Design"
                value={modelName}
                onChange={e => setModelName(e.target.value)}
              />

              {step === STEPS.UPLOADING || step === STEPS.GENERATING ? (
                <div className="tu-progress">
                  <div className="tu-spinner" />
                  <div className="tu-progress-text">{progress}<br /><span style={{fontSize:11, fontWeight:500}}>Cela peut prendre 30 à 90 secondes…</span></div>
                </div>
              ) : (
                <button
                  className="tu-btn"
                  onClick={handleGenerate}
                  disabled={!preview || step === STEPS.DONE}
                >
                  {step === STEPS.DONE ? '✓ Modèle généré' : '✦ Générer le modèle AR'}
                </button>
              )}

              {step === STEPS.DONE && (
                <button className="tu-btn-sec" onClick={reset}>↺ Recommencer</button>
              )}

            </div>
          </div>

          {/* RIGHT — Résultat */}
          <div className="tu-card">
            <div className="tu-card-head">
              <div className="tu-card-dot" />
              <div className="tu-card-title">QR Code AR</div>
            </div>
            <div className="tu-card-body">

              {step === STEPS.ERROR && (
                <div className="tu-error">⚠ {error}</div>
              )}

              {step === STEPS.DONE && qrDataUrl ? (
                <>
                  <div className="tu-qr-box">
                    <div className="tu-qr-frame">
                      <img src={qrDataUrl} alt="QR Code AR" width={180} height={180} />
                    </div>
                    <div className="tu-qr-name">{modelName || 'Modèle AR'}</div>
                    <div className="tu-qr-hint">Scanner avec l'appareil photo</div>
                    <div className="tu-tags">
                      <span className="tu-tag tu-tag-ios">✓ iOS</span>
                      <span className="tu-tag tu-tag-and">✓ Android</span>
                    </div>
                  </div>
                  <div className="tu-url">
                    <div className="tu-url-label">URL encodée</div>
                    <div className="tu-url-val">{arUrl}</div>
                  </div>
                  <button className="tu-btn" onClick={downloadQR}>↓ Télécharger le QR code</button>
                  <button className="tu-btn-sec" onClick={() => window.open(arUrl, '_blank')}>↗ Tester le viewer AR</button>
                </>
              ) : (
                <div className="tu-empty">
                  <div className="tu-empty-icon">◈</div>
                  <div className="tu-empty-text">Uploadez une image et lancez<br />la génération pour obtenir<br />votre QR code AR</div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </>
  );
}