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
    else await this.reload();
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
    const products = await q('SELECT id,store_id AS "storeId",name,description,details_html AS "detailsHtml",category_id AS "categoryId",price,previous_price AS "previousPrice",image_url AS "imageUrl",gallery,active,available,featured,badge,sku,stock,fallback,sort_order AS "sortOrder",created_at AS "createdAt",updated_at AS "updatedAt" FROM products');
    for (const product of products) { product.price = Number(product.price); if (product.previousPrice !== null) product.previousPrice = Number(product.previousPrice); }
    const settingRows = await q('SELECT store_id AS "storeId",data,updated_at AS "updatedAt" FROM store_settings');
    this.data = { version: 1, stores, users, categories, products, settings: settingRows.map(row => ({ storeId: row.storeId, ...row.data, updatedAt: row.updatedAt })) };
  }
  async save() {
    const client = await this.pool.connect();
    try { await client.query('BEGIN'); await client.query('TRUNCATE store_members, store_settings, products, categories, stores, users CASCADE');
      for (const user of this.data.users) { await client.query('INSERT INTO users(id,email,password_hash,role,created_at) VALUES($1,$2,$3,$4,$5)', [user.id,user.email,user.passwordHash,user.role,user.createdAt]); }
      for (const store of this.data.stores) { await client.query('INSERT INTO stores(id,name,slug,origin,api_key,active,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)', [store.id,store.name,store.slug,store.origin,store.apiKey,store.active,store.createdAt,store.updatedAt]); }
      for (const user of this.data.users) for (const storeId of user.storeIds || []) if (storeId !== '*') await client.query('INSERT INTO store_members(store_id,user_id) VALUES($1,$2)', [storeId,user.id]);
      for (const category of this.data.categories) await client.query('INSERT INTO categories(id,store_id,name,description,image_url,active,sort_order,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)', [category.id,category.storeId,category.name,category.description || '',category.imageUrl || '',category.active,category.sortOrder,category.createdAt,category.updatedAt]);
      for (const product of this.data.products) await client.query('INSERT INTO products(id,store_id,category_id,name,description,details_html,price,previous_price,image_url,gallery,active,available,featured,badge,sku,stock,fallback,sort_order,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)', [product.id,product.storeId,product.categoryId,product.name,product.description || '',product.detailsHtml || '',product.price,product.previousPrice || null,product.imageUrl || '',JSON.stringify(product.gallery || []),product.active,product.available,product.featured,product.badge || '',product.sku || '',product.stock,product.fallback || '🛍️',product.sortOrder,product.createdAt,product.updatedAt]);
      for (const settings of this.data.settings) { const { storeId, ...data } = settings; await client.query('INSERT INTO store_settings(store_id,data,updated_at) VALUES($1,$2,$3)', [storeId,JSON.stringify(data),settings.updatedAt || new Date().toISOString()]); }
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
  async close() { await this.pool.end(); }
}
