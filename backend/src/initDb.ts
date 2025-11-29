import pool from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    // Check if migrations table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration 1: Add last_email_sync column
    const migration1 = 'add_last_email_sync_column';
    const migration1Exists = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE migration_name = $1',
      [migration1]
    );

    if (migration1Exists.rows.length === 0) {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS last_email_sync TIMESTAMP');
      await pool.query(
        'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
        [migration1]
      );
      console.log(`✅ Applied migration: ${migration1}`);
    }

    // Migration 2: Create ai_usage table
    const migration2 = 'create_ai_usage_table';
    const migration2Exists = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE migration_name = $1',
      [migration2]
    );

    if (migration2Exists.rows.length === 0) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ai_usage (
          id SERIAL PRIMARY KEY,
          user_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
          operation_type VARCHAR(100) NOT NULL,
          input_tokens INTEGER DEFAULT 0,
          output_tokens INTEGER DEFAULT 0,
          total_tokens INTEGER DEFAULT 0,
          model_used VARCHAR(100),
          success BOOLEAN DEFAULT true,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query('CREATE INDEX IF NOT EXISTS idx_ai_usage_user_email ON ai_usage(user_email)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_ai_usage_operation_type ON ai_usage(operation_type)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at)');

      await pool.query(
        'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
        [migration2]
      );
      console.log(`✅ Applied migration: ${migration2}`);
    }
  } catch (error) {
    console.error('❌ Failed to run migrations:', error);
    throw error;
  }
}

export async function initializeDatabase() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    await pool.query(schema);
    console.log('✅ Database schema initialized successfully');

    // Run migrations after schema initialization
    await runMigrations();
  } catch (error) {
    console.error('❌ Failed to initialize database schema:', error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}
