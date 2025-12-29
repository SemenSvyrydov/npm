"use client";

import { useEffect, useRef, useState } from "react";
import type { Module, Ticket } from "@/lib/types";
import ModuleView from "@/components/ModuleView";
import RequestPanel from "@/components/RequestPanel";

type MainAreaProps = {
  module: Module;
};

export default function MainArea({ module }: MainAreaProps) {
  const [docRef, setDocRef] = useState("");
  const [dbId, setDbId] = useState("318");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleSubmit = async () => {
    const refs = docRef
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (refs.length === 0 || dbId.trim().length === 0) {
      setError("Заполните docRef и dbId.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);
    setTickets([]);

    try {
      const params = new URLSearchParams();
      params.set("docRef", refs.join(","));
      params.set("dbId", dbId.trim());

      const response = await fetch(`/api/tickets?${params.toString()}`, {
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error("Не удалось получить данные.");
      }

      const data = (await response.json()) as Ticket[];
      setTickets(data);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError("Ошибка при получении данных.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main>
      <div className="main-grid">
        <ModuleView
          module={module}
          tickets={tickets}
          isLoading={isLoading}
          error={error}
        />
        <RequestPanel
          module={module}
          docRef={docRef}
          dbId={dbId}
          isLoading={isLoading}
          onChangeDocRef={setDocRef}
          onChangeDbId={setDbId}
          onSubmit={handleSubmit}
        />
      </div>
    </main>
  );
}
