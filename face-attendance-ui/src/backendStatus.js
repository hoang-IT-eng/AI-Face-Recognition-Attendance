import { useSyncExternalStore } from "react";
import { API_BASE } from "./api";

/**
 * backendStatus — theo dõi máy chủ AI (FastAPI + DeepFace) còn thức hay đang
 * ngủ (Azure Container Apps scale-to-zero). Hai chế độ cho bản demo:
 *  - "real": API /api/health trả JSON ok → mọi thao tác gọi AI thật.
 *  - "sim":  API chưa sẵn sàng → giao diện chạy mô phỏng ngay trong trình
 *    duyệt (phát hiện khuôn mặt bằng MediaPipe) để người xem không phải chờ;
 *    thao tác mô phỏng được lưu tạm và tự đồng bộ lên AI thật khi máy chủ dậy.
 * Việc thăm dò chính nó cũng là cú "gõ cửa" đánh thức container.
 */

let status = "checking"; // checking | sim | real
const listeners = new Set();
let probeTimer = null;
let started = false;

function emit() {
  for (const fn of listeners) fn();
}

function setStatus(next) {
  if (status === next) return;
  status = next;
  emit();
}

async function probe() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`${API_BASE}/api/health`, {
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(t);
    if (!res.ok) return false;
    const data = await res.json().catch(() => null);
    return data?.status === "ok";
  } catch {
    return false;
  }
}

async function tick() {
  const ok = await probe();
  if (ok) {
    setStatus("real");
    if (probeTimer) {
      clearInterval(probeTimer);
      probeTimer = null;
    }
    // Báo cho lớp đồng bộ dữ liệu mô phỏng (simSync) biết AI đã sẵn sàng.
    window.dispatchEvent(new CustomEvent("sf-backend-real"));
  } else if (status === "checking") {
    setStatus("sim");
  }
}

/** Bắt đầu thăm dò (gọi một lần ở App). An toàn khi gọi nhiều lần. */
export function startBackendProbe() {
  if (started) return;
  started = true;
  tick();
  if (!probeTimer) probeTimer = setInterval(tick, 8000);
}

export function getBackendStatus() {
  return status;
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Hook React: "checking" | "sim" | "real" */
export function useBackendStatus() {
  return useSyncExternalStore(subscribe, getBackendStatus, getBackendStatus);
}
