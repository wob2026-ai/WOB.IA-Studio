# 4. Especificação Funcional do Aplicativo (Explica+)

## 1. Contexto e Objetivo de Negócio
O app **Explica+** é uma ferramenta interativa desenvolvida para capacitar, nivelar e testar técnicas de venda e postura dos consultores (técnicos e comerciais) da Claro. O principal gargalo operacional identificado foi a dificuldade de explicar ofertas complexas aos clientes de forma dinâmica, transparente e com clareza na linguagem técnica.

A plataforma automatiza a avaliação dessas competências profissionais usando a câmera e o microfone do próprio colaborador integrados a uma camada cognitiva de Inteligência Artificial, gerando notas e pontos a melhorar instantaneamente, dispensando auditorias manuais demoradas.

---

## 2. Personas e Perfis de Acesso

1.  **Consultor Técnico (Tech):** Pratica e simula cenários de resolução de dúvidas técnicas com foco em clareza, empatia e transparência de termos.
2.  **Consultor Comercial (Commercial):** Pratica rotinas de contorno de objeções, vendas adicionais (*Upselling*) e alinhamento de ofertas promocionais.
3.  **Gestor Regional / Administrador (Admin/Superadmin):** Monitora o volume de treinamentos da rede, avalia a evolução de performance por região, administra usuários, extrai inteligência de dados (CSV) e confere o status de compliance corporativo.

---

## 3. Jornadas Principais e Funcionalidades Centrais

### 3.1. Autenticação e Verificação de Acesso
*   **Acesso por Credenciais Locais:** Identificação segura através de login textual e validador nativo de formato de CPF para prevenção de erros.
*   **Mecanismo de Sessão:** Controle persistente do estado de login guardado localmente e geração detalhada dos logs de acesso com geolocalização simulada (Cidade/UF).

### 3.2. Simulador Consultivo (Treinamento com Vídeo)
O núcleo do aplicativo permite ao usuário simular cenários de atendimento ao consumidor:
*   **Seleção de Cenários Realistas:** O usuário escolhe um cenário predefinido correspondente à rotas comuns de atrito com clientes (exemplos: Claro Box TV, Instabilidade de Banda Larga, Reclamação de Fatura, Venda de Planos Fibra).
*   **Modos de Gravação:**
    1.  *Modo Conhecimento Livre (Dúvida do Cliente):* Uma pergunta aberta é apresentada e o colaborador deve respondê-la de cabeça, demonstrando o que sabe sobre os produtos Claro espontaneamente.
    2.  *Modo Com Roteiro (Scripted):* Com ajuda de uma colinha (roteiro de vendas), o usuário grava uma segunda explicação para melhorar e consolidar o aprendizado, focando nas etapas ideais de vendas.
*   **Gravador Inteligente (Recorder Client-Side):**
    *   Exibição em vídeo da câmera em tempo real.
    *   Medidor visual ativo sobre a atividade sonora (decibéis).
    *   Armazenamento em banco IndexedDB local de mídias por ID.

### 3.3. Avaliação Cognitiva por IA (Gemini Client-Proxy)
*   **Processamento da Performance:** A IA julga aspectos verbais, contextuais, tom de voz e transparência sobre cláusulas do plano.
*   **Relatório Detalhado:** Saída estruturada dividida em:
    *   *Nota geral (0.0 a 10.0).*
    *   *Pontos Fortes:* Destaque positivo da clareza e empatia.
    *   *Oportunidades de Melhoria:* Correção técnica ou de entonação.
    *   *Sugestão Prática:* Frase modificada sugerida para as próximas ligações.
    *   *Transcrição do Áudio:* Registro literal do conteúdo da fala.

### 3.4. Gestão e Controle Administrativo (Admin Console)
*   **Painel Geográfico:** Filtros de acompanhamento de notas totais, distribuição percentual em charts de barra e listagem de auditoria por UF/Município.
*   **Controle de Equipes:** Criação, edição e exclusão de contas do sistema Claro diretamente, incluindo o cadastro integrado de cidades via consumo dinâmico da API de Localidades do IBGE.
*   **Extração de Indicadores:** Exportação robusta de todas as notas do banco central para arquivos de dados formato CSV.

### 3.5. Integração e Backup em Nuvem Pública (Google Drive)
*   Página de visualização de resultados com botão integrado para despacho de mídias para a conta pessoal do colaborador no Google Drive, salvando em pasta nomeada `"Explica+ Simulador"`.
*   Painel de exibição e controle com exclusão definitiva de mídias armazenadas diretamente no Google Drive do profissional.
