import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../api";

const INITIAL_EVENTS = [
  {
    id: 1,
    type: "known",
    name: "Trần Thị B",
    code: "NV014 - Kế toán",
    time: "08:35:10",
    score: "98.9%",
  },
  {
    id: 2,
    type: "known",
    name: "Lê Hoàng Nam",
    code: "NV032 - Kỹ thuật",
    time: "08:34:22",
    score: "99.6%",
  },
  {
    id: 3,
    type: "alert",
    name: "[CẢNH BÁO ĐỎ] Người lạ",
    code: "Cổng chính > 30s",
    time: "08:32:05",
    desc: "Đối tượng không có trong CSDL nhân viên đang đứng chờ tại phạm vi kiểm soát lối vào.",
  },
  {
    id: 4,
    type: "known",
    name: "Vũ Thị Mai",
    code: "NV009 - Nhân sự",
    time: "08:29:45",
    score: "97.4%",
  },
];

export default function Monitoring() {
  const navigate = useNavigate();
  const imgRef = useRef(null);
  const sseRef = useRef(null);

  const [camId, setCamId] = useState("0");
  const [autoCheckin, setAutoCheckin] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [snapState, setSnapState] = useState("idle");
  const [showToast, setShowToast] = useState(true);

  const toggleStream = () => {
    if (streaming) {
      if (imgRef.current) imgRef.current.src = "";
      sseRef.current?.close();
      setStreaming(false);
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
              score: item.score ? `${(item.score * 100).toFixed(1)}%` : "99.1%",
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
      {/* Top Telemetry & Control Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-surface-container-highest text-on-surface font-code-telemetry text-code-telemetry rounded font-bold">
              GIÁM SÁT THỊ GIÁC MÁY HỌC
            </span>
            <span className="text-on-surface-variant font-label-md text-label-md flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              Luồng quan sát đa kênh (Edge AI Live Stream)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-code-telemetry text-code-telemetry text-on-surface-variant">
              Băng thông: 4.8 Mbps
            </span>
            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
            <span className="font-code-telemetry text-code-telemetry text-on-surface-variant">
              Độ trễ AI: 18ms
            </span>
          </div>
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
              <span className="material-symbols-outlined absolute left-3 top-3 text-[20px] text-on-surface-variant pointer-events-none">
                videocam
              </span>
              <span className="material-symbols-outlined absolute right-3 top-3 text-[20px] text-on-surface-variant pointer-events-none">
                expand_more
              </span>
            </div>

            <button
              onClick={toggleStream}
              className={`h-11 px-4 rounded-xl font-label-lg text-label-lg flex items-center gap-2 transition-all cursor-pointer ${
                streaming
                  ? "bg-error text-on-error"
                  : "bg-secondary-fixed text-secondary font-bold"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {streaming ? "stop_circle" : "play_circle"}
              </span>
              <span>
                {streaming
                  ? "Dừng luồng Camera thật"
                  : "HD 1080p - 30 FPS - Bật Camera thật"}
              </span>
            </button>
          </div>

          {/* Center: Auto-Logging Switch */}
          <div className="flex items-center gap-3 px-4 py-2 bg-surface-container-low rounded-xl">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                checked={autoCheckin}
                onChange={(e) => setAutoCheckin(e.target.checked)}
                className="sr-only peer"
                type="checkbox"
              />
              <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1.5">
                Tự ghi công
                <span className="px-1.5 py-0.5 bg-secondary/10 text-secondary text-[10px] rounded font-bold">
                  {autoCheckin ? "Kích hoạt" : "Tạm dừng"}
                </span>
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1 max-w-md">
                Tự động điểm danh khi nhận diện đạt &gt;95%, giãn cách 5
                phút/lần
              </span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSnapshot}
              className="h-11 px-4 bg-surface-container-low text-on-surface hover:bg-surface-container rounded-xl flex items-center gap-2 font-label-lg text-label-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                {snapState === "done" ? "check" : "photo_camera"}
              </span>
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
              <span className="material-symbols-outlined text-[20px]">
                history
              </span>
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
              <>
                <img
                  className="w-full h-full object-cover brightness-[0.92] contrast-[1.05]"
                  alt="CCTV Lobby"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPmfkKYP0h_6D-1g8xv5cFAiHokbDM0hsFNNj2KXuLtk9h8EzAvxzaXOzCa-0Zc27ChKDRWsNRfeAUMGUMTqqA3RlW92inbHHcAMmzn7E7onrNL87Bdyh7_-PQV6ln2k4TExrNzNLNXsluQ2ES0571NfVQ56-CpEMxE4-fBvLRvdCR1uQWhhj2T5ayLuwATkvt-6D2hlKXrQRJMYQgXGU9rrlw8JI6HNBCoAw8CP_69zH23T9pdeQHCQ"
                />

                {/* Bounding Box 1: Recognized Employee */}
                <div className="absolute top-[22%] left-[24%] w-[22%] h-[48%]">
                  <div
                    className="w-full h-full rounded-lg relative flex flex-col justify-between p-1 shadow-[0_0_24px_rgba(0,150,104,0.35)]"
                    style={{ boxShadow: "inset 0 0 0 2px #009668" }}
                  >
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-[#009668] rounded-xs" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#009668] rounded-xs" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-[#009668] rounded-xs" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#009668] rounded-xs" />
                    <div className="absolute -top-10 left-0 bg-[#009668] text-white px-2.5 py-1 rounded shadow-md flex items-center gap-1.5 whitespace-nowrap">
                      <span className="material-symbols-outlined material-symbols-filled text-[16px]">
                        verified
                      </span>
                      <span className="font-label-md text-label-md font-bold">
                        NV: Nguyễn Văn A (NV001)
                      </span>
                      <span className="px-1.5 py-0.5 bg-black/25 text-[10px] font-code-telemetry rounded">
                        99.4%
                      </span>
                    </div>
                    <div className="absolute -bottom-8 left-0 right-0 mx-auto w-fit bg-inverse-surface/90 backdrop-blur-md text-secondary-fixed px-2.5 py-0.5 rounded font-label-sm text-label-sm shadow flex items-center gap-1 whitespace-nowrap">
                      <span className="material-symbols-outlined text-[14px]">
                        done_all
                      </span>
                      <span>Đã ghi công 07:52</span>
                    </div>
                  </div>
                </div>

                {/* Bounding Box 2: Unknown Stranger */}
                <div className="absolute top-[28%] right-[22%] w-[20%] h-[44%]">
                  <div
                    className="w-full h-full rounded-lg relative flex flex-col justify-between p-1 shadow-[0_0_24px_rgba(186,26,26,0.45)]"
                    style={{ boxShadow: "inset 0 0 0 2px #ba1a1a" }}
                  >
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-error rounded-xs" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-xs" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-error rounded-xs" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-error rounded-xs" />
                    <div className="absolute -top-10 left-0 bg-error text-white px-2.5 py-1 rounded shadow-md flex items-center gap-1.5 whitespace-nowrap">
                      <span className="material-symbols-outlined text-[16px] animate-pulse">
                        crisis_alert
                      </span>
                      <span className="font-label-md text-label-md font-bold">
                        CẢNH BÁO: NGƯỜI LẠ
                      </span>
                      <span className="px-1.5 py-0.5 bg-black/30 text-[10px] font-code-telemetry rounded">
                        Unknown
                      </span>
                    </div>
                    <div className="absolute -bottom-8 left-0 right-0 mx-auto w-fit bg-error text-white px-2.5 py-0.5 rounded font-label-sm text-label-sm shadow flex items-center gap-1 whitespace-nowrap">
                      <span className="material-symbols-outlined text-[14px]">
                        timer
                      </span>
                      <span>Đứng chờ 45s</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Top HUD Metadata */}
            <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 bg-inverse-surface/85 backdrop-blur-md px-3 py-1.5 rounded-lg text-inverse-on-surface font-code-telemetry text-code-telemetry">
                <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping"></span>
                <span className="font-bold tracking-wider">REC</span>
                <span className="opacity-40">|</span>
                <span>CAM_01_GATE_KIOSK_A</span>
                <span className="opacity-40">|</span>
                <span className="text-secondary-fixed">FPS: 29.98</span>
              </div>
              <div className="flex items-center gap-2 bg-inverse-surface/85 backdrop-blur-md px-3 py-1.5 rounded-lg text-inverse-on-surface font-code-telemetry text-code-telemetry">
                <span className="material-symbols-outlined text-[16px] text-secondary-fixed">
                  hub
                </span>
                <span>NEURAL_ENGINE v4.2: ONNX_RUN</span>
              </div>
            </div>

            {/* Secondary PiP Error Feed */}
            <div className="absolute bottom-4 left-4 w-64 h-40 bg-inverse-surface/95 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl flex flex-col justify-between p-3">
              <div className="flex items-center justify-between">
                <span className="font-code-telemetry text-code-telemetry text-inverse-on-surface font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                  CAM_02 (TẦNG HẦM)
                </span>
                <span className="px-1.5 py-0.5 bg-error text-white font-label-sm text-label-sm rounded font-bold">
                  Offline
                </span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1 text-center py-2">
                <span className="material-symbols-outlined text-error text-[32px] animate-pulse">
                  videocam_off
                </span>
                <span className="font-label-md text-label-md text-white font-semibold">
                  MẤT KẾT NỐI
                </span>
                <span className="font-code-telemetry text-surface-dim text-[11px]">
                  Signal Lost - Err 503 RTSP
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={toggleStream}
                  className="px-2 py-1 bg-surface-container-highest text-on-surface font-label-sm text-label-sm rounded hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Thử kết nối lại
                </button>
                <span className="font-code-telemetry text-on-surface-variant text-[11px]">
                  08:35:12
                </span>
              </div>
            </div>
          </div>

          {/* Quick Telemetry Strip */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-xs flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Lượt điểm danh ca sáng
                </span>
                <span className="font-headline-md text-headline-md text-on-surface font-bold">
                  142
                  <span className="font-title-md text-title-md text-on-surface-variant font-normal">
                    /150
                  </span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[22px]">
                  fingerprint
                </span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-xs flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Độ tin cậy AI trung bình
                </span>
                <span className="font-headline-md text-headline-md text-on-surface font-bold">
                  99.1%
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container">
                <span className="material-symbols-outlined text-[22px]">
                  verified_user
                </span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-xs flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Phát hiện người lạ hôm nay
                </span>
                <span className="font-headline-md text-headline-md text-error font-bold">
                  3{" "}
                  <span className="font-title-md text-title-md text-error/70 font-normal">
                    sự kiện
                  </span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-error-container flex items-center justify-center text-on-error-container">
                <span className="material-symbols-outlined text-[22px]">
                  person_alert
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-time Detection Feed (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
                </span>
                <h2 className="font-title-lg text-title-lg text-on-surface font-bold">
                  Nhận diện thời gian thực
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-code-telemetry text-code-telemetry">
                Live log
              </span>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Dòng sự kiện trích xuất trực tiếp từ mô hình phân tích thị giác
              tại các chốt cổng:
            </p>

            <div className="flex flex-col gap-3 max-h-[540px] overflow-y-auto">
              {events.map((ev) =>
                ev.type === "alert" ? (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl bg-error-container/40 hover:bg-error-container/60 transition-all flex flex-col gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-error text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                          <span className="material-symbols-outlined text-[20px]">
                            person_alert
                          </span>
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
                      <span className="font-code-telemetry text-code-telemetry text-error font-bold">
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
                        <span className="material-symbols-outlined text-[16px]">
                          play_circle
                        </span>
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
                        <div className="w-9 h-9 rounded-full bg-[#009668]/10 text-[#009668] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined material-symbols-filled text-[20px]">
                            check_circle
                          </span>
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
                      <span className="font-code-telemetry text-code-telemetry text-on-surface-variant font-semibold">
                        {ev.time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 font-label-sm text-label-sm text-on-surface-variant">
                      <span className="inline-flex items-center gap-1 text-[#009668] font-semibold">
                        <span className="material-symbols-outlined text-[14px]">
                          login
                        </span>{" "}
                        Check-in thành công
                      </span>
                      <span className="font-code-telemetry">
                        Khớp: {ev.score}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>

            <button
              onClick={() => navigate("/reports")}
              className="w-full py-2.5 bg-surface-container text-on-surface rounded-xl font-label-md text-label-md hover:bg-surface-container-high transition-colors text-center cursor-pointer"
            >
              Xem toàn bộ 142 sự kiện hôm nay
            </button>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/40 shadow-xs flex flex-col gap-3">
            <span className="font-label-lg text-label-lg text-on-surface font-bold">
              Tình trạng Kiosk Biên (Edge Device)
            </span>
            <div className="flex flex-col gap-2 font-label-sm text-label-sm">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">
                  Nhiệt độ GPU (NPU)
                </span>
                <span className="font-code-telemetry text-on-surface font-semibold">
                  54°C (Ổn định)
                </span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-secondary h-full rounded-full"
                  style={{ width: "48%" }}
                />
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-on-surface-variant">
                  Bộ nhớ VRAM sử dụng
                </span>
                <span className="font-code-telemetry text-on-surface font-semibold">
                  2.1 / 4.0 GB
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {showToast && (
        <div
          className="fixed bottom-6 right-6 z-50 max-w-md bg-white rounded-xl p-4 flex items-start gap-3.5 border border-outline-variant/40"
          style={{ boxShadow: "0 10px 30px -4px rgba(0, 150, 104, 0.22)" }}
        >
          <div className="w-10 h-10 rounded-full bg-[#009668]/15 text-[#009668] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined material-symbols-filled text-[24px]">
              check_circle
            </span>
          </div>
          <div className="flex flex-col gap-1 pr-6">
            <div className="flex items-center gap-2">
              <span className="font-label-lg text-label-lg text-on-surface font-bold">
                Tự động ghi nhận công
              </span>
              <span className="px-1.5 py-0.5 bg-[#009668]/10 text-[#009668] text-[10px] rounded font-bold">
                Thành công
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Nhân viên: <strong className="text-on-surface">Nguyễn Văn A</strong>{" "}
              (07:52:10). Cooldown 5 phút đã kích hoạt cho camera này.
            </p>
          </div>
          <button
            onClick={() => setShowToast(false)}
            className="absolute top-3 right-3 text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
