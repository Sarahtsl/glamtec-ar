import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import TryOnPage from "./pages/TryOnPage";
import TryOnBodyPage from "./pages/TryOnBodyPage";
import QrGenerator from "./pages/Qrgenerator";

function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8faff", fontFamily: "Georgia, serif", color: "#0f172a", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { width: 100%; overflow-x: hidden; }

        .nav-a { color: #475569; text-decoration: none; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500; transition: color 0.2s; }
        .nav-a:hover { color: #1e3a8a; }

        .btn-blue {
          display: inline-flex; align-items: center; gap: 9px;
          background: #1e3a8a; color: #fff;
          padding: 15px 32px; border-radius: 50px;
          text-decoration: none; font-family: 'DM Sans', sans-serif;
          font-weight: 600; font-size: 15px; border: none; cursor: pointer;
          box-shadow: 0 8px 32px rgba(30,58,138,0.25);
          transition: all 0.25s;
        }
        .btn-blue:hover { background: #1e40af; transform: translateY(-2px); box-shadow: 0 12px 40px rgba(30,58,138,0.35); }

        .btn-outline {
          display: inline-flex; align-items: center; gap: 9px;
          background: #fff; color: #1e3a8a;
          padding: 15px 32px; border-radius: 50px;
          text-decoration: none; font-family: 'DM Sans', sans-serif;
          font-weight: 600; font-size: 15px;
          border: 2px solid #1e3a8a; cursor: pointer;
          transition: all 0.25s;
        }
        .btn-outline:hover { background: #eef2ff; transform: translateY(-2px); }

        .tag {
          display: inline-flex; align-items: center; gap: 8px;
          background: #eef2ff; color: #1e3a8a;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.15em; text-transform: uppercase;
          padding: 6px 16px; border-radius: 50px;
          border: 1px solid #c7d2fe;
        }

        .card {
          background: #fff; border: 1px solid #e2e8f0;
          border-radius: 24px; overflow: hidden;
          transition: all 0.3s; box-shadow: 0 4px 24px rgba(0,0,0,0.06);
        }
        .card:hover { transform: translateY(-6px); box-shadow: 0 20px 60px rgba(30,58,138,0.12); border-color: #bfdbfe; }

        .step-card {
          background: #fff; border: 1px solid #e2e8f0;
          border-radius: 20px; padding: 32px 28px;
          transition: all 0.3s;
        }
        .step-card:hover { box-shadow: 0 12px 40px rgba(30,58,138,0.1); transform: translateY(-4px); border-color: #bfdbfe; }

        .dot { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; display: inline-block; animation: blink 2s ease-in-out infinite; }
        @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0.4;} }

        @keyframes float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-14px);} }
        @keyframes spin1 { to{transform:rotate(360deg);} }
        @keyframes spin2 { to{transform:rotate(-360deg);} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px);} to{opacity:1;transform:translateY(0);} }

        .float { animation: float 5s ease-in-out infinite; }
        .f1 { animation: fadeUp 0.7s ease both; }
        .f2 { animation: fadeUp 0.7s 0.12s ease both; }
        .f3 { animation: fadeUp 0.7s 0.24s ease both; }
        .f4 { animation: fadeUp 0.7s 0.36s ease both; }

        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .two-col { grid-template-columns: 1fr !important; }
          .three-col { grid-template-columns: 1fr !important; }
          .hero-illus { display: none !important; }
          .nav-links { display: none !important; }
        }
      `}</style>

      {/* ══ NAVBAR ══ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid #e2e8f0",
        padding: "0 60px", height: 68,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 1px 12px rgba(0,0,0,0.06)",
      }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 900, color: "#1e3a8a", letterSpacing: "-0.02em" }}>
          GlamTec
        </div>
        <div className="nav-links" style={{ display: "flex", gap: 40 }}>
          {["Accueil","Produits","Blog","Contact"].map(l => (
            <a key={l} href="#" className="nav-a">{l}</a>
          ))}
        </div>
        <Link to="/try" className="btn-blue" style={{ padding: "10px 24px", fontSize: 13 }}>Essayer AR</Link>
      </nav>

      {/* ══ HERO ══ */}
      <div style={{
        paddingTop: 68,
        background: "linear-gradient(160deg, #f0f4ff 0%, #ffffff 50%, #f8faff 100%)",
        borderBottom: "1px solid #e2e8f0",
      }}>
        <div className="hero-grid" style={{
          maxWidth: 1280, margin: "0 auto",
          padding: "90px 60px 80px",
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 80, alignItems: "center",
        }}>
          {/* Texte */}
          <div>
            <div className="tag f1" style={{ marginBottom: 28 }}>
              <span className="dot"></span>
              Réalité Augmentée · Nouveau
            </div>

            <h1 className="f2" style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(42px, 4.5vw, 70px)",
              fontWeight: 900, lineHeight: 1.06,
              color: "#0f172a", marginBottom: 24,
              letterSpacing: "-0.03em",
            }}>
              Essayez avant<br/>
              <span style={{ color: "#1e3a8a" }}>d'acheter.</span>
            </h1>

            <p className="f3" style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 17, lineHeight: 1.75,
              color: "#64748b", maxWidth: 460, marginBottom: 40,
              fontWeight: 400,
            }}>
              Testez lunettes et vêtements en réalité augmentée —
              directement depuis votre navigateur, sans télécharger d'application.
            </p>

            <div className="f4" style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 56 }}>
              <Link to="/try" className="btn-blue">👓 Essayer des lunettes</Link>
              <Link to="/try-body" className="btn-outline">👕 Essayer un t-shirt</Link>
            </div>

            {/* Stats */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 32,
              paddingTop: 32, borderTop: "1px solid #e2e8f0",
            }}>
              {[
                { num: "468", label: "Points visage" },
                { num: "<16ms", label: "Latence" },
                { num: "100%", label: "Navigateur" },
              ].map(({ num, label }) => (
                <div key={label}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 900, color: "#1e3a8a" }}>{num}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Illustration */}
          <div className="hero-illus" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="float" style={{ position: "relative", width: 400, height: 400 }}>
              <div style={{ position: "absolute", inset: -28, border: "1.5px dashed #bfdbfe", borderRadius: "50%", animation: "spin1 22s linear infinite" }}/>
              <div style={{ position: "absolute", inset: -60, border: "1px dashed #dbeafe", borderRadius: "50%", animation: "spin2 32s linear infinite" }}/>
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "radial-gradient(circle at 40% 35%, #dbeafe 0%, #eff6ff 60%, #f8faff 100%)",
                boxShadow: "0 20px 80px rgba(30,58,138,0.12)",
              }}/>
              {/* Lunettes */}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 220 80" style={{ width: 300, filter: "drop-shadow(0 8px 32px rgba(30,58,138,0.2))" }}>
                  <rect x="4" y="16" width="86" height="48" rx="24" fill="#1e3a8a" opacity="0.92"/>
                  <rect x="130" y="16" width="86" height="48" rx="24" fill="#1e3a8a" opacity="0.92"/>
                  <rect x="10" y="22" width="74" height="36" rx="18" fill="#60a5fa" opacity="0.25"/>
                  <rect x="136" y="22" width="74" height="36" rx="18" fill="#60a5fa" opacity="0.25"/>
                  <path d="M90 40 Q110 26 130 40" stroke="#1e3a8a" strokeWidth="5" fill="none" strokeLinecap="round"/>
                  <line x1="4" y1="40" x2="-22" y2="34" stroke="#1e3a8a" strokeWidth="5" strokeLinecap="round"/>
                  <line x1="216" y1="40" x2="242" y2="34" stroke="#1e3a8a" strokeWidth="5" strokeLinecap="round"/>
                </svg>
              </div>
              {/* Badges */}
              <div style={{
                position: "absolute", top: 28, right: 0,
                background: "#1e3a8a", color: "#fff",
                fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700,
                padding: "5px 14px", borderRadius: 20, letterSpacing: "0.1em",
                boxShadow: "0 4px 16px rgba(30,58,138,0.3)",
              }}>AR LIVE</div>
              <div style={{
                position: "absolute", bottom: 44, left: 0,
                background: "#fff", color: "#1e3a8a",
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
                padding: "6px 16px", borderRadius: 20,
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                border: "1px solid #e0e7ff",
              }}>✓ Face Tracking actif</div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ PRODUITS ══ */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div className="tag" style={{ marginBottom: 18 }}><span className="dot"></span>Nos Technologies</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px,3vw,46px)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Deux façons d'essayer
          </h2>
        </div>

        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

          {/* Card Lunettes */}
          <div className="card">
            <div style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", padding: "44px 36px 36px", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 52, marginBottom: 18 }}>👓</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Lunettes AR</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#64748b", lineHeight: 1.75, marginBottom: 24 }}>
                Face tracking MediaPipe — 468 points de repère pour placer les lunettes parfaitement sur votre visage en temps réel.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["Face Tracking","468 points","Temps réel","Couleurs"].map(t => (
                  <span key={t} style={{ background: "#dbeafe", color: "#1e40af", fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20 }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ padding: "24px 36px" }}>
              <Link to="/try" className="btn-blue" style={{ width: "100%", justifyContent: "center" }}>Essayer maintenant →</Link>
            </div>
          </div>

          {/* Card T-shirt */}
          <div className="card">
            <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", padding: "44px 36px 36px", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 52, marginBottom: 18 }}>👕</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Vêtements AR</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#64748b", lineHeight: 1.75, marginBottom: 24 }}>
                Scannez le QR code — le vêtement s'affiche en 3D via la caméra de votre téléphone, posé sur une surface réelle.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["QR Code","WebXR","Mobile AR","3D Viewer"].map(t => (
                  <span key={t} style={{ background: "#dcfce7", color: "#15803d", fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20 }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ padding: "24px 36px", display: "flex", gap: 12 }}>
              <Link to="/try-body" className="btn-outline" style={{ flex: 1, justifyContent: "center" }}>Viewer 3D</Link>
              <Link to="/qr-generator" style={{
                flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: "#16a34a", color: "#fff", borderRadius: 50,
                textDecoration: "none", fontFamily: "'DM Sans',sans-serif",
                fontWeight: 600, fontSize: 14,
                boxShadow: "0 4px 20px rgba(22,163,74,0.25)",
                transition: "all 0.2s",
              }}>📲 QR Codes</Link>
            </div>
          </div>
        </div>
      </div>

      {/* ══ COMMENT ÇA MARCHE ══ */}
      <div style={{ background: "#fff", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", padding: "80px 60px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div className="tag" style={{ marginBottom: 18 }}><span className="dot"></span>Simple et rapide</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px,3vw,46px)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" }}>
              Comment ça marche ?
            </h2>
          </div>
          <div className="three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { n:"01", icon:"🔍", title:"Choisissez", desc:"Parcourez lunettes et vêtements disponibles en AR.", color:"#1e3a8a", bg:"#eff6ff" },
              { n:"02", icon:"📷", title:"Activez",    desc:"Autorisez la caméra — tout reste dans le navigateur.", color:"#0369a1", bg:"#e0f2fe" },
              { n:"03", icon:"✨", title:"Essayez",    desc:"Visualisez le produit sur vous en temps réel.", color:"#0f766e", bg:"#f0fdfa" },
            ].map(({ n, icon, title, desc, color, bg }) => (
              <div key={n} className="step-card" style={{ position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -8, right: 12, fontSize: 80, fontWeight: 900, opacity: 0.05, color: "#000", fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>{n}</div>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 20 }}>{icon}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color, fontFamily: "'DM Sans',sans-serif", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Étape {n}</div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>{title}</h3>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ FOOTER ══ */}
      <footer style={{
        padding: "32px 60px",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20,
        background: "#f8faff", borderTop: "1px solid #e2e8f0",
      }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 900, color: "#1e3a8a" }}>GlamTec</div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#94a3b8", marginTop: 3 }}>© 2025 · PFE Webcom Casablanca</div>
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          {[{to:"/try",l:"AR Lunettes"},{to:"/try-body",l:"AR Vêtements"},{to:"/qr-generator",l:"QR Codes"}].map(({to,l}) => (
            <Link key={to} to={to} style={{ color: "#94a3b8", textDecoration: "none", fontFamily: "'DM Sans',sans-serif", fontSize: 13, transition: "color 0.2s" }}
              onMouseEnter={e=>e.target.style.color="#1e3a8a"} onMouseLeave={e=>e.target.style.color="#94a3b8"}>{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"             element={<Home />} />
        <Route path="/try"          element={<TryOnPage />} />
        <Route path="/try-body"     element={<TryOnBodyPage />} />
        <Route path="/qr-generator" element={<QrGenerator />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;