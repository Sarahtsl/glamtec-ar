import multer from 'multer';
import fetch from 'node-fetch';
import { uploadToSupabase, saveModelToDB } from '../Api/supabaseClient.js';

const upload = multer({ storage: multer.memoryStorage() });
const TRIPO_BASE = 'https://api.tripo3d.ai/v2/openapi';

export const generateModel = [
  upload.single('image'),
  async (req, res) => {
    try {
      const imageBuffer = req.file.buffer;
      const imageMime   = req.file.mimetype;
      const modelName   = req.body.name || 'model_' + Date.now();

      // ── 1. Upload image vers Tripo ──────────────────────────────
      console.log('📤 Upload image vers Tripo...');
      const formData = new FormData();
      formData.append('file', new Blob([imageBuffer], { type: imageMime }), req.file.originalname);

      const uploadRes  = await fetch(`${TRIPO_BASE}/upload/sts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.TRIPO_API_KEY}` },
        body: formData,
      });
      const uploadRaw  = await uploadRes.text();
      console.log('📥 Upload status:', uploadRes.status);
      console.log('📥 Upload body:', uploadRaw);

      const uploadData = JSON.parse(uploadRaw);
      if (!uploadData.data?.image_token) throw new Error('Upload failed: ' + uploadRaw);
      const imageToken = uploadData.data.image_token;

      // ── 2. Créer la tâche image_to_model ───────────────────────
      console.log('🧊 Création tâche Tripo...');
      const ext = imageMime.split('/')[1]; // jpeg, png, webp
      const taskRes  = await fetch(`${TRIPO_BASE}/task`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.TRIPO_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'image_to_model',
          file: { type: ext, file_token: imageToken },
        }),
      });
      const taskRaw  = await taskRes.text();
      console.log('📥 Task status:', taskRes.status);
      console.log('📥 Task body:', taskRaw);

      const taskData = JSON.parse(taskRaw);
      if (!taskData.data?.task_id) throw new Error('Task failed: ' + taskRaw);
      const taskId = taskData.data.task_id;
      console.log('✅ Task ID:', taskId);

      // ── 3. Polling ─────────────────────────────────────────────
      console.log('⏳ Polling...');
      const glbUrl = await pollTripoTask(taskId);

      // ── 4. Télécharger le GLB ──────────────────────────────────
      console.log('⬇️  Téléchargement GLB...');
      const glbBuffer = await fetch(glbUrl).then(r => r.arrayBuffer());

      // ── 5. Upload vers Supabase ────────────────────────────────
      console.log('☁️  Upload Supabase...');
      const fileName = `${modelName}_${Date.now()}`;
      const glbPath  = await uploadToSupabase(Buffer.from(glbBuffer), `${fileName}.glb`, 'models');

      // ── 6. Sauvegarder en DB ───────────────────────────────────
      const record = await saveModelToDB({
        name:     modelName,
        glb_url:  glbPath,
        usdz_url: null,
        task_id:  taskId,
      });

      console.log('🎉 Modèle prêt:', record.id);
      res.json({ success: true, model: record });

    } catch (err) {
      console.error('❌ Erreur:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }
];

async function pollTripoTask(taskId) {
  for (let i = 0; i < 60; i++) {
    await sleep(3000);
    const res  = await fetch(`${TRIPO_BASE}/task/${taskId}`, {
      headers: { Authorization: `Bearer ${process.env.TRIPO_API_KEY}` },
    });
    const data = await res.json();
    const status = data.data?.status;
    console.log(`  → Tentative ${i + 1}: ${status}`);

    if (status === 'success') {
      const url = data.data?.output?.pbr_model || data.data?.output?.model;
      if (!url) throw new Error('Pas de GLB dans la réponse');
      return url;
    }
    if (status === 'failed' || status === 'cancelled') {
      throw new Error('Tripo task ' + status);
    }
  }
  throw new Error('Timeout');
}

const sleep = ms => new Promise(r => setTimeout(r, ms));