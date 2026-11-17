import { getUsers, createUser, registerFace } from "./api";

/**
 * simSync — lưu tạm các lượt đăng ký khuôn mặt chụp ở chế độ mô phỏng
 * (localStorage) và tự đồng bộ lên AI thật ngay khi máy chủ sẵn sàng:
 * tạo/tìm nhân viên theo mã, rồi gửi lại từng ảnh góc chụp qua API thật.
 * Nhờ vậy mạch demo không đứt: chụp lúc mô phỏng → điểm danh thật sau đó
 * vẫn khớp dữ liệu.
 */

const KEY = "sf_sim_captures";

export function loadSimCaptures() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
}

export function saveSimCapture(emp, dataUrl) {
  if (!emp?.code || !dataUrl) return;
  const cur = loadSimCaptures();
  const sameEmp = cur && cur.emp?.code === emp.code;
  const data = sameEmp
    ? cur
    : { emp, shots: [], synced: false, savedAt: Date.now() };
  if (!data.shots.includes(dataUrl)) data.shots.push(dataUrl);
  data.shots = data.shots.slice(0, 6);
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* localStorage đầy — bỏ qua, mô phỏng vẫn tiếp tục trong phiên */
  }
}

let syncing = false;

export async function syncSimCaptures() {
  const data = loadSimCaptures();
  if (!data || data.synced || !data.shots?.length || syncing) return false;
  syncing = true;
  try {
    const res = await getUsers().catch(() => ({ data: [] }));
    const users = Array.isArray(res.data) ? res.data : [];
    let user = users.find((u) => u.code === data.emp.code);
    if (!user) {
      const created = await createUser({
        code: data.emp.code,
        name: data.emp.name,
        group: data.emp.group,
      });
      user = created.data;
    }
    if (!user?.id) return false;
    for (const shot of data.shots) {
      const blob = await (await fetch(shot)).blob();
      const file = new File([blob], "sim_angle.jpg", { type: "image/jpeg" });
      await registerFace(user.id, file, { consent: true });
    }
    const done = { ...data, synced: true, syncedAt: Date.now() };
    try {
      localStorage.setItem(KEY, JSON.stringify(done));
    } catch {
      /* bỏ qua */
    }
    window.dispatchEvent(new CustomEvent("sf-sim-synced"));
    return true;
  } catch {
    return false;
  } finally {
    syncing = false;
  }
}

let inited = false;

/** Gắn listener: hễ backend chuyển sang "real" thì đồng bộ ngay. */
export function initSimSync() {
  if (inited) return;
  inited = true;
  window.addEventListener("sf-backend-real", () => {
    syncSimCaptures();
  });
}
