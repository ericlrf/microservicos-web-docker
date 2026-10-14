# Relatório de validação

Data: 14 de outubro de 2026.

## Executado neste ambiente

| Verificação | Resultado | Limite |
|---|---|---|
| `node --test tests/unit.test.cjs` | **44 testes aprovados; 0 falhas** | Funções puras de configuração, credenciais e catálogo |
| `node scripts/check-syntax.mjs` | **18 arquivos JavaScript analisados** | Verifica sintaxe; não carrega Express/JWT nem executa os serviços |
| Leitura de YAML com PyYAML | Aprovada | Não equivale a `docker compose config` |
| Checagens estruturais do projeto | Aprovadas | Contextos de build, Dockerfiles, portas, scripts e nomes dos serviços conferidos |
| Slides | Cinco páginas renderizadas e inspecionadas | Conteúdo do PowerPoint em textos/formas nativos, com notas |

Runtime dos testes unitários: **Node.js v22.16.0**, instalado neste ambiente. As imagens Docker estão configuradas com **Node.js 24 Alpine**; esse runtime não foi executado aqui. Saída dos testes: `resultados-unitarios.tap`.

A chamada incorreta `instancia.createProxyServer(...)` foi reproduzida com a biblioteca `http-proxy` disponível no ambiente e gerou `TypeError`. Isso confirma o bloqueio de inicialização do código original, mas não valida a integração da versão revisada.

## Não executado aqui

Não há Docker/daemon disponível e o registro npm não pôde ser acessado pelo ambiente de execução. Portanto, **não foram executados**: instalação das dependências da aplicação, geração de lockfiles, `docker compose config`, build das imagens, inicialização dos serviços, cliente de demonstração ou bateria de 22 verificações HTTP. Scripts Windows não foram executados em Windows/PowerShell.

Não foram realizados testes de segurança, carga, disponibilidade ou implantação em produção. As imagens e dependências transitivas não foram auditadas. A aprovação dos testes unitários não substitui essas verificações.

## Aceite no computador da aula

Execute a sequência abaixo na pasta do projeto, após criar `.env`:

```bash
docker compose config --quiet
docker compose up --build --wait
docker compose ps
docker compose exec -T api-gateway node test-api.mjs
docker compose exec -T api-gateway node demo.mjs
```

Confirme o acesso pelo navegador em `http://localhost:8080/health` e `http://localhost:8080/ready`. A primeira confirma a porta publicada e a vida do gateway; a segunda consulta a saúde das dependências. A bateria HTTP confirma adicionalmente o fluxo de login e catálogo.

Registre no ambiente da aula: versões de Docker/Compose, resultado do build, resultado das 22 verificações, acesso pelo host e eventual falha controlada. Somente após essa execução trate a demonstração como validada naquele computador.
