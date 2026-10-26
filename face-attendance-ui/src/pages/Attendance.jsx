import { useEffect, useState } from "react";
import {
  Download,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  deleteAttendance,
  exportExcel,
  getAttendance,
  getSchedules,
  getUsers,
  manualAttendance,
  updateAttendance,
} from "../api";
import StatusBadge from "../components/StatusBadge";

const todayStr = () => new Date().toISOString().slice(0, 10);

const fmtTime = (dt) =>
  dt
    ? new Date(dt).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    : "—";

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    date_from: todayStr(),
    date_to: todayStr(),
    group: "",
    status: "",
  });
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  // Modal ghi công bổ sung
  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    user_id: "",
    date: todayStr(),
    schedule_id: "",
    status: "present",
    note: "",
  });

  // Modal sửa bản ghi công
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    status: "present",
    check_in_time: "",
    check_out_time: "",
    note: "",
  });

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        group: filters.group || undefined,
        status: filters.status || undefined,
      };
      const [attRes, usrRes, schRes] = await Promise.all([
        getAttendance(params),
        getUsers(),
        getSchedules().catch(() => ({ data: [] })),
      ]);
      setRecords(attRes.data || []);
      const uList = usrRes.data || [];
      setUsers(uList);
      setSchedules(schRes.data || []);
      if (uList.length > 0 && !manualForm.user_id) {
        setManualForm((prev) => ({ ...prev, user_id: String(uList[0].id) }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExport = async () => {
    try {
      const res = await exportExcel({
        date_from: filters.date_from,
        date_to: filters.date_to,
        group: filters.group || undefined,
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bang_cong_${filters.date_from}_${filters.date_to}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showNotice("Không thể xuất file Excel. Kiểm tra lại kết nối backend.");
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.user_id) return;
    try {
      await manualAttendance({
        user_id: Number(manualForm.user_id),
        date: manualForm.date,
        schedule_id: manualForm.schedule_id
          ? Number(manualForm.schedule_id)
          : null,
        status: manualForm.status,
        note: manualForm.note || "Ghi công bổ sung bởi nhân sự",
      });
      setManualOpen(false);
      showNotice("Đã lưu bản ghi công bổ sung.");
      loadData();
    } catch (err) {
      showNotice(
        err.response?.data?.detail || "Không thể ghi công bổ sung."
      );
    }
  };

  const openEditModal = (rec) => {
    setEditingRecord(rec);
    const toHHMM = (iso) =>
      iso
        ? new Date(iso).toTimeString().slice(0, 5)
        : "";
    setEditForm({
      status: rec.status || "present",
      check_in_time: toHHMM(rec.check_in),
      check_out_time: toHHMM(rec.check_out),
      note: rec.note || "",
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingRecord) return;
    const buildIso = (dateStr, hhmm) => {
      if (!hhmm) return null;
      return new Date(`${dateStr}T${hhmm}:00`).toISOString();
    };
    try {
      await updateAttendance(editingRecord.id, {
        status: editForm.status,
        check_in: buildIso(editingRecord.date, editForm.check_in_time),
        check_out: buildIso(editingRecord.date, editForm.check_out_time),
        note: editForm.note,
      });
      setEditingRecord(null);
      showNotice("Đã cập nhật bản ghi chấm công.");
      loadData();
    } catch (err) {
      showNotice(
        err.response?.data?.detail || "Không thể cập nhật bản ghi công."
      );
    }
  };

  const handleDelete = async (rec) => {
    if (
      !confirm(
        `Xóa bản ghi chấm công ngày ${rec.date} của ${rec.user_name || "nhân sự"}?`
      )
    )
      return;
    try {
      await deleteAttendance(rec.id);
      showNotice("Đã xóa bản ghi chấm công.");
      loadData();
    } catch {
      showNotice("Không thể xóa bản ghi.");
    }
  };

  const groups = Array.from(
    new Set(users.map((u) => u.group).filter(Boolean))
  );

  const filtered = records.filter(
    (r) =>
      !search ||
      r.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.user_code?.toLowerCase().includes(search.toLowerCase())
  );

  const checkedInCount = filtered.filter((r) => r.check_in).length;
  const checkedOutCount = filtered.filter((r) => r.check_out).length;
  const manualCount = filtered.filter((r) => r.is_manual).length;

  return (
    <div className="space-y-6">
      {/* Tiêu đề & nút thao tác */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">
            Bảng công &amp; điều chỉnh giờ công
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Tra cứu lịch sử vào/ra, ghi công bổ sung và xuất bảng công Excel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tóm tắt gọn trên thanh */}
          <div className="flex items-center divide-x divide-line border border-line bg-surface rounded px-1 py-1.5 text-xs">
            <div className="px-2.5">
              <span className="text-muted">Đã vào: </span>
              <span className="num-mono font-semibold text-ink">
                {checkedInCount}
              </span>
            </div>
            <div className="px-2.5">
              <span className="text-muted">Đã ra: </span>
              <span className="num-mono font-semibold text-ink">
                {checkedOutCount}
              </span>
            </div>
            <div className="px-2.5">
              <span className="text-muted">Ghi thủ công: </span>
              <span className="num-mono font-semibold text-ink">
                {manualCount}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setManualOpen(true)}
            className="px-3.5 py-2 rounded bg-accent hover:bg-accent/90 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ghi công bổ sung</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="px-3.5 py-2 rounded bg-ink hover:bg-ink/90 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="px-4 py-2.5 rounded border border-ok/30 bg-ok-bg text-ok text-xs font-medium flex items-center justify-between">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            className="cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Bộ lọc */}
      <div className="bg-surface border border-line rounded p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">
            Từ ngày
          </label>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) =>
              setFilters({ ...filters, date_from: e.target.value })
            }
            className="w-full h-9 px-2.5 rounded border border-line num-mono text-xs text-ink focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1">
            Đến ngày
          </label>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) =>
              setFilters({ ...filters, date_to: e.target.value })
            }
            className="w-full h-9 px-2.5 rounded border border-line num-mono text-xs text-ink focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1">
            Phòng ban
          </label>
          <select
            value={filters.group}
            onChange={(e) => setFilters({ ...filters, group: e.target.value })}
            className="w-full h-9 px-2.5 rounded border border-line bg-surface text-xs text-ink focus:outline-none focus:border-accent"
          >
            <option value="">Tất cả phòng ban</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1">
            Trạng thái
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full h-9 px-2.5 rounded border border-line bg-surface text-xs text-ink focus:outline-none focus:border-accent"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="present">Đúng giờ</option>
            <option value="late">Đi muộn</option>
            <option value="early_leave">Về sớm</option>
            <option value="absent">Vắng mặt</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1">
            Tìm nhân sự
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tên hoặc mã NV..."
              className="w-full h-9 pl-8 pr-2.5 rounded border border-line text-xs text-ink focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="h-9 px-4 rounded bg-ink hover:bg-ink/90 text-white text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Áp dụng lọc</span>
        </button>
      </div>

      {/* Bảng sổ công */}
      <div className="bg-surface border border-line rounded overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted">
            Đang tải dữ liệu bảng công...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-subtle text-xs text-muted font-medium">
                  <th className="py-3 px-4">Ngày</th>
                  <th className="py-3 px-4">Mã NV</th>
                  <th className="py-3 px-4">Họ và tên</th>
                  <th className="py-3 px-4">Phòng ban</th>
                  <th className="py-3 px-4">Giờ vào</th>
                  <th className="py-3 px-4">Giờ ra</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Nguồn / Ghi chú</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-12 px-4 text-center text-xs text-muted"
                    >
                      Không có bản ghi chấm công nào trong khoảng thời gian đã
                      chọn.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const u = users.find((x) => x.id === r.user_id);
                    return (
                      <tr key={r.id} className="hover:bg-surface-subtle">
                        <td className="py-3 px-4 num-mono text-xs text-ink">
                          {r.date}
                        </td>
                        <td className="py-3 px-4 num-mono text-xs font-semibold text-ink">
                          {r.user_code || u?.code || "—"}
                        </td>
                        <td className="py-3 px-4 font-medium text-ink">
                          {r.user_name || u?.name || "—"}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted">
                          {u?.group || "—"}
                        </td>
                        <td className="py-3 px-4 num-mono text-xs text-ink">
                          {fmtTime(r.check_in)}
                        </td>
                        <td className="py-3 px-4 num-mono text-xs text-muted">
                          {fmtTime(r.check_out)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="py-3 px-4 text-xs text-muted max-w-[220px] truncate">
                          {r.is_manual ? (
                            <span className="text-ink font-medium">
                              Thủ công
                            </span>
                          ) : (
                            <span>Camera cổng</span>
                          )}
                          {r.note ? ` — ${r.note}` : ""}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(r)}
                              className="px-2.5 py-1 rounded border border-line bg-surface hover:bg-canvas text-ink text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Pencil className="w-3 h-3 text-muted" />
                              <span>Sửa giờ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(r)}
                              className="px-2 py-1 rounded border border-line bg-surface hover:bg-danger-bg hover:text-danger text-muted text-xs inline-flex items-center cursor-pointer"
                              title="Xóa bản ghi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Ghi công bổ sung */}
      {manualOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded w-full max-w-md overflow-hidden">
            <div className="px-5 py-3.5 border-b border-line bg-surface-subtle flex items-center justify-between">
              <h3 className="font-semibold text-sm text-ink">
                Ghi công bổ sung thủ công
              </h3>
              <button
                type="button"
                onClick={() => setManualOpen(false)}
                className="text-muted hover:text-ink cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Nhân sự *
                </label>
                <select
                  required
                  value={manualForm.user_id}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, user_id: e.target.value })
                  }
                  className="w-full h-9 px-3 rounded border border-line bg-surface text-xs text-ink focus:outline-none focus:border-accent"
                >
                  <option value="">-- Chọn nhân sự --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.code} — {u.name} ({u.group || "Chưa phân phòng"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    Ngày chấm công *
                  </label>
                  <input
                    type="date"
                    required
                    value={manualForm.date}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, date: e.target.value })
                    }
                    className="w-full h-9 px-3 rounded border border-line num-mono text-xs text-ink focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    Trạng thái công *
                  </label>
                  <select
                    value={manualForm.status}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, status: e.target.value })
                    }
                    className="w-full h-9 px-3 rounded border border-line bg-surface text-xs text-ink focus:outline-none focus:border-accent"
                  >
                    <option value="present">Đúng giờ</option>
                    <option value="late">Đi muộn</option>
                    <option value="early_leave">Về sớm</option>
                    <option value="absent">Vắng mặt</option>
                  </select>
                </div>
              </div>

              {schedules.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    Ca làm việc (tùy chọn)
                  </label>
                  <select
                    value={manualForm.schedule_id}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        schedule_id: e.target.value,
                      })
                    }
                    className="w-full h-9 px-3 rounded border border-line bg-surface text-xs text-ink focus:outline-none focus:border-accent"
                  >
                    <option value="">-- Mặc định --</option>
                    {schedules.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.start_time} - {s.end_time})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Lý do / ghi chú giải trình
                </label>
                <textarea
                  rows={2}
                  value={manualForm.note}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, note: e.target.value })
                  }
                  placeholder="Ví dụ: Đi gặp khách hàng buổi sáng, quên chấm công..."
                  className="w-full p-2.5 rounded border border-line text-xs text-ink focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManualOpen(false)}
                  className="px-3.5 py-2 rounded border border-line text-xs font-medium text-ink hover:bg-canvas cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-accent hover:bg-accent/90 text-white text-xs font-medium cursor-pointer"
                >
                  Lưu bản ghi công
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sửa bản ghi công */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded w-full max-w-md overflow-hidden">
            <div className="px-5 py-3.5 border-b border-line bg-surface-subtle flex items-center justify-between">
              <h3 className="font-semibold text-sm text-ink">
                Sửa giờ công — {editingRecord.user_name} (
                <span className="num-mono">{editingRecord.date}</span>)
              </h3>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="text-muted hover:text-ink cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    Giờ vào
                  </label>
                  <input
                    type="time"
                    value={editForm.check_in_time}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        check_in_time: e.target.value,
                      })
                    }
                    className="w-full h-9 px-3 rounded border border-line num-mono text-xs text-ink focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    Giờ ra
                  </label>
                  <input
                    type="time"
                    value={editForm.check_out_time}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        check_out_time: e.target.value,
                      })
                    }
                    className="w-full h-9 px-3 rounded border border-line num-mono text-xs text-ink focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Trạng thái công
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
                  }
                  className="w-full h-9 px-3 rounded border border-line bg-surface text-xs text-ink focus:outline-none focus:border-accent"
                >
                  <option value="present">Đúng giờ</option>
                  <option value="late">Đi muộn</option>
                  <option value="early_leave">Về sớm</option>
                  <option value="absent">Vắng mặt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Ghi chú điều chỉnh
                </label>
                <textarea
                  rows={2}
                  value={editForm.note}
                  onChange={(e) =>
                    setEditForm({ ...editForm, note: e.target.value })
                  }
                  className="w-full p-2.5 rounded border border-line text-xs text-ink focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-3.5 py-2 rounded border border-line text-xs font-medium text-ink hover:bg-canvas cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-accent hover:bg-accent/90 text-white text-xs font-medium cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
