export function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className={`brand ${light ? 'brand-light' : ''}`}>
      <svg
        width="38"
        height="42"
        viewBox="0 0 38 42"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M19 35C2 31 1 12 10 5c10 2 18 17 9 30Z"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M19 35c17-4 18-23 9-30-10 2-18 17-9 30Z"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path d="M19 14v26" stroke="currentColor" strokeWidth="1.7" />
      </svg>
      <span>
        อยู่ต่อ<span className="brand-english">YooTor</span>
      </span>
    </span>
  );
}
export function TreeArt() {
  return (
    <svg
      className="tree-art"
      viewBox="0 0 260 240"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M129 228c-2-65 5-129 0-189M130 197C72 169 54 111 51 76m79 92c51-29 72-69 76-115M129 140C98 119 84 89 87 55m46 55c25-23 34-48 32-77"
        stroke="#9aab95"
        strokeWidth="1.5"
      />
      <g fill="#dce4d2" stroke="#afbea2" strokeWidth=".7">
        <path d="M51 90C20 85 13 62 24 45c22 3 36 18 27 45Z" />
        <path d="M65 126c-4-34 9-50 30-50 9 23-1 44-30 50Z" />
        <path d="M82 157c-33 2-52-12-50-35 25-8 47 5 50 35Z" />
        <path d="M104 182c-6-31 2-49 23-52 12 21 5 42-23 52Z" />
        <path d="M130 71c-27-14-32-38-17-55 22 8 29 29 17 55Z" />
        <path d="M89 75C64 65 61 43 76 29c20 8 25 26 13 46Z" />
        <path d="M164 53c-11-26-2-47 19-50 12 20 5 40-19 50Z" />
        <path d="M191 104c-7-28 6-47 29-45 8 23-3 41-29 45Z" />
        <path d="M171 140c22-28 46-30 60-13-11 24-33 30-60 13Z" />
        <path d="M147 180c19-28 44-34 61-19-7 24-31 32-61 19Z" />
      </g>
    </svg>
  );
}
