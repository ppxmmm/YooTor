# Estate planning requirements — 2026-11-05

The latest user request takes priority over exclusions in the reference screenshots: the product supports writing will drafts and emphasizes the deceased person's tax affairs.

- Tax is a primary navigation item and landing-page focus. The tax workspace distinguishes the year of death, subsequent years of an undivided estate, and each recipient's inheritance tax. Preparation checkboxes persist locally per user; they are not tax filings or confirmed deadlines.
- The will workspace collects testator, date, place, dispositions and proposed executor, generates an editable ordinary-will draft, saves through the existing authenticated instructions API, and exports UTF-8 text. Existing instruction permissions apply. Actual execution and witness signatures occur outside the app.
- The assets workspace offers a life-policy form with insurer, policy number, insured person, beneficiaries, coverage, contact and document location. Records persist through the assets API; policy details are in the existing notes field and editable through the existing asset editor. Document uploads remain in the document vault.
- No automatic determination of tax liability, legal validity, insurance entitlement or change of policy beneficiary is made. The tax feature organizes preparation rather than calculating or submitting tax returns.

Sources checked: Revenue Department https://www.rd.go.th/548.html and https://www.rd.go.th/5937.html (section 57 bis); Department of Special Investigation, law and life-cycle guide (ordinary wills).

Validation: unit tests for required will data and draft output; browser journey for tax persistence, will save/download/reload, policy save/reload and mobile width.
