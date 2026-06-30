import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function testSearch() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database\n');

    // Check if search_vector column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'articles' AND column_name = 'search_vector'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('❌ search_vector column does not exist. Run: npm run db:fts');
      process.exit(1);
    }
    console.log('✅ search_vector column exists\n');

    // Check articles with search_vector
    const articleCheck = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(search_vector) as with_vector,
        COUNT(*) FILTER (WHERE search_vector IS NOT NULL) as not_null
      FROM articles
    `);
    
    console.log('📊 Articles status:');
    console.log(`   Total articles: ${articleCheck.rows[0].total}`);
    console.log(`   With search_vector: ${articleCheck.rows[0].with_vector}`);
    console.log(`   Not null search_vector: ${articleCheck.rows[0].not_null}\n`);

    // Show sample search_vector
    const sample = await client.query(`
      SELECT id, title, 
             CASE 
               WHEN search_vector IS NULL THEN 'NULL'
               ELSE 'Has vector'
             END as vector_status,
             LEFT(content, 50) as content_preview
      FROM articles 
      LIMIT 3
    `);
    
    console.log('📝 Sample articles:');
    sample.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.title}`);
      console.log(`      Vector: ${row.vector_status}`);
      console.log(`      Content: ${row.content_preview}...\n`);
    });

    // Test search with "аялая"
    console.log('🔍 Testing search for "аялая":\n');
    
    // Test 1: FTS with plainto_tsquery
    try {
      const ftsResults = await client.query(`
        SELECT 
          a.id,
          a.title,
          ts_rank_cd(a.search_vector, plainto_tsquery('simple', $1), 32) as rank
        FROM articles a
        WHERE a.search_vector IS NOT NULL 
          AND a.search_vector @@ plainto_tsquery('simple', $1)
        ORDER BY rank DESC
        LIMIT 5
      `, ['аялая']);
      
      console.log(`✅ FTS search found ${ftsResults.rows.length} results:`);
      ftsResults.rows.forEach((row, i) => {
        console.log(`   ${i + 1}. ${row.title} (rank: ${row.rank})`);
      });
    } catch (error: any) {
      console.log(`❌ FTS search error: ${error.message}`);
    }
    
    console.log('\n');
    
    // Test 2: ILIKE search
    const ilikeResults = await client.query(`
      SELECT a.id, a.title
      FROM articles a
      WHERE a.title ILIKE $1 
         OR a.content ILIKE $1 
         OR COALESCE(a.excerpt, '') ILIKE $1
      LIMIT 5
    `, ['%аялая%']);
    
    console.log(`✅ ILIKE search found ${ilikeResults.rows.length} results:`);
    ilikeResults.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.title}`);
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testSearch();
