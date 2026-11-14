import { useEffect, useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { getUsers, createUser, updateUser, deleteUser, registerFace, clearFaces } from "../api";
import Icon from "../components/Icon";

const EMPTY = { name: "", code: "", group: "", email: "", phone: "" };

function useDevices() {
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((list) => {
      const cams = list.filter((d) => d.kind === "videoinput");
      setDevices(cams);
      const b = cams.find((d) => /integrated|built.?in|facetime|internal/i.test(d.label));
      setDeviceId(b?.deviceId || cams[0]?.deviceId || "");
    });
  }, []);
  return { devices, deviceId, setDeviceId };
}

export default function Register() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const webcamRef = useRef(null);
  const fileRef = useRef(null);
  const [fileUser, setFileUser] = useState(null);
  const { devices, deviceId, setDeviceId } = useDevices();

  const load = () => getUsers().then((r) => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const flash = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      editing ? await updateUser(editing, form) : await createUser(form);
      flash(editing ? "Đã cập nhật thông tin" : "Đã thêm người dùng mới");
      setForm(EMPTY);
      setEditing(null);
      load();
    } catch (err) {
      flash(err.response?.data?.detail || err.message, false);
    }
  };

  const startEdit = (u) => {
    setEditing(u.id);
    setForm({ name: u.name, code: u.code, group: u.group || "", email: u.email || "", phone: u.phone || "" });
  };

  const del = async (id) => {
    if (!confirm("Xóa người dùng này?")) return;
    await deleteUser(id);
    flash("Đã xóa người dùng");
    load();
  };

  const capture = useCallback(async () => {
    if (!webcamRef.current || !modal) return;
    setBusy(true);
    try {
      const src = webcamRef.current.getScreenshot();
      const blob = await (await fetch(src)).blob();
      await registerFace(modal.id, new File([blob], "face.jpg", { type: "image/jpeg" }));
      setCount((c) => c + 1);
      flash(`Đã chụp ${count + 1} ảnh cho ${modal.name}`);
      load();
    } catch {
      flash("Không detect được mặt, thử lại", false);
    } finally {
      setBusy(false);
    }
  }, [modal, count]);

  const uploadFile = async (e) => {
    const f = e.target.files[0];
    if (!f || !fileUser) return;
    try {
      await registerFace(fileUser, f);
      flash("Đã thêm ảnh khuôn mặt");
      load();
    } catch (err) {
      flash(err.response?.data?.detail || err.message, false);
    }
    e.target.value = "";
  };

  const fields = [
    ["name", "Họ tên", true],
    ["code", "Mã số", true],
    ["group", "Lớp / Phòng ban", false],
    ["email", "Email", false],
    ["phone", "Số điện thoại", false],
  ];

  const filtered = users.filter(
    (u) =>
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.code?.includes(search)
  );

  const withFaces = users.filter((u) => u.face_count > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">Quản lý nhân viên</h1>
          <p className="text-on-surface-variant text-sm">
            {users.length} nhân viên • {withFaces} đã đăng ký khuôn mặt
          </p>
        </div>
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg" />
          <input
            placeholder="Tìm tên hoặc mã số..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-4 py-2.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>
      </div>

      {toast && (
        <div
          className={`px-4 py-3 rounded-xl text-sm border flex items-center gap-2 ${
            toast.ok
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-error-container text-error border-error/20"
          }`}
        >
          <Icon name={toast.ok ? "check_circle" : "error"} filled={toast.ok} />
          {toast.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <form
            onSubmit={submit}
            className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4 sticky top-24 shadow-sm"
          >
            <h2 className="font-semibold text-primary flex items-center gap-2">
              <Icon name={editing ? "edit" : "person_add"} />
              {editing ? "Cập nhật thông tin" : "Thêm nhân viên mới"}
            </h2>
            {fields.map(([k, ph, req]) => (
              <div key={k}>
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1 block">
                  {ph}{req && " *"}
                </label>
                <input
                  placeholder={ph}
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  required={req}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-bold hover:opacity-90 transition"
              >
                {editing ? "Cập nhật" : "Thêm mới"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => { setEditing(null); setForm(EMPTY); }}
                  className="px-4 py-2.5 bg-surface-container-high text-on-surface-variant rounded-lg text-sm hover:bg-surface-container transition"
                >
                  Hủy
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <span className="font-semibold text-primary flex items-center gap-2">
                <Icon name="groups" />
                Danh sách ({filtered.length})
              </span>
            </div>
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-on-surface-variant">
                <Icon name="person_off" className="text-4xl mb-2 opacity-40" />
                <p className="text-sm">Chưa có nhân viên nào</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant">
                {filtered.map((u) => (
                  <div key={u.id} className="px-6 py-4 hover:bg-surface-container-low transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center font-bold text-on-primary-container shrink-0">
                          {u.name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-primary truncate">{u.name}</p>
                            <span className="text-xs text-on-surface-variant font-mono bg-surface-container-low px-2 py-0.5 rounded">
                              {u.code}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {u.group && (
                              <span className="text-xs text-on-surface-variant flex items-center gap-1">
                                <Icon name="apartment" className="text-sm" />
                                {u.group}
                              </span>
                            )}
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                                u.face_count > 0
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : "bg-surface-container-high text-on-surface-variant"
                              }`}
                            >
                              <Icon name={u.face_count > 0 ? "face" : "face_retouching_off"} className="text-sm" />
                              {u.face_count > 0 ? `${u.face_count} ảnh khuôn mặt` : "Chưa có khuôn mặt"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                        <ActionBtn icon="edit" label="Sửa" onClick={() => startEdit(u)} />
                        <ActionBtn icon="photo_camera" label="Chụp" primary onClick={() => { setModal(u); setCount(0); }} />
                        <ActionBtn icon="upload" label="Upload" onClick={() => { setFileUser(u.id); fileRef.current.click(); }} />
                        <ActionBtn
                          icon="delete"
                          label="Xóa mặt"
                          onClick={() => {
                            if (confirm("Xóa khuôn mặt?")) clearFaces(u.id).then(() => { flash("Đã xóa khuôn mặt"); load(); });
                          }}
                        />
                        <ActionBtn icon="person_remove" label="Xóa" danger onClick={() => del(u.id)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadFile} />

      {modal && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-bold text-primary text-lg flex items-center gap-2">
                  <Icon name="face" className="text-secondary" />
                  {modal.name}
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {count === 0 ? "Chưa chụp ảnh nào" : `Đã chụp ${count} ảnh`}
                </p>
              </div>
              <button type="button" onClick={() => setModal(null)} className="text-on-surface-variant hover:text-primary text-2xl leading-none">
                ×
              </button>
            </div>

            <div className="flex gap-1.5 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${i < count ? "bg-secondary" : "bg-surface-container-high"}`} />
              ))}
            </div>

            <div className="rounded-2xl overflow-hidden bg-primary-container mb-4 aspect-video relative">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ width: 480, height: 360, deviceId: deviceId || undefined }}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 pointer-events-none">
                <div className="scanning-line" />
              </div>
            </div>

            {devices.length > 1 && (
              <select
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-secondary"
              >
                {devices.map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={capture}
                disabled={busy}
                className="flex-1 py-3 bg-primary text-on-primary rounded-xl text-sm font-bold disabled:opacity-40 hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                <Icon name="photo_camera" />
                {busy ? "Đang xử lý..." : "Chụp ảnh"}
              </button>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-5 py-3 bg-surface-container-high text-on-surface-variant rounded-xl text-sm hover:bg-surface-container transition"
              >
                Đóng
              </button>
            </div>
            <p className="text-xs text-on-surface-variant text-center mt-3">
              Chụp 5 ảnh từ các góc: thẳng, trái, phải, ngẩng, cúi
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon, label, onClick, primary, danger }) {
  const cls = danger
    ? "text-error hover:bg-error-container/30"
    : primary
      ? "text-secondary bg-secondary-container/15 hover:bg-secondary-container/25"
      : "text-on-surface-variant hover:bg-surface-container-high";
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`px-2.5 py-1.5 text-xs rounded-lg transition flex items-center gap-1 ${cls}`}
    >
      <Icon name={icon} className="text-base" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
