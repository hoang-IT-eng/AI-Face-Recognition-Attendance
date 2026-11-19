/* FaceAttend landing v2 — i18n, real-landmark overlay, quiet scroll motion.
   Plain script, no build step. GSAP + ScrollTrigger + Lenis are vendored and
   optional: without them, or with prefers-reduced-motion, the page is static
   and fully readable. */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); };
  var hasMotion = false;

  /* ============================================================ i18n
     Vietnamese lives in the HTML; English lives here. */
  var EN = {
    "meta.title": "FaceAttend: face recognition attendance",
    "meta.desc": "FaceAttend is face recognition attendance: a kiosk checks for a blink, matches the face, logs check-in and check-out against the shift, and builds the timesheet for HR.",
    "a11y.skip": "Skip the opening",
    "nav.label": "Main",
    "nav.lang": "Language",
    "nav.story": "Recognition",
    "nav.how": "How it works",
    "nav.enter": "Open the app",
    "alt.hero": "An office worker in glasses looking straight into the camera",
    "hero.l1": "Look at the camera.",
    "hero.l2": "Blink twice.",
    "hero.l3": "You're checked in.",
    "hero.sub": "FaceAttend is face recognition attendance for offices and classrooms: a kiosk by the door, a console for HR, and a timesheet that adds itself up at the end of the day.",
    "hero.cta1": "Try the check-in kiosk",
    "hero.cta2": "See the story",
    "st.title": "The old way of taking attendance",
    "st.text": "Every morning, in offices and classrooms, someone calls out every name. Someone signs for a friend. And at month end, someone sits down and adds up every hour.",
    "dip.label": "Attendance on paper",
    "alt.classroom": "A lecturer standing in front of a class",
    "alt.clipboard": "A hand writing with a pen on paper clipped to a board",
    "dip.c1": "Call each name, tick each box, every session.",
    "dip.c2": "A sign-in sheet can't tell who is holding the pen.",
    "turn.title": "FaceAttend replaces all of it with one look at a camera.",
    "alt.face": "Portrait of a man looking straight into the lens",
    "rr.k": "Checked in",
    "rr.s": "On time. Shift starts at 08:00.",
    "rm.ear": "Eye openness",
    "rm.th": "Closed below",
    "rm.blinks": "Blinks",
    "recog.title": "What happens while you look at the camera",
    "b0.t": "478 landmarks",
    "b0.p": "MediaPipe FaceLandmarker places 478 points on the face. The mesh you see is exactly the points the model found on this photo.",
    "b1.t": "How open the eyes are",
    "b1.p": "Six points around each eye give the EAR ratio. On this photo it's 0.28. Below 0.22, the eye counts as closed.",
    "b2.t": "Two blinks",
    "b2.p": "Two blinks means a live person, not a photo held up to the lens. No matching happens before that.",
    "b2.note": "Illustration of the EAR line during two blinks",
    "b3.t": "512 numbers",
    "b3.p": "Facenet512 turns the face into a 512-dimension vector and compares it by cosine similarity with everyone enrolled. It's a match only at 0.45 or above.",
    "b4.t": "Present",
    "b4.p": "The recognition is saved as today's check-in or check-out. The result card on the photo is an illustration.",
    "how.title": "From the first enrollment to the month-end timesheet.",
    "alt.enroll": "A man in glasses sitting in an office, facing the camera",
    "r1.t": "Enroll a face",
    "r1.p": "HR creates a profile, or imports a whole list from Excel/CSV, then photographs each person once: straight on, 15° left, 15° right. MTCNN finds the face, Facenet512 stores it as a vector.",
    "r1.f": "There's a biometric consent checkbox, and every consent is written to a log.",
    "alt.gates": "A row of steel entry gates at a building entrance",
    "r2.t": "Recognized at the door",
    "r2.p": "The kiosk opens the camera, counts blinks, then sends the face for matching over one WebSocket connection. A face that isn't enrolled shows as a stranger; on monitoring cameras, a stranger also raises an alert for HR.",
    "r2.f": "If the camera has trouble, staff check in with a 4-digit PIN instead.",
    "alt.lecture": "Students listening in a lecture hall",
    "r3.t": "Hours logged against the shift",
    "r3.p": "Check-in and check-out times are compared with the work shift or class session: later than the shift's threshold (15 minutes by default) is late, leaving before the end time is leaving early.",
    "r3.f": "A dashboard for today, per-person timesheet reports, Excel export for any date range. Attendance can be edited by hand, and every edit records who made it.",
    "in.title": "Inside",
    "in.recog": "Face recognition",
    "in.detect": "Face detection",
    "in.live": "Liveness check",
    "in.api": "Server",
    "in.rt": "Real time",
    "in.ui": "Kiosk and console",
    "alt.night": "A brightly lit office seen from outside at night",
    "close.title": "By the end of the day, the timesheet is ready.",
    "door.kiosk.t": "Check-in kiosk",
    "door.kiosk.p": "Open the camera, blink twice, and watch the check-in get logged.",
    "door.console.t": "HR console",
    "door.console.p": "The demo account is already filled in on the sign-in screen.",
    "door.tour.t": "Guided tour",
    "door.tour.p": "Walks through sign-in, face enrollment and a kiosk check-in.",
    "door.code.t": "Source code on GitHub",
    "door.code.p": "FastAPI backend and React interface.",
    "close.note": "The AI server sleeps when nobody is using it. While it starts up, the demo runs a simulation in your browser and syncs once the server is ready.",
    "footer.credit": "Designed and built by Trần Huy Hoàng, <span class=\"year\"></span>.",
    "footer.photos": "Photos: Vitaly Gariev, Zulfugar Karimov, Nartan Büyükyıldız and Martin Leitgeb on <a href=\"https://unsplash.com\" target=\"_blank\" rel=\"noopener\">Unsplash</a>. Illustrative only."
  };

  var LANG_KEY = "site-lang";
  var VI = {};
  var VI_ATTR = {};
  $$("[data-i18n]").forEach(function (el) { VI[el.getAttribute("data-i18n")] = el.innerHTML; });
  $$("[data-i18n-attr]").forEach(function (el) {
    el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
      var bits = pair.split(":");
      VI_ATTR[bits[1]] = el.getAttribute(bits[0]);
    });
  });
  var lang = "vi";
  var yearStr = String(new Date().getFullYear());

  function applyLang(next) {
    lang = next === "en" ? "en" : "vi";
    root.lang = lang;
    $$("[data-i18n]").forEach(function (el) {
      var k = el.getAttribute("data-i18n");
      var v = lang === "en" ? EN[k] : VI[k];
      if (v != null && el.innerHTML !== v) el.innerHTML = v;
    });
    $$("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var bits = pair.split(":");
        var v = lang === "en" ? EN[bits[1]] : VI_ATTR[bits[1]];
        if (v != null) el.setAttribute(bits[0], v);
      });
    });
    $$(".year").forEach(function (el) { el.textContent = yearStr; });
    $$(".lang-btn").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang)); });
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* private mode */ }
    onLangChange();
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }
  $$(".lang-btn").forEach(function (b) {
    b.addEventListener("click", function () { applyLang(b.getAttribute("data-lang")); });
  });


  /* ============================================================ statement words */
  var words = [];
  function splitWords() {
    var el = $("[data-words]");
    if (!el) return;
    var text = el.textContent.trim();
    el.textContent = "";
    words = text.split(/\s+/).map(function (w) {
      var span = doc.createElement("span");
      span.className = "w";
      span.textContent = w;
      el.appendChild(span);
      el.appendChild(doc.createTextNode(" "));
      return span;
    });
  }
  var statementP = 1;
  function renderWords(p) {
    statementP = p;
    if (!hasMotion) return;
    var n = words.length;
    words.forEach(function (w, i) { w.style.opacity = (0.16 + 0.84 * clamp(p * (n + 4) - i, 0, 1)).toFixed(3); });
  }

  /* ============================================================ hero face lock
     Corner brackets around the face in the hero photo. The face box comes from
     MediaPipe landmarks on the source image; we map it through object-fit. */
  var heroImg = $(".hero-img");
  var lock = $("#faceLock");
  function placeLock() {
    if (!heroImg || !lock || !heroImg.naturalWidth) return;
    var W = heroImg.offsetWidth, H = heroImg.offsetHeight;
    var iw = heroImg.naturalWidth, ih = heroImg.naturalHeight;
    var s = Math.max(W / iw, H / ih);
    var dw = iw * s, dh = ih * s;
    var pos = getComputedStyle(heroImg).objectPosition.split(" ").map(function (v) { return parseFloat(v) / 100; });
    var ox = (W - dw) * (isNaN(pos[0]) ? 0.5 : pos[0]);
    var oy = (H - dh) * (isNaN(pos[1]) ? 0.5 : pos[1]);
    var portrait = (heroImg.currentSrc || "").indexOf("hero-portrait") !== -1;
    var f = lock.getAttribute(portrait ? "data-face-portrait" : "data-face").split(",").map(parseFloat);
    var x0 = ox + f[0] * dw, y0 = oy + f[1] * dh, x1 = ox + f[2] * dw, y1 = oy + f[3] * dh;
    var px = (x1 - x0) * 0.16, py = (y1 - y0) * 0.1;
    lock.style.left = (x0 - px) + "px";
    lock.style.top = (y0 - py) + "px";
    lock.style.width = (x1 - x0 + 2 * px) + "px";
    lock.style.height = (y1 - y0 + 2 * py) + "px";
    lock.classList.add("is-placed");
  }
  if (heroImg) {
    if (heroImg.complete) placeLock(); else heroImg.addEventListener("load", placeLock);
    window.addEventListener("resize", placeLock);
  }

  /* ============================================================ landmarks */
  var SVGNS = "http://www.w3.org/2000/svg";
  var lm = { mesh: null, dots: null, eyes: null, ready: false };
  function svgEl(name, attrs, parent) {
    var n = doc.createElementNS(SVGNS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function buildLandmarks(data) {
    var svg = $("#landmarks");
    if (!svg) return;
    var P = data.p, E = data.e;
    var pt = function (i) { return [P[i * 2], P[i * 2 + 1]]; };
    var seen = {}, d = "";
    for (var i = 0; i < E.length; i += 2) {
      var a = E[i], b = E[i + 1], key = a < b ? a + "-" + b : b + "-" + a;
      if (seen[key]) continue;
      seen[key] = 1;
      var pa = pt(a), pb = pt(b);
      d += "M" + pa[0] + " " + pa[1] + "L" + pb[0] + " " + pb[1];
    }
    lm.mesh = svgEl("path", { d: d, "class": "lm-mesh", pathLength: "1" }, svg);
    lm.dots = svgEl("g", { "class": "lm-dots" }, svg);
    for (var j = 0; j < P.length / 2; j++) svgEl("circle", { cx: P[j * 2], cy: P[j * 2 + 1], r: 1.9 }, lm.dots);
    lm.eyes = svgEl("g", { "class": "lm-eyes" }, svg);
    data.eyes.forEach(function (ix) {
      svgEl("polygon", { "class": "lm-eye", points: ix.map(function (k) { return pt(k).join(","); }).join(" ") }, lm.eyes);
      ix.forEach(function (k) { var q = pt(k); svgEl("circle", { "class": "lm-eyept", cx: q[0], cy: q[1], r: 3.6 }, lm.eyes); });
    });
    var earVal = $("#earVal");
    if (earVal && data.ear) earVal.textContent = data.ear.toFixed(2);
    lm.ready = true;
    renderRecog(recogP);
  }
  var recogSection = $(".recog");
  function loadLandmarks() {
    if (!window.fetch) return;
    fetch("assets/face-landmarks.json").then(function (r) { return r.json(); }).then(buildLandmarks).catch(function () {});
  }
  if ("IntersectionObserver" in window && recogSection) {
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); loadLandmarks(); }
    }, { rootMargin: "120% 0px" });
    io.observe(recogSection);
  } else loadLandmarks();

  /* ============================================================ recognition render */
  var beats = $$(".beat");
  var frame = $(".recog-frame");
  var trace = $(".et-line");
  var blinkVal = $("#blinkVal");
  var recogP = 1;
  var BEATS = [0, 0.2, 0.4, 0.62, 0.82];
  function renderRecog(p) {
    recogP = p;
    var active = 0;
    BEATS.forEach(function (b, i) { if (p >= b) active = i; });
    beats.forEach(function (el, i) { el.classList.toggle("is-active", i === active); });
    if (frame) frame.style.setProperty("--r", seg(p, 0.84, 0.92).toFixed(3));
    var draw = seg(p, 0.42, 0.6);
    if (trace) trace.style.setProperty("--draw", (1 - draw).toFixed(3));
    if (blinkVal) blinkVal.textContent = (draw > 0.62 ? 2 : draw > 0.3 ? 1 : 0) + "/2";
    if (!lm.ready) return;
    lm.mesh.style.setProperty("--mesh", (1 - seg(p, 0, 0.18)).toFixed(3));
    lm.dots.style.opacity = seg(p, 0.02, 0.16).toFixed(3);
    lm.eyes.style.opacity = seg(p, 0.18, 0.24).toFixed(3);
  }

  function onLangChange() {
    splitWords();
    renderWords(statementP);
  }

  /* ============================================================ nav */
  var nav = $("#nav");
  function navState() { nav.classList.toggle("is-solid", window.scrollY > 40); }
  window.addEventListener("scroll", navState, { passive: true });

  /* ============================================================ boot */
  var saved = null;
  try { saved = localStorage.getItem(LANG_KEY); } catch (e) { /* ignore */ }
  applyLang(saved || "vi");
  navState();
  renderRecog(1);

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  function startMotion() {
    var gsap = window.gsap, ST = window.ScrollTrigger;
    var curtain = $(".curtain");
    if (!gsap || !ST || reduce.matches) {
      if (curtain) curtain.remove();
      return;
    }
    gsap.registerPlugin(ST);
    hasMotion = true;
    root.classList.add("motion");

    var lenis = null;
    if (window.Lenis) {
      try {
        lenis = new window.Lenis({ duration: 1.2, smoothWheel: true });
        lenis.on("scroll", ST.update);
        gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
      } catch (e) { lenis = null; }
    }
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (ev) {
        var id = a.getAttribute("href");
        var target = id.length > 1 ? $(id) : null;
        if (!target) return;
        ev.preventDefault();
        if (lenis) lenis.scrollTo(target, { offset: 0 }); else target.scrollIntoView();
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        history.replaceState(null, "", id);
      });
    });

    // Opening: fade up from black, slow push-in on the face, brackets lock.
    curtain.style.animation = "none";
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .to(curtain, { opacity: 0, duration: 1.4, ease: "power2.inOut", onComplete: function () { curtain.remove(); } }, 0)
      .fromTo(".hero-media", { scale: 1.12 }, { scale: 1, duration: 3.2, ease: "power2.out" }, 0)
      .from("[data-open]", { y: 22, opacity: 0, duration: 1.1, stagger: 0.12 }, 0.7)
      .from("#faceLock", { scale: 1.25, opacity: 0, duration: 1.2, ease: "expo.out" }, 1.5);

    gsap.to(".hero-media", { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero-copy", { opacity: 0, y: -40, ease: "none", scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true } });

    // Statement: words light up as you read.
    renderWords(0);
    ST.create({ trigger: ".statement", start: "top 78%", end: "bottom 50%", scrub: 0.5, onUpdate: function (self) { renderWords(self.progress); } });

    // Photos unveil, then drift.
    $$("[data-photo]").forEach(function (ph) {
      var img = $("img", ph);
      gsap.fromTo(ph, { clipPath: "inset(9% 7% 9% 7%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: ph, start: "top 96%", end: "top 40%", scrub: 0.6 } });
      gsap.fromTo(img, { scale: 1.14, yPercent: -5 }, { scale: 1.04, yPercent: 5, ease: "none", scrollTrigger: { trigger: ph, start: "top bottom", end: "bottom top", scrub: true } });
    });

    gsap.from(".turn-title", { opacity: 0, y: 26, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ".turn", start: "top 70%", once: true } });

    // Recognition close-up, pinned.
    var rp = { p: 0 };
    renderRecog(0);
    gsap.timeline({ scrollTrigger: { trigger: ".recog", start: "top top", end: "+=320%", pin: true, scrub: 0.7 } })
      .to(rp, { p: 1, ease: "none", onUpdate: function () { renderRecog(rp.p); } });

    // Closing shot: slow pull-back.
    gsap.fromTo(".close-media", { scale: 1.16 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".close", start: "top bottom", end: "bottom bottom", scrub: true } });

    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { ST.refresh(); placeLock(); });
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", startMotion);
  else startMotion();

  // Wake the AI backend (it sleeps when idle) so the demo connects sooner.
  try {
    fetch("https://faceattend-api.blueground-3385828b.eastasia.azurecontainerapps.io/api/health", { mode: "no-cors", cache: "no-store" }).catch(function () {});
  } catch (e) { /* ignore */ }
})();
