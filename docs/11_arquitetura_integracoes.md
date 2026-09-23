# 11. Arquitetura Técnica, Hospedagem e Integrações de Sistemas

Este documento detalha o desenho de arquitetura do ecossistema do **Explica+**, mapeando como a solução se integra às plataformas corporativas existentes na Claro, onde a infraestrutura será executada e quais controles técnicos de segurança e rede serão adotados para conformação técnica com as áreas de TI e Segurança da Informação.

---

## 1. Desenho de Arquitetura da Solução

O **Explica+** é construído utilizando uma arquitetura full-stack moderna e desacoplada, priorizando baixíssima latência na ponta, escalabilidade elástica e segurança integral das chaves de API:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Dispositivo do Técnico                          │
│                                                                        │
│   ┌────────────────────┐            ┌──────────────────────────────┐   │
│   │   Browser Local    │ ◄──HTTPS──►│   Google Drive Corporativo   │   │
│   │ (Simulação e UI)   │            │   (Mídias e Vídeos do Colab) │   │
│   └─────────┬──────────┘            └──────────────────────────────┘   │
└─────────────┼──────────────────────────────────────────────────────────┘
              │ (HTTPS / REST API)
              ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Ambiente Cloud Seguro                           │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                     Container API Gateway                      │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │ (Roteamento Interno)               │
│                                   ▼                                    │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │             Back-End Server (Módulo de Integração)             │   │
│   │             • Validações de Sessão e Rotas de IA               │   │
│   └───────────────────────┬───────────────────────────────┬────────┘   │
│                           │ (GCP VPC Privada)             │            │
│                           ▼                               ▼            │
│                 ┌───────────────────┐           ┌──────────────────┐   │
│                 │   Gemini API Key  │           │   Claro SSO      │   │
│                 │ (Server-Side Safe)│           │ (Autenticação)   │   │
│                 └───────────────────┘           └──────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Sistemas Integrados (Enterprise Integrations)

Para maximizar o valor pedagógico e a usabilidade segura sem fricção, o Explica+ conecta-se nativamente a quatro pilares tecnológicos da Claro:

### 2.1. Autenticação Única Corporativa (Claro SSO / Keycloak LDAP)
*   **Finalidade:** Garantir que apenas técnicos e coordenadores do quadro de colaboradores ativos da Claro acessem o portal.
*   **Mecanismo Técnico:** Protocolo **OAuth 2.0 / OpenID Connect (OIDC)** integrado ao provedor de identidade oficial da operadora (Microsoft AD FS / Keycloak).
*   **Benefício:** Bloqueio instantâneo e automático do acesso em caso de desligamento contratual do colaborador, centralizando a gestão de credenciais nos sistemas oficiais de RH.

### 2.2. Repositórios Cloud do Colaborador (Google Workspace / Google Drive API)
*   **Finalidade:** Armazenar os arquivos de áudio/vídeo resultantes dos treinamentos práticos de forma privativa e segura.
*   **Mecanismo Técnico:** Autorização via Consentimento OAuth2 no escopo granular de arquivos criados pelo próprio aplicativo (`https://www.googleapis.com/auth/drive.file`).
*   **Benefício:** Evita custos massivos com servidores dedicados de armazenamento e armazena os dados sob a conta e controle de privacidade sob demanda de cada próprio titular.

### 2.3. Hub de Treinamento e Indicadores (LMS Corporativo Claro / xAPI)
*   **Finalidade:** Consolidar os relatórios analíticos de engajamento e as notas de simulação da IA nos históricos curriculares do técnico.
*   **Mecanismo Técnico:** Disparos síncronos de eventos via protocolo **xAPI (Experience API)** diretamente para o LRS (Learning Record Store) da Claro.
*   **Benefício:** Permite aos gestores de Desenvolvimento de Pessoas cruzar o nível de rampa das notas cognitivas do técnico com os números práticos de vendas no CRM de campo.

### 2.4. Portfólio de Ofertas (CMS / Base de Conhecimento Interna)
*   **Finalidade:** Manter os scripts recomendados da Claro, as regras comerciais dos combos, e os termos de Fibra Simétrica constantemente calibrados com as tabelas comerciais vigentes da operadora.
*   **Mecanismo Técnico:** Integração secundária com a API Restful do portal de ofertas internas, atualizando periodicamente os dicionários de palavras-chave analisados pela IA.

---

## 3. Ambiente de Hospedagem (Hosting Environment)

Em estrito alinhamento com os preceitos de soberania cibernética da Claro e conformação integral com a LGPD:

*   **Infraestrutura Cloud Dedicada:** O Explica+ é implantado em containers stateless seguros utilizando a infraestrutura do **Google Cloud Platform (GCP)** ou **Microsoft Azure** sob o tenant (assinatura corporativa gerenciada) da Claro.
*   **Região de Hospedagem:** Região metropolitana de São Paulo (**Brazil South**), assegurando uma latência de tráfego de dados inferior a 45ms e o respeito às diretrizes legais de armazenamento doméstico de dados nacionais.
*   **Arquitetura Baseada em Containers:** Orquestração dinâmica via Docker em instâncias automatizadas e auto-escaláveis, suportando picos de tráfego (ex.: início das simulações na rampa de novos contratados) sem degradações de performance ou de disponibilidade.

---

## 4. Controles, Restrições e Governança de Segurança (Security Constraints)

Para obter homologação integral do time de Tecnologia e CISO, as seguintes amarras lógicas são adotadas:

1.  **Criptografia Completa de Ponta a Ponta:** Todo tráfego de dados transita exclusivamente em canais criptografados via protocolo **HTTPS/TLS 1.3** ativo por padrão na CDN e canais internos de APIs.
2.  **Segurança das Chaves Cognitivas (Server-Side Proxy):** A chave de acesso à API do Google Gemini (`GEMINI_API_KEY`) **nunca** é exposta ou visível no código executado no navegador do usuário. Toda validação analítica passa por uma rota de gateway restrita controlada pelo backend do Explica+.
3.  **Processamento Volátil de Mídias (Stateless Processing):** As sessões de treinamento não mantém arquivos temporários em mídias físicas no backend. As mídias enviadas via requisição para extração são analisadas temporariamente na RAM e limpas imediatamente após o fechamento da chamada, eliminando vulnerabilidades de vazamento de discos.
4.  **CORS, WAF e Prevenção de Abuso:** Proteção das APIs contra injeções ou ataques de negação de serviço (DDoS) por meio de limites refinados de chamadas (Rate Limiting) e barreiras ativas de Web Application Firewall (WAF).
