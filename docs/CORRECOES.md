# Revisao do material fornecido

| Ponto do original | Alteracao nesta versão |
|---|---|
| Fabrica de proxy chamada a partir de uma instância | `require('http-proxy')` preserva o módulo; cada proxy e criado pela fabrica |
| Prefixos externos chegavam ao backend | Montagem em `/auth` e `/api` remove o prefixo durante o encaminhamento |
| Parsing do JSON no gateway antes do proxy | Corpo preservado em stream; parsing somente no Auth |
| Verificacao JWT sem restricao explicita de emissor/audiencia | Assinatura, HS256, emissor, audiência, expiração e formato das claims verificados |
| Suposta prevencao de timing attack com `setTimeout` vazio | Trecho removido; nenhuma promessa de proteção desse tipo |
| Logout dava impressao de revogação | Endpoint removido; limitacao documentada |
| `data` devolvia todos os produtos mesmo com paginação | Resposta contém somente a página solicitada |
| `parseInt('1abc')` aceitava parte do parametro | Validação estrita de inteiros e limites |
| Testes via `grep`/`findstr` com possiveis falsos positivos | Cliente Node com JSON, status HTTP, timeout e falha com código não zero |
| Windows guardava JSON inteiro como token | Scripts Windows chamam o mesmo cliente estruturado |
| Comando `cp` dentro de `.env.example` | Arquivo de ambiente contém apenas comentarios e pares chave/valor |
| Variavel `GATEWAY_PORT` sem efeito no Compose | Variavel aplicada a porta publicada; porta interna continua 8080 |
| Docker Compose legado e campo `version` | Comando `docker compose`, sem `version` obsoleto |
| `container_name` e rede com nome global | Identificacao administrada pelo projeto Compose |
| Imagem Node.js 20 | Imagem da linha LTS 24; atualizacao de patch depende do registro |
| `/health` anunciado como status geral | Vida do gateway separada de `/ready` e do teste funcional |
| Catálogo anunciado como CRUD | Escopo documentado como leitura, filtro e paginação |
| Falhas contidas e ausencia de downtime apresentadas como garantias | Beneficios condicionais e dependências explicitas |
| Consistencia eventual apresentada como inevitavel | Generalizacao removida: depende do desenho de dados |
| Limite fixo de tamanho de equipe para decidir arquitetura | Regra arbitraria removida; avaliar complexidade e necessidades |
| Marp anunciado como Reveal.js e PPTX editável por padrão | Formatos distinguidos; entrega PPTX com elementos nativos |
| Muitos slides para uma aula de 15 minutos | Cinco slides principais, notas cronometradas e leitura complementar |

Não há lockfiles npm nem evidencia de build Docker neste ambiente. Consulte `VALIDACAO.md`; testes unitarios não certificam integracao nem segurança.
