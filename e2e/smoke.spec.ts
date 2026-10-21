import { expect, test } from "@playwright/test";
import { E2E_ACCOUNTS } from "./accounts";

async function login(page: import("@playwright/test").Page, username: string, password: string) {
  await page.goto("/");
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}

test("login de plataforma cai em início", async ({ page }) => {
  await login(page, E2E_ACCOUNTS.admin.username, E2E_ACCOUNTS.admin.password);
  await expect(page).toHaveURL(/\/inicio/);
  await expect(page.getByRole("link", { name: "Clientes" })).toBeVisible();
});

test("lista clientes e abre a arena", async ({ page }) => {
  await login(page, E2E_ACCOUNTS.admin.username, E2E_ACCOUNTS.admin.password);
  await page.getByRole("link", { name: "Clientes" }).click();
  await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();
  await page.getByRole("link", { name: /Arena Dev/ }).click();
  await expect(page.getByRole("heading", { name: "Arena Dev" })).toBeVisible();
});

test("lista representantes", async ({ page }) => {
  await login(page, E2E_ACCOUNTS.admin.username, E2E_ACCOUNTS.admin.password);
  await page.getByRole("link", { name: "Representantes" }).click();
  await expect(page.getByRole("heading", { name: "Representantes" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Vendedor E2E/ })).toBeVisible();
});

test("comissões do representante em leitura", async ({ page }) => {
  await login(page, E2E_ACCOUNTS.seller.username, E2E_ACCOUNTS.seller.password);
  await page.getByRole("link", { name: "Comissões" }).click();
  await expect(page.getByRole("heading", { name: "Comissões" })).toBeVisible();
  await expect(page.getByText("Nenhuma comissão ainda")).toBeVisible();
});
