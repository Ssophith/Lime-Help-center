const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'data', 'kb.json');

// Content structure - articles directly in categories (no LIME Mongolia wrapper)
const limeData = {
  categories: [
    {
      id: 'cat_esim',
      slug: 'esim',
      title: {
        mon: 'eSIM',
        en: 'eSIM',
      },
      description: {
        mon: 'eSIM-ийн зааварчилгаа',
        en: 'eSIM guides',
      },
      icon: '/icons/esim-icon.svg',
      order: 1,
      subcategories: [
        {
          id: 'sub_esim_main',
          slug: 'main',
          title: {
            mon: 'eSIM',
            en: 'eSIM',
          },
          order: 1,
          articles: [
            {
              id: 'art_android_esim',
              slug: 'android-esim',
              title: {
                mon: 'Android дээр дата eSIM авах заавар',
                en: 'How to get eSIM data on Android',
              },
              content: {
                mon: `# Android дээр дата eSIM авах заавар

![Android eSIM](https://support.onlime.mn/galleryDocuments/edbsn555a7dd7e7bc1010c99515d15001e9e846b59a2f6e530105a1d3d3b73db29b9ffff061aa3ecc62ffe8de100bacbc23d7?inline=true)

Android утас дээр eSIM авах заавар.

**Алхам 1:** LIME апп-аа нээнэ
**Алхам 2:** eSIM хэсэг рүү очно
**Алхам 3:** Захиалга өгнө

Танд тусламж хэрэгтэй бол [ЭНД](https://support.onlime.mn) дарж холбогдоорой.`,
                en: `# How to get eSIM data on Android

![Android eSIM](https://support.onlime.mn/galleryDocuments/edbsn555a7dd7e7bc1010c99515d15001e9e846b59a2f6e530105a1d3d3b73db29b9ffff061aa3ecc62ffe8de100bacbc23d7?inline=true)

Instructions for getting eSIM on Android phone.

**Step 1:** Open LIME app
**Step 2:** Go to eSIM section
**Step 3:** Place order

If you need help, click [HERE](https://support.onlime.mn) to contact us.`,
              },
              order: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'art_iphone_esim',
              slug: 'iphone-esim',
              title: {
                mon: 'iPhone дээр дата eSIM авах заавар',
                en: 'How to get eSIM data on iPhone',
              },
              content: {
                mon: `# iPhone дээр дата eSIM авах заавар

iPhone утас дээр eSIM авах заавар.

**Алхам 1:** LIME апп-аа нээнэ
**Алхам 2:** eSIM хэсэг рүү очно
**Алхам 3:** Захиалга өгнө

Танд тусламж хэрэгтэй бол [ЭНД](https://support.onlime.mn) дарж холбогдоорой.`,
                en: `# How to get eSIM data on iPhone

Instructions for getting eSIM on iPhone.

**Step 1:** Open LIME app
**Step 2:** Go to eSIM section
**Step 3:** Place order

If you need help, click [HERE](https://support.onlime.mn) to contact us.`,
              },
              order: 2,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        },
      ],
    },
    {
      id: 'cat_basics',
      slug: 'basics',
      title: {
        mon: 'Үндсэн',
        en: 'Basics',
      },
      description: {
        mon: 'Үндсэн зааварчилгаа',
        en: 'Basic guides',
      },
      icon: '/icons/basics-icon.svg',
      order: 2,
      subcategories: [
        {
          id: 'sub_basics_main',
          slug: 'main',
          title: {
            mon: 'Үндсэн',
            en: 'Basics',
          },
          order: 1,
          articles: [
            {
              id: 'art_login',
              slug: 'login',
              title: {
                mon: 'Нэвтрэх заавар',
                en: 'Login guide',
              },
              content: {
                mon: `# Нэвтрэх заавар

LIME системд нэвтрэх заавар.

1. LIME апп-аа нээнэ
2. Утасны дугаар болон нууц үгээ оруулна
3. Нэвтрэх товч дээр дарна`,
                en: `# Login guide

Instructions for logging into LIME system.

1. Open LIME app
2. Enter phone number and password
3. Click login button`,
              },
              order: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'art_call',
              slug: 'call',
              title: {
                mon: 'Дуудлага хийх заавар',
                en: 'How to make a call',
              },
              content: {
                mon: `# Дуудлага хийх заавар

LIME-аар дуудлага хийх заавар.`,
                en: `# How to make a call

Instructions for making calls with LIME.`,
              },
              order: 2,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'art_message',
              slug: 'message',
              title: {
                mon: 'Мессеж бичих заавар',
                en: 'How to send a message',
              },
              content: {
                mon: `# Мессеж бичих заавар

LIME-аар мессеж илгээх заавар.`,
                en: `# How to send a message

Instructions for sending messages with LIME.`,
              },
              order: 3,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'art_travel_data',
              slug: 'travel-data',
              title: {
                mon: 'Аяллын дата авах заавар',
                en: 'How to get travel data',
              },
              content: {
                mon: `# Аяллын дата авах заавар

Аялалд явахдаа дата авах заавар.`,
                en: `# How to get travel data

Instructions for getting data when traveling.`,
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

fs.writeFileSync(DATA_FILE, JSON.stringify(limeData, null, 2), 'utf-8');
console.log('✅ LIME content restructured - articles now visible on homepage!');
console.log('📝 Categories: eSIM, Үндсэн (Basics)');
console.log('📝 Note: Article content is placeholder - update with actual content from support.onlime.mn');
