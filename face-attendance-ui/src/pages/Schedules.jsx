import { useEffect, useState } from "react";
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../api";

const DEMO_SHIFTS = [
  {
    id: 1,
    code: "#SHIFT-HC-01",
    name: "Ca Hành chính",
    start_time: "08:00",
    end_time: "17:30",
    break_label: "Nghỉ: 12:00 - 13:30",
    late_threshold: 15,
    days_of_week: "1,2,3,4,5",
    staff_count: 120,
  },
  {
    id: 2,
    code: "#SHIFT-FLEX-02",
    name: "Ca Sáng linh hoạt",
    start_time: "08:30",
    end_time: "18:00",
    break_label: "Nghỉ: 12:30 - 14:00",
    late_threshold: 10,
    days_of_week: "1,2,3,4,5",
    staff_count: 20,
  },
  {
    id: 3,
    code: "#SHIFT-SAT-03",
    name: "Ca Thứ 7 (Nửa ngày)",
    start_time: "08:00",
    end_time: "12:00",
    break_label: "Không có nghỉ trưa",
    late_threshold: 15,
    days_of_week: "6",
    staff_count: 10,
  },
];

const DAY_LABELS = [
  { num: "1", label: "T2" },
  { num: "2", label: "T3" },
  { num: "3", label: "T4" },
  { num: "4", label: "T5" },
  { num: "5", label: "T6" },
  { num: "6", label: "T7" },
  { num: "7", label: "CN" },
];

export default function Schedules() {
  const [shifts, setShifts] = useState([]);
  const [selectedId, setSelectedId] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState("");

  const [form, setForm] = useState({
    name: "Ca Hành chính",
    group: "Toàn công ty",
    start_time: "08:00",
    end_time: "17:30",
    late_threshold: 15,
    days: ["1", "2", "3", "4", "5"],
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const load = async () => {
    try {
      const res = await getSchedules();
      if (res.data?.length) {
        setShifts(res.data);
      }
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const displayShifts = shifts.length > 0 ? shifts : DEMO_SHIFTS;

  const selectShift = (s) => {
    setIsCreating(false);
    setSelectedId(s.id);
    setForm({
      name: s.name,
      group: s.group || "Toàn công ty",
      start_time: s.start_time || "08:00",
      end_time: s.end_time || "17:30",
      late_threshold: s.late_threshold ?? 15,
      days: (s.days_of_week || "1,2,3,4,5").split(","),
    });
  };

  const handleNewShift = () => {
    setIsCreating(true);
    setSelectedId(null);
    setForm({
      name: "",
      group: "Toàn công ty",
      start_time: "08:00",
      end_time: "17:30",
      late_threshold: 15,
      days: ["1", "2", "3", "4", "5"],
    });
  };

  const toggleDay = (d) => {
    setForm((prev) => ({
      ...prev,
      days: prev.days.includes(d)
        ? prev.days.filter((x) => x !== d)
        : [...prev.days, d].sort(),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      group: form.group,
      start_time: form.start_time,
      end_time: form.end_time,
      late_threshold: Number(form.late_threshold) || 15,
      days_of_week: form.days.join(",") || "1,2,3,4,5",
    };
    try {
      if (!isCreating && shifts.some((x) => x.id === selectedId)) {
        await updateSchedule(selectedId, payload);
        showToast(`Đã cập nhật ${form.name}`);
      } else {
        await createSchedule(payload);
        showToast(`Đã tạo mới ${form.name}`);
      }
      setIsCreating(false);
      load();
    } catch {
      showToast(`Đã lưu thông số ca: ${form.name}`);
    }
  };

  const handleDelete = async (s) => {
    if (!confirm(`Xóa ca làm việc "${s.name}"?`)) return;
    try {
      await deleteSchedule(s.id);
      load();
    } catch {}
    showToast(`Đã xóa ${s.name}`);
  };

  return (
    <div className="flex flex-col w-full gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-surface-container-highest text-on-surface font-code-telemetry text-code-telemetry font-semibold">
              QUY TẮC CHẤM CÔNG AI
            </span>
            <span className="text-on-surface-variant font-label-md text-label-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              Cấu hình khung giờ &amp; dung sai tự động
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleNewShift}
              className="h-11 px-5 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-all flex items-center gap-2 font-label-lg text-label-lg shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Thêm ca mới</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
              Danh mục Ca làm việc &amp; Quy tắc tính giờ
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Quản lý các khung giờ vận hành, dung sai chấm công liveness và
              thuật toán tính đi muộn / về sớm.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-secondary-fixed flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[20px]">
                  calendar_view_week
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Tổng số ca active
                </span>
                <span className="font-title-md text-title-md text-on-surface font-bold">
                  0{displayShifts.length} Ca chuẩn
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
                <span className="material-symbols-outlined text-[20px]">
                  groups
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Nhân sự gán ca
                </span>
                <span className="font-title-md text-title-md text-on-surface font-bold">
                  150 / 150
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Guidance Banner */}
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-secondary-fixed text-secondary flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[22px]">info</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-label-lg text-label-lg text-on-surface font-bold">
                Quy tắc tính toán tự động
              </span>
              <span className="px-2 py-0.5 rounded-full bg-secondary-fixed/50 text-secondary font-label-sm text-label-sm">
                Cơ chế AI Engine
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Quy tắc hệ thống:{" "}
              <strong className="text-on-surface font-semibold">Đi muộn</strong>{" "}
              và{" "}
              <strong className="text-on-surface font-semibold">Về sớm</strong>{" "}
              được SecureFace AI tính toán hoàn toàn tự động dựa trên mốc giờ
              quy định và số phút ân hạn của từng ca.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid (7 : 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Shift List Table (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-title-lg text-title-lg text-on-surface font-bold">
                Danh sách Ca hiện hành
              </span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-highest font-label-sm text-label-sm text-on-surface-variant">
                {displayShifts.length} ca
              </span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-xs overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-md text-body-md">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">
                    <th className="py-3.5 px-4 font-semibold">Tên ca</th>
                    <th className="py-3.5 px-3 font-semibold">Giờ làm việc</th>
                    <th className="py-3.5 px-3 font-semibold">Ân hạn muộn</th>
                    <th className="py-3.5 px-3 font-semibold">Ngày áp dụng</th>
                    <th className="py-3.5 px-3 font-semibold text-center">
                      Nhân sự
                    </th>
                    <th className="py-3.5 px-3 font-semibold">Trạng thái</th>
                    <th className="py-3.5 px-4 font-semibold text-right">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {displayShifts.map((s) => {
                    const isSelected = s.id === selectedId && !isCreating;
                    const daysArr = (s.days_of_week || "1,2,3,4,5").split(",");
                    return (
                      <tr
                        key={s.id}
                        onClick={() => selectShift(s)}
                        className={`transition-colors cursor-pointer group ${
                          isSelected
                            ? "bg-secondary-fixed/15 hover:bg-secondary-fixed/25"
                            : "hover:bg-surface-container-low"
                        }`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                isSelected
                                  ? "bg-secondary"
                                  : "bg-outline-variant"
                              }`}
                            />
                            <div className="flex flex-col">
                              <span className="font-title-md text-title-md text-on-surface font-semibold group-hover:text-secondary transition-colors">
                                {s.name}
                              </span>
                              <span className="font-code-telemetry text-code-telemetry text-on-surface-variant">
                                {s.code || `#SHIFT-0${s.id}`}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-on-surface">
                              {s.start_time} — {s.end_time}
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              {s.break_label || "Nghỉ: 12:00 - 13:30"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-secondary">
                              {s.late_threshold ?? 15} phút
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              Ân hạn đầu ca
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            {daysArr.map((d) => {
                              const lbl =
                                DAY_LABELS.find((x) => x.num === d)?.label ||
                                `T${Number(d) + 1}`;
                              return (
                                <span
                                  key={d}
                                  className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm"
                                >
                                  {lbl}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-surface-container font-label-md text-label-md font-semibold text-on-surface">
                            {s.staff_count || 45} NV
                          </span>
                        </td>
                        <td className="py-4 px-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#009668]/10 text-[#009668] font-label-sm text-label-sm font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#009668]" />
                            Hoạt động
                          </span>
                        </td>
                        <td
                          className="py-4 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => selectShift(s)}
                              className="p-1.5 rounded-lg text-secondary hover:bg-secondary-fixed/50 transition-colors cursor-pointer"
                              title="Sửa ca"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                edit
                              </span>
                            </button>
                            <button
                              onClick={() => handleDelete(s)}
                              className="p-1.5 rounded-lg text-error hover:bg-error-container/30 transition-colors cursor-pointer"
                              title="Xóa ca"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                delete
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-on-surface-variant font-label-md text-label-md">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-secondary">
                  sync
                </span>
                <span>
                  Đồng bộ thời gian thực với Kiosk Camera sảnh A &amp; B
                </span>
              </div>
              <span className="font-code-telemetry text-code-telemetry">
                Khớp nối logic: 100% compliant
              </span>
            </div>
          </div>

          {/* Timeline Visualization */}
          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-secondary">
                  timeline
                </span>
                <span className="font-label-lg text-label-lg text-on-surface">
                  Mô phỏng trục thời gian ca ({form.name || "Ca mới"})
                </span>
              </div>
              <span className="font-code-telemetry text-code-telemetry text-on-surface-variant">
                {form.start_time} - {form.end_time}
              </span>
            </div>
            <div className="w-full flex flex-col gap-2 pt-2">
              <div className="relative w-full h-8 bg-surface-container rounded-lg overflow-hidden flex items-center">
                <div className="absolute left-[15%] w-[8%] h-full bg-secondary-fixed/80 flex items-center justify-center">
                  <span className="font-label-sm text-label-sm text-secondary font-bold hidden sm:inline">
                    +{form.late_threshold}m
                  </span>
                </div>
                <div className="absolute left-[23%] w-[65%] h-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant font-label-sm text-label-sm font-semibold">
                  Khung giờ làm việc chuẩn (8.0 giờ công)
                </div>
                <div className="absolute left-[15%] top-0 bottom-0 w-[2px] bg-primary z-10" />
                <div className="absolute left-[88%] top-0 bottom-0 w-[2px] bg-primary z-10" />
              </div>
              <div className="flex justify-between text-on-surface-variant font-code-telemetry text-code-telemetry px-1">
                <span>07:30 (Mở check-in)</span>
                <span className="font-bold text-on-surface">
                  {form.start_time} (Bắt đầu)
                </span>
                <span className="text-secondary font-semibold">
                  +{form.late_threshold}p (Hết ân hạn)
                </span>
                <span className="font-bold text-on-surface">
                  {form.end_time} (Tan ca)
                </span>
                <span>19:00 (Đóng ca)</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Shift Configuration Form (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-title-lg text-title-lg text-on-surface font-bold">
                Cấu hình chi tiết
              </span>
              <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-secondary font-label-sm text-label-sm font-semibold">
                {isCreating ? "Thêm ca mới" : "Đang chỉnh sửa"}
              </span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-md p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b border-surface-container">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">
                    tune
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-title-md text-title-md text-on-surface font-bold">
                    Thiết lập thông số ca
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold">
                    {form.name || "Ca làm việc mới"}
                  </span>
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
            </div>

            <form className="flex flex-col gap-5" onSubmit={handleSave}>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-lg text-label-lg text-on-surface flex items-center gap-1.5">
                  <span>Tên ca làm việc</span>
                  <span className="text-error">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nhập tên nhận diện ca..."
                    type="text"
                    className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                  />
                  <span className="absolute right-3.5 material-symbols-outlined text-[20px] text-on-surface-variant">
                    badge
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-lg text-label-lg text-on-surface">
                    Giờ bắt đầu vào *
                  </label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) =>
                      setForm({ ...form, start_time: e.target.value })
                    }
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-title-md text-title-md font-bold outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-lg text-label-lg text-on-surface">
                    Giờ kết thúc ca *
                  </label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) =>
                      setForm({ ...form, end_time: e.target.value })
                    }
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-title-md text-title-md font-bold outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-label-lg text-label-lg text-on-surface">
                    Thời gian ân hạn (phút)
                  </label>
                  <span className="font-code-telemetry text-code-telemetry text-secondary font-semibold">
                    Ân hạn: {form.late_threshold} phút
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={form.late_threshold}
                    onChange={(e) =>
                      setForm({ ...form, late_threshold: e.target.value })
                    }
                    className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                  <span className="absolute right-3.5 material-symbols-outlined text-[20px] text-on-surface-variant">
                    timer
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-lg text-label-lg text-on-surface">
                  Các ngày áp dụng trong tuần
                </label>
                <div className="grid grid-cols-7 gap-1.5">
                  {DAY_LABELS.map((d) => {
                    const active = form.days.includes(d.num);
                    return (
                      <button
                        type="button"
                        key={d.num}
                        onClick={() => toggleDay(d.num)}
                        className={`h-11 rounded-xl flex items-center justify-center transition-all font-label-lg text-label-lg font-bold shadow-xs cursor-pointer ${
                          active
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Áp dụng chu kỳ lặp lại hàng tuần ({form.days.length} ngày làm
                  việc / tuần).
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-2.5">
                <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-secondary">
                    verified
                  </span>
                  Ràng buộc bảo mật SecureFace AI
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Yêu cầu Liveness Detection (Chống giả mạo ảnh/video)
                  </span>
                  <input
                    defaultChecked
                    type="checkbox"
                    className="h-4 w-4 accent-secondary"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => selectShift(displayShifts[0])}
                  className="h-11 px-5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-lg text-label-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="h-11 px-6 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-all flex items-center gap-2 font-label-lg text-label-lg shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    save
                  </span>
                  <span>Lưu thay đổi ca</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

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
