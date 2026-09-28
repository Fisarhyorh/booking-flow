import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google'
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
})
 
const body = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-body',
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'Book a Call',
  description: 'Appointment booking with live availability and double-booking protection',
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
     lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
