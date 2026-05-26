# Arquitetura

Este produto nasce como um SaaS independente para operacao de campanhas de influenciadores.

## Decisoes iniciais

- Aplicacao full-stack em Next.js.
- Banco PostgreSQL novo.
- ORM Prisma.
- Autenticacao propria para a fundacao, com senha hasheada e sessao assinada em cookie.
- Multiempresa desde o schema, com usuarios ligados a empresas por `company_members`.
- Toda area administrativa depende de `requireTenant()`.

## Rotas iniciais

- `/login`: login administrativo.
- `/admin`: dashboard base da empresa atual.
- `/admin/empresas`: cadastro e listagem inicial de empresas.
- `/admin/usuarios`: usuarios vinculados ao tenant atual.
- `/admin/configuracoes`: leitura do contexto da empresa atual.

## Proximos modulos previstos

- Influenciadores.
- Campanhas.
- Cupons.
- Vendas.
- Comissoes.
- Carteira.
- Saques.
- Portal do influenciador.
- Importacoes CSV.
- Integracoes futuras.
