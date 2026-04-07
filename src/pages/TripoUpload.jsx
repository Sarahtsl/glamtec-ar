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

// ✅ CORRIGÉ — on passe maintenant glb_url ET usdz_url
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

      // ✅ On utilise glb_url ET usdz_url retournés par l'API
      const url = buildArUrl(model.glb_url, model.usdz_url, name);
      const qr  = await QRCode.toDataURL(url, {
        width: 260, margin: 2,
        color: { dark: '#0f2557', light: '#ffffff' },
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
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --navy: #0f2557; --navy-mid: #1e3a8a; --gold: #c9a84c; --gold-light: #e8c97e;
          --cream: #faf8f5; --white: #ffffff; --text: #0f172a; --muted: #64748b;
          --border: #e2e8f0; --shadow: 0 4px 24px rgba(15,37,87,0.08);
        }
        .tu-page { min-height: 100vh; background: var(--cream); font-family: 'DM Sans', sans-serif; color: var(--text); }
        .tu-nav { height: 68px; display: flex; align-items: center; justify-content: space-between; padding: 0 64px; background: rgba(255,255,255,0.97); border-bottom: 1px solid var(--border); }
        .tu-logo { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 700; color: var(--navy); text-decoration: none; }
        .tu-hero { background: var(--navy); padding: 52px 64px; }
        .tu-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); margin-bottom: 14px; display: flex; align-items: center; gap: 10px; }
        .tu-eyebrow::before { content: ''; width: 28px; height: 1px; background: var(--gold); }
        .tu-h1 { font-family: 'Cormorant Garamond', serif; font-size: clamp(30px, 3vw, 46px); font-weight: 600; color: #fff; }
        .tu-h1 em { font-style: italic; color: var(--gold-light); }
        .tu-main { max-width: 900px; margin: 0 auto; padding: 48px 64px 80px; display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
        @media(max-width: 700px) { .tu-main { grid-template-columns: 1fr; padding: 28px 20px; } .tu-nav { padding: 0 20px; } .tu-hero { padding: 40px 20px; } }

        .tu-card { background: var(--white); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; box-shadow: var(--shadow); }
        .tu-card-head { padding: 14px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; }
        .tu-card-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--navy); }
        .tu-card-title { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 700; color: var(--navy); }
        .tu-card-body { padding: 20px; }

        .tu-drop { border: 2px dashed var(--border); border-radius: 10px; padding: 36px 20px; text-align: center; cursor: pointer; transition: all 0.2s; margin-bottom: 16px; background: var(--cream); position: relative; display: block; width: 100%; }
        .tu-drop:hover { border-color: var(--navy); background: #f0f4ff; }
        .tu-drop-icon { font-size: 32px; margin-bottom: 10px; }
        .tu-drop-text { font-size: 13px; color: var(--muted); line-height: 1.7; }
        .tu-drop input { display: none; }

        .tu-preview { width: 100%; border-radius: 8px; object-fit: cover; max-height: 200px; margin-bottom: 16px; border: 1px solid var(--border); }

        .tu-label { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--navy); margin-bottom: 6px; display: block; }
        .tu-input { width: 100%; padding: 10px 14px; border: 1.5px solid var(--border); border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--text); background: var(--white); margin-bottom: 16px; outline: none; transition: border-color 0.2s; }
        .tu-input:focus { border-color: var(--navy); }

        .tu-btn { width: 100%; padding: 14px; background: var(--navy); color: #fff; border: none; border-radius: 7px; font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s; }
        .tu-btn:hover:not(:disabled) { background: var(--navy-mid); transform: translateY(-1px); }
        .tu-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .tu-btn-sec { width: 100%; padding: 11px; background: transparent; border: 1.5px solid var(--border); border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--navy); cursor: pointer; margin-top: 8px; transition: all 0.2s; }
        .tu-btn-sec:hover { border-color: var(--navy); background: var(--cream); }

        .tu-progress { background: var(--cream); border: 1px solid var(--border); border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 16px; }
        .tu-spinner { width: 36px; height: 36px; border: 3px solid rgba(15,37,87,0.12); border-top-color: var(--navy); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 12px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .tu-progress-text { font-size: 13px; color: var(--muted); line-height: 1.7; }

        .tu-qr-box { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 24px; background: var(--cream); border-radius: 8px; border: 1px solid var(--border); margin-bottom: 16px; }
        .tu-qr-frame { background: #fff; border-radius: 8px; padding: 10px; border: 1px solid var(--border); }
        .tu-qr-name { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 700; color: var(--navy); }
        .tu-qr-hint { font-size: 11px; color: var(--muted); text-align: center; }
        .tu-tags { display: flex; gap: 8px; }
        .tu-tag { padding: 3px 10px; border-radius: 4px; font-size: 10px; font-weight: 600; }
        .tu-tag-ios { background: rgba(22,163,74,0.07); border: 1px solid rgba(22,163,74,0.18); color: #15803d; }
        .tu-tag-and { background: rgba(37,99,235,0.07); border: 1px solid rgba(37,99,235,0.18); color: #1d4ed8; }

        .tu-error { background: #fff1f1; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; color: #b91c1c; font-size: 13px; line-height: 1.7; margin-bottom: 16px; }
        .tu-url { background: var(--cream); border: 1px solid var(--border); border-radius: 6px; padding: 9px 12px; margin-bottom: 12px; }
        .tu-url-label { font-size: 9px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: var(--navy); margin-bottom: 3px; }
        .tu-url-val { font-size: 10px; color: var(--muted); word-break: break-all; font-family: monospace; }

        .tu-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 16px; gap: 12px; background: var(--cream); border-radius: 8px; border: 1.5px dashed var(--border); }
        .tu-empty-icon { font-size: 28px; opacity: 0.2; }
        .tu-empty-text { font-size: 12px; color: var(--muted); text-align: center; line-height: 1.7; }
      `}</style>

      <div className="tu-page">

        <nav className="tu-nav">
          <a href="/" className="tu-logo">GlamTec</a>
        </nav>

        <div className="tu-hero">
          <div className="tu-eyebrow">Image vers 3D · Tripo AI</div>
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

              <div
                className="tu-drop"
                onClick={() => fileRef.current.click()}
              >
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
                  <div className="tu-progress-text">{progress}<br /><span style={{fontSize:11}}>Cela peut prendre 30 à 90 secondes…</span></div>
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