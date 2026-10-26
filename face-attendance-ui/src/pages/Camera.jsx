import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Webcam from "react-webcam";
import {
  ArrowLeft,
  Camera as CameraIcon,
  CheckCircle2,
  Eye,
  KeyRound,
  Maximize2,
  Minimize2,
  Trash2,
  Upload,
  Video,
  VideoOff,
} from "lucide-react";
import {
  API_BASE,
  WS_LIVENESS_URL,
  getUsers,
  manualAttendance,
  recognizeImage,
} from "../api";
import StatusBadge from "../components/StatusBadge";

export default function Camera() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isKiosk = searchParams.get("kiosk") === "1";

  const webcamRef = useRef(null);
  const imgRef = useRef(null);
  const sseRef = useRef(null);
  const wsRef = useRef(null);
  const livenessTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [mode, setMode] = useState("liveness"); // liveness | stream | photo
  const [livenessDirection, setLivenessDirection] = useState("checkin"); // checkin | checkout
  const [livenessActive, setLivenessActive] = useState(false);
  const [livenessState, setLivenessState] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const [streamCamId, setStreamCamId] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const [results, setResults] = useState([]);
  const [processingPhoto, setProcessingPhoto] = useState(false);

  // Ghi nhận dự phòng khi camera lỗi
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [fallbackCode, setFallbackCode] = useState("");
  const [fallbackNote, setFallbackNote] = useState("Điểm danh dự phòng tại cổng");
  const [fallbackMsg, setFallbackMsg] = useState("");

  useEffect(() => {
    navigator.mediaDevices
      ?.enumerateDevices()
      .then((list) => {
        const cams = list.filter((d) => d.kind === "videoinput");
        setDevices(cams);
        const builtin = cams.find((d) =>
          /integrated|built.?in|facetime|internal/i.test(d.label)
        );
        setDeviceId(builtin?.deviceId || cams[0]?.deviceId || "");
      })
      .catch(() => {});

    getUsers()
      .then((r) => setUsers(r.data || []))
      .catch(() => {});

    return () => {
      stopAll();
    };
  }, []);

  const stopStream = () => {
    if (imgRef.current) imgRef.current.src = "";
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    setStreaming(false);
  };

  const stopLiveness = () => {
    clearInterval(livenessTimerRef.current);
    wsRef.current?.close();
    wsRef.current = null;
    setLivenessActive(false);
    setLivenessState(null);
  };

  const stopAll = () => {
    stopStream();
    stopLiveness();
  };

  const switchMode = (nextMode) => {
    stopAll();
    setLastResult(null);
    setMode(nextMode);
  };

  /* ── Luồng camera giám sát (MJPEG + SSE) ── */
  const startStream = () => {
    if (imgRef.current) {
      imgRef.current.src = `${API_BASE}/camera/stream/${streamCamId}?t=${Date.now()}`;
    }
    setStreaming(true);
    const sse = new EventSource(`${API_BASE}/camera/stream-results`);
    sse.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setResults((prev) => [data, ...prev].slice(0, 50));
      } catch {}
    };
    sseRef.current = sse;
  };

  /* ── Chớp mắt điểm danh (WebSocket Liveness) ── */
  const startLiveness = () => {
    stopLiveness();
    setLastResult(null);
    const ws = new WebSocket(`${WS_LIVENESS_URL}?mode=${livenessDirection}`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      setLivenessState(msg.liveness);
      if (msg.liveness?.error) {
        stopLiveness();
        return;
      }
      if (msg.result) {
        const nowStr = new Date().toLocaleTimeString("vi-VN", { hour12: false });
        const item = { ...msg.result, time: nowStr };
        setLastResult(item);
        setResults((prev) => [item, ...prev].slice(0, 50));
        setTimeout(() => {
          stopLiveness();
        }, 2800);
      }
    };

    ws.onclose = () => {
      clearInterval(livenessTimerRef.current);
      setLivenessActive(false);
    };
    ws.onerror = () => {
      clearInterval(livenessTimerRef.current);
      setLivenessActive(false);
    };

    setLivenessActive(true);
    livenessTimerRef.current = setInterval(() => {
      if (!webcamRef.current || ws.readyState !== WebSocket.OPEN) return;
      const img = webcamRef.current.getScreenshot();
      if (img) {
        ws.send(JSON.stringify({ frame: img.split(",")[1] }));
      }
    }, 110);
  };

  /* ── Chụp ảnh đơn / tải ảnh nhận diện ── */
  const handleCapturePhoto = useCallback(async () => {
    if (!webcamRef.current) return;
    const shot = webcamRef.current.getScreenshot();
    if (!shot) return;

    setProcessingPhoto(true);
    setLastResult(null);
    try {
      const blob = await (await fetch(shot)).blob();
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      const res = await recognizeImage(file);
      const list = res.data || [];
      const nowStr = new Date().toLocaleTimeString("vi-VN", { hour12: false });
      const mapped = list.map((r) => ({ ...r, time: nowStr }));
      if (mapped[0]) setLastResult(mapped[0]);
      setResults((prev) => [...mapped, ...prev].slice(0, 50));
    } catch (err) {
      const nowStr = new Date().toLocaleTimeString("vi-VN", { hour12: false });
      const failItem = {
        name:
          err.response?.data?.detail || "Không tìm thấy khuôn mặt trong khung",
        code: "",
        action: "unknown",
        time: nowStr,
      };
      setLastResult(failItem);
    } finally {
      setProcessingPhoto(false);
    }
  }, []);

  const handleUploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessingPhoto(true);
    setLastResult(null);
    try {
      const res = await recognizeImage(file);
      const list = res.data || [];
      const nowStr = new Date().toLocaleTimeString("vi-VN", { hour12: false });
      const mapped = list.map((r) => ({ ...r, time: nowStr }));
      if (mapped[0]) setLastResult(mapped[0]);
      setResults((prev) => [...mapped, ...prev].slice(0, 50));
    } catch (err) {
      setLastResult({
        name: err.response?.data?.detail || "Không nhận diện được ảnh tải lên",
        code: "",
        action: "unknown",
        time: new Date().toLocaleTimeString("vi-VN", { hour12: false }),
      });
    } finally {
      setProcessingPhoto(false);
      e.target.value = "";
    }
  };

  const handleFallbackSubmit = async (e) => {
    e.preventDefault();
    const user = users.find(
      (u) => u.code?.toLowerCase() === fallbackCode.trim().toLowerCase()
    );
    if (!user) {
      setFallbackMsg("Không tìm thấy mã nhân viên này trong danh sách.");
      return;
    }
    try {
      await manualAttendance({
        user_id: user.id,
        date: new Date().toISOString().slice(0, 10),
        status: "present",
        note: fallbackNote || "Điểm danh dự phòng tại cổng",
      });
      const nowStr = new Date().toLocaleTimeString("vi-VN", { hour12: false });
      const item = {
        name: user.name,
        code: user.code,
        action: "check_in",
        time: nowStr,
      };
      setLastResult(item);
      setResults((prev) => [item, ...prev].slice(0, 50));
      setFallbackCode("");
      setFallbackMsg("");
      setFallbackOpen(false);
    } catch (err) {
      setFallbackMsg(
        err.response?.data?.detail || "Không thể ghi nhận điểm danh."
      );
    }
  };

  const toggleKiosk = () => {
    if (isKiosk) {
      setSearchParams({});
    } else {
      setSearchParams({ kiosk: "1" });
    }
  };

  const wrapperCls = isKiosk
    ? "fixed inset-0 z-50 bg-canvas overflow-y-auto p-6"
    : "space-y-6";

  return (
    <div className={wrapperCls}>
      {/* Thanh tiêu đề */}
      <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div className="flex items-center gap-3">
          {isKiosk && (
            <button
              type="button"
              onClick={() => navigate("/")}
              className="p-2 rounded border border-line bg-surface hover:bg-canvas text-ink cursor-pointer"
              title="Về bàn trực"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-ink tracking-tight">
              {isKiosk
                ? "Màn hình chấm công tại cổng"
                : "Điểm danh tại cổng"}
            </h1>
            <p className="text-sm text-muted mt-0.5">
              Xác thực chớp mắt để chấm công vào/ra hoặc mở luồng quan sát liên
              tục
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setFallbackOpen(true)}
            className="px-3 py-2 rounded border border-line bg-surface hover:bg-canvas text-ink text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-muted" />
            <span>Ghi công theo mã NV</span>
          </button>

          <button
            type="button"
            onClick={toggleKiosk}
            className="px-3 py-2 rounded border border-line bg-surface hover:bg-canvas text-ink text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            {isKiosk ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Thu nhỏ về trang quản lý</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Mở toàn màn hình Kiosk</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Khung chính 2 cột: Camera (7/12) + Nhật ký nhận diện (5/12) */}
      <div className="max-w-[1400px] mx-auto bg-surface border border-line rounded overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-line">
        {/* Cột trái: Camera & điều khiển */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          {/* Thanh chọn phương thức */}
          <div className="px-4 py-3 border-b border-line bg-surface-subtle flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded border border-line bg-surface p-0.5">
              {[
                ["liveness", "Chớp mắt chấm công"],
                ["stream", "Luồng camera cổng"],
                ["photo", "Chụp / tải ảnh"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => switchMode(key)}
                  className={`px-3 py-1.5 rounded-xs text-xs font-medium transition-colors cursor-pointer ${
                    mode === key
                      ? "bg-ink text-white"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === "liveness" && (
              <div className="inline-flex rounded border border-line bg-surface p-0.5">
                {[
                  ["checkin", "Ghi giờ vào"],
                  ["checkout", "Ghi giờ ra"],
                ].map(([dir, label]) => (
                  <button
                    key={dir}
                    type="button"
                    disabled={livenessActive}
                    onClick={() => setLivenessDirection(dir)}
                    className={`px-3 py-1.5 rounded-xs text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                      livenessDirection === dir
                        ? "bg-accent text-white"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Khung hình camera */}
          <div className="relative bg-camera-well aspect-[4/3] w-full flex items-center justify-center overflow-hidden">
            {mode === "stream" ? (
              <>
                <img
                  ref={imgRef}
                  alt="Stream cổng"
                  onError={() => setStreaming(false)}
                  className={`w-full h-full object-contain ${
                    streaming ? "block" : "hidden"
                  }`}
                />
                {!streaming && (
                  <div className="text-center px-6">
                    <Video className="w-8 h-8 text-white/50 mx-auto mb-2" />
                    <p className="text-white text-sm font-medium">
                      Luồng camera liên tục đang dừng
                    </p>
                    <p className="text-white/60 text-xs mt-1">
                      Chọn cổng camera bên dưới và nhấn Bắt đầu để quan sát.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <Webcam
                  key={deviceId + mode}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    width: 640,
                    height: 480,
                    deviceId: deviceId || undefined,
                  }}
                  className="w-full h-full object-cover"
                />

                {/* Khung hướng dẫn căn mặt đơn giản, không HUD viễn tưởng */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-68 border border-white/40 rounded-lg" />
                </div>

                {/* Thanh trạng thái chớp mắt */}
                {mode === "liveness" && livenessActive && livenessState && (
                  <div className="absolute bottom-3 inset-x-4 bg-ink/85 text-white px-4 py-3 rounded flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Eye className="w-4 h-4 text-white shrink-0" />
                      <span className="text-xs font-medium">
                        {livenessState.passed
                          ? "Đã xác nhận người thật — đang đối chiếu khuôn mặt..."
                          : "Nhìn thẳng vào camera và chớp mắt tự nhiên 2 lần"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {Array.from({
                        length: livenessState.required || 2,
                      }).map((_, idx) => (
                        <span
                          key={idx}
                          className={`w-3 h-3 rounded-full border ${
                            idx < (livenessState.blink_count || 0)
                              ? "bg-ok border-ok"
                              : "border-white/50"
                          }`}
                        />
                      ))}
                      <span className="num-mono text-xs font-semibold ml-1">
                        {livenessState.blink_count || 0}/
                        {livenessState.required || 2}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Thanh điều khiển dưới chân camera */}
          <div className="p-4 border-t border-line bg-surface flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {mode === "stream" ? (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted">Cổng camera:</label>
                  <select
                    value={streamCamId}
                    onChange={(e) => {
                      stopStream();
                      setStreamCamId(Number(e.target.value));
                    }}
                    className="h-9 px-3 rounded border border-line bg-surface text-xs text-ink focus:outline-none focus:border-accent"
                  >
                    {[0, 1, 2, 3].map((i) => (
                      <option key={i} value={i}>
                        Camera {i}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={streaming ? stopStream : startStream}
                  className={`h-9 px-4 rounded text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                    streaming
                      ? "bg-danger text-white hover:bg-danger/90"
                      : "bg-accent text-white hover:bg-accent/90"
                  }`}
                >
                  {streaming ? (
                    <>
                      <VideoOff className="w-3.5 h-3.5" />
                      <span>Dừng luồng camera</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-3.5 h-3.5" />
                      <span>Bắt đầu luồng camera</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-1">
                  {devices.length > 1 && (
                    <select
                      value={deviceId}
                      onChange={(e) => setDeviceId(e.target.value)}
                      className="h-9 px-3 rounded border border-line bg-surface text-xs text-ink focus:outline-none focus:border-accent max-w-xs w-full"
                    >
                      {devices.map((d, idx) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `Webcam ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  )}
                  {devices.length <= 1 && (
                    <span className="text-xs text-muted">
                      {mode === "liveness"
                        ? "Yêu cầu chớp mắt đủ 2 lần để ghi công."
                        : "Chụp ảnh trực tiếp hoặc chọn file ảnh có sẵn."}
                    </span>
                  )}
                </div>

                {mode === "liveness" ? (
                  <button
                    type="button"
                    onClick={livenessActive ? stopLiveness : startLiveness}
                    className={`h-9 px-4 rounded text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                      livenessActive
                        ? "bg-danger text-white hover:bg-danger/90"
                        : "bg-accent text-white hover:bg-accent/90"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>
                      {livenessActive
                        ? "Dừng xác thực"
                        : livenessDirection === "checkin"
                        ? "Bắt đầu chấm công vào"
                        : "Bắt đầu chấm công ra"}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadPhoto}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={processingPhoto}
                      className="h-9 px-3 rounded border border-line bg-surface hover:bg-canvas text-ink text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Tải ảnh lên</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCapturePhoto}
                      disabled={processingPhoto}
                      className="h-9 px-4 rounded bg-accent hover:bg-accent/90 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CameraIcon className="w-3.5 h-3.5" />
                      <span>
                        {processingPhoto
                          ? "Đang đối chiếu..."
                          : "Chụp & chấm công"}
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Cột phải: Kết quả vừa chấm công & danh sách nhật ký */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-surface">
          <div>
            <div className="px-4 py-3 border-b border-line bg-surface-subtle flex items-center justify-between">
              <h2 className="font-semibold text-sm text-ink">
                Nhật ký nhận diện tại cổng
              </h2>
              {results.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setResults([]);
                    setLastResult(null);
                  }}
                  className="text-xs text-muted hover:text-danger flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa nhật ký</span>
                </button>
              )}
            </div>

            {/* Phiếu xác nhận lượt vừa chấm công */}
            {lastResult && (
              <div
                className={`m-4 p-4 rounded border ${
                  lastResult.action === "unknown" ||
                  lastResult.action === "spoof_detected"
                    ? "bg-danger-bg border-danger/30"
                    : "bg-ok-bg border-ok/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2
                      className={`w-5 h-5 shrink-0 ${
                        lastResult.action === "unknown"
                          ? "text-danger"
                          : "text-ok"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-bold text-ink">
                        {lastResult.action === "unknown"
                          ? "Không có trong danh sách nhân sự"
                          : lastResult.name}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {lastResult.code && (
                          <>
                            Mã NV:{" "}
                            <span className="num-mono font-semibold text-ink">
                              {lastResult.code}
                            </span>{" "}
                            —{" "}
                          </>
                        )}
                        Ghi nhận lúc{" "}
                        <span className="num-mono font-medium text-ink">
                          {lastResult.time}
                        </span>
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={lastResult.action} />
                </div>
              </div>
            )}

            {/* Danh sách các lượt qua cổng */}
            <div className="divide-y divide-line-subtle max-h-[430px] overflow-y-auto">
              {results.length === 0 ? (
                <div className="py-16 px-6 text-center text-xs text-muted">
                  Chưa có lượt chấm công nào trong phiên này.
                </div>
              ) : (
                results.map((r, i) => (
                  <div
                    key={i}
                    className={`px-4 py-3 flex items-center justify-between gap-3 ${
                      r.action === "unknown"
                        ? "bg-danger-bg/50"
                        : "hover:bg-surface-subtle"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="num-mono text-xs font-semibold text-ink bg-canvas px-2 py-1 rounded border border-line-subtle">
                        {r.time || "--:--:--"}
                      </span>
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            r.action === "unknown" ? "text-danger" : "text-ink"
                          }`}
                        >
                          {r.action === "unknown"
                            ? "Người chưa đăng ký"
                            : r.name}
                        </p>
                        {r.code && (
                          <p className="text-xs text-muted">
                            Mã NV:{" "}
                            <span className="num-mono text-ink font-medium">
                              {r.code}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={r.action} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="px-4 py-2.5 border-t border-line bg-surface-subtle text-xs text-muted flex items-center justify-between">
            <span>Tổng trong phiên: {results.length} lượt</span>
            <button
              type="button"
              onClick={() => setFallbackOpen(true)}
              className="text-accent font-medium hover:underline cursor-pointer"
            >
              Camera lỗi? Nhập mã NV
            </button>
          </div>
        </div>
      </div>

      {/* Hộp thoại ghi nhận dự phòng theo mã nhân viên */}
      {fallbackOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded w-full max-w-md overflow-hidden">
            <div className="px-5 py-3.5 border-b border-line bg-surface-subtle flex items-center justify-between">
              <h3 className="font-semibold text-sm text-ink">
                Ghi công dự phòng theo mã nhân viên
              </h3>
              <button
                type="button"
                onClick={() => {
                  setFallbackOpen(false);
                  setFallbackMsg("");
                }}
                className="text-muted hover:text-ink text-sm cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleFallbackSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Mã nhân viên
                </label>
                <input
                  required
                  value={fallbackCode}
                  onChange={(e) => {
                    setFallbackCode(e.target.value);
                    setFallbackMsg("");
                  }}
                  placeholder="Ví dụ: NV001"
                  className="w-full h-9 px-3 rounded border border-line num-mono text-sm text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Lý do ghi công dự phòng
                </label>
                <input
                  value={fallbackNote}
                  onChange={(e) => setFallbackNote(e.target.value)}
                  className="w-full h-9 px-3 rounded border border-line text-sm text-ink focus:outline-none focus:border-accent"
                />
              </div>

              {fallbackMsg && (
                <p className="text-xs text-danger bg-danger-bg px-3 py-2 rounded border border-danger/25">
                  {fallbackMsg}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFallbackOpen(false)}
                  className="px-3.5 py-2 rounded border border-line text-xs font-medium text-ink hover:bg-canvas cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-accent hover:bg-accent/90 text-white text-xs font-medium cursor-pointer"
                >
                  Xác nhận chấm công
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
