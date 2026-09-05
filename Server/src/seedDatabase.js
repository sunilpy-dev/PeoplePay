import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedDatabase() {
  try {
    const schemaPath = path.resolve(__dirname, '../../db/schema.sql');
    const seedPath = path.resolve(__dirname, '../../db/seed.sql');

    if (fs.existsSync(schemaPath)) {
      console.log('[Seed] Reading schema.sql...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      console.log('[Seed] Ensuring schema tables exist...');
      try {
        await pool.query(schemaSql);
        console.log('[Seed] Schema verified successfully.');
      } catch (schemaErr) {
        console.warn('[Seed] Note on schema execution (tables might already exist):', schemaErr.message);
      }
    }

    console.log('[Seed] Reading seed.sql...');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('[Seed] Inserting seed data...');
    await pool.query(seedSql);
    console.log('[Seed] Seed data inserted successfully.');

    const resUsers = await pool.query('SELECT id, email, role, is_active FROM users ORDER BY email ASC');
    console.log('\n--- SEEDED USERS IN DATABASE ---');
    console.table(resUsers.rows);

    const rules = await pool.query('SELECT COUNT(*) FROM salary_rules');
    console.log(`\n[Seed] Successfully verified ${rules.rows[0].count} active salary rules.`);

    const structures = await pool.query('SELECT id, name, code FROM salary_structures');
    console.log(`[Seed] Successfully verified ${structures.rows.length} salary structure(s):`);
    structures.rows.forEach(s => console.log(` - ${s.name} [${s.code}]`));

  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();
