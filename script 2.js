  // شريط التنقل: تغيير الخلفية عند التمرير
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  });

  // القائمة الجانبية
  const menuToggle = document.getElementById('menuToggle');
  const menuClose = document.getElementById('menuClose');
  const sideMenu = document.getElementById('sideMenu');
  const menuOverlay = document.getElementById('menuOverlay');
  if (menuToggle && sideMenu && menuOverlay){
    const openMenu = () => {
      sideMenu.classList.add('open');
      menuOverlay.classList.add('open');
      sideMenu.setAttribute('aria-hidden', 'false');
      menuToggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
    };
    const closeMenu = () => {
      sideMenu.classList.remove('open');
      menuOverlay.classList.remove('open');
      sideMenu.setAttribute('aria-hidden', 'true');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    };
    menuToggle.addEventListener('click', openMenu);
    menuClose.addEventListener('click', closeMenu);
    menuOverlay.addEventListener('click', closeMenu);
    sideMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  }

  // بريق تفاعلي في الهيرو يتبع الماوس
  const hero = document.querySelector('.hero');
  if (hero){
  hero.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * 100;
    const my = ((e.clientY - r.top) / r.height) * 100;
    hero.style.setProperty('--mx', mx + '%');
    hero.style.setProperty('--my', my + '%');
  });
}

  // ظهور تدريجي عند التمرير
  const revealEls = document.querySelectorAll('[data-reveal]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));

  document.getElementById('year').textContent = new Date().getFullYear();

  function animateStats(){
  document.querySelectorAll('#stats .stat-num').forEach(el=>{
    const raw = el.textContent.trim();
    const match = raw.match(/^([+\-]?)([\d.]+)([A-Za-z%]*)$/);
    if(!match) return;
    const sign = match[1] || '';
    const target = parseFloat(match[2]);
    const suffix = match[3] || '';
    const decimals = match[2].includes('.') ? match[2].split('.')[1].length : 0;
    const duration = 900;
    const start = performance.now();
    function tick(now){
      const progress = Math.min((now-start)/duration, 1);
      const eased = 1 - Math.pow(1-progress, 3);
      const value = target * eased;
      el.textContent = sign + value.toFixed(decimals) + suffix;
      if(progress < 1) requestAnimationFrame(tick);
      else el.textContent = sign + target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(tick);
  });
}

function animateStats(){
  document.querySelectorAll('#stats .stat-num').forEach(el=>{
    const raw = el.textContent.trim();
    const match = raw.match(/^([+\-]?)([\d.]+)([A-Za-z%]*)$/);
    if(!match) return;
    const sign = match[1] || '';
    const target = parseFloat(match[2]);
    const suffix = match[3] || '';
    const decimals = match[2].includes('.') ? match[2].split('.')[1].length : 0;
    const duration = 1200;
    const start = performance.now();
    function tick(now){
      const elapsed = now - start;
      const progress = Math.min(elapsed/duration, 1);
      const eased = 1 - Math.pow(1-progress, 3);
      const value = target * eased;
      el.textContent = sign + value.toFixed(decimals) + suffix;
      if(progress < 1) requestAnimationFrame(tick);
      else el.textContent = sign + target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(tick);
  });
}

const statsSection = document.getElementById('stats');
let statsAnimated = false;
if(statsSection){
  const statsObserver = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting && !statsAnimated){
        statsAnimated = true;
        animateStats();
      }
    });
  }, { threshold: 0.3, rootMargin: '0px 0px -50px 0px' });
  statsObserver.observe(statsSection);
}
function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      value += '"';
      i++;
    }

    else if (char === '"') {
      insideQuotes = !insideQuotes;
    }

    else if (char === ',' && !insideQuotes) {
      row.push(value);
      value = "";
    }

    else if ((char === '\n' || char === '\r') && !insideQuotes) {

      if (char === '\r' && next === '\n') {
        i++;
      }

      row.push(value);
      rows.push(row);

      row = [];
      value = "";
    }

    else {
      value += char;
    }
  }

  // آخر قيمة
  if (value !== "" || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

// ================= EVENTS =================

const API_URL = "https://script.google.com/macros/s/AKfycbwnD4jxqeTzbi4n5_OOJl3BUhwNeAdDN2f2HF80MWTiRRjZilvt8tu9-8UBYY74P_2W/exec";

document.addEventListener("DOMContentLoaded", () => {
    loadEvents();
});

// حد أقصى لعدد المسجلين لبعض الفعاليات (نفس القيم المستخدمة بصفحة
// register.html) — لما يوصل العدد للحد، زر "سجل الآن" يتحول لـ"انتهى التسجيل".
const REGISTRATION_LIMITS = {
    "جلسة حوارية": 43
};
// فعاليات مقفولة يدويًا بغض النظر عن عدد المسجلين.
const CLOSED_EVENTS = ["جلسة حوارية", "أبعاد محاسبية"];
const REGISTRATIONS_CSV_URL = "https://docs.google.com/spreadsheets/d/1Sbv_pomVeZEBPqPA1v4hZWHLvh3mJ6hHkGz3U-HRl24/export?format=csv";

// ورشة "بين دقة المحاسبة ورؤية المالية" إلها فورم وشيت ردود مستقلين،
// نطابق الاسم بنمط عام (مو بالضبط) عشان تشتغل وهي لسا "قريبًا" بالاسم.
const FINANCE_WORKSHOP_LIMIT = 70;
const FINANCE_WORKSHOP_RESPONSES_CSV_URL = "https://docs.google.com/spreadsheets/d/1cVk5tTWBQDsAGfsavvj-cHw0Pj8crrjvHnbkq04y1mM/export?format=csv";
const isFinanceWorkshop = (event) => /دقة المحاسبة/.test(event.name || "");
// إغلاق يدوي فوري لتسجيل ورشة دقة المحاسبة بغض النظر عن عدد المسجلين.
const FINANCE_WORKSHOP_CLOSED = true;

async function fetchFinanceWorkshopCount() {
    try {
        const res = await fetch(FINANCE_WORKSHOP_RESPONSES_CSV_URL + "&t=" + Date.now());
        const text = await res.text();
        const rows = parseCSV(text);
        return Math.max(0, rows.length - 1);
    } catch (err) {
        console.error("تعذر التحقق من عدد المسجلين بورشة دقة المحاسبة:", err);
        return 0;
    }
}

async function fetchRegistrationCounts() {
    const counts = {};
    try {
        const res = await fetch(REGISTRATIONS_CSV_URL + "&t=" + Date.now());
        const text = await res.text();
        const rows = parseCSV(text);
        if (rows.length < 2) return counts;
        const header = rows[0].map(h => h.trim());
        const eventCol = header.indexOf("اسم الفعاليه");
        if (eventCol === -1) return counts;
        rows.slice(1).forEach(r => {
            const name = (r[eventCol] || "").trim();
            if (!name) return;
            counts[name] = (counts[name] || 0) + 1;
        });
    } catch (err) {
        console.error("تعذر التحقق من عدد المسجلين:", err);
    }
    return counts;
}

async function loadEvents(isRetry) {
    try {
        const [response, counts, financeWorkshopCount] = await Promise.all([
            fetch(API_URL + "?t=" + Date.now()),
            fetchRegistrationCounts(),
            fetchFinanceWorkshopCount()
        ]);
        const events = await response.json();
        displayEvents(events, counts, financeWorkshopCount);
    } catch (error) {
        console.error("Error:", error);
        if (!isRetry) {
            setTimeout(() => loadEvents(true), 1500);
            return;
        }
        const container = document.getElementById("eventsContainer");
        if (container) {
            container.innerHTML = '<p class="events-loading">تعذّر تحميل الفعاليات، يرجى تحديث الصفحة.</p>';
        }
    }
}

// روابط Google Drive العادية (مشاركة) ما تشتغل مباشرة كصورة <img>،
// فنحولها هنا لصيغة عرض مباشر بالاعتماد على معرّف الملف.
function toDirectImageUrl(url) {
    if (!url) return url;
    const match = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([\w-]+)/);
    if (!match) return url;
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
}

function displayEvents(events, counts, financeWorkshopCount) {

    counts = counts || {};

    const container = document.getElementById("eventsContainer");

    if (!container) return;

    container.innerHTML = "";

    const EVENTS_HOME_LIMIT = 2;
    const moreLink = document.getElementById("eventsMore");
    if (moreLink) {
        moreLink.style.display = events.length > EVENTS_HOME_LIMIT ? "block" : "none";
    }
    events.slice(0, EVENTS_HOME_LIMIT).forEach(event => {

        const comingSoon = /قريب/.test(event.name) || /قريب/.test(event.description);
        const limit = REGISTRATION_LIMITS[(event.name || "").trim()];
        const isFull = CLOSED_EVENTS.includes((event.name || "").trim())
            || (limit && (counts[(event.name || "").trim()] || 0) >= limit)
            || (isFinanceWorkshop(event) && (FINANCE_WORKSHOP_CLOSED || (financeWorkshopCount || 0) >= FINANCE_WORKSHOP_LIMIT));

        const actionHtml = comingSoon
            ? `<a class="register-btn register-btn--soon" href="${buildRegisterUrl(event)}">التسجيل غير متاح حالياً</a>`
            : isFull
            ? `<span class="register-btn register-btn--soon">انتهى التسجيل</span>`
            : `<a class="register-btn" href="${buildRegisterUrl(event)}">سجل الآن</a>`;

        container.innerHTML += `
            <div class="event-card">

                <div class="event-image">
                    <img src="${toDirectImageUrl(event.image)}" alt="${event.name}" onerror="this.closest('.event-image').remove()">
                </div>

                <div class="event-content">

                    <h3>${event.name}</h3>

                    <p>${event.description}</p>

                    <div class="event-info">
                        <span>${event.location}</span>
                        <span>${event.date}</span>
                    </div>

                    ${actionHtml}

                </div>

            </div>
        `;
    });
}


// ================= EVENT REGISTRATION =================
// التسجيل صار بصفحة مستقلة (register.html) تقدر ترسل رابطها مباشرة،
// فهنا بس نبني رابط الصفحة ومعه بيانات الفعالية كـ query params.

function buildRegisterUrl(event) {
    const params = new URLSearchParams({
        id: event.id || event.event_id || "",
        name: event.name || "",
        date: event.date || "",
        location: event.location || "",
        description: event.description || "",
        image: toDirectImageUrl(event.image) || ""
    });
    return "register.html?" + params.toString();
}

// ================= MARQUEES: exact loop distance =================
// الشرائط (الرعاة، الفعاليات، الزيارات) كلها محتواها مكرر مرتين، لكن
// عرض عناصرها يختلف، فنحسب هنا المسافة الحقيقية بالبكسل من أول عنصر
// لأول عنصر بالنسخة المكررة، عشان اللف يصير سلس بدون فراغات دائمًا.
function setMarqueeShift(trackSelector, itemSelector, varName) {
    const track = document.querySelector(trackSelector);
    if (!track) return;
    const items = track.querySelectorAll(itemSelector);
    if (items.length < 2) return;
    const half = Math.floor(items.length / 2);
    const firstRect = items[0].getBoundingClientRect();
    const midRect = items[half].getBoundingClientRect();
    const shift = Math.abs(midRect.right - firstRect.right) || Math.abs(midRect.left - firstRect.left);
    if (shift > 0) {
        track.style.setProperty(varName, `-${shift}px`);
    }
}

function setSponsorsShift() {
    setMarqueeShift('.sponsors-track', '.sponsor-logo', '--sponsors-shift');
}

const sponsorsTrackImgs = document.querySelectorAll('.sponsors-track img');
if (sponsorsTrackImgs.length) {
    let pending = sponsorsTrackImgs.length;
    const onLoaded = () => {
        pending--;
        if (pending <= 0) setSponsorsShift();
    };
    sponsorsTrackImgs.forEach(img => {
        if (img.complete) {
            onLoaded();
        } else {
            img.addEventListener('load', onLoaded);
            img.addEventListener('error', onLoaded);
        }
    });
}

setMarqueeShift('#featured-events .mini-track', '.mini-card', '--mini-shift');
setMarqueeShift('#featured-visits .mini-track', '.mini-card', '--mini-shift');

window.addEventListener('resize', () => {
    setSponsorsShift();
    setMarqueeShift('#featured-events .mini-track', '.mini-card', '--mini-shift');
    setMarqueeShift('#featured-visits .mini-track', '.mini-card', '--mini-shift');
});

/* =========================================
   CONTACT FORM
========================================= */

const CONTACT_GOOGLE_FORM_ID = "1FAIpQLSfy20_67n9WpPwRNEJbjzjiHLV995zR5ivv38hEXcbmbs63lg";
const CONTACT_FORM_ENTRY = {
    fullName: "entry.1919255040",
    email: "entry.553687116",
    purpose: "entry.878429823",
    details: "entry.1203723991"
};

const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('button[type=submit]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'جارِ الإرسال...';

        const body = new URLSearchParams();
        body.set(CONTACT_FORM_ENTRY.fullName, document.getElementById('contactName').value.trim());
        body.set(CONTACT_FORM_ENTRY.email, document.getElementById('contactEmail').value.trim());
        body.set(CONTACT_FORM_ENTRY.purpose, document.getElementById('contactPurpose').value);
        body.set(CONTACT_FORM_ENTRY.details, document.getElementById('contactDetails').value.trim());

        fetch(`https://docs.google.com/forms/d/e/${CONTACT_GOOGLE_FORM_ID}/formResponse`, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString()
        })
            .then(() => {
                contactForm.style.display = 'none';
                document.getElementById('contactSuccess').style.display = 'block';
            })
            .catch(error => {
                console.error(error);
                alert('تعذر إرسال رسالتك، يرجى المحاولة مرة أخرى.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'إرسال';
            });
    });
}

/* =========================================
   لعبة "جاهز تختبر محاسبيتك؟"
========================================= */

const GAME_ANSWER_SETS = {
    debitCredit: [
        { value: "debit", label: "مدين" },
        { value: "credit", label: "دائن" }
    ],
    classify: [
        { value: "asset", label: "أصل" },
        { value: "liability", label: "خصم" },
        { value: "equity", label: "حقوق ملكية" },
        { value: "revenue", label: "إيراد" },
        { value: "expense", label: "مصروف" }
    ],
    statement: [
        { value: "income", label: "قائمة الدخل" },
        { value: "position", label: "المركز المالي" }
    ],
    trueFalse: [
        { value: "true", label: "صح" },
        { value: "false", label: "خطأ" }
    ],
    currentNonCurrent: [
        { value: "current", label: "متداول" },
        { value: "noncurrent", label: "غير متداول" }
    ]
};

const GAME_DEBIT_CREDIT_QUESTIONS = [
    // معاملات مالية
    { label: "حساب النقدية", question: "الشركة استلمت مبلغ نقدي من عميل", answer: "debit" },
    { label: "حساب النقدية", question: "الشركة سددت فاتورة الكهرباء نقدًا", answer: "credit" },
    { label: "حساب الأثاث", question: "الشركة اشترت أثاث مكتبي نقدًا", answer: "debit" },
    { label: "حساب البضاعة (المخزون)", question: "الشركة باعت جزء من مخزونها وسلّمته للعميل", answer: "credit" },
    { label: "حساب الذمم المدينة", question: "الشركة باعت بضاعة لعميل على الحساب (بالأجل)", answer: "debit" },
    { label: "حساب الذمم المدينة", question: "الشركة حصّلت مبلغ من عميل مدين سابق", answer: "credit" },
    { label: "حساب رأس المال", question: "المالك أضاف مبلغ نقدي كزيادة في رأس المال", answer: "credit" },
    { label: "حساب الإيرادات", question: "الشركة قدمت خدمة استشارية واستلمت أجرها فورًا", answer: "credit" },
    { label: "حساب الدائنين (الموردين)", question: "الشركة اشترت بضاعة من مورد على الحساب", answer: "credit" },
    { label: "حساب الدائنين (الموردين)", question: "الشركة سددت جزء من دين مستحق لمورد", answer: "debit" },
    { label: "حساب المصروفات", question: "الشركة دفعت إيجار المكتب الشهري", answer: "debit" },
    { label: "حساب أوراق القبض", question: "الشركة استلمت كمبيالة من عميل مقابل دين عليه", answer: "debit" },
    { label: "حساب أوراق الدفع", question: "الشركة وقّعت كمبيالة لمورد بدل السداد النقدي", answer: "credit" },
    { label: "حساب مصروف مقدم", question: "الشركة دفعت تأمين سنوي مقدمًا لمكتبها", answer: "debit" },
    { label: "حساب إيراد مقدم", question: "الشركة استلمت دفعة من عميل مقابل خدمة لم تُقدَّم بعد", answer: "credit" },
    { label: "حساب رأس المال", question: "المالك سحب مبلغ لاستخدامه الشخصي", answer: "debit" },
    { label: "حساب مجمع إهلاك الأثاث", question: "الشركة سجّلت قسط إهلاك سنوي على الأثاث", answer: "credit" },
    { label: "حساب مصروف الإهلاك", question: "تسجيل قسط الإهلاك السنوي على الأثاث", answer: "debit" },
    { label: "حساب مردودات المبيعات", question: "عميل أرجع بضاعة معيبة اشتراها سابقًا", answer: "debit" },
    { label: "حساب الخصم المسموح به", question: "الشركة منحت عميلها خصم نقدي عند السداد المبكر", answer: "debit" },
    { label: "حساب مصروف مستحق", question: "نهاية الفترة، فائدة على قرض مستحقة ولم تُدفع بعد", answer: "credit" },
    { label: "حساب إيراد مستحق", question: "نهاية الفترة، خدمة قُدّمت لعميل ولم يُحصَّل أجرها بعد", answer: "debit" },
    { label: "حساب ضريبة القيمة المضافة المستحقة", question: "الشركة باعت بضاعة خاضعة لضريبة القيمة المضافة", answer: "credit" },

    // زيادة في الحساب
    { label: "زيادة في الحساب", question: "حساب الأصول", answer: "debit" },
    { label: "زيادة في الحساب", question: "حساب الالتزامات (الخصوم)", answer: "credit" },
    { label: "زيادة في الحساب", question: "حساب حقوق الملكية", answer: "credit" },
    { label: "زيادة في الحساب", question: "حساب الإيرادات", answer: "credit" },
    { label: "زيادة في الحساب", question: "حساب المصروفات", answer: "debit" },

    // نقصان في الحساب
    { label: "نقصان في الحساب", question: "حساب الأصول", answer: "credit" },
    { label: "نقصان في الحساب", question: "حساب الالتزامات (الخصوم)", answer: "debit" },
    { label: "نقصان في الحساب", question: "حساب حقوق الملكية", answer: "debit" },
    { label: "نقصان في الحساب", question: "حساب الإيرادات", answer: "debit" },
    { label: "نقصان في الحساب", question: "حساب المصروفات", answer: "credit" },

    // الرصيد الطبيعي
    { label: "الرصيد الطبيعي", question: "حساب الأصول", answer: "debit" },
    { label: "الرصيد الطبيعي", question: "حساب الالتزامات (الخصوم)", answer: "credit" },
    { label: "الرصيد الطبيعي", question: "حساب حقوق الملكية", answer: "credit" },
    { label: "الرصيد الطبيعي", question: "حساب الإيرادات", answer: "credit" },
    { label: "الرصيد الطبيعي", question: "حساب المصروفات", answer: "debit" },
    { label: "الرصيد الطبيعي", question: "حساب المسحوبات الشخصية (السحب)", answer: "debit" },
    { label: "الرصيد الطبيعي", question: "حساب مجمع إهلاك الأصول الثابتة", answer: "credit" },
    { label: "الرصيد الطبيعي", question: "حساب مخصص الديون المشكوك في تحصيلها", answer: "credit" },
    { label: "الرصيد الطبيعي", question: "حساب مردودات ومسموحات المبيعات", answer: "debit" },
    { label: "الرصيد الطبيعي", question: "حساب الخصم المكتسب", answer: "credit" },

    // قيد الإقفال
    { label: "قيد الإقفال", question: "إقفال حساب الإيرادات في نهاية الفترة", answer: "debit" },
    { label: "قيد الإقفال", question: "إقفال حساب المصروفات في نهاية الفترة", answer: "credit" },
    { label: "قيد الإقفال", question: "إقفال حساب المسحوبات الشخصية في نهاية الفترة", answer: "credit" }
].map(q => ({ ...q, type: "debitCredit" }));

const GAME_CLASSIFY_QUESTIONS = [
    { label: "تصنيف الحساب", question: "حساب النقدية", answer: "asset" },
    { label: "تصنيف الحساب", question: "حساب المخزون (البضاعة)", answer: "asset" },
    { label: "تصنيف الحساب", question: "حساب الأثاث والمعدات", answer: "asset" },
    { label: "تصنيف الحساب", question: "حساب الذمم المدينة (العملاء)", answer: "asset" },
    { label: "تصنيف الحساب", question: "حساب الذمم الدائنة (الموردون)", answer: "liability" },
    { label: "تصنيف الحساب", question: "حساب القروض طويلة الأجل", answer: "liability" },
    { label: "تصنيف الحساب", question: "حساب أوراق الدفع", answer: "liability" },
    { label: "تصنيف الحساب", question: "حساب رأس المال", answer: "equity" },
    { label: "تصنيف الحساب", question: "حساب الأرباح المحتجزة", answer: "equity" },
    { label: "تصنيف الحساب", question: "حساب المسحوبات الشخصية", answer: "equity" },
    { label: "تصنيف الحساب", question: "حساب إيرادات الخدمات", answer: "revenue" },
    { label: "تصنيف الحساب", question: "حساب إيرادات الفوائد", answer: "revenue" },
    { label: "تصنيف الحساب", question: "حساب مصروف الرواتب", answer: "expense" },
    { label: "تصنيف الحساب", question: "حساب مصروف الإيجار", answer: "expense" },
    { label: "تصنيف الحساب", question: "حساب مصروف الإهلاك", answer: "expense" }
].map(q => ({ ...q, type: "classify" }));

const GAME_STATEMENT_QUESTIONS = [
    { label: "أي قائمة يظهر فيها الحساب؟", question: "حساب الإيرادات", answer: "income" },
    { label: "أي قائمة يظهر فيها الحساب؟", question: "حساب المصروفات", answer: "income" },
    { label: "أي قائمة يظهر فيها الحساب؟", question: "حساب مصروف الإهلاك", answer: "income" },
    { label: "أي قائمة يظهر فيها الحساب؟", question: "حساب إيرادات الفوائد", answer: "income" },
    { label: "أي قائمة يظهر فيها الحساب؟", question: "حساب النقدية", answer: "position" },
    { label: "أي قائمة يظهر فيها الحساب؟", question: "حساب الذمم المدينة", answer: "position" },
    { label: "أي قائمة يظهر فيها الحساب؟", question: "حساب المخزون", answer: "position" },
    { label: "أي قائمة يظهر فيها الحساب؟", question: "حساب رأس المال", answer: "position" },
    { label: "أي قائمة يظهر فيها الحساب؟", question: "حساب الذمم الدائنة", answer: "position" },
    { label: "أي قائمة يظهر فيها الحساب؟", question: "حساب القروض طويلة الأجل", answer: "position" }
].map(q => ({ ...q, type: "statement" }));

const GAME_TRUEFALSE_QUESTIONS = [
    { label: "صح أم خطأ؟", question: "المصروفات المدفوعة مقدمًا تُعتبر من الأصول", answer: "true" },
    { label: "صح أم خطأ؟", question: "الإيرادات المقبوضة مقدمًا تُعتبر من الخصوم", answer: "true" },
    { label: "صح أم خطأ؟", question: "زيادة حساب الأصول تُسجَّل في الجانب الدائن", answer: "false" },
    { label: "صح أم خطأ؟", question: "المسحوبات الشخصية تزيد من حقوق الملكية", answer: "false" },
    { label: "صح أم خطأ؟", question: "حساب مجمع الإهلاك رصيده الطبيعي دائن", answer: "true" },
    { label: "صح أم خطأ؟", question: "كل الأصول تظهر في قائمة الدخل", answer: "false" },
    { label: "صح أم خطأ؟", question: "إقفال حساب المصروفات يكون بجعله دائنًا", answer: "true" },
    { label: "صح أم خطأ؟", question: "الذمم الدائنة (الموردون) من حسابات الأصول", answer: "false" },
    { label: "صح أم خطأ؟", question: "زيادة استثمار المالك تزيد حساب رأس المال", answer: "true" },
    { label: "صح أم خطأ؟", question: "مصروف الإهلاك يُخصم مباشرة من حساب الأصل نفسه", answer: "false" }
].map(q => ({ ...q, type: "trueFalse" }));

const GAME_CURRENT_QUESTIONS = [
    { label: "متداول أم غير متداول؟", question: "حساب النقدية", answer: "current" },
    { label: "متداول أم غير متداول؟", question: "حساب الذمم المدينة", answer: "current" },
    { label: "متداول أم غير متداول؟", question: "حساب المخزون", answer: "current" },
    { label: "متداول أم غير متداول؟", question: "حساب الأراضي", answer: "noncurrent" },
    { label: "متداول أم غير متداول؟", question: "حساب المباني", answer: "noncurrent" },
    { label: "متداول أم غير متداول؟", question: "حساب الأثاث والمعدات", answer: "noncurrent" },
    { label: "متداول أم غير متداول؟", question: "حساب الذمم الدائنة (الموردون)", answer: "current" },
    { label: "متداول أم غير متداول؟", question: "حساب القروض طويلة الأجل", answer: "noncurrent" },
    { label: "متداول أم غير متداول؟", question: "حساب أوراق الدفع قصيرة الأجل", answer: "current" },
    { label: "متداول أم غير متداول؟", question: "حساب الشهرة (أصل غير ملموس)", answer: "noncurrent" }
].map(q => ({ ...q, type: "currentNonCurrent" }));

const GAME_QUESTIONS = [
    ...GAME_DEBIT_CREDIT_QUESTIONS,
    ...GAME_CLASSIFY_QUESTIONS,
    ...GAME_STATEMENT_QUESTIONS,
    ...GAME_TRUEFALSE_QUESTIONS,
    ...GAME_CURRENT_QUESTIONS
];

const GAME_QUESTIONS_PER_ROUND = 20;
const GAME_BEST_SCORE_KEY = "accClubGameBestScore";

const gameFab = document.getElementById("gameFab");
if (gameFab) {
    const gameOverlay = document.getElementById("gameOverlay");
    const gameClose = document.getElementById("gameClose");
    const gameStartScreen = document.getElementById("gameStartScreen");
    const gamePlayScreen = document.getElementById("gamePlayScreen");
    const gameEndScreen = document.getElementById("gameEndScreen");
    const gameStartBtn = document.getElementById("gameStartBtn");
    const gameRetryBtn = document.getElementById("gameRetryBtn");
    const gameBestLine = document.getElementById("gameBestLine");
    const gameEndBestLine = document.getElementById("gameEndBestLine");
    const gameQuestionNum = document.getElementById("gameQuestionNum");
    const gameScoreLine = document.getElementById("gameScoreLine");
    const gameAccount = document.getElementById("gameAccount");
    const gameEvent = document.getElementById("gameEvent");
    const gameAnswers = document.getElementById("gameAnswers");
    const gameFeedback = document.getElementById("gameFeedback");
    const gameFinalScore = document.getElementById("gameFinalScore");

    const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    const toArabicDigits = (n) => String(n).replace(/[0-9]/g, d => ARABIC_DIGITS[d]);

    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function getBestScore() {
        try {
            return parseInt(localStorage.getItem(GAME_BEST_SCORE_KEY), 10) || 0;
        } catch (e) {
            return 0;
        }
    }

    function setBestScore(score) {
        try {
            localStorage.setItem(GAME_BEST_SCORE_KEY, String(score));
        } catch (e) { /* تجاهل لو التخزين ممنوع */ }
    }

    // محفوظة لإعادة تفعيل مسميات النتيجة لاحقًا (غير مستخدمة حاليًا بطلب النادي)
    function scoreTitle(score) {
        if (score >= 18) return { title: "خبير مالي", icon: "🏆" };
        if (score >= 14) return { title: "مراجع حسابات", icon: "🥇" };
        if (score >= 8) return { title: "محاسب", icon: "📊" };
        return { title: "متدرب", icon: "🌱" };
    }

    let gameRoundQuestions = [];
    let gameIndex = 0;
    let gameScore = 0;

    function showScreen(el) {
        [gameStartScreen, gamePlayScreen, gameEndScreen].forEach(s => { s.style.display = "none"; });
        el.style.display = "block";
    }

    function openGame() {
        gameOverlay.classList.add("open");
        const best = getBestScore();
        if (best > 0) {
            gameBestLine.textContent = `أفضل نتيجة لك: ${toArabicDigits(best)} / ${toArabicDigits(GAME_QUESTIONS_PER_ROUND)}`;
            gameBestLine.style.display = "block";
        } else {
            gameBestLine.style.display = "none";
        }
        showScreen(gameStartScreen);
    }

    function closeGame() {
        gameOverlay.classList.remove("open");
    }

    function startGame() {
        gameRoundQuestions = shuffle(GAME_QUESTIONS).slice(0, GAME_QUESTIONS_PER_ROUND);
        gameIndex = 0;
        gameScore = 0;
        showScreen(gamePlayScreen);
        renderQuestion();
    }

    function renderQuestion() {
        gameFeedback.textContent = "";
        gameFeedback.className = "game-feedback";

        const q = gameRoundQuestions[gameIndex];
        gameAccount.textContent = q.label;
        gameEvent.textContent = q.question;
        gameQuestionNum.textContent = `${toArabicDigits(gameIndex + 1)} / ${toArabicDigits(gameRoundQuestions.length)}`;
        gameScoreLine.textContent = `النقاط: ${toArabicDigits(gameScore)}`;

        gameAnswers.innerHTML = "";
        GAME_ANSWER_SETS[q.type].forEach(opt => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "game-answer-btn";
            btn.textContent = opt.label;
            btn.dataset.value = opt.value;
            btn.addEventListener("click", () => handleAnswer(opt.value));
            gameAnswers.appendChild(btn);
        });
    }

    function handleAnswer(choice) {
        const q = gameRoundQuestions[gameIndex];
        const buttons = Array.from(gameAnswers.querySelectorAll(".game-answer-btn"));
        buttons.forEach(b => { b.disabled = true; });

        const correctBtn = buttons.find(b => b.dataset.value === q.answer);
        correctBtn.classList.add("correct");

        if (choice === q.answer) {
            gameScore++;
            gameFeedback.textContent = "إجابة صحيحة!";
            gameFeedback.classList.add("correct");
        } else {
            const wrongBtn = buttons.find(b => b.dataset.value === choice);
            if (wrongBtn) wrongBtn.classList.add("wrong");
            gameFeedback.textContent = "إجابة خاطئة";
            gameFeedback.classList.add("wrong");
        }

        setTimeout(() => {
            gameIndex++;
            if (gameIndex < gameRoundQuestions.length) {
                renderQuestion();
            } else {
                endGame();
            }
        }, 900);
    }

    function endGame() {
        const best = getBestScore();
        const isNewBest = gameScore > best;
        if (isNewBest) setBestScore(gameScore);

        gameFinalScore.textContent = toArabicDigits(gameScore);
        gameEndBestLine.textContent = isNewBest
            ? "رقم قياسي جديد لك! 🎉"
            : `أفضل نتيجة لك: ${toArabicDigits(Math.max(best, gameScore))} / ${toArabicDigits(GAME_QUESTIONS_PER_ROUND)}`;

        showScreen(gameEndScreen);
    }

    gameFab.addEventListener("click", openGame);
    gameClose.addEventListener("click", closeGame);
    gameOverlay.addEventListener("click", (e) => { if (e.target === gameOverlay) closeGame(); });
    gameStartBtn.addEventListener("click", startGame);
    gameRetryBtn.addEventListener("click", startGame);
}

/* =========================================
   مساعد إدارة الأعمال (الروبوت)
========================================= */

const BOT_KNOWLEDGE = [
    // محاسبة
    { keywords: ["ايش المحاسبة", "تعريف المحاسبة", "وش المحاسبة"], answer: "المحاسبة هي عملية تسجيل وتصنيف وتلخيص العمليات المالية للمنشأة، وإعداد تقارير عنها تساعد الإدارة والمستثمرين وأصحاب المصلحة على اتخاذ قرارات اقتصادية سليمة." },
    { keywords: ["الفرق بين المحاسبة المالية والادارية", "محاسبة مالية وادارية"], answer: "المحاسبة المالية تُعد تقارير للجهات الخارجية (مستثمرين، جهات حكومية) وفق معايير موحدة. المحاسبة الإدارية تُعد تقارير داخلية للإدارة لاتخاذ القرارات، وما تخضع لمعايير ثابتة." },
    { keywords: ["القوائم المالية الاساسية", "ايش القوائم المالية"], answer: "القوائم المالية الأساسية أربعة: قائمة الدخل، قائمة المركز المالي، قائمة التدفقات النقدية، وقائمة التغير في حقوق الملكية." },
    { keywords: ["ايش قائمة الدخل", "قائمة الدخل"], answer: "قائمة الدخل تُظهر إيرادات ومصروفات المنشأة خلال فترة معينة، وتنتهي بصافي الربح أو الخسارة." },
    { keywords: ["قائمة المركز المالي", "الميزانية العمومية", "ايش الميزانية"], answer: "قائمة المركز المالي (الميزانية) تُظهر أصول وخصوم وحقوق ملكية المنشأة في لحظة زمنية معينة، وتعتمد معادلة: الأصول = الخصوم + حقوق الملكية." },
    { keywords: ["قائمة التدفقات النقدية", "التدفق النقدي"], answer: "قائمة التدفقات النقدية تُظهر حركة النقدية الداخلة والخارجة من المنشأة، مقسّمة لثلاثة أنشطة: تشغيلية، استثمارية، وتمويلية." },
    { keywords: ["الفرق بين الاصول والخصوم", "اصول وخصوم"], answer: "الأصول هي ممتلكات المنشأة التي تحقق منفعة مستقبلية (نقدية، مخزون، أثاث). الخصوم هي التزامات على المنشأة تجاه الغير (ديون، ذمم دائنة)." },
    { keywords: ["ايش حقوق الملكية", "حقوق الملكية"], answer: "حقوق الملكية هي نصيب أصحاب المنشأة من الأصول بعد سداد كل الخصوم، وتشمل رأس المال والأرباح المحتجزة." },
    { keywords: ["القيد المزدوج", "مبدا القيد المزدوج"], answer: "القيد المزدوج مبدأ أساسي بالمحاسبة ينص على أن كل عملية مالية لها طرفان: مدين ودائن، وإجمالي المدين يجب يساوي إجمالي الدائن دائمًا." },
    { keywords: ["الفرق بين المدين والدائن", "مدين ودائن"], answer: "المدين يزيد الأصول والمصروفات ويُنقص الخصوم وحقوق الملكية والإيرادات. الدائن عكسه تمامًا: يزيد الخصوم وحقوق الملكية والإيرادات ويُنقص الأصول والمصروفات." },
    { keywords: ["ايش الاهلاك", "الاستهلاك المحاسبي"], answer: "الإهلاك هو توزيع تكلفة الأصل الثابت (كالمعدات والمباني) على عمره الإنتاجي المتوقع، بدل تحميل تكلفته كاملة على فترة واحدة." },
    { keywords: ["اساس الاستحقاق والنقدي", "الفرق بين اساس الاستحقاق والاساس النقدي"], answer: "أساس الاستحقاق يسجل الإيراد والمصروف وقت حدوثه بغض النظر عن استلام أو دفع النقدية. الأساس النقدي يسجلهما فقط عند استلام أو دفع النقدية فعليًا." },
    { keywords: ["الدورة المحاسبية", "دورة المحاسبة"], answer: "الدورة المحاسبية هي سلسلة الخطوات المتكررة كل فترة مالية: تحليل العمليات، تسجيلها باليومية، ترحيلها للأستاذ، إعداد ميزان المراجعة، ثم إعداد القوائم المالية وإقفال الحسابات." },
    { keywords: ["ميزان المراجعة", "ايش ميزان المراجعة"], answer: "ميزان المراجعة كشف يضم أرصدة كل الحسابات في لحظة معينة، للتأكد أن إجمالي الأرصدة المدينة يساوي إجمالي الأرصدة الدائنة قبل إعداد القوائم المالية." },
    { keywords: ["المراجعة الداخلية والخارجية", "الفرق بين المراجعة الداخلية والخارجية"], answer: "المراجعة الداخلية يقوم بها موظفون داخل المنشأة لتقييم الرقابة والعمليات باستمرار. المراجعة الخارجية يقوم بها مراجع مستقل خارجي لإبداء رأي محايد عن عدالة القوائم المالية." },
    { keywords: ["المعايير الدولية للتقارير المالية", "ايفرس", "IFRS"], answer: "المعايير الدولية لإعداد التقارير المالية (IFRS) مجموعة معايير محاسبية موحدة عالميًا، تهدف لجعل القوائم المالية قابلة للمقارنة بين الشركات في مختلف الدول." },
    { keywords: ["التكلفة الثابتة والمتغيرة", "الفرق بين التكلفة الثابتة والمتغيرة"], answer: "التكلفة الثابتة لا تتغير بتغير حجم الإنتاج (كالإيجار). التكلفة المتغيرة تتغير طرديًا مع حجم الإنتاج أو المبيعات (كالمواد الخام)." },
    { keywords: ["نقطة التعادل", "break even"], answer: "نقطة التعادل هي حجم المبيعات الذي تتساوى عنده الإيرادات مع إجمالي التكاليف، أي لا تحقق فيه المنشأة ربح ولا خسارة." },
    { keywords: ["الفرق بين المحاسبة والمراجعة"], answer: "المحاسبة تختص بتسجيل العمليات المالية وإعداد القوائم المالية. المراجعة تختص بفحص هذه القوائم من طرف مستقل لإبداء رأي فني عن مدى عدالتها وصحتها." },
    { keywords: ["الزكاة", "كيف تحتسب الزكاة"], answer: "زكاة عروض التجارة تُحسب عمومًا بنسبة ٢.٥٪ من الوعاء الزكوي (صافي الأصول الزكوية بعد خصم الخصوم المستحقة)، وتُقدَّم إقراراتها في السعودية عبر هيئة الزكاة والضريبة والجمارك." },
    { keywords: ["ايش المصروف المستحق", "مصروف مستحق"], answer: "المصروف المستحق هو مصروف وقع فعلًا خلال الفترة لكن لم يُدفع نقدًا بعد، ويُسجَّل كالتزام (خصم) في نهاية الفترة وفق أساس الاستحقاق." },
    { keywords: ["ايش الايراد المقدم", "ايراد مقدم"], answer: "الإيراد المقدم هو مبلغ استلمته المنشأة مقابل خدمة أو سلعة لم تُقدَّم بعد، ويُسجَّل كالتزام (خصم) حتى تُقدَّم الخدمة فعليًا." },
    { keywords: ["ضريبة القيمة المضافة", "VAT"], answer: "ضريبة القيمة المضافة (VAT) ضريبة غير مباشرة تُفرض على معظم السلع والخدمات في كل مرحلة من مراحل البيع، ويتحملها المستهلك النهائي وتجمعها المنشآت لصالح الدولة." },
    { keywords: ["الضريبة الانتقائية", "excise tax"], answer: "الضريبة الانتقائية ضريبة تُفرض على سلع معينة ضارة بالصحة أو البيئة (كالتبغ والمشروبات الغازية)، بهدف تقليل استهلاكها وتحقيق إيراد للدولة." },
    { keywords: ["الفرق بين ضريبة الدخل والزكاة"], answer: "الزكاة تُفرض على الأموال السعودية والخليجية بنسبة ٢.٥٪ من الوعاء الزكوي. ضريبة الدخل تُفرض على أرباح الشركات ذات رأس المال الأجنبي، وتختلف نسبتها عن الزكاة." },
    { keywords: ["محاسبة التكاليف", "cost accounting"], answer: "محاسبة التكاليف فرع من المحاسبة يهتم بقياس وتحليل تكاليف إنتاج السلع أو الخدمات، لمساعدة الإدارة على التسعير والرقابة على التكاليف." },
    { keywords: ["الفرق بين محاسبة التكاليف والمحاسبة المالية"], answer: "محاسبة التكاليف تركز على تفاصيل تكلفة الإنتاج الداخلية لأغراض إدارية. المحاسبة المالية تُعد تقارير شاملة عن المنشأة كاملة لأغراض خارجية." },
    { keywords: ["التكلفة المعيارية", "standard costing"], answer: "نظام التكلفة المعيارية يحدد تكلفة متوقعة (معيارية) مسبقًا لكل وحدة إنتاج، ثم يقارنها بالتكلفة الفعلية لتحديد الانحرافات وأسبابها." },
    { keywords: ["الموازنة التقديرية", "budgeting"], answer: "الموازنة التقديرية خطة مالية مستقبلية تقدّر إيرادات ومصروفات المنشأة خلال فترة قادمة، وتُستخدم كأداة تخطيط ورقابة." },
    { keywords: ["تحليل الانحرافات", "variance analysis"], answer: "تحليل الانحرافات هو مقارنة الأداء الفعلي (التكلفة أو الإيراد) بالأداء المخطط له بالموازنة، لتحديد أسباب الفروقات واتخاذ إجراءات تصحيحية." },
    { keywords: ["القوائم المالية الموحدة", "consolidated financial statements"], answer: "القوائم المالية الموحدة تجمع القوائم المالية لشركة أم وشركاتها التابعة في قائمة واحدة، وكأنهم منشأة اقتصادية واحدة." },
    { keywords: ["حصة الاقلية", "non-controlling interest"], answer: "حصة الأقلية هي نصيب المساهمين الآخرين (غير الشركة الأم) من صافي أصول وأرباح الشركة التابعة، وتظهر منفصلة بالقوائم المالية الموحدة." },
    { keywords: ["الشهرة المحاسبية", "goodwill"], answer: "الشهرة المحاسبية (Goodwill) أصل غير ملموس ينشأ عادة عند شراء منشأة بسعر أعلى من صافي قيمة أصولها، ويعكس سمعتها وعلاقاتها وقيمتها المستقبلية." },
    { keywords: ["انخفاض قيمة الاصول", "impairment"], answer: "انخفاض قيمة الأصول (Impairment) يحدث عندما تصبح القيمة الدفترية للأصل أعلى من قيمته القابلة للاسترداد، فتُخفَّض قيمته بالقوائم المالية ويُسجَّل الفرق كخسارة." },
    { keywords: ["اعادة التقييم", "revaluation"], answer: "إعادة التقييم هي تعديل القيمة الدفترية لأصل ثابت لتعكس قيمته العادلة الحالية بالسوق، بدل الاستمرار بتكلفته التاريخية الأصلية." },
    { keywords: ["مبدا الحيطة والحذر", "conservatism"], answer: "مبدأ الحيطة والحذر يقضي بعدم المبالغة في تقدير الأرباح أو الأصول، والاعتراف بالخسائر المحتملة فور توقعها، تجنبًا لتضليل مستخدمي القوائم المالية." },
    { keywords: ["مبدا الاستمرارية", "going concern"], answer: "مبدأ الاستمرارية يفترض أن المنشأة ستواصل نشاطها في المستقبل المنظور، ولن تُصفّى أو تتوقف عن العمل قريبًا، وهذا يؤثر على طريقة تقييم أصولها." },
    { keywords: ["مبدا الثبات", "consistency"], answer: "مبدأ الثبات يقضي بأن تستخدم المنشأة نفس الطرق والسياسات المحاسبية من فترة لأخرى، لتكون القوائم المالية قابلة للمقارنة عبر الزمن." },
    { keywords: ["مبدا الافصاح التام", "full disclosure"], answer: "مبدأ الإفصاح التام يُلزم المنشأة بالكشف عن كل المعلومات الجوهرية التي قد تؤثر على قرار مستخدمي القوائم المالية، سواء بالقوائم نفسها أو بالإيضاحات المرفقة." },
    { keywords: ["الاصول غير الملموسة", "intangible assets"], answer: "الأصول غير الملموسة أصول ليس لها كيان مادي ملموس لكنها تحقق منفعة اقتصادية مستقبلية، كبراءات الاختراع والعلامات التجارية والشهرة المحاسبية." },
    { keywords: ["الفرق بين الاصول الملموسة وغير الملموسة"], answer: "الأصول الملموسة لها وجود مادي يمكن لمسه (كالأثاث والمباني). الأصول غير الملموسة ليس لها وجود مادي لكنها ذات قيمة اقتصادية (كالعلامة التجارية وبراءات الاختراع)." },
    { keywords: ["طرق تقييم المخزون", "FIFO LIFO"], answer: "من أبرز طرق تقييم المخزون: الوارد أولًا صادر أولًا (FIFO)، والمتوسط المرجح — تُستخدم لتحديد تكلفة البضاعة المباعة والمخزون المتبقي آخر الفترة." },
    { keywords: ["طريقة الوارد اولا صادر اولا", "FIFO"], answer: "طريقة الوارد أولًا صادر أولًا (FIFO) تفترض أن أول وحدات دخلت للمخزون هي أول وحدات تُباع، فيظل المخزون المتبقي يعكس أحدث الأسعار." },
    { keywords: ["طريقة المتوسط المرجح", "weighted average"], answer: "طريقة المتوسط المرجح تحسب تكلفة موحدة لكل وحدة بقسمة إجمالي تكلفة المخزون على إجمالي عدد الوحدات المتاحة، وتُستخدم هذه التكلفة لتقييم المبيعات والمخزون المتبقي." },
    { keywords: ["تكلفة البضاعة المباعة", "cost of goods sold"], answer: "تكلفة البضاعة المباعة هي التكلفة المباشرة للسلع التي باعتها المنشأة خلال فترة معينة، وتُخصم من الإيرادات للوصول لمجمل الربح بقائمة الدخل." },
    { keywords: ["الالتزامات المحتملة", "contingent liabilities"], answer: "الالتزامات المحتملة هي التزامات محتملة الحدوث تعتمد على نتيجة حدث مستقبلي غير مؤكد (كقضية قانونية جارية)، وتُفصح عنها المنشأة دون تسجيلها كالتزام مؤكد." },
    { keywords: ["السندات المستحقة الدفع", "bonds payable"], answer: "السندات المستحقة الدفع التزام طويل الأجل على المنشأة نتيجة إصدارها سندات دين للمستثمرين، وتلتزم بسداد فوائد دورية والقيمة الاسمية عند الاستحقاق." },

    // الإدارة
    { keywords: ["وظائف الادارة", "ايش وظائف الادارة"], answer: "وظائف الإدارة الأساسية أربعة: التخطيط، التنظيم، التوجيه (القيادة)، والرقابة — تُعرف اختصارًا بدورة الإدارة." },
    { keywords: ["التخطيط الاستراتيجي", "ايش التخطيط الاستراتيجي"], answer: "التخطيط الاستراتيجي عملية تحديد المنشأة لأهدافها طويلة المدى والخطط اللازمة لتحقيقها، بناءً على تحليل البيئة الداخلية والخارجية." },
    { keywords: ["تحليل سوات", "SWOT"], answer: "تحليل SWOT أداة تخطيط استراتيجي تحدد نقاط القوة والضعف الداخلية للمنشأة، والفرص والتهديدات في بيئتها الخارجية." },
    { keywords: ["الفرق بين القيادة والادارة"], answer: "الإدارة تركز على التخطيط والتنظيم والرقابة لتحقيق الكفاءة ضمن الأنظمة القائمة. القيادة تركز على التأثير والإلهام وتوجيه الأفراد نحو رؤية ومستقبل." },
    { keywords: ["ايش الهيكل التنظيمي", "الهيكل التنظيمي"], answer: "الهيكل التنظيمي هو الإطار الذي يوضح توزيع الأدوار والمسؤوليات وخطوط السلطة والتواصل داخل المنشأة." },
    { keywords: ["انواع الهياكل التنظيمية", "هيكل وظيفي قطاعي مصفوفي"], answer: "من أبرز أنواع الهياكل التنظيمية: الوظيفي (حسب التخصص كالتسويق والمالية)، القطاعي (حسب المنتج أو المنطقة)، والمصفوفي (يجمع بين الاثنين)." },
    { keywords: ["ادارة الوقت", "اهمية ادارة الوقت"], answer: "إدارة الوقت هي تنظيم واستغلال الوقت بفعالية لإنجاز المهام حسب أولويتها، وتساعد على رفع الإنتاجية وتقليل الضغط والتأجيل." },
    { keywords: ["اتخاذ القرار الاداري", "مراحل اتخاذ القرار"], answer: "مراحل اتخاذ القرار الإداري عادة: تحديد المشكلة، جمع المعلومات، توليد البدائل، تقييمها، اختيار الأفضل، ثم التنفيذ ومتابعة النتائج." },
    { keywords: ["نطاق الاشراف", "span of control"], answer: "نطاق الإشراف هو عدد المرؤوسين الذين يمكن لمدير واحد الإشراف عليهم بفعالية؛ كلما زاد العدد قلّت مستويات الهيكل التنظيمي." },
    { keywords: ["المركزية واللامركزية", "الفرق بين المركزية واللامركزية"], answer: "المركزية تركّز سلطة اتخاذ القرار في الإدارة العليا. اللامركزية توزّع هذه السلطة على المستويات الإدارية الأدنى لتسريع القرارات ومرونتها." },
    { keywords: ["ادارة التغيير", "ايش ادارة التغيير"], answer: "إدارة التغيير هي المنهج المنظم لإدارة انتقال الأفراد والمنشأة من وضع حالي إلى وضع مستقبلي مرغوب، بهدف تقليل المقاومة وضمان نجاح التغيير." },
    { keywords: ["انماط القيادة", "قيادة استبدادية ديمقراطية تفويضية"], answer: "من أبرز أنماط القيادة: الاستبدادية (القرار بيد القائد وحده)، الديمقراطية (تشارك الفريق بالقرار)، والتفويضية (تفويض صلاحيات واسعة للفريق)." },
    { keywords: ["ادارة الجودة الشاملة", "TQM"], answer: "إدارة الجودة الشاملة (TQM) فلسفة إدارية تسعى لتحسين الجودة بشكل مستمر بمشاركة جميع العاملين، بهدف تحقيق رضا العميل بأعلى كفاءة ممكنة." },
    { keywords: ["نظرية اكس ونظرية واي", "نظرية X و Y"], answer: "نظرية X تفترض أن الموظف كسول بطبعه ويحتاج رقابة صارمة. نظرية Y تفترض أن الموظف طموح ويحب العمل ويحتاج تحفيز وثقة لا رقابة مشددة." },
    { keywords: ["ادارة الازمات", "ايش ادارة الازمات"], answer: "إدارة الأزمات هي العملية التي تستعد فيها المنشأة للتعامل مع أحداث طارئة أو غير متوقعة تهدد أعمالها، بهدف تقليل الضرر واستعادة الوضع الطبيعي بأسرع وقت." },
    { keywords: ["الثقافة التنظيمية", "ايش الثقافة التنظيمية"], answer: "الثقافة التنظيمية هي مجموعة القيم والمعتقدات والسلوكيات المشتركة بين أعضاء المنشأة، وتؤثر على طريقة عملهم واتخاذهم للقرارات." },
    { keywords: ["العصف الذهني", "brainstorming"], answer: "العصف الذهني أسلوب جماعي لتوليد أكبر عدد من الأفكار حول مشكلة معينة بحرية وبدون نقد فوري، ثم تُقيَّم الأفكار لاحقًا لاختيار الأنسب." },
    { keywords: ["مؤشرات الاداء الرئيسية", "KPI"], answer: "مؤشرات الأداء الرئيسية (KPIs) مقاييس كمية تستخدمها المنشأة لتقييم مدى نجاحها في تحقيق أهدافها الاستراتيجية والتشغيلية." },
    { keywords: ["ادارة المشاريع", "مراحل ادارة المشروع"], answer: "مراحل إدارة المشروع غالبًا: البدء، التخطيط، التنفيذ، المراقبة والتحكم، ثم الإغلاق — وتهدف لإنجاز المشروع ضمن الوقت والتكلفة والجودة المحددة." },
    { keywords: ["الفرق بين الكفاءة والفعالية"], answer: "الكفاءة تعني إنجاز العمل بأقل موارد ممكنة (فعل الأشياء بطريقة صحيحة). الفعالية تعني تحقيق الهدف المطلوب فعلًا (فعل الأشياء الصحيحة)." },
    { keywords: ["التمكين الاداري", "empowerment"], answer: "التمكين الإداري هو منح الموظفين صلاحية اتخاذ قرارات تخص عملهم، مما يزيد شعورهم بالمسؤولية والثقة ويحسّن سرعة الاستجابة." },
    { keywords: ["ايش التفويض", "delegation"], answer: "التفويض هو إسناد المدير جزءًا من مهامه وصلاحياته لأحد مرؤوسيه، مع بقاء المسؤولية النهائية عليه، لتخفيف العبء وتطوير قدرات الفريق." },
    { keywords: ["الفرق بين التفويض والتمكين"], answer: "التفويض إسناد مهام محددة مؤقتًا مع بقاء الرقابة للمدير. التمكين منح صلاحية اتخاذ القرار بشكل دائم وأوسع، مع ثقة أكبر بحكم الموظف." },
    { keywords: ["ادارة الموارد البشرية", "HR"], answer: "إدارة الموارد البشرية هي الوظيفة الإدارية المسؤولة عن استقطاب الموظفين وتعيينهم وتدريبهم وتقييمهم وتحفيزهم، لتحقيق أهداف المنشأة عبر أفرادها." },
    { keywords: ["دورة التوظيف", "recruitment"], answer: "دورة التوظيف تمر بمراحل: تحديد الاحتياج الوظيفي، الاستقطاب، الفرز والمقابلات، الاختيار، ثم التعيين والتأهيل." },
    { keywords: ["تقييم الاداء الوظيفي", "performance appraisal"], answer: "تقييم الأداء الوظيفي عملية قياس مدى إنجاز الموظف لمهامه وأهدافه خلال فترة معينة، وتُستخدم نتائجه للترقية أو التدريب أو الحوافز." },
    { keywords: ["التدريب والتطوير", "training and development"], answer: "التدريب والتطوير هو تزويد الموظفين بالمعارف والمهارات اللازمة لتحسين أدائهم الحالي والمستقبلي، ويشمل برامج داخلية وخارجية." },
    { keywords: ["الحوافز الوظيفية", "incentives"], answer: "الحوافز الوظيفية مكافآت مادية أو معنوية تمنحها المنشأة للموظفين لتحفيزهم على تحسين أدائهم، كالعلاوات والترقيات والتقدير." },
    { keywords: ["الرضا الوظيفي", "job satisfaction"], answer: "الرضا الوظيفي هو شعور الموظف الإيجابي تجاه عمله وبيئته، ويرتبط بعوامل كالراتب وفرص التطور وطبيعة المهام والعلاقة مع الإدارة." },
    { keywords: ["دوران الموظفين", "employee turnover"], answer: "دوران الموظفين هو معدل ترك الموظفين للمنشأة خلال فترة معينة، سواء طوعيًا أو غير طوعي، وارتفاعه يدل غالبًا على مشكلة ببيئة العمل أو الحوافز." },
    { keywords: ["العمل الجماعي وفرق العمل", "teamwork"], answer: "العمل الجماعي هو تعاون مجموعة أفراد لتحقيق هدف مشترك، ويعتمد نجاحه على التواصل الجيد وتوزيع الأدوار والثقة المتبادلة بين أعضاء الفريق." },
    { keywords: ["الاتصال الاداري", "communication"], answer: "الاتصال الإداري هو تبادل المعلومات والأفكار بين مستويات المنشأة المختلفة، وهو ركيزة أساسية لنجاح التخطيط والتنسيق واتخاذ القرار." },
    { keywords: ["حل النزاعات", "conflict resolution"], answer: "حل النزاعات هو الأساليب التي تستخدمها الإدارة لمعالجة الخلافات بين الأفراد أو الأقسام، بهدف الوصول لحل يرضي الأطراف ويحافظ على بيئة عمل صحية." },
    { keywords: ["التخطيط التشغيلي", "operational planning"], answer: "التخطيط التشغيلي هو ترجمة الخطط الاستراتيجية طويلة المدى إلى خطط تفصيلية قصيرة المدى قابلة للتنفيذ اليومي بالأقسام المختلفة." },
    { keywords: ["الفرق بين التخطيط الاستراتيجي والتشغيلي"], answer: "التخطيط الاستراتيجي يحدد الأهداف العامة طويلة المدى للمنشأة كاملة. التخطيط التشغيلي يحدد الخطوات التفصيلية قصيرة المدى لتنفيذ تلك الأهداف بكل قسم." },
    { keywords: ["نظرية ماسلو", "maslow"], answer: "نظرية ماسلو ترتب احتياجات الإنسان بهرم من خمس مستويات: الفسيولوجية، الأمان، الانتماء، التقدير، وتحقيق الذات، ويحفّز الفرد إشباع المستوى الأدنى أولًا." },
    { keywords: ["نظرية هيرزبرغ للتحفيز", "herzberg"], answer: "نظرية هيرزبرغ تقسم عوامل العمل إلى نوعين: عوامل صحية (كالراتب) تمنع عدم الرضا فقط، وعوامل محفزة (كالإنجاز والتقدير) تسبب رضا ودافعية حقيقية." },
    { keywords: ["مصفوفة ايزنهاور", "eisenhower matrix"], answer: "مصفوفة أيزنهاور أداة لإدارة الوقت تصنّف المهام حسب الأهمية والعاجلية إلى أربع فئات، لمساعدة الفرد على تحديد أولويات إنجازه." },
    { keywords: ["الادارة بالاهداف", "management by objectives"], answer: "الإدارة بالأهداف (MBO) أسلوب إداري يشارك فيه المدير والموظف بتحديد أهداف واضحة ومحددة معًا، ثم يُقيَّم أداء الموظف بناءً على مدى تحقيقها." },
    { keywords: ["بيئة الاعمال الخارجية والداخلية"], answer: "البيئة الداخلية تشمل عوامل تتحكم بها المنشأة كالموارد والثقافة التنظيمية. البيئة الخارجية تشمل عوامل خارج سيطرتها كالمنافسين والاقتصاد والتشريعات." },
    { keywords: ["المسؤولية الاجتماعية للشركات", "CSR"], answer: "المسؤولية الاجتماعية للشركات (CSR) هي التزام المنشأة الطوعي بالمساهمة الإيجابية بالمجتمع والبيئة، بجانب تحقيق أهدافها الربحية." },
    { keywords: ["الحوكمة المؤسسية", "corporate governance"], answer: "الحوكمة المؤسسية هي مجموعة الأنظمة والقواعد التي تحدد كيفية إدارة المنشأة ورقابتها، بما يضمن الشفافية والعدالة وحماية حقوق المساهمين وأصحاب المصلحة." },
    { keywords: ["اخلاقيات العمل", "business ethics"], answer: "أخلاقيات العمل هي المبادئ والقيم التي توجّه سلوك الأفراد والمنشآت في التعاملات التجارية، كالصدق والأمانة والعدالة واحترام حقوق الآخرين." },
    { keywords: ["ادارة سلسلة الامداد", "supply chain management"], answer: "إدارة سلسلة الإمداد هي تنسيق جميع الأنشطة المرتبطة بتدفق المواد والمعلومات من المورد وحتى وصول المنتج للعميل النهائي، بأعلى كفاءة وأقل تكلفة." },

    // التسويق
    { keywords: ["ايش التسويق", "تعريف التسويق"], answer: "التسويق هو مجموعة الأنشطة التي تهدف لفهم احتياجات العميل وخلق قيمة له من خلال منتج أو خدمة، وتوصيلها له بطريقة تحقق رضاه وتحقق أهداف المنشأة." },
    { keywords: ["المزيج التسويقي", "4Ps", "العناصر الاربعة للتسويق"], answer: "المزيج التسويقي (4Ps) يتكون من: المنتج (Product)، السعر (Price)، الترويج (Promotion)، والتوزيع/المكان (Place)." },
    { keywords: ["تجزئة السوق", "market segmentation"], answer: "تجزئة السوق هي تقسيم السوق الكلي إلى مجموعات أصغر من العملاء متشابهة الاحتياجات والخصائص، لاستهداف كل مجموعة بعرض مناسب لها." },
    { keywords: ["الفرق بين البيع والتسويق"], answer: "البيع يركز على إقناع العميل بشراء منتج جاهز. التسويق أوسع ويبدأ قبل الإنتاج، ويشمل فهم احتياج السوق وتصميم المنتج والتسعير والترويج والتوزيع." },
    { keywords: ["دورة حياة المنتج", "product life cycle"], answer: "دورة حياة المنتج تمر بأربع مراحل: التقديم، النمو، النضج، ثم الانحدار — وتختلف استراتيجية التسويق في كل مرحلة." },
    { keywords: ["العلامة التجارية", "branding"], answer: "العلامة التجارية (Branding) هي الهوية التي تميز منتج أو منشأة عن منافسيها، وتشمل الاسم والشعار والقيم والتجربة التي يربطها العميل بها." },
    { keywords: ["سلوك المستهلك", "consumer behavior"], answer: "سلوك المستهلك هو دراسة كيف يتخذ الأفراد قرارات الشراء، وما يؤثر عليها من عوامل نفسية واجتماعية وثقافية واقتصادية." },
    { keywords: ["البحث التسويقي", "market research"], answer: "البحث التسويقي هو جمع وتحليل بيانات عن السوق والعملاء والمنافسين، لمساعدة المنشأة على اتخاذ قرارات تسويقية مبنية على معلومات دقيقة." },
    { keywords: ["التسويق الرقمي", "digital marketing"], answer: "التسويق الرقمي هو الترويج للمنتجات والخدمات عبر القنوات الإلكترونية كمواقع الإنترنت ومنصات التواصل الاجتماعي ومحركات البحث والبريد الإلكتروني." },
    { keywords: ["الاستهداف والتموضع", "targeting positioning"], answer: "الاستهداف (Targeting) هو اختيار الشريحة أو الشرائح الأنسب لتوجيه الجهد التسويقي لها. التموضع (Positioning) هو بناء صورة ذهنية مميزة للمنتج في ذهن تلك الشريحة مقارنة بالمنافسين." },
    { keywords: ["السوق المستهدف والسوق الكلي", "الفرق بين السوق المستهدف والكلي"], answer: "السوق الكلي يضم جميع العملاء المحتملين لنوع المنتج. السوق المستهدف هو الشريحة المحددة التي تختار المنشأة التركيز عليها من ذلك السوق الكلي." },
    { keywords: ["استراتيجية التسعير", "pricing strategy"], answer: "استراتيجية التسعير هي الطريقة التي تحدد بها المنشأة سعر منتجها، بناءً على التكلفة أو المنافسة أو القيمة المدركة لدى العميل، بما يحقق الربحية والقدرة التنافسية." },
    { keywords: ["الترويج وادواته", "ايش الترويج"], answer: "الترويج هو الأنشطة التي تُبلّغ العميل بالمنتج وتقنعه بشرائه، وأدواته تشمل: الإعلان، البيع الشخصي، تنشيط المبيعات، والعلاقات العامة." },
    { keywords: ["ولاء العميل", "customer loyalty"], answer: "ولاء العميل هو ارتباط العميل المستمر بعلامة تجارية معينة وتفضيله لها بشكل متكرر مقارنة بالمنافسين، نتيجة رضاه عن المنتج أو الخدمة." },
    { keywords: ["تحليل المنافسين", "competitor analysis"], answer: "تحليل المنافسين هو دراسة نقاط القوة والضعف واستراتيجيات المنافسين في السوق، لمساعدة المنشأة على بناء ميزة تنافسية أوضح." },
    { keywords: ["التسويق عبر المؤثرين", "influencer marketing"], answer: "التسويق عبر المؤثرين هو الترويج للمنتجات من خلال أشخاص لديهم تأثير وجمهور كبير على منصات التواصل الاجتماعي، للاستفادة من ثقة متابعيهم بهم." },
    { keywords: ["الفرق بين B2B و B2C"], answer: "B2B (Business to Business) هو التعامل التجاري بين منشأتين. B2C (Business to Consumer) هو التعامل التجاري بين المنشأة والمستهلك النهائي مباشرة." },
    { keywords: ["قيمة العلامة التجارية", "brand equity"], answer: "قيمة العلامة التجارية (Brand Equity) هي القيمة الإضافية التي يكتسبها المنتج من اسمه وسمعته، وتجعل العملاء يفضلونه ويدفعون سعرًا أعلى مقارنة بمنتج مشابه بدون تلك العلامة." },
    { keywords: ["استراتيجية التوزيع", "place"], answer: "استراتيجية التوزيع (Place) تحدد القنوات والأماكن التي يصل من خلالها المنتج للعميل، سواء مباشرة أو عبر وسطاء كتجار الجملة والتجزئة." },
    { keywords: ["القيمة المدركة للعميل", "perceived value"], answer: "القيمة المدركة للعميل هي تقييم العميل للفائدة التي يحصل عليها من المنتج مقارنة بما دفعه مقابله، وهي أساس قرار الشراء غالبًا." },
    { keywords: ["ايش الاعلان", "advertising"], answer: "الإعلان هو شكل مدفوع وغير شخصي من الترويج، يهدف لإعلام الجمهور المستهدف بالمنتج أو الخدمة وإقناعه بها عبر وسائل الإعلام المختلفة." },
    { keywords: ["العلاقات العامة", "PR"], answer: "العلاقات العامة (PR) هي الأنشطة التي تبني وتحافظ على صورة إيجابية للمنشأة لدى الجمهور والإعلام، عبر وسائل غير مدفوعة مباشرة كالبيانات الصحفية والفعاليات." },
    { keywords: ["تنشيط المبيعات", "sales promotion"], answer: "تنشيط المبيعات هو حوافز قصيرة المدى تشجع على شراء فوري، كالخصومات المؤقتة والعروض والمسابقات وعينات التجربة المجانية." },
    { keywords: ["البيع الشخصي", "personal selling"], answer: "البيع الشخصي هو تواصل مباشر بين مندوب مبيعات والعميل المحتمل، بهدف إقناعه وإتمام عملية الشراء بشكل مخصص لاحتياجاته." },
    { keywords: ["التسويق بالمحتوى", "content marketing"], answer: "التسويق بالمحتوى هو إنشاء ونشر محتوى مفيد وذو قيمة (مقالات، فيديوهات) لجذب الجمهور المستهدف وبناء ثقته، بدل الترويج المباشر للمنتج." },
    { keywords: ["تحسين محركات البحث", "SEO"], answer: "تحسين محركات البحث (SEO) هو تهيئة المحتوى والموقع الإلكتروني لتحسين ظهوره بنتائج محركات البحث كقوقل، لجذب زيارات مجانية أكثر." },
    { keywords: ["التسويق عبر البريد الالكتروني", "email marketing"], answer: "التسويق عبر البريد الإلكتروني هو إرسال رسائل ترويجية أو تعريفية للعملاء عبر إيميلاتهم، لتحفيزهم على الشراء أو الحفاظ على تواصلهم مع العلامة التجارية." },
    { keywords: ["استطلاعات الراي التسويقية", "surveys"], answer: "استطلاعات الرأي التسويقية أداة بحث تجمع آراء العملاء عبر أسئلة محددة، لفهم تفضيلاتهم ورضاهم عن المنتج أو الخدمة." },
    { keywords: ["اختبار السوق", "test marketing"], answer: "اختبار السوق هو طرح منتج جديد بسوق محدود صغير قبل إطلاقه بالكامل، لقياس ردة فعل العملاء وتعديل الاستراتيجية قبل التوسع." },
    { keywords: ["استراتيجية اختراق السوق", "market penetration"], answer: "استراتيجية اختراق السوق هي زيادة حصة المنشأة من سوق حالي بمنتج حالي، عادة عبر خفض السعر أو تكثيف الترويج." },
    { keywords: ["استراتيجية تطوير السوق", "market development"], answer: "استراتيجية تطوير السوق هي طرح منتج حالي بأسواق أو شرائح عملاء جديدة لم تخدمها المنشأة من قبل." },
    { keywords: ["مصفوفة انسوف", "ansoff matrix"], answer: "مصفوفة أنسوف أداة استراتيجية تحدد أربع استراتيجيات نمو للمنشأة: اختراق السوق، تطوير السوق، تطوير المنتج، والتنويع." },
    { keywords: ["دورة حياة العميل", "customer lifecycle"], answer: "دورة حياة العميل تمر بمراحل: الوعي بالمنتج، الاهتمام، الشراء، ثم الولاء والتكرار، وتساعد فهمها على تصميم استراتيجية تسويقية لكل مرحلة." },
    { keywords: ["تجربة العميل", "customer experience"], answer: "تجربة العميل هي انطباع العميل الكلي عن تفاعله مع المنشأة عبر جميع نقاط التواصل، من الشراء وحتى خدمة ما بعد البيع." },
    { keywords: ["خدمة ما بعد البيع", "after sales service"], answer: "خدمة ما بعد البيع هي الدعم الذي تقدمه المنشأة للعميل بعد إتمام عملية الشراء، كالصيانة والضمان والرد على الاستفسارات، وتعزز ولاء العميل." },
    { keywords: ["المزيج الترويجي", "promotion mix"], answer: "المزيج الترويجي هو مجموعة أدوات الترويج التي تستخدمها المنشأة معًا: الإعلان، البيع الشخصي، تنشيط المبيعات، العلاقات العامة، والتسويق المباشر." },
    { keywords: ["نظام معلومات التسويق", "marketing information system"], answer: "نظام معلومات التسويق هو نظام يجمع ويحلل بيانات عن السوق والعملاء والمنافسين بشكل مستمر، لدعم قرارات التسويق بمعلومات دقيقة ومحدّثة." },
    { keywords: ["البيئة التسويقية", "marketing environment"], answer: "البيئة التسويقية تشمل كل العوامل المؤثرة على قدرة المنشأة على خدمة عملائها، وتنقسم لبيئة داخلية (تتحكم بها المنشأة) وخارجية (اقتصادية، اجتماعية، تقنية، تنافسية)." },
    { keywords: ["القيمة مدى الحياة للعميل", "customer lifetime value"], answer: "القيمة مدى الحياة للعميل (CLV) تقدّر إجمالي الأرباح المتوقعة من عميل واحد طوال فترة تعامله مع المنشأة، وتساعد في تحديد مقدار الإنفاق المناسب لاستقطابه." },
    { keywords: ["نقاط البيع", "point of sale"], answer: "نقاط البيع (Point of Sale) هي الأماكن أو الأنظمة التي تتم فيها عملية البيع الفعلية للعميل، سواء متجر فعلي أو منصة إلكترونية، وتشمل غالبًا نظام تسجيل المبيعات." },

    // التمويل والاستثمار
    { keywords: ["الادارة المالية", "ايش الادارة المالية", "financial management"], answer: "الإدارة المالية هي التخطيط والتنظيم والرقابة على الموارد المالية للمنشأة، بهدف تعظيم قيمتها وثروة ملاكها." },
    { keywords: ["القيمة الزمنية للنقود", "time value of money"], answer: "القيمة الزمنية للنقود مبدأ يقول إن الريال اليوم يساوي أكثر من الريال نفسه بالمستقبل، بسبب إمكانية استثماره وتحقيق عائد عليه." },
    { keywords: ["صافي القيمة الحالية", "NPV"], answer: "صافي القيمة الحالية (NPV) هو الفرق بين القيمة الحالية للتدفقات النقدية المتوقعة من مشروع والتكلفة الأولية له؛ إذا كانت النتيجة موجبة فالمشروع مجدٍ استثماريًا." },
    { keywords: ["معدل العائد الداخلي", "IRR"], answer: "معدل العائد الداخلي (IRR) هو معدل الخصم الذي يجعل صافي القيمة الحالية لمشروع يساوي صفر، ويُستخدم لمقارنة جدوى المشاريع الاستثمارية." },
    { keywords: ["راس المال العامل", "working capital"], answer: "رأس المال العامل هو الفرق بين الأصول المتداولة والخصوم المتداولة، ويعكس قدرة المنشأة على تغطية التزاماتها قصيرة الأجل." },
    { keywords: ["الفرق بين الاسهم والسندات"], answer: "السهم يمثل حصة ملكية في الشركة ويمنح صاحبه حق في الأرباح والتصويت. السند أداة دين، صاحبه دائن للشركة ويستحق فائدة ثابتة بغض النظر عن ربحيتها." },
    { keywords: ["ايش السيولة", "liquidity"], answer: "السيولة هي قدرة المنشأة على تحويل أصولها إلى نقد بسرعة لتغطية التزاماتها القصيرة الأجل دون خسارة كبيرة في القيمة." },
    { keywords: ["نسبة التداول", "current ratio"], answer: "نسبة التداول تقيس قدرة المنشأة على سداد التزاماتها قصيرة الأجل من أصولها المتداولة، وتُحسب بقسمة الأصول المتداولة على الخصوم المتداولة." },
    { keywords: ["الرافعة المالية", "financial leverage"], answer: "الرافعة المالية هي استخدام الديون لتمويل أصول المنشأة بهدف تعظيم العائد على حقوق الملكية، لكنها ترفع أيضًا مستوى المخاطرة المالية." },
    { keywords: ["تنويع المحفظة", "diversification"], answer: "تنويع المحفظة الاستثمارية هو توزيع الاستثمار على أصول مختلفة لتقليل المخاطر الكلية، بدل تركيز كل رأس المال في أصل واحد." },
    { keywords: ["المخاطرة والعائد", "risk and return"], answer: "العلاقة بين المخاطرة والعائد طردية عمومًا: كل ما زادت المخاطرة المتوقعة لاستثمار معين، زاد العائد المطلوب من المستثمر مقابل تحمّل تلك المخاطرة." },
    { keywords: ["السوق المالي وانواعه", "الاسواق المالية"], answer: "السوق المالي هو المكان الذي تُتداول فيه الأدوات المالية كالأسهم والسندات، وينقسم أساسًا إلى سوق أولي (إصدار جديد) وسوق ثانوي (تداول لاحق)." },
    { keywords: ["السوق الاولي والثانوي", "الفرق بين السوق الاولي والثانوي"], answer: "السوق الأولي هو المكان الذي تُصدر فيه الشركة أوراقها المالية لأول مرة (كالطرح العام). السوق الثانوي هو تداول تلك الأوراق بين المستثمرين بعد إصدارها." },
    { keywords: ["تقييم الشركات", "valuation"], answer: "تقييم الشركات هو تقدير القيمة الاقتصادية العادلة للمنشأة أو أسهمها، باستخدام طرق مثل التدفقات النقدية المخصومة أو المقارنة بشركات مشابهة." },
    { keywords: ["الميزانية الراسمالية", "capital budgeting"], answer: "الميزانية الرأسمالية هي عملية تقييم واختيار المشاريع الاستثمارية طويلة الأجل التي تستحق أن تستثمر فيها المنشأة مواردها." },
    { keywords: ["التضخم وتاثيره على الاستثمار"], answer: "التضخم يقلل القوة الشرائية للنقود بمرور الوقت، لذا يحتاج المستثمر عائدًا أعلى من معدل التضخم للحفاظ على القيمة الحقيقية لاستثماره." },
    { keywords: ["صناديق الاستثمار", "investment funds"], answer: "صناديق الاستثمار أوعية مالية تجمع أموال عدد من المستثمرين وتستثمرها بشكل جماعي (بأسهم أو سندات أو عقار مثلًا) يديرها مدير استثمار محترف." },
    { keywords: ["التمويل بالدين والتمويل بالملكية", "الفرق بين التمويل بالدين والملكية"], answer: "التمويل بالدين يعني الاقتراض وسداد فوائد، ويبقى حق الملكية كما هو. التمويل بالملكية يعني بيع حصة من الشركة مقابل رأس مال، بدون التزام سداد لكن بتنازل عن جزء من الملكية والتحكم." },
    { keywords: ["معدل الفائدة", "interest rate"], answer: "معدل الفائدة هو تكلفة اقتراض المال أو العائد على إقراضه، ويؤثر مباشرة على قرارات الاستثمار والاقتراض والاستهلاك بالاقتصاد." },
    { keywords: ["ادارة المخاطر المالية", "financial risk management"], answer: "إدارة المخاطر المالية هي تحديد وتحليل المخاطر المالية التي تواجه المنشأة (كمخاطر السوق أو الائتمان) واتخاذ إجراءات للحد منها أو التحوط ضدها." },
    { keywords: ["هامش الربح", "profit margin"], answer: "هامش الربح يقيس نسبة الربح من إجمالي المبيعات، ويُحسب بقسمة صافي الربح على الإيرادات، ويعكس مدى كفاءة المنشأة بالتحكم بتكاليفها." },
    { keywords: ["العائد على الاستثمار", "ROI"], answer: "العائد على الاستثمار (ROI) يقيس مدى ربحية استثمار معين، ويُحسب بقسمة صافي الربح من الاستثمار على تكلفته الأصلية." },
    { keywords: ["العائد على حقوق الملكية", "ROE"], answer: "العائد على حقوق الملكية (ROE) يقيس مدى كفاءة المنشأة في تحقيق أرباح من أموال المساهمين، ويُحسب بقسمة صافي الربح على حقوق الملكية." },
    { keywords: ["العائد على الاصول", "ROA"], answer: "العائد على الأصول (ROA) يقيس مدى كفاءة المنشأة في استخدام أصولها لتوليد أرباح، ويُحسب بقسمة صافي الربح على إجمالي الأصول." },
    { keywords: ["نسبة الدين الى حقوق الملكية", "debt to equity"], answer: "نسبة الدين إلى حقوق الملكية تقيس مدى اعتماد المنشأة على الاقتراض مقارنة بأموال ملاكها، وارتفاعها يدل على مخاطرة مالية أعلى." },
    { keywords: ["التحليل المالي", "financial analysis"], answer: "التحليل المالي هو دراسة القوائم المالية للمنشأة باستخدام نسب ومؤشرات مختلفة، لتقييم أدائها المالي ومركزها وقدرتها على السداد والربحية." },
    { keywords: ["التحليل الراسي والافقي", "vertical horizontal analysis"], answer: "التحليل الرأسي يعبّر عن كل بند بالقائمة المالية كنسبة من بند أساسي (كالمبيعات). التحليل الأفقي يقارن نفس البند عبر عدة فترات زمنية لمعرفة اتجاه التغير." },
    { keywords: ["الموازنة النقدية", "cash budget"], answer: "الموازنة النقدية خطة تقدّر التدفقات النقدية الداخلة والخارجة للمنشأة خلال فترة مستقبلية، لضمان توفر السيولة الكافية لتغطية الالتزامات." },
    { keywords: ["التخطيط المالي", "financial planning"], answer: "التخطيط المالي هو تحديد الأهداف المالية للمنشأة ووضع الخطط اللازمة لتحقيقها، من خلال إدارة الإيرادات والمصروفات والاستثمارات والتمويل." },
    { keywords: ["ادارة النقدية", "cash management"], answer: "إدارة النقدية هي التخطيط والرقابة على تدفقات النقد الداخلة والخارجة، لضمان توفر سيولة كافية دون الاحتفاظ بنقد فائض غير مستثمر." },
    { keywords: ["ادارة الذمم المدينة", "accounts receivable management"], answer: "إدارة الذمم المدينة هي متابعة تحصيل المبالغ المستحقة من العملاء بالوقت المناسب، لتقليل مخاطر التعثر وتحسين السيولة." },
    { keywords: ["الاوراق المالية المشتقة", "derivatives"], answer: "الأوراق المالية المشتقة أدوات مالية تشتق قيمتها من أصل أساسي آخر (كالأسهم أو السلع)، وتُستخدم غالبًا للتحوط من المخاطر أو للمضاربة." },
    { keywords: ["العقود الاجلة", "futures"], answer: "العقود الآجلة (Futures) اتفاقيات بشراء أو بيع أصل معين بسعر محدد بتاريخ مستقبلي، تُستخدم للتحوط من تقلبات الأسعار أو للمضاربة." },
    { keywords: ["خيارات الاسهم", "stock options"], answer: "خيارات الأسهم (Options) عقود تمنح حاملها الحق (وليس الالتزام) بشراء أو بيع سهم بسعر محدد خلال فترة معينة، وتُستخدم للتحوط أو المضاربة." },
    { keywords: ["التامين وادارة المخاطر"], answer: "التأمين أداة لنقل المخاطر من الفرد أو المنشأة إلى شركة تأمين مقابل قسط دوري، مقابل تعويض عن خسائر محتملة كالحريق أو الحوادث." },
    { keywords: ["التمويل الاسلامي", "islamic finance"], answer: "التمويل الإسلامي نظام مالي يلتزم بأحكام الشريعة الإسلامية، ويحرّم الفائدة الربوية ويعتمد صيغًا بديلة كالمرابحة والمشاركة والإجارة." },
    { keywords: ["المرابحة", "murabaha"], answer: "المرابحة صيغة تمويل إسلامية تشتري فيها المؤسسة المالية سلعة ثم تبيعها للعميل بسعر التكلفة زائد ربح متفق عليه، يُسدَّد غالبًا بالتقسيط." },
    { keywords: ["الصكوك", "sukuk"], answer: "الصكوك أداة استثمار إسلامية بديلة للسندات التقليدية، تمثّل حصة ملكية في أصل أو مشروع معين، ويحصل حاملها على عائد مرتبط بأداء ذلك الأصل بدل فائدة ثابتة." },
    { keywords: ["سوق الاسهم السعودي", "تاسي", "tadawul"], answer: "تاسي هو المؤشر الرئيسي للسوق المالية السعودية (تداول)، ويعكس أداء أسعار أسهم الشركات المدرجة فيه ككل." },
    { keywords: ["صندوق التقاعد والاستثمار طويل الاجل"], answer: "صناديق التقاعد استثمارات طويلة الأجل تهدف لتجميع مبالغ منتظمة على مدى سنوات، لتوفير دخل مالي للمستثمر بعد تقاعده من العمل." },

    // نظم المعلومات الإدارية
    { keywords: ["نظم المعلومات الادارية", "MIS"], answer: "نظم المعلومات الإدارية (MIS) هي أنظمة تجمع وتعالج البيانات داخل المنشأة وتحولها لمعلومات تدعم اتخاذ القرار الإداري بكل المستويات." },
    { keywords: ["نظام تخطيط موارد المؤسسات", "ERP"], answer: "نظام تخطيط موارد المؤسسات (ERP) نظام متكامل يربط كل إدارات المنشأة (المالية، المخزون، الموارد البشرية، المبيعات) في قاعدة بيانات واحدة لتسهيل التنسيق واتخاذ القرار." },
    { keywords: ["قواعد البيانات", "database"], answer: "قاعدة البيانات هي مجموعة منظمة من البيانات المخزنة إلكترونيًا بطريقة تسمح بالوصول إليها وتحديثها وإدارتها بكفاءة." },
    { keywords: ["نظم دعم القرار", "DSS"], answer: "نظم دعم القرار (DSS) أنظمة تحليلية تساعد المدراء على اتخاذ قرارات أفضل من خلال تحليل البيانات وتقديم سيناريوهات وتوقعات مختلفة." },
    { keywords: ["الفرق بين البيانات والمعلومات"], answer: "البيانات هي حقائق أو أرقام خام غير معالجة. المعلومات هي بيانات تمت معالجتها وتنظيمها لتصبح ذات معنى ومفيدة لاتخاذ القرار." },
    { keywords: ["امن المعلومات", "information security"], answer: "أمن المعلومات هو حماية البيانات والأنظمة من الوصول غير المصرح به أو التلاعب أو الفقدان، ويشمل السرية وسلامة البيانات وتوافرها." },
    { keywords: ["التجارة الالكترونية", "e-commerce"], answer: "التجارة الإلكترونية هي عمليات بيع وشراء السلع والخدمات عبر الإنترنت، بدلًا من القنوات التقليدية." },
    { keywords: ["الذكاء الاصطناعي وعلاقته بالاعمال", "AI في الاعمال"], answer: "الذكاء الاصطناعي في الأعمال يُستخدم لأتمتة المهام وتحليل البيانات الضخمة والتنبؤ بسلوك العملاء، مما يحسّن كفاءة القرارات ويقلل التكاليف." },
    { keywords: ["تحليل البيانات الضخمة", "big data"], answer: "تحليل البيانات الضخمة (Big Data) هو معالجة كميات هائلة ومتنوعة من البيانات لاستخراج أنماط ورؤى تساعد المنشأة على فهم عملائها وسوقها بشكل أدق." },
    { keywords: ["نظم ادارة علاقات العملاء", "CRM"], answer: "نظام إدارة علاقات العملاء (CRM) نظام يساعد المنشأة على تنظيم وتتبع تفاعلاتها مع العملاء الحاليين والمحتملين، بهدف تحسين الخدمة وزيادة المبيعات." },
    { keywords: ["الحوسبة السحابية", "cloud computing"], answer: "الحوسبة السحابية هي تقديم خدمات الحوسبة (تخزين، معالجة، برمجيات) عبر الإنترنت بدل الاعتماد على أجهزة محلية، مما يوفر مرونة وتكلفة أقل." },
    { keywords: ["دورة حياة تطوير النظم", "SDLC"], answer: "دورة حياة تطوير النظم (SDLC) هي المراحل المنظمة لبناء نظام معلومات: التخطيط، التحليل، التصميم، التنفيذ، الاختبار، ثم الصيانة." },
    { keywords: ["البرمجيات كخدمة", "SaaS"], answer: "البرمجيات كخدمة (SaaS) نموذج يتيح استخدام برنامج عبر الإنترنت مقابل اشتراك، بدون الحاجة لتثبيته أو صيانته محليًا على جهاز المستخدم." },
    { keywords: ["الاتمتة في الاعمال", "automation"], answer: "الأتمتة هي استخدام التقنية لتنفيذ المهام المتكررة تلقائيًا بأقل تدخل بشري، مما يرفع الكفاءة ويقلل الأخطاء البشرية والتكاليف." },
    { keywords: ["دور تقنية المعلومات في اتخاذ القرار"], answer: "تقنية المعلومات توفر بيانات دقيقة وفي الوقت المناسب، وتدعمها بأدوات تحليل وتصور، مما يمكّن المدراء من اتخاذ قرارات أسرع وأكثر دقة." },
    { keywords: ["نظم معالجة المعاملات", "TPS"], answer: "نظم معالجة المعاملات (TPS) أنظمة تسجّل وتعالج العمليات اليومية الروتينية للمنشأة كالمبيعات والمشتريات والرواتب، وتُعد الأساس الذي تُبنى عليه أنظمة المعلومات الأخرى." },
    { keywords: ["نظم المعلومات التنفيذية", "EIS"], answer: "نظم المعلومات التنفيذية (EIS) أنظمة مصممة لخدمة الإدارة العليا، تعرض ملخصات وتقارير استراتيجية سريعة تدعم القرارات رفيعة المستوى." },
    { keywords: ["الشبكات في الاعمال", "networks"], answer: "الشبكات تربط الأجهزة والأنظمة داخل المنشأة وخارجها لتبادل البيانات والموارد بسرعة وكفاءة، وهي البنية الأساسية لعمل أي نظام معلومات حديث." },
    { keywords: ["الهجمات السيبرانية", "cyber attacks"], answer: "الهجمات السيبرانية محاولات خبيثة للوصول غير المصرح به لأنظمة المنشأة أو بياناتها أو تعطيلها، وتشمل الفيروسات والتصيد الاحتيالي وبرامج الفدية." },
    { keywords: ["النسخ الاحتياطي", "backup"], answer: "النسخ الاحتياطي هو حفظ نسخة إضافية من البيانات المهمة بمكان آمن منفصل، لاستعادتها في حال فقدان أو تلف البيانات الأصلية." },
    { keywords: ["تحليل النظم", "systems analysis"], answer: "تحليل النظم هو دراسة احتياجات المنشأة من نظام معلومات معين، وتحديد متطلباته الوظيفية قبل البدء بتصميمه وتطويره." },
    { keywords: ["واجهة المستخدم", "UI UX"], answer: "واجهة المستخدم (UI) هي الشكل الذي يتفاعل معه المستخدم بالنظام. تجربة المستخدم (UX) أوسع وتشمل مدى سهولة وراحة استخدامه للنظام ككل." },
    { keywords: ["انترنت الاشياء", "IoT"], answer: "إنترنت الأشياء (IoT) هو ربط أجهزة مادية (كالمستشعرات والمعدات) بالإنترنت لتبادل البيانات فيما بينها تلقائيًا، وتُستخدم بالأعمال لمراقبة العمليات والمخزون." },
    { keywords: ["سلسلة الكتل", "بلوك تشين", "blockchain"], answer: "سلسلة الكتل (Blockchain) سجل رقمي موزّع وآمن يسجل المعاملات بشكل يصعب تعديله أو التلاعب به، وتُستخدم بالعملات الرقمية وتتبع سلاسل الإمداد." },
    { keywords: ["العملات الرقمية", "cryptocurrency"], answer: "العملات الرقمية أصول رقمية تعتمد على تقنية سلسلة الكتل، تُستخدم كوسيلة تبادل أو استثمار دون الحاجة لجهة مركزية كالبنوك التقليدية." },
    { keywords: ["الفرق بين النظام المركزي واللامركزي بتقنية المعلومات"], answer: "النظام المركزي يخزن ويعالج البيانات بموقع واحد رئيسي. النظام اللامركزي يوزّع المعالجة والتخزين على عدة مواقع أو أجهزة مترابطة." },
    { keywords: ["ادارة المعرفة", "knowledge management"], answer: "إدارة المعرفة هي العملية المنظمة لجمع وتنظيم وتبادل المعرفة والخبرات داخل المنشأة، للاستفادة منها بتحسين الأداء واتخاذ القرار." },
    { keywords: ["الذكاء التجاري", "business intelligence"], answer: "الذكاء التجاري (BI) أدوات وتقنيات تحلل بيانات المنشأة وتحولها لتقارير ولوحات معلومات مرئية، تساعد الإدارة على فهم أدائها واتخاذ قرارات مبنية على بيانات." },

    // الاقتصاد
    { keywords: ["ايش علم الاقتصاد", "تعريف الاقتصاد"], answer: "علم الاقتصاد هو دراسة كيفية تخصيص الموارد المحدودة لإشباع الحاجات غير المحدودة للأفراد والمجتمعات." },
    { keywords: ["العرض والطلب", "supply and demand"], answer: "العرض هو الكمية التي يرغب المنتجون في بيعها بسعر معين. الطلب هو الكمية التي يرغب المستهلكون في شرائها بذلك السعر، ويتحدد السعر التوازني عند تقاطعهما." },
    { keywords: ["التوازن السوقي", "market equilibrium"], answer: "التوازن السوقي هو النقطة التي تتساوى عندها الكمية المعروضة مع الكمية المطلوبة من سلعة معينة، ويستقر عندها السعر ما لم تتغير العوامل المؤثرة." },
    { keywords: ["المرونة السعرية للطلب", "price elasticity"], answer: "المرونة السعرية للطلب تقيس مدى استجابة الكمية المطلوبة من سلعة لتغير سعرها؛ كلما كان الطلب مرنًا أكثر، تغيرت الكمية المطلوبة بنسبة أكبر مع تغير السعر." },
    { keywords: ["الفرق بين الاقتصاد الجزئي والكلي", "micro macro economics"], answer: "الاقتصاد الجزئي يدرس سلوك الأفراد والمنشآت الفردية والأسواق المحددة. الاقتصاد الكلي يدرس الاقتصاد ككل: الناتج المحلي، التضخم، البطالة على مستوى الدولة." },
    { keywords: ["الناتج المحلي الاجمالي", "GDP"], answer: "الناتج المحلي الإجمالي (GDP) هو القيمة الإجمالية لكل السلع والخدمات المنتجة داخل حدود دولة معينة خلال فترة زمنية محددة، ويُستخدم كمقياس رئيسي لحجم الاقتصاد." },
    { keywords: ["ايش التضخم", "inflation"], answer: "التضخم هو الارتفاع المستمر في المستوى العام للأسعار خلال فترة زمنية، مما يؤدي لانخفاض القوة الشرائية للنقود." },
    { keywords: ["البطالة", "unemployment"], answer: "البطالة هي عدم قدرة الأفراد الراغبين والقادرين على العمل على إيجاد وظيفة، وأبرز أنواعها: الاحتكاكية، الهيكلية، والدورية." },
    { keywords: ["السياسة النقدية", "monetary policy"], answer: "السياسة النقدية هي الإجراءات التي يتخذها البنك المركزي للتحكم بعرض النقود وأسعار الفائدة، بهدف ضبط التضخم والتأثير على النشاط الاقتصادي." },
    { keywords: ["السياسة المالية", "fiscal policy"], answer: "السياسة المالية هي استخدام الحكومة للإنفاق العام والضرائب للتأثير على الاقتصاد، كتحفيز النمو أو كبح التضخم." },
    { keywords: ["المنافسة الكاملة والاحتكار", "perfect competition monopoly"], answer: "المنافسة الكاملة سوق يوجد فيه عدد كبير من البائعين والمشترين بلا تأثير فردي على السعر. الاحتكار سوق يسيطر فيه بائع واحد على كامل العرض ويتحكم بالسعر." },
    { keywords: ["الميزة النسبية", "comparative advantage"], answer: "الميزة النسبية هي قدرة دولة أو منشأة على إنتاج سلعة معينة بتكلفة فرصة بديلة أقل مقارنة بغيرها، وهي أساس نظرية التجارة الدولية." },
    { keywords: ["التجارة الدولية", "international trade"], answer: "التجارة الدولية هي تبادل السلع والخدمات بين الدول، وتتيح لكل دولة التخصص فيما تنتجه بكفاءة أعلى والاستفادة من ميزتها النسبية، مما يرفع الرفاهية الاقتصادية للجميع." },
    { keywords: ["دورة الاعمال الاقتصادية", "business cycle"], answer: "دورة الأعمال الاقتصادية هي التقلبات المتكررة في النشاط الاقتصادي بين فترات ازدهار وفترات ركود، وتمر عادة بمراحل: توسع، ذروة، انكماش، وقاع." },
    { keywords: ["الاقتصاد الرقمي", "digital economy"], answer: "الاقتصاد الرقمي هو النشاط الاقتصادي القائم على التقنيات الرقمية والإنترنت، كالتجارة الإلكترونية والخدمات المالية الرقمية ومنصات العمل الحر." },
    { keywords: ["سعر الصرف", "exchange rate"], answer: "سعر الصرف هو قيمة عملة دولة معينة مقابل عملة دولة أخرى، ويؤثر مباشرة على أسعار الصادرات والواردات والتجارة الدولية." },
    { keywords: ["ميزان المدفوعات", "balance of payments"], answer: "ميزان المدفوعات سجل يوثق كل المعاملات المالية بين دولة معينة وبقية دول العالم خلال فترة زمنية، ويشمل التجارة والاستثمار والتحويلات." },
    { keywords: ["العجز والفائض بالموازنة", "budget deficit surplus"], answer: "العجز بالموازنة يحدث عندما تتجاوز نفقات الدولة إيراداتها. الفائض يحدث عندما تتجاوز الإيرادات النفقات، مما يعكس صحة الوضع المالي للدولة." },
    { keywords: ["الدين العام", "public debt"], answer: "الدين العام هو إجمالي المبالغ المستحقة على الحكومة لمقرضين محليين أو أجانب، نتيجة اقتراضها لتمويل عجز موازنتها أو مشاريعها." },
    { keywords: ["احتكار القلة", "oligopoly"], answer: "احتكار القلة سوق يسيطر عليه عدد قليل من المنشآت الكبيرة، وتتأثر قرارات كل منشأة بقرارات منافسيها القلائل بشكل مباشر." },
    { keywords: ["المنافسة الاحتكارية", "monopolistic competition"], answer: "المنافسة الاحتكارية سوق يوجد فيه عدد كبير من البائعين يقدمون منتجات متشابهة لكن متمايزة قليلًا (كالعلامة التجارية)، مما يمنح كل بائع قدرًا من التحكم بالسعر." },
    { keywords: ["الناتج القومي الاجمالي", "GNP"], answer: "الناتج القومي الإجمالي (GNP) يقيس قيمة كل السلع والخدمات التي ينتجها مواطنو دولة معينة، سواء داخل الدولة أو خارجها، بخلاف GDP الذي يقتصر على حدود الدولة الجغرافية." },
    { keywords: ["نصيب الفرد من الناتج المحلي", "GDP per capita"], answer: "نصيب الفرد من الناتج المحلي يُحسب بقسمة الناتج المحلي الإجمالي على عدد السكان، ويُستخدم كمؤشر تقريبي لمستوى المعيشة بالدولة." },
    { keywords: ["معدل النمو الاقتصادي", "economic growth rate"], answer: "معدل النمو الاقتصادي يقيس نسبة التغير بالناتج المحلي الإجمالي بين فترتين، ويعكس مدى توسع النشاط الاقتصادي للدولة." },
    { keywords: ["الفقر وخط الفقر", "poverty line"], answer: "خط الفقر هو الحد الأدنى من الدخل اللازم لتلبية الاحتياجات الأساسية للفرد أو الأسرة، ومن يقل دخله عنه يُصنَّف تحت خط الفقر." },
    { keywords: ["توزيع الدخل", "income distribution"], answer: "توزيع الدخل يصف كيفية تقسيم الدخل القومي بين أفراد المجتمع، ويُستخدم لقياس مدى العدالة الاقتصادية ومستوى التفاوت بين الفئات." },
    { keywords: ["الاقتصاد الكلي المفتوح والمغلق"], answer: "الاقتصاد المفتوح يتفاعل مع بقية دول العالم عبر التجارة والاستثمار. الاقتصاد المغلق لا يتعامل تجاريًا أو ماليًا مع الخارج، وهو نموذج نظري نادر الوجود فعليًا." },
    { keywords: ["رؤية 2030", "رؤية السعودية", "vision 2030"], answer: "رؤية السعودية 2030 خطة استراتيجية شاملة تهدف لتنويع مصادر الدخل بعيدًا عن النفط، وتطوير القطاعات الاقتصادية المختلفة، وتمكين القطاع الخاص والاستثمار." },
    { keywords: ["تنويع مصادر الدخل", "economic diversification"], answer: "تنويع مصادر الدخل هو تقليل اعتماد اقتصاد الدولة على مصدر واحد (كالنفط) وتطوير قطاعات بديلة كالسياحة والصناعة والتقنية، لتحقيق استقرار اقتصادي أكبر." },

    // ريادة الأعمال
    { keywords: ["ايش ريادة الاعمال", "تعريف ريادة الاعمال"], answer: "ريادة الأعمال هي عملية إنشاء مشروع جديد وتطويره، من خلال اكتشاف فرصة سوقية وتحمّل المخاطرة لتحويلها إلى منتج أو خدمة ذات قيمة." },
    { keywords: ["خطة العمل", "business plan"], answer: "خطة العمل (Business Plan) وثيقة تشرح فكرة المشروع وأهدافه واستراتيجيته التسويقية والتشغيلية والمالية، وتُستخدم لتوجيه المشروع وإقناع الممولين." },
    { keywords: ["الشركات الناشئة", "startups"], answer: "الشركات الناشئة (Startups) هي مشاريع جديدة وحديثة التأسيس، غالبًا مبنية على فكرة مبتكرة أو حل تقني، وتهدف للنمو السريع وتوسيع نطاق أعمالها." },
    { keywords: ["التمويل الجماعي", "crowdfunding"], answer: "التمويل الجماعي (Crowdfunding) هو جمع مبالغ مالية صغيرة من عدد كبير من الأفراد عبر منصات إلكترونية، لتمويل مشروع أو فكرة جديدة." },
    { keywords: ["حاضنات ومسرعات الاعمال", "incubators accelerators"], answer: "الحاضنات تدعم الشركات الناشئة في مراحلها الأولى بمساحة عمل وإرشاد وتمويل بسيط. المسرعات تساعد شركات ناشئة أكثر نضجًا على النمو السريع خلال برنامج مكثف قصير المدة." },
    { keywords: ["نموذج العمل التجاري", "business model canvas"], answer: "نموذج العمل التجاري (Business Model Canvas) أداة تخطيط تلخص بمخطط واحد العناصر الأساسية للمشروع: العملاء، القيمة المقدمة، قنوات التوزيع، مصادر الإيراد، والتكاليف." },
    { keywords: ["الابتكار في الاعمال", "innovation"], answer: "الابتكار في الأعمال هو تطوير أفكار أو منتجات أو عمليات جديدة تضيف قيمة للعميل أو تحسّن كفاءة المنشأة، وهو محرك رئيسي للتميز التنافسي." },
    { keywords: ["المخاطرة الريادية", "entrepreneurial risk"], answer: "المخاطرة الريادية هي احتمال فشل المشروع أو خسارة رأس المال المستثمر فيه، وهي سمة ملازمة لريادة الأعمال يتحملها رائد الأعمال مقابل فرصة تحقيق عائد كبير." },
    { keywords: ["الفرق بين رائد الاعمال والموظف"], answer: "الموظف يعمل مقابل راتب ثابت ضمن مخاطرة محدودة. رائد الأعمال يبني مشروعه الخاص ويتحمل كامل المخاطرة المالية، لكنه يحصل على كامل العائد والتحكم في القرار." },
    { keywords: ["مصادر تمويل المشاريع الناشئة", "startup funding sources"], answer: "من أبرز مصادر تمويل المشاريع الناشئة: التمويل الذاتي، العائلة والأصدقاء، المستثمرين الملائكيين، رأس المال المخاطر، التمويل الجماعي، والقروض البنكية." },
    { keywords: ["دراسة الجدوى", "feasibility study"], answer: "دراسة الجدوى تحليل شامل لفكرة مشروع قبل تنفيذه، يشمل الجدوى السوقية والفنية والمالية، لتحديد مدى نجاحه المتوقع قبل استثمار الموارد فيه." },
    { keywords: ["الملكية الفكرية وبراءات الاختراع", "intellectual property"], answer: "الملكية الفكرية حقوق قانونية تحمي إبداعات الفرد أو المنشأة كالاختراعات والعلامات التجارية والمصنفات، وبراءة الاختراع تمنح صاحبها حق حصري باستغلال اختراعه تجاريًا لفترة محددة." },
    { keywords: ["التسجيل التجاري ومتطلباته", "commercial registration"], answer: "السجل التجاري وثيقة رسمية تثبت قيد المنشأة بوزارة التجارة وتمنحها الصفة القانونية لمزاولة النشاط التجاري، ويتطلب عادة اسم تجاري ونشاط محدد ورأس مال." },
    { keywords: ["استراتيجية الخروج", "exit strategy"], answer: "استراتيجية الخروج هي الخطة التي يعتمدها مؤسس أو مستثمر لتسييل حصته من الشركة مستقبلًا، كبيعها لمستثمر آخر أو طرحها للاكتتاب العام." },
    { keywords: ["ريادة الاعمال الاجتماعية", "social entrepreneurship"], answer: "ريادة الأعمال الاجتماعية هي إنشاء مشاريع تجمع بين تحقيق الربح وحل مشكلة اجتماعية أو بيئية معينة، بدل التركيز على الربح فقط." },
    { keywords: ["نموذج الاشتراك", "subscription model"], answer: "نموذج الاشتراك نموذج عمل يدفع فيه العميل مبلغًا دوريًا (شهريًا أو سنويًا) مقابل استمرار استخدام منتج أو خدمة، بدل شراء لمرة واحدة." },
    { keywords: ["فريق التاسيس", "founding team"], answer: "فريق التأسيس هم الأشخاص الذين ينشئون المشروع الناشئ سويًا منذ بدايته، وتنوع مهاراتهم (تقنية، تسويقية، مالية) يُعد عامل نجاح مهم للمشروع." },
    { keywords: ["الشراكة التجارية", "business partnership"], answer: "الشراكة التجارية اتفاق بين طرفين أو أكثر على تأسيس مشروع مشترك، يتقاسمون فيه رأس المال والإدارة والأرباح والمخاطر وفق نسب متفق عليها." },

    // أسئلة عن النادي
    { keywords: ["من سوى الموقع", "مين سوى الموقع", "من صمم الموقع", "من برمج الموقع"], answer: "الموقع من تصميم وبرمجة نوره العيسى 👑" },
    { keywords: ["افضل شخص بالنادي", "من افضل شخص", "احسن شخص بالنادي"], answer: "بكل تأكيد نوره العيسى 👑" }
];

function normalizeArabic(str) {
    return str
        .toLowerCase()
        .replace(/[ً-ْ]/g, "")
        .replace(/[إأآا]/g, "ا")
        .replace(/ى/g, "ي")
        .replace(/ة/g, "ه")
        .replace(/[،؛؟ـ٪]/g, " ")
        .replace(/[^ء-ي0-9a-z\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

const BOT_KEYWORD_PREFIXES = [
    /^ايش هو /, /^ايش هي /, /^ايش /, /^وش هو /, /^وش هي /, /^وش /,
    /^ما هو /, /^ما هي /, /^تعريف /, /^مفهوم /, /^معني /,
    /^عرفني علي /, /^عرفني عن /, /^عرفني /, /^اشرح لي /, /^وضح لي /,
    /^الفرق بين /
];

function coreKeyword(kw) {
    let n = normalizeArabic(kw);
    let changed = true;
    while (changed) {
        changed = false;
        for (const p of BOT_KEYWORD_PREFIXES) {
            if (p.test(n)) {
                n = n.replace(p, "").trim();
                changed = true;
            }
        }
    }
    return n;
}

function tokenize(str) {
    return str.split(" ")
        .map(w => (w.startsWith("ال") && w.length > 3) ? w.slice(2) : w)
        .filter(w => w.length > 1);
}

const botFab = document.getElementById("botFab");
if (botFab) {
    const botOverlay = document.getElementById("botOverlay");
    const botClose = document.getElementById("botClose");
    const botMessages = document.getElementById("botMessages");
    const botForm = document.getElementById("botForm");
    const botInput = document.getElementById("botInput");

    const BOT_FALLBACK = "ما عندي جواب لهالسؤال بعد 🤔 جرب تصيغه بطريقة ثانية، أو اسألني عن موضوع بالمحاسبة، الإدارة، التسويق، التمويل، نظم المعلومات الإدارية، الاقتصاد، أو ريادة الأعمال.";

    function findAnswer(userText) {
        const inputTokens = new Set(tokenize(normalizeArabic(userText)));
        let best = null;
        let bestScore = 0;
        BOT_KNOWLEDGE.forEach(entry => {
            let entryBest = 0;
            entry.keywords.forEach(kw => {
                const kwTokens = tokenize(coreKeyword(kw));
                if (!kwTokens.length) return;
                const matched = kwTokens.filter(t => inputTokens.has(t)).length;
                const ratio = matched / kwTokens.length;
                if (ratio >= 0.6 && matched > entryBest) entryBest = matched;
            });
            if (entryBest > bestScore) {
                bestScore = entryBest;
                best = entry;
            }
        });
        return best ? best.answer : null;
    }

    function appendMessage(text, sender) {
        const row = document.createElement("div");
        row.className = "bot-msg bot-msg-" + sender;
        const bubble = document.createElement("span");
        bubble.className = "bot-bubble";
        bubble.textContent = text;
        row.appendChild(bubble);
        botMessages.appendChild(row);
        botMessages.scrollTop = botMessages.scrollHeight;
    }

    function openBot() {
        botOverlay.classList.add("open");
        botInput.focus();
    }

    function closeBot() {
        botOverlay.classList.remove("open");
    }

    botFab.addEventListener("click", openBot);
    botClose.addEventListener("click", closeBot);
    botOverlay.addEventListener("click", (e) => { if (e.target === botOverlay) closeBot(); });

    botForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = botInput.value.trim();
        if (!text) return;
        appendMessage(text, "user");
        botInput.value = "";
        const answer = findAnswer(text);
        setTimeout(() => {
            appendMessage(answer || BOT_FALLBACK, "bot");
        }, 400);
    });
}
