#!/usr/bin/env node
/**
 * Bulk fix broken Facebook/Instagram CDN images in all articles.
 * For each broken image:
 *   1. Try to download from the original URL
 *   2. If downloadable: upload to R2, replace URL in DB
 *   3. If dead: remove the broken <img> tag and log it
 */
require('dotenv').config({ path: '/home/admin/limekb/.env.production' });
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Pool } = require('pg');
const https = require('https');
const http = require('http');
const crypto = require('crypto');

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Download a URL to a Buffer
function downloadUrl(url) {
  return new Promise((resolve, reject) => {
    const cleanUrl = url.replace(/&amp;/g, '&');
    const mod = cleanUrl.startsWith('https') ? https : http;
    const req = mod.get(cleanUrl, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(downloadUrl(res.headers.location));
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType: res.headers['content-type'] || 'image/jpeg' }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// Upload buffer to R2
async function uploadToR2(buffer, contentType, r2Key) {
  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: r2Key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000',
  }));
  return `${process.env.R2_PUBLIC_URL}/${r2Key}`;
}

// Extract all broken image src URLs from content
function extractBrokenSrcs(content) {
  const matches = [];
  const re = /src="(https?:\/\/(?:scontent|instagram)\.fuln[^"]+)"/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    matches.push(m[1]);
  }
  return [...new Set(matches)]; // deduplicate
}

// Replace src in content (handle both raw & amp-encoded)
function replaceSrc(content, oldSrc, newSrc) {
  const escaped = oldSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const ampEncoded = oldSrc.replace(/&/g, '&amp;').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return content
    .replace(new RegExp(escaped, 'g'), newSrc)
    .replace(new RegExp(ampEncoded, 'g'), newSrc);
}

// Remove broken img tag entirely (if download fails)
function removeBrokenImg(content, brokenSrc) {
  const escaped = brokenSrc.replace(/&/g, '&amp;').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Remove the whole <img ...src="broken"...> tag
  return content.replace(new RegExp(`<img[^>]*src="${escaped}"[^>]*>`, 'g'), 
    '<p style="color:#999;font-size:0.85em;">[Зураг харах боломжгүй]</p>');
}

async function main() {
  // Get all articles with broken CDN images
  const rows = await pool.query(`
    SELECT id, title, slug, content,
           (SELECT slug FROM categories WHERE id = articles.category_id) as cat_slug
    FROM articles
    WHERE content SIMILAR TO '%scontent\.fuln%|%instagram\.fuln%'
    ORDER BY title
  `);

  console.log(`Found ${rows.rows.length} articles with broken CDN images\n`);
  let totalFixed = 0, totalRemoved = 0, totalFailed = 0;

  for (const article of rows.rows) {
    const brokenSrcs = extractBrokenSrcs(article.content);
    if (brokenSrcs.length === 0) continue;
    
    console.log(`\n📄 "${article.title}" (${article.cat_slug}/${article.slug}) – ${brokenSrcs.length} broken image(s)`);
    
    let content = article.content;
    
    for (let i = 0; i < brokenSrcs.length; i++) {
      const src = brokenSrcs[i];
      const hash = crypto.createHash('md5').update(src).digest('hex').substring(0, 8);
      const ext = src.includes('.png') ? 'png' : 'jpg';
      const r2Key = `categories/${article.cat_slug}/articles/${article.id}/images/imported_${hash}.${ext}`;
      
      try {
        process.stdout.write(`  [${i+1}/${brokenSrcs.length}] Downloading...`);
        const { buffer, contentType } = await downloadUrl(src);
        const newUrl = await uploadToR2(buffer, contentType, r2Key);
        content = replaceSrc(content, src, newUrl);
        // Also strip inline width/height to make images responsive
        content = content.replace(
          new RegExp(`(<img[^>]*src="${newUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*)\\s*width="[^"]*"\\s*height="[^"]*"`, 'g'),
          '$1'
        );
        console.log(` ✅ → ${newUrl}`);
        totalFixed++;
      } catch (err) {
        console.log(` ❌ Download failed (${err.message}) — removing broken img tag`);
        content = removeBrokenImg(content, src);
        totalRemoved++;
      }
    }
    
    // Update DB with fixed content
    await pool.query(
      'UPDATE articles SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [content, article.id]
    );
    console.log(`  ✅ DB updated`);
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done! Fixed: ${totalFixed} | Removed dead: ${totalRemoved} | Failed: ${totalFailed}`);
  await pool.end();
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
