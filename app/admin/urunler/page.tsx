async function uploadProductImage(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Görsel en fazla 5 MB olabilir.');
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Sadece JPG, PNG veya WEBP yüklenebilir.');
  }

  const fileData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Görsel okunamadı.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Görsel okunamadı.'));
    };

    reader.readAsDataURL(file);
  });

  const response = await fetch('/api/products/upload-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileData,
    }),
  });

  const result = (await response.json()) as {
    image_url?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(result.error || 'Görsel yüklenemedi.');
  }

  if (!result.image_url) {
    throw new Error('Görsel bağlantısı alınamadı.');
  }

  return result.image_url;
}
