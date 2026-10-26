import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const DAILY_LOG = [
  {
    date: "24/10/2024",
    dayName: "Thứ Năm (Hôm nay)",
    shift: "Ca Hành chính",
    hours: "08:00 - 17:30",
    checkIn: "07:54:12",
    kioskIn: "Kiosk Cổng A • 99.6%",
    checkOut: null,
    kioskOut: "Đang làm việc",
    totalHours: "--",
    status: "ontime",
    statusLabel: "Đúng giờ",
    conf: "99.6%",
  },
  {
    date: "23/10/2024",
    dayName: "Thứ Tư",
    shift: "Ca Hành chính",
    hours: "08:00 - 17:30",
    checkIn: "07:51:08",
    kioskIn: "Kiosk Cổng A • 99.5%",
    checkOut: "19:35:20",
    kioskOut: "Kiosk Cổng B • 99.3%",
    totalHours: "10h05m",
    status: "ot",
    statusLabel: "OT +2.0 giờ",
    subNote: "Release Sprint",
    conf: "99.5%",
  },
  {
    date: "22/10/2024",
    dayName: "Thứ Ba",
    shift: "Ca Hành chính",
    hours: "08:00 - 17:30",
    checkIn: "07:48:44",
    kioskIn: "Kiosk Cổng A • 99.8%",
    checkOut: "17:34:10",
    kioskOut: "Kiosk Cổng A • 99.4%",
    totalHours: "8h00m",
    status: "ontime",
    statusLabel: "Đúng giờ",
    conf: "99.8%",
  },
  {
    date: "21/10/2024",
    dayName: "Thứ Hai",
    shift: "Ca Hành chính",
    hours: "08:00 - 17:30",
    checkIn: "07:55:10",
    kioskIn: "Kiosk Cổng A • 99.2%",
    checkOut: "20:05:15",
    kioskOut: "Kiosk Cổng A • 99.7%",
    totalHours: "10h35m",
    status: "ot",
    statusLabel: "OT +2.5 giờ",
    subNote: "Triển khai Cloud",
    conf: "99.2%",
  },
  {
    date: "18/10/2024",
    dayName: "Thứ Sáu",
    shift: "Ca Hành chính",
    hours: "08:00 - 17:30",
    checkIn: "07:50:20",
    kioskIn: "Kiosk Cổng B • 99.1%",
    checkOut: "17:32:00",
    kioskOut: "Kiosk Cổng B • 99.4%",
    totalHours: "8h00m",
    status: "ontime",
    statusLabel: "Đúng giờ",
    conf: "99.1%",
  },
];

export default function EmployeeReportDetail() {
  const navigate = useNavigate();
  const { code } = useParams();
  const empCode = code || "NV001";

  const [viewMode, setViewMode] = useState("table"); // table | calendar
  const [filterStatus, setFilterStatus] = useState("all");
  const [snapshotModal, setSnapshotModal] = useState(null);

  const filteredLogs = DAILY_LOG.filter((item) => {
    if (filterStatus === "all") return true;
    return item.status === filterStatus;
  });

  return (
    <div className="flex flex-col w-full">
      {/* Top Breadcrumbs & Actions */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md">
            <button
              onClick={() => navigate("/reports")}
              className="hover:text-secondary flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                description
              </span>
              <span>Báo cáo</span>
            </button>
            <span className="text-outline-variant">/</span>
            <button
              onClick={() => navigate("/reports")}
              className="hover:text-secondary transition-colors cursor-pointer"
            >
              Kỳ lương T10/2026
            </button>
            <span className="text-outline-variant">/</span>
            <span className="px-2 py-0.5 rounded bg-surface-container font-semibold text-on-surface">
              {empCode} — Nguyễn Văn A
            </span>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-secondary font-code-telemetry text-[11px] font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
            BÁO CÁO CÁ NHÂN &amp; ĐỐI SOÁT AI
          </span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Chi tiết dữ liệu chấm công &amp; sinh trắc học
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
              Hồ sơ nhật ký điểm danh máy học AI, đối soát liveness và phân bổ
              thời gian thực tế
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate("/reports")}
              className="h-11 px-4 rounded-xl bg-surface-container-lowest text-on-surface border border-outline-variant hover:bg-surface-container transition-all flex items-center gap-2 font-label-lg text-label-lg cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                arrow_back
              </span>
              <span>Quay lại</span>
            </button>
            <button
              onClick={() => navigate("/edit-attendance")}
              className="h-11 px-4 rounded-xl bg-surface-container-lowest text-on-surface border border-outline-variant hover:text-secondary hover:border-secondary transition-all flex items-center gap-2 font-label-lg text-label-lg cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                edit_calendar
              </span>
              <span>Chỉnh sửa công</span>
            </button>
            <button
              onClick={() => window.print()}
              className="h-11 px-4 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-all flex items-center gap-2 font-label-lg text-label-lg shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                picture_as_pdf
              </span>
              <span>Xuất PDF phiếu công</span>
            </button>
          </div>
        </div>
      </div>

      {/* Staff Profile & Key Performance Telemetry Card */}
      <div className="bg-surface-container-lowest rounded-xl p-6 mb-6 shadow-xs border border-outline-variant/60 relative overflow-hidden">
        <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between relative z-10">
          <div className="flex items-center gap-4 min-w-[320px]">
            <div className="relative">
              <img
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-secondary/20 shadow-xs"
                alt="Nguyễn Văn A"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4IkX4Q8Xp3I2UeBgnWF2TRjOtllVQl-JoQNE09Iyr7zyqkvxY-2bI7hgpek0e4x3Gup58BjVOJp4IDGt7MDW6Tk-RRl0hx195z0EocjFzZudOix7EHIDTVYg88c6hIwV56CI0dRMW74K_XRPJ1PSY_Nz07MQ_0hDYRkl8XpJ7pxkktIePO2XrK2dgjLAuSrc1vt71fcu3ACAlAMiFEIqDaBuJl6TnqhZd7dgcWeR6kYUjWCG7uaWRuw"
              />
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined material-symbols-filled text-[16px] text-[#009668]">
                  verified
                </span>
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="font-title-lg text-title-lg text-on-surface font-bold">
                  Nguyễn Văn A
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-secondary font-code-telemetry text-label-sm font-semibold">
                  {empCode}
                </span>
              </div>
              <span className="font-body-md text-body-md text-on-surface font-medium">
                Kỹ sư Lập trình Senior
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[15px]">
                  apartment
                </span>
                Phòng Kỹ thuật &amp; Công nghệ
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#009668] bg-[#009668]/10 px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#009668]"></span>
                  3D Liveness Verified
                </span>
                <span className="text-[11px] font-code-telemetry text-on-surface-variant">
                  Model: Facenet512
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full xl:w-auto xl:flex-1">
            <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant">
                Công chuẩn
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-headline-md text-headline-md text-on-surface font-bold">
                  22/22
                </span>
                <span className="font-label-md text-label-md text-[#009668] font-semibold">
                  100%
                </span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-secondary h-full rounded-full w-full" />
              </div>
            </div>

            <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant">
                Đi muộn / Về sớm
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-headline-md text-headline-md text-on-surface font-bold">
                  0 / 0
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  lần
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="material-symbols-outlined text-[16px] text-[#009668]">
                  check_circle
                </span>
                <span className="font-label-sm text-label-sm text-[#009668]">
                  Chuẩn xác 100%
                </span>
              </div>
            </div>

            <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant">
                Tăng ca (OT)
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-headline-md text-headline-md text-secondary font-bold">
                  14.5
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  giờ
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-secondary">
                  verified_user
                </span>
                Đã duyệt: 14.5h
              </span>
            </div>

            <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant">
                AI Confidence
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-headline-md text-headline-md text-on-surface font-bold">
                  99.4%
                </span>
                <span className="font-label-sm text-label-sm text-[#009668] font-bold">
                  Hạng A+
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-secondary">
                  speed
                </span>
                18ms phản hồi
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="bg-surface-container-lowest rounded-xl p-3 mb-6 shadow-xs border border-outline-variant/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            ["all", "Tất cả (22)"],
            ["ontime", "Đúng giờ (17)"],
            ["ot", "Tăng ca OT (5)"],
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
            <span className="material-symbols-outlined text-[18px]">
              table_rows
            </span>
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
            <span className="material-symbols-outlined text-[18px]">
              calendar_view_month
            </span>
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
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-code-telemetry text-label-sm font-semibold">
                    {filteredLogs.length} Phiên hiển thị
                  </span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
                  <span className="w-2 h-2 rounded-full bg-[#009668]"></span>
                  <span>100% Đối soát khớp thuật toán</span>
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
                          <span className="block font-code-telemetry text-[11px] text-on-surface-variant">
                            {row.hours}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-code-telemetry font-bold text-on-surface">
                            <span>{row.checkIn}</span>
                            <span className="material-symbols-outlined text-[15px] text-[#009668]">
                              verified
                            </span>
                          </div>
                          <span className="text-[11px] text-secondary font-code-telemetry block">
                            {row.kioskIn}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {row.checkOut ? (
                            <>
                              <div className="flex items-center gap-1.5 font-code-telemetry font-bold text-on-surface">
                                <span>{row.checkOut}</span>
                                <span className="material-symbols-outlined text-[15px] text-[#009668]">
                                  verified
                                </span>
                              </div>
                              <span className="text-[11px] text-on-surface-variant font-code-telemetry block">
                                {row.kioskOut}
                              </span>
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded-md">
                              <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-secondary"></span>
                              Đang làm việc
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-code-telemetry font-semibold">
                          {row.totalHours}
                        </td>
                        <td className="py-3.5 px-4">
                          {row.status === "ontime" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-semibold bg-[#009668]/10 text-[#009668]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#009668]"></span>
                              {row.statusLabel}
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1 items-start">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-secondary-fixed text-secondary">
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
                            className="p-1.5 rounded-lg hover:bg-secondary-fixed text-on-surface-variant hover:text-secondary transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              photo_camera_front
                            </span>
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
                    Lịch biểu Tháng 10/2026
                  </h3>
                  <span className="font-label-sm text-label-sm text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded">
                    22 ngày đủ công
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center font-label-md text-label-md font-semibold text-on-surface-variant mb-2">
                <span>T2</span>
                <span>T3</span>
                <span>T4</span>
                <span>T5</span>
                <span>T6</span>
                <span className="text-error/70">T7</span>
                <span className="text-error/70">CN</span>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 28 }, (_, idx) => {
                  const day = idx + 1;
                  const isWeekend = (idx + 1) % 7 === 6 || (idx + 1) % 7 === 0;
                  const isOt = [3, 10, 16, 21, 23].includes(day);
                  return (
                    <div
                      key={day}
                      className={`p-2.5 rounded-lg text-left min-h-[76px] flex flex-col justify-between ${
                        isWeekend
                          ? "bg-surface-container-low text-on-surface-variant"
                          : isOt
                          ? "bg-secondary-fixed/40 text-on-surface"
                          : "bg-[#009668]/10 text-on-surface"
                      }`}
                    >
                      <span className="font-code-telemetry font-bold text-xs">
                        {String(day).padStart(2, "0")}
                      </span>
                      {!isWeekend && (
                        <span
                          className={`text-[10px] font-bold ${
                            isOt ? "text-secondary" : "text-[#009668]"
                          }`}
                        >
                          {isOt ? "OT +2.0h" : "8h00m"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Biometric Telemetry & Audit Integrity (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/60">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-secondary">
                  csv
                </span>
                <h3 className="font-title-md text-title-md text-on-surface">
                  Đối soát sinh trắc học AI
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#009668]/10 text-[#009668] font-code-telemetry text-[11px] font-bold">
                ISO/IEC 30107-3
              </span>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low">
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    Độ tin cậy liveness trung bình
                  </span>
                  <span className="font-headline-md text-headline-md font-bold text-on-surface mt-0.5">
                    99.42%
                  </span>
                  <span className="text-[11px] text-[#009668] font-medium flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[14px]">
                      shield
                    </span>{" "}
                    Không phát hiện Deepfake / Spoof
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
                      className="text-secondary"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray="99.4, 100"
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                  </svg>
                  <span className="absolute font-code-telemetry text-[11px] font-bold text-on-surface">
                    99.4%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/60">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-on-surface">
                  verified_user
                </span>
                <h3 className="font-title-md text-title-md text-on-surface">
                  Nhật ký can thiệp &amp; kiểm toán
                </h3>
              </div>
              <span className="material-symbols-outlined text-[18px] text-[#009668]">
                lock
              </span>
            </div>

            <div className="mt-4 space-y-3.5">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low">
                <span className="material-symbols-outlined text-[20px] text-[#009668] mt-0.5">
                  check_circle
                </span>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md font-semibold text-on-surface">
                    Không có can thiệp thủ công
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    Dữ liệu 100% tự động trích xuất trực tiếp từ camera sinh
                    trắc học.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container text-left border border-outline-variant/60">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">
                    Chứng thực tính toàn vẹn
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-secondary-fixed text-secondary font-code-telemetry text-[10px] font-bold">
                    SHA-256 SEAL
                  </span>
                </div>
                <p className="font-code-telemetry text-[11px] text-on-surface break-all mt-1.5 select-all bg-surface-container-lowest p-2 rounded">
                  e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Snapshot Modal Dialog */}
      {snapshotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-outline-variant">
            <div className="p-4 px-6 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">
                  face
                </span>
                <span className="font-title-md text-title-md text-on-surface">
                  Đối soát ảnh chụp camera sinh trắc
                </span>
              </div>
              <button
                onClick={() => setSnapshotModal(null)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="relative w-full h-64 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                <img
                  className="w-full h-full object-cover opacity-90"
                  alt="Snapshot"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvMjFfAdJfPJtf6jV6OQ9ss7CVO7VQ96WDxTxBLypuxjq0ToLDun1KC3PBqMT91R5AYlwK5VrvGT0ooemDanCQGF_ZRHjD87ZIQjTAp79F-LA1oL9fAEqoFS9uyp7OdC67VZp6klrS1kRxnDmvTveVoDgbuMqSUqPbsDrxxekGgXIeVUPzBtXdR0rGbIEyJipxUcco6fPQUrx6FEVemnTkf_evswzPdZPUj5WplEFis5I10HDmvwCTkQ"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-36 h-48 border-2 border-secondary rounded-lg relative shadow-[0_0_16px_rgba(87,223,254,0.45)]">
                    <div className="absolute -top-6 left-0 bg-secondary text-on-secondary px-2 py-0.5 rounded text-[10px] font-code-telemetry font-bold">
                      {empCode} • {snapshotModal.conf}
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2 p-2 bg-black/70 backdrop-blur-md rounded-lg flex items-center justify-between text-white font-code-telemetry text-xs">
                  <span>{snapshotModal.kioskIn}</span>
                  <span className="text-[#009668] flex items-center gap-1 font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#009668] animate-ping"></span>{" "}
                    LIVENESS PASS
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-surface-container-low p-3.5 rounded-xl font-label-md text-label-md">
                <div>
                  <span className="text-on-surface-variant block text-xs">
                    Thời điểm quét:
                  </span>
                  <span className="font-code-telemetry font-bold text-on-surface">
                    {snapshotModal.date} {snapshotModal.checkIn}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant block text-xs">
                    Chống giả mạo 3D:
                  </span>
                  <span className="font-code-telemetry font-bold text-[#009668]">
                    Hợp lệ (Genuine)
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
