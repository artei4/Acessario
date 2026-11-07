/** Recria server/db.json com os dados de demonstração (datas relativas a hoje). */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildSeed } from '../shared/seed.js';

const DB_PATH = join(dirname(fileURLToPath(import.meta.url)), 'db.json');
writeFileSync(DB_PATH, JSON.stringify(buildSeed(), null, 2));
console.log('server/db.json recriado com dados de demonstração.');
