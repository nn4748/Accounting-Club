# تطبيق نادي المحاسبة (آيفون)

التطبيق مبني بـ Capacitor، وواجهته موجودة داخل التطبيق نفسه في مجلد `www`:
- `www/index.html` و `www/app.css` و `www/app.js`: الشاشات الأربع (الرئيسية، الفعاليات، الزيارات، النادي).
- `www/js/data.js`: المحتوى الثابت (من نحن، الأهداف، الأرقام، الأرشيف، الزيارات). عدّليه هنا لما يتغير شي.
- الفعاليات تنقرأ من نفس شيتات الموقع، فأي تعديل بالشيت يطلع بالتطبيق على طول.
- التسجيل والساعات التطوعية والاختبار تفتح صفحات الموقع داخل التطبيق (Safari).
- «ذكّرني بالفعالية»: إشعار قبل الفعالية بيوم وقبلها بساعة.

نصوص صفحة المتجر وصوره وخطوات الرفع: `store/APP_STORE.md`.

## التشغيل على الماك
1. ثبّت Xcode من App Store، و Node.js من nodejs.org.
2. بالترمنال:
   ```
   cd app
   npm install
   npx cap sync ios
   npx cap open ios
   ```
3. في Xcode: اختر App ← Signing & Capabilities ← Team (حسابك)، وشغّل على جوالك أو المحاكي.
4. للرفع: Product ← Archive ← Distribute App ← App Store Connect.

- Bundle ID: `com.accclubimamu.app`
- سياسة الخصوصية: https://accclubimamu.com/privacy
