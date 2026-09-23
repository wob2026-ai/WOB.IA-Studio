# 14. Cronograma de Implementação, Marcos e Estimativa de Orçamento

Este documento descreve o planejamento temporal do projeto **Explica+**, detalhando as fases de monitoramento da coorte de técnicos que iniciaram no Mês 05, e apresenta a estimativa orçamentária para a transição do ambiente de testes gratuito para a infraestrutura corporativa de escala na Claro.

---

## 1. Marcos de Desenvolvimento e Cronograma (Milestones)

O ciclo de vida do Explica+ foi desenhado para provar o valor de negócio de forma incremental, partindo de um grupo de teste crítico e expandindo conforme a melhoria das métricas de vendas consultivas.

```
 Mês 05 (Maio)             Junho                       Julho                       Agosto+
 ┌──────────────┐         ┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐
 │  Fase 1:     │         │  Fase 2:                 │ │  Fase 3:                 │ │  Fase 4:                 │
 │  PoC Focada  ├────────►│  Expansão do Piloto     ├─►│  Homologação e Governança├─►│  Produção e Escala     │
 │  (Cohorte 05)│         │  (Carousel & Feedbacks) │ │  (CISO/DPO/TI Segura)   │ │  (Nacional / Vertex AI) │
 └──────────────┘         └─────────────────────────┘ └─────────────────────────┘ └─────────────────────────┘
```

### 1.1. Detalhamento das Fases do Projeto

*   **Fase 1: PoC Direcionada (Mês 5 - Maio/2026) — *Concluída***
    *   **Foco da Coorte:** Seleção ativa de um grupo de técnicos de campo que registraram histórico de vendas consultivas baixo (venda de **apenas 1 ou nenhum produto** nos atendimentos residenciais anteriores).
    *   **Atividades:** Implantação do protótipo inicial com simulador de voz e vídeo (roleplay) calibrado com scripts básicos da Claro Fibra.
    *   **Infraestrutura:** Uso controlado e sem custo sob a interface e cotas gratuitas do **Google AI Studio (Free Tier)**.
    *   **Objetivo:** Avaliar a curva de receptividade dos técnicos e validar se ferramentas de autotreinamento de IA reduzem o receio de realizar ofertas durante as visitas técnicas.

*   **Fase 2: Expansão do Piloto & Gamificação (Junho/2026) — *Fase Atual***
    *   **Atividades:** Introdução do componente **QuickTipsCarousel** (Carrossel de Dicas Rápidas de Atendimento) para municiar o técnico com gatilhos rápidos e contornos de objeções logo antes da simulação prática.
    *   **Métricas de Controle:** Acompanhamento da evolução diária das notas cognitivas do grupo de teste (comparando a performance do técnico na simulação vs. sua taxa de fechamento real em campo).
    *   **Calibração:** Refinamento do dicionário fonético para incluir os principais termos comerciais de Claro Box TV de forma precisa.

*   **Fase 3: Homologação e Integração Corporativa (Julho/2026)**
    *   **Atividades:** Auditoria formal com a equipe de TI Corporativa, DPO e CyberSecurity para alinhar os termos de privacidade (DPIA/RIPD) e aprovação de rede.
    *   **Arquitetura:** Transição técnica do backend local/desenvolvimento para containers seguros em nuvem sob o tenant oficial da Claro (hospedagem em São Paulo).
    *   **SSO:** Integração síncrona com o portal de Single Sign-On (SSO Keycloak) oficial da operadora.

*   **Fase 4: Escala Nacional e Transição de Cobrança (Agosto/2026 em diante)**
    *   **Atividades:** Virada de chaves para o ambiente corporativo **Google Cloud Vertex AI**.
    *   **Escopo:** Liberação para todos os prestadores e técnicos próprios de campo da Claro, conectando os resultados das notas do Explica+ ao sistema integrado de metas e bônus operacionais do time de Desenvolvimento de Pessoas (D&T).

---

## 2. Estimativa de Custos e Orçamento (Budget)

Durante os primeiros meses das fases de validação da PoC e do Piloto, **o custo de processamento de IA é de R$ 0,00 (Zero)**, viabilizado por meio do modelo de testes do Google AI Studio. 

Caso o projeto obtenha aprovação dos stakeholders comerciais para escala corporativa nacional na Claro, estima-se a seguinte estrutura de despesas operacionais (OPEX):

### 2.1. Custos de Licenciamento e Consumo de IA (Nuvem Corporativa Vertex AI)
A transição para a licença enterprise da API do Google Gemini garante maiores taxas de requisições por minuto (RPM), SLAs de disponibilidade e privacidade de dados empresariais sem retreinos públicos.

| Item de Infraestrutura | Base de Cálculo de Consumo | Custo Unitário Estimado (GCP SP) | Custo Estimado Mensal (1.000 Técnicos) |
| :--- | :--- | :--- | :--- |
| **API Google Gemini 1.5 Flash (Vertex AI)** | Estimativa de 15.000 simulações mensais (média de 15 roplays/técnico por mês); tamanho médio de 300 mil tokens por ciclo consolidado de áudio, texto e vídeo. | ~R$ 0,07 por simulação completa (incluindo Context Caching ativo no Vertex AI) | **R$ 1.050,00** |
| **Hospedagem de Container (Google Cloud Run)** | Processamento síncrono do backend Express em instâncias leves com scale-to-zero (consumo apenas sob demanda ativa). | ~R$ 0,00001667 por segundo de vCPU/RAM ativo. | **R$ 290,00** |
| **Espaço de Armazenamento de Históricos** | Armazenamento seguro de logs e métricas de treinamento em banco de dados estruturado corporativo. | ~R$ 0,15 por GB armazenado (Durable Storage) | **R$ 60,00** |
| **Google Drive Corporativo (Workspace)** | Espaço para guardar as simulações em vídeo de forma segura. | Uso das contas de e-mail corporativo Claro já ativas dos técnicos. | **R$ 0,00** (Custo já incluído no contrato guarda da operadora) |
| **Total Estimado de Infraestrutura Cloud** | **-** | **-** | **R$ 1.400,00 / mês** |

---

## 3. Justificativa de Investimento e ROI (Retorno de Negócio)

*   **Prevenção de Abuso de Recursos:** Graças às diretivas de arquitetura do Explica+, as gravações residem na conta corporativa do próprio técnico e o processamento de mídias é totalmente stateless. Isso elimina despesas astronômicas com discos e servidores de mídia (que custariam mais de R$ 12.000,00/mês se centralizados).
*   **Investimento Unitário por Técnico:** O custo operacional mensal da solução é de apenas **R$ 1,40 por técnico ativo**. Essa métrica tem como premissa o dimensionamento de um contingente integrado de **1.000 colaboradores ativos** (total de R$ 1.400,00 de custo de nuvem dividido por 1.000 profissionais), cada um realizando em média 15 simulações mensais. Isso demonstra um ganho colossal de escala e excelente custo-benefício pedagógico.
*   **Comprovação de ROI:** Sabendo que o ticket médio de planos combo Claro Fibra + Box TV é de aproximadamente R$ 250,00/mês, se apenas **6 técnicos** do grupo que antes vendia zero ou um produto passarem a fechar uma nova venda recorrente mensal cada em virtude dos treinos no Explica+, **o projeto se autofinancia completamente no primeiro mês**. Toda e qualquer conversão extra além desse ponto se traduz em lucro bruto incremental direto para a operadora.
