import { useEffect, useState } from "react";
import { getUsers, clearFaces } from "../api";

const CONSENT_LOGS = [
  {
    code: "NV001",
    initials: "VA",
    name: "Nguyễn Văn A",
    version: "Consent Form v2.1",
    timestamp: "20/01/2024 09:12:30",
    source: "Kiosk Sảnh A (192.168.1.42)",
    status: "signed",
  },
  {
    code: "NV014",
    initials: "TB",
    name: "Trần Thị B",
    version: "Consent Form v2.1",
    timestamp: "15/02/2024 14:05:12",
    source: "Web Admin HR (10.0.12.89)",
    status: "signed",
  },
  {
    code: "NV045",
    initials: "QN",
    name: "Phạm Quỳnh Như",
    version: "Consent Form v2.1",
    timestamp: "22/02/2024 10:00:00",
    source: "Web Admin HR (10.0.12.92)",
    status: "declined",
  },
];

export default function PrivacySettings() {
  const [rawImageStore, setRawImageStore] = useState(false);
  const [retention, setRetention] = useState("employed-retention");
  const [users, setUsers] = useState([]);
  const [selectedPurgeUser, setSelectedPurgeUser] = useState(
    "NV032 - Lê Hoàng Nam"
  );
  const [confirmOpen, setConfirmOpen] = useState(true);
  const [toast, setToast] = useState("");

  useEffect(() => {
    getUsers()
      .then((r) => {
        if (r.data?.length) {
          setUsers(r.data);
          setSelectedPurgeUser(`${r.data[0].code} - ${r.data[0].name}`);
        }
      })
      .catch(() => {});
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const handlePurge = async () => {
    const matched = users.find((u) =>
      selectedPurgeUser.startsWith(u.code || "")
    );
    try {
      if (matched) {
        await clearFaces(matched.id);
      }
    } catch {}
    setConfirmOpen(false);
    showToast(
      `Đã thực thi yêu cầu xóa vĩnh viễn vector của ${selectedPurgeUser} thành công.`
    );
  };

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-code-telemetry text-code-telemetry">
              QUẢN TRỊ QUYỀN RIÊNG TƯ &amp; DỮ LIỆU
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-secondary font-label-sm text-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              Tuân thủ Nghị định 13/2023/NĐ-CP &amp; ISO 27701
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Cài đặt Quyền riêng tư &amp; Tuân thủ Dữ liệu Sinh trắc học
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl">
            Quản lý vòng đời dữ liệu nhận diện khuôn mặt, cấu hình chính sách mã
            hóa embedding và theo dõi nhật ký chấp thuận xử lý dữ liệu cá nhân.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() =>
              showToast("Đã lưu cấu hình chính sách quyền riêng tư")
            }
            className="h-11 px-5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg flex items-center gap-2 shadow-xs hover:bg-primary-container transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>Lưu cấu hình</span>
          </button>
        </div>
      </div>

      {/* 4 Compliance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-8">
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Trạng thái mã hóa
            </span>
            <span className="material-symbols-outlined text-secondary text-[22px]">
              lock
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md text-on-surface">
              AES-256 GCM
            </span>
            <span className="font-label-sm text-label-sm text-secondary pt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">
                check_circle
              </span>
              Vectorized &amp; Hash Salted
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Tỷ lệ đồng thuận
            </span>
            <span className="material-symbols-outlined text-secondary text-[22px]">
              fact_check
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md text-on-surface">
              97.8%
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant pt-1">
              142/150 nhân sự đã ký số
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Lưu trữ ảnh raw
            </span>
            <span className="material-symbols-outlined text-error text-[22px]">
              no_photography
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md text-error">
              {rawImageStore ? "ĐANG BẬT" : "VÔ HIỆU HÓA"}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant pt-1">
              Zero-Image Storage Policy
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Kỳ thanh lọc tự động
            </span>
            <span className="material-symbols-outlined text-secondary text-[22px]">
              auto_delete
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md text-on-surface">
              30 Ngày
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant pt-1">
              Kể từ khi nhân sự thôi việc
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* Section 1: Raw Image Storage Policy */}
        <section className="bg-surface-container-lowest rounded-xl p-7 border border-outline-variant/40 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface">
                <span className="material-symbols-outlined text-[24px]">
                  visibility_off
                </span>
              </div>
              <div>
                <h2 className="font-title-lg text-title-lg text-on-surface">
                  1. Cấu hình lưu trữ hình ảnh check-in
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Quy định cách thức hệ thống biên dịch và lưu vết khuôn mặt từ
                  các Kiosk chấm công
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-code-telemetry text-code-telemetry">
              Nghị định 13 - Điều 19 &amp; 20
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2 items-start">
            <div className="lg:col-span-7 flex flex-col gap-5">
              <div className="flex items-start justify-between p-4 rounded-xl bg-surface-container-low">
                <div className="flex flex-col gap-1 pr-6">
                  <span className="font-title-md text-title-md text-on-surface">
                    Lưu ảnh thực tế khi check-in
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Nếu kích hoạt, camera sẽ ghi lại hình ảnh chụp ban đầu cùng
                    với timestamp vào máy chủ lưu trữ.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none mt-1">
                  <input
                    checked={rawImageStore}
                    onChange={(e) => setRawImageStore(e.target.checked)}
                    className="sr-only peer"
                    type="checkbox"
                  />
                  <div className="w-14 h-8 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary shadow-inner"></div>
                </label>
              </div>

              <div className="p-4 rounded-xl bg-surface-container flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary text-[24px] mt-0.5">
                  security
                </span>
                <div className="flex flex-col gap-1">
                  <span className="font-label-lg text-label-lg text-on-surface">
                    Tiêu chuẩn kỹ thuật: Trích xuất Vector Toán học
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Khi tắt: Hệ thống chỉ trích xuất và lưu trữ vector đặc trưng
                    toán học (
                    <strong className="text-on-surface">
                      Facial Embedding 512 chiều mã hóa AES-256
                    </strong>
                    ), hoàn toàn không lưu trữ ảnh chụp thực tế của nhân viên
                    trên máy chủ.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-4 p-5 rounded-xl bg-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface text-[20px]">
                  timelapse
                </span>
                <span className="font-title-md text-title-md text-on-surface">
                  Thời gian lưu trữ dữ liệu khuôn mặt
                </span>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <label className="font-label-md text-label-md text-on-surface-variant">
                  Chính sách thanh trừng dữ liệu
                </label>
                <select
                  value={retention}
                  onChange={(e) => setRetention(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-xs focus:outline-none cursor-pointer"
                >
                  <option value="employed-retention">
                    Trong suốt thời gian làm việc (Xóa sau 30 ngày nghỉ việc)
                  </option>
                  <option value="custom-12m">Tùy chỉnh: 12 tháng liên tục</option>
                  <option value="custom-24m">Tùy chỉnh: 24 tháng liên tục</option>
                  <option value="gdpr-strict">
                    Nghiêm ngặt: Xóa ngay khi chấm dứt hợp đồng
                  </option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Consent Audit Log */}
        <section className="bg-surface-container-lowest rounded-xl p-7 border border-outline-variant/40 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface">
                <span className="material-symbols-outlined text-[24px]">
                  assignment_turned_in
                </span>
              </div>
              <div>
                <h2 className="font-title-lg text-title-lg text-on-surface">
                  2. Nhật ký đồng ý thu thập sinh trắc học (Consent Audit Log)
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Nhật ký đồng ý thu thập dữ liệu sinh trắc học của nhân viên
                  theo Điều 9 Nghị định 13/2023/NĐ-CP
                </p>
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto rounded-xl">
            <table className="w-full text-left font-body-md text-body-md">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant font-label-md text-label-md">
                  <th className="py-3.5 px-4 font-semibold">Mã NV</th>
                  <th className="py-3.5 px-4 font-semibold">Họ và tên</th>
                  <th className="py-3.5 px-4 font-semibold">
                    Phiên bản thỏa thuận
                  </th>
                  <th className="py-3.5 px-4 font-semibold">
                    Thời điểm xác nhận
                  </th>
                  <th className="py-3.5 px-4 font-semibold">
                    Địa chỉ IP / Kiosk
                  </th>
                  <th className="py-3.5 px-4 font-semibold">
                    Trạng thái chữ ký số
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high">
                {CONSENT_LOGS.map((row) => (
                  <tr
                    key={row.code}
                    className="hover:bg-surface-container-low transition-colors"
                  >
                    <td className="py-4 px-4 font-code-telemetry text-code-telemetry font-bold text-on-surface">
                      {row.code}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center font-bold text-secondary text-label-sm">
                          {row.initials}
                        </div>
                        <span className="font-title-md text-title-md text-on-surface">
                          {row.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-code-telemetry text-code-telemetry text-on-surface-variant">
                      {row.version}
                    </td>
                    <td className="py-4 px-4 font-code-telemetry text-code-telemetry text-on-surface-variant">
                      {row.timestamp}
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded bg-surface-container text-on-surface font-code-telemetry text-code-telemetry">
                        {row.source}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {row.status === "signed" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6f7ef] text-[#008055] font-label-sm text-label-sm">
                          <span className="material-symbols-outlined text-[16px]">
                            verified
                          </span>
                          Đã ký số xác nhận
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff4e5] text-[#b25e00] font-label-sm text-label-sm">
                          <span className="material-symbols-outlined text-[16px]">
                            gpp_maybe
                          </span>
                          Từ chối thu thập (Sử dụng PIN)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Right to be Forgotten / Danger Zone */}
        <section className="bg-surface-container-lowest rounded-xl p-7 border border-outline-variant/40 shadow-xs">
          <div className="flex items-center gap-3 pb-6">
            <div className="w-10 h-10 rounded-xl bg-error-container text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">
                warning
              </span>
            </div>
            <div>
              <h2 className="font-title-lg text-title-lg text-error">
                Quyền được lãng quên — Xóa vĩnh viễn dữ liệu sinh trắc học
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Xử lý yêu cầu thu hồi sự đồng thuận hoặc xóa dữ liệu theo Điều
                16 Nghị định 13/2023/NĐ-CP (Right to be Forgotten)
              </p>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-surface-container-low flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col gap-2 flex-1 max-w-lg">
              <label className="font-label-lg text-label-lg text-on-surface">
                Tìm chọn nhân viên cần xóa dữ liệu
              </label>
              <select
                value={selectedPurgeUser}
                onChange={(e) => setSelectedPurgeUser(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-xs focus:outline-none cursor-pointer"
              >
                {users.length > 0 ? (
                  users.map((u) => (
                    <option key={u.id} value={`${u.code} - ${u.name}`}>
                      {u.code} - {u.name} ({u.group || "Kỹ thuật"})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="NV032 - Lê Hoàng Nam">
                      NV032 - Lê Hoàng Nam (Phòng Kỹ thuật R&amp;D)
                    </option>
                    <option value="NV019 - Đỗ Thành Long">
                      NV019 - Đỗ Thành Long (Kế toán)
                    </option>
                    <option value="NV088 - Mai Phương Thảo">
                      NV088 - Mai Phương Thảo (Marketing)
                    </option>
                  </>
                )}
              </select>
            </div>

            <button
              onClick={() => setConfirmOpen(true)}
              className="h-11 px-6 rounded-xl bg-error text-on-error font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-xs hover:opacity-90 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                delete_forever
              </span>
              <span>Xóa dữ liệu khuôn mặt</span>
            </button>
          </div>

          {confirmOpen && (
            <div className="mt-6 p-6 rounded-xl bg-error-container/40 flex flex-col gap-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-error text-[28px]">
                    crisis_alert
                  </span>
                  <div>
                    <h3 className="font-headline-md text-headline-md text-on-error-container tracking-tight">
                      Xác nhận xóa vĩnh viễn vector khuôn mặt của{" "}
                      {selectedPurgeUser}?
                    </h3>
                    <p className="font-label-sm text-label-sm text-error font-semibold">
                      Cảnh báo nguy cơ bảo mật cấp 1
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    close
                  </span>
                </button>
              </div>

              <div className="p-4 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md leading-relaxed shadow-xs">
                <span className="font-semibold text-error">
                  Hành động này không thể hoàn tác.
                </span>{" "}
                Mọi vector nhúng sinh trắc học của nhân viên trên các camera
                Kiosk sẽ bị xóa sạch lập tức. Nhân viên sẽ phải chấm công bằng
                mã PIN.
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-1">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="w-full sm:w-auto h-11 px-6 rounded-xl bg-surface-container-lowest text-on-surface font-label-lg text-label-lg shadow-xs hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handlePurge}
                  className="w-full sm:w-auto h-11 px-6 rounded-xl bg-error text-on-error font-label-lg text-label-lg shadow-xs hover:bg-on-error-container transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    verified
                  </span>
                  <span>Xác nhận XÓA VĨNH VIỄN</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-inverse-surface text-inverse-on-surface px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3">
          <span className="material-symbols-outlined text-tertiary-fixed-dim text-[20px]">
            check_circle
          </span>
          <span className="font-body-md text-body-md">{toast}</span>
        </div>
      )}
    </div>
  );
}
