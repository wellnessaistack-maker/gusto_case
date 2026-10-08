import { Card, Field, Pill, PrimaryButton } from "../App";
import { fmtDate, fmtMoney, total } from "../model";
import { navigate, useStore } from "../store";

export default function Profile() {
  const { person, business, relationships } = useStore();
  const contractor = relationships.find((r) => r.type === "contractor")!;
  const employee = relationships.find((r) => r.type === "employee");
  const setupDone = !!employee && employee.pay.kind !== "per-invoice" && employee.pay.rate !== null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{person.legalName}</h1>
          <p className="mt-1 text-sm text-muted">
            Contractor since {fmtDate(contractor.effectiveFrom)}
            {contractor.effectiveTo && <> until {fmtDate(contractor.effectiveTo)}</>} · {business.legalName}
          </p>
        </div>
        {setupDone ? (
          <PrimaryButton onClick={() => navigate("timeline")}>View relationship timeline</PrimaryButton>
        ) : employee ? (
          <PrimaryButton onClick={() => navigate("review")}>Continue employee setup</PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => navigate("change")}>Change work relationship</PrimaryButton>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Contact">
          <dl>
            <Field label="Preferred name">{person.preferredName}</Field>
            <Field label="Email">{person.email}</Field>
            <Field label="Phone">{person.phone}</Field>
            <Field label="Address">
              {person.address.line1}
              <br />
              {person.address.city}, {person.address.state} {person.address.zip}
            </Field>
            <Field label="Identity">
              SSN ending {person.identity.ssnLast4} <Pill tone="done">Verified {fmtDate(person.identity.verifiedOn)}</Pill>
            </Field>
          </dl>
        </Card>

        <Card title="Payments · 1099">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-2xl font-semibold">{fmtMoney(total(contractor.payHistory))}</span>
            <span className="text-xs text-muted">{contractor.payHistory.length} payments this year</span>
          </div>
          <ul className="divide-y divide-line text-sm">
            {contractor.payHistory.slice(-3).reverse().map((p) => (
              <li key={p.date} className="flex justify-between py-2">
                <span>
                  <span className="text-muted">{fmtDate(p.date)}</span> · {p.description}
                </span>
                <span>{fmtMoney(p.amount)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Form 1099-NEC will be issued for these payments at year end.</p>
        </Card>

        <Card title="Documents">
          <ul className="space-y-2 text-sm">
            {contractor.documents.map((d) => (
              <li key={d.name} className="flex items-center justify-between">
                {d.name} <Pill tone="done">On file</Pill>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Access">
          <ul className="space-y-2 text-sm">
            {contractor.permissions.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
