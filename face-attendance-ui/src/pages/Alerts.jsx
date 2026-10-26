import { useState } from "react";

const INITIAL_ALERTS = [
  {
    id: "alert-1",
    level: "high",
    levelLabel: "MỨC CAO",
    time: "08:32:05",
    ago: "2 phút trước",
    type: "Người lạ đứng lâu",
    rule: "Quy tắc: Loitering > 30s",
    icon: "person_alert",
    target: "Camera Cổng chính Kiosk A",
    subTarget: "IP: 192.168.10.104 (Lối vào Lobby)",
    isCamera: true,
    detail:
      "Phát hiện đối tượng không có trong CSDL nhận diện lảng vảng tại khu vực kiểm soát an ninh > 45 giây liên tục.",
    tags: [
      "Độ tin cậy: 98.7%",
      "Tracking ID: #UNK-9941",
      "Gợi ý: Cử bảo vệ Lobby A",
    ],
    modalType: "video",
    resolved: false,
  },
  {
    id: "alert-2",
    level: "high",
    levelLabel: "MỨC CAO",
    time: "08:14:10",
    ago: "20 phút trước",
    type: "Nghi vấn giả mạo",
    rule: "Anti-spoofing AI",
    icon: "no_photography",
    target: "Camera Cổng B",
    subTarget: "IP: 192.168.10.108 (Cổng sau xưởng)",
    isCamera: true,
    detail:
      "Phát hiện bề mặt phẳng 2D (màn hình smartphone) quét vào camera. Thuật toán Depth IR từ chối kích hoạt cửa quay.",
    tags: [
      "IR Depth Score: 0.12 / 1.0",
      "Kèm ảnh chụp bằng chứng",
      "Khóa thẻ điểm danh 15p",
    ],
    modalType: "snapshot",
    resolved: false,
  },
  {
    id: "alert-3",
    level: "medium",
    levelLabel: "TRUNG BÌNH",
    time: "08:22:05",
    ago: "12 phút trước",
    type: "Đi muộn vượt quy định",
    rule: "Vi phạm ca làm việc",
    icon: "schedule",
    target: "Đỗ Minh Tuấn",
    subTarget: "NV028 · Phòng Kỹ thuật",
    isCamera: false,
    detail:
      "Check-in lúc 08:22 (Quy định 08:00, ân hạn đến 08:15). Trễ 7 phút so với khung cho phép.",
    tags: ["Ca: Hành chính (08:00 - 17:00)", "Lần vi phạm: 2/tháng"],
    modalType: null,
    resolved: false,
  },
  {
    id: "alert-4",
    level: "medium",
    levelLabel: "TRUNG BÌNH",
    time: "08:18:22",
    ago: "16 phút trước",
    type: "Đi muộn",
    rule: "Vi phạm nhẹ",
    icon: "timer",
    target: "Phạm Quỳnh Như",
    subTarget: "NV045 · Phòng Kế toán",
    isCamera: false,
    detail: "Check-in lúc 08:18. Trễ 3 phút so với khung giờ ân hạn 08:15.",
    tags: ["Lần đầu trong kỳ chấm công", "Tự động trừ 0.25 công"],
    modalType: null,
    resolved: true,
  },
  {
    id: "alert-5",
    level: "low",
    levelLabel: "MỨC THẤP",
    time: "08:45:00",
    ago: "Vừa xong",
    type: "Vắng chưa điểm danh",
    rule: "Tự động phát hiện vắng",
    icon: "person_off",
    target: "Ngô Thảo Linh",
    subTarget: "NV102 · Ban Nhân sự",
    isCamera: false,
    detail:
      "Quá 45 phút kể từ đầu ca chưa có bản ghi vào cổng. Chưa gửi đơn xin nghỉ phép trên portal HRM.",
    tags: ["Trạng thái: Không phép tạm thời", "SĐT: 0912.***.892"],
    modalType: null,
    resolved: false,
  },
];

export default function Alerts() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [levelFilter, setLevelFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const markResolved = (id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolved: true } : a))
    );
    showToast("Đã đánh dấu xử lý cảnh báo thành công");
  };

  const markAllResolved = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, resolved: true })));
    showToast("Tất cả cảnh báo đã được xác nhận đã xem");
  };

  const filtered = alerts.filter((a) => {
    const matchLevel = levelFilter === "all" || a.level === levelFilter;
    const matchSearch =
      !search ||
      a.target.toLowerCase().includes(search.toLowerCase()) ||
      a.type.toLowerCase().includes(search.toLowerCase()) ||
      a.detail.toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchSearch;
  });

  const unresolvedHigh = alerts.filter(
    (a) => a.level === "high" && !a.resolved
  ).length;

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-primary text-on-primary font-code-telemetry text-label-sm">
              TRUNG TÂM AN NINH SOC
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
              {unresolvedHigh} Cảnh báo Khẩn cấp chưa xử lý
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Trung tâm Cảnh báo An ninh &amp; Vi phạm
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Hệ thống phân tích thị giác AI thời gian thực phát hiện bất thường
            an ninh, gian lận sinh trắc học và vi phạm quy chế giờ làm.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={markAllResolved}
            className="h-11 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container transition-all flex items-center gap-2 shadow-xs font-label-lg text-label-lg active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-secondary text-[20px]">
              done_all
            </span>
            <span>Đánh dấu tất cả đã xem</span>
          </button>
        </div>
      </div>

      {/* 3 Warning Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="relative overflow-hidden rounded-xl bg-error-container/40 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-label-md text-label-md text-error font-semibold">
                An ninh cấp 1
              </span>
              <span className="font-title-md text-title-md text-on-surface font-semibold">
                Cảnh báo Người lạ / An ninh
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-error text-on-error flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">
                warning
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-headline-xl text-headline-xl text-error font-extrabold tracking-tight">
                03
              </span>
              <span className="font-label-lg text-label-lg text-error font-medium">
                vụ việc
              </span>
            </div>
            <span className="font-code-telemetry text-label-sm text-error bg-error/10 px-2.5 py-1 rounded-full font-semibold">
              2 Điểm nóng Kiosk
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-amber-500/10 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-label-md text-label-md text-amber-700 font-semibold">
                Nề nếp lao động
              </span>
              <span className="font-title-md text-title-md text-on-surface font-semibold">
                Đi muộn chưa duyệt
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-surface-container-lowest flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">
                hourglass_top
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-headline-xl text-headline-xl text-amber-800 font-extrabold tracking-tight">
                06
              </span>
              <span className="font-label-lg text-label-lg text-amber-800 font-medium">
                trường hợp
              </span>
            </div>
            <span className="font-code-telemetry text-label-sm text-amber-800 bg-amber-500/15 px-2.5 py-1 rounded-full font-semibold">
              Ca sáng: 08:00 - 12:00
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-yellow-400/10 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-label-md text-label-md text-yellow-800 font-semibold">
                Nhân sự vắng mặt
              </span>
              <span className="font-title-md text-title-md text-on-surface font-semibold">
                Vắng chưa rõ lý do
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-yellow-500 text-surface-container-lowest flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">
                person_off
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-headline-xl text-headline-xl text-yellow-900 font-extrabold tracking-tight">
                02
              </span>
              <span className="font-label-lg text-label-lg text-yellow-900 font-medium">
                nhân sự
              </span>
            </div>
            <span className="font-code-telemetry text-label-sm text-yellow-900 bg-yellow-400/20 px-2.5 py-1 rounded-full font-semibold">
              Chưa có phép duyệt
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-label-md text-label-md text-on-surface-variant mr-1">
            Bộ lọc:
          </span>
          {[
            ["all", `Tất cả mức độ (${alerts.length})`, null],
            ["high", "Khẩn cấp (Người lạ / Giả mạo)", "bg-error"],
            ["medium", "Cảnh báo giờ công", "bg-amber-500"],
            ["low", "Hệ thống & Vắng mặt", "bg-yellow-500"],
          ].map(([lvl, label, dot]) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-3.5 py-1.5 rounded-lg font-label-md text-label-md transition-all flex items-center gap-1.5 cursor-pointer ${
                levelFilter === lvl
                  ? "bg-primary text-on-primary shadow-xs"
                  : "bg-surface-container text-on-surface hover:bg-surface-container-high"
              }`}
            >
              {dot && <span className={`w-2 h-2 rounded-full ${dot}`} />}
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã NV, Kiosk..."
              type="text"
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container text-on-surface font-body-md text-body-md focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Alert Data Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">
                <th className="py-3.5 px-4 w-32">Mức độ</th>
                <th className="py-3.5 px-4 w-28">Thời gian</th>
                <th className="py-3.5 px-4 w-52">Loại cảnh báo</th>
                <th className="py-3.5 px-4 w-64">Đối tượng / Vị trí</th>
                <th className="py-3.5 px-4">Chi tiết vi phạm</th>
                <th className="py-3.5 px-4 w-56 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className={`transition-colors ${
                    row.resolved
                      ? "opacity-60 bg-surface-container/20"
                      : "bg-surface-container-lowest hover:bg-surface-container/40"
                  }`}
                >
                  <td className="py-4 px-4 align-top">
                    {row.level === "high" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-error/15 text-error font-label-sm text-label-sm font-bold">
                        <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
                        {row.levelLabel}
                      </span>
                    )}
                    {row.level === "medium" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-800 font-label-sm text-label-sm font-bold">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        {row.levelLabel}
                      </span>
                    )}
                    {row.level === "low" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-yellow-400/20 text-yellow-900 font-label-sm text-label-sm font-bold">
                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                        {row.levelLabel}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 align-top">
                    <div className="flex flex-col">
                      <span className="font-code-telemetry text-title-md text-on-surface font-bold">
                        {row.time}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        {row.ago}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 align-top">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          row.level === "high"
                            ? "bg-error/10 text-error"
                            : row.level === "medium"
                            ? "bg-amber-500/10 text-amber-700"
                            : "bg-yellow-400/20 text-yellow-800"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {row.icon}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-md text-on-surface font-semibold">
                          {row.type}
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          {row.rule}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 align-top">
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                        {row.isCamera ? "camera_indoor" : "badge"}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-md text-on-surface font-medium">
                          {row.target}
                        </span>
                        <span className="font-code-telemetry text-label-sm text-on-surface-variant">
                          {row.subTarget}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 align-top">
                    <div className="flex flex-col gap-1.5">
                      <p className="font-body-md text-body-md text-on-surface leading-snug">
                        {row.detail}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        {row.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded bg-surface-container font-code-telemetry text-label-sm text-on-surface-variant"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 align-top text-right">
                    {!row.resolved ? (
                      <div className="flex items-center justify-end gap-2">
                        {row.modalType === "video" && (
                          <button
                            onClick={() => setVideoModalOpen(true)}
                            className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-1.5 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-secondary text-[18px]">
                              videocam
                            </span>
                            <span>Xem video</span>
                          </button>
                        )}
                        {row.modalType === "snapshot" && (
                          <button
                            onClick={() => setSnapshotModalOpen(true)}
                            className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-1.5 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-secondary text-[18px]">
                              image
                            </span>
                            <span>Xem ảnh chụp</span>
                          </button>
                        )}
                        <button
                          onClick={() => markResolved(row.id)}
                          className="h-9 px-3 rounded-lg bg-primary text-on-primary hover:bg-primary/90 font-label-md text-label-md flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            check
                          </span>
                          <span>Đã xem</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className="inline-flex items-center gap-1 text-on-surface-variant font-label-md text-label-md bg-surface-container px-2.5 py-1 rounded-md">
                          <span className="material-symbols-outlined text-[16px] text-secondary">
                            verified
                          </span>
                          Đã xử lý
                        </span>
                        <span className="font-code-telemetry text-label-sm text-on-surface-variant/70 mt-1">
                          bởi Lê Thu Hà
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Video Modal */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 bg-primary/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 bg-surface-container flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-error text-on-error flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">
                    videocam
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-title-md text-title-md text-on-surface font-semibold">
                    Video Trích xuất Sự kiện AI — Kiosk A
                  </span>
                  <span className="font-code-telemetry text-label-sm text-on-surface-variant">
                    Đoạn ghi 60 giây trước và sau phát hiện
                  </span>
                </div>
              </div>
              <button
                onClick={() => setVideoModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <div className="relative bg-tertiary-container aspect-video w-full overflow-hidden flex items-center justify-center">
              <div
                className="w-full h-full bg-cover bg-center opacity-85"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCr0rBjWEDA7kHjMAiVRSjC86zAn8mc4QqalXaSJ19w-b00cN3PcEGWooov79o2h21FsC2aWakGz1wvsPqmxG_i-cnkmT_ZEZuI32dr7OdR6WhtzRiVXiapTU6xkTyrRnvc-xTmV2NBo_pf4YVBPwLGTMOKacRxue1_7HwY2nP7bmqSL4QTIfI--e9HjXWx9QQ-9fPOgdPK0baGCTO1FrwQOkobKQeQ3LhrkS4s0Zvad9B0muJqFVZC-g')",
                }}
              />
              <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none">
                <div className="flex items-center justify-between">
                  <div className="bg-primary/80 backdrop-blur-xs text-error px-3 py-1 rounded font-code-telemetry text-label-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
                    REC AI · LOITERING ALERT (45s)
                  </div>
                </div>
                <div className="mx-auto my-auto w-56 h-72 rounded-lg border-2 border-dashed border-error bg-error/10 relative flex flex-col justify-between p-2">
                  <div className="flex justify-between text-error font-code-telemetry text-[11px] font-bold">
                    <span>[TARGET: UNKNOWN]</span>
                    <span>CONF: 98.7%</span>
                  </div>
                  <div className="bg-primary/90 text-on-primary p-2 rounded text-center">
                    <p className="font-code-telemetry text-[11px]">
                      KHÔNG KHỚP DATABASE NHÂN SỰ
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 bg-surface-container-lowest flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setVideoModalOpen(false);
                  markResolved("alert-1");
                }}
                className="h-10 px-5 rounded-xl bg-primary text-on-primary font-label-md text-label-md flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  check
                </span>
                <span>Xác nhận &amp; Đóng</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snapshot Anti-Spoofing Modal */}
      {snapshotModalOpen && (
        <div className="fixed inset-0 z-50 bg-primary/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 bg-surface-container flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-error text-on-error flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">
                    no_photography
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-title-md text-title-md text-on-surface font-semibold">
                    Bằng chứng Giả mạo Sinh trắc (Anti-spoofing)
                  </span>
                  <span className="font-code-telemetry text-label-sm text-on-surface-variant">
                    Camera Cổng B · 08:14:10
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSnapshotModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="font-label-md text-label-md text-on-surface-variant font-semibold">
                    1. Ảnh RGB Camera Thường
                  </span>
                  <div className="aspect-square bg-surface-container rounded-xl overflow-hidden relative">
                    <div
                      className="w-full h-full bg-cover bg-center"
                      style={{
                        backgroundImage:
                          "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDso9BTvBG1C4uXOu1w6z7lvHdvfF7vxxoQnOyGcYWqpz8F5TJV5duxTJ5V6-E9Cil97Lr852zvpBmWSJO9wpMHPrB1Wo2InQ52zTd5cw6yOwALrW2U3IZZ-7ojzaS8rfpEwG-ARozF1y3xQoMlhxdag6ak8SHQ1AKxJeq_Upnf78J8X095gFBQaAoHREFex2Iki2TWsqz6hJZ9fJU-iZVFw5OjapfLObvoPW3Ry78MrPkLkGv7V_5vnA')",
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="font-label-md text-label-md text-error font-semibold">
                    2. Bản đồ Chiều sâu 3D IR (Liveness)
                  </span>
                  <div className="aspect-square bg-tertiary rounded-xl overflow-hidden relative flex items-center justify-center border-2 border-error">
                    <span className="material-symbols-outlined text-error text-[64px] opacity-80">
                      crop_portrait
                    </span>
                    <div className="absolute inset-0 p-3 flex flex-col justify-between pointer-events-none">
                      <span className="px-2 py-0.5 rounded bg-error text-on-error font-code-telemetry text-[11px] font-bold w-fit">
                        FLAT SURFACE DETECTED
                      </span>
                      <span className="px-2 py-0.5 rounded bg-primary/80 text-on-primary font-code-telemetry text-[11px]">
                        Độ cong khuôn mặt: 0.00mm
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 bg-surface-container flex items-center justify-end gap-3">
              <button
                onClick={() => setSnapshotModalOpen(false)}
                className="h-10 px-4 rounded-xl bg-surface-container-lowest text-on-surface font-label-md text-label-md cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setSnapshotModalOpen(false);
                  markResolved("alert-2");
                }}
                className="h-10 px-4 rounded-xl bg-error text-on-error font-label-md text-label-md flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  gavel
                </span>
                <span>Lập biên bản vi phạm &amp; Khóa quyền</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-on-primary px-4 py-3 rounded-xl shadow-xl flex items-center gap-3">
          <span className="material-symbols-outlined text-secondary-fixed text-[20px]">
            check_circle
          </span>
          <span className="font-body-md text-body-md">{toast}</span>
        </div>
      )}
    </div>
  );
}
