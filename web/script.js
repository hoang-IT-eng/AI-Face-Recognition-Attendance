// FaceAttend landing — i18n, interactions, canvas mesh, GSAP reveals.
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
      "hero.title": "Điểm danh bằng <span class=\"grad\">khuôn mặt</span>.<br />Nhanh. Chính xác.<br />Không tiếp xúc.",
      "hero.sub": "FaceAttend nhận diện nhân viên ngay tại kiosk bằng AI — không thẻ, không vân tay, không xếp hàng chờ. Mọi lượt vào ra được ghi lại tức thì, đối chiếu với ca làm việc và tổng hợp thành báo cáo chấm công tự động.",
      "hero.cta1": "Trải nghiệm demo live",
      "hero.cta2": "Xem cách hoạt động",
      "hero.t2k": "Chế độ",
      "hero.t2v": "Không tiếp xúc",
      "hero.t3k": "Ghi nhận",
      "hero.t3v": "Thời gian thực",
      "kiosk.title": "KIOSK CỔNG A — TRỰC TIẾP",
      "kiosk.badge": "ĐÃ NHẬN DIỆN",
      "kiosk.meta": "Kỹ thuật • Ca 08:00",
      "kiosk.status": "Có mặt 07:52",
      "chip.a": "Có mặt hôm nay",
      "chip.bt": "Thời gian thực",
      "chip.bs": "Nhật ký điểm danh trực tiếp",
      "hud.1": "SCANNING FACE MESH…",
      "hud.2": "LIVENESS · ĐÃ PHÁT HIỆN CHỚP MẮT",
      "hud.3": "EMBEDDING · VECTOR 512 CHIỀU",
      "hud.4": "ĐỐI SÁNH · ĐỘ KHỚP 99.2%",
      "how.eyebrow": "Cách hoạt động",
      "how.title": "Từ khuôn mặt đến bảng công — trong ba bước",
      "step1.t": "Đăng ký khuôn mặt",
      "step1.p": "Nhân viên đăng ký một lần tại quầy quản trị hoặc kiosk. Hệ thống trích xuất đặc trưng khuôn mặt và lưu trữ an toàn làm hồ sơ sinh trắc học.",
      "step2.t": "Nhận diện tại kiosk",
      "step2.p": "Khi đến cổng, camera nhận diện khuôn mặt trong tích tắc, đồng thời kiểm tra liveness bằng chuyển động chớp mắt để ngăn điểm danh hộ bằng ảnh hoặc video.",
      "step3.t": "Báo cáo & cảnh báo",
      "step3.p": "Lượt điểm danh được đối chiếu với ca làm việc: đúng giờ, đi muộn hay vắng mặt. HR xem dashboard trực tiếp, nhận cảnh báo bất thường và xuất báo cáo khi cần.",
      "feat.eyebrow": "Tính năng",
      "feat.title": "Đủ sâu cho vận hành. Đủ gọn cho người dùng.",
      "f1.t": "Nhận diện khuôn mặt AI",
      "f1.p": "DeepFace trích xuất và đối sánh vector khuôn mặt với độ chính xác cao, kể cả khi thay đổi góc mặt hay ánh sáng tại cổng.",
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
      "tech.5": "Hệ thống thiết kế nhất quán",
      "tech.6": "Luồng camera & giám sát trực tiếp",
      "demo.eyebrow": "Demo trực tuyến",
      "demo.title": "Xem hệ thống đang chạy thật",
      "demo.sub": "Bản demo SecureFace AI đang hoạt động trên nền tảng đám mây — dashboard tổng quan chấm công, nhật ký điểm danh thời gian thực và phân bố trạng thái ca làm việc.",
      "demo.cta": "Mở demo tại attend-live.azurewebsites.net",
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
      "hero.title": "Attendance by <span class=\"grad\">face</span>.<br />Fast. Accurate.<br />Contactless.",
      "hero.sub": "FaceAttend recognizes employees right at the kiosk with AI — no cards, no fingerprints, no queues. Every check-in is recorded instantly, matched against work shifts and rolled up into automatic timesheet reports.",
      "hero.cta1": "Try the live demo",
      "hero.cta2": "See how it works",
      "hero.t2k": "Mode",
      "hero.t2v": "Contactless",
      "hero.t3k": "Logging",
      "hero.t3v": "Real-time",
      "kiosk.title": "KIOSK GATE A — LIVE",
      "kiosk.badge": "RECOGNIZED",
      "kiosk.meta": "Engineering • Shift 08:00",
      "kiosk.status": "Checked in 07:52",
      "chip.a": "Present today",
      "chip.bt": "Real-time",
      "chip.bs": "Live attendance feed",
      "hud.1": "SCANNING FACE MESH…",
      "hud.2": "LIVENESS · BLINK DETECTED",
      "hud.3": "EMBEDDING · 512-D VECTOR",
      "hud.4": "MATCH · CONFIDENCE 99.2%",
      "how.eyebrow": "How it works",
      "how.title": "From face to timesheet — in three steps",
      "step1.t": "Enroll a face",
      "step1.p": "Employees enroll once at the admin desk or a kiosk. The system extracts facial features and stores them securely as a biometric profile.",
      "step2.t": "Recognize at the kiosk",
      "step2.p": "At the gate, the camera identifies the face in a split second while a blink-based liveness check blocks buddy punching with photos or videos.",
      "step3.t": "Reports & alerts",
      "step3.p": "Each check-in is matched against the work shift: on time, late or absent. HR watches a live dashboard, gets anomaly alerts and exports reports on demand.",
      "feat.eyebrow": "Features",
      "feat.title": "Deep enough for operations. Simple enough for everyone.",
      "f1.t": "AI face recognition",
      "f1.p": "DeepFace extracts and matches face vectors with high accuracy, even as face angles and gate lighting change.",
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
      "tech.5": "Consistent design system",
      "tech.6": "Live camera & monitoring streams",
      "demo.eyebrow": "Online demo",
      "demo.title": "See the system running live",
      "demo.sub": "The SecureFace AI demo is running in the cloud — an attendance overview dashboard, a real-time check-in log and shift status distribution.",
      "demo.cta": "Open the demo at attend-live.azurewebsites.net",
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
    restartHud();
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

  /* ================= HUD cycler ================= */
  var hudEl = document.getElementById("hudText");
  var hudTimer = null;
  var hudIdx = 0;
  function restartHud() {
    if (!hudEl) return;
    if (hudTimer) window.clearInterval(hudTimer);
    var dict = I18N[currentLang];
    var lines = [dict["hud.1"], dict["hud.2"], dict["hud.3"], dict["hud.4"]];
    hudIdx = 0;
    hudEl.textContent = lines[0];
    hudTimer = window.setInterval(function () {
      hudIdx = (hudIdx + 1) % lines.length;
      hudEl.style.opacity = "0";
      window.setTimeout(function () {
        hudEl.textContent = lines[hudIdx];
        hudEl.style.opacity = "1";
      }, 180);
    }, 2600);
    hudEl.style.transition = "opacity 0.18s ease";
  }

  /* Apply language before starting the HUD */
  applyLang(currentLang);

  /* ================= Canvas face-mesh ================= */
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  (function initMesh() {
    var canvas = document.getElementById("meshCanvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var hero = canvas.parentElement;
    var W = 0, H = 0, points = [], raf = null, running = true, t = 0;
    var DPR = Math.min(window.devicePixelRatio || 1, 1.5);

    function buildPoints() {
      points = [];
      var cx = W * 0.68, cy = H * 0.44;
      var rx = Math.min(W, H) * 0.30, ry = Math.min(W, H) * 0.40;
      var rings = 5;
      for (var r = 0; r < rings; r++) {
        var n = 10 + r * 7;
        var fr = (r + 1) / rings;
        for (var i = 0; i < n; i++) {
          var a = (i / n) * Math.PI * 2 + r * 0.35;
          points.push({
            bx: cx + Math.cos(a) * rx * fr,
            by: cy + Math.sin(a) * ry * fr,
            ph: Math.random() * Math.PI * 2,
            sp: 0.4 + Math.random() * 0.7,
            rad: 1 + Math.random() * 1.4
          });
        }
      }
      var scatter = W < 720 ? 22 : 40;
      for (var s = 0; s < scatter; s++) {
        points.push({
          bx: Math.random() * W,
          by: Math.random() * H,
          ph: Math.random() * Math.PI * 2,
          sp: 0.3 + Math.random() * 0.6,
          rad: 0.7 + Math.random() * 1.1
        });
      }
    }

    function resize() {
      var rect = hero.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      buildPoints();
      if (reducedMotion) draw(0);
    }

    function draw(time) {
      t = time * 0.001;
      ctx.clearRect(0, 0, W, H);
      var pts = points.map(function (p) {
        return {
          x: p.bx + Math.sin(t * p.sp + p.ph) * 7,
          y: p.by + Math.cos(t * p.sp * 0.8 + p.ph) * 7,
          rad: p.rad
        };
      });
      var LINK = W < 720 ? 74 : 96;
      ctx.lineWidth = 1;
      for (var i = 0; i < pts.length; i++) {
        for (var j = i + 1; j < pts.length; j++) {
          var dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          var d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            var alpha = (1 - Math.sqrt(d2) / LINK) * 0.30;
            ctx.strokeStyle = "rgba(120,112,255," + alpha.toFixed(3) + ")";
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }
      // sweeping scan band
      var bandY = ((t * 0.11) % 1.3 - 0.15) * H;
      var grad = ctx.createLinearGradient(0, bandY - 46, 0, bandY + 46);
      grad.addColorStop(0, "rgba(76,215,246,0)");
      grad.addColorStop(0.5, "rgba(76,215,246,0.10)");
      grad.addColorStop(1, "rgba(76,215,246,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, bandY - 46, W, 92);
      ctx.fillStyle = "rgba(76,215,246,0.5)";
      ctx.fillRect(0, bandY, W, 1);
      // nodes
      pts.forEach(function (p, idx) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.rad, 0, Math.PI * 2);
        ctx.fillStyle = idx % 5 === 0 ? "rgba(120,225,255,0.9)" : "rgba(157,151,255,0.75)";
        ctx.fill();
      });
    }

    function loop(time) {
      if (!running) { raf = null; return; }
      draw(time);
      raf = window.requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener("resize", resize);
    if (!reducedMotion) {
      raf = window.requestAnimationFrame(loop);
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          var visible = entries[0].isIntersecting;
          if (visible && !running) { running = true; raf = window.requestAnimationFrame(loop); }
          if (!visible) running = false;
        }).observe(hero);
      }
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) { running = false; }
        else if (!running) { running = true; raf = window.requestAnimationFrame(loop); }
      });
    }
  })();

  /* ================= Feature-card spotlight (follows the cursor) ================= */
  if (!reducedMotion && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".feature-card").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* ================= GSAP motion suite ================= */
  if (window.gsap && !reducedMotion) {
    var gsap = window.gsap;
    gsap.from("[data-hero]", {
      y: 36, opacity: 0, duration: 1.05, ease: "power3.out", stagger: 0.1, delay: 0.08
    });

    // Count-up on the kiosk stat chip (142/150 present today)
    var chip = document.getElementById("chipCount");
    if (chip) {
      var counter = { v: 0 };
      gsap.to(counter, {
        v: 142, duration: 1.8, delay: 1, ease: "power2.out",
        onUpdate: function () { chip.textContent = Math.round(counter.v) + "/150"; }
      });
    }

    // Kiosk card: gentle float + pointer tilt
    var kioskCard = document.querySelector(".kiosk-card");
    if (kioskCard) {
      gsap.to(kioskCard, { y: -9, duration: 3.4, yoyo: true, repeat: -1, ease: "sine.inOut" });
      if (window.matchMedia("(pointer: fine)").matches) {
        var heroVisual = document.querySelector(".hero-visual");
        heroVisual.addEventListener("mousemove", function (e) {
          var r = heroVisual.getBoundingClientRect();
          var relX = (e.clientX - r.left) / r.width - 0.5;
          var relY = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(kioskCard, {
            rotationY: relX * 6, rotationX: -relY * 6,
            transformPerspective: 900, duration: 0.6, ease: "power2.out"
          });
        });
        heroVisual.addEventListener("mouseleave", function () {
          gsap.to(kioskCard, { rotationX: 0, rotationY: 0, duration: 0.7, ease: "power3.out" });
        });
      }
    }

    if (window.ScrollTrigger) {
      gsap.registerPlugin(window.ScrollTrigger);
      document.documentElement.classList.add("gsap-on");

      // Generic reveals
      gsap.utils.toArray("[data-reveal]").forEach(function (el) {
        gsap.to(el, {
          opacity: 1, y: 0, duration: 0.95, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true }
        });
      });

      // Top scroll-progress hairline
      gsap.to("#scrollProgress", {
        scaleX: 1, ease: "none",
        scrollTrigger: { start: 0, end: "max", scrub: 0.3 }
      });

      // Steps: numerals fill with indigo as each row arrives + progress hairline
      gsap.utils.toArray(".step-row").forEach(function (row) {
        window.ScrollTrigger.create({
          trigger: row, start: "top 78%", once: true,
          onEnter: function () { row.classList.add("filled"); }
        });
      });
      gsap.to("#stepsProgress", {
        scaleX: 1, ease: "none",
        scrollTrigger: { trigger: ".steps", start: "top 78%", end: "bottom 55%", scrub: 0.4 }
      });

      // Pipeline: nodes cascade in sequence
      var pipeNodes = gsap.utils.toArray(".pipe-node");
      if (pipeNodes.length) {
        gsap.fromTo(pipeNodes,
          { y: 26, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.13,
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
