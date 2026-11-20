/* ════════════════════════════════════════════════════════════════════
   FaceAttend — DEPTH FIELD (grid / terrain hero world), tungsten cut.

   Integrated into the premium-v2 landing on its own art direction:
   graphite ink, bone type, and the page's single accent — tungsten
   amber #f3b33d, "used only where the camera sees". The depth field
   is exactly that place: a subdivided plane whose height is a
   procedural face heightfield computed in the vertex shader from a
   sum of analytic bumps (forehead dome, brow ridge, eye-socket dips,
   nose ridge + tip, cheek planes, lips, chin, jaw taper). The face
   is an original schematic relief — not a real person's likeness,
   not data from any dataset. The fragment shader draws anti-aliased
   contour and grid lines via fwidth, tinted by elevation along a
   bronze → amber → pale-gold ramp.

   ONE renderer / ONE canvas serves three hosts: the boot veil (flat
   grid assembling line by line over the page's own black curtain),
   the depth band between the "one look" turn and the recognition
   chapter (scroll forms the face; the viewfinder brackets — the same
   mark as the logo — glide in and lock), and the closing section
   (the field settles flat behind the doors, the viewfinder glyph
   resting above the copy). The canvas is re-parented between hosts;
   the context never changes.

   The controller at the bottom owns the capability gates and the
   lazy three.js load. QA flags: ?attend=off forces the static page,
   ?attend=on forces the engine (screenshot passes). When the engine
   is off for any reason, the band never enters the layout and the
   page is exactly the static design. script.js is untouched.
   ════════════════════════════════════════════════════════════════════ */
(function (global) {
  "use strict";

  var state = {
    ready: false, dead: false, running: false, wantRun: false,
    mode: "veil",
    canvas: null, renderer: null, scene: null, camera: null,
    field: null, fieldMat: null, brackets: null, bracketMat: null,
    ring: null, ringMat: null, glyph: null, glyphMats: [],
    hosts: { veil: null, band: null, closing: null },
    clock: null, raf: 0,
    /* eased state */
    form: 0.0, formTarget: 0.1, scrollForm: 0.05,
    boot: 0, bootT: -1,
    camPos: null, camTarget: null, rotX: -0.54, rotXTarget: -0.54,
    glyphAmt: 0, glyphTarget: 0, glyphY: 0, opacity: 1,
    px: 0, py: 0, pxT: 0, pyT: 0,
    sweepT: -3.2, flash: 0, ringT: -1, lockArmed: true,
    time: 0
  };

  var MODES = {
    veil:    { cam: [0, 0.30, 3.35], rotX: -0.54, form: 0.10, glyph: 0, glyphY: 0,    opacity: 1 },
    band:    { cam: [0, 0.10, 3.05], rotX: -0.40, form: null, glyph: 0, glyphY: 0,    opacity: 1 },
    closing: { cam: [0, 0.45, 3.40], rotX: -0.15, form: 0.05, glyph: 1, glyphY: 0.30, opacity: 0.62 }
  };

  function smoothstep(a, b, x) {
    var t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ── Shaders ──────────────────────────────────────────────────── */

  var VERT = [
    "uniform float uTime;",
    "uniform float uForm;",
    "uniform float uAmp;",
    "varying vec2 vField;",
    "varying float vH;",
    "varying vec3 vNormal;",
    "",
    "float g2(vec2 p, vec2 c, vec2 r){",
    "  vec2 d = (p - c) / r;",
    "  return exp(-dot(d, d));",
    "}",
    "",
    /* The face: a sum of analytic bumps in field space (x right, y up,
       face centre near origin). Amplitudes tuned so the relief orders
       nose > forehead > cheeks > chin, with the sockets carved low. */
    "float faceHeight(vec2 p){",
    "  float h = 0.0;",
    "  h += 0.62 * g2(p, vec2(0.0, 0.10), vec2(0.60, 0.80));",   // cranial mass
    "  h += 0.30 * g2(p, vec2(0.0, 0.42), vec2(0.46, 0.34));",   // forehead dome
    "  h += 0.13 * g2(p, vec2(0.0, 0.235), vec2(0.36, 0.075));", // brow ridge
    "  h -= 0.34 * g2(p, vec2(-0.205, 0.145), vec2(0.115, 0.082));", // eye socket L
    "  h -= 0.34 * g2(p, vec2( 0.205, 0.145), vec2(0.115, 0.082));", // eye socket R
    "  h += 0.26 * g2(p, vec2(0.0, 0.03), vec2(0.052, 0.20));",  // nose ridge
    "  h += 0.33 * g2(p, vec2(0.0, -0.115), vec2(0.082, 0.066));", // nose tip
    "  h -= 0.10 * g2(p, vec2(-0.088, -0.168), vec2(0.042, 0.030));", // nostril L
    "  h -= 0.10 * g2(p, vec2( 0.088, -0.168), vec2(0.042, 0.030));", // nostril R
    "  h += 0.20 * g2(p, vec2(-0.335, -0.015), vec2(0.155, 0.115));", // cheekbone L
    "  h += 0.20 * g2(p, vec2( 0.335, -0.015), vec2(0.155, 0.115));", // cheekbone R
    "  h += 0.07 * g2(p, vec2(-0.27, -0.17), vec2(0.20, 0.15));",  // cheek plane L
    "  h += 0.07 * g2(p, vec2( 0.27, -0.17), vec2(0.20, 0.15));",  // cheek plane R
    "  h -= 0.07 * g2(p, vec2(-0.125, -0.235), vec2(0.05, 0.095));", // nasolabial L
    "  h -= 0.07 * g2(p, vec2( 0.125, -0.235), vec2(0.05, 0.095));", // nasolabial R
    "  h += 0.12 * g2(p, vec2(0.0, -0.295), vec2(0.125, 0.042));", // upper lip
    "  h += 0.15 * g2(p, vec2(0.0, -0.372), vec2(0.105, 0.048));", // lower lip
    "  h -= 0.09 * g2(p, vec2(0.0, -0.333), vec2(0.135, 0.016));", // mouth line
    "  h += 0.17 * g2(p, vec2(0.0, -0.515), vec2(0.155, 0.095));", // chin
    "  h += 0.09 * g2(p, vec2(-0.295, -0.46), vec2(0.115, 0.13));", // jaw L
    "  h += 0.09 * g2(p, vec2( 0.295, -0.46), vec2(0.115, 0.13));", // jaw R
    "  vec2 mp = p - vec2(0.0, -0.02);",
    "  float md = length(mp / vec2(0.66, 0.88));",
    "  float mask = smoothstep(1.02, 0.78, md);",                  // silhouette taper
    "  return h * mask;",
    "}",
    "",
    "float idleHeight(vec2 p, float t){",
    "  float n = 0.0;",
    "  n += 0.030 * sin(p.x * 2.2 + t * 0.24) * cos(p.y * 1.8 - t * 0.19);",
    "  n += 0.016 * sin(p.x * 6.5 - t * 0.40) * sin(p.y * 5.5 + t * 0.33);",
    "  n += 0.010 * sin((p.x + p.y) * 11.0 + t * 0.50);",
    "  return n;",
    "}",
    "",
    "float H(vec2 p){",
    "  float face = faceHeight(p) * (1.0 + 0.014 * sin(uTime * 0.45));", // breathing
    "  return mix(idleHeight(p, uTime), face, uForm);",
    "}",
    "",
    "void main(){",
    "  vec2 p = position.xy;",
    "  float e = 0.014;",
    "  float h  = H(p);",
    "  float hx = H(p + vec2(e, 0.0));",
    "  float hy = H(p + vec2(0.0, e));",
    "  vec3 pos = position;",
    "  pos.z += h * uAmp;",
    "  vNormal = normalize(vec3(-(hx - h) * uAmp, -(hy - h) * uAmp, e));",
    "  vField = p;",
    "  vH = clamp(h * mix(2.6, 0.80, uForm), 0.0, 1.0);",
    "  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);",
    "}"
  ].join("\n");

  var FRAG = [
    "uniform float uTime;",
    "uniform float uForm;",
    "uniform float uBoot;",
    "uniform float uSweepT;",
    "uniform float uOpacity;",
    "uniform vec3 uDeep;",
    "uniform vec3 uGold;",
    "uniform vec3 uPeak;",
    "uniform vec3 uBone;",
    "varying vec2 vField;",
    "varying float vH;",
    "varying vec3 vNormal;",
    "",
    "float gridLine(float coord, float n){",
    "  float c = coord * n;",
    "  float w = fwidth(c);",
    "  float g = abs(fract(c - 0.5) - 0.5) / max(w, 1e-5);",
    "  return 1.0 - clamp(g, 0.0, 1.0);",
    "}",
    "",
    "void main(){",
    "  float cc = vH * 14.0;",
    "  float cw = fwidth(cc);",
    "  float contour = 1.0 - clamp(abs(fract(cc - 0.5) - 0.5) / max(cw, 1e-4), 0.0, 1.0);",
    "  float grid = max(gridLine(vField.x, 13.0), gridLine(vField.y, 13.0));",
    "  float gridFine = max(gridLine(vField.x, 52.0), gridLine(vField.y, 52.0));",
    "",
    "  vec3 N = normalize(mix(vec3(0.0, 0.0, 1.0), vNormal, 0.72));",
    "  float dif = clamp(dot(N, normalize(vec3(0.45, 0.75, 0.65))), 0.0, 1.0);",
    "",
    /* Elevation ramp in the page's own metal: dark bronze in the
       sockets and lowlands, the brand amber #f3b33d on the slopes,
       pale gold on the high points (brow, nose, cheekbones). */
    "  vec3 col = mix(uDeep, uGold, smoothstep(0.03, 0.42, vH));",
    "  col = mix(col, uPeak, smoothstep(0.55, 0.88, vH));",
    "  col *= 0.60 + 0.58 * dif;",
    "",
    "  float sweepPos = mix(1.25, -1.25, fract((uTime - uSweepT) / 7.0));",
    "  float band = exp(-pow((vField.y - sweepPos) * 5.0, 2.0));",
    "",
    "  float lineGlow = contour * (0.50 + 0.70 * vH) + grid * 0.15 + gridFine * 0.05;",
    "  vec3 rgb = col * (0.32 + lineGlow * 1.05 + band * 0.45);",
    "  rgb += uBone * (grid * 0.045 + gridFine * 0.018);",
    "  float alpha = 0.13 + contour * 0.44 + grid * 0.13 + gridFine * 0.05 + band * 0.13 + dif * vH * 0.06;",
    "",
    "  float fade = smoothstep(1.30, 0.58, length(vField * vec2(1.02, 0.82)));",
    "  alpha *= fade;",
    "  float front = mix(-1.35, 1.35, uBoot);",
    "  alpha *= smoothstep(front + 0.10, front - 0.10, vField.y);",
    "  alpha *= uOpacity;",
    "  gl_FragColor = vec4(rgb, alpha);",
    "}"
  ].join("\n");

  /* ── Line geometry: viewfinder brackets, pulse ring, logo glyph ── */

  function bracketPositions(halfW, halfH, arm) {
    var pts = [];
    var corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (var i = 0; i < 4; i++) {
      var sx = corners[i][0], sy = corners[i][1];
      var cx = sx * halfW, cy = sy * halfH;
      pts.push(cx - sx * arm, cy, 0, cx, cy, 0);   // horizontal arm
      pts.push(cx, cy, 0, cx, cy - sy * arm, 0);   // vertical arm
    }
    return new Float32Array(pts);
  }

  function circlePoints(cx, cy, r, seg) {
    var pts = [];
    for (var i = 0; i < seg; i++) {
      var a = (i / seg) * Math.PI * 2;
      pts.push(new (state._V3)(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0));
    }
    return pts;
  }

  function buildLines(THREE) {
    state._V3 = THREE.Vector3;

    /* Band brackets — frame the face at field scale. Same mark as the
       logo: four corners, nothing else. */
    var bGeo = new THREE.BufferGeometry();
    bGeo.setAttribute("position", new THREE.BufferAttribute(bracketPositions(0.78, 1.00, 0.20), 3));
    state.bracketMat = new THREE.LineBasicMaterial({
      color: 0xffe2a0, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    state.brackets = new THREE.LineSegments(bGeo, state.bracketMat);
    state.brackets.position.set(0, -0.02, 0.30);
    state.brackets.renderOrder = 3;

    /* Lock-on pulse ring at the face centre. */
    var rGeo = new THREE.BufferGeometry().setFromPoints(circlePoints(0, -0.02, 1, 72));
    state.ringMat = new THREE.LineBasicMaterial({
      color: 0xf3b33d, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    state.ring = new THREE.LineLoop(rGeo, state.ringMat);
    state.ring.position.set(0, -0.02, 0.30);
    state.ring.renderOrder = 4;

    /* Closing glyph — the page's own viewfinder-face mark: four corner
       brackets, two eye rings, one smile arc. Proportions follow the
       logo's 64-unit grid. */
    var glyph = new THREE.Group();
    function glyphMat() {
      var m = new THREE.LineBasicMaterial({
        color: 0xf3b33d, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      state.glyphMats.push(m);
      return m;
    }
    var gGeo = new THREE.BufferGeometry();
    gGeo.setAttribute("position", new THREE.BufferAttribute(bracketPositions(0.31, 0.31, 0.12), 3));
    glyph.add(new THREE.LineSegments(gGeo, glyphMat()));
    [-0.075, 0.075].forEach(function (ex) {
      var eGeo = new THREE.BufferGeometry().setFromPoints(circlePoints(ex, 0.055, 0.030, 28));
      glyph.add(new THREE.LineLoop(eGeo, glyphMat()));
    });
    var smile = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.095, -0.074, 0),
      new THREE.Vector3(0, -0.155, 0),
      new THREE.Vector3(0.095, -0.074, 0)
    );
    var sGeo = new THREE.BufferGeometry().setFromPoints(smile.getPoints(28));
    glyph.add(new THREE.Line(sGeo, glyphMat()));
    glyph.position.z = 0.34;
    glyph.renderOrder = 5;
    state.glyph = glyph;
  }

  /* ── Init ─────────────────────────────────────────────────────── */

  function init(canvas, opts) {
    if (state.ready || state.dead || !global.THREE) return false;
    opts = opts || {};
    var THREE = global.THREE;
    state.canvas = canvas;
    var coarse = !!opts.coarse;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
    } catch (e) { return false; }

    /* Software renderers stay on the static design unless the QA flag
       ?attend=on forced the engine (screenshot passes). */
    if (!opts.force) {
      try {
        var gl = renderer.getContext();
        var dbg = gl.getExtension("WEBGL_debug_renderer_info");
        var rname = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : "";
        if (/swiftshader|llvmpipe|software|angle \(google/i.test(rname)) {
          renderer.dispose();
          return false;
        }
      } catch (e) { /* if we cannot tell, let it run */ }
    }

    var DPR = Math.min(global.devicePixelRatio || 1, coarse ? 1.25 : 1.5);
    renderer.setPixelRatio(DPR);
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
    state.camPos = new THREE.Vector3(0, 0.30, 3.35);
    state.camTarget = new THREE.Vector3(0, 0.30, 3.35);
    camera.position.copy(state.camPos);
    camera.lookAt(0, -0.02, 0);

    var group = new THREE.Group();
    scene.add(group);
    state.field = group;

    var SEG = coarse ? 96 : 176;
    var geo = new THREE.PlaneGeometry(2.3, 2.3, SEG, SEG);
    state.fieldMat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uForm: { value: 0 },
        uAmp: { value: 0.5 },
        uBoot: { value: 0 },
        uSweepT: { value: state.sweepT },
        uOpacity: { value: 1 },
        uDeep: { value: new THREE.Color(0x2e2008) },
        uGold: { value: new THREE.Color(0xf3b33d) },
        uPeak: { value: new THREE.Color(0xffe9b0) },
        uBone: { value: new THREE.Color(0xece7dd) }
      }
    });
    if (state.fieldMat.extensions) state.fieldMat.extensions.derivatives = true;
    var plane = new THREE.Mesh(geo, state.fieldMat);
    plane.renderOrder = 1;
    group.add(plane);

    buildLines(THREE);
    group.add(state.brackets);
    group.add(state.ring);
    group.add(state.glyph);

    state.renderer = renderer;
    state.scene = scene;
    state.camera = camera;
    state.clock = new THREE.Clock();
    state.ready = true;
    state.bootT = 0;

    canvas.addEventListener("webglcontextlost", function (ev) {
      ev.preventDefault();
      state.dead = true;
      stopLoop();
      global.dispatchEvent(new global.Event("attend-depth-fallback"));
    });

    global.addEventListener("resize", function () { resize(); });
    resize();
    return true;
  }

  function resize() {
    if (!state.ready || !state.canvas) return;
    var host = state.canvas.parentNode;
    if (!host) return;
    var w = host.clientWidth || state.canvas.clientWidth || 1;
    var h = host.clientHeight || state.canvas.clientHeight || 1;
    state.renderer.setSize(w, h, false);
    state.camera.aspect = w / h;
    state.camera.updateProjectionMatrix();
  }
  state._resize = resize;

  /* ── Frame loop ───────────────────────────────────────────────── */

  function frame() {
    if (!state.running) return;
    var dt = Math.min(state.clock.getDelta(), 0.05);
    if (document.hidden) { state.raf = requestAnimationFrame(frame); return; }
    state.time += dt;
    var t = state.time;
    var U = state.fieldMat.uniforms;
    U.uTime.value = t;

    /* Form: mode decides the target (band defers to the scroll value). */
    var m = MODES[state.mode];
    var target = (state.mode === "band") ? state.scrollForm : m.form;
    var kForm = 1 - Math.exp(-dt * 3.1);
    state.form += (target - state.form) * kForm;
    if (Math.abs(target - state.form) < 0.0006) state.form = target;
    U.uForm.value = state.form;

    /* Boot: grid assembles line by line, once, in the veil. */
    if (state.bootT >= 0 && state.boot < 1) {
      state.bootT += dt;
      state.boot = Math.min(1, state.bootT / 1.6);
      U.uBoot.value = state.boot * state.boot * (3 - 2 * state.boot);
    } else {
      U.uBoot.value = 1;
    }

    /* Camera + tilt ease (calm tone, k in the 2–4 range — this page
       is quiet; nothing snaps). */
    var kCam = 1 - Math.exp(-dt * 2.8);
    state.camTarget.set(
      m.cam[0] + state.px * 0.14,
      m.cam[1] - state.py * 0.09,
      m.cam[2]
    );
    state.camPos.lerp(state.camTarget, kCam);
    state.camera.position.copy(state.camPos);
    state.camera.lookAt(0, -0.02, 0);
    state.rotX += (m.rotX - state.rotX) * kCam;
    state.field.rotation.x = state.rotX;
    state.px += (state.pxT - state.px) * (1 - Math.exp(-dt * 2.2));
    state.py += (state.pyT - state.py) * (1 - Math.exp(-dt * 2.2));

    /* Overall presence eases per mode (closing is a whisper over the
       night photograph, not a replacement for it). */
    state.opacity += (m.opacity - state.opacity) * (1 - Math.exp(-dt * 2.4));
    U.uOpacity.value = state.opacity;

    /* Brackets: glide in + brighten as the form locks (uForm ≳ 0.85). */
    var lockT = smoothstep(0.82, 0.985, state.form);
    state.flash *= Math.exp(-dt * 3.2);
    var bOp = (state.mode === "band" ? lockT * 0.95 : 0) + state.flash * 0.25 * (state.mode === "band" ? 1 : 0);
    state.bracketMat.opacity = Math.min(1, bOp);
    var bScale = lerp(1.24, 1.0, lockT) * (1 - 0.02 * state.flash);
    state.brackets.scale.set(bScale, bScale, 1);

    /* One pulse ring when the lock first completes; re-arms on unlock. */
    if (state.lockArmed && state.form > 0.985 && state.mode === "band") {
      state.ringT = 0; state.lockArmed = false;
    }
    if (state.form < 0.9) state.lockArmed = true;
    if (state.ringT >= 0) {
      state.ringT += dt / 1.3;
      if (state.ringT >= 1) { state.ringT = -1; state.ringMat.opacity = 0; }
      else {
        var rr = lerp(0.12, 0.58, state.ringT);
        state.ring.scale.set(rr, rr, 1);
        state.ringMat.opacity = (1 - state.ringT) * 0.75;
      }
    }

    /* Closing glyph fades in only in closing mode, growing slightly
       as it settles, and rises into the dark above the closing copy. */
    state.glyphAmt += (m.glyph - state.glyphAmt) * (1 - Math.exp(-dt * 2.4));
    state.glyphY += (m.glyphY - state.glyphY) * (1 - Math.exp(-dt * 2.4));
    for (var i = 0; i < state.glyphMats.length; i++) {
      state.glyphMats[i].opacity = state.glyphAmt * 0.95;
    }
    var gScale = lerp(1.0, 1.30, state.glyphAmt);
    state.glyph.scale.set(gScale, gScale, 1);
    state.glyph.position.y = state.glyphY;

    U.uSweepT.value = state.sweepT;
    state.renderer.render(state.scene, state.camera);
    state.raf = requestAnimationFrame(frame);
  }

  function startLoop() {
    if (!state.ready || state.dead || state.running) return;
    state.running = true;
    state.clock.getDelta(); /* flush stale delta while paused */
    frame();
  }
  function stopLoop() {
    state.running = false;
    if (state.raf) cancelAnimationFrame(state.raf);
  }

  /* ── Public API ───────────────────────────────────────────────── */

  global.FaceDepthField = {
    init: init,
    setHosts: function (hosts) {
      if (!hosts) return;
      if (hosts.veil) state.hosts.veil = hosts.veil;
      if (hosts.band) state.hosts.band = hosts.band;
      if (hosts.closing) state.hosts.closing = hosts.closing;
    },
    setMode: function (mode) {
      if (!state.ready || state.dead) return;
      if (mode !== "veil" && mode !== "band" && mode !== "closing") return;
      state.mode = mode;
      var host = state.hosts[mode] || state.hosts.band;
      if (host && state.canvas && state.canvas.parentNode !== host) {
        host.appendChild(state.canvas);
        resize();
      }
    },
    getMode: function () { return state.mode; },
    /* Scroll writes the target only — the loop eases the form. */
    setFormTarget: function (p) { state.scrollForm = Math.max(0, Math.min(1, p)); },
    getFormSmooth: function () { return state.form; },
    setPointer: function (nx, ny) {
      state.pxT = Math.max(-1, Math.min(1, nx));
      state.pyT = Math.max(-1, Math.min(1, ny));
    },
    /* Click: re-run the scan sweep + flash the brackets once. */
    pulse: function () {
      state.sweepT = state.time;
      state.flash = 1;
    },
    start: function () { state.wantRun = true; startLoop(); },
    stop: function () { state.wantRun = false; stopLoop(); },
    isReady: function () { return state.ready && !state.dead; }
  };
})(typeof window !== "undefined" ? window : globalThis);

/* ════════════════════════════════════════════════════════════════════
   Controller — capability gates, lazy three.js, host choreography.
   Owns exactly one bilingual string (the band caption); every other
   string on the page belongs to script.js, which is untouched.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var params = null;
  try { params = new URLSearchParams(window.location.search); } catch (e) { /* ignore */ }
  var attend = params ? params.get("attend") : null;
  if (attend === "off") return;
  var FORCE = attend === "on";

  var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var lowEnd = (navigator.hardwareConcurrency || 4) <= 2 ||
    (navigator.deviceMemory && navigator.deviceMemory <= 2);
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  /* Reduced motion is a hard gate — the QA flag never overrides a
     visitor's accessibility preference. The other gates (automation,
     low-end hardware, save-data, software WebGL in the engine) are
     the ones ?attend=on exists to bypass for screenshot passes. */
  if (reduced) return;
  if (!FORCE && (navigator.webdriver || lowEnd || saveData)) return;

  var band = document.getElementById("depthBand");
  var bandHost = document.getElementById("depthHost");
  var closeHost = document.getElementById("depthCloseHost");
  var closeSection = document.querySelector(".close");
  var cap = document.getElementById("depthCap");
  if (!band || !bandHost) return;

  /* The band caption — the integration's only copy. Vietnamese is the
     page's first language; the pair swaps with the page's own toggle
     by watching the lang attribute script.js maintains. */
  var CAP = {
    vi: "Bản đồ chiều sâu của một khuôn mặt",
    en: "A face, as a depth map"
  };
  function syncCap() {
    if (cap) cap.textContent = CAP[document.documentElement.lang === "en" ? "en" : "vi"];
  }
  syncCap();
  if (window.MutationObserver) {
    new MutationObserver(syncCap).observe(document.documentElement,
      { attributes: true, attributeFilter: ["lang"] });
  }

  /* Boot veil — a plain ink overlay above the page's own curtain.
     Until the engine is live it is indistinguishable from that
     curtain; if anything fails it is simply removed. */
  var veil = document.createElement("div");
  veil.id = "dfVeil";
  veil.setAttribute("aria-hidden", "true");
  var veilHost = document.createElement("div");
  veilHost.className = "df-host";
  veil.appendChild(veilHost);
  document.body.appendChild(veil);

  var canvas = document.createElement("canvas");
  canvas.className = "df-canvas";
  canvas.setAttribute("aria-hidden", "true");
  veilHost.appendChild(canvas);

  var coarse = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  var ready = false, dead = false, veilActive = true;
  var bandVisible = false, closeVisible = false;

  function updateRun() {
    if (!ready || dead || !window.FaceDepthField) return;
    if (veilActive || bandVisible || closeVisible) window.FaceDepthField.start();
    else window.FaceDepthField.stop();
  }

  function partVeil() {
    if (!veilActive) return;
    veilActive = false;
    veil.classList.add("df-out");
    window.setTimeout(function () { if (veil.parentNode) veil.parentNode.removeChild(veil); }, 950);
    if (ready && !dead && window.FaceDepthField) window.FaceDepthField.setMode("band");
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    updateRun();
  }

  function fail() {
    dead = true;
    veilActive = false;
    if (veil.parentNode) veil.parentNode.removeChild(veil);
    document.documentElement.classList.remove("df-on");
  }

  /* If three.js has not produced a live engine quickly, the page is
     better off exactly as designed — drop the veil and stop. */
  var failTimer = window.setTimeout(function () { if (!ready) fail(); }, 5000);

  var s = document.createElement("script");
  s.src = "vendor/three.min.js";
  s.onload = function () {
    if (!window.FaceDepthField) { fail(); return; }
    var ok = window.FaceDepthField.init(canvas, { coarse: coarse, force: FORCE });
    if (!ok) { fail(); return; }
    window.clearTimeout(failTimer);
    ready = true;
    window.FaceDepthField.setHosts({ veil: veilHost, band: bandHost, closing: closeHost });
    window.FaceDepthField.setMode("veil");
    document.documentElement.classList.add("df-on");
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    updateRun();
    /* Let the boot assembly read for a beat before the veil parts. */
    window.setTimeout(partVeil, 1650);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { window.setTimeout(partVeil, 950); });
    }
  };
  s.onerror = function () { fail(); };
  document.head.appendChild(s);

  window.addEventListener("attend-depth-fallback", function () {
    if (!dead) fail();
  });

  /* Scroll choreography: the face forms as the band travels from the
     bottom of the viewport to centre, and is fully locked by the time
     the recognition chapter arrives. Rect reads only — the page's own
     Lenis/GSAP stack is left alone. */
  var ticking = false;
  function onScroll() {
    if (ticking || !ready || dead) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      if (!window.FaceDepthField) return;
      var r = band.getBoundingClientRect();
      var vh = window.innerHeight || 1;
      var p = (vh * 0.98 - r.top) / (vh * 0.96);
      window.FaceDepthField.setFormTarget(Math.max(0, Math.min(1, p)));
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      bandVisible = es[0].isIntersecting;
      updateRun();
    }, { threshold: 0.02 }).observe(band);
    if (closeSection && closeHost) {
      new IntersectionObserver(function (es) {
        closeVisible = es[0].isIntersecting;
        if (ready && !dead && window.FaceDepthField) {
          if (closeVisible) window.FaceDepthField.setMode("closing");
          else if (window.FaceDepthField.getMode() === "closing") window.FaceDepthField.setMode("band");
        }
        updateRun();
      }, { threshold: 0.15 }).observe(closeSection);
    }
  }

  /* Pointer: the field tilts subtly toward the pointer (mouse only,
     clamped — this page is calm). Click on the band or the closing
     field (never on a link or button) re-runs the scan sweep. */
  band.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse" || !ready || dead || !window.FaceDepthField) return;
    var r = bandHost.getBoundingClientRect();
    if (!r.width || !r.height) return;
    window.FaceDepthField.setPointer(
      ((e.clientX - r.left) / r.width - 0.5) * 2,
      ((e.clientY - r.top) / r.height - 0.5) * 2
    );
  });
  band.addEventListener("pointerleave", function () {
    if (ready && !dead && window.FaceDepthField) window.FaceDepthField.setPointer(0, 0);
  });
  document.addEventListener("click", function (e) {
    if (!ready || dead || !window.FaceDepthField) return;
    if (e.target.closest && e.target.closest("a, button, input, select, textarea, [role='button']")) return;
    if (band.contains(e.target) || (closeSection && closeSection.contains(e.target))) {
      window.FaceDepthField.pulse();
    }
  });

  /* QA hooks for screenshot passes — inert in normal use. */
  window.__attendState = function () {
    if (!window.FaceDepthField) return null;
    return {
      ready: window.FaceDepthField.isReady(),
      mode: window.FaceDepthField.getMode(),
      form: window.FaceDepthField.getFormSmooth(),
      canvasParent: canvas.parentNode ? (canvas.parentNode.id || canvas.parentNode.className) : null,
      engineOn: document.documentElement.classList.contains("df-on")
    };
  };
  window.__attendSetForm = function (p) {
    if (window.FaceDepthField) window.FaceDepthField.setFormTarget(p);
  };
  window.__attendSetMode = function (m) {
    if (window.FaceDepthField) window.FaceDepthField.setMode(m);
  };
})();
