import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEmployeeReport } from "../api";
import Icon from "../components/Icon";

export default function EmployeeReportDetail() {
  const navigate = useNavigate();
  const { code } = useParams();
  const empCode = code || "NV001";

  const [viewMode, setViewMode] = useState("table"); // table | calendar
  const [filterStatus, setFilterStatus] = useState("all");
  const [snapshotModal, setSnapshotModal] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getEmployeeReport(empCode)
      .then((r) => setReport(r.data))
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [empCode]);

  const dailyLogs = (report?.days || []).map((d) => ({
    date: d.date,
    dayName: d.day_name,
    shift: d.shift,
    hours: d.hours,
    checkIn: d.check_in,
    kioskIn: d.kiosk_in,
    checkOut: d.check_out,
    kioskOut: d.kiosk_out,
    totalHours: d.total_hours,
    status: d.status,
    statusLabel: d.status_label,
    subNote: d.sub_note,
    conf: d.conf,
  }));

  const filteredLogs = dailyLogs.filter((item) => {
    if (filterStatus === "all") return true;
    return item.status === filterStatus;
  });

  const empName = report?.name || empCode;

  // Derived from the report's own day rows — no invented figures.
  const totalDays = dailyLogs.length;
  const workedDays = dailyLogs.filter((d) => d.checkIn).length;
  const ontimeDays = dailyLogs.filter((d) => d.status === "ontime").length;
  const otDays = dailyLogs.filter((d) => d.status === "ot").length;
  const workedPct = totalDays
    ? Math.round((workedDays / totalDays) * 100)
    : 0;
  const avgConf = report?.avg_confidence ?? null;

  const parseDayNum = (dateStr) => {
    const s = String(dateStr || "");
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return Number(m[3]);
    m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (m) return Number(m[1]);
    return null;
  };
  const calendarDays = dailyLogs
    .map((d) => ({ ...d, dayNum: parseDayNum(d.date) }))
    .filter((d) => d.dayNum != null)
    .sort((a, b) => a.dayNum - b.dayNum);

  return (
    <div className="flex flex-col w-full">
      {/* Top Breadcrumbs & Actions */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md">
            <button
              onClick={() => navigate("/reports")}
              className="hover:text-primary flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Icon name="description" className="text-[18px]" />
              <span>Báo cáo</span>
            </button>
            <span className="text-outline-variant">/</span>
            <span className="px-2 py-0.5 rounded bg-surface-container font-semibold text-on-surface">
              {empCode} — {empName}
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Chi tiết chấm công của nhân viên
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
              Nhật ký điểm danh chi tiết theo ngày trong kỳ báo cáo.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate("/reports")}
              className="h-11 px-4 rounded-xl bg-surface-container-lowest text-on-surface border border-outline-variant hover:bg-surface-container transition-all flex items-center gap-2 font-label-lg text-label-lg cursor-pointer"
            >
              <Icon name="arrow_back" className="text-[18px]" />
              <span>Quay lại</span>
            </button>
            <button
              onClick={() => navigate("/edit-attendance")}
              className="h-11 px-4 rounded-xl bg-surface-container-lowest text-on-surface border border-outline-variant hover:text-primary hover:border-primary transition-all flex items-center gap-2 font-label-lg text-label-lg cursor-pointer"
            >
              <Icon name="edit_calendar" className="text-[18px]" />
              <span>Chỉnh sửa công</span>
            </button>
            <button
              onClick={() => window.print()}
              className="h-11 px-4 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-all flex items-center gap-2 font-label-lg text-label-lg shadow-xs cursor-pointer"
            >
              <Icon name="picture_as_pdf" className="text-[18px]" />
              <span>Xuất PDF phiếu công</span>
            </button>
          </div>
        </div>
      </div>

      {/* Staff Profile & Key Performance Telemetry Card */}
      <div className="bg-surface-container-lowest rounded-xl p-6 mb-6 shadow-xs border border-outline-variant/60 relative overflow-hidden">
        <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between relative z-10">
          <div className="flex items-center gap-4 min-w-[320px]">
            <div className="w-20 h-20 rounded-2xl bg-surface-container-high flex items-center justify-center shrink-0 text-on-surface font-headline-md text-headline-md font-bold">
              {empName
                ?.split(/\s+/)
                .filter(Boolean)
                .slice(-2)
                .map((w) => w[0])
                .join("")
                .toUpperCase() || "NV"}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="font-title-lg text-title-lg text-on-surface font-bold">
                  {empName}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-semibold">
                  {empCode}
                </span>
              </div>
              {report?.group && (
                <span className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1 mt-0.5">
                  <Icon name="apartment" className="text-[15px]" />
                  {report.group}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full xl:w-auto xl:flex-1">
            <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant">
                Ngày có chấm công
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-headline-md text-headline-md text-on-surface font-bold">
                  {workedDays}/{totalDays}
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant font-semibold">
                  {workedPct}%
                </span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${workedPct}%` }}
                />
              </div>
            </div>

            <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant">
                Ngày đúng giờ
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-headline-md text-headline-md text-on-surface font-bold">
                  {ontimeDays}
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  / {totalDays} ngày
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <Icon name="check_circle" className="text-[16px] text-success" />
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Theo trạng thái từng ngày trong kỳ
                </span>
              </div>
            </div>

            <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant">
                Tăng ca (OT)
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-headline-md text-headline-md text-on-surface font-bold">
                  {report?.ot_hours ?? 0}
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  giờ
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-2">
                Tổng giờ tăng ca trong kỳ báo cáo
              </span>
            </div>

            <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant">
                Độ tin cậy nhận diện trung bình
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-headline-md text-headline-md text-on-surface font-bold">
                  {avgConf != null ? `${avgConf}%` : "—"}
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-2">
                Trung bình các lượt khớp trong kỳ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="bg-surface-container-lowest rounded-xl p-3 mb-6 shadow-xs border border-outline-variant/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            ["all", `Tất cả (${totalDays})`],
            ["ontime", `Đúng giờ (${ontimeDays})`],
            ["ot", `Tăng ca OT (${otDays})`],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
                filterStatus === key
                  ? "bg-primary text-on-primary font-semibold shadow-xs"
                  : "bg-surface-container-low text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl">
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
              viewMode === "table"
                ? "bg-surface-container-lowest text-on-surface font-semibold shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Icon name="table_rows" className="text-[18px]" />
            <span>Bảng chi tiết</span>
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
              viewMode === "calendar"
                ? "bg-surface-container-lowest text-on-surface font-semibold shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Icon name="calendar_view_month" className="text-[18px]" />
            <span>Lịch trực quan</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout (8 : 4) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 flex flex-col gap-6">
          {viewMode === "table" ? (
            <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/60 overflow-hidden">
              <div className="p-4 px-6 border-b border-outline-variant/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-title-md text-title-md text-on-surface">
                    Nhật ký chấm công từng ngày
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">
                    {filteredLogs.length} ngày hiển thị
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">
                      <th className="py-3 px-4 pl-6">Ngày &amp; Thứ</th>
                      <th className="py-3 px-4">Ca làm việc</th>
                      <th className="py-3 px-4">Check-in</th>
                      <th className="py-3 px-4">Check-out</th>
                      <th className="py-3 px-4 text-center">Tổng giờ</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 pr-6 text-center">
                        Snapshot AI
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40 font-body-md text-body-md text-on-surface">
                    {filteredLogs.map((row) => (
                      <tr
                        key={row.date}
                        className="hover:bg-surface-container-low/60 transition-colors"
                      >
                        <td className="py-3.5 px-4 pl-6">
                          <div className="flex flex-col">
                            <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                              {row.date}
                            </span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant">
                              {row.dayName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-label-md text-label-md text-on-surface">
                            {row.shift}
                          </span>
                          <span className="block font-label-sm text-label-sm text-on-surface-variant">
                            {row.hours}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-label-md text-label-md font-bold text-on-surface">
                            <span>{row.checkIn}</span>
                            <Icon name="verified" className="text-[15px] text-success" />
                          </div>
                          <span className="text-[11px] text-on-surface-variant font-label-sm block">
                            {row.kioskIn}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {row.checkOut ? (
                            <>
                              <div className="flex items-center gap-1.5 font-label-md text-label-md font-bold text-on-surface">
                                <span>{row.checkOut}</span>
                                <Icon name="verified" className="text-[15px] text-success" />
                              </div>
                              <span className="text-[11px] text-on-surface-variant font-label-sm block">
                                {row.kioskOut}
                              </span>
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary bg-primary-fixed/60 px-2 py-0.5 rounded-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                              Đang làm việc
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-label-md text-label-md font-semibold">
                          {row.totalHours}
                        </td>
                        <td className="py-3.5 px-4">
                          {row.status === "ontime" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-semibold bg-success/10 text-success">
                              <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                              {row.statusLabel}
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1 items-start">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container-high text-on-surface">
                                {row.statusLabel}
                              </span>
                              <span className="font-label-sm text-label-sm text-on-surface-variant">
                                {row.subNote}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 pr-6 text-center">
                          <button
                            onClick={() => setSnapshotModal(row)}
                            className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-all cursor-pointer"
                          >
                            <Icon name="photo_camera_front" className="text-[20px]" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-xs border border-outline-variant/60">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-title-md text-title-md text-on-surface">
                    Lịch ngày công trong kỳ báo cáo
                  </h3>
                  <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                    {workedDays} ngày có chấm công
                  </span>
                </div>
              </div>
              {calendarDays.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant py-8 text-center">
                  Chưa có dữ liệu ngày công trong kỳ.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {calendarDays.map((d) => (
                    <div
                      key={d.date}
                      className={`p-2.5 rounded-lg text-left min-h-[76px] flex flex-col justify-between ${
                        d.status === "ontime"
                          ? "bg-success/10 text-on-surface"
                          : d.checkIn
                          ? "bg-surface-container-high text-on-surface"
                          : "bg-surface-container-low text-on-surface-variant"
                      }`}
                    >
                      <span className="font-label-md text-label-md font-bold">
                        {String(d.dayNum).padStart(2, "0")}
                      </span>
                      <span className="flex flex-col">
                        <span className="text-[11px] font-semibold">
                          {d.statusLabel || (d.checkIn ? "Có chấm công" : "—")}
                        </span>
                        {d.checkIn && (
                          <span className="text-[10px] text-on-surface-variant">
                            Vào {d.checkIn}
                            {d.checkOut ? ` · Ra ${d.checkOut}` : ""}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: AI Biometric Telemetry & Audit Integrity (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/60">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
              <div className="flex items-center gap-2">
                <Icon name="csv" className="text-[20px] text-on-surface-variant" />
                <h3 className="font-title-md text-title-md text-on-surface">
                  Độ tin cậy nhận diện
                </h3>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low">
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    Độ tin cậy nhận diện trung bình
                  </span>
                  <span className="font-headline-md text-headline-md font-bold text-on-surface mt-0.5">
                    {avgConf != null ? `${avgConf}%` : "—"}
                  </span>
                  <span className="text-[11px] text-on-surface-variant mt-0.5">
                    Trung bình độ tin cậy các lượt khớp của nhân viên trong kỳ.
                  </span>
                </div>
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg
                    className="w-16 h-16 transform -rotate-90"
                    viewBox="0 0 36 36"
                  >
                    <path
                      className="text-surface-container-high"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                    />
                    <path
                      className="text-primary"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray={`${avgConf ?? 0}, 100`}
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                  </svg>
                  <span className="absolute font-label-sm text-label-sm font-bold text-on-surface">
                    {avgConf != null ? `${avgConf}%` : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/60">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
              <div className="flex items-center gap-2">
                <Icon name="verified_user" className="text-[20px] text-on-surface" />
                <h3 className="font-title-md text-title-md text-on-surface">
                  Nguồn dữ liệu
                </h3>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low">
                <Icon name="info" className="text-[20px] text-on-surface-variant mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md font-semibold text-on-surface">
                    Dữ liệu gốc từ hệ thống điểm danh
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    Trang này hiển thị dữ liệu ghi nhận tại các kiosk. Các
                    chỉnh sửa thủ công (nếu có) được thực hiện ở màn hình Sửa
                    công.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Snapshot Modal Dialog */}
      {snapshotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-outline-variant">
            <div className="p-4 px-6 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="face" className="text-on-surface-variant text-[22px]" />
                <span className="font-title-md text-title-md text-on-surface">
                  Chi tiết lượt điểm danh
                </span>
              </div>
              <button
                onClick={() => setSnapshotModal(null)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="w-full rounded-xl bg-surface-container-low p-5 flex flex-col items-center justify-center gap-2 text-center">
                <Icon name="photo_camera_front" className="text-[36px] text-on-surface-variant" />
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Ảnh chụp tại kiosk không được đính kèm trong báo cáo này.
                </span>
                {snapshotModal.kioskIn && (
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {snapshotModal.kioskIn}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 bg-surface-container-low p-3.5 rounded-xl font-label-md text-label-md">
                <div>
                  <span className="text-on-surface-variant block text-xs">
                    Thời điểm điểm danh:
                  </span>
                  <span className="font-label-md text-label-md font-bold text-on-surface">
                    {snapshotModal.date} {snapshotModal.checkIn}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant block text-xs">
                    Độ tin cậy khớp:
                  </span>
                  <span className="font-label-md text-label-md font-bold text-on-surface">
                    {snapshotModal.conf ?? "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 px-6 bg-surface-container-low border-t border-outline-variant flex justify-end">
              <button
                onClick={() => setSnapshotModal(null)}
                className="h-10 px-5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-semibold cursor-pointer"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
