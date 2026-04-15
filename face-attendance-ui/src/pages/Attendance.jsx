import { useEffect, useState } from "react";
import { getAttendance, updateAttendance, exportExcel } from "../api";

const STATUS_LABEL = {
  present: "✅ Có mặt",
  absent: "❌ Vắng",
  late: "⏰ Trễ",
  early_leave: "🚶 Về sớm",
};

const STATUS_COLOR = {
  present: "bg-green-100 text-green-700",
  absent: "bg-red-100 text-red-600",
  late: "bg-yellow-100 text-yellow-700",
  early_leave: "bg-orange-100 text-orange-700",
};

const today = new Date().toISOString().slice(0, 10);

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ date_from: today, date_to: today, status: "" });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const res = await getAttendance(params);
      setRecords(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleExport = async () => {
    const params = { date_from: filters.date_from, date_to: filters.date_to };
    const res = await exportExcel(params);
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diemdanh_${filters.date_from}_${filters.date_to}.xlsx`;
    a.click();
  };

  const handleStatusChange = async (id, status) => {
    await updateAttendance(id, { status });
    load();
  };

  const fmt = (dt) => dt ? new Date(dt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">📋 Lịch sử điểm danh</h1>

      {/* Bộ lọc */}
      <div className="bg-white rounded-xl shadow p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Từ ngày</label>
          <input type="date" value={filters.date_from}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            className="border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Đến ngày</label>
          <input type="date" value={filters.date_to}
            onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            className="border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Trạng thái</label>
          <select value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border rounded px-3 py-2 text-sm">
            <option value="">Tất cả</option>
            <option value="present">Có mặt</option>
            <option value="absent">Vắng</option>
            <option value="late">Trễ</option>
            <option value="early_leave">Về sớm</option>
          </select>
        </div>
        <button onClick={load} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
          🔍 Lọc
        </button>
        <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 ml-auto">
          📥 Xuất Excel
        </button>
      </div>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {Object.entries(STATUS_LABEL).map(([k, label]) => (
          <div key={k} className={`rounded-lg p-3 text-center ${STATUS_COLOR[k]}`}>
            <p className="text-2xl font-bold">{records.filter((r) => r.status === k).length}</p>
            <p className="text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Bảng */}
      <div className="bg-white rounded-xl shadow overflow-auto">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Đang tải...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                {["Ngày","Mã số","Họ tên","Giờ vào","Giờ ra","Trạng thái","Thủ công","Sửa"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{r.date}</td>
                  <td className="px-4 py-2 font-mono">{r.user_code}</td>
                  <td className="px-4 py-2">{r.user_name}</td>
                  <td className="px-4 py-2">{fmt(r.check_in)}</td>
                  <td className="px-4 py-2">{fmt(r.check_out)}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">{r.is_manual ? "✓" : ""}</td>
                  <td className="px-4 py-2">
                    <select
                      value={r.status}
                      onChange={(e) => handleStatusChange(r.id, e.target.value)}
                      className="border rounded px-2 py-1 text-xs"
                    >
                      <option value="present">Có mặt</option>
                      <option value="absent">Vắng</option>
                      <option value="late">Trễ</option>
                      <option value="early_leave">Về sớm</option>
                    </select>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
