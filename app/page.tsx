export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="max-w-2xl">
        <span className="px-3 py-1 text-xs font-semibold text-brand-500 bg-brand-500/10 border border-brand-500/20 rounded-full">
          Day 2 Initialized
        </span>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          CredAI Audit Stack
        </h1>
        <p className="mt-4 text-lg text-slate-400">
          The structural repository foundation is fully stood up. The live pricing parser, deterministic engine, and rich UI canvas will live here.
        </p>
      </div>
    </main>
  );
}
