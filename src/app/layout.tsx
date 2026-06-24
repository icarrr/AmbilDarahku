import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { BottomNav } from "@/components/bottom-nav";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { headers } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AmbilDarahku",
  description: "Platform donor darah berbasis komunitas. Bangun jaringan donor darah untuk membantu menyelamatkan lebih banyak nyawa.",
  icons: [{ rel: "icon", url: "/favicon.svg", type: "image/svg+xml" }],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "AmbilDarahku",
    title: "AmbilDarahku — Temukan Donor Darah Lebih Cepat",
    description: "Platform donor darah berbasis komunitas. Bangun jaringan donor darah untuk membantu menyelamatkan lebih banyak nyawa.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AmbilDarahku",
    description: "Platform donor darah berbasis komunitas. Temukan donor darah lebih cepat.",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const rewrite = h.get("x-middleware-rewrite") || "";
  const isMaintenance = rewrite.includes("/maintenance");

  // Maintenance mode — render minimal layout without nav/sidebar
  if (isMaintenance) {
    return (
      <html lang="id" className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-background font-sans">
          {children}
        </body>
      </html>
    );
  }

  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background font-sans">
        <AuthProvider>
          <DesktopSidebar />
          <main className="flex-1 pb-20 md:pb-0 md:ml-64">{children}</main>
          <BottomNav />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
