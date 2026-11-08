# تفعيل حفظ نتائج الاختبار وشاشة المستويات (Firebase)

الاختبار في `/quiz` يعمل بدون Firebase، لكن النتائج لا تُحفظ وشاشة `/live-display` تعرض رسالة "غير مفعّلة" حتى تكمل الخطوات التالية.

1. أنشئ مشروعًا في https://console.firebase.google.com
2. **Firestore Database** ← Create database (Production mode).
3. **Authentication** ← Sign-in method ← فعّل **Email/Password**.
4. Project settings ← Your apps ← أضف تطبيق **Web** وانسخ قيم `firebaseConfig`.
5. في Netlify: Site configuration ← Environment variables، أضف:
   `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`
   ثم Deploys ← Trigger deploy.
6. Firestore ← Rules: الصق محتوى ملف `firestore.rules` واضغط Publish.
7. Authentication ← Users ← Add user (بريد وكلمة مرور المشرف)، وانسخ الـ **User UID**.
8. Firestore ← Start collection باسم `admins`، ومعرّف المستند = الـ UID، وأضف حقل `role` = `admin`.

بعدها: افتح `/live-display` وسجّل الدخول بحساب المشرف.

> لا ترفع أي مفاتيح أو كلمات مرور إلى GitHub. القيم في الخطوة 5 تُحفظ في Netlify فقط.
