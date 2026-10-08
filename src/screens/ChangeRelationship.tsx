import { useState } from "react";
import { Card, PrimaryButton, SecondaryButton } from "../App";
import { addDays, fmtDate } from "../model";
import { actions, navigate, useStore } from "../store";

export default function ChangeRelationship() {
  const { person, business, relationships } = useStore();
  const contractor = relationships.find((r) => r.type === "contractor")!;
  const [type, setType] = useState<"employee" | "">("employee");
  const [effectiveFrom, setEffectiveFrom] = useState("2026-10-01");
  const canContinue = type === "employee" && effectiveFrom > contractor.effectiveFrom;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Change {person.preferredName}'s work relationship</h1>
        <p className="mt-1 text-sm text-muted">
          {person.legalName} stays the same person. You are adding a new relationship with {business.legalName}, not creating a new record.
        </p>
      </div>

      <Card title="New relationship">
        <div className="grid gap-3 sm:grid-cols-2">
          <label
            className={
              "cursor-pointer rounded-lg border p-4 text-sm " +
              (type === "employee" ? "border-coral bg-coral-soft/40" : "border-line")
            }
          >
            <input
              type="radio"
              name="type"
              className="mr-2 accent-coral"
              checked={type === "employee"}
              onChange={() => setType("employee")}
            />
            <span className="font-semibold">Employee (W-2)</span>
            <p className="mt-1 text-xs text-muted">Paid through payroll. Taxes withheld. May be eligible for benefits.</p>
          </label>
          <div className="rounded-lg border border-line p-4 text-sm opacity-60">
            <span className="font-semibold">Contractor (1099)</span>
            <p className="mt-1 text-xs text-muted">Current relationship since {fmtDate(contractor.effectiveFrom)}.</p>
          </div>
        </div>

        <label className="mt-6 block text-sm">
          <span className="font-medium">Employee start date</span>
          <input
            type="date"
            value={effectiveFrom}
            min={addDays(contractor.effectiveFrom, 1)}
            onChange={(e) => setEffectiveFrom(e.target.value)}
            className="mt-1 block rounded-md border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none"
          />
        </label>
      </Card>

      <Card tone="muted">
        <h2 className="text-sm font-semibold">What happens to the contractor relationship</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>
            It ends on <strong>{fmtDate(addDays(effectiveFrom, -1))}</strong>, the day before the employee start date.
          </li>
          <li>Its 1099 payment history, W-9, and agreement stay exactly as they are. Nothing is edited or moved.</li>
          <li>The employee relationship starts on <strong>{fmtDate(effectiveFrom)}</strong> with its own W-2 pay and tax history, starting empty.</li>
        </ul>
      </Card>

      <div className="flex justify-between">
        <SecondaryButton onClick={() => navigate("profile")}>Back</SecondaryButton>
        {canContinue ? (
          <PrimaryButton
            onClick={() => {
              actions.startConversion(effectiveFrom);
              navigate("review");
            }}
          >
            Continue
          </PrimaryButton>
        ) : (
          <span className="text-sm text-muted">Pick a start date after {fmtDate(contractor.effectiveFrom)}.</span>
        )}
      </div>
    </div>
  );
}
