export async function generateModelFromImage(imageFile, modelName) {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('name', modelName);

    const res = await fetch('https://glamtec-ar.vercel.app/api/generate', {
        // ← plus de localhost !
        method: 'POST',
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        body: formData,
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Génération échouée');
    return data.model;
}
