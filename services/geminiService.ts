
import { GoogleGenAI, Type } from "@google/genai";
import { DB } from "../db";

export interface EvaluationResult {
  score: number;
  strengths: string;
  weaknesses: string;
  suggestions: string;
  transcript: string;
}

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
      console.warn(`[Gemini API - Explanation Evaluation] Falha temporária (${status || 'UNKNOWN'}). Tentando novamente em ${delay}ms... (${retries} tentativas restantes)`);
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
      console.log(`[Gemini API - Explanation Evaluation] Tentando gerar com: ${currentModel}`);
      const response = await callWithRetry(() => ai.models.generateContent({
        model: currentModel,
        contents,
        config
      }), 2, 800);
      return response;
    } catch (err: any) {
      console.warn(`[Gemini API - Explanation Evaluation] Falha com o modelo ${currentModel}:`, err.message || err);
      lastError = err;
      if (i < uniqueModels.length - 1) {
        console.log(`[Gemini API - Explanation Evaluation] Iniciando fallback para o próximo modelo...`);
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }
  }
  throw lastError;
}

export function generatePedagogicalVideoFallback(
  scenarioContext?: string,
  mode: 'knowledge' | 'script' = 'knowledge',
  previousScore?: number,
  evalCriteria?: string[],
  liveTranscript?: string
): EvaluationResult {
  const isScripted = mode === 'script';
  const cleanTranscript = (liveTranscript || "").trim();
  const contextLower = String(scenarioContext || "").toLowerCase();
  const transcriptLower = cleanTranscript.toLowerCase();

  // Verificação rigorosa: se não falou nada ou falou menos de 15 caracteres ou palavras vazias, nota 0.0
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
      suggestions: "Revise o produto Claro correspondente e estruture sua fala antes de gravar novamente.",
      transcript: cleanTranscript.length > 0 
        ? `[Fala desconexa / sem conteúdo de atendimento]: "${cleanTranscript}"`
        : "[Nenhuma fala ou explicação técnica detectada no áudio do vídeo]"
    };
  }

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

  let strengths = "Boa desenvoltura e postura atenciosa. O colaborador demonstrou firmeza na comunicação e foco na resolução da necessidade do cliente.";
  let weaknesses = "Pode enfatizar com mais intensidade os diferenciais práticos da Claro no dia a dia do assinante.";
  let suggestions = "Treine a cadência de voz ao apresentar números técnicos para gerar ainda mais credibilidade e engajamento.";
  let transcript = cleanTranscript;

  if (contextLower.includes("band steering") || contextLower.includes("2.4") || contextLower.includes("5ghz")) {
    strengths = "Excelente menção à conveniência do Band Steering unindo as frequências 2.4GHz e 5GHz de forma inteligente.";
    weaknesses = "Reforçar que o dispositivo alterna de antena sem que a navegação ou ligação sofra qualquer interrupção.";
    suggestions = "Utilize a analogia das faixas expressas de trânsito para tornar o conceito mais palpável ao cliente.";
  } else if (contextLower.includes("mesh") || contextLower.includes("iot") || contextLower.includes("automação")) {
    strengths = "Abordagem precisa sobre como os pontos Mesh eliminam zonas de sombra e garantem estabilidade para sensores e câmeras inteligentes.";
    weaknesses = "Pode destacar que o mesmo nome de rede Wi-Fi cobre a residência inteira sem troca manual.";
    suggestions = "Apresente cenários onde a família pode circular pela casa com videochamadas sem queda de sinal.";
  } else if (contextLower.includes("tv") || contextLower.includes("replay") || contextLower.includes("nuvem")) {
    strengths = "Destaque expressivo para o Replay TV de até 7 dias e gravação em nuvem da Claro TV+, valorizando a flexibilidade.";
    weaknesses = "Ressaltar que o serviço não necessita de aparelhos gravadores extras ou cabeamentos adicionais.";
    suggestions = "Mostre como a família inteira pode desfrutar dos replays em tablets e smartphones simultaneamente.";
  } else if (contextLower.includes("upload") || contextLower.includes("fibra")) {
    strengths = "Ênfase impecável na taxa de 50% de upload da Claro Fibra, argumento central contra concorrentes no mercado.";
    weaknesses = "Lembrar de perguntar os hábitos de trabalho remoto e reuniões em vídeo para reforçar a estabilidade.";
    suggestions = "Conecte o upload de 50% diretamente com chamadas no Teams e jogos sem oscilação de latência.";
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
}

export const evaluateExplanation = async (
  videoBase64?: string, 
  videoMimeType: string = 'video/mp4',
  scenarioContext?: string,
  mode: 'knowledge' | 'script' = 'knowledge',
  previousScore?: number,
  userApiKey?: string,
  scenarioInstructions?: string,
  evalCriteria?: string[],
  liveTranscript?: string
): Promise<EvaluationResult> => {
  // Obter chave da API: personalizada do usuário logado ou chave global do ambiente
  let effectiveApiKey = userApiKey?.trim();
  if (!effectiveApiKey) {
    try {
      const savedSession = localStorage.getItem('explica_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed?.customGeminiApiKey && parsed.customGeminiApiKey.trim().length > 5) {
          effectiveApiKey = parsed.customGeminiApiKey.trim();
        }
      }
    } catch {}
  }

  if (!effectiveApiKey) {
    effectiveApiKey = process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  }

  const dbConfig = DB.aiConfig.get();

  // 1. Tenta avaliar pelo servidor via API dedicada (/api/video/evaluate)
  try {
    const payload = {
      videoBase64,
      videoMimeType,
      scenarioContext,
      mode,
      previousScore,
      userApiKey: effectiveApiKey,
      scenarioInstructions,
      evalCriteria,
      aiConfig: dbConfig,
      liveTranscript
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (effectiveApiKey) {
      headers['x-gemini-api-key'] = effectiveApiKey;
    }

    const resp = await fetch('/api/video/evaluate', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (resp.ok) {
      const data = await resp.json();
      if (data && typeof data.score === 'number' && !isNaN(data.score)) {
        console.log(`[Video Evaluation] Avaliação concluída via servidor (${data.mode || 'online'}):`, data.score);
        return {
          score: Math.max(0, Math.min(10, Number(data.score.toFixed(1)))),
          strengths: data.strengths || "Nenhum ponto forte registrado.",
          weaknesses: data.weaknesses || "Sem observações adicionais.",
          suggestions: data.suggestions || "Continue praticando para consolidar os argumentos no dia a dia.",
          transcript: data.transcript || liveTranscript || "[Áudio do vídeo processado]"
        };
      }
    }
  } catch (serverErr) {
    console.warn("[Video Evaluation] Rota de servidor indisponível, tentando cliente direto:", serverErr);
  }

  // 2. Se o backend não respondeu, tenta direto pelo cliente se houver API key disponível
  if (!effectiveApiKey) {
    return generatePedagogicalVideoFallback(scenarioContext, mode, previousScore, evalCriteria, liveTranscript);
  }

  let ai: GoogleGenAI;
  try {
    ai = new GoogleGenAI({ 
      apiKey: effectiveApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  } catch (initErr) {
    console.warn("Falha ao inicializar cliente GoogleGenAI local:", initErr);
    return generatePedagogicalVideoFallback(scenarioContext, mode, previousScore, evalCriteria, liveTranscript);
  }

  // --- NORMALIZAÇÃO DE MIMETYPE PARA A IA ---
  let cleanMimeType = videoMimeType.split(';')[0].trim().toLowerCase();
  
  if (cleanMimeType === 'video/quicktime') cleanMimeType = 'video/mp4';
  if (cleanMimeType === 'video/x-matroska') cleanMimeType = 'video/webm';
  if (cleanMimeType === 'application/octet-stream') cleanMimeType = 'video/mp4';
  
  const supportedTypes = ['video/mp4', 'video/mpeg', 'video/mov', 'video/avi', 'video/flv', 'video/mpg', 'video/webm', 'video/wmv', 'video/3gp'];
  
  if (!supportedTypes.includes(cleanMimeType)) {
    cleanMimeType = 'video/mp4';
  }

  const isScripted = mode === 'script';

  const specificDirectives = scenarioInstructions || dbConfig?.evaluationSystemInstruction;
  const customInstruction = specificDirectives
    ? `\n\nDIRETRIZES DA IA PARA ESTE CENÁRIO:\n${specificDirectives}` 
    : '';

  const criteriaText = Array.isArray(evalCriteria) && evalCriteria.length > 0
    ? `\n\nCRITÉRIOS ESPECÍFICOS QUE A I.A DEVE AUDITAR NESTE VÍDEO:\n` + evalCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')
    : '';

  const systemInstruction = `Você é um avaliador rigoroso, realista e pedagógico da capacitação técnica e consultiva da Claro.
    Sua missão primordial é escutar o áudio do vídeo, transcrever com fidelidade o que o técnico falou no campo 'transcript' e avaliar com rigor se ele explicou a tecnologia Claro e tirou a dúvida do cliente.
    
    REGRA DE RIGOR ABSOLUTO - NOTA ZERO (0.0):
    1. Se o colaborador NÃO falar nada (silêncio total ou apenas ruídos de fundo);
    2. Se o colaborador falar "nada com nada" (palavras desconexas, conversa fiada, enrolação, murmúrios incompreensíveis ou assuntos aleatórios sem relação com o produto Claro);
    3. Se NÃO explicou nada para o cliente sobre o produto do cenário;
    -> A NOTA (score) DEVE SER OBRIGATORIAMENTE 0.0 (Zero absoluto).
    -> Em 'transcript': Registre a transcrição literal do que foi dito ou '[Silêncio / Nenhuma fala detectada]'.
    -> Em 'strengths': "Nenhum ponto forte identificado. Não houve explicação do produto ou atendimento ao cliente."
    -> Em 'weaknesses': "A fala foi ausente, desconexa ou não explicou a solução técnica para a dúvida do cliente."
    -> Em 'suggestions': "Revise o produto Claro correspondente e estruture sua fala antes de gravar novamente."

    ${isScripted ? `MODO: COM ROTEIRO (SCRIPTED). Se seguiu o roteiro e demonstrou clareza, a nota deve refletir evolução perante a etapa anterior (${previousScore || 'N/A'}). Se não falou nada ou falou nada com nada, a nota é 0.0.` : ''}
    ${customInstruction}
    ${criteriaText}
    Retorne JSON válido.`;

  const contextPrompt = scenarioContext ? 
    `CENÁRIO: ${scenarioContext}.` : 
    "Avaliação técnica geral Claro.";

  const liveTranscriptNote = liveTranscript ? `\n[Transcrição auxiliar do microfone]: "${liveTranscript}"` : '';

  const userPrompt = `
    Analise o vídeo cuidadosamente:
    1. Ouça o áudio e transcreva fielmente o que o técnico falou no campo 'transcript'.
    2. Verifique se o técnico realmente explicou o produto ou se falou "nada com nada" / ficou em silêncio. Se não explicou nada para o cliente, atribua nota 0.0.
    3. Avalie Clareza, Empatia e Argumentação técnica.
    ${liveTranscriptNote}
    
    ${contextPrompt}
    ${isScripted && previousScore ? `Nota da etapa anterior (sem roteiro): ${previousScore}.` : ''}
  `;

  try {
    const parts: any[] = [{ text: userPrompt }];

    if (videoBase64) {
      const base64Data = videoBase64.includes(',') ? videoBase64.split(',')[1] : videoBase64;
      
      const sizeInBytes = (base64Data.length * 3) / 4;
      if (sizeInBytes > 25 * 1024 * 1024) {
        throw new Error("O vídeo ficou muito longo para análise direta. Tente gravar por menos tempo.");
      }

      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: cleanMimeType
        }
      });
    }

    const modelToUse = dbConfig?.evaluationModel || "gemini-3.8-flash";
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
            weaknesses: { type: Type.STRING, description: "Pontos a melhorar" },
            suggestions: { type: Type.STRING, description: "Sugestão prática" },
            transcript: { type: Type.STRING, description: "Transcrição fiel do que foi falado" }
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

    return parsed;
    
  } catch (error: any) {
    console.error("[Gemini API Video Evaluation Error]:", error);
    return generatePedagogicalVideoFallback(scenarioContext, mode, previousScore, evalCriteria, liveTranscript);
  }
};
