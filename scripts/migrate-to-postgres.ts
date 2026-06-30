import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { getPool, query } from '../lib/db-connection';
import type { KnowledgeBase } from '../types';

// Load environment variables
config();

const DATA_FILE = path.join(process.cwd(), 'data', 'kb.json');

async function migrate() {
  console.log('Starting migration from JSON to PostgreSQL...');
  
  // Read JSON data
  if (!fs.existsSync(DATA_FILE)) {
    console.error('Data file not found:', DATA_FILE);
    process.exit(1);
  }
  
  const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
  const data: KnowledgeBase = JSON.parse(fileContent);
  
  console.log(`Found ${data.categories.length} categories and ${data.faqs.length} FAQs`);
  
  // Test database connection
  try {
    await query('SELECT 1');
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
  
  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('Clearing existing data...');
  await query('DELETE FROM articles');
  await query('DELETE FROM categories');
  await query('DELETE FROM faqs');
  
  // Migrate categories and articles
  for (const category of data.categories) {
    console.log(`Migrating category: ${category.title}`);
    
    // Insert category
    await query(
      `INSERT INTO categories (id, slug, title, description, icon, "order")
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         slug = EXCLUDED.slug,
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         icon = EXCLUDED.icon,
         "order" = EXCLUDED."order"`,
      [
        category.id,
        category.slug,
        category.title,
        category.description || null,
        category.icon || null,
        category.order,
      ]
    );
    
    // Insert articles
    for (const article of category.articles) {
      await query(
        `INSERT INTO articles (id, category_id, slug, title, content, excerpt, "order", views, helpful, not_helpful, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
           slug = EXCLUDED.slug,
           title = EXCLUDED.title,
           content = EXCLUDED.content,
           excerpt = EXCLUDED.excerpt,
           "order" = EXCLUDED."order"`,
        [
          article.id,
          category.id,
          article.slug,
          article.title,
          article.content,
          article.excerpt || null,
          article.order,
          article.views || 0,
          article.helpful || 0,
          article.notHelpful || 0,
          article.createdAt,
          article.updatedAt,
        ]
      );
    }
    
    console.log(`  - Migrated ${category.articles.length} articles`);
  }
  
  // Migrate FAQs
  for (const faq of data.faqs) {
    console.log(`Migrating FAQ: ${faq.title}`);
    await query(
      `INSERT INTO faqs (id, title, content, "order", created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         content = EXCLUDED.content,
         "order" = EXCLUDED."order"`,
      [
        faq.id,
        faq.title,
        faq.content,
        faq.order,
        faq.createdAt,
      ]
    );
  }
  
  console.log('Migration completed successfully!');
  process.exit(0);
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
