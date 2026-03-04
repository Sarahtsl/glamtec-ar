import express from 'express';
import multer from 'multer';
import fs from 'fs';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Client, handle_file } from '@gradio/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/generate-3d', upload.single('image'), async (req, res) => {
  try {
    console.log('📥 Fichier reçu:', req.file);
    if (!req.file) return res.status(400).json({ error: 'Pas d\'image' });

    console.log('🔌 Connexion au Space TRELLIS...');
    const client = await Client.connect("trellis-community/TRELLIS");

    // Utiliser handle_file pour uploader correctement
    const imageFile = handle_file(req.file.path);
    console.log('📤 Fichier préparé:', imageFile);

    // Step 1 — Préprocesser l'image
    console.log('🖼️ Préprocessing image...');
    const preprocessResult = await client.predict("/preprocess_image", {
      image: imageFile,
    });

    console.log('✅ Preprocess:', JSON.stringify(preprocessResult?.data).substring(0, 200));
    const processedImage = preprocessResult?.data?.[0];
    if (!processedImage) throw new Error('Preprocess échoué');

  // Step 2 — Générer le modèle 3D + GLB
console.log('🤖 Génération 3D en cours...');
console.log('🖼️ Image processée:', JSON.stringify(processedImage));

const result = await client.predict("/generate_and_extract_glb", {
  image: {
    path: processedImage.path,
    url: processedImage.url,
    orig_name: "image.png",
    meta: { _type: "gradio.FileData" }
  },
  multiimages: [],
  seed: 0,
  ss_guidance_strength: 7.5,
  ss_sampling_steps: 12,
  slat_guidance_strength: 3,
  slat_sampling_steps: 12,
  multiimage_algo: "stochastic",
  mesh_simplify: 0.95,
  texture_size: 1024,
});
    console.log('✅ Résultat:', JSON.stringify(result?.data).substring(0, 300));

    const glbFile = result?.data?.[2];
    const glbUrl = glbFile?.url || glbFile?.path;
    if (!glbUrl) throw new Error('Pas de GLB: ' + JSON.stringify(result?.data));

    console.log('🔗 GLB URL:', glbUrl);

    // Télécharger le GLB
    const glbRes = await axios.get(glbUrl, {
      responseType: 'arraybuffer',
      timeout: 60000,
    });

    const uploadsDir = join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const fileName = `model_${Date.now()}.glb`;
    fs.writeFileSync(join(uploadsDir, fileName), Buffer.from(glbRes.data));
    fs.unlinkSync(req.file.path);

    const modelUrl = `http://localhost:5000/models/${fileName}`;
    console.log('🔗 URL modèle local:', modelUrl);
    res.json({ modelUrl, message: 'Modèle 3D généré ✅' });

  } catch (err) {
    console.error('❌ Erreur:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;