import { useState, type FormEvent } from "react";
import type { Module } from "@/lib/types";

type RequestPanelProps = {
  module: Module;
};

export default function RequestPanel({ module }: RequestPanelProps) {
  const [docRef, setDocRef] = useState("");
  const [dbId, setDbId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDbIdChange = (value: string) => {
    setDbId(value.replace(/\D/g, ""));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const docRefs = docRef
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const payload = {
      moduleId: module.id,
      docRefs,
      dbId
    };

    setIsSubmitting(true);
    try {
      await docRefs.reduce(
        (promise, currentDocRef) =>
          promise.then(() => Promise.resolve({ currentDocRef })),
        Promise.resolve()
      );
      console.info("Запросы выполнены", payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="card">
      <h3>Контекстные действия</h3>
      <p>Настройки запросов для модуля: {module.name}.</p>
      <form onSubmit={handleSubmit}>
        <label>
          <span>docRef</span>
          <input
            type="text"
            name="docRef"
            value={docRef}
            onChange={(event) => setDocRef(event.target.value)}
            placeholder="Например: AB-12, CD-34"
          />
        </label>
        <label>
          <span>dbId</span>
          <input
            type="text"
            name="dbId"
            inputMode="numeric"
            value={dbId}
            onChange={(event) => handleDbIdChange(event.target.value)}
            placeholder="Только цифры"
          />
        </label>
        <button
          type="submit"
          className="tab-button tab-button--active"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Выполняется..." : "Выполнить запрос"}
        </button>
      </form>
    </aside>
  );
}
