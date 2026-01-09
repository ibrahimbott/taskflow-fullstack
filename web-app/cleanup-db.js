require('dotenv').config();
const { Client } = require('pg');

async function cleanupDatabase() {
    const client = new Client(process.env.DATABASE_URL);

    try {
        await client.connect();
        console.log('Connected to database\n');

        // Show current tables
        const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('Current tables:', tables.rows.map(r => r.table_name).join(', '));

        // Remove redundant tables
        const tablesToRemove = ['account', 'verification', 'alembic_version'];

        for (const table of tablesToRemove) {
            try {
                await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
                console.log(`✓ Dropped table: ${table}`);
            } catch (err) {
                console.log(`⚠ Could not drop ${table}: ${err.message}`);
            }
        }

        // Ensure password_hash column exists on user table
        await client.query(`
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS password_hash TEXT
    `);
        console.log('✓ Ensured password_hash column exists on user table');

        // Show final tables
        const finalTables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('\nFinal tables:', finalTables.rows.map(r => r.table_name).join(', '));

        // Show tasks count
        const taskCount = await client.query('SELECT COUNT(*) as count FROM tasks');
        console.log(`Tasks preserved: ${taskCount.rows[0].count}`);

        // Show user count  
        const userCount = await client.query('SELECT COUNT(*) as count FROM "user"');
        console.log(`Users: ${userCount.rows[0].count}`);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
        console.log('\nDatabase cleanup complete!');
    }
}

cleanupDatabase();
