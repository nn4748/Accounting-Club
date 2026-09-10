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
     ابحث عن عضو — Member Search
     ============================================================
     قائمة أعضاء النادي (الاسم، الدور، الإيميل) مأخوذة من قاعدة
     بيانات النادي. لتحديثها لاحقًا، عدّلي مصفوفة MEMBERS بنفس الشكل.
     ============================================================ */

  const MEMBERS = [
    { name: "محمد فهد الخراشي", role: "رئيس نادي المحاسبة", email: "malkharashi12@gmail.com" },
    { name: "دنا عبدالله الزميع", role: "نائب رئيس نادي المحاسبة", email: "dona.alzomaie@gmail.com" },
    { name: "مهند محمد المويهي", role: "مستشار نادي المحاسبة", email: "muh20m@gmail.com" },
    { name: "هيلة محمد الدرع", role: "قائد إدارة الموارد البشرية والاستقطاب", email: "h.darae10@gmail.com" },
    { name: "نوره بنت يوسف الربيعان", role: "قائد لجنة الموارد", email: "norahalrubian1@gmail.com" },
    { name: "أسيل عبدالله الحسين", role: "عضو لجنة الموارد", email: "aseel.oct2005@gmail.com" },
    { name: "شهد مشعل اباحسين", role: "عضو لجنة الموارد", email: "shahad.m.abahussain2005@gmail.com" },
    { name: "دينا عبدالرحمن المطيري", role: "عضو لجنة الموارد", email: "deenaal975@gmail.com" },
    { name: "نوال عبدالله العجمي", role: "عضو لجنة الموارد", email: "nawal2000@outlook.com" },
    { name: "رغد محمد اللعبون", role: "عضو لجنة الموارد", email: "rghdm7777@gmail.com" },
    { name: "فارس محمد العشبان", role: "عضو لجنة الموارد", email: "fars820a@gmail.com" },
    { name: "العذوب عبدالعزيز بن نحيت", role: "عضو لجنة الموارد", email: "alothoobn@gmail.com" },
    { name: "أنس محمد الأسمري", role: "عضو لجنة الموارد", email: "anasklaoz@gmail.com" },
    { name: "لانا محمد المعجل", role: "عضو لجنة الموارد", email: "moajillana8@gmail.com" },
    { name: "فواز فيصل البقمي", role: "عضو لجنة الموارد", email: "fawaz0f40@gmail.com" },
    { name: "حور سعود الغربي", role: "عضو لجنة الموارد", email: "hoorsa1515@gmail.com" },
    { name: "ريان سلمان الحميداني", role: "عضو لجنة الموارد", email: "rsmq88@gmail.com" },
    { name: "منيرة عادل المعيوف", role: "عضو لجنة الموارد", email: "muniraadel842@gmail.com" },
    { name: "لولوه عثمان الصوينع", role: "عضو لجنة الموارد", email: "Lolwah779@gmail.com" },
    { name: "هيا ناصر العنيق", role: "عضو لجنة الموارد", email: "hayaoooppp@gmail.com" },
    { name: "دانه اديب القديري", role: "عضو لجنة الموارد", email: "d.danahadeeb@gmail.com" },
    { name: "حنين احمد المنصور", role: "عضو لجنة الموارد", email: "Hnm.atm10@gmail.com" },
    { name: "ديما عيد البلاجي", role: "عضو لجنة الموارد", email: "Demaesalblaji@gmail.com" },
    { name: "الجوهره محمد الحارثي", role: "عضو لجنة الموارد", email: "446005926@sm.imamu.edu.sa" },
    { name: "ساره مسفر القحطاني", role: "عضو لجنة الموارد", email: "sarha2582@gmail.con" },
    { name: "العنود عبدالله المهيزع", role: "عضو لجنة الموارد", email: "alanoudalmehza@gmail.com" },
    { name: "اسامة رجب الزهراني", role: "عضو لجنة الموارد", email: "Usamhhh7788@icloud.com" },
    { name: "عبدالله خالد القحيز", role: "قائد لجنة الاستقطاب", email: "abdullah.kkq1@gmail.com" },
    { name: "محمد بن منير الحربي", role: "عضو لجنة الاستقطاب", email: "mohamedalharbi103@gmail.com" },
    { name: "فجر عبداللطيف الدريهم", role: "عضو لجنة الاستقطاب", email: "fajerabdullatif107@gmail.com" },
    { name: "جود محمد العياف", role: "عضو لجنة الاستقطاب", email: "Joodalayaf@gmail.com" },
    { name: "إيناس ناصر الشهراني", role: "عضو لجنة الاستقطاب", email: "enas2570@icloud.com" },
    { name: "ثابتة ابراهيم بن عدرج", role: "عضو لجنة الاستقطاب", email: "Ithabtah@gmail.com" },
    { name: "نوره عادل الدوسري", role: "عضو لجنة الاستقطاب", email: "noonah016@gmail.com" },
    { name: "نوره عبدالعزيز عبيد القحطاني", role: "عضو لجنة الاستقطاب", email: "wcilzp.270@gmail.com" },
    { name: "محمد بن عبدالحكيم العييد", role: "عضو لجنة الاستقطاب", email: "mqiiv.z7@gamil.com" },
    { name: "غاده عبدالله العجمي", role: "عضو لجنة الاستقطاب", email: "ghada12266@hotmail.com" },
    { name: "وليد سعد الاصيقع", role: "قائد إدارة العلاقات العامة و التواصل الخارجي", email: "Wsaad6367@gmail.com" },
    { name: "ريناز فلاح المخلفي", role: "نائب قائد إدارة العلاقات العامة و التواصل الخارجي", email: "renazalharbi@gmail.com" },
    { name: "فاطمة محمد الخنيزي", role: "قائد لجنة العلاقات", email: "falkhnyzy@gmail.com" },
    { name: "محمد عبدالملك العساكر", role: "عضو لجنة العلاقات", email: "M.alasaker1@gmail.com" },
    { name: "عبدالعزيز محمد الفاخري", role: "عضو لجنة العلاقات", email: "azozf42@gmail.com" },
    { name: "لينا صالح المطرودي", role: "عضو لجنة العلاقات", email: "Lina.s.m.1421@gmail.com" },
    { name: "رهف ناصر التمامي", role: "عضو لجنة العلاقات", email: "rnaltamami@gmail.com" },
    { name: "محمد عبدالله المرشد", role: "عضو لجنة العلاقات", email: "M.almarrshad@gmail.com" },
    { name: "ليان عبدالعزيز المحارب", role: "عضو لجنة العلاقات", email: "wvu756@gmail.com" },
    { name: "هيا ظافر العجمي", role: "عضو لجنة العلاقات", email: "hayaalajmi21@outlook.sa" },
    { name: "نوره خالد العريني", role: "عضو لجنة العلاقات", email: "Norahkk@icloud.com" },
    { name: "فهد بن سليمان الخميس", role: "عضو لجنة العلاقات", email: "fahad.s.khamis@gmail.com" },
    { name: "عمر عبدالعزيز التميمي", role: "عضو لجنة العلاقات", email: "Mraltmymy41@gmail.com" },
    { name: "العنود بندر الرويس", role: "عضو لجنة العلاقات", email: "littledoody2008b@gmail.com" },
    { name: "مشاري امجد مرزوق الحربي", role: "عضو لجنة العلاقات", email: "meshary11.x@gmail.com" },
    { name: "اوس احمد عبد العزيز المحسن", role: "عضو لجنة العلاقات", email: "aws.a.almohsen@gmail.com" },
    { name: "ايلاف سعد الرويس", role: "عضو لجنة العلاقات", email: "elafalruwais@gmail.com" },
    { name: "لمياء عبدالرحمن العريني", role: "عضو لجنة العلاقات", email: "lamya.oraini22@gmail.com" },
    { name: "نوره عبدالمحسن السيف", role: "عضو لجنة العلاقات", email: "Alseifnoura@gmail.com" },
    { name: "الريم حطاب العنزي", role: "عضو لجنة العلاقات", email: "Alhattabalreem@gmail.com" },
    { name: "ليان عبدالعزيز المحارب", role: "عضو لجنة العلاقات", email: "wvu756@gmail.com" },
    { name: "عبدالمجيد عبدالعزيز التميمي", role: "قائد لجنة التواصل الخارجي", email: "mjjed506@gmail.com" },
    { name: "نوره عبدالله اليحيى", role: "عضو لجنة التواصل الخارجي", email: "norhabdullah74@gmail.com" },
    { name: "العنود صلاح المسلم", role: "عضو لجنة التواصل الخارجي", email: "alanoudslah7@gmail.com" },
    { name: "لانا خالد العميري", role: "عضو لجنة التواصل الخارجي", email: "lana.alumairy@gmail.com" },
    { name: "لين بجاد المطيري", role: "عضو لجنة التواصل الخارجي", email: "Leenalmutairi55@gmail.com" },
    { name: "ريان نايف الحنّان", role: "عضو لجنة التواصل الخارجي", email: "rayan5n1@outlook.sa" },
    { name: "روان شباب المخلفي", role: "عضو لجنة التواصل الخارجي", email: "Rwn16qqq@gmail.com" },
    { name: "عبدالله محمد عبدالله ال غانم", role: "عضو لجنة التواصل الخارجي", email: "Basel33m@hotmail.com" },
    { name: "هيا خالد بن شايع", role: "عضو لجنة التواصل الخارجي", email: "hayaals14@gmail.com" },
    { name: "رنا تركي ال خشيل", role: "عضو لجنة التواصل الخارجي", email: "ranaalkhushail@gmail.com" },
    { name: "لين محمد الصعيقر", role: "عضو لجنة التواصل الخارجي", email: "leen.mohammed11993@gmail.com" },
    { name: "ريوف عويف العتيبي", role: "عضو لجنة التواصل الخارجي", email: "aarr64620@gmail.com" },
    { name: "فارس عطاالله العتيبي", role: "عضو لجنة التواصل الخارجي", email: "Faresnet511@gmail.com" },
    { name: "هيفاء مهدي ال رشيد", role: "عضو لجنة التواصل الخارجي", email: "Haifamhd24@gmail.com" },
    { name: "نادية ماجد العتيبي", role: "عضو لجنة التواصل الخارجي", email: "nadi123470noo5@gmail.com" },
    { name: "مَعين عبدالعزيز العنقري", role: "عضو لجنة التواصل الخارجي", email: "Menoo.5331@gmail.com" },
    { name: "رغد عبدالله العطاس", role: "عضو لجنة التواصل الخارجي", email: "raghadabdulla332@gmail.com" },
    { name: "ثامر محمد البيز", role: "عضو لجنة التواصل الخارجي", email: "Thameralbyz@gmail.com" },
    { name: "إبراهيم فهد بن سجاء", role: "عضو لجنة التواصل الخارجي", email: "ibrahimfbinsaja@gmail.com" },
    { name: "راكان صالح العتيبي", role: "عضو لجنة التواصل الخارجي", email: "RAKAn5115676@gmail.com" },
    { name: "رغد ابراهيم عسيري", role: "عضو لجنة التواصل الخارجي", email: "rrla1428@gmail.com" },
    { name: "ريتاج خليف الرشيدي", role: "عضو لجنة التواصل الخارجي", email: "bad.1998@icloud.com" },
    { name: "عبدالعزيز قينان النتيفات", role: "عضو لجنة التواصل الخارجي", email: "ap304sa@gmail.com" },
    { name: "عبدالرحمن عبدالله المزيني", role: "قائد ادارة التخطيط و العمليات", email: "Abdulrahman.Maz05@gmail.com" },
    { name: "لينا سليمان أباالخيل", role: "قائد لجنة التخطيط", email: "leenaabalkhail1@hotmail.com" },
    { name: "راكان بن يوسف الربيعان", role: "نائب لجنة التخطيط", email: "rakanalrubaiaan@gmail.com" },
    { name: "عبدالملك احمد العتيبي", role: "عضو لجنة التخطيط", email: "ba762524@gmail.com" },
    { name: "محمد خالد الصبيحي", role: "عضو لجنة التخطيط", email: "m.m.alsobihey@gmail.coma" },
    { name: "شهد سعد السُلمي", role: "عضو لجنة التخطيط", email: "Shahadsaadalsulami@gmail.com" },
    { name: "رهف موسى عطافي", role: "عضو لجنة التخطيط", email: "rahafm11m@gmail.com" },
    { name: "ريم مهند الشبيلي", role: "عضو لجنة التخطيط", email: "446005959@sm.imamu.edu.sa" },
    { name: "ساره عبدالله ابوذيب", role: "عضو لجنة التخطيط", email: "saratheeba88@gmail.com" },
    { name: "ريما عبدالله آل مبارك", role: "عضو لجنة التخطيط", email: "Reema0altamimi@gmail.com" },
    { name: "ربى بندر الدعجاني", role: "عضو لجنة التخطيط", email: "roba.bandar.17@gmail.com" },
    { name: "دانة بنت عبدالعزيز الهاجري", role: "عضو لجنة التخطيط", email: "dalhajri56@gmail.com" },
    { name: "وصايف بنت خالد الحيدر", role: "عضو لجنة التخطيط", email: "Wsaif2021@gmail.com" },
    { name: "سعود محمد الرميخاني", role: "عضو لجنة التخطيط", email: "Saudalremaikhni@gmail.com" },
    { name: "الغلا سلمان سعد آل فراج", role: "عضو لجنة التخطيط", email: "Alghlaalfarraj@outlook.com" },
    { name: "راما عبدالمحسن العبيد", role: "عضو لجنة التخطيط", email: "rama.obaid3@gmail.com" },
    { name: "ساره هادي المصلوخي", role: "عضو لجنة التخطيط", email: "sara3alanzi@gmali.com" },
    { name: "شهد صالح السهلي", role: "عضو لجنة التخطيط", email: "shahadalsahliii123@gmail.com" },
    { name: "عبدالملك محمد العنزي", role: "عضو لجنة التخطيط", email: "Abdulmalikanzi12@gmail.com" },
    { name: "فوزية هشام السريّع", role: "عضو لجنة التخطيط", email: "fawziaa135@gmail.com" },
    { name: "الهنوف محمد الربيعان", role: "عضو لجنة التخطيط", email: "hanoufm1235@gmail.com" },
    { name: "لمار علي المحيميد", role: "عضو لجنة التخطيط", email: "Lamar.3li525@gmail." },
    { name: "جوري غملاس الغملاس", role: "عضو لجنة التخطيط", email: "Jghumlas@gmail.com" },
    { name: "العنود محمد الجاسر", role: "عضو لجنة التخطيط", email: "anosha1425@gmail.com" },
    { name: "فهد سلطان بن ميمون", role: "عضو لجنة التخطيط", email: "fhdfhd2005@outlook.com" },
    { name: "خالد فايز الشهري", role: "عضو لجنة التخطيط", email: "o.khalid.Alshehri@gmail.com" },
    { name: "شهد ملهي بن سعيدان", role: "عضو لجنة التخطيط", email: "Shahadalq60@hotmail.com" },
    { name: "ربى حسن القحطاني", role: "عضو لجنة التخطيط", email: "445000751@sm.imamu.edu.sa" },
    { name: "مضاوي سعود النقيثان", role: "عضو لجنة التخطيط", email: "madawi.ing@gmail.com" },
    { name: "تهاني مشعان العتيبي", role: "عضو لجنة التخطيط", email: "tahaniar7@gmail.com" },
    { name: "محمد عبدالله اليحيى", role: "قائد لجنة التنظيم", email: "m.alyahya120@gmail.com" },
    { name: "نجلاء سعد العنزان", role: "نائب لجنة التنظيم", email: "najla131415@gmail.com" },
    { name: "عبدالملك سلمان الغدير", role: "عضو لجنة التنظيم", email: "Abdulmalekalghadeer@gmail.com" },
    { name: "عبدالله بن عبدالعزيز المدرع", role: "عضو لجنة التنظيم", email: "Abdullahalmudarra1@gmail.com" },
    { name: "محمد بن عايد آل ضرمان", role: "عضو لجنة التنظيم", email: "m7m7h14@gmail.com" },
    { name: "ريماس فيصل العتيبي", role: "عضو لجنة التنظيم", email: "remas-19@hotmail.com" },
    { name: "ولاء فهد النتيفات", role: "عضو لجنة التنظيم", email: "waala.052@gmail.com" },
    { name: "محمد ماجد العاصمي", role: "عضو لجنة التنظيم", email: "m7md2005.5.23@gmail.com" },
    { name: "نورة تركي التركي", role: "عضو لجنة التنظيم", email: "Norah.turki.rw@gmail.com" },
    { name: "يارا صالح التويجري", role: "عضو لجنة التنظيم", email: "iyarasaleh@gmail.com" },
    { name: "أنوار عبدالله العويرضي", role: "عضو لجنة التنظيم", email: "alowayrdhi@gmail.com" },
    { name: "أرين عبدالعزيز الغفيص", role: "عضو لجنة التنظيم", email: "areen.gfe@gmail.com" },
    { name: "فيصل فهد آل علي", role: "عضو لجنة التنظيم", email: "Alali0@outlook.sa" },
    { name: "نايف فرحان العنزي", role: "عضو لجنة التنظيم", email: "nyaf1425@gmail.com" },
    { name: "هيا ابراهيم ال ثنيان", role: "عضو لجنة التنظيم", email: "hyooon2006@gmail.com" },
    { name: "سديم رائد الشعلان", role: "عضو لجنة التنظيم", email: "sdoomee98@gmail.com" },
    { name: "عبدالعزيز عبدالرحمن الشبانات", role: "عضو لجنة التنظيم", email: "Abdulaziz.20.q1@gmail.com" },
    { name: "نورة محمد الخميس", role: "عضو لجنة التنظيم", email: "noorh.alkhamis@gmail.com" },
    { name: "أحمد خالد الركبان", role: "عضو لجنة التنظيم", email: "alrakbanahmed@hotmail.com" },
    { name: "مهند سعد العريفي", role: "عضو لجنة التنظيم", email: "mohanadalarifi41@gmail.com" },
    { name: "ابراهيم سعود الشبانات", role: "عضو لجنة التنظيم", email: "ishabanat.99@gmail.com" },
    { name: "سديم عوده المطرفي", role: "عضو لجنة التنظيم", email: "sadeemalmutrafie@gmail.com" },
    { name: "فجر مسفر القحطاني", role: "عضو لجنة التنظيم", email: "fjrmalsalem@gmail.com" },
    { name: "ساره محمد السليمان", role: "عضو لجنة التنظيم", email: "acc.saraalsuliman@gmail.com" },
    { name: "جوري محمد العمري", role: "عضو لجنة التنظيم", email: "jo15ry.f@gmail.com" },
    { name: "صالح محمد العيدان", role: "عضو لجنة التنظيم", email: "Salehksa880@gmail.com" },
    { name: "ريما سليمان السمحان", role: "عضو لجنة التنظيم", email: "reema_s123@icloud.com" },
    { name: "ريم زكي العقل", role: "عضو لجنة التنظيم", email: "reem20alagl@gmail.com" },
    { name: "زياد سعد الشمري", role: "عضو لجنة التنظيم", email: "ziadsaad237@gmail.com" },
    { name: "ماجد مبارك الوبران", role: "عضو لجنة التنظيم", email: "mujood600060@gmail.com" },
    { name: "افنان مصطفى احمد", role: "عضو لجنة التنظيم", email: "afnanalabbas@gmail.com" },
    { name: "سديم طارق المعيذر", role: "عضو لجنة التنظيم", email: "Sadeemt270@gmail.com" },
    { name: "لجين عامر العجمي", role: "عضو لجنة التنظيم", email: "lujainaameer@gmail.com" },
    { name: "جود عبدالله الحربي", role: "عضو لجنة التنظيم", email: "Joud.abdullahh5@gmail.com" },
    { name: "عبدالعزيز محمد العقيلي", role: "عضو لجنة التنظيم", email: "azoozking101@gmail.com" },
    { name: "موضي سليمان السالم", role: "عضو لجنة التنظيم", email: "Alsalemma90@gmail.com" },
    { name: "خلود عبدالله البعجري", role: "عضو لجنة التنظيم", email: "elul.acc050@icloud.com" },
    { name: "ليان سلطان المطيري", role: "عضو لجنة التنظيم", email: "lolyp1472@gmail.com" },
    { name: "مشاعل عبدالمحسن الأحمد", role: "عضو لجنة التنظيم", email: "Mashaelalahmed2007@gmail.com" },
    { name: "فيصل محمد العمر", role: "عضو لجنة التنظيم", email: "Faisal177m@hotmail.com" },
    { name: "رزان منصور الزهراني", role: "عضو لجنة التنظيم", email: "razanal682@gmail.com" },
    { name: "روان مرزوق صالح العتيبي", role: "عضو لجنة التنظيم", email: "rawannrrr21@gmail.com" },
    { name: "نوره عبدالله العتيبي", role: "عضو لجنة التنظيم", email: "altybyn176@gmail.com" },
    { name: "علي حمد علي الشهري", role: "عضو لجنة التنظيم", email: "ali.hamd.alshehri@gmail.com" },
    { name: "لمى محمد الشهراني", role: "عضو لجنة التنظيم", email: "xwyz067@gmail.com" },
    { name: "لمار خالد الهاجري", role: "عضو لجنة التنظيم", email: "s1443907@gmail.com" },
    { name: "شيخة يزن العيفان", role: "عضو لجنة التنظيم", email: "Shykhahys@gmail.com" },
    { name: "أثير عبدالله المهوس", role: "قائد إدارة الاعلام", email: "Aatheerabdullah@hotmail.com" },
    { name: "رزان ابراهيم مجرشي", role: "قائد لجنة التسويق", email: "Iamrazanibrahim@gmail.com" },
    { name: "سجى سعود العتيبي", role: "عضو لجنة التسويق", email: "sajasaud.72@gmail.com" },
    { name: "عبدالله سليمان العسيمي", role: "عضو لجنة التسويق", email: "Abdullahpers01@gmail.com" },
    { name: "ريماس عبدالعزيز المنقور", role: "عضو لجنة التسويق", email: "xremas2005@gmail.com" },
    { name: "لمى فهد الحربي", role: "عضو لجنة التسويق", email: "lamofahad3@gmail.com" },
    { name: "إبراهيم سلمان الطليان", role: "عضو لجنة التسويق", email: "Xxibra119@gmail.com" },
    { name: "مها نائش الغامدي", role: "عضو لجنة التسويق", email: "Mahaalghamdi.business@gmail.com" },
    { name: "سمية طارق الخويطر", role: "عضو لجنة التسويق", email: "sumaayaah.23@gmail.com" },
    { name: "شيخة عبدالعزيز الرويتع", role: "عضو لجنة التسويق", email: "sheikhaalruwaita@gmail.com" },
    { name: "تهاني براك العتيبي", role: "عضو لجنة التسويق", email: "takeurloe3776@gmail.com" },
    { name: "اسيل محمد القباني", role: "عضو لجنة التسويق", email: "aseellalq@gmail.com" },
    { name: "ابراهيم سلمان الطليان", role: "عضو لجنة التسويق", email: "Xxibra119@gmail.com" },
    { name: "محمد خلف المطيري", role: "عضو لجنة التسويق", email: "mk748k@gmail.com" },
    { name: "عبدالله احمد الخنين", role: "عضو لجنة التسويق", email: "Alkhunayn.abdullah0@gmail.com" },
    { name: "سعود عبدالعزيز الشويش", role: "قائد لجنة التصميم", email: "s.alshuwaysh.gd@gmail.com" },
    { name: "جود فهد الزميع", role: "عضو لجنة التصميم", email: "jood.alzomea@gmail.com" },
    { name: "لمار علي المحيميد", role: "عضو لجنة التصميم", email: "Lamar.3li525@gmail.com" },
    { name: "أثير يسلم باحميدان", role: "عضو لجنة التصميم", email: "Atheer7ala@gmail.com" },
    { name: "شهد محمد المطيري", role: "عضو لجنة التصميم", email: "S9aasr@gmail.com" },
    { name: "مشاعل محمد الدخيل", role: "عضو لجنة التصميم", email: "aldkhylmshal41@gmail.com" },
    { name: "رائد مقبل المطيري", role: "عضو لجنة التصميم", email: "Rae190d@gmail.com" },
    { name: "ساره مسفر القحطاني", role: "عضو لجنة التصميم", email: "sarha2582@gmail.con" },
    { name: "رقيه عبد القوي صالح", role: "عضو لجنة التصميم", email: "lirokaiali@gmail.com" },
    { name: "جمانة عبدالعزيز الشمالي", role: "عضو لجنة التصميم", email: "Alshimalijumanah@hotmail.com" },
    { name: "دانه فهد الزعيبي", role: "عضو لجنة التصميم", email: "Danah.f.z123@gmail.com" },
    { name: "نوره العريفي", role: "عضو لجنة التصميم", email: "rolncev@gmail.com" },
    { name: "مودة محمد الشمراني", role: "عضو لجنة التصميم", email: "maalshamrani16@gmail.com" },
    { name: "الجوري بدر الرويلي", role: "قائد لجنة المحتوى", email: "aljorialrowaili60@gmail.com" },
    { name: "اريام مشعل الجربوع", role: "عضو لجنة المحتوى", email: "alaryam111@gmail.com" },
    { name: "فراس عبدالله الرشيدي", role: "عضو لجنة المحتوى", email: "ferasalrasheedi@gmail.com" },
    { name: "ساره اسماعيل الحارثي", role: "عضو لجنة المحتوى", email: "Saraismalharthi05@gmail.com" },
    { name: "لميس رمزي الحسيني", role: "عضو لجنة المحتوى", email: "lamees.alshehri324@gmail.com" },
    { name: "نورة راشد بن نصيف", role: "عضو لجنة المحتوى", email: "rashednora98@gmail.com" },
    { name: "وتين محمد الربيعان", role: "عضو لجنة المحتوى", email: "wteen1918@gmail.com" },
    { name: "دانه اسأمه السويح", role: "عضو لجنة المحتوى", email: "dana.alsuwayeh@gmail.com" },
    { name: "حنان محمد الرشود", role: "عضو لجنة المحتوى", email: "Halrushud@gmail.com" },
    { name: "نوره ناصر العيسى", role: "قائد لجنة الحلول التقنية", email: "nwrn04779@gmail.com" },
    { name: "تقى أنس طالب اغا", role: "عضو لجنة الحلول التقنية", email: "touqa.anas2020@gmail.com" },
    { name: "سدين محمد العمري", role: "عضو لجنة الحلول التقنية", email: "ssc.it3@gmail.com" },
    { name: "شجون خليفة محمد الحمداء", role: "عضو لجنة المراجعة الداخلية", email: "Shijon889@gmail.com" },
    { name: "هاشم محمد الشهري", role: "عضو لجنة المراجعة الداخلية", email: "hashimalshehri07@gmail.com" },
    { name: "شهد مقبل العتيبي", role: "عضو لجنة المراجعة الداخلية", email: "shahad12121221@gmail.com" },
    { name: "ياسمين ناصر الحربي", role: "عضو لجنة المراجعة الداخلية", email: "Foryaswork1@gmail.com" },
    { name: "عبدالعزيز سعيد ال سرحان", role: "عضو لجنة المراجعة الداخلية", email: "Abdulaziz_acc@hotmail.com" },
    { name: "غيوض فهد السهلي", role: "عضو لجنة المراجعة الداخلية", email: "dfhnjkggjbfu@gmail.com" },
    { name: "وافي صالح العويسي", role: "عضو لجنة المراجعة الداخلية", email: "wafi.s.alowaisi@gmail.com" },
    { name: "يزيد عبدالاله الدخيل", role: "عضو لجنة المراجعة الداخلية", email: "Yazeeedaldakheel@gmail.com" },
    { name: "فراج عبدالله الفراج", role: "عضو لجنة المراجعة الداخلية", email: "Farraj.11x@gmail.com" },
    { name: "رهف حزام السبيعي", role: "عضو لجنة المراجعة الداخلية", email: "rahafsubaie19@gmail.com" },
    { name: "رزان مطر الشمري", role: "عضو لجنة المراجعة الداخلية", email: "razanmotar@gmail.com" },
    { name: "ليان عبده النجار", role: "عضو لجنة المراجعة الداخلية", email: "alnajjarla58@gmail.com" },
    { name: "فجر محمد العريفي", role: "عضو لجنة المراجعة الداخلية", email: "fjr.refi@gmail.com" },
    { name: "علياء منصور الدعجاني", role: "عضو لجنة المراجعة الداخلية", email: "aliabbd@icloud.com" },
    { name: "لين مساعد الزنيدي", role: "عضو لجنة المراجعة الداخلية", email: "Xleen0110@gmail.com" },
    { name: "يزيد جفران الحربي", role: "عضو لجنة المراجعة الداخلية", email: "yazedf115111@gmail.com" },
    { name: "نوره طارق القعود", role: "عضو لجنة المراجعة الداخلية", email: "norah_t88@outlook.com" },
    { name: "منتهى عبدالله العمري", role: "عضو لجنة المراجعة الداخلية", email: "alamrimon55@gmail.com" },
  ];

  function normalize(str){
    return (str||'').trim().toLowerCase()
      .replace(/[إأآا]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي');
  }

  const input = document.getElementById('memberInput');
  const btn = document.getElementById('memberSearchBtn');
  const resultBox = document.getElementById('memberResult');
  const resultText = document.getElementById('memberResultText');

  function nameMatches(memberName, query){
    const nameWords = normalize(memberName).split(/\s+/).filter(Boolean);
    const queryWords = normalize(query).split(/\s+/).filter(Boolean);
    if(!queryWords.length) return false;
    return queryWords.every(qw => nameWords.some(nw => nw.includes(qw) || qw.includes(nw)));
  }

  function runSearch(){
    const q = input.value;
    if(!q.trim()){ return; }
    const match = MEMBERS.find(m => nameMatches(m.name, q));
    resultBox.classList.remove('state-idle');
    if(match){
      resultBox.classList.remove('state-notfound');
      resultBox.classList.add('state-found');
      resultText.innerHTML = `${match.name} — ${match.role} `
        + `<a href="mailto:${match.email}" class="mail-icon" title="راسل عبر الإيميل" aria-label="راسل ${match.name} عبر الإيميل">`
        + `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 5h20v14H2V5Zm2 2v.4l8 5.6 8-5.6V7l-8 5.6L4 7Z"/></svg>`
        + `</a>`;
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
  setMarqueeShift('#featured-visits .mini-track', '.mini-card', '--mini-shift');
}

renderVisits();




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

async function loadEvents() {
    try {
        const [response, counts] = await Promise.all([fetch(API_URL), fetchRegistrationCounts()]);
        const events = await response.json();
        displayEvents(events, counts);
    } catch (error) {
        console.error("Error:", error);
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
        const isFull = limit && (counts[(event.name || "").trim()] || 0) >= limit;

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