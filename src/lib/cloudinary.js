const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadImage(file) {
  if (!file) throw new Error("No file selected");
  if (!file.type || !file.type.startsWith("image/")) throw new Error("Only image files are allowed");
  if (file.size > MAX_BYTES) throw new Error("Image must be 5 MB or smaller");
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", preset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  if (!data.secure_url) throw new Error("Upload failed");
  return data.secure_url;
}
