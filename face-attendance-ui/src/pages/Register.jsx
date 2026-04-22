import { useEffect, useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { getUsers, createUser, updateUser, deleteUser, registerFace, clearFaces } from "../api";

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
  const [users,   setUsers]   = useState([]);
  const [form,    setForm]    = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [toast,   setToast]   = useState(null);
  const [modal,   setModal]   = useState(null);
  const [count,   setCount]   = useState(0);
  const [busy,    setBusy]    = useState(false);
  const webcamRef = useRef(null);
  const fileRef   = useRef(null);
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
      setForm(EMPTY); setEditing(null); load();
    } catch (err) {
      flash(err.response?.data?.detail || err.message, false);
    }
  };

  const startEdit = (u) => {
    setEditing(u.id);
    setForm({ name: u.name, code: u.code, group: u.group||"", email: u.email||"", phone: u.phone||"" });
  };

  const del = async (id) => {
    if (!confirm("Xóa người dùng này?")) return;
    await deleteUser(id); flash("Đã xóa người dùng"); load();
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
    } catch { flash("Không detect được mặt, thử lại", false); }
    finally { setBusy(false); }
  }, [modal, count]);

  const uploadFile = async (e) => {
    const f = e.target.files[0];
    if (!f || !fileUser) return;
    try {
      await registerFace(fileUser, f);
      flash("Đã thêm ảnh khuôn mặt"); load();
    } catch (err) { flash(err.response?.data?.detail || err.message, false); }
    e.target.value = "";
  };

  const fields = [
    ["name",  "Họ tên",        true ],
    ["code",  "Mã số",         true ],
    ["group", "Lớp / Phòng ban", false],
    ["email", "Email",         false],
    ["phone", "Số điện thoại", false],
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Đăng ký người dùng</h1>
        <p className="text-white/40 text-sm mt-0.5">Thêm người dùng và đăng ký khuôn mặt để nhận diện</p>
      </div>

      {toast && (
        <div className={`px-4 py-2.5 rounded-lg text-sm border ${
          toast.ok ? "bg-green-500/10 text-green-400 border-green-500/20"
                   : "bg-red-500/10 text-red-400 border-red-500/20"
        }`}>{toast.msg}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Form — bên trái */}
        <div className="lg:col-span-2">
          <form onSubmit={submit} className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-3 sticky top-6">
            <p className="text-sm font-medium text-white/60 pb-1">
              {editing ? "Cập nhật thông tin" : "Thêm người dùng mới"}
            </p>
            {fields.map(([k, ph, req]) => (
              <input key={k} placeholder={ph + (req ? " *" : "")} value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                required={req}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-blue-500/40 transition" />
            ))}
            <div className="flex gap-2 pt-1">
              <button type="submit"
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition">
                {editing ? "Cập nhật" : "Thêm mới"}
              </button>
              {editing && (
                <button type="button" onClick={() => { setEditing(null); setForm(EMPTY); }}
                  className="px-4 py-2.5 bg-white/5 text-white/50 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition">
                  Hủy
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Danh sách — bên phải */}
        <div className="lg:col-span-3">
          <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
              <span className="text-sm font-medium text-white/60">Danh sách ({users.length})</span>
            </div>
            {users.length === 0 ? (
              <div className="text-center py-12 text-white/20 text-sm">Chưa có người dùng nào</div>
            ) : (
              <div className="divide-y divide-white/5">
                {users.map((u) => (
                  <div key={u.id} className="px-4 py-3.5 hover:bg-white/3 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white/80 truncate">{u.name}</p>
                          <span className="text-xs text-white/30 font-mono flex-shrink-0">{u.code}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {u.group && <span className="text-xs text-white/35">{u.group}</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            u.face_count > 0
                              ? "bg-green-500/15 text-green-400"
                              : "bg-white/5 text-white/25"
                          }`}>
                            {u.face_count > 0 ? `${u.face_count} ảnh` : "Chưa có khuôn mặt"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => startEdit(u)}
                          className="px-2.5 py-1 text-xs bg-white/5 text-white/45 rounded-md hover:bg-white/10 transition">
                          Sửa
                        </button>
                        <button onClick={() => { setModal(u); setCount(0); }}
                          className="px-2.5 py-1 text-xs bg-blue-500/15 text-blue-400 rounded-md hover:bg-blue-500/25 transition">
                          Chụp mặt
                        </button>
                        <button onClick={() => { setFileUser(u.id); fileRef.current.click(); }}
                          className="px-2.5 py-1 text-xs bg-white/5 text-white/45 rounded-md hover:bg-white/10 transition">
                          Upload
                        </button>
                        <button onClick={() => { if(confirm("Xóa khuôn mặt?")) clearFaces(u.id).then(()=>{flash("Đã xóa khuôn mặt");load();}); }}
                          className="px-2.5 py-1 text-xs bg-white/5 text-white/30 rounded-md hover:bg-red-500/15 hover:text-red-400 transition">
                          Xóa mặt
                        </button>
                        <button onClick={() => del(u.id)}
                          className="px-2.5 py-1 text-xs bg-white/5 text-white/30 rounded-md hover:bg-red-500/15 hover:text-red-400 transition">
                          Xóa
                        </button>
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

      {/* Modal chụp mặt */}
      {modal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d27] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-semibold text-white">{modal.name}</p>
                <p className="text-xs text-white/35 mt-0.5">
                  {count === 0 ? "Chưa chụp ảnh nào" : `Đã chụp ${count} ảnh`}
                </p>
              </div>
              <button onClick={() => setModal(null)}
                className="text-white/25 hover:text-white transition text-2xl leading-none mt-0.5">×</button>
            </div>

            {/* Progress dots */}
            <div className="flex gap-1.5 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < count ? "bg-blue-500" : "bg-white/10"}`} />
              ))}
            </div>

            <div className="rounded-xl overflow-hidden bg-black mb-4 aspect-video">
              <Webcam ref={webcamRef} screenshotFormat="image/jpeg"
                videoConstraints={{ width: 480, height: 360, deviceId: deviceId || undefined }}
                className="w-full h-full object-cover" />
            </div>

            {devices.length > 1 && (
              <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-3 focus:outline-none">
                {devices.map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId} className="bg-[#1a1d27]">
                    {d.label || `Camera ${i+1}`}
                  </option>
                ))}
              </select>
            )}

            <div className="flex gap-2">
              <button onClick={capture} disabled={busy}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition">
                {busy ? "Đang xử lý..." : "Chụp ảnh"}
              </button>
              <button onClick={() => setModal(null)}
                className="px-5 py-2.5 bg-white/5 text-white/45 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition">
                Đóng
              </button>
            </div>
            <p className="text-xs text-white/20 text-center mt-3">
              Chụp 5 ảnh từ các góc: thẳng, trái, phải, ngẩng, cúi
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
