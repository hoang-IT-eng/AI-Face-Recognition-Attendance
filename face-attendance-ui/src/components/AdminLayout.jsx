import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getAlertStats, getMe } from "../api";
import { useBackendStatus } from "../backendStatus";
import Icon from "./Icon";
import BrandMark from "./BrandMark";

const NAV_BASE = [
  { to: "/dashboard", icon: "dashboard", label: "Dashboard", end: true },
  { to: "/employees", icon: "badge", label: "Nhân viên" },
  { to: "/monitoring", icon: "videocam", label: "Giám sát" },
  { to: "/schedules", icon: "schedule", label: "Ca làm việc" },
  { to: "/edit-attendance", icon: "edit_calendar", label: "Sửa công" },
  { to: "/backup-attendance", icon: "pin", label: "Điểm danh thay thế" },
  { to: "/reports", icon: "description", label: "Báo cáo" },
  { to: "/alerts", icon: "notifications_active", label: "Cảnh báo" },
  { to: "/privacy-settings", icon: "shield_person", label: "Cài đặt quyền riêng tư" },
  { to: "/kiosk", icon: "camera_indoor", label: "Kiosk Camera", tour: "nav-kiosk" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const backendStatus = useBackendStatus();
  const [alertBadge, setAlertBadge] = useState(0);
  const [adminName, setAdminName] = useState(
    () => localStorage.getItem("sf_admin_name") || "Admin"
  );

  useEffect(() => {
    const load = () =>
      getAlertStats()
        .then((r) => setAlertBadge(r.data?.unresolved_high || 0))
        .catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem("sf_admin_name");
    if (cached) setAdminName(cached);
    getMe()
      .then((r) => {
        const name = r.data?.name || r.data?.email;
        if (name) {
          setAdminName(name);
          localStorage.setItem("sf_admin_name", name);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("sf_admin_token");
    localStorage.removeItem("sf_admin_auth");
    localStorage.removeItem("sf_admin_name");
    navigate("/login");
  };

  const NAV_ITEMS = NAV_BASE.map((item) =>
    item.to === "/alerts" && alertBadge > 0
      ? { ...item, badge: alertBadge }
      : item
  );

  const initials =
    adminName
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "AD";

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased">
      {/* Sidebar 280px */}
      <aside className="fixed left-0 top-0 h-screen w-[280px] bg-surface-container-lowest border-r border-outline-variant z-50 flex flex-col justify-between py-5 px-4 select-none">
        <div className="flex flex-col gap-6 overflow-y-auto">
          <div
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-3 px-2 cursor-pointer group"
          >
            <BrandMark size={36} />
            <div className="flex flex-col leading-tight">
              <span className="font-title-lg text-title-lg text-on-surface tracking-tight font-bold group-hover:text-primary transition-colors">
                FaceAttend
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant">
                Điểm danh khuôn mặt
              </span>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                data-tour={item.tour}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors font-label-lg text-label-lg ${
                    isActive
                      ? "bg-surface-container text-primary font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon name={item.icon} className="text-[20px]" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-error text-on-error text-[11px] font-bold">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-surface-container flex flex-col gap-2">
          <button
            onClick={() => navigate("/register-face")}
            data-tour="nav-register-face"
            className="w-full h-11 bg-primary text-on-primary rounded-xl flex items-center justify-center gap-2 hover:bg-primary-container transition-all font-label-lg text-label-lg active:scale-[0.98] shadow-sm cursor-pointer"
          >
            <Icon name="face" className="text-[20px]" />
            <span>Đăng ký khuôn mặt</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full h-9 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-xl flex items-center justify-center gap-1.5 font-label-md text-label-md transition-colors cursor-pointer"
          >
            <Icon name="logout" className="text-[16px]" />
            <span>Đăng xuất phiên quản trị</span>
          </button>
        </div>
      </aside>

      {/* Main Frame */}
      <div className="pl-[280px]">
        <header className="fixed top-0 left-[280px] right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant z-40 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandMark size={26} />
            <div className="h-4 w-[1px] bg-outline-variant"></div>
            <span className="font-label-lg text-label-lg text-on-surface-variant">
              Hệ thống quản trị điểm danh
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/40 font-label-md text-label-md"
              title={
                backendStatus === "real"
                  ? "Máy chủ AI (DeepFace) đang hoạt động — mọi thao tác là thật"
                  : "Máy chủ AI đang khởi động — giao diện chạy chế độ mô phỏng, dữ liệu sẽ tự đồng bộ khi AI sẵn sàng"
              }
            >
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  backendStatus === "real"
                    ? "bg-emerald-500"
                    : "bg-amber-500 animate-pulse"
                }`}
              ></span>
              <span className="text-on-surface-variant">
                {backendStatus === "real"
                  ? "AI thật · đã kết nối"
                  : backendStatus === "sim"
                    ? "Mô phỏng · đang chờ AI"
                    : "Đang kiểm tra AI…"}
              </span>
            </div>

            <button
              onClick={() => window.dispatchEvent(new CustomEvent("sf-tour-start"))}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary text-on-primary hover:bg-primary-container transition-colors font-label-md text-label-md font-semibold shadow-sm cursor-pointer"
            >
              <Icon name="play_circle" className="text-[16px]" />
              <span>Hướng dẫn demo</span>
            </button>

            <div className="relative flex items-center justify-center">
              <button
                onClick={() => navigate("/alerts")}
                title="Cảnh báo an ninh"
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors relative cursor-pointer"
              >
                <Icon name="notifications" className="text-[22px]" />
                {alertBadge > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full ring-2 ring-surface-container-lowest"></span>
                )}
              </button>
            </div>

            <div className="h-6 w-[1px] bg-outline-variant"></div>

            <div className="flex items-center gap-3 pl-1">
              <div
                className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center font-label-md text-label-md font-bold ring-1 ring-outline-variant"
                title={adminName}
              >
                {initials}
              </div>
              <div className="flex flex-col text-left">
                <span className="font-label-lg text-label-lg text-on-surface leading-tight">
                  {adminName}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Quản trị viên
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="w-full pt-16 bg-background p-8 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
