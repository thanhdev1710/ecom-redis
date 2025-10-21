"use client";

import { AdminNavHeader } from "@/components/admin-nav-header";
import { API } from "@/lib/base";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const getUID = () =>
    (typeof window !== "undefined"
      ? (localStorage.getItem("email") || "").trim().toLowerCase()
      : "") || null;

  useEffect(() => {
    const checkAdmin = async () => {
      const uid = getUID();
      if (!uid) {
        router.push("/login");
        return;
      }
      try {
        const res = await fetch(`${API}/users/${uid}`);
        const data = await res.json();
        if (!res.ok || !data?.ok || !data.user) {
          router.push("/login");
          return;
        }
        const role = data.user.role;
        if (role !== "admin") {
          router.push("/");
          return;
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        router.push("/login");
      }
    };
    checkAdmin();
  }, [router]);

  return (
    <div className="min-h-screen bg-background">
      <AdminNavHeader />
      <main>{children}</main>
    </div>
  );
}
