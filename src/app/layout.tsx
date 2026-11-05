import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'อยู่ต่อ · YooTor',
  description: 'เพราะความห่วงใย ไม่ได้จบลงที่การจากลา',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
