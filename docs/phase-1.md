# Fase 1

## Entregue nesta fundacao

- Projeto Next.js independente.
- Configuracao Prisma/PostgreSQL.
- Schema inicial multiempresa.
- Login administrativo.
- Sessao assinada em cookie.
- Seed com empresa e usuario inicial.
- Tenant context para proteger o admin.
- Layout base do painel administrativo.
- Cadastro inicial de empresas.
- Listagem de usuarios da empresa atual.

## Para rodar localmente

1. Copie `.env.example` para `.env`.
2. Ajuste `DATABASE_URL` para um PostgreSQL local.
3. Rode `npm install`.
4. Rode `npm run prisma:migrate -- --name init`.
5. Rode `npm run seed`.
6. Rode `npm run dev`.

Credenciais do seed:

- E-mail: `admin@influencersaas.local`
- Senha: `admin123456`

Para conferir se o usuario, hash, senha e vinculo com empresa estao corretos, rode:

```txt
npm run auth:check
```
