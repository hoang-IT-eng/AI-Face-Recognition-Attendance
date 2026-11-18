// FaceAttend landing — i18n, interactions, GSAP reveals.
(function () {
  "use strict";

  /* ================= i18n ================= */
  var I18N = {
    vi: {
      "meta.title": "FaceAttend — Điểm danh bằng nhận diện khuôn mặt AI",
      "meta.desc": "FaceAttend là hệ thống điểm danh sinh trắc học: nhận diện khuôn mặt tại kiosk, chống giả mạo bằng liveness detection, quản lý ca làm việc và báo cáo chấm công tự động.",
      "nav.menu": "Mở menu",
      "nav.how": "Cách hoạt động",
      "nav.features": "Tính năng",
      "nav.tech": "Công nghệ",
      "nav.demo": "Xem demo trực tiếp",
      "hero.eyebrow": "Hệ thống điểm danh sinh trắc học",
      "hero.title": "Điểm danh bằng nhận diện khuôn mặt cho văn phòng.",
      "hero.sub": "FaceAttend nhận diện nhân viên ngay tại kiosk bằng AI — không thẻ, không vân tay, không xếp hàng chờ. Mọi lượt vào ra được ghi lại tức thì, đối chiếu với ca làm việc và tổng hợp thành báo cáo chấm công tự động.",
      "hero.cta1": "Trải nghiệm demo live",
      "hero.cta2": "Xem cách hoạt động",
      "hero.t1k": "Nhận diện",
      "hero.t2k": "Chế độ",
      "hero.t2v": "Không tiếp xúc",
      "hero.t3k": "Ghi nhận",
      "hero.t3v": "Thời gian thực",
      "kiosk.imgalt": "Nhân viên trong sảnh văn phòng hiện đại, ánh sáng tự nhiên",
      "kiosk.caption": "Ảnh minh họa — nhân viên tại sảnh văn phòng.",
      "how.eyebrow": "Cách hoạt động",
      "how.title": "Từ khuôn mặt đến bảng công — trong ba bước",
      "step1.t": "Đăng ký khuôn mặt",
      "step1.p": "Nhân viên đăng ký một lần tại quầy quản trị hoặc kiosk. Hệ thống trích xuất đặc trưng khuôn mặt và lưu trữ an toàn làm hồ sơ sinh trắc học.",
      "step2.t": "Nhận diện tại kiosk",
      "step2.p": "Ngay khi nhân viên đến cổng, camera nhận diện khuôn mặt, đồng thời kiểm tra liveness bằng chuyển động chớp mắt để ngăn điểm danh hộ bằng ảnh hoặc video.",
      "step3.t": "Báo cáo & cảnh báo",
      "step3.p": "Lượt điểm danh được đối chiếu với ca làm việc: đúng giờ, đi muộn hay vắng mặt. HR xem dashboard trực tiếp, nhận cảnh báo bất thường và xuất báo cáo khi cần.",
      "feat.eyebrow": "Tính năng",
      "feat.title": "Đủ sâu cho vận hành. Đủ gọn cho người dùng.",
      "f1.t": "Nhận diện khuôn mặt AI",
      "f1.p": "DeepFace trích xuất và đối sánh vector khuôn mặt tại cổng, thích ứng với thay đổi về góc mặt và ánh sáng.",
      "f2.t": "Chống giả mạo hai lớp",
      "f2.p": "Anti-spoofing kết hợp phát hiện chớp mắt bằng MediaPipe giúp chặn điểm danh bằng ảnh in, màn hình điện thoại hay video phát lại.",
      "f3.t": "Kiosk không tiếp xúc",
      "f3.p": "Màn hình kiosk toàn màn hình tại cổng ra vào: nhân viên chỉ cần bước qua camera, không chạm, không thẻ, không xếp hàng.",
      "f4.t": "Quản lý ca làm việc",
      "f4.p": "Định nghĩa ca, giờ vào/ra và ngưỡng đi muộn. Hệ thống tự phân loại từng lượt điểm danh theo đúng ca của từng nhân viên.",
      "f5.t": "Báo cáo chấm công",
      "f5.p": "Dashboard tổng quan theo ngày, tuần, tháng; báo cáo chi tiết từng nhân viên, lịch sử điểm danh và chỉnh sửa công có kiểm soát.",
      "f6.t": "Cảnh báo & quyền riêng tư",
      "f6.p": "Cảnh báo khi có lượt lạ hoặc bất thường, điểm danh thay thế khi camera gặp sự cố, và cài đặt quyền riêng tư cho dữ liệu sinh trắc học.",
      "pipe.eyebrow": "Kiến trúc",
      "pipe.title": "Đường ống xử lý sinh trắc học",
      "pipe.n1t": "Camera kiosk",
      "pipe.n1p": "Thu khung hình tại cổng",
      "pipe.n2p": "Mốc khuôn mặt & chớp mắt",
      "pipe.n3p": "Vector đặc trưng & đối sánh",
      "pipe.n4p": "API & WebSocket trực tiếp",
      "pipe.n5t": "Bảng điều khiển",
      "pipe.n5p": "Dashboard & báo cáo",
      "tech.1": "Backend Python hiệu năng cao",
      "tech.2": "Nhận diện & đối sánh khuôn mặt",
      "tech.3": "Phát hiện chớp mắt, liveness",
      "tech.4": "Giao diện quản trị & kiosk",
      "tech.5": "Hệ thống thiết kế của console quản trị",
      "tech.6": "Luồng camera & giám sát trực tiếp",
      "demo.eyebrow": "Demo trực tuyến",
      "demo.title": "Xem hệ thống đang chạy thật",
      "demo.sub": "Bản demo FaceAttend đang hoạt động trên nền tảng đám mây — dashboard tổng quan chấm công, nhật ký điểm danh thời gian thực và phân bố trạng thái ca làm việc.",
      "demo.cta": "Mở demo tại hoang-attend.pages.dev",
      "footer.tag": "Hệ thống điểm danh bằng nhận diện khuôn mặt AI.",
      "footer.demo": "Demo trực tiếp",
      "footer.credit": "Thiết kế & phát triển bởi <strong>Trần Huy Hoàng</strong>",
      "footer.rights": "© {YEAR} FaceAttend. Mọi quyền được bảo lưu."
    },
    en: {
      "meta.title": "FaceAttend — AI Face Recognition Attendance",
      "meta.desc": "FaceAttend is a biometric attendance system: face recognition at the kiosk, liveness anti-spoofing, shift management and automatic timesheet reporting.",
      "nav.menu": "Open menu",
      "nav.how": "How it works",
      "nav.features": "Features",
      "nav.tech": "Technology",
      "nav.demo": "View live demo",
      "hero.eyebrow": "Biometric attendance system",
      "hero.title": "Face-recognition attendance for the office.",
      "hero.sub": "FaceAttend recognizes employees right at the kiosk with AI — no cards, no fingerprints, no queues. Every check-in is recorded instantly, matched against work shifts and rolled up into automatic timesheet reports.",
      "hero.cta1": "Try the live demo",
      "hero.cta2": "See how it works",
      "hero.t1k": "Recognition",
      "hero.t2k": "Mode",
      "hero.t2v": "Contactless",
      "hero.t3k": "Logging",
      "hero.t3v": "Real-time",
      "kiosk.imgalt": "An employee in a bright, modern office lobby",
      "kiosk.caption": "Illustrative photo — an employee in an office lobby.",
      "how.eyebrow": "How it works",
      "how.title": "From face to timesheet — in three steps",
      "step1.t": "Enroll a face",
      "step1.p": "Employees enroll once at the admin desk or a kiosk. The system extracts facial features and stores them securely as a biometric profile.",
      "step2.t": "Recognize at the kiosk",
      "step2.p": "As the employee arrives at the gate, the camera identifies the face while a blink-based liveness check blocks buddy punching with photos or videos.",
      "step3.t": "Reports & alerts",
      "step3.p": "Each check-in is matched against the work shift: on time, late or absent. HR watches a live dashboard, gets anomaly alerts and exports reports on demand.",
      "feat.eyebrow": "Features",
      "feat.title": "Deep enough for operations. Simple enough for everyone.",
      "f1.t": "AI face recognition",
      "f1.p": "DeepFace extracts and matches face vectors at the gate, coping with changes in face angle and gate lighting.",
      "f2.t": "Two-layer anti-spoofing",
      "f2.p": "Anti-spoofing combined with MediaPipe blink detection stops check-ins faked with printed photos, phone screens or replayed video.",
      "f3.t": "Contactless kiosk",
      "f3.p": "A full-screen kiosk at every entrance: employees simply walk past the camera — no touching, no cards, no queues.",
      "f4.t": "Shift management",
      "f4.p": "Define shifts, check-in windows and late thresholds. The system classifies every check-in against each employee's own shift.",
      "f5.t": "Timesheet reporting",
      "f5.p": "Overview dashboards by day, week and month; per-employee reports, attendance history and controlled record corrections.",
      "f6.t": "Alerts & privacy",
      "f6.p": "Alerts for unknown faces and anomalies, fallback check-in when a camera fails, and privacy controls for biometric data.",
      "pipe.eyebrow": "Architecture",
      "pipe.title": "The biometric pipeline",
      "pipe.n1t": "Kiosk camera",
      "pipe.n1p": "Frame capture at the gate",
      "pipe.n2p": "Face landmarks & blink",
      "pipe.n3p": "Embedding & matching",
      "pipe.n4p": "API & live WebSocket",
      "pipe.n5t": "Admin console",
      "pipe.n5p": "Dashboard & reports",
      "tech.1": "High-performance Python backend",
      "tech.2": "Face recognition & matching",
      "tech.3": "Blink detection, liveness",
      "tech.4": "Admin & kiosk interfaces",
      "tech.5": "Design system of the admin console",
      "tech.6": "Live camera & monitoring streams",
      "demo.eyebrow": "Online demo",
      "demo.title": "See the system running live",
      "demo.sub": "The FaceAttend demo is running in the cloud — an attendance overview dashboard, a real-time check-in log and shift status distribution.",
      "demo.cta": "Open the demo at hoang-attend.pages.dev",
      "footer.tag": "AI face-recognition attendance system.",
      "footer.demo": "Live demo",
      "footer.credit": "Designed & developed by <strong>Trần Huy Hoàng</strong>",
      "footer.rights": "© {YEAR} FaceAttend. All rights reserved."
    }
  };

  var LANG_KEY = "site-lang";
  var currentLang = "vi";
  try {
    var saved = window.localStorage.getItem(LANG_KEY);
    if (saved === "vi" || saved === "en") currentLang = saved;
  } catch (e) { /* storage unavailable — default vi */ }

  var yearStr = String(new Date().getFullYear());

  function applyLang(lang) {
    var dict = I18N[lang] || I18N.vi;
    currentLang = lang;
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var val = dict[key];
      if (typeof val === "string") {
        el.innerHTML = val.replace("{YEAR}", yearStr);
      }
    });
    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(",").forEach(function (pair) {
        var parts = pair.split(":");
        if (parts.length !== 2) return;
        var val = dict[parts[1].trim()];
        if (typeof val === "string") el.setAttribute(parts[0].trim(), val);
      });
    });
    var current = document.getElementById("langCurrent");
    if (current) current.textContent = lang.toUpperCase();
    document.querySelectorAll(".lang-option").forEach(function (opt) {
      var active = opt.getAttribute("data-lang") === lang;
      opt.classList.toggle("active", active);
      opt.setAttribute("aria-selected", active ? "true" : "false");
    });
    try { window.localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
  }

  /* Language switcher open/close */
  var langSwitch = document.getElementById("langSwitch");
  var langPill = document.getElementById("langPill");
  var langMenu = document.getElementById("langMenu");
  function setLangOpen(open) {
    langSwitch.classList.toggle("open", open);
    langPill.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) langMenu.removeAttribute("hidden");
    else langMenu.setAttribute("hidden", "");
  }
  langPill.addEventListener("click", function (e) {
    e.stopPropagation();
    setLangOpen(!langSwitch.classList.contains("open"));
  });
  langMenu.addEventListener("click", function (e) {
    var opt = e.target.closest(".lang-option");
    if (!opt) return;
    applyLang(opt.getAttribute("data-lang"));
    setLangOpen(false);
  });
  document.addEventListener("click", function (e) {
    if (!langSwitch.contains(e.target)) setLangOpen(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setLangOpen(false);
  });

  /* ================= Header / nav ================= */
  var header = document.getElementById("siteHeader");
  var onScroll = function () {
    header.classList.toggle("scrolled", window.scrollY > 8);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("siteNav");
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = yearStr;

  /* Apply language */
  applyLang(currentLang);

  /* ================= GSAP motion (quiet reveals) ================= */
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (window.gsap && !reducedMotion) {
    var gsap = window.gsap;
    gsap.from("[data-hero]", {
      y: 16, opacity: 0, duration: 0.75, ease: "power3.out", stagger: 0.07, delay: 0.05
    });

    if (window.ScrollTrigger) {
      gsap.registerPlugin(window.ScrollTrigger);
      document.documentElement.classList.add("gsap-on");

      // Generic reveals
      gsap.utils.toArray("[data-reveal]").forEach(function (el) {
        gsap.to(el, {
          opacity: 1, y: 0, duration: 0.7, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true }
        });
      });

      // Pipeline: nodes cascade in sequence
      var pipeNodes = gsap.utils.toArray(".pipe-node");
      if (pipeNodes.length) {
        gsap.fromTo(pipeNodes,
          { y: 14, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.55, ease: "power3.out", stagger: 0.08,
            scrollTrigger: { trigger: ".pipeline", start: "top 85%", once: true }
          });
      }
    }
  }
})();

// Warm up the AI backend (it sleeps when idle) so the live demo connects faster.
try {
  fetch("https://faceattend-api.blueground-3385828b.eastasia.azurecontainerapps.io/api/health", { mode: "no-cors", cache: "no-store" }).catch(function () {});
} catch (e) {}
