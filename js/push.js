(function () {
  "use strict";

  const VAPID_PUBLIC_KEY = "BJ4TbZCTp8PibgtErgAXUGHzYTe0J9xD53tgNZnL7dAo6iPcvYtVrC1LlJTwU3qPSlwsg4CZb8PIJzVgpnvWl48";
  const SUBSCRIBE_ENDPOINT = "/.netlify/functions/subscribe";

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  function isIosDevice() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  const iosNeedsHomeScreen = isIosDevice() && !isStandalone();
  const canSubscribe = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

  if (!canSubscribe && !iosNeedsHomeScreen) return;

  const BELL_SVG =
    '<svg class="notif-fab-icon" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>' +
    '<path d="M13.73 21a2 2 0 0 1-3.46 0"/>' +
    '</svg>';

  const wrap = document.createElement("div");
  wrap.id = "notifWidget";
  wrap.innerHTML =
    '<button type="button" id="notifFab" class="notif-fab" aria-label="فعّل إشعارات نادي المحاسبة">' +
      BELL_SVG +
    '</button>' +
    '<div id="notifBanner" class="notif-banner" style="display:none;">' +
      '<button type="button" class="notif-banner-close" id="notifBannerClose" aria-label="إغلاق">✕</button>' +
      '<p class="notif-banner-text" id="notifBannerText"></p>' +
    '</div>';
  document.body.appendChild(wrap);

  const fab = document.getElementById("notifFab");
  const banner = document.getElementById("notifBanner");
  const bannerText = document.getElementById("notifBannerText");
  const bannerClose = document.getElementById("notifBannerClose");

  if (document.getElementById("gameFab")) {
    fab.classList.add("notif-fab-stacked");
  }

  function positionBanner() {
    const rect = fab.getBoundingClientRect();
    const fromBottom = Math.round(window.innerHeight - rect.top + 10);
    banner.style.bottom = fromBottom + "px";
  }

  function showBanner(html) {
    positionBanner();
    bannerText.innerHTML = html;
    banner.style.display = "block";
  }

  bannerClose.addEventListener("click", () => {
    banner.style.display = "none";
  });

  async function markActive() {
    fab.classList.add("notif-fab-active");
    fab.setAttribute("aria-label", "الإشعارات مفعّلة");
  }

  async function updateFabState() {
    if (iosNeedsHomeScreen) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await markActive();
    } catch (err) {
      /* تجاهل، الزر يبقى بحالته الافتراضية */
    }
  }

  async function subscribeToPush() {
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }
      await fetch(SUBSCRIBE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub }),
      });
      await markActive();
      showBanner("تم تفعيل الإشعارات، بتوصلك آخر أخبار النادي 🎉");
    } catch (err) {
      console.error("تعذر تفعيل إشعارات الدفع:", err);
      showBanner("تعذر تفعيل الإشعارات، جرّب مرة ثانية.");
    }
  }

  fab.addEventListener("click", async () => {
    if (iosNeedsHomeScreen) {
      showBanner(
        'الإشعارات على الآيفون تشتغل بس إذا الموقع مضاف للشاشة الرئيسية. ' +
        'اضغط زر المشاركة <strong>⬆️</strong> بالأسفل في سفاري، ثم اختر <strong>"إضافة إلى الشاشة الرئيسية"</strong>، ' +
        'وافتح الموقع بعدها من الأيقونة المضافة عشان تقدر تفعّل الإشعارات.'
      );
      return;
    }

    if (Notification.permission === "denied") {
      showBanner("الإشعارات ممنوعة من إعدادات المتصفح حاليًا. فعّلها من إعدادات الموقع بالمتصفح ثم أعد تحميل الصفحة.");
      return;
    }

    if (Notification.permission === "granted") {
      await subscribeToPush();
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await subscribeToPush();
    } else {
      showBanner("ما قدرنا نفعّل الإشعارات بدون إذن المتصفح.");
    }
  });

  updateFabState();
})();
