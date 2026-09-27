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
   لعبة "مدين ولا دائن؟"
========================================= */

const GAME_QUESTIONS = [
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
];

const GAME_QUESTIONS_PER_ROUND = 10;
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
    const gameDebitBtn = document.getElementById("gameDebitBtn");
    const gameCreditBtn = document.getElementById("gameCreditBtn");
    const gameFeedback = document.getElementById("gameFeedback");
    const gameEndTitle = document.getElementById("gameEndTitle");
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

    function scoreTitle(score) {
        if (score >= 9) return "خبير مالي";
        if (score >= 7) return "مراجع حسابات";
        if (score >= 4) return "محاسب";
        return "متدرب";
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
        gameDebitBtn.disabled = false;
        gameCreditBtn.disabled = false;
        gameDebitBtn.className = "game-answer-btn debit";
        gameCreditBtn.className = "game-answer-btn credit";

        const q = gameRoundQuestions[gameIndex];
        gameAccount.textContent = q.label;
        gameEvent.textContent = q.question;
        gameQuestionNum.textContent = `${toArabicDigits(gameIndex + 1)} / ${toArabicDigits(gameRoundQuestions.length)}`;
        gameScoreLine.textContent = `النقاط: ${toArabicDigits(gameScore)}`;
    }

    function handleAnswer(choice) {
        gameDebitBtn.disabled = true;
        gameCreditBtn.disabled = true;

        const q = gameRoundQuestions[gameIndex];
        const correctBtn = q.answer === "debit" ? gameDebitBtn : gameCreditBtn;
        correctBtn.classList.add("correct");

        if (choice === q.answer) {
            gameScore++;
            gameFeedback.textContent = "إجابة صحيحة!";
            gameFeedback.classList.add("correct");
        } else {
            const wrongBtn = choice === "debit" ? gameDebitBtn : gameCreditBtn;
            wrongBtn.classList.add("wrong");
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

        gameEndTitle.textContent = scoreTitle(gameScore);
        gameFinalScore.textContent = toArabicDigits(gameScore);
        gameEndBestLine.textContent = isNewBest
            ? "رقم قياسي جديد لك!"
            : `أفضل نتيجة لك: ${toArabicDigits(Math.max(best, gameScore))} / ${toArabicDigits(GAME_QUESTIONS_PER_ROUND)}`;

        showScreen(gameEndScreen);
    }

    gameFab.addEventListener("click", openGame);
    gameClose.addEventListener("click", closeGame);
    gameOverlay.addEventListener("click", (e) => { if (e.target === gameOverlay) closeGame(); });
    gameStartBtn.addEventListener("click", startGame);
    gameRetryBtn.addEventListener("click", startGame);
    gameDebitBtn.addEventListener("click", () => handleAnswer("debit"));
    gameCreditBtn.addEventListener("click", () => handleAnswer("credit"));
}
