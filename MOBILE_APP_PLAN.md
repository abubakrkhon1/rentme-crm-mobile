# RentMe CRM Mobile — Product and Delivery Plan

## 1. Product definition

RentMe CRM Mobile is the staff companion app for the existing RentMe CRM. It is intended for fast, operational work that is comfortable on a phone: handling bookings, customers and transactions; completing vehicle handoff/return inspections; capturing evidence; and messaging customers.

It is not a mobile copy of every desktop CRM screen. Reporting, marketing campaign authoring, bank-statement reconciliation, team administration, and complex settings remain desktop-first.

The existing repositories have distinct roles:

- `rentme-crm` is the source of truth for database schema, authorization, tenancy, business rules, and workflows.
- `rentme-mobile` is the customer-facing rental app. Its Expo setup, authentication plumbing, theme primitives, and customer identity model are useful prior art, but its product navigation is not the basis of this staff app.
- `rentme-crm-mobile` is the new staff application described here.

## 2. Target users and permissions

The first release supports authenticated CRM organization members:

| Role | Mobile access |
| --- | --- |
| Owner | All mobile functions, including destructive and financial actions |
| Admin | All operational functions; organization-sensitive actions follow CRM rules |
| Manager | Bookings, customers, inspections, transactions, messaging |
| Staff | Day-to-day bookings, customer lookup, pickup/return, allowed transaction actions, messaging |
| Viewer | Read-only lists and detail screens |

The app must use the same active organization and role membership as the CRM. Organization IDs supplied by the device are never trusted as authorization.

## 3. Mobile information architecture

Recommended bottom navigation:

1. **Today** — pickups, returns, overdue rentals, pending bookings, unread messages, and quick actions.
2. **Bookings** — searchable/filterable list, booking details, create/edit, status workflows, extensions, pickup and return.
3. **Customers** — search, customer profile, documents, booking history, balance, transactions, and conversation.
4. **Inbox** — customer support conversations, unread state, attachments, and booking/customer context.
5. **More** — transactions, fleet lookup, notifications, workspace switcher, profile, and sign out.

Global actions available from relevant screens:

- Scan/search a customer or booking.
- Create a booking.
- Record a payment/charge/refund when authorized.
- Start pickup or return inspection.
- Take/upload a photo.
- Message a customer.

## 4. MVP feature scope

### 4.1 Authentication and workspace

- Email/password sign-in, password reset, session refresh, and secure device storage.
- Resolve all active organization memberships after sign-in.
- Workspace picker for users belonging to multiple organizations.
- Role-aware UI plus server-side/RLS enforcement.
- Session expiry handling and explicit sign-out.
- Optional biometric unlock after the first authenticated session; it does not replace Supabase authentication.

### 4.2 Today dashboard

- Today's pickups and returns.
- Overdue active bookings.
- Pending reservations needing review.
- Unread customer conversations.
- Fast links into the exact operational workflow.
- Pull-to-refresh and realtime invalidation where useful.

### 4.3 Bookings

- Search by customer name, phone, email, booking ID, vehicle, or plate.
- Filters: today/upcoming/overdue, status, vehicle, and assigned staff member.
- Booking detail with customer, dates, location, vehicle, pricing, deposit, payment balance, notes, inspection state, and transaction history.
- Create booking with customer selection/creation, vehicle availability, dates, rate inputs, insurance/add-ons, deposit, locations, and notes.
- Edit allowed booking fields.
- Change status only through valid lifecycle transitions.
- Extend a rental only after server-side availability validation.
- Cancel/archive according to role and existing CRM rules.
- Create pickup inspection and activate booking as one atomic workflow.
- Create return inspection and complete booking as one atomic workflow.

### 4.4 Pickup and return inspections

- Guided checklist for fuel level, odometer, allowed miles, exterior/interior condition, damage notes, and general notes.
- Camera-first capture with gallery fallback.
- Required shot guidance: front, rear, driver side, passenger side, interior, odometer, and fuel gauge. Exact required shots should be tenant-configurable later.
- Image compression, orientation correction, upload progress, retry, and resumable draft state.
- Review and remove photos before submission.
- Private signed-photo viewing after submission.
- Atomic submit: do not advance booking state until required metadata and uploaded object references are committed.
- Safe cleanup of abandoned or failed uploads.

### 4.5 Customers

- Search and filter customers.
- Create and edit contact, address, driver-license, and age-verification fields.
- Customer detail: bookings, balance, deposit status, transactions, documents, and support conversation.
- Capture/upload customer documents only when included in the authorized CRM workflow.
- No bulk CSV import on mobile.

### 4.6 Transactions

- Transaction list and customer/booking-scoped transaction history.
- Add charge, payment, refund, or adjustment according to existing role rules.
- Collect, apply, and refund security deposits through the canonical CRM workflows.
- Edit transaction date only when allowed.
- Void/delete only when allowed and confirmed.
- Capture/upload receipt or transaction evidence from camera, gallery, or files.
- Preview private image/PDF attachments using short-lived signed URLs.
- Display amounts consistently; all new API contracts use integer cents even where legacy database columns are numeric.

### 4.7 Customer support chat

- One organization-scoped conversation per customer initially, with optional booking context on individual messages.
- CRM staff and authenticated customer-app users participate in the same conversation.
- Sender identity, timestamps, delivery/read state, and unread counts.
- Text plus image attachment support in MVP; documents can follow.
- Supabase Realtime for foreground updates.
- Push notification to the recipient when the app is backgrounded.
- “RentMe Support” is the customer-facing sender label; the audit trail retains the actual staff sender.
- Blocked/archived conversation state, attachment size/type validation, throttling, and abuse controls.
- Support chat is transactional support, not marketing; marketing consent is not reused as chat consent.

### 4.8 Deliberately deferred

- Marketing campaign creation and audience management.
- Bank statement import/reconciliation.
- Advanced reports and analytics authoring.
- Team invitations and organization configuration.
- Full calendar/Gantt editing.
- GPS map operations beyond a later read-only vehicle lookup.
- Offline financial mutations or offline booking finalization.

## 5. Technical architecture

### Mobile client

- Expo + React Native + TypeScript.
- Expo Router for route groups and deep links.
- TanStack Query for server state, caching, invalidation, and optimistic UI where safe.
- React Hook Form + Zod for forms and shared contract validation.
- Zustand only for short-lived workflow drafts such as an inspection in progress.
- Supabase Auth with tokens stored via SecureStore-compatible storage.
- Expo Camera/Image Picker, Image Manipulator, File System, and Notifications.
- Sentry with PII-safe breadcrumbs and release tracking.

Use a development build once native camera, notifications, or other native modules are introduced. Keep iOS and Android native folders generated through Expo configuration.

### Backend boundary

Do not reproduce CRM Server Action logic in the mobile client and do not grant broad table mutation access just to make mobile screens work.

Add a versioned mobile API/BFF to `rentme-crm`, for example `/api/mobile/v1/*`, or equivalent Supabase Edge Functions. The recommended first choice is the CRM API because it can reuse current TypeScript domain modules and authorization helpers.

Every request must:

1. Accept a Supabase bearer token.
2. Resolve the authenticated user server-side.
3. Resolve and validate active organization membership server-side.
4. Enforce the same role matrix as the CRM.
5. Validate input with versioned Zod contracts.
6. Execute canonical domain logic or an atomic PostgreSQL function.
7. Return stable error codes suitable for mobile UI.
8. Write audit metadata for sensitive mutations.

Direct Supabase access from the app is appropriate only for narrowly scoped reads, realtime subscriptions, and uploads protected by tenant-aware RLS. Security must not depend on a hidden URL, anon key, or client-supplied organization ID.

### Shared contracts and business logic

Extract framework-neutral modules from the CRM where needed:

- Booking lifecycle and validation.
- Availability checks and extensions.
- Pricing/money representation.
- Transaction and deposit operations.
- Inspection payload schemas.
- Role/capability definitions.
- API request/response contracts and error codes.

Server Actions and mobile endpoints should call the same domain services. The mobile app may mirror schemas for UX validation, but server validation is authoritative.

### Data and synchronization

- Online-first for all mutations.
- Cache recent lists/details for read access with a visible “last updated” state.
- Persist only safe workflow drafts locally; encrypt or minimize PII.
- Queue photo uploads with deterministic IDs and idempotency keys.
- Do not queue financial operations for silent later execution.
- Use server timestamps and the organization timezone for business dates; display in the device locale.

## 6. Backend work required before feature completion

The CRM currently has the required booking, customer, transaction, inspection, and private-storage foundations, but its main mutations are Next.js Server Actions. Mobile needs explicit authenticated endpoints or shared RPC-backed services for:

- Booking list/detail/create/update/archive/status transition/extension.
- Vehicle availability and booking admin options.
- Customer list/detail/create/update/archive.
- Transaction list/create/void/date change and deposit workflows.
- Inspection create/update/complete and signed photo URLs.
- Transaction attachment upload authorization and signed URLs.
- Workspace membership/capabilities and dashboard summaries.

Storage policy review is mandatory. Older inspection policies allow any authenticated user against the bucket; mobile launch requires final tenant-aware policies and canonical object paths.

Chat is net-new. Proposed minimum schema:

- `support_conversations`: `id`, `organization_id`, `customer_id`, `status`, `last_message_at`, timestamps.
- `support_conversation_participants`: conversation, auth user/customer/staff identity, last-read timestamp.
- `support_messages`: `id`, `organization_id`, `conversation_id`, `sender_user_id`, `sender_type`, `body`, optional `booking_id`, client idempotency key, timestamps, deleted/edit metadata if supported.
- `support_message_attachments`: message, storage path, MIME type, size, dimensions, timestamps.
- `mobile_push_tokens`: user, organization, platform, token, device metadata, last-seen/revoked timestamps.

All chat tables and storage objects require organization- and participant-scoped RLS. Realtime publication must expose only conversations the current user can read.

## 7. Suggested route structure

```text
src/app/
  _layout.tsx
  index.tsx
  (auth)/
    sign-in.tsx
    forgot-password.tsx
    callback.tsx
  (app)/
    _layout.tsx
    workspace-picker.tsx
    (tabs)/
      _layout.tsx
      today.tsx
      bookings.tsx
      customers.tsx
      inbox.tsx
      more.tsx
    bookings/
      new.tsx
      [bookingId]/index.tsx
      [bookingId]/edit.tsx
      [bookingId]/pickup.tsx
      [bookingId]/return.tsx
      [bookingId]/extend.tsx
    customers/
      new.tsx
      [customerId]/index.tsx
      [customerId]/edit.tsx
    transactions/
      index.tsx
      new.tsx
      [transactionId].tsx
    conversations/
      [conversationId].tsx
    settings/
      index.tsx
```

Feature code should live outside the route tree under `src/features`, with shared API, auth, storage, observability, and query utilities under `src/lib`.

## 8. Delivery phases

### Phase 0 — Contract and security foundation

- Confirm MVP roles and capabilities.
- Inventory CRM workflows and extract domain services from Server Actions.
- Define OpenAPI-style endpoint contracts, stable error codes, idempotency rules, and generated TypeScript types.
- Add bearer-token workspace authorization to the CRM API.
- Audit and test tenant RLS and storage policies.
- Scaffold Expo project, environments, CI, lint, typecheck, tests, crash reporting, and build profiles.

Exit criteria: a signed-in staff user can select a workspace and call a protected “me/capabilities” endpoint; cross-tenant tests pass.

### Phase 1 — Read-only operations shell

- Navigation, Today dashboard, booking list/detail, customer list/detail, transaction history.
- Search, filters, loading/empty/error/offline states.
- Deep links from push notifications into records.

Exit criteria: staff can reliably answer “what is happening today?” and look up any relevant booking/customer from a phone.

### Phase 2 — Booking and customer mutations

- Create/edit bookings and customers.
- Valid status transitions, availability checks, cancellation, and extension.
- Capability-gated actions and audit trail.

Exit criteria: core booking desk workflows can be completed on mobile without inconsistent CRM state.

### Phase 3 — Field inspections and attachments

- Pickup/return guided workflows.
- Camera/gallery capture, optimization, upload queue, retries, signed previews, cleanup.
- Transaction creation and receipt attachments.
- Deposit actions.

Exit criteria: a staff member can perform a complete vehicle handoff and return in the parking lot, including evidence and payment records.

### Phase 4 — Realtime support chat

- Chat schema/RLS/storage, staff inbox, customer conversation UI, realtime delivery, read state.
- Customer-app integration in `rentme-mobile`.
- Push notifications and support sender branding.

Exit criteria: a customer and authorized RentMe staff can exchange messages and images, with correct unread counts and no cross-tenant exposure.

### Phase 5 — Hardening and release

- Accessibility, low-connectivity behavior, performance, upload stress tests, security review, and observability dashboards.
- iOS/Android internal distribution, staged pilot, store assets/privacy disclosures, production release.
- Measure workflow completion, failures, upload retries, crash-free sessions, and message delivery.

## 9. Testing strategy

- Unit tests: money/date rules, schemas, state transitions, capability checks, upload queue behavior.
- Contract tests: mobile client fixtures against API schemas and stable error mapping.
- Integration tests: booking + inspection atomicity, availability conflicts, deposits, attachment cleanup, chat unread/read behavior.
- RLS tests: every protected table and bucket across two organizations, staff roles, customer participant, inactive member, and anonymous user.
- End-to-end tests: sign-in, create/edit booking, pickup, return, add transaction receipt, customer chat, notification deep link.
- Device matrix: current and previous major iOS versions plus representative modern and constrained Android devices.
- Failure tests: expired session, network interruption mid-upload, duplicate submission, app termination during draft, upload succeeds but commit fails, and notification permission denied.

## 10. Release gates

- No service-role key or server secret in the app bundle.
- Cross-tenant RLS/API/storage test suite is green.
- All sensitive mutations are capability-gated and audited.
- Booking and financial mutations are idempotent.
- Images are private, validated, compressed, and served by short-lived signed URLs.
- Crash/error telemetry excludes message bodies, credentials, documents, and unnecessary PII.
- Privacy policy and app-store disclosures cover camera, photos, files, notifications, customer data, and support messages.
- Lint, typecheck, unit/integration tests, and production EAS builds pass for both platforms.

## 11. Initial product decisions to confirm

1. Is this app for internal CRM staff only, with the existing `rentme-mobile` remaining the customer app? This plan assumes yes.
2. Which roles may create refunds, void/delete transactions, cancel bookings, and edit completed inspections?
3. Should support chat be one continuous customer conversation or one conversation per booking? The recommended MVP is one customer conversation with optional booking context.
4. Are transaction records informational/manual, or must the app charge/refund through a payment processor?
5. Which inspection photos are mandatory, and do requirements vary by organization?
6. Is multi-workspace switching required at launch?
7. Should staff receive customer messages outside business hours, and what notification/escalation rules apply?

## 12. Recommended first implementation slice

Build a vertical slice before broad screen coverage:

1. Sign in and resolve workspace/capabilities.
2. Show Today's pickups and returns.
3. Open one booking detail.
4. Complete its pickup inspection with camera photos.
5. Atomically activate the booking.
6. Verify the result immediately in desktop CRM.

This slice exercises the hardest shared concerns early: authentication, tenancy, API contracts, role enforcement, uploads, offline interruption, atomic business workflows, and CRM/mobile consistency.
