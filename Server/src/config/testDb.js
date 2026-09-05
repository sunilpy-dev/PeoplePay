import pool from './db.js';

async function testConnection() {
  console.log('Testing PostgreSQL connection...');
  try {
    const res = await pool.query('SELECT NOW() as current_time, current_database() as database_name');
    console.log('Connection successful!');
    console.log(`Database: ${res.rows[0].database_name}`);
    console.log(`Current Time: ${res.rows[0].current_time}`);

    // Inspect existing tables without modifying anything
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('\nExisting Tables:');
    tablesRes.rows.forEach(row => console.log(` - ${row.table_name}`));

    // Count existing users if table exists
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`\nExisting users count: ${usersCount.rows[0].count}`);

    // Count existing employees
    const empCount = await pool.query('SELECT COUNT(*) FROM employees');
    console.log(`Existing employees count: ${empCount.rows[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error('Database connection test failed:', error.message);
    process.exit(1);
  }
}

testConnection();
