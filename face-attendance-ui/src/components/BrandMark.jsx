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
        fill="#07090b"
        stroke="#1b312c"
        strokeWidth="1.5"
      />
      <path
        d="M10 14.5V10h4.5M30 14.5V10h-4.5M10 25.5V30h4.5M30 25.5V30h-4.5"
        stroke="#14b88a"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse
        cx="20"
        cy="20"
        rx="6.4"
        ry="8.2"
        stroke="#f2f5f3"
        strokeWidth="1.35"
        strokeDasharray="2.2 2"
      />
      <path
        d="M15.6 18.4c1.1-1 2.6-1 3.7 0M20.7 18.4c1.1-1 2.6-1 3.7 0"
        stroke="#14b88a"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="20" cy="21.4" r="1.3" fill="#14b88a" />
    </svg>
  );
}
