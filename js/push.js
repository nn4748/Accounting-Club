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

  const wrap = document.createElement("div");
  wrap.id = "notifWidget";
  wrap.innerHTML =
    '<button type="button" id="notifFab" class="notif-fab" aria-label="فعّل إشعارات نادي المحاسبة">' +
      '<span class="notif-fab-icon">🔔</span>' +
    '</button>' +
    '<div id="notifBanner" class="notif-banner" style="display:none;">' +
      '<button type="button" class="notif-banner-close" id="notifBannerClose" aria-label="إغلاق">✕</button>' +
      '<p class="notif-banner-text" id="notifBannerText"></p>' +
    '</div>';
  document.body.appendChild(wrap);

  const fab = document.getElementById("notifFab");
  const fabIcon = fab.querySelector(".notif-fab-icon");
  const banner = document.getElementById("notifBanner");
  const bannerText = document.getElementById("notifBannerText");
  const bannerClose = document.getElementById("notifBannerClose");

  function showBanner(html) {
    bannerText.innerHTML = html;
    banner.style.display = "block";
  }

  bannerClose.addEventListener("click", () => {
    banner.style.display = "none";
  });

  async function markActive() {
    fab.classList.add("notif-fab-active");
    fabIcon.textContent = "✅";
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
