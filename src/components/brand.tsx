import Image from 'next/image';

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className={`brand ${light ? 'brand-light' : ''}`}>
      <svg
        width="42"
        height="48"
        viewBox="14 10 100 114"
        fill="none"
        strokeWidth="5.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path
          d="M64 107C36 102 19 80 24 55C27 40 34 27 44 18C62 29 74 49 72 70C71 84 67 97 64 107Z"
          stroke={light ? 'currentColor' : '#24796f'}
        />
        <path
          d="M64 107C92 102 109 80 104 55C101 40 94 27 84 18C66 29 54 49 56 70C57 84 61 97 64 107Z"
          stroke={light ? 'currentColor' : '#17384a'}
        />
        <path
          d="M64 78V119"
          stroke={light ? 'currentColor' : '#17384a'}
        />
      </svg>
      <span>
        อยู่ต่อ<span className="brand-english">YooTor</span>
      </span>
    </span>
  );
}
export function TreeArt() {
  return (
    <Image
      className="tree-art"
      src="/images/yootor-tree-realistic.png"
      width={1280}
      height={1280}
      sizes="(max-width: 600px) 90vw, (max-width: 1024px) 50vw, 560px"
      alt=""
      aria-hidden="true"
    />
  );
}
