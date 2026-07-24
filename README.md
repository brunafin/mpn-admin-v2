# MPN Admin

Portal interno da dona da plataforma (somente leitura de clientes).

## Stack

- Vite + React 19 + Tailwind CSS v4
- Consome `mpn-api` (`/auth/login`, `/platform/clients`)

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Abre em [http://localhost:5174](http://localhost:5174).

### Variáveis

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL_BASE` | Base da API (ex.: `http://localhost:3001`) |
| `VITE_ENVIRONMENT` | `development` / `production` |
| `VITE_LOGO_URL` | Opcional; sobrescreve o logo local (`/logo-admin.png`) |

## Promover seu usuário a platform_admin

Depois de rodar a migration `PersonRoleAndLastLogin` na API:

```sql
UPDATE person
SET role = 'platform_admin'
WHERE username = 'SEU_USERNAME'
-- ou: WHERE email = 'seu@email.com';
```

Faça login de novo no admin para receber o JWT com `role: platform_admin`.

Contas com `role = owner` conseguem autenticar na API, mas o admin recusa o acesso.

## Scripts

```bash
npm run dev      # :5174
npm run build
npm start        # serve o dist
```
