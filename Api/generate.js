import { uploadToSupabase, saveModelToDB } from './supabaseClient.js';

const TRIPO_BASE = 'https://api.tripo3d.ai/v2/openapi';

export const config = { api: { bodyParser: false } };

async function parseMultipart(req) {
  const { default: formidable } = await import('formidable');
  return new Promise((resolve, reject) => {
    const form = formidable({ maxFileSize: 10 * 1024 * 1024 });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fields, files } = await parseMultipart(req);
    const imageFile  = Array.isArray(files.image) ? files.image[0] : files.image;
    const modelName  = (Array.isArray(fields.name) ? fields.name[0] : fields.name) || 'model_' + Date.now();

    const fs = await import('fs');
    const imageBuffer = fs.readFileSync(imageFile.filepath);
    const imageMime   = imageFile.mimetype;

    // ── 1. Upload image vers Tripo ──────────────────────────────
    const formData = new FormData();
    formData.append('file', new Blob([imageBuffer], { type: imageMime }), imageFile.originalFilename);

    const uploadRes  = await fetch(`${TRIPO_BASE}/upload/sts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.TRIPO_API_KEY}` },
      body: formData,
    });
    const uploadData = await uploadRes.json();
    if (!uploadData.data?.image_token) throw new Error('Upload failed: ' + JSON.stringify(uploadData));
    const imageToken = uploadData.data.image_token;

    // ── 2. Créer la tâche ───────────────────────────────────────
    const ext     = imageMime.split('/')[1];
    const taskRes = await fetch(`${TRIPO_BASE}/task`, {
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
    const taskData = await taskRes.json();
    if (!taskData.data?.task_id) throw new Error('Task failed: ' + JSON.stringify(taskData));
    const taskId = taskData.data.task_id;

    // ── 3. Polling ─────────────────────────────────────────────
    const glbUrl = await pollTripoTask(taskId);

    // ── 4. Télécharger + uploader le GLB ───────────────────────
    const glbBuffer = await fetch(glbUrl).then(r => r.arrayBuffer());
    const fileName  = `${modelName}_${Date.now()}`;
    const glbPath   = await uploadToSupabase(Buffer.from(glbBuffer), `${fileName}.glb`, 'models');

    // ── 5. Sauvegarder en DB ───────────────────────────────────
    const record = await saveModelToDB({
      name:     modelName,
      glb_url:  glbPath,
      usdz_url: null,
      task_id:  taskId,
    });

    res.json({ success: true, model: record });

  } catch (err) {
    console.error('❌', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

async function pollTripoTask(taskId) {
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const res  = await fetch(`${TRIPO_BASE}/task/${taskId}`, {
      headers: { Authorization: `Bearer ${process.env.TRIPO_API_KEY}` },
    });
    const data = await res.json();
    const status = data.data?.status;
    if (status === 'success') {
      const url = data.data?.output?.pbr_model || data.data?.output?.model;
      if (!url) throw new Error('Pas de GLB dans la réponse');
      return url;
    }
    if (status === 'failed' || status === 'cancelled') throw new Error('Tripo task ' + status);
  }
  throw new Error('Timeout');
}