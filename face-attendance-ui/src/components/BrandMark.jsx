export default function BrandMark({ size = 34, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2"
        width="36"
        height="36"
        rx="9"
        fill="#17171f"
        stroke="#2c2c38"
        strokeWidth="1.5"
      />
      <path
        d="M10 14.5V10h4.5M30 14.5V10h-4.5M10 25.5V30h4.5M30 25.5V30h-4.5"
        stroke="#8f8ce0"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="17.5" r="4.4" stroke="#f2f2f5" strokeWidth="1.6" />
      <path
        d="M12.5 28.5c1.6-3.2 4.3-4.6 7.5-4.6s5.9 1.4 7.5 4.6"
        stroke="#f2f2f5"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
