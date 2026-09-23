# 9. Função da Inteligência Artificial, Tomada de Decisão e Explicabilidade

Este documento detalha o papel da Inteligência Artificial (IA) no ecossistema do **Explica+**, detalhando a natureza de suas tarefas técnicas, os limites de sua autonomia decisória, a arquitetura de explicabilidade adotada e as garantias de transparência corporativa.

---

## 1. Tarefa Principal da IA (Core AI Capabilities)

A solução **Explica+** utiliza o modelo cognitivo multimodal **Google Gemini** para realizar um processamento cruzado que combina múltiplos propósitos de IA:

*   **Extração e Transcrição Vocabular (Extraction / Speech-to-Text):** Processamento do sinal sonoro da simulação para identificar expressões técnicas fundamentais (ex.: verbalização de termos cruciais da Claro como "Fibra Simétrica", "Upload", "Wi-Fi Plus", "Claro Box TV").
*   **Avaliação Qualitativa Estruturada (Scoring / Cognitive Evaluation):** Análise da cadência, clareza, empatia, tom de voz e postura demonstrada pelo colaborador através do conteúdo falado e da linguagem corporal.
*   **Geração de Recomendação Personalizada (Recommendation / Text Generation):** Geração dinâmica de planos de ação sob medida para as lacunas mapeadas no colaborador, indicando as frases mais recomendadas da marca Claro para as próximas simulações.

O modelo não atua como mero classificador binário ("Aprovado/Reprovado"). Ele atua como um **Coaching Cognitivo Virtual**, estimulando o auto-aperfeiçoamento e o engajamento contínuo do técnico de campo.

---

## 2. Decisões Automatizadas e Limites de Impacto Legal (Algorithmic Decision Making)

Uma das maiores preocupações de governança interna da CISO, do time juridico e de D&T (Desenvolvimento & Treinamento Claro) é a ocorrência de decisões puramente automatizadas que impactem o destino dos colaboradores. No Explica+, esta questão foi mitigada através de rigoroso desenho arquitetural:

### 2.1. Inexistência de Tomada de Decisão Autônoma Punitiva ou de Carreira
*   **Sem Impacto Sumário:** A IA do Explica+ **não toma nenhuma decisão automatizada com fins de demissão, suspensão corporativa ou rebaixamento funcional.**
*   **Fomento Educacional:** Todo o processamento gerado pelo aplicativo possui caráter **estritamente pedagógico, formativo e construtivo**. Ele funciona como um guia de autotreinamento para que o profissional avalie seu próprio desempenho em um ambiente livre de julgamentos punitivos.

### 2.2. Política de "Human-in-the-Loop" (Intervenção Humana)
*   **Auditoria de Promotores de Vendas e Gestores:** Embora a IA atribua notas para cada critério formativo (ex.: Empatia, Conhecimento Técnico, Argumentação Comercial), essas notas servem como insumo para os times de treinamento corporativo.
*   **Revisão Mediada:** Caso as métricas de simulação do colaborador sejam utilizadas como insumo secundário em avaliações de ciclos promocionais de carreira, **o gestor do colaborador terá obrigatoriamente que realizar a revisão humana e presencial**. A nota gerada pela IA nunca é o único vetor decisório.

---

## 3. Necessidade de Explicabilidade (Explainable AI - XAI)

Em conformidade estrita com o **Artigo 20 da Lei Geral de Proteção de Dados (LGPD)**, que prevê o direito do titular de solicitar a revisão de decisões tomadas unicamente com base em tratamento automatizado de seus dados, o Explica+ adota um modelo pautado em **Explicabilidade Rígida**:

```
[Simulação Gravada] ──> [Motor de IA] ──> [Notas Detalhadas] ──> [Evidências e Citações de Texto]
                                                                  └──> Explicabilidade imediata para o usuário
```

### 3.1. Como a IA Justifica a Nota Atribuída
Para cada nota ou score atribuído em uma competência, a IA gera um relatório estruturado em três camadas:

1.  **A Nota (Métrica Quantitativa):** Ex.: *Nota 7.5 em Argumentação da Fibra*.
2.  **A Citação Base (Evidência Factual):** O relatório identifica o pedaço exato da fala onde o técnico errou ou se destacou. (Ex.: *"Você explicou bem a velocidade do download, mas ao falar do upload utilizou a expressão 'velocidade de recepção que é menor', o que está tecnicamente equivocado para Claro Fibra Simétrica"*).
3.  **Proposta de Correção Direta (Plano de Ação):** O sistema oferece o texto correto da marca Claro que deveria ter sido empregado, fornecendo caminhos de aprendizado transparentes.

Deste modo, a inteligência artificial não atua de forma misteriosa ("caixa-preta"). O colaborador entende imediatamente as origens de sua avaliação, permitindo um aprendizado instantâneo e eliminando a sensação de subjetividade ou arbitrariedade.

---

## 4. Auditoria, Transparência e Feedback sobre Desvios

Toda interface gerada para o técnico (Dashboard e Recorder) e para o administrador (Painel de Gestão) fornece mecanismos de feedback transparente:

*   **Canal de Contestação Direto:** O colaborador pode iniciar uma contestação caso discorde da avaliação textual gerada pelo assistente cognitivo. A contestação aciona seu supervisor imediato de treinamento que visualiza a simulação arquivada na nuvem própria com auditoria 100% clara.
*   **Independência de Processamento:** As regras de negócio Claro (preços, planos de Banda Larga e portfólio Claro Box TV) são alimentadas de forma isolada do modelo cognitivo do Gemini, permitindo auditorias individuais rápidas sobre o banco de conhecimentos do app sem afetar a estabilidade do algoritmo central de inteligência artificial.
