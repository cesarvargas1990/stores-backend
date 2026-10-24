import fs from 'node:fs/promises';
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || 'postgres://storesadmin:storesadmin_dev_change_me@localhost:5432/storesadmin' });
await pool.query(await fs.readFile(new URL('../db/schema.sql', import.meta.url), 'utf8'));
console.log('PostgreSQL schema listo.');
await pool.end();
