import { NavLink, useNavigate, useLocation } from "react-router-dom";
import Icon from "./Icon";

const NAV = [
  { to: "/", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/users", label: "Nhân viên", icon: "badge" },
  { to: "/stream", label: "Giám sát", icon: "videocam" },
  { to: "/reports", label: "Báo cáo", icon: "assessment" },
];

const TITLES = {
  "/": "System Monitor",
  "/users": "Employee Directory",
  "/stream": "Live Recognition",
  "/reports": "Attendance Reports",
};

export default function Layout({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const title = TITLES[pathname] || "SecureFace AI";

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <aside className="w-[280px] h-screen fixed left-0 top-0 bg-surface-container-lowest border-r border-outline-variant shadow-sm flex flex-col py-6 px-4 z-50">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center">
            <Icon name="face" className="text-secondary-container text-2xl" filled />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-primary leading-tight">SecureFace AI</h1>
            <p className="text-on-surface-variant text-xs uppercase tracking-wider">Điểm danh khuôn mặt</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm ${
                  isActive
                    ? "bg-secondary-container text-on-secondary-container font-bold shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon name={n.icon} filled={isActive} />
                  <span>{n.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-1 border-t border-outline-variant pt-4">
          <button
            type="button"
            onClick={() => navigate("/users")}
            className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3 px-4 rounded-lg font-bold mb-4 hover:opacity-90 transition-opacity"
          >
            <Icon name="person_add" />
            Đăng ký khuôn mặt
          </button>
        </div>
      </aside>

      <header className="h-16 w-[calc(100%-280px)] ml-[280px] sticky top-0 z-40 bg-surface border-b border-surface-variant flex justify-between items-center px-8">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-primary">{title}</h2>
          <div className="h-4 w-px bg-outline-variant mx-2" />
          <div className="flex items-center gap-2 bg-tertiary-fixed-dim/10 text-on-tertiary-container px-3 py-1 rounded-full border border-tertiary-fixed-dim/20">
            <Icon name="check_circle" className="text-base" filled />
            <span className="text-xs uppercase tracking-wider font-medium">Hệ thống hoạt động</span>
          </div>
        </div>
        <div className="flex items-center gap-3 border-l border-outline-variant pl-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-primary">Admin</p>
            <p className="text-xs text-on-surface-variant">Quản trị viên</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-secondary-container/30 border-2 border-secondary-container flex items-center justify-center">
            <Icon name="shield_person" className="text-secondary" />
          </div>
        </div>
      </header>

      <main className="ml-[280px] p-8 min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  );
}
