import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Webcam from "react-webcam";
import { getUsers, createUser, registerFace } from "../api";
import { getBackendStatus } from "../backendStatus";
import { detectFaceInImage } from "../faceDetect";
import { saveSimCapture } from "../simSync";
import Icon from "../components/Icon";

const INITIAL_ANGLES = [
  {
    key: "straight",
    title: "Góc 1: Thẳng",
    sub: "0° Trực diện",
    status: "pending",
    badge: "CHỜ CHỤP",
    img: null,
  },
  {
    key: "left",
    title: "Góc 2: Trái (15°)",
    sub: "-15° Trái",
    status: "pending",
    badge: "CHỜ CHỤP",
    img: null,
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

  // Báo cho người dùng khi dữ liệu mô phỏng đã đồng bộ xong lên AI thật.
  useEffect(() => {
    const onSynced = () =>
      setStatusBanner(
        "Đã đồng bộ đăng ký lên AI thật ✓ — các góc chụp lúc mô phỏng đã được lưu vào hệ thống."
      );
    window.addEventListener("sf-sim-synced", onSynced);
    return () => window.removeEventListener("sf-sim-synced", onSynced);
  }, []);

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
      setStatusBanner(
        "Cần bật webcam thật hoặc tải ảnh lên để đăng ký khuôn mặt (không dùng ảnh demo)."
      );
      return;
    }
    if (!consent) {
      setStatusBanner("Vui lòng xác nhận đồng ý thu thập sinh trắc học trước.");
      return;
    }

    const shot = webcamRef.current.getScreenshot();
    if (!shot) {
      setStatusBanner("Chưa đọc được hình từ webcam. Hãy kiểm tra quyền camera.");
      return;
    }

    setSubmitting(true);
    // Chế độ mô phỏng (máy chủ AI đang khởi động): kiểm tra khuôn mặt ngay
    // trong trình duyệt và lưu tạm — dữ liệu tự đồng bộ lên AI thật sau.
    if (getBackendStatus() !== "real") {
      try {
        const { face } = await detectFaceInImage(shot);
        if (!face) {
          setAngles((prev) =>
            prev.map((a, i) =>
              i === idx
                ? { ...a, status: "blur", badge: "KHÔNG THẤY MẶT", img: shot }
                : a
            )
          );
          setStatusBanner(
            "Không phát hiện khuôn mặt rõ nét trong khung ngắm."
          );
        } else {
          setAngles((prev) =>
            prev.map((a, i) =>
              i === idx
                ? { ...a, status: "pass", badge: "ĐÃ LƯU", img: shot }
                : a
            )
          );
          saveSimCapture(
            { code: empCode, name: empName, group: dept },
            shot
          );
          setStatusBanner(
            `Đã lưu mô phỏng cho ${angles[idx].title} — sẽ tự đồng bộ lên AI thật khi máy chủ sẵn sàng.`
          );
        }
      } catch {
        setStatusBanner(
          "Chưa tải được bộ phát hiện khuôn mặt trong trình duyệt — vui lòng chờ máy chủ AI khởi động xong rồi thử lại."
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }
    try {
      const uid = await ensureUserExists();
      const blob = await (await fetch(shot)).blob();
      const file = new File([blob], `angle_${idx + 1}.jpg`, {
        type: "image/jpeg",
      });
      await registerFace(uid, file, { consent });
      setAngles((prev) =>
        prev.map((a, i) =>
          i === idx
            ? { ...a, status: "pass", badge: "ĐÃ LƯU", img: shot }
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
    if (!consent) {
      setStatusBanner("Vui lòng xác nhận đồng ý thu thập sinh trắc học trước.");
      e.target.value = "";
      return;
    }
    setSubmitting(true);
    // Chế độ mô phỏng cho ảnh tải lên: kiểm tra mặt trong trình duyệt.
    if (getBackendStatus() !== "real") {
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const { face } = await detectFaceInImage(dataUrl);
        if (!face) {
          setStatusBanner("Ảnh tải lên không phát hiện được khuôn mặt.");
        } else {
          const url = URL.createObjectURL(file);
          setAngles((prev) =>
            prev.map((a, i) =>
              i === activeAngleIdx
                ? { ...a, status: "pass", badge: "ĐÃ LƯU", img: url }
                : a
            )
          );
          saveSimCapture(
            { code: empCode, name: empName, group: dept },
            dataUrl
          );
          setStatusBanner(
            `Đã lưu mô phỏng ảnh cho ${empName} — sẽ tự đồng bộ lên AI thật khi máy chủ sẵn sàng.`
          );
        }
      } catch {
        setStatusBanner(
          "Chưa tải được bộ phát hiện khuôn mặt trong trình duyệt — vui lòng chờ máy chủ AI khởi động xong rồi thử lại."
        );
      } finally {
        setSubmitting(false);
        e.target.value = "";
      }
      return;
    }
    try {
      const uid = await ensureUserExists();
      await registerFace(uid, file, { consent });
      const url = URL.createObjectURL(file);
      setAngles((prev) =>
        prev.map((a, i) =>
          i === activeAngleIdx
            ? { ...a, status: "pass", badge: "ĐÃ LƯU", img: url }
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
          <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md">
            <button
              onClick={() => navigate("/employees")}
              className="hover:text-primary cursor-pointer"
            >
              Nhân viên
            </button>
            <Icon name="chevron_right" className="text-[16px]" />
            <span className="text-on-surface font-title-md text-title-md font-semibold">
              Đăng ký khuôn mặt
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            data-tour="reg-camera"
            onClick={() => setUseLiveCam((v) => !v)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-label-md text-label-md shadow-xs cursor-pointer transition-colors ${
              useLiveCam
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface"
            }`}
          >
            <Icon name="videocam" className="text-[18px]" />
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
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md shadow-xs cursor-pointer"
          >
            <Icon name="upload_file" className="text-[18px] text-on-surface-variant" />
            <span>Tải ảnh từ máy</span>
          </button>
        </div>
      </div>

      {statusBanner && (
        <div className="px-4 py-3 rounded-xl bg-surface-container border border-outline-variant text-on-surface font-label-md text-label-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="info" className="text-on-surface-variant text-[20px]" />
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
          <div
            data-tour="reg-form"
            className="bg-surface-container-lowest rounded-xl p-7 border border-outline-variant/40 shadow-xs flex flex-col gap-5"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                  Thông tin hồ sơ nhân viên
                </h2>
                <span className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container-high text-on-surface-variant">
                  Hồ sơ khuôn mặt
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
                  <Icon name="badge" className="absolute left-3.5 text-on-surface-variant text-[20px]" />
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
                  <Icon name="person" className="absolute left-3.5 text-on-surface-variant text-[20px]" />
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
                  <Icon name="corporate_fare" className="absolute left-3.5 text-on-surface-variant text-[20px]" />
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
                  <Icon name="arrow_drop_down" className="absolute right-3.5 pointer-events-none text-on-surface-variant text-[20px]" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface font-semibold">
                  Ca làm việc mặc định <span className="text-error">*</span>
                </label>
                <div className="relative flex items-center">
                  <Icon name="schedule" className="absolute left-3.5 text-on-surface-variant text-[20px]" />
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
                  <Icon name="arrow_drop_down" className="absolute right-3.5 pointer-events-none text-on-surface-variant text-[20px]" />
                </div>
              </div>

              {/* Guidelines Box */}
              <div className="p-4 bg-surface-container-low rounded-xl flex flex-col gap-2.5 mt-1">
                <div className="flex items-center gap-2 text-on-surface font-label-lg text-label-lg font-bold">
                  <Icon name="verified_user" className="text-on-surface-variant text-[20px]" />
                  <span>Hướng dẫn chụp ảnh đạt chuẩn:</span>
                </div>
                <ul className="flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant pl-1">
                  <li className="flex items-start gap-2.5">
                    <Icon name="check_circle" className="text-[18px] text-on-surface-variant shrink-0 mt-0.5" />
                    <span>
                      Nhìn thẳng trực diện vào ống kính, giữ khoảng cách khoảng{" "}
                      <strong>50 - 70cm</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Icon name="check_circle" className="text-[18px] text-on-surface-variant shrink-0 mt-0.5" />
                    <span>
                      Đảm bảo ánh sáng đồng đều hai bên mặt, tránh ngược sáng
                      cửa sổ mạnh.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Icon name="check_circle" className="text-[18px] text-on-surface-variant shrink-0 mt-0.5" />
                    <span>
                      Bỏ kính râm sẫm màu, khẩu trang y tế hoặc mũ nón che
                      khuất vầng trán.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Consent Checkbox */}
              <div className="pt-1">
                <label
                  data-tour="reg-consent"
                  className="flex items-start gap-3 select-none cursor-pointer p-2.5 rounded-lg hover:bg-surface-container transition-colors"
                >
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
                    data-tour="reg-save"
                    disabled={!consent || validCount === 0 || submitting}
                    onClick={() => {
                      setStatusBanner(
                        `Đã lưu hồ sơ sinh trắc học cho ${empName} (${empCode}) thành công!`
                      );
                      setTimeout(() => navigate("/employees"), 1200);
                    }}
                    className="w-2/3 h-11 bg-primary hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed text-on-primary font-label-lg text-label-lg rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Icon name="save" className="text-[20px]" />
                    <span>LƯU DỮ LIỆU KHUÔN MẶT</span>
                  </button>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant text-center flex items-center justify-center gap-1.5">
                  <Icon name="info" className="text-[16px] text-on-surface-variant" />
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
              <div className="w-10 h-10 rounded-lg bg-surface-container text-on-surface-variant flex items-center justify-center">
                <Icon name="fingerprint" className="text-[22px]" />
              </div>
              <div>
                <div className="font-label-md text-label-md text-on-surface font-bold">
                  Cách dữ liệu được lưu
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">
                  Hệ thống lưu vector đặc trưng trích xuất từ ảnh chụp để đối
                  sánh khi điểm danh.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Webcam Stream & 3-Angle Capture (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md font-bold text-on-surface">
                Webcam trực tiếp
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {useLiveCam ? "Đang bật" : "Đang tắt"}
              </span>
            </div>

            {/* Live Camera Viewport */}
            <div className="relative w-full aspect-video bg-[#101014] rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
              {useLiveCam ? (
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ width: 1280, height: 720 }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70 px-8 text-center">
                  <Icon name="videocam_off" className="text-[40px]" />
                  <span className="font-title-md text-title-md">
                    Đang chờ camera
                  </span>
                  <span className="font-body-md text-body-md text-white/50">
                    Bấm “Bật Webcam thật” hoặc dùng “Tải ảnh từ máy” để bắt đầu
                    chụp.
                  </span>
                </div>
              )}

              {/* Guidance chip */}
              {useLiveCam && (
                <div className="absolute top-4 left-4 z-20 pointer-events-none">
                  <div className="bg-black/70 px-3.5 py-1.5 rounded-lg flex items-center gap-2 text-white font-label-md text-label-md">
                    <Icon name="center_focus_strong" className="text-white/80 text-[18px]" />
                    <span>Đặt khuôn mặt vào khung, giữ thẳng đầu</span>
                  </div>
                </div>
              )}

              {/* Plain face guide */}
              {useLiveCam && (
                <div className="relative z-10 w-56 h-72 rounded-[2rem] border-2 border-white/70 pointer-events-none" />
              )}
            </div>

            {/* 3 Angles Capture Controls */}
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-title-md text-title-md font-bold text-on-surface">
                  Ba góc chụp khuôn mặt
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Tiến độ: {validCount}/3 góc hợp lệ
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {angles.map((angle, idx) => (
                  <div
                    key={angle.key}
                    data-tour={`reg-angle-${idx}`}
                    className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-2.5 relative shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md text-on-surface font-bold">
                        {angle.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${
                          angle.status === "pass"
                            ? "bg-success/10 text-success"
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
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-success text-white flex items-center justify-center">
                              <Icon name="check" className="text-[14px]" />
                            </div>
                          )}
                          {angle.status === "blur" && (
                            <div className="absolute inset-0 bg-error/15 flex items-center justify-center flex-col p-2 text-center">
                              <Icon name="warning" className="text-error text-[22px]" />
                              <span className="text-[10px] font-label-sm text-error font-bold leading-tight mt-0.5">
                                Ảnh mờ — chụp lại
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 text-on-surface-variant">
                          <Icon name="person_search" className="text-[28px] opacity-40" />
                          <span className="text-[11px] font-label-sm opacity-60">
                            Nghiêng đầu phải 15°
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-1 left-1.5 font-label-sm text-[10px] text-white bg-black/60 px-1.5 rounded">
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
                          ? "bg-surface-container-highest hover:bg-surface-container text-on-surface"
                          : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                      }`}
                    >
                      <Icon
                        name={angle.status === "blur" ? "replay" : "photo_camera"}
                        className="text-[16px]"
                      />
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

          {/* Capture-state reference */}
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Icon name="policy" className="text-on-surface-variant text-[20px]" />
              <span className="font-title-md text-title-md font-bold text-on-surface">
                Các trạng thái kiểm tra ảnh chụp
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-lg bg-surface-container-low flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="check_circle" className="text-[16px]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md font-bold text-on-surface">
                    Hợp lệ
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Gương mặt rõ nét, đủ ánh sáng, nhìn rõ cả hai mắt.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="blur_on" className="text-[16px]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md font-bold text-on-surface">
                    Mờ / Không rõ nét
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Ảnh bị mờ hoặc thiếu sáng — vui lòng chụp lại.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="no_accounts" className="text-[16px]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md font-bold text-error">
                    Không thấy mặt
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Không phát hiện được khuôn mặt trong khung hình.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="group" className="text-[16px]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md font-bold text-error">
                    Trùng người khác
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Khuôn mặt trùng khớp với nhân sự khác đã có trong hệ thống.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low flex items-start gap-2.5 md:col-span-2 lg:col-span-2">
                <div className="w-7 h-7 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="security_update_warning" className="text-[16px]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md font-bold text-error">
                    Nghi giả mạo
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Phát hiện nguồn hình ảnh không phải người thật (màn hình
                    điện thoại, ảnh in giấy…). Ảnh sẽ không được lưu.
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
