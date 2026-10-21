/** Espelho de mpn-api/src/scripts/e2e-accounts.ts */
export const E2E_PASSWORD = "Admin@123";

export const E2E_ACCOUNTS = {
  admin: { username: "mpn", password: E2E_PASSWORD },
  seller: { username: "seller", password: E2E_PASSWORD },
} as const;
