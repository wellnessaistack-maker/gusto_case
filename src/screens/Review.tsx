import { Card, Pill, PrimaryButton, SecondaryButton } from "../App";
import { carriedForward, fmtDate, requiredForEmployee } from "../model";
import { navigate, useStore } from "../store";

// The quick win. Two groups, labeled so plainly that nobody has to ask.
export default function Review() {
  const { person, relationships } = useStore();
  const employee = relationships.find((r) => r.type === "employee");
  if (!employee) return null; // App routes away before this can happen
  const carried = carriedForward(person);
  const required = requiredForEmployee(employee);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Review what carries forward</h1>
        <p className="mt-1 text-sm text-muted">
          Gusto already knows {person.preferredName}. The left column is reused as is. The right column is what the employee
          relationship starting {fmtDate(employee.effectiveFrom)} genuinely needs fresh.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title={`Carried forward from ${person.preferredName}'s existing profile`}>
          <p className="mb-4 text-xs text-muted">
            {carried.length} items · nothing to re-enter
          </p>
          <ul className="divide-y divide-line">
            {carried.map((c) => (
              <li key={c.label} className="flex items-start justify-between gap-4 py-3 text-sm">
                <div>
                  <div className="font-medium">{c.label}</div>
                  <div className="text-muted">{c.value}</div>
                </div>
                <span className="shrink-0"><Pill tone="reused">Reused</Pill></span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Required for the employee relationship" tone="coral">
          <p className="mb-4 text-xs text-muted">
            {required.length} items · specific to this job at this company
          </p>
          <ul className="divide-y divide-line">
            {required.map((r) => (
              <li key={r.label} className="flex items-start justify-between gap-4 py-3 text-sm">
                <div>
                  <div className="font-medium">{r.label}</div>
                  <div className="text-muted">{r.why}</div>
                </div>
                <span className="shrink-0"><Pill tone="required">Not yet complete</Pill></span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card tone="muted">
        <p className="text-sm">
          <strong>Kept separate on purpose.</strong> {person.preferredName}'s 1099 payments, tax forms, and contractor documents
          stay on the contractor relationship. The employee relationship starts with an empty W-2 history. They are never merged.
        </p>
      </Card>

      <div className="flex justify-between">
        <SecondaryButton onClick={() => navigate("change")}>Back</SecondaryButton>
        <PrimaryButton onClick={() => navigate("setup")}>Complete employee setup</PrimaryButton>
      </div>
    </div>
  );
}
