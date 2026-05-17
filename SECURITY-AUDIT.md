# Security Audit: SQL Injection & Database Vulnerabilities

**Auditor:** AI Security Agent  
**Date:** 2026-05-17  
**Scope:** SQL injection, Prisma query safety, credential key exposure, include vs select patterns

---

## Executive Summary

Audited the Cal.com codebase for SQL injection, credential exposure, and database security issues. **No SQL injection vulnerabilities were found** — all raw SQL queries use proper Prisma parameterization. However, several credential exposure risks exist through overly permissive Prisma `include` patterns.

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High     | 4 |
| Medium   | 5 |
| Low      | 2 |

---

## Critical Findings

### 1. `include: { owner: true }` fetches ALL User fields including sensitive data

**Severity:** CRITICAL  
**Files:**
- `apps/api/v2/src/modules/teams/event-types/teams-event-types.repository.ts:82`
- `apps/api/v2/src/platform/event-types/event-types_2024_06_14/event-types.repository.ts:184,208`

**Description:**  
Multiple API v2 repository methods use `include: { owner: true, team: true }` which fetches **all columns** from the `User` (owner) and `Team` tables. The User model may contain sensitive fields such as hashed passwords, email verification tokens, two-factor secrets, and other private data. This data is fetched from the database and could be inadvertently exposed through API responses or logging.

```typescript
// teams-event-types.repository.ts:82
include: { owner: true, team: true },

// event-types.repository.ts:184
include: { owner: true, team: true },
```

**Suggested Fix:**  
Replace `include: { owner: true }` with a `select` that only fetches needed fields:
```typescript
include: {
  owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
  team: { select: { id: true, name: true, slug: true } },
},
```

---

## High Findings

### 2. `include: { users: true }` fetches ALL User fields

**Severity:** HIGH  
**Files:**
- `apps/api/v2/src/modules/teams/event-types/teams-event-types.repository.ts:130`
- `apps/api/v2/src/platform/event-types/event-types_2024_06_14/event-types.repository.ts:168`
- `apps/api/v2/src/platform/event-types/event-types_2024_06_14/event-types.repository.ts:115,125,136,196`

**Description:**  
Multiple repository methods use `include: { users: true }` which fetches all fields from related User records. This can expose sensitive user data unnecessarily.

**Suggested Fix:**  
Use `select` to limit user fields:
```typescript
include: {
  users: { select: { id: true, name: true, email: true, avatarUrl: true } },
},
```

### 3. `credentialForCalendarServiceSelect` includes `key: true` (OAuth tokens)

**Severity:** HIGH  
**File:** `packages/prisma/selects/credential.ts:14`

**Description:**  
The `credentialForCalendarServiceSelect` includes `key: true` which returns the raw credential key (OAuth tokens, API secrets). This select is used extensively across the codebase. The codebase has a `safeCredentialSelect` (line 20-36) that correctly omits `key` and `encryptedKey`, but it is used in fewer places.

```typescript
export const credentialForCalendarServiceSelect = {
  key: true,           // SENSITIVE: OAuth tokens, API keys
  encryptedKey: true,  // SENSITIVE: encrypted form
  // ... other fields
};
```

**Suggested Fix:**  
- Audit all usages of `credentialForCalendarServiceSelect` to ensure the key is never returned to clients
- Use `safeCredentialSelect` wherever possible

### 4. `include: { credentials: { select: credentialForCalendarServiceSelect } }` in event type queries

**Severity:** HIGH  
**File:** `packages/features/eventtypes/repositories/eventTypeRepository.ts:1154-1156`

**Description:**  
When fetching event types with hosts, the query includes credentials with `key: true`. If this data is ever serialized to a tRPC response or API response, all hosts' OAuth tokens would be exposed.

### 5. `getBookingReferencesIncludeSensitiveCredentials` exposes full credential objects

**Severity:** HIGH  
**File:** `apps/api/v2/src/platform/bookings/2024-08-13/repositories/booking-references.repository.ts:29-50`

**Description:**  
Uses `include: { credential: true }` which fetches the entire credential object including `.key`. The controller has defense-in-depth that strips sensitive fields, but the risk remains if new code paths are added.

---

## Medium Findings

### 6. `include: { password: true }` in auth routes
**Files:** `apps/web/app/api/auth/two-factor/totp/setup/route.ts:38`, `apps/web/app/api/auth/two-factor/totp/disable/route.ts:36`

### 7. `include: { attendees: true }` without field selection
**Files:** `packages/features/bookings/lib/handleSeats/handleSeats.ts:60`

### 8. Broad `include` patterns in API v2 repositories
**Files:** `apps/api/v2/src/modules/ooo/repositories/ooo.repository.ts` (multiple locations)

### 9. Widespread `credential.key` access across 40+ app-store integration files
Internal service files legitimately need credential access, but no guardrail prevents accidental serialization.

---

## Low Findings (PASS)

### 10. Raw SQL queries — properly parameterized
All `$queryRaw` usages use Prisma tagged template literals. **No SQL injection vulnerabilities found.**

### 11. XSS via `dangerouslySetInnerHTML` — properly mitigated
All usages reviewed. None accept unvalidated user input directly.

### 12. Open redirect protection — properly implemented
`getSafeRedirectUrl` validates redirect URLs against a whitelist of allowed origins.

---

## Positive Observations

1. All raw SQL queries use proper Prisma parameterization
2. Open redirect protection via `getSafeRedirectUrl` with origin whitelist
3. Defense-in-depth in API v2 controllers (stripping sensitive fields before response)
4. Explicit coding standards in AGENTS.md prohibit `credential.key` exposure
5. Repository pattern provides single points for data access control
6. Zod validation for request input in API routes
7. `safeCredentialSelect` exists as a safe alternative

---

## Recommendations

1. **Critical:** Replace `include: { owner: true }` with explicit `select` in API v2 repositories
2. **High:** Migrate from `credentialForCalendarServiceSelect` to `safeCredentialSelect` where possible
3. **High:** Add ESLint rule to prevent `include` usage in API-facing code without explicit field selection
4. **High:** Add ESLint rule to prevent `credential.key` in API response serialization
5. **Medium:** Replace `include: { password: true }` with `select` in auth routes
6. **Medium:** Consider a `SecureCredential` wrapper type to prevent accidental serialization
