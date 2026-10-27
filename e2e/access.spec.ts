import { expect, test, type Page } from "@playwright/test";
import { E2E_ACCOUNTS } from "./accounts";

async function login(page: Page) {
  await page.goto("/");
  await page.locator("#username").fill(E2E_ACCOUNTS.admin.username);
  await page.locator("#password").fill(E2E_ACCOUNTS.admin.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/inicio/);
}

function arenaRow(page: Page, name: string) {
  return page.getByRole("link", { name: new RegExp(`^${name}`) });
}

async function openArena(page: Page, name: string) {
  await page.getByRole("link", { name: "Clientes" }).click();
  await arenaRow(page, name).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
}

test("inadimplência aparece na lista e no detalhe", async ({ page }) => {
  await login(page);
  await page.getByRole("link", { name: "Clientes" }).click();
  await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();

  const row = arenaRow(page, "Arena Leitura");
  await expect(row).toContainText("Acesso bloqueado por falta de pagamento");
  await row.click();

  await expect(page.getByRole("heading", { name: "Arena Leitura" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "Acesso bloqueado por falta de pagamento",
  );
  await expect(page.getByText("A agenda fica só para consulta.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Liberar" })).toBeVisible();
});

test("admin libera e bloqueia de novo a arena inadimplente", async ({ page }) => {
  await login(page);
  await openArena(page, "Arena Leitura");

  await page.getByRole("button", { name: "Liberar" }).click();
  const unlock = page.getByRole("dialog");
  await expect(unlock.getByText("Liberar acesso?")).toBeVisible();
  await unlock.getByRole("button", { name: "Liberar acesso" }).click();

  await expect(page.getByRole("button", { name: "Bloquear" })).toBeVisible();
  await expect(
    page.getByText("Acesso bloqueado por falta de pagamento"),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Bloquear" }).click();
  const lock = page.getByRole("dialog");
  await expect(lock.getByText("Bloquear acesso?")).toBeVisible();
  await expect(lock).toContainText("mensalidade em aberto");
  await lock.getByRole("button", { name: "Bloquear acesso" }).click();

  await expect(page.getByRole("status")).toContainText(
    "Acesso bloqueado por falta de pagamento",
  );
  await expect(page.getByRole("button", { name: "Liberar" })).toBeVisible();
});

test("prazo de inadimplência confirma ao antecipar e aplica nas arenas", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("link", { name: "Inadimplência" }).click();
  await expect(page.getByRole("heading", { name: "Inadimplência" })).toBeVisible();
  await expect(page.getByText("Bloqueio no 10º dia depois do vencimento.")).toBeVisible();

  await page.locator('input[name="blockAfterDays"]').fill("20");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("status")).toContainText(
    "voltaram ao acesso completo",
  );

  await page.getByRole("link", { name: "Clientes" }).click();
  const leitura = arenaRow(page, "Arena Leitura");
  await expect(leitura).toBeVisible();
  await expect(leitura).not.toContainText("Acesso bloqueado por falta de pagamento");

  await page.getByRole("link", { name: "Inadimplência" }).click();
  await expect(page.getByText("Bloqueio no 20º dia depois do vencimento.")).toBeVisible();
  await page.locator('input[name="blockAfterDays"]').fill("10");
  await page.getByRole("button", { name: "Salvar" }).click();

  const confirm = page.getByRole("dialog");
  await expect(confirm.getByText("Antecipar o bloqueio?")).toBeVisible();
  await expect(confirm).toContainText("Arenas com 10 dias ou mais de atraso");
  await confirm.getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("Bloqueio no 20º dia depois do vencimento.")).toBeVisible();

  await page.getByRole("button", { name: "Salvar" }).click();
  const confirmAgain = page.getByRole("dialog");
  await confirmAgain.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("status")).toContainText("ficaram somente leitura");

  await page.getByRole("link", { name: "Clientes" }).click();
  await expect(arenaRow(page, "Arena Leitura")).toContainText(
    "Acesso bloqueado por falta de pagamento",
  );
});
