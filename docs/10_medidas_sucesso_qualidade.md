# 10. Medidas de Sucesso, Qualidade e Limiares de Aceitação (KPIs)

Este documento estabelece o framework oficial de mensuração de qualidade e impacto de negócios para o ecossistema do **Explica+**, detalhando as métricas de negócio, os parâmetros de performance técnica e os limiares mínimos de validação necessários para a evolução do estágio piloto para produção em escala.

---

## 1. Métricas de Negócio (Business Impact KPIs)

O sucesso comercial e operacional do Explica+ é avaliado através do impacto prático no dia a dia técnico e na receita incremental da Claro, medidos por meio de um grupo piloto versus um grupo de controle equivalente:

| Métrica de Negócio | Descrição Técnica & Fórmula | Objetivo de Negócio Relacionado | Meta Alvo (Piloto) |
| :--- | :--- | :--- | :--- |
| **Taxa de Conversão de Upsell (Combo Multi / Adicionais)** | (Vendas fechadas em visitas técnicas / Total de visitas técnicas realizadas) × 100. | Elevar a conversão em telecomunicações residenciais (Claro Fibra e Box TV). | **+12%** de incremento vs. Grupo de Controle |
| **Redução de Rechamados Técnicas (FCR - First Contact Resolution)** | Número de clientes que solicitam nova visita técnica em até 30 dias para o mesmo endereço. | Otimizar a qualidade da explicação de uso dada pelo técnico ao cliente (evitando visitas recorrentes). | **-15%** de redução em visitas repetidas |
| **NPS Técnico e Atendimento de Campo** | Pesquisa transacional de satisfação enviada ao cliente após a conclusão da visita técnica. | Consolidar a postura de atendimento, respeito ao tempo do cliente e qualidade comunicativa. | **Manter NPS na Zona de Excelência (> 80 pontos)** |
| **Tempo de Rampa de Novos Técnicos (Time-to-Competence)** | Número médio de dias necessários para que um técnico recém-contratado atinja o score operacional padrão Claro. | Reduzir custos com treinamentos teóricos presenciais de longa duração e otimizar curvas de aprendizado. | **Redução de 30%** no tempo de onboarding |

---

## 2. Métricas Técnicas da Solução (Technical Performance KPIs)

Para garantir que o motor de Inteligência Artificial Google Gemini permaneça estritamente confiável, preciso e financeiramente sustentável, as seguintes telemetrias técnicas são analisadas ativamente:

### 2.1. Precisão Analítica e Concordância de Avaliação (UI/IA Core Accuracy)
*   **Acurácia de Transcrição (WER - Word Error Rate):** Mede a fidelidade textual da transcrição fonética das simulações, especialmente em relação ao jargão de produtos Claro. A meta técnica é manter o WER abaixo de **8%** para português falado.
*   **Correlação IA vs. Humano (Inter-Rater Reliability):** Coeficiente de concordância estatística entre as notas de conformidade geradas automaticamente pelo Gemini e as notas atribuídas por auditores de treinamento humanos de forma aleatória. O alvo é obter uma correlação de Pearson **r ≥ 0.88**.

### 2.2. Tempo de Resposta e Fluxo Operacional (End-to-End Latency)
*   **Latência de Geração de Feedback:** Mede o tempo decorrido desde o envio da mídia de simulação até a disponibilização do relatório cognitivo na tela do técnico.
    *   *Alvo Técnico:* Média **< 6 segundos** por simulação padrão de 1 minuto.
    *   *Percentil Crítico (P95):* Máximo **< 10 segundos** de latência.

### 2.3. Eficiência de Custos por Simulação (Cost-per-Interaction - CPI)
*   **Sustentabilidade Econômica:** Consumo agregado de Input/Output tokens da API Gemini por ciclo de treino do colaborador.
    *   *Teto Orçamentário Alvo:* Custo máximo de processamento cognitivo inferior a **R$ 0,08 por simulação completa**, viabilizando milhares de simulações autônomas diárias sem pressão financeira sobre o orçamento de OPEX de Treinamento.

---

## 3. Limiares de Aceitação para Virada de Chave (Go/No-Go Decision Criteria)

Para autorizar a expansão da ferramenta para circulação nacional da Claro, a fase piloto de 30 dias deve atender cumulativamente aos seguintes patamares mínimos de aceitação:

```
                  ┌──────────────────────────────────────────────┐
                  │                 Fase Piloto                  │
                  │   30 dias | 150 Técnicos em Campo de Teste   │
                  └──────────────────────┬───────────────────────┘
                                         ▼
            Critérios de Validação Acadêmica, Técnica e Comercial:
            ┌───────────────────────────────────────────────────┐
            │ [ ] Engajamento Ativo ≥ 4 Simul./Téc por Semana   │
            │ [ ] Acurácia de Avaliação IA vs Humano ≥ 90%      │
            │ [ ] NPS Interno do Técnico (Adesão ao App) ≥ 85%  │
            │ [ ] Incremento Real de Receita do Piloto ≥ 10%    │
            └──────────────────────┬───────────────────────┘
                                         │
                        Atendido todos os critérios?
                                         ├───► [SIM] ──► PRODUÇÃO EM ESCALA NACIONAL
                                         └───► [NÃO] ──► AJUSTES NO PROMPT / RETREINO IA
```

### 3.1. Engajamento Orgânico do Técnico de Campo
*   **Critério:** Mais de **80%** dos técnicos do grupo de teste piloto devem interagir de forma recorrente e espontânea com a ferramenta (média de no mínimo **4 simulações completadas por colaborador na semana**), comprovando a usabilidade prática e utilidade real em rotinas reais de trabalho.

### 3.2. NPS de Experiência Interna do Colaborador
*   **Critério:** Avaliação subjetiva do próprio técnico respondendo à pergunta *"O Explica+ me ajuda a vender mais Claro Fibra e me sentir mais confiante com o portfólio?"*. O índice de satisfação com a ferramenta deve se manter **ativo em ≥ 85% positivo**.

### 3.3. Margem de Estabilidade de Software e Nuvem
*   **Critério:** Confiabilidade do pipeline técnico. O índice de falhas de gravação, problemas em IndexedDB ou erros de chamada HTTP para o backend do Explica+ deve permanecer estável em **taxa de falha inferior a 0,5%** durante todo o período de amostragem.
