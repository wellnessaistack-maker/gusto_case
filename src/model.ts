// The data model is the argument. One Person, one Business, and a dated
// Relationship between them. Anything that is true about Jordan regardless of
// employer lives on Person. Anything that is only true of one working
// arrangement with one business lives on Relationship.

export type Person = {
  id: string;
  legalName: string;
  preferredName: string;
  email: string;
  phone: string;
  address: { line1: string; city: string; state: string; zip: string };
  identity: { ssnLast4: string; verifiedOn: string; method: string };
  login: { email: string; mfaEnabled: boolean; memberSince: string };
};

export type Business = {
  id: string;
  legalName: string;
  einLast4: string;
  address: { city: string; state: string };
  admin: { name: string; role: string }; // the person doing the demo
};

// Who changed a relationship, and when. Lives on the relationship because
// that is the record being changed.
export type Change = { what: string; by: string; on: string };

export type RelationshipType = "contractor" | "employee";

export type Payment = { date: string; description: string; amount: number };

export type Document = { name: string; status: "on file" | "required"; fileName?: string };

export type Relationship = {
  id: string;
  personId: string;
  businessId: string;
  type: RelationshipType;
  effectiveFrom: string; // ISO date, inclusive
  effectiveTo: string | null; // ISO date, inclusive; null means open ended
  // Everything below is specific to this relationship and is never shared.
  taxTreatment:
    | { form: "1099-NEC"; w4: null }
    | { form: "W-2"; w4: { filingStatus: string; allowancesNote: string } | null };
  pay:
    | { kind: "per-invoice"; note: string }
    | { kind: "salary" | "hourly"; rate: number | null; schedule: string | null };
  payHistory: Payment[];
  benefitsEligibility: { eligible: boolean | null; note: string };
  permissions: string[];
  documents: Document[];
  changes: Change[];
};

export type Store = {
  person: Person;
  business: Business;
  relationships: Relationship[];
};

// ---- Seed: what Gusto already knows on the day the admin opens Jordan's profile.

export const seed = (): Store => ({
  person: {
    id: "person_jordan",
    legalName: "Jordan A. Lee",
    preferredName: "Jordan",
    email: "jordan.lee@example.com",
    phone: "(415) 555-0142",
    address: { line1: "812 Cole St, Apt 3", city: "San Francisco", state: "CA", zip: "94117" },
    identity: { ssnLast4: "4821", verifiedOn: "2026-01-10", method: "ID and SSN match" },
    login: { email: "jordan.lee@example.com", mfaEnabled: true, memberSince: "2026-01-10" },
  },
  business: {
    id: "biz_harbor",
    legalName: "Harbor Studio LLC",
    einLast4: "7731",
    address: { city: "Oakland", state: "CA" },
    admin: { name: "Maya Rodriguez", role: "Owner" },
  },
  relationships: [
    {
      id: "rel_contractor",
      personId: "person_jordan",
      businessId: "biz_harbor",
      type: "contractor",
      effectiveFrom: "2026-01-12",
      effectiveTo: null,
      taxTreatment: { form: "1099-NEC", w4: null },
      pay: { kind: "per-invoice", note: "Paid per invoice, net 15" },
      payHistory: [
        { date: "2026-02-03", description: "Invoice 1001 · Brand refresh", amount: 4200 },
        { date: "2026-03-05", description: "Invoice 1002 · Spring campaign", amount: 3800 },
        { date: "2026-04-07", description: "Invoice 1003 · Web pages", amount: 5100 },
        { date: "2026-05-06", description: "Invoice 1004 · Packaging", amount: 2950 },
        { date: "2026-06-04", description: "Invoice 1005 · Summer campaign", amount: 4600 },
        { date: "2026-07-07", description: "Invoice 1006 · Retainer", amount: 3500 },
        { date: "2026-08-05", description: "Invoice 1007 · Retainer", amount: 3500 },
        { date: "2026-09-04", description: "Invoice 1008 · Retainer", amount: 3500 },
      ],
      benefitsEligibility: { eligible: false, note: "Contractors are not eligible for company benefits" },
      permissions: ["Submit invoices", "View own 1099 payments", "Update own payment method"],
      documents: [
        { name: "Form W-9", status: "on file" },
        { name: "Contractor agreement", status: "on file" },
      ],
      changes: [{ what: "Added as contractor", by: "Maya Rodriguez (Owner)", on: "2026-01-12" }],
    },
  ],
});

export const today = (): string => new Date().toISOString().slice(0, 10);

// ---- Helpers

export const addDays = (iso: string, days: number): string => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const daysBetween = (fromIso: string, toIso: string): number =>
  Math.round((new Date(toIso + "T00:00:00").getTime() - new Date(fromIso + "T00:00:00").getTime()) / 86_400_000) + 1;

// First pay date for a new employee relationship, from its start date and
// pay schedule. Enough for the prototype; a real pay calendar is per company.
export const firstPayDate = (effectiveFrom: string, schedule: string | null): string => {
  const d = new Date(effectiveFrom + "T00:00:00");
  const lastOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  if (schedule === "Bi-weekly") return addDays(effectiveFrom, 13);
  if (schedule === "Monthly") return lastOfMonth;
  return d.getDate() <= 15 ? `${effectiveFrom.slice(0, 8)}15` : lastOfMonth;
};

export const fmtDate = (iso: string | null): string =>
  iso
    ? new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Present";

export const fmtMoney = (n: number): string =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export const total = (payments: Payment[]): number => payments.reduce((s, p) => s + p.amount, 0);

// A brand-new employee relationship. Everything here is deliberately empty:
// nothing on Person is copied in, because nothing on Person needs to be.
export const adminLabel = (b: Business): string => `${b.admin.name} (${b.admin.role})`;

export const newEmployeeRelationship = (
  person: Person,
  business: Business,
  effectiveFrom: string,
): Relationship => ({
  id: "rel_employee",
  personId: person.id,
  businessId: business.id,
  type: "employee",
  effectiveFrom,
  effectiveTo: null,
  taxTreatment: { form: "W-2", w4: null },
  pay: { kind: "salary", rate: null, schedule: null },
  payHistory: [],
  benefitsEligibility: { eligible: null, note: "" },
  permissions: [],
  documents: [
    { name: "Form I-9", status: "required" },
    { name: "Form W-4", status: "required" },
    { name: "Direct deposit authorization", status: "required" },
    { name: "State new-hire report", status: "required" },
  ],
  changes: [{ what: `Added as employee, effective ${fmtDate(effectiveFrom)}`, by: adminLabel(business), on: today() }],
});

// ---- What carries forward and what does not. This list is the quick win.

export type CarriedItem = { label: string; value: string; source: string };
export type RequiredItem = { label: string; why: string; done: boolean };

export const carriedForward = (p: Person): CarriedItem[] => [
  { label: "Legal name", value: p.legalName, source: "Person" },
  { label: "Email", value: p.email, source: "Person" },
  { label: "Phone", value: p.phone, source: "Person" },
  {
    label: "Home address",
    value: `${p.address.line1}, ${p.address.city}, ${p.address.state} ${p.address.zip}`,
    source: "Person",
  },
  {
    label: "Verified identity",
    value: `SSN ending ${p.identity.ssnLast4} · verified ${fmtDate(p.identity.verifiedOn)}`,
    source: "Person",
  },
  {
    label: "Login",
    value: `${p.login.email} · 2-step verification on`,
    source: "Person",
  },
  {
    label: "Relationship history",
    value: "Contractor at Harbor Studio LLC, kept as its own record",
    source: "Relationship (contractor)",
  },
];

export const requiredForEmployee = (r: Relationship): RequiredItem[] => [
  {
    label: "Pay rate and schedule",
    why: "Set per job. Contractor invoices say nothing about salary.",
    done: r.pay.kind !== "per-invoice" && r.pay.rate !== null,
  },
  {
    label: "W-4 withholding",
    why: "Tax withholding is an employee choice. A W-9 does not cover it.",
    done: r.taxTreatment.form === "W-2" && r.taxTreatment.w4 !== null,
  },
  {
    label: "Benefits eligibility",
    why: "Depends on this role and this company's plan rules.",
    done: r.benefitsEligibility.eligible !== null,
  },
  {
    label: "Permissions",
    why: "What Jordan can see and do as an employee is set fresh.",
    done: r.permissions.length > 0,
  },
  {
    label: "I-9 and other required documents",
    why: "Employment eligibility is verified per employer, every time.",
    done: r.documents.every((d) => d.status === "on file"),
  },
];
