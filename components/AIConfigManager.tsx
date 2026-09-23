import React, { useState, useEffect } from 'react';
import { DB } from '../db';
import { AIConfig } from '../types';
import { Sparkles, Sliders, Brain, FileText, Check } from 'lucide-react';

export const AIConfigManager: React.FC = () => {
  const [config, setConfig] = useState<AIConfig>({
    id: 'default',
    evaluationModel: 'gemini-3.6-flash',
    evaluationSystemInstruction: '',
    simulatorModel: 'gemini-3.6-flash',
    simulatorSystemInstruction: '',
    temperature: 0.7,
    simulatorEnabled: false
  });
  const [savedStatus, setSavedStatus] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const loaded = DB.aiConfig.get();
    setConfig(loaded);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await DB.aiConfig.save(config);
      setSavedStatus(true);
      setTimeout(() => setSavedStatus(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar as configurações de IA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#ee0000]" />
            Configuração da Inteligência Artificial
          </h3>
          <p className="text-xs text-gray-400 font-bold uppercase mt-0.5">Gerencie os modelos e as diretrizes de cognição do sistema</p>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md flex items-center gap-2 ${
            savedStatus 
              ? 'bg-green-600 text-white shadow-green-100' 
              : 'claro-red text-white hover:bg-red-700 active:scale-95'
          }`}
        >
          {savedStatus ? (
            <>
              <Check className="h-4 w-4 animate-ping" />
              Salvo com Sucesso!
            </>
          ) : (
            <>
              ⚙️ Salvar Configurações
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bloco 1: Avaliador de Vídeos */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-[#ee0000]">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-black text-gray-800 text-sm uppercase">Avaliação de Vídeos</h4>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Módulo de Treinamento Consultivo</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Modelo do Gemini</label>
              <select
                value={config.evaluationModel}
                onChange={e => setConfig({ ...config, evaluationModel: e.target.value })}
                className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none text-sm font-bold text-gray-700"
              >
                <option value="gemini-3.6-flash">Gemini 3.6 Flash (Mais rápido e estável - Recomendado)</option>
                <option value="gemini-flash-latest">Gemini Flash (Padrão)</option>
                <option value="gemini-3.5-flash">Gemini 3.5 Flash (Equilibrado)</option>
                <option value="gemini-3.8-flash">Gemini 3.8 Flash (Nova geração)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Instruções do Sistema de Avaliação
              </label>
              <textarea
                rows={6}
                value={config.evaluationSystemInstruction}
                onChange={e => setConfig({ ...config, evaluationSystemInstruction: e.target.value })}
                placeholder="Instruções fornecidas para moldar o comportamento e rigor técnico do avaliador..."
                className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none text-xs font-semibold text-gray-600 leading-relaxed"
              />
              <p className="text-[9px] text-gray-400 mt-1 leading-snug">
                Estas diretrizes orientam o Gemini sobre o tom profissional, critérios técnicos e formatação do feedback enviado ao colaborador.
              </p>
            </div>
          </div>
        </div>

        {/* Bloco 2: Simulador I.A Cliente */}
        <div className={`bg-white p-6 rounded-3xl border shadow-sm space-y-4 transition-all ${config.simulatorEnabled ? 'border-blue-200' : 'border-amber-200 bg-amber-50/10'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.simulatorEnabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-black text-gray-800 text-sm uppercase">Simulador I.A Cliente</h4>
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Módulo de Diálogos por Voz/Texto</p>
              </div>
            </div>

            {/* Controle do Status do Módulo */}
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100 self-start sm:self-center">
              <span className="text-[10px] font-black uppercase text-gray-500 ml-1">Status:</span>
              <button
                type="button"
                onClick={() => setConfig({ ...config, simulatorEnabled: !config.simulatorEnabled })}
                className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm ${
                  config.simulatorEnabled
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${config.simulatorEnabled ? 'bg-white animate-pulse' : 'bg-white/80'}`}></span>
                {config.simulatorEnabled ? 'Ativo' : 'Desativado'}
              </button>
            </div>
          </div>

          <p className="text-xs font-medium text-gray-500 leading-relaxed">
            {config.simulatorEnabled ? (
              <span className="text-green-700 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                O Simulador I.A está <strong>ATIVO</strong> e visível para colaboradores na tela inicial.
              </span>
            ) : (
              <span className="text-amber-800 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                O Simulador I.A está <strong>DESATIVADO</strong>. Os colaboradores não conseguirão acessar este treinamento até a reativação.
              </span>
            )}
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Modelo do Gemini</label>
              <select
                value={config.simulatorModel}
                onChange={e => setConfig({ ...config, simulatorModel: e.target.value })}
                className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none text-sm font-bold text-gray-700"
              >
                <option value="gemini-3.6-flash">Gemini 3.6 Flash (Mais rápido e estável - Recomendado)</option>
                <option value="gemini-flash-latest">Gemini Flash (Padrão)</option>
                <option value="gemini-3.5-flash">Gemini 3.5 Flash (Equilibrado)</option>
                <option value="gemini-3.8-flash">Gemini 3.8 Flash (Nova geração)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Instruções do Sistema do Simulador
              </label>
              <textarea
                rows={6}
                value={config.simulatorSystemInstruction}
                onChange={e => setConfig({ ...config, simulatorSystemInstruction: e.target.value })}
                placeholder="Diretrizes gerais para as simulações de diálogos de personas..."
                className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none text-xs font-semibold text-gray-600 leading-relaxed"
              />
              <p className="text-[9px] text-gray-400 mt-1 leading-snug">
                Estas instruções orientam o cliente simulado a adotar a linguagem adequada, simular objeções pertinentes e manter o diálogo curto.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bloco 3: Parâmetros de Criatividade / Temperatura */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
          <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-black text-gray-800 text-sm uppercase">Parâmetros de Geração (Temperatura)</h4>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Criatividade vs Rigidez</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full space-y-2">
            <div className="flex justify-between items-center text-xs font-black uppercase text-gray-500">
              <span>Rígido / Determinístico</span>
              <span className="text-[#ee0000] text-sm font-black">{config.temperature.toFixed(1)}</span>
              <span>Criativo / Imprevisível</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={config.temperature}
              onChange={e => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#ee0000]"
            />
          </div>
          <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
            Temperaturas baixas (ex: <strong>0.2</strong>) geram respostas consistentes e exatas, ideais para o avaliador. Temperaturas altas (ex: <strong>0.8</strong>) proporcionam simulações de diálogos mais naturais e ricas em improviso.
          </p>
        </div>
      </div>
    </form>
  );
};
