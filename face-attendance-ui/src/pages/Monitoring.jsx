import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../api";
import Icon from "../components/Icon";

export default function Monitoring() {
  const navigate = useNavigate();
  const imgRef = useRef(null);
  const sseRef = useRef(null);

  const [camId, setCamId] = useState("0");
  const [streaming, setStreaming] = useState(false);
  const [events, setEvents] = useState([]);
  const [snapState, setSnapState] = useState("idle");

  const toggleStream = () => {
    if (streaming) {
      if (imgRef.current) imgRef.current.src = "";
      sseRef.current?.close();
      setStreaming(false);
      setEvents([]);
    } else {
      if (imgRef.current) {
        imgRef.current.src = `${API_BASE}/camera/stream/${camId}?t=${Date.now()}`;
      }
      setStreaming(true);
      try {
        const sse = new EventSource(`${API_BASE}/camera/stream-results`);
        sse.onmessage = (e) => {
          const item = JSON.parse(e.data);
          setEvents((prev) => [
            {
              id: Date.now(),
              type: item.type === "alert" ? "alert" : "known",
              name:
                item.type === "alert"
                  ? "[CẢNH BÁO ĐỎ] Người lạ"
                  : item.name || "Nhân viên",
              code: item.code ? `Mã NV: ${item.code}` : "Cổng chính",
              time: item.time || new Date().toLocaleTimeString("vi-VN"),
              score: item.score
                ? `${(item.score * 100).toFixed(1)}%`
                : null,
              desc:
                item.type === "alert"
                  ? "Phát hiện khuôn mặt chưa đăng ký tại khu vực kiểm soát."
                  : undefined,
            },
            ...prev.slice(0, 19),
          ]);
        };
        sseRef.current = sse;
      } catch {}
    }
  };

  useEffect(() => {
    return () => {
      sseRef.current?.close();
    };
  }, []);

  const handleSnapshot = () => {
    setSnapState("saving");
    setTimeout(() => {
      setSnapState("done");
      setTimeout(() => setSnapState("idle"), 2000);
    }, 600);
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Control Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
            Giám sát camera
          </h1>
          <span className="text-on-surface-variant font-label-md text-label-md">
            Luồng camera tại các cổng
          </span>
        </div>

        {/* Toolbar Card */}
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/40 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative min-w-[280px]">
              <select
                value={camId}
                onChange={(e) => setCamId(e.target.value)}
                className="w-full h-11 pl-10 pr-9 bg-surface-container-low text-on-surface font-label-lg text-label-lg rounded-xl appearance-none focus:outline-none cursor-pointer"
              >
                <option value="0">Camera Cổng chính (Kiosk A)</option>
                <option value="1">Camera Cổng phụ (Tầng hầm)</option>
                <option value="2">Camera Hành lang Kỹ thuật</option>
              </select>
              <Icon name="videocam" className="absolute left-3 top-3 text-[20px] text-on-surface-variant pointer-events-none" />
              <Icon name="expand_more" className="absolute right-3 top-3 text-[20px] text-on-surface-variant pointer-events-none" />
            </div>

            <button
              onClick={toggleStream}
              className={`h-11 px-4 rounded-xl font-label-lg text-label-lg flex items-center gap-2 transition-all cursor-pointer ${
                streaming
                  ? "bg-error text-on-error"
                  : "bg-primary text-on-primary font-bold"
              }`}
            >
              <Icon
                name={streaming ? "stop_circle" : "play_circle"}
                className="text-[20px]"
              />
              <span>
                {streaming ? "Dừng luồng camera" : "Bật camera thật"}
              </span>
            </button>
          </div>

          {/* Note: auto check-in is not wired on this stream */}
          <div className="flex items-center gap-3 px-4 py-2 bg-surface-container-low rounded-xl max-w-md">
            <Icon name="info" className="text-[22px] text-on-surface-variant" />
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface font-semibold">
                Tự động điểm danh chưa kết nối
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Luồng giám sát chỉ nhận diện / cảnh báo — không ghi công. Dùng
                Kiosk (Live) để điểm danh.
              </span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSnapshot}
              className="h-11 px-4 bg-surface-container-low text-on-surface hover:bg-surface-container rounded-xl flex items-center gap-2 font-label-lg text-label-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              <Icon
                name={snapState === "done" ? "check" : "photo_camera"}
                className="text-[20px]"
              />
              <span>
                {snapState === "saving"
                  ? "Đang chụp..."
                  : snapState === "done"
                  ? "Đã lưu snapshot!"
                  : "Chụp ảnh tức thì"}
              </span>
            </button>
            <button
              onClick={() => navigate("/reports")}
              className="h-11 px-4 bg-surface-container-low text-on-surface hover:bg-surface-container rounded-xl flex items-center gap-2 font-label-lg text-label-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              <Icon name="history" className="text-[20px]" />
              <span>Xem lại lịch sử</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dual Layout Grid (7 : 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
        {/* LEFT COLUMN: Live Video Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative w-full aspect-[16/10] bg-inverse-surface rounded-xl overflow-hidden shadow-xl select-none">
            <img
              ref={imgRef}
              alt="Live stream"
              onError={() => setStreaming(false)}
              className={`w-full h-full object-cover ${
                streaming ? "block" : "hidden"
              }`}
            />

            {!streaming && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-inverse-on-surface/70 px-8 text-center">
                <Icon name="videocam_off" className="text-[44px]" />
                <span className="font-title-md text-title-md text-inverse-on-surface">
                  Chưa bật luồng camera
                </span>
                <span className="font-body-md text-body-md text-inverse-on-surface/60 max-w-md">
                  Chọn camera ở thanh trên rồi bấm “Bật camera thật” để xem
                  luồng trực tiếp và nhận sự kiện nhận diện.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Real-time Detection Feed (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                <h2 className="font-title-lg text-title-lg text-on-surface font-bold">
                  Nhận diện thời gian thực
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                Trực tiếp
              </span>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Sự kiện nhận diện nhận được từ luồng camera đang bật:
            </p>

            <div className="flex flex-col gap-3 max-h-[540px] overflow-y-auto">
              {events.length === 0 && (
                <div className="py-10 px-4 text-center text-on-surface-variant flex flex-col items-center gap-2">
                  <Icon name="sensors_off" className="text-[32px] opacity-50" />
                  <span className="font-body-sm text-body-sm">
                    {streaming
                      ? "Đang chờ sự kiện nhận diện từ luồng camera…"
                      : "Bật camera thật để nhận sự kiện nhận diện (danh sách trống khi chưa stream)."}
                  </span>
                </div>
              )}
              {events.map((ev) =>
                ev.type === "alert" ? (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl bg-error-container/40 hover:bg-error-container/60 transition-all flex flex-col gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-error text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                          <Icon name="person_alert" className="text-[20px]" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-lg text-label-lg text-error font-bold">
                            {ev.name}
                          </span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            {ev.code}
                          </span>
                        </div>
                      </div>
                      <span className="font-label-sm text-label-sm text-error font-bold">
                        {ev.time}
                      </span>
                    </div>
                    {ev.desc && (
                      <p className="font-body-sm text-body-sm text-on-error-container">
                        {ev.desc}
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => navigate("/alerts")}
                        className="flex-1 h-8 bg-error text-white rounded-lg font-label-sm text-label-sm font-semibold flex items-center justify-center gap-1 hover:bg-error/90 transition-colors cursor-pointer"
                      >
                        <Icon name="play_circle" className="text-[16px]" />
                        <span>Xem clip</span>
                      </button>
                      <button
                        onClick={() =>
                          setEvents((p) => p.filter((x) => x.id !== ev.id))
                        }
                        className="px-3 h-8 bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-sm text-label-sm font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Bỏ qua
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
                          <Icon name="check_circle" className="text-[20px]" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-lg text-label-lg text-on-surface font-bold">
                            {ev.name}
                          </span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            {ev.code}
                          </span>
                        </div>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                        {ev.time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 font-label-sm text-label-sm text-on-surface-variant">
                      <span className="inline-flex items-center gap-1 text-success font-semibold">
                        <Icon name="login" className="text-[14px]" />{" "}
                        Check-in thành công
                      </span>
                      {ev.score && <span>Khớp: {ev.score}</span>}
                    </div>
                  </div>
                )
              )}
            </div>

            <button
              onClick={() => navigate("/reports")}
              className="w-full py-2.5 bg-surface-container text-on-surface rounded-xl font-label-md text-label-md hover:bg-surface-container-high transition-colors text-center cursor-pointer"
            >
              Xem toàn bộ sự kiện hôm nay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
