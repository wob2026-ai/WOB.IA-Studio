import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Helper to get Gemini Client safely with BYOK (Bring Your Own Key) support
const getGeminiClient = (customApiKey?: string) => {
  const apiKey = (customApiKey && typeof customApiKey === 'string' && customApiKey.trim().length > 5)
    ? customApiKey.trim()
    : (process.env.GEMINI_API_KEY || process.env.API_KEY);
  if (!apiKey) {
    console.warn("AVISO: GEMINI_API_KEY não encontrada no ambiente e nenhuma chave personalizada fornecida. Usando modo de contingência offline.");
    return null;
  }
  return new GoogleGenAI({ 
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
};

// Helper function to retry an async operation with exponential backoff for temporary errors (like 503 / 429)
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const status = error.status || (error.error && error.error.code) || error.code;
    const errorMsg = String(error.message || "").toLowerCase();
    
    const isTemporary = 
      status === 503 || 
      status === 429 || 
      status === 500 ||
      errorMsg.includes("503") || 
      errorMsg.includes("429") || 
      errorMsg.includes("temporary") || 
      errorMsg.includes("demand") || 
      errorMsg.includes("unavailable") || 
      errorMsg.includes("overloaded");

    if (retries > 0 && isTemporary) {
      console.warn(`[Gemini API] Falha temporária (${status || 'UNKNOWN'}). Tentando novamente em ${delay}ms... (${retries} tentativas restantes)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

// Helper to normalize and map legacy/deprecated models to modern ones to avoid 404s
function getValidModelName(modelName: string): string {
  const name = String(modelName || "").toLowerCase().trim();
  if (
    name.includes("1.5") || 
    name.includes("2.0") || 
    name.includes("2.5") ||
    name.includes("3.6")
  ) {
    return "gemini-3.6-flash";
  }
  if (name.includes("3.5")) {
    return "gemini-3.5-flash";
  }
  if (name.includes("3.8")) {
    return "gemini-3.8-flash";
  }
  if (name.includes("latest") || name === "gemini-flash") {
    return "gemini-3.6-flash";
  }
  return modelName || "gemini-3.6-flash";
}

// Helper to execute model calls with a fallback chain
async function generateWithModelFallback(
  ai: any,
  primaryModel: string,
  contents: any,
  config: any
): Promise<any> {
  const normalizedPrimary = getValidModelName(primaryModel);
  const models = [
    normalizedPrimary,
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3.8-flash"
  ];
  const uniqueModels = Array.from(new Set(models.filter(Boolean)));
  
  let lastError: any = null;
  for (let i = 0; i < uniqueModels.length; i++) {
    const currentModel = uniqueModels[i];
    try {
      console.log(`[Gemini API] Tentando gerar conteúdo com o modelo: ${currentModel}`);
      const response = await callWithRetry(() => ai.models.generateContent({
        model: currentModel,
        contents,
        config
      }), 2, 800);
      return response;
    } catch (err: any) {
      console.warn(`[Gemini API] Falha com o modelo ${currentModel}:`, err.message || err);
      lastError = err;
      if (i < uniqueModels.length - 1) {
        console.log(`[Gemini API] Iniciando fallback para o próximo modelo...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  throw lastError;
}

// Empresa SaaS Claro Fibra Contexto de Base de Conhecimento
const CLARO_COMPANY_CONTEXT = `
A Claro Fibra é líder em internet de banda larga de ultravelocidade por fibra óptica.
Pontos técnicos essenciais:
1. TAXA DE UPLOAD: O upload da Claro Fibra é de 50% da taxa de download contratada (ex: se contratar 500 Mega, terá 250 Mega de upload). Isso é o maior diferencial contra concorrentes genéricos e é essencial para estabilidade em videoconferências (home office), lives e jogos online.
2. ESTABILIDADE: A fibra óptica tem baixa latência (ping baixo) e não sofre interferência eletromagnética, ao contrário de redes de cobre ou rádio tradicionais.
3. EQUIPAMENTOS: Roteador Wi-Fi de alta performance incluso em todos os planos (Wi-Fi 6 disponível em planos premium).
4. ATENDIMENTO: Suporte técnico rápido e SLA de instalação em até 48 horas.
`;

// --- CONTINGÊNCIA LOCAL (FALLBACK OFFLINE) ---
const handleOfflineChat = (message: string, difficulty: string, character: string): string => {
  const cleanMsg = message.toLowerCase();
  
  // Respostas baseadas em humor e palavras-chave
  const isHard = difficulty === "Avançado";
  const isFirm = difficulty === "Médio";
  
  if (cleanMsg.includes("olá") || cleanMsg.includes("bom dia") || cleanMsg.includes("boa tarde")) {
    if (isHard) {
      return `Olá, ${character} aqui. Olha, estou com bastante pressa e um problema sério para resolver, então por favor seja direto.`;
    }
    return `Olá! Sou o ${character}. Estou precisando de ajuda com o meu plano.`;
  }

  if (cleanMsg.includes("upload") || cleanMsg.includes("50%")) {
    if (isHard) {
      return `Hum, 50% de upload? Isso realmente faz diferença para o meu home office? Meus arquivos são pesados e vivo caindo das reuniões do Teams. Explique melhor.`;
    }
    return `Nossa, 50% de upload parece excelente! Eu realmente preciso disso para minhas chamadas de vídeo de trabalho.`;
  }

  if (cleanMsg.includes("fibra") || cleanMsg.includes("estabilidade")) {
    return `E quanto à estabilidade física da rede? Já tive problemas com outras operadoras que caíam quando chovia. Essa fibra da Claro é protegida contra isso?`;
  }

  if (cleanMsg.includes("preço") || cleanMsg.includes("valor") || cleanMsg.includes("custo") || cleanMsg.includes("caro")) {
    if (isHard) {
      return `Entendi os benefícios, mas o preço está puxado. O que você consegue fazer para me convencer a assinar hoje sem que eu ache caro?`;
    }
    return `E qual é o valor mensal desse plano de fibra com Wi-Fi incluso?`;
  }

  if (cleanMsg.includes("desculpa") || cleanMsg.includes("lamento") || cleanMsg.includes("compreendo")) {
    if (isHard) {
      return `Não preciso de desculpas corporativas prontas. Quero saber o que vai ser feito de forma prática!`;
    }
    return `Obrigado por compreender. Espero que possamos resolver isso de forma simples.`;
  }

  if (cleanMsg.includes("instalação") || cleanMsg.includes("prazo") || cleanMsg.includes("sla")) {
    return `E se eu fechar agora, qual é o prazo para a instalação física e ativação do sinal na minha residência?`;
  }

  // Fallbacks padrão de acordo com humor
  if (isHard) {
    return `Olha, ainda não me sinto convencido. Suas respostas parecem muito vagas. Pode detalhar melhor como seu produto resolve meu problema de quedas na conexão?`;
  } else if (isFirm) {
    return `Entendo seu ponto, mas preciso de garantias claras de que essa velocidade prometida é real. O que mais você pode me oferecer de diferencial?`;
  } else {
    return `Certo, compreendi. Me parece interessante. Quais são os próximos passos para prosseguirmos com isso?`;
  }
};

const handleOfflineEvaluation = (transcript: any[], title: string, scenario: string) => {
  // Simple heuristic analysis for fallback offline evaluation
  const fullText = transcript.map(t => t.text).join(" ").toLowerCase();
  
  const containsUpload = fullText.includes("upload") || fullText.includes("50%");
  const containsFibra = fullText.includes("fibra") || fullText.includes("estabilidade") || fullText.includes("estável");
  const containsCordiality = fullText.includes("bom dia") || fullText.includes("olá") || fullText.includes("obrigado") || fullText.includes("prazer");
  
  let score = 65; // Base score
  if (containsUpload) score += 15;
  if (containsFibra) score += 10;
  if (containsCordiality) score += 10;
  if (transcript.length > 5) score += 5;
  if (score > 100) score = 100;

  const assertiveness = containsUpload ? 85 : 55;
  const empathy = containsCordiality ? 90 : 60;
  const communication = transcript.length > 4 ? 80 : 50;
  const technical = (containsUpload && containsFibra) ? 90 : 60;
  const persuasion = score >= 80 ? 85 : 60;

  return {
    score,
    assertiveness,
    empathy,
    communication,
    technical,
    persuasion,
    summary: `Avaliação gerada em modo offline (contingência). O colaborador demonstrou uma performance ${score >= 80 ? 'excelente' : 'intermediária'} na simulação "${title}". Ele ${containsCordiality ? 'foi cordial no início do contato' : 'poderia ter demonstrado mais cordialidade e acolhimento'}. ${containsUpload ? 'Explicou perfeitamente os diferenciais técnicos do upload de 50%, essencial para conexões corporativas.' : 'Esqueceu de detalhar a taxa de upload de 50%, que é o diferencial central da Claro Fibra contra concorrentes.'}`,
    strengths: [
      containsCordiality ? "Boa cordialidade e estabelecimento de rapport inicial." : "Respostas focadas no diálogo direto.",
      containsUpload ? "Excelente destaque do upload de 50% como benefício prático." : "Tentativa de manter a conversa ativa com o cliente.",
      "Postura receptiva diante de objeções de preço e prazo do cliente."
    ],
    improvements: [
      !containsUpload ? "Faltou citar o upload de 50% da taxa de download para justificar a estabilidade técnica." : "Pode explorar ganchos de Wi-Fi 6 em planos de ultravelocidade.",
      !containsFibra ? "Deve ressaltar a imunidade da fibra óptica contra quedas por chuva ou interferência." : "Pode refinar a transição para o fechamento do contrato.",
      "Mantenha um ritmo de fala pausado e pergunte mais sobre as dores do cliente antes de propor a solução comercial."
    ],
    nextSteps: "Assista ao treinamento de diferenciais da Claro Fibra focado em taxa de upload e estude as objeções de clientes avançados."
  };
};

// Fallback pedagógico contextualizado para avaliação de vídeo caso a IA esteja indisponível ou sob alta demanda
const handleVideoFallbackEvaluation = (
  scenarioContext?: string,
  mode: 'knowledge' | 'script' = 'knowledge',
  previousScore?: number,
  evalCriteria?: string[],
  liveTranscript?: string
) => {
  const isScripted = mode === 'script';
  const cleanTranscript = (liveTranscript || "").trim();
  const contextLower = String(scenarioContext || "").toLowerCase();
  const transcriptLower = cleanTranscript.toLowerCase();

  // Verificação rigorosa: se não falou nada ou falou menos de 10 caracteres ou palavras vazias, nota 0.0
  const isMeaningful = cleanTranscript.length >= 15 && (
    transcriptLower.includes("claro") || 
    transcriptLower.includes("fibra") || 
    transcriptLower.includes("wi-fi") || 
    transcriptLower.includes("wifi") || 
    transcriptLower.includes("internet") || 
    transcriptLower.includes("tv") || 
    transcriptLower.includes("mesh") || 
    transcriptLower.includes("upload") || 
    transcriptLower.includes("sinal") || 
    transcriptLower.includes("rede") || 
    transcriptLower.includes("roteador") || 
    transcriptLower.includes("aparelho") || 
    transcriptLower.includes("velocidade") || 
    transcriptLower.includes("band") || 
    transcriptLower.includes("frequência") ||
    transcriptLower.includes("conexão") ||
    transcriptLower.includes("bom dia") ||
    transcriptLower.includes("olá")
  );

  if (!cleanTranscript || cleanTranscript.length < 10 || !isMeaningful) {
    return {
      score: 0.0,
      strengths: "Nenhum ponto forte identificado. Não houve explicação sobre o produto Claro ou atendimento ao cliente.",
      weaknesses: cleanTranscript.length > 0 
        ? `A fala foi desconexa ou não abordou a dúvida do cliente. Transcrição capturada: "${cleanTranscript}". Para obter pontuação, é necessário explicar o produto.`
        : "O vídeo não conteve áudio ou fala inteligível com a explicação técnica solicitada pelo cliente.",
      suggestions: "Assista às orientações do produto no card do cenário e pratique a explicação em voz alta antes de iniciar a gravação.",
      transcript: cleanTranscript.length > 0 
        ? `[Fala desconexa / sem conteúdo de atendimento]: "${cleanTranscript}"`
        : "[Nenhuma fala ou explicação técnica detectada no áudio do vídeo]"
    };
  }

  // Se falou algo com sentido técnico:
  let score = 7.5;
  if (transcriptLower.includes("upload") || transcriptLower.includes("mesh") || transcriptLower.includes("replay") || transcriptLower.includes("band steering")) {
    score += 1.3;
  }
  if (transcriptLower.includes("olá") || transcriptLower.includes("bom dia") || transcriptLower.includes("boa tarde")) {
    score += 0.5;
  }
  if (isScripted) {
    score = Math.min(9.8, Math.max(8.0, Number(((previousScore || 7.0) + 1.2).toFixed(1))));
  }
  score = Math.min(9.6, Math.max(5.0, Number(score.toFixed(1))));
  
  let strengths = "Boa comunicação vocal e postura receptiva. O colaborador articulou os conceitos fundamentais para o cliente.";
  let weaknesses = "Pode reforçar com mais ênfase como essa tecnologia resolve o problema prático do cliente no dia a dia.";
  let suggestions = "Treine a cadência da fala para soar ainda mais consultivo e seguro durante a visita técnica.";
  let transcript = cleanTranscript;

  if (contextLower.includes("band steering") || contextLower.includes("2.4") || contextLower.includes("5ghz")) {
    strengths = "Explicação clara sobre como o Band Steering une as redes de 2.4GHz e 5GHz de forma automática e transparente.";
    weaknesses = "Lembrar de frisar que o assinante não precisa alternar redes manualmente nos dispositivos.";
    suggestions = "Use a analogia de pistas expressas de trânsito para tornar a didática ainda mais simples.";
  } else if (contextLower.includes("mesh") || contextLower.includes("iot") || contextLower.includes("automação")) {
    strengths = "Abordagem precisa sobre como os extensores Wi-Fi Mesh eliminam sombras de cobertura em todos os cômodos.";
    weaknesses = "Pode detalhar como os dispositivos IoT (sensores, câmeras) ganham estabilidade na rede de 2.4GHz.";
    suggestions = "Pergunte ao cliente sobre os pontos da residência onde o sinal costumava falhar para personalizar a demonstração.";
  } else if (contextLower.includes("tv") || contextLower.includes("replay") || contextLower.includes("nuvem")) {
    strengths = "Destaque expressivo sobre o Replay TV de até 7 dias e o gravador em nuvem da Claro TV+.";
    weaknesses = "Ressaltar que o serviço não requer aparelhos gravadores volumosos adicionais.";
    suggestions = "Mostre como a família inteira pode desfrutar dos replays em múltiplos dispositivos ao mesmo tempo.";
  } else if (contextLower.includes("upload") || contextLower.includes("fibra")) {
    strengths = "Ênfase impecável na taxa de 50% de upload da Claro Fibra, argumento central contra concorrentes no mercado.";
    weaknesses = "Lembrar de perguntar a rotina de home office ou jogos do cliente para conectar o benefício imediato.";
    suggestions = "Conecte o upload de 50% diretamente com chamadas no Teams e envio de arquivos pesados sem engasgos.";
  }

  if (Array.isArray(evalCriteria) && evalCriteria.length > 0) {
    strengths += ` Aderência aos critérios: ${evalCriteria.slice(0, 2).join('; ')}.`;
  }

  return {
    score,
    strengths,
    weaknesses,
    suggestions,
    transcript
  };
};

// --- ROTAS DO SIMULADOR ---

// Rota de Teste de Chave de API Própria (BYOK)
app.post("/api/ai/test-key", async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    return res.status(400).json({ success: false, message: "Chave de API inválida ou vazia." });
  }

  try {
    const ai = new GoogleGenAI({ 
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Responda apenas: OK"
    });

    return res.json({ success: true, message: "Chave do Google AI Studio validada e conectada com sucesso!" });
  } catch (err: any) {
    console.error("Erro ao testar chave de API personalizada:", err);
    return res.status(400).json({ 
      success: false, 
      message: `Erro na autenticação com o Google: ${err.message || 'Verifique se a chave está ativa.'}` 
    });
  }
});

// Rota A: Geração de Respostas do Cliente (POST /api/simulator/chat)
app.post("/api/simulator/chat", async (req, res) => {
  const { message, history = [], simulator, aiConfig, category, userApiKey } = req.body;
  const headerKey = req.headers['x-gemini-api-key'] as string;
  const customKey = headerKey || userApiKey;

  if (!simulator) {
    return res.status(400).json({ error: "Parâmetro simulator é obrigatório." });
  }

  const ai = getGeminiClient(customKey);
  if (!ai) {
    const reply = handleOfflineChat(message, simulator.difficulty, simulator.character);
    return res.json({ reply, mode: "offline" });
  }

  try {
    const formattedHistory = history.map((msg: any) => {
      const label = msg.role === "client" ? `Cliente (${simulator.character})` : "Atendente";
      return `${label}: ${msg.text}`;
    }).join("\n");

    const scenarioPromptInst = simulator?.aiSystemInstruction || category?.aiSystemInstruction || aiConfig?.categorySystemInstruction || aiConfig?.simulatorSystemInstruction;
    const customInstruction = scenarioPromptInst 
      ? `\n\nDIRETRIZES PERSONALIZADAS PARA ESTE CENÁRIO/CATEGORIA:\n${scenarioPromptInst}` 
      : '';

    const effectiveScript = category?.script || simulator.script || '';

    const systemInstruction = `
Você é um cliente corporativo fictício em um simulador de treinamento para funcionários da Claro.
Suas diretrizes de atuação são:
- NOME/PAPEL: ${simulator.character}
- CONTEXTO DA SITUAÇÃO ( briefing / sua dor ): ${simulator.scenario}
- ROTEIRO DA CONVERSA (seu objetivo ou objeções): ${effectiveScript}
- DIFICULDADE DO CLIENTE: ${simulator.difficulty}

REGRAS CRÍTICAS DE ATUAÇÃO:
1. Responda EXATAMENTE como esse cliente agiria na vida real. Use o tom de voz e a emoção correspondentes:
   - "Básico": Cliente amigável, receptivo, conversa fácil, aceita argumentos rapidamente.
   - "Médio": Cliente firme, faz perguntas objetivas, quer entender o valor do serviço, neutro.
   - "Avançado": Cliente irritado, impaciente, apressado, desconfiado de jargões de vendas e exige justificativas sólidas.
2. Mantenha as respostas curtas, naturais e focadas na conversa direta (diálogo direto de 1 a 3 frases no máximo). Nunca saia do personagem.
3. Não dê dicas de treinamento, não elogie o colaborador e nem analise a resposta dele no meio da conversa. Apenas atue!
4. Responda estritamente em Português Brasileiro (pt-BR).
5. Integre o seguinte contexto da empresa onde o colaborador trabalha (Claro Fibra):
${CLARO_COMPANY_CONTEXT}
Se o atendente usar as diretrizes corporativas corretas (como explicar o upload de 50%, a estabilidade da fibra ou focar em suas dores), demonstre satisfação ou alinhamento gradativo ao longo do chat.
${customInstruction}
`;

    const prompt = `
Histórico da conversa até o momento:
${formattedHistory}
Atendente: ${message}

Com base nas suas regras de atuação, forneça a sua próxima fala como o Cliente (${simulator.character}). Lembre-se: responda diretamente como o personagem, de 1 a 3 frases, mantendo a emoção da dificuldade "${simulator.difficulty}". Não inclua prefixos como "Cliente:" ou "Sandra:" na resposta.
`;

    const modelToUse = aiConfig?.simulatorModel || "gemini-3.5-flash";
    const temperatureToUse = aiConfig?.temperature !== undefined ? Number(aiConfig.temperature) : (simulator.difficulty === "Avançado" ? 0.8 : 0.6);

    const response = await generateWithModelFallback(
      ai,
      modelToUse,
      prompt,
      {
        systemInstruction,
        temperature: temperatureToUse,
      }
    );

    const reply = response.text?.trim() || "";
    res.json({ reply, mode: "online" });

  } catch (error: any) {
    console.error("Erro na chamada de chat do Gemini:", error);
    const reply = handleOfflineChat(message, simulator.difficulty, simulator.character);
    res.json({ reply, mode: "offline", error: error.message });
  }
});

// Rota B: Avaliador Técnico de Desempenho (POST /api/simulator/evaluate)
app.post("/api/simulator/evaluate", async (req, res) => {
  const { transcript = [], simulator, aiConfig, category, userApiKey } = req.body;
  const headerKey = req.headers['x-gemini-api-key'] as string;
  const customKey = headerKey || userApiKey;

  if (!simulator) {
    return res.status(400).json({ error: "Parâmetro simulator é obrigatório." });
  }

  const ai = getGeminiClient(customKey);
  if (!ai) {
    const evaluation = handleOfflineEvaluation(transcript, simulator.title, simulator.scenario);
    return res.json({ evaluation, mode: "offline" });
  }

  try {
    const formattedTranscript = transcript.map((msg: any) => {
      const label = msg.role === "client" ? `Cliente (${simulator.character})` : "Atendente (Colaborador)";
      return `[${label}]: ${msg.text}`;
    }).join("\n");

    const scenarioEvalInst = simulator?.aiSystemInstruction || category?.aiSystemInstruction || aiConfig?.categorySystemInstruction || aiConfig?.evaluationSystemInstruction;
    const customEvalInstruction = scenarioEvalInst 
      ? `\n\nDIRETRIZES ADICIONAIS DE AVALIAÇÃO DA I.A PARA ESTE CENÁRIO/CATEGORIA:\n${scenarioEvalInst}` 
      : '';

    const effectiveCriteriaList = (Array.isArray(simulator?.evalCriteria) && simulator.evalCriteria.length > 0)
      ? simulator.evalCriteria
      : (category?.evalCriteria || aiConfig?.categoryEvalCriteria);
    const criteriaPrompt = Array.isArray(effectiveCriteriaList) && effectiveCriteriaList.length > 0
      ? `\nCRITÉRIOS ESPECÍFICOS QUE A I.A DEVE AVALIAR NESTE CENÁRIO:\n` + effectiveCriteriaList.map((c: string, idx: number) => `${idx + 1}. ${c}`).join('\n')
      : '';

    const effectiveScript = category?.script || simulator?.script || '';

    const prompt = `
Você é um Avaliador de Desempenho Humano, Coach Executivo de Atendimento ao Cliente e Especialista em Qualidade da Claro.
Seu objetivo é analisar a transcrição de uma simulação de atendimento corporativo e gerar notas técnicas, análises críticas e um PDI (Plano de Desenvolvimento Individual).

CASO DO SIMULADOR CLARO:
- Título: ${simulator.title}
- Cenário/Briefing do Cliente: ${simulator.scenario}
- Roteiro Esperado: ${effectiveScript}
- Dificuldade do Caso: ${simulator.difficulty}

DIRETRIZ DE AVALIAÇÃO DA CLARO FIBRA:
Para obter notas altas, o Atendente deve:
1. Apresentar-se cordialmente.
2. Identificar a necessidade de internet estável ou dores do cliente.
3. Citar e explicar de forma clara o diferencial técnico: taxa de UPLOAD correspondente a 50% do download, explicando de forma tangível por que isso é bom (ex: videochamadas perfeitas, home office estável, etc.).
4. Superar as objeções com empatia e segurança.
${criteriaPrompt}
${customEvalInstruction}

TRANSCRIÇÃO COMPLETA DO ATENDIMENTO:
${formattedTranscript}

Analise rigorosamente e gere uma avaliação detalhada em formato JSON estrito, utilizando EXATAMENTE o seguinte esquema de propriedades:
{
  "score": (número de 0 a 100 representando a nota geral da simulação),
  "assertiveness": (número de 0 a 100 avaliando o foco na solução e objetividade),
  "empathy": (número de 0 a 100 avaliando simpatia, tom de voz lúdico e escuta ativa),
  "communication": (número de 0 a 100 avaliando clareza de ideias, fluidez e dicção teórica),
  "technical": (número de 0 a 100 avaliando se citou a taxa de upload de 50%, estabilidade da fibra e conhecimento do produto),
  "persuasion": (número de 0 a 100 avaliando capacidade de superar as objeções específicas do caso),
  "summary": "Resumo analítico profissional de 2 parágrafos (máximo 600 caracteres) detalhando os comportamentos e argumentos observados na transcrição, com tom encorajador mas cirúrgico.",
  "strengths": ["Ponto forte 1", "Ponto forte 2", "Ponto forte 3"],
  "improvements": ["Ponto a melhorar 1", "Ponto a melhorar 2", "Ponto a melhorar 3"],
  "nextSteps": "Plano de ação focado e direto em uma única frase para o colaborador praticar e evoluir no próximo ciclo."
}

Garanta que o retorno seja exclusivamente um objeto JSON sem blocos de código markdown (\`\`\`json ... \`\`\`), apenas o texto JSON bruto.
`;

    const modelToUse = aiConfig?.evaluationModel || "gemini-3.5-flash";
    const temperatureToUse = aiConfig?.temperature !== undefined ? Number(aiConfig.temperature) : 0.7;

    const response = await generateWithModelFallback(
      ai,
      modelToUse,
      prompt,
      {
        responseMimeType: "application/json",
        temperature: temperatureToUse,
      }
    );

    const jsonText = response.text?.trim() || "{}";
    const evaluation = JSON.parse(jsonText);
    res.json({ evaluation, mode: "online" });

  } catch (error: any) {
    console.error("Erro na avaliação do Gemini:", error);
    const evaluation = handleOfflineEvaluation(transcript, simulator.title, simulator.scenario);
    res.json({ evaluation, mode: "offline", error: error.message });
  }
});

// Rota: Avaliador de Vídeo com Inteligência Artificial e Fallback Pedagógico Claro
app.post("/api/video/evaluate", async (req, res) => {
  const {
    videoBase64,
    videoMimeType = 'video/mp4',
    scenarioContext,
    mode = 'knowledge',
    previousScore,
    userApiKey,
    scenarioInstructions,
    evalCriteria,
    aiConfig,
    liveTranscript
  } = req.body;

  const headerKey = req.headers['x-gemini-api-key'] as string;
  const customKey = headerKey || userApiKey;
  const ai = getGeminiClient(customKey);

  if (!ai) {
    const fallback = handleVideoFallbackEvaluation(scenarioContext, mode, previousScore, evalCriteria, liveTranscript);
    return res.json({ ...fallback, mode: "contingency" });
  }

  // Normalização de mimeType para conformidade com a API Gemini
  let cleanMimeType = String(videoMimeType || 'video/mp4').split(';')[0].trim().toLowerCase();
  if (cleanMimeType === 'video/quicktime') cleanMimeType = 'video/mp4';
  if (cleanMimeType === 'video/x-matroska') cleanMimeType = 'video/webm';
  if (cleanMimeType === 'application/octet-stream') cleanMimeType = 'video/mp4';

  const supportedTypes = ['video/mp4', 'video/mpeg', 'video/mov', 'video/avi', 'video/flv', 'video/mpg', 'video/webm', 'video/wmv', 'video/3gp'];
  if (!supportedTypes.includes(cleanMimeType)) {
    cleanMimeType = 'video/mp4';
  }

  const isScripted = mode === 'script';
  const specificDirectives = scenarioInstructions || aiConfig?.evaluationSystemInstruction;
  const customInstruction = specificDirectives
    ? `\n\nDIRETRIZES DA IA PARA ESTE CENÁRIO:\n${specificDirectives}` 
    : '';

  const criteriaText = Array.isArray(evalCriteria) && evalCriteria.length > 0
    ? `\n\nCRITÉRIOS ESPECÍFICOS QUE A I.A DEVE AUDITAR NESTE VÍDEO:\n` + evalCriteria.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')
    : '';

  const systemInstruction = `Você é um avaliador rigoroso, realista e pedagógico da capacitação técnica e consultiva da Claro.
Sua missão primordial é escutar o áudio do vídeo, transcrever com máxima precisão o que o técnico falou no campo 'transcript' e avaliar com rigor se ele de fato explicou a tecnologia Claro e tirou a dúvida do cliente.

REGRA DE RIGOR ABSOLUTO - NOTA ZERO (0.0):
1. Se o colaborador NÃO falar nada (silêncio total, respiração isolada, ruído de ambiente ou estática);
2. Se o colaborador falar "nada com nada" (palavras desconexas, enrolação, piadas, xingamentos, conversas aleatórias que não são a explicação do produto para o cliente, repetição vazia de sons ou murmúrios ininteligíveis);
3. Se ele NÃO explicou nada para o cliente sobre o produto do cenário;
-> A NOTA (score) DEVE SER OBRIGATORIAMENTE 0.0 (Zero absoluto). NUNCA dê nota de consolação (como 4.0, 6.0 ou 7.0) para quem não explicou nada!
-> Em 'transcript': Registre exatamente a transcrição do que foi dito ou '[Silêncio / Nenhuma fala detectada]' se não houve fala.
-> Em 'strengths': "Nenhum ponto forte identificado. Não houve explicação do produto ou atendimento ao cliente."
-> Em 'weaknesses': "A fala foi ausente, desconexa ou não explicou a solução técnica para a dúvida do cliente."
-> Em 'suggestions': "Revise o produto Claro correspondente e estruture sua fala antes de gravar novamente."

AVALIAÇÃO REALISTA QUANDO HOUVER EXPLICAÇÃO DO PRODUTO:
- O campo 'transcript' DEVE conter a transcrição fiel em Português do que o técnico falou no vídeo.
- Avalie se o técnico explicou os conceitos técnicos essenciais (ex: 50% de upload na Claro Fibra, Band Steering 2.4/5GHz, Wi-Fi Mesh para cobertura sem sombras, Claro TV+ com Replay TV e gravação em nuvem).
- Dê notas realistas e justas de 0 a 10 com 1 casa decimal (ex: 4.5, 6.8, 8.5, 9.5).
${isScripted ? `MODO: COM ROTEIRO (SCRIPTED). O técnico leu o teleprompter. Se seguiu o roteiro e teve boa clareza vocal, a nota deve refletir a evolução perante a etapa anterior (${previousScore || 'N/A'}). Se falou nada com nada ou não gravou a explicação, nota continua sendo 0.0.` : ''}
${customInstruction}
${criteriaText}
Retorne estritamente um objeto JSON com os campos solicitados.`;

  const contextPrompt = scenarioContext ? 
    `CENÁRIO: ${scenarioContext}.` : 
    "Avaliação técnica geral Claro.";

  const liveTranscriptText = liveTranscript ? `\n[Transcrição auxiliar capturada pelo microfone durante a gravação]: "${liveTranscript}"` : '';

  const userPrompt = `
Analise o vídeo com atenção auditiva e pedagógica:
1. Ouça o áudio e transcreva fielmente o que o técnico falou no campo 'transcript'.
2. Verifique se o técnico realmente explicou a tecnologia Claro e atendeu o cliente, ou se falou "nada com nada" / ficou em silêncio.
3. Se não houver explicação do produto ou se falar coisas sem sentido, atribua nota (score) 0.0.
4. Caso tenha explicado, forneça feedback construtivo detalhando pontos fortes, melhorias e sugestão prática.
${liveTranscriptText}

${contextPrompt}
${isScripted && previousScore ? `Nota da etapa anterior (sem roteiro): ${previousScore}.` : ''}
`;

  try {
    const parts: any[] = [{ text: userPrompt }];

    if (videoBase64) {
      const base64Data = videoBase64.includes(',') ? videoBase64.split(',')[1] : videoBase64;
      
      const sizeInBytes = (base64Data.length * 3) / 4;
      if (sizeInBytes > 45 * 1024 * 1024) {
        throw new Error("O vídeo excedeu o limite máximo para processamento (45MB).");
      }

      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: cleanMimeType
        }
      });
    }

    const modelToUse = aiConfig?.evaluationModel || "gemini-3.8-flash";
    const response = await generateWithModelFallback(
      ai,
      modelToUse,
      { parts },
      {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Nota de 0 a 10 (0 se não explicou nada ou falou nada com nada)" },
            strengths: { type: Type.STRING, description: "Pontos positivos baseados na fala real" },
            weaknesses: { type: Type.STRING, description: "Oportunidades de melhoria" },
            suggestions: { type: Type.STRING, description: "Sugestão prática" },
            transcript: { type: Type.STRING, description: "Transcrição fiel do que foi falado no vídeo" }
          },
          required: ["score", "strengths", "weaknesses", "suggestions", "transcript"]
        }
      }
    );

    const jsonStr = response.text?.trim() || '{}';
    const parsed = JSON.parse(jsonStr);

    if (typeof parsed.score !== 'number' || isNaN(parsed.score)) {
      parsed.score = 0.0;
    }
    parsed.score = Math.max(0, Math.min(10, Number(parsed.score.toFixed(1))));

    // Garantir rigor: se a transcrição indica silêncio ou fala desconexa, nota é 0.0
    const tLower = String(parsed.transcript || "").toLowerCase();
    if (
      tLower.includes("silêncio") || 
      tLower.includes("nenhuma fala") || 
      tLower.includes("nada com nada") || 
      tLower.includes("desconex") ||
      tLower.trim().length < 8
    ) {
      parsed.score = 0.0;
    }

    return res.json({ ...parsed, mode: "online" });

  } catch (error: any) {
    console.error("[POST /api/video/evaluate] Falha na esteira da IA do Gemini:", error.message || error);
    const fallback = handleVideoFallbackEvaluation(scenarioContext, mode, previousScore, evalCriteria, liveTranscript);
    return res.json({ 
      ...fallback, 
      mode: "contingency",
      diagnostic: error.message || "IA temporariamente indisponível"
    });
  }
});

// Rota C: Gerador de Quizzes e Cenários com I.A a partir de anexo (POST /api/ai/generate-from-file)
app.post("/api/ai/generate-from-file", async (req, res) => {
  const { fileData, mimeType, type, additionalPrompt, numItems = 3, categoryType = 'simulator', userApiKey } = req.body;
  const headerKey = req.headers['x-gemini-api-key'] as string;
  const customKey = headerKey || userApiKey;

  if (!type || (type !== 'quiz' && type !== 'scenario')) {
    return res.status(400).json({ error: "O parâmetro type deve ser 'quiz' ou 'scenario'." });
  }

  const ai = getGeminiClient(customKey);
  if (!ai) {
    // Modo de contingência offline
    if (type === 'quiz') {
      const offlineQuizzes = [
        {
          question: `[OFFLINE] Pergunta sobre o tema: ${additionalPrompt || 'Conexão e Atendimento'}`,
          options: ['Opção Correta Base', 'Opção Falsa 1', 'Opção Falsa 2', 'Opção Falsa 3'],
          correctOptionIndex: 0,
          explanation: 'Esta é uma questão de demonstração gerada pelo modo de contingência offline.',
          targetRole: 'all'
        },
        {
          question: '[OFFLINE] Qual é o principal diferencial de upload da Claro Fibra?',
          options: ['10%', '25%', '50% do Download', '100% Simétrico'],
          correctOptionIndex: 2,
          explanation: 'No modo de contingência offline, lembramos que a Claro Fibra oferece 50% de taxa de upload.',
          targetRole: 'tech'
        }
      ];
      return res.json({ items: offlineQuizzes, mode: "offline" });
    } else {
      const offlineScenarios = [
        {
          type: categoryType || 'simulator',
          title: `[OFFLINE] Cenário sobre: ${additionalPrompt || 'Nova Oferta'}`,
          character: 'Maurício Souza',
          difficulty: 'Médio',
          category: 'Vendas',
          scenario: 'O cliente deseja entender as novas ofertas descritas no documento de treinamento da Claro.',
          script: 'Explique os diferenciais técnicos e apresente o plano de 500 Mega com Wi-Fi 6.',
          product: 'Virtua',
          customerName: 'Maurício Souza',
          customerProfile: 'Cliente interessado em novas ofertas',
          question: 'Vocês têm algum plano novo de fibra óptica para quem trabalha de casa?',
          evalCriteria: ['Explicar o upload de 50%', 'Mencionar a estabilidade da fibra Claro'],
          image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600&h=600'
        }
      ];
      return res.json({ items: offlineScenarios, mode: "offline" });
    }
  }

  try {
    const parts: any[] = [];
    if (fileData && mimeType) {
      parts.push({
        inlineData: {
          data: fileData,
          mimeType: mimeType
        }
      });
    }

    let systemInstruction = "";
    let userPrompt = "";

    if (type === 'quiz') {
      systemInstruction = `
Você é um especialista em treinamento corporativo da Claro. Seu objetivo é analisar o documento anexado (texto, PDF ou imagem) e gerar exatamente ${numItems} perguntas de quiz de alta qualidade sobre o conteúdo do documento para capacitação de funcionários.
REQUISITOS DO QUIZ:
1. Gere perguntas claras, objetivas e fáceis de entender, baseadas nos fatos ou conceitos descritos no documento/imagem.
2. Cada pergunta deve ter exatamente 4 opções de resposta (A, B, C, D).
3. Deve haver exatamente uma resposta correta (indicada por um índice de 0 a 3 correspondendo a A, B, C, D).
4. Forneça uma explicação detalhada e pedagógica de por que aquela resposta é a correta.
5. Associe com o público-alvo apropriado ('tech' para instaladores técnicos, 'commercial' para vendedores, ou 'all' para todos).
6. Se o arquivo estiver vazio ou não contiver dados estruturados, crie perguntas de alta relevância sobre Claro Fibra (focando nos diferenciais de estabilidade e 50% de upload).

Retorne obrigatoriamente um objeto JSON contendo um array com as perguntas, seguindo exatamente este formato:
{
  "questions": [
    {
      "question": "Texto da pergunta...",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correctOptionIndex": 0,
      "explanation": "Explicação detalhada...",
      "targetRole": "all"
    }
  ]
}
      `;

      userPrompt = `Gere exatamente ${numItems} perguntas de quiz em português do Brasil.`;
      if (additionalPrompt) {
        userPrompt += ` Diretriz adicional do usuário: ${additionalPrompt}`;
      }
    } else {
      systemInstruction = `
Você é um designer instrucional e especialista em treinamento de atendimento ao cliente da Claro. Seu objetivo é analisar o documento anexado (texto, PDF ou imagem) e gerar exatamente ${numItems} cenários práticos de simulação do tipo '${categoryType}' para capacitar colaboradores.
REQUISITOS DOS CENÁRIOS:
1. Gere cenários realistas, engajantes e fáceis de treinar baseados nos fatos, dados, ofertas ou processos descritos no documento/imagem.
2. O tipo do cenário deve ser obrigatoriamente '${categoryType}'.
3. Se o tipo for 'simulator' (Simulador de Diálogos), você deve preencher:
   - title: Título cativante do cenário.
   - character: Nome da persona do cliente (ex: Sandra Azevedo).
   - difficulty: "Básico", "Médio" ou "Avançado".
   - category: Categoria de atendimento (ex: Retenção / Vendas).
   - scenario: O briefing ou dor do cliente (histórico, necessidades e frustrações).
   - script: O roteiro ou metas ocultas que o atendente deve cumprir (ex: o atendente deve explicar o upload de 50%).
4. Se o tipo for 'consultivo' (Pitch de Vídeo), você deve preencher:
   - title: Título do cenário.
   - product: Qual produto da Claro em pauta ('Virtua', 'TV', 'Mesh', 'Móvel').
   - customerName: Nome da persona do cliente.
   - customerProfile: Perfil resumido da persona (ex: Aposentada buscando praticidade).
   - question: A fala inicial ou dúvida que o cliente diz ao atendente na gravação.
   - evalCriteria: Um array com 3 ou 4 critérios de êxito para avaliação da I.A (ex: "Explicar os diferenciais técnicos do upload").
   - image: Uma URL de imagem fictícia do Unsplash do avatar coerente com a persona.

Retorne obrigatoriamente um objeto JSON contendo um array com os cenários gerados, seguindo exatamente este formato:
{
  "scenarios": [
    {
      "type": "${categoryType}",
      "title": "Texto...",
      "character": "...",
      "difficulty": "Médio",
      "category": "...",
      "scenario": "...",
      "script": "...",
      "product": "Virtua",
      "customerName": "...",
      "customerProfile": "...",
      "question": "...",
      "evalCriteria": ["Critério 1", "Critério 2", "Critério 3"],
      "image": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600&h=600"
    }
  ]
}
      `;

      userPrompt = `Gere exatamente ${numItems} cenários do tipo '${categoryType}' em português do Brasil.`;
      if (additionalPrompt) {
        userPrompt += ` Diretriz adicional do usuário: ${additionalPrompt}`;
      }
    }

    parts.push({ text: userPrompt });

    const response = await generateWithModelFallback(
      ai,
      "gemini-3.5-flash",
      { parts },
      {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.75
      }
    );

    const jsonText = response.text?.trim() || "{}";
    const data = JSON.parse(jsonText);
    const items = type === 'quiz' ? data.questions : data.scenarios;

    res.json({ items: items || [], mode: "online" });

  } catch (error: any) {
    console.error("Erro na geração de I.A a partir do arquivo:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- CONFIGURAÇÃO DE AMBIENTE VITE MIDDLEWARE / DIST STATIC SERVING ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
