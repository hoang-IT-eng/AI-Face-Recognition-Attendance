import { useEffect, useState } from "react";
import { getUsers, manualAttendance } from "../api";

const INITIAL_HISTORY = [
  {
    id: 1,
    initials: "TN",
    name: "Trần Nhật Nam (NV112)",
    meta: "08:12:05 • Quét mã QR",
  },
  {
    id: 2,
    initials: "LH",
    name: "Lý Hải Vân (NV089)",
    meta: "08:04:42 • Nhập mã PIN",
  },
  {
    id: 3,
    initials: "VD",
    name: "Vũ Đình Quân (NV014)",
    meta: "07:58:19 • Quét mã QR",
  },
];

export default function BackupAttendance() {
  const [tab, setTab] = useState("pin"); // pin | qr
  const [empCode, setEmpCode] = useState("NV045");
  const [pin, setPin] = useState("12");
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [lastReceipt, setLastReceipt] = useState({
    name: "Phạm Quỳnh Như",
    code: "NV045",
    dept: "Phòng Kế toán & Tài chính",
    time: "08:15:30",
    method: "Mã PIN xác thực nội bộ",
  });

  useEffect(() => {
    getUsers()
      .then((r) => setUsers(r.data || []))
      .catch(() => {});
  }, []);

  const matchedUser = users.find(
    (u) => u.code?.toLowerCase() === empCode.trim().toLowerCase()
  ) || {
    id: null,
    code: empCode || "NV045",
    name: "Phạm Quỳnh Như",
    group: "Phòng Kế toán",
  };

  const pressKey = (k) => {
    if (pin.length < 4) setPin((p) => p + k);
  };

  const handleSubmit = async () => {
    if (tab === "pin" && pin.length < 4) {
      alert("Vui lòng nhập đủ 4 chữ số mã PIN bảo mật.");
      return;
    }

    const nowTime = new Date().toLocaleTimeString("vi-VN", { hour12: false });
    try {
      if (matchedUser.id) {
        await manualAttendance({
          user_id: matchedUser.id,
          date: new Date().toISOString().slice(0, 10),
          status: "present",
          note:
            tab === "pin"
              ? "Điểm danh thay thế bằng mã PIN"
              : "Điểm danh thay thế bằng mã QR động",
        });
      }
    } catch {}

    setLastReceipt({
      name: matchedUser.name,
      code: matchedUser.code,
      dept: matchedUser.group || "Phòng Kế toán & Tài chính",
      time: nowTime,
      method:
        tab === "pin" ? "Mã PIN xác thực nội bộ" : "Mã QR động Time-based OTP",
    });

    setHistory((prev) => [
      {
        id: Date.now(),
        initials:
          matchedUser.name
            ?.split(" ")
            .slice(-2)
            .map((w) => w[0])
            .join("") || "NV",
        name: `${matchedUser.name} (${matchedUser.code})`,
        meta: `${nowTime} • ${tab === "pin" ? "Nhập mã PIN" : "Quét mã QR"}`,
      },
      ...prev.slice(0, 5),
    ]);
    setPin("");
  };

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-surface-container-high text-on-surface-variant font-code-telemetry text-code-telemetry">
              KÊNH XÁC THỰC DỰ PHÒNG
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-secondary font-label-sm text-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              Kênh dự phòng cấp 2
            </span>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
            Điểm Danh Thay Thế Khẩn Cấp &amp; Bảo Trì
          </h1>
        </div>

        <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-2.5 rounded-xl border border-outline-variant/40 shadow-xs">
          <span className="material-symbols-outlined text-secondary text-[22px]">
            verified_user
          </span>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Mức độ bảo mật
            </span>
            <span className="font-label-md text-label-md text-on-surface font-semibold">
              2FA Zero-Trust Node #04
            </span>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-4 mb-6 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-secondary-container text-on-secondary-container shrink-0">
            <span className="material-symbols-outlined text-[20px]">info</span>
          </div>
          <div className="flex flex-col gap-1 pr-6">
            <span className="font-title-md text-title-md text-on-surface font-semibold">
              Phương thức xác thực dự phòng bảo mật cao
            </span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Dành riêng cho nhân viên có văn bản miễn trừ sinh trắc khuôn mặt
              hoặc trong tình huống camera Kiosk đang hiệu chuẩn, bảo trì định
              kỳ. Hỗ trợ <strong>Mã PIN cá nhân 4 số</strong> hoặc{" "}
              <strong>Mã QR động Time-based OTP (TOTP)</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Dual Navigation Tabs */}
      <div className="flex items-center gap-8 bg-surface-container-lowest px-6 rounded-xl border border-outline-variant/40 shadow-xs mb-8">
        <button
          onClick={() => setTab("pin")}
          className={`relative py-4 flex items-center gap-2.5 font-label-lg text-label-lg transition-colors cursor-pointer ${
            tab === "pin"
              ? "text-on-surface font-bold"
              : "text-on-surface-variant hover:text-on-surface font-semibold"
          }`}
        >
          <span className="material-symbols-outlined text-[20px] text-secondary">
            pin
          </span>
          <span>Mã PIN cá nhân</span>
          {tab === "pin" && (
            <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-secondary-container rounded-full" />
          )}
        </button>

        <button
          onClick={() => setTab("qr")}
          className={`relative py-4 flex items-center gap-2.5 font-label-lg text-label-lg transition-colors cursor-pointer ${
            tab === "qr"
              ? "text-on-surface font-bold"
              : "text-on-surface-variant hover:text-on-surface font-semibold"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            qr_code_scanner
          </span>
          <span>Quét mã QR động</span>
          {tab === "qr" && (
            <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-secondary-container rounded-full" />
          )}
        </button>
      </div>

      {/* Main Workspace Grid (7 : 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT PANEL */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {tab === "pin" ? (
            <div className="w-full max-w-[500px] bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/40 shadow-md flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
                    <span className="material-symbols-outlined text-[18px]">
                      dialpad
                    </span>
                  </div>
                  <div>
                    <h2 className="font-title-md text-title-md text-on-surface font-bold">
                      Xác thực mã PIN
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Nhập mã nhân viên và PIN bảo mật
                    </p>
                  </div>
                </div>
                <span className="font-code-telemetry text-code-telemetry px-2 py-1 rounded bg-surface-container text-on-surface-variant">
                  V3.8-SEC
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant">
                  Mã nhân viên (Staff ID)
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">
                    badge
                  </span>
                  <input
                    value={empCode}
                    onChange={(e) => setEmpCode(e.target.value)}
                    placeholder="Nhập mã NV..."
                    type="text"
                    className="w-full h-11 pl-11 pr-24 rounded-xl bg-surface-container-low text-on-surface font-label-lg text-label-lg focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                  <span className="absolute right-3 inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-semibold bg-secondary-fixed/50 px-2 py-0.5 rounded">
                    <span className="material-symbols-outlined text-[14px]">
                      check
                    </span>{" "}
                    Khớp
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-3 p-3 rounded-xl bg-surface-container-low">
                  <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-on-surface">
                    {matchedUser.name
                      ?.split(" ")
                      .slice(-2)
                      .map((w) => w[0])
                      .join("") || "QN"}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-title-md text-title-md text-on-surface font-bold truncate">
                      {matchedUser.name}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      {matchedUser.group || "Phòng Kế toán"} •{" "}
                      {matchedUser.code}
                    </span>
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-secondary font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-[16px]">
                      lock_reset
                    </span>
                    <span>PIN: Sẵn sàng</span>
                  </div>
                </div>
              </div>

              {/* PIN Dots */}
              <div className="flex flex-col items-center gap-3 py-2">
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Mật khẩu PIN 4 chữ số
                </span>
                <div className="flex items-center gap-4">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full transition-all ${
                        idx < pin.length
                          ? "bg-on-surface scale-125 shadow-xs"
                          : "bg-surface-container-high"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1 text-on-surface-variant font-code-telemetry text-code-telemetry mt-1">
                  <span className="material-symbols-outlined text-[15px]">
                    security
                  </span>
                  <span>Đã nhập {pin.length} / 4 ký tự</span>
                </div>
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-3 w-full select-none">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => pressKey(num)}
                    className="h-14 rounded-xl bg-surface-container hover:bg-surface-container-high active:bg-surface-dim flex items-center justify-center font-title-lg text-title-lg text-on-surface font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPin("")}
                  className="h-14 rounded-xl bg-error-container/40 text-on-error-container hover:bg-error-container/60 active:scale-95 flex items-center justify-center font-label-lg text-label-lg font-bold transition-all cursor-pointer"
                >
                  C
                </button>
                <button
                  type="button"
                  onClick={() => pressKey("0")}
                  className="h-14 rounded-xl bg-surface-container hover:bg-surface-container-high active:bg-surface-dim flex items-center justify-center font-title-lg text-title-lg text-on-surface font-bold transition-all active:scale-95 cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setPin((p) => p.slice(0, -1))}
                  className="h-14 rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-95 flex items-center justify-center text-on-surface transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[22px]">
                    backspace
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                className="w-full h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center gap-2 hover:bg-primary-container active:scale-[0.99] font-label-lg text-label-lg transition-all shadow-sm mt-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  how_to_reg
                </span>
                <span>Xác nhận chấm công</span>
              </button>
            </div>
          ) : (
            <div className="w-full max-w-[500px] bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/40 shadow-md flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
                    <span className="material-symbols-outlined text-[18px]">
                      qr_code_2
                    </span>
                  </div>
                  <div>
                    <h2 className="font-title-md text-title-md text-on-surface font-bold">
                      Quét mã QR nhân viên
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Camera cảm biến TOTP động
                    </p>
                  </div>
                </div>
                <span className="font-code-telemetry text-code-telemetry px-2 py-1 rounded bg-secondary-fixed text-secondary">
                  OPTICAL-AI
                </span>
              </div>

              <div className="relative w-full aspect-square rounded-xl bg-surface-container-highest overflow-hidden flex items-center justify-center">
                <div className="relative w-64 h-64 border-2 border-secondary-container rounded-2xl flex items-center justify-center bg-surface-container-lowest/80 backdrop-blur-xs">
                  <div className="p-4 bg-surface-container-lowest rounded-xl shadow-lg flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[48px]">
                      qr_code_scanner
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface font-semibold text-center">
                      Đang chờ quét mã QR...
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                className="w-full h-11 bg-primary text-on-primary rounded-xl flex items-center justify-center gap-2 font-label-lg text-label-lg transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  qr_code_scanner
                </span>
                <span>Xác nhận mã QR hợp lệ</span>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Result & History */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full">
          <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/40 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
                </span>
                <span className="font-label-lg text-label-lg text-on-surface font-bold">
                  Kết quả điểm danh
                </span>
              </div>
              <span className="font-code-telemetry text-code-telemetry text-on-surface-variant">
                NODE: REC_2410_01
              </span>
            </div>

            <div className="p-5 rounded-xl bg-surface-container-low flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-secondary-fixed/50 flex items-center justify-center text-secondary shrink-0">
                  <span className="material-symbols-outlined material-symbols-filled text-[36px]">
                    check_circle
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="inline-flex items-center gap-1.5 text-secondary font-label-sm text-label-sm font-bold">
                    <span>Hợp Lệ • Xác Thực Thành Công</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                    ĐIỂM DANH THÀNH CÔNG
                  </h3>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Họ và tên nhân viên
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-label-lg text-label-lg text-on-surface font-bold">
                      {lastReceipt.name}
                    </span>
                    <span className="font-code-telemetry text-code-telemetry px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                      {lastReceipt.code}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Phòng ban công tác
                  </span>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    {lastReceipt.dept}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Giờ máy ghi nhận
                  </span>
                  <span className="font-headline-md text-headline-md font-bold font-code-telemetry text-secondary">
                    {lastReceipt.time}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Trạng thái ca làm việc
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-secondary font-label-md text-label-md font-bold">
                    <span className="material-symbols-outlined text-[16px]">
                      login
                    </span>
                    ĐÃ VÀO (Đúng giờ)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Phương thức xác nhận
                  </span>
                  <span className="inline-flex items-center gap-1 font-label-md text-label-md text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-secondary">
                      pin
                    </span>
                    {lastReceipt.method}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Backup Attendances */}
          <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/40 shadow-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-on-surface">
                  history
                </span>
                <h4 className="font-title-md text-title-md text-on-surface font-bold">
                  Lịch sử điểm danh thay thế gần đây
                </h4>
              </div>
              <span className="font-label-sm text-label-sm text-secondary">
                Hôm nay
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-label-sm text-label-sm font-bold text-on-surface">
                      {h.initials}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">
                        {h.name}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {h.meta}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-secondary bg-secondary-fixed/40 font-label-sm text-label-sm font-bold">
                    Hợp lệ
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
