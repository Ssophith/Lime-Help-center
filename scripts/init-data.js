const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'data', 'kb.json');

const sampleData = {
  categories: [
    {
      id: 'cat_1',
      slug: 'registration',
      title: {
        mon: 'Хэрэглэгчийн бүртгэл',
        en: 'User Registration',
      },
      order: 1,
      subcategories: [
        {
          id: 'sub_1',
          slug: 'login',
          title: {
            mon: 'Бүртгүүлэх, нэвтрэх',
            en: 'Sign Up, Login',
          },
          order: 1,
          articles: [
            {
              id: 'art_1',
              slug: '001',
              title: {
                mon: 'Toki апп-д бүртгүүлэх заавар',
                en: 'How to register on Toki app',
              },
              content: {
                mon: `Дараах зааврын дагуу Toki апп-д бүртгүүлээрэй.

Toki апп татах бол [Android](https://play.google.com/store/apps/details?id=com.toki.mn), [iOS](https://apps.apple.com/af/app/toki/id1504679492), [Huawei](/other/007) дээр дараарай.

1. Toki апп-д хандан утасны дугаараа оруулан **Үргэлжлүүлэх** дээр дарна.
2. Хувийн мэдээллээ оруулан **Бүртгүүлэх** дээр дарна.
3. Утасны дугаарт ирсэн баталгаажуулах кодыг оруулна.
4. Гүйлгээ хийхдээ ашиглах 4 оронтой код шинээр зохиож оруулна.
5. Бүртгэлээ баталгаажуулан цахим мөнгөний гэрээ байгуулж гүйлгээний лимитээ өсгөх боломжтой эсвэл алгасаж болно.

Танд тусламж хэрэгтэй бол [ЭНД](https://m.me/tokiapplication/?ref=/toki_agent) дарж онлайн ажилтантай холбогдоорой.`,
                en: `Follow these steps to register on the Toki app.

Download the Toki app from [Android](https://play.google.com/store/apps/details?id=com.toki.mn), [iOS](https://apps.apple.com/af/app/toki/id1504679492), or [Huawei](/other/007).

1. Open the Toki app and enter your phone number, then tap **Continue**.
2. Enter your personal information and tap **Register**.
3. Enter the verification code sent to your phone number.
4. Create and enter a new 4-digit PIN for transactions.
5. You can verify your account and sign an electronic money agreement to increase your transaction limit, or skip this step.

If you need help, click [HERE](https://m.me/tokiapplication/?ref=/toki_agent) to contact an online agent.`,
              },
              order: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        },
      ],
    },
    {
      id: 'cat_2',
      slug: 'wallet',
      title: {
        mon: 'Хэтэвч',
        en: 'Wallet',
      },
      order: 2,
      subcategories: [
        {
          id: 'sub_2',
          slug: 'balance',
          title: {
            mon: 'Toki данс',
            en: 'Toki Account',
          },
          order: 1,
          articles: [],
        },
      ],
    },
  ],
  faqs: [
    {
      id: 'faq_1',
      title: {
        mon: 'Toki апп-р байрны төлбөр төлөх заавар',
        en: 'How to pay apartment fees using Toki app',
      },
      content: {
        mon: 'Байрны төлбөр төлөх заавар...',
        en: 'Instructions for paying apartment fees...',
      },
      order: 1,
      createdAt: new Date().toISOString(),
    },
  ],
};

// Ensure data directory exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Write sample data
fs.writeFileSync(DATA_FILE, JSON.stringify(sampleData, null, 2), 'utf-8');
console.log('✅ Sample data initialized at:', DATA_FILE);
