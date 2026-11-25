# رفع تطبيق نادي المحاسبة على App Store

كل شي جاهز في المشروع. اللي باقي يحتاج حسابك في Apple، فلازم تسوينه أنتِ.

---

## ١. قبل كل شي
- لازم يكون عندك **Apple Developer Program** مدفوع (99$ بالسنة) على https://developer.apple.com/programs
  الحساب المجاني ما يرفع للمتجر.
- سجّلي دخول في Xcode: **Xcode ← Settings ← Accounts ← +**.

## ٢. في Xcode
1. افتحي المشروع:
   ```
   cd app
   npx cap open ios
   ```
2. من اليسار اضغطي **App** (الأيقونة الزرقاء) ← **Signing & Capabilities** ← **Team** واختاري فريقك.
3. من فوق، بدل المحاكي اختاري **Any iOS Device (arm64)**.
4. **Product ← Archive** وانتظري يخلص.
5. بتطلع نافذة Organizer: **Distribute App ← App Store Connect ← Upload**، وكمّلي بالإعدادات الافتراضية.

## ٣. في App Store Connect (https://appstoreconnect.apple.com)
1. **Apps ← + ← New App**:
   - Platform: iOS
   - Name: `نادي المحاسبة | جامعة الإمام`
   - Primary Language: Arabic
   - Bundle ID: `com.accclubimamu.app`
   - SKU: `accclub-ios-1`
2. انسخي النصوص اللي تحت في صفحة التطبيق.
3. ارفعي الصور من مجلد `app/store/screenshots` (مقاس 6.9 إنش: 1320×2868).
4. اختاري النسخة (Build) اللي رفعتيها من Xcode.
5. **Add for Review ← Submit**.

---

## نصوص صفحة المتجر

**الاسم (Name)** — حد أقصى ٣٠ حرف
```
نادي المحاسبة | جامعة الإمام
```

**العنوان الفرعي (Subtitle)** — حد أقصى ٣٠ حرف
```
فعاليات وزيارات ومجتمع محاسبي
```

**النص الترويجي (Promotional Text)**
```
تابع فعاليات نادي المحاسبة أول بأول، سجّل فيها بضغطة، وخلّنا نذكّرك قبل موعدها.
```

**الوصف (Description)**
```
التطبيق الرسمي لنادي المحاسبة بكلية الأعمال في جامعة الإمام محمد بن سعود الإسلامية.

نادي طلابي يهدف إلى تطوير معارف الطلبة ومهاراتهم في مجال المحاسبة، وتعزيز جاهزيتهم للحياة المهنية وسوق العمل.

مع التطبيق تقدر:
• تشوف الفعاليات المتاحة للتسجيل وتسجّل فيها مباشرة
• تتابع فعالياتنا القادمة بتاريخها ومكانها ووقتها
• تفعّل تذكير قبل الفعالية بيوم وقبلها بساعة
• تتصفح أرشيف فعاليات النادي وزياراته الميدانية لنخبة من الجهات الحكومية وشركات المحاسبة والاستشارات
• تستعلم عن ساعاتك التطوعية
• تكتشف شخصيتك المحاسبية والمجال اللي يناسبك
• تتعرف على رؤية النادي وأهدافه وهيكلته
• تتواصل مع النادي مباشرة من التطبيق

نحو أثر يبقى.. وبصمة تلهم.
```

**الكلمات المفتاحية (Keywords)** — حد أقصى ١٠٠ حرف
```
محاسبة,نادي,جامعة الإمام,فعاليات,طلاب,مراجعة,زكاة,ضريبة,SOCPA,CMA,تطوع,كلية الأعمال
```

**روابط**
- Support URL: `https://accclubimamu.com`
- Marketing URL: `https://accclubimamu.com`
- Privacy Policy URL: `https://accclubimamu.com/privacy`

**التصنيف (Category)**
- Primary: Education
- Secondary: Business

**التقييم العمري (Age Rating)**: جاوبي "None" على كل الأسئلة ← 4+

**الحقوق (Copyright)**
```
© 2026 نادي المحاسبة — جامعة الإمام محمد بن سعود الإسلامية
```

---

## الخصوصية (App Privacy)
- **Tracking (التتبع):** No
- **Data Collected:** Yes
  - Contact Info ← **Name**: التسجيل بالفعاليات + «تواصل معنا»
  - Contact Info ← **Email Address**: التسجيل بالفعاليات + «تواصل معنا»
  - Contact Info ← **Phone Number**: التسجيل بالفعاليات
  - Other Data ← **Other Data Types**: التخصص (التسجيل بالفعاليات)
  - User Content ← **Other User Content**: نص الرسالة في «تواصل معنا»
  - لكل نوع: Purpose = **App Functionality**، Linked to User = **Yes**، Used for Tracking = **No**

## ملاحظات للمراجع (App Review Information ← Notes)
```
This is the official app of the Accounting Club at Imam Mohammad Ibn Saud Islamic University (College of Business).
No login is required. All features are available immediately.

- Home / Events / Visits / Club tabs are native screens bundled in the app.
- Event data is loaded live from the club's own Google Sheets.
- "Register" and the student tools (volunteer hours, quiz) open the club's official website (accclubimamu.com) in an in-app Safari view.
- "Remind me" schedules local notifications before an event (no push server).

If no events are currently open, the "Archive" segment in the Events tab shows past events.
```
- Sign-in required: **No**
- Contact: اكتبي اسمك وجوالك وإيميلك (Apple تتواصل معك لو عندها سؤال)

## Export Compliance
مضبوطة بالمشروع (`ITSAppUsesNonExemptEncryption = NO`)، فما بيسألك عنها.
