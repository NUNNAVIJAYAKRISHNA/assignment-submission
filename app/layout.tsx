import "./globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ReactNode } from "react";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
});

export const metadata = {
  title: "AssignHub - Academic Assignment Submission",
  description: "A web-based platform for managing academic assignment submissions.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable}`}>
      <body className="antialiased min-h-screen bg-hush text-slate-800 flex flex-col font-sans" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
