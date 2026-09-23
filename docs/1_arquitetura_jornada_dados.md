# 1. Documento de Arquitetura (TI) e Jornada dos Dados

## 1. Visão Geral da Solução
O **Explica+** é uma plataforma inovadora de simulação de vendas e treinamentos consultivos para técnicos e consultores da Claro. A solução utiliza Inteligência Artificial avançada (Google Gemini API) para avaliar interações audiovisuais em tempo real, fornecendo relatórios instantâneos de performance.

```
+--------------------------------------------------------------------------------+
|                                    CLIENTE (Web SPA)                           |
|  +--------------------+   +-------------------+   +-------------------------+  |
|  | Gravação de Vídeo  |-->| IndexedDB Local   |-->| Backup Google Drive API |  |
|  | (MediaRecorder API)|   | (MediaStorage)    |   | (Token de Acesso OAuth) |  |
|  +--------------------+   +-------------------+   +-------------------------+  |
+-------------------------------------+------------------------------------------+
                                      | (Envio via Proxy Seguro)
                                      v
+--------------------------------------------------------------------------------+
|                             SERVIDOR BACKEND (Express Proxy)                   |
|  +--------------------------------------------------------------------------+  |
|  | - Protege credenciais e roteamento (Sem persistência de mídia)           |  |
|  +---------------------------------------+----------------------------------+  |
+------------------------------------------v-------------------------------------+
                                           | (Requisição Criptografada)
                                           v
+--------------------------------------------------------------------------------+
|                        SERVIÇOS DE TERCEIROS (Google Gemini AI)                |
|  +--------------------------------------------------------------------------+  |
|  | - Análise Cognitiva do vídeo (Transient - Sem direito de treinamento)    |  |
|  +--------------------------------------------------------------------------+  |
+--------------------------------------------------------------------------------+
```

---

## 2. Componentes Arquiteturais

### 2.1. Frontend (SPA)
*   **Tecnologias:** React 18, Vite, Tailwind CSS, Lucide React (Ícones).
*   **Gravação de Mídia:** Executada 100% no navegador do usuário utilizando as APIs nativas do HTML5 (`MediaRecorder` e `getUserMedia`).
*   **Armazenamento de Mídia Local:** Implementado via **IndexedDB (MediaStorage API)**. Os vídeos gravados ficam guardados de forma isolada na sandbox de armazenamento local do navegador, minimizando os custos de infraestrutura de rede e eliminando riscos de vazamento em servidores centralizados.

### 2.2. Servidor Backend (Express)
*   **Função:** Atua exclusivamente como um proxy reverso seguro.
*   **Segurança de Chaves:** Protege a `GEMINI_API_KEY` do ambiente cliente. Todas as requisições cognitivas são enviadas pela rota controlada `/api/*`.
*   **Transitoriedade:** O backend **não possui base de dados persistente de arquivos** nem armazena os vídeos no disco do servidor. Os blocos de mídia são processados em memória (buffer/streaming) e enviados diretamente para o endpoint cognitivo da IA.

### 2.3. Integração Google Drive (Nuvem do Usuário)
*   **Protocolo:** Utiliza o fluxo de autenticação OAuth 2.0 via Firebase Authentication.
*   **Uso de Token:** O token de acesso concedido pelo usuário é mantido de forma efêmera na sessão (`sessionStorage`).
*   **Transferência Direta:** O próprio cliente extrai a mídia do IndexedDB e realiza o upload usando a API do Google Drive direto para uma pasta dedicada chamada `"Explica+ Simulador"`.

---

## 3. Jornada e Ciclo de Vida do Dado

1.  **Acesso e Identificação:** O usuário realiza login digitando suas credenciais de acesso (CPF e senha). Uma entrada de log leve é gravada localmente com os metadados do acesso (`Nome`, `Cidade/UF` e `Timestamp`).
2.  **Captura da Simulação:** O consultor inicia a atividade de treinamento, gravando o áudio e vídeo de sua simulação de vendas.
3.  **Gravação Local:** O vídeo resultante (`Blob`) é codificado e depositado diretamente no banco de dados local do navegador (**IndexedDB**), no sandbox controlado pelo browser.
4.  **Análise Cognitiva (Em Trânsito):**
    *   O cliente transfere as imagens chave e o áudio criptografados sob protocolo HTTPS para a API controladora do Explica+.
    *   A API encapsula os parâmetros com as chaves privadas de ambiente e despacha os dados ao modelo cognitivo **Gemini**.
    *   **Armazenamento zero:** A IA avalia os dados de forma transitória e envia de volta um JSON estruturado com a avaliação. Os dados recebidos pela inteligência artificial empresarial não são reutilizados ou persistidos fora do escopo de processamento da chamada.
5.  **Exibição dos Resultados:** O retorno estruturado é renderizado na tela (Pontos Fortes, Oportunidades e Notas) e vinculado à conta do usuário de forma local.
6.  **Backup e Salvamento Cloud (Opcional):**
    *   Caso deseje, o usuário vincula seu Google Drive.
    *   O software lê o blob do IndexedDB local e o envia diretamente para a própria pasta externa do usuário no Drive, sem passar por computadores e servidores intermediários.
