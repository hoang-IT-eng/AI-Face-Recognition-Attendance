import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="landing-root bg-surface font-body text-on-surface antialiased selection:bg-primary-fixed selection:text-primary min-h-screen">
<header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-border-subtle/80 transition-all">
<div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm">
<span className="material-symbols-outlined text-[20px]">center_focus_strong</span>
</div>
<span className="font-headline font-bold text-xl tracking-tight text-on-surface">Face<span className="text-primary">Attend</span></span>
</div>
<nav className="hidden md:flex items-center gap-8 font-headline text-[14.5px] font-medium text-on-surface-variant">
<a className="hover:text-primary transition-colors" href="#tinh-nang">Tính năng</a>
<a className="hover:text-primary transition-colors" href="#kiosk-demo">Thiết bị Kiosk</a>
<a className="hover:text-primary transition-colors" href="#bang-dieu-khien">Dashboard Live</a>
<a className="hover:text-primary transition-colors" href="#bang-gia">Bảng giá</a>
<a className="hover:text-primary transition-colors" href="#faq">Câu hỏi thường gặp</a>
</nav>
<div className="flex items-center gap-4">
<Link className="hidden sm:inline-flex text-[14.5px] font-medium text-on-surface-variant hover:text-on-surface transition-colors" to="/login">Đăng nhập</Link>
<a className="inline-flex items-center justify-center h-10 px-5 text-[14px] font-semibold text-white bg-primary rounded-full hover:bg-primary-container transition-all shadow-sm hover:shadow" href="#dung-thu">
          Dùng thử miễn phí
        </a>
</div>
</div>
</header>
<main className="w-full pt-20">
{/* HERO SECTION: Raven Health 2-Column Asymmetric Visual-first Layout */}
<section className="pt-14 pb-20 lg:pt-20 lg:pb-28 overflow-hidden bg-gradient-to-b from-[#F7F8FD] via-surface to-white border-b border-border-subtle">
<div className="max-w-7xl mx-auto px-6">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
{/* Col Left: Concise headline & Raven accent */}
<div className="lg:col-span-6 flex flex-col justify-center max-w-xl">
{/* Top tag */}
<div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-primary/5 border border-primary/15 text-primary text-[12.5px] font-semibold tracking-wide mb-6">
<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              FaceAttend v3.4 • Thế hệ Kiosk Không Tiếp Xúc
            </div>
{/* Punchy headline with Raven-style italic accents */}
<h1 className="font-headline text-4xl sm:text-5xl lg:text-[54px] font-bold text-on-surface leading-[1.12] tracking-tight mb-6">
              Chấm công chuẩn xác cho <span className="italic-accent text-primary">văn phòng hiện đại.</span>
</h1>
<p className="font-body text-lg text-on-surface-variant leading-relaxed mb-8">
              Nhận diện tức thì tại cửa ra vào trong 0.2 giây. Không xếp hàng, không quẹt thẻ, đồng bộ thẳng vào bảng lương.
            </p>
{/* 2 Bold CTAs */}
<div className="flex flex-wrap items-center gap-4 mb-10">
<a className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-primary text-white font-headline text-[15px] font-semibold hover:bg-primary-container shadow-md hover:shadow-lg transition-all" href="#dung-thu">
                Dùng thử miễn phí
              </a>
<a className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-white border border-border-crisp text-on-surface font-headline text-[15px] font-semibold hover:bg-surface-subtle transition-all" href="#kiosk-demo">
<span className="material-symbols-outlined text-[20px] text-primary">play_circle</span>
                Xem demo 3 phút
              </a>
</div>
{/* Social proof micro-strip */}
<div className="flex items-center gap-6 pt-6 border-t border-border-subtle text-[13px] text-on-surface-variant font-medium">
<div className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-amber-500 text-[18px]">star</span>
<span><strong className="font-semibold text-on-surface">4.9/5</strong> Capterra</span>
</div>
<div className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-emerald-accent text-[18px]">domain</span>
<span><strong className="font-semibold text-on-surface">120+</strong> văn phòng</span>
</div>
<div className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
<span>Tuân thủ TT13/NĐ-CP</span>
</div>
</div>
</div>
{/* Col Right: High-fidelity Tablet Kiosk Check-in Mockup with Floating Badges */}
<div className="lg:col-span-6 relative flex justify-center items-center">
{/* Soft gradient background glow */}
<div className="absolute -inset-4 bg-gradient-to-tr from-primary/10 via-emerald-accent/5 to-transparent rounded-full filter blur-3xl opacity-70"></div>
{/* Tablet Stand Frame */}
<div className="relative w-full max-w-[480px]">
{/* Realistic Tablet Casing */}
<div className="relative bg-slate-900 rounded-[32px] p-3.5 shadow-2xl border border-slate-700/60 ring-1 ring-black/5">
{/* Front Camera & Sensor Notch */}
<div className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
<div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700"></div>
<div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-ping"></div>
</div>
{/* Screen Inner Content */}
<div className="relative bg-slate-950 rounded-[24px] overflow-hidden aspect-[4/5] flex flex-col justify-between">
{/* Camera Viewport with Employee Photo */}
<div className="absolute inset-0 z-0">
<img alt="Nhận diện khuôn mặt nhân viên" className="w-full h-full object-cover object-top opacity-85" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBiV7kqYyBkqxWyVaVyFeIbaZLWu_NHhFOWn7AnjLFrd266k0xU3yO0figaFyIuNIfvYvWPOhOLDOeujvRV_rxK9m3Qx33FxjlCpmHeM1XPbrUFELF4_vA5yVC0GPSACwqflZqCbMGaQZCH22EC6CA6hPob0WFQIEKX0xCRZldG5BQLdBMvB0GlBJU-RZwdNgivDy6tdon2VFs9RJwugkGiJDU_08u7w7VVXWIgPxI"/>
<div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/60"></div>
</div>
{/* Face Bounding Box HUD (Smooth Emerald) */}
<div className="absolute top-16 left-1/2 -translate-x-1/2 w-48 h-56 rounded-2xl border-2 border-emerald-400/80 z-10 flex flex-col justify-between p-2 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
<div className="flex justify-between items-start">
<span className="w-3.5 h-3.5 border-t-2 border-l-2 border-emerald-300"></span>
<span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500 text-white tracking-widest uppercase">Live 3D</span>
<span className="w-3.5 h-3.5 border-t-2 border-r-2 border-emerald-300"></span>
</div>
<div className="flex justify-between items-end">
<span className="w-3.5 h-3.5 border-b-2 border-l-2 border-emerald-300"></span>
<span className="text-[11px] font-mono text-emerald-300 bg-slate-900/80 px-2 py-0.5 rounded">99.8%</span>
<span className="w-3.5 h-3.5 border-b-2 border-r-2 border-emerald-300"></span>
</div>
</div>
{/* Top Status bar of Tablet */}
<div className="relative z-10 px-5 pt-4 flex items-center justify-between text-white/70 text-xs font-mono">
<div className="flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-emerald-400"></span>
<span>Kiosk 01 • Cửa Chính</span>
</div>
<span>08:24:12</span>
</div>
{/* Bottom Prompt inside Screen */}
<div className="relative z-10 p-5 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
<div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 backdrop-blur-md flex items-center gap-3">
<div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
<span className="material-symbols-outlined text-[18px]">check</span>
</div>
<div>
<div className="text-white font-headline font-semibold text-sm">Hoàng Minh Long</div>
<div className="text-emerald-400 text-xs font-body">Check-in thành công • Đúng giờ</div>
</div>
</div>
</div>
</div>
</div>
{/* Floating Micro-badge 1: Latency (Top Right) */}
<div className="absolute -top-4 -right-6 z-30 bg-white/95 backdrop-blur-md border border-border-crisp rounded-2xl py-2 px-3.5 shadow-floating flex items-center gap-2.5">
<div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
<span className="material-symbols-outlined text-[17px]">speed</span>
</div>
<div>
<div className="text-[11px] font-medium text-on-surface-variant">Độ trễ xử lý</div>
<div className="text-xs font-headline font-bold text-on-surface">0.18s <span className="text-emerald-600 font-normal">cực nhanh</span></div>
</div>
</div>
{/* Floating Micro-badge 2: Liveness (Bottom Left) */}
<div className="absolute -bottom-5 -left-6 z-30 bg-white/95 backdrop-blur-md border border-border-crisp rounded-2xl py-2 px-3.5 shadow-floating flex items-center gap-2.5">
<div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-[17px]">lock_open</span>
</div>
<div>
<div className="text-[11px] font-medium text-on-surface-variant">Cửa tự động</div>
<div className="text-xs font-headline font-bold text-emerald-600">Mở tức thì</div>
</div>
</div>
</div>
</div>
</div>
</div>
</section>
{/* METRICS BAR: Minimalist & Clean like Raven Health */}
<section className="py-9 bg-white border-b border-border-subtle">
<div className="max-w-7xl mx-auto px-6">
<div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-border-subtle text-center">
<div className="pt-4 md:pt-0">
<div className="font-headline text-3xl lg:text-4xl font-extrabold text-on-surface tracking-tight">99.8%</div>
<p className="font-body text-sm text-on-surface-variant mt-1">Độ chính xác nhận diện sinh trắc học</p>
</div>
<div className="pt-4 md:pt-0">
<div className="font-headline text-3xl lg:text-4xl font-extrabold text-primary tracking-tight">&lt; 0.3s</div>
<p className="font-body text-sm text-on-surface-variant mt-1">Thời gian quét qua cửa, không dừng bước</p>
</div>
<div className="pt-4 md:pt-0">
<div className="font-headline text-3xl lg:text-4xl font-extrabold text-emerald-accent tracking-tight">0</div>
<p className="font-body text-sm text-on-surface-variant mt-1">Khiếu nại sai sót công cuối tháng</p>
</div>
</div>
</div>
</section>
{/* SECTION 1: PROBLEM / PAIN POINTS - Short, Direct, No Wall of Text */}
<section className="py-20 bg-surface-subtle">
<div className="max-w-7xl mx-auto px-6">
<div className="max-w-xl mx-auto text-center mb-14">
<span className="font-headline text-[13px] font-bold text-primary tracking-wider uppercase">Thực trạng cũ</span>
<h2 className="font-headline text-3xl font-bold text-on-surface mt-2 tracking-tight">
            Máy vân tay và thẻ từ đang <span className="italic-accent">làm chậm</span> bạn.
          </h2>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
{/* Card 1 */}
<div className="bg-white p-7 rounded-2xl border border-border-subtle shadow-sm hover:shadow transition-shadow">
<div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
<span className="material-symbols-outlined text-[20px]">hourglass_disabled</span>
</div>
<h3 className="font-headline text-lg font-bold text-on-surface mb-2">Ùn ứ giờ cao điểm</h3>
<p className="font-body text-sm text-on-surface-variant leading-relaxed">
              Vân tay ẩm, thẻ từ bỏ quên khiến nhân viên xếp hàng dài trước cửa mỗi buổi sáng.
            </p>
</div>
{/* Card 2 */}
<div className="bg-white p-7 rounded-2xl border border-border-subtle shadow-sm hover:shadow transition-shadow">
<div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
<span className="material-symbols-outlined text-[20px]">assignment_late</span>
</div>
<h3 className="font-headline text-lg font-bold text-on-surface mb-2">Hàng tá đơn giải trình</h3>
<p className="font-body text-sm text-on-surface-variant leading-relaxed">
              HR ngập trong email giải thích quên quẹt thẻ, tranh cãi giờ ra vào vô tận.
            </p>
</div>
{/* Card 3 */}
<div className="bg-white p-7 rounded-2xl border border-border-subtle shadow-sm hover:shadow transition-shadow">
<div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-4">
<span className="material-symbols-outlined text-[20px]">table_chart_view</span>
</div>
<h3 className="font-headline text-lg font-bold text-on-surface mb-2">3 ngày tính công thủ công</h3>
<p className="font-body text-sm text-on-surface-variant leading-relaxed">
              Xuất file Excel vất vả đối soát ca kíp, trễ giờ phát bảng lương hàng kỳ.
            </p>
</div>
</div>
</div>
</section>
{/* SECTION 2: PRODUCT SHOWCASES (Alternating Z-Pattern theo phong cách Raven Health) */}
<section className="py-20 bg-white" id="tinh-nang">
<div className="max-w-7xl mx-auto px-6 space-y-24">
{/* Showcase 1: Kiosk Cổng (Text Left, Mockup Right) */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center" id="kiosk-demo">
<div className="lg:col-span-5 max-w-lg">
<span className="text-xs font-headline font-bold text-primary tracking-wider uppercase">01 / Phần cứng Kiosk</span>
<h3 className="font-headline text-3xl font-bold text-on-surface mt-2.5 mb-3 tracking-tight">
              Đi qua là nhận diện, <span className="italic-accent text-primary">không cần dừng lại.</span>
</h3>
<p className="font-body text-base text-on-surface-variant leading-relaxed mb-6">
              Camera AI nhận diện đa góc độ ngay cả khi đeo khẩu trang mỏng hoặc kính cận.
            </p>
<div className="space-y-3 font-headline text-sm font-semibold text-on-surface">
<div className="flex items-center gap-2.5">
<span className="w-5 h-5 rounded-full bg-emerald-badge-bg text-emerald-accent flex items-center justify-center">
<span className="material-symbols-outlined text-[14px]">check</span>
</span>
<span>Tốc độ nhận diện 0.2s không độ trễ</span>
</div>
<div className="flex items-center gap-2.5">
<span className="w-5 h-5 rounded-full bg-emerald-badge-bg text-emerald-accent flex items-center justify-center">
<span className="material-symbols-outlined text-[14px]">check</span>
</span>
<span>Cảm biến 3D liveness chống gian lận ảnh giả</span>
</div>
</div>
</div>
<div className="lg:col-span-7 relative">
<div className="bg-surface-subtle p-6 sm:p-8 rounded-3xl border border-border-subtle shadow-soft-elevation">
<div className="relative bg-white rounded-2xl p-5 border border-border-subtle shadow-sm flex flex-col sm:flex-row items-center gap-6">
{/* Visual Box */}
<div className="w-full sm:w-1/2 aspect-video sm:aspect-square bg-slate-900 rounded-xl overflow-hidden relative">
<img alt="Nhận diện cửa vào" className="w-full h-full object-cover opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBiV7kqYyBkqxWyVaVyFeIbaZLWu_NHhFOWn7AnjLFrd266k0xU3yO0figaFyIuNIfvYvWPOhOLDOeujvRV_rxK9m3Qx33FxjlCpmHeM1XPbrUFELF4_vA5yVC0GPSACwqflZqCbMGaQZCH22EC6CA6hPob0WFQIEKX0xCRZldG5BQLdBMvB0GlBJU-RZwdNgivDy6tdon2VFs9RJwugkGiJDU_08u7w7VVXWIgPxI"/>
<div className="absolute inset-0 border-2 border-emerald-400/70 rounded-xl m-3"></div>
<div className="absolute bottom-2 left-3 text-[11px] font-mono text-emerald-400 bg-black/60 px-2 py-0.5 rounded">
                    0.21s • Khớp 99.4%
                  </div>
</div>
{/* Info pill */}
<div className="w-full sm:w-1/2 space-y-3">
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-badge-bg text-emerald-accent text-xs font-semibold">
<span className="w-1.5 h-1.5 rounded-full bg-emerald-accent"></span>
                    Cửa tự động đã mở
                  </div>
<h4 className="font-headline font-bold text-lg text-on-surface">Nguyễn Thu Trang</h4>
<p className="text-xs text-on-surface-variant font-mono">NV-0482 • Ban Truyền thông</p>
<div className="pt-3 border-t border-border-subtle text-xs text-on-surface-variant flex justify-between">
<span>Thời gian:</span>
<strong className="text-on-surface">08:26:04</strong>
</div>
</div>
</div>
</div>
</div>
</div>
{/* Showcase 2: HR Live Stream Dashboard (Mockup Left, Text Right) */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center" id="bang-dieu-khien">
<div className="lg:col-span-7 order-2 lg:order-1 relative">
<div className="bg-surface-subtle p-5 sm:p-7 rounded-3xl border border-border-subtle shadow-soft-elevation">
{/* Clean Dashboard Window Frame */}
<div className="bg-white rounded-2xl border border-border-crisp overflow-hidden shadow-sm">
{/* Dashboard Topbar */}
<div className="px-5 py-3.5 bg-slate-50 border-b border-border-subtle flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
<span className="font-headline font-semibold text-xs text-on-surface">Live Feed • Toàn bộ cửa văn phòng</span>
</div>
<span className="font-mono text-[11px] text-on-surface-variant">Realtime Cloud Sync</span>
</div>
{/* Realtime List Rows */}
<div className="divide-y divide-border-subtle text-xs">
<div className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">TL</div>
<div>
<div className="font-semibold text-on-surface text-[13px]">Trần Tuấn Linh</div>
<div className="text-on-surface-variant text-[11px]">Kỹ thuật • Cửa chính</div>
</div>
</div>
<div className="text-right">
<span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-600">08:28:10</span>
<div className="text-[10px] text-emerald-700 mt-0.5">Đúng giờ</div>
</div>
</div>
<div className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center">MN</div>
<div>
<div className="font-semibold text-on-surface text-[13px]">Lê Minh Nhật</div>
<div className="text-on-surface-variant text-[11px]">Marketing • Kiosk tầng 3</div>
</div>
</div>
<div className="text-right">
<span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-600">08:29:45</span>
<div className="text-[10px] text-emerald-700 mt-0.5">Đúng giờ</div>
</div>
</div>
<div className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 font-bold flex items-center justify-center">HA</div>
<div>
<div className="font-semibold text-on-surface text-[13px]">Đặng Hoàng Anh</div>
<div className="text-on-surface-variant text-[11px]">Kinh doanh • Cửa chính</div>
</div>
</div>
<div className="text-right">
<span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700">08:34:02</span>
<div className="text-[10px] text-amber-600 mt-0.5">Trễ 4 phút</div>
</div>
</div>
</div>
</div>
</div>
</div>
<div className="lg:col-span-5 order-1 lg:order-2 max-w-lg">
<span className="text-xs font-headline font-bold text-primary tracking-wider uppercase">02 / Bảng điều khiển</span>
<h3 className="font-headline text-3xl font-bold text-on-surface mt-2.5 mb-3 tracking-tight">
              Quân số trực quan theo <span className="italic-accent text-primary">thời gian thực.</span>
</h3>
<p className="font-body text-base text-on-surface-variant leading-relaxed mb-6">
              Nắm bắt tình hình đi trễ, vắng mặt của toàn bộ chi nhánh trên một màn hình duy nhất.
            </p>
<div className="space-y-3 font-headline text-sm font-semibold text-on-surface">
<div className="flex items-center gap-2.5">
<span className="w-5 h-5 rounded-full bg-emerald-badge-bg text-emerald-accent flex items-center justify-center">
<span className="material-symbols-outlined text-[14px]">check</span>
</span>
<span>Thông báo đi trễ tự động qua Zalo OA &amp; Email</span>
</div>
<div className="flex items-center gap-2.5">
<span className="w-5 h-5 rounded-full bg-emerald-badge-bg text-emerald-accent flex items-center justify-center">
<span className="material-symbols-outlined text-[14px]">check</span>
</span>
<span>Duyệt đơn bổ sung công 1 chạm không cần giấy tờ</span>
</div>
</div>
</div>
</div>
{/* Showcase 3: Payroll Export (Text Left, Mockup Right) */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
<div className="lg:col-span-5 max-w-lg">
<span className="text-xs font-headline font-bold text-primary tracking-wider uppercase">03 / Tự động hóa lương</span>
<h3 className="font-headline text-3xl font-bold text-on-surface mt-2.5 mb-3 tracking-tight">
              Xuất bảng công chuẩn chỉ trong <span className="italic-accent text-primary">3 giây.</span>
</h3>
<p className="font-body text-base text-on-surface-variant leading-relaxed mb-6">
              Đồng bộ dữ liệu tính công trực tiếp vào MISA, Bravo, Fast hoặc xuất file Excel chuẩn mẫu.
            </p>
<div className="space-y-3 font-headline text-sm font-semibold text-on-surface">
<div className="flex items-center gap-2.5">
<span className="w-5 h-5 rounded-full bg-emerald-badge-bg text-emerald-accent flex items-center justify-center">
<span className="material-symbols-outlined text-[14px]">check</span>
</span>
<span>Tự động tách ca gãy, ca đêm và giờ OT</span>
</div>
<div className="flex items-center gap-2.5">
<span className="w-5 h-5 rounded-full bg-emerald-badge-bg text-emerald-accent flex items-center justify-center">
<span className="material-symbols-outlined text-[14px]">check</span>
</span>
<span>Tiết kiệm 95% thời gian chốt lương hàng tháng</span>
</div>
</div>
</div>
<div className="lg:col-span-7 relative">
<div className="bg-surface-subtle p-6 sm:p-8 rounded-3xl border border-border-subtle shadow-soft-elevation flex flex-col justify-center">
<div className="bg-white p-5 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between">
<div className="flex items-center gap-4">
<div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
<span className="material-symbols-outlined text-[26px]">receipt_long</span>
</div>
<div>
<h5 className="font-headline font-bold text-on-surface text-base">Bang_Luong_Thang_10_Final.xlsx</h5>
<p className="text-xs text-on-surface-variant">Đã khớp 156/156 nhân sự • Sẵn sàng chi lương</p>
</div>
</div>
<div className="px-4 py-2 rounded-full bg-primary text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm">
<span className="material-symbols-outlined text-[16px]">download</span>
                  Xuất file
                </div>
</div>
</div>
</div>
</div>
</div>
</section>
{/* SECTION 3: PRICING (3 Gói Tinh Giản, Hiện Đại, Rõ Ràng) */}
<section className="py-20 bg-surface-subtle" id="bang-gia">
<div className="max-w-7xl mx-auto px-6">
<div className="max-w-xl mx-auto text-center mb-14">
<span className="font-headline text-[13px] font-bold text-primary tracking-wider uppercase">Biểu phí minh bạch</span>
<h2 className="font-headline text-3xl font-bold text-on-surface mt-2 tracking-tight">
            Đầu tư nhỏ, <span className="italic-accent">hiệu quả vận hành lớn.</span>
</h2>
<p className="font-body text-sm text-on-surface-variant mt-2">Không chi phí ẩn, không phụ thu tính năng.</p>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
{/* Gói 1: Cơ bản */}
<div className="bg-white p-8 rounded-3xl border border-border-subtle shadow-sm flex flex-col justify-between">
<div>
<span className="text-xs font-headline font-bold text-on-surface-variant uppercase tracking-wider">Văn phòng nhỏ</span>
<h3 className="font-headline text-xl font-bold text-on-surface mt-1">Cơ bản</h3>
<div className="mt-4 mb-6">
<span className="font-headline text-3xl font-extrabold text-on-surface">15.000 đ</span>
<span className="text-xs text-on-surface-variant">/ nhân sự / tháng</span>
</div>
<ul className="space-y-3 text-sm text-on-surface-variant">
<li className="flex items-center gap-2.5">
<span className="material-symbols-outlined text-[18px] text-emerald-600">check</span>
                  Tối đa 50 nhân viên
                </li>
<li className="flex items-center gap-2.5">
<span className="material-symbols-outlined text-[18px] text-emerald-600">check</span>
                  1 kiosk nhận diện
                </li>
<li className="flex items-center gap-2.5">
<span className="material-symbols-outlined text-[18px] text-emerald-600">check</span>
                  Dữ liệu thời gian thực
                </li>
</ul>
</div>
<a className="mt-8 w-full py-3 rounded-full border border-border-crisp text-on-surface text-center font-headline text-sm font-semibold hover:bg-surface-subtle transition-colors" href="#dung-thu">
              Bắt đầu ngay
            </a>
</div>
{/* Gói 2: Doanh nghiệp (Thẻ Nổi Bật Đặc Trưng) */}
<div className="bg-white p-8 rounded-3xl border-2 border-primary shadow-soft-elevation relative flex flex-col justify-between">
<div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-white text-[11px] font-headline font-bold tracking-wide uppercase shadow-sm">
              Đề xuất cho SME
            </div>
<div>
<span className="text-xs font-headline font-bold text-primary uppercase tracking-wider">Tăng trưởng nhanh</span>
<h3 className="font-headline text-xl font-bold text-on-surface mt-1">Doanh nghiệp</h3>
<div className="mt-4 mb-6">
<span className="font-headline text-3xl font-extrabold text-on-surface">25.000 đ</span>
<span className="text-xs text-on-surface-variant">/ nhân sự / tháng</span>
</div>
<ul className="space-y-3 text-sm text-on-surface">
<li className="flex items-center gap-2.5 font-medium">
<span className="material-symbols-outlined text-[18px] text-emerald-600">check</span>
                  Không giới hạn kiosk tại các cửa
                </li>
<li className="flex items-center gap-2.5 font-medium">
<span className="material-symbols-outlined text-[18px] text-emerald-600">check</span>
                  Tối đa 300 nhân sự
                </li>
<li className="flex items-center gap-2.5 font-medium">
<span className="material-symbols-outlined text-[18px] text-emerald-600">check</span>
                  Cảnh báo trễ qua Zalo OA
                </li>
<li className="flex items-center gap-2.5 font-medium">
<span className="material-symbols-outlined text-[18px] text-emerald-600">check</span>
                  Kết nối API phần mềm kế toán
                </li>
</ul>
</div>
<a className="mt-8 w-full py-3 rounded-full bg-primary text-white text-center font-headline text-sm font-semibold hover:bg-primary-container shadow-md transition-all" href="#dung-thu">
              Dùng thử 14 ngày
            </a>
</div>
{/* Gói 3: Tùy chỉnh */}
<div className="bg-white p-8 rounded-3xl border border-border-subtle shadow-sm flex flex-col justify-between">
<div>
<span className="text-xs font-headline font-bold text-on-surface-variant uppercase tracking-wider">Tập đoàn &amp; Chuỗi</span>
<h3 className="font-headline text-xl font-bold text-on-surface mt-1">Tùy chỉnh</h3>
<div className="mt-4 mb-6">
<span className="font-headline text-3xl font-extrabold text-on-surface">Liên hệ</span>
<span className="text-xs text-on-surface-variant">báo giá giải pháp</span>
</div>
<ul className="space-y-3 text-sm text-on-surface-variant">
<li className="flex items-center gap-2.5">
<span className="material-symbols-outlined text-[18px] text-emerald-600">check</span>
                  Trên 300 nhân sự
                </li>
<li className="flex items-center gap-2.5">
<span className="material-symbols-outlined text-[18px] text-emerald-600">check</span>
                  Máy chủ riêng On-Premise
                </li>
<li className="flex items-center gap-2.5">
<span className="material-symbols-outlined text-[18px] text-emerald-600">check</span>
                  SLA cam kết 99.9%
                </li>
</ul>
</div>
<a className="mt-8 w-full py-3 rounded-full border border-border-crisp text-on-surface text-center font-headline text-sm font-semibold hover:bg-surface-subtle transition-colors" href="#dung-thu">
              Tư vấn riêng
            </a>
</div>
</div>
</div>
</section>
{/* SECTION 4: TESTIMONIAL & FAQ (Raven Health Quote Style) */}
<section className="py-20 bg-white" id="faq">
<div className="max-w-4xl mx-auto px-6">
{/* Elegant Raven-style Quote */}
<div className="mb-20 text-center">
<span className="material-symbols-outlined text-4xl text-primary/30 mb-4 inline-block">format_quote</span>
<blockquote className="font-headline text-2xl sm:text-3xl font-medium text-on-surface leading-snug tracking-tight italic">
            "Từ ngày lắp đặt FaceAttend, sảnh văn phòng hoàn toàn thông thoáng. Đội ngũ HR tiết kiệm đúng 3 ngày chốt lương mỗi tháng."
          </blockquote>
<div className="mt-6 flex items-center justify-center gap-3">
<div className="w-10 h-10 rounded-full bg-surface-subtle border border-border-crisp flex items-center justify-center font-bold text-primary text-sm">
              HL
            </div>
<div className="text-left">
<div className="font-headline font-bold text-sm text-on-surface">Chị Hoàng Lan</div>
<div className="text-xs text-on-surface-variant">Giám đốc Nhân sự • TechCorp Vietnam</div>
</div>
</div>
</div>
{/* Clean FAQ accordions */}
<div className="max-w-2xl mx-auto">
<div className="text-center mb-8">
<h3 className="font-headline text-2xl font-bold text-on-surface">Giải đáp thắc mắc</h3>
</div>
<div className="space-y-4">
<div className="p-5 rounded-2xl bg-surface-subtle border border-border-subtle">
<div className="font-headline font-bold text-base text-on-surface mb-1.5">Đeo khẩu trang hoặc đổi kính có nhận diện được không?</div>
<p className="text-sm text-on-surface-variant leading-relaxed">Có. Thuật toán phân tích hơn 512 đặc trưng vùng mắt và sống mũi, nhận diện chính xác mà không cần cởi bỏ khẩu trang y tế mỏng.</p>
</div>
<div className="p-5 rounded-2xl bg-surface-subtle border border-border-subtle">
<div className="font-headline font-bold text-base text-on-surface mb-1.5">Khi mất mạng Internet hệ thống có hoạt động?</div>
<p className="text-sm text-on-surface-variant leading-relaxed">Thiết bị có bộ nhớ đệm offline lưu trữ dữ liệu tại chỗ và tự động đồng bộ lên Cloud ngay khi có kết nối trở lại.</p>
</div>
<div className="p-5 rounded-2xl bg-surface-subtle border border-border-subtle">
<div className="font-headline font-bold text-base text-on-surface mb-1.5">Dữ liệu sinh trắc học được bảo mật thế nào?</div>
<p className="text-sm text-on-surface-variant leading-relaxed">Hình ảnh được mã hóa 1 chiều thành chuỗi vector toán học không thể tái tạo ngược, lưu trữ nội địa theo Nghị định 13/2023/NĐ-CP.</p>
</div>
</div>
</div>
</div>
</section>
{/* SECTION 5: DARK CONTRAST CTA BANNER */}
<section className="py-16 bg-white" id="dung-thu">
<div className="max-w-6xl mx-auto px-6">
<div className="bg-midnight-dark text-white rounded-3xl p-10 sm:p-14 relative overflow-hidden shadow-2xl">
{/* Subtle Glow Accent */}
<div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/30 rounded-full filter blur-3xl pointer-events-none"></div>
<div className="relative z-10 max-w-xl">
<span className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-headline font-semibold text-emerald-300 mb-4">
              Miễn phí lắp đặt trải nghiệm 14 ngày
            </span>
<h3 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight mb-4 leading-tight">
              Sẵn sàng hiện đại hóa <span className="italic-accent text-primary-fixed">văn phòng của bạn?</span>
</h3>
<p className="font-body text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
              Kỹ thuật viên FaceAttend sẽ mang thiết bị demo đến tận văn phòng và cài đặt hoàn tất trong 30 phút.
            </p>
<div className="flex flex-wrap items-center gap-4">
<Link className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-white text-slate-900 font-headline text-sm font-semibold hover:bg-slate-100 transition-colors shadow" to="/login">
                Đăng ký trải nghiệm ngay
              </Link>
<a className="inline-flex items-center justify-center h-12 px-6 rounded-full border border-slate-700 text-white font-headline text-sm font-medium hover:bg-slate-800 transition-colors" href="tel:19008920">
                Hotline: 1900 8920
              </a>
</div>
</div>
</div>
</div>
</section>
</main>
{/* MINIMALIST CLEAN FOOTER */}
<footer className="w-full bg-white border-t border-border-subtle py-12">
<div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white">
<span className="material-symbols-outlined text-[18px]">center_focus_strong</span>
</div>
<span className="font-headline font-bold text-base text-on-surface">FaceAttend</span>
<span className="text-xs text-on-surface-variant ml-2">© 2024 FaceAttend Vietnam JSC. All rights reserved.</span>
</div>
<div className="flex items-center gap-6 text-xs text-on-surface-variant font-medium">
<a className="hover:text-on-surface transition-colors" href="#">Chính sách bảo mật TT13</a>
<a className="hover:text-on-surface transition-colors" href="#">Điều khoản dịch vụ</a>
<a className="hover:text-on-surface transition-colors" href="#">Liên hệ hỗ trợ</a>
</div>
</div>
</footer>
    </div>
  );
}
