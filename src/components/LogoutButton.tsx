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
      className="text-sm text-muted hover:text-danger transition-colors"
    >
      Logout
    </button>
  );
}
