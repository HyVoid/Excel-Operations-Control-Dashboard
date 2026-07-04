# Operations & Financial Control Workbook for Multi-Party Service Businesses

![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)
![Platform](https://img.shields.io/badge/Platform-Browser%20%2B%20Excel-green.svg)
![Tool](https://img.shields.io/badge/Tool-Operational%20Decision%20Support-orange.svg)

**Track every order, every cash movement, every settlement, and every profit calculation from a single source of truth — with no installation, no signup, and available as both a browser app and an Excel workbook.**

> ## **No signup. No installation. Free.**
>
> 🌐 **Open in Browser** → *HTML version available via GitHub Pages*
>
> 📥 **Download Excel** → *Excel workbook available via Releases/Gumroad*
>
> Designed for operators who need operational control without ERP complexity.

---

## Screenshots

### Browser Version

<!-- screenshot: browser version -->

*Interactive operational control dashboard showing live cash exposure, settlement status, and profitability.*

### Excel Version

<!-- screenshot: excel version -->

*Single-source operational ledger with automatic settlement, cash tracking, and financial analysis.*

---

## What It Helps You Track

* Customer revenue, provider costs, transport costs, and company margin — at the individual order level.
* Exactly where company cash currently resides and who remains responsible for returning it.
* Which providers and transport partners remain unpaid, partially paid, or fully settled.
* Which cities, routes, and service partners generate the highest contribution margin.
* Which transactions contain financial, operational, or reconciliation risk.
* How operational performance, cash exposure, and profitability evolve over time.

---

## Quick Start Workflow

### 1. Configure Operational Rules Once

Open the **Settings**, **Providers**, **Transport**, and **Rate Matrix** sheets.

Define:

* cities,
* service providers,
* transport partners,
* pricing matrices,
* currency rules,
* settlement thresholds.

This configuration normally happens once and only requires occasional maintenance.

---

### 2. Import Existing Operational Data

Paste existing operational records directly into the **Monthly Master** sheet.

Typical data sources include:

* booking exports,
* accounting exports,
* dispatch records,
* transportation logs,
* existing spreadsheets.

No restructuring, scripting, or database preparation is required.

---

### 3. Review Operational Results Immediately

Switch to:

* **Cash Control**
* **Settlement Control**
* **Validation**
* **Dashboard**
* **Accountant Export**

All calculations, controls, and summaries update automatically.

No pivot refreshes.
No manual reconciliation.
No copy-paste workflows.

---

### 4. Refresh Periodically

Update operational records weekly or monthly.

The workbook automatically:

* recalculates profits,
* updates settlement queues,
* tracks cash exposure,
* refreshes management KPIs,
* regenerates accounting exports.

No rebuilding.
No reconfiguration.
No technical maintenance.

> **Set a few key parameters. Drop in existing data. Get the analysis. Refresh when needed.**

---

# Why I Built This

I repeatedly encountered service businesses operating with dozens of spreadsheets that all described the same transaction differently.

The actual problem was rarely calculation.

The problem was that management could no longer answer simple operational questions:

* Where is the money?
* Who still owes the company cash?
* Which providers remain unpaid?
* Which jobs were profitable?
* Which partner relationships are creating risk?

A typical workflow looked like this:

```text
Master Sheet
      ↓
Driver Sheet
      ↓
Settlement Sheet
      ↓
Finance Sheet
      ↓
Reporting Sheet
```

One operational correction required updating five separate files.

### Before

Management believed monthly profit was:

```text
Revenue:
¥580,000

Estimated Cost:
¥420,000

Estimated Profit:
¥160,000
```

After consolidating everything into a single operational ledger:

```text
Revenue:
¥580,000

Transport Cost:
¥265,000

Provider Cost:
¥225,000

Actual Profit:
¥90,000

Unreturned Cash:
¥68,000
```

The business was not earning ¥160,000.

It was earning ¥90,000 while carrying ¥68,000 of operational cash exposure.

This workbook is therefore not a spreadsheet template.

It is a productized operational reasoning framework:

> **One order. One source of truth. Complete operational visibility.**

---

## Common Service Operations Problems This Solves

| Problem                           | Without This Tool                                 | With This Tool                                             |
| --------------------------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| Duplicate order maintenance       | Same order maintained in multiple spreadsheets    | Single operational ledger drives all downstream analysis   |
| Cash responsibility unclear       | Cannot determine who currently holds company cash | Cash holder and responsibility chain tracked automatically |
| Manual settlement preparation     | Staff manually build payment lists                | Settlement queues generated automatically                  |
| Profitability calculated monthly  | Margin visibility delayed until month end         | Order-level profitability visible immediately              |
| Operational corrections expensive | One correction requires updating many files       | One correction updates the entire system                   |
| Financial exports inconsistent    | Accounting data requires manual cleanup           | Export-ready accounting tables generated automatically     |

---

## Who This Is For

This workbook is designed for:

* service businesses with multiple operational partners;
* transportation and logistics coordinators;
* staffing and field-service operations;
* event and hospitality operators;
* businesses handling delayed settlements and cash collections;
* operators who need financial control without ERP implementation.

This workbook is not designed for:

* enterprise ERP replacement;
* multi-user transactional systems;
* real-time online booking platforms;
* accounting software replacement.

No spreadsheet expertise is required.

Open the browser version or Excel version and begin tracking immediately.

---

## About

I build lightweight operational trackers and decision-support tools for situations where there are simply too many moving parts to hold in your head.

The question I usually start with is:

> **What information must exist in one place for the next decision to be made confidently?**

This Operations & Financial Control Workbook is one example of that approach: turning operational reasoning, settlement logic, and financial controls into a reusable decision-support tool rather than another spreadsheet people eventually stop trusting.

---

## Technical Details

<details>
<summary>For technical reviewers, Excel practitioners, and collaborators</summary>

---

### Workbook Architecture

| Layer                | Worksheet          | Purpose                       |
| -------------------- | ------------------ | ----------------------------- |
| Configuration        | Settings           | Global parameters             |
| Configuration        | Providers          | Service provider master data  |
| Configuration        | Transport          | Transport partner master data |
| Configuration        | Rate Matrix        | Pricing engine                |
| Configuration        | Cities             | Geographic rules              |
| Configuration        | Locations          | Address master data           |
| Operational Database | Monthly Master     | Single source of truth        |
| Validation           | Validation         | Error detection engine        |
| Operational Control  | Cash Control       | Cash responsibility ledger    |
| Operational Control  | Settlement Control | Settlement engine             |
| Financial Output     | Accountant Export  | Accounting export layer       |
| Analytics            | Dashboard          | Management reporting          |

#### Data Flow

```text
Settings
      ↓
Rate Matrix
      ↓
Monthly Master
      ↓
Validation
      ↓
Settlement Control
      ↓
Cash Control
      ↓
Accountant Export
      ↓
Dashboard
```

---

### Three Traps That Catch Even Experienced Service Operators

---

#### Trap 1 — Confusing Revenue With Collected Cash

A decision was made:

> "Monthly revenue is ¥580,000."

The decision relied on an unnoticed assumption:

> Revenue equals cash collected.

| Metric           | Incorrect | Correct  |
| ---------------- | --------- | -------- |
| Revenue          | ¥580,000  | ¥580,000 |
| Cash Collected   | ignored   | ¥512,000 |
| Cash Outstanding | ignored   | ¥68,000  |

The recommendation changes dramatically.

Instead of expanding operations, management should first recover outstanding cash exposure.

**Correct approach:**

```text
Revenue
− Outstanding Cash
= Realized Revenue
```

<details>
<summary>Formula</summary>

```excel
=SUMIFS(
tblMaster[Revenue (CNY)],
tblMaster[Is Cash Handed Over],
"Yes"
)
```

</details>

---

#### Trap 2 — Paying Providers Before Recovering Customer Cash

A decision was made:

> "Provider settlement can proceed."

Hidden assumption:

> Customer funds have already been secured.

| Status           | Incorrect | Correct      |
| ---------------- | --------- | ------------ |
| Customer Cash    | Unknown   | Not received |
| Provider Payment | Released  | Blocked      |
| Financial Risk   | Hidden    | Visible      |

The flaw creates direct cash loss exposure.

Correct logic:

```text
Collect cash first
      ↓
Verify cash custody
      ↓
Release settlement
```

<details>
<summary>Formula</summary>

```excel
=IFS(
(IsCash="No")*
(Settled="Yes"),
"ERROR",
TRUE,
"OK"
)
```

</details>

---

#### Trap 3 — Using Estimated Instead of Actual Costs

A decision was made:

> "This city is profitable."

The hidden assumption:

> Estimated transportation costs equal actual transportation costs.

| Metric    | Estimated | Actual |
| --------- | --------- | ------ |
| Revenue   | ¥2,200    | ¥2,200 |
| Transport | ¥600      | ¥950   |
| Provider  | ¥800      | ¥800   |
| Profit    | ¥800      | ¥450   |

Profitability declines by 44%.

Correct approach:

```text
Revenue
− Matrix Transport Cost
− Provider Cost
= Actual Margin
```

<details>
<summary>Formula</summary>

```excel
=Revenue
-TransportCost
-ProviderCost
```

</details>

---

### Example Scenario

A service booking is executed in Shanghai:

| Variable          | Value      |
| ----------------- | ---------- |
| Booking ID        | B202607183 |
| Revenue           | ¥3,800     |
| City              | Shanghai   |
| Transport Partner | FastMove   |
| Duration          | 8 hours    |
| Provider          | P-023      |
| Cash Holder       | Driver     |

The transport matrix determines:

```text
FastMove
× Shanghai
× 8 Hours
=
¥1,350
```

Provider master data determines:

```text
Provider P-023
=
¥1,100
```

The workbook calculates:

```text
Revenue:
¥3,800

Transport:
¥1,350

Provider:
¥1,100

Net Margin:
¥1,350
```

However:

```text
Cash Handed Over:
No
```

The dashboard therefore reports:

```text
Revenue:
¥3,800

Profit:
¥1,350

Cash At Risk:
¥3,800
```

Operational recommendation:

> Suspend additional assignments to the responsible cash holder until funds are recovered.

Decision implication:

> Profitability alone is insufficient. Cash responsibility remains the primary operational risk metric.

---

### Formula Reference

<details>
<summary>Transport Cost Engine</summary>

```excel
=INDEX(
tblRateMatrix[Rate],
MATCH(...)
)
```

Purpose:
Dynamic transport cost lookup.

</details>

<details>
<summary>Provider Cost Engine</summary>

```excel
=XLOOKUP(
ProviderID,
tblProviders[Provider ID],
tblProviders[Base Rate]
)
```

Purpose:
Provider cost assignment.

</details>

<details>
<summary>Margin Engine</summary>

```excel
=Revenue
-TransportCost
-ProviderCost
```

Purpose:
Order-level profitability.

</details>

<details>
<summary>Cash Risk Engine</summary>

```excel
=IFS(...)
```

Purpose:
Cash responsibility tracking.

</details>

<details>
<summary>Settlement Engine</summary>

```excel
=FILTER(...)
```

Purpose:
Dynamic settlement generation.

</details>

---

### Validation Rules

| Field                | Rule                              | Error Behavior        |
| -------------------- | --------------------------------- | --------------------- |
| Booking ID           | Must be unique                    | Duplicate warning     |
| Revenue              | Must exceed cost                  | Negative margin alert |
| Cash Holder          | Must exist                        | Validation error      |
| Online Payment       | Cannot remain unreturned          | Logic error           |
| Provider Settlement  | Cannot settle before cash receipt | Payment block         |
| Transport Settlement | Cannot settle invalid order       | Settlement block      |
| Rate Matrix          | Must contain valid mapping        | Lookup error          |
| Provider ID          | Must exist in master data         | Validation error      |

</details>

---

## Other Tools in This Series

* **DTC Inventory Planning Engine** — reorder point and purchasing decisions.
* **Marketing Budget Allocation Simulator** — channel allocation optimization.
* **TikTok Agency Performance Intelligence Engine** — paid and organic performance control.
* **Construction Estimating System** — estimating, costing, and bid preparation.
* **VAT Compliance Dashboard** — multi-platform VAT reporting and reconciliation.

More tools available through the GitHub profile and product library.

---

## License

This project is licensed under the **Apache License 2.0**.

See the **LICENSE** file for details.
