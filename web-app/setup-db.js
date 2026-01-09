const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
});

// Setup the proper 3-table structure: user, session, tasks
const setupSQL = `
-- Create user table for Better Auth
CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    "emailVerified" BOOLEAN DEFAULT FALSE,
    name TEXT,
    image TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create session table for Better Auth (required for login sessions)
CREATE TABLE IF NOT EXISTS "session" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    token TEXT UNIQUE,
    "expiresAt" TIMESTAMP NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create account table (needed by Better Auth for email/password)
CREATE TABLE IF NOT EXISTS "account" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "providerId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    password TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP,
    "refreshTokenExpiresAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clean up extra columns in tasks table that shouldn't be there
ALTER TABLE tasks DROP COLUMN IF EXISTS email;
ALTER TABLE tasks DROP COLUMN IF EXISTS password_hash;
ALTER TABLE tasks DROP COLUMN IF EXISTS user_name;
ALTER TABLE tasks DROP COLUMN IF EXISTS is_user_record;

-- Ensure proper indexes
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
CREATE INDEX IF NOT EXISTS idx_session_userId ON "session"("userId");
CREATE INDEX IF NOT EXISTS idx_session_token ON "session"(token);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
`;

async function setupDatabase() {
    console.log('Setting up proper 3-table structure...');
    console.log('Tables: user, session, account, tasks');

    try {
        const client = await pool.connect();
        console.log('\\nConnected to Neon database');

        await client.query(setupSQL);
        console.log('\\n✅ Database setup complete!');

        // Verify tables
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);

        console.log('\\nTables in database:');
        result.rows.forEach(row => console.log('  - ' + row.table_name));

        // Show tasks table structure
        const columns = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'tasks' 
            ORDER BY ordinal_position
        `);

        console.log('\\nTasks table columns:');
        columns.rows.forEach(row => console.log('  - ' + row.column_name + ' (' + row.data_type + ')'));

        // Count existing tasks
        const taskCount = await client.query('SELECT COUNT(*) as count FROM tasks');
        console.log('\\nExisting tasks in database: ' + taskCount.rows[0].count);

        client.release();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

setupDatabase();
