import app from './app.js';
import pool from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Verify database connectivity before opening HTTP port
    const dbTest = await pool.query('SELECT current_database() as db_name, NOW() as current_time');
    console.log(`[Database] Connected successfully to PostgreSQL: '${dbTest.rows[0].db_name}' at ${dbTest.rows[0].current_time}`);

    const server = app.listen(PORT, () => {
      console.log(`[Server] PeoplePay360 Backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
      console.log(`[Server] Health check: http://localhost:${PORT}/api/v1/health`);
    });

    const shutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('[Server] HTTP server closed.');
        try {
          await pool.end();
          console.log('[Database] PostgreSQL pool connections closed.');
          process.exit(0);
        } catch (err) {
          console.error('[Database] Error closing PostgreSQL pool:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('[Startup Error] Failed to connect to database or start server:', error.message);
    process.exit(1);
  }
}

startServer();
