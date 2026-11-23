import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-pink-50/90 via-white to-pink-100/40">
      <div className="max-w-xl rounded-3xl bg-white p-8 shadow-xl border border-pink-100">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">CandyCash</h1>
        <p className="text-slate-600 mb-5">
          Personal Money and Expense Logging System (ระบบบันทึกรายรับ-รายจ่ายส่วนตัว)
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-50 text-pink-600 text-sm font-semibold mb-6">
          Sprint 1 Engineering Baseline Ready (Cloud Run Release 2)
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 text-white text-sm font-semibold shadow-md shadow-pink-200 hover:from-pink-600 hover:to-rose-500 transition-all"
          >
            Open Dashboard / เข้าใช้งาน →
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-2xl border border-pink-200 bg-pink-50/50 text-pink-600 text-sm font-semibold hover:bg-pink-100/60 transition-all"
          >
            Sign In / Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
