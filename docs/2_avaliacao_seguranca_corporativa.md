# 2. Avaliação e Recomendação de Segurança Corporativa

**Status:** APROVADO COM RECOMENDAÇÕES  
**Data da Avaliação:** 05 de Junho de 2026  
**Área Responsável:** Diretoria de Segurança Corporativa e Cibernética (Corporate Security)  
**ID do Projeto:** EXT-EXP-PLUS-2026  

---

## 1. Escopo Tecnológico Avaliado
A equipe de Segurança Cibernética realizou a análise de arquitetura, fluxo de controle e criptografia do aplicativo **Explica+**. O foco centrou-se na proteção de dados dos colaboradores e no trânsito de mídias audiovisuais (simulações gravadas), além do gerenciamento de tokens OAuth para o Google Drive.

---

## 2. Parecer e Diagnóstico de Riscos

### 2.1. Criptografia no Trânsito de Dados (Transport Layer Security)
*   **Diagnóstico:** Toda e qualquer API e requisição executada pelo software utiliza TLS 1.2+ por padrão (HTTPS forçado). A autenticação de chaves de IA (Gemini) e recursos de autenticação Firebase operam com payloads criptografados de ponta a ponta.
*   **Riscos Mitigados:** Ataques do tipo *Man-in-the-Middle (MitM)* ou interceptação passiva de tráfego de treinamento.

### 2.2. Armazenamento e Exposição de Vídeos (Isolamento de Mídia)
*   **Diagnóstico:** O sistema **não armazena vídeos centralmente** nas máquinas da plataforma. Os arquivos residem no **IndexedDB** local (navegador do usuário) ou sob a propriedade direta de conta na nuvem privada da pessoa no **Google Drive**.
*   **Parecer de Segurança:** Excelente prática de minimização de superfícies de ataque (*Minimal Attack Surface*). Elimina o risco de vazamento em massa de dados biométricos e audiovisuais de colaboradores.

### 2.3. Segurança de Credenciais e Segredos (Secrets Management)
*   **Diagnóstico:** As chaves de acesso a modelos cognitivos (`GEMINI_API_KEY`) foram transferidas inteiramente para fora do código do cliente, operando apenas do lado do servidor (Express Server-side context).
*   **Avaliação:** Em conformidade com as melhores práticas OWASP de proteção de segredos.

---

## 3. Recomendações e Plano de Ações (Mitigações)

Para manter o status de homologação ativo, o projeto deve seguir estritamente as recomendações descritas abaixo:

| ID | Recomendação Obrigatória | Status no Sistema | Prazo |
| :--- | :--- | :--- | :--- |
| **REC-01** | **Segregação de Tokens:** Proibir armazenamento definitivo de tokens OAuth do Google em cookies perenes ou no `localStorage`. Devem residir apenas na sessão atual (`sessionStorage`) com invalidação explícita no logout. | **CONCLUÍDO** | Imediato |
| **REC-02** | **Rotulagem de CPF:** Como a identificação utiliza CPF para login, implementar validação explícita de formato em nível de código (evitando lixo em bancos locais) e expurgar a exibição em relatórios de forma mascarada. | **CONCLUÍDO** | Imediato |
| **REC-03** | **Minimização de Escopo:** O aplicativo deve pedir somente o escopo de menor privilégio para a API do Google Drive (diretório exclusivo `"Explica+ Simulador"`). Evitar o uso do escopo de leitura e gravação amplo do Drive do usuário onde possível. | **CONCLUÍDO** | Em andamento |
| **REC-04** | **Tratamento de Exceções de Câmera/Microfone:** Quando o usuário negar as permissões nativas de dispositivo pelo iframe browser, o sistema deve apresentar mensagens instrutivas, sem revelar stack-traces de erro de sistema que possam dar pistas de infraestrutura. | **CONCLUÍDO** | Imediato |

---

## 4. Conclusão da Auditoria
Considerando o formato de arquitetura com residência preferencial no cliente (On-Device Storage) e as defesas aplicadas no proxy backend, a solução apresenta **baixo risco regulatório** e está **homologada** para operação segura na rede corporativa.
