import type { Metadata } from 'next';
import '../client/styles/globals.css';

export const metadata: Metadata = {
  title: 'An Nam Luxury Resort & Spa | Trải Nghiệm Nghỉ Dưỡng Thượng Lưu',
  description: 'Hệ thống quản lý và đặt phòng nghỉ dưỡng cao cấp ven biển An Nam Resort.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
