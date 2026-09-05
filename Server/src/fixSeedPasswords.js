import pool from './config/db.js';
import bcrypt from 'bcryptjs';

async function fixPasswords() {
  const hash = await bcrypt.hash('Password@123', 10);
  const result = await pool.query('UPDATE users SET password_hash = $1', [hash]);
  console.log(`Successfully updated ${result.rowCount} users with valid bcrypt hash for 'Password@123'.`);
  await pool.end();
}

fixPasswords().catch(console.error);
