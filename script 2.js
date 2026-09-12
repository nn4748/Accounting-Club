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
const CLOSED_EVENTS = ["جلسة حوارية"];
const REGISTRATIONS_CSV_URL = "https://docs.google.com/spreadsheets/d/1Sbv_pomVeZEBPqPA1v4hZWHLvh3mJ6hHkGz3U-HRl24/export?format=csv";

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
        const [response, counts] = await Promise.all([
            fetch(API_URL + "?t=" + Date.now()),
            fetchRegistrationCounts()
        ]);
        const events = await response.json();
        displayEvents(events, counts);
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

function displayEvents(events, counts) {

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
            || (limit && (counts[(event.name || "").trim()] || 0) >= limit);

        const actionHtml = comingSoon
            ? `<span class="register-btn register-btn--soon">قريبًا</span>`
            : isFull
            ? `<span class="register-btn register-btn--soon">انتهى التسجيل</span>`
            : `<a class="register-btn" href="${buildRegisterUrl(event)}">سجل الآن</a>`;

        container.innerHTML += `
            <div class="event-card">

                <div class="event-image">
                    <img src="${event.image}" alt="${event.name}" onerror="this.closest('.event-image').remove()">
                </div>

                <div class="event-content">

                    <h3>${event.name}</h3>

                    <p>${event.description}</p>

                    <div class="event-info">
                        <span>📍 ${event.location}</span>
                        <span>📅 ${event.date}</span>
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
        image: event.image || ""
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