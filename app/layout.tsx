import "./globals.css";
import type { ReactNode } from "react";
import { LocaleProvider } from "@/lib/i18n";

export const metadata = {
  title: "Tab Modules",
  description: "Conceptual layout for module-driven tabs",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru">
      <body>
        <LocaleProvider>
          <div className="app-shell">{children}</div>
        </LocaleProvider>
      </body>
    </html>
  );
}
