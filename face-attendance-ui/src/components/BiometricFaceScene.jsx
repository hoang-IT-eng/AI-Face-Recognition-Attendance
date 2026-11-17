import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * Procedural 468-Landmark 3D Biometric Face Topology Mesh
 * - Sculpted craniofacial depth contours (brow ridge, orbital sockets, nasal bridge, zygomatic arch, jawline)
 * - Cursor-tracked gaze inertia
 * - Synchronized Double-Blink EAR (Eye Aspect Ratio) Liveness Wave -> 512-D Facenet Verified Ring
 * - Resilient try/catch WebGL initialization with high-craft SVG topology fallback
 */
export default function BiometricFaceScene({ lang = "en" }) {
  const mountRef = useRef(null);
  const canvasRef = useRef(null);
  const triggerModeRef = useRef({ mode: "auto", startAt: 0 });

  const [webglOk, setWebglOk] = useState(true);
  const [hud, setHud] = useState({
    ear: "0.312",
    blinks: "2 / 2",
    cosine: "0.946",
    state: "VERIFIED · 512-D",
    isSpoof: false,
  });

  useEffect(() => {
    const container = mountRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      setWebglOk(false);
      return undefined;
    }

    let renderer;
    let animId = 0;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
      camera.position.set(0, 0.05, 4.55);

      const root = new THREE.Group();
      scene.add(root);

      /* --- Build 26 x 18 = 468 Structured Anatomical Facial Landmarks --- */
      const COLS = 26;
      const ROWS = 18;
      const basePositions = [];
      const eyelidMeta = []; // { idx, side, upper: bool, weight }
      const gridIndex = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
      const colors = [];

      const colEmerald = new THREE.Color("#14b88a");
      const colAlabaster = new THREE.Color("#f2f5f3");
      const colTeal = new THREE.Color("#2a6f60");

      let vIdx = 0;
      for (let r = 0; r < ROWS; r++) {
        const v = 1 - (r / (ROWS - 1)) * 2; // +1 forehead -> -1 chin
        for (let c = 0; c < COLS; c++) {
          const u = (c / (COLS - 1)) * 2 - 1; // -1 left -> +1 right

          // Natural craniofacial jaw taper
          const jawWidth = v < 0 ? 1 - Math.pow(-v, 1.55) * 0.42 : 1 - Math.pow(v, 2.2) * 0.16;
          const x = u * 0.94 * jawWidth;
          const y = v * 1.24;

          // Base cranial ellipsoid depth
          const r2 = Math.min(1, u * u * 0.88 + v * v * 0.78);
          let z = Math.sqrt(Math.max(0.02, 1 - r2)) * 0.72;

          // Brow ridge prominence
          const brow = Math.exp(-Math.pow((v - 0.34) / 0.11, 2)) * Math.exp(-Math.pow(u / 0.75, 2)) * 0.085;
          // Bilateral orbital eye sockets
          const dEyeL = Math.hypot((u + 0.36) / 0.21, (v - 0.2) / 0.12);
          const dEyeR = Math.hypot((u - 0.36) / 0.21, (v - 0.2) / 0.12);
          const eyeSocket = (Math.exp(-dEyeL * dEyeL) + Math.exp(-dEyeR * dEyeR)) * -0.115;

          // Nasal bridge & tip projection
          const noseBridge =
            Math.exp(-Math.pow(u / 0.13, 2)) *
            Math.exp(-Math.pow((v - 0.02) / 0.32, 2)) *
            0.22;
          const noseTip =
            Math.exp(-Math.pow(u / 0.16, 2)) *
            Math.exp(-Math.pow((v + 0.16) / 0.11, 2)) *
            0.12;

          // Zygomatic cheekbones
          const cheek =
            (Math.exp(-Math.pow((u + 0.54) / 0.24, 2)) +
              Math.exp(-Math.pow((u - 0.54) / 0.24, 2))) *
            Math.exp(-Math.pow((v + 0.02) / 0.22, 2)) *
            0.075;

          // Labial / mouth contour & chin
          const lips =
            Math.exp(-Math.pow(u / 0.26, 2)) *
            Math.exp(-Math.pow((v + 0.46) / 0.09, 2)) *
            0.075;
          const chin =
            Math.exp(-Math.pow(u / 0.24, 2)) *
            Math.exp(-Math.pow((v + 0.82) / 0.14, 2)) *
            0.065;

          z += brow + eyeSocket + noseBridge + noseTip + cheek + lips + chin - 0.28;

          gridIndex[r][c] = vIdx;
          basePositions.push(x, y, z);

          const nearEye = dEyeL < 1.05 || dEyeR < 1.05;
          if (nearEye) {
            const dy = v - 0.2;
            eyelidMeta.push({
              idx: vIdx,
              sign: dy >= 0 ? -1 : 1,
              amp: Math.max(0, 1 - Math.min(dEyeL, dEyeR)) * 0.085,
            });
            colors.push(colAlabaster.r, colAlabaster.g, colAlabaster.b);
          } else if (Math.abs(u) < 0.16 && Math.abs(v) < 0.55) {
            colors.push(colEmerald.r, colEmerald.g, colEmerald.b);
          } else {
            colors.push(colTeal.r, colTeal.g, colTeal.b);
          }
          vIdx++;
        }
      }

      const posArray = new Float32Array(basePositions);
      const pointGeo = new THREE.BufferGeometry();
      pointGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
      pointGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

      const pointMat = new THREE.PointsMaterial({
        size: 0.032,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
      });
      const landmarkPoints = new THREE.Points(pointGeo, pointMat);
      root.add(landmarkPoints);

      /* Geodesic triangulation edges connecting the 468 landmarks */
      const edgeIndices = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cur = gridIndex[r][c];
          if (c + 1 < COLS) edgeIndices.push(cur, gridIndex[r][c + 1]);
          if (r + 1 < ROWS) edgeIndices.push(cur, gridIndex[r + 1][c]);
          if (r + 1 < ROWS && c + 1 < COLS) {
            if ((r + c) % 2 === 0) {
              edgeIndices.push(cur, gridIndex[r + 1][c + 1]);
            } else {
              edgeIndices.push(gridIndex[r][c + 1], gridIndex[r + 1][c]);
            }
          }
        }
      }

      const wireGeo = new THREE.BufferGeometry();
      wireGeo.setAttribute("position", pointGeo.getAttribute("position"));
      wireGeo.setIndex(edgeIndices);
      const wireMat = new THREE.LineBasicMaterial({
        color: "#14b88a",
        transparent: true,
        opacity: 0.26,
      });
      const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
      root.add(wireMesh);

      /* --- Outer 512-D Biometric Verification Ring + Laser Scan Plane --- */
      const ringGeo = new THREE.TorusGeometry(1.42, 0.012, 12, 96);
      const ringMat = new THREE.MeshBasicMaterial({
        color: "#14b88a",
        transparent: true,
        opacity: 0.55,
      });
      const verifiedRing = new THREE.Mesh(ringGeo, ringMat);
      verifiedRing.position.z = -0.05;
      root.add(verifiedRing);

      const pulseRingGeo = new THREE.RingGeometry(1.38, 1.44, 72);
      const pulseRingMat = new THREE.MeshBasicMaterial({
        color: "#14b88a",
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0,
      });
      const pulseRing = new THREE.Mesh(pulseRingGeo, pulseRingMat);
      root.add(pulseRing);

      const scanLineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-1.25, 0, 0.55),
        new THREE.Vector3(1.25, 0, 0.55),
      ]);
      const scanLineMat = new THREE.LineBasicMaterial({
        color: "#14b88a",
        transparent: true,
        opacity: 0.7,
      });
      const scanLine = new THREE.Line(scanLineGeo, scanLineMat);
      root.add(scanLine);

      const resize = () => {
        const w = container.clientWidth || 520;
        const h = container.clientHeight || 460;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      };
      resize();
      window.addEventListener("resize", resize);

      let targetX = 0;
      let targetY = 0;
      const onPointerMove = (e) => {
        const rect = container.getBoundingClientRect();
        targetX = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
        targetY = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
      };
      window.addEventListener("pointermove", onPointerMove, { passive: true });

      const clock = new THREE.Clock();
      let lastHudTick = 0;

      const animate = () => {
        animId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // Smooth cursor gaze tracking
        const desiredRotY = targetX * 0.34 + Math.sin(t * 0.55) * 0.06;
        const desiredRotX = targetY * 0.22 + Math.cos(t * 0.45) * 0.04;
        root.rotation.y += (desiredRotY - root.rotation.y) * 0.065;
        root.rotation.x += (desiredRotX - root.rotation.x) * 0.065;

        // Compute Double-Blink EAR Liveness Wave (5.2s cycle or manual trigger)
        const trig = triggerModeRef.current;
        let blinkClosure = 0;
        let currentEar = 0.312;
        let blinkCountLabel = "2 / 2";
        let stateLabel = "VERIFIED · 512-D";
        let isSpoof = false;
        let pulseFactor = 0;

        if (trig.mode === "spoof" && t - trig.startAt < 4.2) {
          // Spoof replay flatline: zero blink closure, crimson rejection
          blinkClosure = 0;
          currentEar = 0.311;
          blinkCountLabel = "0 / 2";
          stateLabel = "SPOOF BLOCKED";
          isSpoof = true;
          wireMat.color.set("#ef4444");
          ringMat.color.set("#ef4444");
          scanLineMat.color.set("#ef4444");
        } else {
          if (trig.mode === "spoof") trig.mode = "auto";
          wireMat.color.set("#14b88a");
          ringMat.color.set("#14b88a");
          scanLineMat.color.set("#14b88a");

          const cycle = trig.mode === "blink" ? t - trig.startAt : t % 5.2;
          if (trig.mode === "blink" && cycle > 4.2) trig.mode = "auto";

          // Blink 1 at ~1.1s, Blink 2 at ~1.65s
          const b1 = Math.exp(-Math.pow((cycle - 1.1) / 0.11, 2));
          const b2 = Math.exp(-Math.pow((cycle - 1.65) / 0.11, 2));
          blinkClosure = Math.min(1, b1 + b2);
          currentEar = 0.314 - blinkClosure * 0.175 + Math.sin(t * 7) * 0.004;

          if (cycle < 1.0) {
            blinkCountLabel = "0 / 2";
            stateLabel = "CHALLENGE: BLINK";
          } else if (cycle < 1.58) {
            blinkCountLabel = "1 / 2";
            stateLabel = "EAR DIP #1 (<0.21)";
          } else {
            blinkCountLabel = "2 / 2";
            stateLabel = "VERIFIED · 512-D";
            if (cycle >= 1.72 && cycle <= 3.1) {
              pulseFactor = (cycle - 1.72) / 1.38;
            }
          }
        }

        // Deform 468 vertices: subtle depth breath + synchronized eyelid closure
        const posAttr = pointGeo.getAttribute("position");
        for (let i = 0; i < vIdx; i++) {
          const bx = basePositions[i * 3];
          const by = basePositions[i * 3 + 1];
          const bz = basePositions[i * 3 + 2];
          const wave = Math.sin(t * 2.2 - by * 2.4) * 0.012;
          posAttr.array[i * 3] = bx;
          posAttr.array[i * 3 + 1] = by;
          posAttr.array[i * 3 + 2] = bz + wave;
        }
        for (let e = 0; e < eyelidMeta.length; e++) {
          const m = eyelidMeta[e];
          posAttr.array[m.idx * 3 + 1] += m.sign * m.amp * blinkClosure;
        }
        posAttr.needsUpdate = true;

        // Laser scan sweep & Verified emerald ring wave
        scanLine.position.y = Math.sin(t * 1.55) * 1.12;
        verifiedRing.rotation.z = t * 0.18;

        if (pulseFactor > 0) {
          const s = 1 + pulseFactor * 0.28;
          pulseRing.scale.set(s, s, 1);
          pulseRingMat.opacity = (1 - pulseFactor) * 0.65;
        } else {
          pulseRingMat.opacity = 0;
        }

        if (t - lastHudTick > 0.09) {
          lastHudTick = t;
          setHud({
            ear: currentEar.toFixed(3),
            blinks: blinkCountLabel,
            cosine: isSpoof ? "—" : "0.946",
            state: stateLabel,
            isSpoof,
          });
        }

        renderer.render(scene, camera);
      };
      animate();

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onPointerMove);
        pointGeo.dispose();
        wireGeo.dispose();
        ringGeo.dispose();
        pulseRingGeo.dispose();
        scanLineGeo.dispose();
        renderer.dispose();
      };
    } catch {
      setWebglOk(false);
      return undefined;
    }
  }, []);

  const triggerAction = (mode) => {
    triggerModeRef.current = {
      mode,
      startAt: performance.now() / 1000,
    };
    if (!webglOk) {
      if (mode === "spoof") {
        setHud({
          ear: "0.311",
          blinks: "0 / 2",
          cosine: "—",
          state: "SPOOF BLOCKED",
          isSpoof: true,
        });
      } else {
        setHud({
          ear: "0.154",
          blinks: "2 / 2",
          cosine: "0.946",
          state: "VERIFIED · 512-D",
          isSpoof: false,
        });
      }
    }
  };

  return (
    <div className="attend-glass rounded-2xl overflow-hidden flex flex-col justify-between min-h-[510px] shadow-[0_32px_80px_rgba(0,0,0,0.65)]">
      {/* Top Biometric Sensor HUD */}
      <div className="px-5 py-3.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-black/40 attend-mono text-xs">
        <span className="text-[#b6c4be]">MEDIAPIPE · 468 3D LANDMARKS</span>
        <span
          className={`font-semibold px-2.5 py-0.5 rounded ${
            hud.isSpoof
              ? "bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/40"
              : "bg-[#14b88a]/15 text-[#14b88a] border border-[#14b88a]/40"
          }`}
        >
          {hud.state}
        </span>
      </div>

      {/* 3D Topology Viewport */}
      <div ref={mountRef} className="relative flex-1 min-h-[380px] w-full">
        {webglOk ? (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full block"
            aria-label="Interactive 3D 468-landmark biometric face mesh"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center p-6">
            <svg
              viewBox="0 0 420 360"
              className="w-full h-full max-h-[340px]"
              fill="none"
              role="img"
              aria-label="468-landmark biometric face topology fallback"
            >
              <circle
                cx="210"
                cy="180"
                r="142"
                stroke={hud.isSpoof ? "#ef4444" : "#14b88a"}
                strokeOpacity="0.45"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
              <ellipse
                cx="210"
                cy="180"
                rx="88"
                ry="116"
                stroke="#f2f5f3"
                strokeOpacity="0.55"
                strokeWidth="1.4"
              />
              <path
                d="M150 155 Q175 142 195 155 Q175 166 150 155 Z M225 155 Q245 142 270 155 Q245 166 225 155 Z"
                stroke="#14b88a"
                strokeWidth="2"
              />
              <path
                d="M210 120 L210 205 M182 232 Q210 246 238 232 M132 180 L288 180"
                stroke="#14b88a"
                strokeOpacity="0.4"
                strokeWidth="1.2"
              />
            </svg>
          </div>
        )}

        {/* Interactive Trigger Controls inside Viewport Bottom-Right */}
        <div className="absolute bottom-3.5 right-3.5 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => triggerAction("blink")}
            className="px-3 py-1.5 rounded-lg bg-[#14b88a]/20 hover:bg-[#14b88a]/35 border border-[#14b88a]/50 text-[#f2f5f3] attend-mono text-[11px] font-semibold transition cursor-pointer"
          >
            {lang === "vi" ? "Quét Chớp Mắt ×2" : "Trigger 2-Blink"}
          </button>
          <button
            type="button"
            onClick={() => triggerAction("spoof")}
            className="px-3 py-1.5 rounded-lg bg-[#ef4444]/15 hover:bg-[#ef4444]/30 border border-[#ef4444]/45 text-[#fca5a5] attend-mono text-[11px] font-semibold transition cursor-pointer"
          >
            {lang === "vi" ? "Thử Ảnh Giả" : "Test Spoof"}
          </button>
        </div>
      </div>

      {/* Bottom Telemetry Readout Bar */}
      <div className="px-5 py-3 border-t border-white/10 grid grid-cols-3 gap-3 bg-black/45 attend-mono text-xs">
        <div>
          <span className="block text-[10px] text-[#788a83]">EAR APERTURE</span>
          <strong className={hud.isSpoof ? "text-[#ef4444]" : "text-[#f2f5f3]"}>
            {hud.ear}
          </strong>
        </div>
        <div>
          <span className="block text-[10px] text-[#788a83]">LIVENESS BLINKS</span>
          <strong className={hud.isSpoof ? "text-[#ef4444]" : "text-[#14b88a]"}>
            {hud.blinks}
          </strong>
        </div>
        <div className="text-right">
          <span className="block text-[10px] text-[#788a83]">FACENET512 COS</span>
          <strong className="text-[#14b88a]">{hud.cosine}</strong>
        </div>
      </div>
    </div>
  );
}
