import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { WS_LIVENESS_URL, getUsers, manualAttendance } from "../api";

export default function Kiosk() {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const wsRef = useRef(null);
  const timerRef = useRef(null);

  const [clock, setClock] = useState("07:52:10");
  const [dateStr, setDateStr] = useState("Thứ Tư, 24/10/2024");
  const [scenario, setScenario] = useState("success"); // success | spoof | stranger
  const [liveCamera, setLiveCamera] = useState(false);
  const [livenessState, setLivenessState] = useState({
    blink_count: 2,
    required: 2,
    passed: true,
  });
  const [matchedPerson, setMatchedPerson] = useState({
    name: "Nguyễn Văn A",
    code: "NV001",
    dept: "Kỹ thuật",
    time: "07:52:10",
    status: "ĐÃ VÀO",
  });

  // Modal PIN / QR state (Screen 05 Popup)
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinTab, setPinTab] = useState("pin"); // pin | qr
  const [pinValue, setPinValue] = useState("123");
  const [countdown, setCountdown] = useState(15);
  const [users, setUsers] = useState([]);
  const [selectedStaffIdx, setSelectedStaffIdx] = useState(0);

  useEffect(() => {
    getUsers()
      .then((r) => {
        if (r.data?.length) setUsers(r.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
      setDateStr(
        now.toLocaleDateString("vi-VN", {
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!pinModalOpen) return;
    setCountdown(15);
    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setPinModalOpen(false);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [pinModalOpen]);

  useEffect(() => {
    if (!liveCamera) {
      clearInterval(timerRef.current);
      wsRef.current?.close();
      return;
    }

    setLivenessState({ blink_count: 0, required: 2, passed: false });
    const ws = new WebSocket(`${WS_LIVENESS_URL}?mode=checkin`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.liveness) setLivenessState(msg.liveness);
        if (msg.result) {
          if (msg.result.action === "unknown") {
            setScenario("stranger");
          } else if (msg.result.action === "spoof_detected") {
            setScenario("spoof");
          } else {
            setScenario("success");
            setMatchedPerson({
              name: msg.result.name || "Nguyễn Văn A",
              code: msg.result.code || "NV001",
              dept: "Kỹ thuật",
              time: new Date().toLocaleTimeString("vi-VN", { hour12: false }),
              status:
                msg.result.action === "check_out" ? "ĐÃ RA" : "ĐÃ VÀO",
            });
          }
        }
      } catch {}
    };

    timerRef.current = setInterval(() => {
      if (!webcamRef.current || ws.readyState !== WebSocket.OPEN) return;
      const shot = webcamRef.current.getScreenshot();
      if (shot) {
        ws.send(JSON.stringify({ frame: shot.split(",")[1] }));
      }
    }, 120);

    return () => {
      clearInterval(timerRef.current);
      ws.close();
    };
  }, [liveCamera]);

  const activeStaff =
    users[selectedStaffIdx] || {
      id: 1,
      code: "NV045",
      name: "Phạm Quỳnh Như",
      group: "Kế toán",
    };

  const handlePinPress = (digit) => {
    setCountdown(15);
    if (pinValue.length < 4) {
      setPinValue((p) => p + digit);
    }
  };

  const handleConfirmPin = async () => {
    if (pinValue.length < 4) return;
    const nowTime = new Date().toLocaleTimeString("vi-VN", { hour12: false });
    try {
      if (activeStaff.id && users.length > 0) {
        await manualAttendance({
          user_id: activeStaff.id,
          date: new Date().toISOString().slice(0, 10),
          status: "present",
          note: "Xác thực dự phòng bằng mã PIN tại Kiosk Cổng A",
        });
      }
    } catch {}
    setMatchedPerson({
      name: activeStaff.name,
      code: activeStaff.code,
      dept: activeStaff.group || "Kế toán",
      time: nowTime,
      status: "ĐÃ VÀO (PIN)",
    });
    setScenario("success");
    setPinModalOpen(false);
  };

  const blinkRatio = Math.min(
    100,
    Math.round(
      ((livenessState.blink_count || 0) / (livenessState.required || 2)) * 100
    )
  );

  return (
    <main className="w-full h-screen bg-background relative flex flex-col justify-between overflow-hidden select-none">
      {/* Ambient Background */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center blur-md scale-105 opacity-35 pointer-events-none"
        style={{
          backgroundImage:
            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCZCd7GXMwSauD8b08vdPQ-RKFCoQdta-jhqis7HSqb5-KmFNvC_pgOGkNRu_Urm9spmeLALsZP7PA0-uzp9tKOuDee-lrg3djecGJiCLRW_48BhqP5QwlGJLFOSn7vX31tZDgUl6-Afa1lK6QUS8ypcjc2QxYunlMljCDo6OGrAhHyDWirXjbtMIArdBJol9kh0W8ZQnzN4ecLkXgPG1yesMR9U2dIQMvuvYt7BmgZ7UutwQASkB6RyA')",
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-background/80 to-background/90 pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#00687a_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

      {/* Top System Ribbon */}
      <header className="relative z-20 flex items-center justify-between px-8 py-4 w-full">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="px-3 py-1.5 rounded-lg bg-tertiary text-on-tertiary font-code-telemetry text-code-telemetry shadow-xs flex items-center gap-1.5 hover:bg-primary-container cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">
              arrow_back
            </span>
            <span>KIOSK ĐIỂM DANH SINH TRẮC</span>
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-highest shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary-fixed animate-ping"></span>
            <span className="font-label-sm text-label-sm text-secondary">
              Neural Mesh v4.2 • Live Feed Active
            </span>
          </div>
        </div>

        {/* Device Telemetry Pill */}
        <div className="flex items-center gap-4 bg-surface-container-lowest px-4 py-1.5 rounded-xl border border-outline-variant/40 shadow-xs">
          <button
            onClick={() => setLiveCamera((v) => !v)}
            className={`px-2.5 py-1 rounded-lg font-label-sm text-label-sm font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
              liveCamera
                ? "bg-secondary text-on-secondary"
                : "bg-surface-container text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">
              videocam
            </span>
            <span>{liveCamera ? "Camera Thật: Bật" : "Bật Camera Thật"}</span>
          </button>
          <span className="w-1 h-3 rounded-full bg-surface-container-high"></span>
          <div className="flex items-center gap-1 text-on-surface-variant font-code-telemetry text-code-telemetry">
            <span className="material-symbols-outlined text-secondary text-base">
              lens_blur
            </span>
            <span>FPS: 60.1</span>
          </div>
          <span className="w-1 h-3 rounded-full bg-surface-container-high"></span>
          <div className="flex items-center gap-1 text-on-surface-variant font-code-telemetry text-code-telemetry">
            <span className="material-symbols-outlined text-secondary text-base">
              speed
            </span>
            <span>Latency: 14ms</span>
          </div>
          <span className="w-1 h-3 rounded-full bg-surface-container-high"></span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#009668]"></span>
            <span className="font-label-sm text-label-sm text-on-surface font-semibold">
              Online
            </span>
          </div>
        </div>
      </header>

      {/* Instructional Banner */}
      <div className="relative z-20 flex justify-center w-full px-4 -mt-1 mb-2">
        <div className="bg-surface-container-lowest px-6 py-2 rounded-full border border-outline-variant/40 shadow-md flex items-center gap-2.5">
          <span className="material-symbols-outlined text-secondary text-2xl animate-pulse">
            visibility
          </span>
          <p className="font-headline-md text-headline-md text-on-surface tracking-tight text-center">
            Nhìn thẳng vào camera và chớp mắt 2 lần để xác thực
          </p>
        </div>
      </div>

      {/* Center 12-Col Grid */}
      <div className="relative z-10 flex-1 grid grid-cols-12 gap-6 px-8 items-center min-h-0">
        {/* Left Diagnostic Panel (3 cols) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 justify-center">
          <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/40 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant">
                Thuật toán Liveness 3D
              </span>
              <span className="material-symbols-outlined text-secondary text-lg">
                csv
              </span>
            </div>
            <div className="flex items-center gap-4 my-1">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-surface-container-high"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  />
                  <path
                    className="text-[#009668]"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={`${blinkRatio}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
                <span className="absolute font-code-telemetry text-code-telemetry font-bold text-on-surface">
                  {blinkRatio}%
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-title-md text-title-md text-on-surface">
                  Đạt chuẩn ISO/IEC
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  PAD Level 2 Verified
                </span>
              </div>
            </div>

            <div className="bg-surface-container-low p-3 rounded-lg flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-on-surface">
                <span className="font-label-sm text-label-sm">
                  Tiến độ chớp mắt
                </span>
                <span className="font-code-telemetry text-code-telemetry text-[#009668] font-bold">
                  {livenessState.blink_count} / {livenessState.required} lần
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                <div
                  className="h-full bg-[#009668] rounded-full transition-all duration-300"
                  style={{ width: `${blinkRatio}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/40 shadow-xs flex flex-col gap-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Biometric Telemetry
            </span>
            <div className="font-code-telemetry text-body-sm flex flex-col gap-1.5 text-on-surface-variant">
              <div className="flex justify-between">
                <span>Face Bounding:</span>
                <span className="text-on-surface font-semibold">
                  982 x 982 px
                </span>
              </div>
              <div className="flex justify-between">
                <span>Yaw / Pitch:</span>
                <span className="text-on-surface font-semibold">
                  -0.4° / +1.1°
                </span>
              </div>
              <div className="flex justify-between">
                <span>Lighting Exposure:</span>
                <span className="text-[#009668] font-semibold">
                  Tối ưu (420 Lux)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Anti-Spoofing:</span>
                <span
                  className={`font-semibold ${
                    scenario === "spoof" ? "text-error" : "text-[#009668]"
                  }`}
                >
                  {scenario === "spoof" ? "FAIL (2D Screen)" : "PASS (0.002)"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Optical HUD Viewport (6 cols) */}
        <div className="col-span-12 lg:col-span-6 flex flex-col items-center justify-center relative">
          <div className="relative w-full max-w-[820px] aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-[#0b0f19] flex items-center justify-center">
            {liveCamera ? (
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ width: 960, height: 720 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0 bg-cover bg-center contrast-105"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCjv_O08-aUOREjG4kjf4N5EI12PtBIwkOu1pzoECFpxQq4Oao7WqOwpe_R26JW3v8dtyDgIIfVfwCn3AGexfEIautNViOcniuxdMoLQHOlX60PYXVUTomV42Alvik6Z0ToxYqGeJoQTi9anY5ypMK-SVOHQR1vi46_vMGt9X3NPM9C091MRMGdGJQGf9Z8UfB7iKb9I1JT1RPfCsX9CbczrWr_5a-nQh0v83PLdZP42LN34qOt1IIDkQ')",
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(87,223,254,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(87,223,254,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* Biometric HUD Face Reticle */}
            <div className="relative w-[52%] aspect-square flex items-center justify-center">
              <div className="absolute -top-3 -left-3 w-10 h-10 border-t-4 border-l-4 border-secondary-container rounded-tl-lg shadow-[0_0_16px_rgba(87,223,254,0.9)]" />
              <div className="absolute -top-3 -right-3 w-10 h-10 border-t-4 border-r-4 border-secondary-container rounded-tr-lg shadow-[0_0_16px_rgba(87,223,254,0.9)]" />
              <div className="absolute -bottom-3 -left-3 w-10 h-10 border-b-4 border-l-4 border-secondary-container rounded-bl-lg shadow-[0_0_16px_rgba(87,223,254,0.9)]" />
              <div className="absolute -bottom-3 -right-3 w-10 h-10 border-b-4 border-r-4 border-secondary-container rounded-br-lg shadow-[0_0_16px_rgba(87,223,254,0.9)]" />

              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-secondary-fixed/40 -translate-y-1/2 pointer-events-none" />
              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-secondary-fixed/40 -translate-x-1/2 pointer-events-none" />
              <div className="w-16 h-16 rounded-full border border-secondary-fixed/50 animate-ping opacity-30" />

              <div className="absolute inset-x-2 top-0 h-1 bg-gradient-to-r from-transparent via-[#57dffe] to-transparent shadow-[0_0_18px_#57dffe] animate-laser" />

              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-code-telemetry text-secondary-fixed">
                PTS: 128/128 • CONF: 99.8%
              </div>
            </div>

            {/* Top Floating Indicator */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse"></span>
                <span className="font-code-telemetry text-code-telemetry text-white tracking-widest">
                  REC • AI_CAM_01
                </span>
              </div>
              <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-white font-code-telemetry text-code-telemetry">
                <span className="material-symbols-outlined text-secondary-container text-sm">
                  lock_open
                </span>
                <span>SECURE LINK</span>
              </div>
            </div>

            {/* Bottom Verification Ribbon */}
            <div className="absolute bottom-4 inset-x-6 flex justify-between items-center bg-black/75 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2.5 text-white">
                <span className="material-symbols-outlined text-[#009668] text-xl">
                  verified
                </span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-secondary-fixed">
                    Chớp mắt: {livenessState.blink_count} /{" "}
                    {livenessState.required} lần (Đạt chuẩn Liveness)
                  </span>
                  <span className="font-body-sm text-body-sm text-surface-dim">
                    Khoảng cách khuôn mặt tối ưu (65 cm)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-surface-container-highest/30 rounded-full overflow-hidden">
                  <div
                    className="bg-[#009668] h-full rounded-full"
                    style={{ width: `${blinkRatio}%` }}
                  />
                </div>
                <span className="font-code-telemetry text-label-sm text-[#009668] font-bold">
                  {blinkRatio}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Scenario & Verification Cards (3 cols) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 justify-center">
          {/* Scenario Selector */}
          <div className="bg-surface-container-high p-1.5 rounded-xl flex gap-1 shadow-inner">
            <button
              onClick={() => setScenario("success")}
              className={`flex-1 py-1.5 px-2 rounded-lg font-label-sm text-label-sm font-semibold transition-all cursor-pointer ${
                scenario === "success"
                  ? "bg-surface-container-lowest text-on-surface shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Thành công
            </button>
            <button
              onClick={() => setScenario("spoof")}
              className={`flex-1 py-1.5 px-2 rounded-lg font-label-sm text-label-sm font-semibold transition-all cursor-pointer ${
                scenario === "spoof"
                  ? "bg-error text-on-error shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Giả mạo
            </button>
            <button
              onClick={() => setScenario("stranger")}
              className={`flex-1 py-1.5 px-2 rounded-lg font-label-sm text-label-sm font-semibold transition-all cursor-pointer ${
                scenario === "stranger"
                  ? "bg-surface-container-lowest text-error shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Người lạ
            </button>
          </div>

          {/* Scenario 1: Success */}
          {scenario === "success" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-4">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#009668]" />
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-[#009668]/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined material-symbols-filled text-[#009668] text-3xl">
                    check_circle
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-sm text-label-sm text-[#009668] font-bold">
                    Hệ thống mở cửa
                  </span>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                    ĐIỂM DANH THÀNH CÔNG
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-lg">
                <div
                  className="w-14 h-14 rounded-full bg-cover bg-center shrink-0 shadow-xs"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB8AwIqSNeD22La3g8LzUtl_WXhKnhMDou_yiSb5YiJ0BvExNUcck-SxEL6qcYB28nmmKC9ZNOkf6bf8rm0BnjWdkeCXdZnjkgtSyKlcIIzP3wsLbH_UDJydswopcMjvgb5__wC4Nd289kqtFBsC7sX6hcHnv3sn8E7e9og-_KerkY1kckalRAZ94m7Dcgo0H3X6MvWTAYV_vWZAiwv37Ft0wnWXl41vz3jiPEv5Za64oAQsv8Bjh2eyA')",
                  }}
                />
                <div className="flex flex-col min-w-0">
                  <h3 className="font-title-lg text-title-lg text-on-surface font-bold truncate">
                    {matchedPerson.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-code-telemetry text-code-telemetry text-on-surface-variant font-medium">
                      Mã:{" "}
                      <strong className="text-on-surface">
                        {matchedPerson.code}
                      </strong>
                    </span>
                    <span className="w-1 h-3 rounded-full bg-outline-variant" />
                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      Phòng: {matchedPerson.dept}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col bg-surface-container-low p-3 rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Giờ ghi nhận
                  </span>
                  <span className="font-headline-md text-headline-md text-on-surface font-bold">
                    {matchedPerson.time}
                  </span>
                </div>
                <div className="flex flex-col bg-surface-container-low p-3 rounded-lg justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Trạng thái
                  </span>
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#009668]/15 text-[#009668] font-label-lg text-label-lg font-bold">
                      <span className="w-2 h-2 rounded-full bg-[#009668]" />
                      {matchedPerson.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
                <span className="material-symbols-outlined text-secondary text-base">
                  door_sliding
                </span>
                <span>Cửa tự động Cổng A đã nhả chốt khóa từ (4s)</span>
              </div>
            </div>
          )}

          {/* Scenario 2: Spoof */}
          {scenario === "spoof" && (
            <div className="bg-error text-on-error rounded-xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-error text-3xl">
                    gpp_maybe
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-sm text-label-sm text-white/80 font-bold">
                    Cảnh báo An ninh
                  </span>
                  <h2 className="font-title-lg text-title-lg text-on-error font-bold leading-snug">
                    NGHI VẤN GIẢ MẠO
                  </h2>
                </div>
              </div>
              <div className="bg-black/25 p-4 rounded-lg flex flex-col gap-1.5">
                <p className="font-label-lg text-label-lg font-bold text-white">
                  KHÔNG GHI NHẬN — KHUÔN MẶT KHÔNG HỢP LỆ
                </p>
                <p className="font-body-sm text-body-sm text-white/90">
                  Hệ thống phát hiện nguồn hình ảnh từ màn hình điện thoại / ảnh
                  in giấy 2D. Vui lòng xác thực người thật.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-white/80 font-code-telemetry pt-1">
                <span>Error Code: #SP-204</span>
                <span>Security Alert Sent (SOC)</span>
              </div>
            </div>
          )}

          {/* Scenario 3: Stranger */}
          {scenario === "stranger" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-4">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-error" />
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-error text-3xl">
                    person_off
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-sm text-label-sm text-error font-bold">
                    Chưa phân quyền truy cập
                  </span>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                    NGƯỜI LẠ
                  </h2>
                </div>
              </div>
              <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-2">
                <div className="flex items-center gap-2 text-error">
                  <span className="material-symbols-outlined text-lg">
                    warning
                  </span>
                  <span className="font-label-md text-label-md font-bold">
                    Không có dữ liệu trong hệ thống
                  </span>
                </div>
                <p className="font-body-md text-body-md text-on-surface">
                  Vui lòng liên hệ quầy <strong>Lễ tân</strong> hoặc bộ phận{" "}
                  <strong>Nhân sự (HR)</strong> để cấp quyền truy cập hoặc đăng
                  ký khách thăm.
                </p>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
                <span className="material-symbols-outlined text-on-surface-variant text-base">
                  support_agent
                </span>
                <span>
                  Hotline hỗ trợ bảo vệ sảnh: <strong>Ext. 102</strong>
                </span>
              </div>
            </div>
          )}

          <div className="bg-surface-container-low rounded-xl p-4 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-secondary text-xl">
              info
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Đảm bảo không đội mũ sụp trán hoặc đeo kính râm che khuất mắt.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Command Bar */}
      <footer className="relative z-20 flex items-center justify-between px-8 py-4 w-full bg-surface-container-lowest/90 backdrop-blur-md border-t border-outline-variant/40 shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setPinModalOpen(true)}
            className="flex items-center gap-3 px-6 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-high transition-all shadow-xs active:scale-95 group cursor-pointer"
          >
            <span className="material-symbols-outlined text-on-surface text-2xl group-hover:text-secondary transition-colors">
              dialpad
            </span>
            <div className="flex flex-col text-left">
              <span className="font-label-lg text-label-lg text-on-surface font-bold group-hover:text-secondary transition-colors">
                Điểm danh bằng mã PIN / QR
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Dành cho khách hoặc camera lỗi
              </span>
            </div>
          </button>
          <button className="flex items-center gap-2 px-4 py-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all text-on-surface-variant font-label-md text-label-md">
            <span className="material-symbols-outlined text-lg">language</span>
            <span>Tiếng Việt</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 font-code-telemetry">
              <span className="font-headline-xl text-headline-xl font-bold tracking-tight text-on-surface">
                {clock}
              </span>
            </div>
            <div className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant mt-0.5">
              <span className="material-symbols-outlined text-secondary text-sm">
                calendar_today
              </span>
              <span>{dateStr}</span>
              <span className="w-1 h-3 rounded-full bg-outline-variant" />
              <span className="material-symbols-outlined text-secondary text-sm">
                location_on
              </span>
              <span className="font-semibold text-on-surface">
                Kiosk Cổng A (Tòa nhà TechCenter)
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* SCREEN 05 POP-UP: MODAL NHẬP MÃ PIN / QR */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-50 bg-on-surface/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-[790px] bg-surface-container-lowest rounded-[28px] shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="w-full h-1.5 bg-gradient-to-r from-secondary-fixed via-secondary to-primary" />

            <div className="p-8 flex flex-col flex-1 justify-between gap-5">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-secondary-fixed/30 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-headline-md">
                      pin
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">
                        Điểm danh dự phòng bằng Mã PIN / QR
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed/40 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">
                        2FA Zero-Trust
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                      Dành cho nhân viên miễn trừ sinh trắc hoặc khi camera đang
                      hiệu chuẩn
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setPinModalOpen(false)}
                  className="group flex items-center gap-2 pl-4 pr-2 py-2 bg-surface-container-low hover:bg-surface-container transition-all rounded-full text-on-surface cursor-pointer"
                >
                  <div className="flex flex-col text-right">
                    <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                      Quay lại Camera
                    </span>
                    <span className="font-code-telemetry text-label-sm text-secondary font-bold">
                      ({countdown}s)
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-surface-container-lowest shadow-xs flex items-center justify-center">
                    <span className="material-symbols-outlined text-title-md text-on-surface-variant">
                      close
                    </span>
                  </div>
                </button>
              </div>

              {/* Tab Switcher */}
              <div className="p-1.5 bg-surface-container-low rounded-2xl flex items-center gap-2">
                <button
                  onClick={() => setPinTab("pin")}
                  className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                    pinTab === "pin"
                      ? "bg-surface-container-lowest shadow-xs text-on-surface font-bold"
                      : "text-on-surface-variant hover:text-on-surface font-semibold"
                  }`}
                >
                  <span className="material-symbols-outlined text-title-md text-secondary">
                    dialpad
                  </span>
                  <span className="font-label-lg text-label-lg">
                    Bàn phím PIN cá nhân
                  </span>
                </button>
                <button
                  onClick={() => setPinTab("qr")}
                  className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                    pinTab === "qr"
                      ? "bg-surface-container-lowest shadow-xs text-on-surface font-bold"
                      : "text-on-surface-variant hover:text-on-surface font-semibold"
                  }`}
                >
                  <span className="material-symbols-outlined text-title-md">
                    qr_code_scanner
                  </span>
                  <span className="font-label-lg text-label-lg">
                    Quét mã QR động
                  </span>
                </button>
              </div>

              {/* Dual-Column Workspace */}
              <div className="grid grid-cols-12 gap-6 flex-1">
                {pinTab === "pin" ? (
                  <div className="col-span-12 md:col-span-7 flex flex-col justify-between gap-3">
                    <div className="bg-surface-container-low rounded-xl px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface font-bold text-label-md">
                          {activeStaff.name
                            ?.split(" ")
                            .slice(-2)
                            .map((w) => w[0])
                            .join("") || "QN"}
                        </div>
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">
                            Mã nhân sự xác thực
                          </span>
                          <span className="font-title-md text-title-md text-on-surface font-semibold">
                            {activeStaff.code} — {activeStaff.name}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setSelectedStaffIdx((i) =>
                            users.length ? (i + 1) % users.length : 0
                          )
                        }
                        title="Đổi nhân viên"
                        className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-title-md">
                          swap_horiz
                        </span>
                      </button>
                    </div>

                    {/* PIN Dots */}
                    <div className="py-2 flex flex-col items-center">
                      <div className="flex items-center gap-4">
                        {[0, 1, 2, 3].map((idx) => (
                          <div
                            key={idx}
                            className={`w-4 h-4 rounded-full transition-transform ${
                              idx < pinValue.length
                                ? "bg-primary ring-4 ring-primary/20 scale-110"
                                : "bg-surface-container-highest"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant mt-2 font-medium">
                        Đã nhập {pinValue.length}/4 chữ số bảo mật
                      </span>
                    </div>

                    {/* 3x4 Numpad */}
                    <div className="grid grid-cols-3 gap-2.5 select-none">
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(
                        (d) => (
                          <button
                            key={d}
                            onClick={() => handlePinPress(d)}
                            className="h-12 bg-surface-container-lowest border border-outline-variant/40 hover:bg-surface-container active:scale-95 shadow-xs rounded-2xl flex items-center justify-center text-on-surface font-headline-md text-headline-md font-bold transition-all cursor-pointer"
                          >
                            {d}
                          </button>
                        )
                      )}
                      <button
                        onClick={() => {
                          setPinValue("");
                          setCountdown(15);
                        }}
                        className="h-12 bg-error-container hover:bg-error/20 active:scale-95 rounded-2xl flex items-center justify-center text-error font-label-lg text-label-lg font-bold transition-all cursor-pointer"
                      >
                        XÓA C
                      </button>
                      <button
                        onClick={() => handlePinPress("0")}
                        className="h-12 bg-surface-container-lowest border border-outline-variant/40 hover:bg-surface-container active:scale-95 shadow-xs rounded-2xl flex items-center justify-center text-on-surface font-headline-md text-headline-md font-bold transition-all cursor-pointer"
                      >
                        0
                      </button>
                      <button
                        onClick={() => {
                          setPinValue((p) => p.slice(0, -1));
                          setCountdown(15);
                        }}
                        className="h-12 bg-surface-container-low hover:bg-surface-container active:scale-95 rounded-2xl flex items-center justify-center text-on-surface transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-headline-md">
                          backspace
                        </span>
                      </button>
                    </div>

                    <button
                      onClick={handleConfirmPin}
                      className={`w-full h-12 mt-1 text-on-primary rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                        pinValue.length === 4
                          ? "bg-secondary hover:bg-secondary/90"
                          : "bg-primary hover:bg-primary-container"
                      }`}
                    >
                      <span className="material-symbols-outlined text-secondary-fixed">
                        check_circle
                      </span>
                      <span className="font-title-md text-title-md font-bold">
                        XÁC NHẬN ĐIỂM DANH
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="col-span-12 md:col-span-7 flex flex-col items-center justify-center bg-surface-container-low rounded-2xl p-6 gap-4">
                    <div className="w-48 h-48 rounded-2xl border-2 border-secondary bg-surface-container-lowest flex flex-col items-center justify-center gap-2 shadow-md relative overflow-hidden">
                      <span className="material-symbols-outlined text-secondary text-[64px]">
                        qr_code_scanner
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                        Đưa mã QR TOTP vào khung
                      </span>
                    </div>
                    <button
                      onClick={handleConfirmPin}
                      className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md cursor-pointer"
                    >
                      Mô phỏng quét QR hợp lệ
                    </button>
                  </div>
                )}

                {/* Right Column Guidance */}
                <div className="col-span-12 md:col-span-5 flex flex-col justify-between gap-3">
                  <div className="bg-surface-container-low rounded-2xl p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-title-md text-secondary">
                          record_voice_over
                        </span>
                        <span className="font-label-md text-label-md font-bold text-on-surface">
                          Chỉ dẫn phản hồi
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-label-sm text-label-sm font-semibold">
                        Bật
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface leading-snug">
                      Kiosk sẽ phát giọng nói tiếng Việt:{" "}
                      <strong>"Xác thực thành công"</strong> và tự động kích
                      hoạt chốt khóa mở cửa.
                    </p>
                  </div>

                  <div className="bg-surface-container-low rounded-2xl p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-title-md text-on-surface">
                        verified_user
                      </span>
                      <span className="font-label-md text-label-md font-bold text-on-surface">
                        Trạng thái xác thực
                      </span>
                    </div>
                    <div className="space-y-1.5 font-code-telemetry text-label-sm">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">
                          Bảo mật mã hóa:
                        </span>
                        <span className="font-bold text-on-surface">
                          2FA Zero-Trust Node #04
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">
                          Độ trễ xác thực:
                        </span>
                        <span className="text-secondary font-bold">
                          &lt; 15ms (Local Bus)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-950 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-title-md text-amber-700 shrink-0 mt-0.5">
                      lock_clock
                    </span>
                    <p className="font-body-sm text-body-sm leading-tight text-amber-900">
                      Mã PIN hết hạn nhập sau{" "}
                      <strong className="font-semibold text-amber-950">
                        15 giây
                      </strong>{" "}
                      nếu không thao tác để bảo vệ quyền riêng tư cá nhân.
                    </p>
                  </div>

                  <div className="py-1.5 px-3 rounded-xl bg-surface-container flex items-center justify-between text-on-surface-variant font-code-telemetry text-label-sm">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      Relay Controller ID #01
                    </span>
                    <span className="text-on-surface font-semibold">
                      ONLINE
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low px-8 py-3 flex items-center justify-between text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-title-md text-secondary">
                  help_outline
                </span>
                <span className="font-body-sm text-body-sm">
                  Cần cấp lại mã PIN? Mở app di động chọn{" "}
                  <strong className="text-on-surface font-medium">
                    Bảo mật &gt; Cấp PIN Offline
                  </strong>
                </span>
              </div>
              <div className="font-code-telemetry text-label-sm">
                FIRMWARE V4.2.8-PROD
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
