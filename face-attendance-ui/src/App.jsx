import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Camera from "./pages/Camera";
import Attendance from "./pages/Attendance";

const nav = [
  { to: "/",           icon: "▦",  label: "Dashboard" },
  { to: "/users",      icon: "👤", label: "Người dùng" },
  { to: "/camera",     icon: "📸", label: "Điểm danh" },
  { to: "/attendance", icon: "📋", label: "Lịch sử" },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r flex flex-col py-6 px-4 fixed h-full shadow-sm">
          <div className="mb-8 px-2">
            <p className="font-bold text-lg text-gray-900">Face Attendance</p>
            <p className="text-xs text-gray-400">Hệ thống điểm danh</p>
          </div>
          <nav className="flex-1 space-y-1">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`
                }>
                <span>{n.icon}</span>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t pt-4 mt-4">
            <p className="text-xs text-gray-400 px-2">v1.0.0</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="ml-56 flex-1 p-6 min-h-screen">
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/users"      element={<Users />} />
            <Route path="/camera"     element={<Camera />} />
            <Route path="/attendance" element={<Attendance />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
