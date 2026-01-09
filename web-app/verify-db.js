const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

console.log('Testing DB Connection...');
// Masked output for safety
const url = process.env.DATABASE_URL || '';
console.log('URL Length:', url.length);
console.log('URL Start:', url.substring(0, 15));

if (!url) {
    console.error('No DATABASE_URL found!');
    process.exit(1);
}

const pool = new Pool({
    connectionString: url,
    connectionTimeoutMillis: 5000,
});

pool.connect()
    .then(client => {
        console.log('Successfully connected to Neon DB!');
        return client.query('SELECT NOW()')
            .then(res => {
                console.log('Database Time:', res.rows[0].now);
                client.release();
                process.exit(0);
            });
    })
    .catch(err => {
        console.error('Connection Failed:', err.message);
        process.exit(1);
    });
