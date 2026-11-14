import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";

const API = "http://localhost:8000";

function Toast({ items }) {
  return (
    <div className="fixed bottom-6 right-6 space-y-2 z-50 pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl border text-sm font-medium shadow-lg backdrop-blur-sm ${
            t.type === "alert"
              ? "bg-error-container/90 border-error/30 text-error"
              : "bg-emerald-50/95 border-emerald-200 text-emerald-800"
          }`}
        >
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
  const [streaming, setStreaming] = useState(false);
  const [camId, setCamId] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [recognized, setRecognized] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [lastIdentified, setLastIdentified] = useState(null);

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
      const entry = { ...r, ts: new Date().toLocaleTimeString("vi-VN") };
      if (r.action === "unknown") {
        setAlerts((p) => [entry, ...p].slice(0, 20));
        addToast({ type: "alert", ...entry });
      } else {
        setRecognized((p) => [entry, ...p].slice(0, 30));
        setLastIdentified(entry);
        addToast({ type: "recognized", name: r.name, ts: entry.ts });
      }
    };
    sseRef.current = sse;
  };

  const stop = () => {
    if (imgRef.current) imgRef.current.src = "";
    sseRef.current?.close();
    sseRef.current = null;
    setStreaming(false);
  };

  useEffect(() => () => stop(), []);

  return (
    <div className="flex gap-8 flex-col xl:flex-row">
      <Toast items={toasts} />

      <div className="flex-1 flex flex-col gap-6 min-w-0">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-1 bg-surface-container-low p-1 rounded-xl">
            <span className="px-6 py-2 bg-surface-container-lowest shadow-sm rounded-lg text-primary font-bold flex items-center gap-2 text-sm">
              <Icon name="videocam" className="text-xl" />
              Stream trực tiếp
            </span>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={camId}
              onChange={(e) => { stop(); setCamId(Number(e.target.value)); }}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              {[0, 1, 2, 3].map((i) => (
                <option key={i} value={i}>Camera {i}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <span className={`w-2 h-2 rounded-full ${streaming ? "bg-emerald-500 animate-pulse" : "bg-outline"}`} />
              {streaming ? "ĐANG PHÁT" : "OFFLINE"}
            </div>
          </div>
        </div>

        <div className="relative flex-1 bg-primary-container rounded-3xl overflow-hidden shadow-xl border border-primary-fixed-dim/20 min-h-[420px]">
          <img
            ref={imgRef}
            alt="stream"
            className={`absolute inset-0 w-full h-full object-cover ${streaming ? "block" : "hidden"}`}
            onError={stop}
          />
          {!streaming && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-on-primary-container">
              <Icon name="videocam_off" className="text-6xl opacity-40" />
              <p className="text-sm opacity-60">Nhấn Bắt đầu để khởi động camera</p>
            </div>
          )}

          {streaming && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="scanning-line" />
              <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-secondary-container/60 rounded-lg">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-secondary-container" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-secondary-container" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-secondary-container" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-secondary-container" />
              </div>
            </div>
          )}

          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap justify-between items-end gap-4 pointer-events-auto">
            <div className="glass-panel px-6 py-4 rounded-2xl">
              <p className="text-primary text-[10px] font-bold uppercase tracking-widest opacity-60">Trạng thái</p>
              <p className="text-primary font-semibold text-base flex items-center gap-2 mt-1">
                <Icon name="face" className="text-secondary" />
                {streaming ? "Đang nhận diện khuôn mặt..." : "Camera tắt"}
              </p>
            </div>
            <button
              type="button"
              onClick={streaming ? stop : start}
              className={`px-8 h-14 rounded-full font-bold flex items-center gap-3 shadow-lg active:scale-95 transition-all ${
                streaming
                  ? "bg-error text-white hover:brightness-110"
                  : "bg-secondary text-on-secondary hover:opacity-90"
              }`}
            >
              <Icon name={streaming ? "stop_circle" : "play_circle"} />
              {streaming ? "DỪNG" : "BẮT ĐẦU"}
            </button>
          </div>
        </div>
      </div>

      <div className="w-full xl:w-80 flex flex-col gap-6 shrink-0">
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-3xl shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-4">
            Vừa nhận diện
          </h3>
          {lastIdentified ? (
            <div className="space-y-3">
              <div className="w-full aspect-square rounded-2xl bg-primary-container flex items-center justify-center border-2 border-secondary-container/30 relative">
                <span className="text-5xl font-bold text-secondary-container">
                  {lastIdentified.name?.[0]}
                </span>
                <div className="absolute top-3 right-3 bg-tertiary-fixed text-on-tertiary-fixed px-2 py-1 rounded text-[10px] font-bold">
                  {((lastIdentified.score || 0) * 100).toFixed(0)}% MATCH
                </div>
              </div>
              <div>
                <h4 className="text-xl font-bold text-primary">{lastIdentified.name}</h4>
                <p className="text-on-surface-variant text-sm flex items-center gap-2 mt-2">
                  <Icon name="schedule" className="text-sm" />
                  {lastIdentified.ts}
                </p>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg text-xs font-bold">
                <Icon name="check_circle" className="text-sm" filled />
                ĐÃ NHẬN DIỆN
              </div>
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant text-center py-8">Chưa có</p>
          )}
        </div>

        <div className="bg-surface-container-low/50 rounded-3xl p-6 border border-outline-variant flex-1">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
              Cảnh báo người lạ
            </h3>
            {alerts.length > 0 && (
              <button type="button" onClick={() => setAlerts([])} className="text-xs text-secondary hover:underline">
                Xóa
              </button>
            )}
          </div>
          <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar">
            {alerts.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-4">Không có cảnh báo</p>
            ) : (
              alerts.map((a, i) => (
                <div key={i} className="flex items-center gap-3 bg-error-container/30 rounded-lg px-3 py-2">
                  <Icon name="warning" className="text-error text-lg" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-error truncate">Người lạ</p>
                    <p className="text-[11px] text-on-surface-variant">{a.ts}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-surface-container-low/50 rounded-3xl p-6 border border-outline-variant">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
              Hoạt động
            </h3>
            <button type="button" onClick={() => setRecognized([])} className="text-xs text-secondary hover:underline">
              Xóa
            </button>
          </div>
          <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
            {recognized.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-4">Chưa có</p>
            ) : (
              recognized.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-container/20 border border-outline-variant flex items-center justify-center font-bold text-sm text-primary">
                    {r.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{r.name}</p>
                    <p className="text-[11px] text-on-surface-variant">{r.ts} • {((r.score || 0) * 100).toFixed(0)}%</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <Link
            to="/reports"
            className="w-full mt-4 py-2 text-xs font-bold text-secondary hover:bg-secondary-container/20 rounded-lg transition-colors border border-dashed border-secondary/30 flex items-center justify-center"
          >
            Xem báo cáo đầy đủ
          </Link>
        </div>
      </div>
    </div>
  );
}
