const { Client } = require('pg');

async function addPasswordColumn() {
    const client = new Client(process.env.DATABASE_URL);

    try {
        await client.connect();
        console.log('Connected to database');

        // Check current columns
        const cols = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'user'
    `);
        console.log('Current columns:', cols.rows.map(r => r.column_name));

        // Add password_hash if not exists
        const hasPasswordHash = cols.rows.some(r => r.column_name === 'password_hash');

        if (!hasPasswordHash) {
            console.log('Adding password_hash column...');
            await client.query('ALTER TABLE "user" ADD COLUMN password_hash TEXT');
            console.log('Added password_hash column');
        } else {
            console.log('password_hash column already exists');
        }

        // Add created_at if not exists  
        const hasCreatedAt = cols.rows.some(r => r.column_name === 'created_at');
        if (!hasCreatedAt) {
            console.log('Adding created_at column...');
            await client.query('ALTER TABLE "user" ADD COLUMN created_at TEXT');
            console.log('Added created_at column');
        }

        // Show final columns
        const finalCols = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'user'
    `);
        console.log('Final columns:');
        finalCols.rows.forEach(r => console.log('  -', r.column_name, r.data_type));

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

addPasswordColumn();
