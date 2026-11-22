export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-xl rounded-2xl bg-white p-8 shadow-xl border border-pink-100">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">CandyCash</h1>
        <p className="text-slate-600 mb-6">
          Personal Money and Expense Logging System (ระบบบันทึกรายรับ-รายจ่ายส่วนตัว)
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-50 text-pink-600 text-sm font-semibold">
          Sprint 1 Engineering Baseline Ready (Cloud Run Release 2)
        </div>
      </div>
    </main>
  );
}
