# Halwot Operations Map

Living document for how Halwot Emmanuel Church operates today vs. target workflows in Halwot Ops.

## People

| | Current | Future (Phase 1) |
|---|---|---|
| Workflow | Paper / conversation → Excel | Registration → duplicate check → person record |
| People | Administrators, greeters | Church Admin, designated volunteers |
| Tools | Excel, WhatsApp | Halwot Ops Members |
| Problems | Duplicates, lost records | Soft-archive + search + status lifecycle |
| Desired | Single source of truth for contact + membership status | `new → contacted → follow_up → connected → member` |

## Membership

| | Current | Future |
|---|---|---|
| Workflow | Informal status in spreadsheets | Membership status on person + history via activity log |
| Problems | Unclear who is a member vs visitor | Explicit statuses, filtered lists |

## Ministries

| | Current | Future |
|---|---|---|
| Workflow | Leader keeps informal lists | Ministry records + memberships with roles |
| Seed list | Media, Worship, Youth, Children, Welcome, Ushering, Prayer, Administration | Confirm with leadership |

## Serving

| | Current | Future |
|---|---|---|
| Workflow | Ad-hoc assignment via WhatsApp | Role + availability on ministry membership; program team assignments |
| Problems | No confirmation trail | Assignments visible per ministry / program |

## Programs

| | Current | Future |
|---|---|---|
| Workflow | Calendar / verbal planning | Program workspace: overview, team, attendance |
| Problems | Hard to recall who served | Linked people + history |

## Attendance

| | Current | Future |
|---|---|---|
| Workflow | Rarely tracked systematically | Present / Absent / Excused / Visitor per program |
| Out of scope (Phase 1) | Biometrics, QR check-in | Later |

## Assets / Expenses / Giving / Communication

Documented for later phases — not in Phase 1 MVP.

## Administration

| Role | Access intent |
|------|----------------|
| Super Admin | Everything |
| Church Admin | People, programs, ministries, follow-up |
| Ministry Leader | Own ministry + related programs |
| Member | Own profile (portal later) |

Sensitive pastoral fields require `people.view_sensitive` / `follow_up.view_notes`.
