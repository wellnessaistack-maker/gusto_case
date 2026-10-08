import type { ReactNode } from "react";
import { actions, ROUTES, useRoute, useStore, type Route } from "./store";
import Profile from "./screens/Profile";
import ChangeRelationship from "./screens/ChangeRelationship";
import Review from "./screens/Review";
import Setup from "./screens/Setup";
import Timeline from "./screens/Timeline";

const STEP_LABELS: Record<Route, string> = {
  profile: "Profile",
  change: "Change relationship",
  review: "Review what carries forward",
  setup: "Complete employee setup",
  timeline: "Timeline",
};

const SCREENS: Record<Route, () => ReactNode> = {
  profile: Profile,
  change: ChangeRelationship,
  review: Review,
  setup: Setup,
  timeline: Timeline,
};

export default function App() {
  const route = useRoute();
  const { business } = useStore();
  const Screen = SCREENS[route];
  const stepIndex = ROUTES.indexOf(route);

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-block h-7 w-7 rounded-md bg-coral" aria-hidden />
            <div>
              <div className="text-sm font-semibold">{business.legalName}</div>
              <div className="text-xs text-muted">Admin · People</div>
            </div>
          </div>
          <button
            onClick={actions.reset}
            className="rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-muted hover:border-ink hover:text-ink"
          >
            Reset demo
          </button>
        </div>
      </header>

      <nav aria-label="Progress" className="border-b border-line bg-white">
        <ol className="mx-auto flex max-w-5xl gap-6 overflow-x-auto px-6 text-xs">
          {ROUTES.map((r, i) => {
            const state = i < stepIndex ? "done" : i === stepIndex ? "current" : "todo";
            return (
              <li
                key={r}
                className={
                  "flex items-center gap-2 whitespace-nowrap border-b-2 py-3 " +
                  (state === "current"
                    ? "border-coral font-semibold text-ink"
                    : state === "done"
                      ? "border-transparent text-ink"
                      : "border-transparent text-muted")
                }
              >
                <span
                  className={
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold " +
                    (state === "todo" ? "bg-line text-muted" : "bg-coral text-white")
                  }
                >
                  {i + 1}
                </span>
                {STEP_LABELS[r]}
              </li>
            );
          })}
        </ol>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <Screen />
      </main>

      <footer className="mx-auto max-w-5xl px-6 pb-10 text-xs text-muted">
        Prototype. Fictional people and numbers. Not affiliated with Gusto.
      </footer>
    </div>
  );
}

// ---- Small shared pieces, kept here to keep the file count down.

export const Card = ({ title, children, tone = "default" }: { title?: string; children: ReactNode; tone?: "default" | "coral" | "muted" }) => (
  <section
    className={
      "rounded-xl border bg-white p-6 " +
      (tone === "coral" ? "border-coral" : tone === "muted" ? "border-line bg-canvas" : "border-line")
    }
  >
    {title && <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>}
    {children}
  </section>
);

export const Pill = ({ children, tone }: { children: ReactNode; tone: "reused" | "required" | "done" | "neutral" }) => {
  const cls =
    tone === "reused"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : tone === "required"
        ? "bg-coral-soft text-coral-dark ring-coral/40"
        : tone === "done"
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-canvas text-muted ring-line";
  return (
    <span className={"inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 " + cls}>
      {children}
    </span>
  );
};

export const PrimaryButton = ({ children, onClick, type = "button" }: { children: ReactNode; onClick?: () => void; type?: "button" | "submit" }) => (
  <button
    type={type}
    onClick={onClick}
    className="rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-coral-dark"
  >
    {children}
  </button>
);

export const SecondaryButton = ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-md border border-line bg-white px-4 py-2 text-sm font-medium hover:border-ink"
  >
    {children}
  </button>
);

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="grid grid-cols-[160px_1fr] gap-3 py-2 text-sm">
    <dt className="text-muted">{label}</dt>
    <dd>{children}</dd>
  </div>
);
