export async function generateModelFromImage(imageFile, modelName) {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('name', modelName);

  const res = await fetch('/api/generate', {   // ← plus de localhost !
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Génération échouée');
  return data.model;
}