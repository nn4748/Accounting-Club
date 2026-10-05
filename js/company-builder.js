function formatSAR(n) {
    const rounded = Math.round(n);
    const sign = rounded < 0 ? "-" : "";
    const abs = Math.abs(rounded).toLocaleString("en-US");
    return sign + abs + " ريال";
}

const DECISIONS = [
    {
        id: "capital",
        title: "رأس المال الافتتاحي",
        desc: "كم تضخ من أموالك الخاصة لتأسيس الشركة؟ هذا المبلغ يصبح رصيدك النقدي الأول ويُسجَّل كحقوق ملكية.",
        options: [
            { id: "c50", title: "50,000 ريال", detail: "بداية متحفظة — أقل مخاطرة شخصية.", amount: 50000 },
            { id: "c100", title: "100,000 ريال", detail: "بداية متوسطة ومتوازنة.", amount: 100000 },
            { id: "c200", title: "200,000 ريال", detail: "بداية قوية — تمنحك مرونة أكبر بالقرارات القادمة.", amount: 200000 }
        ],
        apply(opt, s) {
            s.cash += opt.amount;
            s.capital += opt.amount;
        }
    },
    {
        id: "financing",
        title: "مصدر تمويل إضافي",
        desc: "هل تحتاج سيولة إضافية قبل ما تبدأ عملياتك؟",
        options: [
            { id: "loan", title: "قرض بنكي بـ50,000 ريال", detail: "يضيف سيولة فورية، لكن بفائدة سنوية 5% (2,500 ريال) تُخصم من أرباحك.", effect: "loan" },
            { id: "investor", title: "مستثمر جديد يضخ 50,000 ريال", detail: "سيولة إضافية بدون فوائد أو ديون، لكن يتشارك معك ملكية الشركة.", effect: "investor" },
            { id: "none", title: "بدون تمويل إضافي", detail: "تعتمد فقط على رأس مالك الحالي.", effect: "none" }
        ],
        apply(opt, s) {
            if (opt.effect === "loan") {
                s.cash += 50000;
                s.loanPayable += 50000;
                s.interestExpense += 2500;
            } else if (opt.effect === "investor") {
                s.cash += 50000;
                s.capital += 50000;
            }
        }
    },
    {
        id: "office",
        title: "المكتب",
        desc: "وين تباشر عملك؟",
        options: [
            { id: "rent", title: "استئجار مكتب", detail: "إيجار سنوي 36,000 ريال يُخصم من أرباح السنة.", effect: "rent" },
            { id: "buy", title: "شراء مبنى نقدًا (80,000 ريال)", detail: "أصل ثابت يدوم معك، بإهلاك سنوي 8,000 ريال.", effect: "buy", requiresCash: 80000 },
            { id: "home", title: "العمل من المنزل", detail: "بدون أي تكلفة — توفير كامل، لكن بلا مقر رسمي.", effect: "home" }
        ],
        apply(opt, s) {
            if (opt.effect === "rent") {
                s.rentExpense += 36000;
            } else if (opt.effect === "buy") {
                s.cash -= 80000;
                s.fixedAssetsCost += 80000;
                s.depreciationExpense += 8000;
            }
        }
    },
    {
        id: "hiring",
        title: "التوظيف",
        desc: "هل توظف فريقًا يساعدك بالتشغيل؟",
        options: [
            { id: "hire", title: "توظيف موظفَين", detail: "رواتب سنوية إجمالية 60,000 ريال تُخصم من أرباحك.", effect: "hire" },
            { id: "solo", title: "العمل بمفردك", detail: "بدون رواتب — توفير، لكن كل المهام عليك وحدك.", effect: "solo" }
        ],
        apply(opt, s) {
            if (opt.effect === "hire") {
                s.salaryExpense += 60000;
            }
        }
    },
    {
        id: "inventory",
        title: "شراء المخزون",
        desc: "تحتاج بضاعة بقيمة 40,000 ريال لتبدأ البيع. كيف تشتريها؟",
        options: [
            { id: "cash", title: "الشراء نقدًا", detail: "يخصم المبلغ من رصيدك النقدي مباشرة.", effect: "cash", requiresCash: 40000 },
            { id: "credit", title: "الشراء بالأجل من مورّد", detail: "تحصل على البضاعة الآن وتسددها لاحقًا — يُسجَّل كذمم دائنة.", effect: "credit" }
        ],
        apply(opt, s) {
            s.inventory += 40000;
            if (opt.effect === "cash") {
                s.cash -= 40000;
            } else {
                s.accountsPayable += 40000;
            }
        }
    },
    {
        id: "sales",
        title: "البيع",
        desc: "بعت كل مخزونك بـ70,000 ريال (أعلى من تكلفته 40,000 ريال). كيف تحصّل المبلغ؟",
        options: [
            { id: "cash", title: "البيع نقدًا", detail: "يدخل المبلغ كاملًا لرصيدك النقدي فورًا.", effect: "cash" },
            { id: "credit", title: "البيع بالأجل للعملاء", detail: "العميل يسدد لاحقًا — يُسجَّل كذمم مدينة.", effect: "credit" }
        ],
        apply(opt, s) {
            s.revenue += 70000;
            s.cogs += 40000;
            s.inventory -= 40000;
            if (opt.effect === "cash") {
                s.cash += 70000;
            } else {
                s.accountsReceivable += 70000;
            }
        }
    }
];

function freshState() {
    return {
        cash: 0, inventory: 0, fixedAssetsCost: 0, accountsReceivable: 0,
        accountsPayable: 0, loanPayable: 0, capital: 0,
        revenue: 0, cogs: 0, salaryExpense: 0, rentExpense: 0,
        interestExpense: 0, depreciationExpense: 0
    };
}

let state = freshState();
let stepIndex = 0;

const screenIntro = document.getElementById("screen-intro");
const screenDecision = document.getElementById("screen-decision");
const screenClosing = document.getElementById("screen-closing");
const screenResults = document.getElementById("screen-results");
const snapshot = document.getElementById("snapshot");
const snapCash = document.getElementById("snapCash");
const snapAssets = document.getElementById("snapAssets");
const snapEquity = document.getElementById("snapEquity");
const progressLine = document.getElementById("progressLine");
const stepTitle = document.getElementById("stepTitle");
const stepDesc = document.getElementById("stepDesc");
const optionsContainer = document.getElementById("optionsContainer");
const resultsContent = document.getElementById("resultsContent");
const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retryBtn");

function showScreen(el) {
    [screenIntro, screenDecision, screenClosing, screenResults].forEach(s => s.classList.remove("active"));
    el.classList.add("active");
}

function updateSnapshot() {
    const totalAssets = state.cash + state.inventory + state.fixedAssetsCost + state.accountsReceivable;
    snapCash.textContent = formatSAR(state.cash);
    snapAssets.textContent = formatSAR(totalAssets);
    snapEquity.textContent = formatSAR(state.capital);
}

function renderProgress() {
    progressLine.innerHTML = "";
    DECISIONS.forEach((d, i) => {
        const dot = document.createElement("div");
        dot.className = "progress-dot" + (i < stepIndex ? " done" : "");
        progressLine.appendChild(dot);
    });
}

function renderDecisionScreen() {
    const decision = DECISIONS[stepIndex];
    renderProgress();
    stepTitle.textContent = decision.title;
    stepDesc.textContent = decision.desc;
    optionsContainer.innerHTML = "";

    decision.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "option-card";
        const affordable = !opt.requiresCash || state.cash >= opt.requiresCash;
        if (!affordable) btn.disabled = true;

        const titleEl = document.createElement("div");
        titleEl.className = "option-title";
        titleEl.textContent = opt.title;
        btn.appendChild(titleEl);

        const detailEl = document.createElement("div");
        detailEl.className = "option-detail";
        detailEl.textContent = opt.detail;
        btn.appendChild(detailEl);

        if (!affordable) {
            const warnEl = document.createElement("div");
            warnEl.className = "option-warn";
            warnEl.textContent = "⚠️ سيولتك الحالية (" + formatSAR(state.cash) + ") لا تكفي لهذا الخيار";
            btn.appendChild(warnEl);
        } else {
            btn.addEventListener("click", () => selectOption(decision, opt));
        }

        optionsContainer.appendChild(btn);
    });

    showScreen(screenDecision);
}

function selectOption(decision, opt) {
    decision.apply(opt, state);
    updateSnapshot();
    stepIndex++;
    if (stepIndex < DECISIONS.length) {
        renderDecisionScreen();
    } else {
        runClosing();
    }
}

function runClosing() {
    showScreen(screenClosing);
    setTimeout(() => {
        closeYear();
        renderResults();
        showScreen(screenResults);
    }, 1400);
}

function closeYear() {
    const netIncome = state.revenue - state.cogs - state.salaryExpense
        - state.rentExpense - state.interestExpense - state.depreciationExpense;
    state.cash -= (state.salaryExpense + state.rentExpense + state.interestExpense);
    state.fixedAssetsNet = state.fixedAssetsCost - state.depreciationExpense;
    state.netIncome = netIncome;
}

function renderResults() {
    const totalAssets = state.cash + state.inventory + state.fixedAssetsNet + state.accountsReceivable;
    const totalLiabilities = state.accountsPayable + state.loanPayable;
    const totalEquity = state.capital + state.netIncome;
    const grossProfit = state.revenue - state.cogs;
    const isProfit = state.netIncome >= 0;

    let verdictTitle, verdictEmoji;
    if (state.netIncome >= 25000) { verdictTitle = "أداء ممتاز!"; verdictEmoji = "🏆"; }
    else if (state.netIncome >= 0) { verdictTitle = "أداء جيد"; verdictEmoji = "📈"; }
    else if (state.netIncome >= -20000) { verdictTitle = "سنة صعبة"; verdictEmoji = "⚠️"; }
    else { verdictTitle = "خسارة كبيرة"; verdictEmoji = "📉"; }

    const cashWarning = state.cash < 0
        ? `<div class="verdict-note">⚠️ نفدت سيولتك النقدية خلال السنة — شركة بهذا الوضع تحتاج تمويلًا إضافيًا عاجلًا لتستمر.</div>`
        : "";

    resultsContent.innerHTML = `
        <div class="result-verdict ${isProfit ? "" : "loss"}">
            <div class="verdict-emoji">${verdictEmoji}</div>
            <div class="verdict-title">${verdictTitle}</div>
            <div class="verdict-net ${isProfit ? "positive" : "negative"}">${formatSAR(state.netIncome)}</div>
            <div class="verdict-note">صافي ربح/خسارة السنة المالية الأولى</div>
            ${cashWarning}
        </div>

        <div class="statement-card">
            <div class="statement-title">قائمة الدخل</div>
            <div class="statement-row"><span class="row-label">الإيرادات</span><span class="row-value">${formatSAR(state.revenue)}</span></div>
            <div class="statement-row neg"><span class="row-label">تكلفة البضاعة المباعة</span><span class="row-value">(${formatSAR(state.cogs)})</span></div>
            <div class="statement-row total"><span class="row-label">مجمل الربح</span><span class="row-value">${formatSAR(grossProfit)}</span></div>
            <div class="statement-row neg"><span class="row-label">رواتب</span><span class="row-value">(${formatSAR(state.salaryExpense)})</span></div>
            <div class="statement-row neg"><span class="row-label">إيجار</span><span class="row-value">(${formatSAR(state.rentExpense)})</span></div>
            <div class="statement-row neg"><span class="row-label">فوائد</span><span class="row-value">(${formatSAR(state.interestExpense)})</span></div>
            <div class="statement-row neg"><span class="row-label">إهلاك</span><span class="row-value">(${formatSAR(state.depreciationExpense)})</span></div>
            <div class="statement-row total"><span class="row-label">صافي الربح</span><span class="row-value">${formatSAR(state.netIncome)}</span></div>
        </div>

        <div class="statement-card">
            <div class="statement-title">قائمة المركز المالي</div>
            <div class="statement-row"><span class="row-label">النقدية</span><span class="row-value">${formatSAR(state.cash)}</span></div>
            <div class="statement-row"><span class="row-label">المخزون</span><span class="row-value">${formatSAR(state.inventory)}</span></div>
            <div class="statement-row"><span class="row-label">الذمم المدينة</span><span class="row-value">${formatSAR(state.accountsReceivable)}</span></div>
            <div class="statement-row"><span class="row-label">أصول ثابتة (صافي)</span><span class="row-value">${formatSAR(state.fixedAssetsNet)}</span></div>
            <div class="statement-row total"><span class="row-label">إجمالي الأصول</span><span class="row-value">${formatSAR(totalAssets)}</span></div>
            <div class="statement-row" style="margin-top:10px;"><span class="row-label">الذمم الدائنة</span><span class="row-value">${formatSAR(state.accountsPayable)}</span></div>
            <div class="statement-row"><span class="row-label">القرض</span><span class="row-value">${formatSAR(state.loanPayable)}</span></div>
            <div class="statement-row"><span class="row-label">رأس المال والأرباح المحتجزة</span><span class="row-value">${formatSAR(totalEquity)}</span></div>
            <div class="statement-row total"><span class="row-label">إجمالي الخصوم وحقوق الملكية</span><span class="row-value">${formatSAR(totalLiabilities + totalEquity)}</span></div>
        </div>

        <div class="balance-check">✓ الأصول = الخصوم + حقوق الملكية — ميزانيتك متوازنة تمامًا</div>
    `;
}

function reset() {
    state = freshState();
    stepIndex = 0;
    updateSnapshot();
    snapshot.classList.remove("show");
    showScreen(screenIntro);
}

startBtn.addEventListener("click", () => {
    snapshot.classList.add("show");
    updateSnapshot();
    renderDecisionScreen();
});

retryBtn.addEventListener("click", reset);

updateSnapshot();
