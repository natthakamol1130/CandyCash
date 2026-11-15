import type { Metadata } from 'next';
import { Prompt } from 'next/font/google';
import './globals.css';

const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
  variable: '--font-prompt',
});

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
    <html lang="th" className={prompt.variable}>
      <body className={`${prompt.className} min-h-screen bg-slate-50 text-slate-800 antialiased`}>
        {children}
      </body>
    </html>
  );
}
