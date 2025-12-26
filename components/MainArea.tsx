import type { Module } from "@/lib/types";
import ModuleView from "@/components/ModuleView";
import RequestPanel from "@/components/RequestPanel";

type MainAreaProps = {
  module: Module;
};

export default function MainArea({ module }: MainAreaProps) {
  return (
    <main>
      <div className="main-grid">
        <ModuleView module={module} />
        <RequestPanel module={module} />
      </div>
    </main>
  );
}
