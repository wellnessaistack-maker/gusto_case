import { useSyncExternalStore } from "react";
import { addDays, adminLabel, fmtDate, newEmployeeRelationship, seed, today, type Relationship, type Store } from "./model";

// ---- A tiny in-memory store. No backend, no persistence beyond the tab.

let state: Store = seed();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const useStore = (): Store =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );

export const actions = {
  reset() {
    state = seed();
    emit();
    navigate("profile");
  },

  // Screen 2 → 3. End the contractor relationship the day before, and open a
  // second, empty employee relationship on the same person and business.
  startConversion(effectiveFrom: string) {
    const contractor = state.relationships.find((r) => r.type === "contractor")!;
    const effectiveTo = addDays(effectiveFrom, -1);
    const ended: Relationship = {
      ...contractor,
      effectiveTo,
      changes: [
        ...contractor.changes.filter((c) => !c.what.startsWith("End date set")),
        { what: `End date set to ${fmtDate(effectiveTo)}`, by: adminLabel(state.business), on: today() },
      ],
    };
    const employee = newEmployeeRelationship(state.person, state.business, effectiveFrom);
    state = { ...state, relationships: [ended, employee] };
    emit();
  },

  // Screen 4 → 5. Fill in only what the employee relationship needs.
  completeSetup(input: {
    payKind: "salary" | "hourly";
    rate: number;
    schedule: string;
    filingStatus: string;
    benefitsEligible: boolean;
    permissions: string[];
    documentFiles: Record<string, string>;
  }) {
    state = {
      ...state,
      relationships: state.relationships.map((r) =>
        r.type !== "employee"
          ? r
          : {
              ...r,
              pay: { kind: input.payKind, rate: input.rate, schedule: input.schedule },
              taxTreatment: {
                form: "W-2",
                w4: { filingStatus: input.filingStatus, allowancesNote: "Standard withholding" },
              },
              benefitsEligibility: {
                eligible: input.benefitsEligible,
                note: input.benefitsEligible
                  ? "Eligible after 30 days under the company plan"
                  : "Not eligible under the company plan",
              },
              permissions: input.permissions,
              documents: r.documents.map((d) => ({ ...d, status: "on file" as const, fileName: input.documentFiles[d.name] })),
              changes: [...r.changes, { what: "Employee setup completed", by: adminLabel(state.business), on: today() }],
            },
      ),
    };
    emit();
  },
};

// ---- A hash router. Five routes, no dependency, works on Vercel untouched.

export const ROUTES = ["profile", "change", "review", "setup", "timeline"] as const;
export type Route = (typeof ROUTES)[number];

export const parseRoute = (hash: string): Route => {
  const h = hash.replace(/^#\/?/, "") as Route;
  return ROUTES.includes(h) ? h : "profile";
};

// Which screen a route may show given what the store holds. Review and Setup
// need the conversion started; Timeline needs setup finished.
export const resolveRoute = (r: Route, s: Store): Route => {
  const employee = s.relationships.find((x) => x.type === "employee");
  const setupDone = !!employee && employee.pay.kind !== "per-invoice" && employee.pay.rate !== null;
  if ((r === "review" || r === "setup") && !employee) return "change";
  if (r === "timeline" && !setupDone) return employee ? "review" : "profile";
  return r;
};

export const navigate = (r: Route) => {
  window.location.hash = `/${r}`;
};

// Returns the raw hash so App can normalize it whenever it changes.
export const useHash = (): string =>
  useSyncExternalStore(
    (l) => {
      window.addEventListener("hashchange", l);
      return () => window.removeEventListener("hashchange", l);
    },
    () => window.location.hash,
  );
