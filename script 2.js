  // شريط التنقل: تغيير الخلفية عند التمرير
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  });

  // بريق تفاعلي في الهيرو يتبع الماوس
  const hero = document.querySelector('.hero');
  hero.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * 100;
    const my = ((e.clientY - r.top) / r.height) * 100;
    hero.style.setProperty('--mx', mx + '%');
    hero.style.setProperty('--my', my + '%');
  });

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
      const res = await fetch ("https://script.google.com/macros/s/AKfycbx3dsV9X4MEb2yapODFXBlDrroD9wYlbyxvgeknBxgf5okn2fU9b4ioAp5Lw_h_SC2r/exec");
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

    container.innerHTML = "";

    events.forEach(event => {

        container.innerHTML += `

        <div class="event-card">

            <div class="event-image">

                <img src="${event.image}" alt="${event.name}">

            </div>

            <div class="event-content">

                <h3>${event.name}</h3>

                <p>${event.description}</p>

                <div class="event-info">

                    <span>📍 ${event.location}</span>

                    <span>📅 ${event.date}</span>

                </div>

               <button class="register-btn" onclick="openRegister('${event.name}')">
                                سجل الآن
                 </button>

            </div>

        </div>

        `;

    });



    const scriptURL = "https://script.google.com/macros/s/AKfycbxCeXRlp9rfuJFZ9B36PlnoEw2qwHs8f_zczqb4QQOH2X5RJh6-R8ZddIBB48EESp8OeQ/exec";

document.getElementById("registerForm").addEventListener("submit", function (e) {

    e.preventDefault();

    // التأكد من الموافقة
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

            document.getElementById("registerForm").reset();

            document.getElementById("register-section").classList.remove("active");

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
function openRegister(event){

    document
    .getElementById("register-section")
    .classList.add("active");


    document
    .getElementById("eventName")
    .value = event;


    document
    .getElementById("register-section")
    .scrollIntoView({
        behavior:"smooth"
    });

}


