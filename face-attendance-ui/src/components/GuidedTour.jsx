import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * GuidedTour — tour hướng dẫn từng bước kiểu "chơi game" cho bản demo.
 *
 * Cách kích hoạt:
 *  - Mở app với ?tour=1  → tour tự chạy khi app shell sẵn sàng.
 *  - Bấm nút "Hướng dẫn demo" trong AdminLayout → phát event "sf-tour-start".
 *
 * Mỗi bước neo vào một phần tử thật qua thuộc tính data-tour="..." đặt sẵn
 * trong các trang (Login, AdminLayout, RegisterFace, Kiosk). Tour không chặn
 * thao tác: lớp phủ chỉ làm tối vùng xung quanh, phần tử được highlight vẫn
 * bấm được như bình thường. Bước tự chuyển khi người dùng làm đúng hành động
 * (bấm nút thật, hoặc thẻ chụp hiện nhãn "ĐÃ LƯU"); luôn có nút Tiếp theo dự phòng.
 */

const SEEN_KEY = "sf_tour_done";

const STEPS = [
  {
    target: null,
    title: "🎮 Chào mừng bạn đến với tour demo!",
    body: "Trong ít phút tới, bạn sẽ tự tay thực hiện một vòng điểm danh thật: (1) đăng ký khuôn mặt cho một nhân viên mới, rồi (2) dùng chính khuôn mặt đó để điểm danh tại Kiosk. Sẵn sàng chưa?",
    nextLabel: "Bắt đầu",
    goTo: "/login",
  },
  {
    target: "login-submit",
    title: "Bước 1 · Đăng nhập quản trị",
    body: "Form đã được điền sẵn tài khoản admin demo của hệ thống. Bạn chỉ cần bấm nút “Đăng nhập bảng điều khiển” để vào bên trong.",
    advanceOnClick: true,
  },
  {
    target: "nav-register-face",
    title: "Bước 2 · Mở màn hình đăng ký khuôn mặt",
    body: "Ở cuối thanh bên có nút “Đăng ký khuôn mặt” màu chủ đạo. Bấm vào đó để bắt đầu tạo hồ sơ sinh trắc học cho nhân viên mới.",
    advanceOnClick: true,
  },
  {
    target: "reg-form",
    title: "Bước 3 · Thông tin nhân viên",
    body: "Đây là hồ sơ nhân viên: Mã nhân viên, Họ và tên, Phòng ban và Ca làm việc mặc định. Form đang có sẵn dữ liệu mẫu — cứ để nguyên, hoặc sửa thành tên của chính bạn cho vui. Xong thì bấm “Tiếp theo”.",
  },
  {
    target: "reg-consent",
    title: "Bước 4 · Đồng ý thu thập sinh trắc học",
    body: "Ô xác nhận này phải được tick thì hệ thống mới cho phép chụp và lưu khuôn mặt. Nó đang được tick sẵn rồi — cứ để nguyên nhé!",
  },
  {
    target: "reg-camera",
    title: "Bước 5 · Bật camera thật 📷",
    body: "Giờ là lúc bật camera! Bấm nút “Bật Webcam thật” ở góc trên, và chọn “Cho phép” nếu trình duyệt hỏi quyền truy cập camera.",
    advanceOnClick: true,
  },
  {
    target: "reg-angle-0",
    title: "Bước 6 · Chụp góc 1 — Nhìn thẳng",
    body: "Đưa khuôn mặt vào khung ngắm, nhìn thẳng trực diện, giữ khoảng cách khoảng 50–70 cm rồi bấm nút chụp trong thẻ này. Khi thẻ hiện nhãn “ĐÃ LƯU” là góc chụp đã đạt chuẩn!",
    advanceOnText: "ĐÃ LƯU",
  },
  {
    target: "reg-angle-1",
    title: "Bước 7 · Chụp góc 2 — Nghiêng trái 15°",
    body: "Nghiêng nhẹ đầu sang trái khoảng 15° rồi bấm nút chụp trong thẻ góc 2. Chụp đủ nhiều góc giúp AI nhận diện bạn chính xác ở mọi tư thế.",
    advanceOnText: "ĐÃ LƯU",
  },
  {
    target: "reg-angle-2",
    title: "Bước 8 · Chụp góc 3 — Nghiêng phải 15°",
    body: "Tương tự, nghiêng đầu sang phải khoảng 15° và chụp góc cuối cùng trong thẻ này. Sắp hoàn thành phần đăng ký rồi!",
    advanceOnText: "ĐÃ LƯU",
  },
  {
    target: "reg-save",
    title: "Bước 9 · Lưu dữ liệu khuôn mặt 💾",
    body: "Bấm nút “LƯU DỮ LIỆU KHUÔN MẶT” để hoàn tất đăng ký. Hệ thống trích xuất vector khuôn mặt 512 chiều và lưu vào hồ sơ nhân viên.",
    advanceOnClick: true,
  },
  {
    target: "nav-kiosk",
    title: "Bước 10 · Chuyển sang Kiosk điểm danh",
    body: "Đăng ký thành công! 🎉 Giờ hãy thử điểm danh bằng chính khuôn mặt vừa lưu. Bấm mục “Kiosk Camera” trên thanh bên.",
    advanceOnClick: true,
  },
  {
    target: "kiosk-camera",
    title: "Bước 11 · Bật camera của Kiosk",
    body: "Tại màn hình Kiosk, bấm nút “Bật Camera Thật” trên thanh thông tin ở trên cùng, và cho phép trình duyệt dùng camera nếu được hỏi.",
    advanceOnClick: true,
  },
  {
    target: "kiosk-viewport",
    title: "Bước 12 · Chớp mắt để xác thực 👁️",
    body: "Nhìn thẳng vào camera và chớp mắt 2 lần — đây là bước kiểm tra người thật (liveness) để chống giả mạo bằng ảnh chụp. Panel bên trái sẽ đếm “Tiến độ chớp mắt” từ 0/2 đến 2/2 trong lúc hệ thống so khớp khuôn mặt của bạn với dữ liệu vừa đăng ký.",
  },
  {
    target: "kiosk-success",
    title: "Hoàn thành! 🏆",
    body: "Khi nhận diện khớp, thẻ này sáng lên dòng chữ “ĐIỂM DANH THÀNH CÔNG” kèm họ tên, mã nhân viên và trạng thái ĐÃ VÀO. Bạn vừa đi trọn một vòng: đăng ký khuôn mặt → điểm danh tại Kiosk. Cảm ơn bạn đã trải nghiệm SecureFace AI!",
    nextLabel: "Hoàn thành",
  },
];

const PAD = 8;

export default function GuidedTour() {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState(null);
  const startedRef = useRef(false);
  const scrolledForRef = useRef(-1);
  const advanceTimerRef = useRef(null);

  const step = STEPS[stepIdx];

  const start = useCallback(() => {
    sessionStorage.removeItem(SEEN_KEY);
    setStepIdx(0);
    scrolledForRef.current = -1;
    setActive(true);
  }, []);

  const stop = useCallback(() => {
    sessionStorage.setItem(SEEN_KEY, "1");
    setActive(false);
    setRect(null);
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
  }, []);

  const goNext = useCallback(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (stepIdx >= STEPS.length - 1) {
      stop();
      return;
    }
    if (STEPS[stepIdx].goTo) navigate(STEPS[stepIdx].goTo);
    setStepIdx((i) => i + 1);
  }, [stepIdx, navigate, stop]);

  const goBack = useCallback(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    setStepIdx((i) => Math.max(0, i - 1));
  }, []);

  const scheduleAdvance = useCallback(() => {
    if (advanceTimerRef.current) return;
    advanceTimerRef.current = setTimeout(() => {
      advanceTimerRef.current = null;
      goNext();
    }, 450);
  }, [goNext]);

  // Tự khởi động khi app mở với ?tour=1 (chỉ 1 lần / phiên tab).
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const params = new URLSearchParams(window.location.search);
    if (params.get("tour") === "1" && !sessionStorage.getItem(SEEN_KEY)) {
      const t = setTimeout(() => setActive(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  // Nút "Hướng dẫn demo" trong app shell.
  useEffect(() => {
    const handler = () => start();
    window.addEventListener("sf-tour-start", handler);
    return () => window.removeEventListener("sf-tour-start", handler);
  }, [start]);

  // Theo dõi vị trí phần tử đích + điều kiện tự chuyển bước theo nội dung.
  useEffect(() => {
    if (!active) return undefined;
    const tick = () => {
      if (!step.target) {
        setRect(null);
        return;
      }
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect((prev) =>
        prev &&
        Math.abs(prev.top - r.top) < 1 &&
        Math.abs(prev.left - r.left) < 1 &&
        Math.abs(prev.width - r.width) < 1 &&
        Math.abs(prev.height - r.height) < 1
          ? prev
          : { top: r.top, left: r.left, width: r.width, height: r.height }
      );
      if (scrolledForRef.current !== stepIdx) {
        scrolledForRef.current = stepIdx;
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      if (step.advanceOnText && el.textContent?.includes(step.advanceOnText)) {
        scheduleAdvance();
      }
    };
    tick();
    const id = setInterval(tick, 250);
    window.addEventListener("resize", tick);
    return () => {
      clearInterval(id);
      window.removeEventListener("resize", tick);
    };
  }, [active, step, stepIdx, location.pathname, scheduleAdvance]);

  // Tự chuyển bước khi người dùng bấm đúng phần tử được highlight.
  useEffect(() => {
    if (!active || !step.advanceOnClick || !step.target) return undefined;
    const onClick = (e) => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el && (e.target === el || el.contains(e.target))) scheduleAdvance();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [active, step, scheduleAdvance]);

  if (!active) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const hole = rect
    ? {
        top: Math.max(0, rect.top - PAD),
        left: Math.max(0, rect.left - PAD),
        right: Math.min(vw, rect.left + rect.width + PAD),
        bottom: Math.min(vh, rect.top + rect.height + PAD),
      }
    : null;

  // Vị trí thẻ hướng dẫn: dưới phần tử đích nếu đủ chỗ, ngược lại ở trên;
  // không có đích → giữa màn hình.
  const CARD_W = 380;
  let cardStyle;
  if (hole) {
    const spaceBelow = vh - hole.bottom;
    const top =
      spaceBelow > 300 ? hole.bottom + 14 : Math.max(12, hole.top - 14 - 260);
    const left = Math.min(
      Math.max(12, hole.left),
      Math.max(12, vw - CARD_W - 12)
    );
    cardStyle = { top, left, width: CARD_W };
  } else {
    cardStyle = {
      top: "50%",
      left: "50%",
      width: CARD_W,
      transform: "translate(-50%, -50%)",
    };
  }

  const dimCls = "fixed bg-black/65 z-[300]";
  const progress = Math.round(((stepIdx + 1) / STEPS.length) * 100);

  return (
    <div aria-live="polite">
      {/* Lớp làm tối xung quanh (chừa lỗ cho phần tử đích để vẫn bấm được) */}
      {hole ? (
        <>
          <div
            className={dimCls}
            style={{ top: 0, left: 0, width: vw, height: hole.top }}
          />
          <div
            className={dimCls}
            style={{ top: hole.bottom, left: 0, width: vw, height: vh - hole.bottom }}
          />
          <div
            className={dimCls}
            style={{ top: hole.top, left: 0, width: hole.left, height: hole.bottom - hole.top }}
          />
          <div
            className={dimCls}
            style={{ top: hole.top, left: hole.right, width: vw - hole.right, height: hole.bottom - hole.top }}
          />
          {/* Vòng highlight */}
          <div
            className="fixed z-[310] rounded-2xl border-[3px] border-primary shadow-[0_0_0_4px_rgba(64,58,184,0.35),0_0_24px_rgba(64,58,184,0.45)] pointer-events-none animate-pulse"
            style={{
              top: hole.top,
              left: hole.left,
              width: hole.right - hole.left,
              height: hole.bottom - hole.top,
            }}
          />
        </>
      ) : (
        <div className={`${dimCls} inset-0`} />
      )}

      {/* Thẻ hướng dẫn */}
      <div
        className="fixed z-[320] max-w-[92vw] bg-surface-container-lowest text-on-surface rounded-2xl shadow-2xl border border-outline-variant p-5 flex flex-col gap-3"
        style={cardStyle}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="font-code-telemetry text-label-sm font-bold text-primary tracking-wide">
            HƯỚNG DẪN DEMO · BƯỚC {stepIdx + 1}/{STEPS.length}
          </span>
          <button
            type="button"
            onClick={stop}
            className="text-on-surface-variant hover:text-on-surface text-label-sm font-label-sm cursor-pointer"
          >
            Bỏ qua ✕
          </button>
        </div>

        <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <h3 className="font-title-lg text-title-lg font-bold leading-snug">
          {step.title}
        </h3>
        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          {step.body}
        </p>
        {!rect && step.target && (
          <p className="font-label-sm text-label-sm text-on-surface-variant italic">
            Đang chờ bạn tới đúng màn hình… bạn vẫn có thể bấm “Tiếp theo” để đi
            tiếp.
          </p>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIdx === 0}
            className="h-10 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high disabled:opacity-40 font-label-lg text-label-lg cursor-pointer"
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={goNext}
            className="h-10 px-5 rounded-xl bg-primary text-on-primary hover:bg-primary-container font-label-lg text-label-lg font-semibold shadow-sm cursor-pointer"
          >
            {step.nextLabel ||
              (stepIdx === STEPS.length - 1 ? "Hoàn thành" : "Tiếp theo")}
          </button>
        </div>
      </div>
    </div>
  );
}
