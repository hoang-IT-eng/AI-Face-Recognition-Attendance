// FaceAttend landing — cinematic layer.
//
// Everything here is additive and gated: it only activates when the visitor
// welcomes motion (no prefers-reduced-motion) and the vendored libraries are
// present. What it adds:
//   - camera motion on the hero's full-bleed photo: a slow Ken Burns drift,
//     pointer parallax, and a ScrollTrigger-scrubbed scroll parallax — the
//     background travels slower than the copy above it.
//   - a real-time Three.js depth field above the photo, below the copy —
//     abstract points of light in charcoal/azure suggesting depth, never a
//     face, never a HUD. The pointer drifts it, and hovering the primary
//     CTA stills it.
//   - Lenis smooth scrolling glued to GSAP ScrollTrigger.
//   - masked block reveals for the hero copy: each copy block rises inside
//     its own .mask wrapper. Text nodes are never split, so script.js can
//     keep swapping textContent for i18n at any moment.
// If anything is unavailable (reduced motion, no WebGL, missing library),
// the page keeps its static full-bleed photo hero, fully visible.
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return;
  if (!window.gsap) return;

  var gsap = window.gsap;
  var html = document.documentElement;
  var hero = document.querySelector(".hero");
  html.classList.add("cine");

  /* ================= Masked block reveal (hero copy) =================
     Each copy block sits in a .mask wrapper in the markup. We slide the
     block itself up inside its mask — the text node is never touched, so
     the i18n swap in script.js keeps working before, during and after. */
  if (hero) {
    var masked = hero.querySelectorAll(".mask [data-hero]");
    var specs = hero.querySelector(".hero-specs");
    var caption = hero.querySelector(".hero-caption");
    // script.js queued plain block fades for every [data-hero] — replace
    // them with the masked treatment.
    hero.querySelectorAll("[data-hero]").forEach(function (el) {
      gsap.killTweensOf(el);
    });
    if (masked.length) {
      gsap.set(masked, { yPercent: 118, opacity: 1 });
      gsap.to(masked, {
        yPercent: 0, duration: 1.15, ease: "power4.out",
        stagger: 0.09, delay: 0.12,
        onComplete: function () { hero.classList.add("revealed"); }
      });
    }
    var strip = [specs, caption].filter(Boolean);
    if (strip.length) {
      gsap.fromTo(strip,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, delay: 0.55 });
    }
    // Watchdog: hero copy must never stay hidden, whatever happens.
    window.setTimeout(function () {
      hero.classList.add("revealed");
      if (masked.length) gsap.set(masked, { yPercent: 0, opacity: 1 });
      if (strip.length) gsap.set(strip, { opacity: 1, y: 0 });
    }, 3500);
  }

  /* ================= Lenis smooth scroll ================= */
  var lenis = null;
  if (window.Lenis) {
    try {
      lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
      html.style.scrollBehavior = "auto"; // Lenis owns the easing now
      if (window.ScrollTrigger) {
        gsap.registerPlugin(window.ScrollTrigger);
        lenis.on("scroll", window.ScrollTrigger.update);
      }
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
      // In-page anchors glide instead of jumping.
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener("click", function (e) {
          var id = a.getAttribute("href");
          if (!id || id.length < 2) return;
          var target = document.querySelector(id);
          if (!target) return;
          e.preventDefault();
          lenis.scrollTo(target, { offset: -84, duration: 1.25 });
        });
      });
    } catch (e) {
      lenis = null;
    }
  }

  /* ================= Hero camera motion =================
     Ken Burns drift on the photo itself; pointer + scroll parallax on the
     oversized .hero-media layer (it bleeds past the hero on every side, so
     no travel ever exposes an edge). */
  var media = hero ? hero.querySelector(".hero-media") : null;
  var bgImg = hero ? hero.querySelector(".hero-bg-img") : null;
  if (bgImg) {
    gsap.fromTo(bgImg,
      { scale: 1.08, y: 8 },
      { scale: 1, y: 0, duration: 14, ease: "power1.out" });
  }
  if (media) {
    hero.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var r = hero.getBoundingClientRect();
      var nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      var ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      gsap.to(media, { x: nx * -12, y: ny * -8, duration: 0.9, ease: "power2.out", overwrite: "auto" });
    });
    hero.addEventListener("pointerleave", function () {
      gsap.to(media, { x: 0, y: 0, duration: 0.9, ease: "power2.out", overwrite: "auto" });
    });
    if (window.ScrollTrigger) {
      gsap.registerPlugin(window.ScrollTrigger);
      gsap.fromTo(media,
        { yPercent: -3 },
        {
          yPercent: 3, ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 }
        });
      window.addEventListener("load", function () {
        window.ScrollTrigger.refresh();
      });
    }
  }

  /* ================= Quiet depth field (Three.js) ================= */
  // Shared state: hovering the primary CTA eases the field to stillness.
  var heroState = { hover: 0, hoverTarget: 0 };
  if (hero) {
    var cta = hero.querySelector(".btn-primary");
    if (cta) {
      cta.addEventListener("mouseenter", function () { heroState.hoverTarget = 1; });
      cta.addEventListener("mouseleave", function () { heroState.hoverTarget = 0; });
      cta.addEventListener("focus", function () { heroState.hoverTarget = 1; });
      cta.addEventListener("blur", function () { heroState.hoverTarget = 0; });
    }
  }

  function makeRadialTexture(size, stops) {
    var c = document.createElement("canvas");
    c.width = c.height = size;
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  function initDepthField(heroEl, state) {
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "low-power" });
    } catch (e) {
      return; // No WebGL — the static hero stays exactly as designed.
    }
    if (!renderer.getContext()) return;

    var isMobile = window.matchMedia("(max-width: 720px)").matches;
    var COUNT = isMobile ? 420 : 950;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 1.75));
    renderer.setSize(heroEl.clientWidth, heroEl.clientHeight);
    var canvas = renderer.domElement;
    canvas.className = "hero-canvas";
    canvas.setAttribute("aria-hidden", "true");
    heroEl.insertBefore(canvas, heroEl.firstChild);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0b0d, 0.05);
    var camera = new THREE.PerspectiveCamera(55, heroEl.clientWidth / heroEl.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 9);

    // Two slow azure light planes far behind the field — atmosphere only.
    var glowTex = makeRadialTexture(256, [[0, "rgba(255,255,255,0.85)"], [0.4, "rgba(255,255,255,0.28)"], [1, "rgba(255,255,255,0)"]]);
    var glowMat = new THREE.SpriteMaterial({ map: glowTex, color: 0x2f6bff, transparent: true, opacity: 0.22, depthWrite: false });
    var glow = new THREE.Sprite(glowMat);
    glow.scale.set(30, 17, 1);
    glow.position.set(-5, 1.6, -8);
    scene.add(glow);
    var glow2Mat = new THREE.SpriteMaterial({ map: glowTex, color: 0x8fb0ff, transparent: true, opacity: 0.09, depthWrite: false });
    var glow2 = new THREE.Sprite(glow2Mat);
    glow2.scale.set(18, 11, 1);
    glow2.position.set(7, -2.4, -6);
    scene.add(glow2);

    // The depth field itself: fine points, mostly dim grey, some azure.
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(COUNT * 3);
    var base = new Float32Array(COUNT * 3);
    var col = new Float32Array(COUNT * 3);
    var phase = new Float32Array(COUNT);
    var palette = [
      [0.42, 0.43, 0.47], // dim grey
      [0.42, 0.43, 0.47],
      [0.42, 0.43, 0.47],
      [0.18, 0.42, 1.00], // azure (matches --accent)
      [0.56, 0.69, 1.00]  // bright azure (matches --accent-bright)
    ];
    for (var i = 0; i < COUNT; i++) {
      var x = (Math.random() - 0.5) * 30;
      var y = (Math.random() - 0.5) * 15;
      var z = -9 + Math.random() * 12;
      pos[i * 3] = base[i * 3] = x;
      pos[i * 3 + 1] = base[i * 3 + 1] = y;
      pos[i * 3 + 2] = base[i * 3 + 2] = z;
      var p = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = p[0]; col[i * 3 + 1] = p[1]; col[i * 3 + 2] = p[2];
      phase[i] = Math.random() * Math.PI * 2;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    var dotTex = makeRadialTexture(64, [[0, "rgba(255,255,255,1)"], [0.35, "rgba(255,255,255,0.6)"], [1, "rgba(255,255,255,0)"]]);
    var mat = new THREE.PointsMaterial({
      size: 0.095, map: dotTex, transparent: true, opacity: 0.78,
      depthWrite: false, vertexColors: true, sizeAttenuation: true
    });
    var points = new THREE.Points(geo, mat);
    scene.add(points);

    // Pointer drift (mouse only — touch keeps the field calm).
    var tx = 0, ty = 0, px = 0, py = 0;
    heroEl.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var r = heroEl.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    heroEl.addEventListener("pointerleave", function () { tx = 0; ty = 0; });

    var inView = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
      }, { threshold: 0 }).observe(heroEl);
    }

    window.addEventListener("resize", function () {
      var w = heroEl.clientWidth, h = heroEl.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    var clock = new THREE.Clock();
    var fieldTime = 0;
    renderer.setAnimationLoop(function () {
      if (!inView || document.hidden) return;
      var dt = Math.min(clock.getDelta(), 0.05);
      // Hovering the CTA eases the field toward stillness.
      state.hover += (state.hoverTarget - state.hover) * 0.045;
      var still = 1 - state.hover;
      fieldTime += dt * (0.12 + 0.88 * still);

      var arr = geo.attributes.position.array;
      for (var j = 0; j < COUNT; j++) {
        arr[j * 3 + 1] = base[j * 3 + 1] + Math.sin(fieldTime * 0.35 + phase[j]) * 0.38;
        arr[j * 3] = base[j * 3] + Math.cos(fieldTime * 0.22 + phase[j] * 1.7) * 0.3;
      }
      geo.attributes.position.needsUpdate = true;
      points.rotation.y = Math.sin(fieldTime * 0.05) * 0.05;

      px += (tx - px) * 0.04;
      py += (ty - py) * 0.04;
      camera.position.x = px * 0.55;
      camera.position.y = -py * 0.35;
      camera.lookAt(0, 0, -2);

      glow.position.x = -5 + Math.sin(fieldTime * 0.045) * 1.8;
      glowMat.opacity = 0.19 + state.hover * 0.1;
      mat.opacity = 0.74 + state.hover * 0.24;

      renderer.render(scene, camera);
    });
  }

  if (hero && window.THREE) {
    try { initDepthField(hero, heroState); } catch (e) { /* static hero remains */ }
  }

  /* ================= Story — "Một ngày cùng FaceAttend" =================
     A pinned stage between the hero and "how it works": four chapters of
     one workday crossfade as the visitor scrolls, while a time rail
     scrubs a clock readout from 07:58 to 17:32. Copy moves with
     opacity/translate only — no overflow masks anywhere near the text
     (they clipped Vietnamese diacritics in an earlier pass).
     Gated three ways: cinematic.js itself only runs with motion welcome
     and GSAP present; this block also needs ScrollTrigger; and the stage
     layout only applies at >= 768px via gsap.matchMedia + the
     html.story-on CSS gate. Everywhere else the chapters stay as the
     stacked cards defined in styles.css. */
  var story = document.querySelector(".story");
  if (story && window.ScrollTrigger) {
    gsap.registerPlugin(window.ScrollTrigger);
    var storyStage = story.querySelector(".story-stage");
    var storyChapters = gsap.utils.toArray(story.querySelectorAll(".story-chapter"));
    var storyClock = story.querySelector(".story-clock-num");
    var storyCount = story.querySelector(".story-count-num");
    var storyFill = story.querySelector(".story-fill");
    var storyDot = story.querySelector(".story-dot");
    var DAY_START = 7 * 60 + 58;   // 07:58
    var DAY_END = 17 * 60 + 32;    // 17:32

    function storyClockText(progress) {
      var mins = Math.round(DAY_START + progress * (DAY_END - DAY_START));
      var h = Math.floor(mins / 60);
      var m = mins % 60;
      return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
    }

    function buildStory() {
      html.classList.add("story-on");

      storyChapters.forEach(function (ch, i) {
        gsap.set(ch.querySelector(".story-photo"), { opacity: i === 0 ? 1 : 0 });
        gsap.set(ch.querySelector(".story-text"), { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 28 });
      });

      var tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: storyStage,
          start: "top top",
          end: "+=320%",
          scrub: 0.6,
          pin: true,
          anticipatePin: 1,
          onUpdate: function (self) {
            var p = self.progress;
            if (storyClock) storyClock.textContent = storyClockText(p);
            if (storyCount) {
              var idx = Math.min(3, Math.floor(p * 4));
              storyCount.textContent = "0" + (idx + 1);
            }
          }
        }
      });

      // The rail fills across the whole story, start to end.
      if (storyFill) tl.fromTo(storyFill, { scaleY: 0 }, { scaleY: 1, duration: 4 }, 0);
      if (storyDot) tl.fromTo(storyDot, { top: "0%" }, { top: "100%", duration: 4 }, 0);

      storyChapters.forEach(function (ch, i) {
        // Each chapter's photo drifts slowly toward rest while it holds.
        var img = ch.querySelector(".story-photo img");
        if (img) tl.fromTo(img, { scale: 1.08 }, { scale: 1, duration: 1 }, i);

        if (i === 0) return;
        var prev = storyChapters[i - 1];
        var at = i - 0.35;
        tl.to(prev.querySelector(".story-photo"),
          { opacity: 0, duration: 0.5, ease: "power1.inOut" }, at);
        tl.fromTo(ch.querySelector(".story-photo"),
          { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power1.inOut" }, at);
        tl.to(prev.querySelector(".story-text"),
          { opacity: 0, y: -24, duration: 0.35, ease: "power1.in" }, at);
        tl.fromTo(ch.querySelector(".story-text"),
          { opacity: 0, y: 28 },
          { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, i - 0.02);
      });

      return function () { html.classList.remove("story-on"); };
    }

    if (gsap.matchMedia) {
      var storyMM = gsap.matchMedia();
      storyMM.add("(min-width: 768px)", buildStory);
    } else if (!window.matchMedia("(max-width: 767px)").matches) {
      buildStory();
    }
  }
})();
