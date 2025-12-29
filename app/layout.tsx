import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Tab Modules",
  description: "Conceptual layout for module-driven tabs"
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru">
      <body>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
