import pg from 'pg';
import { hashPassword } from './security.js';

const email = (process.env.MASTER_EMAIL || 'cesara.vargas1990@gmail.com').toLowerCase();
const password = process.env.MASTER_PASSWORD;
if (!password || password === 'change-this-master-password') throw new Error('Configura MASTER_PASSWORD en .env antes de ejecutar este comando.');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || 'postgres://storesadmin:storesadmin_dev_change_me@localhost:5432/storesadmin' });
const result = await pool.query('UPDATE users SET password_hash=$1, updated_at=now() WHERE email=$2 AND role=$3', [hashPassword(password), email, 'master']);
if (!result.rowCount) throw new Error(`No existe un usuario master con correo ${email}. Ejecuta primero npm start para crear el seed.`);
console.log(`Contraseña master actualizada para ${email}.`);
await pool.end();
