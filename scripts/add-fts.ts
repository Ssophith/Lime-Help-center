import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function addFTS() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');

    // Read and execute the SQL file
    const sqlFile = path.join(__dirname, 'add-fts.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('📝 Executing FTS migration...');
    await client.query(sql);
    
    console.log('✅ Full-Text Search (FTS) setup completed successfully!');
    console.log('   - Added search_vector column to articles table');
    console.log('   - Created GIN index for fast searching');
    console.log('   - Set up auto-update trigger');
    console.log('   - Updated existing articles with search vectors');
  } catch (error: any) {
    console.error('❌ Error setting up FTS:', error.message);
    if (error.code === '42710') {
      console.log('ℹ️  Some objects already exist, continuing...');
    } else {
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

addFTS();
