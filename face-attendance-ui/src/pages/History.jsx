import { useEffect, useState } from "react";
import { getAttendance, exportExcel } from "../api";
import Icon from "../components/Icon";

const today = new Date().toISOString().slice(0, 10);
const fmt = (dt) =>
  dt ? new Date(dt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "—";

export default function History() {
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ date_from: today, date_to: today });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setRecords((await getAttendance(filters)).data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = records.filter(
    (r) =>
      !search ||
      r.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.user_code?.includes(search)
  );

  const checkedIn = records.filter((r) => r.check_in).length;
  const checkedOut = records.filter((r) => r.check_out).length;

  const handleExport = async () => {
    const res = await exportExcel(filters);
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diemdanh_${filters.date_from}_${filters.date_to}.xlsx`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">Báo cáo điểm danh</h1>
          <p className="text-on-surface-variant text-sm">Lịch sử vào ra theo khoảng thời gian</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-2 bg-secondary text-on-secondary px-5 py-2.5 rounded-lg font-bold shadow-sm hover:opacity-90 transition"
        >
          <Icon name="download" />
          Xuất Excel
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Đã vào", value: checkedIn, icon: "login", color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Đã ra", value: checkedOut, icon: "logout", color: "text-secondary", bg: "bg-secondary-container/20" },
          { label: "Chưa ra", value: checkedIn - checkedOut, icon: "pending", color: "text-amber-600", bg: "bg-amber-50" },
        ].map((s) => (
          <div key={s.label} className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">{s.label}</p>
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                <Icon name={s.icon} className={`${s.color} text-xl`} />
              </div>
            </div>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-wrap gap-4 items-end shadow-sm">
        {[["date_from", "Từ ngày"], ["date_to", "Đến ngày"]].map(([k, label]) => (
          <div key={k}>
            <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1 block">{label}</label>
            <input
              type="date"
              value={filters[k]}
              onChange={(e) => setFilters({ ...filters, [k]: e.target.value })}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
        ))}
        <div className="flex-1 min-w-48">
          <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1 block">Tìm kiếm</label>
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              placeholder="Tên hoặc mã số..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          className="px-6 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-bold hover:opacity-90 transition flex items-center gap-2"
        >
          <Icon name="filter_list" />
          Lọc
        </button>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-16 text-on-surface-variant flex flex-col items-center gap-2">
            <Icon name="progress_activity" className="text-3xl animate-spin" />
            Đang tải...
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  {["Ngày", "Mã số", "Họ tên", "Giờ vào", "Giờ ra", "Trạng thái"].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-container-low transition">
                    <td className="px-6 py-4 text-on-surface-variant text-xs">{r.date}</td>
                    <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{r.user_code}</td>
                    <td className="px-6 py-4 font-semibold text-primary">{r.user_name}</td>
                    <td className="px-6 py-4 text-emerald-600 font-medium">{fmt(r.check_in)}</td>
                    <td className="px-6 py-4 text-secondary font-medium">{fmt(r.check_out)}</td>
                    <td className="px-6 py-4">
                      {r.check_out ? (
                        <span className="text-xs px-3 py-1 rounded-full bg-secondary-container/20 text-on-secondary-container font-bold">
                          ĐÃ RA
                        </span>
                      ) : r.check_in ? (
                        <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
                          ĐANG TRONG
                        </span>
                      ) : (
                        <span className="text-xs px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-bold">
                          VẮNG
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-on-surface-variant">
                      <Icon name="event_busy" className="text-4xl mb-2 opacity-40 block mx-auto" />
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
