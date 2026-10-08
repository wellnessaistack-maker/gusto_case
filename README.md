# One person, one business, two dated relationships

A prototype of one contractor becoming an employee at the same business. It shows how Gusto can keep one identity per person while keeping each business's obligations separate.

## The claim it's testing

Click through the five screens and you should come away understanding three things without any architecture explanation:

1. **Jordan stays one person.** There is one Jordan before and after, not a new record.
2. **The contractor relationship and the employee relationship are two separate, dated things** attached to the same person and the same business. The contractor relationship ends September 30. The employee relationship starts October 1. Neither history touches the other.
3. **Gusto reuses what it already knows about Jordan where that is safe** (name, contact details, verified identity, login) and makes the admin complete what the employee relationship genuinely needs fresh (pay setup, W-4 withholding, benefits eligibility, permissions, required documents). The screen that shows this split is the quick win and the most important screen in the prototype.

## The scenario

Jordan Lee has been a contractor at Harbor Studio LLC since January 12, 2026. Harbor Studio hires Jordan as a W-2 employee effective October 1. An admin at Harbor Studio does the conversion.

1. **Profile.** Jordan's contractor profile as the admin sees it today, with a primary action: Change work relationship.
2. **Change relationship.** Pick Employee and the start date. The screen says in plain words that contractor history stays as it is and ends the day before.
3. **Review what carries forward.** Two columns: carried forward from Jordan's profile, marked Reused, and required for the employee relationship, marked Not yet complete. This is the quick win.
4. **Complete employee setup.** A short form for the required items only. Nothing already known is asked again.
5. **Timeline.** One person at the top. Contractor (Jan 12 to Sep 30) and Employee (Oct 1 onward) as two dated blocks on one line, each expandable to its own pay and tax history. A Before / After toggle shows how today's model would have handled it: two records that do not know about each other.

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

The store holds exactly one `Person`, one `Business`, and two `Relationship` objects. Fields that carry forward sit on `Person` because they are facts about Jordan, not about any job. Everything that payroll, tax, benefits, and access depend on sits on `Relationship`, because the law attaches those to a specific employer and a specific arrangement.

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

- **Multi-entity switching.** One business is enough to show the model. Related businesses come later and build on the same shape.
- **Accountant and vendor views.** They are more relationship types, not new ideas.
- **AI.** Nothing in this flow is decided or suggested by a model. Who is an employee and who can see what are rules, not guesses.
- **Payroll and tax engines.** They stay untouched. The prototype only changes how Gusto records who is what to which business.

## How to run it

```
npm install && npm run dev
```

Open the local URL Vite prints. Reset demo returns to screen 1. There is no backend, no API key, and no account.

To deploy to Vercel: import the repo, accept the detected Vite settings, and deploy. No configuration is needed. Routes are hash based, so deep links work without rewrites.

## How it connects to the strategy

This is the first thing the strategy recommends building: workers who change status, built on a person, a dated relationship, and a business, not as a one-off conversion feature. The prefill screen is the quick win: cheap, visible, and it teaches where reuse is safe and where it causes friction. The same `Person` / `Relationship` / `Business` shape is what the later phases would build on: recognizing a returning person at a new business, and related businesses under one owner.
