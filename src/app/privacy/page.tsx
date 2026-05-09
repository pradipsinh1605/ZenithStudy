export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#030711] px-4 py-16 text-slate-200 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="text-sm font-bold text-cyan-200 hover:text-white">StudyBuddy AI</a>
        <h1 className="mt-8 font-lora text-4xl font-bold text-white">Privacy Policy</h1>
        <p className="mt-4 text-sm leading-7 text-slate-400">Last updated: May 9, 2026</p>
        <div className="mt-10 space-y-7 text-sm leading-7 text-slate-300">
          <p>StudyBuddy AI uses account, study, and product interaction data to provide notes, planning, AI tutoring, reminders, analytics, and related student productivity features.</p>
          <p>We use Supabase for authentication and app data storage. AI requests may be processed by our configured AI provider through server-side routes so private provider keys are not exposed to your browser.</p>
          <p>We do not sell personal information. We may use necessary service providers to operate the app, secure accounts, diagnose issues, and improve reliability.</p>
          <p>You can contact us at support@studybuddy.ai for privacy questions or account data requests.</p>
        </div>
      </div>
    </main>
  );
}