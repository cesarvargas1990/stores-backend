import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const targetCategories = {
  '759097b2-c2cd-4f82-b545-fb991fd3a171': ['Cuidado facial y corporal', 'Rutinas faciales y cuidado del cuerpo.'],
  '5081efdc-1677-479d-b91a-60fbc65ed173': ['Vitaminas y suplementos', 'Vitaminas, minerales y suplementos nutricionales.'],
  'e1fbe2fc-da74-4d04-9824-e61112a760e8': ['Cuidado personal', 'Productos para el cuidado y bienestar diario.'],
  '9878eba7-7972-4527-ba02-55b3150f03f5': ['Fragancias', 'Perfumes, body mist y aromas seleccionados.'],
  '1b3b6b60-cb98-4af7-8131-bfc13d69d155': ['Maquillaje y belleza', 'Maquillaje, labios y accesorios de belleza.'],
  'f11dce49-52e2-4349-bc67-a004577c3982': ['Cuidado capilar', 'Productos para cabello y cuero cabelludo.'],
  '8817862d-8cbf-444d-ac29-7b4df14e05b4': ['Cuidado íntimo', 'Productos de higiene y cuidado íntimo.'],
  'f4aed0fa-25cd-4560-869a-fd92c7edb211': ['Telefonía', 'Teléfonos y dispositivos móviles.'],
  '8d9ffbf0-45ea-4373-9d63-8263f698f7b7': ['Legado EOS', 'Categoría archivada; usar clasificación por tipo.'],
  'ee882964-e20a-4624-9f7b-21737474b0a0': ['Legado Kiko Milano', 'Categoría archivada; usar clasificación por tipo.']
};

function classify(name) {
  const value = String(name || '').toLocaleLowerCase('es-CO');
  if (value.includes('iphone')) return 'Telefonía';
  if (/(spirulina|vinagre|omega|collagen|fish oil|vitamina|hierro|acidez|zinc|biotina|d3|magnesio|centrum)/.test(value)) return 'Vitaminas y suplementos';
  if (/(lip gloss|gloss|bálsamo labial|labial|kiko)/.test(value)) return 'Maquillaje y belleza';
  if (value.includes('jabón íntimo')) return 'Cuidado íntimo';
  if (/(body mist|body misty|perfume|bruma)/.test(value)) return 'Fragancias';
  if (/(capilar|cabello|pelo|hair|castor|rapunzel|cer 100)/.test(value)) return 'Cuidado capilar';
  if (/(vaseline|crema corporal|aceite corporal|aceite para masajes|exfoliante corporal|jabón corporal|body cream|body oil|stop chafe|the ordinary|cuidado corporal|body bright|bright cream|kit de cuidado corporal)/.test(value)) return 'Cuidado personal';
  return 'Cuidado facial y corporal';
}

function brandFromLegacyCategory(categoryName) {
  const brands = {
    'Vaseline': 'Vaseline',
    'Ariana Grande': 'Ariana Grande',
    'Victoria Secret - PINK': 'Victoria Secret - PINK',
    'Bath and Body Works': 'Bath and Body Works',
    'sol de janeiro': 'Sol de Janeiro',
    'EOS': 'EOS',
    'Kiko Milano': 'Kiko Milano',
    'iPhone': 'Apple'
  };
  return brands[categoryName] || '';
}

function brandFromProductName(name) {
  const value = String(name || '').toLocaleLowerCase('es-CO');
  if (value.includes('cer 100')) return 'Elizavecca';
  if (value.includes('tree hut')) return 'Tree Hut';
  if (value.includes('aceite corporal truly')) return 'Truly';
  if (value.includes('the ordinary')) return 'The Ordinary';
  if (value.includes('centrum')) return 'Centrum';
  if (value.includes('snte')) return 'SNTE';
  if (value.includes('vagiisl')) return 'Vagiisl';
  if (value.includes('stop chafe')) return 'Stop Chafe';
  return '';
}

const client = await pool.connect();
try {
  await client.query('BEGIN');
  const storeResult = await client.query("SELECT id FROM stores WHERE slug = 'importaciones-ebc' LIMIT 1");
  if (!storeResult.rowCount) throw new Error('Tienda importaciones-ebc no encontrada.');
  const storeId = storeResult.rows[0].id;
  const categories = await client.query('SELECT id,name FROM categories WHERE store_id = $1 FOR UPDATE', [storeId]);
  const byId = new Map(categories.rows.map(category => [category.id, category]));
  for (const [categoryId, [name, description]] of Object.entries(targetCategories)) {
    if (byId.has(categoryId)) await client.query('UPDATE categories SET name = $1, description = $2, active = $3, updated_at = now() WHERE id = $4 AND store_id = $5', [name, description, !name.startsWith('Legado'), categoryId, storeId]);
  }
  const products = await client.query('SELECT p.id,p.name,p.brand,p.category_id AS "categoryId" FROM products p WHERE p.store_id = $1 FOR UPDATE', [storeId]);
  const targetIds = new Map(Object.entries(targetCategories).map(([id, [name]]) => [name, id]));
  for (const product of products.rows) {
    const brand = String(product.brand || '').trim() || brandFromLegacyCategory(byId.get(product.categoryId)?.name) || brandFromProductName(product.name);
    const categoryName = classify(product.name);
    const categoryId = targetIds.get(categoryName);
    if (!categoryId) throw new Error(`Clasificación sin categoría para: ${product.name}`);
    await client.query('UPDATE products SET category_id = $1, brand = $2, updated_at = now() WHERE id = $3 AND store_id = $4', [categoryId, brand, product.id, storeId]);
  }
  for (const [categoryId, [name]] of Object.entries(targetCategories)) {
    if (!name.startsWith('Legado')) await client.query("UPDATE categories SET image_url = COALESCE((SELECT image_url FROM products WHERE category_id = $1 AND image_url <> '' ORDER BY sort_order, created_at LIMIT 1), image_url), updated_at = now() WHERE id = $1 AND store_id = $2", [categoryId, storeId]);
  }
  await client.query('COMMIT');
  console.log(`Clasificados ${products.rowCount} productos en ${Object.values(targetCategories).filter(([name]) => !name.startsWith('Legado')).length} categorías activas.`);
} catch (error) {
  await client.query('ROLLBACK');
  console.error(error.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
