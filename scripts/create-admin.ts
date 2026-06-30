import { Client } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createAdmin() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database\n');

    // Check if table exists, create if not
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
      CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('📝 Admin users table ready\n');

    // Get username and password
    const username = await question('Enter admin username (default: admin): ');
    const finalUsername = username.trim() || 'admin';

    // Check if user exists
    const existing = await client.query(
      'SELECT id, username FROM admin_users WHERE username = $1',
      [finalUsername]
    );

    if (existing.rows.length > 0) {
      console.log(`\n⚠️  User "${finalUsername}" already exists.`);
      const update = await question('Do you want to update the password? (y/n): ');
      if (update.toLowerCase() !== 'y') {
        console.log('❌ Cancelled');
        process.exit(0);
      }
    }

    const password = await question('Enter admin password: ');
    if (!password || password.length < 6) {
      console.error('❌ Password must be at least 6 characters');
      process.exit(1);
    }

    const confirmPassword = await question('Confirm password: ');
    if (password !== confirmPassword) {
      console.error('❌ Passwords do not match');
      process.exit(1);
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert or update
    if (existing.rows.length > 0) {
      await client.query(
        'UPDATE admin_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE username = $2',
        [passwordHash, finalUsername]
      );
      console.log(`\n✅ Admin user "${finalUsername}" password updated successfully!`);
    } else {
      const id = `admin_${Date.now()}`;
      await client.query(
        'INSERT INTO admin_users (id, username, password_hash) VALUES ($1, $2, $3)',
        [id, finalUsername, passwordHash]
      );
      console.log(`\n✅ Admin user "${finalUsername}" created successfully!`);
    }

    console.log('\n📋 Login credentials:');
    console.log(`   Username: ${finalUsername}`);
    console.log(`   Password: ${'*'.repeat(password.length)}`);
    console.log('\n⚠️  Please keep these credentials secure!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    rl.close();
  }
}

createAdmin();
