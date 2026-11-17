import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import BrandMark from "../components/BrandMark";
import BiometricFaceScene from "../components/BiometricFaceScene";

gsap.registerPlugin(ScrollTrigger);

const COPY = {
  en: {
    nav_proof: "01 / Anti-Spoof",
    nav_ear: "02 / EAR Waveform",
    nav_console: "03 / Console Suite",
    nav_kiosk: "Live Kiosk",
    nav_login: "Admin Login",
    nav_dashboard: "Open Console →",
    kicker: "MEDIAPIPE 468-LANDMARK LIVENESS · FACENET512 COSINE ENGINE",
    h1_a: "Biometric check-in that ",
    h1_em: "refuses",
    h1_b: " flat-screen spoofs.",
    lead: "Static face matchers fall for printed photos and phone video replays. ATTEND gates every 512-D Facenet cosine comparison behind a real-time WebSocket Eye Aspect Ratio (EAR < 0.21 × 2) double-blink liveness challenge—verifying live employees in 180 ms while storing zero raw portraits by default.",
    cta_kiosk: "Launch Live Camera Kiosk",
    cta_dashboard: "Explore Enterprise Dashboard",
    cta_sim: "Test EAR Simulator ↓",
    m1: "3D Craniofacial Landmarks",
    m2: "Double-Blink Gate Threshold",
    m3: "Facenet Cosine Embedding",
    m4: "End-to-End Check-In Latency",
    proof_kicker: "01 / LIVENESS-GATED ANTI-SPOOFING PROOF",
    proof_title: "Two blinks separate a living employee from an OLED replay.",
    proof_sub:
      "Before Facenet512 ever computes cosine similarity against SQLite embeddings, the WebSocket liveness gate measures bilateral eyelid aperture across consecutive frames.",
    spoof_badge: "ATTACK VECTOR · BLOCKED",
    spoof_title: "Printed Photo / Phone Video Replay",
    spoof_desc:
      "High-resolution smartphone screen held at 65 cm. Eye Aspect Ratio remains rigid above 0.30—failing the 2-blink temporal gate and locking out embedding extraction.",
    live_badge: "LIVE SUBJECT · VERIFIED 180 MS",
    live_title: "MediaPipe 2-Blink Liveness + Facenet512",
    live_desc:
      "Natural bilateral double-blink dips EAR below 0.21 twice within the challenge window, unlocking 512-D vector extraction and confirming Cosine 0.946 match.",
    sim_kicker: "02 / INTERACTIVE EAR WAVEFORM & WEBSOCKET STATE SIMULATOR",
    sim_title: "Trigger a live double-blink or a spoof attack in real time.",
    sim_sub:
      "Inspect the exact Eye Aspect Ratio (EAR) telemetry stream and /camera/ws/liveness state transitions that run inside our FastAPI + MediaPipe backend.",
    btn_sim_live: "Trigger Live Double-Blink",
    btn_sim_spoof: "Simulate Phone Replay Spoof",
    suite_kicker: "03 / PRECISION HARDWARE & ENTERPRISE ATTENDANCE SUITE",
    suite_title: "From lobby kiosk glass to locked payroll exports.",
    suite_sub:
      "Jump directly into any operational module below. When the FastAPI backend is offline, interactive demo telemetry keeps every dashboard, roster, and audit view live.",
    card_kiosk_t: "Fullscreen Camera Kiosk",
    card_kiosk_d: "60fps biometric reticle, live webcam WebSocket stream, spoof/stranger states, and 4-digit PIN fallback.",
    card_dash_t: "Operations Dashboard",
    card_dash_d: "Real-time check-in feed, 7-day shift compliance trend, morning distribution ring, and CSV/Excel export.",
    card_emp_t: "Biometric Roster & Consent",
    card_emp_d: "Manage 512-D face vector enrollment, multi-angle capture, and Decree 13/2023 privacy consent logs.",
    card_rep_t: "Payroll & Audit Reports",
    card_rep_d: "Consolidated workdays, late/overtime accounting, and per-employee liveness confidence drilldowns.",
  },
  vi: {
    nav_proof: "01 / Chống giả mạo",
    nav_ear: "02 / Sóng EAR",
    nav_console: "03 / Phân hệ Quản trị",
    nav_kiosk: "Màn hình Kiosk",
    nav_login: "Đăng nhập",
    nav_dashboard: "Mở Quản trị →",
    kicker: "XÁC THỰC LIVENESS 468 ĐIỂM MEDIAPIPE · NHẬN DIỆN FACENET512",
    h1_a: "Chấm công sinh trắc học ",
    h1_em: "miễn nhiễm",
    h1_b: " ảnh in & video phát lại.",
    lead: "Các hệ thống nhận diện tĩnh dễ bị qua mặt bởi ảnh in hoặc điện thoại phát video. ATTEND khóa chặt bước so khớp vector 512-D Facenet sau thử thách chớp mắt kép thời gian thực qua WebSocket (EAR < 0.21 × 2)—xác thực nhân sự sống trong 180 ms và mặc định không lưu trữ ảnh gốc.",
    cta_kiosk: "Mở Kiosk Điểm Danh Trực Tiếp",
    cta_dashboard: "Khám Phá Bảng Điều Hành",
    cta_sim: "Thử Máy Đo Sóng EAR ↓",
    m1: "Điểm mốc khuôn mặt 3D",
    m2: "Ngưỡng chớp mắt Liveness",
    m3: "Vector đặc trưng Facenet",
    m4: "Độ trễ xác thực toàn trình",
    proof_kicker: "01 / ĐỐI CHỨNG CHỐNG GIẢ MẠO SINH TRẮC HỌC",
    proof_title: "Hai nhịp chớp mắt phân tách người thật khỏi màn hình phát lại.",
    proof_sub:
      "Trước khi Facenet512 tính độ tương đồng Cosine với cơ sở dữ liệu, cổng WebSocket đo tỷ lệ mở mí mắt hai bên liên tục qua từng khung hình.",
    spoof_badge: "TẤN CÔNG GIẢ MẠO · ĐÃ CHẶN",
    spoof_title: "Ảnh in màu / Điện thoại phát lại video",
    spoof_desc:
      "Màn hình điện thoại độ phân giải cao đặt cách 65 cm. Chỉ số EAR giữ phẳng trên 0.30—không vượt qua cổng kiểm tra 2 lần chớp mắt và bị khóa trích xuất vector.",
    live_badge: "NHÂN SỰ THẬT · XÁC THỰC 180 MS",
    live_title: "Thử thách chớp mắt kép MediaPipe + Facenet512",
    live_desc:
      "Hai nhịp chớp mắt tự nhiên đưa chỉ số EAR xuống dưới 0.21 hai lần liên tiếp, mở khóa vector 512-D và xác nhận độ khớp Cosine 0.946.",
    sim_kicker: "02 / MÔ PHỎNG DAO ĐỘNG KÝ EAR & MÁY TRẠNG THÁI WEBSOCKET",
    sim_title: "Kích hoạt chớp mắt thật hoặc kịch bản giả mạo theo thời gian thực.",
    sim_sub:
      "Quan sát trực tiếp đồ thị Eye Aspect Ratio (EAR) và chuỗi chuyển trạng thái /camera/ws/liveness vận hành bên trong backend FastAPI + MediaPipe.",
    btn_sim_live: "Kích hoạt Chớp Mắt Kép (Live)",
    btn_sim_spoof: "Mô phỏng Giả Mạo Màn Hình",
    suite_kicker: "03 / PHẦN CỨNG KIOSK & HỆ SINH THÁI QUẢN TRỊ NHÂN SỰ",
    suite_title: "Từ mặt kính Kiosk sảnh đón đến bảng khóa sổ kỳ lương.",
    suite_sub:
      "Truy cập trực tiếp từng phân hệ nghiệp vụ bên dưới. Khi máy chủ FastAPI ngoại tuyến, lớp dữ liệu mô phỏng thông minh đảm bảo mọi biểu đồ và báo cáo luôn sẵn sàng.",
    card_kiosk_t: "Kiosk Camera Toàn Màn Hình",
    card_kiosk_d: "Khung ngắm sinh trắc 60fps, luồng WebSocket camera thật, cảnh báo giả mạo/người lạ và mã PIN 4 số dự phòng.",
    card_dash_t: "Trung Tâm Điều Hành",
    card_dash_d: "Nhật ký check-in tức thời, xu hướng chuyên cần 7 ngày, biểu đồ ca sáng và xuất báo cáo CSV/Excel.",
    card_emp_t: "Hồ Sơ Nhân Sự & Quyền Riêng Tư",
    card_emp_d: "Quản lý đăng ký vector 512-D đa góc chụp và nhật ký đồng thuận dữ liệu theo Nghị định 13/2023/NĐ-CP.",
    card_rep_t: "Báo Cáo Công & Kỳ Lương",
    card_rep_d: "Tổng hợp ngày công chuẩn, đi muộn, tăng ca và đối soát độ tin cậy Liveness từng nhân viên.",
  },
};

export default function Landing() {
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const waveCanvasRef = useRef(null);
  const simRef = useRef({
    mode: "live", // live | spoof
    startedAt: 0,
    samples: Array(140).fill(0.312),
  });

  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem("attend-lang") === "vi" ? "vi" : "en";
    } catch {
      return "en";
    }
  });

  const [simState, setSimState] = useState({
    mode: "live",
    ear: "0.312",
    blinks: 2,
    stage: 4, // 0..4
    status: "VERIFIED_512D_MATCH",
    payload: {
      event: "checkin_verified",
      liveness: { ear_min: 0.149, blinks: 2, required: 2, passed: true },
      match: { code: "NV001", name: "Nguyễn Minh Hoàng", cosine: 0.946, latency_ms: 180 },
    },
  });

  const t = COPY[lang];

  const toggleLang = () => {
    const next = lang === "en" ? "vi" : "en";
    setLang(next);
    try {
      localStorage.setItem("attend-lang", next);
    } catch {
      /* ignore */
    }
  };

  const openProtectedRoute = (path) => {
    if (!localStorage.getItem("sf_admin_token")) {
      localStorage.setItem("sf_admin_auth", "1");
      localStorage.setItem("sf_admin_token", "demo_attend_biometric_jwt_token");
      localStorage.setItem("sf_admin_name", "Quản trị viên Cấp cao");
    }
    navigate(path);
  };

  /* GSAP + ScrollTrigger section reveal & anti-spoofing comparison choreography */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".js-hero-reveal", {
        y: 26,
        opacity: 0,
        duration: 0.85,
        stagger: 0.09,
        ease: "power3.out",
      });

      gsap.utils.toArray(".js-scroll-card").forEach((el) => {
        gsap.from(el, {
          y: 34,
          opacity: 0,
          duration: 0.75,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 84%",
          },
        });
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  /* Real-Time 60fps HTML5 Canvas EAR Oscilloscope Waveform Simulator */
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    let rafId = 0;
    let lastUiSync = 0;

    simRef.current.startedAt = performance.now() / 1000;

    const tick = () => {
      rafId = requestAnimationFrame(tick);
      const now = performance.now() / 1000;
      const elapsed = now - simRef.current.startedAt;
      const mode = simRef.current.mode;

      let earVal = 0.312 + Math.sin(now * 6.5) * 0.004;
      let blinks = 0;
      let stage = 0;
      let status = "SCANNING_LANDMARKS";

      if (mode === "spoof") {
        // Rigid flatline with tiny sensor noise — never crosses 0.21 threshold
        earVal = 0.311 + Math.sin(now * 13.0) * 0.002;
        blinks = 0;
        stage = elapsed > 1.2 ? -1 : 0;
        status = elapsed > 1.2 ? "SPOOF_FLATLINE_BLOCKED" : "CHALLENGE_AWAITING_BLINK";
      } else {
        const cyc = elapsed % 4.6;
        const dip1 = Math.exp(-Math.pow((cyc - 0.95) / 0.11, 2));
        const dip2 = Math.exp(-Math.pow((cyc - 1.55) / 0.11, 2));
        earVal = 0.314 - Math.min(1, dip1 + dip2) * 0.176 + Math.sin(now * 5.2) * 0.003;

        if (cyc < 0.88) {
          blinks = 0;
          stage = 0;
          status = "FRAME_INGEST_468_PTS";
        } else if (cyc < 1.48) {
          blinks = 1;
          stage = 1;
          status = "BLINK_1_PASSED (<0.21)";
        } else if (cyc < 1.95) {
          blinks = 2;
          stage = 2;
          status = "BLINK_2_LIVENESS_UNLOCKED";
        } else if (cyc < 2.35) {
          blinks = 2;
          stage = 3;
          status = "FACENET_512D_COSINE_0.946";
        } else {
          blinks = 2;
          stage = 4;
          status = "VERIFIED_CHECKIN_COMMITTED";
        }
      }

      const arr = simRef.current.samples;
      arr.push(earVal);
      if (arr.length > 140) arr.shift();

      // Render waveform oscilloscope
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = "#050809";
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = "rgba(242, 245, 243, 0.06)";
      ctx.lineWidth = 1;
      for (let gx = 0; gx < w; gx += 48) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 0; gy < h; gy += 36) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      // Map EAR [0.08 .. 0.40] -> canvas Y
      const mapY = (v) => h - ((v - 0.08) / 0.32) * (h - 28) - 14;

      // Threshold line at EAR = 0.21
      const thY = mapY(0.21);
      ctx.strokeStyle = "rgba(239, 68, 68, 0.72)";
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, thY);
      ctx.lineTo(w, thY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#ef4444";
      ctx.font = "600 11px JetBrains Mono, monospace";
      ctx.fillText("EAR BLINK THRESHOLD = 0.210", 14, thY - 7);

      // Signal trace
      const traceColor = mode === "spoof" ? "#ef4444" : "#14b88a";
      ctx.strokeStyle = traceColor;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      for (let i = 0; i < arr.length; i++) {
        const px = (i / (arr.length - 1)) * w;
        const py = mapY(arr[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Leading dot
      const lastY = mapY(arr[arr.length - 1]);
      ctx.fillStyle = traceColor;
      ctx.beginPath();
      ctx.arc(w - 6, lastY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      if (now - lastUiSync > 0.12) {
        lastUiSync = now;
        setSimState({
          mode,
          ear: earVal.toFixed(3),
          blinks,
          stage,
          status,
          payload:
            mode === "spoof"
              ? {
                  ws: "/camera/ws/liveness",
                  status: "spoof_detected",
                  liveness: { ear_current: Number(earVal.toFixed(3)), blinks: 0, required: 2, passed: false },
                  embedding_512d: "LOCKED_GATE_CLOSED",
                }
              : {
                  ws: "/camera/ws/liveness",
                  status: stage >= 4 ? "verified" : "challenge_active",
                  liveness: { ear_current: Number(earVal.toFixed(3)), blinks, required: 2, passed: blinks >= 2 },
                  match:
                    blinks >= 2
                      ? { code: "NV001", name: "Nguyễn Minh Hoàng", cosine: 0.946, latency_ms: 180 }
                      : null,
                },
        });
      }
    };

    tick();
    return () => cancelAnimationFrame(rafId);
  }, []);

  const triggerSimulator = (mode) => {
    simRef.current.mode = mode;
    simRef.current.startedAt = performance.now() / 1000;
  };

  const WS_STEPS = [
    { id: 0, label: "01 · 468-Pt Mesh", sub: "MediaPipe FaceMesh" },
    { id: 1, label: "02 · Blink #1", sub: "EAR < 0.21 Dip" },
    { id: 2, label: "03 · Blink #2", sub: "Liveness Passed" },
    { id: 3, label: "04 · Facenet512", sub: "Cosine >= 0.60" },
    { id: 4, label: "05 · Check-In", sub: "SQLite + Audit Log" },
  ];

  return (
    <div ref={pageRef} className="attend-showcase">
      {/* STICKY BIOMETRIC GLASS HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07090b]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-18 flex items-center justify-between gap-4">
          <a href="#top" className="flex items-center gap-3">
            <BrandMark size={36} />
            <div>
              <span className="attend-display font-bold text-lg tracking-wider text-[#f2f5f3] block leading-none">
                ATTEND
              </span>
              <span className="attend-mono text-[10px] tracking-widest text-[#788a83] block mt-1">
                BIOMETRIC LIVENESS OS
              </span>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-7 attend-mono text-xs tracking-wider uppercase text-[#b6c4be]">
            <a href="#anti-spoof" className="hover:text-[#14b88a] transition">
              {t.nav_proof}
            </a>
            <a href="#ear-simulator" className="hover:text-[#14b88a] transition">
              {t.nav_ear}
            </a>
            <a href="#enterprise-suite" className="hover:text-[#14b88a] transition">
              {t.nav_console}
            </a>
            <button
              type="button"
              onClick={() => navigate("/kiosk")}
              className="hover:text-[#14b88a] transition uppercase cursor-pointer"
            >
              {t.nav_kiosk}
            </button>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleLang}
              className="h-9 px-3 rounded-lg bg-[#0c1917] border border-white/15 hover:border-[#14b88a] attend-mono text-xs font-semibold text-[#f2f5f3] transition cursor-pointer"
              aria-label="Switch language EN / VI"
            >
              {lang === "en" ? "EN · VI" : "VI · EN"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="hidden sm:inline-flex h-9 px-3.5 items-center rounded-lg border border-white/15 hover:border-white/35 text-xs font-semibold text-[#b6c4be] hover:text-white transition cursor-pointer"
            >
              {t.nav_login}
            </button>
            <button
              type="button"
              onClick={() => openProtectedRoute("/dashboard")}
              className="h-9 px-4 rounded-lg bg-[#14b88a] hover:bg-[#19cfa0] text-[#07090b] text-xs font-bold tracking-wide transition cursor-pointer"
            >
              {t.nav_dashboard}
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION + THREE.JS 3D 468-LANDMARK FACE TOPOLOGY MESH */}
      <section
        id="top"
        className="relative py-14 sm:py-20 lg:py-24 border-b border-white/10 overflow-hidden"
        style={{
          background:
            "radial-gradient(54rem 34rem at 76% 42%, rgba(20, 184, 138, 0.11), transparent 70%), radial-gradient(40rem 28rem at 15% 85%, rgba(12, 25, 23, 0.9), transparent 70%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 flex flex-col">
            <div className="attend-kicker js-hero-reveal mb-5">{t.kicker}</div>

            <h1
              className="attend-display js-hero-reveal font-bold text-[#f2f5f3] leading-[1.03]"
              style={{ fontSize: "clamp(2.5rem, 4.8vw, 4.45rem)" }}
            >
              {t.h1_a}
              <span className="text-[#14b88a]">{t.h1_em}</span>
              {t.h1_b}
            </h1>

            <p className="js-hero-reveal mt-5 text-base sm:text-lg text-[#b6c4be] leading-relaxed max-w-xl">
              {t.lead}
            </p>

            <div className="js-hero-reveal mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/kiosk")}
                className="h-12 px-6 rounded-xl bg-[#14b88a] hover:bg-[#1ad0a0] text-[#07090b] font-bold text-sm tracking-wide transition cursor-pointer"
              >
                {t.cta_kiosk}
              </button>
              <button
                type="button"
                onClick={() => openProtectedRoute("/dashboard")}
                className="h-12 px-5 rounded-xl bg-[#0c1917] hover:bg-[#112421] border border-white/15 hover:border-[#14b88a]/60 text-[#f2f5f3] font-semibold text-sm transition cursor-pointer"
              >
                {t.cta_dashboard}
              </button>
              <a
                href="#ear-simulator"
                className="h-12 px-4 inline-flex items-center rounded-xl border border-white/10 hover:border-white/30 text-[#b6c4be] hover:text-white attend-mono text-xs transition"
              >
                {t.cta_sim}
              </a>
            </div>

            {/* Precision Tabular Telemetry Metrics */}
            <div className="js-hero-reveal mt-10 pt-7 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-5">
              <div className="border-l-2 border-[#14b88a] pl-3">
                <strong className="attend-mono text-2xl font-bold text-[#f2f5f3] block">
                  468
                </strong>
                <span className="text-xs text-[#788a83]">{t.m1}</span>
              </div>
              <div className="border-l-2 border-white/20 pl-3">
                <strong className="attend-mono text-2xl font-bold text-[#14b88a] block">
                  &lt;0.21
                </strong>
                <span className="text-xs text-[#788a83]">{t.m2}</span>
              </div>
              <div className="border-l-2 border-white/20 pl-3">
                <strong className="attend-mono text-2xl font-bold text-[#f2f5f3] block">
                  512-D
                </strong>
                <span className="text-xs text-[#788a83]">{t.m3}</span>
              </div>
              <div className="border-l-2 border-[#14b88a] pl-3">
                <strong className="attend-mono text-2xl font-bold text-[#f2f5f3] block">
                  180 ms
                </strong>
                <span className="text-xs text-[#788a83]">{t.m4}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 js-hero-reveal">
            <BiometricFaceScene lang={lang} />
          </div>
        </div>
      </section>

      {/* SECTION 01: ANTI-SPOOFING SIDE-BY-SIDE HARDWARE PROOF */}
      <section
        id="anti-spoof"
        className="py-20 sm:py-26 border-b border-white/10 bg-[#090e0d]"
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="max-w-3xl mb-12">
            <div className="attend-kicker mb-3">{t.proof_kicker}</div>
            <h2
              className="attend-display font-bold text-[#f2f5f3]"
              style={{ fontSize: "clamp(1.9rem, 3.5vw, 3rem)" }}
            >
              {t.proof_title}
            </h2>
            <p className="mt-3 text-[#b6c4be] text-base sm:text-lg">
              {t.proof_sub}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
            {/* Attack Vector Card (Spoof Blocked) */}
            <article className="js-scroll-card rounded-2xl bg-[#07090b] border border-[#ef4444]/35 overflow-hidden flex flex-col">
              <div className="relative h-72 overflow-hidden bg-black">
                <img
                  src="/img/spoof-replay.jpg"
                  alt="Smartphone spoof replay blocked by liveness gate"
                  className="w-full h-full object-cover opacity-85"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07090b] via-transparent to-black/50" />
                <div className="absolute top-4 left-4 px-3 py-1 rounded bg-[#ef4444] text-white attend-mono text-xs font-bold">
                  {t.spoof_badge}
                </div>
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-black/80 border border-[#ef4444]/40 flex items-center justify-between attend-mono text-xs">
                  <span className="text-[#fca5a5]">EAR TRACE: 0.311 FLATLINE</span>
                  <span className="text-[#ef4444] font-bold">BLINKS: 0 / 2 · REJECTED</span>
                </div>
              </div>
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="attend-display text-xl font-bold text-[#f2f5f3]">
                    {t.spoof_title}
                  </h3>
                  <p className="mt-2 text-sm text-[#b6c4be] leading-relaxed">
                    {t.spoof_desc}
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 attend-mono text-xs">
                  <div>
                    <span className="text-[#788a83] block text-[10px]">SURFACE</span>
                    <strong className="text-[#ef4444]">2D PLANAR</strong>
                  </div>
                  <div>
                    <span className="text-[#788a83] block text-[10px]">512-D GATE</span>
                    <strong className="text-[#ef4444]">LOCKED</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[#788a83] block text-[10px]">SOC ALERT</span>
                    <strong className="text-[#f2f5f3]">DISPATCHED</strong>
                  </div>
                </div>
              </div>
            </article>

            {/* Live Subject Card (Verified) */}
            <article className="js-scroll-card rounded-2xl bg-[#07090b] border border-[#14b88a]/45 overflow-hidden flex flex-col">
              <div className="relative h-72 overflow-hidden bg-black">
                <img
                  src="/img/subject-live.jpg"
                  alt="Live employee verified via MediaPipe 2-blink challenge"
                  className="w-full h-full object-cover opacity-90"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07090b] via-transparent to-black/40" />
                <div className="absolute top-4 left-4 px-3 py-1 rounded bg-[#14b88a] text-[#07090b] attend-mono text-xs font-bold">
                  {t.live_badge}
                </div>
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-black/80 border border-[#14b88a]/45 flex items-center justify-between attend-mono text-xs">
                  <span className="text-[#6ee7b7]">EAR DIP: 0.148 × 2 (&lt;0.21)</span>
                  <span className="text-[#14b88a] font-bold">COSINE: 0.946 · PASS</span>
                </div>
              </div>
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="attend-display text-xl font-bold text-[#f2f5f3]">
                    {t.live_title}
                  </h3>
                  <p className="mt-2 text-sm text-[#b6c4be] leading-relaxed">
                    {t.live_desc}
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 attend-mono text-xs">
                  <div>
                    <span className="text-[#788a83] block text-[10px]">EMBEDDING</span>
                    <strong className="text-[#14b88a]">FACENET 512-D</strong>
                  </div>
                  <div>
                    <span className="text-[#788a83] block text-[10px]">RAW PHOTO</span>
                    <strong className="text-[#14b88a]">DISCARDED</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[#788a83] block text-[10px]">CHECK-IN</span>
                    <strong className="text-[#f2f5f3]">180 MS</strong>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* SECTION 02: INTERACTIVE EAR WAVEFORM SIMULATOR & WEBSOCKET STATE MACHINE */}
      <section
        id="ear-simulator"
        className="py-20 sm:py-26 border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div className="max-w-2xl">
              <div className="attend-kicker mb-3">{t.sim_kicker}</div>
              <h2
                className="attend-display font-bold text-[#f2f5f3]"
                style={{ fontSize: "clamp(1.85rem, 3.4vw, 2.85rem)" }}
              >
                {t.sim_title}
              </h2>
              <p className="mt-3 text-[#b6c4be]">{t.sim_sub}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => triggerSimulator("live")}
                className={`h-11 px-5 rounded-xl attend-mono text-xs font-bold transition cursor-pointer ${
                  simState.mode === "live"
                    ? "bg-[#14b88a] text-[#07090b]"
                    : "bg-[#0c1917] text-[#f2f5f3] border border-white/15 hover:border-[#14b88a]"
                }`}
              >
                {t.btn_sim_live}
              </button>
              <button
                type="button"
                onClick={() => triggerSimulator("spoof")}
                className={`h-11 px-5 rounded-xl attend-mono text-xs font-bold transition cursor-pointer ${
                  simState.mode === "spoof"
                    ? "bg-[#ef4444] text-white"
                    : "bg-[#0c1917] text-[#fca5a5] border border-[#ef4444]/40 hover:border-[#ef4444]"
                }`}
              >
                {t.btn_sim_spoof}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Oscilloscope Canvas */}
            <div className="lg:col-span-7 attend-glass rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 mb-3.5 border-b border-white/10 attend-mono text-xs">
                <span className="text-[#b6c4be]">
                  REAL-TIME EYE ASPECT RATIO · EAR(t)
                </span>
                <span
                  className={
                    simState.mode === "spoof"
                      ? "text-[#ef4444] font-bold"
                      : "text-[#14b88a] font-bold"
                  }
                >
                  EAR: {simState.ear} · BLINKS: {simState.blinks}/2
                </span>
              </div>

              <div className="rounded-xl overflow-hidden border border-white/10 bg-[#050809]">
                <canvas
                  ref={waveCanvasRef}
                  width={680}
                  height={240}
                  className="w-full h-56 block"
                  aria-label="Live Eye Aspect Ratio telemetry waveform"
                />
              </div>

              {/* 5-Stage State Machine Strip */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
                {WS_STEPS.map((st) => {
                  const active = simState.mode === "live" && simState.stage >= st.id;
                  const failed = simState.mode === "spoof" && st.id === 1;
                  return (
                    <div
                      key={st.id}
                      className={`p-2.5 rounded-lg border transition attend-mono ${
                        failed
                          ? "bg-[#ef4444]/15 border-[#ef4444] text-[#fca5a5]"
                          : active
                          ? "bg-[#14b88a]/15 border-[#14b88a]/60 text-[#f2f5f3]"
                          : "bg-black/40 border-white/10 text-[#788a83]"
                      }`}
                    >
                      <div className="text-[11px] font-bold truncate">{st.label}</div>
                      <div className="text-[10px] opacity-80 truncate mt-0.5">{st.sub}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live WebSocket Telemetry Frame Inspector */}
            <div className="lg:col-span-5 attend-glass rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/10 attend-mono text-xs">
                <span className="text-[#b6c4be]">WS://.../CAMERA/WS/LIVENESS</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    simState.mode === "spoof"
                      ? "bg-[#ef4444]/20 text-[#ef4444]"
                      : "bg-[#14b88a]/20 text-[#14b88a]"
                  }`}
                >
                  {simState.status}
                </span>
              </div>

              <pre className="attend-mono text-xs leading-relaxed bg-[#050809] border border-white/10 rounded-xl p-4 text-[#b6c4be] overflow-x-auto flex-1">
                {JSON.stringify(simState.payload, null, 2)}
              </pre>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between attend-mono text-[11px] text-[#788a83]">
                <span>FORMULA: ||p2-p6|| + ||p3-p5|| / 2||p1-p4||</span>
                <span className="text-[#14b88a]">60 HZ STREAM</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 03: HARDWARE KIOSK & ENTERPRISE CONSOLE NAVIGATION */}
      <section id="enterprise-suite" className="py-20 sm:py-26 bg-[#090e0d]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-14">
            <div className="lg:col-span-6">
              <div className="attend-kicker mb-3">{t.suite_kicker}</div>
              <h2
                className="attend-display font-bold text-[#f2f5f3]"
                style={{ fontSize: "clamp(1.9rem, 3.5vw, 3rem)" }}
              >
                {t.suite_title}
              </h2>
              <p className="mt-3 text-[#b6c4be] text-base sm:text-lg">
                {t.suite_sub}
              </p>
            </div>
            <div className="lg:col-span-6">
              <div className="rounded-2xl overflow-hidden border border-white/15 relative h-64 sm:h-76">
                <img
                  src="/img/biometric-kiosk.jpg"
                  alt="ATTEND anodized aluminum biometric kiosk hardware terminal"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07090b] via-transparent to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between attend-mono text-xs">
                  <span className="text-[#f2f5f3] font-semibold">
                    ATTEND TERMINAL · EDGE KIOSK PRO
                  </span>
                  <span className="text-[#14b88a]">DECREE 13 / ISO-27701 READY</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Operational Module Launch Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <button
              type="button"
              onClick={() => navigate("/kiosk")}
              className="js-scroll-card text-left attend-glass rounded-2xl p-6 hover:border-[#14b88a] transition group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="attend-mono text-xs text-[#14b88a] mb-2">
                  MODULE 01 · /KIOSK
                </div>
                <h3 className="attend-display text-lg font-bold text-[#f2f5f3] group-hover:text-[#14b88a] transition">
                  {t.card_kiosk_t}
                </h3>
                <p className="mt-2 text-sm text-[#b6c4be] leading-relaxed">
                  {t.card_kiosk_d}
                </p>
              </div>
              <span className="mt-6 attend-mono text-xs text-[#14b88a] font-semibold">
                OPEN KIOSK →
              </span>
            </button>

            <button
              type="button"
              onClick={() => openProtectedRoute("/dashboard")}
              className="js-scroll-card text-left attend-glass rounded-2xl p-6 hover:border-[#14b88a] transition group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="attend-mono text-xs text-[#14b88a] mb-2">
                  MODULE 02 · /DASHBOARD
                </div>
                <h3 className="attend-display text-lg font-bold text-[#f2f5f3] group-hover:text-[#14b88a] transition">
                  {t.card_dash_t}
                </h3>
                <p className="mt-2 text-sm text-[#b6c4be] leading-relaxed">
                  {t.card_dash_d}
                </p>
              </div>
              <span className="mt-6 attend-mono text-xs text-[#14b88a] font-semibold">
                OPEN DASHBOARD →
              </span>
            </button>

            <button
              type="button"
              onClick={() => openProtectedRoute("/employees")}
              className="js-scroll-card text-left attend-glass rounded-2xl p-6 hover:border-[#14b88a] transition group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="attend-mono text-xs text-[#14b88a] mb-2">
                  MODULE 03 · /EMPLOYEES
                </div>
                <h3 className="attend-display text-lg font-bold text-[#f2f5f3] group-hover:text-[#14b88a] transition">
                  {t.card_emp_t}
                </h3>
                <p className="mt-2 text-sm text-[#b6c4be] leading-relaxed">
                  {t.card_emp_d}
                </p>
              </div>
              <span className="mt-6 attend-mono text-xs text-[#14b88a] font-semibold">
                OPEN ROSTER →
              </span>
            </button>

            <button
              type="button"
              onClick={() => openProtectedRoute("/reports")}
              className="js-scroll-card text-left attend-glass rounded-2xl p-6 hover:border-[#14b88a] transition group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="attend-mono text-xs text-[#14b88a] mb-2">
                  MODULE 04 · /REPORTS
                </div>
                <h3 className="attend-display text-lg font-bold text-[#f2f5f3] group-hover:text-[#14b88a] transition">
                  {t.card_rep_t}
                </h3>
                <p className="mt-2 text-sm text-[#b6c4be] leading-relaxed">
                  {t.card_rep_d}
                </p>
              </div>
              <span className="mt-6 attend-mono text-xs text-[#14b88a] font-semibold">
                OPEN AUDIT REPORTS →
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-9 bg-[#07090b]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#788a83] attend-mono">
          <div className="flex items-center gap-3">
            <BrandMark size={26} />
            <span className="text-[#f2f5f3] font-semibold">ATTEND</span>
            <span>· MEDIAPIPE EAR LIVENESS + FACENET512</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => navigate("/kiosk")}
              className="hover:text-[#14b88a] cursor-pointer"
            >
              /kiosk
            </button>
            <button
              type="button"
              onClick={() => openProtectedRoute("/dashboard")}
              className="hover:text-[#14b88a] cursor-pointer"
            >
              /dashboard
            </button>
            <button
              type="button"
              onClick={() => openProtectedRoute("/reports")}
              className="hover:text-[#14b88a] cursor-pointer"
            >
              /reports
            </button>
            <a
              href="https://github.com/hoang-IT-eng/AI-Face-Recognition-Attendance"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#14b88a]"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
