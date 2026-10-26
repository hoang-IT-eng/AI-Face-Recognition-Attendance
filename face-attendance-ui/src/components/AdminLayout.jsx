import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

const LOGO_URL =
  "https://lh3.googleusercontent.com/aida/AEtjO1Wchkkf-GzfXSzfqGNE7PvXyf_M0Mf2O92GevUbcwBwF3SGgIWf9dQoioPY-g-u0ESQvj9c818DFCKe9OgfiBfYKLcM5vSYK0MiFx23h5Y0HBNcm5rwpASI6k6Y6d9ZW49pxfpMvBPcJXPOjE3bEO6FG3gsoNR6wiuP6ueTQgDynLPfELlzIeqb-lesz4aarNYD6RPX7fWgYkML-YJuRgs42-iPCxMm9YVOEMIsOqTVaKQllpvULqjbtywJ";

const AVATAR_HR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB9qt0XxrJwvaoaxIrN5-_dsJiv9_68psvID5t-E8IuhUqSIm9zoY-dDDXgmRSA4rKc4xyhvcKzwy5aWG5jzt8UgZgkdOCXStobDuQhSlKwrEUMyWlin0D6nslRPnARp4LN4C8h_mkCAEAE_44iw5zZah7oB3DBZp9JO6wHQq2Gc4Ajc_wUl1zP_i1-PcX0tN99lfVei4f3dlrVd6mLOWaamZ5wwuKOAn8kGRD5CkhpejKZ4WJADsen5A";

const NAV_ITEMS = [
  { to: "/", icon: "dashboard", label: "Dashboard", end: true },
  { to: "/employees", icon: "badge", label: "Nhân viên" },
  { to: "/monitoring", icon: "videocam", label: "Giám sát" },
  { to: "/schedules", icon: "schedule", label: "Ca làm việc" },
  { to: "/edit-attendance", icon: "edit_calendar", label: "Sửa công" },
  { to: "/backup-attendance", icon: "pin", label: "Điểm danh thay thế" },
  { to: "/reports", icon: "description", label: "Báo cáo" },
  { to: "/alerts", icon: "notifications_active", label: "Cảnh báo", badge: 3 },
  { to: "/privacy-settings", icon: "shield_person", label: "Cài đặt quyền riêng tư" },
  { to: "/kiosk", icon: "camera_indoor", label: "Kiosk Camera" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [clock, setClock] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
      setDateStr(
        now.toLocaleDateString("vi-VN", {
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased">
      {/* Sidebar 280px */}
      <aside className="fixed left-0 top-0 h-screen w-[280px] bg-surface-container-lowest border-r border-outline-variant z-50 flex flex-col justify-between py-5 px-4 select-none">
        <div className="flex flex-col gap-6 overflow-y-auto">
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-3 px-2 cursor-pointer group"
          >
            <div className="h-9 w-9 rounded-xl bg-surface-container-low flex items-center justify-center p-1.5 border border-outline-variant/50">
              <img
                alt="SecureFace AI Logo"
                className="h-full w-full object-contain"
                src={LOGO_URL}
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-title-lg text-title-lg text-on-surface tracking-tight font-bold group-hover:text-secondary transition-colors">
                SecureFace AI
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
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors font-label-lg text-label-lg ${
                    isActive
                      ? "bg-secondary-fixed text-secondary font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-error text-on-error font-code-telemetry text-[11px] font-bold">
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
            className="w-full h-11 bg-primary text-on-primary rounded-xl flex items-center justify-center gap-2 hover:bg-primary-container transition-all font-label-lg text-label-lg active:scale-[0.98] shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">face</span>
            <span>Đăng ký khuôn mặt</span>
          </button>
          <button
            onClick={() => navigate("/login")}
            className="w-full h-9 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-xl flex items-center justify-center gap-1.5 font-label-md text-label-md transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Đăng xuất phiên quản trị</span>
          </button>
        </div>
      </aside>

      {/* Main Frame */}
      <div className="pl-[280px]">
        <header className="fixed top-0 left-[280px] right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant z-40 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              alt="SecureFace AI"
              className="h-7 w-auto object-contain"
              src={LOGO_URL}
            />
            <div className="h-4 w-[1px] bg-outline-variant"></div>
            <span className="font-label-lg text-label-lg text-on-surface-variant">
              Hệ thống Quản trị Doanh nghiệp
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed text-secondary border border-secondary/20 font-label-md text-label-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
              <span>Hệ thống hoạt động</span>
            </div>

            <div className="hidden xl:flex items-center gap-1.5 text-on-surface-variant font-code-telemetry text-code-telemetry">
              <span className="material-symbols-outlined text-[16px]">
                schedule
              </span>
              <span>
                {clock} — {dateStr}
              </span>
            </div>

            <div className="relative flex items-center justify-center">
              <button
                onClick={() => navigate("/alerts")}
                title="Cảnh báo an ninh"
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors relative cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">
                  notifications
                </span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full ring-2 ring-surface-container-lowest"></span>
              </button>
            </div>

            <div className="h-6 w-[1px] bg-outline-variant"></div>

            <div className="flex items-center gap-3 pl-1">
              <img
                alt="Lê Thu Hà"
                className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant"
                src={AVATAR_HR}
              />
              <div className="flex flex-col text-left">
                <span className="font-label-lg text-label-lg text-on-surface leading-tight">
                  Lê Thu Hà
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Quản trị viên / HR
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
