export async function compressImage(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) throw new Error("Please choose a JPEG, PNG, WebP, or AVIF image.");
  if (file.size > 15 * 1024 * 1024) throw new Error("Choose an image smaller than 15 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 800 / bitmap.width, 1600 / bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser could not compress this image.");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    let quality = 0.84;
    let data = canvas.toDataURL("image/webp", quality);
    while (data.length > 300000 && quality > 0.24) {
      quality -= 0.1;
      data = canvas.toDataURL("image/webp", quality);
    }
    if (data.length > 300000) throw new Error("This image is still too detailed after compression. Try a smaller image.");
    if (!/^data:image\/(?:webp|jpeg);base64,/.test(data)) throw new Error("This browser does not support WebP export. Please try an up-to-date browser.");
    return data;
  } finally { bitmap.close(); }
}
