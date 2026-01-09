require('dotenv').config();
const { Client } = require('pg');

async function verify() {
    const client = new Client(process.env.DATABASE_URL);

    try {
        await client.connect();
        console.log('=== PHASE 2 DATABASE VERIFICATION ===\n');

        // Check tables
        const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `);
        console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));

        // Check for unwanted tables
        const unwanted = ['account', 'verification', 'alembic_version'];
        const existing = tables.rows.map(r => r.table_name);
        const foundUnwanted = unwanted.filter(t => existing.includes(t));

        if (foundUnwanted.length > 0) {
            console.log('❌ Unwanted tables still exist:', foundUnwanted.join(', '));
        } else {
            console.log('✅ No unwanted tables (account, verification, alembic_version)');
        }

        // Check required tables
        const required = ['user', 'tasks'];
        const missingRequired = required.filter(t => !existing.includes(t));
        if (missingRequired.length > 0) {
            console.log('❌ Missing required tables:', missingRequired.join(', '));
        } else {
            console.log('✅ Required tables present: user, tasks');
        }

        // Check password_hash column
        const cols = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'user'
    `);
        const hasPasswordHash = cols.rows.some(r => r.column_name === 'password_hash');
        if (hasPasswordHash) {
            console.log('✅ password_hash column exists on user table');
        } else {
            console.log('❌ password_hash column missing');
        }

        // Count data
        const users = await client.query('SELECT COUNT(*) as count FROM "user"');
        const tasks = await client.query('SELECT COUNT(*) as count FROM tasks');
        console.log(`\nData counts: ${users.rows[0].count} users, ${tasks.rows[0].count} tasks`);

        console.log('\n=== VERIFICATION COMPLETE ===');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

verify();
