import { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { recognizeImage } from "../api";

const API = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/camera/ws/liveness";

const STATUS_COLOR = {
  check_in: "bg-green-100 text-green-700",
  check_out: "bg-blue-100 text-blue-700",
  already_checked: "bg-gray-100 text-gray-600",
  unknown: "bg-orange-100 text-orange-600",
  spoof_detected: "bg-red-100 text-red-700",
};
const STATUS_LABEL = {
  check_in: "✅ Check-in",
  check_out: "🚪 Check-out",
  already_checked: "⏸ Đã điểm danh",
  unknown: "❓ Không nhận ra",
  spoof_detected: "🚫 Giả mạo!",
};

export default function Camera() {
  const webcamRef = useRef(null);
  const imgRef = useRef(null);
  const intervalRef = useRef(null);

  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [mode, setMode] = useState("stream");
  const [streamCamId, setStreamCamId] = useState(0);
  const [streaming, setStreaming] = useState(false);

  // Liveness mode state
  const wsRef = useRef(null);
  const livenessIntervalRef = useRef(null);
  const [liveness, setLiveness] = useState(null);
  const [livenessActive, setLivenessActive] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((list) => {
      const cams = list.filter((d) => d.kind === "videoinput");
      setDevices(cams);
      const builtin = cams.find((d) => /integrated|built.?in|facetime|internal/i.test(d.label));
      setDeviceId(builtin?.deviceId || cams[0]?.deviceId || "");
    });
  }, []);

  // Start/stop stream bằng cách set/clear src của <img>
  const startStream = () => {
    if (imgRef.current) {
      imgRef.current.src = `${API}/camera/stream/${streamCamId}?t=${Date.now()}`;
    }
    setStreaming(true);
  };

  const stopStream = () => {
    if (imgRef.current) {
      imgRef.current.src = "";  // Ngắt HTTP connection → backend release camera
    }
    setStreaming(false);
  };

  const switchMode = (m) => {
    if (autoMode) { clearInterval(intervalRef.current); setAutoMode(false); }
    if (streaming) stopStream();
    stopLiveness();
    setMode(m);
  };

  // Liveness WebSocket
  const startLiveness = () => {
    if (wsRef.current) wsRef.current.close();
    setLiveness(null);
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      setLiveness(msg.liveness);
      if (msg.liveness?.error) {
        alert("Lỗi: " + msg.liveness.error);
        stopLiveness();
        return;
      }
      if (msg.result) {
        setResults((prev) =>
          [{ ...msg.result, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50)
        );
        // Reset sau 3 giây để điểm danh người tiếp theo
        setTimeout(() => {
          setLiveness(null);
          if (wsRef.current) wsRef.current.close();
          wsRef.current = null;
          setLivenessActive(false);
        }, 3000);
      }
    };
    ws.onclose = () => {
      clearInterval(livenessIntervalRef.current);
      setLivenessActive(false);
    };
    ws.onerror = (err) => {
      console.error("WebSocket lỗi:", err);
      clearInterval(livenessIntervalRef.current);
      setLivenessActive(false);
    };

    setLivenessActive(true);

    // Gửi frame mỗi 100ms
    livenessIntervalRef.current = setInterval(() => {
      if (!webcamRef.current || ws.readyState !== WebSocket.OPEN) return;
      const img = webcamRef.current.getScreenshot();
      if (!img) return;
      const b64 = img.split(",")[1];
      ws.send(JSON.stringify({ frame: b64 }));
    }, 100);
  };

  const stopLiveness = () => {
    clearInterval(livenessIntervalRef.current);
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    setLivenessActive(false);
    setLiveness(null);
  };

  const capture = useCallback(async () => {
    if (!webcamRef.current || loading) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    setLoading(true);
    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      const response = await recognizeImage(file);
      if (response.data.length > 0) {
        setResults((prev) =>
          [...response.data.map((r) => ({ ...r, time: new Date().toLocaleTimeString() })), ...prev].slice(0, 50)
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const toggleAuto = () => {
    if (autoMode) {
      clearInterval(intervalRef.current);
      setAutoMode(false);
    } else {
      setAutoMode(true);
      intervalRef.current = setInterval(capture, 3000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">📸 Điểm danh realtime</h1>

        {/* Tab */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => switchMode("stream")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${mode === "stream" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-50"}`}>
            🎥 Stream
          </button>
          <button onClick={() => switchMode("webcam")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${mode === "webcam" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-50"}`}>
            📷 Chụp
          </button>
          <button onClick={() => switchMode("liveness")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${mode === "liveness" ? "bg-green-600 text-white border-green-600" : "border-gray-300 hover:bg-gray-50"}`}>
            👁 Liveness
          </button>
        </div>

        {/* Stream mode */}
        {mode === "stream" && (
          <div>
            <div className="bg-black rounded-xl overflow-hidden shadow mb-3 min-h-[240px] flex items-center justify-center">
              {/* img luôn tồn tại trong DOM, chỉ thay src để start/stop */}
              <img
                ref={imgRef}
                alt="Live stream"
                className={`w-full ${streaming ? "block" : "hidden"}`}
                onError={() => { setStreaming(false); }}
              />
              {!streaming && (
                <p className="text-gray-400 text-sm">Nhấn Start để bắt đầu stream</p>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">Camera index</label>
                <select value={streamCamId}
                  onChange={(e) => { stopStream(); setStreamCamId(Number(e.target.value)); }}
                  className="border rounded px-3 py-2 text-sm w-full">
                  {[0, 1, 2, 3].map((i) => (
                    <option key={i} value={i}>Camera {i}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={streaming ? stopStream : startStream}
                className={`mt-5 px-5 py-2 rounded-lg text-sm font-medium transition ${streaming ? "bg-red-500 text-white hover:bg-red-600" : "bg-green-600 text-white hover:bg-green-700"}`}>
                {streaming ? "⏹ Stop" : "▶ Start"}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Nhận diện chạy trên server, bbox hiển thị trực tiếp trên video
            </p>
          </div>
        )}

        {/* Webcam chụp thủ công */}
        {mode === "webcam" && (
          <div>
            {devices.length > 1 && (
              <div className="mb-3">
                <label className="text-xs text-gray-500 block mb-1">Chọn camera</label>
                <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}
                  className="border rounded px-3 py-2 text-sm w-full">
                  {devices.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="bg-black rounded-xl overflow-hidden shadow">
              <Webcam key={deviceId + mode} ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ width: 640, height: 480, deviceId: deviceId || undefined }}
                className="w-full"
                onUserMediaError={(e) => console.error("Camera error:", e)} />
            </div>
            <div className="flex gap-3 mt-3">
              <button onClick={capture} disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                {loading ? "Đang nhận diện..." : "📷 Chụp & Điểm danh"}
              </button>
              <button onClick={toggleAuto}
                className={`flex-1 py-2 rounded-lg font-medium border transition ${autoMode ? "bg-red-500 text-white border-red-500" : "border-blue-600 text-blue-600 hover:bg-blue-50"}`}>
                {autoMode ? "⏹ Dừng tự động" : "▶ Tự động (3s)"}
              </button>
            </div>
          </div>
        )}

        {/* Liveness mode */}
        {mode === "liveness" && (          <div>
            <div className="bg-black rounded-xl overflow-hidden shadow relative">
              <Webcam key={deviceId + "liveness"} ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ width: 640, height: 480, deviceId: deviceId || undefined }}
                className="w-full" />
              {livenessActive && liveness && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-3 text-center">
                  {liveness.passed ? (
                    <p className="text-green-400 font-bold text-lg">✅ Xác thực thành công!</p>
                  ) : (
                    <>
                      <p className="text-sm mb-1">👁 Hãy chớp mắt tự nhiên</p>
                      <div className="flex justify-center gap-2">
                        {Array.from({ length: liveness.required }).map((_, i) => (
                          <div key={i}
                            className={`w-6 h-6 rounded-full border-2 ${i < liveness.blink_count ? "bg-green-400 border-green-400" : "border-gray-400"}`} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-300 mt-1">{liveness.blink_count}/{liveness.required} lần chớp</p>
                    </>
                  )}
                </div>
              )}
            </div>
            {devices.length > 1 && (
              <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}
                className="border rounded px-3 py-2 text-sm w-full mt-2">
                {devices.map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>
                ))}
              </select>
            )}
            <button onClick={livenessActive ? stopLiveness : startLiveness}
              className={`w-full mt-3 py-2 rounded-lg font-medium transition ${livenessActive ? "bg-red-500 text-white hover:bg-red-600" : "bg-green-600 text-white hover:bg-green-700"}`}>
              {livenessActive ? "⏹ Dừng" : "▶ Bắt đầu điểm danh"}
            </button>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Chớp mắt 2 lần → hệ thống tự nhận diện. Ảnh tĩnh không thể qua được.
            </p>
          </div>
        )}
      </div>

      {/* Kết quả */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Kết quả nhận diện</h2>
          <button onClick={() => setResults([])} className="text-xs text-gray-400 hover:text-red-500">Xóa lịch sử</button>
        </div>
        <div className="space-y-2 max-h-[520px] overflow-y-auto">
          {results.length === 0 && (
            <div className="text-center py-12 text-gray-400">Chưa có kết quả</div>
          )}
          {results.map((r, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-3 flex justify-between items-center">
              <div>
                <p className="font-medium">{r.name}</p>
                {r.code && <p className="text-xs text-gray-500">Mã: {r.code}</p>}
                <p className="text-xs text-gray-400">{r.time}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[r.action] || "bg-gray-100"}`}>
                  {STATUS_LABEL[r.action] || r.action}
                </span>
                <p className="text-xs text-gray-400 mt-1">Score: {(r.score * 100).toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

