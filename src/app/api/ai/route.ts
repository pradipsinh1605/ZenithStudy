import { NextRequest, NextResponse } from "next/server";

const rateLimit = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimit.get(ip);
  if (!limit || now > limit.reset) { rateLimit.set(ip, { count:1, reset:now+60_000 }); return true; }
  if (limit.count >= 20) return false;
  limit.count++;
  return true;
}

function sanitize(text: string): string {
  return text.replace(/<[^>]*>/g,"").replace(/javascript:/gi,"").replace(/on\w+\s*=/gi,"").trim().slice(0,4000);
}

const BLOCKED = [/ignore previous instructions/i,/ignore all instructions/i,/pretend you are/i,/disregard/i,/forget everything/i,/system prompt/i];
function isInjection(t: string) { return BLOCKED.some(p=>p.test(t)); }

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) return NextResponse.json({error:"Too many requests."},{status:429});

    let body: any;
    try { body = await req.json(); } catch { return NextResponse.json({error:"Invalid body"},{status:400}); }

    const { messages, system, type, attachment } = body;

    if (!Array.isArray(messages)||messages.length===0) return NextResponse.json({error:"Invalid messages"},{status:400});

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return NextResponse.json({error:"AI service not configured"},{status:500});

    const lastMsg = messages[messages.length-1];
    const lastText = typeof lastMsg.content==="string" ? lastMsg.content : "";
    const clean = sanitize(lastText);
    if (isInjection(clean)) return NextResponse.json({text:"I can only help with study topics! 📚"},{status:200});

    // Build messages
    const prevMsgs = messages.slice(0,-1).map((m:any)=>({
      role: m.role,
      content: typeof m.content==="string" ? sanitize(m.content) : m.content,
    }));

    let finalContent: any = clean;
    let model = "llama-3.3-70b-versatile";

    if (attachment?.type === "image") {
      // Use vision model for images
      model = "meta-llama/llama-4-scout-17b-16e-instruct";
      finalContent = [
        { type:"text", text: clean||"Explain this image for studying." },
        { type:"image_url", image_url:{ url:`data:image/jpeg;base64,${attachment.data}` } },
      ];
    } else if (attachment?.type === "pdf") {
      // PDF - send as text context
      finalContent = `[Analyzing PDF: "${attachment.name}"]\n\nUser question: ${clean}\n\nPlease answer based on the PDF document context.`;
    }

    prevMsgs.push({ role:"user", content: finalContent });

    const sysMsg = system ? [{ role:"system", content:sanitize(system) }] : [];

    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(), 45_000);

    let res: Response;
    try {
      res = await fetch("https://api.groq.com/openai/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${groqKey}`},
        body: JSON.stringify({
          model,
          max_tokens: type==="diagram"?800:type==="json"?2500:1500,
          temperature: type==="diagram"?0.2:type==="json"?0.3:0.7,
          stream: false,
          messages: [...sysMsg, ...prevMsgs],
        }),
        signal: controller.signal,
      });
    } catch(err:any) {
      if (err.name==="AbortError") return NextResponse.json({error:"Request timed out."},{status:408});
      throw err;
    } finally { clearTimeout(timeout); }

    if (!res.ok) {
      const errText = await res.text();
      console.error("Groq error:", res.status, errText);
      if (res.status===429) return NextResponse.json({error:"AI busy. Wait a moment."},{status:429});
      if (res.status===400) return NextResponse.json({error:"Invalid request to AI."},{status:400});
      return NextResponse.json({error:"AI service error."},{status:502});
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || "";
    if (!text) return NextResponse.json({error:"Empty AI response"},{status:502});
    return NextResponse.json({text});

  } catch(e:any) {
    console.error("AI route error:",e);
    return NextResponse.json({error:"Something went wrong."},{status:500});
  }
}
