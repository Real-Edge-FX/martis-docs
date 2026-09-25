# Comparação, media ampliável e contacto — especificação

**Data:** 25 de setembro de 2026  
**Estado:** aprovado para planeamento  
**Repositório:** `martis-docs`  
**Branch:** `docs/getmartis-redesign-spec`

## Objetivo

Completar o redesign do getmartis.com nos pontos detectados durante a revisão local: tornar a comparação suficientemente rica para apoiar uma decisão, corrigir a posição inicial das páginas após navegação, permitir ampliar imagens reais do produto e acrescentar um canal de contacto funcional.

## 1. Comparação

### Página geral

`/compare` apresenta uma matriz editorial de Martis, Laravel Nova e Filament. A matriz cobre, no mínimo:

1. licença e modelo de custo;
2. tecnologia do frontend;
3. modelo de execução da interface;
4. arquitectura e fronteira com Laravel;
5. personalização visual;
6. extensibilidade;
7. autenticação e autorização;
8. ecossistema;
9. reutilização entre projectos de clientes;
10. perfil de equipa e cenário recomendado.

Cada célula deve explicar a implicação prática da diferença, evitando etiquetas vagas, pontuações inventadas ou declarações de vencedor universal. A coluna Martis mantém destaque visual, mas as alternativas são descritas de forma honesta.

Em desktop, a tabela tem cabeçalho fixo durante a leitura. Em ecrãs pequenos, a informação transforma-se em cartões por critério; não depende de uma tabela horizontal difícil de ler.

### Páginas específicas

`/compare/nova` e `/compare/filament` incluem:

- resumo de decisão;
- comparação lado a lado por temas;
- implicações para agências que entregam vários projectos;
- cenários em que Martis é a melhor escolha;
- cenários em que a alternativa pode ajustar-se melhor;
- perguntas frequentes relacionadas com migração, stack, licenciamento e manutenção.

Não são apresentados links para os sites de Laravel Nova ou Filament. A secção de metodologia explica que os dados são revistos periodicamente e mostra apenas a data de revisão. O link interno para comunicar uma correcção aponta para o formulário de contacto.

## 2. Posição inicial das rotas

Uma unidade global observa mudanças de `pathname`:

- numa navegação normal, desloca a janela para o topo;
- quando existe uma âncora válida, preserva o comportamento da âncora;
- a navegação de histórico continua previsível;
- a barra fixa nunca tapa o primeiro título da página.

O comportamento é coberto por testes de navegação, incluindo a reprodução observada ao abrir uma comparação depois de ter percorrido outra página.

## 3. Ampliação de imagens

As capturas reais do Martis passam a ser accionáveis e abrem num lightbox comum a todo o site.

O lightbox oferece:

- imagem ampliada sem recorte;
- legenda e contexto da imagem;
- botões anterior e seguinte quando existe uma galeria;
- fecho por botão, clique no fundo e tecla `Escape`;
- navegação por teclado;
- bloqueio do scroll da página enquanto está aberto;
- reposição do foco no elemento que o abriu;
- suporte de zoom adicional dentro da imagem;
- alternativa textual preservada para leitores de ecrã.

Em telemóvel, a imagem adapta-se ao viewport e os controlos permanecem acessíveis. O efeito não é aplicado a logótipos ou elementos meramente decorativos.

## 4. Contacto

É criada a rota `/contact`, adicionada à navegação adequada e aos CTAs de conversão das páginas `For Agencies` e `Compare`.

O formulário pede apenas:

- nome;
- email profissional;
- empresa, opcional;
- contexto do projecto;
- consentimento explícito para o envio dos dados.

As mensagens destinam-se a `lfmoura@gmail.com`. Como o site é estático, o endereço de entrega e o endpoint do serviço de formulários são configurados por variáveis de ambiente de build. A interface nunca apresenta o endereço como texto nem o inclui directamente nos componentes.

O envio tem estados de repouso, envio, sucesso e erro. Validação de cliente não substitui a validação do serviço. O formulário inclui campo-armadilha anti-spam, não guarda mensagens no browser e não adiciona trackers.

O serviço de formulários e a recepção no endereço final têm de ser activados e testados num ambiente de staging antes do deploy. Os testes automatizados não enviam mensagens reais.

## 5. Estrutura e dados

Os dados comparativos ficam num módulo tipado e separado da apresentação. Cada critério contém os três valores, uma explicação da implicação e uma categoria. As páginas específicas reutilizam os mesmos dados para impedir contradições entre a síntese e o detalhe.

Componentes previstos:

- `ScrollToTop` para navegação;
- `ComparisonMatrix` e `ComparisonCriterion` para comparação;
- `ImageLightbox` e contexto de galeria para media;
- `ContactForm` com adaptador de envio configurável.

## 6. Testes e validação

A implementação só fica pronta depois de:

- testes unitários dos dados comparativos e das rotas;
- teste de regressão para posição inicial após navegação;
- testes de teclado, foco e fecho do lightbox;
- testes de validação e estados do formulário com transporte simulado;
- `pnpm test`, `pnpm typecheck` e `pnpm build` aprovados;
- revisão visual a 390, 768, 1024 e 1440 píxeis;
- confirmação de ausência de scroll horizontal;
- confirmação de que nenhuma página liga para Nova ou Filament;
- teste manual do email apenas em staging e com autorização explícita antes do envio.

## Fora de âmbito deste bloco

- migração automática de projectos Nova ou Filament;
- chat em tempo real;
- CRM ou armazenamento próprio das mensagens;
- tracking comportamental de terceiros.

