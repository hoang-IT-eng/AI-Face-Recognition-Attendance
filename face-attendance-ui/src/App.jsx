import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Stream from "./pages/Stream";
import Register from "./pages/Register";

const nav = [
  { to: "/",         label: "Giám sát" },
  { to: "/register", label: "Đăng ký" },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0f1117] text-white flex flex-col">
        <header className="border-b border-white/10 px-8 py-4 flex items-center gap-8">
          <span className="font-semibold text-white tracking-wide text-sm">HỆ THỐNG ĐIỂM DANH</span>
          <nav className="flex gap-1">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === "/"}
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-md text-sm transition ${
                    isActive ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"
                  }`
                }>
                {n.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/"         element={<Stream />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
