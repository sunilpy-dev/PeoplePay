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

    console.log('Reading schema.sql...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Executing schema.sql...');
    await pool.query(schemaSql);
    console.log('Schema executed successfully.');

    console.log('Reading seed.sql...');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('Executing seed.sql...');
    await pool.query(seedSql);
    console.log('Seed data inserted successfully.');

    const resUsers = await pool.query('SELECT id, email, role, is_active FROM users ORDER BY email ASC');
    console.log('\n--- SEEDED USERS IN DATABASE ---');
    console.table(resUsers.rows);

  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();
