"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Brain, Paperclip, ChevronDown, Copy, Check, FileText, Image as ImageIcon, Search, X, History, Trash2, Plus, Mic, Volume2, Square, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ui/ConfirmModal";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  loading?: boolean;
  attachment?: { type: "pdf" | "image"; name: string };
  mermaid?: string;
};

function parseMarkdown(t: string): string {
  if (!t) return "";
  
  // Parse multi-line code blocks first (excludes mermaid as it's stripped before this)
  let html = t.replace(/```(\w*)\n([\s\S]*?)```/g, '<div class="my-5 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-[#1e1e1e] shadow-lg"><div class="px-4 py-2 bg-[#2d2d2d] text-xs font-mono text-gray-400 flex justify-between border-b border-gray-700/50"><span>$1</span></div><pre class="p-4 text-sm text-gray-100 overflow-x-auto"><code>$2</code></pre></div>');

  html = html
    .replace(/^### 1\.\s*(.+)$/gm, '<div class="mt-6 mb-4 flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 p-3 rounded-xl border border-blue-100 dark:border-blue-500/20"><span class="text-2xl drop-shadow-sm">🎯</span><h3 class="text-lg font-bold text-blue-700 dark:text-blue-400">1. $1</h3></div>')
    .replace(/^### 2\.\s*(.+)$/gm, '<div class="mt-8 mb-4 flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 p-3 rounded-xl border border-amber-100 dark:border-amber-500/20"><span class="text-2xl drop-shadow-sm">💡</span><h3 class="text-lg font-bold text-amber-700 dark:text-amber-400">2. $1</h3></div>')
    .replace(/^### 3\.\s*(.+)$/gm, '<div class="mt-8 mb-4 flex items-center gap-2 bg-purple-50 dark:bg-purple-500/10 p-3 rounded-xl border border-purple-100 dark:border-purple-500/20"><span class="text-2xl drop-shadow-sm">🧠</span><h3 class="text-lg font-bold text-purple-700 dark:text-purple-400">3. $1</h3></div>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-8 mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2"><span class="w-1.5 h-5 bg-indigo-500 rounded-full inline-block"></span>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-4 border-b border-gray-200 dark:border-gray-800 pb-2 text-gray-900 dark:text-white">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4 text-indigo-600 dark:text-indigo-400">$1</h1>')
    .replace(/^---+$/gm, '') // Remove horizontal lines (---)
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic text-gray-600 dark:text-gray-300">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-white/10 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded-md text-sm font-mono border border-gray-200 dark:border-gray-700">$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 rounded-r-xl my-4 italic text-gray-800 dark:text-gray-200 shadow-sm">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<div class="flex items-start gap-3 my-2 leading-relaxed"><span class="text-green-500 mt-1 select-none text-sm drop-shadow-sm">✅</span><span class="flex-1">$1</span></div>')
    .replace(/^(\d+)\. (.+)$/gm, '<div class="flex items-start gap-3 my-2 leading-relaxed"><span class="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs mt-0.5 select-none border border-blue-200 dark:border-blue-500/30">$1</span><span class="flex-1">$2</span></div>');

  // Spacing Management: Convert \n to <br/> but intelligently strip them around block elements
  html = html.replace(/\n/g, '<br/>');
  html = html.replace(/(<br\/>){3,}/g, '<br/><br/>'); // Max 2 breaks
  html = html.replace(/<br\/>\s*(<div|<h1|<h2|<h3|<blockquote|<pre)/g, '$1'); // Strip before blocks
  html = html.replace(/(<\/div>|<\/h1>|<\/h2>|<\/h3>|<\/blockquote>|<\/pre>)\s*<br\/>/g, '$1'); // Strip after blocks

  // Safely handle images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
    let safeUrl = encodeURI(url.trim().replace(/ /g, '%20')).replace(/%2520/g, '%20');
    safeUrl = safeUrl.replace(/\?(\w+=)/, '&$1').replace(/\?&/, '?').replace(/\?+/, '?');
    if (!safeUrl.includes('?')) safeUrl += '?width=800&height=400&nologo=true';
    safeUrl += '&cb=' + Date.now();
    return `<div class="my-6 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 relative min-h-[200px] flex items-center justify-center">
      <div class="absolute inset-0 flex items-center justify-center -z-10 text-gray-400 text-sm">Loading visual...</div>
      <img src="${safeUrl}" alt="${alt}" class="w-full h-auto block object-cover max-h-[400px]" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'p-8 text-center text-red-400 font-medium\\'>⚠️ Visual rendering failed due to network.</div>';"/>
      <div class="absolute bottom-0 left-0 right-0 p-3 text-xs text-white text-center bg-black/60 backdrop-blur-sm">${alt}</div>
    </div>`;
  });

  return html;
}

const SYS_PROMPT = `You are ZenithStudy, an incredibly enthusiastic, friendly, and super smart study assistant! 🚀

YOUR PERSONA & TONE (CRITICAL):
1. You must act exactly like an energetic, caring human friend and zenithstudy. Call the user "દોસ્ત" (friend) or "buddy".
2. Use lots of emojis (😄, 🚀, 🧠, 💡, 💯) to make your answers feel alive and highly expressive!
3. Never be robotic or boring. Be highly conversational, empathetic, and always show excitement about learning.
4. If a user is frustrated, be extremely apologizing, humble, and warmly encouraging.

CRITICAL LANGUAGE RULE: 
You should naturally mix English and a friendly, conversational tone. If the user asks in Gujarati or Hinglish, you MUST reply in the same warm, expressive Gujarati/Hinglish!

Rules:
1. Always understand the user's question first. Give logical, practical answers.
2. If the question is related to study, give a step-by-step explanation.
3. Give a short answer first, then a detailed explanation. Explain in a way a student can easily understand.
4. For exam questions, answer according to marks (Short for 2 marks, Detailed with points for larger marks).
5. REAL-LIFE EXAMPLES: EVERY single time you explain a concept, you MUST provide at least one logical, relatable, real-life example to make it easy to understand.
6. For coding questions, give working code + explanation + common mistakes + output.
7. Highlight important points. Format answers beautifully with headings, bullets, and tables.
8. Motivate the student at the end with extremely positive energy! 🌟
9. REMEMBER USER CONTEXT: Pay close attention to any details the user shares about themselves and tailor future answers.

Answer style:
- Super energetic and friendly!
- Like a smart best friend
- Practical and simple
- ABSOLUTELY NOT robotic

Whenever explaining a core concept, try to include these two helpful sections at the end:

### 1. Trick to Memorize
Provide a mnemonic, story, or a simple trick to memorize this concept easily.

### 2. Memory Map
Provide a Mermaid.js diagram code wrapped in \`\`\`mermaid ... \`\`\`
CRITICAL MERMAID RULES:
1. ALWAYS start the code with \`graph TD\`.
2. ONLY use simple English letters for node IDs (A, B, C).
3. ALWAYS wrap the text inside double quotes within brackets! Example: \`A["Cell Functions"] --> B["Growth"]\`.
4. NEVER use spaces, quotes, or non-English text as node IDs!`;

export default function AITutorPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string|null>(null);
  const [threads, setThreads] = useState<{ id: string, title: string, messages: Message[], updatedAt: number }[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string|null>(null);
  const [attachment, setAttachment] = useState<{type:"pdf"|"image";name:string;data:string;}|null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  // Load Threads from Supabase
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);
        
        // Fetch from Supabase
        const { data: threadsData, error } = await supabase
          .from("ai_threads")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        if (!error && threadsData && threadsData.length > 0) {
          const mappedThreads = threadsData.map(t => ({
            id: t.id,
            title: t.title,
            messages: t.messages || [],
            updatedAt: t.updated_at
          }));
          setThreads(mappedThreads);
          setCurrentThreadId(mappedThreads[0].id);
          setMsgs(mappedThreads[0].messages);
        } else {
          // If no threads in supabase, try to migrate from localStorage
          try {
            const saved = localStorage.getItem(`sb-ai-threads-${user.id}`); 
            if (saved) {
              const parsed = JSON.parse(saved);
              setThreads(parsed);
              if (parsed.length > 0) {
                 setCurrentThreadId(parsed[0].id);
                 setMsgs(parsed[0].messages);
                 // Upload migrated data to Supabase
                 for (const t of parsed) {
                   await supabase.from("ai_threads").upsert({
                     id: t.id, user_id: user.id, title: t.title, messages: t.messages, updated_at: t.updatedAt || Date.now()
                   });
                 }
                 localStorage.removeItem(`sb-ai-threads-${user.id}`);
              }
            }
          } catch {}
        }
      } catch {}
    })();
  }, []);

  // Save current thread to Supabase whenever msgs change
  useEffect(() => {
    if (userId && currentThreadId && msgs.length > 0) {
      setThreads(prev => {
        const existing = prev.find(t => t.id === currentThreadId);
        const title = existing?.title || (msgs.find(m => m.role === 'user')?.content.slice(0, 30) || "New Chat");
        let updated;
        if (existing) {
          updated = prev.map(t => t.id === currentThreadId ? { ...t, messages: msgs, updatedAt: Date.now(), title } : t);
        } else {
           updated = [{ id: currentThreadId, title, messages: msgs, updatedAt: Date.now() }, ...prev];
        }
        
        // Upsert to Supabase asynchronously
        supabase.from("ai_threads").upsert({
          id: currentThreadId,
          user_id: userId,
          title: title,
          messages: msgs,
          updated_at: Date.now()
        }).then();

        return updated;
      });
    }
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, currentThreadId, userId]);

  useEffect(() => {
    const handleResize = (e: MessageEvent) => {
      if (e.data?.type === 'resize-mermaid' && e.data?.id && e.data?.height) {
        const iframe = document.getElementById(e.data.id) as HTMLIFrameElement;
        if (iframe) iframe.style.height = (e.data.height + 40) + 'px';
      }
    };
    window.addEventListener('message', handleResize);
    return () => window.removeEventListener('message', handleResize);
  }, []);

  const startNewChat = () => {
    setMsgs([]); 
    setAttachment(null);
    setCurrentThreadId(Date.now().toString());
    setShowHistory(false);
  };

  const loadThread = (id: string) => {
    const t = threads.find(x => x.id === id);
    if (t) { setMsgs(t.messages); setCurrentThreadId(t.id); setShowHistory(false); }
  };

  const deleteThread = async (id: string) => {
    const filtered = threads.filter(t => t.id !== id);
    setThreads(filtered);
    if (userId) {
      await supabase.from("ai_threads").delete().eq("id", id);
    }
    if (currentThreadId === id) startNewChat();
  };

  const handleFile = async (file: File) => {
    const isPDF = file.type === "application/pdf";
    const isImg = file.type.startsWith("image/");
    if (!isPDF && !isImg) { toast.error("Only PDF or Image files!"); return; }
    if (file.size > 15 * 1024 * 1024) { toast.error("Max 15MB file allowed"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const full = e.target?.result as string;
      const base64 = full.split(",")[1];
      setAttachment({ type: isPDF ? "pdf" : "image", name: file.name, data: base64 });
    };
    reader.readAsDataURL(file);
  };

  const startListening = () => {
    try {
      const sr = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!sr) { toast.error("તમારું બ્રાઉઝર Voice Input સપોર્ટ કરતું નથી (Chrome વાપરો)."); return; }
      const recognition = new sr();
      recognition.lang = 'gu-IN';
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e: any) => setInput(prev => prev + (prev ? " " : "") + e.results[0][0].transcript);
      recognition.onerror = (e: any) => { 
        setIsListening(false); 
        if (e.error === 'not-allowed') toast.error("માઈક્રોફોન ની પરમિશન ચાલુ કરો!");
        else toast.error("Mic Error: " + e.error);
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (err: any) {
      toast.error("Mic start failed.");
    }
  };

  const toggleSpeech = (text: string, id: string) => {
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_]|```[\s\S]*?```|<[^>]+>/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'gu-IN';
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const callAPI = async (messages: any[], system: string, att?: any) => {
    const r = await fetch("/api/ai/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, system, type: "chat", attachment: att }),
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e?.error?.message || e?.error || "Server error"); }
    return (await r.json()).text || "";
  };

  const send = async () => {
    if ((!input.trim() && !attachment) || loading) return;
    const q = input.trim() || (attachment?.type === "pdf" ? "Analyze this PDF" : "Analyze this image");
    const att = attachment;
    setInput(""); setAttachment(null); setLoading(true);
    const uid = Date.now().toString(), aid = (Date.now() + 1).toString(), ts = Date.now();
    
    let tid = currentThreadId;
    if (!tid) {
      tid = Date.now().toString();
      setCurrentThreadId(tid);
    }

    setMsgs(p => [
      ...p,
      { id: uid, role: "user", content: q, timestamp: ts, attachment: att ? { type: att.type, name: att.name } : undefined },
      { id: aid, role: "assistant", content: "", loading: true, timestamp: ts },
    ]);

    try {
      // Pass the entire conversation history so the AI remembers everything!
      const hist = msgs.map(m => ({ role: m.role, content: m.content }));
      const ans = await callAPI([...hist, { role: "user", content: q }], SYS_PROMPT, att);
      
      let rawAns = ans;
      let mermaidCode = "";
      const mermaidMatch = rawAns.match(/```mermaid\n([\s\S]*?)```/);
      if (mermaidMatch) {
        mermaidCode = mermaidMatch[1];
        rawAns = rawAns.replace(/```mermaid\n[\s\S]*?```/g, "");
      }

      setMsgs(p => p.map(m => m.id === aid ? { ...m, content: rawAns, loading: false, mermaid: mermaidCode || undefined } : m));
    } catch (err: any) {
      setMsgs(p => p.map(m => m.id === aid ? { ...m, content: `**Error:** ${err.message}`, loading: false } : m));
    } finally {
      setLoading(false);
    }
  };

  const renderIsolatedMermaid = (code: string, msgId: string) => {
    const iframeId = `mermaid-${msgId}`;
    const safeCode = code.replace(/`/g, '\\`').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = `
      <html>
        <head>
          <style>
            body { background: transparent; color: white; font-family: sans-serif; display: flex; justify-content: center; margin: 0; padding: 20px; overflow: hidden; }
            .mermaid { display: flex; justify-content: center; width: 100%; }
            svg[id^="d3-error"], #d3-error-box { display: none !important; opacity: 0 !important; visibility: hidden !important; }
            .error-icon { display: none !important; }
            .mermaid .node rect, .mermaid .node circle, .mermaid .node polygon { fill: #2F2F2F !important; stroke: #555 !important; stroke-width: 2px !important; }
            .mermaid .node * { color: #FFF !important; font-weight: bold !important; }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
        </head>
        <body>
          <div class="mermaid">${safeCode}</div>
          <script>
            try {
              mermaid.initialize({ startOnLoad: true, theme: 'dark', flowchart: { curve: 'basis' } });
              setTimeout(() => {
                if (document.body.innerText.includes('Syntax error')) {
                  document.body.innerHTML = '<div style="color:#ff6b6b;font-family:sans-serif;padding:15px;border:1px solid #ff6b6b;border-radius:10px;text-align:center;">⚠️ મેમરી મેપ બનાવવામાં AI ની ભૂલ (Syntax Error)</div>';
                }
                const h = document.body.scrollHeight;
                window.parent.postMessage({ type: 'resize-mermaid', height: h, id: '${iframeId}' }, '*');
              }, 500);
            } catch(e) {
              document.body.innerHTML = '<div style="color:#ff6b6b;font-family:sans-serif;padding:15px;border:1px solid #ff6b6b;border-radius:10px;text-align:center;">⚠️ ડાયાગ્રામ રેન્ડરિંગ એરર</div>';
            }
          </script>
        </body>
      </html>
    `;
    return <iframe id={iframeId} srcDoc={html} className="w-full min-h-[250px] border border-gray-200 dark:border-gray-800 bg-[#0d1117] rounded-xl my-4 transition-all duration-300" scrolling="no" sandbox="allow-scripts" title="Diagram" />;
  };

  const SUGG = [
    {icon:"🫀", text:"How does the human heart work?"},
    {icon:"🌿", text:"Explain photosynthesis"},
    {icon:"⚡", text:"Newton's laws explained"},
    {icon:"🧬", text:"Functions of a cell"},
  ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-[#0A0F1C] dark:via-[#0D1326] dark:to-[#120B20] text-gray-800 dark:text-gray-100 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1/2 h-1/2 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />
      <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ""; }} />

      {/* Floating Header Controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <a href="/dashboard" className="pointer-events-auto flex items-center justify-center w-11 h-11 bg-white/80 dark:bg-[#2A2A2A]/80 backdrop-blur-md rounded-full border border-gray-200 dark:border-gray-700/50 shadow-sm hover:scale-105 active:scale-95 transition-all text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white group">
          <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
        </a>
        
        <div className="pointer-events-auto flex items-center gap-1 bg-white/80 dark:bg-[#2A2A2A]/80 backdrop-blur-md rounded-full border border-gray-200 dark:border-gray-700/50 shadow-sm p-1">
          <button onClick={() => setShowHistory(true)} className="flex items-center justify-center w-11 h-11 text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors" title="Chat History">
            <History size={20} />
          </button>
          <div className="w-[1px] h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
          <button onClick={startNewChat} className="flex items-center justify-center w-11 h-11 text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors" title="New Chat">
            <Plus size={22} />
          </button>
        </div>
      </div>

      {/* History Sidebar Modal */}
      {showHistory && (
        <div className="absolute inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowHistory(false)} />
          <div className="relative w-[300px] h-full bg-white dark:bg-[#212121] shadow-2xl flex flex-col border-r border-gray-200 dark:border-gray-800">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#1E1E1E]">
              <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800 dark:text-gray-200"><History size={18}/> Chat History</h3>
              <button onClick={() => setShowHistory(false)} className="w-11 h-11 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors text-gray-500"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {threads.length === 0 ? (
                <div className="text-center text-gray-500 text-sm mt-10">No history found. Start a new chat!</div>
              ) : (
                threads.map(t => (
                  <div key={t.id} onClick={() => loadThread(t.id)} className={`group cursor-pointer p-3 rounded-xl flex items-center justify-between border transition-all ${currentThreadId === t.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 shadow-sm' : 'border-transparent hover:bg-gray-50 dark:hover:bg-[#2A2A2A]'}`}>
                    <div className="truncate text-sm font-medium flex-1 mr-2 text-gray-800 dark:text-gray-200">{t.title || 'New Chat'}</div>
                    <button onClick={(e) => { e.stopPropagation(); setThreadToDelete(t.id); }} className="opacity-0 group-hover:opacity-100 w-11 h-11 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-md transition-all"><Trash2 size={18}/></button>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1E1E1E]">
              <button onClick={startNewChat} className="w-full flex items-center justify-center gap-2 p-3 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl shadow-md hover:opacity-90 transition-opacity">
                <Plus size={18} /> Start New Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
        <div className="max-w-[768px] mx-auto space-y-8 pb-32">
          {!msgs.length && !loading ? (
            <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto px-4 mt-8 animate-fade-in z-10 relative">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-xl shadow-indigo-500/20 transform hover:scale-105 transition-transform duration-300">
                <Brain size={40} className="drop-shadow-md" />
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-10 text-center bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-400 tracking-tight">
                How can I help you study today?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {SUGG.map((s, i) => (
                  <button key={i} onClick={() => { setInput(s.text); setTimeout(send, 50); }} className="flex items-center gap-4 p-4 text-left rounded-2xl bg-white/50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 group backdrop-blur-md">
                    <span className="text-2xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">{s.icon}</span>
                    <span className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            msgs.map(m => (
              <div key={m.id} className={`flex gap-4 ${m.role === "user" ? "justify-end" : "justify-start"} animate-pop-in`}>
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1 bg-white dark:bg-[#1A233A]">
                    <Brain size={18} className="text-gray-700 dark:text-gray-300" />
                  </div>
                )}
                <div className={`max-w-[90%] md:max-w-[85%] ${m.role === "user" ? "bg-blue-50/80 backdrop-blur-sm border-blue-100/60 dark:bg-[#1A233A] px-5 py-3.5 rounded-3xl rounded-tr-sm border dark:border-blue-500/20 shadow-sm" : "text-gray-800 dark:text-gray-200 w-full"}`}>
                  {m.attachment && (
                    <div className="flex items-center gap-3 bg-white dark:bg-[#1E1E1E] p-3 rounded-xl mb-3 border border-gray-200 dark:border-gray-700">
                      <div className="w-10 h-10 rounded bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
                        {m.attachment.type === "pdf" ? <FileText size={20} /> : <ImageIcon size={20} />}
                      </div>
                      <span className="font-medium text-sm truncate">{m.attachment.name}</span>
                    </div>
                  )}

                  {m.loading ? (
                    <div className="flex space-x-2 p-3">
                      <div className="w-2.5 h-2.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2.5 h-2.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></div>
                      <div className="w-2.5 h-2.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
                    </div>
                  ) : (
                    m.role === "assistant" ? (
                      <div className="space-y-4">
                        <div dangerouslySetInnerHTML={{ __html: parseMarkdown(m.content) }} className="leading-relaxed" />
                        
                        {m.mermaid && renderIsolatedMermaid(m.mermaid, m.id)}

                        <div className="flex items-center gap-2 mt-4 pt-2 border-t border-gray-200 dark:border-gray-800/50">
                          <button onClick={() => toggleSpeech(m.content, m.id)} className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${speakingId === m.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                            {speakingId === m.id ? <Square size={14} className="fill-current" /> : <Volume2 size={14} />} {speakingId === m.id ? "Stop" : "Read Aloud"}
                          </button>
                          <button onClick={() => { navigator.clipboard.writeText(m.content); setCopied(m.id); setTimeout(() => setCopied(null), 2000); }} className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
                            {copied === m.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />} {copied === m.id ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    )
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={bottom} />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-white via-white/90 dark:from-[#0B1221] dark:via-[#0B1221]/90 to-transparent backdrop-blur-sm z-20">
        <div className="max-w-[768px] mx-auto relative">
          <div className="absolute -top-14 right-0 left-0 flex justify-center">
            {attachment && (
              <div className="flex items-center gap-2 bg-white dark:bg-[#1E2536] border border-gray-200 dark:border-gray-700/80 px-4 py-2 rounded-full shadow-lg shadow-black/5 animate-slide-pop backdrop-blur-md">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{attachment.name}</span>
                <button onClick={() => setAttachment(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"><X size={14} /></button>
              </div>
            )}
          </div>
          <div className="relative bg-white/80 dark:bg-[#151B2B]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 rounded-3xl flex items-end p-2 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-400 dark:focus-within:border-indigo-500/50 transition-all shadow-xl shadow-black/5">
            <button onClick={() => fileRef.current?.click()} className="group p-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white rounded-full transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/10 flex-shrink-0 active:scale-90">
              <Paperclip size={20} className="group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-300" />
            </button>
            <button onClick={startListening} className={`group p-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white rounded-full transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/10 flex-shrink-0 active:scale-90 ${isListening ? 'text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50' : ''}`}>
              <Mic size={20} className={`${isListening ? 'animate-pulse scale-110' : 'group-hover:scale-110'} transition-transform duration-300`} />
            </button>
            <textarea
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Message ZenithStudy..."
              className="flex-1 max-h-[200px] min-h-[44px] bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-500 outline-none resize-none py-3 px-2 overflow-y-auto border-0 focus:border-0 focus:ring-0 focus:outline-none"
              style={{ boxShadow: 'none' }}
              rows={1}
            />
            <button onClick={send} disabled={(!input.trim() && !attachment) || loading} className="group p-3 text-white bg-black dark:bg-white dark:text-black rounded-full hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-300 flex-shrink-0 shadow-sm disabled:shadow-none">
              <Send size={18} className={`transition-transform duration-300 ${(input.trim() || attachment) && !loading ? "translate-x-0.5 group-hover:translate-x-1 group-hover:-translate-y-1" : ""}`} />
            </button>
          </div>
          <div className="text-center mt-3 text-xs text-gray-500">
            ZenithStudy can make mistakes. Check important info.
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={threadToDelete !== null}
        title="Delete Chat"
        message="Are you sure you want to delete this chat history? This action cannot be undone."
        onConfirm={() => threadToDelete && deleteThread(threadToDelete)}
        onCancel={() => setThreadToDelete(null)}
      />
    </div>
  );
}
