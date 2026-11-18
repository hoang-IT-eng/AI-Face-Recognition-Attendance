import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { WS_LIVENESS_URL, getUsers, backupAttendance } from "../api";
import { useBackendStatus } from "../backendStatus";
import { analyzeFrame } from "../faceDetect";
import { loadSimCaptures } from "../simSync";
import Icon from "../components/Icon";

export default function Kiosk() {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const wsRef = useRef(null);
  const timerRef = useRef(null);
  const backendStatus = useBackendStatus();

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
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSubmitting, setPinSubmitting] = useState(false);
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

    // Chế độ mô phỏng (máy chủ AI đang khởi động): đếm chớp mắt ngay trong
    // trình duyệt bằng MediaPipe; đủ 2 lần chớp + có mặt → điểm danh thành
    // công cho nhân viên vừa đăng ký mô phỏng (hoặc hồ sơ demo mặc định).
    if (backendStatus !== "real") {
      let blinks = 0;
      let eyeClosed = false;
      let done = false;
      let cancelled = false;
      timerRef.current = setInterval(async () => {
        if (done || cancelled) return;
        const video = webcamRef.current?.video;
        if (!video || video.readyState < 2) return;
        try {
          const { face, blink } = await analyzeFrame(video);
          if (!face || done || cancelled) return;
          if (blink > 0.55) eyeClosed = true;
          if (eyeClosed && blink < 0.3) {
            eyeClosed = false;
            blinks += 1;
            setLivenessState({
              blink_count: blinks,
              required: 2,
              passed: blinks >= 2,
            });
            if (blinks >= 2) {
              done = true;
              const sim = loadSimCaptures();
              const person = sim?.emp || {
                name: "Nguyễn Văn A",
                code: "NV001",
                group: "Kỹ thuật",
              };
              setMatchedPerson({
                name: person.name,
                code: person.code,
                dept: person.group || "Kỹ thuật",
                time: new Date().toLocaleTimeString("vi-VN", {
                  hour12: false,
                }),
                status: "ĐÃ VÀO",
              });
              setScenario("success");
            }
          }
        } catch {
          /* Bộ phát hiện chưa tải được — bỏ qua khung hình này. */
        }
      }, 200);
      return () => {
        cancelled = true;
        clearInterval(timerRef.current);
      };
    }

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
  }, [liveCamera, backendStatus]);

  const activeStaff =
    users[selectedStaffIdx] || {
      id: 1,
      code: "NV045",
      name: "Phạm Quỳnh Như",
      group: "Kế toán",
    };

  const handlePinPress = (digit) => {
    setCountdown(15);
    setPinError("");
    if (pinValue.length < 4) {
      setPinValue((p) => p + digit);
    }
  };

  const handleConfirmPin = async () => {
    if (pinValue.length < 4) return;
    if (!activeStaff?.code) {
      setPinError("Chưa chọn mã nhân viên hợp lệ.");
      return;
    }
    setPinSubmitting(true);
    setPinError("");
    try {
      const res = await backupAttendance({
        code: activeStaff.code,
        pin: pinValue,
        method: "pin",
      });
      const d = res.data;
      setMatchedPerson({
        name: d.name || activeStaff.name,
        code: d.code || activeStaff.code,
        dept: d.dept || activeStaff.group || "",
        time:
          d.time ||
          new Date().toLocaleTimeString("vi-VN", { hour12: false }),
        status: "ĐÃ VÀO (PIN)",
      });
      setScenario("success");
      setPinModalOpen(false);
      setPinValue("");
    } catch (err) {
      setPinError(
        err?.response?.data?.detail ||
          "Xác thực PIN thất bại. Kiểm tra mã NV và PIN."
      );
    } finally {
      setPinSubmitting(false);
    }
  };

  const blinkRatio = Math.min(
    100,
    Math.round(
      ((livenessState.blink_count || 0) / (livenessState.required || 2)) * 100
    )
  );

  return (
    <main className="w-full h-screen bg-background relative flex flex-col justify-between overflow-hidden select-none">
      {/* Top Ribbon */}
      <header className="relative z-20 flex items-center justify-between px-8 py-4 w-full">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface font-label-md text-label-md shadow-xs flex items-center gap-1.5 hover:bg-surface-container-high cursor-pointer"
          >
            <Icon name="arrow_back" className="text-[16px]" />
            <span>Kiosk điểm danh</span>
          </button>
          {backendStatus !== "real" && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="font-label-sm text-label-sm text-amber-800">
                Chế độ mô phỏng — đang chờ AI thật
              </span>
            </div>
          )}
        </div>

        {/* Camera toggle */}
        <div className="flex items-center gap-4 bg-surface-container-lowest px-4 py-1.5 rounded-xl border border-outline-variant/40 shadow-xs">
          <button
            data-tour="kiosk-camera"
            onClick={() => setLiveCamera((v) => !v)}
            className={`px-2.5 py-1 rounded-lg font-label-sm text-label-sm font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
              liveCamera
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface"
            }`}
          >
            <Icon name="videocam" className="text-[15px]" />
            <span>{liveCamera ? "Camera Thật: Bật" : "Bật Camera Thật"}</span>
          </button>
        </div>
      </header>

      {/* Instructional Banner */}
      <div className="relative z-20 flex justify-center w-full px-4 -mt-1 mb-2">
        <div className="bg-surface-container-lowest px-6 py-2 rounded-full border border-outline-variant/40 shadow-md flex items-center gap-2.5">
          <Icon name="visibility" className="text-on-surface-variant text-2xl" />
          <p className="font-headline-md text-headline-md text-on-surface tracking-tight text-center">
            Nhìn thẳng vào camera và chớp mắt 2 lần để xác thực
          </p>
        </div>
      </div>

      {/* Center 12-Col Grid */}
      <div className="relative z-10 flex-1 grid grid-cols-12 gap-6 px-8 items-center min-h-0">
        {/* Left Panel: real liveness state (3 cols) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 justify-center">
          <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/40 shadow-xs flex flex-col gap-3">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Kiểm tra người thật (liveness)
            </span>
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
                    className="text-success"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={`${blinkRatio}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
                <span className="absolute font-label-md text-label-md font-bold text-on-surface">
                  {livenessState.blink_count}/{livenessState.required}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-title-md text-title-md text-on-surface">
                  Chớp mắt để xác thực
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {livenessState.passed
                    ? "Đã đủ số lần chớp mắt yêu cầu."
                    : "Hệ thống đếm số lần chớp mắt qua camera để phân biệt người thật với ảnh/video."}
                </span>
              </div>
            </div>

            <div className="bg-surface-container-low p-3 rounded-lg flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-on-surface">
                <span className="font-label-sm text-label-sm">
                  Tiến độ chớp mắt
                </span>
                <span className="font-label-md text-label-md text-success font-bold">
                  {livenessState.blink_count} / {livenessState.required} lần
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                <div
                  className="h-full bg-success rounded-full transition-all duration-300"
                  style={{ width: `${blinkRatio}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center Camera Viewport (6 cols) */}
        <div className="col-span-12 lg:col-span-6 flex flex-col items-center justify-center relative">
          <div
            data-tour="kiosk-viewport"
            className="relative w-full max-w-[820px] aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-[#101014] flex items-center justify-center"
          >
            {liveCamera ? (
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ width: 960, height: 720 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70 px-8 text-center">
                <Icon name="videocam_off" className="text-[44px]" />
                <span className="font-title-md text-title-md">
                  Camera đang tắt
                </span>
                <span className="font-body-md text-body-md text-white/50">
                  Bấm “Bật Camera Thật” ở thanh trên cùng để bắt đầu điểm danh
                  bằng khuôn mặt.
                </span>
              </div>
            )}

            {/* Plain face guide — a simple rounded outline, no HUD chrome */}
            {liveCamera && (
              <div className="relative w-[46%] aspect-[3/4] rounded-[2rem] border-2 border-white/70 pointer-events-none" />
            )}

            {/* Bottom Verification Ribbon — real blink state only */}
            <div className="absolute bottom-4 inset-x-6 flex justify-between items-center bg-black/75 px-4 py-2.5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2.5 text-white">
                <Icon name="verified" className="text-success text-xl" />
                <span className="font-label-md text-label-md">
                  Chớp mắt: {livenessState.blink_count} /{" "}
                  {livenessState.required} lần
                  {livenessState.passed ? " — đã đạt" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="bg-success h-full rounded-full"
                    style={{ width: `${blinkRatio}%` }}
                  />
                </div>
                <span className="font-label-sm text-label-sm text-white font-bold">
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
            <div
              data-tour="kiosk-success"
              className="bg-surface-container-lowest rounded-xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-4"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-success" />
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                  <Icon name="check_circle" className="text-success text-3xl" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-sm text-label-sm text-success font-bold">
                    Đã ghi nhận điểm danh
                  </span>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                    ĐIỂM DANH THÀNH CÔNG
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-lg">
                <div className="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 text-on-surface font-title-md text-title-md font-bold">
                  {matchedPerson.name
                    ?.split(/\s+/)
                    .filter(Boolean)
                    .slice(-2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase() || "NV"}
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="font-title-lg text-title-lg text-on-surface font-bold truncate">
                    {matchedPerson.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-label-md text-label-md text-on-surface-variant font-medium">
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
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/15 text-success font-label-lg text-label-lg font-bold">
                      <span className="w-2 h-2 rounded-full bg-success" />
                      {matchedPerson.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scenario 2: Spoof */}
          {scenario === "spoof" && (
            <div className="bg-error text-on-error rounded-xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Icon name="gpp_maybe" className="text-on-error text-3xl" />
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
            </div>
          )}

          {/* Scenario 3: Stranger */}
          {scenario === "stranger" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-4">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-error" />
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                  <Icon name="person_off" className="text-error text-3xl" />
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
                  <Icon name="warning" className="text-lg" />
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
            </div>
          )}

          <div className="bg-surface-container-low rounded-xl p-4 flex items-center gap-2.5">
            <Icon name="info" className="text-on-surface-variant text-xl" />
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
            onClick={() => {
              setPinValue("");
              setPinError("");
              setPinTab("pin");
              setPinModalOpen(true);
            }}
            className="flex items-center gap-3 px-6 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-high transition-all shadow-xs active:scale-95 group cursor-pointer"
          >
            <Icon name="dialpad" className="text-on-surface text-2xl group-hover:text-primary transition-colors" />
            <div className="flex flex-col text-left">
              <span className="font-label-lg text-label-lg text-on-surface font-bold group-hover:text-primary transition-colors">
                Điểm danh bằng mã PIN
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Dành cho khách hoặc camera lỗi
              </span>
            </div>
          </button>
          <button className="flex items-center gap-2 px-4 py-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all text-on-surface-variant font-label-md text-label-md">
            <Icon name="language" className="text-lg" />
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
              <Icon name="calendar_today" className="text-secondary text-sm" />
              <span>{dateStr}</span>
              <span className="w-1 h-3 rounded-full bg-outline-variant" />
              <Icon name="location_on" className="text-secondary text-sm" />
              <span className="font-semibold text-on-surface">
                Kiosk Cổng A (Tòa nhà TechCenter)
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* SCREEN 05 POP-UP: MODAL NHẬP MÃ PIN / QR */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-[790px] bg-surface-container-lowest rounded-[28px] shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="p-8 flex flex-col flex-1 justify-between gap-5">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface">
                    <Icon name="pin" className="text-headline-md" />
                  </div>
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">
                      Điểm danh dự phòng bằng mã PIN
                    </h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                      Dành cho nhân viên được miễn trừ sinh trắc hoặc khi camera
                      gặp sự cố
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
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">
                      ({countdown}s)
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-surface-container-lowest shadow-xs flex items-center justify-center">
                    <Icon name="close" className="text-title-md text-on-surface-variant" />
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
                  <Icon name="dialpad" className="text-title-md text-on-surface-variant" />
                  <span className="font-label-lg text-label-lg">
                    Bàn phím PIN cá nhân
                  </span>
                </button>
                <button
                  type="button"
                  disabled
                  title="Chưa hỗ trợ"
                  className="flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 opacity-50 cursor-not-allowed text-on-surface-variant font-semibold"
                >
                  <Icon name="qr_code_scanner" className="text-title-md" />
                  <span className="font-label-lg text-label-lg">
                    Quét mã QR (chưa hỗ trợ)
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
                        <Icon name="swap_horiz" className="text-title-md" />
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
                        <Icon name="backspace" className="text-headline-md" />
                      </button>
                    </div>

                    {pinError && (
                      <p className="text-error font-label-sm text-label-sm text-center">
                        {pinError}
                      </p>
                    )}
                    <button
                      onClick={handleConfirmPin}
                      disabled={pinValue.length !== 4 || pinSubmitting}
                      className="w-full h-12 mt-1 text-on-primary bg-primary hover:bg-primary-container rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Icon name="check_circle" />
                      <span className="font-title-md text-title-md font-bold">
                        {pinSubmitting
                          ? "ĐANG XÁC THỰC..."
                          : "XÁC NHẬN ĐIỂM DANH"}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="col-span-12 md:col-span-7 flex flex-col items-center justify-center bg-surface-container-low rounded-2xl p-6 gap-4">
                    <div className="w-48 h-48 rounded-2xl border-2 border-outline-variant bg-surface-container-lowest flex flex-col items-center justify-center gap-2 shadow-md relative overflow-hidden opacity-70">
                      <Icon name="qr_code_scanner" className="text-on-surface-variant text-[64px]" />
                      <span className="font-label-sm text-label-sm text-on-surface font-semibold text-center px-4">
                        Quét mã QR chưa được hỗ trợ
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-center max-w-sm">
                      Vui lòng dùng tab PIN cá nhân hoặc bật Live camera để điểm
                      danh.
                    </p>
                  </div>
                )}

                {/* Right Column Guidance */}
                <div className="col-span-12 md:col-span-5 flex flex-col gap-3">
                  <div className="bg-surface-container-low rounded-2xl p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Icon name="info" className="text-title-md text-on-surface" />
                      <span className="font-label-md text-label-md font-bold text-on-surface">
                        Cách điểm danh bằng PIN
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface leading-snug">
                      Chọn đúng nhân viên ở cột trái, nhập mã PIN cá nhân 4 số
                      rồi bấm “Xác nhận điểm danh”. Lượt điểm danh được ghi vào
                      hệ thống như một lượt điểm danh thay thế.
                    </p>
                  </div>

                  <div className="bg-surface-container-low rounded-2xl p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Icon name="verified_user" className="text-title-md text-on-surface" />
                      <span className="font-label-md text-label-md font-bold text-on-surface">
                        Mã PIN cá nhân
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface leading-snug">
                      Mã PIN do bộ phận Nhân sự cấp cho từng nhân viên. Không
                      chia sẻ mã PIN cho người khác; nếu quên, liên hệ Nhân sự
                      để được cấp lại.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-950 flex items-start gap-2.5">
                    <Icon name="lock_clock" className="text-title-md text-amber-700 shrink-0 mt-0.5" />
                    <p className="font-body-sm text-body-sm leading-tight text-amber-900">
                      Màn hình tự quay lại camera sau{" "}
                      <strong className="font-semibold text-amber-950">
                        15 giây
                      </strong>{" "}
                      nếu không thao tác, để tránh lộ thông tin cá nhân.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low px-8 py-3 flex items-center justify-between text-on-surface-variant">
              <div className="flex items-center gap-2">
                <Icon name="help_outline" className="text-title-md text-on-surface-variant" />
                <span className="font-body-sm text-body-sm">
                  Cần cấp lại mã PIN? Liên hệ bộ phận{" "}
                  <strong className="text-on-surface font-medium">
                    Nhân sự
                  </strong>{" "}
                  để được hỗ trợ.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
