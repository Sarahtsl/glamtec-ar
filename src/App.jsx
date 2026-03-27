import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import TryOnPage from "./pages/TryOnPage";
import TryOnBodyPage from "./pages/TryOnBodyPage";
import QrGenerator from "./pages/QrGenerator"; 
import FaceFilterPage from "./pages/FaceFilterPage"; 

/* ══════════════════════════════════════════════
   HOME PAGE
══════════════════════════════════════════════ */
function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "#faf8f5", fontFamily: "'DM Sans', sans-serif", color: "#0f172a", overflowX: "hidden", width: "100%" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; overflow-x: hidden; }

        :root {
          --navy:      #0f2557;
          --navy-mid:  #1e3a8a;
          --gold:      #c9a84c;
          --gold-lt:   #e8c97e;
          --cream:     #faf8f5;
          --border:    #e2e8f0;
          --muted:     #64748b;
          --shadow:    0 4px 32px rgba(15,37,87,0.08);
          --shadow-lg: 0 20px 60px rgba(15,37,87,0.13);
        }

        /* ── Nav ── */
        .g-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100; width: 100%;
          height: 68px; display: flex; align-items: center; justify-content: space-between;
          padding: 0 64px;
          background: rgba(250,248,245,0.95); backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }
        .g-logo { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 700; color: var(--navy); letter-spacing: -0.02em; text-decoration: none; }
        .g-nav-links { display: flex; gap: 44px; }
        .g-nav-a { color: var(--muted); text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; letter-spacing: 0.01em; }
        .g-nav-a:hover { color: var(--navy); }
        .g-nav-cta { padding: 10px 24px; background: var(--navy); color: #fff; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; transition: all 0.2s; }
        .g-nav-cta:hover { background: var(--navy-mid); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(15,37,87,0.2); }

        /* ── Hero ── */
        .g-hero { width: 100%; display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; padding-top: 68px; }

        .g-hero-left {
          display: flex; flex-direction: column; justify-content: center;
          padding: 80px 72px 80px 64px;
          background: var(--cream);
        }
        .g-hero-right {
          position: relative; background: var(--navy);
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .g-hero-right::before {
          content: ''; position: absolute;
          top: -100px; right: -100px; width: 400px; height: 400px;
          border: 1px solid rgba(255,255,255,0.05); border-radius: 50%;
        }
        .g-hero-right::after {
          content: ''; position: absolute;
          bottom: -80px; left: -60px; width: 300px; height: 300px;
          border: 1px solid rgba(201,168,76,0.08); border-radius: 50%;
        }

        /* Eyebrow */
        .g-eyebrow {
          display: inline-flex; align-items: center; gap: 12px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--gold); margin-bottom: 28px;
        }
        .g-eyebrow::before { content: ''; width: 36px; height: 1px; background: var(--gold); }

        /* Heading */
        .g-h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(48px, 4.8vw, 76px);
          font-weight: 600; line-height: 1.04;
          letter-spacing: -0.03em; color: var(--navy); margin-bottom: 24px;
        }
        .g-h1 em { font-style: italic; color: var(--navy-mid); }

        .g-hero-p {
          font-size: 16px; line-height: 1.85; color: var(--muted);
          max-width: 420px; margin-bottom: 48px; font-weight: 400;
        }

        /* CTA buttons */
        .g-btn-group { display: flex; gap: 12px; flex-wrap: wrap; }
        .g-btn-primary {
          padding: 14px 32px; background: var(--navy); color: #fff;
          border-radius: 6px; text-decoration: none; font-weight: 600;
          font-size: 14px; letter-spacing: 0.03em; border: 2px solid var(--navy);
          transition: all 0.22s; display: inline-flex; align-items: center; gap: 8px;
        }
        .g-btn-primary:hover { background: var(--navy-mid); border-color: var(--navy-mid); transform: translateY(-2px); box-shadow: var(--shadow-lg); }
        .g-btn-ghost {
          padding: 14px 32px; background: transparent; color: var(--navy);
          border-radius: 6px; text-decoration: none; font-weight: 600;
          font-size: 14px; letter-spacing: 0.03em; border: 2px solid var(--navy);
          transition: all 0.22s; display: inline-flex; align-items: center; gap: 8px;
        }
        .g-btn-ghost:hover { background: var(--navy); color: #fff; transform: translateY(-2px); }

        /* Stats */
        .g-stats { display: flex; gap: 48px; margin-top: 56px; padding-top: 48px; border-top: 1px solid var(--border); }
        .g-stat-n { font-family: 'Cormorant Garamond', serif; font-size: 38px; font-weight: 700; color: var(--navy); line-height: 1; }
        .g-stat-l { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.14em; margin-top: 6px; }

        /* Hero visual */
        .g-visual { position: relative; z-index: 1; padding: 60px; text-align: center; }
        .g-glasses-wrap { position: relative; display: inline-block; }
        .g-ring1 { position: absolute; inset: -52px; border: 1px solid rgba(255,255,255,0.07); border-radius: 50%; animation: gRot1 24s linear infinite; }
        .g-ring2 { position: absolute; inset: -96px; border: 1px solid rgba(201,168,76,0.08); border-radius: 50%; animation: gRot2 38s linear infinite; }
        @keyframes gRot1 { to { transform: rotate(360deg); } }
        @keyframes gRot2 { to { transform: rotate(-360deg); } }
        .g-glasses { animation: gFloat 5s ease-in-out infinite; filter: drop-shadow(0 24px 60px rgba(0,0,0,0.45)); }
        @keyframes gFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }

        .g-badge {
          position: absolute; backdrop-filter: blur(12px);
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px; padding: 10px 16px;
        }
        .g-badge-1 { top: 18%; right: 4%; }
        .g-badge-2 { bottom: 26%; left: 4%; }
        .g-badge-lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(255,255,255,0.4); margin-bottom: 4px; }
        .g-badge-val { font-size: 13px; font-weight: 600; color: #fff; display: flex; align-items: center; gap: 7px; }
        .g-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; animation: gBlink 2s infinite; }
        @keyframes gBlink { 0%,100%{opacity:1} 50%{opacity:.3} }

        /* ── Feature strip ── */
        .g-strip { width: 100%; display: grid; grid-template-columns: repeat(4,1fr); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); background: #fff; }
        .g-strip-item { padding: 32px 28px; text-align: center; border-right: 1px solid var(--border); transition: background 0.2s; cursor: default; }
        .g-strip-item:last-child { border-right: none; }
        .g-strip-item:hover { background: var(--cream); }
        .g-strip-icon { font-size: 26px; margin-bottom: 12px; }
        .g-strip-val { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 700; color: var(--navy); }
        .g-strip-lbl { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.13em; margin-top: 5px; }

        /* ── Section ── */
        .g-section { width: 100%; padding: 100px 64px; }
        .g-section-inner { max-width: 1240px; margin: 0 auto; }
        .g-sec-ey { font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
        .g-sec-ey::before { content: ''; width: 28px; height: 1px; background: var(--gold); }
        .g-sec-h2 { font-family: 'Cormorant Garamond', serif; font-size: clamp(34px, 3vw, 52px); font-weight: 600; letter-spacing: -0.02em; color: var(--navy); line-height: 1.1; }
        .g-sec-h2 em { font-style: italic; }

        /* ── Products ── */
        .g-products { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; margin-top: 52px; border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
        .g-pcard { background: #fff; padding: 52px 48px; transition: all 0.25s; position: relative; overflow: hidden; }
        .g-pcard::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, var(--navy), var(--navy-mid)); transform: scaleX(0); transform-origin: left; transition: transform 0.3s; }
        .g-pcard:hover::after { transform: scaleX(1); }
        .g-pcard:hover { background: var(--cream); }
        .g-pcard + .g-pcard { border-left: 1px solid var(--border); }
        .g-pcard-tag { display: inline-block; padding: 4px 12px; background: rgba(15,37,87,0.06); border-radius: 4px; font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--navy-mid); margin-bottom: 28px; }
        .g-pcard-icon { font-size: 48px; margin-bottom: 24px; display: block; }
        .g-pcard-title { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 700; color: var(--navy); margin-bottom: 14px; letter-spacing: -0.01em; }
        .g-pcard-desc { font-size: 14px; color: var(--muted); line-height: 1.85; margin-bottom: 32px; max-width: 340px; }
        .g-pcard-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 36px; }
        .g-chip { padding: 5px 14px; background: var(--cream); border: 1px solid var(--border); border-radius: 4px; font-size: 11px; font-weight: 500; color: var(--muted); letter-spacing: 0.02em; }
        .g-pcard-btns { display: flex; gap: 10px; flex-wrap: wrap; }
        .g-pbtn-main { padding: 13px 26px; background: var(--navy); color: #fff; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 13px; letter-spacing: 0.03em; transition: all 0.2s; }
        .g-pbtn-main:hover { background: var(--navy-mid); transform: translateY(-1px); }
        .g-pbtn-alt { padding: 13px 22px; background: transparent; color: var(--navy); border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 13px; letter-spacing: 0.03em; border: 1.5px solid var(--border); transition: all 0.2s; }
        .g-pbtn-alt:hover { border-color: var(--navy); background: var(--cream); }
        .g-pbtn-gold { padding: 13px 22px; background: var(--gold); color: var(--navy); border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 13px; letter-spacing: 0.03em; transition: all 0.2s; }
        .g-pbtn-gold:hover { background: var(--gold-lt); transform: translateY(-1px); }

        /* ── Process ── */
        .g-process-bg { width: 100%; background: var(--navy); padding: 100px 64px; }
        .g-process-inner { max-width: 1240px; margin: 0 auto; }
        .g-steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 2px; margin-top: 60px; position: relative; }
        .g-step { padding: 48px 40px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; transition: background 0.2s; }
        .g-step:hover { background: rgba(255,255,255,0.06); }
        .g-step-num { font-family: 'Cormorant Garamond', serif; font-size: 13px; font-weight: 600; letter-spacing: 0.15em; color: var(--gold); text-transform: uppercase; margin-bottom: 20px; }
        .g-step-icon { font-size: 36px; margin-bottom: 20px; display: block; }
        .g-step-title { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 12px; }
        .g-step-desc { font-size: 13px; color: rgba(255,255,255,0.42); line-height: 1.85; }

        /* ── Footer ── */
        .g-footer { width: 100%; background: var(--navy); border-top: 1px solid rgba(255,255,255,0.07); padding: 40px 64px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px; }
        .g-footer-logo { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 700; color: #fff; }
        .g-footer-copy { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 5px; letter-spacing: 0.04em; }
        .g-footer-links { display: flex; gap: 32px; }
        .g-footer-a { color: rgba(255,255,255,0.35); text-decoration: none; font-size: 13px; transition: color 0.2s; }
        .g-footer-a:hover { color: #fff; }

        /* ── Responsive ── */
        @media(max-width:960px) {
          .g-hero { grid-template-columns: 1fr; min-height: auto; }
          .g-hero-right { display: none; }
          .g-hero-left { padding: 56px 28px; }
          .g-nav { padding: 0 28px; }
          .g-nav-links { display: none; }
          .g-stats { gap: 28px; flex-wrap: wrap; }
          .g-strip { grid-template-columns: 1fr 1fr; }
          .g-strip-item:nth-child(2) { border-right: none; }
          .g-strip-item:nth-child(3) { border-top: 1px solid var(--border); }
          .g-section { padding: 60px 28px; }
          .g-products { grid-template-columns: 1fr; }
          .g-pcard + .g-pcard { border-left: none; border-top: 1px solid var(--border); }
          .g-process-bg { padding: 60px 28px; }
          .g-steps { grid-template-columns: 1fr; gap: 12px; }
          .g-footer { padding: 36px 28px; flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav className="g-nav">
        <a href="/" className="g-logo">GlamTec</a>
        <div className="g-nav-links">
          {["Accueil", "Produits", "Blog", "Contact"].map(l => (
            <a key={l} href="#" className="g-nav-a">{l}</a>
          ))}
        </div>
        <Link to="/try" className="g-nav-cta">Essayer AR →</Link>
      </nav>

      {/* ── HERO ── */}
      <section className="g-hero">

        {/* Left — texte */}
        <div className="g-hero-left">
          <div className="g-eyebrow">Réalité Augmentée</div>

          <h1 className="g-h1">
            Essayez<br />avant<br />
            <em>d'acheter.</em>
          </h1>

          <p className="g-hero-p">
            Lunettes, vêtements et meubles en AR — directement depuis votre navigateur, sans application.
          </p>

          <div className="g-btn-group">
            <Link to="/try" className="g-btn-primary">👓 Lunettes AR</Link>
            <Link to="/try-body" className="g-btn-ghost">👕 Vêtements</Link>
          </div>

          <div className="g-stats">
            {[
              { n: "468",   l: "Points visage" },
              { n: "<16ms", l: "Latence"       },
              { n: "100%",  l: "Navigateur"    },
            ].map(({ n, l }) => (
              <div key={l}>
                <div className="g-stat-n">{n}</div>
                <div className="g-stat-l">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — visuel */}
        <div className="g-hero-right">
          <div className="g-visual">
            <div className="g-glasses-wrap">
              <div className="g-ring1" />
              <div className="g-ring2" />
              <svg className="g-glasses" viewBox="0 0 280 100" style={{ width: 340, maxWidth: "90%" }}>
                <defs>
                  <linearGradient id="gG1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e3a8a" />
                    <stop offset="100%" stopColor="#3b5fc0" />
                  </linearGradient>
                  <linearGradient id="gL1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.15" />
                  </linearGradient>
                </defs>
                <rect x="6" y="20" width="108" height="60" rx="30" fill="url(#gG1)" />
                <rect x="166" y="20" width="108" height="60" rx="30" fill="url(#gG1)" />
                <rect x="13" y="27" width="94" height="46" rx="23" fill="url(#gL1)" />
                <rect x="173" y="27" width="94" height="46" rx="23" fill="url(#gL1)" />
                <path d="M114 50 Q140 32 166 50" stroke="url(#gG1)" strokeWidth="7" fill="none" strokeLinecap="round" />
                <line x1="6" y1="50" x2="-30" y2="42" stroke="url(#gG1)" strokeWidth="7" strokeLinecap="round" />
                <line x1="274" y1="50" x2="310" y2="42" stroke="url(#gG1)" strokeWidth="7" strokeLinecap="round" />
                <ellipse cx="38" cy="38" rx="16" ry="9" fill="rgba(255,255,255,0.13)" transform="rotate(-12 38 38)" />
                <ellipse cx="198" cy="38" rx="16" ry="9" fill="rgba(255,255,255,0.13)" transform="rotate(-12 198 38)" />
              </svg>
            </div>

            <div className="g-badge g-badge-1">
              <div className="g-badge-lbl">Statut</div>
              <div className="g-badge-val"><span className="g-live-dot" />AR Actif</div>
            </div>
            <div className="g-badge g-badge-2">
              <div className="g-badge-lbl">Face Tracking</div>
              <div className="g-badge-val">468 pts détectés</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE STRIP ── */}
      <div className="g-strip">
        {[
          { icon: "🎯", val: "Précis",    lbl: "Face tracking MediaPipe"     },
          { icon: "⚡", val: "Rapide",    lbl: "Moins de 16ms de latence"    },
          { icon: "📱", val: "Mobile AR", lbl: "iOS & Android compatibles"   },
          { icon: "🔒", val: "Privé",     lbl: "100% dans votre navigateur"  },
        ].map(({ icon, val, lbl }) => (
          <div key={val} className="g-strip-item">
            <div className="g-strip-icon">{icon}</div>
            <div className="g-strip-val">{val}</div>
            <div className="g-strip-lbl">{lbl}</div>
          </div>
        ))}
      </div>

      {/* ── PRODUITS ── */}
      <div className="g-section" style={{ background: "#fff" }}>
        <div className="g-section-inner">
          <div className="g-sec-ey">Nos technologies</div>
          <h2 className="g-sec-h2">Deux façons <em>d'essayer</em></h2>

          <div className="g-products">

            {/* Lunettes */}
            <div className="g-pcard">
              <span className="g-pcard-tag">Face Tracking</span>
              <span className="g-pcard-icon">👓</span>
              <div className="g-pcard-title">Lunettes AR</div>
              <div className="g-pcard-desc">
                468 points de repère faciaux pour un placement parfait en temps réel, dans votre navigateur.
              </div>
              <div className="g-pcard-chips">
                {["MediaPipe", "Temps réel", "Tous modèles", "Couleurs"].map(t => (
                  <span key={t} className="g-chip">{t}</span>
                ))}
              </div>
              <div className="g-pcard-btns">
                <Link to="/try" className="g-pbtn-main">Essayer maintenant →</Link>
              </div>
            </div>

            {/* Meubles / vêtements */}
            <div className="g-pcard">
              <span className="g-pcard-tag">QR Code · WebXR</span>
              <span className="g-pcard-icon">🪑</span>
              <div className="g-pcard-title">Meubles & Vêtements AR</div>
              <div className="g-pcard-desc">
                Scannez un QR code — le modèle 3D s'affiche sur votre surface via la caméra de votre téléphone.
              </div>
              <div className="g-pcard-chips">
                {["iOS QuickLook", "Android AR", "GLB · USDZ", "3D Viewer"].map(t => (
                  <span key={t} className="g-chip">{t}</span>
                ))}
              </div>
              <div className="g-pcard-btns">
                <Link to="/try-body" className="g-pbtn-main">Viewer 3D →</Link>
                <Link to="/qr-generator" className="g-pbtn-gold">📲 QR Codes</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PROCESS ── */}
      <div className="g-process-bg">
        <div className="g-process-inner">
          <div className="g-sec-ey" style={{ color: "var(--gold)" }}>Simple & rapide</div>
          <h2 className="g-sec-h2" style={{ color: "#fff" }}>
            En <em style={{ color: "var(--gold-lt)" }}>3 étapes</em>
          </h2>

          <div className="g-steps">
            {[
              { n: "Étape 01", icon: "🔍", t: "Choisissez", d: "Parcourez notre catalogue de lunettes, vêtements et mobilier disponibles en AR." },
              { n: "Étape 02", icon: "📷", t: "Activez",    d: "Autorisez la caméra — tout reste en local dans votre navigateur, rien n'est envoyé." },
              { n: "Étape 03", icon: "✨", t: "Visualisez", d: "Le produit s'affiche sur vous ou sur une surface réelle en temps réel." },
            ].map(({ n, icon, t, d }) => (
              <div key={n} className="g-step">
                <div className="g-step-num">{n}</div>
                <span className="g-step-icon">{icon}</span>
                <div className="g-step-title">{t}</div>
                <div className="g-step-desc">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="g-footer">
        <div>
          <div className="g-footer-logo">GlamTec</div>
          <div className="g-footer-copy">© 2025 · PFE Webcom Casablanca</div>
        </div>
        <div className="g-footer-links">
          {[
            { to: "/try",          l: "AR Lunettes"  },
            { to: "/try-body",     l: "AR Vêtements" },
            { to: "/qr-generator", l: "QR Codes"     },
          ].map(({ to, l }) => (
            <Link key={to} to={to} className="g-footer-a">{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}

/* ══════════════════════════════════════════════
   APP
══════════════════════════════════════════════ */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"             element={<Home />} />
        <Route path="/try"          element={<TryOnPage />} /> 
        <Route path="/try-body"     element={<TryOnBodyPage />} />
        <Route path="/qr-generator" element={<QrGenerator />} /> 
         <Route path="/face-filter"  element={<FaceFilterPage />} /> 
      </Routes>
    </BrowserRouter>
  );
}

export default App;