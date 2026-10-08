import { useState } from "react";
import { Card, Field, Pill } from "../App";
import { carriedForward, daysBetween, firstPayDate, fmtDate, fmtMoney, requiredForEmployee, total, type Relationship } from "../model";
import { useStore } from "../store";

export default function Timeline() {
  const { person, business, relationships } = useStore();
  const [view, setView] = useState<"after" | "before">("after");
  const [open, setOpen] = useState<string | null>(null);
  const contractor = relationships.find((r) => r.type === "contractor")!;
  const employee = relationships.find((r) => r.type === "employee");

  if (!employee || employee.pay.kind === "per-invoice" || employee.pay.rate === null) return null; // App routes away first

  // Block widths are proportional to how long each relationship has run, with
  // the open-ended employee block shown as three months so it stays readable.
  const contractorDays = daysBetween(contractor.effectiveFrom, contractor.effectiveTo!);
  const employeeDays = 92;
  const reused = carriedForward(person).length;
  const completed = requiredForEmployee(employee).filter((r) => r.done).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{person.legalName}</h1>
          <p className="mt-1 text-sm text-muted">
            One person · {business.legalName} · Employee since {fmtDate(employee.effectiveFrom)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md border border-line bg-white p-0.5 text-xs font-medium" role="tablist" aria-label="Compare models">
            {(["before", "after"] as const).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={"rounded px-3 py-1.5 focus-visible:outline-2 focus-visible:outline-coral " + (view === v ? "bg-ink text-white" : "text-muted")}
              >
                {v === "before" ? "Before: today's model" : "After: one person"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "after" ? (
        <>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm">
            <span className="font-semibold text-emerald-800">Setup complete</span>
            <span><strong>{reused}</strong> items reused from {person.preferredName}'s profile</span>
            <span><strong>{completed}</strong> completed for the employee relationship</span>
            <span><strong>0</strong> re-entered</span>
          </div>

          <Card title="Relationship timeline">
            <div
              className="grid gap-1 text-sm"
              style={{ gridTemplateColumns: `minmax(0, ${contractorDays}fr) minmax(150px, ${employeeDays}fr)` }}
            >
              {[contractor, employee].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setOpen(open === r.id ? null : r.id)}
                  className={
                    "rounded-lg border px-4 py-3 text-left " +
                    (r.type === "contractor"
                      ? "border-line bg-canvas"
                      : "border-coral bg-coral-soft/50") +
                    (open === r.id ? " ring-2 ring-ink/20" : "")
                  }
                >
                  <div className="flex flex-wrap items-center gap-2 font-semibold">
                    {r.type === "contractor" ? "Contractor · 1099" : "Employee · W-2"}
                    {r.type === "contractor" && <Pill tone="neutral">Read only</Pill>}
                  </div>
                  <div className="text-xs text-muted">
                    {fmtDate(r.effectiveFrom)} to {fmtDate(r.effectiveTo)}
                  </div>
                  {r.type === "employee" && r.pay.kind !== "per-invoice" && (
                    <div className="text-xs text-muted">First W-2 pay {fmtDate(firstPayDate(r.effectiveFrom, r.pay.schedule))}</div>
                  )}
                  <div className="mt-1 text-xs text-muted">{open === r.id ? "Hide details" : "Show pay and tax"}</div>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">
              Two dated relationships on the same person and the same business. Pay, tax, and documents are kept apart.
            </p>
          </Card>

          {open && <Details r={relationships.find((r) => r.id === open)!} />}

          <div className="grid gap-6 md:grid-cols-2">
            <Card title="Person">
              <dl>
                <Field label="Email">{person.email}</Field>
                <Field label="Phone">{person.phone}</Field>
                <Field label="Identity">
                  SSN ending {person.identity.ssnLast4} <Pill tone="done">Verified</Pill>
                </Field>
                <Field label="Login">{person.login.email}</Field>
              </dl>
              <p className="mt-2 text-xs text-muted">Shared across relationships. Entered once.</p>
            </Card>
            <Card title="Kept separate">
              <ul className="space-y-2 text-sm">
                <li>
                  1099 payments ({fmtMoney(total(contractor.payHistory))}) stay on the contractor relationship. Read only.
                </li>
                <li>W-2 payroll starts fresh on {fmtDate(employee.effectiveFrom)}.</li>
                <li>Year-end forms: one 1099-NEC and one W-2, filed separately.</li>
                <li>Benefits and permissions belong to the employee relationship only.</li>
              </ul>
            </Card>
          </div>
        </>
      ) : (
        <Before />
      )}
    </div>
  );
}

const Details = ({ r }: { r: Relationship }) => (
  <Card title={r.type === "contractor" ? "Contractor relationship · read only" : "Employee relationship"}>
    <div className="grid gap-6 md:grid-cols-2">
      <dl>
        <Field label="Dates">
          {fmtDate(r.effectiveFrom)} to {fmtDate(r.effectiveTo)}
        </Field>
        <Field label="Tax form">{r.taxTreatment.form}</Field>
        <Field label="Pay">
          {r.pay.kind === "per-invoice"
            ? r.pay.note
            : `${fmtMoney(r.pay.rate ?? 0)} ${r.pay.kind === "salary" ? "per year" : "per hour"} · ${r.pay.schedule}`}
        </Field>
        {r.taxTreatment.form === "W-2" && r.taxTreatment.w4 && (
          <Field label="W-4">{r.taxTreatment.w4.filingStatus}</Field>
        )}
        <Field label="Benefits">{r.benefitsEligibility.note}</Field>
        <Field label="Permissions">{r.permissions.join(", ") || "None"}</Field>
        <Field label="Documents">
          <ul className="space-y-0.5">
            {r.documents.map((d) => (
              <li key={d.name}>
                {d.name}
                {d.fileName && <span className="text-xs text-muted"> · {d.fileName}</span>}
              </li>
            ))}
          </ul>
        </Field>
      </dl>
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Pay history · {r.taxTreatment.form}</div>
        {r.payHistory.length === 0 ? (
          <p className="text-sm text-muted">
            No payroll run yet. First W-2 pay is scheduled for{" "}
            <strong className="text-ink">{fmtDate(firstPayDate(r.effectiveFrom, r.pay.kind === "per-invoice" ? null : r.pay.schedule))}</strong>
            {r.pay.kind !== "per-invoice" && r.pay.schedule ? ` (${r.pay.schedule.toLowerCase()})` : ""}.
          </p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {r.payHistory.map((p) => (
              <li key={p.date} className="flex justify-between py-1.5">
                <span className="text-muted">{fmtDate(p.date)}</span>
                <span>{fmtMoney(p.amount)}</span>
              </li>
            ))}
            <li className="flex justify-between py-1.5 font-semibold">
              <span>Total</span>
              <span>{fmtMoney(total(r.payHistory))}</span>
            </li>
          </ul>
        )}
      </div>
    </div>
  </Card>
);

// How today's model would have handled the same change: two unrelated records.
const Before = () => {
  const { person, relationships } = useStore();
  const contractor = relationships.find((r) => r.type === "contractor")!;
  const employee = relationships.find((r) => r.type === "employee")!;
  return (
  <div className="space-y-6">
    <Card tone="muted">
      <p className="text-sm">
        <strong>Today's model.</strong> Each profile is tied to one company role. To move Jordan, the admin terminates the contractor
        and onboards a brand-new employee. Nothing links the two.
      </p>
    </Card>
    <div className="grid gap-6 md:grid-cols-2">
      <Card title="Record 1 · Contractor profile">
        <dl>
          <Field label="Name">{person.legalName}</Field>
          <Field label="Status">
            <Pill tone="neutral">Terminated {fmtDate(contractor.effectiveTo)}</Pill>
          </Field>
          <Field label="1099 payments">{fmtMoney(total(contractor.payHistory))}</Field>
          <Field label="Linked to">Nothing</Field>
        </dl>
      </Card>
      <Card title="Record 2 · New employee profile">
        <dl>
          <Field label="Name">{person.legalName} (entered again)</Field>
          <Field label="Status">
            <Pill tone="neutral">Onboarding started {fmtDate(employee.effectiveFrom)}</Pill>
          </Field>
          <Field label="Re-entered">Name, email, phone, address, SSN, identity check, bank details</Field>
          <Field label="Linked to">Nothing</Field>
        </dl>
      </Card>
    </div>
    <p className="text-xs text-muted">
      Same person, same business, two strangers in the system. Support sees duplicates. {person.preferredName} gets a second welcome email.
    </p>
  </div>
  );
};
