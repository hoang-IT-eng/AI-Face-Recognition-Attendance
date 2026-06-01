import { useRef, useState, useEffect } from "react";

const API = "http://localhost:8000";

function Toast({ items }) {
  return (
    <div className="fixed bottom-6 right-6 space-y-2 z-50 pointer-events-none">
      {items.map((t) => (
        <div key={t.id}
          className={`px-4 py-3 rounded-xl border text-sm font-medium shadow-lg backdrop-blur-sm transition-all
            ${t.type === "alert"
              ? "bg-red-500/20 border-red-500/30 text-red-300"
              : "bg-green-500/20 border-green-500/30 text-green-300"
            }`}>
          {t.type === "alert" ? "Cảnh báo: Phát hiện người lạ" : `Nhận diện: ${t.name}`}
          <span className="ml-2 text-xs opacity-60">{t.ts}</span>
        </div>
      ))}
    </div>
  );
}

export default function Stream() {
  const imgRef = useRef(null);
  const sseRef = useRef(null);
  const [streaming,  setStreaming]  = useState(false);
  const [camId,      setCamId]      = useState(0);
  const [alerts,     setAlerts]     = useState([]);
  const [recognized, setRecognized] = useState([]);
  const [toasts,     setToasts]     = useState([]);

  const addToast = (item) => {
    const id = Date.now();
    setToasts((p) => [...p, { ...item, id }].slice(-4));
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  const start = () => {
    if (imgRef.current) imgRef.current.src = `${API}/camera/stream/${camId}?t=${Date.now()}`;
    setStreaming(true);
    const sse = new EventSource(`${API}/camera/stream-results`);
    sse.onmessage = (e) => {
      const r = JSON.parse(e.data);
      const entry = { ...r, ts: new Date().toLocaleTimeString() };
      if (r.action === "unknown") {
        setAlerts((p) => [entry, ...p].slice(0, 20));
        addToast({ type: "alert", ...entry });
      } else {
        setRecognized((p) => [entry, ...p].slice(0, 30));
        addToast({ type: "recognized", name: r.name, ts: entry.ts });
      }
    };
    sseRef.current = sse;
  };

  const stop = () => {
    if (imgRef.current) imgRef.current.src = "";
    sseRef.current?.close(); sseRef.current = null;
    setStreaming(false);
  };

  useEffect(() => () => stop(), []);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <Toast items={toasts} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Giám sát trực tiếp</h1>
          <p className="text-white/40 text-sm mt-0.5">Nhận diện và cảnh báo người lạ theo thời gian thực</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={camId} onChange={(e) => { stop(); setCamId(Number(e.target.value)); }}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
            {[0,1,2,3].map((i) => <option key={i} value={i} className="bg-[#1a1d27]">Camera {i}</option>)}
          </select>
          <button onClick={streaming ? stop : start}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              streaming
                ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                : "bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30"
            }`}>
            {streaming ? "Dừng" : "Bắt đầu"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Camera */}
        <div className="xl:col-span-2 space-y-3">
          <div className="bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-white/5">
            <img ref={imgRef} alt="stream"
              className={`w-full h-full object-cover ${streaming ? "block" : "hidden"}`}
              onError={stop} />
            {!streaming && (
              <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                  <svg className="w-7 h-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                  </svg>
                </div>
                <p className="text-white/25 text-sm">Nhấn Bắt đầu để khởi động camera</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 px-1">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${streaming ? "bg-green-400 animate-pulse" : "bg-white/15"}`} />
              <span className="text-xs text-white/35">{streaming ? "Đang phát" : "Offline"}</span>
            </div>
            {streaming && <span className="text-xs text-white/25">· Nhận diện mỗi 0.5 giây</span>}
          </div>
        </div>

        {/* Side panels */}
        <div className="space-y-4">
          {/* Cảnh báo */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-red-400">Cảnh báo người lạ</span>
              <div className="flex items-center gap-2">
                {alerts.length > 0 && (
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{alerts.length}</span>
                )}
                <button onClick={() => setAlerts([])} className="text-xs text-white/20 hover:text-white/40 transition">Xóa</button>
              </div>
            </div>
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-white/20 text-xs text-center py-5">Không có cảnh báo</p>
              ) : alerts.map((a, i) => (
                <div key={i} className="bg-red-500/10 border border-red-500/15 rounded-lg px-3 py-2 flex justify-between items-center">
                  <span className="text-red-300 text-xs font-medium">Người lạ phát hiện</span>
                  <span className="text-red-400/50 text-xs">{a.ts}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Đã nhận diện */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white/60">Đã nhận diện</span>
              <button onClick={() => setRecognized([])} className="text-xs text-white/20 hover:text-white/40 transition">Xóa</button>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {recognized.length === 0 ? (
                <p className="text-white/20 text-xs text-center py-5">Chưa có</p>
              ) : recognized.map((r, i) => (
                <div key={i} className="bg-white/4 rounded-lg px-3 py-2.5 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-white/75 font-medium">{r.name}</p>
                    <p className="text-xs text-white/25 mt-0.5">{r.ts}</p>
                  </div>
                  <span className="text-xs text-white/25">{(r.score * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
