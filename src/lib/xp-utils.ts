// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// StudyBuddy AI — XP, Streak & Badge System
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── XP Event ──
export const XP_EVENT = "studybuddy:xp-updated";

export function fireXPUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(XP_EVENT));
  }
}

export function onXPUpdate(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(XP_EVENT, cb);
  return () => window.removeEventListener(XP_EVENT, cb);
}

// ── Add XP ──
export async function addXP(
  supabase: any,
  userId: string,
  amount: number
): Promise<number> {
  try {
    const { data } = await supabase
      .from("user_xp").select("total_xp").eq("user_id", userId).single();
    const newXp    = (data?.total_xp || 0) + amount;
    const newLevel = Math.floor(newXp / 500) + 1;
    await supabase.from("user_xp")
      .update({ total_xp: newXp, level: newLevel }).eq("user_id", userId);
    fireXPUpdate();
    return newXp;
  } catch (e) {
    console.error("XP update failed:", e);
    return 0;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STREAK SYSTEM
// Call on every login/app open
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function updateStreak(
  supabase: any,
  userId: string
): Promise<{ streak: number; isNew: boolean; milestone: number | null }> {
  try {
    const { data } = await supabase
      .from("user_xp")
      .select("streak, last_active, total_xp")
      .eq("user_id", userId)
      .single();

    const today      = new Date().toISOString().slice(0, 10);
    const lastActive = data?.last_active || "";
    const streak     = data?.streak || 0;

    // Already updated today — no change
    if (lastActive === today) {
      return { streak, isNew: false, milestone: null };
    }

    const yesterday    = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    let newStreak: number;
    if (lastActive === yesterdayStr) {
      // ✅ Studied yesterday → streak continues!
      newStreak = streak + 1;
    } else {
      // ❌ Missed a day OR first time → reset to 1
      newStreak = 1;
    }

    // Check milestone bonuses
    let milestone: number | null = null;
    let bonusXP = 0;
    if (newStreak === 3)  { milestone = 3;  bonusXP = 50;  }
    if (newStreak === 7)  { milestone = 7;  bonusXP = 100; }
    if (newStreak === 14) { milestone = 14; bonusXP = 200; }
    if (newStreak === 30) { milestone = 30; bonusXP = 500; }

    // Update streak + last_active
    await supabase.from("user_xp").update({
      streak:      newStreak,
      last_active: today,
    }).eq("user_id", userId);

    // Award bonus XP if milestone hit
    if (bonusXP > 0) {
      const { data: xpData } = await supabase
        .from("user_xp").select("total_xp").eq("user_id", userId).single();
      const newXp = (xpData?.total_xp || 0) + bonusXP;
      await supabase.from("user_xp")
        .update({ total_xp: newXp, level: Math.floor(newXp / 500) + 1 })
        .eq("user_id", userId);
    }

    fireXPUpdate();
    return { streak: newStreak, isNew: true, milestone };
  } catch (e) {
    console.error("Streak update failed:", e);
    return { streak: 0, isNew: false, milestone: null };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BADGE SYSTEM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
export interface Badge {
  id:       string;
  icon:     string;
  name:     string;
  desc:     string;
  earned:   boolean;
  progress: string;
  xpReward: number;
  category: string;
}

export function calculateBadges(stats: {
  xp:         number;
  streak:     number;
  tasksDone:  number;
  notesCount: number;
  sessions:   number;
  level:      number;
  flashcards: number;
}): Badge[] {
  const { xp, streak, tasksDone, notesCount, sessions, level, flashcards } = stats;

  return [
    // ── Tasks ──
    { id:"task_first", icon:"✅", name:"First Step",        desc:"Complete your first task",    earned:tasksDone>=1,  progress:`${Math.min(tasksDone,1)}/1`,   xpReward:25,  category:"Tasks"     },
    { id:"task_5",     icon:"📋", name:"Task Master",       desc:"Complete 5 tasks",            earned:tasksDone>=5,  progress:`${Math.min(tasksDone,5)}/5`,   xpReward:50,  category:"Tasks"     },
    { id:"task_20",    icon:"🏆", name:"Productivity King", desc:"Complete 20 tasks",           earned:tasksDone>=20, progress:`${Math.min(tasksDone,20)}/20`, xpReward:200, category:"Tasks"     },
    { id:"task_50",    icon:"👑", name:"Legend",            desc:"Complete 50 tasks",           earned:tasksDone>=50, progress:`${Math.min(tasksDone,50)}/50`, xpReward:500, category:"Tasks"     },

    // ── Notes ──
    { id:"note_first", icon:"📝", name:"Note Starter",      desc:"Create your first note",      earned:notesCount>=1,  progress:`${Math.min(notesCount,1)}/1`,   xpReward:10,  category:"Notes" },
    { id:"note_10",    icon:"📚", name:"Note Taker",        desc:"Create 10 notes",             earned:notesCount>=10, progress:`${Math.min(notesCount,10)}/10`, xpReward:100, category:"Notes" },

    // ── Streak ──
    { id:"streak_3",  icon:"🔥", name:"On Fire!",      desc:"3-day study streak",   earned:streak>=3,  progress:`${Math.min(streak,3)}/3 days`,   xpReward:50,  category:"Streak" },
    { id:"streak_7",  icon:"🚀", name:"Week Warrior",  desc:"7-day study streak",   earned:streak>=7,  progress:`${Math.min(streak,7)}/7 days`,   xpReward:100, category:"Streak" },
    { id:"streak_30", icon:"🌙", name:"Monthly Master",desc:"30-day study streak",  earned:streak>=30, progress:`${Math.min(streak,30)}/30 days`, xpReward:500, category:"Streak" },

    // ── XP & Level ──
    { id:"xp_100",  icon:"⚡", name:"XP Starter",  desc:"Earn 100 XP",        earned:xp>=100,  progress:`${Math.min(xp,100)}/100 XP`,   xpReward:0, category:"XP" },
    { id:"xp_500",  icon:"🌟", name:"Level Up!",   desc:"Reach 500 XP",       earned:xp>=500,  progress:`${Math.min(xp,500)}/500 XP`,   xpReward:0, category:"XP" },
    { id:"xp_2000", icon:"💎", name:"XP Diamond",  desc:"Earn 2000 XP",       earned:xp>=2000, progress:`${Math.min(xp,2000)}/2000 XP`, xpReward:0, category:"XP" },
    { id:"level_5", icon:"🎓", name:"Scholar",     desc:"Reach Level 5",      earned:level>=5, progress:`Level ${level}/5`,              xpReward:0, category:"XP" },
    { id:"level_10",icon:"🧠", name:"Genius",      desc:"Reach Level 10",     earned:level>=10,progress:`Level ${level}/10`,             xpReward:0, category:"XP" },

    // ── Focus ──
    { id:"pomo_5",  icon:"🍅", name:"Pomodoro Starter",  desc:"Complete 5 focus sessions",  earned:sessions>=5,  progress:`${Math.min(sessions,5)}/5`,   xpReward:50,  category:"Focus" },
    { id:"pomo_20", icon:"⏱️", name:"Focus Champion",    desc:"Complete 20 focus sessions", earned:sessions>=20, progress:`${Math.min(sessions,20)}/20`, xpReward:200, category:"Focus" },

    // ── Flashcards ──
    { id:"flash_10", icon:"⚡", name:"Flash Starter", desc:"Create 10 flashcards", earned:flashcards>=10, progress:`${Math.min(flashcards,10)}/10`, xpReward:50, category:"Flashcards" },
  ];
}
