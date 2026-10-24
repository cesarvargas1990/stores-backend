import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

export class JsonStore {
  constructor(file) { this.file = file; this.data = null; }
  async init(seed) {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    try { this.data = JSON.parse(await fs.readFile(this.file, 'utf8')); }
    catch { this.data = seed(); await this.save(); }
    return this.data;
  }
  async save() {
    const temp = `${this.file}.tmp`;
    await fs.writeFile(temp, JSON.stringify(this.data, null, 2));
    await fs.rename(temp, this.file);
  }
  async mutate(fn) { const result = await fn(this.data); await this.save(); return result; }
}

export { id, now };
