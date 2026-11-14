import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CandyCash — ระบบบันทึกรายรับ-รายจ่ายส่วนตัว',
  description: 'Personal Money and Expense Logging System (CPE 334 Deliverable 1)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}
