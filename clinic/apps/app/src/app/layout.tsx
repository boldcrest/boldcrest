import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DemoProvider } from "@/lib/demo/store";
import { ToastHost } from "@clinic/ui";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Klinika Arnika",
  description:
    "Demo: kartela e pacientit, orari, kujtesa me WhatsApp dhe ndjekja e protokolleve të trajtimit.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sq" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <head>
        {/* Sets the theme class before first paint so there is no flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem("arnika.theme");var d=s?s==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.add(d?"dark":"light")}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full">
        <DemoProvider>
          <ToastHost>{children}</ToastHost>
        </DemoProvider>
      </body>
    </html>
  );
}
