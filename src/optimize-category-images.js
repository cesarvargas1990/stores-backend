import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import pg from 'pg';
import sharp from 'sharp';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const uploadDir = '/app/uploads';
const publicBase = 'https://cesarvargas.tech/storeadmin/uploads';

try {
  await fs.mkdir(uploadDir, { recursive: true });
  const { rows } = await pool.query("SELECT id, name, image_url FROM categories WHERE image_url <> '' AND image_url NOT LIKE '%/storeadmin/uploads/%' ORDER BY sort_order");
  for (const category of rows) {
    const response = await fetch(category.image_url);
    if (!response.ok) throw new Error(`${category.name}: HTTP ${response.status} al descargar ${category.image_url}`);
    const source = Buffer.from(await response.arrayBuffer());
    const optimized = await sharp(source).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toBuffer();
    const filename = `${crypto.randomUUID()}.webp`;
    await fs.writeFile(`${uploadDir}/${filename}`, optimized);
    const imageUrl = `${publicBase}/${filename}`;
    await pool.query('UPDATE categories SET image_url = $1, updated_at = now() WHERE id = $2', [imageUrl, category.id]);
    console.log(`${category.name}: ${category.image_url} -> ${imageUrl} (${optimized.length} bytes)`);
  }
  console.log(`Categorías convertidas: ${rows.length}`);
} finally {
  await pool.end();
}
