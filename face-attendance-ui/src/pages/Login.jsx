import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LOGO_URL =
  "https://lh3.googleusercontent.com/aida/AEtjO1Wchkkf-GzfXSzfqGNE7PvXyf_M0Mf2O92GevUbcwBwF3SGgIWf9dQoioPY-g-u0ESQvj9c818DFCKe9OgfiBfYKLcM5vSYK0MiFx23h5Y0HBNcm5rwpASI6k6Y6d9ZW49pxfpMvBPcJXPOjE3bEO6FG3gsoNR6wiuP6ueTQgDynLPfELlzIeqb-lesz4aarNYD6RPX7fWgYkML-YJuRgs42-iPCxMm9YVOEMIsOqTVaKQllpvULqjbtywJ";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@secureface.vn");
  const [password, setPassword] = useState("SecureFace@2026");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(3);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ email quản trị viên và mật khẩu.");
      return;
    }
    if (password === "wrong") {
      const next = Math.max(1, attemptsLeft - 1);
      setAttemptsLeft(next);
      setError(
        `Mật khẩu không chính xác. Bạn còn ${next} lần thử trước khi tài khoản bị tạm khóa 15 phút.`
      );
      return;
    }
    localStorage.setItem("sf_admin_auth", "1");
    navigate("/");
  };

  return (
    <main className="w-full min-h-screen bg-background relative flex flex-col justify-between p-6 sm:p-8 md:p-12 overflow-hidden">
      {/* Subtle Dynamic Tech Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-40 [background-image:radial-gradient(#c6c6cd_1px,transparent_1px)] [background-size:24px_24px]"></div>

      {/* Top Security Bar */}
      <div className="w-full flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant font-code-telemetry text-code-telemetry tracking-wide shadow-xs">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
          <span className="font-semibold">SECUREFACE CONSOLE • AUTH NODE</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-low text-on-surface-variant font-label-md text-label-md border border-outline-variant/40">
          <span className="material-symbols-outlined text-[16px] text-secondary">
            verified_user
          </span>
          <span>Cổng xác thực sinh trắc học cấp 3</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full flex justify-center items-center my-auto py-6 relative z-10">
        <div className="w-full max-w-[460px] bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-xl p-8 sm:p-10 flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-secondary to-transparent opacity-80"></div>

          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-xl bg-surface-container-low flex items-center justify-center p-2 mb-4 shadow-xs relative group">
              <img
                alt="SecureFace AI Logo"
                className="w-full h-full object-contain"
                src={LOGO_URL}
              />
            </div>
            <h1 className="font-headline-md text-headline-md text-primary tracking-tight font-bold">
              SecureFace AI
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1.5 font-medium">
              Hệ thống Quản trị Điểm danh Khuôn mặt Doanh nghiệp
            </p>
          </div>

          {/* Notice Banner */}
          <div className="bg-surface-container-low rounded-lg p-3.5 flex items-start gap-3">
            <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
              info
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Hệ thống nội bộ dành riêng cho{" "}
              <span className="text-on-surface font-semibold">
                Quản trị viên &amp; Nhân sự
              </span>
              . Không hỗ trợ đăng ký tài khoản công khai.
            </p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <label
                className="font-label-lg text-label-lg text-on-surface flex items-center justify-between"
                htmlFor="admin-email"
              >
                <span>Email quản trị viên</span>
                <span className="font-label-sm text-label-sm text-secondary font-semibold">
                  Cấp quyền AD-01
                </span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-outline text-[20px] pointer-events-none">
                  mail
                </span>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="nhap.email@doanhnghiep.vn"
                  className="w-full h-11 pl-11 pr-4 rounded-lg bg-surface-container-low border border-transparent focus:border-secondary text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mt-1">
              <div className="flex items-center justify-between">
                <label
                  className="font-label-lg text-label-lg text-on-surface"
                  htmlFor="admin-password"
                >
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setError(
                      "Mật khẩu không chính xác. Bạn còn 2 lần thử trước khi tài khoản bị tạm khóa 15 phút."
                    )
                  }
                  className="font-body-sm text-body-sm text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                >
                  Thử trạng thái báo lỗi
                </button>
              </div>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-outline text-[20px] pointer-events-none">
                  lock
                </span>
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Nhập mã xác thực"
                  className="w-full h-11 pl-11 pr-11 rounded-lg bg-surface-container-low border border-transparent focus:border-secondary text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest transition-all tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Ẩn / Hiện mật khẩu"
                  className="absolute right-2.5 w-8 h-8 flex items-center justify-center text-outline hover:text-on-surface rounded-md hover:bg-surface-container transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Error Alert Box */}
            {error && (
              <div className="bg-error-container/60 rounded-lg p-3.5 flex items-start gap-3 mt-1">
                <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">
                  error
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-label-sm text-label-sm text-on-error-container font-bold">
                    Xác thực thất bại
                  </span>
                  <p className="font-body-sm text-body-sm text-on-error-container leading-snug">
                    {error}
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full h-12 mt-2 bg-primary text-on-primary hover:bg-on-primary-fixed rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer"
            >
              <span>Đăng nhập bảng điều khiển</span>
              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
            </button>
          </form>

          {/* Quick Kiosk Entry + Support */}
          <div className="pt-2 border-t border-surface-container flex flex-col gap-2 items-center justify-center text-center">
            <button
              type="button"
              onClick={() => navigate("/kiosk")}
              className="font-label-md text-label-md text-secondary hover:underline flex items-center gap-1.5 py-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                camera_indoor
              </span>
              <span>Mở màn hình Kiosk điểm danh toàn màn hình</span>
            </button>
            <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-outline">
                support_agent
              </span>
              <span>Quên mật khẩu? Liên hệ IT bộ phận Kỹ thuật nội bộ.</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Telemetry */}
      <div className="w-full py-2 flex flex-col sm:flex-row items-center justify-between text-center gap-2 relative z-10 font-body-sm text-body-sm text-on-surface-variant">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
          <span className="font-code-telemetry text-code-telemetry">
            Phiên bản v2.4.0 • Tiêu chuẩn an toàn dữ liệu sinh trắc học ISO/IEC
            27001
          </span>
        </div>
        <div className="text-outline font-label-sm text-label-sm">
          Bản quyền thuộc SecureFace AI
        </div>
      </div>
    </main>
  );
}
