import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTodayAttendance,
  getAttendance,
  getUsers,
  exportExcel,
  getStatsSummary,
} from "../api";

/** Format confidence stored as 0–1 or 0–100 into a display percentage. */
function formatConfidence(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  const pct = n <= 1 ? n * 100 : n;
  return `${pct.toFixed(1)}%`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [todayRecords, setTodayRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [clock, setClock] = useState("--:--:--");
  const [trend, setTrend] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [statsSummary, setStatsSummary] = useState(null);

  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const loadData = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [todayRes, usersRes, statsRes] = await Promise.all([
        getTodayAttendance(),
        getUsers(),
        getStatsSummary({ date_from: today, date_to: today }).catch(() => null),
      ]);
      setTodayRecords(todayRes.data || []);
      setUsers(usersRes.data || []);
      if (statsRes?.data) setStatsSummary(statsRes.data);

      const now = new Date();
      const dayNames = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
      const week = await Promise.all(
        Array.from({ length: 7 }, (_, idx) => {
          const d = new Date(now);
          d.setDate(now.getDate() - (6 - idx));
          const ds = d.toISOString().slice(0, 10);
          return getAttendance({ date_from: ds, date_to: ds }).then((r) => ({
            label: idx === 6 ? "Hôm nay" : dayNames[d.getDay()],
            present: (r.data || []).filter(
              (x) => x.status === "present" || x.status === "late"
            ).length,
            issue: (r.data || []).filter(
              (x) => x.status === "absent" || x.status === "late"
            ).length,
            isToday: idx === 6,
          }));
        })
      );
      setTrend(week);
    } catch {
      /* keep previous state on transient errors */
    }
  };

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 15000);
    return () => clearInterval(id);
  }, []);

  const totalStaff = users.length;
  const presentFromRecords = todayRecords.filter(
    (r) => r.status === "present" || r.status === "late"
  ).length;
  const lateFromRecords = todayRecords.filter((r) => r.status === "late").length;
  const presentOnlyFromRecords = todayRecords.filter(
    (r) => r.status === "present"
  ).length;

  const presentCount =
    statsSummary != null
      ? (statsSummary.present || 0) + (statsSummary.late || 0)
      : presentFromRecords;
  const lateCount =
    statsSummary != null ? statsSummary.late || 0 : lateFromRecords;
  const onTimeCount =
    statsSummary != null ? statsSummary.present || 0 : presentOnlyFromRecords;
  const absentCount =
    statsSummary?.absent != null
      ? statsSummary.absent
      : Math.max(0, totalStaff - presentCount);

  const denom = totalStaff > 0 ? totalStaff : Math.max(presentCount + absentCount, 1);
  const presentRatio =
    totalStaff > 0 || presentCount > 0
      ? ((presentCount / denom) * 100).toFixed(1)
      : "0.0";
  const lateRatio = ((lateCount / denom) * 100).toFixed(1);
  const absentRatio = ((absentCount / denom) * 100).toFixed(1);
  const onTimeRatio = ((onTimeCount / denom) * 100).toFixed(1);

  const deptCount = new Set(
    users.map((u) => u.group).filter(Boolean)
  ).size;

  const weekPresent = trend.reduce((s, d) => s + d.present, 0);
  const weekIssue = trend.reduce((s, d) => s + d.issue, 0);
  const weekTotal = weekPresent + weekIssue;
  const weekAvgRatio =
    weekTotal > 0 ? ((weekPresent / weekTotal) * 100).toFixed(1) : null;

  // Donut stroke lengths (circumference ≈ 2π·62 ≈ 389.6)
  const CIRC = 389.6;
  const onTimeLen = (onTimeCount / denom) * CIRC;
  const lateLen = (lateCount / denom) * CIRC;
  const absentLen = Math.max(0, CIRC - onTimeLen - lateLen);

  const fmtTime = (dt) =>
    dt
      ? new Date(dt).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      : "--:--";

  const displayLogs = todayRecords.slice(0, 8).map((r) => {
    const u = users.find((x) => x.id === r.user_id);
    return {
      id: r.id,
      user_code: r.user_code || u?.code || `NV00${r.user_id}`,
      user_name: r.user_name || u?.name || "Nhân viên",
      group: u?.group || r.user_group || "—",
      check_in_str: fmtTime(r.check_in),
      check_out_str: fmtTime(r.check_out),
      confidence:
        r.status === "absent" ? "0.0%" : formatConfidence(r.confidence),
      status: r.status || "present",
      avatar: null,
    };
  });

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await exportExcel({ date_from: today, date_to: today });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `diemdanh_${today}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Xuất Excel thất bại. Vui lòng thử lại.";
      alert(typeof msg === "string" ? msg : "Xuất Excel thất bại.");
    } finally {
      setExporting(false);
    }
  };

  const maxBar = Math.max(
    1,
    ...trend.map((d) => d.present + d.issue),
    totalStaff || 0
  );

  return (
    <div className="flex flex-col w-full">
      {/* Top Meta & Control Bar */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-surface-container-high text-on-surface-variant font-code-telemetry text-label-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span>TRUNG TÂM ĐIỀU HÀNH CHẤM CÔNG AI</span>
          </div>
          <div className="inline-flex items-center gap-2 text-on-surface-variant font-code-telemetry text-label-md">
            <span className="inline-block w-2 h-2 rounded-full bg-secondary-fixed-dim animate-pulse"></span>
            <span className="px-2 py-0.5 rounded bg-secondary-fixed text-secondary font-label-sm">
              Đồng hồ máy chủ
            </span>
            <span className="text-on-surface-variant/40">|</span>
            <span className="text-on-surface font-semibold tracking-tight text-title-md font-mono">
              {clock}
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-xs">
          <div className="flex flex-col">
            <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight">
              Tổng quan chấm công hôm nay —{" "}
              {new Date().toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </h1>
            <span className="font-body-md text-body-md text-on-surface-variant mt-0.5">
              Hệ thống nhận diện camera AI đồng bộ trực tiếp tại các cổng Kiosk
              chấm công
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/monitoring")}
              className="h-11 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant text-on-surface hover:text-secondary hover:border-secondary transition-all font-label-lg text-label-lg flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] text-secondary">
                videocam
              </span>
              <span>Xem giám sát</span>
            </button>
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="h-11 px-5 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-all font-label-lg text-label-lg flex items-center gap-2 shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                download
              </span>
              <span>{exporting ? "Đang xuất..." : "Xuất Excel hôm nay"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Có mặt hôm nay
            </span>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-secondary-fixed/50 text-[#009668]">
              <span className="material-symbols-outlined material-symbols-filled text-[22px]">
                check_circle
              </span>
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
              {presentCount}
            </span>
            <span className="font-title-lg text-title-lg text-on-surface-variant font-medium">
              / {totalStaff}
            </span>
            <span className="ml-auto font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-[#009668]/10 text-[#009668] font-semibold">
              {presentRatio}%
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm">
            <span className="material-symbols-outlined text-[16px] text-[#009668]">
              update
            </span>
            <span>Theo dữ liệu điểm danh hôm nay</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Đi muộn
            </span>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-100 text-amber-700">
              <span className="material-symbols-outlined material-symbols-filled text-[22px]">
                warning
              </span>
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="font-headline-xl text-headline-xl text-amber-700 font-bold tracking-tight">
              {lateCount}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              nhân viên
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm">
            <span className="material-symbols-outlined text-[16px] text-amber-600">
              schedule
            </span>
            <span>Ca 08:00 (vào sau 08:15)</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Vắng mặt
            </span>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-error-container text-error">
              <span className="material-symbols-outlined material-symbols-filled text-[22px]">
                cancel
              </span>
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="font-headline-xl text-headline-xl text-error font-bold tracking-tight">
              {absentCount}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              chưa check-in
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm">
            <span className="material-symbols-outlined text-[16px] text-error">
              info
            </span>
            <span>Chưa có check-in trong ngày</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Tổng nhân viên
            </span>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-surface-container-highest text-on-surface">
              <span className="material-symbols-outlined text-[22px]">
                groups
              </span>
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
              {totalStaff}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              nhân sự hoạt động
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm">
            <span className="material-symbols-outlined text-[16px] text-secondary">
              domain
            </span>
            <span>
              {deptCount > 0
                ? `${deptCount} phòng ban / nhóm`
                : "Chưa có nhân viên"}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: 7-Day Trend Chart & State Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-title-md text-title-md text-on-surface tracking-tight">
                Xu hướng điểm danh 7 ngày qua (Có mặt / Vắng)
              </h2>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Dữ liệu tổng hợp từ các trạm Kiosk đến ca làm việc hôm nay
              </span>
            </div>
            <div className="flex items-center gap-4 text-label-sm font-label-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-secondary"></span>
                <span className="text-on-surface">Có mặt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-error"></span>
                <span className="text-on-surface">Vắng / Muộn</span>
              </div>
            </div>
          </div>

          <div className="w-full h-56 pt-2">
            {trend.length === 0 ||
            trend.every((d) => d.present === 0 && d.issue === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-on-surface-variant gap-2">
                <span className="material-symbols-outlined text-[36px] opacity-50">
                  bar_chart
                </span>
                <span className="font-body-md text-body-md">
                  Chưa có dữ liệu điểm danh 7 ngày gần đây
                </span>
              </div>
            ) : (
            <svg
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
              viewBox="0 0 700 200"
            >
              <line
                stroke="#eceef0"
                strokeDasharray="3 3"
                strokeWidth="1"
                x1="40"
                x2="680"
                y1="20"
                y2="20"
              />
              <text
                className="font-code-telemetry"
                fill="#7e7576"
                fontSize="10"
                textAnchor="end"
                x="32"
                y="24"
              >
                {maxBar}
              </text>
              <line
                stroke="#eceef0"
                strokeDasharray="3 3"
                strokeWidth="1"
                x1="40"
                x2="680"
                y1="65"
                y2="65"
              />
              <text
                className="font-code-telemetry"
                fill="#7e7576"
                fontSize="10"
                textAnchor="end"
                x="32"
                y="69"
              >
                {Math.round(maxBar * 0.7)}
              </text>
              <line
                stroke="#eceef0"
                strokeDasharray="3 3"
                strokeWidth="1"
                x1="40"
                x2="680"
                y1="110"
                y2="110"
              />
              <text
                className="font-code-telemetry"
                fill="#7e7576"
                fontSize="10"
                textAnchor="end"
                x="32"
                y="114"
              >
                {Math.round(maxBar * 0.4)}
              </text>
              <line
                stroke="#eceef0"
                strokeWidth="1"
                x1="40"
                x2="680"
                y1="155"
                y2="155"
              />
              <text
                className="font-code-telemetry"
                fill="#7e7576"
                fontSize="10"
                textAnchor="end"
                x="32"
                y="159"
              >
                0
              </text>

              {trend.map((d, idx) => {
                const xOffset = 65 + idx * 90;
                const pHeight = Math.max(4, Math.round((d.present / maxBar) * 135));
                const iHeight = Math.max(3, Math.round((d.issue / maxBar) * 135));
                return (
                  <g key={d.label + idx} transform={`translate(${xOffset}, 0)`}>
                    {d.isToday && (
                      <rect
                        fill="#eceef0"
                        height="135"
                        opacity="0.6"
                        rx="6"
                        width="55"
                        x="-4"
                        y="20"
                      />
                    )}
                    <rect
                      fill="#00687a"
                      height={pHeight}
                      opacity="0.95"
                      rx="3"
                      width="22"
                      x="0"
                      y={155 - pHeight}
                    />
                    <rect
                      fill="#ba1a1a"
                      height={iHeight}
                      opacity="0.85"
                      rx="3"
                      width="22"
                      x="25"
                      y={155 - iHeight}
                    />
                    <text
                      fill={d.isToday ? "#403ab8" : "#4c4a5e"}
                      fontSize="11"
                      fontWeight={d.isToday ? "700" : "500"}
                      textAnchor="middle"
                      x="23"
                      y="174"
                    >
                      {d.label}
                    </text>
                    <text
                      fill="#00687a"
                      fontSize="10"
                      fontWeight="700"
                      textAnchor="middle"
                      x="11"
                      y={150 - pHeight}
                    >
                      {d.present}
                    </text>
                  </g>
                );
              })}
            </svg>
            )}
          </div>

          <div className="mt-4 pt-3 bg-surface-container-low px-4 py-2.5 rounded-lg flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
            <span>
              Tỷ lệ có mặt trung bình 7 ngày:{" "}
              <strong className="text-on-surface">
                {weekAvgRatio != null ? `${weekAvgRatio}%` : "—"}
              </strong>
            </span>
            <span className="text-on-surface-variant font-medium">
              Theo bản ghi điểm danh thực tế
            </span>
          </div>
        </div>

        <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="font-title-md text-title-md text-on-surface tracking-tight">
              Phân bố trạng thái ca sáng
            </h2>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Tổng kết thời gian thực hôm nay
            </span>
          </div>

          <div className="my-6 relative flex items-center justify-center">
            <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                fill="none"
                r="62"
                stroke="#f2f4f6"
                strokeWidth="16"
              />
              <circle
                cx="80"
                cy="80"
                fill="none"
                r="62"
                stroke="#00687a"
                strokeDasharray={`${onTimeLen} ${CIRC}`}
                strokeLinecap="round"
                strokeWidth="16"
              />
              <circle
                cx="80"
                cy="80"
                fill="none"
                r="62"
                stroke="#d97706"
                strokeDasharray={`${lateLen} ${CIRC}`}
                strokeDashoffset={-onTimeLen}
                strokeWidth="16"
              />
              <circle
                cx="80"
                cy="80"
                fill="none"
                r="62"
                stroke="#ba1a1a"
                strokeDasharray={`${absentLen} ${CIRC}`}
                strokeDashoffset={-(onTimeLen + lateLen)}
                strokeWidth="16"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight leading-none">
                {onTimeRatio}%
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                Đúng giờ
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-body-sm font-body-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <span className="text-on-surface">Có mặt đúng giờ</span>
              </div>
              <span className="font-semibold text-on-surface">
                {onTimeCount} người ({onTimeRatio}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-body-sm font-body-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                <span className="text-on-surface">Đi muộn</span>
              </div>
              <span className="font-semibold text-amber-700">
                {lateCount} người ({lateRatio}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-body-sm font-body-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-error"></span>
                <span className="text-on-surface">Vắng mặt</span>
              </div>
              <span className="font-semibold text-error">
                {absentCount} người ({absentRatio}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Realtime Attendance Log Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-xs overflow-hidden flex flex-col">
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-secondary animate-pulse"></div>
            <div>
              <h2 className="font-title-md text-title-md text-on-surface tracking-tight">
                Nhật ký điểm danh thời gian thực (8 lượt gần nhất)
              </h2>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Tự động nhận dạng khuôn mặt qua luồng Camera Kiosk Cổng A, B
                &amp; C
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="font-code-telemetry text-label-sm text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-lg">
              {displayLogs.length} bản ghi hôm nay
            </span>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          {displayLogs.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[40px] opacity-50">
                event_busy
              </span>
              <span className="font-body-md text-body-md">
                Chưa có lượt điểm danh hôm nay
              </span>
              <span className="font-body-sm text-body-sm">
                Dữ liệu sẽ hiển thị khi có check-in từ Kiosk hoặc điểm danh thay
                thế
              </span>
            </div>
          ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md">
                <th className="py-3 px-4">Khuôn mặt</th>
                <th className="py-3 px-4">Mã NV</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Phòng ban</th>
                <th className="py-3 px-4">Giờ vào</th>
                <th className="py-3 px-4">Giờ ra</th>
                <th className="py-3 px-4">Độ chính xác AI</th>
                <th className="py-3 px-4 text-right">Trạng thái công</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-body-md text-body-md">
              {displayLogs.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => navigate(`/reports/${row.user_code}`)}
                  className="hover:bg-surface-container-low/60 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4">
                    {row.avatar ? (
                      <div
                        className={`relative w-10 h-10 rounded-full p-0.5 ${
                          row.status === "late"
                            ? "bg-amber-300"
                            : "bg-secondary-fixed"
                        }`}
                      >
                        <img
                          className="w-full h-full object-cover rounded-full"
                          alt={row.user_name}
                          src={row.avatar}
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant font-semibold">
                        {row.status === "absent" ? (
                          <span className="material-symbols-outlined text-[20px]">
                            person_off
                          </span>
                        ) : (
                          row.user_name?.[0] || "NV"
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-on-surface">
                    {row.user_code}
                  </td>
                  <td className="py-3 px-4 font-semibold text-on-surface">
                    {row.user_name}
                  </td>
                  <td className="py-3 px-4 text-on-surface-variant">
                    {row.group}
                  </td>
                  <td
                    className={`py-3 px-4 font-mono ${
                      row.status === "late"
                        ? "text-amber-700 font-medium"
                        : "text-on-surface"
                    }`}
                  >
                    {row.check_in_str}
                  </td>
                  <td className="py-3 px-4 font-mono text-on-surface-variant">
                    {row.check_out_str}
                  </td>
                  <td className="py-3 px-4">
                    {row.status === "absent" ? (
                      <div className="flex items-center gap-1.5 text-on-surface-variant/60 font-code-telemetry">
                        <span className="material-symbols-outlined text-[16px]">
                          remove
                        </span>
                        <span>0.0%</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-secondary font-code-telemetry">
                        <span className="material-symbols-outlined text-[16px]">
                          verified
                        </span>
                        <span>{row.confidence}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {row.status === "present" && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-[#009668]/10 text-[#009668]">
                        Có mặt
                      </span>
                    )}
                    {row.status === "late" && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-amber-500/10 text-amber-700">
                        Đi muộn
                      </span>
                    )}
                    {row.status === "early_leave" && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-amber-100 text-amber-800">
                        Về sớm
                      </span>
                    )}
                    {row.status === "absent" && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-error-container text-error">
                        Vắng
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        <div className="p-4 bg-surface-container-low/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-body-sm font-body-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-secondary">
              sync
            </span>
            <span>Làm mới tự động mỗi 15 giây từ API điểm danh</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Hiển thị {displayLogs.length} bản ghi gần nhất</span>
            <button
              onClick={() => navigate("/reports")}
              className="font-label-md text-label-md text-secondary hover:underline font-semibold cursor-pointer"
            >
              Xem toàn bộ lịch sử
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
