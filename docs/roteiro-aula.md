# Roteiro do instrutor - 15 minutos

Curso: Técnico em Desenvolvimento de Sistemas. Modalidade: videoconferencia. Slides principais: cinco. Os alunos acompanham sem instalar ferramentas.

## Antes da aula

Configure `.env`, construa as imagens, rode a bateria HTTP e verifique a porta do host. Amplie a fonte do terminal e da IDE; oculte notificacoes e arquivos com segredos. Mantenha `docker-compose.yml`, `api-gateway/server.js` e `catalog-service/products.json` abertos. Prepare sua própria gravacao/capturas da demonstração depois de testa-la; este pacote não inclui video gravado.

## Slide 1 | 00:00-01:00 | Contextualizacao

Pergunta: "Uma loja virtual muda o catálogo toda semana. Como atualizar essa parte sem alterar a autenticação?"

Apresente o objetivo: diferenciar as arquiteturas, identificar responsabilidades e interpretar uma execução com Compose. Esclareca que a aula e demonstrativa e que a instalação será atividade posterior. Não prometa independencia total apenas por haver três containers.

## Slide 2 | 01:00-04:00 | Conceitos

Compare unidades de implantação: no exemplo monolítico, Auth e Catalog fazem parte da mesma unidade; no exemplo distribuido, podem ser construidos e implantados separadamente. Um monólito pode ser bem organizado e ser a escolha adequada. [3]

Explique imagem como pacote de execução; container como instância de execução; Compose como definicao e gerenciamento da aplicação com varios containers. Não confundir microsservico com container, nem `up` com escalabilidade automática. [1][10]

Interacao: "Se temos dois containers, isso basta para provar que os serviços são independentes?" Resposta: não; interfaces, dados e dependências também importam.

## Slide 3 | 04:00-11:00 | Demonstração guiada

| Intervalo | Acao | O que explicar |
|---|---|---|
| 04:00-05:00 | Mostrar pastas e Compose | Três responsabilidades; porta publicada apenas no gateway; nomes dos serviços |
| 05:00-06:00 | `docker compose up --wait --no-build` e `docker compose ps` | Usar imagens já construidas; aguardar os probes de saúde |
| 06:00-07:00 | Abrir `/health` pelo host e mostrar tentativa sem token | Vida do gateway não e saúde global; acesso protegido exige token |
| 07:00-09:30 | `docker compose exec -T api-gateway node demo.mjs` | 401 sem token; login; JWT parcialmente oculto; catálogo com 200 |
| 09:30-11:00 | Consultar logs e localizar as rotas | `/auth/login` vira `/login`; `/api/products` vira `/products`; correlacionar `X-Request-ID` |

O script da demonstração imprime JSON e verifica o status; não precisa de `jq`. O script de 22 verificações e para preparação e exercício, não para ler todas as linhas durante a aula.

Mostre no código que o gateway usa `app.use('/auth', ...)` e `app.use('/api', ...)`, sem `express.json()` antes do proxy. O Auth faz o parsing e valida JWT; o catálogo não verifica o token. Não exiba a chave da `.env` nem o token completo. [2][4][5]

**Contingencia:** havendo falha que não seja resolvida rapidamente, use sua gravacao ou capturas previamente produzidas. Informe que é uma execução anterior. Elas substituem parte destes sete minutos; não são tempo extra. Sem gravacao, explique os arquivos e identifique os resultados como esperados, não observados.

## Slide 4 | 11:00-13:00 | Análise

Siga o fluxo: cliente -> gateway -> Auth (`/verify`) -> gateway -> Catalog (`/products`) -> cliente. O fluxo de login e separado: cliente -> gateway -> Auth (`/login`). O diagrama destaca uma chamada protegida, não uma chamada direta entre Auth e Catalog.

Beneficio ilustrado: modificar a implementacao do catálogo sem necessariamente alterar a autenticação, desde que se preserve o contrato. Custo concreto: cada consulta protegida depende de o Auth responder; se o Auth parar, o gateway pode estar vivo e, ainda assim, recusar temporariamente a operação. Não afirmar isolamento automático de falhas. [3]

Explique por que `/health` e `/ready` tem alcances diferentes. Não execute a falha controlada neste tempo; deixe-a para atividade posterior.

## Slide 5 | 13:00-15:00 | Avaliação e fechamento

Perguntas no chat, com respostas esperadas:

1. **Microsserviço e container são a mesma coisa?** Não. O primeiro é uma decisao de arquitetura; o segundo é uma forma de execução.
2. **Quem valida o JWT nesta demo?** Auth valida; gateway exige e consulta o Auth.
3. **O que ocorre se o Auth parar?** O gateway pode manter `/health` em 200, mas `/ready` retorna 503; chamadas protegidas com token dependem do Auth e falham com 503/504.

Avalie a justificativa, não apenas a resposta "sim/não". Corrija equívocos de forma breve. Oriente a atividade: executar o projeto, alterar um produto, atualizar somente o catálogo e explicar as responsabilidades. Download do repositório não e evidencia de aprendizagem.

Feche em 15 minutos. Dúvidas longas e expansoes (banco, mensageria, Kubernetes) ficam para outro encontro.

Fontes oficiais: `referencias.md`.
