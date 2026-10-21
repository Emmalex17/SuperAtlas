# SuperAtlas screen parity inventory

Generated from the approved prototype v22 (`docs/prototype/superatlas-prototype.html`). 80 screens, 144 reference screenshots in `docs/prototype/screens/`. Every item below must exist in the Next.js app with the same words, layout, states and behaviour. Open the prototype in a browser and use the hidden "Demo access" link on the sign-in page to see each workspace.

How to read an entry: **route** is the prototype route (hash) and the screen to build; the lists are taken from the rendered prototype, so labels are exact. `data-test` IDs with `*` are patterns (one per record).

## P1. Public site and sign-in

### `home`: Landing page

- [x] **Built and matches the prototype**
- Workspace: Public · Layout: public · Breadcrumb: none
- Reference: `screens/home.jpg`
- Headings and section titles: “See every organisation you supervise, and the evidence behind it.” · “Regulation moves faster when everything connects.” · “Who is compliant?” · “Where are the gaps?” · “What proves it?” · “What happens next?” · “See the whole picture. Find the detail that matters.” · “Every compliance claim. Backed by evidence.” · “Don't just find the gaps. Close them.” · “From identified to resolved” · “All your supervisory work, working together.” · “Regulatory reporting” · “Compliance monitoring” · “Evidence management” · “Audits & assessments” · “Risk-based supervision” · “Findings & remediation” · “Regulatory history” · “Management intelligence” · “Your rules. Your workflows. Your SuperAtlas.” · “Configured for your authority” · “One shared view. A better way to work together.” · “Confidence in every decision.” · “Clarity in every obligation.” · “Evidence for every assessment.” · “From obligations to insight, in four clear steps.” · “Define” · “Collect” · “Assess” · “Act” · “Built for the responsibilities of supervision.” · “Role-based access” · “Audit-ready history” · “Data governance” · “Controlled workspaces” · “See what better supervision looks like on your own terms.” · “Configure your framework” · “Run a real use case” · “Evaluate the evidence” · “Good questions deserve clear answers.”
- Tabs: “CBN” · “SEC” · “NITDA”
- Buttons and links: “Sign in” · “Book a demo” · “Start a proof of value”
- Tab states (each must match its screenshot):
    - [x] “SEC”: `screens/home__sec.jpg`
    - [x] “NITDA”: `screens/home__nitda.jpg`

### `demo`: Book a demo

- [x] **Built and matches the prototype**
- Workspace: Public · Layout: public · Breadcrumb: none
- Reference: `screens/demo.jpg`
- Headings and section titles: “See SuperAtlas on your own supervision work” · “Book a demo”
- Form fields: “I am a” · “Full name” · “Work email” · “Organisation” · “Job title (optional)” · “Country” · “Preferred demo date” · “Preferred time” · “What would you like to see? (optional)” · “RegTech365 may contact me about this request.”
- Buttons and links: “Sign in” · “Book a demo” · “Request demo”

### `pilot`: Proof of value

- [x] **Built and matches the prototype**
- Workspace: Public · Layout: public · Breadcrumb: none
- Reference: `screens/pilot.jpg`
- Headings and section titles: “See it working on your own use case first” · “What is included” · “Request a proof of value”
- Form fields: “Regulator or authority” · “Your name” · “Work email” · “Institutions you supervise” · “Which regulation would you start with? (optional)”
- Buttons and links: “Sign in” · “Book a demo” · “Request a proof of value”

### `signin`: Sign in

- [x] **Built and matches the prototype**
- Workspace: Public · Layout: public · Breadcrumb: none
- Reference: `screens/signin.jpg`
- Headings and section titles: “Supervision that shows its working.” · “Sign in”
- Form fields: “Email” · “Password” · “Keep me signed in”
- Buttons and links: “Sign in” · “Demo access”

### `verify`: Enter MFA code

- [x] **Built and matches the prototype**
- Workspace: Public · Layout: public · Breadcrumb: none
- Reference: `screens/verify.jpg`
- Headings and section titles: “Supervision that shows its working.” · “Enter your 6-digit code”
- Form fields: “Trust this device for 30 days”
- Buttons and links: “Verify” · “Use a recovery code”

### `mfa-setup`: Set up MFA

- [x] **Built and matches the prototype**
- Workspace: Public · Layout: public · Breadcrumb: none
- Reference: `screens/mfa-setup.jpg`
- **Pilot note:** Authenticator apps are later phase; keep the screen, do not link it from sign-in.
- Headings and section titles: “Supervision that shows its working.” · “Set up multi-factor authentication”
- Buttons and links: “I have scanned the code”

### `invitation`: Accept invitation

- [x] **Built and matches the prototype**
- Workspace: Public · Layout: public · Breadcrumb: none
- Reference: `screens/invitation.jpg`
- Buttons and links: “Accept invitation”

### `invitation/zenith`: Accept invitation

- [x] **Built and matches the prototype**
- Workspace: Public · Layout: public · Breadcrumb: none
- Reference: `screens/invitation_zenith.jpg`
- Buttons and links: “Accept invitation”

### `invitation/deloitte`: Accept invitation

- [x] **Built and matches the prototype**
- Workspace: Public · Layout: public · Breadcrumb: none
- Reference: `screens/invitation_deloitte.jpg`
- Buttons and links: “Accept invitation”

### `reset`: Reset password

- [x] **Built and matches the prototype**
- Workspace: Public · Layout: public · Breadcrumb: none
- Reference: `screens/reset.jpg`
- Headings and section titles: “Supervision that shows its working.” · “Reset your password”
- Form fields: “Email”
- Buttons and links: “Send reset link”

### `register`: Register and choose category

- [x] **Built and matches the prototype**
- Workspace: Public · Layout: public · Breadcrumb: none
- Reference: `screens/register.jpg`
- **Pilot note:** Keep the screen in code but remove every link to it (invitation only for the pilot).
- Headings and section titles: “Join NITDA on SuperAtlas”
- Form fields: “Legal name” · “Trading name (optional)” · “Registration number” · “Website (optional)” · “Head office address”
- Buttons and links: “Sign in” · “Book a demo” · “Continue”

## P2. Regulator setup, settings and account

### `welcome`: Set up your workspace

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: public · Breadcrumb: none
- Reference: `screens/welcome.jpg`
- Headings and section titles: “Confirm your profile”
- Form fields: “Name shown in SuperAtlas” · “Short name” · “Legal name” · “Mandate” · “Supervision email” · “Phone”
- Buttons and links: “Replace logo” · “Save and continue”

### `profile`: Profile

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Profile > Details
- Reference: `screens/profile.jpg`
- Headings and section titles: “Profile” · “Details” · “Logo” · “Preview”
- Filter pills: “Banking” · “Payments” · “Digital economy” · “Insurance” · “Capital markets” · “Pensions”
- Form fields: “Name shown in SuperAtlas” · “Short name” · “Legal name” · “Mandate” · “Sectors you supervise” · “Banking” · “Payments” · “Digital economy” · “Insurance” · “Capital markets” · “Pensions” · “Supervision email” · “Phone” · “Address”
- Buttons and links: “Save profile” · “Remove”

### `profile/branding`: Branding

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Profile > Branding
- Reference: `screens/profile_branding.jpg`
- Headings and section titles: “Branding” · “Preview” · “Theme” · “Name and web address”
- Tabs: “Workspace” · “Invitation email”
- Form fields: “Short name in status text” · “Web address”
- Buttons and links: “SuperAtlas default Navy and indigo” · “Forest Deep green” · “Ocean Deep blue” · “Save branding”
- Status chips seen: “DNS verified”
- Tab states (each must match its screenshot):
    - [ ] “Invitation email”: `screens/profile_branding__invitation-email.jpg`

### `team`: Team

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Team
- Reference: `screens/team.jpg`
- Headings and section titles: “Team”
- Tabs: “People 4” · “Roles and permissions”
- Table columns: “NAME” · “ROLE” · “PORTFOLIO” · “STATUS” · “LAST ACTIVE”
- Buttons and links: “Invite staff”
- Status chips seen: “Admin” · “Active” · “Supervisor” · “Reviewer” · “Viewer”
- Tab states (each must match its screenshot):
    - [ ] “Roles and permissions”: `screens/team__roles-and-permissions.jpg`

### `settings/categories`: Categories

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Settings > Categories
- Reference: `screens/settings_categories.jpg`
- Headings and section titles: “Categories” · “How categories are used”
- Tabs: “Categories 13” · “Tags 4” · “Saved groups 2” · “History”
- Buttons and links: “Import spreadsheet” · “Add sector”
- Status chips seen: “International” · “National” · “Regional” · “State” · “Unit” · “PSSP” · “PTSP” · “Super-agent” · “Ultra-high level” · “Extra-high level” · “Ordinary-high level”
- Tab states (each must match its screenshot):
    - [ ] “Tags 4”: `screens/settings_categories__tags-4.jpg`
    - [ ] “Saved groups 2”: `screens/settings_categories__saved-groups-2.jpg`
    - [ ] “History”: `screens/settings_categories__history.jpg`

### `settings/categories/import`: Import categories

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Settings > Categories > Import
- Reference: `screens/settings_categories_import.jpg`
- Headings and section titles: “Import categories from a spreadsheet”
- Table columns: “SECTOR” · “INSTITUTION_TYPE” · “TIER” · “CODE”
- Buttons and links: “Download template (.xlsx)” · “Drop your spreadsheet here or click to choose a file”

### `settings/scoring`: Scoring schemes

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Settings > Scoring schemes
- Reference: `screens/settings_scoring.jpg`
- Headings and section titles: “Scoring schemes” · “Rating bands”
- Table columns: “OUTCOME” · “POINTS” · “MEANING”
- Buttons and links: “New scheme” · “Maturity scale Maturity · used in 1 programme” · “Pass / fail Binary · used in 0 programmes” · “Satisfactory scale Rating · used in 0 programmes” · “Edit bands”
- Status chips seen: “Default” · “Default for new programmes” · “Compliant” · “Partially compliant” · “Non-compliant” · “Not applicable”

### `settings/firm-types`: Firm types

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Settings > Firm types
- Reference: `screens/settings_firm-types.jpg`
- Headings and section titles: “Firm types” · “Audit & assurance” · “Data protection (DPCO)” · “Cybersecurity assessor” · “Advisory & remediation” · “Rules for every type”
- Form fields: “Accreditation lasts” · “Renewal reminder” · “Independence window”
- Buttons and links: “Edit criteria” · “Save firm types”
- Status chips seen: “5 firms” · “3 firms” · “2 firms” · “1 firms”

### `settings/deadlines`: Deadlines and reminders

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Settings > Deadlines & reminders
- Reference: `screens/settings_deadlines.jpg`
- Headings and section titles: “Deadlines & reminders” · “Responses and returns” · “Invitations and digests” · “Example”
- Form fields: “Default response window” · “Grace period for returns” · “Send reminders” · “Escalate overdue work to the supervisor after” · “Invitations expire after” · “Supervisor digest” · “Time zone”
- Buttons and links: “Save deadlines”

### `settings/findings`: Finding classes

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Settings > Finding classes
- Reference: `screens/settings_findings.jpg`
- Headings and section titles: “Finding classes”
- Table columns: “CODE” · “NAME” · “MEANING” · “FIX WITHIN (DAYS)” · “COLOUR”
- Buttons and links: “Add class” · “Save classes”

### `settings/compliance`: Compliance status

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Settings > Compliance status
- Reference: `screens/settings_compliance.jpg`
- Headings and section titles: “Compliance status” · “How status is worked out” · “Benchmarks” · “Enforcement watch”
- Table columns: “STATUS” · “RULE”
- Form fields: “ISR annual assessment” · “Data protection compliance” · “Consumer protection review” · “AML guidelines readiness” · “Cloud and payments security check” · “Major nonconformity overdue by more than (days)” · “Non-compliant in this many cycles running” · “Late with the same return this many periods running”
- Buttons and links: “Save”
- Status chips seen: “Compliant” · “Compliant with conditions” · “Non-compliant” · “Enforcement watch”

### `settings/actions`: Action types

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Settings > Action types
- Reference: `screens/settings_actions.jpg`
- Headings and section titles: “Action types”
- Table columns: “ACTION” · “DAYS TO RESPOND” · “PENALTY” · “CASES”
- Buttons and links: “Add action type”
- Status chips seen: “Has a penalty”

### `account`: My account

- [ ] **Built and matches the prototype**
- Workspace: Any (shown as regulator) · Layout: app · Breadcrumb: Account > My account
- Reference: `screens/account.jpg`
- Headings and section titles: “My account” · “M. Bello”
- Tabs: “Profile” · “Security” · “Notifications” · “Sessions 3”
- Form fields: “Full name” · “Job title” · “Email” · “Phone (optional)”
- Buttons and links: “Change photo” · “Save changes”
- Tab states (each must match its screenshot):
    - [ ] “Security”: `screens/account__security.jpg` · shows: “Password” · “Multi-factor authentication”
    - [ ] “Notifications”: `screens/account__notifications.jpg`
    - [ ] “Sessions 3”: `screens/account__sessions-3.jpg`

### `notifications`: Notifications

- [ ] **Built and matches the prototype**
- Workspace: Any (shown as regulator) · Layout: app · Breadcrumb: Notifications
- Reference: `screens/notifications.jpg`
- Headings and section titles: “Notifications”
- Filter pills: “All 9” · “Unread 6” · “Approvals 5” · “Mentions 1” · “Reminders 2” · “Updates 1”
- Buttons and links: “Mark all as read” · “Preferences” · “All 9” · “Unread 6” · “Approvals 5” · “Mentions 1” · “Reminders 2” · “Updates 1”

### `audit`: Audit trail

- [ ] **Built and matches the prototype**
- Workspace: Any (shown as regulator) · Layout: app · Breadcrumb: Audit trail
- Reference: `screens/audit.jpg`
- Headings and section titles: “Audit trail”
- Table columns: “WHEN” · “WHO” · “ACTION” · “RECORD”
- Buttons and links: “Export CSV” · “Apply”

## P3. Organisations and assurance firms

### `organisations`: Organisations

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Organisations
- Reference: `screens/organisations.jpg`
- Headings and section titles: “Organisations”
- Table columns: “ORGANISATION” · “CATEGORY” · “STATUS” · “LAST ACTIVITY”
- Filter pills: “All 43” · “Verified 35” · “Invited 2” · “Pending verification 2” · “Info requested 1” · “Change requested 1” · “Invite expired 1” · “Rejected 1”
- Buttons and links: “Export” · “Invite organisations” · “Commercial banks 14” · “Non-interest banks 1” · “Merchant banks 0” · “Microfinance banks 15” · “Payments 7” · “Digital economy 5” · “All categories 13 to choose from” · “All 43” · “Verified 35” · “Invited 2” · “Pending verification 2” · “Info requested 1” · “Change requested 1” · “Invite expired 1” · “Rejected 1” · “Review” · “Review change” · “Resend”
- Status chips seen: “Verified” · “Pending verification” · “Change requested” · “Info requested” · “Invited” · “Invite expired” · “Rejected”

### `organisations/invite`: Invite organisations

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Organisations > Invite
- Reference: `screens/organisations_invite.jpg`
- Headings and section titles: “Invite organisations”
- Table columns: “ORGANISATION” · “EMAIL” · “INSTITUTION_TYPE” · “TIER”
- Buttons and links: “Spreadsheet” · “One organisation” · “Download template (.xlsx)”

### `organisations/profile`: Organisation

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Organisations > Zenith Bank Plc
- Reference: `screens/organisations_profile.jpg`
- Headings and section titles: “Zenith Bank Plc” · “Organisation details” · “Classification” · “Status” · “Key officers”
- Tabs: “Overview” · “Compliance” · “Classification” · “Invitations” · “People” · “Licences” · “Activity”
- Buttons and links: “Message” · “Change category” · “Manage”
- Status chips seen: “Verified”
- Tab states (each must match its screenshot):
    - [ ] “Compliance”: `screens/organisations_profile__compliance.jpg` · shows: “Status by programme” · “Score history” · “Section scores in ISR 2025 annual assessment” · “Findings” · “Returns and enforcement”
    - [ ] “Classification”: `screens/organisations_profile__classification.jpg` · shows: “Current category” · “Request history”
    - [ ] “Invitations”: `screens/organisations_profile__invitations.jpg` · shows: “Invitation history” · “Current invitation”
    - [ ] “People”: `screens/organisations_profile__people.jpg`
    - [ ] “Licences”: `screens/organisations_profile__licences.jpg`
    - [ ] “Activity”: `screens/organisations_profile__activity.jpg` · shows: “No activity yet”

### `organisations/category`: Category

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Organisations > Category
- Reference: `screens/organisations_category.jpg`
- Headings and section titles: “Microfinance banks” · “Section scores: microfinance banks against all organisations” · “Compliance status” · “Ranking”
- Table columns: “#” · “ORGANISATION” · “SCORE” · “CHANGE” · “STATUS” · “GOVERNANCE” · “ASSET” · “ACCESS” · “INCIDENT” · “OPEN FINDINGS”
- Buttons and links: “Export scorecard” · “Organisations 14” · “Assessed 12 2 not assessed yet” · “Met the benchmark (70) 5 · 42%” · “View as table”
- Status chips seen: “14 organisations” · “Compliant” · “Compliant with conditions” · “Non-compliant” · “Not assessed”

### `firms`: Assurance firms

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Assurance firms
- Reference: `screens/firms.jpg`
- Headings and section titles: “Assurance firms”
- Table columns: “FIRM” · “FIRM TYPES” · “STATUS” · “LEAD AUDITOR” · “ASSESSORS” · “ASSIGNED” · “RENEWS”
- Filter pills: “All 7” · “Accredited 3” · “Renewal due 1” · “In review 2” · “Suspended 1”
- Buttons and links: “Export” · “Invite a firm” · “Audit & assurance 5 3 accredited” · “Data protection (DPCO) 3 1 accredited” · “Cybersecurity assessor 2 1 accredited” · “Advisory & remediation 1 1 accredited” · “All 7” · “Accredited 3” · “Renewal due 1” · “In review 2” · “Suspended 1” · “Renew” · “Review application”
- Status chips seen: “Accredited” · “Renewal due” · “In review” · “Suspended”

### `firms/profile`: Assurance firm

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Assurance firms > Deloitte & Touche (Nigeria)
- Reference: `screens/firms_profile.jpg`
- Headings and section titles: “Deloitte & Touche (Nigeria)” · “Firm details” · “At a glance”
- Tabs: “Overview” · “Performance” · “Accreditations” · “People 3” · “Assignments” · “Activity”
- Buttons and links: “Renew accreditation”
- Status chips seen: “Accredited”
- Tab states (each must match its screenshot):
    - [ ] “Performance”: `screens/firms_profile__performance.jpg` · shows: “Average rating 4.6 → 4.5” · “Compared with other firms” · “Ratings”
    - [ ] “Accreditations”: `screens/firms_profile__accreditations.jpg` · shows: “Accreditations”
    - [ ] “People 3”: `screens/firms_profile__people-3.jpg`
    - [ ] “Assignments”: `screens/firms_profile__assignments.jpg` · shows: “Assignments arrive with programmes”
    - [ ] “Activity”: `screens/firms_profile__activity.jpg`

### `org/welcome`: Set up your organisation

- [ ] **Built and matches the prototype**
- Workspace: Organisation (Zenith) · Layout: app · Breadcrumb: Dashboard > Set up
- Reference: `screens/org_welcome.jpg`
- Headings and section titles: “Set up Zenith Bank Plc”
- Buttons and links: “Organisation profile” · “2 Logo” · “3 Key officers” · “4 Invite colleagues” · “5 Group links” · “View profile” · “Upload your logo SVG or PNG, square, at least 256 px” · “Skip for now” · “Continue”

### `org/team`: Team

- [ ] **Built and matches the prototype**
- Workspace: Organisation (Zenith) · Layout: app · Breadcrumb: Team
- Reference: `screens/org_team.jpg`
- Headings and section titles: “Team”
- Table columns: “NAME” · “ROLE” · “STATUS”
- Buttons and links: “Invite colleague”
- Status chips seen: “Organisation admin” · “Active” · “Contributor”

### `org/profile`: Profile

- [ ] **Built and matches the prototype**
- Workspace: Organisation (Zenith) · Layout: app · Breadcrumb: Profile
- Reference: `screens/org_profile.jpg`
- Headings and section titles: “Zenith Bank Plc” · “Organisation details” · “Logo” · “Key officers”
- Tabs: “Details” · “Classification” · “Licences” · “Group links” · “Settings”
- Form fields: “Legal name” · “Registration number” · “Website” · “Head office” · “Compliance contact email”
- Buttons and links: “Save changes” · “Upload logo”
- Status chips seen: “Verified”
- Tab states (each must match its screenshot):
    - [ ] “Classification”: `screens/org_profile__classification.jpg` · shows: “Request a classification change” · “Current category” · “History”
    - [ ] “Licences”: `screens/org_profile__licences.jpg`
    - [ ] “Group links”: `screens/org_profile__group-links.jpg`
    - [ ] “Settings”: `screens/org_profile__settings.jpg`

### `firm/welcome`: Set up your firm

- [ ] **Built and matches the prototype**
- Workspace: Assurance firm (Deloitte) · Layout: app · Breadcrumb: Dashboard > Set up
- Reference: `screens/firm_welcome.jpg`
- Headings and section titles: “Set up Deloitte & Touche (Nigeria)”
- Buttons and links: “Firm profile” · “2 Logo” · “3 Lead auditor and assessors” · “4 Advisory clients” · “Apply for accreditation” · “Skip for now” · “Continue”

### `firm/team`: Team

- [ ] **Built and matches the prototype**
- Workspace: Assurance firm (Deloitte) · Layout: app · Breadcrumb: Team
- Reference: `screens/firm_team.jpg`
- Headings and section titles: “Team”
- Table columns: “PERSON” · “ROLE” · “CREDENTIALS” · “CREDENTIAL EXPIRY” · “STATUS”
- Buttons and links: “Add person”
- Status chips seen: “Lead auditor” · “Active” · “Assessor” · “Pending credential”

### `firm/profile`: Profile

- [ ] **Built and matches the prototype**
- Workspace: Assurance firm (Deloitte) · Layout: app · Breadcrumb: Profile
- Reference: `screens/firm_profile.jpg`
- Headings and section titles: “Deloitte & Touche (Nigeria)”
- Tabs: “Details” · “Performance” · “Accreditations” · “Assessors 3” · “Advisory clients 2”
- Form fields: “Firm name” · “Website” · “Offices” · “Contact email”
- Buttons and links: “Save changes”
- Status chips seen: “Accredited”
- Tab states (each must match its screenshot):
    - [ ] “Performance”: `screens/firm_profile__performance.jpg` · shows: “Average rating 4.6 → 4.5” · “What organisations said”
    - [ ] “Accreditations”: `screens/firm_profile__accreditations.jpg` · shows: “Accreditations”
    - [ ] “Assessors 3”: `screens/firm_profile__assessors-3.jpg`
    - [ ] “Advisory clients 2”: `screens/firm_profile__advisory-clients-2.jpg`

### `firm/apply`: Apply for accreditation

- [ ] **Built and matches the prototype**
- Workspace: Assurance firm (Deloitte) · Layout: app · Breadcrumb: Profile > Apply for accreditation
- Reference: `screens/firm_apply.jpg`
- **Pilot note:** Keep the screen in code but remove every entry point (firms are invited by NITDA).
- Headings and section titles: “Apply for accreditation” · “Current accreditations”
- Buttons and links: “Audit & assurance Already accredited” · “Cybersecurity assessor Already accredited” · “Advisory & remediation Registered consulting firm” · “Continue”
- Status chips seen: “Active”

## P4. Requirements library

### `library`: Requirements library

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Requirements library
- Reference: `screens/library.jpg`
- Headings and section titles: “Requirements library”
- Table columns: “REGULATION” · “VERSION” · “EFFECTIVE” · “SECTIONS” · “REQUIREMENTS” · “QUESTIONS” · “APPLIES TO” · “STATUS”
- Buttons and links: “Import spreadsheet” · “Add regulation” · “Add with AI” · “All” · “Published” · “Draft”
- Status chips seen: “Published” · “Draft”

### `library/regulation`: Regulation

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Requirements library > Information Security Regulation 2026
- Reference: `screens/library_regulation.jpg`
- Headings and section titles: “Details” · “Actions” · “Information Security Regulation 2026”
- Tabs: “Requirements 8” · “Questions 17” · “Evidence 13” · “Versions”
- Buttons and links: “Edit details” · “Add requirement” · “Create new version” · “Archive regulation” · “Expand all” · “Add section”
- Status chips seen: “Published”
- Tab states (each must match its screenshot):
    - [ ] “Questions 17”: `screens/library_regulation__questions-17.jpg`
    - [ ] “Evidence 13”: `screens/library_regulation__evidence-13.jpg`
    - [ ] “Versions”: `screens/library_regulation__versions.jpg`

### `library/requirement`: Requirement

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Requirements library > ISR > ISR-4.1
- Reference: `screens/library_requirement.jpg`
- Headings and section titles: “ISR-4.1 Multi-factor authentication for privileged access” · “Questions asked” · “Evidence required” · “Guidance for organisations” · “Details” · “Applies to”
- Buttons and links: “Previous” · “Next” · “Edit requirement” · “Suggest questions with AI”
- Status chips seen: “Required” · “Published”

### `library/edit`: Edit requirement

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Requirements library > ISR > New requirement
- Reference: `screens/library_edit.jpg`
- Headings and section titles: “New requirement” · “Questions asked” · “Evidence required” · “Applies to”
- Form fields: “Reference” · “Title” · “Requirement text” · “Guidance for organisations” · “Comment” · “Evidence” · “Interview” · “Commercial bank” · “Non-interest bank” · “Merchant bank” · “Microfinance bank” · “Mobile money operator” · “Switching and processing” · “Payment solution service provider” · “Data controller of major importance” · “Cloud service provider” · “Fintech platform” · “Weight” · “Scoring scheme”
- Buttons and links: “Suggest with AI” · “Add question” · “Add item” · “Cancel” · “Add requirement”

### `library/ai`: Add regulation with AI

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Requirements library > Add with AI
- Reference: `screens/library_ai.jpg`
- Headings and section titles: “Add a regulation with AI” · “How it works”
- Form fields: “Regulation name” · “Version” · “Effective date”

## P5. Programmes and engagements

### `programmes`: Programmes

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Programmes
- Reference: `screens/programmes.jpg`
- Headings and section titles: “Programmes”
- Table columns: “PROGRAMME” · “CURRENT CYCLE” · “WINDOW” · “ORGANISATIONS” · “SUBMITTED” · “STATUS”
- Filter pills: “All 5” · “Draft 1” · “Scheduled 1” · “Open 2” · “In review 0” · “Closed 1”
- Buttons and links: “New programme” · “List” · “Calendar” · “All 5” · “Draft 1” · “Scheduled 1” · “Open 2” · “In review 0” · “Closed 1” · “Continue setup”
- Status chips seen: “Open” · “Closed” · “Draft” · “Scheduled”

### `programmes/new`: Programme setup

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Programmes > New programme
- Reference: `screens/programmes_new.jpg`
- Headings and section titles: “New programme”
- Form fields: “Programme name” · “Regulation” · “Opens” · “Due” · “Description (optional)”
- Buttons and links: “Cancel” · “Save draft” · “Continue”

### `programmes/view`: Programme

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Programmes > ISR 2026 annual assessment
- Reference: `screens/programmes_view.jpg`
- Headings and section titles: “ISR annual assessment” · “Progress” · “Key dates” · “Recent activity”
- Tabs: “Overview” · “Analytics” · “Organisations” · “Firms” · “Questions 17” · “Cycles 3” · “Settings”
- Table columns: “ORGANISATION” · “STAGE” · “ANSWERED”
- Buttons and links: “Send reminder to all”
- Status chips seen: “Open” · “Answering” · “Firm to assign” · “Submitted” · “Report submitted”
- Tab states (each must match its screenshot):
    - [ ] “Analytics”: `screens/programmes_view__analytics.jpg` · shows: “11 of 26 submitted, 42 days before the deadline” · “Nothing published yet; 21 of 26 have a firm in place” · “Submission by category” · “Not submitted yet”
    - [ ] “Organisations”: `screens/programmes_view__organisations.jpg`
    - [ ] “Firms”: `screens/programmes_view__firms.jpg`
    - [ ] “Questions 17”: `screens/programmes_view__questions-17.jpg`
    - [ ] “Cycles 3”: `screens/programmes_view__cycles-3.jpg` · shows: “Cycles”
    - [ ] “Settings”: `screens/programmes_view__settings.jpg`

### `org/obligations`: Obligations

- [ ] **Built and matches the prototype**
- Workspace: Organisation (Zenith) · Layout: app · Breadcrumb: Obligations
- Reference: `screens/org_obligations.jpg`
- Headings and section titles: “Obligations”
- Table columns: “PROGRAMME” · “ASSURANCE FIRM” · “STAGE” · “ANSWERED” · “DUE”
- Filter pills: “Active 2” · “Completed 4” · “All 6”
- Buttons and links: “Active 2” · “Completed 4” · “All 6” · “Continue” · “Choose a firm”
- Status chips seen: “Answering” · “Firm to choose”

### `firm/engagements`: Engagements

- [ ] **Built and matches the prototype**
- Workspace: Assurance firm (Deloitte) · Layout: app · Breadcrumb: Engagements
- Reference: `screens/firm_engagements.jpg`
- Headings and section titles: “Engagements”
- Table columns: “ORGANISATION” · “PROGRAMME” · “TEAM” · “STAGE” · “DUE”
- Filter pills: “All 17” · “Requests 0” · “Active 2” · “Submitted 1” · “Completed 14”
- Buttons and links: “All 17” · “Requests 0” · “Active 2” · “Submitted 1” · “Completed 14” · “Start assessment” · “Publish”
- Status chips seen: “Answering” · “Submitted” · “Published” · “Approved”

## P6. Answering and assessment

### `org/answer`: Answer

- [ ] **Built and matches the prototype**
- Workspace: Organisation (Zenith) · Layout: app · Breadcrumb: Obligations > ISR 2026 annual assessment
- Reference: `screens/org_answer.jpg`
- Headings and section titles: “ISR 2026 annual assessment”
- Form fields: “Your answer” · “Yes” · “No” · “Not applicable” · “Explain your answer (optional)” · “Attach the proof”
- Buttons and links: “Assign questions (2)” · “Question 1 of 17All questions” · “All” · “Unanswered” · “Mine” · “Flagged” · “1. Governance 7/7 CE” · “2. On what date did the board last approve the policy? CE” · “3. Who owns the policy day to day? CE” · “5. To whom does the CISO report? CE” · “7. Describe the method used CE” · “2. Asset management 0/2 AO” · “4. Access control 0/5” · “7. Incident response 0/3” · “Review and submit” · “Explain this question” · “Rephrase with AI” · “Upload” · “Add a link” · “From evidence library” · “Previous answer” · “Save and next”
- Status chips seen: “Answering” · “4 sections” · “Answered”

### `org/submit`: Review and submit

- [ ] **Built and matches the prototype**
- Workspace: Organisation (Zenith) · Layout: app · Breadcrumb: Obligations > ISR 2026 annual assessment > Review and submit
- Reference: `screens/org_submit.jpg`
- Headings and section titles: “Review and submit” · “By section” · “Not answered yet” · “Answered No” · “Flagged for you” · “Submit”
- Buttons and links: “ISR-2.1 Is there a current inventory of critical assets?” · “ISR-2.1 How many critical assets are listed?” · “ISR-4.1 Is MFA enforced for all privileged access?” · “ISR-4.1 Is MFA enforced for all remote access?” · “ISR-4.1 List any approved exceptions” · “ISR-4.2 Are access rights reviewed every quarter?” · “ISR-4.2 Date of the last review” · “ISR-7.1 Is there a documented incident response plan?” · “ISR-7.2 Was the plan tested in the last 12 months?” · “Submit to assessor”

### `org/evidence`: Evidence library

- [ ] **Built and matches the prototype**
- Workspace: Organisation (Zenith) · Layout: app · Breadcrumb: Evidence library
- Reference: `screens/org_evidence.jpg`
- Headings and section titles: “Evidence library”
- Table columns: “FILE” · “TYPE” · “USED IN” · “ADDED” · “EXPIRES”
- Filter pills: “All files 5” · “In use 2” · “Unused 3” · “Expiring by 31 Dec 2”
- Buttons and links: “Upload” · “All files 5” · “In use 2” · “Unused 3” · “Expiring by 31 Dec 2”
- Status chips seen: “31 Dec 2026” · “30 Nov 2026”

### `firm/assess`: Assessment

- [ ] **Built and matches the prototype**
- Workspace: Assurance firm (Deloitte) · Layout: app · Breadcrumb: Engagements > Zenith Bank Plc
- Reference: `screens/firm_assess.jpg`
- Headings and section titles: “Zenith Bank Plc” · “The organisation's answers” · “Outcome · 4-point compliance scale”
- Tabs: “Requirements 0/8” · “Information requests” · “Interviews” · “Findings” · “Report and sign-off”
- Form fields: “Compliant 100 pts” · “Partially compliant 50 pts” · “Non-compliant 0 pts” · “Not applicable not scored” · “Assessor note”
- Buttons and links: “ISR-1.1 Board-approved information security policy” · “ISR-1.2 Named chief information security officer” · “ISR-1.3 Annual information security risk assessment” · “ISR-2.1 Inventory of critical information assets” · “ISR-4.1 Multi-factor authentication for privileged access” · “ISR-4.2 Quarterly access review” · “ISR-7.1 Report major incidents within 24 hours” · “ISR-7.2 Test the incident response plan yearly” · “Ask” · “Raise a finding” · “Save and next”
- Status chips seen: “Answering” · “Yes”
- Tab states (each must match its screenshot):
    - [ ] “Information requests”: `screens/firm_assess__information-requests.jpg` · shows: “No information requests”
    - [ ] “Interviews”: `screens/firm_assess__interviews.jpg`
    - [ ] “Findings”: `screens/firm_assess__findings.jpg` · shows: “No findings”
    - [ ] “Report and sign-off”: `screens/firm_assess__report-and-sign-off.jpg` · shows: “Findings” · “Sign-off”

### `org/assessment`: Assessment

- [ ] **Built and matches the prototype**
- Workspace: Organisation (Zenith) · Layout: app · Breadcrumb: Obligations > ISR 2026 annual assessment
- Reference: `screens/org_assessment.jpg`
- Headings and section titles: “ISR 2026 annual assessment” · “No information requests”
- Tabs: “Requests from assessor” · “Interviews” · “Outcome preview” · “Your answers”
- Status chips seen: “Answering”
- Tab states (each must match its screenshot):
    - [ ] “Interviews”: `screens/org_assessment__interviews.jpg` · shows: “No interviews yet”
    - [ ] “Outcome preview”: `screens/org_assessment__outcome-preview.jpg` · shows: “No preview yet”
    - [ ] “Your answers”: `screens/org_assessment__your-answers.jpg`

## P7. Review, publishing and findings

### `reviews`: Reviews & publishing

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Reviews & publishing
- Reference: `screens/reviews.jpg`
- Headings and section titles: “Reviews & publishing”
- Tabs: “Review queue 1” · “Approved 1” · “Scheduled 0” · “Held back 0” · “Published 56” · “Tracker”
- Table columns: “ORGANISATION” · “PROGRAMME” · “FIRM” · “SCORE” · “REVIEWER” · “SUBMITTED”
- Buttons and links: “Assign reviewer”
- Tab states (each must match its screenshot):
    - [ ] “Approved 1”: `screens/reviews__approved-1.jpg`
    - [ ] “Scheduled 0”: `screens/reviews__scheduled-0.jpg` · shows: “Nothing here”
    - [ ] “Held back 0”: `screens/reviews__held-back-0.jpg` · shows: “Nothing here”
    - [ ] “Published 56”: `screens/reviews__published-56.jpg`
    - [ ] “Tracker”: `screens/reviews__tracker.jpg`

### `reviews/report`: Review report

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Reviews & publishing > Wema Bank Plc
- Reference: `screens/reviews_report.jpg`
- Headings and section titles: “Wema Bank Plc” · “Outcomes” · “Findings” · “Decision” · “Engagement”
- Table columns: “REQUIREMENT” · “ORGANISATION SAID” · “FIRM OUTCOME” · “NOTE”
- Form fields: “Reviewer” · “Note”
- Buttons and links: “Change” · “Approve report” · “Return to firm”
- Status chips seen: “Report submitted” · “5 Compliant” · “2 Partially compliant” · “1 Non-compliant” · “Yes” · “Compliant” · “No” · “Partially compliant” · “Non-compliant” · “MiNC” · “OBS”

### `org/report`: Report

- [ ] **Built and matches the prototype**
- Workspace: Organisation (Zenith) · Layout: app · Breadcrumb: Obligations > Consumer protection review 2025
- Reference: `screens/org_report.jpg`
- Headings and section titles: “Zenith Bank Plc” · “By section” · “Outcomes” · “Findings” · “How did Deloitte & Touche (Nigeria) do?”
- Table columns: “REQUIREMENT” · “OUTCOME” · “ASSESSOR NOTE”
- Form fields: “Comment (optional)”
- Buttons and links: “Plan your fixes” · “★” · “Send rating” · “Download report (PDF)”
- Status chips seen: “1 Compliant” · “Compliant” · “OBS” · “MiNC”

### `findings`: Findings

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Findings
- Reference: `screens/findings.jpg`
- Headings and section titles: “Findings”
- Tabs: “Register” · “Insights”
- Table columns: “FINDING” · “ORGANISATION” · “FROM” · “FIX BY” · “STATUS”
- Filter pills: “All open 30” · “Plan needed 13” · “In progress 15” · “With firm to verify 1” · “Ready to close 1” · “Overdue 26” · “More time asked 1”
- Form fields: “Show closed and noted”
- Buttons and links: “Export” · “All open 30” · “Plan needed 13” · “In progress 15” · “With firm to verify 1” · “Ready to close 1” · “Overdue 26” · “More time asked 1” · “Remind” · “Decide” · “Close”
- Status chips seen: “MaNC” · “In progress” · “Overdue” · “Plan needed” · “MiNC” · “More time asked” · “OBS” · “Verified fixed” · “Fix submitted”
- Tab states (each must match its screenshot):
    - [ ] “Insights”: `screens/findings__insights.jpg` · shows: “Open findings by category and class” · “26 fixes overdue today”

### `findings/view`: Finding

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Findings > Complaint acknowledgement slipped past 48 hours in December
- Reference: `screens/findings_view.jpg`
- Headings and section titles: “Complaint acknowledgement slipped past 48 hours in December” · “The finding” · “Action plan” · “Proof of the fix” · “Verification” · “Activity” · “Decision” · “Details”
- Status chips seen: “OBS” · “Closed” · “Verified fixed”

### `org/findings`: Findings

- [ ] **Built and matches the prototype**
- Workspace: Organisation (Zenith) · Layout: app · Breadcrumb: Findings
- Reference: `screens/org_findings.jpg`
- Headings and section titles: “Findings”
- Table columns: “FINDING” · “FROM” · “FIX BY” · “STATUS”
- Filter pills: “Open 2” · “To plan 1” · “In progress 1” · “With assessor 0” · “Closed 5”
- Buttons and links: “Open 2” · “To plan 1” · “In progress 1” · “With assessor 0” · “Closed 5” · “Plan fix” · “Update”
- Status chips seen: “MiNC” · “Plan needed” · “OBS” · “In progress”

### `org/finding`: Finding

- [ ] **Built and matches the prototype**
- Workspace: Organisation (Zenith) · Layout: app · Breadcrumb: Findings > Complaint acknowledgement slipped past 48 hours in December
- Reference: `screens/org_finding.jpg`
- Headings and section titles: “Complaint acknowledgement slipped past 48 hours in December” · “The finding” · “Action plan” · “Proof of the fix” · “Verification” · “Activity” · “Next step” · “Details”
- Status chips seen: “OBS” · “Closed” · “Verified fixed”

### `firm/findings`: Findings

- [ ] **Built and matches the prototype**
- Workspace: Assurance firm (Deloitte) · Layout: app · Breadcrumb: Findings
- Reference: `screens/firm_findings.jpg`
- Headings and section titles: “Findings”
- Tabs: “Fixes to verify 1” · “Being fixed 8” · “Verified and closed 31”
- Table columns: “FINDING” · “ORGANISATION” · “FROM” · “FIX BY” · “STATUS”
- Buttons and links: “Verify”
- Status chips seen: “OBS” · “Fix submitted”
- Tab states (each must match its screenshot):
    - [ ] “Being fixed 8”: `screens/firm_findings__being-fixed-8.jpg`
    - [ ] “Verified and closed 31”: `screens/firm_findings__verified-and-closed-31.jpg`

### `firm/finding`: Finding

- [ ] **Built and matches the prototype**
- Workspace: Assurance firm (Deloitte) · Layout: app · Breadcrumb: Findings > Complaint acknowledgement slipped past 48 hours in December
- Reference: `screens/firm_finding.jpg`
- Headings and section titles: “Complaint acknowledgement slipped past 48 hours in December” · “The finding” · “Action plan” · “Proof of the fix” · “Verification” · “Activity” · “Details”
- Status chips seen: “OBS” · “Closed” · “Verified fixed”

## P8. Data returns

### `returns`: Data returns

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Data returns
- Reference: `screens/returns.jpg`
- Headings and section titles: “Data returns”
- Tabs: “Filings 4” · “Insights” · “Templates 4” · “Schedule”
- Table columns: “ORGANISATION” · “RETURN” · “PERIOD” · “DUE” · “STATUS”
- Filter pills: “All 30” · “Due 11” · “To review 4” · “Queried 1” · “Late 2” · “Accepted 12”
- Buttons and links: “New template” · “Show late filings” · “Export” · “All 30” · “Due 11” · “To review 4” · “Queried 1” · “Late 2” · “Accepted 12” · “Review” · “Remind”
- Status chips seen: “Submitted” · “Late” · “Queried” · “Not started” · “Draft” · “Accepted”
- Tab states (each must match its screenshot):
    - [ ] “Insights”: `screens/returns__insights.jpg` · shows: “Filing on time by return and period” · “4 organisations late at least once”
    - [ ] “Templates 4”: `screens/returns__templates-4.jpg` · shows: “Return templates”
    - [ ] “Schedule”: `screens/returns__schedule.jpg` · shows: “Schedule and reminders”

### `returns/template`: Return template

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Data returns > New template
- Reference: `screens/returns_template.jpg`
- Headings and section titles: “New return template” · “Basics” · “Fields”
- Table columns: “LABEL” · “TYPE” · “UNIT” · “MIN” · “MAX” · “NOT MORE THAN” · “REQUIRED”
- Form fields: “Name” · “Short code” · “Frequency” · “Due, days after period end” · “Description (optional)” · “Who files” · “Commercial bank” · “Non-interest bank” · “Merchant bank” · “Microfinance bank” · “Mobile money operator” · “Switching and processing” · “Payment solution service provider” · “Data controller of major importance” · “Cloud service provider” · “Fintech platform”
- Buttons and links: “Edit” · “Preview” · “Add field” · “Cancel” · “Save draft” · “Publish template”
- Status chips seen: “Draft”

### `returns/filing`: Filing

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Data returns > Moniepoint Microfinance Bank · MQR Q3 2026
- Reference: `screens/returns_filing.jpg`
- Headings and section titles: “Lagoon Microfinance Bank Ltd” · “Figures” · “History” · “Decision” · “Filing” · “Other periods”
- Table columns: “FIELD” · “Q3 2026” · “Q2 2026” · “CHANGE”
- Buttons and links: “Query” · “Accept return” · “Query a figure” · “Ask to resubmit” · “Q2 2026 Accepted”
- Status chips seen: “Submitted” · “Accepted”

### `org/returns`: Data returns

- [ ] **Built and matches the prototype**
- Workspace: Organisation (Zenith) · Layout: app · Breadcrumb: Data returns
- Reference: `screens/org_returns.jpg`
- Headings and section titles: “Data returns” · “To do” · “Filed”
- Table columns: “RETURN” · “PERIOD” · “DUE” · “STATUS”
- Filter pills: “All 3” · “Due soon 1” · “Overdue 0” · “Queried 0” · “Filed 2”
- Buttons and links: “All 3” · “Due soon 1” · “Overdue 0” · “Queried 0” · “Filed 2” · “Start” · “View”
- Status chips seen: “Not started” · “Accepted”

### `org/return`: Return

- [ ] **Built and matches the prototype**
- Workspace: Organisation (Zenith) · Layout: app · Breadcrumb: Data returns > Monthly cyber incident return · Sep 2026
- Reference: `screens/org_return.jpg`
- Headings and section titles: “Monthly cyber incident return · Sep 2026” · “What you filed” · “Receipt” · “History”
- Table columns: “FIELD” · “SEP 2026”
- Buttons and links: “Download filed copy”
- Status chips seen: “Accepted”

## P9. Compliance and enforcement

### `enforcement`: Enforcement

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Enforcement
- Reference: `screens/enforcement.jpg`
- Headings and section titles: “Enforcement” · “Watchlist”
- Tabs: “Watchlist 8” · “Cases 2” · “Insights”
- Table columns: “ORGANISATION” · “WHY IT IS FLAGGED” · “CASE”
- Buttons and links: “Open a case” · “Set it in Settings” · “Add an organisation” · “Dismiss”
- Status chips seen: “Awaiting payment”
- Tab states (each must match its screenshot):
    - [ ] “Cases 2”: `screens/enforcement__cases-2.jpg`
    - [ ] “Insights”: `screens/enforcement__insights.jpg` · shows: “1 case waiting for a decision” · “Penalties: ₦0 paid, ₦5,000,000 outstanding”

### `enforcement/new`: Open a case

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Enforcement > Open a case
- Reference: `screens/enforcement_new.jpg`
- Headings and section titles: “Open a case” · “1. Organisation” · “2. Action” · “3. Evidence” · “4. Notice” · “Sign-off”
- Form fields: “Approver”
- Buttons and links: “Compliance directive Orders specific steps by a set date.” · “Send for sign-off” · “Cancel”

### `enforcement/case`: Enforcement case

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: Enforcement > EC-2025-011
- Reference: `screens/enforcement_case.jpg`
- Headings and section titles: “Ironwood Bank Ltd” · “Notice” · “Evidence” · “Response from Ironwood Bank Ltd” · “Decision” · “Timeline” · “Next step” · “Case”
- Buttons and links: “Open organisation” · “Download notice (PDF)”
- Status chips seen: “Closed” · “Result” · “Accepted”

### `org/compliance`: Compliance

- [ ] **Built and matches the prototype**
- Workspace: Organisation (Zenith) · Layout: app · Breadcrumb: Compliance
- Reference: `screens/org_compliance.jpg`
- Headings and section titles: “Compliance” · “In progress”
- Tabs: “Programmes” · “Exposure” · “Regulatory actions”
- Table columns: “PROGRAMME” · “LATEST RESULT” · “SCORE” · “CHANGE” · “CATEGORY AVERAGE” · “STATUS” · “FIXES LEFT”
- Buttons and links: “Export scorecard”
- Status chips seen: “Compliant” · “Firm to choose”
- Tab states (each must match its screenshot):
    - [ ] “Exposure”: `screens/org_compliance__exposure.jpg`
    - [ ] “Regulatory actions”: `screens/org_compliance__regulatory-actions.jpg` · shows: “No regulatory actions”

### `org/compliance/programme`: Programme compliance

- [ ] **Built and matches the prototype**
- Workspace: Organisation (Zenith) · Layout: app · Breadcrumb: Compliance > Programme
- Reference: `screens/org_compliance_programme.jpg`
- Headings and section titles: “ISR annual assessment” · “87 in 2025, down from 95” · “Sections against your category” · “Trace a gap to its fix”
- Buttons and links: “Open the report” · “View as table”
- Status chips seen: “Compliant” · “Below benchmark” · “Partially compliant” · “OBS” · “Closed”

### `org/exposure`: Exposure

- [ ] **Built and matches the prototype**
- Workspace: Organisation (Zenith) · Layout: app · Breadcrumb: Compliance > Exposure
- Reference: `screens/org_exposure.jpg`
- Headings and section titles: “Compliance”
- Tabs: “Programmes” · “Exposure” · “Regulatory actions”
- Filter pills: “All 3” · “High 0” · “Medium 2” · “Low 1”
- Buttons and links: “Export scorecard” · “All 3” · “High 0” · “Medium 2” · “Low 1”
- Status chips seen: “Medium” · “Low”
- Tab states (each must match its screenshot):
    - [ ] “Exposure”: `screens/org_exposure__exposure.jpg`
    - [ ] “Regulatory actions”: `screens/org_exposure__regulatory-actions.jpg` · shows: “No regulatory actions”

### `org/actions`: Regulatory actions

- [ ] **Built and matches the prototype**
- Workspace: Organisation (Zenith) · Layout: app · Breadcrumb: Compliance > Regulatory actions
- Reference: `screens/org_actions.jpg`
- Headings and section titles: “Compliance” · “No regulatory actions”
- Tabs: “Programmes” · “Exposure” · “Regulatory actions”
- Table columns: “NOTICE” · “ISSUED” · “RESPOND BY” · “STATUS”
- Buttons and links: “Export scorecard”
- Tab states (each must match its screenshot):
    - [ ] “Exposure”: `screens/org_actions__exposure.jpg`
    - [ ] “Regulatory actions”: `screens/org_actions__regulatory-actions.jpg`

### `org/action`: Regulatory action

- [ ] **Built and matches the prototype**
- Workspace: Organisation (Zenith) · Layout: app · Breadcrumb: Compliance > Regulatory actions > EC-2025-011
- Reference: `screens/org_action.jpg`
- Headings and section titles: “Warning letter” · “Notice” · “Evidence” · “Your response” · “Decision” · “Timeline” · “Status”
- Buttons and links: “Download notice (PDF)”
- Status chips seen: “Closed” · “Result” · “Accepted”

## P10. Dashboards, search and cross-cutting

### `dashboard`: My dashboard

- [ ] **Built and matches the prototype**
- Workspace: Regulator (M. Bello) · Layout: app · Breadcrumb: My dashboard
- Reference: `screens/dashboard.jpg`
- Headings and section titles: “Good evening, Musa” · “9 organisations non-compliant in at least one programme” · “Average score by category” · “Watchlist” · “5 biggest drops since the previous cycle”
- Filter pills: “Cloud service provider 1” · “Commercial bank 12” · “Fintech platform 2” · “Microfinance bank 14” · “Mobile money operator 3” · “Non-interest bank 1” · “Payment solution service provider 3”
- Buttons and links: “1 enforcement decision waiting for you” · “1 report to review before publishing” · “4 returns to review” · “See all 12 tasks” · “Board pack” · “New programme” · “Issue a regulatory action” · “ORGANISATIONS 36 9 compliant · 11 not assessed yet” · “NON-COMPLIANT 9 7 more compliant with conditions” · “OPEN FINDINGS 30 26 overdue · 7 major” · “RETURNS ON TIME 76% 13 of 17 in the latest period” · “View as table” · “Commercial bank (12) 69” · “Microfinance bank (14) 69” · “Mobile money operator (3) 59” · “Cloud service provider 1” · “Commercial bank 12” · “Fintech platform 2” · “Microfinance bank 14” · “Mobile money operator 3” · “Non-interest bank 1” · “Payment solution service provider 3” · “Tidewater Bank Plc 58 → 26” · “Wema Bank Plc 84 → 55” · “Savannah Microfinance Bank Ltd 74 → 50” · “Unity Community Microfinance Bank 68 → 53” · “Zenith Bank Plc 95 → 87”
- Status chips seen: “Awaiting payment” · “No case”

### `org/dashboard`: My dashboard

- [ ] **Built and matches the prototype**
- Workspace: Organisation (Zenith) · Layout: app · Breadcrumb: My dashboard
- Reference: `screens/org_dashboard.jpg`
- Headings and section titles: “Good evening, Adaeze” · “Finish setting up” · “Compliance” · “Regulatory exposure” · “Your obligations”
- Buttons and links: “Finish answering ISR 2026 annual assessment Due 30 Nov 2026” · “See all 5 tasks” · “Export scorecard” · “Open compliance” · “Continue setup” · “Continue” · “Choose a firm”
- Status chips seen: “Compliant” · “Medium” · “Low” · “Answering” · “Firm to choose”

### `firm/dashboard`: My dashboard

- [ ] **Built and matches the prototype**
- Workspace: Assurance firm (Deloitte) · Layout: app · Breadcrumb: My dashboard
- Reference: `screens/firm_dashboard.jpg`
- Headings and section titles: “Good evening, Tunde” · “Finish setting up” · “Due soon” · “Team workload is even” · “3 active, 14 completed”
- Buttons and links: “1 assessment submitted and waiting for you” · “1 fix sent with proof, waiting for you to verify” · “See all 2 tasks” · “Engagements” · “Performance” · “Continue setup” · “Active engagements 3 1 submitted and waiting for you” · “Requests 0 None waiting” · “Fixes to verify 1 Organisations sent proof” · “View as table” · “T. Adebayo Lead auditor 3” · “I. Okafor Assessor 2” · “R. Salami Assessor 0” · “Requests 0” · “Active 2” · “Submitted 1” · “Completed 14”
- Status chips seen: “Answering” · “Submitted”

### `search`: Search results

- [ ] **Built and matches the prototype**
- Workspace: Any (shown as regulator) · Layout: app · Breadcrumb: Search
- Reference: `screens/search.jpg`
- Headings and section titles: “Search”
