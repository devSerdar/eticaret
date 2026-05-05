import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { isAdminEmail } from "@/lib/admin-auth";
import { findUserById } from "@/lib/demo-auth-store";
import { clearSessionCookie, getSession } from "@/lib/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OyunTicaret",
  description: "Knight Online PVP server odakli oyuncu pazari",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const u = session ? await findUserById(session.userId) : null;
  if (session && u?.bannedAt) {
    await clearSessionCookie();
    redirect("/login?reason=yasakli");
  }
  const navUser =
    session && u
      ? { displayName: session.displayName, email: session.email, balanceTL: u.balanceTL }
      : null;
  const showAdmin = session ? isAdminEmail(session.email) : false;

  return (
    <html lang="tr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col text-slate-900">
        <Navbar user={navUser} showAdmin={showAdmin} />
        <main className="relative flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
