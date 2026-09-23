import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Award, 
  Clock, 
  Sparkles, 
  Brain, 
  TrendingUp, 
  Lightbulb, 
  User, 
  ChevronRight, 
  MessageSquare,
  Activity,
  ThumbsUp,
  RotateCcw
} from 'lucide-react';
import { DB } from '../db';
import { User as UserModel, Evaluation } from '../types';

interface AISimulatorProps {
  user: UserModel;
  onBack: () => void;
}

interface SimulatorScenario {
  id: string;
  title: string;
  scenario: string;
  script: string;
  character: string;
  difficulty: "Básico" | "Médio" | "Avançado";
  category: string;
}

interface ChatMessage {
  role: "client" | "agent";
  text: string;
  timestamp: string;
}

interface EvaluationMetrics {
  assertiveness: number;
  empathy: number;
  communication: number;
  technical: number;
  persuasion: number;
}

interface EvaluationResult {
  score: number;
  assertiveness: number;
  empathy: number;
  communication: number;
  technical: number;
  persuasion: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  nextSteps: string;
}

const SCENARIOS: SimulatorScenario[] = [
  {
    id: "sim-sandra",
    title: "Objeção de Preço e Estabilidade de Conexão",
    character: "Sandra Azevedo",
    difficulty: "Avançado",
    category: "Retenção / Vendas",
    scenario: "Sandra é designer freelancer, trabalha 100% em home office e está enfurecida porque sua internet atual (cabo metálico concorrente) cai no meio de reuniões com clientes importantes. Ela quer cancelar ou encontrar uma solução definitiva, mas está extremamente desconfiada e acha os planos de fibra óptica caros.",
    script: "Apresente a estabilidade da Claro Fibra óptica, dê ênfase absoluta ao fato de que o UPLOAD é de 50% em relação ao download (essencial para videoconferências dela) e supere a objeção de preço demonstrando o valor de não perder clientes pelo sinal caindo."
  },
  {
    id: "sim-marcos",
    title: "Família Conectada e Jogos Online",
    character: "Marcos Oliveira",
    difficulty: "Médio",
    category: "Vendas Consultivas",
    scenario: "Marcos quer contratar internet para sua casa nova. Ele tem dois filhos adolescentes que jogam online competitivamente (latência/ping é crítico) e sua esposa faz lives de culinária à noite. Ele quer entender o que a Claro Fibra oferece para aguentar todos os aparelhos simultaneamente.",
    script: "Explique como funciona a rede de fibra óptica Claro, mencione a baixíssima latência (ping estável) e reforce que os 50% de upload garantem que as lives da esposa aconteçam perfeitamente sem travar o jogo dos filhos."
  },
  {
    id: "sim-juliana",
    title: "Nova Assinante e Dúvida de Instalação",
    character: "Juliana Mendes",
    difficulty: "Básico",
    category: "Atendimento",
    scenario: "Juliana acabou de se mudar para um apartamento novo e quer contratar Claro Fibra. Ela é simpática, mas está preocupada com o prazo de instalação porque precisa da rede ativa em até 3 dias para começar um novo emprego remoto.",
    script: "Demonstre cordialidade, valide a pressa dela com empatia, ofereça o agendamento prioritário e garanta que nosso SLA é de até 48 horas com ativação imediata após a instalação física."
  }
];

export const AISimulator: React.FC<AISimulatorProps> = ({ user, onBack }) => {
  const [stage, setStage] = useState<'selection' | 'briefing' | 'simulation' | 'loading' | 'evaluation'>('selection');
  const [selectedScenario, setSelectedScenario] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  const availableCategories = useMemo(() => {
    const cats = DB.categories.all().filter(c => c.active !== false && (c.module === 'all' || c.module === 'simulator'));
    return ['Todas', ...cats.map(c => c.name)];
  }, []);

  const activeScenarios = useMemo(() => {
    const dbScenarios = DB.scenarios.all().filter(s => s.type === 'simulator');
    const allScenarios = dbScenarios.length > 0 ? dbScenarios : SCENARIOS;
    if (selectedCategory === 'Todas') return allScenarios;
    return allScenarios.filter(s => s.category && s.category.toLowerCase().includes(selectedCategory.toLowerCase()));
  }, [selectedCategory]);
  
  // Simulation State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  // STT Speech-to-Text State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Evaluation Result State
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [evalMode, setEvalMode] = useState<'online' | 'offline'>('online');
  const [loadingStep, setLoadingStep] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isSending]);

  // Handle simulation timer
  useEffect(() => {
    if (stage === 'simulation') {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage]);

  // Clean speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Native Text-to-Speech Narrator
  const speakText = (text: string) => {
    if (isMuted || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel(); // Cancel prior talk
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      
      // Try to find a Brazilian Portuguese voice
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(v => v.lang.includes('pt-BR') || v.lang.includes('pt_BR'));
      if (ptVoice) {
        utterance.voice = ptVoice;
      }
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech Synthesis error:", e);
    }
  };

  // Toggle Audio Narration Mute
  const toggleMute = () => {
    setIsMuted(prev => {
      const newVal = !prev;
      if (newVal && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return newVal;
    });
  };

  // Initialize Speech-to-Text (STT) Recognition
  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Seu navegador não oferece suporte nativo para reconhecimento de voz (Speech-to-Text). Recomendamos o Google Chrome.");
      return;
    }

    try {
      if (isRecording) {
        recognitionRef.current?.stop();
        setIsRecording(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "pt-BR";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setUserInput(prev => {
          const spacing = prev.trim().length > 0 ? ' ' : '';
          return prev + spacing + text;
        });
      };

      recognition.onerror = (event: any) => {
        console.error("STT Error:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech Recognition setup error:", err);
      setIsRecording(false);
    }
  };

  // Format seconds to MM:SS
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Action: Select Scenario
  const handleSelectScenario = (scenario: SimulatorScenario) => {
    setSelectedScenario(scenario);
    setStage('briefing');
  };

  // Action: Start Conversation
  const handleStartSimulation = () => {
    if (!selectedScenario) return;
    setStage('simulation');
    setTimerSeconds(0);
    
    // Initial customer prompt greeting
    const initialGreeting = `Olá! Sou o ${selectedScenario.character}. Estou precisando de ajuda em relação a um plano de internet...`;
    
    setChatMessages([
      {
        role: "client",
        text: initialGreeting,
        timestamp: new Date().toISOString()
      }
    ]);

    // Narrate initial greeting
    setTimeout(() => {
      speakText(initialGreeting);
    }, 500);
  };

  // Action: Send Message to API
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || isSending || !selectedScenario) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setIsSending(true);

    // Stop recording if active
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    // Add user message to state
    const newAgentMsg: ChatMessage = {
      role: "agent",
      text: userMessage,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [...chatMessages, newAgentMsg];
    setChatMessages(updatedHistory);

    try {
      const activeCategoryObj = DB.categories.all().find(c => c.name.toLowerCase() === selectedScenario?.category?.toLowerCase());

      // Call Express API
      const response = await fetch('/api/simulator/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(user?.customGeminiApiKey ? { 'x-gemini-api-key': user.customGeminiApiKey } : {})
        },
        body: JSON.stringify({
          message: userMessage,
          history: chatMessages,
          simulator: selectedScenario,
          category: activeCategoryObj,
          aiConfig: DB.aiConfig.get(),
          userApiKey: user?.customGeminiApiKey
        })
      });

      const data = await response.json();
      
      const clientReply = data.reply || "Desculpe, tive uma oscilação na resposta. Pode repetir?";
      
      setChatMessages(prev => [
        ...prev,
        {
          role: "client",
          text: clientReply,
          timestamp: new Date().toISOString()
        }
      ]);

      // Speak client reply
      speakText(clientReply);

    } catch (err) {
      console.error("Chat sending error:", err);
      // Client-side fallback if server endpoint behaves unexpectedly
      const fallbackReply = "Desculpe, a conexão com meu servidor de simulação caiu temporariamente.";
      setChatMessages(prev => [
        ...prev,
        {
          role: "client",
          text: fallbackReply,
          timestamp: new Date().toISOString()
        }
      ]);
      speakText(fallbackReply);
    } finally {
      setIsSending(false);
    }
  };

  // Action: Finish Training & Trigger Evaluation
  const handleFinishSimulation = async () => {
    if (chatMessages.length < 2) {
      if (!window.confirm("Você trocou muito poucas mensagens. Tem certeza que deseja finalizar sem treinar?")) {
        return;
      }
    }

    setStage('loading');
    setLoadingStep('Estabelecendo conexão segura com Coach IA...');
    
    // Animate loader steps
    const steps = [
      'Estabelecendo conexão segura com Coach IA...',
      'Analisando o fluxo de diálogo e o rapport inicial...',
      'Medindo a empatia e a escuta ativa do consultor...',
      'Validando o uso de termos técnicos e diferenciais (Upload de 50%)...',
      'Calculando a superação de objeções e persuasão comercial...',
      'Consolidando o relatório pedagógico e o Plano de Desenvolvimento...'
    ];

    let currentStepIdx = 0;
    const interval = setInterval(() => {
      currentStepIdx++;
      if (currentStepIdx < steps.length) {
        setLoadingStep(steps[currentStepIdx]);
      }
    }, 2200);

    try {
      const activeCategoryObj = DB.categories.all().find(c => c.name.toLowerCase() === selectedScenario?.category?.toLowerCase());

      const response = await fetch('/api/simulator/evaluate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(user?.customGeminiApiKey ? { 'x-gemini-api-key': user.customGeminiApiKey } : {})
        },
        body: JSON.stringify({
          transcript: chatMessages,
          simulator: selectedScenario,
          category: activeCategoryObj,
          aiConfig: DB.aiConfig.get(),
          userApiKey: user?.customGeminiApiKey
        })
      });

      const data = await response.json();
      clearInterval(interval);

      if (data.evaluation) {
        setEvalResult(data.evaluation);
        setEvalMode(data.mode || 'online');
        setStage('evaluation');

        // Save evaluation to our unified local & Firebase database
        const scoreOutOf10 = Number((data.evaluation.score / 10).toFixed(1)); // Normalize 0-100 down to 0-10 for unified dashboard chart
        
        // Structure formatting for strengths and weaknesses
        const joinedStrengths = data.evaluation.strengths.join("\n• ");
        const joinedImprovements = data.evaluation.improvements.join("\n• ");

        const evaluationToSave: Partial<Evaluation> = {
          id: `sim-eval-${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          userName: user.name,
          timestamp: new Date().toISOString(),
          score: scoreOutOf10,
          strengths: `• ${joinedStrengths}`,
          weaknesses: `• ${joinedImprovements}`,
          suggestions: data.evaluation.nextSteps,
          transcript: chatMessages.map(m => `[${m.role === 'client' ? 'Cliente' : 'Atendente'}]: ${m.text}`).join("\n"),
          uf: user.uf,
          city: user.city,
          evalMode: 'simulator',
          correlationId: `sim-corr-${selectedScenario?.id}`
        };

        // Write to local database (this triggers sync listeners to Firestore!)
        await DB.evaluations.add(evaluationToSave as Evaluation);
      } else {
        throw new Error("Geração de avaliação falhou no servidor.");
      }

    } catch (err) {
      console.error("Evaluation error:", err);
      clearInterval(interval);
      alert("Ocorreu um erro ao processar a avaliação. Exibindo contingência offline.");
      
      // Hard fallback if backend completely offline
      const offlineMockEval: EvaluationResult = {
        score: 75,
        assertiveness: 80,
        empathy: 75,
        communication: 80,
        technical: 70,
        persuasion: 70,
        summary: "Avaliação gerada por algoritmo offline de segurança. Seu diálogo demonstra boa fluidez e condução de atendimento comercial. Recomendamos detalhar ainda mais o upload de 50% Claro Fibra nas objeções.",
        strengths: ["Excelente ritmo de conversa", "Tratamento educado e prestativo", "Foco em solucionar o problema do cliente"],
        improvements: ["Argumentar de forma mais técnica o upload de 50%", "Mencionar a estabilidade física da fibra óptica contra chuva", "Fazer um fechamento de venda mais agressivo e decisivo"],
        nextSteps: "Assista ao microtreinamento sobre o diferencial de Upload de 50% Claro Fibra."
      };
      setEvalResult(offlineMockEval);
      setEvalMode('offline');
      setStage('evaluation');
    }
  };

  // Reset and restart the current scenario
  const handleRestartScenario = () => {
    setChatMessages([]);
    setTimerSeconds(0);
    setStage('briefing');
    setEvalResult(null);
  };

  // Helper colors for difficulty tag
  const getDifficultyStyles = (diff: "Básico" | "Médio" | "Avançado") => {
    switch (diff) {
      case "Básico": return "bg-green-50 text-green-600 border-green-100";
      case "Médio": return "bg-amber-50 text-amber-600 border-amber-100";
      case "Avançado": return "bg-red-50 text-red-600 border-red-100";
    }
  };

  // Helper colors for Score circle
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-[#ee0000]';
    return 'text-amber-600';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-fadeIn px-2 sm:px-0">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-all cursor-pointer"
            title="Voltar ao Painel"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-[#ee0000] text-[10px] font-black uppercase tracking-[0.2em] mb-1">Simulador Cognitivo</p>
            <h2 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight leading-none">Simulador I.A Cliente</h2>
          </div>
        </div>
        <div className="bg-red-50 text-[#ee0000] px-4 py-2.5 rounded-2xl text-[9px] font-black border border-red-100 text-center uppercase tracking-widest flex items-center justify-center gap-1.5 self-start md:self-auto">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by Gemini 3.5 Flash
        </div>
      </div>

      {/* STAGE: SELECTION */}
      {stage === 'selection' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-5 sm:p-8 md:p-10 rounded-[28px] sm:rounded-[40px] text-white space-y-2 sm:space-y-3 relative overflow-hidden shadow-sm">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-10 translate-y-10">
              <Brain className="w-64 sm:w-96 h-64 sm:h-96" />
            </div>
            <span className="text-[9px] bg-red-600 text-white px-3 py-1 rounded-full font-black uppercase tracking-widest inline-block">Treinamento Avançado</span>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight max-w-xl">Pratique o atendimento consultivo em tempo real com clientes reais virtuais</h3>
            <p className="text-gray-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              Escolha uma persona abaixo para simular uma ligação ou atendimento. O cliente responderá dinamicamente baseando-se no seu humor, dificuldade e objeções. Ao final, receba métricas críticas de performance e PDI de nosso Coach Executivo de Atendimento.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            <h3 className="text-xs sm:text-sm font-black text-gray-800 uppercase tracking-widest px-1">Personas e Cenários Disponíveis</h3>
            
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scroll-touch">
              {availableCategories.map(catName => (
                <button
                  key={catName}
                  onClick={() => setSelectedCategory(catName)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border shrink-0 ${
                    selectedCategory === catName
                      ? 'claro-red text-white border-transparent shadow-sm'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {catName}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {activeScenarios.map((scen) => (
              <div 
                key={scen.id}
                className="bg-white rounded-[24px] sm:rounded-[32px] border border-gray-100 p-4 sm:p-6 flex flex-col justify-between hover:shadow-xl hover:border-red-100 transition-all group duration-300"
              >
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{scen.category}</span>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 border rounded-full ${getDifficultyStyles(scen.difficulty)}`}>
                      {scen.difficulty}
                    </span>
                  </div>

                  <div className="space-y-1 sm:space-y-1.5">
                    <h4 className="font-black text-gray-800 text-sm sm:text-base leading-snug group-hover:text-[#ee0000] transition-colors">{scen.title}</h4>
                    <p className="text-[10px] sm:text-[11px] text-gray-400 font-bold uppercase tracking-wider">Persona: {scen.character}</p>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 sm:line-clamp-4">
                    {scen.scenario}
                  </p>
                </div>

                <button
                  onClick={() => handleSelectScenario(scen)}
                  className="mt-4 sm:mt-6 w-full py-2.5 sm:py-3 rounded-2xl bg-gray-50 group-hover:bg-[#ee0000] group-hover:text-white text-gray-700 font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                >
                  Selecionar Persona
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STAGE: BRIEFING */}
      {stage === 'briefing' && selectedScenario && (
        <div className="bg-white rounded-[24px] sm:rounded-[40px] border border-gray-100 p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3 sm:pb-5">
            <button 
              onClick={() => setStage('selection')}
              className="text-xs text-gray-500 hover:text-gray-800 font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer py-1"
            >
              ← Alterar Persona
            </button>
            <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 sm:px-3 py-1 border rounded-full ${getDifficultyStyles(selectedScenario.difficulty)}`}>
              Dificuldade: {selectedScenario.difficulty}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
            <div className="md:col-span-2 space-y-4 sm:space-y-6">
              <div>
                <span className="text-[9px] font-black text-[#ee0000] uppercase tracking-widest">Cenário Clínico</span>
                <h3 className="text-lg sm:text-xl font-black text-gray-800 mt-1 leading-tight">{selectedScenario.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Atuação em Atendimento Técnico / Comercial</p>
              </div>

              <div className="space-y-2 bg-gray-50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl">
                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#ee0000]" />
                  Quem é o Cliente? (Briefing da Dor)
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {selectedScenario.scenario}
                </p>
              </div>

              <div className="space-y-2 bg-red-50/50 border border-red-100/40 p-4 sm:p-5 rounded-2xl sm:rounded-3xl">
                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <TargetIcon className="w-4 h-4 text-[#ee0000]" />
                  Seu Roteiro de Conversa & Objetivos
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  {selectedScenario.script}
                </p>
              </div>
            </div>

            {/* Sidebar Card */}
            <div className="bg-gray-50 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 flex flex-col justify-between space-y-4">
              <div className="space-y-3 sm:space-y-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-sm border border-gray-100">
                  {selectedScenario.character.includes("Sandra") ? '👩‍💻' : selectedScenario.character.includes("Marcos") ? '👨‍💻' : '👩‍💼'}
                </div>
                <div>
                  <h4 className="font-black text-gray-800 text-base sm:text-lg leading-tight">{selectedScenario.character}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Cliente Fictício</p>
                </div>
                <div className="space-y-1.5 text-xs text-gray-500">
                  <div className="flex justify-between border-b border-gray-100 pb-1.5">
                    <span>Tom de Voz:</span>
                    <span className="font-bold text-gray-700">{selectedScenario.difficulty === 'Avançado' ? 'Irritado/Impaciente' : selectedScenario.difficulty === 'Médio' ? 'Firme/Exigente' : 'Amigável/Receptivo'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1.5">
                    <span>Canal:</span>
                    <span className="font-bold text-gray-700">Telefone / Chat</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => speakText(`Olá, sou o seu instrutor virtual. Seu cliente de hoje é ${selectedScenario.character}. Seu cenário de dor é: ${selectedScenario.scenario}`)}
                  className="w-full py-2.5 rounded-xl border border-gray-200 hover:border-gray-400 text-gray-600 font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Ouvir Briefing
                </button>
                <button
                  onClick={handleStartSimulation}
                  className="w-full py-3 sm:py-3.5 rounded-xl bg-[#ee0000] hover:bg-[#cc0000] text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  Iniciar Simulação ⚡
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE: SIMULATION ROOM */}
      {stage === 'simulation' && selectedScenario && (
        <div className="flex flex-col md:grid md:grid-cols-3 gap-4 sm:gap-6">
          
          {/* MOBILE QUICK BAR: On small screens, quick time, persona & end button */}
          <div className="md:hidden bg-white rounded-2xl border border-gray-100 p-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">
                {selectedScenario.character.includes("Sandra") ? '👩‍💻' : selectedScenario.character.includes("Marcos") ? '👨‍💻' : '👩‍💼'}
              </span>
              <div>
                <p className="text-xs font-black text-gray-800 leading-tight">{selectedScenario.character}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                  <Clock className="w-3 h-3 text-[#ee0000] animate-pulse" />
                  <span className="font-bold text-[#ee0000]">{formatTime(timerSeconds)}</span>
                  <span>•</span>
                  <span className="capitalize">{selectedScenario.difficulty}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleMute}
                className={`p-2 rounded-xl border transition-all ${isMuted ? 'bg-red-50 text-[#ee0000] border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                title={isMuted ? "Ativar som" : "Desativar som"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={handleFinishSimulation}
                className="px-3.5 py-2 rounded-xl bg-gray-950 active:bg-[#ee0000] text-white font-black text-[10px] uppercase tracking-wider transition-all shadow-sm"
              >
                Finalizar
              </button>
            </div>
          </div>

          {/* TELEMETRY & PERSISTENT BRIEFING (Desktop: Left, Mobile: Bottom under chat) */}
          <div className="order-2 md:order-1 space-y-4">
            {/* Status Panel (Hidden on mobile since quick bar covers it) */}
            <div className="hidden md:block bg-white rounded-[32px] border border-gray-100 p-5 space-y-4">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Painel Operacional</span>
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-bold">TEMPO DE LIGAÇÃO</span>
                  <div className="flex items-center gap-1 text-[#ee0000] font-mono font-bold text-sm">
                    <Clock className="w-4 h-4 animate-pulse" />
                    {formatTime(timerSeconds)}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                  <span className="text-xs text-gray-400 font-bold">CLIENTE</span>
                  <span className="font-bold text-gray-700 text-xs">{selectedScenario.character}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                  <span className="text-xs text-gray-400 font-bold">DIFICULDADE</span>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border rounded-full ${getDifficultyStyles(selectedScenario.difficulty)}`}>
                    {selectedScenario.difficulty}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                  <span className="text-xs text-gray-400 font-bold">RESPOSTAS AUDITIVAS</span>
                  <button 
                    onClick={toggleMute}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${isMuted ? 'bg-red-50 text-[#ee0000] border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                    title={isMuted ? "Ativar som do cliente" : "Mudar som do cliente"}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Sticky Briefing */}
            <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-gray-100 p-4 sm:p-5 space-y-2.5 sm:space-y-3">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Lembrete do Briefing</span>
              <div className="space-y-2">
                <p className="text-xs text-gray-500 leading-relaxed font-semibold">Dor do Cliente:</p>
                <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3 italic">
                  "{selectedScenario.scenario}"
                </p>
                <div className="border-t border-gray-50 pt-2 mt-2">
                  <p className="text-xs text-gray-500 leading-relaxed font-semibold">Seu Objetivo Principal:</p>
                  <p className="text-[11px] text-gray-600 font-bold leading-relaxed">
                    {selectedScenario.script}
                  </p>
                </div>
              </div>
            </div>

            {/* End Call Button (Desktop) */}
            <button
              onClick={handleFinishSimulation}
              className="hidden md:flex w-full py-4 rounded-[20px] bg-gray-950 hover:bg-[#ee0000] text-white hover:text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-md hover:shadow-lg cursor-pointer items-center justify-center gap-2 group"
            >
              <Activity className="w-4 h-4 animate-pulse text-red-500 group-hover:text-white" />
              Finalizar Atendimento & Avaliar
            </button>
          </div>

          {/* INTERACTIVE CHAT SCREEN: order-1 on mobile */}
          <div className="order-1 md:order-2 md:col-span-2 bg-gray-50 rounded-[24px] sm:rounded-[32px] border border-gray-100 overflow-hidden flex flex-col h-[56vh] sm:h-[520px] min-h-[400px]">
            {/* Chat Area Header */}
            <div className="bg-white p-3 sm:p-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 text-base sm:text-lg shadow-inner">
                {selectedScenario.character.includes("Sandra") ? '👩‍💻' : selectedScenario.character.includes("Marcos") ? '👨‍💻' : '👩‍💼'}
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-gray-800">{selectedScenario.character}</h4>
                <p className="text-[9px] text-[#ee0000] font-black uppercase tracking-widest animate-pulse">Em Atendimento...</p>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex ${msg.role === 'agent' ? 'justify-end' : 'justify-start'} animate-slideUpFade`}
                >
                  <div className={`max-w-[80%] rounded-[24px] p-4 text-xs leading-relaxed shadow-sm ${
                    msg.role === 'agent' 
                      ? 'bg-gray-900 text-white rounded-br-none font-medium' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 rounded-[24px] rounded-bl-none p-4 text-xs flex items-center gap-1.5 shadow-sm">
                    <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">{selectedScenario.character} está respondendo</span>
                    <span className="flex space-x-1">
                      <span className="w-1.5 h-1.5 bg-[#ee0000] rounded-full animate-bounce delay-100"></span>
                      <span className="w-1.5 h-1.5 bg-[#ee0000] rounded-full animate-bounce delay-200"></span>
                      <span className="w-1.5 h-1.5 bg-[#ee0000] rounded-full animate-bounce delay-300"></span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form with Speech Recognition integrated */}
            <form onSubmit={handleSendMessage} className="bg-white p-3 border-t border-gray-100 flex items-center gap-2">
              <input 
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Fale com o cliente ou digite aqui..."
                disabled={isSending}
                className="flex-1 bg-gray-50 border border-transparent focus:border-red-100 rounded-2xl px-4 py-3 text-xs text-gray-800 font-medium focus:outline-none"
              />

              {/* Speech-to-Text Button */}
              <button
                type="button"
                onClick={startSpeechRecognition}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer border ${
                  isRecording 
                    ? 'bg-red-500 border-red-600 text-white animate-pulse' 
                    : 'bg-gray-50 border-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
                title={isRecording ? "Parar Gravação" : "Falar no Microfone"}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                type="submit"
                disabled={!userInput.trim() || isSending}
                className="w-11 h-11 rounded-2xl bg-[#ee0000] disabled:bg-gray-100 hover:bg-[#cc0000] text-white disabled:text-gray-400 flex items-center justify-center shadow-md hover:shadow-lg disabled:shadow-none transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STAGE: LOADING AVALIAÇÃO */}
      {stage === 'loading' && (
        <div className="bg-white rounded-[40px] border border-gray-100 p-12 text-center flex flex-col items-center justify-center min-h-[400px] space-y-8 animate-fadeIn">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-red-50 border-t-[#ee0000] rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="w-8 h-8 text-[#ee0000] animate-pulse" />
            </div>
          </div>
          <div className="space-y-3 max-w-sm">
            <h3 className="text-xs font-black text-[#ee0000] uppercase tracking-[0.3em]">Coach de Performance I.A</h3>
            <p className="text-gray-800 font-black text-lg leading-snug animate-pulse">{loadingStep}</p>
            <p className="text-xs text-gray-400">Nosso modelo de linguagem avançado está quantificando e qualificando seus argumentos.</p>
          </div>
        </div>
      )}

      {/* STAGE: EVALUATION REPORT */}
      {stage === 'evaluation' && evalResult && selectedScenario && (
        <div className="space-y-4 sm:space-y-6">
          {/* Top Score Banner */}
          <div className="bg-white rounded-[24px] sm:rounded-[40px] border border-gray-100 p-4 sm:p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-1.5 sm:space-y-2 flex-1 text-center md:text-left">
              <span className="text-[9px] bg-red-100 text-[#ee0000] px-3 py-1 rounded-full font-black uppercase tracking-widest inline-block">
                Relatório de Desempenho Concluído
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight leading-tight mt-1">Sua Pontuação Global</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Resultado do atendimento simulado com <strong>{selectedScenario.character}</strong> no dia de hoje.
              </p>
            </div>

            {/* Score Ring / Typographic Score */}
            <div className="flex items-center gap-3 sm:gap-4 bg-gray-50 border border-gray-100/60 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shrink-0">
              <div className="text-center">
                <div className={`text-4xl sm:text-5xl font-black font-mono tracking-tighter ${getScoreColor(evalResult.score)}`}>
                  {evalResult.score}
                </div>
                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Pontos de 100</div>
              </div>
              <div className="w-px h-10 sm:h-12 bg-gray-200"></div>
              <div className="text-xs font-bold text-gray-600">
                {evalResult.score >= 90 ? '🏆 Alta Excelência' : evalResult.score >= 70 ? '👍 Aprovado Claro' : '⚠️ Precisa Praticar'}
              </div>
            </div>
          </div>

          {/* Grid of KPIs / Bento Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            
            {/* KPI Metrics */}
            <div className="md:col-span-2 bg-white rounded-[24px] sm:rounded-[40px] border border-gray-100 p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between border-b border-gray-50 pb-3 sm:pb-4">
                <div>
                  <h4 className="font-black text-gray-800 text-xs sm:text-sm uppercase tracking-wider">Métricas e Indicadores Corporativos</h4>
                  <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase">Competências Pedagógicas Analisadas</p>
                </div>
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#ee0000]" />
              </div>

              {/* Progress Bars */}
              <div className="space-y-3.5 sm:space-y-4">
                <MetricBar label="Assertividade" value={evalResult.assertiveness} description="Foco na solução da queixa, rapidez e sem rodeios." />
                <MetricBar label="Empatia & Rapport" value={evalResult.empathy} description="Cordialidade inicial, acolhimento das queixas e tom amigável." />
                <MetricBar label="Clareza de Comunicação" value={evalResult.communication} description="Fluidez de fala, dicção conceitual e vocabulário assertivo." />
                <MetricBar label="Conhecimento Técnico" value={evalResult.technical} description="Explicou a taxa de upload de 50% e estabilidade da fibra óptica." />
                <MetricBar label="Persuasão Comercial" value={evalResult.persuasion} description="Habilidade em superar as objeções de preço e de prazo do cliente." />
              </div>
            </div>

            {/* Coach Executive Summary */}
            <div className="bg-gray-950 text-white rounded-[24px] sm:rounded-[40px] p-5 sm:p-6 md:p-8 flex flex-col justify-between space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[9px] text-green-400 font-black uppercase tracking-widest">Feedback do Coach I.A</span>
                </div>
                <h4 className="text-base sm:text-lg font-black tracking-tight leading-snug">Resumo Diagnóstico</h4>
                <div className="text-gray-300 text-xs leading-relaxed space-y-2.5 sm:space-y-3.5 font-medium">
                  {evalResult.summary.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>

              {evalMode === 'offline' && (
                <div className="bg-white/10 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-[9px] text-gray-300 font-black uppercase tracking-wider text-center">
                  Avaliação Offline de Segurança
                </div>
              )}
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Strengths */}
            <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-gray-100 p-4 sm:p-6 md:p-8 space-y-3 sm:space-y-4">
              <h4 className="font-black text-green-600 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                Pontos Fortes Demonstrados
              </h4>
              <ul className="space-y-2.5 sm:space-y-3">
                {evalResult.strengths.map((st, i) => (
                  <li key={i} className="flex gap-2 text-xs text-gray-600 leading-relaxed align-top">
                    <span className="text-green-500 font-black">•</span>
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Opportunities to Improve */}
            <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-gray-100 p-4 sm:p-6 md:p-8 space-y-3 sm:space-y-4">
              <h4 className="font-black text-[#ee0000] text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-[#ee0000]" />
                Oportunidades de Melhoria
              </h4>
              <ul className="space-y-2.5 sm:space-y-3">
                {evalResult.improvements.map((im, i) => (
                  <li key={i} className="flex gap-2 text-xs text-gray-600 leading-relaxed align-top">
                    <span className="text-[#ee0000] font-black">•</span>
                    <span>{im}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Step / PDI */}
          <div className="bg-gradient-to-r from-red-50 to-white border border-red-100/50 p-4 sm:p-6 md:p-8 rounded-[24px] sm:rounded-[40px] flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-sm">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#ee0000] text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
              <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div className="space-y-1 flex-1 text-center sm:text-left">
              <span className="text-[9px] font-black text-[#ee0000] uppercase tracking-widest">Plano de Desenvolvimento Individual (PDI)</span>
              <h4 className="font-black text-gray-800 text-xs sm:text-sm uppercase tracking-wider leading-none">Próximo Passo Recomendado</h4>
              <p className="text-xs text-gray-600 leading-relaxed mt-1 font-medium italic">
                "{evalResult.nextSteps}"
              </p>
            </div>
          </div>

          {/* Return & Retry Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 sm:gap-3.5 pt-2">
            <button
              onClick={handleRestartScenario}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-gray-200 hover:border-gray-400 text-gray-700 font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-white shadow-sm active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              Treinar Novamente
            </button>
            <button
              onClick={onBack}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#ee0000] hover:bg-[#cc0000] text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center active:scale-95"
            >
              Voltar ao Portal Geral
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

// Sub-Component for Metric Progress Bars
interface MetricBarProps {
  label: string;
  value: number;
  description: string;
}

const MetricBar: React.FC<MetricBarProps> = ({ label, value, description }) => {
  const getBarColor = (val: number) => {
    if (val >= 90) return 'bg-green-500';
    if (val >= 70) return 'bg-[#ee0000]';
    return 'bg-amber-500';
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <div>
          <span className="font-black text-gray-800 uppercase tracking-wider text-[11px]">{label}</span>
          <p className="text-[10px] text-gray-400 leading-none mt-0.5">{description}</p>
        </div>
        <span className="font-mono font-black text-[#ee0000] text-sm bg-red-50/50 px-2.5 py-1 rounded-xl">{value}%</span>
      </div>
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${getBarColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

// TargetIcon custom standard React SVG
const TargetIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);
