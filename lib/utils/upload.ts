import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads';

export async function saveCatalogImage(buffer: Buffer, id: string): Promise<string> {
  const dir = path.join(process.cwd(), UPLOAD_DIR, 'catalog');
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${id}.jpg`;
  await sharp(buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(path.join(dir, filename));
  return `uploads/catalog/${filename}`;
}

export async function saveRoomImage(buffer: Buffer, id: string): Promise<string> {
  const dir = path.join(process.cwd(), UPLOAD_DIR, 'rooms');
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${id}.jpg`;
  await sharp(buffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(path.join(dir, filename));
  return `uploads/rooms/${filename}`;
}

export async function saveMoodboardImage(buffer: Buffer, id: string): Promise<string> {
  const dir = path.join(process.cwd(), UPLOAD_DIR, 'moodboards');
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${id}.jpg`;
  await sharp(buffer)
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(path.join(dir, filename));
  return `uploads/moodboards/${filename}`;
}

export async function saveInspireImage(buffer: Buffer, id: string): Promise<string> {
  const dir = path.join(process.cwd(), UPLOAD_DIR, 'inspire');
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${id}.jpg`;
  await sharp(buffer)
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(path.join(dir, filename));
  return `uploads/inspire/${filename}`;
}
