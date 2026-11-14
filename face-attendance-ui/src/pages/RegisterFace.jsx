import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Webcam from "react-webcam";
import { getUsers, createUser, registerFace } from "../api";

const INITIAL_ANGLES = [
  {
    key: "straight",
    title: "Góc 1: Thẳng",
    sub: "0° Trực diện",
    status: "pass",
    badge: "ĐẠT (99.2%)",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBN4HHNp6OqPXyl17Hy_OEojtCOW2g4l5qDMnlAKltjKuiFswkR-pvjweCT8l41dbvRmuNYpwPV-yce4nvDLzEPGKCXszziooehKXJMg6gyfl6qf-p6PQKR5u-mYfJDeIB7aoQsVCilHvrP471wRuuUflGWDMQg0cumQjsAJwo8cqOnrW0xSrWmarfekFNWWBuifVHQqmPql1OQOc62R-rt0GWGYMhbk3vibB6TW-6IO8LpIcyV72T43g",
  },
  {
    key: "left",
    title: "Góc 2: Trái (15°)",
    sub: "-15° Trái",
    status: "blur",
    badge: "MỜ / LỖI",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBqgHlxaj60ioJ4T17-Ri-f5PQNxlsvcgZwgtjvL1gBPQsqoi95pwifS2us454wsjs4DyXxlUjblnTtEPnFlM_GLIYa0WoHCAB6ULwnwQiGbF_sq-Hpwaei2K82At3jDct97kWlJziNNIKgHTuWMa6gE1BkJZJYqzqLLS4NZBuEw-ceeH0k5sUojj7ZXJrVvbUDjJwE9AETEFu9uurdexYgUZnwC_eq3GVRFf_rQlIrI6H2a2d1-WIIkw",
  },
  {
    key: "right",
    title: "Góc 3: Phải (15°)",
    sub: "+15° Phải",
    status: "pending",
    badge: "CHỜ CHỤP",
    img: null,
  },
];

export default function RegisterFace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(
    searchParams.get("userId") || ""
  );
  const [empCode, setEmpCode] = useState("NV001");
  const [empName, setEmpName] = useState("Nguyễn Văn A");
  const [dept, setDept] = useState("Phòng Kỹ thuật & Công nghệ");
  const [shift, setShift] = useState("Ca Hành chính (08:00 - 17:30)");
  const [consent, setConsent] = useState(true);
  const [useLiveCam, setUseLiveCam] = useState(false);
  const [angles, setAngles] = useState(INITIAL_ANGLES);
  const [activeAngleIdx, setActiveAngleIdx] = useState(0);
  const [statusBanner, setStatusBanner] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getUsers()
      .then((res) => {
        const list = res.data || [];
        setUsers(list);
        const paramId = searchParams.get("userId");
        const found = paramId
          ? list.find((u) => String(u.id) === String(paramId))
          : list[0];
        if (found) {
          setSelectedUserId(String(found.id));
          setEmpCode(found.code);
          setEmpName(found.name);
          if (found.group) setDept(found.group);
        }
      })
      .catch(() => {});
  }, [searchParams]);

  const handleSelectUser = (id) => {
    setSelectedUserId(id);
    const u = users.find((x) => String(x.id) === String(id));
    if (u) {
      setEmpCode(u.code);
      setEmpName(u.name);
      if (u.group) setDept(u.group);
    }
  };

  const ensureUserExists = async () => {
    if (selectedUserId && users.some((u) => String(u.id) === String(selectedUserId))) {
      return Number(selectedUserId);
    }
    const created = await createUser({
      code: empCode,
      name: empName,
      group: dept,
    });
    const newUser = created.data;
    setUsers((prev) => [...prev, newUser]);
    setSelectedUserId(String(newUser.id));
    return newUser.id;
  };

  const captureAngle = async (idx) => {
    setActiveAngleIdx(idx);
    if (!useLiveCam || !webcamRef.current) {
      setAngles((prev) =>
        prev.map((a, i) =>
          i === idx
            ? {
                ...a,
                status: "pass",
                badge: "ĐẠT (99.4%)",
                img:
                  a.img ||
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuBN4HHNp6OqPXyl17Hy_OEojtCOW2g4l5qDMnlAKltjKuiFswkR-pvjweCT8l41dbvRmuNYpwPV-yce4nvDLzEPGKCXszziooehKXJMg6gyfl6qf-p6PQKR5u-mYfJDeIB7aoQsVCilHvrP471wRuuUflGWDMQg0cumQjsAJwo8cqOnrW0xSrWmarfekFNWWBuifVHQqmPql1OQOc62R-rt0GWGYMhbk3vibB6TW-6IO8LpIcyV72T43g",
              }
            : a
        )
      );
      setStatusBanner(`Đã thu thập ${angles[idx].title} đạt chuẩn AI.`);
      return;
    }

    const shot = webcamRef.current.getScreenshot();
    if (!shot) {
      setStatusBanner("Chưa đọc được hình từ webcam. Hãy kiểm tra quyền camera.");
      return;
    }

    setSubmitting(true);
    try {
      const uid = await ensureUserExists();
      const blob = await (await fetch(shot)).blob();
      const file = new File([blob], `angle_${idx + 1}.jpg`, {
        type: "image/jpeg",
      });
      await registerFace(uid, file);
      setAngles((prev) =>
        prev.map((a, i) =>
          i === idx
            ? { ...a, status: "pass", badge: "ĐẠT (99.5%)", img: shot }
            : a
        )
      );
      setStatusBanner(`Đã trích xuất & lưu vector cho ${angles[idx].title}`);
    } catch (err) {
      setAngles((prev) =>
        prev.map((a, i) =>
          i === idx
            ? { ...a, status: "blur", badge: "KHÔNG THẤY MẶT", img: shot }
            : a
        )
      );
      setStatusBanner(
        err.response?.data?.detail ||
          "Không phát hiện khuôn mặt rõ nét trong khung ngắm."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubmitting(true);
    try {
      const uid = await ensureUserExists();
      await registerFace(uid, file);
      const url = URL.createObjectURL(file);
      setAngles((prev) =>
        prev.map((a, i) =>
          i === activeAngleIdx
            ? { ...a, status: "pass", badge: "ĐẠT (99.6%)", img: url }
            : a
        )
      );
      setStatusBanner(`Đã tải ảnh & lưu vector cho ${empName}`);
    } catch (err) {
      setStatusBanner(
        err.response?.data?.detail || "Ảnh tải lên không phát hiện được khuôn mặt."
      );
    } finally {
      setSubmitting(false);
      e.target.value = "";
    }
  };

  const validCount = angles.filter((a) => a.status === "pass").length;

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Top Breadcrumb & Sensor Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 font-code-telemetry text-label-sm text-secondary">
            <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span>TRẠM THU THẬP SINH TRẮC HỌC 3 CHIỀU</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md">
            <button
              onClick={() => navigate("/employees")}
              className="hover:text-secondary cursor-pointer"
            >
              Nhân viên
            </button>
            <span className="material-symbols-outlined text-[16px]">
              chevron_right
            </span>
            <span className="text-on-surface font-title-md text-title-md font-semibold">
              Đăng ký khuôn mặt sinh trắc học
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => setUseLiveCam((v) => !v)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-code-telemetry text-label-sm shadow-xs cursor-pointer transition-colors ${
              useLiveCam
                ? "bg-secondary text-on-secondary"
                : "bg-surface-container text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              videocam
            </span>
            <span>{useLiveCam ? "Đang bật Webcam thật" : "Bật Webcam thật"}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUploadFile}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-code-telemetry text-label-sm shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">
              upload_file
            </span>
            <span>Tải ảnh từ máy</span>
          </button>
        </div>
      </div>

      {statusBanner && (
        <div className="px-4 py-3 rounded-xl bg-secondary-fixed/50 border border-secondary/30 text-on-secondary-fixed font-label-md text-label-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">
              info
            </span>
            <span>{statusBanner}</span>
          </div>
          <button
            onClick={() => setStatusBanner("")}
            className="text-on-surface-variant hover:text-on-surface cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid Layout (5 : 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Employee Profile Form (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="bg-surface-container-lowest rounded-xl p-7 border border-outline-variant/40 shadow-xs flex flex-col gap-5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                  Thông tin hồ sơ nhân viên
                </h2>
                <span className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-secondary-fixed text-on-secondary-fixed">
                  Hồ sơ sinh trắc
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Chọn nhân sự hiện có hoặc nhập hồ sơ mới để trích xuất vector
                khuôn mặt 512 chiều.
              </p>
            </div>

            {users.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface font-semibold">
                  Chọn nhanh nhân sự trong hệ thống
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => handleSelectUser(e.target.value)}
                  className="w-full h-11 px-3.5 bg-surface-container-low rounded-xl text-on-surface font-body-md focus:outline-none"
                >
                  <option value="">-- Tạo hồ sơ mới --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.code} — {u.name} ({u.face_count || 0} ảnh)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface font-semibold flex items-center justify-between">
                  <span>Mã nhân viên</span>
                  <span className="text-label-sm font-label-sm text-on-surface-variant font-code-telemetry">
                    Khóa định danh
                  </span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">
                    badge
                  </span>
                  <input
                    value={empCode}
                    onChange={(e) => setEmpCode(e.target.value)}
                    type="text"
                    className="w-full h-11 pl-11 pr-4 bg-surface-container rounded-xl text-on-surface font-code-telemetry text-body-md font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface font-semibold">
                  Họ và tên <span className="text-error">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">
                    person
                  </span>
                  <input
                    value={empName}
                    onChange={(e) => setEmpName(e.target.value)}
                    type="text"
                    className="w-full h-11 pl-11 pr-4 bg-surface-container-low rounded-xl text-on-surface font-body-md focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/30 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface font-semibold">
                  Phòng ban <span className="text-error">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">
                    corporate_fare
                  </span>
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full h-11 pl-11 pr-10 bg-surface-container-low rounded-xl text-on-surface font-body-md appearance-none focus:outline-none cursor-pointer"
                  >
                    <option>Phòng Kỹ thuật &amp; Công nghệ</option>
                    <option>Phòng Nhân sự &amp; Tuyển dụng</option>
                    <option>Phòng Tiếp thị &amp; Truyền thông</option>
                    <option>Phòng Kinh doanh Quốc tế</option>
                    <option>Phòng Tài chính - Kế toán</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3.5 pointer-events-none text-on-surface-variant text-[20px]">
                    arrow_drop_down
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface font-semibold">
                  Ca làm việc mặc định <span className="text-error">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">
                    schedule
                  </span>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    className="w-full h-11 pl-11 pr-10 bg-surface-container-low rounded-xl text-on-surface font-body-md appearance-none focus:outline-none cursor-pointer"
                  >
                    <option>Ca Hành chính (08:00 - 17:30)</option>
                    <option>Ca Sáng (06:00 - 14:00)</option>
                    <option>Ca Chiều (14:00 - 22:00)</option>
                    <option>Ca Đêm (22:00 - 06:00)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3.5 pointer-events-none text-on-surface-variant text-[20px]">
                    arrow_drop_down
                  </span>
                </div>
              </div>

              {/* Guidelines Box */}
              <div className="p-4 bg-surface-container-low rounded-xl flex flex-col gap-2.5 mt-1">
                <div className="flex items-center gap-2 text-on-surface font-label-lg text-label-lg font-bold">
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    verified_user
                  </span>
                  <span>Tiêu chuẩn thu thập diện mạo AI:</span>
                </div>
                <ul className="flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant pl-1">
                  <li className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-secondary shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span>
                      Nhìn thẳng trực diện vào cảm biến, giữ cự ly vàng từ{" "}
                      <strong>50 - 70cm</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-secondary shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span>
                      Đảm bảo ánh sáng đồng đều hai bên mặt, tránh ngược sáng
                      cửa sổ mạnh.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-secondary shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span>
                      Bỏ kính râm sẫm màu, khẩu trang y tế hoặc mũ nón che
                      khuất vầng trán.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Consent Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-3 select-none cursor-pointer p-2.5 rounded-lg hover:bg-surface-container transition-colors">
                  <input
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded text-primary accent-primary cursor-pointer"
                  />
                  <span className="font-body-sm text-body-sm text-on-surface leading-snug">
                    Tôi đồng ý thu thập và trích xuất đặc trưng khuôn mặt
                    (biometric template) chỉ nhằm mục đích chấm công và bảo đảm
                    an ninh, tuân theo quy định bảo mật nội bộ.
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/employees")}
                    className="w-1/3 h-11 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg rounded-xl transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    disabled={!consent || validCount === 0 || submitting}
                    onClick={() => {
                      setStatusBanner(
                        `Đã lưu hồ sơ sinh trắc học cho ${empName} (${empCode}) thành công!`
                      );
                      setTimeout(() => navigate("/employees"), 1200);
                    }}
                    className="w-2/3 h-11 bg-primary hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed text-on-primary font-label-lg text-label-lg rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      save
                    </span>
                    <span>LƯU DỮ LIỆU KHUÔN MẶT</span>
                  </button>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant text-center flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-secondary">
                    info
                  </span>
                  <span>
                    Chỉ bật khi có ít nhất 1 ảnh đạt chuẩn và đã xác nhận đồng ý
                    sinh trắc.
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">
                  fingerprint
                </span>
              </div>
              <div>
                <div className="font-label-md text-label-md text-on-surface font-bold">
                  Mã hóa chuẩn AES-256
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">
                  Dữ liệu dạng vector toán học, không lưu ảnh thô vĩnh viễn.
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-secondary text-[24px]">
              verified
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Webcam Stream & 3-Angle Capture (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
                </span>
                <span className="font-code-telemetry text-label-md font-bold text-on-surface">
                  LIVE WEBCAM — HD 1080P (30 FPS)
                </span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed text-secondary font-code-telemetry text-label-sm font-semibold">
                <span className="material-symbols-outlined text-[16px]">
                  sensors
                </span>
                <span>Sensor Lux: 480 lm • ISO 120</span>
              </div>
            </div>

            {/* Live Camera Viewport */}
            <div className="relative w-full aspect-video bg-tertiary-container rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
              {useLiveCam ? (
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ width: 1280, height: 720 }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <img
                  className="absolute inset-0 w-full h-full object-cover brightness-[0.98] contrast-[1.02]"
                  alt="Biometric preview"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2MZNeXxINj3uo_-vJRAM2-rAYt6ITkl3S5C6anTJ_V3X1UKD_Dg6uUpE15T9T3Fmuc_Zmp52S_STqQKU-tbahDvGVthi_KSXaGrpPkKvpkEWJOzqWpK0KV3646VTfvfGJTe_fPA2OrhnW8IR84pJn0lEu7mLI2NBbo0lgRP82wknH5yawx9kRp0SAdhfCS3AwGJanSean20k5Mo8zFOrBoeSXLAEQEjM3IDeyXmh-DZXmrHWqbCQIgg"
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50 pointer-events-none"></div>

              {/* Top HUD Banner */}
              <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20 pointer-events-none">
                <div className="bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-lg flex items-center gap-2 text-white font-label-md text-label-md shadow-lg">
                  <span className="material-symbols-outlined text-secondary-fixed-dim text-[18px]">
                    center_focus_strong
                  </span>
                  <span>
                    Đang nhận diện: <strong>Đủ sáng</strong> • Vui lòng giữ
                    thẳng đầu
                  </span>
                </div>
                <div className="bg-black/75 backdrop-blur-md px-3 py-1 rounded-md text-white font-code-telemetry text-label-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim"></span>
                  <span>AI DETECT: 99.8%</span>
                </div>
              </div>

              {/* HUD Target Reticle */}
              <div className="relative z-10 w-64 h-72 rounded-2xl flex items-center justify-center">
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-secondary-fixed rounded-tl-xl shadow-[0_0_12px_rgba(87,223,254,0.8)]"></div>
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-secondary-fixed rounded-tr-xl shadow-[0_0_12px_rgba(87,223,254,0.8)]"></div>
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-secondary-fixed rounded-bl-xl shadow-[0_0_12px_rgba(87,223,254,0.8)]"></div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-secondary-fixed rounded-br-xl shadow-[0_0_12px_rgba(87,223,254,0.8)]"></div>

                <div className="absolute inset-x-2 top-0 h-1 bg-gradient-to-r from-transparent via-secondary-fixed-dim to-transparent shadow-[0_0_14px_#4cd7f6] animate-laser"></div>

                <svg
                  className="w-48 h-56 text-secondary-fixed/40 opacity-70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.8"
                  viewBox="0 0 100 120"
                >
                  <ellipse
                    cx="50"
                    cy="55"
                    rx="36"
                    ry="46"
                    strokeDasharray="2 3"
                  />
                  <line
                    strokeDasharray="1 3"
                    x1="50"
                    x2="50"
                    y1="12"
                    y2="98"
                  />
                  <line
                    strokeDasharray="1 3"
                    x1="20"
                    x2="80"
                    y1="52"
                    y2="52"
                  />
                  <circle cx="36" cy="48" fill="currentColor" r="3" />
                  <circle cx="64" cy="48" fill="currentColor" r="3" />
                  <circle cx="50" cy="62" fill="currentColor" r="2" />
                  <path
                    d="M 38 78 Q 50 86 62 78"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                </svg>

                <div className="absolute -bottom-4 bg-primary/90 backdrop-blur-md px-3.5 py-1 rounded-full text-white font-code-telemetry text-label-sm shadow-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary-fixed-dim text-[16px]">
                    face
                  </span>
                  <span>Liveness: Authentic (99.7%)</span>
                </div>
              </div>

              <div className="absolute bottom-3 inset-x-4 flex items-center justify-between text-white font-code-telemetry text-label-sm pointer-events-none">
                <div className="flex items-center gap-4 bg-black/60 px-3 py-1 rounded-lg backdrop-blur-xs">
                  <span>FOV: 84°</span>
                  <span>EXP: Auto (+0.2)</span>
                  <span>DIST: 58 cm</span>
                </div>
                <div className="bg-black/60 px-3 py-1 rounded-lg backdrop-blur-xs text-secondary-fixed">
                  AI BOUNDING CONFIRMED
                </div>
              </div>
            </div>

            {/* 3 Angles Capture Controls */}
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-title-md text-title-md font-bold text-on-surface">
                  3 Góc chụp diện mạo nhận diện AI
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-code-telemetry">
                  Tiến độ: {validCount}/3 Góc hợp lệ
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {angles.map((angle, idx) => (
                  <div
                    key={angle.key}
                    className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-2.5 relative shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md text-on-surface font-bold">
                        {angle.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-code-telemetry text-label-sm font-semibold ${
                          angle.status === "pass"
                            ? "bg-secondary-fixed text-secondary"
                            : angle.status === "blur"
                            ? "bg-error-container text-on-error-container"
                            : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        {angle.badge}
                      </span>
                    </div>

                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-surface-container flex flex-col items-center justify-center">
                      {angle.img ? (
                        <>
                          <img
                            className={`w-full h-full object-cover ${
                              angle.status === "blur"
                                ? "blur-[1.5px] brightness-90"
                                : ""
                            }`}
                            alt={angle.title}
                            src={angle.img}
                          />
                          {angle.status === "pass" && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-secondary text-white flex items-center justify-center">
                              <span className="material-symbols-outlined text-[14px]">
                                check
                              </span>
                            </div>
                          )}
                          {angle.status === "blur" && (
                            <div className="absolute inset-0 bg-error/15 flex items-center justify-center flex-col p-2 text-center">
                              <span className="material-symbols-outlined text-error text-[22px]">
                                warning
                              </span>
                              <span className="text-[10px] font-label-sm text-error font-bold leading-tight mt-0.5">
                                Độ sắc nét thấp (&lt;70%)
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 text-on-surface-variant">
                          <span className="material-symbols-outlined text-[28px] opacity-40">
                            person_search
                          </span>
                          <span className="text-[11px] font-label-sm opacity-60">
                            Nghiêng đầu phải 15°
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-1 left-1.5 font-code-telemetry text-[10px] text-white bg-black/60 px-1.5 rounded">
                        {angle.sub}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => captureAngle(idx)}
                      className={`w-full h-9 rounded-lg font-label-md text-label-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        angle.status === "blur"
                          ? "bg-primary text-on-primary hover:bg-primary-container"
                          : angle.status === "pending"
                          ? "bg-surface-container-highest hover:bg-secondary hover:text-on-secondary text-on-surface"
                          : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {angle.status === "blur" ? "replay" : "photo_camera"}
                      </span>
                      <span>
                        {angle.status === "pass"
                          ? "Chụp lại góc này"
                          : angle.status === "blur"
                          ? "Chụp lại ngay"
                          : "Bắt đầu chụp"}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Auditing Reference Matrix */}
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  policy
                </span>
                <span className="font-title-md text-title-md font-bold text-on-surface">
                  Bảng minh họa các trạng thái kiểm duyệt AI của hệ thống
                </span>
              </div>
              <span className="font-code-telemetry text-label-sm text-on-surface-variant">
                Quy chuẩn ISO/IEC 19794-5
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-lg bg-surface-container-low flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[16px]">
                    check_circle
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md font-bold text-secondary">
                    Hợp lệ (Đạt chuẩn)
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Gương mặt rõ nét, đủ ánh sáng, độ tin cậy trích xuất &gt;
                    95%.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[16px]">
                    blur_on
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md font-bold text-on-surface">
                    Mờ / Không rõ nét
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Vui lòng chụp lại, độ tương phản và sắc nét cảm biến quá
                    thấp.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[16px]">
                    no_accounts
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md font-bold text-error">
                    Không thấy mặt
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Không phát hiện khuôn mặt bên trong khung ngắm cảm biến.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[16px]">
                    group
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md font-bold text-error">
                    Trùng người khác
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Cảnh báo trùng khớp 98% với nhân sự khác đã có trong hệ
                    thống.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low flex items-start gap-2.5 md:col-span-2 lg:col-span-2">
                <div className="w-7 h-7 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[16px]">
                    security_update_warning
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-label-md text-label-md font-bold text-error">
                      Nghi giả mạo (Anti-Spoofing Level 2)
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-code-telemetry bg-error text-white">
                      CHẶN LƯU
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Phát hiện màn hình điện thoại, ảnh in giấy hoặc mặt nạ
                    silicon tái tạo cử chỉ.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
