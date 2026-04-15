import { useEffect, useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { getUsers, createUser, updateUser, deleteUser, registerFace, clearFaces } from "../api";

const EMPTY_FORM = { name: "", code: "", group: "", email: "", phone: "" };

function useDevices() {
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((list) => {
      const cams = list.filter((d) => d.kind === "videoinput");
      setDevices(cams);
      const builtin = cams.find((d) => /integrated|built.?in|facetime|internal/i.test(d.label));
      setDeviceId(builtin?.deviceId || cams[0]?.deviceId || "");
    });
  }, []);
  return { devices, deviceId, setDeviceId };
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState({ text: "", type: "info" });

  const { devices, deviceId, setDeviceId } = useDevices();
  const [webcamUser, setWebcamUser] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const webcamRef = useRef(null);
  const fileRef = useRef();
  const [selectedUserId, setSelectedUserId] = useState(null);

  const load = () => getUsers().then((r) => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const flash = (text, type = "info") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "info" }), 3500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateUser(editing, form);
        flash("Đã cập nhật thông tin", "success");
      } else {
        await createUser(form);
        flash("Đã thêm người dùng mới", "success");
      }
      setForm(EMPTY_FORM);
      setEditing(null);
      load();
    } catch (err) {
      flash("Lỗi: " + (err.response?.data?.detail || err.message), "error");
    }
  };

  const handleEdit = (u) => {
    setEditing(u.id);
    setForm({ name: u.name, code: u.code, group: u.group || "", email: u.email || "", phone: u.phone || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Xóa người dùng này và toàn bộ dữ liệu liên quan?")) return;
    await deleteUser(id);
    flash("Đã xóa người dùng", "success");
    load();
  };

  const handleClearFaces = async (id) => {
    if (!confirm("Xóa toàn bộ khuôn mặt đã đăng ký?")) return;
    await clearFaces(id);
    flash("Đã xóa khuôn mặt", "success");
    load();
  };

  // Upload ảnh từ file
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedUserId) return;
    try {
      const res = await registerFace(selectedUserId, file);
      flash(res.data.message, "success");
      load();
    } catch (err) {
      flash("Lỗi: " + (err.response?.data?.detail || err.message), "error");
    }
    e.target.value = "";
  };

  // Chụp ảnh từ webcam
  const captureFromWebcam = useCallback(async () => {
    if (!webcamRef.current || !webcamUser) return;
    setCapturing(true);
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) { setCapturing(false); return; }

    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const file = new File([blob], "webcam.jpg", { type: "image/jpeg" });
      await registerFace(webcamUser.id, file);
      setCapturedCount((c) => c + 1);
      flash(`Đã chụp ${capturedCount + 1} ảnh cho ${webcamUser.name}`, "success");
      load();
    } catch (err) {
      flash("Không detect được mặt, thử lại", "error");
    } finally {
      setCapturing(false);
    }
  }, [webcamRef, webcamUser, capturedCount]);

  const msgColor = {
    info: "bg-blue-50 text-blue-700",
    success: "bg-green-50 text-green-700",
    error: "bg-red-50 text-red-700",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">👤 Quản lý người dùng</h1>

      {msg.text && (
        <div className={`mb-3 px-4 py-2 rounded text-sm ${msgColor[msg.type]}`}>{msg.text}</div>
      )}

      {/* Form thêm/sửa */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-4 mb-6 grid grid-cols-2 gap-3">
        <h2 className="col-span-2 font-semibold text-gray-700">
          {editing ? "✏️ Cập nhật thông tin" : "➕ Thêm người dùng mới"}
        </h2>
        {[["name","Họ tên *"],["code","Mã số *"],["group","Lớp/Phòng ban"],["email","Email"],["phone","Số điện thoại"]].map(([k, label]) => (
          <input key={k} placeholder={label} value={form[k]}
            onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            required={k === "name" || k === "code"}
            className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        ))}
        <div className="col-span-2 flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 text-sm">
            {editing ? "Cập nhật" : "Thêm mới"}
          </button>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm(EMPTY_FORM); }}
              className="px-5 py-2 rounded border text-sm hover:bg-gray-100">Hủy</button>
          )}
        </div>
      </form>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

      {/* Bảng danh sách */}
      <div className="bg-white rounded-xl shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              {["Mã số","Họ tên","Lớp/PB","Khuôn mặt","Thao tác"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-gray-600">{u.code}</td>
                <td className="px-4 py-2 font-medium">{u.name}</td>
                <td className="px-4 py-2 text-gray-500">{u.group || "—"}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.face_count > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {u.face_count > 0 ? `✓ ${u.face_count} ảnh` : "Chưa đăng ký"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-1 flex-wrap">
                    <button onClick={() => handleEdit(u)}
                      className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">
                      ✏️ Sửa
                    </button>
                    <button onClick={() => { setWebcamUser(u); setCapturedCount(0); }}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                      📷 Chụp mặt
                    </button>
                    <button onClick={() => { setSelectedUserId(u.id); fileRef.current.click(); }}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
                      🖼 Upload ảnh
                    </button>
                    <button onClick={() => handleClearFaces(u.id)}
                      className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200">
                      🗑 Xóa mặt
                    </button>
                    <button onClick={() => handleDelete(u.id)}
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
                      ✕ Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">Chưa có người dùng nào</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal webcam đăng ký mặt */}
      {webcamUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-lg">📷 Đăng ký khuôn mặt — {webcamUser.name}</h2>
              <button onClick={() => setWebcamUser(null)} className="text-gray-400 hover:text-red-500 text-xl">✕</button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Nhìn thẳng vào camera, chụp nhiều góc khác nhau để tăng độ chính xác.
              Đã chụp: <strong>{capturedCount} ảnh</strong>
            </p>
            <div className="rounded-xl overflow-hidden bg-black mb-3">
              <Webcam ref={webcamRef} screenshotFormat="image/jpeg"
                videoConstraints={{ width: 480, height: 360, deviceId: deviceId || undefined }}
                className="w-full" />
            </div>
            {devices.length > 1 && (
              <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}
                className="border rounded px-3 py-2 text-sm w-full mb-3">
                {devices.map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>
                ))}
              </select>
            )}
            <div className="flex gap-3">
              <button onClick={captureFromWebcam} disabled={capturing}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                {capturing ? "Đang xử lý..." : "📸 Chụp ảnh"}
              </button>
              <button onClick={() => setWebcamUser(null)}
                className="px-5 py-2 border rounded-lg hover:bg-gray-50 text-sm">
                Đóng
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Khuyến nghị chụp 5+ ảnh với các góc: thẳng, trái, phải, ngẩng, cúi
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
