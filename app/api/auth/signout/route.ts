import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.error("Supabase signOut error:", err);
  }

  // Clear all Supabase auth cookies explicitly
  const cookieStore = await cookies();
  cookieStore.delete("fitforge-session");
  const allCookies = cookieStore.getAll();
  
  allCookies.forEach((cookie) => {
    if (cookie.name.startsWith("sb-") || cookie.name.includes("supabase")) {
      cookieStore.delete(cookie.name);
    }
  });

  return NextResponse.json({ success: true });
}
