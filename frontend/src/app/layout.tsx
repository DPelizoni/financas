import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/AppLayout";
import MuiAppProvider from "@/components/MuiAppProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-app" });
const themeInitScript = `
(() => {
  try {
    const key = "financas-theme";
    const storedTheme = localStorage.getItem(key);
    const theme = storedTheme === "dark" || storedTheme === "light"
      ? storedTheme
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  } catch {}
})();
`;

export const metadata: Metadata = {
  title: "Finanças Pessoais",
  description: "Sistema de gerenciamento de finanças pessoais",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.variable} ${inter.className} min-h-screen`}>
        <MuiAppProvider>
          <AppLayout>{children}</AppLayout>
        </MuiAppProvider>
      </body>
    </html>
  );
}
