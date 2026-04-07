/* eslint-env node */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function uploadToSupabase(buffer, fileName, bucket) {
  const cleanName = fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .toLowerCase();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(cleanName, buffer, { upsert: true, contentType: 'model/gltf-binary' });

  if (error) throw new Error('Supabase upload error: ' + error.message);

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(cleanName);
  return urlData.publicUrl;
}

export async function saveModelToDB(modelData) {
  const { data, error } = await supabase
    .from('models')
    .insert(modelData)
    .select()
    .single();

  if (error) throw new Error('DB insert error: ' + error.message);
  return data;
}