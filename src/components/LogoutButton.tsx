"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout failed:", error.message);
        // Still redirect to login on error as session may be invalid
      }
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
      // Redirect anyway - user clearly wants to log out
      router.push("/login");
    }
  };

  return (
    <button
      onClick={handleLogout}
      aria-label="Logout"
      className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
    >
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    </button>
  );
}
