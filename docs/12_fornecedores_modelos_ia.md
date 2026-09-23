# 12. Fornecedores, Modelos de IA e Homologação Corporativa

Este documento apresenta a composição da stack tecnológica de Inteligência Artificial proposta para o **Explica+**, detalhando os fornecedores de tecnologia de ponta, os modelos matemáticos selecionados, suas justificativas e o status de homologação perante o catálogo de tecnologias corporativo da Claro/América Móvil.

---

## 1. Modelos e Serviços de IA Propostos (AI Stack)

O desenho técnico do Explica+ adota um modelo híbrido e otimizado, explorando a vanguarda comercial de IA Generativa e Multimodalidade, estruturada nos seguintes fornecedores de nuvem pública:

### 1.1. Motor Cognitivo Principal: Google Gemini (Vertex AI Enterprise)
*   **Modelo de Referência:** `gemini-1.5-flash` (com opção de fallback ou upgrade transparente para `gemini-1.5-pro` ou os mais novos do portfólio `gemini-2.0`).
*   **Justificativa Técnica:**
    *   **Janela de Contexto Multimodal:** Capacidade nativa para processar simultaneamente textos (scripts), áudio (voz do técnico) e vídeo (postura do técnico) na mesma chamada de API, sem a necessidade de fragmentação de pipelines.
    *   **Custo-Eficiência Extremo:** O Gemini Flash possui um custo de processamento extremamente agressivo (inferior a R$ 0,08 por ciclo de treino de 1 minuto), permitindo escala massiva para milhares de técnicos sem estourar o orçamento operacional (OPEX) corporativo.
    *   **Suporte Excepcional a Português:** Robustez analítica na identificação de dialetos e sotaques regionais do Brasil, crucial para a representatividade geográfica das equipes de campo Claro.

### 1.2. Processamento Fonético Adicional (Speech-to-Text - STT)
*   **Modelo de Referência:** `Google Cloud Speech-to-Text (V2)` ou a própria capacidade nativa de áudio da API multimodal do Gemini.
*   **Justificativa Técnica:** Elevada imunidade a ruídos de ambientes residenciais ou de escritórios e taxa de erro de palavra (WER) inferior a 8% utilizando termos técnicos Claro parametrizados.

### 1.3. Alternativa de Retaguarda: Azure OpenAI (GPT-4o)
*   **Finalidade:** Funciona como arquitetura de contingência ativa (High Availability Fallback) via APIs de Chat Completion tradicionais da Microsoft Azure.

---

## 2. Status de Homologação Corporativa (Compliance & Catalog)

A governança cibernética de grandes grupos de Telecom exige o alinhamento das tecnologias propostas com os contratos guarda globais:

| Provedor / Serviço | Modelo Utilizado | Status de Homologação no Portfólio Claro | Diretriz de Uso |
| :--- | :--- | :--- | :--- |
| **Google Cloud Platform (GCP)** | Vertex AI / Gemini API | **HOMOLOGADO EM CONTRATO GUARDA** | Canal preferencial de implantação. A infraestrutura de desenvolvimento e teste utiliza o tenant central corporativo da operadora no Google Cloud. |
| **Microsoft Azure** | Azure OpenAI / GPT-4o | **HOMOLOGADO EM CONTRATO GUARDA** | Arquitetura de fallback estruturada. Totalmente compatível com os preceitos de privacidade de dados empresariais do grupo. |
| **OpenAI Public API** | ChatGPT / API Direct | **NÃO HOMOLOGADO / VETADO** | Proibido o uso de chaves públicas ou ferramentas não correlatas de nuvem para trânsito de qualquer material, devido aos riscos de uso de dados para retreinos públicos. |
| **Open Source (Borda)** | Whisper local (ONNX) | **EM ANÁLISE DE SEGURANÇA** | Eventualmente utilizado em testes isolados para transcrever conversações direto no browser do colaborador, sem tráfego de saída. |

---

## 3. Garantias de Segurança de Dados dos Modelos Homologados (Data Privacy Agreements)

Todas as requisições geradas pelo Explica+ para os modelos comerciais de IA (via Vertex AI ou Azure OpenAI) estão resguardadas sob os termos específicos de confidencialidade e privacidade de dados corporativos (Enterprise Privacy Terms):

1.  **Garantia de Não-Retreino (Zero Data Training Policy):** Nenhuma informação transacionada nas APIs (gravações de voz, transcrições textuais das conversas e notas obtidas pelos técnicos) é utilizada pelo Google ou pela Microsoft para o retreino ou aprimoramento de seus modelos de IA públicos. Os dados pertencem única e exclusivamente à Claro.
2.  **Isolamento de Tenant (Data Isolation):** O processamento de IA roda sob limites lógicos isolados de rede corporativa da operadora (VPC e chaves gerenciadas de API), blindando as informações contra vazamentos horizontais.
3.  **Auditoria sob Demanda (Auditability):** Registros detalhados de tráfego de rede e consumo de tokens são mantidos na nuvem própria com histórico auditável de 90 dias, conferindo plena rastreabilidade para investigações de Security Operations Center (SOC).

---

## 4. Próxima Etapa do Roteiro de Homologação técnica (Next Steps)

Para a expansão do projeto do estágio piloto para produção ampliada, os seguintes ritos de governança corporativa serão executados em conjunto com o DPO e o time de Governança de TI da Claro:

1.  **Validação formal junto ao Comitê de IA (IA Governance Board):** Apresentação do caso de uso e comprovação do isolamento técnico da ferramenta, ressaltando que o aplicativo atua unicamente com perfis simulados (roleplay), sem acessar cadastro de clientes reais da empresa.
2.  **Emissão do Documento de Impacto à Proteção de Dados (DIPD):** Documentação consolidando as medidas de minimização adotadas (vídeos salvos somente no Google Drive do próprio usuário) e confirmando que o uso de voz/imagem do colaborador é pautado sob termos formais de educação e treinamento.
3.  **Cadastro Técnico no CMDB (Configuration Management Database):** Registro do sistema Explica+ na malha integrada de ativos de TI corporativos para contagem de chamados e conformidade técnica sob o catálogo corporativo oficial da operadora.
