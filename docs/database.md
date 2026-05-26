# Banco De Dados

O schema inicial cobre a fundacao da Fase 1:

- `companies`
- `users`
- `company_members`
- `audit_logs`

As tabelas operacionais futuras devem carregar `company_id` e constraints unicas escopadas por empresa.

Exemplos:

- Cupom unico por empresa: `unique(company_id, code)`.
- Venda unica por origem: `unique(company_id, source, external_id)`.
- Consultas sempre filtradas por `company_id`.

O saldo financeiro deve ser derivado de lancamentos em livro-razao, nao de um campo editavel.
