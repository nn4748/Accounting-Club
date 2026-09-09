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

  /* ============================================================
     التحقق من العضوية — Membership Search
     ============================================================
     الطريقة الحالية: قائمة أسماء ثابتة بالأسفل (MEMBERS).
     عدّلي القائمة وأضيفي كل الأعضاء بنفس الشكل: { name: "الاسم", status: "الحالة" }

     لو تبين ربطها بجوجل شيت بدل التعديل اليدوي:
     1) في Google Sheet: ملف > مشاركة > نشر على الويب > اختاري CSV
     2) الصقي الرابط الناتج مكان GOOGLE_SHEET_CSV_URL بالأسفل
     3) فعّلي دالة loadFromGoogleSheet() بدل المصفوفة الثابتة
        (احذفي التعليق عن السطر الأخير بالأسفل)
     الشيت لازم يكون بعمودين بالترتيب: name , status
     ============================================================ */

  const MEMBERS = [
    { name: "مثال: سارة محمد العتيبي", status: "عضو نشط" },
    { name: "مثال: نورة عبدالله القحطاني", status: "عضو نشط" },
  ];

  const GOOGLE_SHEET_CSV_URL = ""; // رابط CSV من جوجل شيت (اختياري)

  async function loadFromGoogleSheet(){
    if(!GOOGLE_SHEET_CSV_URL) return MEMBERS;
    try{
      const res = await fetch(GOOGLE_SHEET_CSV_URL);
      const csv = await res.text();
      const rows = csv.trim().split('\n').slice(1); // تجاهل صف العناوين
      return rows.map(r => {
        const [name, status] = r.split(',');
        return { name: (name||'').trim(), status: (status||'').trim() };
      });
    }catch(e){
      console.error('تعذر تحميل بيانات الأعضاء من الشيت', e);
      return MEMBERS;
    }
  }

  function normalize(str){
    return (str||'').trim().toLowerCase()
      .replace(/[إأآا]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي');
  }

  const input = document.getElementById('memberInput');
  const btn = document.getElementById('memberSearchBtn');
  const resultBox = document.getElementById('memberResult');
  const resultText = document.getElementById('memberResultText');

  async function runSearch(){
    const q = normalize(input.value);
    if(!q){ return; }
    const list = await loadFromGoogleSheet();
    const match = list.find(m => normalize(m.name).includes(q) || q.includes(normalize(m.name)));
    resultBox.classList.remove('state-idle');
    if(match){
      resultBox.classList.remove('state-notfound');
      resultBox.classList.add('state-found');
      resultText.textContent = `${match.name} — ${match.status}`;
    }else{
      resultBox.classList.remove('state-found');
      resultBox.classList.add('state-notfound');
      resultText.textContent = 'ما لقينا هذا الاسم ضمن قائمة الأعضاء. تأكد من كتابة الاسم بشكل صحيح، أو تواصل معنا.';
    }
  }

  btn.addEventListener('click', runSearch);
  input.addEventListener('keydown', (e) => { if(e.key === 'Enter') runSearch(); });
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
const VISITS_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFDEZv-P6YxohrZPYeVvUY1BY1eirg0czoWkqOuLras-AS9GemQBmNnE9ubT_oXzBm_VhNN8xeTLCh/pub?gid=329727116&single=true&output=csv";

function driveDirectLink(url){
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if(match) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
  return url;
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

async function loadVisits() {
  try {
    const res = await fetch(VISITS_SHEET_CSV_URL + '&t=' + Date.now());

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`);
    }

    const csv = await res.text();

    const rows = parseCSV(csv);

    // أول صف هو أسماء الأعمدة
    const headers = rows[0].map(h => h.trim());

    console.log("Headers:", headers);
    console.log("Rows:", rows);

    return rows.slice(1)
      .filter(row => row.length > 1)
      .map(row => {

        return {
          name: row[1]?.trim() || "",
          date: row[2]?.trim() || "",
          image: driveDirectLink(row[3]?.trim() || "")
        };

      })
      .filter(v => v.name);

  } catch (e) {
    console.error("تعذر تحميل بيانات الزيارات:", e);
    return [];
  }
}

function buildVisitCard(v){
  return `
    <div class="mini-card mini-card--visits">
      <div class="visit-header">
        <span class="mini-date">${v.date}</span>
        <span class="company-name">${v.name}</span>
        <div class="company-logo"><img src="${v.image}" alt="${v.name}" onerror="this.closest('.company-logo').remove()"></div>
      </div>
    </div>`;
}

async function renderVisits(){
  const track = document.querySelector('#featured-visits .mini-track');
  if(!track) return;
  const visits = await loadVisits();
  if(visits.length === 0) return;
  const cardsHtml = visits.map(buildVisitCard).join('');
  track.innerHTML = cardsHtml + cardsHtml;
}

renderVisits();




// ================= EVENTS =================

const API_URL = "https://script.google.com/macros/s/AKfycbwnD4jxqeTzbi4n5_OOJl3BUhwNeAdDN2f2HF80MWTiRRjZilvt8tu9-8UBYY74P_2W/exec";

document.addEventListener("DOMContentLoaded", () => {
    loadEvents();
});

async function loadEvents() {
    try {
        const response = await fetch(API_URL);
        const events = await response.json();
        displayEvents(events);
    } catch (error) {
        console.error("Error:", error);
    }
}

function displayEvents(events) {

    const container = document.getElementById("eventsContainer");

    if (!container) return;

    container.innerHTML = "";

    events.forEach(event => {

        const comingSoon = /قريب/.test(event.name) || /قريب/.test(event.description);

        const actionHtml = comingSoon
            ? `<span class="register-btn register-btn--soon">قريبًا</span>`
            : `<button class="register-btn" onclick="openRegister('${event.name}')">سجل الآن</button>`;

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

const scriptURL = "https://script.google.com/macros/s/AKfycbxCeXRlp9rfuJFZ9B36PlnoEw2qwHs8f_zczqb4QQOH2X5RJh6-R8ZddIBB48EESp8OeQ/exec";

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", function (e) {

        e.preventDefault();

        if (!document.getElementById("agree").checked) {

            alert("يجب الموافقة على التعهد قبل التسجيل.");

            return;
        }

        const data = {

            event: document.getElementById("eventName").value,

            name: document.getElementById("name").value,

            email: document.getElementById("email").value,

            phone: document.getElementById("phone").value,

            major: document.getElementById("major").value,

            agree: document.getElementById("agree").checked

        };

        fetch(scriptURL, {

            method: "POST",

            body: JSON.stringify(data)

        })

        .then(response => response.json())

        .then(result => {

            if (result.status === "success") {

                alert("🎉 تم التسجيل بنجاح، شكراً لك.");

                registerForm.reset();

                document
                    .getElementById("register-section")
                    .classList.remove("active");

            } else {

                alert("حدث خطأ أثناء التسجيل.");

            }

        })

        .catch(error => {

            console.error(error);

            alert("تعذر الاتصال بالخادم.");

        });

    });
}


// فتح نموذج التسجيل

function openRegister(event) {

    const registerSection =
        document.getElementById("register-section");

    registerSection.classList.add("active");

    document.getElementById("eventName").value = event;

    registerSection.scrollIntoView({
        behavior: "smooth"
    });
}