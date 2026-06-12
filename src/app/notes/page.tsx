"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { addXP } from "@/lib/xp-utils";
import toast from "react-hot-toast";
import Loader from "@/components/ui/Loader";
import { sanitizeFilename, validateFile } from "@/lib/validateFile";
import ConfirmModal from "@/components/ui/ConfirmModal";

// ── Icons (inline SVG to avoid import issues) ──
const Icon = {
  Plus:     ()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Folder:   ()=><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>,
  File:     ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  PDF:      ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h3"/></svg>,
  Back:     ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>,
  Trash:    ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  External: ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  Edit:     ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Save:     ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Upload:   ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>,
  Search:   ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

function debounce(fn: Function, ms: number) {
  let t: ReturnType<typeof setTimeout>;
  return (...args: any[]) => { clearTimeout(t); t = setTimeout(()=>fn(...args), ms); };
}

type View = "folders" | "folder-notes" | "note-view" | "note-edit" | "note-new" | "pdf-upload";

export default function NotesPage() {
  const supabase = createClient();
  const fileRef  = useRef<HTMLInputElement>(null);

  const [notes,     setNotes]     = useState<any[]>([]);
  const [subjects,  setSubjects]  = useState<any[]>([]);
  const [userId,    setUserId]    = useState("");
  const [loading,   setLoading]   = useState(true);

  // Navigation
  const [view,         setView]        = useState<View>("folders");
  const [activeFolder, setActiveFolder] = useState<any>(null); // subject obj or {name:"No Subject",color:"#6B7280"}
  const [activeNote,   setActiveNote]  = useState<any>(null);

  // New Note form
  const [newTitle,   setNewTitle]   = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newContent, setNewContent] = useState("");
  const [saving,     setSaving]     = useState(false);

  // PDF Upload form
  const [pdfFile,      setPdfFile]      = useState<File|null>(null);
  const [pdfTitle,     setPdfTitle]     = useState("");
  const [pdfSubject,   setPdfSubject]   = useState("");
  const [uploading,    setUploading]    = useState(false);

  // Note edit
  const [editContent,  setEditContent]  = useState("");
  const [autoSaving,   setAutoSaving]   = useState(false);
  const [lastSaved,    setLastSaved]    = useState<Date|null>(null);

  // Plus menu
  const [showPlusMenu, setShowPlusMenu] = useState(false);

  // Search
  const [search, setSearch] = useState("");
  const [noteToDelete, setNoteToDelete] = useState<any>(null);

  useEffect(()=>{ fetchData(); },[]);

  const fetchData = async () => {
    try{
      const {data:{user},error} = await supabase.auth.getUser();
      if(error||!user){setLoading(false);return;}
      setUserId(user.id);
      const [{data:n},{data:s}] = await Promise.all([
        supabase.from("notes").select("*").eq("user_id",user.id).order("created_at",{ascending:false}),
        supabase.from("subjects").select("*").eq("user_id",user.id).order("name"),
      ]);
      setNotes(n||[]);
      setSubjects(s||[]);
      if(s&&s.length>0){setNewSubject(s[0].name);setPdfSubject(s[0].name);}
      setLoading(false);
    }catch(e){setLoading(false);}
  };

  // ── Folder structure ──
  const folders = useMemo(() => {
    const map: Record<string,any[]> = {"No Subject":[]};
    subjects.forEach(s=>{ map[s.name]=[]; });
    notes.forEach(n=>{
      const key = n.subject||"No Subject";
      if(!map[key]) map[key]=[];
      map[key].push(n);
    });
    // Remove empty "No Subject" if nothing there
    if(map["No Subject"].length===0) delete map["No Subject"];
    return map;
  }, [notes, subjects]);

  const subjectColor = (name:string) => {
    if(name==="No Subject") return "#6B7280";
    return subjects.find(s=>s.name===name)?.color||"#4F8EF7";
  };

  // Filter notes in active folder by search
  const folderNotes = activeFolder
    ? (folders[activeFolder.name]||[]).filter(n=>
        search ? n.title.toLowerCase().includes(search.toLowerCase()) : true
      )
    : [];

  // ── Save new note ──
  const saveNewNote = async () => {
    if(!newTitle.trim()){toast.error("Title enter karo!");return;}
    setSaving(true);
    const {data,error} = await supabase.from("notes").insert({
      user_id:userId, title:newTitle.trim(),
      subject:newSubject||null, content:newContent,
      starred:false, note_type:"text",
    }).select().single();
    if(error){toast.error("Save failed: "+error.message);setSaving(false);return;}
    setNotes(p=>[data,...p]);
    await addXP(supabase,userId,10);
    toast.success("Note saved! +10 XP 📝");
    setNewTitle(""); setNewContent("");
    // Go to folder
    const folder = subjects.find(s=>s.name===newSubject)||{name:newSubject||"No Subject",color:subjectColor(newSubject||"No Subject")};
    setActiveFolder(folder);
    setView("folder-notes");
    setSaving(false);
  };

  // PDF Upload
  const handlePdfSelect = (file:File) => {
    const result = validateFile(file);
    if(result.ok === false){toast.error(result.message); return;}
    const safeFile = new File([file], result.sanitizedName, { type: "application/pdf" });
    setPdfFile(safeFile);
    if(!pdfTitle) setPdfTitle(result.sanitizedName.replace(/\.pdf$/i,""));
  };

  const savePdf = async () => {
    if(!pdfFile){toast.error("PDF select karo!");return;}
    if(!pdfTitle.trim()){toast.error("Title enter karo!");return;}
    setUploading(true);
    try{
      const validationRes = await fetch("/api/upload", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({name:pdfFile.name,size:pdfFile.size,type:pdfFile.type}),
      });
      const validation = await validationRes.json();
      if(!validationRes.ok||!validation.ok){toast.error(validation?.error?.message||"Invalid PDF file");setUploading(false);return;}
      const safeName = sanitizeFilename(validation.sanitizedName);
      const safeFile = safeName===pdfFile.name ? pdfFile : new File([pdfFile], safeName, { type:"application/pdf" });
      // Upload to Supabase Storage
      const path = `${userId}/${Date.now()}_${safeName}`;
      const {error:upErr} = await supabase.storage.from("note-pdfs").upload(path,safeFile,{upsert:false});
      if(upErr){
        toast.error("Upload failed: " + upErr.message);
        setUploading(false);
        return;
      }
      const {data:urlData} = supabase.storage.from("note-pdfs").getPublicUrl(path);
      const {data,error} = await supabase.from("notes").insert({
        user_id:userId, title:pdfTitle.trim(),
        subject:pdfSubject||null, content:"",
        pdf_name:safeName, pdf_url:urlData.publicUrl,
        note_type:"pdf", starred:false,
      }).select().single();
      if(error){toast.error("Save failed");setUploading(false);return;}
      setNotes(p=>[data,...p]);
      finishPdfUpload(data);
    }catch(e){toast.error("Upload error");setUploading(false);}
  };
  const finishPdfUpload = (data:any) => {
    toast.success("PDF uploaded! 📄");
    setPdfFile(null); setPdfTitle(""); setUploading(false);
    const folder = subjects.find(s=>s.name===pdfSubject)||{name:pdfSubject||"No Subject",color:subjectColor(pdfSubject||"No Subject")};
    setActiveFolder(folder);
    setView("folder-notes");
  };

  // ── Delete note ──
  const deleteNote = async (note:any) => {
    // Remove from storage if PDF
    if(note.pdf_url&&note.pdf_url.startsWith("http")&&!note.pdf_url.startsWith("data:")) {
      const path = note.pdf_url.split("/note-pdfs/")[1];
      if(path) await supabase.storage.from("note-pdfs").remove([path]);
    }
    await supabase.from("notes").delete().eq("id",note.id);
    setNotes(p=>p.filter(n=>n.id!==note.id));
    if(activeNote?.id===note.id) setView("folder-notes");
    toast.success("Deleted");
  };

  // Auto save for text notes
  const autoSaveFn = useCallback(
    debounce(async (noteId:string, body:string) => {
      setAutoSaving(true);
      const {data,error} = await supabase.from("notes")
        .update({content:body,updated_at:new Date().toISOString()})
        .eq("id",noteId)
        .select()
        .single();
      setAutoSaving(false);
      if(error||!data){toast.error("Failed to auto-save note.");return;}
      setLastSaved(new Date());
      setNotes(p=>p.map(n=>n.id===noteId?data:n));
      setActiveNote((n:any)=>n?.id===noteId?data:n);
    },1500), [supabase]
  );

  const saveEdit = async () => {
    if(!activeNote) return;
    const {data,error} = await supabase.from("notes")
      .update({content:editContent,updated_at:new Date().toISOString()})
      .eq("id",activeNote.id)
      .select()
      .single();
    if(error||!data){toast.error("Failed to save note.");return;}
    setNotes(p=>p.map(n=>n.id===activeNote.id?data:n));
    setActiveNote(data); setView("note-view");
    toast.success("Saved!");
  };
  if(loading) return <Loader />;

  // ════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════

  const col  = (name:string) => subjectColor(name);
  const inp  = {width:"100%",borderRadius:12,padding:"11px 14px",fontSize:14,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",outline:"none",fontFamily:"inherit",boxSizing:"border-box" as const};
  const btn  = (bg:string,c:string="#fff") => ({padding:"11px 20px",borderRadius:12,border:"none",background:bg,color:c,cursor:"pointer",fontWeight:700,fontSize:14,fontFamily:"inherit",transition:"all .2s"} as React.CSSProperties);

  return (
    <div style={{maxWidth:900,margin:"0 auto"}}>
      <style>{`
        @keyframes popIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
        .folder-card:hover{transform:translateY(-3px)!important;box-shadow:0 8px 28px rgba(0,0,0,.25)!important;}
        .note-row:hover{background:rgba(79,142,247,.06)!important;border-color:rgba(79,142,247,.3)!important;}
        .plus-menu-item:hover{background:rgba(79,142,247,.08)!important;}
      `}</style>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept=".pdf" style={{display:"none"}}
        onChange={e=>{if(e.target.files?.[0])handlePdfSelect(e.target.files[0]);e.target.value="";}}/>

      {/* ── TOP BAR ── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:16}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {/* Back button */}
          {view!=="folders"&&(
            <button onClick={()=>{
              if(view==="note-view"||view==="note-edit") setView("folder-notes");
              else if(view==="folder-notes"||view==="note-new"||view==="pdf-upload") { setView("folders"); setActiveFolder(null); setSearch(""); }
            }} style={{width:38,height:38,borderRadius:12,border:"1px solid var(--border)",background:"var(--card)",color:"var(--text)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Icon.Back/>
            </button>
          )}
          <div>
            <h2 style={{fontFamily:"var(--font-lora),serif",fontSize:20,fontWeight:700,color:"var(--text)"}}>
              {view==="folders"&&"📁 My Notes"}
              {view==="folder-notes"&&`📂 ${activeFolder?.name}`}
              {view==="note-view"&&activeNote?.title}
              {view==="note-edit"&&"✏️ Editing"}
              {view==="note-new"&&"📝 New Note"}
              {view==="pdf-upload"&&"📄 Upload PDF"}
            </h2>
            <p style={{fontSize:12,color:"var(--muted)",marginTop:2}}>
              {view==="folders"&&`${Object.keys(folders).length} subject folders · ${notes.length} total notes`}
              {view==="folder-notes"&&`${folderNotes.length} notes in this folder`}
              {view==="note-view"&&`${activeNote?.note_type==="pdf"?"PDF":"Text note"} · ${activeNote?.subject||"No Subject"}`}
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div style={{display:"flex",gap:8,alignItems:"center",position:"relative"}}>
          {/* Search - only in folder-notes */}
          {view==="folder-notes"&&(
            <div style={{display:"flex",alignItems:"center",gap:8,borderRadius:12,border:"1px solid var(--border)",background:"var(--card)",padding:"8px 14px"}}>
              <Icon.Search/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
                style={{background:"none",border:"none",outline:"none",color:"var(--text)",fontSize:13,fontFamily:"inherit",width:140}}/>
            </div>
          )}

          {/* Plus button - only on folder/folder-notes views */}
          {(view==="folders"||view==="folder-notes")&&(
            <div style={{position:"relative"}}>
              <button onClick={()=>setShowPlusMenu(!showPlusMenu)}
                style={{width:44,height:44,borderRadius:14,border:"none",background:"linear-gradient(135deg,#4F8EF7,#6366F1)",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 18px rgba(79,142,247,.4)",transition:"all .2s",transform:showPlusMenu?"rotate(45deg)":"rotate(0)"}}>
                <Icon.Plus/>
              </button>

              {/* Plus Dropdown Menu */}
              {showPlusMenu&&(
                <div style={{position:"absolute",right:0,top:52,background:"var(--card)",borderRadius:16,border:"1px solid var(--border)",boxShadow:"0 16px 48px rgba(0,0,0,.4)",padding:8,minWidth:220,zIndex:100,animation:"popIn .2s ease"}}>
                  {/* Write Note */}
                  <button className="plus-menu-item" onClick={()=>{
                    setShowPlusMenu(false);
                    if(activeFolder&&activeFolder.name!=="No Subject") setNewSubject(activeFolder.name);
                    setView("note-new");
                  }} style={{width:"100%",padding:"12px 16px",borderRadius:12,border:"none",background:"transparent",cursor:"pointer",fontFamily:"inherit",textAlign:"left" as const,display:"flex",alignItems:"center",gap:12,transition:"all .15s"}}>
                    <div style={{width:36,height:36,borderRadius:10,background:"rgba(79,142,247,.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"#4F8EF7"}}>✏️</div>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>Write Note</div>
                      <div style={{fontSize:11,color:"var(--muted)"}}>Create text note (+10 XP)</div>
                    </div>
                  </button>

                  <div style={{height:1,background:"var(--border)",margin:"4px 8px"}}/>

                  {/* Upload PDF */}
                  <button className="plus-menu-item" onClick={()=>{
                    setShowPlusMenu(false);
                    if(activeFolder&&activeFolder.name!=="No Subject") setPdfSubject(activeFolder.name);
                    setView("pdf-upload");
                  }} style={{width:"100%",padding:"12px 16px",borderRadius:12,border:"none",background:"transparent",cursor:"pointer",fontFamily:"inherit",textAlign:"left" as const,display:"flex",alignItems:"center",gap:12,transition:"all .15s"}}>
                    <div style={{width:36,height:36,borderRadius:10,background:"rgba(248,113,113,.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"#F87171"}}>📄</div>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>Upload PDF</div>
                      <div style={{fontSize:11,color:"var(--muted)"}}>Upload PDF as note</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Edit button - note view */}
          {view==="note-view"&&activeNote?.note_type!=="pdf"&&(
            <button onClick={()=>{setEditContent(activeNote.content||"");setView("note-edit");setLastSaved(null);}}
              style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:12,border:"1px solid rgba(79,142,247,.3)",background:"rgba(79,142,247,.1)",color:"#4F8EF7",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit"}}>
              <Icon.Edit/> Edit
            </button>
          )}

          {/* Note actions */}
          {(view==="note-view"||view==="note-edit")&&(
            <button onClick={()=>setNoteToDelete(activeNote)}
              style={{display:"flex",alignItems:"center",gap:5,padding:"9px 14px",borderRadius:12,border:"1px solid rgba(248,113,113,.3)",background:"rgba(248,113,113,.1)",color:"#F87171",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit"}}>
              <Icon.Trash/> Delete
            </button>
          )}
        </div>
      </div>

      {/* Close plus menu on outside click */}
      {showPlusMenu&&<div style={{position:"fixed",inset:0,zIndex:99}} onClick={()=>setShowPlusMenu(false)}/>}

      {/* ══════════════════════════════════════
          VIEW: FOLDERS
      ══════════════════════════════════════ */}
      {view==="folders"&&(
        <div>
          {Object.keys(folders).length===0?(
            <div style={{textAlign:"center",padding:"60px 20px",color:"var(--muted)"}}>
              <div style={{fontSize:52,marginBottom:16}}>📁</div>
              <h3 style={{fontSize:18,fontWeight:700,color:"var(--text)",marginBottom:8}}>No Notes Yet</h3>
              <p style={{fontSize:14,lineHeight:1.7}}>Click the <strong style={{color:"#4F8EF7"}}>+</strong> button to write a note or upload a PDF!</p>
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16}}>
              {Object.entries(folders).map(([name,fNotes])=>{
                const c = col(name);
                const pdfs  = (fNotes as any[]).filter(n=>n.note_type==="pdf").length;
                const texts = (fNotes as any[]).filter(n=>n.note_type!=="pdf").length;
                return(
                  <div key={name} className="folder-card"
                    onClick={()=>{ setActiveFolder({name,color:c}); setView("folder-notes"); setSearch(""); }}
                    style={{padding:"20px 18px",borderRadius:20,border:`1px solid ${c}44`,background:`${c}0e`,cursor:"pointer",transition:"all .25s",animation:"popIn .3s ease"}}>
                    <div style={{fontSize:40,marginBottom:12}}>
                      <svg width="44" height="44" viewBox="0 0 24 24" fill={c}>
                        <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
                      </svg>
                    </div>
                    <h3 style={{fontSize:15,fontWeight:700,color:"var(--text)",marginBottom:6}}>{name}</h3>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {texts>0&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:`${c}22`,color:c,fontWeight:700}}>✏️ {texts} notes</span>}
                      {pdfs>0&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:"rgba(248,113,113,.15)",color:"#F87171",fontWeight:700}}>📄 {pdfs} PDFs</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          VIEW: FOLDER NOTES LIST
      ══════════════════════════════════════ */}
      {view==="folder-notes"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {folderNotes.length===0?(
            <div style={{textAlign:"center",padding:48,color:"var(--muted)"}}>
              <div style={{fontSize:40,marginBottom:12}}>📭</div>
              <p style={{fontSize:15,fontWeight:600}}>{search?"No results found":"Folder is empty"}</p>
              <p style={{fontSize:13,marginTop:6}}>Click <strong style={{color:"#4F8EF7"}}>+</strong> to add notes or upload PDFs</p>
            </div>
          ):folderNotes.map((note,i)=>{
            const isPdf = note.note_type==="pdf";
            const c = col(activeFolder?.name||"");
            return(
              <div key={note.id} className="note-row"
                style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",borderRadius:16,border:"1px solid var(--border)",background:"var(--card)",cursor:"pointer",transition:"all .2s",animation:`slideIn .25s ease ${i*40}ms both`}}>
                {/* Icon */}
                <div style={{width:40,height:40,borderRadius:12,background:isPdf?"rgba(248,113,113,.12)":`${c}12`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:isPdf?"#F87171":c}}>
                  {isPdf?<Icon.PDF/>:<Icon.File/>}
                </div>
                {/* Info */}
                <div style={{flex:1,minWidth:0}} onClick={()=>{setActiveNote(note);setView("note-view");}}>
                  <div style={{fontSize:15,fontWeight:700,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{note.title}</div>
                  <div style={{fontSize:11,color:"var(--muted)",marginTop:3,display:"flex",gap:8}}>
                    <span>{isPdf?"📄 PDF":"✏️ Note"}</span>
                    <span>·</span>
                    <span>{new Date(note.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span>
                    {!isPdf&&note.content&&<><span>·</span><span>{note.content.slice(0,30)}{note.content.length>30?"…":""}</span></>}
                  </div>
                </div>
                {/* Actions */}
                <div style={{display:"flex",gap:8,flexShrink:0}}>
                  {isPdf&&(
                    <button onClick={async(e)=>{
                      e.stopPropagation();
                      // Refresh signed URL before opening
                      if(note.pdf_url && note.pdf_url.includes("supabase")) {
                        const path = `${userId}/${note.pdf_url.split(`${userId}/`)[1]?.split("?")[0]}`;
                        const {data} = await supabase.storage.from("note-pdfs").createSignedUrl(path, 3600);
                        if(data?.signedUrl) { window.open(data.signedUrl,"_blank"); return; }
                      }
                      window.open(note.pdf_url,"_blank");
                    }}
                    style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:10,border:"1px solid rgba(79,142,247,.3)",background:"rgba(79,142,247,.1)",color:"#4F8EF7",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                    <Icon.External/> Open
                  </button>
                  )}
                  {!isPdf&&(
                    <button onClick={(e)=>{e.stopPropagation();setActiveNote(note);setView("note-view");}}
                      style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:10,border:"1px solid rgba(79,142,247,.3)",background:"rgba(79,142,247,.1)",color:"#4F8EF7",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                      Open
                    </button>
                  )}
                  <button onClick={(e)=>{e.stopPropagation();setNoteToDelete(note);}}
                    style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:10,border:"1px solid rgba(248,113,113,.3)",background:"rgba(248,113,113,.08)",color:"#F87171",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                    <Icon.Trash/> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════
          VIEW: NOTE VIEW (text)
      ══════════════════════════════════════ */}
      {view==="note-view"&&activeNote&&(
        <div style={{borderRadius:20,border:"1px solid var(--border)",background:"var(--card)",overflow:"hidden"}}>
          <div style={{padding:"20px 28px",borderBottom:"1px solid var(--border)",background:"rgba(79,142,247,.04)"}}>
            <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
              {activeNote.subject&&<span style={{fontSize:11,padding:"3px 12px",borderRadius:20,fontWeight:700,background:`${col(activeNote.subject)}22`,color:col(activeNote.subject)}}>{activeNote.subject}</span>}
              <span style={{fontSize:11,padding:"3px 12px",borderRadius:20,fontWeight:700,background:"var(--bg)",color:"var(--muted)"}}>{new Date(activeNote.created_at).toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</span>
            </div>
            <h2 style={{fontFamily:"var(--font-lora),serif",fontSize:24,color:"var(--text)",fontWeight:700}}>{activeNote.title}</h2>
          </div>
          <div style={{padding:"24px 28px",minHeight:300}}>
            {activeNote.note_type==="pdf"?(
              <div style={{textAlign:"center",padding:40}}>
                <div style={{fontSize:48,marginBottom:16}}>📄</div>
                <p style={{fontSize:16,fontWeight:700,color:"var(--text)",marginBottom:8}}>{activeNote.pdf_name}</p>
                <button onClick={async()=>{
                  if(activeNote.pdf_url && activeNote.pdf_url.includes("supabase")) {
                    const path = `${userId}/${activeNote.pdf_url.split(`${userId}/`)[1]?.split("?")[0]}`;
                    const {data} = await supabase.storage.from("note-pdfs").createSignedUrl(path, 3600);
                    if(data?.signedUrl) { window.open(data.signedUrl,"_blank"); return; }
                  }
                  window.open(activeNote.pdf_url,"_blank");
                }}
                style={{display:"inline-flex",alignItems:"center",gap:8,padding:"12px 24px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#4F8EF7,#6366F1)",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  <Icon.External/> Open PDF
                </button>
              </div>
            ):(
              <p style={{fontSize:15,color:"var(--text)",lineHeight:1.9,whiteSpace:"pre-wrap"}}>
                {activeNote.content||<span style={{color:"var(--muted)",fontStyle:"italic"}}>Empty note. Click Edit to write.</span>}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          VIEW: NOTE EDIT
      ══════════════════════════════════════ */}
      {view==="note-edit"&&activeNote&&(
        <div style={{borderRadius:20,border:"1px solid var(--border)",background:"var(--card)",overflow:"hidden"}}>
          <div style={{padding:"16px 24px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(79,142,247,.04)"}}>
            <span style={{fontSize:13,color:"var(--muted)"}}>{autoSaving?"💾 Saving...":lastSaved?`✓ Saved ${lastSaved.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}`:""}</span>
            <div style={{display:"flex",gap:8}}>
              <button onClick={saveEdit} style={{...btn("linear-gradient(135deg,#34D399,#059669)"),display:"flex",alignItems:"center",gap:6,fontSize:13,padding:"8px 16px"}}>
                <Icon.Save/> Save
              </button>
              <button onClick={()=>setView("note-view")} style={{...btn("var(--bg)","var(--muted)"),border:"1px solid var(--border)",fontSize:13,padding:"8px 14px"}}>
                Cancel
              </button>
            </div>
          </div>
          <textarea value={editContent}
            onChange={e=>{setEditContent(e.target.value); autoSaveFn(activeNote.id,e.target.value);}}
            autoFocus
            style={{width:"100%",minHeight:"60vh",background:"none",border:"none",outline:"none",color:"var(--text)",fontSize:15,fontFamily:"inherit",resize:"none",lineHeight:1.9,padding:"24px 28px",boxSizing:"border-box"}}
            placeholder="Write your note here…"/>
        </div>
      )}

      {/* ══════════════════════════════════════
          VIEW: NEW NOTE FORM
      ══════════════════════════════════════ */}
      {view==="note-new"&&(
        <div style={{borderRadius:20,border:"1px solid var(--border)",background:"var(--card)",padding:28,animation:"popIn .25s ease"}}>
          <h3 style={{fontFamily:"var(--font-lora),serif",fontSize:18,color:"var(--text)",marginBottom:20,fontWeight:700}}>✏️ Write a New Note</h3>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"var(--muted)",textTransform:"uppercase" as const,marginBottom:6,letterSpacing:".05em"}}>Note Title *</label>
              <input type="text" value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Enter note title…" autoFocus style={inp}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"var(--muted)",textTransform:"uppercase" as const,marginBottom:6,letterSpacing:".05em"}}>Subject (Folder)</label>
              <select value={newSubject} onChange={e=>setNewSubject(e.target.value)} style={inp}>
                <option value="">No Subject</option>
                {subjects.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"var(--muted)",textTransform:"uppercase" as const,marginBottom:6,letterSpacing:".05em"}}>Content</label>
              <textarea value={newContent} onChange={e=>setNewContent(e.target.value)} rows={8} placeholder="Start writing your note…"
                style={{...inp,resize:"none" as const}}/>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={saveNewNote} disabled={saving}
                style={{...btn("linear-gradient(135deg,#4F8EF7,#6366F1)"),opacity:saving?.7:1,flex:1}}>
                {saving?"Saving…":"💾 Save Note (+10 XP)"}
              </button>
              <button onClick={()=>setView(activeFolder?"folder-notes":"folders")}
                style={{...btn("var(--bg)","var(--muted)"),border:"1px solid var(--border)"}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          VIEW: PDF UPLOAD FORM
      ══════════════════════════════════════ */}
      {view==="pdf-upload"&&(
        <div style={{borderRadius:20,border:"1px solid var(--border)",background:"var(--card)",padding:28,animation:"popIn .25s ease"}}>
          <h3 style={{fontFamily:"var(--font-lora),serif",fontSize:18,color:"var(--text)",marginBottom:20,fontWeight:700}}>📄 Upload PDF Note</h3>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>

            {/* PDF Drop Zone */}
            <div onClick={()=>fileRef.current?.click()}
              style={{borderRadius:16,border:`2px dashed ${pdfFile?"#34D399":"rgba(79,142,247,.4)"}`,background:pdfFile?"rgba(52,211,153,.06)":"rgba(79,142,247,.04)",padding:"32px 24px",textAlign:"center",cursor:"pointer",transition:"all .2s"}}>
              {pdfFile?(
                <>
                  <div style={{fontSize:36,marginBottom:8}}>📄</div>
                  <p style={{fontSize:15,fontWeight:700,color:"#34D399"}}>{pdfFile.name}</p>
                  <p style={{fontSize:12,color:"var(--muted)",marginTop:4}}>{(pdfFile.size/1024/1024).toFixed(1)} MB · Click to change</p>
                </>
              ):(
                <>
                  <div style={{fontSize:36,marginBottom:10,color:"rgba(79,142,247,.6)"}}><Icon.Upload/></div>
                  <p style={{fontSize:15,fontWeight:700,color:"var(--text)"}}>Click to select PDF</p>
                  <p style={{fontSize:12,color:"var(--muted)",marginTop:4}}>Max 10MB · PDF files only</p>
                </>
              )}
            </div>

            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"var(--muted)",textTransform:"uppercase" as const,marginBottom:6,letterSpacing:".05em"}}>PDF Title *</label>
              <input type="text" value={pdfTitle} onChange={e=>setPdfTitle(e.target.value)} placeholder="Enter title for this PDF…" style={inp}/>
            </div>

            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"var(--muted)",textTransform:"uppercase" as const,marginBottom:6,letterSpacing:".05em"}}>Subject (Folder)</label>
              <select value={pdfSubject} onChange={e=>setPdfSubject(e.target.value)} style={inp}>
                <option value="">No Subject</option>
                {subjects.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            <div style={{display:"flex",gap:10}}>
              <button onClick={savePdf} disabled={uploading||!pdfFile}
                style={{...btn("linear-gradient(135deg,#F87171,#EF4444)"),opacity:(uploading||!pdfFile)?.6:1,flex:1}}>
                {uploading?"Uploading…":"📤 Upload PDF"}
              </button>
              <button onClick={()=>{ setPdfFile(null); setPdfTitle(""); setView(activeFolder?"folder-notes":"folders"); }}
                style={{...btn("var(--bg)","var(--muted)"),border:"1px solid var(--border)"}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {view==="folders"&&(
        <div style={{textAlign:"center",marginTop:20,fontSize:12,color:"var(--muted)"}}>
          📝 {notes.filter(n=>n.note_type!=="pdf").length} text notes · 📄 {notes.filter(n=>n.note_type==="pdf").length} PDFs · +10 XP each note
        </div>
      )}

      <ConfirmModal
        isOpen={noteToDelete !== null}
        title="Delete Note"
        message={`Are you sure you want to delete "${noteToDelete?.title}"? This action cannot be undone.`}
        onConfirm={() => noteToDelete && deleteNote(noteToDelete)}
        onCancel={() => setNoteToDelete(null)}
      />
    </div>
  );
}
