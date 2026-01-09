require('dotenv').config();
const { Client } = require('pg');

async function migrate() {
    const client = new Client(process.env.DATABASE_URL);

    try {
        await client.connect();
        console.log('Connected to database');

        // Add password_hash column if not exists
        await client.query(`
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS password_hash TEXT
    `);
        console.log('Added password_hash column');

        // Show final columns
        const cols = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'user'
    `);
        console.log('User table columns:');
        cols.rows.forEach(r => console.log('  -', r.column_name, ':', r.data_type));

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

migrate();
