---
marp: true
size: 16:9
theme: default
paginate: true
class: invert
style: |
  section { background: #0B1020; color: #F3F6FF; font-family: Arial, sans-serif; font-size: 28px; }
  h1, h2 { color: #AF9BFF; }
  strong { color: #6EE7D0; }
  code { font-size: 0.82em; }
---

# Microsserviços com Docker

**Como atualizar o catálogo sem alterar a autenticação?**

Técnico em Desenvolvimento de Sistemas | Aula online | **15 minutos**

Hoje: diferenciar arquiteturas, ler o fluxo HTTP e interpretar o Compose.

**00:00-01:00** | Os alunos acompanham sem instalar ferramentas.

<!--
Situacao-problema: uma loja muda seu catálogo frequentemente, mas a autenticação permanece igual.
Objetivo: compreender responsabilidades e interpretar uma execução guiada.
Não prometer independencia completa apenas porque existem containers separados.
-->

---

## Arquitetura não é contêiner

| Monólito | Microsserviços |
|---|---|
| Auth e Catalog na mesma unidade de implantação | Auth e Catalog com unidades separadas |
| Pode ser uma boa escolha | Exige lidar com comunicação e falhas |

**Imagem:** pacote. **Container:** execução. **Compose:** aplicação com varios containers.

Ter dois containers não prova independencia arquitetural.

**01:00-04:00** | A escolha depende do contexto.

<!--
Comparar unidades de implantação. Docker empacota e executa; microsserviços organizam responsabilidades.
Fontes: Docker Compose overview; Microsoft Microservices architecture style. Ver referências.md.
-->

---

## Da configuração ao teste

```bash
docker compose up --wait --no-build
docker compose ps
docker compose exec -T api-gateway node demo.mjs
docker compose logs --tail 15 catalog-service
```

**Respostas esperadas:** sem token -> 401; login -> 200; catálogo autenticado -> 200.

`/auth/login` -> `/login` | `/api/products` -> `/products`

**04:00-11:00** | Imagens e projeto preparados antes da aula.

<!--
Um minuto para mostrar arquivos; um para subir/verificar; um para saúde e acesso negado;
dois minutos e meio para login/catalogo; um minuto e meio para logs e reescrita.
O token é parcialmente oculto. Não apresentar resultados esperados como medidos antes de testar.
Fontes: Docker compose up; Express middleware; node-http-proxy. Ver referências.md.
-->

---

## O caminho de uma requisição

```text
Cliente -> Gateway -> Auth: /verify
              |
              +----> Catalog: /products
                     (somente apos JWT valido)
```

**Beneficio:** evoluir o catálogo separadamente, preservando interfaces.

**Custo:** se o Auth ficar indisponível, as chamadas protegidas dependentes dele falham.

**11:00-13:00** | Gateway exige autenticação; Auth valida JWT.

<!--
O diagrama representa consulta protegida. O login é outro fluxo: gateway -> Auth /login.
/health comprova vida do gateway; /ready verifica dependências. Nenhum substitui o teste funcional.
Fontes: node-jsonwebtoken; Microsoft Microservices architecture style; Docker startup order.
-->

---

## Você consegue explicar?

1. Microsserviço e container são a mesma coisa?
2. Quem valida o JWT nesta demonstração?
3. O que ocorre se o Auth parar?

**Depois da aula:** executar o projeto, alterar um produto e atualizar somente o catálogo.

Materiais: `README.md` | `docs/roteiro-aula.md` | `docs/referencias.md`

**13:00-15:00** | Responda no chat e justifique.

<!--
Respostas: não; Auth valida e gateway exige; gateway pode continuar vivo, mas as chamadas dependentes falham.
Avaliar explicacao dos alunos. Download do repositório não comprova aprendizagem.
Fechar em 15 minutos. Atividade posterior não faz parte do tempo da aula.
-->
