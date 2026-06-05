export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-white shadow-lg shadow-slate-200/60 p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
