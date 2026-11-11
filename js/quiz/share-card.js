// بطاقة نتيجة الاختبار كصورة (مقاس ستوري 1080×1920) يقدر المشارك يحفظها أو يشاركها.
const W = 1080;
const H = 1920;
const FONT = "Almarai, Tahoma, sans-serif";

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapLines(ctx, text, maxWidth) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fitFont(ctx, text, weight, maxSize, maxWidth) {
  let size = maxSize;
  do {
    ctx.font = `${weight} ${size}px ${FONT}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 4;
  } while (size > 30);
  return size;
}

export async function drawResultCard({ name, personality, meaning, field, color }) {
  try {
    await Promise.all([
      document.fonts.load(`800 80px Almarai`),
      document.fonts.load(`400 40px Almarai`),
    ]);
  } catch (e) { /* الخط الاحتياطي يكفي */ }

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // الخلفية
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#000878");
  bg.addColorStop(1, "#0a1470");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // دوائر زخرفية بلون الشخصية
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(W - 80, 260, 360, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(60, H - 220, 300, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // الشعار
  const logo = await loadImage("/assets/club-mark-white.webp");
  if (logo) {
    const lw = 220;
    const lh = (logo.height / logo.width) * lw;
    ctx.drawImage(logo, (W - lw) / 2, 150, lw, lh);
  }

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = `400 40px ${FONT}`;
  ctx.fillText("اختبار «اكتشف شخصيتك المحاسبية»", W / 2, 470);

  // البطاقة البيضاء
  const cx = 80, cy = 560, cw = W - 160, ch = 1020, rr = 48;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(cx + rr, cy);
  ctx.arcTo(cx + cw, cy, cx + cw, cy + ch, rr);
  ctx.arcTo(cx + cw, cy + ch, cx, cy + ch, rr);
  ctx.arcTo(cx, cy + ch, cx, cy, rr);
  ctx.arcTo(cx, cy, cx + cw, cy, rr);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = color;
  ctx.fillRect(cx, cy, cw, 22);
  ctx.restore();

  ctx.fillStyle = "#000878";
  fitFont(ctx, name, 800, 76, cw - 120);
  ctx.fillText(name, W / 2, cy + 150);

  ctx.fillStyle = "#6b6f99";
  ctx.font = `400 42px ${FONT}`;
  ctx.fillText("شخصيتك المحاسبية", W / 2, cy + 260);

  // اسم الشخصية داخل شريط ملوّن
  const pSize = fitFont(ctx, personality, 800, 104, cw - 160);
  const pw = Math.min(cw - 80, ctx.measureText(personality).width + 100);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.35;
  ctx.fillRect((W - pw) / 2, cy + 390 - pSize * 0.15, pw, pSize * 0.55);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#000878";
  ctx.fillText(personality, W / 2, cy + 370);

  ctx.fillStyle = "#2b2f55";
  ctx.font = `400 44px ${FONT}`;
  wrapLines(ctx, meaning, cw - 160).slice(0, 3).forEach((l, i) => ctx.fillText(l, W / 2, cy + 520 + i * 66));

  ctx.fillStyle = "#6b6f99";
  ctx.font = `400 38px ${FONT}`;
  ctx.fillText("المجال المناسب لك", W / 2, cy + 790);
  ctx.fillStyle = "#000878";
  ctx.font = `800 48px ${FONT}`;
  wrapLines(ctx, field, cw - 140).slice(0, 2).forEach((l, i) => ctx.fillText(l, W / 2, cy + 870 + i * 64));

  // التذييل
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 50px ${FONT}`;
  ctx.fillText("وأنت، وش شخصيتك المحاسبية؟", W / 2, 1700);
  ctx.fillStyle = "#6ccff6";
  ctx.font = `700 44px ${FONT}`;
  ctx.direction = "ltr";
  ctx.fillText("accclubimamu.com/quiz", W / 2, 1790);

  return canvas;
}

export async function shareResultCard(details) {
  const canvas = await drawResultCard(details);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  const file = new File([blob], "شخصيتي-المحاسبية.png", { type: "image/png" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "شخصيتي المحاسبية", text: "اكتشف شخصيتك المحاسبية: https://accclubimamu.com/quiz" });
      return "shared";
    } catch (e) {
      if (e && e.name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded";
}
