# One person, one business, two dated relationships

A prototype of one contractor becoming an employee at the same business. It shows how Gusto can keep one identity per person while keeping each business's obligations separate.

## The claim it's testing

A reviewer should come away understanding three things:

1. **Jordan stays one person.** There is one Jordan before and after, not a new record.
2. **The contractor relationship and the employee relationship are two separate, dated things** attached to the same person and the same business. The contractor relationship ends September 30, the employee relationship starts October 1, and neither history touches the other.
3. **Gusto reuses what it already knows about Jordan where that is safe** (name, contact, verified identity, login) and makes the admin complete what the employee relationship needs fresh (pay, W-4, benefits, permissions, documents). The screen that shows this split is the quick win.

## The scenario

Jordan Lee has been a contractor at Harbor Studio LLC since January 12, 2026. Harbor Studio hires Jordan as a W-2 employee effective October 1. An admin does the conversion.

1. **Profile.** Jordan's contractor profile as the admin sees it. Primary action: Change work relationship.
2. **Change relationship.** Pick Employee and the start date. Contractor history stays intact and ends the day before.
3. **Review what carries forward.** Carried forward from Jordan's profile, marked Reused, beside what the employee relationship needs, marked Not yet complete. The quick win.
4. **Complete employee setup.** A short form for the required items only. Upload each required document, or attach the demo documents.
5. **Timeline.** One person at the top. Contractor (Jan 12 to Sep 30) and Employee (Oct 1 onward) as two dated blocks on one line, each expandable to its own pay and tax history. An audit line records who did the conversion and when. A Before / After toggle shows today's model: two records that know nothing of each other.

## The data model

```ts
type Person = {            // true about Jordan regardless of employer
  legalName; email; phone; address;
  identity: { ssnLast4; verifiedOn };
  login: { email; mfaEnabled };
};

type Business = { legalName; einLast4; address };

type Relationship = {      // true only of one arrangement with one business
  personId; businessId;
  type: "contractor" | "employee";
  effectiveFrom: string;   // 2026-01-12
  effectiveTo: string | null;  // 2026-09-30, or null while open
  taxTreatment;            // 1099-NEC, or W-2 with its own W-4
  pay; payHistory;         // never shared between relationships
  benefitsEligibility; permissions; documents;
};
```

The store holds exactly one `Person`, one `Business`, and two `Relationship` objects. Fields that carry forward sit on `Person` because they are facts about Jordan, not about any job. Everything that payroll, tax, benefits, and access depend on sits on `Relationship`, because the law attaches those to a specific employer and arrangement.

## What carries forward and what does not

| Carried forward (on Person) | Required again (on Relationship) |
| --- | --- |
| Legal name | Pay rate and schedule |
| Email and phone | W-4 withholding |
| Home address | Benefits eligibility |
| Verified identity (SSN check) | Permissions |
| Login and 2-step verification | I-9 and other required documents |
| Relationship history, read only | 1099 and W-2 pay history, kept apart |

## What this deliberately leaves out

- **Multi-entity switching.** One business is enough to show the model. Related businesses build on the same shape later.
- **Accountant and vendor views.** They are more relationship types, not new ideas.
- **AI.** Nothing in this flow is decided or suggested by a model. Employment status and permissions are rules, not guesses.
- **Payroll and tax engines.** Untouched. The prototype only changes how Gusto records who is what to which business.

## Where to see it

Live at **https://gusto-case.vercel.app**. No login, no setup. Attach demo documents on screen 4 reaches the end state in under a minute. Reset demo returns to screen 1.

To run it locally: `npm install && npm run dev`. It redeploys from `main` on every push.

## How it connects to the strategy

This is the first thing the strategy recommends building: workers who change status, built on a person, a dated relationship, and a business, not as a one-off feature. The prefill screen is the quick win: cheap, visible, and it teaches where reuse is safe and where it causes friction. The same `Person` / `Relationship` / `Business` shape is what the later phases would build on: recognizing a returning person at a new business, and related businesses under one owner.
