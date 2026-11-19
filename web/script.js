/* FaceAttend landing — i18n, face-mesh drawing, and the scroll-driven film.
   Plain script (no build step). GSAP + ScrollTrigger + Lenis are vendored and
   optional: without them, or with prefers-reduced-motion, every scene renders
   as a static, fully readable page. */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); };

  /* ============================================================ i18n
     Vietnamese lives in the HTML; English lives here. */
  var EN = {
    "meta.title": "FaceAttend: face recognition attendance",
    "meta.desc": "FaceAttend is face recognition attendance: a kiosk checks for a blink, matches the face, logs check-in and check-out against the shift, and builds the timesheet for HR.",
    "a11y.skip": "Skip the opening",
    "nav.label": "Main",
    "nav.lang": "Language",
    "nav.story": "Story",
    "nav.how": "How it works",
    "nav.enter": "Open the app",

    "scene.s1.label": "Scene 1",
    "scene.s1.slug": "Office lobby, 07:58",
    "open.l1": "Look at the camera.",
    "open.l2": "Blink twice.",
    "open.l3": "You're checked in.",
    "open.sub": "FaceAttend is face recognition attendance for offices and classrooms: a kiosk by the door, a console for HR, and a timesheet that closes itself at the end of the day.",
    "open.cta1": "Try the check-in kiosk",
    "open.cta2": "Watch the story",
    "open.cue": "Scroll to begin",

    "scene.s2.label": "Scene 2",
    "scene.s2.slug": "Before the camera",
    "before.title": "What the old way of taking attendance costs",
    "before.l1": "Call every name, tick every box.",
    "before.n1": "Minutes every morning just to know who showed up.",
    "before.l2": "One borrowed signature counts as “present”.",
    "before.n2": "A paper sheet or a swipe card can't tell who is holding the pen.",
    "before.l3": "At month end, someone adds up every hour.",
    "before.n3": "Late, left early, absent: counted by hand, checked again, then corrected.",
    "before.turn": "FaceAttend replaces all three with one moment in front of a camera.",

    "scene.s3.label": "Scene 3",
    "scene.s3.slug": "Close-up, at the kiosk",
    "moment.title": "One check-in, frame by frame",
    "ro.ear": "Eye openness (EAR)",
    "ro.blinks": "Blinks",
    "ro.vector": "Face vector",
    "ms.0.t": "A face enters the frame",
    "ms.0.p": "MediaPipe FaceLandmarker places 478 landmarks on the face.",
    "ms.1.t": "Measure how open the eyes are",
    "ms.1.p": "Six points around each eye give the EAR ratio. Below 0.22 the eye counts as closed.",
    "ms.2.t": "Blink twice",
    "ms.2.p": "Two blinks means a live person, not a photo held up to the lens.",
    "ms.3.t": "Match against enrolled faces",
    "ms.3.p": "Facenet512 turns the face into a 512-dimension vector and compares it by cosine similarity with everyone enrolled. It's a match only at 0.45 or above.",
    "ms.4.t": "Log the time",
    "ms.4.p": "The recognition is saved as today's check-in or check-out.",
    "result.k": "Checked in",
    "result.status": "On time, shift starts 08:00",
    "result.note": "Illustration using the demo's sample data",

    "scene.s4.label": "Scene 4",
    "scene.s4.slug": "Behind the frame",
    "takes.title": "From the first enrollment to the month-end timesheet",
    "t1.t": "Enroll a face",
    "t1.p": "HR creates a profile, or imports a whole list from Excel/CSV, then photographs each person once.",
    "t1.a": "Three angles: straight on, 15° left, 15° right.",
    "t1.b": "MTCNN finds the face in each photo; Facenet512 stores it as a vector.",
    "t1.c": "A biometric consent checkbox, with every consent written to a log.",
    "t2.t": "Recognize at the kiosk",
    "t2.p": "The kiosk opens the camera, counts blinks, then sends the face for matching, all over one WebSocket connection.",
    "t2.a": "No matching until two blinks are counted.",
    "t2.b": "A face that isn't enrolled shows as a stranger. On monitoring cameras, a stranger also raises an alert for HR.",
    "t2.c": "Camera trouble? Staff check in with a 4-digit PIN instead.",
    "t3.t": "Log hours against the shift",
    "t3.p": "Check-in and check-out times are compared with the shift to mark on time, late or left early.",
    "t3.a": "Later than the shift's threshold (15 minutes by default) is late; leaving before the end time is leaving early.",
    "t3.b": "A dashboard for today, per-employee timesheet reports, and Excel export for any date range.",
    "t3.c": "Attendance can be edited by hand, and every edit records who made it.",

    "scene.s5.label": "Scene 5",
    "scene.s5.slug": "Credits",
    "credits.title": "Cast and crew",
    "cr.recog": "Face recognition",
    "cr.detect": "Face detection",
    "cr.live": "Liveness check",
    "cr.api": "Server",
    "cr.realtime": "Real time",
    "cr.ui": "Kiosk and console",
    "cr.data": "Data",
    "cr.by": "Design and development",

    "scene.s6.label": "Final scene",
    "scene.s6.slug": "Your turn",
    "end.title": "Step into the frame.",
    "door.kiosk.t": "Check-in kiosk",
    "door.kiosk.p": "Open the camera, blink twice, and watch the check-in get logged.",
    "door.console.t": "HR console",
    "door.console.p": "The demo account is already filled in on the sign-in screen.",
    "door.tour.t": "Guided tour",
    "door.tour.p": "Walks through sign-in, face enrollment and a kiosk check-in.",
    "door.code.t": "Source code on GitHub",
    "door.code.p": "FastAPI backend and React interface.",
    "end.note": "The AI server sleeps when nobody is using it. While it starts up, the demo runs a simulation in your browser and syncs once the server is ready.",

    "footer.tag": "Face recognition attendance.",
    "footer.credit": "Designed and built by Trần Huy Hoàng, <span class=\"year\"></span>."
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
  function t(key) { return lang === "en" && EN[key] != null ? EN[key] : (VI[key] != null ? VI[key] : VI_ATTR[key]); }
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
    updateHudText();
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }
  $$(".lang-btn").forEach(function (b) {
    b.addEventListener("click", function () { applyLang(b.getAttribute("data-lang")); });
  });

  /* ============================================================ face mesh
     A stylised landmark mesh: contour, brows, nose, lips, and two eyes that
     use the same six-point layout as the backend's EAR check
     (p0 outer corner, p1 p2 upper lid, p3 inner corner, p4 p5 lower lid). */
  var SVGNS = "http://www.w3.org/2000/svg";
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      var x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  function el(name, attrs, parent) {
    var n = doc.createElementNS(SVGNS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function inFace(x, y) {
    var dx = (x - 200) / 124, dy = (y - 252) / 166;
    var narrow = y > 300 ? 1 + ((y - 300) / 125) * 0.45 : 1;
    return dx * dx * narrow * narrow + dy * dy < 0.92;
  }
  var EYES = [{ cx: 154, cy: 232 }, { cx: 246, cy: 232 }];
  var EYE_W = 30, EYE_H = 9.5;

  function eyePoints(e, open, mirror) {
    var o = Math.max(0.06, open);
    var dx = 10;
    var lift = 1.2;
    var pts = [
      [e.cx - EYE_W * mirror, e.cy],
      [e.cx - dx * mirror, e.cy - EYE_H * o * 0.95 - lift],
      [e.cx + dx * mirror, e.cy - EYE_H * o * 0.95],
      [e.cx + EYE_W * mirror, e.cy + 1],
      [e.cx + dx * mirror, e.cy + EYE_H * o * 0.8],
      [e.cx - dx * mirror, e.cy + EYE_H * o * 0.8]
    ];
    return pts;
  }
  function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
  function ear(p) { return (dist(p[1], p[5]) + dist(p[2], p[4])) / (2 * dist(p[0], p[3])); }

  function buildMesh(svg) {
    var BUCKETS = 10;
    var r = rng(1729);
    var groups = [];
    var linesG = el("g", {}, svg);
    for (var b = 0; b < BUCKETS; b++) groups.push(el("g", { "class": "m-bucket" }, svg));

    var pts = [];
    // contour
    var contour = [];
    for (var i = 0; i < 44; i++) {
      var a = (i / 44) * Math.PI * 2;
      var sy = Math.cos(a);
      var w = 1 - 0.2 * Math.pow(Math.max(0, -sy), 1.6);
      var x = 200 + 130 * Math.sin(a) * w;
      var y = 250 - 172 * sy * (sy < 0 ? 1.02 : 1);
      contour.push([x, y]); pts.push([x, y]);
    }
    // interior scatter, kept clear of the eyes
    var tries = 0;
    while (pts.length < 44 + 120 && tries < 6000) {
      tries++;
      var px = 70 + r() * 260, py = 82 + r() * 340;
      if (!inFace(px, py)) continue;
      var nearEye = EYES.some(function (e) { return Math.abs(px - e.cx) < 40 && Math.abs(py - e.cy) < 20; });
      if (nearEye) continue;
      var ok = true;
      for (var j = 0; j < pts.length; j++) if (dist(pts[j], [px, py]) < 17) { ok = false; break; }
      if (ok) pts.push([px, py]);
    }
    // features
    var browL = [[118, 204], [134, 194], [154, 191], [174, 196]];
    var browR = [[226, 196], [246, 191], [266, 194], [282, 204]];
    var nose = [[200, 236], [199, 260], [198, 284], [186, 306], [200, 312], [214, 306]];
    var lips = [];
    for (var m = 0; m < 12; m++) {
      var la = (m / 12) * Math.PI * 2;
      lips.push([200 + 40 * Math.cos(la), 360 + (Math.sin(la) > 0 ? 13 : 9) * Math.sin(la)]);
    }
    var feats = browL.concat(browR, nose, lips);
    pts = pts.concat(feats);

    // mesh lines: each point to its 3 nearest neighbours
    var seen = {};
    var d = "";
    pts.forEach(function (p, idx) {
      var near = pts
        .map(function (q, k) { return { k: k, d: dist(p, q) }; })
        .filter(function (o) { return o.k !== idx; })
        .sort(function (x, y) { return x.d - y.d; })
        .slice(0, 3);
      near.forEach(function (o) {
        var key = idx < o.k ? idx + "-" + o.k : o.k + "-" + idx;
        if (seen[key] || o.d > 46) return;
        seen[key] = 1;
        var q = pts[o.k];
        d += "M" + p[0].toFixed(1) + " " + p[1].toFixed(1) + "L" + q[0].toFixed(1) + " " + q[1].toFixed(1);
      });
    });
    el("path", { d: d, "class": "m-line" }, linesG);

    // dots, bucketed top-to-bottom with jitter so the reveal sweeps down
    pts.forEach(function (p) {
      var bucket = clamp(Math.floor(((p[1] - 70) / 370) * BUCKETS + (r() - 0.5) * 2.2), 0, BUCKETS - 1);
      el("circle", { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: 1.7, "class": "m-dot" }, groups[bucket]);
    });
    var toPath = function (arr, close) {
      return arr.map(function (p, k) { return (k ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join("") + (close ? "Z" : "");
    };
    el("path", { d: toPath(contour, true), "class": "m-feat" }, groups[0]);
    el("path", { d: toPath(browL), "class": "m-feat" }, groups[3]);
    el("path", { d: toPath(browR), "class": "m-feat" }, groups[3]);
    el("path", { d: toPath(nose), "class": "m-feat" }, groups[5]);
    el("path", { d: toPath(lips, true), "class": "m-feat" }, groups[7]);

    // eyes
    var eyeG = el("g", { "class": "m-bucket" }, svg);
    var eyes = EYES.map(function (e, k) {
      var poly = el("polygon", { "class": "m-eye" }, eyeG);
      var dots = [];
      for (var q = 0; q < 6; q++) dots.push(el("circle", { r: 2.4, "class": "m-eyept" }, eyeG));
      return { e: e, mirror: k === 0 ? 1 : -1, poly: poly, dots: dots };
    });

    var api = {
      linesG: linesG,
      reveal: function (v) {
        groups.forEach(function (g, k) { g.style.opacity = clamp(v * (BUCKETS + 2) - k, 0, 1); });
        linesG.style.opacity = clamp(v * 1.4 - 0.25, 0, 1);
        eyeG.style.opacity = clamp(v * 3 - 2, 0, 1);
      },
      setOpen: function (open) {
        var sum = 0;
        eyes.forEach(function (eye) {
          var p = eyePoints(eye.e, open, eye.mirror);
          eye.poly.setAttribute("points", p.map(function (v) { return v[0].toFixed(1) + "," + v[1].toFixed(1); }).join(" "));
          eye.dots.forEach(function (c, k) { c.setAttribute("cx", p[k][0].toFixed(1)); c.setAttribute("cy", p[k][1].toFixed(1)); });
          sum += ear(p);
        });
        return sum / 2;
      }
    };
    api.setOpen(1);
    api.reveal(1);
    return api;
  }

  var heroMesh = $('[data-mesh="hero"]') ? buildMesh($('[data-mesh="hero"]')) : null;
  var momentMesh = $('[data-mesh="moment"]') ? buildMesh($('[data-mesh="moment"]')) : null;

  // 48 bars stand in for the 512-number embedding (decorative).
  var vec = $("#vec");
  var vecBars = [];
  if (vec) {
    var vr = rng(512);
    for (var v = 0; v < 48; v++) {
      var bar = doc.createElement("i");
      bar.style.height = (18 + vr() * 82).toFixed(0) + "%";
      vec.appendChild(bar);
      vecBars.push(bar);
    }
  }

  /* ============================================================ scene 3 render
     p in [0,1] → the whole close-up: reveal, lock, two blinks, scan, match. */
  var moment = $(".scene-moment");
  var stageFrame = $(".stage-frame");
  var steps = $$(".ms");
  var roEar = $("#roEar"), roBlinks = $("#roBlinks"), earFill = $("#earFill"), earMeter = $(".ear-meter");
  var EAR_MAX = 0.4, EAR_TH = 0.22;
  if (earMeter) $(".ear-th", earMeter).style.left = (EAR_TH / EAR_MAX) * 100 + "%";
  var BLINKS = [0.37, 0.47];
  var lastStep = -1;

  function tri(p, c, w) { return clamp(1 - Math.abs(p - c) / w, 0, 1); }
  function renderMoment(p) {
    if (!momentMesh) return;
    momentMesh.reveal(seg(p, 0, 0.14));
    stageFrame.style.setProperty("--lock", seg(p, 0.08, 0.18).toFixed(3));
    var closed = Math.max(tri(p, BLINKS[0], 0.035), tri(p, BLINKS[1], 0.035));
    var e = momentMesh.setOpen(1 - closed * 0.95);
    roEar.textContent = e.toFixed(2);
    earFill.style.width = clamp(e / EAR_MAX, 0, 1) * 100 + "%";
    earMeter.classList.toggle("closed", e < EAR_TH);
    var blinks = (p >= BLINKS[0] ? 1 : 0) + (p >= BLINKS[1] ? 1 : 0);
    roBlinks.textContent = blinks + " / 2";
    var scan = seg(p, 0.56, 0.74);
    stageFrame.style.setProperty("--scan", (scan * 5.6 - 1.2).toFixed(3));
    stageFrame.style.setProperty("--scan-o", p > 0.55 && p < 0.76 ? "1" : "0");
    var fill = Math.round(seg(p, 0.56, 0.74) * vecBars.length);
    vecBars.forEach(function (b, k) { b.style.opacity = k < fill ? "0.9" : "0.12"; });
    stageFrame.style.setProperty("--r", seg(p, 0.8, 0.9).toFixed(3));
    var step = p < 0.18 ? 0 : p < 0.3 ? 1 : p < 0.55 ? 2 : p < 0.78 ? 3 : 4;
    if (step !== lastStep) {
      steps.forEach(function (s, k) {
        s.classList.toggle("is-active", k === step);
        s.classList.toggle("is-past", k < step);
      });
      lastStep = step;
    }
  }

  /* ============================================================ scene 2 render */
  var bls = $$(".bl");
  var turn = $(".before-turn");
  function renderBefore(p) {
    bls.forEach(function (li, i) {
      var start = i * 0.2;
      li.style.setProperty("--o", seg(p, start, start + 0.08).toFixed(3));
      $(".bl-text", li).style.setProperty("--s", seg(p, start + 0.1, start + 0.2).toFixed(3));
    });
    turn.style.setProperty("--o", seg(p, 0.66, 0.78).toFixed(3));
  }

  /* ============================================================ HUD */
  var hudScene = $("#hudScene"), hudSlug = $("#hudSlug"), hudTc = $("#hudTc"), hudBar = $("#hudBar");
  var scenes = $$("[data-scene]");
  var currentScene = scenes[0];
  function updateHudText() {
    if (!currentScene || !hudScene) return;
    var n = currentScene.getAttribute("data-scene");
    var label = $(".slug [data-i18n$='.label']", currentScene);
    hudScene.textContent = label ? label.textContent : n;
    hudSlug.textContent = t(currentScene.getAttribute("data-slug"));
  }
  var FILM_SECONDS = 150, FPS = 24;
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  function updateHud() {
    var max = root.scrollHeight - window.innerHeight;
    var p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
    var frames = Math.round(p * FILM_SECONDS * FPS);
    var s = Math.floor(frames / FPS);
    hudTc.textContent = "00:" + pad(Math.floor(s / 60)) + ":" + pad(s % 60) + ":" + pad(frames % FPS);
    hudBar.style.transform = "scaleX(" + p.toFixed(4) + ")";
    var mid = window.innerHeight * 0.5;
    for (var i = scenes.length - 1; i >= 0; i--) {
      var r = scenes[i].getBoundingClientRect();
      if (r.top <= mid) {
        if (scenes[i] !== currentScene) { currentScene = scenes[i]; updateHudText(); }
        break;
      }
    }
  }
  var hudQueued = false;
  window.addEventListener("scroll", function () {
    if (hudQueued) return;
    hudQueued = true;
    requestAnimationFrame(function () { hudQueued = false; updateHud(); });
  }, { passive: true });
  window.addEventListener("resize", updateHud);

  /* ============================================================ language + static state */
  var saved = null;
  try { saved = localStorage.getItem(LANG_KEY); } catch (e) { /* ignore */ }
  applyLang(saved || "vi");
  renderMoment(1);
  updateHud();

  /* ============================================================ motion */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  function startMotion() {
    var gsap = window.gsap, ST = window.ScrollTrigger;
    if (!gsap || !ST || reduce.matches) {
      var c = $(".curtain");
      if (c) c.remove();
      return;
    }
    gsap.registerPlugin(ST);
    root.classList.add("motion");

    // Smooth scroll, driven by GSAP's ticker so pins stay in sync.
    var lenis = null;
    if (window.Lenis) {
      try {
        lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
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
        if (lenis) lenis.scrollTo(target, { offset: 0 });
        else target.scrollIntoView();
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        history.replaceState(null, "", id);
      });
    });

    // Opening: black curtain parts into letterbox, title rises line by line,
    // the face is "acquired" point by point.
    var curtain = $(".curtain");
    curtain.style.animation = "none";
    var openTl = gsap.timeline({ defaults: { ease: "power3.out" } });
    var hero = { c: 1, m: 0 };
    openTl
      .to(hero, { c: 0, duration: 1.3, ease: "power4.inOut", onUpdate: function () { curtain.style.setProperty("--c", hero.c); } }, 0.1)
      .fromTo(hero, { m: 0 }, { m: 1, duration: 2, ease: "power2.inOut", onUpdate: function () { if (heroMesh) heroMesh.reveal(hero.m); } }, 0.4)
      .from("[data-open]", { y: 28, opacity: 0, duration: 0.9, stagger: 0.09 }, 0.75)
      .from(".open-face .vf", { opacity: 0, scale: 1.35, duration: 0.8, stagger: 0.05 }, 1.6)
      .from(".cue-line", { scaleX: 0, duration: 0.8 }, 2.1)
      .add(function () { curtain.remove(); });
    if (heroMesh) heroMesh.reveal(0);

    // Hero drifts back as the film begins.
    gsap.to(".open-face", {
      yPercent: -10, scale: 0.94, opacity: 0.2, ease: "none",
      scrollTrigger: { trigger: ".scene-open", start: "top top", end: "bottom top", scrub: true }
    });
    gsap.to(".open-copy", {
      yPercent: -18, opacity: 0, ease: "none",
      scrollTrigger: { trigger: ".scene-open", start: "center top+=35%", end: "bottom top", scrub: true }
    });

    // Scene 2 — the old way, struck through line by line.
    var before = { p: 0 };
    renderBefore(0);
    gsap.timeline({
      scrollTrigger: { trigger: ".scene-before", start: "top top", end: "+=150%", pin: true, scrub: 0.6 }
    }).to(before, { p: 1, ease: "none", onUpdate: function () { renderBefore(before.p); } });

    // Scene 3 — the close-up.
    var m = { p: 0 };
    lastStep = -1;
    renderMoment(0);
    gsap.timeline({
      scrollTrigger: { trigger: moment, start: "top top", end: "+=320%", pin: true, scrub: 0.7 }
    }).to(m, { p: 1, ease: "none", onUpdate: function () { renderMoment(m.p); } });

    // Scene 4 — the three takes run past on a film strip (desktop only).
    var mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", function () {
      var track = $("#stripTrack");
      var strip = $(".strip");
      var distance = function () { return Math.max(0, track.scrollWidth - strip.clientWidth + 8); };
      gsap.to(track, {
        x: function () { return -distance(); }, ease: "none",
        scrollTrigger: {
          trigger: ".scene-takes", start: "top top",
          end: function () { return "+=" + Math.max(distance() * 1.4, window.innerHeight * 0.6); },
          pin: true, scrub: 0.6, invalidateOnRefresh: true
        }
      });
    });

    // Scene 5 — end credits roll upward.
    var roll = $("#creditsRoll"), win = $(".credits-window");
    gsap.fromTo(roll,
      { y: function () { return win.clientHeight * 0.85; } },
      {
        y: function () { return -(roll.scrollHeight - win.clientHeight * 0.35); }, ease: "none",
        scrollTrigger: { trigger: ".scene-credits", start: "top top", end: "+=140%", pin: true, scrub: 0.6, invalidateOnRefresh: true }
      });

    // Final scene: doors slide in once.
    gsap.from(".doors li", {
      x: -24, opacity: 0, duration: 0.7, stagger: 0.08, ease: "power3.out",
      scrollTrigger: { trigger: ".doors", start: "top 85%", once: true }
    });

    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { ST.refresh(); });
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", startMotion);
  else startMotion();

  // Wake the AI backend (it sleeps when idle) so the demo connects sooner.
  try {
    fetch("https://faceattend-api.blueground-3385828b.eastasia.azurecontainerapps.io/api/health", { mode: "no-cors", cache: "no-store" }).catch(function () {});
  } catch (e) { /* ignore */ }
})();
