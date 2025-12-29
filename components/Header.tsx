"use client";

import { useLocale } from "@/lib/i18n";

export default function Header() {
  const { t } = useLocale();

  return (
    <header className="header">
      <div className="header__title">{t("header.title")}</div>
      <div className="status-pill">{t("header.statusOnline")}</div>
    </header>
  );
}
