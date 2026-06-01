import { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { recognizeImage } from "../api";

const API = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/camera/ws/liveness";

const STATUS_COLOR = {
  check_in:       "bg-green-100 text-green-700",
  check_out:      "bg-blue-100 text-blue-700",
  already_checked:"bg-gray-100 text-gray-500",
  unknown:        "bg-red-100 text-red-700",
  spoof_detected: "bg-red-100 text-red-600",
};
const STATUS_LABEL = {
  check_in:       "Check-in",
  check_out:      "Check-out",
  already_checked:"Đã điểm danh",
  unknown:        "Cảnh báo: Người lạ",
  spoof_detected: "Gian lận",
};

export default function Camera() {
  const webcamRef = useRef(null);
  const imgRef    = useRef(null);
  const sseRef    = useRef(null);
  const wsRef     = useRef(null);
  const livenessIntervalRef = useRef(null);

  const [devices,  setDevices]  = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [results,  setResults]  = useState([]);
  const [mode,     setMode]     = useState("stream");
  const [streamCamId, setStreamCamId] = useState(0);
  const [streaming,   setStreaming]   = useState(false);
  const [liveness,    setLiveness]    = useState(null);
  const [livenessActive, setLivenessActive] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((list) => {
      const cams = list.filter((d) => d.kind === "videoinput");
      setDevices(cams);
      const builtin = cams.find((d) => /integrated|built.?in|facetime|internal/i.test(d.label));
      setDeviceId(builtin?.deviceId || cams[0]?.deviceId || "");
    });
  }, []);

  /* ── Stream ── */
  const startStream = () => {
    if (imgRef.current) imgRef.current.src = `${API}/camera/stream/${streamCamId}?t=${Date.now()}`;
    setStreaming(true);
    const sse = new EventSource(`${API}/camera/stream-results`);
    sse.onmessage = (e) => setResults((p) => [JSON.parse(e.data), ...p].slice(0, 50));
    sseRef.current = sse;
  };

  const stopStream = () => {
    if (imgRef.current) imgRef.current.src = "";
    if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
    setStreaming(false);
  };

  /* ── Liveness ── */
  const startLiveness = () => {
    if (wsRef.current) wsRef.current.close();
    setLiveness(null);
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      setLiveness(msg.liveness);
      if (msg.liveness?.error) { alert("Lỗi: " + msg.liveness.error); stopLiveness(); return; }
      if (msg.result) {
        setResults((p) => [{ ...msg.result, time: new Date().toLocaleTimeString() }, ...p].slice(0, 50));
        setTimeout(() => { setLiveness(null); wsRef.current?.close(); wsRef.current = null; setLivenessActive(false); }, 3000);
      }
    };
    ws.onclose = () => { clearInterval(livenessIntervalRef.current); setLivenessActive(false); };
    ws.onerror = () => { clearInterval(livenessIntervalRef.current); setLivenessActive(false); };
    setLivenessActive(true);

    livenessIntervalRef.current = setInterval(() => {
      if (!webcamRef.current || ws.readyState !== WebSocket.OPEN) return;
      const img = webcamRef.current.getScreenshot();
      if (img) ws.send(JSON.stringify({ frame: img.split(",")[1] }));
    }, 100);
  };

  const stopLiveness = () => {
    clearInterval(livenessIntervalRef.current);
    wsRef.current?.close(); wsRef.current = null;
    setLivenessActive(false); setLiveness(null);
  };

  const switchMode = (m) => {
    if (streaming) stopStream();
    stopLiveness();
    setMode(m);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Cột trái — Camera */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-5">Điểm danh</h1>

        {/* Tab */}
        <div className="flex rounded-lg border overflow-hidden mb-5">
          {[["stream","Stream realtime"],["liveness","Chống gian lận"]].map(([key, label]) => (
            <button key={key} onClick={() => switchMode(key)}
              className={`flex-1 py-2 text-sm font-medium transition ${
                mode === key ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Stream */}
        {mode === "stream" && (
          <div className="space-y-3">
            <div className="bg-gray-900 rounded-xl overflow-hidden min-h-60 flex items-center justify-center">
              <img ref={imgRef} alt="stream" className={`w-full ${streaming ? "block" : "hidden"}`}
                onError={() => setStreaming(false)} />
              {!streaming && <p className="text-gray-500 text-sm">Nhấn Bắt đầu để khởi động stream</p>}
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">Camera</label>
                <select value={streamCamId}
                  onChange={(e) => { stopStream(); setStreamCamId(Number(e.target.value)); }}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  {[0,1,2,3].map((i) => <option key={i} value={i}>Camera {i}</option>)}
                </select>
              </div>
              <button onClick={streaming ? stopStream : startStream}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                  streaming ? "bg-red-500 text-white hover:bg-red-600" : "bg-blue-600 text-white hover:bg-blue-700"
                }`}>
                {streaming ? "Dừng" : "Bắt đầu"}
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center">Nhận diện tự động, kết quả hiển thị bên phải</p>
          </div>
        )}

        {/* Chống gian lận (Liveness) */}
        {mode === "liveness" && (
          <div className="space-y-3">
            <div className="bg-gray-900 rounded-xl overflow-hidden relative">
              <Webcam key={deviceId + "liveness"} ref={webcamRef} screenshotFormat="image/jpeg"
                videoConstraints={{ width: 640, height: 480, deviceId: deviceId || undefined }}
                className="w-full" />
              {livenessActive && liveness && (
                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white p-3 text-center">
                  {liveness.passed ? (
                    <p className="text-green-400 font-semibold">Xác thực thành công</p>
                  ) : (
                    <>
                      <p className="text-sm mb-2">Hãy chớp mắt tự nhiên</p>
                      <div className="flex justify-center gap-2 mb-1">
                        {Array.from({ length: liveness.required }).map((_, i) => (
                          <div key={i} className={`w-5 h-5 rounded-full border-2 transition-all ${
                            i < liveness.blink_count ? "bg-green-400 border-green-400" : "border-gray-400"
                          }`} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-300">{liveness.blink_count}/{liveness.required} lần chớp</p>
                    </>
                  )}
                </div>
              )}
            </div>
            {devices.length > 1 && (
              <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                {devices.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${i+1}`}</option>)}
              </select>
            )}
            <button onClick={livenessActive ? stopLiveness : startLiveness}
              className={`w-full py-2 rounded-lg font-medium text-sm transition ${
                livenessActive ? "bg-red-500 text-white hover:bg-red-600" : "bg-blue-600 text-white hover:bg-blue-700"
              }`}>
              {livenessActive ? "Dừng" : "Bắt đầu điểm danh"}
            </button>
            <p className="text-xs text-gray-400 text-center">Yêu cầu chớp mắt 2 lần — ảnh tĩnh và video không thể qua được</p>
          </div>
        )}
      </div>

      {/* Cột phải — Kết quả */}
      <div>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-gray-800">Kết quả nhận diện</h2>
          <button onClick={() => setResults([])} className="text-xs text-gray-400 hover:text-red-500 transition">Xóa</button>
        </div>
        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
          {results.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm">Chưa có kết quả</div>
          )}
          {results.map((r, i) => (
            <div key={i} className={`rounded-xl border px-4 py-3 flex justify-between items-center shadow-sm ${
              r.action === "unknown" ? "bg-red-50 border-red-200" : "bg-white"
            }`}>
              <div>
                <p className={`font-medium ${r.action === "unknown" ? "text-red-700" : "text-gray-900"}`}>
                  {r.action === "unknown" ? "⚠ Người lạ" : r.name}
                </p>
                {r.code && <p className="text-xs text-gray-400 mt-0.5">Mã: {r.code}</p>}
                <p className="text-xs text-gray-300 mt-0.5">{r.time}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[r.action] || "bg-gray-100 text-gray-500"}`}>
                  {STATUS_LABEL[r.action] || r.action}
                </span>
                <p className="text-xs text-gray-400 mt-1">{(r.score * 100).toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
