# MACS Member Management System: Complete Project Documentation

## 1. Project Summary

This repository contains a large single-page CRM and operations application for financial services teams. The product is centered on customer/member lifecycle management, lead handling, insurance policy management, mutual fund tracking, employee administration, tasks, reports, accounts, campaigns, location services, AI-assisted workflows, and configurable master data.

The app is built as a React 19 + TypeScript + Vite frontend, but its current runtime behavior is still largely mock-data driven:

- Most business data is served from `services/apiService.ts`, which acts like an in-memory/local browser data layer instead of a real backend.
- AI features are wired through Google Gemini in `services/geminiService.ts`, with fallback implementations when an API key is unavailable.
- Some state is persisted in browser storage, but most seeded data resets when the page reloads because it lives in module-level variables.

This document is intended to be the "top to bottom" technical reference for the repository as it exists today.

## 2. What The Application Does

At a high level, the application supports:

- Customer/member onboarding and profile management
- Family and SPOC (single point of contact) relationships
- Lead capture, qualification, assignment, and conversion
- Insurance policy tracking, renewal workflows, and document requirements
- Mutual fund holdings and transactions
- Task creation, bulk assignment, reassignment, audit history, and completion remarks
- Employee management, attendance, and advisor workflows
- Reports, analytics, dashboards, PDF/Excel exports
- Accounting, vouchers, receipts, opening balances, ledgers, trial balance, and P&L
- Campaign targeting and execution list generation
- Cross-selling opportunity discovery and lead creation
- Notes, voice notes, transcription, summaries, and task creation from action items
- Location planning, smart routing, advisor check-in/check-out, and route tracking
- AI-assisted chatbot, reviews, suggestions, and natural-language workflows
- Master data administration for almost every domain object used by the app

## 3. Tech Stack

### Frontend/runtime

- React `19.1.x`
- React DOM `19.1.x`
- TypeScript `5.8.x`
- React Router DOM `7.9.x`
- Vite `6.2.x`

### Visualization and exports

- `chart.js`
- `recharts`
- `jspdf`
- `jspdf-autotable`
- `xlsx`

### AI and mapping

- `@google/genai`
- `@react-google-maps/api`

### Utility libraries

- `date-fns`
- `lucide-react`
- `focus-trap-react`
- `clsx`
- `tailwind-merge`

### Installed but not central in current wiring

- `leaflet`
- `react-leaflet`
- `framer-motion`

## 4. Runtime Architecture

The application boot sequence is straightforward:

1. `index.tsx` mounts `<App />` inside `<BrowserRouter>`.
2. `App.tsx` loads all initial data through async calls to `services/apiService.ts`.
3. If no `currentUser` is present, the app renders the login route.
4. After login, the shell renders the collapsible sidebar, top header, route content, and modal stack.
5. Most route components receive already-filtered company-specific data and callbacks from `App.tsx`.

Important architectural characteristics:

- `App.tsx` is the central orchestrator and state container.
- The app is prop-driven, not Redux-driven.
- There is no dedicated API client layer for HTTP in the active implementation.
- There is no backend auth token flow in the active runtime.
- Most write operations mutate module-level arrays inside `apiService.ts`.
- Only operating companies currently persist to `localStorage`; most other mock data does not survive reload.

## 5. Build, Run, and Environment

### Scripts

`package.json` exposes:

- `npm run dev`
- `npm run build`
- `npm run preview`

### Environment variables currently used

- `GEMINI_API_KEY`
- `VITE_PUBLIC_BUILDER_KEY`
- `REACT_APP_GOOGLE_MAPS_API_KEY` is referenced by code, but is not wired in `vite.config.ts`

### Current env wiring behavior

`vite.config.ts` maps:

- `process.env.API_KEY` -> `env.GEMINI_API_KEY`
- `process.env.GEMINI_API_KEY` -> `env.GEMINI_API_KEY`

This is why Gemini code that checks `process.env.API_KEY` still works in this Vite project.

### Important configuration caveats

- `services/geminiService.ts` uses `process.env.API_KEY`, not `import.meta.env`.
- `components/LocationServices.tsx` uses `process.env.REACT_APP_GOOGLE_MAPS_API_KEY`, but `vite.config.ts` does not define that variable for the browser bundle.
- Result: AI features can work when `GEMINI_API_KEY` is set, but Google Maps is likely to fail unless env wiring is updated.

### Styling/tooling caveat

The project uses Tailwind utility classes heavily, but the repo does not include a local Tailwind toolchain dependency. Instead:

- `index.html` loads Tailwind from the CDN.
- `index.css` still contains `@tailwind` directives, which suggests partially migrated tooling.

This is a hybrid setup and should be cleaned up if the project moves toward stricter production builds.

## 6. Browser APIs and Permissions

`metadata.json` declares these runtime permission expectations:

- camera
- geolocation
- microphone

These match actual feature areas:

- Camera / file capture for document-oriented workflows
- Geolocation for route planning and advisor tracking
- Microphone for notes, transcription, and voice flows

## 7. Authentication and Access Model

### Login flow

The login screen is implemented in `components/Login.tsx` and calls `login()` in `services/apiService.ts`.

The mock login validates:

- company name
- employee ID
- password
- role ID
- branch ID when the user has a branch assigned
- selected financial year

### Current authentication reality

- Login is mock-based.
- Passwords are stored in plaintext in memory in `services/apiService.ts`.
- No JWT or session token is used by the active implementation.
- `API_INTEGRATION_GUIDE.md` describes how a future real backend integration could work, but that is not the current runtime.

### Remember-me behavior

The login page stores `rememberedUser` in `localStorage` with:

- company
- employeeId
- roleId

### Demo seed users currently present

These are defined in `services/apiService.ts`:

- `admin` / `admin` for the system administrator role
- `secretary` / `secretary`
- advisor users such as `1002`, `1003`, `1004` with password `password`
- `Support` / `support`

These credentials are suitable only for local demo/mock usage.

### Authorization

Authorization is role- and module-based:

- Roles are stored in `Role[]`
- Role permissions are stored in `RolePermissions[]`
- App modules are defined in the `AppModule` type in `types.ts`
- Permission levels are `view`, `create`, `modify`, `none`

`App.tsx` computes final user permissions by merging:

- role permissions
- user-level overrides from `currentUser.profile.permissions`

Advisors are also force-granted task modification access in current logic.

## 8. Data and Persistence Model

### Active data source

The app is currently backed by `services/apiService.ts`, which:

- seeds data using top-level arrays and objects
- simulates latency via `simulateDelay`
- returns deep-cloned data
- mutates in-memory collections for CRUD-like behavior

### Persistence rules

- Operating companies are loaded from and saved to `localStorage` under `-operatingCompanies`
- Login remember-me uses `localStorage`
- Campaign execution working state uses `sessionStorage`
- Most other data lives only in module memory and resets on reload

### Seed data source

`data/initialData.tsx` holds large initial datasets for:

- automation rules
- document templates
- geographies
- banks
- business verticals
- lead sources
- insurance agencies
- insurance schemes
- documents
- gifts
- task statuses
- customer segments
- customer fields
- insurance fields
- tasks
- accounts
- expenses
- receipts
- mutual fund masters
- opening balances

## 9. Core Type System

`types.ts` is the central domain schema file. It defines:

### User and employee types

- `User`
- `EmployeeProfile`
- `AdvisorAddress`
- `AdvisorEducation`
- `AdvisorDocument`
- `Designation`
- `Role`
- `RolePermissions`

### CRM and customer types

- `Member`
- `Lead`
- `LeadActivityLog`
- `LeadStageMaster`
- `LeadSourceMaster`
- `CustomerType`
- `CustomerTier`
- `CustomerCategory`
- `CustomerSubCategory`
- `CustomerGroup`
- `RelationshipType`

### Insurance and investment types

- `Policy`
- `CoveredMember`
- `InsuranceTypeMaster`
- `InsuranceFieldMaster`
- `InsuranceTypeDocumentRule`
- `AMC`
- `MutualFundScheme`
- `MutualFundHolding`
- `MutualFundTransaction`

### Task and workflow types

- `Task`
- `TaskActivityLog`
- `TaskMaster`
- `TaskStatusMaster`
- `ProcessStageMaster`
- `ProcessLog`
- `Notification`
- `Appointment`
- `AutomationRule`

### Finance and accounting types

- `Expense`
- `ManualIncome`
- `ManualCommission`
- `ManualReceipt`
- `ReceiptLineItem`
- `OpeningBalance`
- `AccountCategory`
- `AccountSubCategory`
- `AccountHead`
- `FinancialYear`
- `DocumentNumbering`
- `ProfitLossEntry`
- `DayBookEntry`
- `LedgerEntry`

### Supporting master data

- `Company`
- `Branch`
- `CompanyInfo`
- `BankMaster`
- `BusinessVertical`
- `SchemeMaster`
- `Religion`
- `Festival`
- `FestivalDate`
- `Geography`
- `Gender`
- `MaritalStatus`
- `OccasionTypeMaster`

## 10. Application Shell and State Ownership

`App.tsx` owns and coordinates nearly all global application state, including:

- current user
- selected financial year
- theme
- sidebar state
- toasts
- members
- leads
- users
- routes
- roles and permissions
- attendance
- notifications
- tasks
- appointments
- automation rules
- document templates
- advisor locations and check-ins
- master data collections
- finance collections
- modal state for member, lead, employee, review, proposals, attendance, duplicates, and more

It also centralizes:

- permission derivation
- company-level data filtering
- login/logout
- AI focus generation
- notification generation
- member tier calculation
- CRUD coordination for major modules

This is currently a monolithic but understandable top-level orchestration model.

## 11. Main Route Map

Authenticated routes in `App.tsx`:

| Route | Component | Purpose |
| --- | --- | --- |
| `/dashboard` | `Dashboard.tsx` | Summary KPIs, tasks, AI focus, notifications, high-level activity |
| `/customers` | `MemberDashboard.tsx` | Customer/member list, actions, filters, access to member modal |
| `/policies` | `PolicyManager.tsx` | Policy listing, renewal monitoring, filters, exports |
| `/mutualFunds` | `MutualFunds.tsx` | Mutual fund holdings, transactions, member-level investment tracking |
| `/pipeline` | `SalesPipeline.tsx` | Lead kanban pipeline with conversion and filtering |
| `/notes` | `NotesPage.tsx` | Voice/manual notes, summaries, action-item-to-task workflow |
| `/location` | `LocationServices.tsx` | Planner, path search, advisor tracker, check-in/check-out |
| `/chatbot` | `WhatsAppBot.tsx` | Internal assistant, simulator, canned replies, broadcast workflow |
| `/profile` | `AdminProfile.tsx` or `ProfilePage.tsx` | User/admin profile management |
| `/employees` | `EmployeeManagement.tsx` | Staff listing, attendance, activation, editing |
| `/servicesHub` | `ServicesHub.tsx` | Commission dashboard and agent appointments shell |
| `/actionHub` | `ActionAutomationHub.tsx` | Notifications, automation, scheduling, upsell actions |
| `/masterData/*` | `masterdata/MasterData.tsx` | Full master data admin area |
| `/reports-insights` | `ReportsAndInsights.tsx` | Employee performance, lead analytics, trends, scheme conversion |
| `/taskManagement` | `TaskManagement.tsx` | Task table/cards, bulk assignment, history, reassignment |
| `/incomeAndExpense` | `IncomeAndExpense.tsx` | Receipt, income, expense, voucher operations and analysis |
| `/accounts` | `Accounts.tsx` | Opening balances, day book, ledger, trial balance, P&L |
| `/calendar` | `FestivalCalendar.tsx` | Festival and customer event calendar |
| `/advancedReports` | `AdvancedReports.tsx` | Multi-dimensional reporting with exports and graphs |
| `/CrossSelling` | `CrossSellingDashboard.tsx` | Cross-sell opportunity discovery and lead creation |
| `/campaign` | `CampaignExecution.tsx` | Campaign filtering, execution lists, stateful targeting |

Unauthenticated route:

- `/login` -> `Login.tsx`

## 12. Sidebar Navigation Categories

`components/Sidebar.tsx` groups modules into:

- Insights
- Sales
- Finance
- Operations
- Admin

Sidebar visibility is fully permission-driven. If a module permission is `none`, the corresponding navigation item is hidden.

## 13. Major Functional Modules

### 13.1 Dashboard

`components/Dashboard.tsx`

Key responsibilities:

- summary KPI cards
- task overview
- task detail modal
- notifications and focus integration
- customer tier visibility
- charts and attendance-aware presentation

### 13.2 Customer/Member Management

Primary files:

- `components/MemberDashboard.tsx`
- `components/MemberTable.tsx`
- `components/MemberModal.tsx`
- `components/DuplicateMemberModal.tsx`
- `components/ViewByTierModal.tsx`

Notable capabilities:

- list, filter, sort, and page through customers
- create and edit members
- conversational creation trigger
- duplicate detection before final save
- family/SPOC relationship handling
- dependents and relief from family groups
- documents, policies, needs analysis, notes, and investments tabs
- task creation from within member context
- AI annual review generation trigger
- customer tier assignment based on either premium or sum assured

### 13.3 Leads and Sales Pipeline

Primary files:

- `components/SalesPipeline.tsx`
- `components/LeadModal.tsx`
- `utils/leadUtils.ts`

Capabilities:

- kanban-style lead stage movement
- advisor-aware visibility for advisor users
- lead filtering by source, branch, value bounds, and insurance type
- conversion from lead to member
- lead activity log generation on changes
- creation of referrers from the lead flow

### 13.4 Policies

Primary files:

- `components/PolicyManager.tsx`
- `components/tabs/PoliciesTab.tsx`
- `components/ProposalGeneratorModal.tsx`
- `components/AnnualReviewModal.tsx`

Capabilities:

- policy aggregation across members
- renewal monitoring and status-focused filters
- insurance type hierarchy filtering
- branch/advisor filters
- PDF export via `jspdf-autotable`
- member modal deep-linking
- proposal generation and annual review flows
- document requirement rules through master data

### 13.5 Mutual Funds

Primary files:

- `components/MutualFunds.tsx`
- `components/tabs/InvestmentsTab.tsx`
- `components/masterdata/MutualFundsManager.tsx`

Capabilities:

- holdings and scheme-level tracking
- transactions and new investment capture
- AMC and mutual fund scheme references
- member-linked investment updates

### 13.6 Tasks

Primary files:

- `components/TaskManagement.tsx`
- `TASK_MANAGEMENT_IMPROVEMENTS.md`

Capabilities:

- task creation and editing
- individual and bulk assignment
- branch-aware assignee filtering
- card and table views
- task history modal
- reassignment modal with reason
- mandatory completion remark for end-state transitions
- task activity log lifecycle tracking

### 13.7 Notes and Voice Intelligence

Primary files:

- `components/NotesPage.tsx`
- `components/VoiceNotesTab.tsx`

Capabilities:

- voice recording
- browser speech recognition usage
- transcription and summarization
- manual note summarization
- semantic/AI note search
- advanced note filtering
- task creation from detected action items

### 13.8 Action Hub

Primary files:

- `components/ActionAutomationHub.tsx`
- `components/DocumentHub.tsx`
- `components/TodaysFocus.tsx`

Capabilities:

- notifications dashboard
- automation rule management
- scheduled greetings/messages
- appointment scheduling
- document template management
- upsell suggestion handling
- AI-generated "today's focus" summaries

### 13.9 Services Hub

Primary files:

- `components/ServicesHub.tsx`
- `components/CommissionDashboard.tsx`
- `components/AgentAppointments.tsx`

Capabilities:

- commission status management
- service navigation shell
- agent appointment placeholder feature

### 13.10 Employees and Attendance

Primary files:

- `components/EmployeeManagement.tsx`
- `components/EmployeeModal.tsx`
- `components/AttendanceModal.tsx`
- `components/AttendanceReportModal.tsx`
- `components/EditLeaveReasonModal.tsx`
- `components/ChangePasswordModal.tsx`
- `components/ForgotPasswordModal.tsx`
- `components/AdminProfile.tsx`
- `components/ProfilePage.tsx`
- `components/tabs/EmployeeProfileTabs.tsx`
- `components/tabs/EmployeeDocumentsTab.tsx`

Capabilities:

- employee listing and editing
- active/inactive status
- branch-assigned staff
- profile, address, education, customers, and documents sections
- advisor attendance
- admin-triggered attendance management
- password change and forgot-password flow

### 13.11 Reports and Insights

Primary files:

- `components/ReportsAndInsights.tsx`
- `components/EmployeePerformance.tsx`
- `components/SchemeConversionReports.tsx`
- `components/LeadAnalyticsReports.tsx`
- `components/BusinessTrendsReports.tsx`
- `components/AnalyticsDashboard.tsx`

Capabilities:

- employee performance reporting
- scheme conversion analysis
- lead analytics
- business trend charts
- mixed charting through Recharts and Chart.js

### 13.12 Advanced Reports

`components/AdvancedReports.tsx`

This is one of the most feature-dense reporting modules in the repo. It supports:

- customer, business, and combined report modes
- customer vs lead record types
- highly configurable filter sets
- geography and advisor filters
- customer demographic filters
- policy/investment/business filters
- graph selection and graph type selection
- drill-down modals
- PDF export support

### 13.13 Finance: Income, Expense, Vouchers, Receipts

Primary files:

- `components/IncomeAndExpense.tsx`
- `components/PaymentVoucherModal.tsx`
- `components/ManualReceiptModal.tsx`

Capabilities:

- incomes, expenses, commissions, receipts
- voucher and receipt numbering by financial year
- active financial year gating
- receipt and voucher save flows
- analysis tab with charts
- branch/company context

### 13.14 Accounting

`components/Accounts.tsx`

Capabilities:

- opening balances
- day book
- ledger
- trial balance
- profit and loss
- Excel export via `xlsx`
- PDF export via `jspdf-autotable`

### 13.15 Calendar and Festivals

Primary files:

- `components/FestivalCalendar.tsx`
- `components/masterdata/ReligionsAndFestivalsManager.tsx`

Capabilities:

- festival calendar rendering
- filtering by festival/religion data
- interaction with customer records from event context

### 13.16 Cross Selling

`components/CrossSellingDashboard.tsx`

Capabilities:

- opportunity filtering across demographic, geographic, and business attributes
- bulk selection
- bulk lead creation
- targeted cross-selling creation using master data references

### 13.17 Campaign Execution

`components/CampaignExecution.tsx`

Capabilities:

- campaign selection
- customer parameter selection
- business parameter selection
- insurance vs mutual fund targeting
- preview and execution list generation
- session persistence via `campaign_module_state_v3`
- export-focused workflow

### 13.18 Location Services

`components/LocationServices.tsx`

Capabilities:

- nearby customer planning
- AI route optimization
- clients-on-route lookup
- smart trip suggestion
- advisor tracker view
- advisor trail fetching
- meeting check-in and check-out
- geolocation tracking
- Google Maps route visualization

Important current limitation:

- Google Maps key lookup uses `process.env.REACT_APP_GOOGLE_MAPS_API_KEY`, but this is not defined by the Vite config in the repo.

### 13.19 Chatbot and Messaging

`components/WhatsAppBot.tsx`

Capabilities:

- internal assistant for staff
- simulated client reply mode
- keyword/reply authoring
- broadcast targeting by member segments
- direct WhatsApp redirect links
- AI fallback for unsupported custom prompts

## 14. Master Data Area

`components/masterdata/MasterData.tsx` is a nested route shell for master-data management. It is permission-aware and supports visibility controls at the individual master-section level.

### Nested master-data routes

| Route | Manager | Purpose |
| --- | --- | --- |
| `companyMaster` | `CompanyMasterManager.tsx` | Operating companies |
| `branches` | `BranchesManager.tsx` | Branch management |
| `financialYear` | `FinancialYearManager.tsx` | Financial years and document numbering |
| `designation` | `DesignationManager.tsx` | Designations |
| `role` | `RoleManager.tsx` | Roles |
| `rolePermissions` | `RolePermissionsManager.tsx` | Module permissions |
| `masterDataPermissions` | `MasterDataRolePermissionsManager.tsx` | Per-master-area visibility |
| `businessVerticals` | `BusinessVerticalsManager.tsx` | Business verticals |
| `campaign` | `CampaignMasterManager.tsx` | Campaign master list |
| `accountCategories` | `AccountCategoryManager.tsx` | Account categories, subcategories, heads |
| `bankMasters` | `BankMastersManager.tsx` | Bank master data |
| `schemesAndMappings` | `SchemesAndMappingsManager.tsx` | Agencies and schemes |
| `leadSources` | `LeadSourceManager.tsx` | Lead and referral source hierarchy |
| `leadStageMaster` | `LeadStageManager.tsx` | Lead stages |
| `geography` | `GeographyManager.tsx` | Geography tree |
| `documentMasters` | `DocumentMastersManager.tsx` | Documents |
| `tierManagement` | `TierAndGiftManager.tsx` | Customer tiers, gifts, tier rules |
| `taskStatuses` | `TaskStatusManager.tsx` | Task statuses |
| `routes` | `RoutesManager.tsx` | Routes |
| `religionsAndFestivals` | `ReligionsAndFestivalsManager.tsx` | Religions, festivals, dates |
| `relationshipTypes` | `RelationshipTypesManager.tsx` | Relationship types |
| `customerSegments` | `CustomerSegmentsManager.tsx` | Categories, subcategories, groups |
| `genders` | `GendersManager.tsx` | Gender master |
| `maritalStatuses` | `MaritalStatusManager.tsx` | Marital status master |
| `customerMaster` | `CustomerFieldManager.tsx` | Customer custom field definitions |
| `taskMasters` | `TaskTypeManager.tsx` | Task types |

Supporting master-data utilities:

- `GenericMasterManager.tsx`
- `PolicyConfigurationManager.tsx`
- `ProcessStageManager.tsx`
- `MutualFundsManager.tsx`
- `UnifiedAgencySchemeManager.tsx`

## 15. Services Layer

### `services/apiService.ts`

This is the active mock data service. It includes:

- premium calculation helper
- Digipin generation helper
- login
- account category/subcategory/head CRUD
- financial year/document numbering CRUD
- user CRUD
- member CRUD
- policy renewal
- mobile-based member lookup
- route CRUD
- lead CRUD
- operating company CRUD
- branch CRUD
- role/designation/permission CRUD
- relationship/process/lead stage master CRUD
- festival date CRUD and date-range queries
- genders/marital statuses/customer types/tiers getters
- advisor location and check-in/check-out flows
- campaign CRUD
- opening balance CRUD

### `services/geminiService.ts`

This is the primary AI integration layer. Exposed capabilities include:

- document OCR extraction
- payment proof analysis
- Digipin helpers
- location enrichment
- document summarization
- policy suggestions
- natural-language member search
- chatbot responses
- automated client replies
- optimal route generation
- clients-on-route discovery
- audio transcription
- transcript summarization
- voice-note search
- competitor policy analysis
- growth forecasting
- trip suggestions
- annual review generation
- manual text summarization
- today's focus generation
- conversational member parsing
- financial health reports
- upsell opportunity generation

### `services/otherAiService.ts`

Contains fallback implementations for major AI functions. These are used conceptually when Gemini is unavailable and document the fallback behavior expected by the app.

## 16. Utility Modules

- `utils/leadUtils.ts`
  - Generates lead activity log entries when leads change.

- `constants.tsx`
  - Large Indian geography lists and supporting constants such as blood groups and bank names.

- `declarations.d.ts`
  - TypeScript module declarations for CSS and image imports.

## 17. Existing Supporting Docs and Assets In Repo

### Documentation files

- `README.md`
  - General overview, but not fully aligned with current runtime details.

- `API_INTEGRATION_GUIDE.md`
  - Future-oriented guidance for replacing the mock service with real APIs.

- `TASK_MANAGEMENT_IMPROVEMENTS.md`
  - Change note explaining task workflow improvements that are now reflected in the UI.

### Other project artifacts

- `Macs-CRM-API.postman_collection.json`
  - API collection for planned/backend integration workflows.

- `Function TC.xlsx`
  - Supplemental spreadsheet artifact present in repo root.

- `builder.config.json`
  - Local dev command metadata.

- `metadata.json`
  - App metadata and permission declarations.

### Static assets

- `public/img/`
  - Login and logo image assets.

- `dist/`
  - Built output currently committed to the repository.

- `node_modules/`
  - Installed third-party packages currently committed/present in the working tree.

## 18. Storage Keys and Client Persistence

Current browser storage keys observed in the repo:

- `rememberedUser` in `localStorage`
- `-operatingCompanies` in `localStorage`
- `campaign_module_state_v3` in `sessionStorage`

Planned API guide keys that are documented but not active in runtime:

- `authToken`

## 19. Known Constraints, Mismatches, and Risks

These are important for anyone maintaining or extending the project:

### Mock backend reality

- The app looks full-featured, but most data is not coming from a real backend yet.
- Reloading the page can wipe many changes because most collections are in-memory only.

### Environment mismatch for maps

- `LocationServices.tsx` expects `REACT_APP_GOOGLE_MAPS_API_KEY`.
- `vite.config.ts` only defines Gemini-related variables.
- The map module is therefore likely broken until env handling is corrected.

### README drift

- The README is useful but does not fully describe the actual runtime architecture or limitations.

### Tailwind setup inconsistency

- Tailwind CDN is used in `index.html`.
- `index.css` still contains local Tailwind directives.
- The repository does not include a standard Tailwind build pipeline in dependencies.

### Security caveats

- Plaintext passwords exist in mock seed data.
- No real auth/session handling is active.
- This should not be deployed as-is for production usage.

### Testing status

- No automated test suite or test scripts were found in `package.json`.

### Build verification in this environment

- A build was attempted, but the current shell environment does not have `node` available on `PATH`, so runtime build verification could not be completed from this session.

## 20. Recommended Next Steps For The Project

If this repository is being actively developed, the highest-value improvements would be:

1. Replace `apiService.ts` mock storage with a real HTTP API layer.
2. Normalize environment variable access to Vite-friendly `import.meta.env` or consistent `define` mappings.
3. Fix Google Maps key wiring.
4. Consolidate the styling pipeline so Tailwind usage is consistent.
5. Add automated tests for core CRUD and permission-sensitive flows.
6. Break `App.tsx` into smaller state containers or context providers.
7. Separate demo seed data from production data handling.

## 21. Source Inventory

This appendix lists the important repository files and what each is responsible for.

### Root application files

- `App.tsx` - Application shell, global state, route wiring, modal orchestration, data loading.
- `index.tsx` - React entry point.
- `index.html` - HTML shell, CDN Tailwind config, import map, favicon.
- `index.css` - Base CSS and Tailwind directives.
- `package.json` - scripts and dependencies.
- `tsconfig.json` - TypeScript config.
- `vite.config.ts` - Vite config and env injection.
- `constants.tsx` - Indian states, blood groups, bank constants.
- `types.ts` - Complete domain type system.
- `declarations.d.ts` - asset module declarations.
- `metadata.json` - app metadata and required browser permissions.
- `builder.config.json` - local builder/dev metadata.
- `README.md` - general project readme.
- `API_INTEGRATION_GUIDE.md` - planned API migration guide.
- `TASK_MANAGEMENT_IMPROVEMENTS.md` - task module enhancement note.
- `Macs-CRM-API.postman_collection.json` - API collection artifact.
- `Function TC.xlsx` - supplemental non-code project artifact.

### Data, services, and utilities

- `data/initialData.tsx` - initial mock datasets.
- `services/apiService.ts` - mock data service and CRUD operations.
- `services/geminiService.ts` - Gemini AI service layer.
- `services/otherAiService.ts` - AI fallback implementations.
- `utils/leadUtils.ts` - lead activity log helper.

### Main route components

- `components/Dashboard.tsx`
- `components/MemberDashboard.tsx`
- `components/PolicyManager.tsx`
- `components/MutualFunds.tsx`
- `components/SalesPipeline.tsx`
- `components/NotesPage.tsx`
- `components/LocationServices.tsx`
- `components/WhatsAppBot.tsx`
- `components/ProfilePage.tsx`
- `components/AdminProfile.tsx`
- `components/EmployeeManagement.tsx`
- `components/ServicesHub.tsx`
- `components/ActionAutomationHub.tsx`
- `components/ReportsAndInsights.tsx`
- `components/TaskManagement.tsx`
- `components/IncomeAndExpense.tsx`
- `components/Accounts.tsx`
- `components/FestivalCalendar.tsx`
- `components/AdvancedReports.tsx`
- `components/CrossSellingDashboard.tsx`
- `components/CampaignExecution.tsx`
- `components/Login.tsx`
- `components/Sidebar.tsx`

### Customer, lead, employee, and workflow support components

- `components/MemberModal.tsx`
- `components/MemberTable.tsx`
- `components/LeadModal.tsx`
- `components/EmployeeModal.tsx`
- `components/AttendanceModal.tsx`
- `components/AttendanceReportModal.tsx`
- `components/ForgotPasswordModal.tsx`
- `components/ChangePasswordModal.tsx`
- `components/DuplicateMemberModal.tsx`
- `components/AnnualReviewModal.tsx`
- `components/ProposalGeneratorModal.tsx`
- `components/ConversationalCreatorModal.tsx`
- `components/NotificationDropdown.tsx`
- `components/DocumentHub.tsx`
- `components/TodaysFocus.tsx`
- `components/ViewByTierModal.tsx`
- `components/ViewByBranchModal.tsx`
- `components/ProcessFlowTracker.tsx`
- `components/ManualReceiptModal.tsx`
- `components/PaymentVoucherModal.tsx`
- `components/VoiceNotesTab.tsx`
- `components/EditLeaveReasonModal.tsx`

### Reporting and analytics support components

- `components/AnalyticsDashboard.tsx`
- `components/EmployeePerformance.tsx`
- `components/SchemeConversionReports.tsx`
- `components/LeadAnalyticsReports.tsx`
- `components/BusinessTrendsReports.tsx`
- `components/CommissionDashboard.tsx`
- `components/AgentAppointments.tsx`

### Additional/legacy or not currently central route components

- `components/LandingPage.tsx`
- `components/LeadSourceSelector.tsx`
- `components/logindummy.ts`

### Member modal tab components

- `components/tabs/BasicInfoTab.tsx`
- `components/tabs/DocumentsTab.tsx`
- `components/tabs/PoliciesTab.tsx`
- `components/tabs/NeedsAnalysisTab.tsx`
- `components/tabs/NotesAndRemindersTab.tsx`
- `components/tabs/InvestmentsTab.tsx`
- `components/tabs/GiftManagement.tsx`
- `components/tabs/EmployeeProfileTabs.tsx`
- `components/tabs/EmployeeDocumentsTab.tsx`

### Master data components

- `components/masterdata/MasterData.tsx`
- `components/masterdata/GenericMasterManager.tsx`
- `components/masterdata/CompanyMasterManager.tsx`
- `components/masterdata/BranchesManager.tsx`
- `components/masterdata/FinancialYearManager.tsx`
- `components/masterdata/DesignationManager.tsx`
- `components/masterdata/RoleManager.tsx`
- `components/masterdata/RolePermissionsManager.tsx`
- `components/masterdata/MasterDataRolePermissionsManager.tsx`
- `components/masterdata/BusinessVerticalsManager.tsx`
- `components/masterdata/CampaignMasterManager.tsx`
- `components/masterdata/LeadSourceManager.tsx`
- `components/masterdata/LeadStageManager.tsx`
- `components/masterdata/GeographyManager.tsx`
- `components/masterdata/DocumentMastersManager.tsx`
- `components/masterdata/TierAndGiftManager.tsx`
- `components/masterdata/TaskStatusManager.tsx`
- `components/masterdata/TaskTypeManager.tsx`
- `components/masterdata/RoutesManager.tsx`
- `components/masterdata/ReligionsAndFestivalsManager.tsx`
- `components/masterdata/RelationshipTypesManager.tsx`
- `components/masterdata/CustomerSegmentsManager.tsx`
- `components/masterdata/GendersManager.tsx`
- `components/masterdata/MaritalStatusManager.tsx`
- `components/masterdata/CustomerFieldManager.tsx`
- `components/masterdata/BankMastersManager.tsx`
- `components/masterdata/AccountCategoryManager.tsx`
- `components/masterdata/PolicyConfigurationManager.tsx`
- `components/masterdata/ProcessStageManager.tsx`
- `components/masterdata/MutualFundsManager.tsx`
- `components/masterdata/UnifiedAgencySchemeManager.tsx`
- `components/masterdata/SchemesAndMappingsManager.tsx`

### Shared UI components

- `components/ui/Button.tsx`
- `components/ui/Input.tsx`
- `components/ui/Textarea.tsx`
- `components/ui/Modal.tsx`
- `components/ui/SearchBar.tsx`
- `components/ui/SearchableSelect.tsx`
- `components/ui/MultiSelectDropdown.tsx`
- `components/ui/Pagination.tsx`
- `components/ui/Tabs.tsx`
- `components/ui/Toast.tsx`
- `components/ui/ToggleSwitch.tsx`
- `components/ui/CustomTooltip.tsx`
- `components/ui/Icons.tsx`

### Static assets and generated directories

- `public/img/` - source image assets used by login and branding.
- `dist/` - production build output committed to repo.
- `node_modules/` - installed dependencies.

## 22. Final Notes

This repository is substantial and already models a broad operational domain. The most important thing to remember while working in it is that there are two different levels of completeness:

- The UI and domain model are deep and broad.
- The persistence/integration layer is still mostly mock/local.

Anyone onboarding to the project should therefore treat it as a feature-rich frontend prototype or pre-backend integration system unless and until the service layer is replaced with a real API-backed implementation.
