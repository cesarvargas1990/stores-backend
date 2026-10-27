import fs from 'node:fs/promises';
import pg from 'pg';

const { Pool } = pg;
const schemaUrl = new URL('../db/schema.sql', import.meta.url);

export class PostgresStore {
  constructor(connectionString) { this.pool = new Pool({ connectionString }); this.data = null; }
  async init(seed) {
    await this.pool.query(await fs.readFile(schemaUrl, 'utf8'));
    const existing = await this.pool.query('SELECT id FROM stores LIMIT 1');
    if (!existing.rowCount) { this.data = seed(); await this.save(); }
    else {
      await this.pool.query(`INSERT INTO brands(id,store_id,name,description,image_url,active,sort_order)
        SELECT gen_random_uuid(), product.store_id, brand_name, '', '', true, row_number() OVER (PARTITION BY product.store_id ORDER BY brand_name)
        FROM (
          SELECT DISTINCT p.store_id,
            CASE WHEN c.name = 'iPhone' THEN 'Apple'
                 WHEN c.name IN ('Ariana Grande','Bath and Body Works','EOS','Kiko Milano','sol de janeiro','Vaseline','Victoria Secret - PINK') THEN c.name
                 ELSE btrim(p.brand) END AS brand_name
          FROM products p LEFT JOIN categories c ON c.id = p.category_id
        ) product
        WHERE product.brand_name <> ''
        ON CONFLICT (store_id, lower(name)) DO NOTHING`);
      await this.reload();
    }
    return this.data;
  }
  async reload() {
    const q = async (sql, params = []) => (await this.pool.query(sql, params)).rows;
    const stores = await q('SELECT id,name,slug,origin,api_key AS "apiKey",active,created_at AS "createdAt",updated_at AS "updatedAt" FROM stores');
    const users = await q('SELECT id,email,password_hash AS "passwordHash",role,created_at AS "createdAt" FROM users');
    const members = await q('SELECT store_id AS "storeId",user_id AS "userId" FROM store_members');
    for (const user of users) user.storeIds = members.filter(m => m.userId === user.id).map(m => m.storeId);
    for (const user of users) if (user.role === 'master') user.storeIds = ['*'];
    const categories = await q('SELECT id,store_id AS "storeId",name,description,image_url AS "imageUrl",active,sort_order AS "sortOrder",created_at AS "createdAt",updated_at AS "updatedAt" FROM categories');
    const brands = await q('SELECT id,store_id AS "storeId",name,description,image_url AS "imageUrl",active,sort_order AS "sortOrder",created_at AS "createdAt",updated_at AS "updatedAt" FROM brands');
    const products = await q('SELECT id,store_id AS "storeId",name,description,details_html AS "detailsHtml",brand,category_id AS "categoryId",price,previous_price AS "previousPrice",image_url AS "imageUrl",gallery,active,available,featured,badge,sku,stock,fallback,sort_order AS "sortOrder",created_at AS "createdAt",updated_at AS "updatedAt" FROM products');
    for (const product of products) { product.price = Number(product.price); if (product.previousPrice !== null) product.previousPrice = Number(product.previousPrice); }
    const settingRows = await q('SELECT store_id AS "storeId",data,updated_at AS "updatedAt" FROM store_settings');
    this.data = { version: 1, stores, users, categories, brands, products, settings: settingRows.map(row => ({ storeId: row.storeId, ...row.data, updatedAt: row.updatedAt })) };
  }
  async save() {
    const client = await this.pool.connect();
    try { await client.query('BEGIN'); await client.query('TRUNCATE store_members, store_settings, products, brands, categories, stores, users CASCADE');
      for (const user of this.data.users) { await client.query('INSERT INTO users(id,email,password_hash,role,created_at) VALUES($1,$2,$3,$4,$5)', [user.id,user.email,user.passwordHash,user.role,user.createdAt]); }
      for (const store of this.data.stores) { await client.query('INSERT INTO stores(id,name,slug,origin,api_key,active,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)', [store.id,store.name,store.slug,store.origin,store.apiKey,store.active,store.createdAt,store.updatedAt]); }
      for (const user of this.data.users) for (const storeId of user.storeIds || []) if (storeId !== '*') await client.query('INSERT INTO store_members(store_id,user_id) VALUES($1,$2)', [storeId,user.id]);
      for (const category of this.data.categories) await client.query('INSERT INTO categories(id,store_id,name,description,image_url,active,sort_order,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)', [category.id,category.storeId,category.name,category.description || '',category.imageUrl || '',category.active,category.sortOrder,category.createdAt,category.updatedAt]);
      for (const brand of this.data.brands || []) await client.query('INSERT INTO brands(id,store_id,name,description,image_url,active,sort_order,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)', [brand.id,brand.storeId,brand.name,brand.description || '',brand.imageUrl || '',brand.active,brand.sortOrder,brand.createdAt,brand.updatedAt]);
      for (const product of this.data.products) await client.query('INSERT INTO products(id,store_id,category_id,name,description,details_html,brand,price,previous_price,image_url,gallery,active,available,featured,badge,sku,stock,fallback,sort_order,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)', [product.id,product.storeId,product.categoryId,product.name,product.description || '',product.detailsHtml || '',product.brand || '',product.price,product.previousPrice || null,product.imageUrl || '',JSON.stringify(product.gallery || []),product.active,product.available,product.featured,product.badge || '',product.sku || '',product.stock,product.fallback || '🛍️',product.sortOrder,product.createdAt,product.updatedAt]);
      for (const settings of this.data.settings) { const { storeId, ...data } = settings; await client.query('INSERT INTO store_settings(store_id,data,updated_at) VALUES($1,$2,$3)', [storeId,JSON.stringify(data),settings.updatedAt || new Date().toISOString()]); }
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
  async close() { await this.pool.end(); }
}
