import assert from "node:assert/strict";
import { getAdminIdentityStatus, isUnauthenticatedAuthError, parseAdminEmailAllowlist } from "../src/lib/admin-access";

const allowlistedEmails = parseAdminEmailAllowlist("owner@example.com, admin@example.com\nsecond@example.com");

const cases = [
  {
    name: "unauthenticated user is denied",
    input: { userId: null, email: "owner@example.com", allowlistedEmails },
    expected: "unauthenticated",
  },
  {
    name: "signed-in user outside the email allowlist is denied",
    input: { userId: "user-1", email: "other@example.com", allowlistedEmails },
    expected: "not-allowlisted",
  },
  {
    name: "allowlisted email signs in without MFA",
    input: { userId: "user-2", email: "ADMIN@example.com ", allowlistedEmails },
    expected: "authorized",
  },
  {
    name: "allowlisted email is authorized",
    input: { userId: "user-3", email: "second@example.com", allowlistedEmails },
    expected: "authorized",
  },
  {
    name: "missing email is denied",
    input: { userId: "user-4", email: null, allowlistedEmails },
    expected: "not-allowlisted",
  },
  {
    name: "empty configured allowlist denies signed-in users",
    input: { userId: "user-5", email: "owner@example.com", allowlistedEmails: parseAdminEmailAllowlist(undefined) },
    expected: "not-allowlisted",
  },
] as const;

for (const testCase of cases) {
  assert.equal(getAdminIdentityStatus(testCase.input), testCase.expected, testCase.name);
}

assert.equal(isUnauthenticatedAuthError({ name: "AuthSessionMissingError", status: 400 }), true);
assert.equal(isUnauthenticatedAuthError({ name: "AuthApiError", status: 401 }), true);
assert.equal(isUnauthenticatedAuthError({ name: "AuthRetryableFetchError", status: 0 }), false);

console.log(`Admin authorization passed (${cases.length} cases).`);
