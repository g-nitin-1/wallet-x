import { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/Theme/thrme-provider";
import AppWalletProvider from "@/components/AppWalletProvider";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WalletX",
  description: "Web based wallet by Syed Irfan Faraz",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <html lang="en" className={inter.className} suppressHydrationWarning>
        <head />
        <body
          className={cn(
            "min-h-screen bg-background font-sans antialiased",
            inter.className
          )}
        >
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <AppWalletProvider>
              <div className="relative flex h-screen flex-col">
                <SiteHeader />
                <div className="">
                  {children}
                  <Analytics />
                </div>
              </div>
              <Toaster />
            </AppWalletProvider>
          </ThemeProvider>
        </body>
      </html>
    </>
  );
}
