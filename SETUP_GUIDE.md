# 🚀 StudyBuddy AI — Complete Setup Guide
### (Step-by-step — Coding knowledge વગર!)

---

## ⏱️ Total Time: 45–60 minutes

---

## 📋 STEP 1 — Node.js Install કરો (10 min)

1. Browser માં જાઓ: **https://nodejs.org**
2. **"LTS" version** download કરો (green button)
3. Download થયેલ file open કરો
4. "Next → Next → Install" click કરો
5. ✅ Done!

**Check કરો:**
- Windows: Start menu → "cmd" search → open
- Mac: Spotlight → "Terminal" open
- Type: `node --version`
- Output: `v20.x.x` જેવું દેખાય = Success ✅

---

## 📋 STEP 2 — Supabase Setup (10 min)

### 2.1 Account બનાવો
1. **https://supabase.com** પર જાઓ
2. **"Start your project"** click કરો
3. **GitHub** or **Google** થી signup કરો

### 2.2 New Project બનાવો
1. **"New Project"** click કરો
2. Name: `studybuddy-ai`
3. Password: strong password type કરો (save it!)
4. Region: **South Asia (Mumbai)** select કરો
5. **"Create new project"** click કરો
6. ⏳ 2 minutes wait કરો...

### 2.3 Database Tables બનાવો
1. Left sidebar: **"SQL Editor"** click કરો
2. **"New query"** click કરો
3. `src/lib/supabase/schema.sql` file open કરો
4. **સારો content copy** કરો
5. SQL Editor માં **paste** કરો
6. **"Run"** button click કરો (Ctrl+Enter)
7. ✅ "Success" message દેખાય = Done!

### 2.4 Keys Copy કરો
1. Left sidebar: **"Settings"** → **"API"** click કરો
2. આ values copy કરો:
   - **Project URL** (https://xxx.supabase.co)
   - **anon public key** (long key)

---

## 📋 STEP 3 — Project Setup (10 min)

### 3.1 ZIP Extract કરો
1. Download કરેલ `studybuddy-ai.zip` extract કરો
2. Folder name: `studybuddy-ai`

### 3.2 .env.local File બનાવો
1. `studybuddy-ai` folder open કરો
2. `.env.example` file copy કરો
3. Copy ની name change કરો: `.env.local`
4. File open કરો (Notepad/TextEdit)
5. Replace કરો:

```
NEXT_PUBLIC_SUPABASE_URL=    ← Step 2.4 નો Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  ← Step 2.4 નો anon key
```

Save કરો! ✅

### 3.3 Dependencies Install
1. `studybuddy-ai` folder ની address copy કરો
2. cmd/Terminal open કરો
3. Type: `cd ` (space સાથે) + folder address paste
4. Enter press કરો
5. Type: `npm install`
6. ⏳ 3-5 minutes wait (packages download)
7. ✅ Done!

---

## 📋 STEP 4 — App Run કરો (2 min)

cmd/Terminal માં type કરો:
```
npm run dev
```

Browser open કરો: **http://localhost:3000**

🎉 **App ready!**

---

## 📋 STEP 5 — Vercel Deploy (Free) (10 min)

### 5.1 GitHub Account
1. **https://github.com** → Sign up (Google use)
2. **New Repository** → Name: `studybuddy-ai`
3. **"uploading an existing file"** click
4. Project files upload કરો
5. **Commit changes** click

### 5.2 Vercel Deploy
1. **https://vercel.com** → Sign up with GitHub
2. **"New Project"** → GitHub repo select
3. **Environment Variables** add:
   ```
   NEXT_PUBLIC_SUPABASE_URL      = (your url)
   NEXT_PUBLIC_SUPABASE_ANON_KEY = (your key)
   NEXT_PUBLIC_DIFY_API_KEY      = app-kkORe4izyR1KVfIY93tyQj3N
   NEXT_PUBLIC_DIFY_BASE_URL     = https://api.dify.ai/v1
   ```
4. **"Deploy"** click
5. ⏳ 2 minutes...
6. ✅ Live URL મળશે! (e.g. studybuddy-ai.vercel.app)

---

## 🎊 Congratulations!

```
✅ Real database (Supabase)
✅ Real login/signup  
✅ Data permanently saved
✅ Live on internet
✅ AI Tutor (Dify)
✅ All features working
✅ Hacker-proof security
✅ No crashes
```

---

## ❓ Problem આવે તો?

**Error: "command not found"**
→ Node.js ફરીથી install કરો

**Error: "SUPABASE_URL missing"**
→ .env.local file check કરો

**White screen on deploy**
→ Vercel Environment Variables check કરો

**Database error**
→ SQL schema ફરીથી run કરો

---

## 📱 WhatsApp Support

કોઈ problem આવે — screenshot લઈ Claude ને show કરો!
Claude ગુજરાતીમાં help કરશે 😊
