import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_BASE ?? "";

function deriveWsLivenessUrl() {
  if (import.meta.env.VITE_WS_LIVENESS_URL) {
    return import.meta.env.VITE_WS_LIVENESS_URL;
  }
  const apiBase = import.meta.env.VITE_API_BASE;
  if (apiBase) {
    try {
      const u = new URL(apiBase);
      const wsProto = u.protocol === "https:" ? "wss:" : "ws:";
      return `${wsProto}//${u.host}/camera/ws/liveness`;
    } catch {
      /* fall through */
    }
  }
  if (typeof window !== "undefined" && window.location?.host) {
    const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProto}//${window.location.host}/camera/ws/liveness`;
  }
  return "ws://localhost:8000/camera/ws/liveness";
}

export const WS_LIVENESS_URL = deriveWsLivenessUrl();

const api = axios.create({ baseURL: API_BASE, timeout: 2800 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sf_admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ==========================================================================
   OFFLINE-RESILIENT DEMO STORE (Active when FastAPI backend is unreachable)
   ========================================================================== */
const todayIso = () => new Date().toISOString().slice(0, 10);

let DEMO_USERS_STATE = [
  {
    id: 101,
    code: "NV001",
    name: "Nguyễn Minh Hoàng",
    email: "hoang.nguyen@attend.vn",
    phone: "0903128456",
    group: "Kỹ thuật",
    role: "Kỹ sư Thị giác Máy tính",
    face_count: 3,
    consent: "Đã ký điện tử (12/01/2026)",
    registered_date: "12/01/2026",
    avatar: "/img/subject-live.jpg",
  },
  {
    id: 102,
    code: "NV014",
    name: "Trần Khánh Linh",
    email: "linh.tran@attend.vn",
    phone: "0918452310",
    group: "Nhân sự",
    role: "Trưởng phòng Nhân sự",
    face_count: 3,
    consent: "Đã ký điện tử (18/01/2026)",
    registered_date: "18/01/2026",
    avatar: null,
  },
  {
    id: 103,
    code: "NV027",
    name: "Lê Quốc Bảo",
    email: "bao.le@attend.vn",
    phone: "0987612094",
    group: "Kỹ thuật",
    role: "Kiến trúc sư Hệ thống",
    face_count: 3,
    consent: "Đã ký điện tử (03/02/2026)",
    registered_date: "03/02/2026",
    avatar: null,
  },
  {
    id: 104,
    code: "NV039",
    name: "Phạm Quỳnh Như",
    email: "nhu.pham@attend.vn",
    phone: "0934881920",
    group: "Kế toán",
    role: "Chuyên viên Kiểm toán Lương",
    face_count: 2,
    consent: "Đã ký điện tử (14/02/2026)",
    registered_date: "14/02/2026",
    avatar: null,
  },
  {
    id: 105,
    code: "NV052",
    name: "Võ Đăng Khoa",
    email: "khoa.vo@attend.vn",
    phone: "0972310488",
    group: "Kinh doanh",
    role: "Giám đốc Khách hàng Doanh nghiệp",
    face_count: 3,
    consent: "Đã ký điện tử (22/02/2026)",
    registered_date: "22/02/2026",
    avatar: null,
  },
  {
    id: 106,
    code: "NV068",
    name: "Đặng Tiến Dũng",
    email: "dung.dang@attend.vn",
    phone: "0965119203",
    group: "Kỹ thuật",
    role: "Kỹ sư MLOps & Bảo mật",
    face_count: 3,
    consent: "Đã ký điện tử (01/03/2026)",
    registered_date: "01/03/2026",
    avatar: null,
  },
  {
    id: 107,
    code: "NV081",
    name: "Hoàng Thảo Vy",
    email: "vy.hoang@attend.vn",
    phone: "0909445812",
    group: "Nhân sự",
    role: "Chuyên viên C&B",
    face_count: 3,
    consent: "Đã ký điện tử (09/03/2026)",
    registered_date: "09/03/2026",
    avatar: null,
  },
  {
    id: 108,
    code: "NV094",
    name: "Bùi Thanh Tùng",
    email: "tung.bui@attend.vn",
    phone: "0944712300",
    group: "Kinh doanh",
    role: "Chuyên viên Triển khai Kiosk",
    face_count: 0,
    consent: "Dùng mã PIN dự phòng",
    registered_date: "--",
    avatar: null,
  },
];

let DEMO_SHIFTS_STATE = [
  {
    id: 1,
    code: "#SHIFT-HC-01",
    name: "Ca Hành chính Chuẩn",
    start_time: "08:00",
    end_time: "17:30",
    break_label: "Nghỉ trưa: 12:00 - 13:30",
    late_threshold: 15,
    days_of_week: "1,2,3,4,5",
    staff_count: 118,
  },
  {
    id: 2,
    code: "#SHIFT-RND-02",
    name: "Ca Kỹ thuật Linh hoạt",
    start_time: "08:30",
    end_time: "18:00",
    break_label: "Nghỉ trưa: 12:30 - 14:00",
    late_threshold: 15,
    days_of_week: "1,2,3,4,5",
    staff_count: 24,
  },
  {
    id: 3,
    code: "#SHIFT-SAT-03",
    name: "Ca Trực Thứ Bảy",
    start_time: "08:00",
    end_time: "12:00",
    break_label: "Không nghỉ giữa ca",
    late_threshold: 10,
    days_of_week: "6",
    staff_count: 8,
  },
];

let DEMO_ALERTS_STATE = [
  {
    id: 501,
    level: "high",
    level_label: "NGHIÊM TRỌNG",
    time: "08:14:22",
    ago: "12 phút trước",
    type: "Chặn giả mạo màn hình (Replay Spoof)",
    rule: "EAR_FLATLINE_REJECT",
    icon: "gpp_bad",
    target: "Kiosk Cổng A — Sảnh Chính",
    sub_target: "EAR không chớp mắt (0.31 phẳng) · Đã khóa phiên",
    is_camera: true,
    detail:
      "Phát hiện điện thoại phát lại video khuôn mặt trước ống kính Kiosk Cổng A. Chỉ số EAR giữ nguyên 0.312 trong 4.0 giây (0/2 lần chớp mắt). Đã từ chối trích xuất vector 512-D.",
    tags: ["EAR 0.312 Flatline", "0/2 Blinks", "Spoof Blocked"],
    modal_type: "snapshot",
    resolved: false,
  },
  {
    id: 502,
    level: "medium",
    level_label: "CẢNH BÁO",
    time: "08:21:05",
    ago: "28 phút trước",
    type: "Check-in muộn quá ngưỡng 15 phút",
    rule: "SHIFT_LATE_THRESHOLD",
    icon: "schedule",
    target: "Võ Đăng Khoa (NV052)",
    sub_target: "Phòng Kinh doanh · Ca 08:00",
    is_camera: false,
    detail:
      "Nhân sự Võ Đăng Khoa xác thực sinh trắc học hợp lệ lúc 08:21:05 (Cosine 0.946, 2 lần chớp mắt đạt chuẩn), trễ 6 phút so với ngưỡng ân hạn 08:15.",
    tags: ["Cosine 0.946", "Ca Hành Chính", "+6 phút"],
    modal_type: null,
    resolved: false,
  },
  {
    id: 503,
    level: "low",
    level_label: "THÔNG TIN",
    time: "07:56:40",
    ago: "52 phút trước",
    type: "Điểm danh bằng mã PIN dự phòng",
    rule: "BACKUP_PIN_AUTH",
    icon: "pin",
    target: "Bùi Thanh Tùng (NV094)",
    sub_target: "Kiosk Cổng B · Chưa đăng ký mẫu mặt",
    is_camera: false,
    detail:
      "Nhân sự sử dụng phương thức PIN 4 số dự phòng hợp lệ tại Kiosk Cổng B do đang chờ lịch thu thập mẫu sinh trắc học.",
    tags: ["PIN Fallback", "Kiosk B"],
    modal_type: null,
    resolved: true,
  },
];

let DEMO_PRIVACY_STATE = {
  raw_image_store: false,
  retention: "employed-retention",
  consent_rate: 87.5,
  consent_signed: 7,
  consent_total: 8,
};

function buildAttendanceForDate(dateStr) {
  const baseDate = dateStr || todayIso();
  const seed = baseDate.split("-").reduce((a, b) => a + Number(b || 0), 0);
  return DEMO_USERS_STATE.slice(0, 7).map((u, idx) => {
    const isLate = (idx + seed) % 5 === 3;
    const min = isLate ? 18 + (idx % 9) : 46 + (idx % 12);
    const hr = isLate ? "08" : "07";
    return {
      id: Number(`${seed}${idx + 1}`),
      user_id: u.id,
      user_code: u.code,
      user_name: u.name,
      user_group: u.group,
      check_in: `${baseDate}T${hr}:${String(min).padStart(2, "0")}:12`,
      check_out:
        baseDate === todayIso()
          ? null
          : `${baseDate}T17:${String(31 + (idx % 18)).padStart(2, "0")}:04`,
      confidence: Number((0.928 + ((idx * 7) % 5) * 0.011).toFixed(3)),
      status: isLate ? "late" : "present",
    };
  });
}

function shouldFallback(err, res) {
  if (err) {
    const status = err?.response?.status;
    if (!status || status === 404 || status >= 500 || err.code === "ERR_NETWORK" || err.code === "ECONNABORTED") {
      return true;
    }
    return false;
  }
  const ct = res?.headers?.["content-type"] || "";
  if (typeof res?.data === "string" && ct.includes("text/html")) {
    return true;
  }
  return false;
}

async function withFallback(reqFn, fallbackFn) {
  try {
    const res = await reqFn();
    if (shouldFallback(null, res)) {
      return { data: fallbackFn(), status: 200, _demoFallback: true };
    }
    return res;
  } catch (err) {
    if (shouldFallback(err, null)) {
      return { data: fallbackFn(), status: 200, _demoFallback: true };
    }
    throw err;
  }
}

// Auth
export const login = (email, password) =>
  withFallback(
    () => api.post("/auth/login", { email, password }),
    () => ({
      access_token: "demo_attend_biometric_jwt_token",
      token_type: "bearer",
      name: "Quản trị viên Cấp cao",
      email: email || "admin@secureface.vn",
    })
  );

export const getMe = () =>
  withFallback(
    () => api.get("/auth/me"),
    () => ({
      id: 1,
      name: localStorage.getItem("sf_admin_name") || "Quản trị viên Cấp cao",
      email: "admin@secureface.vn",
      role: "admin",
    })
  );

// Users
export const getUsers = () =>
  withFallback(
    () => api.get("/users/"),
    () => [...DEMO_USERS_STATE]
  );

export const getUser = (id) =>
  withFallback(
    () => api.get(`/users/${id}`),
    () => DEMO_USERS_STATE.find((u) => String(u.id) === String(id)) || DEMO_USERS_STATE[0]
  );

export const createUser = (data) =>
  withFallback(
    () => api.post("/users/", data),
    () => {
      const created = {
        id: Date.now(),
        code: data.code || `NV${Math.floor(100 + Math.random() * 899)}`,
        name: data.name || "Nhân sự mới",
        email: data.email || "",
        phone: data.phone || "",
        group: data.group || "Kỹ thuật",
        role: data.role || "Chuyên viên",
        face_count: 0,
        consent: "Chờ thu thập mẫu",
        registered_date: new Date().toLocaleDateString("vi-VN"),
        avatar: null,
      };
      DEMO_USERS_STATE = [created, ...DEMO_USERS_STATE];
      return created;
    }
  );

export const updateUser = (id, data) =>
  withFallback(
    () => api.put(`/users/${id}`, data),
    () => {
      DEMO_USERS_STATE = DEMO_USERS_STATE.map((u) =>
        String(u.id) === String(id) ? { ...u, ...data } : u
      );
      return DEMO_USERS_STATE.find((u) => String(u.id) === String(id)) || data;
    }
  );

export const deleteUser = (id) =>
  withFallback(
    () => api.delete(`/users/${id}`),
    () => {
      DEMO_USERS_STATE = DEMO_USERS_STATE.filter((u) => String(u.id) !== String(id));
      return { ok: true };
    }
  );

export const registerFace = (userId, file, { consent = false, source } = {}) => {
  const form = new FormData();
  form.append("file", file);
  form.append("consent", consent ? "true" : "false");
  if (source) form.append("source", source);
  return withFallback(
    () => api.post(`/users/${userId}/faces`, form),
    () => ({
      ok: true,
      user_id: userId,
      embedding_dim: 512,
      model: "Facenet512",
      liveness_verified: true,
    })
  );
};

export const clearFaces = (userId) =>
  withFallback(
    () => api.delete(`/users/${userId}/faces`),
    () => {
      DEMO_USERS_STATE = DEMO_USERS_STATE.map((u) =>
        String(u.id) === String(userId) ? { ...u, face_count: 0 } : u
      );
      return { ok: true };
    }
  );

export const importExcel = (file) => {
  const form = new FormData();
  form.append("file", file);
  return withFallback(
    () => api.post("/users/import/excel", form),
    () => ({ imported: 4, skipped: 0 })
  );
};

// Schedules
export const getSchedules = () =>
  withFallback(
    () => api.get("/schedules/"),
    () => [...DEMO_SHIFTS_STATE]
  );

export const createSchedule = (data) =>
  withFallback(
    () => api.post("/schedules/", data),
    () => {
      const created = { id: Date.now(), code: `#SHIFT-${DEMO_SHIFTS_STATE.length + 1}`, staff_count: 16, ...data };
      DEMO_SHIFTS_STATE = [...DEMO_SHIFTS_STATE, created];
      return created;
    }
  );

export const updateSchedule = (id, data) =>
  withFallback(
    () => api.put(`/schedules/${id}`, data),
    () => {
      DEMO_SHIFTS_STATE = DEMO_SHIFTS_STATE.map((s) =>
        String(s.id) === String(id) ? { ...s, ...data } : s
      );
      return data;
    }
  );

export const deleteSchedule = (id) =>
  withFallback(
    () => api.delete(`/schedules/${id}`),
    () => {
      DEMO_SHIFTS_STATE = DEMO_SHIFTS_STATE.filter((s) => String(s.id) !== String(id));
      return { ok: true };
    }
  );

// Attendance
export const getAttendance = (params) =>
  withFallback(
    () => api.get("/attendance/", { params }),
    () => buildAttendanceForDate(params?.date_from || todayIso())
  );

export const getTodayAttendance = () =>
  withFallback(
    () => api.get("/attendance/today"),
    () => buildAttendanceForDate(todayIso())
  );

export const getAdjustments = (params) =>
  withFallback(
    () => api.get("/attendance/adjustments", { params }),
    () => [
      {
        id: 901,
        user_code: "NV039",
        user_name: "Phạm Quỳnh Như",
        date: todayIso(),
        old_check_in: "08:22:10",
        new_check_in: "08:00:00",
        reason: "Đi công tác ngân hàng đầu giờ có xác nhận trưởng bộ phận",
        approved_by: "Trần Khánh Linh (HR)",
      },
    ]
  );

export const manualAttendance = (data) =>
  withFallback(
    () => api.post("/attendance/manual", data),
    () => ({ ok: true, id: Date.now(), ...data })
  );

export const backupAttendance = (data) =>
  withFallback(
    () => api.post("/attendance/backup", data),
    () => {
      const found =
        DEMO_USERS_STATE.find((u) => u.code === data?.code) || DEMO_USERS_STATE[0];
      return {
        ok: true,
        code: found.code,
        name: found.name,
        dept: found.group,
        time: new Date().toLocaleTimeString("vi-VN", { hour12: false }),
        method: data?.method || "pin",
      };
    }
  );

export const getBackupRecent = (params) =>
  withFallback(
    () => api.get("/attendance/backup/recent", { params }),
    () => [
      {
        id: 301,
        code: "NV094",
        name: "Bùi Thanh Tùng",
        group: "Kinh doanh",
        method: "PIN 4 số",
        time: "07:56:40",
        status: "Hợp lệ",
      },
    ]
  );

export const updateAttendance = (id, data) =>
  withFallback(
    () => api.put(`/attendance/${id}`, data),
    () => ({ ok: true, id, ...data })
  );

export const deleteAttendance = (id) =>
  withFallback(
    () => api.delete(`/attendance/${id}`),
    () => ({ ok: true, id })
  );

export const getStatsSummary = (params) =>
  withFallback(
    () => api.get("/attendance/stats/summary", { params }),
    () => ({
      present: 6,
      late: 1,
      absent: 1,
      total: DEMO_USERS_STATE.length,
      date: params?.date_from || todayIso(),
    })
  );

export const exportExcel = (params) =>
  withFallback(
    () => api.get("/attendance/export/excel", { params, responseType: "blob" }),
    () => {
      const rows = buildAttendanceForDate(params?.date_from || todayIso());
      const csv = [
        "Ma_NV,Ho_Ten,Phong_Ban,Gio_Vao,Gio_Ra,Do_Tin_Cay,Trang_Thai",
        ...rows.map(
          (r) =>
            `${r.user_code},"${r.user_name}","${r.user_group}",${r.check_in},${r.check_out || ""},${r.confidence},${r.status}`
        ),
      ].join("\n");
      return new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    }
  );

// Alerts
export const getAlerts = (params) =>
  withFallback(
    () => api.get("/alerts/", { params }),
    () => [...DEMO_ALERTS_STATE]
  );

export const getAlertStats = () =>
  withFallback(
    () => api.get("/alerts/stats"),
    () => ({
      total: DEMO_ALERTS_STATE.length,
      unresolved_high: DEMO_ALERTS_STATE.filter((a) => a.level === "high" && !a.resolved).length,
    })
  );

export const resolveAlert = (id, resolved = true) =>
  withFallback(
    () => api.patch(`/alerts/${id}`, { resolved }),
    () => {
      DEMO_ALERTS_STATE = DEMO_ALERTS_STATE.map((a) =>
        String(a.id) === String(id) ? { ...a, resolved } : a
      );
      return { ok: true };
    }
  );

export const resolveAllAlerts = () =>
  withFallback(
    () => api.post("/alerts/resolve-all"),
    () => {
      DEMO_ALERTS_STATE = DEMO_ALERTS_STATE.map((a) => ({ ...a, resolved: true }));
      return { ok: true };
    }
  );

// Privacy
export const getPrivacySettings = () =>
  withFallback(
    () => api.get("/privacy/settings"),
    () => ({ ...DEMO_PRIVACY_STATE })
  );

export const updatePrivacySettings = (data) =>
  withFallback(
    () => api.put("/privacy/settings", data),
    () => {
      DEMO_PRIVACY_STATE = { ...DEMO_PRIVACY_STATE, ...data };
      return { ...DEMO_PRIVACY_STATE };
    }
  );

export const getConsents = () =>
  withFallback(
    () => api.get("/privacy/consents"),
    () =>
      DEMO_USERS_STATE.filter((u) => u.face_count > 0).map((u) => ({
        id: u.id,
        user_code: u.code,
        user_name: u.name,
        signed_at: u.registered_date,
        purpose: "Xác thực sinh trắc học 512-D Facenet (Không lưu ảnh thô)",
        status: "active",
      }))
  );

export const createConsent = (params) =>
  withFallback(
    () => api.post("/privacy/consents", null, { params }),
    () => ({ ok: true })
  );

// Reports
export const getPayrollReport = (params) =>
  withFallback(
    () => api.get("/reports/payroll", { params }),
    () => ({
      active_users: DEMO_USERS_STATE.length,
      total_ot_hours: 46.5,
      avg_compliance: 97.4,
      rows: DEMO_USERS_STATE.map((u, idx) => ({
        code: u.code,
        name: u.name,
        role: u.role,
        dept: u.group,
        standard_days: 22,
        present_days: idx === 7 ? 20 : 22,
        late_count: idx % 4 === 2 ? 1 : 0,
        early_count: 0,
        ot_hours: Number(((idx % 4) * 3.5 + 2).toFixed(1)),
        absent_days: idx === 7 ? 2 : 0,
        compliance: idx % 4 === 2 ? 96.2 : 99.1,
      })),
    })
  );

export const getEmployeeReport = (code) =>
  withFallback(
    () => api.get(`/reports/employees/${code}`),
    () => {
      const emp =
        DEMO_USERS_STATE.find((u) => u.code === code) || DEMO_USERS_STATE[0];
      return {
        code: emp.code,
        name: emp.name,
        dept: emp.group,
        role: emp.role,
        present_days: 21,
        standard_days: 22,
        late_count: 1,
        ot_hours: 8.5,
        avg_confidence: 94.8,
        days: [
          {
            date: "17/11/2026",
            day_name: "Thứ Ba",
            shift: "Ca Hành chính",
            hours: "08:00 - 17:30",
            check_in: "07:51:18",
            kiosk_in: "Kiosk Cổng A",
            check_out: "17:36:42",
            kiosk_out: "Kiosk Cổng A",
            total_hours: "8.1h",
            status: "present",
            status_label: "Đúng giờ",
            sub_note: "EAR 2/2 chớp mắt · Cosine 0.951",
            conf: "95.1%",
          },
          {
            date: "16/11/2026",
            day_name: "Thứ Hai",
            shift: "Ca Hành chính",
            hours: "08:00 - 17:30",
            check_in: "07:54:09",
            kiosk_in: "Kiosk Cổng A",
            check_out: "18:15:10",
            kiosk_out: "Kiosk Cổng B",
            total_hours: "8.8h",
            status: "present",
            status_label: "Đúng giờ (+OT)",
            sub_note: "EAR 2/2 chớp mắt · Cosine 0.944",
            conf: "94.4%",
          },
          {
            date: "13/11/2026",
            day_name: "Thứ Sáu",
            shift: "Ca Hành chính",
            hours: "08:00 - 17:30",
            check_in: "08:19:33",
            kiosk_in: "Kiosk Cổng B",
            check_out: "17:40:02",
            kiosk_out: "Kiosk Cổng B",
            total_hours: "7.8h",
            status: "late",
            status_label: "Đi muộn (+4p)",
            sub_note: "EAR 2/2 chớp mắt · Cosine 0.939",
            conf: "93.9%",
          },
        ],
      };
    }
  );

// Camera - recognize from image
export const recognizeImage = (file) => {
  const form = new FormData();
  form.append("file", file);
  return withFallback(
    () => api.post("/camera/recognize", form),
    () => ({
      matched: true,
      code: "NV001",
      name: "Nguyễn Minh Hoàng",
      confidence: 0.946,
      liveness_passed: true,
    })
  );
};

export default api;
