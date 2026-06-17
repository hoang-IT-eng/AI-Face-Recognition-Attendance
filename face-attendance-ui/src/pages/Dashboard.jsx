import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getTodayAttendance, getAttendance, getUsers, exportExcel } from "../api";
import Icon from "../components/Icon";

const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function KpiCard({ label, value, sub, icon, accent = "primary", progress }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Icon name={icon} className="text-[64px]" />
      </div>
      <p className="text-xs font-medium text-on-surface-variant uppercase mb-2 tracking-wide">{label}</p>
      <div className="flex items-end gap-3">
        <span className={`text-[32px] font-bold ${accent === "error" ? "text-error" : "text-primary"}`}>{value}</span>
        {sub && <span className="text-xs text-on-surface-variant mb-2">{sub}</span>}
      </div>
      {progress != null && (
        <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-4">
          <div className="bg-secondary h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [todayRecords, setTodayRecords] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [weekData, setWeekData] = useState([]);
  const [clock, setClock] = useState(new Date());

  const load = async () => {
    const [todayRes, usersRes] = await Promise.all([getTodayAttendance(), getUsers()]);
    setTodayRecords(todayRes.data);
    setTotalUsers(usersRes.data.length);

    const today = new Date();
    const promises = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dateStr = d.toISOString().slice(0, 10);
      return getAttendance({ date_from: dateStr, date_to: dateStr }).then((r) => ({
        day: DAYS[d.getDay()],
        present: r.data.filter((x) => x.status === "present" || x.status === "late").length,
        absent: r.data.filter((x) => x.status === "absent").length,
      }));
    });
    setWeekData(await Promise.all(promises));
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    const c = setInterval(() => setClock(new Date()), 1000);
    return () => { clearInterval(t); clearInterval(c); };
  }, []);

  const present = todayRecords.filter((r) => r.status === "present" || r.status === "late").length;
  const late = todayRecords.filter((r) => r.status === "late").length;
  const absent = todayRecords.filter((r) => r.status === "absent").length;
  const recent = [...todayRecords]
    .sort((a, b) => new Date(b.check_in || 0) - new Date(a.check_in || 0))
    .slice(0, 8);

  const handleExport = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await exportExcel({ date_from: today, date_to: today });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diemdanh_${today}.xlsx`;
    a.click();
  };

  const fmt = (dt) =>
    dt ? new Date(dt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";

  const pct = totalUsers > 0 ? Math.round((present / totalUsers) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">Xin chào, Admin</h1>
          <p className="text-on-surface-variant flex items-center gap-2 text-sm flex-wrap">
            <Icon name="calendar_today" className="text-base" />
            {clock.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            <span className="mx-1">•</span>
            <Icon name="schedule" className="text-base" />
            {clock.toLocaleTimeString("vi-VN")}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/stream")}
            className="flex items-center gap-2 bg-secondary text-on-secondary px-6 py-2.5 rounded-lg font-bold shadow-sm hover:opacity-90 transition-all"
          >
            <Icon name="videocam" />
            Bắt đầu giám sát
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 bg-surface-container-highest text-primary px-6 py-2.5 rounded-lg font-bold border border-outline-variant hover:bg-surface-container-high transition-all"
          >
            <Icon name="download" />
            Xuất báo cáo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard label="Tổng nhân viên" value={totalUsers} icon="groups" />
        <KpiCard
          label="Có mặt hôm nay"
          value={present}
          sub={`/ ${totalUsers}`}
          icon="how_to_reg"
          progress={pct}
        />
        <KpiCard
          label="Trễ / Vắng"
          value={late + absent}
          icon="person_off"
          accent="error"
        />
        <KpiCard
          label="Tỉ lệ có mặt"
          value={`${pct}%`}
          icon="analytics"
          sub={streamingLabel(present, totalUsers)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-outline-variant flex justify-between items-center">
            <h3 className="font-semibold text-primary flex items-center gap-2 text-lg">
              <Icon name="history" />
              Hoạt động gần đây
            </h3>
            <Link to="/reports" className="text-secondary font-bold text-sm hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  {["Nhân viên", "Thời gian", "Trạng thái"].map((h) => (
                    <th key={h} className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-on-surface-variant">
                      Chưa có dữ liệu hôm nay
                    </td>
                  </tr>
                ) : (
                  recent.map((r, i) => (
                    <tr key={i} className="hover:bg-secondary-container/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                            <span className="text-on-primary-container font-bold text-sm">
                              {r.user_name?.[0] || "?"}
                            </span>
                            <div className="tracking-corner tracking-tl" />
                            <div className="tracking-corner tracking-tr" />
                            <div className="tracking-corner tracking-bl" />
                            <div className="tracking-corner tracking-br" />
                          </div>
                          <div>
                            <p className="font-bold text-primary">{r.user_name || "Unknown"}</p>
                            <p className="text-xs text-on-surface-variant font-mono">{r.user_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-on-surface">{fmt(r.check_in)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-primary mb-1 flex items-center gap-2">
            <Icon name="show_chart" />
            Xu hướng 7 ngày
          </h3>
          <p className="text-xs text-on-surface-variant mb-4">Có mặt / Vắng</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weekData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#57dffe" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#57dffe" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="present" stroke="#00687a" fill="url(#gPresent)" strokeWidth={2} name="Có mặt" />
              <Area type="monotone" dataKey="absent" stroke="#ba1a1a" fill="none" strokeWidth={2} strokeDasharray="4 2" name="Vắng" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    present: "bg-emerald-50 text-emerald-700 border-emerald-100",
    late: "bg-amber-50 text-amber-700 border-amber-100",
    absent: "bg-red-50 text-red-700 border-red-100",
  };
  const label = { present: "CÓ MẶT", late: "TRỄ", absent: "VẮNG" };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${map[status] || map.absent}`}>
      {label[status] || status?.toUpperCase()}
    </span>
  );
}

function streamingLabel(present, total) {
  if (total === 0) return "Chưa có nhân viên";
  return `${present} / ${total} đã điểm danh`;
}
