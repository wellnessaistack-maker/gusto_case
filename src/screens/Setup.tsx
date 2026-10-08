import { useState, type FormEvent } from "react";
import { Card, Pill, PrimaryButton, SecondaryButton } from "../App";
import { carriedForward, fmtDate } from "../model";
import { actions, navigate, useStore } from "../store";

const PERMISSION_OPTIONS = ["View own pay stubs and W-2", "Request time off", "Enroll in benefits", "Update own direct deposit"];

export default function Setup() {
  const { person, relationships } = useStore();
  const employee = relationships.find((r) => r.type === "employee");
  const [payKind, setPayKind] = useState<"salary" | "hourly">("salary");
  const [rate, setRate] = useState("85000");
  const [schedule, setSchedule] = useState("Semi-monthly");
  const [filingStatus, setFilingStatus] = useState("Single");
  const [benefitsEligible, setBenefitsEligible] = useState(true);
  const [permissions, setPermissions] = useState<string[]>(PERMISSION_OPTIONS.slice(0, 3));
  const [docs, setDocs] = useState<Record<string, boolean>>({});

  if (!employee) {
    navigate("change");
    return null;
  }
  const allDocs = employee.documents.every((d) => docs[d.name]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    actions.completeSetup({
      payKind,
      rate: Number(rate) || 0,
      schedule,
      filingStatus,
      benefitsEligible,
      permissions,
    });
    navigate("timeline");
  };

  const input = "mt-1 block w-full rounded-md border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none";

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Complete employee setup</h1>
        <p className="mt-1 text-sm text-muted">
          Only what the employee relationship needs. Starts {fmtDate(employee.effectiveFrom)}.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <Card title="Pay">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm">
                Pay type
                <select value={payKind} onChange={(e) => setPayKind(e.target.value as "salary" | "hourly")} className={input}>
                  <option value="salary">Salary</option>
                  <option value="hourly">Hourly</option>
                </select>
              </label>
              <label className="text-sm">
                {payKind === "salary" ? "Annual salary ($)" : "Hourly rate ($)"}
                <input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="numeric" className={input} />
              </label>
              <label className="text-sm">
                Pay schedule
                <select value={schedule} onChange={(e) => setSchedule(e.target.value)} className={input}>
                  <option>Semi-monthly</option>
                  <option>Bi-weekly</option>
                  <option>Monthly</option>
                </select>
              </label>
            </div>
          </Card>

          <Card title="W-4 withholding">
            <label className="block max-w-xs text-sm">
              Filing status
              <select value={filingStatus} onChange={(e) => setFilingStatus(e.target.value)} className={input}>
                <option>Single</option>
                <option>Married filing jointly</option>
                <option>Head of household</option>
              </select>
            </label>
            <p className="mt-2 text-xs text-muted">Other W-4 fields stubbed for the prototype.</p>
          </Card>

          <Card title="Benefits eligibility">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={benefitsEligible} onChange={(e) => setBenefitsEligible(e.target.checked)} className="accent-coral" />
              Eligible for the company medical plan after 30 days
            </label>
          </Card>

          <Card title="Permissions">
            <ul className="space-y-2 text-sm">
              {PERMISSION_OPTIONS.map((p) => (
                <li key={p}>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="accent-coral"
                      checked={permissions.includes(p)}
                      onChange={(e) => setPermissions(e.target.checked ? [...permissions, p] : permissions.filter((x) => x !== p))}
                    />
                    {p}
                  </label>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Required documents">
            <ul className="space-y-2 text-sm">
              {employee.documents.map((d) => (
                <li key={d.name}>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="accent-coral" checked={!!docs[d.name]} onChange={(e) => setDocs({ ...docs, [d.name]: e.target.checked })} />
                    {d.name} <span className="text-xs text-muted">(mark as collected)</span>
                  </label>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <aside>
          <Card title="Not asked again">
            <ul className="space-y-2 text-sm">
              {carriedForward(person)
                .filter((c) => c.source === "Person")
                .map((c) => (
                  <li key={c.label} className="flex items-center justify-between gap-2">
                    <span>{c.label}</span>
                    <Pill tone="reused">Reused</Pill>
                  </li>
                ))}
            </ul>
            <p className="mt-4 text-xs text-muted">These live on {person.preferredName}'s profile, not on any one job.</p>
          </Card>
        </aside>
      </div>

      <div className="flex items-center justify-between">
        <SecondaryButton onClick={() => navigate("review")}>Back</SecondaryButton>
        {allDocs ? (
          <PrimaryButton type="submit">Finish setup</PrimaryButton>
        ) : (
          <span className="text-sm text-muted">Mark all required documents as collected to finish.</span>
        )}
      </div>
    </form>
  );
}
