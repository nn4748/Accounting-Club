# تسليم: تطبيق نادي المحاسبة (آيفون) — الخطوة الجاية: تطبيق مستقل ١٠٠٪

هذا الملف يلخّص كل شي صار في محادثة التطبيق، عشان أي جلسة ثانية تكمل بدون ما تدوّر.
**الرد على نورة يكون بالعربي البسيط.**

---

## ١. وين وصلنا (٢٧ نوفمبر ٢٠٢٦)

- **App Store:** الإصدار **1.0 (build 1)** انرسل للمراجعة ٢٧ نوفمبر ٦:٣٣م — الحالة *Waiting for Review*.
  - App Store Connect: التطبيق «نادي المحاسبة | جامعة الإمام»، Apple ID `6839405161`، Bundle ID `com.accclubimamu.app`.
  - حساب المطور **فردي** باسم Nuorah Aleissa، Team ID **`JAX72A2477`**. حساب نورة الشخصي مضاف **Admin** (يقدر يعدّل App Store Connect، بس ما يقدر يدخل Certificates/Identifiers — هذي للمالك فقط).
  - شلنا **China mainland** من الدول (تطلب أوراق أمنية).
  - خطاب موافقة رئيس النادي (محمد الخراشي) مرفوع في App Review → Attachment. نسخة Word على سطح المكتب: «خطاب موافقة نادي المحاسبة.docx».
  - نصوص صفحة المتجر وخطوات الرفع: `app/store/APP_STORE.md`، والصور: `app/store/screenshots` (6.9") و `app/store/screenshots-6.3`.
- **بطاقات العضوية (Apple Wallet):** شغّالة ومدموجة في `main` (#247 → #252). التفاصيل في القسم ٥.

## ٢. بنية التطبيق الحالية

- Capacitor 8، المجلد `app/`. الواجهة كلها محلية في `app/www` (ما يفتح الموقع):
  - `index.html` / `app.css` / `app.js` — أربع تبويبات: الرئيسية، الفعاليات (متاحة/القادمة/أرشيفنا)، الزيارات، النادي.
  - `js/data.js` — المحتوى الثابت (من نحن، الرؤية، الأهداف، الأرقام، الأرشيف، الزيارات، السوشال، نموذج التواصل).
  - `js/event-sheet.js` — نسخة من `js/event-sheet.js` حق الموقع (حالة الفعالية، الحد، صور Drive).
  - الخطوط Almarai محلية في `www/fonts`، والصور في `www/assets`.
- البيانات الحيّة: الفعاليات من Apps Script `…/exec` (نفس `API_URL` في `js/home.js`)، والقادمة من شيت CSV `1OSnNAbCPm22…`.
- Plugins: App, Browser (SFSafariViewController), Haptics, LocalNotifications (تذكير قبل الفعالية بيوم وبساعة), SplashScreen, StatusBar. (شلنا PushNotifications.)
- الأيقونة: خلفية بيضاء وشعار كحلي (`AppIcon-512@2x.png`).
- آيفون فقط، عمودي، arm64، `ITSAppUsesNonExemptEncryption = NO`.

## ٣. المطلوب: يصير التطبيق مستقل ١٠٠٪ عن الموقع (إصدار 1.1)

الحين هذي الأشياء **تفتح صفحات الموقع** داخل Safari (`openSite(...)` في `app.js` و `D.tools` في `data.js`):

| الميزة | صفحة الموقع | كيف تشتغل في الموقع | كيف تنبني بالتطبيق |
|---|---|---|---|
| **التسجيل بالفعاليات** (الأهم) | `register.html` + `js/register-checks.js` | ياخذ `form` من شيت الفعاليات، ويجيب أرقام حقول نموذج Google من `/.netlify/functions/form-fields?id=FORM_ID` (الاسم/الجوال/الإيميل/التخصص)، يتحقق من الحد (`limit` + `responses` CSV أو `REGISTRATIONS_CSV_URL`)، ويرسل POST `no-cors` إلى `https://docs.google.com/forms/d/e/FORM_ID/formResponse`. تحققات: تصحيح نطاق الإيميل، الجوال 05XXXXXXXX، منع التكرار بنفس الإيميل. بعد التسجيل: أزرار `map` و `whatsapp` من الشيت. | شاشة نموذج داخل الورقة السفلية للفعالية: نفس المنطق بالضبط. استدعِ `https://accclubimamu.com/.netlify/functions/form-fields?id=…` بالرابط الكامل (أو انقل التحليل للتطبيق)، وأرسل للنموذج بـ `fetch` no-cors. بعد النجاح: زر «ذكّرني» + أزرار الموقع والقروب. |
| **ساعاتي التطوعية** | `volunteer-hours.html` | CSV `1rsmJRtDDdZHWwssFYTG6wmKiOSdVw0irFXE8i3gjC90`، بحث بالرقم الجامعي. | شاشة بحث بسيطة بنفس الـCSV. **انتبه:** الشيت فيه بيانات شخصية — اعرض نتيجة الرقم المكتوب فقط ولا تخزن الملف كامل. |
| **شخصيتك المحاسبية** | `quiz.html` + `js/quiz/*` (quiz-data, scoring, quiz-service, firebase, share-card) | ES modules، ويحفظ النتائج في Firebase. | انسخ `quiz-data.js` و `scoring.js` للتطبيق وابنِ الواجهة؛ Firebase اختياري (لو تبون لوحة النتائج الحية). |
| **ابنِ شركتك** | `company-builder.html` + `js/company-builder.js` | محلي بالكامل (ما فيه طلبات شبكة). | أسهل وحدة: انقل المنطق كما هو. |
| **سياسة الخصوصية** | `privacy.html` | صفحة نص. | انسخ النص لشاشة داخل التطبيق (الرابط يبقى في App Store Connect لأن Apple تطلبه). |

بعدها: احذف `openSite` والـ `Browser` plugin لو ما عاد له استخدام، وحدّث `app/store/APP_STORE.md` وملاحظات المراجع (ما عاد فيه شي يفتح الموقع).

**تنبيه مهم:** ما ينفع يكون فيه إصداران تحت المراجعة. لو 1.0 لسه *Waiting for Review* لما يجهز 1.1: إما ننتظر قبول 1.0، أو نسحبه (Remove from Review) ونرسل 1.1 بداله.

## ٤. طريقة بناء ورفع نسخة جديدة (مجرّبة)

```bash
cd app
npx cap sync ios
```

١. ارفع `CURRENT_PROJECT_VERSION` (build) و `MARKETING_VERSION` (مثلًا 1.1) في `app/ios/App/App.xcodeproj/project.pbxproj`. `DEVELOPMENT_TEAM = JAX72A2477` موجود في فرع `app-signing-team` (ادمجه أول).
٢. **Archive بدون توقيع** (التوقيع وقت الـArchive يفشل: الفريق ما عنده أجهزة مسجلة):
```bash
xcodebuild -project app/ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath /tmp/AccClub.xcarchive \
  CODE_SIGNING_ALLOWED=NO archive
```
٣. **Export + Upload** (Xcode يوقّع بشهادة Apple Distribution تلقائيًا؛ لازم Xcode يكون مسجّل بحساب المطور):
ExportOptions.plist: `method = app-store-connect`، `destination = upload`، `signingStyle = automatic`، `teamID = JAX72A2477`.
```bash
xcodebuild -exportArchive -archivePath /tmp/AccClub.xcarchive -exportPath /tmp/upload \
  -exportOptionsPlist ExportOptions.plist -allowProvisioningUpdates
```
٤. في App Store Connect: أنشئ نسخة جديدة (+ Version)، اختر الـBuild، **Add for Review**.

- Node.js مثبّت في `~/.local/node/bin` (أضفه للـPATH). محاكي iOS 27.2 مثبّت.
- الرفع لـGitHub من الترمنال ما يشتغل (ما فيه دخول)؛ نستخدم **GitHub Desktop** (مسجّل) ← Publish branch، وبعدين PR من github.com.

## ٥. بطاقات العضوية (للمعلومية)

- `netlify/functions/members.js` + `pass-assets.js` + `pass-certs.js`، وصفحة الأعضاء `hr-members.html`، وبطاقة الويب `m.html` (`/m/<token>`).
- Pass Type ID: `pass.com.accclubimamu.membership`. الشهادة و WWDR داخل `pass-certs.js` (عامة).
- المفتاح الخاص **في Netlify فقط**: `PASS_KEY_PEM_B64` + `PASS_KEY_PASSPHRASE`. نسخة محلية في `app/wallet-secrets/` (مستثنى من git — لا ترفعه أبدًا).
- **لا تضيف `PASS_CERT_PEM_B64` / `PASS_WWDR_PEM_B64` في Netlify:** متغيرات البيئة لازم أقل من 4KB وإلا تفشل كل الدوال (خطأ 400 عند رفع الدوال).
- التصميم المعتمد (نوع generic، كحلي): الشعار مع «نادي المحاسبة» فوق يمين (thumbnail)، الصف الأول الاسم يمين + المنصب، الصف الثاني الإدارة - اللجنة يمين + رقم العضوية، والـQR يفتح `/m/<token>`.
- اللجنة تنقرأ من المنصب لو فيه «لجنة …» (بالشيت بعض عناوين الأقسام فيها رقم بالعمود الأول).
- **تعلّمنا:** أي تعديل على شكل البطاقة يتجرّب على جوال نورة قبل الرفع — نبني `.pkpass` محليًا وترسله لجوالها بـAirDrop. المعاينات بالمتصفح كانت مضلّلة.

## ٦. ملاحظات عامة

- الإيميل (Resend) شغّال؛ `send.accclubimamu.com` مربوط بـ Hostinger Reach (CNAME) — لا تلمسه.
- ما فيه مدفوعات ولا تتبع؛ أسئلة الخصوصية: الاسم، الإيميل، الجوال، التخصص، نص رسالة «تواصل معنا» — App Functionality، Linked، No tracking. لو أضفتوا ميزة تجمع بيانات جديدة (مثل الرقم الجامعي بالساعات التطوعية) حدّثوا App Privacy.
