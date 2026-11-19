// FaceAttend landing — cinematic layer.
//
// Everything here is additive and gated: it only activates when the visitor
// welcomes motion (no prefers-reduced-motion) and the vendored libraries are
// present. What it adds:
//   - a quiet real-time Three.js depth field behind the hero — abstract
//     points of light in charcoal/azure suggesting depth, never a face,
//     never a HUD. The interface floats above it; the pointer drifts it,
//     and hovering the primary CTA stills it.
//   - Lenis smooth scrolling glued to GSAP ScrollTrigger.
//   - a masked per-line reveal for the hero headline.
//   - gentle parallax on the kiosk card and its photo.
// If anything is unavailable (reduced motion, no WebGL, missing library),
// the page keeps its original static presentation, fully visible.
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return;
  if (!window.gsap) return;

  var gsap = window.gsap;
  var html = document.documentElement;
  var hero = document.querySelector(".hero");
  html.classList.add("cine");

  /* ================= Masked per-line headline reveal ================= */
  function splitHeadline(el) {
    var original = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (!original) return;
    try {
      el.setAttribute("aria-label", original);
      el.innerHTML = "";
      var words = original.split(" ").map(function (w) {
        var s = document.createElement("span");
        s.className = "cine-word";
        s.textContent = w;
        s.setAttribute("aria-hidden", "true");
        el.appendChild(s);
        el.appendChild(document.createTextNode(" "));
        return s;
      });
      // Group words into visual lines by their measured offset.
      var lines = [], cur = [], top = null;
      words.forEach(function (s) {
        var t = s.offsetTop;
        if (top === null || Math.abs(t - top) <= 2) {
          cur.push(s.textContent);
          if (top === null) top = t;
        } else {
          lines.push(cur);
          cur = [s.textContent];
          top = t;
        }
      });
      if (cur.length) lines.push(cur);
      el.innerHTML = "";
      var inners = lines.map(function (lineWords) {
        var mask = document.createElement("span");
        mask.className = "line-mask";
        var inner = document.createElement("span");
        inner.className = "line-inner";
        inner.textContent = lineWords.join(" ");
        inner.setAttribute("aria-hidden", "true");
        mask.appendChild(inner);
        el.appendChild(mask);
        return inner;
      });
      el.classList.add("cine-split");
      gsap.fromTo(inners,
        { yPercent: 118 },
        {
          yPercent: 0, duration: 1.15, ease: "power4.out",
          stagger: 0.09, delay: 0.15,
          onComplete: function () { el.classList.add("lines-done"); }
        });
      // Watchdog: the headline must never stay masked away.
      window.setTimeout(function () {
        el.classList.add("lines-done");
        gsap.set(inners, { yPercent: 0 });
      }, 3200);
    } catch (e) {
      el.textContent = original;
    }
  }

  if (hero) {
    var h1 = hero.querySelector("h1");
    if (h1) {
      // script.js queued a plain block fade for the h1 — replace it with lines.
      gsap.killTweensOf(h1);
      gsap.set(h1, { clearProps: "transform,opacity" });
      splitHeadline(h1);
    }
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

  /* ================= Parallax (scrubbed, restrained) ================= */
  if (window.ScrollTrigger && hero) {
    gsap.registerPlugin(window.ScrollTrigger);
    var card = hero.querySelector(".kiosk-card");
    if (card) {
      gsap.to(card, {
        y: -22, ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 }
      });
    }
    var photo = hero.querySelector(".hero-photo");
    if (photo) {
      gsap.to(photo, {
        scale: 1.09, ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 }
      });
    }
    window.addEventListener("load", function () {
      window.ScrollTrigger.refresh();
    });
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
    var glowMat = new THREE.SpriteMaterial({ map: glowTex, color: 0x2f6bff, transparent: true, opacity: 0.15, depthWrite: false });
    var glow = new THREE.Sprite(glowMat);
    glow.scale.set(30, 17, 1);
    glow.position.set(-5, 1.6, -8);
    scene.add(glow);
    var glow2Mat = new THREE.SpriteMaterial({ map: glowTex, color: 0x8fb0ff, transparent: true, opacity: 0.06, depthWrite: false });
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
      size: 0.075, map: dotTex, transparent: true, opacity: 0.55,
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
      glowMat.opacity = 0.13 + state.hover * 0.09;
      mat.opacity = 0.5 + state.hover * 0.2;

      renderer.render(scene, camera);
    });
  }

  if (hero && window.THREE) {
    try { initDepthField(hero, heroState); } catch (e) { /* static hero remains */ }
  }
})();
