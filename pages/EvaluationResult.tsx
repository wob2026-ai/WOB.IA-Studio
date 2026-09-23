import React, { useState, useEffect, useRef } from 'react';
import { EvaluationResult as EvalType } from '../services/geminiService';
import { EvalMode, User } from '../types';
import { TrendingUp, Award, ArrowRight, CheckCircle2, Sparkles, Volume2, VolumeX, RotateCcw, ThumbsUp, AlertCircle, Mic, AlertTriangle } from 'lucide-react';

interface ResultProps {
  result: EvalType;
  mode: EvalMode;
  onNextStep?: () => void;
  onFinish: () => void;
  onDelete?: () => void;
  onRetry?: () => void;
  previousResult?: EvalType | null;
  evalId?: string;
  user?: User | null;
}

export const EvaluationResult: React.FC<ResultProps> = ({ 
  result, 
  mode, 
  onNextStep, 
  onFinish, 
  onDelete, 
  onRetry,
  previousResult, 
  evalId, 
  user 
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const handleSpeak = () => {
    if (!synthRef.current) return;

    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `
      Aqui está a sua avaliação da inteligência artificial.
      Sua nota foi ${result.score.toFixed(1)}.
      Pontos fortes: ${result.strengths}.
      Oportunidades de melhoria: ${result.weaknesses}.
      Sugestão técnica: ${result.suggestions}.
    `;

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'pt-BR';
    
    const voices = synthRef.current.getVoices();
    const ptVoice = voices.find(v => v.lang.includes('pt-BR') || v.lang.includes('pt_BR'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    setIsSpeaking(true);
    synthRef.current.speak(utterance);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-600';
    if (score >= 6) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 6) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const isKnowledgeStage = mode === 'knowledge';
  const isScriptStage = mode === 'script';
  const evolution = previousResult ? (result.score - previousResult.score) : 0;
  const evolutionPercent = previousResult && previousResult.score > 0 
    ? Math.round(((result.score - previousResult.score) / previousResult.score) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-4xl mx-auto px-3 sm:px-4">
      {/* Top Stage Indicator Breadcrumb */}
      <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
            isKnowledgeStage ? 'bg-orange-500 text-white' : 'bg-green-600 text-white'
          }`}>
            {isKnowledgeStage ? '1/2' : '2/2'}
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
              {isKnowledgeStage ? 'Etapa 1 Concluída' : 'Etapa 2 Concluída (Final)'}
            </span>
            <h3 className="text-xs sm:text-sm font-black text-gray-800 uppercase tracking-tight">
              {isKnowledgeStage ? 'Desafio Conhecimento (Sem Roteiro)' : 'Desafio com Roteiro (Teleprompter)'}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isKnowledgeStage ? (
            <span className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-[10px] font-black uppercase tracking-wider">
              1ª Etapa: Espontânea
            </span>
          ) : (
            <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> 2ª Etapa: Roteirizada
            </span>
          )}
        </div>
      </div>

      {/* PAINEL COMPARATIVO DE EVOLUÇÃO (Exibido na 2ª etapa quando há resultado anterior) */}
      {isScriptStage && previousResult && (
        <div className="bg-gradient-to-br from-gray-900 via-gray-850 to-gray-950 text-white p-6 sm:p-7 rounded-[32px] shadow-xl border border-gray-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-left w-full md:w-auto">
              <div className={`p-4 rounded-2xl flex items-center justify-center shadow-lg ${
                evolution >= 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                <TrendingUp className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black tracking-widest uppercase bg-white/10 px-2.5 py-0.5 rounded-full text-white/80">
                    Evolução Pedagógica
                  </span>
                  {evolution >= 0 && (
                    <span className="text-[10px] font-black tracking-widest uppercase text-emerald-400">
                      +{evolutionPercent}%
                    </span>
                  )}
                </div>
                <h4 className="text-xl sm:text-2xl font-black mt-1 text-white">
                  Comparativo entre os Desafios
                </h4>
                <p className="text-xs text-gray-300 font-medium leading-tight mt-0.5">
                  {evolution >= 0
                    ? 'O uso do roteiro elevou a precisão técnica e a assertividade da sua explicação.'
                    : 'Revise os termos técnicos recomendados para atingir o padrão ouro Claro.'}
                </p>
              </div>
            </div>

            {/* Score comparison badges */}
            <div className="flex items-center gap-3 sm:gap-4 bg-white/5 border border-white/10 p-3 sm:p-4 rounded-2xl w-full md:w-auto justify-center">
              <div className="text-center px-2">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">1ª Sem Roteiro</p>
                <p className="text-2xl font-black text-gray-300 mt-0.5">{previousResult.score.toFixed(1)}</p>
                <span className="text-[8px] text-gray-500 font-bold uppercase">Conhecimento</span>
              </div>

              <div className="flex flex-col items-center justify-center px-1">
                <ArrowRight className="h-5 w-5 text-red-500" />
                <span className={`text-[10px] font-black mt-0.5 ${evolution >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {evolution > 0 ? `+${evolution.toFixed(1)}` : evolution.toFixed(1)}
                </span>
              </div>

              <div className="text-center px-2 bg-red-500/10 border border-red-500/30 rounded-xl p-2">
                <p className="text-[9px] font-black text-red-300 uppercase tracking-widest">2ª Com Roteiro</p>
                <p className="text-2xl font-black text-white mt-0.5">{result.score.toFixed(1)}</p>
                <span className="text-[8px] text-red-300 font-bold uppercase">Teleprompter</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Score Card */}
      <div className="bg-white p-7 sm:p-8 rounded-[32px] shadow-sm border border-gray-100 text-center relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${getScoreBg(result.score)}`}>
            {isKnowledgeStage ? 'Desafio Conhecimento' : 'Desafio com Roteiro'}
          </span>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
            Avaliação IA Vision
          </span>
        </div>

        <p className="text-xs text-gray-400 uppercase font-black tracking-widest mb-1">Nota Desta Etapa</p>
        <div className={`text-6xl sm:text-7xl font-black mb-4 tracking-tighter ${getScoreColor(result.score)}`}>
          {result.score.toFixed(1)}
          <span className="text-2xl text-gray-300 font-bold ml-1">/10</span>
        </div>

        {/* Visual score bar */}
        <div className="flex justify-center max-w-xs mx-auto gap-1 mb-6">
          {[...Array(10)].map((_, i) => (
            <div 
              key={i} 
              className={`h-2 flex-1 rounded-full transition-all ${
                i < Math.round(result.score) ? 'bg-[#ee0000]' : 'bg-gray-100'
              }`}
            />
          ))}
        </div>

        {/* ALERTA DE NOTA ZERO: Se falou nada com nada ou não explicou ao cliente */}
        {result.score === 0 && (
          <div className="bg-red-50 border-2 border-red-500 rounded-3xl p-5 mb-5 text-left space-y-2 animate-shake">
            <div className="flex items-center gap-2 text-red-600 font-black text-sm uppercase">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>Atenção: Explicação Ausente ou Desconexa (Nota 0.0)</span>
            </div>
            <p className="text-xs text-red-800 leading-relaxed font-medium">
              A inteligência artificial avaliou o áudio da gravação e identificou que <strong>não houve explicação do produto ou a fala foi desconexa ("nada com nada")</strong>. Para receber pontuação e aprovação no Explica+, é obrigatório apresentar os diferenciais e tirar a dúvida do cliente com clareza.
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Gravar Novamente Este Cenário
              </button>
            )}
          </div>
        )}

        {/* Audio feedback button */}
        <div className="flex justify-center">
          <button
            onClick={handleSpeak}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              isSpeaking
                ? 'bg-red-50 text-[#ee0000] border-2 border-[#ee0000] animate-pulse shadow-md'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="h-4 w-4" />
                Parar de Ouvir
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 text-[#ee0000]" />
                Ouvir Feedback da IA por Voz
              </>
            )}
          </button>
        </div>
      </div>

      {/* SEÇÃO DE TRANSCRIÇÃO REAL DO ÁUDIO */}
      <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-200 shadow-sm space-y-3 text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-800">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-[#ee0000] flex items-center justify-center">
              <Mic className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-black text-xs uppercase tracking-wider">Transcrição do que Você Falou</h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Áudio analisado pela esteira de IA Claro</p>
            </div>
          </div>
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${
            result.score === 0 
              ? 'bg-red-50 text-red-600 border-red-200' 
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {result.score === 0 ? 'Sem Conteúdo Técnico' : 'Transcrição Fiel'}
          </span>
        </div>

        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150">
          <p className="font-sans text-xs sm:text-sm text-gray-800 leading-relaxed italic">
            "{result.transcript || 'Nenhuma fala transcrita no vídeo.'}"
          </p>
        </div>
      </div>

      {/* Feedback Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 sm:p-6 rounded-[24px] border-l-4 border-emerald-500 shadow-sm space-y-2 text-left">
          <div className="flex items-center gap-2 text-emerald-700">
            <ThumbsUp className="h-4 w-4" />
            <h4 className="font-black text-xs uppercase tracking-wider">Pontos Fortes</h4>
          </div>
          <p className="text-gray-700 text-xs sm:text-sm font-medium leading-relaxed">{result.strengths}</p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-[24px] border-l-4 border-amber-500 shadow-sm space-y-2 text-left">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="h-4 w-4" />
            <h4 className="font-black text-xs uppercase tracking-wider">Oportunidades de Melhoria</h4>
          </div>
          <p className="text-gray-700 text-xs sm:text-sm font-medium leading-relaxed">{result.weaknesses}</p>
        </div>
      </div>

      {/* Technical Suggestion */}
      <div className="bg-white p-5 sm:p-6 rounded-[24px] border-l-4 border-blue-500 shadow-sm space-y-2 text-left">
        <div className="flex items-center gap-2 text-blue-700">
          <Sparkles className="h-4 w-4" />
          <h4 className="font-black text-xs uppercase tracking-wider">Sugestão Técnica do Especialista Claro</h4>
        </div>
        <p className="text-gray-700 text-xs sm:text-sm font-medium leading-relaxed">{result.suggestions}</p>
      </div>

      {/* ACTION BUTTONS BASED ON STAGE */}
      <div className="pt-4 space-y-3">
        {isKnowledgeStage && onNextStep ? (
          /* PROMINENT CTA TO ADVANCE TO STEP 2 */
          <div className="bg-gradient-to-r from-red-600 to-[#ee0000] p-6 rounded-[28px] text-white shadow-xl text-center space-y-4 animate-scaleUp">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full inline-block">
                Próximo Passo
              </span>
              <h4 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                Avançar para a 2ª Etapa: Desafio com Roteiro
              </h4>
              <p className="text-xs text-white/90 font-medium max-w-lg mx-auto leading-relaxed">
                Agora grave o mesmo cenário utilizando o <strong>Teleprompter Integrado</strong>. Ao final, a IA medirá sua evolução técnica e didática!
              </p>
            </div>

            <button
              onClick={onNextStep}
              className="w-full py-4 bg-white hover:bg-gray-100 text-red-600 font-black text-xs uppercase tracking-widest rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>INICIAR DESAFIO COM ROTEIRO</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* FINAL FINISH BUTTON FOR STAGE 2 */
          <div className="flex flex-col gap-2.5">
            <button 
              onClick={onFinish} 
              className="w-full bg-[#ee0000] hover:bg-red-700 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>CONCLUIR TREINAMENTO & SALVAR EVOLUÇÃO</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-between px-2 pt-1">
          <button 
            onClick={onFinish} 
            className="text-gray-400 hover:text-gray-600 font-bold text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
          >
            Voltar ao Dashboard
          </button>

          {onDelete && (
            <button 
              onClick={onDelete} 
              className="text-red-400 hover:text-red-600 font-bold text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
            >
              Descartar esta avaliação
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
