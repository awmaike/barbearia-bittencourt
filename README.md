# Barbearia Bittencourt

Sistema web completo para apresentação da barbearia, agendamento de horários e gestão administrativa.

## Recursos

- agendamento online com seleção de serviços, barbeiro, data e horário;
- cálculo automático da duração de serviços combinados;
- bloqueio de conflitos e atualização de disponibilidade;
- cancelamento de agendamentos por link;
- painel administrativo com agenda, clientes, horários, caixa e relatórios;
- painel de suporte com manutenção, auditoria, lixeira, busca e backups;
- autenticação, recuperação de senha e MFA;
- galeria de imagens e versão instalável (PWA);
- layout responsivo para celular, tablet e computador;
- persistência em Cloudflare D1, arquivos em R2 e autenticação pelo Supabase.

## Tecnologias

- TypeScript
- React / Next.js compatível via Vinext
- Cloudflare Workers, D1 e R2
- Drizzle ORM
- Supabase Auth
- CSS responsivo

## Executar localmente

Requisitos: Node.js 22.13 ou superior e npm.

```bash
npm ci
npm run dev
```

Para gerar a versão de produção:

```bash
npm run build
```

## Variáveis de ambiente

O projeto utiliza variáveis configuradas no ambiente de hospedagem. Nunca inclua chaves reais no repositório.

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_PUBLISHABLE_KEY=sua-chave-publicavel
```

Além dessas variáveis, a hospedagem precisa disponibilizar os vínculos de banco D1 e armazenamento R2 esperados pelo projeto.

## Banco de dados

O esquema está em `db/schema.ts` e as migrações ficam em `drizzle/`. As migrações devem ser aplicadas no banco da nova hospedagem antes do uso.

## Segurança

- arquivos `.env`, bancos locais, backups e identificadores internos de hospedagem são ignorados pelo Git;
- usuários e senhas devem ser criados diretamente no provedor de autenticação;
- não reutilize credenciais do ambiente de demonstração;
- mantenha o repositório privado caso ele receba configurações comerciais do cliente.

## Rotas principais

- `/` — site e agendamento do cliente;
- `/admin/login` — entrada do painel administrativo;
- `/suporte` — painel técnico de suporte;
- `/privacidade` — política de privacidade.

## Autoria

Desenvolvido por Maike Dyeller de Andrade Weber para a Barbearia Bittencourt, de Serafina Corrêa/RS.

Todos os direitos reservados. O código não deve ser redistribuído ou comercializado sem autorização do autor.
