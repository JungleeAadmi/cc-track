export const processImage = (file) =>
  new Promise((resolve, reject) => {
    if (!file) reject('No file');
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
