/* =========================================================
   شاشات الأدوات داخل التطبيق (بدل صفحات الموقع):
   ساعاتي التطوعية · شخصيتك المحاسبية · ابنِ شركتك · سياسة الخصوصية
   ========================================================= */
(function () {
  "use strict";
  const U = window.AppUI;
  const D = window.CLUB;
  const { $, $$, esc, tap, notify, toast, store } = U;
  const AR = "٠١٢٣٤٥٦٧٨٩";
  const ar = (n) => String(n).replace(/[0-9]/g, (d) => AR[d]);

  /* ---------- شاشة فوق التبويبات ---------- */
  const page = $("#page");
  const body = $("#pageBody");
  let onLeave = null;
  function openPage(title, html) {
    $("#pageTitle").textContent = title;
    body.innerHTML = html;
    body.scrollTop = 0;
    page.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => page.classList.add("open")));
  }
  function closePage() {
    tap();
    page.classList.remove("open");
    if (onLeave) { onLeave(); onLeave = null; }
    setTimeout(() => { page.hidden = true; body.innerHTML = ""; }, 320);
  }
  $("#pageBack").addEventListener("click", closePage);
  // سحب من حافة الشاشة (اليمين بالعربي) للرجوع
  (function edgeSwipe() {
    let x0 = null, y0 = 0;
    page.addEventListener("touchstart", (e) => {
      const t = e.touches[0];
      x0 = t.clientX > window.innerWidth - 28 ? t.clientX : null; y0 = t.clientY;
    }, { passive: true });
    page.addEventListener("touchend", (e) => {
      if (x0 == null) return;
      const t = e.changedTouches[0];
      if (x0 - t.clientX > 70 && Math.abs(t.clientY - y0) < 60) closePage();
      x0 = null;
    });
  })();
  const toTop = () => body.scrollTo({ top: 0, behavior: "smooth" });

  /* =========================================================
     ١) ساعاتي التطوعية
     ملاحظة خصوصية: نحمّل الملف وقت البحث فقط، نطلع سطر الرقم المكتوب،
     ولا نخزن الملف ولا بيانات أحد ثاني.
     ========================================================= */
  function formatHours(raw) {
    const parts = String(raw || "0:00:00").split(":").map(Number);
    const h = parts[0] || 0, m = parts[1] || 0;
    if (h === 0 && m === 0) return "0 ساعة";
    if (h === 0) return m + " دقيقة";
    if (m === 0) return h + " ساعة";
    return h + " ساعة و" + m + " دقيقة";
  }
  async function lookupHours(id) {
    const res = await fetch(D.hoursCsv + "&t=" + Date.now());
    if (!res.ok) throw new Error("http " + res.status);
    const rows = U.parseCSV(await res.text());
    for (const r of rows) {
      if ((r[4] || "").trim() === id && (r[1] || "").trim()) {
        return { name: (r[1] || "").trim(), hours: formatHours((r[8] || "").trim()) };
      }
    }
    return null;
  }

  function hours() {
    openPage("ساعاتي التطوعية", `
      <div class="tool-hero"><span class="tool-ic big">${ICONS.clock}</span><h2>ساعاتي التطوعية</h2><p>اكتب رقمك الجامعي وبنعرض لك عدد ساعاتك التطوعية في النادي.</p></div>
      <form class="card form" id="hForm" novalidate>
        <label class="field"><span>الرقم الجامعي</span><input id="hId" inputmode="numeric" autocomplete="off" dir="ltr" value="${esc(store.get("uid", ""))}"></label>
        <p class="form-err" id="hErr" hidden></p>
        <button class="btn primary" id="hBtn" type="submit">استعلام</button>
      </form>
      <div class="card hours-result" id="hRes" hidden></div>
      <p class="fine center">الرقم الجامعي يُستخدم للبحث فقط، ويبقى محفوظ على جهازك لو حبيت.</p>`);
    $("#hForm").addEventListener("submit", async (e) => {
      e.preventDefault(); tap();
      const id = U.toLatin($("#hId").value).replace(/[^\d]/g, "");
      const err = $("#hErr"), res = $("#hRes"), btn = $("#hBtn");
      err.hidden = true; res.hidden = true;
      if (id.length < 5) { err.textContent = "اكتب رقمك الجامعي صح."; err.hidden = false; notify("WARNING"); return; }
      btn.disabled = true; btn.textContent = "جارِ البحث...";
      try {
        const rec = await lookupHours(id);
        if (!rec) { err.textContent = "ما لقينا هذا الرقم الجامعي، تأكد من كتابته صح."; err.hidden = false; notify("WARNING"); }
        else {
          store.set("uid", id);
          res.innerHTML = `<small>هلا</small><h3>${esc(rec.name)}</h3><div class="hours-num">${esc(rec.hours)}</div><small>عدد ساعاتك التطوعية</small>`;
          res.hidden = false; notify();
        }
      } catch (x) {
        err.textContent = "تعذّر البحث، تأكد من اتصالك بالإنترنت."; err.hidden = false;
      }
      btn.disabled = false; btn.textContent = "استعلام";
    });
  }

  /* =========================================================
     ٢) شخصيتك المحاسبية (نفس أسئلة وحساب js/quiz بالموقع)
     النتيجة تبقى على الجهاز فقط.
     ========================================================= */
  const Q = window.QUIZ;
  const APPEAR = (() => {
    const n = Object.fromEntries(Q.KEYS.map((k) => [k, 0]));
    Q.QUESTIONS.forEach((q) => q.choices.forEach((c) => { n[c.type] += 1; }));
    return n;
  })();
  function computeResult(answers) {
    const counts = Object.fromEntries(Q.KEYS.map((k) => [k, 0]));
    answers.forEach((ci, qi) => { counts[Q.QUESTIONS[qi].choices[ci].type] += 1; });
    const ratio = Object.fromEntries(Q.KEYS.map((k) => [k, APPEAR[k] ? counts[k] / APPEAR[k] : 0]));
    const tie = Object.fromEntries(Q.KEYS.map((k) => [k, Math.random()]));
    const ranked = [...Q.KEYS].sort((a, b) => ratio[b] - ratio[a] || tie[a] - tie[b]);
    const [top, second] = ranked;
    return {
      field: top,
      closeSecond: counts[second] > 0 && ratio[second] === ratio[top] ? second : null,
      ranked, scores: counts,
      percents: Object.fromEntries(Q.KEYS.map((k) => [k, Math.round(ratio[k] * 100)])),
    };
  }

  let quiz = null;
  function quizStart() {
    const last = store.get("quiz", null);
    quiz = last && last.step === "question" ? last : null;
    if (last && last.step === "result") return quizResult(last);
    openPage("شخصيتك المحاسبية", `
      <div class="tool-hero"><span class="tool-ic big">${ICONS.spark}</span><h2>اكتشف شخصيتك المحاسبية</h2><p>${ar(Q.QUESTIONS.length)} سؤال عن مواقف يومية، وبنقول لك وش شخصيتك المحاسبية والمجال اللي يناسبك.</p></div>
      <form class="card form" id="qForm" novalidate>
        <label class="field"><span>اسمك</span><input id="qName" maxlength="40" autocomplete="given-name" value="${esc((quiz && quiz.name) || store.get("quizName", ""))}" placeholder="اكتب اسمك هنا"></label>
        <p class="form-err" id="qErr" hidden></p>
        <button class="btn primary" type="submit">${quiz ? "كمّل من وين وقفت" : "ابدأ الاختبار"}</button>
      </form>`);
    $("#qForm").addEventListener("submit", (e) => {
      e.preventDefault(); tap();
      const name = $("#qName").value.replace(/\s+/g, " ").trim();
      const err = $("#qErr");
      const msg = !name ? "فضلًا، اكتب اسمك للبدء." : name.length < 2 ? "الاسم قصير جدًا، اكتب اسمك كاملًا." : !/\p{L}/u.test(name) ? "اكتب اسمك بالحروف." : "";
      err.textContent = msg; err.hidden = !msg;
      if (msg) { notify("WARNING"); return; }
      store.set("quizName", name);
      if (!quiz || quiz.name !== name) quiz = { name, answers: [], current: 0, step: "question" };
      quizQuestion();
    });
  }

  function quizQuestion() {
    store.set("quiz", quiz);
    const i = quiz.current, q = Q.QUESTIONS[i], total = Q.QUESTIONS.length;
    $("#pageTitle").textContent = "شخصيتك المحاسبية";
    body.innerHTML = `
      <div class="q-progress"><div class="q-progress-head"><span>السؤال ${ar(i + 1)} من ${ar(total)}</span></div><div class="q-track"><div class="q-bar" style="width:${Math.round((i / total) * 100)}%"></div></div></div>
      <div class="q-card card">
        <h2 class="q-text">${esc(q.text)}</h2>
        <div class="q-choices">${q.choices.map((c, ci) => `<button class="q-choice press ${quiz.answers[i] === ci ? "on" : ""}" data-c="${ci}"><span class="q-mark"></span><span>${esc(c.text)}</span></button>`).join("")}</div>
      </div>
      <div class="q-nav"><button class="btn ghost" id="qPrev" ${i === 0 ? "disabled" : ""}>السابق</button><button class="btn primary" id="qNext" ${quiz.answers[i] == null ? "disabled" : ""}>${i === total - 1 ? "اعرض النتيجة" : "التالي"}</button></div>`;
    toTop();
    $$(".q-choice", body).forEach((b) => b.addEventListener("click", () => {
      tap();
      quiz.answers[i] = +b.dataset.c;
      store.set("quiz", quiz);
      $$(".q-choice", body).forEach((x) => x.classList.toggle("on", x === b));
      $("#qNext").disabled = false;
      // ينتقل تلقائي بعد الاختيار عشان يكون أسرع
      clearTimeout(quizQuestion.t);
      quizQuestion.t = setTimeout(() => { if (quiz && quiz.current === i && i < total - 1) { quiz.current++; quizQuestion(); } }, 380);
    }));
    $("#qPrev").addEventListener("click", () => { tap(); clearTimeout(quizQuestion.t); if (quiz.current > 0) { quiz.current--; quizQuestion(); } });
    $("#qNext").addEventListener("click", () => {
      tap(); clearTimeout(quizQuestion.t);
      if (quiz.answers[i] == null) return;
      if (i < total - 1) { quiz.current++; quizQuestion(); return; }
      quiz.result = computeResult(quiz.answers);
      quiz.step = "result";
      store.set("quiz", quiz);
      body.innerHTML = `<div class="analyzing"><div class="spinner"></div><p>نحلل إجاباتك...</p></div>`;
      setTimeout(() => { notify(); quizResult(quiz); }, 1300);
    });
  }

  function quizResult(st) {
    quiz = st;
    const { field, closeSecond, ranked, scores, percents } = st.result;
    const info = Q.PERSONALITIES[field];
    const html = `
      <div class="q-result" style="--rc:${info.color}">
        <div class="q-badge"></div>
        <p class="q-hello">${esc(st.name)}، شخصيتك المحاسبية هي</p>
        <h2 class="q-label">${esc(info.label)}</h2>
        <p class="q-meaning">${esc(info.meaning)}</p>
        <div class="card q-field"><small>المجال المناسب لك</small><b>${esc(info.field)}</b></div>
        ${closeSecond ? `<p class="q-close">وشخصية <b>${esc(Q.PERSONALITIES[closeSecond].label)}</b> قريبة منك أيضًا.</p>` : ""}
        <div class="card q-bars">${ranked.slice(0, 3).filter((k) => scores[k] > 0).map((k) => `
          <div class="q-bar-row"><span>${esc(Q.PERSONALITIES[k].label)}</span><div class="q-bar-track"><div class="q-bar-fill" style="background:${Q.PERSONALITIES[k].color}" data-w="${percents[k] || 0}"></div></div><b>${ar(percents[k] || 0)}٪</b></div>`).join("")}
        </div>
        <div class="actions">
          <button class="btn primary" id="qShare">شارك بطاقتك 📸</button>
          <button class="btn ghost" id="qAgain">أعد الاختبار</button>
        </div>
      </div>`;
    if (page.hidden) openPage("شخصيتك المحاسبية", html); else { body.innerHTML = html; toTop(); }
    requestAnimationFrame(() => requestAnimationFrame(() => $$(".q-bar-fill", body).forEach((f) => { f.style.width = f.dataset.w + "%"; })));
    $("#qAgain").addEventListener("click", () => { tap(); store.set("quiz", null); quiz = { name: st.name, answers: [], current: 0, step: "question" }; quizQuestion(); });
    $("#qShare").addEventListener("click", async () => {
      tap();
      const b = $("#qShare"); b.disabled = true; b.textContent = "جارِ تجهيز البطاقة...";
      try { await shareCard({ name: st.name, personality: info.label, meaning: info.meaning, field: info.field, color: info.color }); }
      catch (e) { toast("تعذّر تجهيز البطاقة"); }
      b.disabled = false; b.textContent = "شارك بطاقتك 📸";
    });
  }

  /* بطاقة النتيجة 1080×1920 (نفس js/quiz/share-card.js) */
  function loadImage(src) {
    return new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  }
  function wrapLines(ctx, text, maxW) {
    const words = String(text || "").split(/\s+/).filter(Boolean); const lines = []; let line = "";
    for (const w of words) { const t = line ? line + " " + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line); return lines;
  }
  const FONT = "Almarai, -apple-system, sans-serif";
  function fitFont(ctx, text, weight, size, maxW) {
    do { ctx.font = `${weight} ${size}px ${FONT}`; if (ctx.measureText(text).width <= maxW) break; size -= 4; } while (size > 30);
    return size;
  }
  async function drawCard({ name, personality, meaning, field, color }) {
    try { await Promise.all([document.fonts.load("800 80px Almarai"), document.fonts.load("400 40px Almarai")]); } catch (e) { /* */ }
    const W = 1080, H = 1920;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    ctx.direction = "rtl"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, "#000878"); bg.addColorStop(1, "#0a1470");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.18; ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(W - 80, 260, 360, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(60, H - 220, 300, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    const logo = await loadImage("assets/club-mark-white.webp");
    if (logo) { const lw = 220, lh = (logo.height / logo.width) * lw; ctx.drawImage(logo, (W - lw) / 2, 150, lw, lh); }
    ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = `400 40px ${FONT}`;
    ctx.fillText("اختبار «اكتشف شخصيتك المحاسبية»", W / 2, 470);
    const cx = 80, cy = 560, cw = W - 160, ch = 1020, rr = 48;
    ctx.fillStyle = "#fff"; ctx.beginPath();
    ctx.moveTo(cx + rr, cy); ctx.arcTo(cx + cw, cy, cx + cw, cy + ch, rr); ctx.arcTo(cx + cw, cy + ch, cx, cy + ch, rr);
    ctx.arcTo(cx, cy + ch, cx, cy, rr); ctx.arcTo(cx, cy, cx + cw, cy, rr); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = color; ctx.fillRect(cx, cy, cw, 22); ctx.restore();
    ctx.fillStyle = "#000878"; fitFont(ctx, name, 800, 76, cw - 120); ctx.fillText(name, W / 2, cy + 150);
    ctx.fillStyle = "#6b6f99"; ctx.font = `400 42px ${FONT}`; ctx.fillText("شخصيتك المحاسبية", W / 2, cy + 260);
    const pSize = fitFont(ctx, personality, 800, 104, cw - 160);
    const pw = Math.min(cw - 80, ctx.measureText(personality).width + 100);
    ctx.fillStyle = color; ctx.globalAlpha = 0.35; ctx.fillRect((W - pw) / 2, cy + 390 - pSize * 0.15, pw, pSize * 0.55); ctx.globalAlpha = 1;
    ctx.fillStyle = "#000878"; ctx.fillText(personality, W / 2, cy + 370);
    ctx.fillStyle = "#2b2f55"; ctx.font = `400 44px ${FONT}`;
    wrapLines(ctx, meaning, cw - 160).slice(0, 3).forEach((l, i) => ctx.fillText(l, W / 2, cy + 520 + i * 66));
    ctx.fillStyle = "#6b6f99"; ctx.font = `400 38px ${FONT}`; ctx.fillText("المجال المناسب لك", W / 2, cy + 790);
    ctx.fillStyle = "#000878"; ctx.font = `800 48px ${FONT}`;
    wrapLines(ctx, field, cw - 140).slice(0, 2).forEach((l, i) => ctx.fillText(l, W / 2, cy + 870 + i * 64));
    ctx.fillStyle = "#fff"; ctx.font = `800 50px ${FONT}`; ctx.fillText("وأنت، وش شخصيتك المحاسبية؟", W / 2, 1700);
    ctx.fillStyle = "#6ccff6"; ctx.font = `700 44px ${FONT}`; ctx.fillText("تطبيق نادي المحاسبة", W / 2, 1790);
    return c;
  }
  async function shareCard(details) {
    const canvas = await drawCard(details);
    const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
    const file = new File([blob], "شخصيتي-المحاسبية.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "شخصيتي المحاسبية" }); return; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
    // احتياط: نعرض الصورة وتقدر تحفظها بالضغط المطوّل
    U.openViewer(canvas.toDataURL("image/png"));
    toast("اضغط مطولًا على الصورة واختر «حفظ الصورة»");
  }

  /* =========================================================
     ٣) ابنِ شركتك (نفس js/company-builder.js)
     ========================================================= */
  const SAR = (n) => { const r = Math.round(n); return `<bdi dir="ltr">${r < 0 ? "-" : ""}${Math.abs(r).toLocaleString("en-US")}</bdi> ريال`; };
  const DECISIONS = [
    { title: "رأس المال الافتتاحي", desc: "كم تضخ من أموالك الخاصة لتأسيس الشركة؟ هذا المبلغ يصبح رصيدك النقدي الأول ويُسجَّل كحقوق ملكية.",
      options: [
        { title: "50,000 ريال", detail: "بداية متحفظة — أقل مخاطرة شخصية.", amount: 50000 },
        { title: "100,000 ريال", detail: "بداية متوسطة ومتوازنة.", amount: 100000 },
        { title: "200,000 ريال", detail: "بداية قوية — تمنحك مرونة أكبر بالقرارات القادمة.", amount: 200000 }],
      apply(o, s) { s.cash += o.amount; s.capital += o.amount; } },
    { title: "مصدر تمويل إضافي", desc: "هل تحتاج سيولة إضافية قبل ما تبدأ عملياتك؟",
      options: [
        { title: "قرض بنكي بـ50,000 ريال", detail: "يضيف سيولة فورية، لكن بفائدة سنوية 5% (2,500 ريال) تُخصم من أرباحك.", effect: "loan" },
        { title: "مستثمر جديد يضخ 50,000 ريال", detail: "سيولة إضافية بدون فوائد أو ديون، لكن يتشارك معك ملكية الشركة.", effect: "investor" },
        { title: "بدون تمويل إضافي", detail: "تعتمد فقط على رأس مالك الحالي.", effect: "none" }],
      apply(o, s) {
        if (o.effect === "loan") { s.cash += 50000; s.loanPayable += 50000; s.interestExpense += 2500; }
        else if (o.effect === "investor") { s.cash += 50000; s.capital += 50000; }
      } },
    { title: "المكتب", desc: "وين تباشر عملك؟",
      options: [
        { title: "استئجار مكتب", detail: "إيجار سنوي 36,000 ريال يُخصم من أرباح السنة.", effect: "rent" },
        { title: "شراء مبنى نقدًا (80,000 ريال)", detail: "أصل ثابت يدوم معك، بإهلاك سنوي 8,000 ريال.", effect: "buy", requiresCash: 80000 },
        { title: "العمل من المنزل", detail: "بدون أي تكلفة — توفير كامل، لكن بلا مقر رسمي.", effect: "home" }],
      apply(o, s) {
        if (o.effect === "rent") s.rentExpense += 36000;
        else if (o.effect === "buy") { s.cash -= 80000; s.fixedAssetsCost += 80000; s.depreciationExpense += 8000; }
      } },
    { title: "التوظيف", desc: "هل توظف فريقًا يساعدك بالتشغيل؟",
      options: [
        { title: "توظيف موظفَين", detail: "رواتب سنوية إجمالية 60,000 ريال تُخصم من أرباحك.", effect: "hire" },
        { title: "العمل بمفردك", detail: "بدون رواتب — توفير، لكن كل المهام عليك وحدك.", effect: "solo" }],
      apply(o, s) { if (o.effect === "hire") s.salaryExpense += 60000; } },
    { title: "شراء المخزون", desc: "تحتاج بضاعة بقيمة 40,000 ريال لتبدأ البيع. كيف تشتريها؟",
      options: [
        { title: "الشراء نقدًا", detail: "يخصم المبلغ من رصيدك النقدي مباشرة.", effect: "cash", requiresCash: 40000 },
        { title: "الشراء بالأجل من مورّد", detail: "تحصل على البضاعة الآن وتسددها لاحقًا — يُسجَّل كذمم دائنة.", effect: "credit" }],
      apply(o, s) { s.inventory += 40000; if (o.effect === "cash") s.cash -= 40000; else s.accountsPayable += 40000; } },
    { title: "البيع", desc: "بعت كل مخزونك بـ70,000 ريال (أعلى من تكلفته 40,000 ريال). كيف تحصّل المبلغ؟",
      options: [
        { title: "البيع نقدًا", detail: "يدخل المبلغ كاملًا لرصيدك النقدي فورًا.", effect: "cash" },
        { title: "البيع بالأجل للعملاء", detail: "العميل يسدد لاحقًا — يُسجَّل كذمم مدينة.", effect: "credit" }],
      apply(o, s) { s.revenue += 70000; s.cogs += 40000; s.inventory -= 40000; if (o.effect === "cash") s.cash += 70000; else s.accountsReceivable += 70000; } },
  ];
  const fresh = () => ({ cash: 0, inventory: 0, fixedAssetsCost: 0, accountsReceivable: 0, accountsPayable: 0, loanPayable: 0, capital: 0, revenue: 0, cogs: 0, salaryExpense: 0, rentExpense: 0, interestExpense: 0, depreciationExpense: 0 });
  let co = null, coStep = 0;

  function company() {
    co = fresh(); coStep = 0;
    openPage("ابنِ شركتك", `
      <div class="tool-hero"><span class="tool-ic big">${ICONS.build}</span><h2>ابنِ شركتك</h2><p>${ar(DECISIONS.length)} قرارات تأسيسية، وبنهاية السنة نطلع لك قائمة الدخل وقائمة المركز المالي لشركتك.</p></div>
      <button class="btn primary" id="coStart">ابدأ بناء شركتك</button>`);
    $("#coStart").addEventListener("click", () => { tap(); coDecision(); });
  }
  function snapshot() {
    const assets = co.cash + co.inventory + co.fixedAssetsCost + co.accountsReceivable;
    return `<div class="co-snap"><div><small>النقدية</small><b>${SAR(co.cash)}</b></div><div><small>الأصول</small><b>${SAR(assets)}</b></div><div><small>حقوق الملكية</small><b>${SAR(co.capital)}</b></div></div>`;
  }
  function coDecision() {
    const d = DECISIONS[coStep];
    body.innerHTML = `
      ${snapshot()}
      <div class="co-dots">${DECISIONS.map((_, i) => `<span class="${i < coStep ? "done" : i === coStep ? "now" : ""}"></span>`).join("")}</div>
      <h2 class="co-title">${esc(d.title)}</h2>
      <p class="co-desc">${esc(d.desc)}</p>
      <div class="stack">${d.options.map((o, i) => {
        const ok = !o.requiresCash || co.cash >= o.requiresCash;
        return `<button class="card co-opt press" data-o="${i}" ${ok ? "" : "disabled"}><b>${esc(o.title)}</b><small>${esc(o.detail)}</small>${ok ? "" : `<span class="co-warn">⚠️ سيولتك الحالية (${SAR(co.cash)}) لا تكفي لهذا الخيار</span>`}</button>`;
      }).join("")}</div>`;
    toTop();
    $$(".co-opt:not([disabled])", body).forEach((b) => b.addEventListener("click", () => {
      tap("MEDIUM");
      d.apply(d.options[+b.dataset.o], co);
      coStep++;
      if (coStep < DECISIONS.length) coDecision();
      else {
        body.innerHTML = `<div class="analyzing"><div class="spinner"></div><p>نقفل السنة المالية...</p></div>`;
        setTimeout(coResults, 1300);
      }
    }));
  }
  function coResults() {
    const s = co;
    s.netIncome = s.revenue - s.cogs - s.salaryExpense - s.rentExpense - s.interestExpense - s.depreciationExpense;
    s.cash -= s.salaryExpense + s.rentExpense + s.interestExpense;
    s.fixedAssetsNet = s.fixedAssetsCost - s.depreciationExpense;
    const assets = s.cash + s.inventory + s.fixedAssetsNet + s.accountsReceivable;
    const liab = s.accountsPayable + s.loanPayable, eq = s.capital + s.netIncome;
    const profit = s.netIncome >= 0;
    const [title, emoji] = s.netIncome >= 25000 ? ["أداء ممتاز!", "🏆"] : s.netIncome >= 0 ? ["أداء جيد", "📈"] : s.netIncome >= -20000 ? ["سنة صعبة", "⚠️"] : ["خسارة كبيرة", "📉"];
    const row = (l, v, cls = "") => `<div class="st-row ${cls}"><span>${l}</span><b>${v}</b></div>`;
    const neg = (v) => `(${SAR(v)})`;
    body.innerHTML = `
      <div class="card co-verdict ${profit ? "" : "loss"}">
        <div class="co-emoji">${emoji}</div><h3>${title}</h3>
        <div class="co-net">${SAR(s.netIncome)}</div><small>صافي ربح/خسارة السنة المالية الأولى</small>
        ${s.cash < 0 ? `<p class="co-note">⚠️ نفدت سيولتك النقدية خلال السنة — شركة بهذا الوضع تحتاج تمويلًا إضافيًا عاجلًا لتستمر.</p>` : ""}
      </div>
      <div class="card statement"><h4>قائمة الدخل</h4>
        ${row("الإيرادات", SAR(s.revenue))}${row("تكلفة البضاعة المباعة", neg(s.cogs), "neg")}${row("مجمل الربح", SAR(s.revenue - s.cogs), "total")}
        ${row("رواتب", neg(s.salaryExpense), "neg")}${row("إيجار", neg(s.rentExpense), "neg")}${row("فوائد", neg(s.interestExpense), "neg")}${row("إهلاك", neg(s.depreciationExpense), "neg")}
        ${row("صافي الربح", SAR(s.netIncome), "total")}
      </div>
      <div class="card statement"><h4>قائمة المركز المالي</h4>
        ${row("النقدية", SAR(s.cash))}${row("المخزون", SAR(s.inventory))}${row("الذمم المدينة", SAR(s.accountsReceivable))}${row("أصول ثابتة (صافي)", SAR(s.fixedAssetsNet))}
        ${row("إجمالي الأصول", SAR(assets), "total")}
        ${row("الذمم الدائنة", SAR(s.accountsPayable), "gap")}${row("القرض", SAR(s.loanPayable))}${row("رأس المال والأرباح المحتجزة", SAR(eq))}
        ${row("إجمالي الخصوم وحقوق الملكية", SAR(liab + eq), "total")}
      </div>
      <div class="co-balance">✓ الأصول = الخصوم + حقوق الملكية — ميزانيتك متوازنة تمامًا</div>
      <button class="btn ghost" id="coAgain">جرّب مسارًا مختلفًا</button>`;
    toTop(); notify();
    $("#coAgain").addEventListener("click", () => { tap(); co = fresh(); coStep = 0; coDecision(); });
  }

  /* =========================================================
     ٤) سياسة الخصوصية (نفس privacy.html، معدّلة للتطبيق)
     ========================================================= */
  function privacy() {
    openPage("سياسة الخصوصية", `
      <article class="card prose">
        <p class="muted">آخر تحديث: ٢٧ نوفمبر ٢٠٢٦</p>
        <p>يحترم نادي المحاسبة بجامعة الإمام محمد بن سعود الإسلامية خصوصيتك. توضح هذه الصفحة البيانات التي يجمعها تطبيق النادي، وكيف نستخدمها.</p>
        <h3>البيانات التي نجمعها</h3>
        <ul>
          <li><b>بيانات التسجيل في الفعاليات:</b> الاسم والبريد الإلكتروني ورقم الجوال والتخصص، وتُدخلها أنت بنفسك في نموذج التسجيل.</li>
          <li><b>نموذج «تواصل معنا»:</b> الاسم والبريد الإلكتروني ونص رسالتك.</li>
          <li><b>الساعات التطوعية:</b> الرقم الجامعي الذي تكتبه يُستخدم للبحث عن ساعاتك فقط ولا يُرسل لأي جهة.</li>
        </ul>
        <h3>ما يبقى على جهازك فقط</h3>
        <ul>
          <li>نتيجة اختبار «شخصيتك المحاسبية» ولعبة «ابنِ شركتك» — لا تُرسل لنا.</li>
          <li>بيانات التسجيل الأخيرة ورقمك الجامعي، لتعبئتها تلقائيًا في المرة القادمة.</li>
          <li>تذكيرات الفعاليات: عند الضغط على «ذكّرني بالفعالية» يُجدول التذكير على جهازك نفسه، ويمكنك إيقاف الإشعارات من إعدادات الجهاز.</li>
        </ul>
        <h3>كيف نستخدمها</h3>
        <ul>
          <li>تنظيم الفعاليات والتواصل معك بخصوص الفعالية التي سجلت فيها.</li>
          <li>الرد على رسائلك.</li>
        </ul>
        <p>لا نبيع بياناتك ولا نشاركها مع أي جهة إعلانية، ولا يحتوي التطبيق على أي تتبع أو إعلانات. قد نشارك بيانات التسجيل مع الجهة المستضيفة للفعالية عند الحاجة لتنظيم الحضور فقط.</p>
        <h3>حذف بياناتك</h3>
        <p>لحذف البيانات المحفوظة على جهازك اضغط الزر بالأسفل. ولطلب حذف بياناتك لدينا أو تعديلها راسلنا على: <a href="mailto:${esc(D.email)}" dir="ltr">${esc(D.email)}</a></p>
      </article>
      <button class="btn ghost" id="wipe" style="margin-top:14px">مسح بياناتي من الجهاز</button>`);
    $("#wipe").addEventListener("click", () => {
      tap();
      ["profile", "uid", "quiz", "quizName", "registered"].forEach((k) => { try { localStorage.removeItem(k); } catch (e) { /* */ } });
      notify(); toast("تم مسح بياناتك من الجهاز");
    });
  }

  const ICONS = {
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    spark: '<svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>',
    build: '<svg viewBox="0 0 24 24"><path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6M3 20h18"/></svg>',
  };

  const ROUTES = { hours, quiz: quizStart, company, privacy };
  window.Tools = { open(key) { (ROUTES[key] || privacy)(); }, close: closePage };
})();
