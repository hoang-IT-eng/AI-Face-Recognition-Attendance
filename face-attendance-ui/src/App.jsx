import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Users from "./pages/Users";
import Camera from "./pages/Camera";
import Attendance from "./pages/Attendance";

const nav = [
  { to: "/", label: "👤 Người dùng" },
  { to: "/camera", label: "📸 Điểm danh" },
  { to: "/attendance", label: "📋 Lịch sử" },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-blue-700 text-white px-6 py-3 flex gap-6 items-center shadow">
          <span className="font-bold text-lg mr-4">Face Attendance</span>
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                `px-3 py-1 rounded transition ${isActive ? "bg-white text-blue-700 font-semibold" : "hover:bg-blue-600"}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <main className="p-6 max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<Users />} />
            <Route path="/camera" element={<Camera />} />
            <Route path="/attendance" element={<Attendance />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
