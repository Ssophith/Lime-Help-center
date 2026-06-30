const fs = require('fs');
const path = require('path');

// This script will help scrape content from support.onlime.mn
// You'll need to manually visit pages and copy content, or use a headless browser

const DATA_FILE = path.join(process.cwd(), 'data', 'kb.json');

// Sample structure based on what we saw on support.onlime.mn
const onlimeData = {
  categories: [
    {
      id: 'cat_lime_1',
      slug: 'lime-mongolia',
      title: {
        mon: 'LIME Mongolia',
        en: 'LIME Mongolia',
      },
      description: {
        mon: 'LIME-ийн тусламж, зааварчилгаа',
        en: 'LIME support and guides',
      },
      icon: '/icons/lime-logo.svg', // You'll need to add this icon
      order: 1,
      subcategories: [
        {
          id: 'sub_lime_1',
          slug: 'esim',
          title: {
            mon: 'eSIM',
            en: 'eSIM',
          },
          order: 1,
          articles: [
            {
              id: 'art_lime_1',
              slug: 'android-esim',
              title: {
                mon: 'Android дээр дата eSIM авах заавар',
                en: 'How to get eSIM data on Android',
              },
              content: {
                mon: 'Android дээр eSIM авах заавар...',
                en: 'Instructions for getting eSIM on Android...',
              },
              order: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'art_lime_2',
              slug: 'iphone-esim',
              title: {
                mon: 'iPhone дээр дата eSIM авах заавар',
                en: 'How to get eSIM data on iPhone',
              },
              content: {
                mon: 'iPhone дээр eSIM авах заавар...',
                en: 'Instructions for getting eSIM on iPhone...',
              },
              order: 2,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        },
        {
          id: 'sub_lime_2',
          slug: 'basics',
          title: {
            mon: 'Үндсэн',
            en: 'Basics',
          },
          order: 2,
          articles: [
            {
              id: 'art_lime_3',
              slug: 'login',
              title: {
                mon: 'Нэвтрэх заавар',
                en: 'Login guide',
              },
              content: {
                mon: 'Нэвтрэх заавар...',
                en: 'Login instructions...',
              },
              order: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'art_lime_4',
              slug: 'call',
              title: {
                mon: 'Дуудлага хийх заавар',
                en: 'How to make a call',
              },
              content: {
                mon: 'Дуудлага хийх заавар...',
                en: 'Call instructions...',
              },
              order: 2,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'art_lime_5',
              slug: 'message',
              title: {
                mon: 'Мессеж бичих заавар',
                en: 'How to send a message',
              },
              content: {
                mon: 'Мессеж бичих заавар...',
                en: 'Message instructions...',
              },
              order: 3,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'art_lime_6',
              slug: 'travel-data',
              title: {
                mon: 'Аяллын дата авах заавар',
                en: 'How to get travel data',
              },
              content: {
                mon: 'Аяллын дата авах заавар...',
                en: 'Travel data instructions...',
              },
              order: 4,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        },
      ],
    },
  ],
  faqs: [],
};

// Merge with existing data or replace
const existingData = fs.existsSync(DATA_FILE) 
  ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
  : { categories: [], faqs: [] };

// Replace with onlime data
const newData = {
  categories: onlimeData.categories,
  faqs: existingData.faqs,
};

fs.writeFileSync(DATA_FILE, JSON.stringify(newData, null, 2), 'utf-8');
console.log('✅ LIME data structure created!');
console.log('📝 Next: Visit support.onlime.mn articles and update content manually');
console.log('   Or use a browser automation tool to scrape content');
