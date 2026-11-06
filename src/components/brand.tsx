import Image from 'next/image';

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
