# Contribuindo

Obrigado por considerar contribuir com este projeto.

## Como contribuir

1. Faça um fork do repositório.
2. Crie uma branch descritiva: `feat/minha-mudanca` ou `fix/meu-ajuste`.
3. Faça commits pequenos e objetivos.
4. Execute build local antes de abrir PR.
5. Abra um Pull Request descrevendo problema, solução e impacto.

## Padrões técnicos

- Mantenha TypeScript estrito e sem erros de tipagem.
- Preserve a arquitetura por camadas no backend (routes/controllers/services/repositories).
- No frontend, prefira componentes legíveis e serviços centralizados em `src/services`.
- Evite mudanças de escopo em um mesmo PR.

## Checklist antes do PR

- [ ] Backend compila: `cd backend && npm run build`
- [ ] Frontend compila: `cd frontend && npm run build`
- [ ] Mudanças documentadas no README quando aplicável
- [ ] Sem credenciais ou dados sensíveis versionados

## Convenção de commits (recomendado)

- `feat:` nova funcionalidade
- `fix:` correção de bug
- `refactor:` melhoria interna sem alterar regra de negócio
- `docs:` ajustes de documentação
- `chore:` manutenção geral
