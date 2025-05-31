import "./globals.css";

import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});



export const metadata: Metadata = {
  title: "Doutor Agenda",
  description: "Sistema de agendamento de consultas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${manrope.variable}  antialiased`}
      >
        {children}
        <Toaster position="bottom-center" richColors theme="light" />
      </body>
    </html>
  );
}