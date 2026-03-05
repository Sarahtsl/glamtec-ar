import { useState } from "react";
import QRCode from "qrcode";

// ══════════════════════════════════════════
// Change cette URL vers ton domaine déployé
// Ex: "https://ar.glamtec.ma"
// En dev: "http://localhost:5173"
// ══════════════════════════════════════════
const BASE_URL = "https://glamtec-ar.vercel.app";

const PRODUCTS = [
  // T-Shirts
  { id: "tshirt-basic",     name: "T-Shirt Basic",     model: "male_basic_t_shirt.glb" },
  { id: "tshirt-oversized", name: "Oversized T-Shirt", model: "oversized_t-shirt.glb" },
  { id: "tshirt-2",         name: "T-Shirt Style 2",   model: "t-shirt (2).glb" },
  // Meubles
  { id: "chair",            name: "Chaise",            model: "chair.glb" },
  { id: "cover-chair",      name: "Chaise Couverte",   model: "cover_chair.glb" },
  { id: "table",            name: "Table",             model: "table.glb" },
];

export default function QRGenerator() {
  const [qrImages, setQrImages] = useState({});
  const [generated, setGenerated] = useState(false);

  async function generateAll() {
    const imgs = {};
    for (const p of PRODUCTS) {
      const url = `${BASE_URL}/ar-product.html?product=${p.id}`;
      imgs[p.id] = await QRCode.toDataURL(url, {
        width: 300, margin: 2,
        color: { dark: "#1e3a8a", light: "#ffffff" },
      });
    }
    setQrImages(imgs);
    setGenerated(true);
  }

  function downloadQR(productId, name) {
    const link = document.createElement("a");
    link.href = qrImages[productId];
    link.download = `QR-${name.replace(/\s+/g, "-")}.png`;
    link.click();
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#f8fafc",
      fontFamily: "system-ui, sans-serif", padding: "40px 24px",
    }}>
      {/* Header */}
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{
          fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700,
          color: "#1e3a8a", marginBottom: 6,
        }}>GlamTec</div>
        <div style={{
          fontSize: 13, color: "#94a3b8",
          textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 32,
        }}>Générateur de QR Codes AR</div>

        {/* Bouton générer */}
        <button onClick={generateAll} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "13px 28px", marginBottom: 36,
          background: "#1e3a8a", color: "#fff",
          border: "none", borderRadius: 50,
          fontSize: 14, fontWeight: 700, cursor: "pointer",
          boxShadow: "0 4px 16px rgba(30,58,138,0.3)",
          transition: "all 0.2s",
        }}>
          ⚡ Générer tous les QR Codes
        </button>

        {/* Grille QR */}
        {generated && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 20,
          }}>
            {PRODUCTS.map(p => (
              <div key={p.id} style={{
                background: "#fff", borderRadius: 16,
                padding: "20px", textAlign: "center",
                boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
                border: "1px solid #e2e8f0",
              }}>
                {/* QR Code */}
                <img src={qrImages[p.id]} alt={p.name}
                  style={{ width: 160, height: 160, borderRadius: 8, marginBottom: 12 }}
                />

                {/* Nom produit */}
                <div style={{
                  fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4,
                }}>{p.name}</div>

                {/* URL */}
                <div style={{
                  fontSize: 10, color: "#94a3b8", marginBottom: 14,
                  wordBreak: "break-all",
                }}>
                  {BASE_URL}/ar-product.html?product={p.id}
                </div>

                {/* Boutons */}
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <button onClick={() => downloadQR(p.id, p.name)} style={{
                    padding: "7px 16px",
                    background: "#1e3a8a", color: "#fff",
                    border: "none", borderRadius: 50,
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}>
                    ⬇ Télécharger
                  </button>
                  <a href={`${BASE_URL}/ar-product.html?product=${p.id}`}
                    target="_blank" rel="noreferrer"
                    style={{
                      padding: "7px 16px",
                      background: "#f1f5f9", color: "#1e3a8a",
                      border: "1.5px solid #e2e8f0", borderRadius: 50,
                      fontSize: 12, fontWeight: 700, textDecoration: "none",
                    }}>
                    🔗 Tester
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div style={{
          marginTop: 40, background: "#eef2ff",
          borderRadius: 14, padding: "20px 24px",
          border: "1px solid #c7d2fe",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e3a8a", marginBottom: 10 }}>
            📋 Comment utiliser
          </div>
          <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.8 }}>
            1. Clique <b>Générer</b> pour créer les QR codes<br/>
            2. <b>Télécharge</b> chaque QR et colle-le sur la page produit Deavito<br/>
            3. Le client scanne avec son téléphone<br/>
            4. La page AR s'ouvre → pointe vers le sol → voit le t-shirt en 3D<br/>
            5. Change l'URL <code>BASE_URL</code> quand tu déploies en production
          </div>
        </div>
      </div>
    </div>
  );
}