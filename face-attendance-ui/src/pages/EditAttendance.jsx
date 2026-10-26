import { useEffect, useState } from "react";
import { getUsers, manualAttendance } from "../api";

const INITIAL_ADJUSTMENTS = [
  {
    id: 1,
    code: "NV045",
    name: "Phạm Quỳnh Như",
    dept: "Kế toán",
    date: "24/10/2024",
    inOld: "08:35:00",
    inNew: "08:00:00",
    outOld: "--:--",
    outNew: "17:30:00",
    reason: "Camera cổng A bảo trì, nhân viên có mặt đúng giờ",
    attachment: "1 file minh chứng (.PDF)",
    source: "Thủ công (Lê Thu Hà - HR)",
    timestamp: "08:42:15 • 24/10",
    isManual: true,
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD9a-N_-UANzOX0lKV2iWkf3Qqb-I4BMgp3igTJeJT3ICZNuaHZdyKU-CrgxhgCKUq4Zr1oMALETR7pQxNJ5Y3rApnYdBx0JC0VmLOd0LCL0BWoCIAe1ZU_wsHRJ24NJn6dVi3uLCnwaoXrTd4hWeORrjDet3aO_na38l1GanovHDxpjz6Ycd6np1YQc9Q6mS8t0ROvHIU8QlRWw6mX6LCHQ5PvE7ONu91r0EoZF78rd7SaxrXBtmOkMw",
  },
  {
    id: 2,
    code: "NV014",
    name: "Trần Thị B",
    dept: "Nhân sự",
    date: "23/10/2024",
    inOld: null,
    inNew: "07:55:00",
    outOld: "16:45:00",
    outNew: "17:30:00",
    reason: "Gặp đối tác ngoài công ty lúc cuối giờ",
    attachment: "Biên bản công tác (.JPG)",
    source: "Thủ công (Lê Thu Hà - HR)",
    timestamp: "17:45:10 • 23/10",
    isManual: true,
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAGeVsi8z1H72JliXB0rSIuQ7-Ibu0YI-JFM0_VJaOfUEu1L_VlUFlOhS-pZRqhMHXrCFm3wBBvW4ZcDU_wogH215no1uM8Vy4Yc_5z8s3ys1B9d6bpyWZD_DK_ZQ6v0QlSmZrFKslhhb_VVyxKMwoivlDewJ-FlzHhNVNJnb2pHsbeLIT_ywL7Zgo9HGNfruO4hGPCjxaNregDOjNUBhjSqSCiDMN2hG1B2LGGLKOIuHGC97QLY0NRdw",
  },
  {
    id: 3,
    code: "NV001",
    name: "Nguyễn Văn A",
    dept: "Kỹ thuật",
    date: "24/10/2024",
    inOld: null,
    inNew: "07:52:10",
    outOld: null,
    outNew: "17:35:00",
    reason: "Ghi nhận tự động AI Camera",
    attachment: "Kiosk Cổng 1 (99.8%)",
    source: "Camera AI",
    timestamp: "Tự động đồng bộ",
    isManual: false,
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB4dh7iWvaGXuxCOeVkohYjAeJOz5ELA0NxcwLHeAtcCHW8SScg4dYqxkmw3W9zy-ufm38q0vtm4_kRdV2uITKX5AQKfPq4ILZsAWGb69rFPR0D0jV_D1sGTkjFRWWOtRmRgc7RdV2zv46XDt-qWB-DBRTo0PFb1iCTFy6rj_o8vQIeOnjRR6wA6SgDKEjn7TeHWldDp5LBDq6mUjNCBOtowk-X28fGsl41-FYqN5yx-ZiwbzMqDO-FAw",
  },
];

export default function EditAttendance() {
  const [users, setUsers] = useState([]);
  const [rows, setRows] = useState(INITIAL_ADJUSTMENTS);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [modalRow, setModalRow] = useState(null);
  const [toast, setToast] = useState("");

  const [selectedUserId, setSelectedUserId] = useState("");
  const [workDate, setWorkDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [timeIn, setTimeIn] = useState("08:00:00");
  const [timeOut, setTimeOut] = useState("17:30:00");
  const [reason, setReason] = useState(
    "Quên check-in do gặp khách hàng tại sảnh / Camera bảo trì"
  );

  useEffect(() => {
    getUsers()
      .then((r) => {
        if (r.data?.length) {
          setUsers(r.data);
          setSelectedUserId(String(r.data[0].id));
        }
      })
      .catch(() => {});
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3200);
  };

  const handleCreateManual = async (e) => {
    e.preventDefault();
    const u = users.find((x) => String(x.id) === String(selectedUserId));
    try {
      if (u) {
        await manualAttendance({
          user_id: u.id,
          date: workDate,
          status: "present",
          note: reason,
        });
      }
    } catch {}

    const newItem = {
      id: Date.now(),
      code: u?.code || "NV045",
      name: u?.name || "Phạm Quỳnh Như",
      dept: u?.group || "Kế toán",
      date: workDate.split("-").reverse().join("/"),
      inOld: "--:--",
      inNew: timeIn,
      outOld: "--:--",
      outNew: timeOut,
      reason,
      attachment: "bien_ban_xac_nhan.pdf",
      source: "Thủ công (Lê Thu Hà - HR)",
      timestamp: "Vừa xong",
      isManual: true,
      avatar: null,
    };
    setRows((p) => [newItem, ...p]);
    showToast(`Đã xác nhận lưu công thủ công cho ${newItem.name}`);
  };

  const filtered = rows.filter((r) => {
    const matchSearch =
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase());
    const matchSource =
      sourceFilter === "all" ||
      (sourceFilter === "manual" && r.isManual) ||
      (sourceFilter === "ai" && !r.isManual);
    return matchSearch && matchSource;
  });

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-primary text-on-primary font-code-telemetry text-label-sm">
              KIỂM TOÁN &amp; ĐIỀU CHỈNH CÔNG
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-fixed text-secondary font-code-telemetry text-label-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary"></span>
              AUDIT ENGINE ACTIVE
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Sửa công &amp; Giải trình bảng công
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Quản lý các bản ghi điểm danh ngoại lệ, xác thực camera AI và phê
            duyệt điều chỉnh giờ công thủ công.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-2.5 rounded-xl border border-outline-variant/40 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[20px]">
                history_edu
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Lượt sửa hôm nay
              </span>
              <span className="font-title-md text-title-md text-on-surface leading-none font-bold">
                {rows.filter((x) => x.isManual).length} trường hợp
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-2.5 rounded-xl border border-outline-variant/40 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">
                verified_user
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Tỉ lệ AI tin cậy
              </span>
              <span className="font-title-md text-title-md text-on-surface leading-none font-bold">
                98.6%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="w-full bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          <div className="flex flex-col gap-1">
            <label className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">
                calendar_today
              </span>
              <span>Chọn ngày</span>
            </label>
            <input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface font-code-telemetry text-body-md rounded-xl focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">
                domain
              </span>
              <span>Phòng ban</span>
            </label>
            <select className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface font-body-md rounded-xl focus:outline-none cursor-pointer">
              <option>Tất cả phòng ban</option>
              <option>Phòng Kế toán</option>
              <option>Phòng Nhân sự</option>
              <option>Phòng Kỹ thuật R&amp;D</option>
              <option>Phòng Kinh doanh</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">
                filter_alt
              </span>
              <span>Nguồn ghi nhận</span>
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface font-body-md rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả</option>
              <option value="ai">Nhận diện AI (Camera Face)</option>
              <option value="manual">Thủ công (HR sửa)</option>
            </select>
          </div>
        </div>

        <div className="flex items-end self-end lg:self-end pt-2 lg:pt-0">
          <button
            onClick={() => setModalRow(rows[0])}
            className="h-11 px-6 bg-primary text-on-primary rounded-xl flex items-center gap-2.5 font-label-lg text-label-lg hover:bg-primary-container shadow-sm transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">
              edit_calendar
            </span>
            <span>Thêm công tay</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid (8 : 4) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Table (8 cols) */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-xs overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-surface-container-lowest flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-title-md text-title-md text-on-surface font-bold">
                  Danh sách điều chỉnh công nhật
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-code-telemetry text-label-sm">
                  {filtered.length} bản ghi hiển thị
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm tên, mã nhân viên..."
                    type="text"
                    className="h-9 pl-8 pr-3 text-body-sm bg-surface-container-low rounded-lg text-on-surface focus:outline-none"
                  />
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant absolute left-2.5 top-2.5">
                    search
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left font-body-sm border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-label-sm font-label-sm">
                    <th className="py-3 px-4">Nhân sự</th>
                    <th className="py-3 px-3">Phòng ban</th>
                    <th className="py-3 px-3">Ngày</th>
                    <th className="py-3 px-3">Vào (Gốc / Sửa)</th>
                    <th className="py-3 px-3">Ra (Gốc / Sửa)</th>
                    <th className="py-3 px-4">Lý do điều chỉnh</th>
                    <th className="py-3 px-3">Người sửa &amp; Nguồn</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container text-on-surface">
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-surface-container-low/60 transition-colors"
                    >
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-3">
                          {r.avatar ? (
                            <img
                              className="w-9 h-9 rounded-full object-cover shrink-0 shadow-xs"
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
                          <div className="flex flex-col min-w-0">
                            <span className="font-label-lg text-label-lg font-bold text-on-surface truncate">
                              {r.name}
                            </span>
                            <span className="font-code-telemetry text-label-sm text-secondary font-medium">
                              {r.code}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 align-top font-body-sm text-on-surface-variant">
                        {r.dept}
                      </td>
                      <td className="py-4 px-3 align-top font-code-telemetry text-body-sm text-on-surface">
                        {r.date}
                      </td>
                      <td className="py-4 px-3 align-top">
                        <div className="flex flex-col font-code-telemetry">
                          {r.inOld && (
                            <span className="text-on-surface-variant line-through text-body-sm">
                              {r.inOld}
                            </span>
                          )}
                          <span className="text-secondary font-bold text-title-md">
                            {r.inNew}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-3 align-top">
                        <div className="flex flex-col font-code-telemetry">
                          {r.outOld && (
                            <span className="text-on-surface-variant line-through text-body-sm">
                              {r.outOld}
                            </span>
                          )}
                          <span className="text-secondary font-bold text-title-md">
                            {r.outNew}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top max-w-[200px]">
                        <p className="font-body-sm text-body-sm text-on-surface leading-snug line-clamp-2">
                          {r.reason}
                        </p>
                        <div className="mt-1 flex items-center gap-1 text-label-sm font-label-sm text-secondary">
                          <span className="material-symbols-outlined text-[14px]">
                            attach_file
                          </span>
                          <span>{r.attachment}</span>
                        </div>
                      </td>
                      <td className="py-4 px-3 align-top">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-label-sm text-label-sm font-medium ${
                              r.isManual
                                ? "bg-secondary-fixed text-on-secondary-fixed"
                                : "bg-secondary/10 text-secondary"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {r.isManual ? "badge" : "videocam"}
                            </span>
                            {r.source}
                          </span>
                          <span className="font-code-telemetry text-label-sm text-on-surface-variant">
                            {r.timestamp}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setModalRow(r)}
                            className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              edit
                            </span>
                            <span>Sửa</span>
                          </button>
                          <button
                            onClick={() =>
                              setRows((p) => p.filter((x) => x.id !== r.id))
                            }
                            className="p-1.5 rounded-lg text-error hover:bg-error-container transition-colors cursor-pointer"
                            title="Xóa điều chỉnh"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              delete_sweep
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-surface-container-lowest border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-3 font-body-sm text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span>
                  Hiển thị 1 - {filtered.length} của {filtered.length} kết quả
                </span>
                <span className="text-outline-variant">•</span>
                <span className="font-code-telemetry text-label-sm">
                  Log Hash: #AC88-SECURE-24
                </span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-secondary-fixed text-secondary shrink-0">
                <span className="material-symbols-outlined text-[24px]">
                  verified
                </span>
              </div>
              <div className="flex flex-col">
                <h2 className="font-title-md text-title-md text-on-surface font-semibold">
                  Quy chuẩn can thiệp công thủ công
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Tất cả dữ liệu điều chỉnh giờ công bởi Quản trị viên/HR đều
                  được băm SHA-256 kèm hình ảnh hoặc biên bản giải trình để bảo
                  đảm tính minh bạch trong đợt kiểm toán nội bộ.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form "Thêm công tay" (4 cols) */}
        <div className="xl:col-span-4 flex flex-col">
          <div className="w-full bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/40 shadow-md flex flex-col gap-5 sticky top-20">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    post_add
                  </span>
                </div>
                <div className="flex flex-col">
                  <h2 className="font-title-lg text-title-lg text-on-surface font-bold leading-tight">
                    Tạo bản ghi công thủ công
                  </h2>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Phê chuẩn trực tiếp qua HR Admin
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary font-code-telemetry text-label-sm font-semibold">
                HR-OVERRIDE
              </span>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleCreateManual}>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-lg text-label-lg text-on-surface flex items-center justify-between">
                  <span>Nhân sự áp dụng</span>
                  <span className="text-error font-body-sm">*</span>
                </label>
                {users.length > 0 ? (
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full h-12 px-3.5 bg-surface-container-low rounded-xl font-body-md text-on-surface focus:outline-none"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.code} - {u.name} ({u.group || "Kỹ thuật"})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full h-12 px-3.5 bg-surface-container-low rounded-xl flex items-center justify-between">
                    <span className="font-body-md text-body-md text-on-surface font-medium truncate">
                      NV045 - Phạm Quỳnh Như (Kế toán)
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-lg text-label-lg text-on-surface">
                  Ngày làm việc *
                </label>
                <input
                  type="date"
                  value={workDate}
                  onChange={(e) => setWorkDate(e.target.value)}
                  className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface font-code-telemetry text-body-md rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      login
                    </span>
                    <span>Giờ vào thực tế</span>
                  </label>
                  <input
                    value={timeIn}
                    onChange={(e) => setTimeIn(e.target.value)}
                    type="text"
                    className="w-full h-11 px-3 bg-surface-container-low text-on-surface font-code-telemetry text-title-md font-semibold rounded-xl focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      logout
                    </span>
                    <span>Giờ ra thực tế</span>
                  </label>
                  <input
                    value={timeOut}
                    onChange={(e) => setTimeOut(e.target.value)}
                    type="text"
                    className="w-full h-11 px-3 bg-surface-container-low text-on-surface font-code-telemetry text-title-md font-semibold rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-label-lg text-label-lg text-on-surface">
                    Lý do điều chỉnh
                  </label>
                  <span className="text-error font-label-sm text-label-sm">
                    Bắt buộc
                  </span>
                </div>
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-surface-container-low text-on-surface font-body-md rounded-xl focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  shield
                </span>
                <div className="flex flex-col font-body-sm text-on-surface-variant">
                  <span>
                    Người xác thực:{" "}
                    <strong className="text-on-surface">Lê Thu Hà</strong> (Quản
                    trị viên / HR)
                  </span>
                  <span className="font-code-telemetry text-label-sm">
                    SHA-256 Audit Logged
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReason("")}
                  className="w-1/3 h-11 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-label-lg text-label-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="w-2/3 h-11 bg-primary text-on-primary rounded-xl font-label-lg text-label-lg hover:bg-primary-container shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    save
                  </span>
                  <span>Xác nhận lưu công</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Quick Edit Modal */}
      {modalRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-background/40 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-lg p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <h3 className="font-title-lg text-title-lg text-on-surface font-bold">
                  Điều chỉnh công nhanh — {modalRow.name}
                </h3>
              </div>
              <button
                onClick={() => setModalRow(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant">
                  Giờ vào mới
                </label>
                <input
                  defaultValue={modalRow.inNew}
                  type="text"
                  className="h-10 px-3 bg-surface-container rounded-lg font-code-telemetry text-body-md text-on-surface focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant">
                  Giờ ra mới
                </label>
                <input
                  defaultValue={modalRow.outNew}
                  type="text"
                  className="h-10 px-3 bg-surface-container rounded-lg font-code-telemetry text-body-md text-on-surface focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setModalRow(null)}
                className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setModalRow(null);
                  showToast(`Đã cập nhật bản ghi công của ${modalRow.name}`);
                }}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container shadow-sm cursor-pointer"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-on-primary px-5 py-3 rounded-xl shadow-xl flex items-center gap-2.5">
          <span className="material-symbols-outlined text-secondary-fixed text-[20px]">
            check_circle
          </span>
          <span className="font-body-md text-body-md">{toast}</span>
        </div>
      )}
    </div>
  );
}
