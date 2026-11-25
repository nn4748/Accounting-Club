# تطبيق نادي المحاسبة (آيفون)

التطبيق مبني بـ Capacitor ويفتح موقع النادي https://accclubimamu.com، ومعه مزايا خاصة بالتطبيق (`js/native.js` بالموقع):
- زر «ذكّرني بالفعالية» بعد التسجيل: إشعار قبل الفعالية بيوم وقبلها بساعة.
- اهتزاز خفيف عند الضغط.

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
