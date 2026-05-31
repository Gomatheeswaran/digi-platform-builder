import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            AP
          </div>
          <span className="font-semibold text-slate-800">App Platform</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        {children}
      </main>

      <footer className="p-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} App Platform
      </footer>
    </div>
  );
}
