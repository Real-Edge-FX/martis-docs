# Redesign do getmartis.com — especificação de design

**Data:** 24 de setembro de 2026

**Estado:** aprovado

**Repositório responsável:** `martis-docs`

**Release branch:** `release/getmartis-redesign-v2`

**Work branch:** `docs/getmartis-redesign-spec`

## 1. Resumo

O getmartis.com será reposicionado como o site de produto e documentação de uma fundação administrativa open source para agências que entregam vários projetos Laravel a clientes. O redesign deve aumentar instalações qualificadas ao tornar evidente, logo no primeiro ecrã, o valor económico e operacional do Martis: uma base repetível, extensível e sem uma camada comercial obrigatória.

A direção visual aprovada combina:

- o sistema principal **Product Cinema**, escuro, preciso e orientado ao produto;
- tipografia editorial para criar ritmo, autoridade e contraste;
- a mensagem explícita **“MIT, no paid tier”** como prova de posicionamento;
- demonstrações reais do Playground, código autêntico e comparações verificáveis;
- versões claras e funcionais, escura e clara, para a documentação.

O projeto mantém React, Vite, TypeScript, MDX e React Router. Acrescenta pré-renderização estática por rota, dados de release gerados, estatísticas do Packagist, produção automatizada de media e um pipeline de release em duas fases. O objetivo desta especificação é permitir que outro agente implemente o trabalho sem ter de reconstruir decisões de produto ou design.

## 2. Diagnóstico do estado atual

O site atual já contém uma base técnica funcional e documentação extensa, mas apresenta limitações que reduzem conversão e confiança:

- a narrativa é centrada em funcionalidades, sem identificar claramente o comprador ou o contexto de uso;
- o valor para agências — repetibilidade, margem, consistência e manutenção — não domina a página;
- a prova do produto é insuficiente: faltam percursos visuais, exemplos completos e media versionada;
- a comparação com alternativas conhecidas não é explícita nem sustentada por fontes;
- versão, total de testes, headline e outros dados editoriais são mantidos manualmente;
- o site é uma SPA, o que limita HTML inicial, indexação e partilha de rotas interiores;
- o deploy não garante que site, documentação, screenshots, estatísticas e release correspondem ao mesmo commit do pacote;
- o smoke test cobre poucas rotas e não valida coerência de versão ou metadados.

Os valores observados em 24 de setembro de 2026 — 190 downloads totais no Packagist, 5 estrelas no GitHub e versão `v1.39.0` — são referências do momento, não constantes a codificar. Todos estes valores devem vir de fontes geradas.

## 3. Objetivos e métricas

### Objetivo principal

Aumentar o número de instalações qualificadas do pacote, sobretudo por equipas Laravel que reutilizam uma fundação administrativa em vários projetos.

### Objetivos secundários

- posicionar o Martis como produto credível e tecnicamente maduro;
- explicar sem ambiguidade que é MIT e não tem plano pago;
- reduzir o tempo entre descoberta e primeiro `composer require`;
- tornar a documentação mais navegável, legível e pesquisável;
- permitir comparação informada com Nova e Filament;
- manter o site sincronizado com cada release do pacote.

### Métricas de sucesso

- cliques no CTA de instalação e cópias do comando;
- visitas de páginas de marketing para `/docs/installation`;
- instalações diárias, mensais e totais no Packagist;
- visitas e progressão nas páginas de comparação;
- utilização da pesquisa da documentação e taxa de resultados sem correspondência;
- Web Vitals e taxa de erro de assets/rotas;
- consistência automática entre versão apresentada, tag e SHA publicados.

As métricas de interação devem ser recolhidas de forma discreta e sem dados pessoais. A estatística pública do Packagist é informativa, não um substituto da medição de conversão.

## 4. Público, posicionamento e mensagem

### Público principal

Agências e equipas Laravel que entregam vários back offices, portais internos e aplicações administrativas a clientes. Normalmente precisam de começar depressa, preservar margem, manter consistência entre projetos e continuar a adaptar cada entrega sem ficar presas a uma abstração fechada.

### Públicos secundários

- equipas de produto Laravel que querem uma base administrativa própria;
- freelancers com projetos recorrentes;
- responsáveis técnicos a avaliar Nova, Filament ou uma solução interna.

### Posicionamento

> Martis is the open-source admin foundation Laravel agencies can ship again and again.

O Martis não deve ser apresentado como “mais um admin panel”. A categoria verbal é **admin foundation**: uma fundação reutilizável com opinião suficiente para acelerar a entrega e pontos de extensão suficientes para pertencer à equipa que a adota.

### Mensagens obrigatórias

- **The admin foundation your agency can ship again.**
- **MIT licensed. No paid tier.**
- Designed for repeatable client delivery.
- Built on Laravel and React, with extension points that remain under the team's control.

O tom é confiante, concreto e técnico. Evita superlativos vazios, medo, ataques a concorrentes e alegações não demonstráveis. A interface e todo o copy público são escritos em inglês.

## 5. Arquitetura de informação

### Rotas públicas

| Rota | Função |
| --- | --- |
| `/` | Narrativa principal, prova e conversão |
| `/product` | Sistema de produto e capacidades |
| `/for-agencies` | Benefícios, processo e economia para agências |
| `/compare` | Metodologia e visão geral comparativa |
| `/compare/nova` | Martis vs Laravel Nova |
| `/compare/filament` | Martis vs Filament |
| `/docs` | Entrada e navegação da documentação |
| `/docs/:section/:slug` | Conteúdo técnico pré-renderizado |
| `/changelog` | Histórico de releases e notas relevantes |

### Navegação global

O cabeçalho inclui Product, For Agencies, Compare, Docs e GitHub. O CTA primário é **Install Martis**; no contexto de documentação pode transformar-se em pesquisa ou ligação para a instalação. Em mobile, o menu mantém o CTA visível e usa um painel acessível com foco contido.

### Percurso de conversão

```text
Descoberta → reconhecimento do problema → prova real → comparação → documentação → instalação
```

Cada página de marketing deve permitir chegar à instalação em, no máximo, duas ações. A homepage também suporta um percurso rápido direto para documentação e um percurso de avaliação por comparação.

## 6. Homepage

### 6.1 Cabeçalho e hero

O hero ocupa aproximadamente um viewport em desktop, sem esconder a prova de produto abaixo da dobra. Conteúdo:

- eyebrow: `Open-source admin foundation for Laravel agencies`;
- headline: `The admin foundation your agency can ship again.`;
- apoio: uma frase que liga repetibilidade, controlo e entrega de projetos de cliente;
- CTA primário: `Install Martis`;
- CTA secundário: `See how it works`;
- selo persistente: `MIT licensed · No paid tier`;
- comando instalável com botão de cópia;
- frame real do produto, construído a partir do Playground e associado a uma versão.

O fundo é Night, com gradação cobalt/violet contida. A tipografia editorial aparece apenas na parte humana ou estratégica da mensagem, nunca no texto operacional.

### 6.2 Faixa de prova

Uma faixa compacta apresenta dados gerados: versão estável, total de testes, requisito de Laravel/PHP e downloads Packagist. Qualquer valor indisponível usa um estado neutro (`Data temporarily unavailable`) em vez de um número antigo disfarçado de atual.

### 6.3 Valor para agências

Três blocos explicam o impacto:

1. **Start from a proven baseline** — menos tempo a reconstruir autenticação, recursos, tabelas e padrões comuns.
2. **Keep delivery consistent** — o mesmo vocabulário e qualidade entre projetos e equipas.
3. **Own the outcome** — MIT, sem tier pago e com pontos de extensão controláveis.

Cada bloco inclui uma consequência operacional mensurável ou verificável, e não apenas uma lista de funcionalidades.

### 6.4 Código para interface

Um módulo lado a lado mostra uma configuração ou recurso real e o resultado correspondente no Playground. O exemplo é copiável, curto e compilável. No mobile, código e resultado tornam-se passos sequenciais, preservando contexto.

### 6.5 Capítulos do produto

Seis capítulos organizam o sistema:

- **Model** — resources, fields, relationships;
- **Operate** — tables, actions, filters, bulk workflows;
- **Secure** — authentication, authorization, policies;
- **Adapt** — themes, layouts, navigation, localization;
- **Extend** — hooks, custom fields and application code;
- **Ship** — installation, upgrades and repeatable delivery.

Cada capítulo tem uma demonstração visual, um excerto técnico e uma ligação profunda para Product ou Docs.

### 6.6 Comparação

Uma introdução honesta à comparação explica que a escolha depende do modelo de entrega, da preferência de stack e das necessidades de controlo. Mostra critérios resumidos e liga às páginas completas. Não usa medalhas, percentagens inventadas ou “winner badges”.

### 6.7 Produto real

Uma galeria editorial apresenta screenshots e clips curtos do Playground: listagem, filtros, criação/edição, relações, ações, permissões e tema. Cada elemento tem legenda orientada ao benefício, versão, alternativa textual e poster estático.

### 6.8 Profundidade técnica

Uma secção de confiança resume arquitetura, testes, compatibilidade e modelo open source, com ligações diretas para código, changelog e documentação. Logos ou testemunhos só entram quando existirem autorização e prova verificáveis.

### 6.9 CTA final

Repete o comando de instalação, reforça `MIT licensed · No paid tier` e oferece dois caminhos: começar a instalar ou avaliar a documentação.

## 7. Página Product

A página Product expande os seis capítulos sem se transformar numa matriz interminável de funcionalidades. Cada capítulo contém:

- resultado esperado;
- cenário de agência;
- interface real ou clip curto;
- exemplo de código;
- limitações ou pré-requisitos relevantes;
- ligações para documentação correspondente.

Uma navegação lateral ou sticky progress indica o capítulo atual em desktop; em mobile torna-se uma lista horizontal ou índice compacto. O último bloco explica o modelo de extensão e onde termina a responsabilidade do Martis.

## 8. Página For Agencies

Esta página traduz o produto para o processo de entrega:

- **Win the next project:** protótipo funcional mais cedo;
- **Build with a repeatable system:** menos decisões repetidas;
- **Hand over with confidence:** padrões consistentes e documentação pública;
- **Maintain across clients:** upgrades e correções centralizados;
- **Protect margin:** sem licença por projeto ou tier pago.

Inclui um diagrama simples do ciclo `baseline → customize → deliver → maintain → reuse`, exemplos concretos e uma checklist de adoção. Não promete poupanças numéricas sem dados reais. O CTA encaminha para um guia de avaliação e instalação.

## 9. Comparações

### Princípios editoriais

- comparar casos de uso, modelo de licença, stack, personalização, extensão e operação;
- usar apenas documentação oficial, pricing oficial e repositórios oficiais;
- indicar data de verificação em cada conjunto de alegações;
- explicar **quando escolher cada opção**;
- distinguir factos de inferências editoriais;
- disponibilizar `Report a correction` com ligação para um issue template;
- nunca fabricar limitações ou transformar ausência de informação em desvantagem.

### Estrutura das páginas

1. resumo neutro das duas opções;
2. “Choose Martis when…” e “Choose [Nova/Filament] when…”;
3. tabela acessível com critérios e notas expansíveis;
4. diferenças de workflow para agências;
5. metodologia, fontes e data;
6. CTA para experimentar o Martis.

### Modelo de dados

```ts
interface ComparisonClaim {
  id: string;
  criterion: string;
  product: 'martis' | 'nova' | 'filament';
  value: string;
  explanation: string;
  sourceUrl: string;
  sourceLabel: string;
  checkedAt: string;
}
```

Uma validação de CI falha quando falta fonte, a URL não é HTTPS, `checkedAt` é inválido ou a verificação ultrapassa 90 dias. Alterações significativas no produto comparado exigem revisão humana; a automatização não reescreve conclusões editoriais.

## 10. Documentação

A documentação usa a mesma identidade, mas privilegia densidade, leitura e orientação:

- tema claro e escuro, ambos de primeira classe;
- navegação lateral hierárquica com estado ativo;
- pesquisa acessível por teclado;
- índice local em páginas longas;
- breadcrumbs, anterior/seguinte e ligação para editar no GitHub;
- blocos de código com copy, linguagem e foco visível;
- admonitions semanticamente distintas;
- versão atual visível e aviso para documentação desatualizada quando aplicável;
- largura de leitura controlada, preservando espaço para exemplos largos.

A página inicial de Docs oferece percursos por intenção: Install, Build a resource, Add filters/actions, Customize, Secure e Upgrade. A pesquisa mantém índice estático versionado e uma página dedicada de resultados para URLs partilháveis.

## 11. Changelog

O changelog é gerado a partir de dados de release validados, com:

- versão, data e ligação para GitHub Release;
- categorias Added, Changed, Fixed e Breaking;
- instruções de upgrade quando necessárias;
- filtros por versão/categoria;
- permalink para cada release;
- destaque apenas para alterações com impacto no utilizador.

Não deve duplicar mecanicamente todos os commits. As notas de release continuam a ser a fonte editorial.

## 12. Sistema visual

### Paleta

| Token | Valor | Uso |
| --- | --- | --- |
| `night` | `#080A10` | fundo principal de marketing |
| `surface` | `#10131C` | cartões e painéis |
| `elevated` | `#171B27` | camadas elevadas |
| `line` | `#2B3245` | contornos e separadores |
| `primary` | `#F4F5FA` | texto principal escuro |
| `muted` | `#A5ADBD` | texto secundário |
| `cobalt` | `#7187FF` | ação e foco |
| `violet` | `#A674FF` | profundidade e acento |
| `proof-green` | `#56C98B` | prova/estado positivo |
| `editorial-paper` | `#F2F0E9` | fundo claro editorial/docs |
| `editorial-ink` | `#14151A` | texto sobre fundo claro |

Contrastes devem cumprir WCAG 2.2 AA. O verde não é usado como decoração generalizada; reserva-se para estados e provas. Gradientes cobalt/violet surgem apenas em momentos de hierarquia forte.

### Tipografia

- **Geist**: interface, navegação e corpo;
- **Instrument Serif**: acentos editoriais, frases estratégicas e números de impacto;
- **Geist Mono**: código, versões, dados e microcopy técnico.

Usar fontes locais ou autoalojadas, com subset e preload apenas para pesos críticos. Definir fallbacks métricos para limitar layout shift.

### Composição

- grelha máxima de 1280 px com margens fluidas;
- ritmo vertical generoso na homepage e compacto nos docs;
- cantos moderados, sem aparência de dashboard genérico;
- bordas finas e contraste por camadas em vez de sombras pesadas;
- ícones lineares consistentes; sem emojis como ícones de produto;
- screenshots integrados na composição, não dentro de mockups de dispositivos decorativos.

### Temas

Marketing usa o tema escuro como assinatura. Docs suporta dark/light conforme preferência do sistema e escolha persistida. Ambos partilham tokens semânticos; não existem duas bibliotecas de componentes paralelas.

## 13. Movimento e media

### Movimento

Animações servem leitura e causalidade:

- entradas entre 180 e 320 ms;
- transições de demonstração até 700 ms;
- easing consistente e transform/opacity sempre que possível;
- nada de glows em loop, cursor spotlight, parallax contínuo ou texto essencial dependente de scroll;
- `prefers-reduced-motion` remove movimento não essencial e apresenta o estado final.

### Screenshots

Os screenshots são produzidos a partir do Playground em estado determinístico, nos viewports:

- `1440 × 900`;
- `1024 × 768`;
- `390 × 844`.

O seed de demonstração não contém dados pessoais nem credenciais. Cada ficheiro é associado a um manifesto:

```ts
interface ProductMediaManifest {
  packageVersion: string;
  packageCommit: string;
  route: string;
  viewport: { width: number; height: number };
  theme: 'light' | 'dark';
  locale: string;
  capturedAt: string;
  checksum: string;
}
```

### Clips

Clips têm, por regra, até oito segundos, não exigem áudio, incluem poster e descrição/caption, carregam de forma lazy e têm alternativa estática. Em reduced motion, o poster substitui autoplay.

## 14. Arquitetura técnica

### Decisão

Manter React 18, Vite 6, TypeScript, Tailwind 4, MDX, React Router 6 e Motion. Acrescentar pré-renderização estática por rota e hidratação no cliente. Não migrar de framework neste projeto.

### Estrutura proposta

```text
src/
  components/
    site/
    marketing/
    compare/
    docs/
    changelog/
  data/
    generated/
    comparison/
  routes/
  styles/
  entry-client.tsx
  entry-server.tsx
scripts/
  generate-release-data.*
  fetch-packagist-stats.*
  validate-comparisons.*
  capture-product-media.*
  prerender.*
```

As rotas conhecidas são renderizadas para HTML no build. `entry-server.tsx` produz markup determinístico e `entry-client.tsx` usa `hydrateRoot`. Conteúdo dependente de browser só inicializa após hidratação. O resultado continua compatível com hosting estático e fallback controlado para rotas não encontradas.

Metadados por rota incluem title, description, canonical, Open Graph, Twitter card, JSON-LD apropriado e imagem social versionada. Sitemap e robots são gerados durante o build.

## 15. Dados gerados

### Manifesto de release

```ts
interface SiteReleaseManifest {
  version: string;
  packageCommit: string;
  docsCommit?: string;
  releaseHeadline: string;
  phpRequirement: string;
  laravelRequirement: string;
  pestTests: number;
  vitestTests: number;
  totalTests: number;
  generatedAt: string;
}
```

Este manifesto substitui constantes manuais de versão, testes e headline. É validado contra o `composer.json`, a tag candidata e o SHA do pacote.

### Estatísticas Packagist

```ts
interface PackagistStats {
  package: 'martis/martis';
  total: number;
  monthly: number;
  daily: number;
  fetchedAt: string;
  sourceUrl: string;
}
```

O build de release requer fetch bem-sucedido e dados com menos de 24 horas. Um workflow diário atualiza e publica estatísticas apenas quando os valores mudam. O browser nunca chama a API do Packagist em runtime. Falhas diárias preservam o último artefacto válido, registam o erro e não publicam zeros.

### Testes

Os totais são obtidos da execução real das suites do pacote, separados por Pest e Vitest. O pipeline não aceita um total introduzido manualmente. Se uma suite falhar ou o relatório não puder ser interpretado, a release é bloqueada.

## 16. Estados de erro e resiliência

- erro de pesquisa: mensagem clara, retry e navegação manual intacta;
- media ausente: poster/fallback com proporção reservada, sem quebrar layout;
- estatística indisponível: estado textual neutro e timestamp do último sucesso;
- rota desconhecida: página 404 pré-renderizada com pesquisa e ligações principais;
- JavaScript indisponível: conteúdo, navegação e instalação continuam legíveis no HTML;
- clipboard bloqueado: selecionar comando e apresentar instrução curta;
- fonte ou asset falhado: fallback local e sem texto invisível.

## 17. Performance, acessibilidade e responsividade

### Orçamentos

- LCP ≤ 2,5 s no percentil 75;
- CLS ≤ 0,1;
- INP ≤ 200 ms;
- nenhum erro de acessibilidade crítico em testes automatizados;
- JavaScript de marketing dividido por rota, sem carregar pesquisa/docs no hero;
- imagens responsivas AVIF/WebP com dimensões explícitas.

### Acessibilidade

Cumprir WCAG 2.2 AA: navegação por teclado, skip link, landmarks, hierarquia de headings, foco visível, nomes acessíveis, contraste, tabelas comparativas semanticamente corretas e anúncios apropriados para pesquisa/copy. Não depender apenas de cor ou movimento.

### Breakpoints de validação

Validar pelo menos em 375, 768, 1024 e 1440 px. Conteúdo e ordem semântica são iguais; layouts complexos refluem, não criam uma versão mobile editorialmente diferente.

## 18. Estratégia de testes

### Unitários

- parsing e validação de manifestos;
- formatação de versões, testes e downloads;
- regras de frescura das comparações;
- construção de rotas, canonical e metadados;
- estados de erro e fallbacks.

### Integração

- navegação, pesquisa, tema e copy-to-clipboard;
- renderização MDX e ligações internas;
- tabelas comparativas e disclosure mobile;
- hidratação sem warnings;
- geração de sitemap, search index e 404.

### End-to-end e visual

- percursos Home → Product/Compare → Docs → Install;
- navegação só por teclado;
- screenshots nos quatro breakpoints de validação;
- dark/light docs e reduced motion;
- comparação visual com tolerância definida para media dinâmica.

### Build e conteúdo

- `pnpm lint`, typecheck, testes e build;
- validação de links internos/externos;
- nenhuma alegação comparativa sem fonte válida;
- nenhuma rota pública sem HTML, title, description e canonical;
- nenhum segredo, host local ou caminho de máquina em `dist`.

## 19. Release e deploy

O processo é dividido para impedir que uma tag publique um site incompleto ou que o site anuncie uma versão ainda não lançada.

### Fase 1 — preparar e aprovar o site

1. executar testes completos do pacote no SHA candidato;
2. sincronizar a documentação do pacote para `martis-docs` e executar o leak sweep/compilação MDX existentes;
3. gerar o `SiteReleaseManifest` com versão, SHA, requisitos e totais de testes;
4. obter estatísticas atuais do Packagist;
5. construir/reseedar o Playground determinístico;
6. capturar screenshots/clips e respetivos manifestos;
7. validar frescura e fontes de comparação;
8. executar lint, typecheck, testes, prerender, auditorias e smoke local;
9. abrir e aprovar o PR do site/documentação;
10. fazer merge sem criar ainda a tag do pacote.

### Fase 2 — publicar a release

1. confirmar que package e docs estão limpos e nos commits aprovados;
2. confirmar que o manifesto contém exatamente a versão e SHA candidatos;
3. construir `dist` uma única vez e registar checksum;
4. criar a tag e GitHub Release do pacote;
5. publicar exatamente o `dist` validado, sem rebuild divergente;
6. executar smoke de produção;
7. marcar a execução como concluída apenas após todas as verificações.

O processo deve ser idempotente. Uma repetição com a mesma versão/SHA reutiliza ou verifica os mesmos artefactos; não cria tags duplicadas nem publica dados incompatíveis.

### Smoke de produção

Validar:

- `/`, `/product`, `/for-agencies`, `/compare`, `/compare/nova`, `/compare/filament`, `/docs`, uma rota MDX real, `/changelog` e 404;
- status, title, canonical, versão, SHA esperado e estatísticas;
- assets críticos, search index, sitemap e robots;
- ausência de referências a localhost e de respostas HTML para assets inexistentes.

### Atualização diária

Um workflow separado consulta o Packagist, valida o schema, atualiza o snapshot apenas se houver mudança, reconstrói o site e corre o mesmo smoke antes do deploy. Não altera versão, screenshots ou documentação. Se falhar, mantém a produção anterior e gera um alerta acionável.

### Garantia obrigatória

Toda a criação de tag futura passa por este processo. Não existe um caminho “rápido” de tag que ignore site, documentação, dados, media ou deploy. A proteção deve residir em workflows e validações versionadas, não apenas em convenção documental.

## 20. Segurança e privacidade

- workflows recebem apenas permissões mínimas e usam environments para segredos de deploy;
- dados de comparação e Packagist são tratados como input não confiável e validados;
- exemplos de código e MDX não executam conteúdo remoto arbitrário;
- screenshots são produzidos a partir de seed público, sem PII;
- analytics, se ativados, não usam cookies nem fingerprinting sem consentimento e documentação apropriados;
- dependências e artefactos de build são fixados/verificados conforme a política do repositório.

## 21. Fora de âmbito

- formulários de leads, CRM ou newsletter;
- contas, billing, marketplace ou licença comercial;
- demo pública autenticada e persistente;
- redesign da interface do próprio pacote Martis;
- migração para outro framework frontend;
- mudança de fornecedor de hosting;
- tradução integral do site de marketing;
- testemunhos, logos de clientes ou métricas de negócio sem prova e autorização.

## 22. Critérios de aceitação

O projeto está concluído quando:

1. todas as rotas definidas estão implementadas, pré-renderizadas e responsivas;
2. a homepage comunica agência, repetibilidade, MIT e ausência de tier pago no primeiro viewport;
3. Product e For Agencies usam prova real e ligações para documentação;
4. as comparações Nova e Filament têm fontes oficiais, datas e orientação equilibrada;
5. documentação dark/light, pesquisa, navegação e MDX funcionam sem regressões;
6. screenshots e clips vêm do Playground determinístico e têm manifesto de proveniência;
7. versão, testes, requisitos e downloads são gerados, não mantidos manualmente;
8. o build cumpre os orçamentos de performance e WCAG 2.2 AA definidos;
9. todos os testes unitários, de integração, E2E, visuais e de conteúdo passam;
10. tag, release, site, docs, media e dados são bloqueados até estarem coerentes com o mesmo SHA;
11. o deploy publica o mesmo `dist` validado e o smoke de produção passa;
12. a atualização diária de Packagist preserva o último estado válido em caso de falha.

## 23. Decisões aprovadas

- Product Cinema é o sistema visual principal.
- A tipografia editorial complementa a interface de produto.
- `MIT licensed · No paid tier` é uma mensagem central.
- Agências que entregam vários projetos a clientes são o público prioritário.
- Haverá comparação explícita com Laravel Nova e Filament.
- A arquitetura editorial inclui Home, Product, For Agencies, Compare, Docs e Changelog.
- A homepage usa `The admin foundation your agency can ship again.` como headline.
- Marketing é dark-first; documentação suporta dark/light.
- O stack React/Vite/TypeScript/MDX é mantido e recebe pré-renderização estática.
- Release e deploy usam duas fases e atualizam site, docs, dados e media antes de qualquer tag.
- O Packagist é atualizado também por um workflow diário independente.
