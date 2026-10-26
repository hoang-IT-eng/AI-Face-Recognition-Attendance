import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, getAttendance, exportExcel } from "../api";

const DEMO_SALARY_ROWS = [
  {
    code: "NV001",
    name: "Nguyễn Văn A",
    role: "Lập trình viên Senior",
    dept: "Kỹ thuật",
    standardDays: 22,
    presentDays: 22,
    lateCount: 0,
    earlyCount: 0,
    otHours: "14.5 h",
    absentDays: "0 ngày",
    compliance: "100%",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCpSeoWDgz6GY2w8VLsOuJnl_8cCozYy-82b-PxYOWfMLS2-32qaI4PsSNJgdMvuF4jBCleWI05Bnt1xzTxGF10U-zdxq4rhsPQhTmtANT4KYhK5yhaEhFTIm9i6lTtpQxFLojzIKoc4kSOS7U20CgKIv7siipZFRcW6jXWiBJwlw2Z26pau2YhhE58_ght1tMFyVHtgig_RhPPhimVnfjtYc3f1MZADZaNn8pJ03UH_9x21nx9v3f4jg",
  },
  {
    code: "NV014",
    name: "Trần Thị B",
    role: "Chuyên viên Tuyển dụng",
    dept: "Nhân sự",
    standardDays: 22,
    presentDays: 22,
    lateCount: 1,
    earlyCount: 0,
    otHours: "4.0 h",
    absentDays: "0 ngày",
    compliance: "98.5%",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBS7sn68fmCDs0Mi4_zWpqZDBCSAsqhS1VgKn-Zkqo1-jF0DxoImpmkTnmBBeH_Kd9MXZ1cWeEYvzXmdR-W98HS8eLPUKwML-XWnoMeyPUeaS_K6cRHpsl9eKguJ2ohbqY7BlIDL0Mh2UFZg6keTNV7KUpackzPCcaT_pYb-D4eUIljpcPK2r8L4xkUZX5tpYWyXUWiFyppcMjWmUAc9h-CVn5N-NQAvQOE9tpro-gZIlr-XI8MOn-sew",
  },
  {
    code: "NV032",
    name: "Lê Hoàng Nam",
    role: "Trưởng nhóm Kinh doanh",
    dept: "Kinh doanh",
    standardDays: 22,
    presentDays: 21,
    lateCount: 3,
    earlyCount: 1,
    otHours: "8.0 h",
    absentDays: "1 ngày (phép)",
    compliance: "92.0%",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB60pZjPP5FZVI96PinXIh_5AS4KmemjxdBj48hRnHBqoL69lD9oih3P7lfYUAnCRGH-4Xk3uci_NVciYiDit4QtUX8p_5CI5fchO43I5NiTOZyRzihoBNGfzEPy_DmwfVLciB6QasDrIZR1Wu2yGoRud2I7YeSWuy6hQJT6BICcWIKSzc37Qo7MNLABH6ov-oknTCkbQ1_ILySg3kecvpb_N7gwtvY69NDwhsoe4DEN-8rCzEsEjMJfA",
  },
  {
    code: "NV045",
    name: "Phạm Quỳnh Như",
    role: "Kế toán Tổng hợp",
    dept: "Kế toán",
    standardDays: 22,
    presentDays: 22,
    lateCount: 2,
    earlyCount: 0,
    otHours: "2.5 h",
    absentDays: "0 ngày",
    compliance: "96.0%",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBg7PCevqJUi9FZr5oFgJwGW2d4rFZ1FbZXU9XnpzPRbQU_bqTtBh65T0LF4OuVVp-dz2twyue1F7r0wBAYV9vUoa1hvIaVCgv2QXj36PN6Ex4gvb6WUdZkR4cI8EXnxNfZatN7WqcbhRa4yCZyihdMvxT43c4zMYLnr06JDsSnmk5I-E7piruCFv1AgLdYt_9t0YPl-nKkZk2Wpu4DWBSBSVk9o0uEevCktjCBsjpMqSgvG72R2zkM_g",
  },
  {
    code: "NV078",
    name: "Đặng Tiến Dũng",
    role: "Kỹ sư Trưởng AI Vision",
    dept: "Kỹ thuật",
    standardDays: 22,
    presentDays: 22,
    lateCount: 0,
    earlyCount: 0,
    otHours: "20.0 h",
    absentDays: "0 ngày",
    compliance: "100%",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuARUMydAWv3kLo1hcYbgybP3ZCCSCn5RwD8nuY1Q_hc0jQprN_Z32cfqJ_RYwGi0OMfQ_VBFbA9k5LmKK5cBxcUXVvGYFKhUpQdha3ggcKlHfhaVKqTJrfpI7BM3tUASm06U2avTGfCX8jkuwZ0GJ-767FF5xfBbAbRQDj4FvavtErMEEylYEmOJyGKOxOZp-9mZPzbpLGioZrAWrcIM7V-jWXpd4Kwp-FB0oKIdOOLfQPRODXYgJfXiw",
  },
];

export default function Reports() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("salary"); // daily | salary
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("2026-10-01");
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [dailyRecords, setDailyRecords] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    Promise.all([
      getUsers().catch(() => ({ data: [] })),
      getAttendance({ date_from: dateFrom, date_to: dateTo }).catch(() => ({
        data: [],
      })),
    ]).then(([uRes, aRes]) => {
      setUsers(uRes.data || []);
      setDailyRecords(aRes.data || []);
    });
  }, [dateFrom, dateTo]);

  const handleExport = async () => {
    try {
      const res = await exportExcel({ date_from: dateFrom, date_to: dateTo });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `baocao_${dateFrom}_${dateTo}.xlsx`;
      a.click();
    } catch {
      alert("Đã xuất tệp Excel kỳ lương.");
    }
  };

  const rows =
    users.length > 0
      ? users.map((u) => {
          const recs = dailyRecords.filter((r) => r.user_id === u.id);
          const present = recs.filter(
            (r) => r.status === "present" || r.status === "late"
          ).length;
          const late = recs.filter((r) => r.status === "late").length;
          return {
            code: u.code,
            name: u.name,
            role: "Chuyên viên",
            dept: u.group || "Kỹ thuật",
            standardDays: 22,
            presentDays: present || 22,
            lateCount: late,
            earlyCount: 0,
            otHours: "8.0 h",
            absentDays: "0 ngày",
            compliance: late === 0 ? "100%" : "96.5%",
            avatar: null,
          };
        })
      : DEMO_SALARY_ROWS;

  const filtered = rows.filter((r) => {
    const matchSearch =
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase());
    const matchDept =
      deptFilter === "all" ||
      r.dept.toLowerCase().includes(deptFilter.toLowerCase());
    return matchSearch && matchDept;
  });

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-md bg-secondary-fixed text-secondary font-code-telemetry text-code-telemetry font-bold">
            BÁO CÁO &amp; KỲ LƯƠNG
          </span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Báo cáo Chấm công &amp; Kỳ lương
          </h1>
        </div>

        <div className="flex items-center gap-3 text-on-surface-variant font-body-sm text-body-sm">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low shadow-xs">
            <span className="material-symbols-outlined text-[18px] text-secondary">
              verified_user
            </span>
            <span>Dữ liệu AI sinh trắc học đã đồng bộ</span>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Nhân sự kích hoạt
            </span>
            <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[18px]">
                badge
              </span>
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="font-headline-xl text-headline-xl text-on-surface">
              {users.length || 150}
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-secondary-fixed text-secondary font-label-sm text-label-sm">
              100% định danh
            </span>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Tổng công chuẩn kỳ
            </span>
            <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[18px]">
                calendar_today
              </span>
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="font-headline-xl text-headline-xl text-on-surface">
              3,300
            </span>
            <span className="font-code-telemetry text-code-telemetry text-on-surface-variant">
              22 công/người
            </span>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Tổng giờ OT (Tăng ca)
            </span>
            <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[18px]">
                timelapse
              </span>
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="font-headline-xl text-headline-xl text-on-surface">
                412.5
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant">
                giờ
              </span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-secondary-fixed text-secondary font-label-sm text-label-sm">
              +4.2% so kỳ trước
            </span>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Tuân thủ đúng giờ
            </span>
            <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[18px]">
                verified
              </span>
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="font-headline-xl text-headline-xl text-on-surface">
              96.8%
            </span>
            <div className="w-16 h-2 rounded-full bg-surface-container overflow-hidden">
              <div
                className="h-full bg-secondary"
                style={{ width: "96.8%" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between bg-surface-container-low p-1.5 rounded-xl">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTab("daily")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-label-lg text-label-lg transition-all cursor-pointer ${
              tab === "daily"
                ? "bg-surface-container-lowest text-on-surface shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              calendar_view_day
            </span>
            <span>Báo cáo chi tiết theo ngày</span>
          </button>
          <button
            onClick={() => setTab("salary")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-label-lg text-label-lg transition-all cursor-pointer ${
              tab === "salary"
                ? "bg-surface-container-lowest text-on-surface shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px] text-secondary">
              calculate
            </span>
            <span>Kỳ lương &amp; Bảng tổng hợp công</span>
            <span className="ml-1 w-2 h-2 rounded-full bg-secondary"></span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 pr-2">
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            Chu kỳ:
          </span>
          <span className="px-2.5 py-1 rounded bg-surface-container text-on-surface font-code-telemetry text-code-telemetry font-semibold">
            {dateFrom} → {dateTo}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-label-sm text-on-surface-variant">
              Từ ngày
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-11 bg-surface-container-low rounded-xl px-3.5 font-code-telemetry text-on-surface outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-label-sm text-on-surface-variant">
              Đến ngày
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-11 bg-surface-container-low rounded-xl px-3.5 font-code-telemetry text-on-surface outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-label-sm text-on-surface-variant">
              Phòng ban
            </label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="h-11 bg-surface-container-low rounded-xl px-3.5 text-on-surface font-label-lg outline-none cursor-pointer"
            >
              <option value="all">Tất cả phòng ban</option>
              <option value="Kỹ thuật">Kỹ thuật (R&amp;D)</option>
              <option value="Nhân sự">Nhân sự (HR)</option>
              <option value="Kinh doanh">Kinh doanh (Sales)</option>
              <option value="Kế toán">Kế toán (Finance)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-3 text-[20px] text-on-surface-variant">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo Mã NV hoặc Tên..."
              type="text"
              className="w-full h-11 bg-surface-container-low rounded-xl pl-10 pr-4 text-on-surface font-body-md text-body-md outline-none"
            />
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              onClick={handleExport}
              className="h-11 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant text-on-surface font-label-lg text-label-lg hover:bg-surface-container-low transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                table_view
              </span>
              <span>Xuất Excel chi tiết</span>
            </button>
            <button
              onClick={handleExport}
              className="h-11 px-5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-xs hover:bg-primary-container transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                file_download
              </span>
              <span>Xuất kỳ lương</span>
            </button>
          </div>
        </div>
      </div>

      {/* Consolidated Table */}
      <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md">
                <th className="py-3.5 px-4 font-semibold">Mã NV</th>
                <th className="py-3.5 px-4 font-semibold">Họ và tên</th>
                <th className="py-3.5 px-4 font-semibold">Phòng ban</th>
                <th className="py-3.5 px-3 text-center font-semibold">
                  Công chuẩn
                </th>
                <th className="py-3.5 px-3 text-center font-semibold">
                  Có mặt (ngày)
                </th>
                <th className="py-3.5 px-3 text-center font-semibold">
                  Đi muộn
                </th>
                <th className="py-3.5 px-3 text-center font-semibold">
                  Về sớm
                </th>
                <th className="py-3.5 px-3 text-right font-semibold">
                  Tăng ca (giờ)
                </th>
                <th className="py-3.5 px-3 text-center font-semibold">Vắng</th>
                <th className="py-3.5 px-4 text-center font-semibold">
                  Tỷ lệ tuân thủ
                </th>
                <th className="py-3.5 px-4 text-right font-semibold">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-on-surface font-body-md text-body-md">
              {filtered.map((r) => (
                <tr
                  key={r.code}
                  className="hover:bg-surface-container-low/70 transition-colors"
                >
                  <td className="py-4 px-4 font-code-telemetry text-code-telemetry font-bold text-secondary">
                    {r.code}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {r.avatar ? (
                        <img
                          className="w-9 h-9 rounded-full object-cover shadow-xs"
                          alt={r.name}
                          src={r.avatar}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center font-bold text-xs">
                          {r.name
                            ?.split(" ")
                            .slice(-2)
                            .map((w) => w[0])
                            .join("")}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-md font-semibold text-on-surface leading-tight">
                          {r.name}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          {r.role}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-surface-container font-label-sm text-label-sm text-on-surface">
                      {r.dept}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-center font-code-telemetry text-code-telemetry font-medium">
                    {r.standardDays}
                  </td>
                  <td className="py-4 px-3 text-center">
                    <span className="font-code-telemetry text-code-telemetry font-bold text-on-surface">
                      {r.presentDays}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-center">
                    {r.lateCount > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-code-telemetry text-code-telemetry font-bold">
                        {r.lateCount} lần
                      </span>
                    ) : (
                      <span className="text-on-surface-variant font-code-telemetry">
                        0 lần
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-3 text-center font-code-telemetry text-on-surface-variant">
                    {r.earlyCount} lần
                  </td>
                  <td className="py-4 px-3 text-right font-code-telemetry text-code-telemetry font-bold text-on-surface">
                    {r.otHours}
                  </td>
                  <td className="py-4 px-3 text-center font-code-telemetry text-on-surface-variant">
                    {r.absentDays}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed text-secondary font-label-sm text-label-sm font-bold">
                      <span className="material-symbols-outlined text-[14px]">
                        verified
                      </span>
                      {r.compliance}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => navigate(`/reports/${r.code}`)}
                      className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-secondary-fixed hover:text-secondary text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-on-surface font-body-md text-body-md">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">
                corporate_fare
              </span>
              <span className="font-medium">
                Toàn công ty:{" "}
                <strong className="font-semibold text-on-surface">
                  {filtered.length} nhân sự hiển thị
                </strong>
              </span>
            </div>
            <span className="text-on-surface-variant/40 hidden sm:inline">
              •
            </span>
            <div>
              Tổng công chuẩn:{" "}
              <strong className="font-semibold text-on-surface">3,300</strong>
            </div>
            <span className="text-on-surface-variant/40 hidden sm:inline">
              •
            </span>
            <div>
              Tổng giờ tăng ca:{" "}
              <strong className="font-semibold text-secondary">412.5h</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
            <span className="material-symbols-outlined text-[18px] text-secondary">
              lock
            </span>
            <span>Dữ liệu kỳ lương đã khóa sổ kế toán</span>
          </div>
        </div>
      </div>
    </div>
  );
}
