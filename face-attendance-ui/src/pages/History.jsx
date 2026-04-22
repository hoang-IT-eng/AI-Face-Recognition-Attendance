import { useEffect, useState } from "react";
import { getAttendance } from "../api";

const today = new Date().toISOString().slice(0, 10);
const fmt = (dt) => dt ? new Date(dt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "—";

export default function History() {
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ date_from: today, date_to: today });
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setRecords((await getAttendance(filters)).data); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = records.filter((r) =>
    !search || r.user_name?.toLowerCase().includes(search.toLowerCase()) || r.user_code?.includes(search)
  );

  const checkedIn  = records.filter((r) => r.check_in).length;
  const checkedOut = records.filter((r) => r.check_out).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Lịch sử điểm danh</h1>
        <p className="text-white/40 text-sm mt-0.5">Xem lịch sử vào ra theo ngày</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Đã vào",  value: checkedIn,              color: "text-green-400" },
          { label: "Đã ra",   value: checkedOut,             color: "text-blue-400"  },
          { label: "Chưa ra", value: checkedIn - checkedOut, color: "text-orange-400"},
        ].map((s) => (
          <div key={s.label} className="bg-white/3 border border-white/8 rounded-2xl p-4">
            <p className="text-xs text-white/40 uppercase tracking-wide">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-4 flex flex-wrap gap-3 items-end">
        {[["date_from","Từ ngày"],["date_to","Đến ngày"]].map(([k, label]) => (
          <div key={k}>
            <label className="text-xs text-white/40 block mb-1">{label}</label>
            <input type="date" value={filters[k]}
              onChange={(e) => setFilters({ ...filters, [k]: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50" />
          </div>
        ))}
        <div className="flex-1 min-w-40">
          <label className="text-xs text-white/40 block mb-1">Tìm kiếm</label>
          <input placeholder="Tên hoặc mã số..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-blue-500/50" />
        </div>
        <button onClick={load}
          className="px-5 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm hover:bg-blue-500/30 transition">
          Lọc
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-white/30 text-sm">Đang tải...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-white/8">
              <tr>
                {["Ngày","Mã số","Họ tên","Giờ vào","Giờ ra","Trạng thái"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-white/3 transition">
                  <td className="px-4 py-3 text-white/50 text-xs">{r.date}</td>
                  <td className="px-4 py-3 font-mono text-white/40 text-xs">{r.user_code}</td>
                  <td className="px-4 py-3 text-white/80 font-medium">{r.user_name}</td>
                  <td className="px-4 py-3 text-green-400 font-medium">{fmt(r.check_in)}</td>
                  <td className="px-4 py-3 text-blue-400 font-medium">{fmt(r.check_out)}</td>
                  <td className="px-4 py-3">
                    {r.check_out ? (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400">Đã ra</span>
                    ) : r.check_in ? (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400">Đang trong</span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/30">Vắng</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-white/20 text-sm">Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
