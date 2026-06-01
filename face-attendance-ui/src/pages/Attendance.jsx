import { useEffect, useState } from "react";
import { getAttendance } from "../api";

const today = new Date().toISOString().slice(0, 10);
const fmt = (dt) => dt ? new Date(dt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "—";

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ date_from: today, date_to: today });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAttendance(filters);
      setRecords(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = records.filter((r) =>
    !search || r.user_name?.toLowerCase().includes(search.toLowerCase()) || r.user_code?.includes(search)
  );

  const checkedIn  = records.filter((r) => r.check_in).length;
  const checkedOut = records.filter((r) => r.check_out).length;
  const pending    = checkedIn - checkedOut;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Lịch sử điểm danh</h1>

      {/* Thống kê */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Đã vào",    value: checkedIn,  color: "border-l-green-500" },
          { label: "Đã ra",     value: checkedOut, color: "border-l-blue-500"  },
          { label: "Chưa ra",   value: pending,    color: "border-l-orange-400"},
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-xl p-4 border-l-4 ${s.color} shadow-sm`}>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Bộ lọc */}
      <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Từ ngày</label>
          <input type="date" value={filters.date_from}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Đến ngày</label>
          <input type="date" value={filters.date_to}
            onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div className="flex-1 min-w-40">
          <label className="text-xs text-gray-500 block mb-1">Tìm kiếm</label>
          <input placeholder="Tên hoặc mã số..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <button onClick={load}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
          Lọc
        </button>
      </div>

      {/* Bảng */}
      <div className="bg-white rounded-xl shadow-sm border overflow-auto">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Đang tải...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Ngày", "Mã số", "Họ tên", "Giờ vào", "Giờ ra", "Trạng thái"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-gray-600">{r.date}</td>
                  <td className="px-4 py-3 font-mono text-gray-500 text-xs">{r.user_code}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{r.user_name}</td>
                  <td className="px-4 py-3">
                    {r.check_in ? (
                      <span className="text-green-700 font-medium">{fmt(r.check_in)}</span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {r.check_out ? (
                      <span className="text-blue-700 font-medium">{fmt(r.check_out)}</span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {r.check_out ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">Đã ra</span>
                    ) : r.check_in ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">Đang trong</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Vắng</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
