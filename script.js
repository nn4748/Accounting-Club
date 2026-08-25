const nav = document.getElementById('mainNav');
window.addEventListener('scroll', ()=>{ nav.classList.toggle('scrolled', window.scrollY > 40); }, {passive:true});

const drawer = document.getElementById('drawer');
document.getElementById('navToggle').addEventListener('click', ()=> drawer.classList.add('open'));
document.getElementById('drawerClose').addEventListener('click', ()=> drawer.classList.remove('open'));
drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', ()=> drawer.classList.remove('open')));

const revealIO = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); revealIO.unobserve(e.target); } });
}, {threshold:.15});
document.querySelectorAll('.reveal, .reveal-stagger').forEach(el=>revealIO.observe(el));

const stats = document.querySelectorAll('.stat b');
let counted = false;
function animateCounters(){
  if(counted) return; counted = true;
  stats.forEach(el=>{
    const target = parseInt(el.dataset.count,10);
    const suffix = el.dataset.suffix || '';
    let cur = 0; const step = Math.max(1, Math.round(target/60));
    const iv = setInterval(()=>{ cur += step; if(cur>=target){cur=target; clearInterval(iv);} el.textContent = cur.toLocaleString('ar') + suffix; }, 22);
  });
}
new IntersectionObserver((entries)=>{ entries.forEach(e=>{ if(e.isIntersecting) animateCounters(); }); }, {threshold:.4}).observe(document.getElementById('stats'));

const partners = ["KPMG","EY","PwC","Deloitte","STC","STC ACADEMY","Andersen","PKF","هيئة الزكاة والضريبة والجمارك","هيئة السوق المالية"];
document.getElementById('marqueeTrack').innerHTML = [...partners, ...partners].map(p => `<div class="m-logo">${p}</div>`).join('');

document.querySelectorAll('.type-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.type-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
  });
});

const demoMembers = ["محمد أحمد","سارة العتيبي","عبدالله القحطاني","نورة الشمري","فيصل الدوسري"];
const lookupBtn = document.getElementById('lookupBtn');
const lookupInput = document.getElementById('lookupInput');
const lookupResult = document.getElementById('lookupResult');
function doLookup(){
  const name = lookupInput.value.trim();
  if(!name) return;
  const found = demoMembers.some(m => m.includes(name) || name.includes(m));
  lookupResult.className = 'lookup-result show ' + (found ? 'ok' : 'no');
  lookupResult.innerHTML = found
    ? `<span>مرحبًا ${name} 👋 — عضويتك فعّالة في نادي المحاسبة.</span><span class="lookup-badge">عضو فعّال</span>`
    : `<span>ما لقينا عضوية بهذا الاسم. تأكدي من كتابته صحيحًا أو تواصلي معنا.</span>`;
}
lookupBtn.addEventListener('click', doLookup);
lookupInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter') doLookup(); });
