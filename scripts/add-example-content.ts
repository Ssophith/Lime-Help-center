#!/usr/bin/env tsx

/**
 * Script to add example articles and FAQs to the database
 * Usage: npm run add-examples
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Example articles for categories with less than 3 articles
const exampleArticles = [
  {
    categorySlug: 'pay',
    articles: [
      {
        slug: 'lime-nugt-ashiglah',
        title: 'LIME нэгж ашиглах заавар',
        content: `# LIME нэгж ашиглах заавар

LIME нэгж нь таны утасны дуудлага, мессеж, дата ашиглалтыг төлөх боломжтой бөгөөд маш хялбар ашигладаг.

## Нэгж авах арга замууд:

1. **LIME апп-аар**: LIME апп-аа нээж "Нэгж авах" хэсэг рүү очно
2. **Банкны картаар**: Банкны картаа ашиглан нэгж худалдан авна
3. **Банкны дансаар**: Банкны дансаа ашиглан шилжүүлэх боломжтой

## Нэгж ашиглах:

- Нэгж нь автоматаар таны үйлчилгээнд хэрэглэгдэнэ
- Дуудлага, мессеж, дата ашиглалтын төлбөрт автоматаар хэрэглэгдэнэ
- Нэгжийн үлдэгдэл хэмжээг LIME апп-аар шалгах боломжтой

Танд тусламж хэрэгтэй бол [ЭНД](https://support.onlime.mn) дарж холбогдоорой.`,
        excerpt: 'LIME нэгж авах, ашиглах зааварчилгаа',
        order: 1,
      },
      {
        slug: 'tulbur-toloh',
        title: 'Төлбөр төлөх заавар',
        content: `# Төлбөр төлөх заавар

LIME үйлчилгээний төлбөрөө хэрхэн төлөх талаарх зааварчилгаа.

## Төлбөр төлөх арга замууд:

### 1. LIME нэгж ашиглах
- LIME нэгж худалдан авснаар төлбөрөө төлөх боломжтой
- Нэгж нь автоматаар таны үйлчилгээнд хэрэглэгдэнэ

### 2. Банкны картаар
- LIME апп-аар банкны картаа бүртгүүлж төлбөр төлөх
- Visa, Mastercard зэрэг олон улсын картууд дэмжигддэг

### 3. Банкны дансаар
- Банкны дансаа ашиглан шилжүүлэх боломжтой
- Банкны апп эсвэл интернэт банкаар шилжүүлэх боломжтой

## Төлбөрийн мэдээлэл:

- Төлбөрийн хугацаа: Сар бүрийн эхний өдөр
- Төлбөрийн хэмжээ: Таны сонгосон багцын үнэ
- Төлбөрийн түүх: LIME апп-аар харах боломжтой

Танд тусламж хэрэгтэй бол [ЭНД](https://support.onlime.mn) дарж холбогдоорой.`,
        excerpt: 'LIME үйлчилгээний төлбөр төлөх зааварчилгаа',
        order: 2,
      },
      {
        slug: 'bagts-sungah',
        title: 'Багц сунгах заавар',
        content: `# Багц сунгах заавар

LIME багцаа хэрхэн сунгах талаарх зааварчилгаа.

## Багц сунгах арга замууд:

### 1. LIME апп-аар
- LIME апп-аа нээнэ
- "Багц" хэсэг рүү очно
- "Багц сунгах" товч дээр дарна
- Хүссэн хугацаагаа сонгоно

### 2. Автомат сунгалт
- Автомат сунгалтыг идэвхжүүлэх боломжтой
- Багц дуусахаас өмнө автоматаар сунгагдана
- Нэгж таны данснаас автоматаар хасна

## Багц сунгах хугацаа:

- 1 сар
- 3 сар
- 6 сар
- 12 сар

## Анхаарах зүйлс:

- Багц сунгахын өмнө нэгж хангалттай эсэхийг шалгана
- Багц сунгаснаар таны одоогийн багц үргэлжилнэ
- Багц сунгах үнэ нь таны сонгосон хугацаанаас хамаарна

Танд тусламж хэрэгтэй бол [ЭНД](https://support.onlime.mn) дарж холбогдоорой.`,
        excerpt: 'LIME багц сунгах зааварчилгаа',
        order: 3,
      },
    ],
  },
  {
    categorySlug: 'data',
    articles: [
      {
        slug: 'data-avah',
        title: 'Дата авах заавар',
        content: `# Дата авах заавар

LIME-аар дата хэрхэн авах талаарх зааварчилгаа.

## Дата авах арга замууд:

### 1. LIME апп-аар
- LIME апп-аа нээнэ
- "Дата" хэсэг рүү очно
- Хүссэн дата багцаа сонгоно
- Нэгж ашиглан худалдан авна

### 2. Багц сонгох
- Өдөр тутмын дата багц
- Сар бүрийн дата багц
- Аяллын дата багц

## Дата ашиглах:

- Дата нь автоматаар таны утасанд идэвхжинэ
- Дата ашиглалтыг LIME апп-аар хянах боломжтой
- Дата дуусахаас өмнө мэдэгдэл ирнэ

## Дата багцууд:

- 1GB - 1GB дата
- 5GB - 5GB дата
- 10GB - 10GB дата
- Хязгааргүй - Хязгааргүй дата

Танд тусламж хэрэгтэй бол [ЭНД](https://support.onlime.mn) дарж холбогдоорой.`,
        excerpt: 'LIME-аар дата авах зааварчилгаа',
        order: 1,
      },
      {
        slug: 'ayalyn-data',
        title: 'Аяллын дата авах заавар',
        content: `# Аяллын дата авах заавар

Гадаадад аялах үед дата авах зааварчилгаа.

## Аяллын дата багц:

LIME нь олон улсын дата багц санал болгодог бөгөөд гадаадад аялах үед интернэт ашиглах боломжтой.

## Аяллын дата авах:

1. LIME апп-аа нээнэ
2. "Аяллын дата" хэсэг рүү очно
3. Аялах улсаа сонгоно
4. Хүссэн дата багцаа худалдан авна

## Аяллын дата багцууд:

- 1GB - 1GB дата (7 хоног)
- 3GB - 3GB дата (14 хоног)
- 5GB - 5GB дата (30 хоног)

## Анхаарах зүйлс:

- Аяллын дата багц нь тодорхой хугацаанд хүчинтэй
- Багц дуусахаас өмнө мэдэгдэл ирнэ
- Олон улсын роуминг үйлчилгээ идэвхтэй байх шаардлагатай

Танд тусламж хэрэгтэй бол [ЭНД](https://support.onlime.mn) дарж холбогдоорой.`,
        excerpt: 'Гадаадад аялах үед дата авах зааварчилгаа',
        order: 2,
      },
      {
        slug: 'data-hamgaalakh',
        title: 'Дата хамгаалах заавар',
        content: `# Дата хамгаалах заавар

Дата хэрхэн хэмнэх, хамгаалах талаарх зааварчилгаа.

## Дата хэмнэх арга замууд:

### 1. Дата хяналт
- LIME апп-аар дата ашиглалтаа хянах
- Хамгийн их дата ашигладаг аппуудыг тодорхойлох
- Дата ашиглалтын мэдэгдэл авах

### 2. WiFi ашиглах
- WiFi сүлжээнд холбогдох үед дата ашиглахгүй
- Гэрийн WiFi эсвэл нийтийн WiFi ашиглах
- WiFi-г утасны тохиргоонд идэвхжүүлэх

### 3. Дата хэмнэх горим
- Утасны тохиргоонд дата хэмнэх горимыг идэвхжүүлэх
- Зураг, видеог автоматаар шахах
- Аппуудын дата ашиглалтыг хязгаарлах

## Дата хамгаалах:

- Дата багц дуусахаас өмнө мэдэгдэл авах
- Дата ашиглалтын хязгаар тогтоох
- Дата дуусахад автоматаар зогсоох

Танд тусламж хэрэгтэй бол [ЭНД](https://support.onlime.mn) дарж холбогдоорой.`,
        excerpt: 'Дата хэмнэх, хамгаалах зааварчилгаа',
        order: 3,
      },
    ],
  },
  {
    categorySlug: 'challange',
    articles: [
      {
        slug: 'challenge-avah',
        title: 'Challenge авах заавар',
        content: `# Challenge авах заавар

LIME Challenge үйлчилгээ авах зааварчилгаа.

## Challenge гэж юу вэ?

Challenge нь LIME-ийн онцгой урамшууллын үйлчилгээ бөгөөд танд илүү их дата, нэгж эсвэл бусад урамшуулал өгөх боломжтой.

## Challenge авах:

1. LIME апп-аа нээнэ
2. "Challenge" хэсэг рүү очно
3. Боломжтой Challenge-уудыг харах
4. Challenge-д оролцоно

## Challenge төрлүүд:

- **Дата Challenge**: Тодорхой хэмжээний дата авах
- **Нэгж Challenge**: Нэгж худалдан авах
- **Хэрэглэлт Challenge**: Тодорхой хэмжээний үйлчилгээ ашиглах

## Challenge-д оролцох нөхцөл:

- LIME үйлчилгээнд бүртгүүлсэн байх
- Challenge-ийн нөхцөлийг биелүүлэх
- Challenge-ийн хугацаанд оролцох

Танд тусламж хэрэгтэй бол [ЭНД](https://support.onlime.mn) дарж холбогдоорой.`,
        excerpt: 'LIME Challenge үйлчилгээ авах зааварчилгаа',
        order: 1,
      },
      {
        slug: 'challenge-yumshuulal',
        title: 'Challenge урамшуулал авах',
        content: `# Challenge урамшуулал авах

Challenge-д оролцож урамшуулал авах зааварчилгаа.

## Урамшуулал авах:

Challenge-ийн нөхцөлийг биелүүлсний дараа урамшуулал таны дансанд автоматаар нэмэгдэнэ.

## Урамшууллын төрлүүд:

- **Дата урамшуулал**: Нэмэлт дата багц
- **Нэгж урамшуулал**: Нэмэлт нэгж
- **Хөнгөлөлт**: Дараагийн багц дээр хөнгөлөлт

## Урамшуулал ашиглах:

- Урамшуулал нь автоматаар таны үйлчилгээнд хэрэглэгдэнэ
- Урамшууллын үлдэгдэл хэмжээг LIME апп-аар харах боломжтой
- Урамшуулал нь тодорхой хугацаанд хүчинтэй

## Анхаарах зүйлс:

- Challenge-ийн нөхцөлийг анхааралтай уншина уу
- Урамшууллын хугацааг шалгана уу
- Урамшуулал ашиглахын өмнө нөхцөлийг шалгана уу

Танд тусламж хэрэгтэй бол [ЭНД](https://support.onlime.mn) дарж холбогдоорой.`,
        excerpt: 'Challenge урамшуулал авах, ашиглах зааварчилгаа',
        order: 2,
      },
      {
        slug: 'challenge-nuhtsol',
        title: 'Challenge нөхцөл',
        content: `# Challenge нөхцөл

LIME Challenge-ийн нөхцөл, дүрэм.

## Challenge нөхцөл:

### 1. Оролцох нөхцөл
- LIME үйлчилгээнд бүртгүүлсэн байх
- Challenge-ийн хугацаанд оролцох
- Challenge-ийн нөхцөлийг биелүүлэх

### 2. Урамшуулал авах
- Challenge-ийн нөхцөлийг биелүүлсний дараа урамшуулал авах
- Урамшуулал нь автоматаар таны дансанд нэмэгдэнэ
- Урамшууллын хэмжээ нь Challenge-ийн төрлөөс хамаарна

### 3. Урамшуулал ашиглах
- Урамшуулал нь тодорхой хугацаанд хүчинтэй
- Урамшуулал нь автоматаар ашиглагдана
- Урамшууллын үлдэгдэл хэмжээг LIME апп-аар харах боломжтой

## Challenge дүрэм:

- Challenge-д зөвхөн нэг удаа оролцох боломжтой
- Challenge-ийн нөхцөлийг зөрчихгүй байх
- Challenge-ийн хугацааг дагах

Танд тусламж хэрэгтэй бол [ЭНД](https://support.onlime.mn) дарж холбогдоорой.`,
        excerpt: 'LIME Challenge нөхцөл, дүрэм',
        order: 3,
      },
    ],
  },
];

// Example FAQs
const exampleFAQs = [
  {
    title: 'LIME нэгж гэж юу вэ?',
    content: `LIME нэгж нь таны утасны дуудлага, мессеж, дата ашиглалтыг төлөх боломжтой бөгөөд маш хялбар ашигладаг. Нэгж нь автоматаар таны үйлчилгээнд хэрэглэгдэнэ.

Нэгж авах арга замууд:
- LIME апп-аар нэгж худалдан авах
- Банкны картаар нэгж худалдан авах
- Банкны дансаар шилжүүлэх

Нэгжийн үлдэгдэл хэмжээг LIME апп-аар шалгах боломжтой.`,
    order: 0,
  },
  {
    title: 'Хэрхэн дата авах вэ?',
    content: `LIME-аар дата авах нь маш хялбар:

1. LIME апп-аа нээнэ
2. "Дата" хэсэг рүү очно
3. Хүссэн дата багцаа сонгоно
4. Нэгж ашиглан худалдан авна

Дата нь автоматаар таны утасанд идэвхжинэ. Дата ашиглалтыг LIME апп-аар хянах боломжтой.

Дата багцууд:
- 1GB дата
- 5GB дата
- 10GB дата
- Хязгааргүй дата`,
    order: 1,
  },
  {
    title: 'Багц хэрхэн сунгах вэ?',
    content: `Багц сунгах нь маш хялбар:

1. LIME апп-аа нээнэ
2. "Багц" хэсэг рүү очно
3. "Багц сунгах" товч дээр дарна
4. Хүссэн хугацаагаа сонгоно

Багц сунгах хугацаа:
- 1 сар
- 3 сар
- 6 сар
- 12 сар

Автомат сунгалтыг идэвхжүүлснээр багц дуусахаас өмнө автоматаар сунгагдана. Нэгж таны данснаас автоматаар хасна.`,
    order: 2,
  },
];

async function addExampleContent() {
  try {
    console.log('Starting to add example content...');

    // Add articles
    for (const categoryData of exampleArticles) {
      const categoryResult = await pool.query(
        'SELECT id FROM categories WHERE slug = $1',
        [categoryData.categorySlug]
      );

      if (categoryResult.rows.length === 0) {
        console.log(`Category ${categoryData.categorySlug} not found, skipping...`);
        continue;
      }

      const categoryId = categoryResult.rows[0].id;
      const existingArticles = await pool.query(
        'SELECT COUNT(*) as count FROM articles WHERE category_id = $1',
        [categoryId]
      );

      const existingCount = parseInt(existingArticles.rows[0].count);
      if (existingCount >= 3) {
        console.log(`Category ${categoryData.categorySlug} already has ${existingCount} articles, skipping...`);
        continue;
      }

      console.log(`Adding articles to category: ${categoryData.categorySlug}...`);

      for (const article of categoryData.articles) {
        // Check if article already exists
        const existing = await pool.query(
          'SELECT id FROM articles WHERE slug = $1 AND category_id = $2',
          [article.slug, categoryId]
        );

        if (existing.rows.length > 0) {
          console.log(`Article ${article.slug} already exists, skipping...`);
          continue;
        }

        const articleId = `art_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await pool.query(
          `INSERT INTO articles (id, category_id, slug, title, content, excerpt, "order", created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
          [
            articleId,
            categoryId,
            article.slug,
            article.title,
            article.content,
            article.excerpt,
            article.order,
          ]
        );
        console.log(`✓ Added article: ${article.title}`);
      }
    }

    // Add FAQs
    console.log('\nAdding example FAQs...');
    const existingFAQs = await pool.query('SELECT COUNT(*) as count FROM faqs');
    const existingFAQCount = parseInt(existingFAQs.rows[0].count);

    if (existingFAQCount >= 3) {
      console.log(`Already have ${existingFAQCount} FAQs, skipping...`);
    } else {
      for (const faq of exampleFAQs) {
        // Check if FAQ already exists
        const existing = await pool.query(
          'SELECT id FROM faqs WHERE title = $1',
          [faq.title]
        );

        if (existing.rows.length > 0) {
          console.log(`FAQ "${faq.title}" already exists, skipping...`);
          continue;
        }

        const faqId = `faq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await pool.query(
          `INSERT INTO faqs (id, title, content, "order", created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [faqId, faq.title, faq.content, faq.order]
        );
        console.log(`✓ Added FAQ: ${faq.title}`);
      }
    }

    console.log('\n✓ Example content added successfully!');
  } catch (error) {
    console.error('Error adding example content:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addExampleContent();
