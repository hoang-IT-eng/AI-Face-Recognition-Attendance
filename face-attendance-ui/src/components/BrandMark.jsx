export default function BrandMark({ size = 34, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <g stroke="#2f6bff" strokeWidth="4.6" strokeLinecap="round">
        <path d="M22 6 H14 a8 8 0 0 0 -8 8 v8" />
        <path d="M42 6 h8 a8 8 0 0 1 8 8 v8" />
        <path d="M58 42 v8 a8 8 0 0 1 -8 8 h-8" />
        <path d="M22 58 h-8 a8 8 0 0 1 -8 -8 v-8" />
        <path d="M23 39 q9 7 18 0" strokeWidth="4.2" />
      </g>
      <circle cx="25" cy="27" r="3.1" fill="#2f6bff" />
      <circle cx="39" cy="27" r="3.1" fill="#2f6bff" />
    </svg>
  );
}
