export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#030711] px-4 py-16 text-slate-200 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="text-sm font-bold text-cyan-200 hover:text-white">ZenithStudy AI</a>
        <h1 className="mt-8 font-lora text-4xl font-bold text-white">Terms & Conditions</h1>
        <p className="mt-4 text-sm leading-7 text-slate-400">Last updated: May 9, 2026</p>
        <div className="mt-10 space-y-7 text-sm leading-7 text-slate-300">
          <p>By using ZenithStudy AI, you agree to use the platform for lawful study, productivity, and educational purposes.</p>
          <p>AI-generated content may be incomplete or incorrect. You are responsible for reviewing answers, notes, quizzes, and study recommendations before relying on them.</p>
          <p>You must not misuse the service, attempt to access other users&apos; data, overload AI endpoints, or submit harmful content.</p>
          <p>ZenithStudy AI may update features, limits, pricing, or these terms as the product evolves.</p>
        </div>
      </div>
    </main>
  );
}