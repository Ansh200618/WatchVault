import { useEffect, useState } from 'react';

const PROFILE_IMAGE_KEY = 'watchvault:profile-image';
const PROFILE_IMAGE_EVENT = 'watchvault:profile-image-changed';
const AVATAR_SIZE = 256;
const WEBP_QUALITY = 0.72;

export function getProfileImage() {
  try {
    return window.localStorage.getItem(PROFILE_IMAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setProfileImage(value: string) {
  try {
    if (value) window.localStorage.setItem(PROFILE_IMAGE_KEY, value);
    else window.localStorage.removeItem(PROFILE_IMAGE_KEY);
    window.dispatchEvent(new CustomEvent(PROFILE_IMAGE_EVENT));
  } catch {
    // Ignore storage failures. The UI will keep using initials.
  }
}

export function clearProfileImage() {
  setProfileImage('');
}

export function useProfileImage() {
  const [image, setImage] = useState(getProfileImage);

  useEffect(() => {
    const sync = () => setImage(getProfileImage());
    window.addEventListener('storage', sync);
    window.addEventListener(PROFILE_IMAGE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(PROFILE_IMAGE_EVENT, sync);
    };
  }, []);

  return image;
}

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load image'));
    image.src = dataUrl;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}

function canvasToWebp(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(canvas.toDataURL('image/webp', WEBP_QUALITY));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.readAsDataURL(blob);
      },
      'image/webp',
      WEBP_QUALITY,
    );
  });
}

export async function compressProfileImageToWebp(file: File): Promise<string> {
  const rawDataUrl = await readFileAsDataUrl(file);
  const image = await loadImageFromDataUrl(rawDataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return rawDataUrl;

  const sourceSize = Math.min(image.width, image.height);
  const sourceX = Math.max(0, (image.width - sourceSize) / 2);
  const sourceY = Math.max(0, (image.height - sourceSize) / 2);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

  return canvasToWebp(canvas);
}

export function pickProfileImageFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        resolve(await compressProfileImageToWebp(file));
      } catch {
        resolve(null);
      }
    };
    input.click();
  });
}
