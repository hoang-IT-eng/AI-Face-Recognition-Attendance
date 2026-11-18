import { useEffect, useState } from "react";
import { getAlerts, resolveAlert, resolveAllAlerts } from "../api";
import Icon from "../components/Icon";

function mapAlert(a) {
  return {
    id: a.id,
    level: a.level,
    levelLabel: a.level_label || a.levelLabel || String(a.level).toUpperCase(),
    time: a.time || "",
    ago: a.ago || "",
    type: a.type,
    rule: a.rule,
    icon: a.icon || "warning",
    target: a.target,
    subTarget: a.sub_target || a.subTarget || "",
    isCamera: a.is_camera ?? a.isCamera ?? false,
    detail: a.detail || "",
    tags: a.tags || [],
    modalType: a.modal_type ?? a.modalType ?? null,
    resolved: !!a.resolved,
  };
}

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [levelFilter, setLevelFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [toast, setToast] = useState("");

  const loadAlerts = () =>
    getAlerts({ scan: true })
      .then((r) => setAlerts((r.data || []).map(mapAlert)))
      .catch(() => {});

  useEffect(() => {
    loadAlerts();
    const id = setInterval(loadAlerts, 20000);
    return () => clearInterval(id);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const markResolved = async (id) => {
    try {
      await resolveAlert(id, true);
    } catch {}
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolved: true } : a))
    );
    showToast("Đã đánh dấu xử lý cảnh báo thành công");
  };

  const markAllResolved = async () => {
    try {
      await resolveAllAlerts();
    } catch {}
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
              {unresolvedHigh} Cảnh báo Khẩn cấp chưa xử lý
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Cảnh báo an ninh &amp; vi phạm
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Danh sách cảnh báo phát sinh từ các kiosk và quy tắc giờ công.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={markAllResolved}
            className="h-11 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container transition-all flex items-center gap-2 shadow-xs font-label-lg text-label-lg active:scale-95 cursor-pointer"
          >
            <Icon name="done_all" className="text-on-surface-variant text-[20px]" />
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
              <Icon name="warning" className="text-[22px]" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-headline-xl text-headline-xl text-error font-extrabold tracking-tight">
                {String(alerts.filter((a) => a.level === "high" && !a.resolved).length).padStart(2, "0")}
              </span>
              <span className="font-label-lg text-label-lg text-error font-medium">
                vụ việc
              </span>
            </div>
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
              <Icon name="hourglass_top" className="text-[22px]" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-headline-xl text-headline-xl text-amber-800 font-extrabold tracking-tight">
                {String(alerts.filter((a) => a.level === "medium" && !a.resolved).length).padStart(2, "0")}
              </span>
              <span className="font-label-lg text-label-lg text-amber-800 font-medium">
                trường hợp
              </span>
            </div>
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
              <Icon name="person_off" className="text-[22px]" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-headline-xl text-headline-xl text-yellow-900 font-extrabold tracking-tight">
                {String(alerts.filter((a) => a.level === "low" && !a.resolved).length).padStart(2, "0")}
              </span>
              <span className="font-label-lg text-label-lg text-yellow-900 font-medium">
                nhân sự
              </span>
            </div>
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
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" />
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
                      <span className="font-title-md text-title-md text-on-surface font-bold">
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
                        <Icon name={row.icon} className="text-[18px]" />
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
                      <Icon
                        name={row.isCamera ? "camera_indoor" : "badge"}
                        className="text-on-surface-variant text-[20px] shrink-0 mt-0.5"
                      />
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-md text-on-surface font-medium">
                          {row.target}
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
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
                            className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant"
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
                            <Icon name="videocam" className="text-on-surface-variant text-[18px]" />
                            <span>Xem video</span>
                          </button>
                        )}
                        {row.modalType === "snapshot" && (
                          <button
                            onClick={() => setSnapshotModalOpen(true)}
                            className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-1.5 cursor-pointer"
                          >
                            <Icon name="image" className="text-on-surface-variant text-[18px]" />
                            <span>Xem ảnh chụp</span>
                          </button>
                        )}
                        <button
                          onClick={() => markResolved(row.id)}
                          className="h-9 px-3 rounded-lg bg-primary text-on-primary hover:bg-primary/90 font-label-md text-label-md flex items-center gap-1 cursor-pointer"
                        >
                          <Icon name="check" className="text-[18px]" />
                          <span>Đã xem</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className="inline-flex items-center gap-1 text-on-surface-variant font-label-md text-label-md bg-surface-container px-2.5 py-1 rounded-md">
                          <Icon name="verified" className="text-[16px] text-success" />
                          Đã xử lý
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 bg-surface-container flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-error text-on-error flex items-center justify-center">
                  <Icon name="videocam" className="text-[20px]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-title-md text-title-md text-on-surface font-semibold">
                    Video sự kiện cảnh báo
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Chi tiết sự kiện cảnh báo
                  </span>
                </div>
              </div>
              <button
                onClick={() => setVideoModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface cursor-pointer"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            <div className="relative bg-surface-container aspect-video w-full overflow-hidden flex flex-col items-center justify-center gap-3 text-on-surface-variant px-8 text-center">
              <Icon name="videocam_off" className="text-[44px]" />
              <span className="font-title-md text-title-md text-on-surface">
                Chưa có video đính kèm cho cảnh báo này
              </span>
              <span className="font-body-md text-body-md max-w-md">
                Hệ thống hiện chỉ lưu thông tin sự kiện dạng văn bản; video từ
                camera chưa được đính kèm vào cảnh báo.
              </span>
            </div>

            <div className="p-5 bg-surface-container-lowest flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setVideoModalOpen(false);
                  markResolved("alert-1");
                }}
                className="h-10 px-5 rounded-xl bg-primary text-on-primary font-label-md text-label-md flex items-center gap-1.5 cursor-pointer"
              >
                <Icon name="check" className="text-[18px]" />
                <span>Xác nhận &amp; Đóng</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snapshot Anti-Spoofing Modal */}
      {snapshotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 bg-surface-container flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-error text-on-error flex items-center justify-center">
                  <Icon name="no_photography" className="text-[20px]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-title-md text-title-md text-on-surface font-semibold">
                    Ảnh chụp sự kiện giả mạo
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Ảnh chụp tại thời điểm phát hiện
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSnapshotModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface cursor-pointer"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              <div className="aspect-video bg-surface-container rounded-xl flex flex-col items-center justify-center gap-3 text-on-surface-variant px-8 text-center">
                <Icon name="image" className="text-[40px]" />
                <span className="font-label-md text-label-md">
                  Ảnh chụp từ camera (chưa có dữ liệu đính kèm)
                </span>
                <span className="font-body-sm text-body-sm max-w-md">
                  Cảnh báo này được ghi nhận dạng văn bản; ảnh chụp tại thời
                  điểm phát hiện chưa được đính kèm.
                </span>
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
                <Icon name="gavel" className="text-[18px]" />
                <span>Lập biên bản vi phạm &amp; Khóa quyền</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-on-primary px-4 py-3 rounded-xl shadow-xl flex items-center gap-3">
          <Icon name="check_circle" className="text-on-primary text-[20px]" />
          <span className="font-body-md text-body-md">{toast}</span>
        </div>
      )}
    </div>
  );
}
