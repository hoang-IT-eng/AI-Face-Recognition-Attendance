import { useEffect, useState, useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getTodayAttendance, getAttendance, getUsers, exportExcel } from "../api";

const API = "http://localhost:8000";

const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function StatCard({ label, value, sub, accent }) {
  const colors = {
    blue:  "border-l-blue-500",
    red:   "border-l-red-500",
    gray:  "border-l-gray-300",
    indigo:"border-l-indigo-500",
  };
  return (
    <div className={`bg-white rounded-xl p-4 border-l-4 ${colors[accent] || colors.gray} shadow-sm`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [todayRecords, setTodayRecords] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [weekData, setWeekData] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const imgRef = useRef(null);

  const load = async () => {
    const [todayRes, usersRes] = await Promise.all([
      getTodayAttendance(),
      getUsers(),
    ]);
    setTodayRecords(todayRes.data);
    setTotalUsers(usersRes.data.length);

    // Lấy dữ liệu 7 ngày gần nhất
    const today = new Date();
    const promises = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dateStr = d.toISOString().slice(0, 10);
      return getAttendance({ date_from: dateStr, date_to: dateStr })
        .then(r => ({
          day: DAYS[d.getDay()],
          present: r.data.filter(x => x.status === "present" || x.status === "late").length,
          absent: r.data.filter(x => x.status === "absent").length,
        }));
    });
    const week = await Promise.all(promises);
    setWeekData(week);
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  const present = todayRecords.filter(r => r.status === "present" || r.status === "late").length;
  const late    = todayRecords.filter(r => r.status === "late").length;
  const absent  = todayRecords.filter(r => r.status === "absent").length;
  const recent  = [...todayRecords].sort((a, b) => new Date(b.check_in || 0) - new Date(a.check_in || 0)).slice(0, 6);

  const startStream = () => {
    if (imgRef.current) imgRef.current.src = `${API}/camera/stream/0?t=${Date.now()}`;
    setStreaming(true);
  };
  const stopStream = () => {
    if (imgRef.current) imgRef.current.src = "";
    setStreaming(false);
  };

  const handleExportCSV = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await exportExcel({ date_from: today, date_to: today });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url; a.download = `diemdanh_${today}.xlsx`; a.click();
  };

  const fmt = (dt) => dt ? new Date(dt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--:--";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tổng quan hệ thống</h1>
          <p className="text-gray-500 mt-1">
            Điểm danh thời gian thực —{" "}
            <span className="text-blue-600 font-medium">
              {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Camera + Chart */}
        <div className="lg:col-span-2 space-y-5">
          {/* Camera stream */}
          <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-lg relative">
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full">
              <span className={`w-2 h-2 rounded-full ${streaming ? "bg-green-400 animate-pulse" : "bg-gray-400"}`} />
              <span className="text-white text-xs font-medium">
                {streaming ? "LIVE RECOGNITION ACTIVE" : "STREAM OFFLINE"}
              </span>
            </div>
            <div className="absolute top-3 right-3 z-10 flex gap-2">
              <button onClick={streaming ? stopStream : startStream}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${streaming ? "bg-red-500 text-white" : "bg-white text-gray-800"}`}>
                {streaming ? "⏹ Stop" : "▶ Start"}
              </button>
            </div>

            <img ref={imgRef} alt="stream" className={`w-full ${streaming ? "block" : "hidden"}`}
              style={{ minHeight: 280 }} onError={() => setStreaming(false)} />
            {!streaming && (
              <div className="flex items-center justify-center text-gray-500 text-sm" style={{ height: 280 }}>
                Nhấn Start để bắt đầu stream nhận diện
              </div>
            )}
          </div>

          {/* Weekly chart */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-1">
              <div>
                <p className="font-semibold text-gray-800">Xu hướng điểm danh tuần</p>
                <p className="text-xs text-gray-400">7 ngày gần nhất</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={weekData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="present" stroke="#3b82f6" fill="url(#gPresent)"
                  strokeWidth={2} name="Có mặt" />
                <Area type="monotone" dataKey="absent" stroke="#f87171" fill="none"
                  strokeWidth={2} strokeDasharray="4 2" name="Vắng" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cột phải: Stats + Recent */}
        <div className="space-y-4">
          {/* Stat cards */}
          <StatCard label="Có mặt hôm nay" value={present}
            sub={`Đã đăng ký: ${totalUsers}`} accent="blue" />
          <StatCard label="Đi trễ" value={late}
            sub="Cần xem xét" accent="red" />
          <StatCard label="Vắng mặt" value={absent}
            sub={`Tổng hôm nay: ${todayRecords.length}`} accent="gray" />
          <StatCard label="Tỉ lệ có mặt" accent="indigo"
            value={totalUsers > 0 ? `${Math.round(present / totalUsers * 100)}%` : "—"}
            sub="So với tổng đăng ký" />

          {/* Recent activity */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <p className="font-semibold text-gray-800">Hoạt động gần đây</p>
            </div>
            <div className="space-y-3">
              {recent.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Chưa có dữ liệu hôm nay</p>
              )}
              {recent.map((r, i) => (
                <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${r.status === "absent" ? "bg-red-50" : "hover:bg-gray-50"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${r.status === "absent" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                    {r.user_name?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${r.status === "absent" ? "text-red-600" : "text-gray-800"}`}>
                      {r.user_name || "Unknown"}
                    </p>
                    <p className={`text-xs truncate ${r.status === "absent" ? "text-red-400" : "text-gray-400"}`}>
                      {r.user_code} • {r.status === "present" ? "Có mặt" : r.status === "late" ? "Trễ" : "Vắng"}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0">{fmt(r.check_in)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
