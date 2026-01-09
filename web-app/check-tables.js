const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
});

async function checkTables() {
    console.log('Checking database tables...');

    try {
        const client = await pool.connect();
        console.log('Connected to Neon database\n');

        // List all tables
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);

        console.log('Tables in database:');
        tables.rows.forEach(row => console.log('  - ' + row.table_name));

        // Show tasks table columns
        const taskCols = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'tasks' 
            ORDER BY ordinal_position
        `);

        console.log('\n== TASKS TABLE COLUMNS ==');
        taskCols.rows.forEach(row =>
            console.log('  ' + row.column_name + ' (' + row.data_type + ')' + (row.is_nullable === 'YES' ? ' nullable' : ''))
        );

        // Show user table columns
        const userCols = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'user' 
            ORDER BY ordinal_position
        `);

        console.log('\n== USER TABLE COLUMNS ==');
        userCols.rows.forEach(row =>
            console.log('  ' + row.column_name + ' (' + row.data_type + ')' + (row.is_nullable === 'YES' ? ' nullable' : ''))
        );

        // Show session table columns
        const sessCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'session' 
            ORDER BY ordinal_position
        `);

        console.log('\n== SESSION TABLE COLUMNS ==');
        sessCols.rows.forEach(row => console.log('  ' + row.column_name + ' (' + row.data_type + ')'));

        // Count records
        const taskCount = await client.query('SELECT COUNT(*) as count FROM tasks');
        const userCount = await client.query('SELECT COUNT(*) as count FROM "user"');
        const sessCount = await client.query('SELECT COUNT(*) as count FROM "session"');

        console.log('\n== RECORD COUNTS ==');
        console.log('  Tasks: ' + taskCount.rows[0].count);
        console.log('  Users: ' + userCount.rows[0].count);
        console.log('  Sessions: ' + sessCount.rows[0].count);

        client.release();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkTables();
