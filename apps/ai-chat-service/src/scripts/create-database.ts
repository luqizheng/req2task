import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

async function createDatabase() {
  const host = process.env['DATABASE_HOST'] || 'localhost';
  const port = parseInt(process.env['DATABASE_PORT'] || '5432', 10);
  const user = process.env['DATABASE_USER'] || 'postgres';
  const password = process.env['DATABASE_PASSWORD'] || 'postgres';
  const database = process.env['DATABASE_NAME'] || 'ai_chat';

  const client = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres',
  });

  try {
    await client.connect();

    const checkDb = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [database]
    );

    if (checkDb.rows.length > 0) {
      console.log(`Database "${database}" already exists`);
      return;
    }

    await client.query(`CREATE DATABASE "${database}"`);
    console.log(`Database "${database}" created successfully`);
  } catch (error) {
    console.error('Failed to create database:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
