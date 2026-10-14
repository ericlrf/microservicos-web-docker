# Microsserviços em Aplicações Web com Docker

Material para uma aula demonstrativa de **15 minutos** do curso **Técnico em Desenvolvimento de Sistemas**. O projeto utiliza Node.js, Express, JWT e Docker Compose, com gateway, autenticação e catálogo somente de leitura.

**Uso local e educacional. Não publicar na internet.** As contas e a chave do arquivo de exemplo são públicas. Leia `docs/VALIDACAO.md` para distinguir os testes executados daqueles ainda pendentes.

## 1. Comecar no computador da aula

Pré-requisitos: Docker em execução, com suporte a containers Linux, é o comando `docker compose` disponível. Usar uma versão atual com `up --wait`. A instalação de Node.js no host é opcional: o cliente da demonstração e os testes HTTP executam no container do gateway. O primeiro build requer acesso ao registro de imagens e ao npm; seu tempo depende do ambiente.

Extraia este pacote e abra o terminal **na pasta `microsservicos-demo`**, onde esta `docker-compose.yml`. Não existe um repositório GitHub publicado por este material.

### Linux/macOS (Bash)

```bash
cp .env.example .env
docker compose version
docker compose config --quiet
docker compose up --build --wait
bash scripts/test-all.sh
```

### Windows (PowerShell)

```powershell
Copy-Item .env.example .env
docker compose version
docker compose config --quiet
docker compose up --build --wait
.\scripts\test-windows.bat
```

A cópia do exemplo usa uma chave PÚBLICA apenas para a aula local. Não sobrescreva uma `.env` que já tenha configurado. Para gerar uma chave aleatória, quando houver Node.js no host e ainda não existir `.env`, use `node scripts/init-env.mjs` **em vez de copiar o exemplo**. O script não sobrescreve arquivos nem imprime o segredo.

O comando `config --quiet` valida a configuração sem imprimir os valores das variáveis. Evite compartilhar a saída de `docker compose config` sem `--quiet`, pois ela pode conter o segredo interpolado.

### Verificar o acesso pelo host

Abra `http://localhost:8080/health` no navegador. Em Bash, use `curl -i http://localhost:8080/health`; em PowerShell, `Invoke-RestMethod http://localhost:8080/health` ou `curl.exe -i http://localhost:8080/health`.

O cliente automático executado dentro do gateway testa as rotas HTTP e a comunicação com os serviços, **mas não testa o mapeamento de porta do host**. A verificação acima complementa o teste.

## 2. Demonstração de sete minutos

Construa as imagens e execute a bateria completa antes da aula. Durante a aula, não faca downloads, instalacoes nem edicoes extensas de código.

```bash
docker compose up --wait --no-build
docker compose ps
docker compose exec -T api-gateway node demo.mjs
docker compose logs --tail 15 catalog-service
```

`demo.mjs` mostra quatro etapas: saúde do gateway; catálogo sem token, com HTTP 401; login, com token parcialmente oculto; consulta autenticada da primeira página do catálogo, com HTTP 200. Ele verifica os códigos HTTP esperados e interrompe a execução em caso de falha. Os resultados precisam ser confirmados no seu ambiente.

Alternativas equivalentes: `bash scripts/demo.sh` ou `.\scripts\demo-windows.bat`. O roteiro cronometrado esta em `docs/roteiro-aula.md`.

## 3. Arquitetura e fronteiras

```text
Navegador / cliente HTTP
          |
          | 127.0.0.1:8080 (unica porta publicada)
          v
     api-gateway
        |     |
        |     +--> catalog-service:3001 /products
        |
        +--> auth-service:3002 /login e /verify
```

| Componente | Responsabilidade | Acesso |
|---|---|---|
| `api-gateway` | Encaminhar rotas; exigir Bearer; consultar a validação de JWT | Porta 8080 do host, apenas em loopback |
| `auth-service` | Validar credenciais simuladas; emitir e validar JWT | Rede do projeto, porta 3002 |
| `catalog-service` | Listar, paginar, filtrar e buscar produtos | Rede do projeto, porta 3001 |

O gateway **exige** autenticação. Quem verifica assinatura, algoritmo, emissor, audiência e expiração do JWT é o `auth-service`, consultado pelo gateway em cada chamada protegida. O catálogo não valida JWT e confia nesta fronteira didática; não deve ser exposto diretamente. Uma rede bridge não é uma VPN nem fornece criptografia para estas chamadas HTTP. [1][2]

A existencia de containers separados não garante autonomia de negocio, isolamento de falhas nem atualizacao sem interrupção. Este projeto demonstra separacao de responsabilidades e fluxo distribuido, não uma arquitetura de produção completa. [3]

### Reescrita de rotas

| No gateway | No serviço de destino |
|---|---|
| `POST /auth/login` | `POST /login` no Auth |
| `POST /auth/verify` | `POST /verify` no Auth |
| `GET /api/products?page=2&limit=2` | `GET /products?page=2&limit=2` no Catalog |
| `GET /api/products/1` | `GET /products/1` no Catalog |

A montagem de middleware em `/auth` e `/api` retira o prefixo de `req.url` durante o encaminhamento. O gateway não executa `express.json()` antes do proxy: o corpo original segue para o serviço, que faz o parsing. [4][5]

## 4. Endpoints e contas demonstrativas

| Metodo | Endpoint externo | Token | Resultado |
|---|---|---|---|
| GET | `/health` | Não | Vida do processo do gateway |
| GET | `/ready` | Não | Consulta a saúde de Auth e Catalog; 503 quando indisponiveis |
| POST | `/auth/login` | Não | JWT com validade de uma hora |
| POST | `/auth/verify` | No corpo JSON | Valido: 200; inválido ou ausente: 401 |
| GET | `/api/products` | Sim | Lista paginada |
| GET | `/api/products/:id` | Sim | Produto existente: 200; ausente: 404 |
| GET | `/api/products/category/:categoria` | Sim | Filtro e paginação |

Contas PÚBLICAS: `admin@demo.com` / `admin123` e `user@demo.com` / `user123`. Ambos os perfis podem ler o catálogo. O campo `role` é demonstrativo: **não há controle de autorizacao por papel** neste projeto. Os usuarios estão simulados em memoria; as senhas aparecem no código. Não há banco, CRUD completo, cadastro, persistencia, logout ou revogação.

Exemplo de login em Bash:

```bash
curl -i -X POST http://localhost:8080/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@demo.com","senha":"admin123"}'
```

Exemplo de fluxo no PowerShell, sem manipular JSON com `findstr`:

```powershell
$Base = 'http://localhost:8080'
$Body = @{email='admin@demo.com'; senha='admin123'} | ConvertTo-Json
$Login = Invoke-RestMethod -Method Post -Uri "$Base/auth/login" `
    -ContentType 'application/json' -Body $Body
$Headers = @{Authorization="Bearer $($Login.token)"}
Invoke-RestMethod -Uri "$Base/api/products?page=1&limit=2" -Headers $Headers
```

`page` aceita inteiros de 1 a 1.000.000; `limit`, de 1 a 100. `count` representa o total encontrado antes da paginação; `pagination.retornados` e `data.length` representam o número retornado. Valores como `page=0`, `limit=-1` e `id=1abc` retornam 400. Precos e estoques são dados ficticios, sem finalidade comercial.

## 5. Testes e evidencias

| Verificacao | Como executar | Escopo |
|---|---|---|
| 44 testes unitarios | `npm test` | Funcoes de configuração, credenciais e catálogo; sem dependências externas |
| Sintaxe dos arquivos JS | `npm run check` | Parsing; não executa Express/JWT/Docker |
| 22 verificações HTTP | `bash scripts/test-all.sh` ou `scripts\test-windows.bat` | JSON e status HTTP; serviços precisam estar em execução |
| Cliente HTTP no host | `node api-gateway/test-api.mjs http://localhost:8080` | Inclui acesso pela porta publicada; requer Node local |
| Fluxo de demonstração | `docker compose exec -T api-gateway node demo.mjs` | Saúde, acesso negado, login e catálogo |

Os clientes HTTP usam timeout e assercoes; uma falha termina com código diferente de zero. Não usam busca textual por `"success"`, que poderia aceitar `success:false`. A cobertura exata executada na preparação esta em `docs/VALIDACAO.md`.

## 6. Operacao e diagnostico

```bash
docker compose ps
docker compose logs --tail 30 api-gateway auth-service catalog-service
docker compose port api-gateway 8080
docker network inspect microsservicos-demo_micro-network
```

O nome da rede acima corresponde ao nome de projeto definido no arquivo. Ele muda se o projeto for iniciado com outro nome, por exemplo usando `-p`.

**Porta ocupada:** altere somente `GATEWAY_PORT=8081` na `.env`; recrie com `docker compose up --wait` e acesse `http://localhost:8081`. Internamente o gateway continua em 8080. Os scripts que executam dentro do gateway continuam usando a porta interna.

**Falha no build:** confirme acesso ao registro de imagens/npm e as mensagens do build. **Falha em `/ready`:** consulte o estado e os logs das dependências. **401 inesperado:** execute novo login e confira a chave do Auth. Uma mudanca da chave invalida JWTs assinados anteriormente.

`/health` não garante disponibilidade ponta a ponta. `/ready` consulta a saúde das dependências, mas também não substitui o teste de login e consulta. `depends_on: service_healthy` ordena a inicializacao; não resolve falhas posteriores. `restart: unless-stopped` não reinicia um container somente por ele receber o estado `unhealthy`. [6]

Para encerrar: `docker compose down`. Não existem volumes persistentes neste projeto, portanto `down -v` não acrescenta uma limpeza de dados de negocio.

## 7. Falha controlada e atividade posterior

Depois da aula, testar:

```bash
docker compose stop auth-service
# /health do gateway pode continuar 200; /ready deve retornar 503.
# Chamadas protegidas dependem do Auth e falham com 503 ou 504.
docker compose start auth-service
```

Execute somente no ambiente didático. Não inclua essa etapa na demonstração principal de sete minutos. Para observar o comportamento com um token válido já emitido, obtenha-o antes de parar o Auth; sem token o gateway responde 401 antes de consultar a dependência.

Atividade: altere o nome de um produto em `catalog-service/products.json` e atualize somente esse serviço:

```bash
docker compose up -d --build --no-deps catalog-service
```

Repita a consulta e explique o que mudou. Recriar um container pode interromper chamadas em andamento: não apresentar este comando como atualizacao sem downtime.

## 8. Slides e roteiro

`docs/apresentacao.pptx`: cinco slides com textos e formas editáveis e notas do apresentador. `docs/apresentacao.pdf`: cópia para exibir. `docs/slide-deck.md`: versão textual Marp, com o mesmo roteiro de cinco slides. Os arquivos não se sincronizam automaticamente; alteracoes em um formato precisam ser refletidas nos demais.

Marp opcional, em um host com Node.js e internet:

```bash
npx @marp-team/marp-cli docs/slide-deck.md --pdf -o docs/slides-marp.pdf
npx @marp-team/marp-cli docs/slide-deck.md -o docs/slides-marp.html
```

O HTML gerado é uma apresentacao Marp, não Reveal.js. O exportador PPTX padrão do Marp utiliza páginas pre-renderizadas. Existe `--pptx-editable` experimental, com requisitos adicionais; o PowerPoint fornecido neste pacote foi construido com elementos nativos, sem depender dessa conversao. [7]

## 9. Desenvolvimento local e dependências

As imagens usam `node:24-alpine`. Node.js 20 já esta fora de suporte; a linha 24 e LTS. [8] O patch de `node:24-alpine` pode mudar. Os `package.json` fixam Express 5.3.0, http-proxy 1.18.1 e jsonwebtoken 9.0.2, sem afirmar que todas são as ultimas versões.

**Não há `package-lock.json` nesta entrega.** Sem acesso ao npm neste ambiente, não foi possível resolver e congelar a arvore completa. Os Dockerfiles usam `npm install --omit=dev`; caso você gere e versione lockfiles com `npm install` em cada serviço, passam a usar `npm ci --omit=dev`. Dependências transitivas e a imagem base ainda precisam ser auditadas e, quando necessário, fixadas por digest. [9]

Para executar localmente, sem Docker, com Node.js 22 ou 24 instalado:

```bash
npm install --prefix api-gateway
npm install --prefix auth-service
npm install --prefix catalog-service
# Primeiro configure .env conforme a secao 1.
node --env-file=.env scripts/run-local.mjs
```

Em outro terminal: `node api-gateway/test-api.mjs http://localhost:8080`. O modo local abre também as portas dos serviços; use somente em computador de desenvolvimento, sem acesso externo. `Ctrl+C` encerra os processos iniciados pelo script.

## 10. Limites de segurança e escopo

Este é um material de ensino, não uma base pronta para produção. Uma implantação real exige, conforme seu contexto, armazenamento seguro de senhas, gestao de segredos, HTTPS, autorizacao, limitacao de tentativas, revogacao/renovacao de sessao, autenticação entre serviços, observabilidade, atualizacao de dependências e testes de segurança. A chave pública de exemplo e as contas conhecidas tornam inadequado expor o projeto.

Não há garantia de isolamento de falhas, alta disponibilidade, escalabilidade automática, consistencia eventual ou tolerancia a falhas somente porque se adotou Compose ou microsserviços. [3]

Referências numeradas e fontes oficiais: `docs/referencias.md`. Publicacao em GitHub e escolha de licenca ficam a cargo do responsável pelo material; nenhum repositório remoto foi criado.
