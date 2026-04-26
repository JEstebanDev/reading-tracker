import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { FocusProvider } from "@/context/FocusContext";
import { BooksProvider } from "@/context/BooksContext";
import FocusBar from "@/components/FocusBar";

export const metadata: Metadata = {
  title: "Libris - Home",
  description: "Minimalist Reading Tracker",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="light">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-screen flex flex-col items-center py-12 md:py-24" suppressHydrationWarning>
        <AuthProvider>
          <BooksProvider>
            <FocusProvider>
              <FocusBar />
              {children}
            </FocusProvider>
          </BooksProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
