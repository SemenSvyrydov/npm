"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "app-locale";

export const locales = ["ru", "uk"] as const;
export type Locale = (typeof locales)[number];

const defaultLocale: Locale = "ru";

const translations = {
  ru: {
    "language.label": "Язык",
    "language.ru": "Русский",
    "language.uk": "Українська",
    "header.title": "Рабочее пространство модулей",
    "header.statusOnline": "онлайн",
    "requestPanel.title": "Контекстные действия",
    "requestPanel.settings":
      "Настройки запросов для модуля: {module}. Параллельность обрабатывается автоматически на сервере.",
    "requestPanel.docRefLabel": "docRef (через запятую)",
    "requestPanel.dbIdLabel": "dbId",
    "requestPanel.docRefPlaceholder": "DOC-001, DOC-002",
    "requestPanel.dbIdPlaceholder": "1",
    "requestPanel.submitLoading": "Запрос выполняется...",
    "requestPanel.submitIdle": "Выполнить запрос",
    "requestPanel.hint":
      "Долгие запросы могут выполняться до {seconds} сек. — это нормально.",
    "requestPanel.noResults": "Нет результатов.",
    "requestPanel.ticketsTitle": "Тикеты",
    "requestPanel.copySuccess": "Скопировано",
    "requestPanel.copyError": "Ошибка копирования",
    "requestPanel.copyAll": "Скопировать все TICKET_ID",
    "requestPanel.ticketsCount": "Всего тикетов: {count}",
    "requestPanel.copyHint": "Кнопка копирует все TICKET_ID одной строкой.",
    "requestPanel.ticketIdHeader": "Тикет ID",
    "requestProgress.title": "Прогресс запроса",
    "requestProgress.running": "Выполняется...",
    "requestProgress.ready": "Готово",
    "requestProgress.currentDocRef": "Текущий docRef:",
    "requestProgress.currentDocId": "Текущий docId:",
    "requestProgress.timer": "Таймер:",
    "requestProgress.docRefLabel": "DocRef",
    "requestProgress.docIdLabel": "DocId",
    "requestProgress.successDocRef": "Успехи docRef: {count}",
    "requestProgress.successDocId": "Успехи docId: {count}",
    "requestProgress.errors": "Ошибки: {count}",
    "requestProgress.reportTitle": "Отчет",
    "requestProgress.reportDocRef":
      "Успешно обработано docRef: {current} из {total}.",
    "requestProgress.reportDocId":
      "Успешно обработано docId: {current} из {total}.",
    "requestProgress.reportErrors": "Количество ошибок: {count}.",
    "requestProgress.reportEmptyTickets": "Пустые тикеты: {count}.",
    "requestProgress.copyEmptyTickets": "Скопировать пустые тикеты",
    "requestProgress.emptyTicketsItem": "{item}: тикеты не найдены.",
    "moduleView.description": "Результаты запросов по выбранному модулю.",
    "moduleView.noTickets": "Нет тикетов",
    "ticketColumns.ticketId": "Тикет ID",
    "ticketColumns.refId": "REF_ID",
    "ticketColumns.caseNumber": "CASE_NUMBER",
    "ticketColumns.description": "DESCRIPTION",
    "ticketColumns.dtStatus": "DT_STATUS",
    "ticketColumns.deliveredAt": "DELIVERED_AT",
    "ticketColumns.userName": "USER_NAME",
    "ticketColumns.code": "CODE",
    "module.kvitivki": "Квитівки",
    "module.requestType.kvitivki": "kvitivki",
    "module.resultSchema.status": "Статус",
    "module.resultSchema.contour": "Контур",
    "module.resultSchema.updated": "Обновлено",
    "errors.noDocRef": "Укажите хотя бы один docRef.",
    "errors.noDbId": "Укажите dbId для поиска.",
    "errors.documentsStatus": "Ошибка документов: {status}",
    "errors.ticketsStatus": "Ошибка тикетов: {status}",
    "errors.unknown": "Неизвестная ошибка",
    "logs.documents.start": "Документы: старт запроса",
    "logs.documents.response": "Документы: ответ",
    "logs.documents.readJson": "Документы: чтение JSON",
    "logs.documents.jsonReady": "Документы: JSON прочитан",
    "logs.tickets.start": "Билеты: старт запроса",
    "logs.tickets.response": "Билеты: ответ",
    "logs.tickets.readJson": "Билеты: чтение JSON",
    "logs.tickets.jsonReady": "Билеты: JSON прочитан",
    "logs.tickets.finish": "Билеты: завершение запроса",
    "common.placeholder": "—",
    "common.waiting": "ожидание...",
    "common.secondsShort": "{seconds} сек.",
  },
  uk: {
    "language.label": "Мова",
    "language.ru": "Русский",
    "language.uk": "Українська",
    "header.title": "Робочий простір модулів",
    "header.statusOnline": "онлайн",
    "requestPanel.title": "Контекстні дії",
    "requestPanel.settings":
      "Налаштування запитів для модуля: {module}. Паралельність обробляється автоматично на сервері.",
    "requestPanel.docRefLabel": "docRef (через кому)",
    "requestPanel.dbIdLabel": "dbId",
    "requestPanel.docRefPlaceholder": "DOC-001, DOC-002",
    "requestPanel.dbIdPlaceholder": "1",
    "requestPanel.submitLoading": "Запит виконується...",
    "requestPanel.submitIdle": "Виконати запит",
    "requestPanel.hint":
      "Тривалі запити можуть виконуватися до {seconds} сек. — це нормально.",
    "requestPanel.noResults": "Немає результатів.",
    "requestPanel.ticketsTitle": "Тікети",
    "requestPanel.copySuccess": "Скопійовано",
    "requestPanel.copyError": "Помилка копіювання",
    "requestPanel.copyAll": "Скопіювати всі TICKET_ID",
    "requestPanel.ticketsCount": "Усього тікетів: {count}",
    "requestPanel.copyHint": "Кнопка копіює всі TICKET_ID одним рядком.",
    "requestPanel.ticketIdHeader": "Тікет ID",
    "requestProgress.title": "Прогрес запиту",
    "requestProgress.running": "Виконується...",
    "requestProgress.ready": "Готово",
    "requestProgress.currentDocRef": "Поточний docRef:",
    "requestProgress.currentDocId": "Поточний docId:",
    "requestProgress.timer": "Таймер:",
    "requestProgress.docRefLabel": "DocRef",
    "requestProgress.docIdLabel": "DocId",
    "requestProgress.successDocRef": "Успіхи docRef: {count}",
    "requestProgress.successDocId": "Успіхи docId: {count}",
    "requestProgress.errors": "Помилки: {count}",
    "requestProgress.reportTitle": "Звіт",
    "requestProgress.reportDocRef": "Успішно оброблено docRef: {current} із {total}.",
    "requestProgress.reportDocId": "Успішно оброблено docId: {current} із {total}.",
    "requestProgress.reportErrors": "Кількість помилок: {count}.",
    "requestProgress.reportEmptyTickets": "Порожні тікети: {count}.",
    "requestProgress.copyEmptyTickets": "Скопіювати порожні тікети",
    "requestProgress.emptyTicketsItem": "{item}: тікети не знайдені.",
    "moduleView.description": "Результати запитів за вибраним модулем.",
    "moduleView.noTickets": "Немає тікетів",
    "ticketColumns.ticketId": "Тікет ID",
    "ticketColumns.refId": "REF_ID",
    "ticketColumns.caseNumber": "CASE_NUMBER",
    "ticketColumns.description": "DESCRIPTION",
    "ticketColumns.dtStatus": "DT_STATUS",
    "ticketColumns.deliveredAt": "DELIVERED_AT",
    "ticketColumns.userName": "USER_NAME",
    "ticketColumns.code": "CODE",
    "module.kvitivki": "Квитівки",
    "module.requestType.kvitivki": "kvitivki",
    "module.resultSchema.status": "Статус",
    "module.resultSchema.contour": "Контур",
    "module.resultSchema.updated": "Оновлено",
    "errors.noDocRef": "Вкажіть хоча б один docRef.",
    "errors.noDbId": "Вкажіть dbId для пошуку.",
    "errors.documentsStatus": "Помилка документів: {status}",
    "errors.ticketsStatus": "Помилка тікетів: {status}",
    "errors.unknown": "Невідома помилка",
    "logs.documents.start": "Документи: старт запиту",
    "logs.documents.response": "Документи: відповідь",
    "logs.documents.readJson": "Документи: читання JSON",
    "logs.documents.jsonReady": "Документи: JSON прочитано",
    "logs.tickets.start": "Тікети: старт запиту",
    "logs.tickets.response": "Тікети: відповідь",
    "logs.tickets.readJson": "Тікети: читання JSON",
    "logs.tickets.jsonReady": "Тікети: JSON прочитано",
    "logs.tickets.finish": "Тікети: завершення запиту",
    "common.placeholder": "—",
    "common.waiting": "очікування...",
    "common.secondsShort": "{seconds} сек.",
  },
} as const;

export type TranslationKey = keyof typeof translations.ru;

type TranslationValues = Record<string, string | number>;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (nextLocale: Locale) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const formatMessage = (template: string, values?: TranslationValues) => {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      return String(values[key]);
    }
    return match;
  });
};

const translate = (
  locale: Locale,
  key: TranslationKey,
  values?: TranslationValues,
) => {
  const template =
    translations[locale][key] ?? translations[defaultLocale][key] ?? key;
  return formatMessage(template, values);
};

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "ru" || stored === "uk") {
      setLocale(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const handleSetLocale = useCallback((nextLocale: Locale) => {
    setLocale(nextLocale);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: handleSetLocale,
      t: (key, values) => translate(locale, key, values),
    }),
    [locale, handleSetLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
};
