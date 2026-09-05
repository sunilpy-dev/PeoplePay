import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
  try {
    const seedPath = path.resolve(__dirname, '../../db/seed.sql');
    console.log('[Seed] Reading seed script from:', seedPath);
    const sql = fs.readFileSync(seedPath, 'utf8');

    console.log('[Seed] Applying seed data to PostgreSQL...');
    await pool.query(sql);

    console.log('[Seed] Verifying seeded users...');
    const users = await pool.query('SELECT email, role, is_active FROM users');
    console.log(`[Seed] Successfully seeded ${users.rows.length} users:`);
    users.rows.forEach(u => console.log(` - ${u.email} (${u.role})`));

    const rules = await pool.query('SELECT COUNT(*) FROM salary_rules');
    console.log(`[Seed] Successfully seeded ${rules.rows[0].count} salary rules.`);

    const structures = await pool.query('SELECT id, name, code FROM salary_structures');
    console.log(`[Seed] Successfully seeded ${structures.rows.length} salary structure(s):`);
    structures.rows.forEach(s => console.log(` - ${s.name} [${s.code}]`));

    await pool.end();
    console.log('[Seed] Database seeding completed successfully!');
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    process.exit(1);
  }
}

runSeed();
