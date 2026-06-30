#!/usr/bin/env node
// Upload images to Cloudflare R2 and update article content in DB
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load env
require('dotenv').config({ path: '/home/admin/limekb/.env.production' });

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
const DATABASE_URL = process.env.DATABASE_URL;

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const pool = new Pool({ connectionString: DATABASE_URL });

async function uploadToR2(localPath, r2Key) {
  const fileBuffer = fs.readFileSync(localPath);
  console.log(`Uploading ${path.basename(localPath)} (${Math.round(fileBuffer.length/1024)}KB) → ${r2Key}`);
  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: r2Key,
    Body: fileBuffer,
    ContentType: 'image/png',
    CacheControl: 'public, max-age=31536000',
  }));
  const publicUrl = `${R2_PUBLIC_URL}/${r2Key}`;
  console.log(`✅ Uploaded: ${publicUrl}`);
  return publicUrl;
}

async function main() {
  // Image 1: Дуудлага хийх заавар (Call guide) — has broken Facebook CDN image
  const callImgLocal = '/home/admin/.gemini/antigravity/brain/aeabadf1-0c20-4e9c-bde1-d144e6abf3f0/media__1774429517338.png';
  const callR2Key = 'categories/duudlaga/articles/art_1769421210974_spw0lmr30/images/duudlaga_zaavar.png';
  const callImgUrl = await uploadToR2(callImgLocal, callR2Key);

  // Image 2: Аяллын дата авах заавар (Travel data guide)
  const travelImgLocal = '/home/admin/.gemini/antigravity/brain/aeabadf1-0c20-4e9c-bde1-d144e6abf3f0/media__1774429529992.png';
  const travelR2Key = 'categories/esim/articles/art_1769406612709_2z6oxdepj/images/ayallyn_data_zaavar.png';
  const travelImgUrl = await uploadToR2(travelImgLocal, travelR2Key);

  // Update call article — replace broken Facebook CDN image
  console.log('\nUpdating: Монгол дугаарт дуудлага хийх заавар');
  const callRes = await pool.query('SELECT content FROM articles WHERE id = $1', ['art_1769421210974_spw0lmr30']);
  if (callRes.rows.length > 0) {
    let content = callRes.rows[0].content;
    // Replace the broken scontent.fuln5 facebook image with new R2 image
    const newContent = content.replace(
      /<img[^>]*src="https?:\/\/scontent[^"]*"[^>]*>/g,
      `<img src="${callImgUrl}" alt="Дуудлага хийх заавар" style="width:100%;height:auto;display:block;margin:1rem auto;border-radius:8px;">`
    );
    if (newContent !== content) {
      await pool.query('UPDATE articles SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newContent, 'art_1769421210974_spw0lmr30']);
      console.log('✅ Call article updated - broken FB image replaced');
    } else {
      // Prepend image + existing content
      const imgTag = `<p><img src="${callImgUrl}" alt="Дуудлага хийх заавар" style="width:100%;height:auto;display:block;margin:1rem auto;border-radius:8px;"></p>\n`;
      await pool.query('UPDATE articles SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [imgTag + content, 'art_1769421210974_spw0lmr30']);
      console.log('✅ Call article updated - image prepended');
    }
  }

  // Update travel data article — replace existing CDN image with new one
  console.log('\nUpdating: Аяллын дата авах заавар');
  const travelRes = await pool.query('SELECT content FROM articles WHERE id = $1', ['art_1769406612709_2z6oxdepj']);
  if (travelRes.rows.length > 0) {
    let content = travelRes.rows[0].content;
    // Replace existing cdn-kb image (user said images are missing)
    const newContent = content.replace(
      /<img[^>]*src="https?:\/\/cdn-kb\.lime\.mn[^"]*"[^>]*>/g,
      `<img src="${travelImgUrl}" alt="Аяллын дата авах заавар" style="width:100%;height:auto;display:block;margin:1rem auto;border-radius:8px;">`
    );
    if (newContent !== content) {
      await pool.query('UPDATE articles SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newContent, 'art_1769406612709_2z6oxdepj']);
      console.log('✅ Travel data article updated - CDN image replaced');
    } else {
      const imgTag = `<p><img src="${travelImgUrl}" alt="Аяллын дата авах заавар" style="width:100%;height:auto;display:block;margin:1rem auto;border-radius:8px;"></p>\n`;
      await pool.query('UPDATE articles SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [imgTag + content, 'art_1769406612709_2z6oxdepj']);
      console.log('✅ Travel data article updated - image prepended');
    }
  }

  console.log('\n✅ All done!');
  console.log('  Call guide image:   ', callImgUrl);
  console.log('  Travel data image:  ', travelImgUrl);
  await pool.end();
}

main().catch(err => { console.error('FAILED:', err); process.exit(1); });
