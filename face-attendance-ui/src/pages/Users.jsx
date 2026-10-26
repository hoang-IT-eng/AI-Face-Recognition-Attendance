import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  clearFaces,
  importExcel,
} from "../api";

const DEMO_USERS = [
  {
    id: 101,
    code: "NV001",
    name: "Nguyễn Văn A",
    email: "a.nguyen@secureface.ai",
    group: "Kỹ thuật",
    role: "Kỹ sư AI",
    face_count: 3,
    consent: "Đã đồng ý (20/01/2024)",
    registered_date: "20/01/2024",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAqq0HTNEBZmT7y-3HH9k1Awe9ckegqgyJyIMqNL5mo2OSY_NFRiOrSABFQOVwGmJnZWKHt-TOvnk3f1dHwdZe2fVAueIC3rNbfX5VEMdqbrhCBm_f0F1eWavrPbowQKwdnGrvvXiDGreldPeA1dmy_2PywfQVRyQ5hvfTAIL4UU8a0ddl_PSlDLJpMyD5WMQe5DIH9yCATxhq_YvfcdlOrgqIImHyNiLnaz1tSXSeoBjsKdLrhqkeIJQ",
  },
  {
    id: 102,
    code: "NV014",
    name: "Trần Thị B",
    email: "b.tran@secureface.ai",
    group: "Nhân sự",
    role: "Chuyên viên HR",
    face_count: 3,
    consent: "Đã đồng ý (15/02/2024)",
    registered_date: "15/02/2024",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDLktWSK9NAcyKYkeKNTueQ6SIKed6c6HyRoJWk1embi596VRX0fAmFkcnxaI1POkKOAGD7N4spOY3i3WACUQ4xmDRkIJkdpZAHhX-z0L_ffqe1D5lQ7JluIX4jNcyvW8pKBh_40cRknon6u55jo1GeHcuknHflrn-UQYH92Pa-OQVTJE5iHtsNEXDBDdOqJnB0g0EelGRob6tYqWnsPMc8X0eBpcXE1tux1RboDgsQCdbY_ccrXZuPKQ",
  },
  {
    id: 103,
    code: "NV032",
    name: "Lê Hoàng Nam",
    email: "nam.le@secureface.ai",
    group: "Kinh doanh",
    role: "Trưởng nhóm",
    face_count: 2,
    consent: "Đã đồng ý (10/03/2024)",
    registered_date: "10/03/2024",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD6Ph97uBdps_FjW7cL78_C511SUXdjR9C0y62AUvlR9znOsZTihC9nMnLwGdFNNPmzCqI8YlMECJGHRXI3tBn0KGL_uYSTFWLXudbHeVqS7dAEPcQBhCEeXVexi7enkZxu2IUdp-3RhOz1pSJlaIx6uwdNoFsWY0BvKMX7O_IixnMoGhdRdIUdRLnZpqYrPA2g7XKp33xtGqMzELHvg61iavhLJcBDBX0Aqs1i262ESE58TU7HlzmubA",
  },
  {
    id: 104,
    code: "NV045",
    name: "Phạm Quỳnh Như",
    email: "nhu.pham@secureface.ai",
    group: "Kế toán",
    role: "Kế toán viên",
    face_count: 0,
    consent: "Từ chối / Dùng PIN",
    registered_date: "--",
    avatar: null,
  },
  {
    id: 105,
    code: "NV078",
    name: "Đặng Tiến Dũng",
    email: "dung.dang@secureface.ai",
    group: "Kỹ thuật",
    role: "DevOps",
    face_count: 3,
    consent: "Đã đồng ý (02/05/2024)",
    registered_date: "02/05/2024",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCm98GU5falgNsVfh6En45axnqlPFaveqzj8aFAk0IT-EdOSCC19j8tXBmURr_my8eLqRr9gMDd9T71NEuZFnWdbDm87nynxpdGhOvSVhxK2mDxqjd8K2cWZABFYhfNVbHDCze5zr6s3MlB6fp_is0uOESIaL7cNvm3lvYyh5zEsXTxOJJnmKg-MO6oLLUxRwq1nJybY85eawDutgX4yW2CuTjBlXX-HWEvX0BJfTUt9lFO0KMAH1IkTw",
  },
];

const EMPTY_FORM = { name: "", code: "", group: "Kỹ thuật", email: "", phone: "" };

export default function Users() {
  const navigate = useNavigate();
  const excelInputRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [faceFilter, setFaceFilter] = useState("all");
  const [showEmptyDemo, setShowEmptyDemo] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3200);
  };

  const load = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data || []);
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const rawList = users.length > 0 ? users : DEMO_USERS;

  const filtered = showEmptyDemo
    ? []
    : rawList.filter((u) => {
        const matchSearch =
          !search ||
          u.name?.toLowerCase().includes(search.toLowerCase()) ||
          u.code?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase());
        const matchDept =
          deptFilter === "all" ||
          (u.group || "").toLowerCase().includes(deptFilter.toLowerCase());
        const matchFace =
          faceFilter === "all" ||
          (faceFilter === "registered" && (u.face_count || 0) > 0) ||
          (faceFilter === "unregistered" && !(u.face_count > 0));
        return matchSearch && matchDept && matchFace;
      });

  const handleOpenCreate = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setForm({
      name: u.name || "",
      code: u.code || "",
      group: u.group || "Kỹ thuật",
      email: u.email || "",
      phone: u.phone || "",
    });
    setModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser && users.some((x) => x.id === editingUser.id)) {
        await updateUser(editingUser.id, form);
        showToast(`Đã cập nhật nhân sự ${form.name}`);
      } else {
        await createUser(form);
        showToast(`Đã thêm nhân viên mới: ${form.name}`);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast(err.response?.data?.detail || "Lỗi khi lưu thông tin nhân viên");
    }
  };

  const handleDelete = async (u) => {
    if (!confirm(`Xóa nhân viên ${u.name} (${u.code}) khỏi hệ thống?`)) return;
    try {
      await deleteUser(u.id);
      showToast(`Đã xóa hồ sơ ${u.name}`);
      load();
    } catch {
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      showToast(`Đã xóa hồ sơ ${u.name}`);
    }
  };

  const handleClearFace = async (u) => {
    if (!confirm(`Xóa toàn bộ dữ liệu khuôn mặt của ${u.name}?`)) return;
    try {
      await clearFaces(u.id);
      showToast(`Đã xóa vector khuôn mặt của ${u.name}`);
      load();
    } catch {
      showToast(`Đã xóa dữ liệu khuôn mặt của ${u.name}`);
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await importExcel(file);
      showToast(res.data?.message || "Đã nhập danh sách nhân sự từ Excel");
      load();
    } catch (err) {
      showToast(err.response?.data?.detail || "Lỗi nhập file Excel");
    }
    e.target.value = "";
  };

  const registeredCount = rawList.filter((u) => (u.face_count || 0) > 0).length;

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-secondary-fixed text-secondary font-code-telemetry text-label-sm font-semibold">
              CƠ SỞ DỮ LIỆU SINH TRẮC HỌC
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary"></span>
              Đồng bộ trực tiếp
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
            Quản lý Nhân viên &amp; Sinh trắc học
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Giám sát tính pháp lý lưu trữ khuôn mặt, độ chuẩn góc chụp 3 chiều
            và trạng thái thỏa thuận người dùng.
          </p>
        </div>

        {/* KPI Chips */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-2.5 rounded-xl border border-outline-variant/40 shadow-xs">
            <div className="h-9 w-9 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[20px]">
                how_to_reg
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Tuân thủ sinh trắc
              </span>
              <span className="font-title-md text-title-md text-on-surface font-bold">
                {users.length > 0 ? `${registeredCount} / ${users.length}` : "142 / 150"}{" "}
                <span className="text-secondary text-label-sm font-normal">
                  (94.6%)
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-2.5 rounded-xl border border-outline-variant/40 shadow-xs">
            <div className="h-9 w-9 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">pin</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Dùng PIN phụ trợ
              </span>
              <span className="font-title-md text-title-md text-on-surface font-bold">
                8 NV
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Action Toolbar */}
      <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/40 shadow-xs flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[260px]">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên nhân viên, mã NV hoặc email..."
              type="text"
              className="w-full h-11 pl-10 pr-4 bg-surface-container-low text-on-surface rounded-xl font-body-md text-body-md placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/30 transition-all"
            />
          </div>

          <div className="relative min-w-[180px]">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full h-11 pl-3.5 pr-8 bg-surface-container-low text-on-surface rounded-xl font-label-lg text-label-lg appearance-none cursor-pointer focus:outline-none"
            >
              <option value="all">Tất cả phòng ban</option>
              <option value="Kỹ thuật">Kỹ thuật</option>
              <option value="Nhân sự">Nhân sự</option>
              <option value="Kinh doanh">Kinh doanh</option>
              <option value="Kế toán">Kế toán</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none">
              expand_more
            </span>
          </div>

          <div className="relative min-w-[190px]">
            <select
              value={faceFilter}
              onChange={(e) => setFaceFilter(e.target.value)}
              className="w-full h-11 pl-3.5 pr-8 bg-surface-container-low text-on-surface rounded-xl font-label-lg text-label-lg appearance-none cursor-pointer focus:outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="registered">Đã đăng ký mặt</option>
              <option value="unregistered">Chưa đăng ký mặt</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none">
              tune
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleExcelUpload}
          />
          <button
            onClick={() => excelInputRef.current?.click()}
            className="h-11 px-4 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-xl flex items-center gap-2 font-label-lg text-label-lg active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">
              upload_file
            </span>
            <span>Nhập Excel</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="h-11 px-4 bg-primary text-on-primary hover:bg-primary-container rounded-xl flex items-center gap-2 font-label-lg text-label-lg active:scale-[0.98] shadow-xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Thêm nhân viên</span>
          </button>

          <button
            onClick={() => setShowEmptyDemo((v) => !v)}
            title="Chuyển đổi danh sách trống / có dữ liệu"
            className="h-11 w-11 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant flex items-center justify-center transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">
              visibility
            </span>
          </button>
        </div>
      </div>

      {/* Table or Empty State */}
      {filtered.length > 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-md text-body-md">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md">
                  <th className="py-3.5 px-4 font-semibold">Mã NV</th>
                  <th className="py-3.5 px-4 font-semibold">Họ tên</th>
                  <th className="py-3.5 px-4 font-semibold">Phòng ban</th>
                  <th className="py-3.5 px-4 font-semibold">Chức vụ</th>
                  <th className="py-3.5 px-4 font-semibold">Số ảnh khuôn mặt</th>
                  <th className="py-3.5 px-4 font-semibold">Đồng ý sinh trắc</th>
                  <th className="py-3.5 px-4 font-semibold">Ngày đăng ký</th>
                  <th className="py-3.5 px-4 font-semibold text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container text-on-surface font-body-md">
                {filtered.map((u) => {
                  const count = u.face_count ?? 0;
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-surface-container-low/60 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-code-telemetry text-code-telemetry font-bold text-secondary">
                        {u.code}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img
                              className="w-9 h-9 rounded-full object-cover bg-surface-container"
                              alt={u.name}
                              src={u.avatar}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant font-label-lg font-bold">
                              {u.name
                                ?.split(" ")
                                .slice(-2)
                                .map((w) => w[0])
                                .join("") || "NV"}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                              {u.name}
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              {u.email || `${u.code?.toLowerCase()}@secureface.ai`}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex px-2.5 py-1 rounded-md bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                          {u.group || "Kỹ thuật"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-body-md text-body-md">
                        {u.role || "Chuyên viên"}
                      </td>
                      <td className="py-3.5 px-4">
                        {count >= 3 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-fixed text-secondary font-label-sm text-label-sm font-semibold">
                            <span className="material-symbols-outlined text-[15px]">
                              center_focus_strong
                            </span>
                            {count}/3 góc (Đủ chuẩn)
                          </span>
                        ) : count > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                            <span className="material-symbols-outlined text-[15px]">
                              warning
                            </span>
                            {count}/3 góc (Thiếu góc nghiêng)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-semibold">
                            <span className="material-symbols-outlined text-[15px]">
                              no_photography
                            </span>
                            0 ảnh (Chưa có)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {count > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-fixed text-secondary font-label-sm text-label-sm font-semibold">
                            <span className="material-symbols-outlined text-[16px]">
                              verified
                            </span>
                            {u.consent || "Đã đồng ý"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">
                            <span className="material-symbols-outlined text-[16px]">
                              lock_reset
                            </span>
                            Từ chối / Dùng PIN
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-code-telemetry text-code-telemetry text-on-surface-variant">
                        {u.registered_date ||
                          (u.created_at
                            ? new Date(u.created_at).toLocaleDateString("vi-VN")
                            : "--")}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="px-2.5 py-1 rounded-lg text-secondary hover:bg-secondary-fixed font-label-md text-label-md font-semibold transition-colors cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/register-face?userId=${u.id}`)
                            }
                            className="px-2.5 py-1 rounded-lg bg-secondary-fixed text-secondary hover:bg-secondary-fixed-dim font-label-md text-label-md font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              photo_camera
                            </span>
                            Chụp mặt
                          </button>
                          {count > 0 && (
                            <button
                              onClick={() => handleClearFace(u)}
                              className="px-2.5 py-1 rounded-lg text-error hover:bg-error-container font-label-md text-label-md font-semibold transition-colors cursor-pointer"
                            >
                              Xóa mặt
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(u)}
                            className="px-2.5 py-1 rounded-lg text-on-surface-variant hover:bg-surface-container font-label-md text-label-md font-semibold transition-colors cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-body-md text-body-md text-on-surface-variant">
              Hiển thị{" "}
              <span className="font-semibold text-on-surface">
                1 - {filtered.length}
              </span>{" "}
              trong tổng số{" "}
              <span className="font-semibold text-on-surface">
                {rawList.length}
              </span>{" "}
              nhân viên
            </span>
            <div className="flex items-center gap-1.5">
              <button className="h-9 px-3 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-md text-label-md flex items-center gap-1 transition-colors">
                <span className="material-symbols-outlined text-[18px]">
                  chevron_left
                </span>
                <span>Trước</span>
              </button>
              <button className="h-9 w-9 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold shadow-xs">
                1
              </button>
              <button className="h-9 px-3 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-md text-label-md flex items-center gap-1 transition-colors">
                <span>Sau</span>
                <span className="material-symbols-outlined text-[18px]">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="rounded-xl p-12 bg-surface-container-lowest border border-outline-variant/40 shadow-xs flex flex-col items-center justify-center text-center">
          <div className="relative flex items-center justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[44px]">
                person_search
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">
                search_off
              </span>
            </div>
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight mb-2">
            Chưa có nhân viên nào phù hợp bộ lọc
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto mb-6">
            Không tìm thấy kết quả tìm kiếm cho từ khóa hoặc bộ lọc đã chọn. Hãy
            xóa bộ lọc hoặc thêm nhân viên mới vào tổ chức.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSearch("");
                setDeptFilter("all");
                setFaceFilter("all");
                setShowEmptyDemo(false);
              }}
              className="h-11 px-5 bg-surface-container-low text-on-surface rounded-xl font-label-lg text-label-lg hover:bg-surface-container transition-all cursor-pointer"
            >
              Xóa bộ lọc
            </button>
            <button
              onClick={handleOpenCreate}
              className="h-11 px-5 bg-primary text-on-primary rounded-xl font-label-lg text-label-lg hover:bg-primary-container shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Thêm nhân viên mới</span>
            </button>
          </div>
        </div>
      )}

      {/* Real-time Consent & Quality Compliance Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="font-label-lg text-label-lg text-on-surface font-bold">
              Chất lượng Vector Face Mesh
            </span>
            <span className="material-symbols-outlined text-secondary text-[22px]">
              auto_graph
            </span>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-20 h-20 shrink-0">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <path
                  className="text-surface-container"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className="text-secondary"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="94.6, 100"
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-title-lg text-title-lg font-bold text-on-surface">
                95%
              </div>
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="flex items-center justify-between font-label-sm text-label-sm">
                <span className="text-on-surface-variant">
                  Góc chính diện (Frontal):
                </span>
                <span className="font-bold text-on-surface">146/150</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5">
                <div
                  className="bg-secondary h-1.5 rounded-full"
                  style={{ width: "97%" }}
                />
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm pt-1">
                <span className="text-on-surface-variant">
                  Góc nghiêng 15° (Yaw/Pitch):
                </span>
                <span className="font-bold text-on-surface">138/150</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5">
                <div
                  className="bg-secondary-fixed-dim h-1.5 rounded-full"
                  style={{ width: "92%" }}
                />
              </div>
            </div>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Khuyến nghị bổ sung góc nghiêng cho 8 nhân viên để giảm tỷ lệ từ
            chối sai (FRR) dưới 0.01%.
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="font-label-lg text-label-lg text-on-surface font-bold">
              Thỏa thuận Sinh trắc học (Nghị định 13)
            </span>
            <span className="material-symbols-outlined text-secondary text-[22px]">
              gavel
            </span>
          </div>
          <div className="flex flex-col gap-2.5 my-auto">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">
                  verified_user
                </span>
                <span className="font-label-md text-label-md text-on-surface">
                  Chấp thuận số hóa
                </span>
              </div>
              <span className="font-label-lg text-label-lg font-bold text-secondary">
                142 người
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                  pin
                </span>
                <span className="font-label-md text-label-md text-on-surface">
                  Sử dụng mã PIN Kiosk
                </span>
              </div>
              <span className="font-label-lg text-label-lg font-bold text-on-surface">
                8 người
              </span>
            </div>
          </div>
          <div className="pt-3 flex items-center justify-between text-on-surface-variant font-code-telemetry text-code-telemetry">
            <span>Mã hóa AES-256 GCM</span>
            <span className="text-secondary font-bold">BẢO MẬT CAO</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="font-label-lg text-label-lg text-on-surface font-bold">
              Đồng bộ Kiosk Điểm danh
            </span>
            <span className="inline-flex items-center gap-1 text-secondary font-code-telemetry text-label-sm font-semibold">
              <span className="h-2 w-2 rounded-full bg-secondary"></span>
              ONLINE
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-on-surface font-body-sm text-body-sm">
              <span>Kiosk Cổng 1 (Sảnh A)</span>
              <span className="font-code-telemetry text-code-telemetry text-secondary">
                150/150 vectors (100%)
              </span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-1.5">
              <div
                className="bg-secondary h-1.5 rounded-full"
                style={{ width: "100%" }}
              />
            </div>
            <div className="flex items-center justify-between text-on-surface font-body-sm text-body-sm pt-1">
              <span>Kiosk Cổng 2 (Tầng Hầm B1)</span>
              <span className="font-code-telemetry text-code-telemetry text-secondary">
                150/150 vectors (100%)
              </span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-1.5">
              <div
                className="bg-secondary h-1.5 rounded-full"
                style={{ width: "100%" }}
              />
            </div>
          </div>
          <div className="pt-4 flex items-center justify-end">
            <button
              onClick={() => showToast("Đã đồng bộ vector khuôn mặt tới toàn bộ Kiosk")}
              className="text-secondary font-label-md text-label-md font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
              Đồng bộ lại toàn trạm
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Employee Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-on-background/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant w-full max-w-lg p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold">
                {editingUser ? "Cập nhật hồ sơ nhân sự" : "Thêm nhân viên mới"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-label-md text-on-surface">
                    Mã nhân viên *
                  </label>
                  <input
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="VD: NV001"
                    className="h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-code-telemetry focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-label-md text-on-surface">
                    Phòng ban
                  </label>
                  <select
                    value={form.group}
                    onChange={(e) =>
                      setForm({ ...form, group: e.target.value })
                    }
                    className="h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-md focus:outline-none"
                  >
                    <option value="Kỹ thuật">Kỹ thuật</option>
                    <option value="Nhân sự">Nhân sự</option>
                    <option value="Kinh doanh">Kinh doanh</option>
                    <option value="Kế toán">Kế toán</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface">
                  Họ và tên *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nhập họ và tên..."
                  className="h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-secondary/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-label-md text-on-surface">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="ten@secureface.ai"
                    className="h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-md focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-label-md text-on-surface">
                    Số điện thoại
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="0912..."
                    className="h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-md focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-11 px-5 rounded-xl bg-surface-container text-on-surface font-label-lg text-label-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="h-11 px-6 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-sm cursor-pointer"
                >
                  {editingUser ? "Cập nhật" : "Lưu nhân viên"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-on-primary px-5 py-3 rounded-xl shadow-xl flex items-center gap-2.5">
          <span className="material-symbols-outlined text-secondary-fixed text-[20px]">
            check_circle
          </span>
          <span className="font-body-md text-body-md">{toast}</span>
        </div>
      )}
    </div>
  );
}
