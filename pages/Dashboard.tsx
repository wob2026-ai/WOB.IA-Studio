
import React, { useMemo, useState } from 'react';
import { User, Evaluation } from '../types';
import { DB } from '../db';
import { QuickTipsCarousel } from '../components/QuickTipsCarousel';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';

interface DashboardProps {
  user: User;
  onNavigate: (page: string) => void;
  onUpdateUser?: (updatedUser: User) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate, onUpdateUser }) => {
  const evaluations = useMemo(() => DB.evaluations.all(), []);
  const aiConfig = useMemo(() => DB.aiConfig.get(), []);

  const isSimplified = user.role === 'tech' || user.role === 'commercial';
  const isAdmin = user.role === 'admin' || user.role === 'superadmin';

  // Chart Data: Performance Evolution over time (Used for Admin / Full view)
  const performanceEvolutionData = useMemo(() => {
    if (isSimplified) return [];

    const targetEvals = user.role === 'tech'
      ? evaluations.filter(ev => ev.userId === user.id)
      : evaluations;

    // Sort chronologically
    const sorted = [...targetEvals].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return sorted.map((ev, index) => {
      const date = new Date(ev.timestamp);
      const formattedDate = date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      return {
        name: `Simulação ${index + 1}`,
        dataStr: formattedDate,
        nota: Number(ev.score.toFixed(1)),
        mode: ev.evalMode === 'script' ? 'Com Roteiro' : 'Sem Roteiro',
        colaborador: ev.userName
      };
    });
  }, [evaluations, user, isSimplified]);

  // Chart Data: Score Distribution (Used for Admin)
  const distributionData = useMemo(() => {
    if (!isAdmin) return [];

    const buckets = [
      { name: '0-5', count: 0, color: '#EF4444' },
      { name: '5-7', count: 0, color: '#F59E0B' },
      { name: '7-9', count: 0, color: '#10B981' },
      { name: '9-10', count: 0, color: '#059669' }
    ];

    evaluations.forEach(ev => {
      if (ev.score < 5) buckets[0].count++;
      else if (ev.score < 7) buckets[1].count++;
      else if (ev.score < 9) buckets[2].count++;
      else buckets[3].count++;
    });

    return buckets;
  }, [evaluations, isAdmin]);

  // VISÃO SIMPLIFICADA PARA PERFIS TÉCNICO E COMERCIAL
  if (isSimplified) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-fadeIn max-w-3xl mx-auto py-2 sm:py-4">
        {/* Seção de Boas-vindas Básica */}
        <div className="bg-white p-5 sm:p-7 md:p-8 rounded-[24px] sm:rounded-[36px] shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-[#ee0000] text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] mb-1">
              Bem-vindo ao Portal
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-800 tracking-tight leading-tight">
              Olá, {user.name.split(' ')[0]}!
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-400 mt-1 uppercase font-bold tracking-wider">
              {user.role === 'commercial' ? 'Consultor Comercial' : 'Consultor Técnico'}
            </p>
          </div>
          <div className="bg-red-50 text-[#ee0000] px-4 py-2 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black border border-red-100 text-center uppercase tracking-widest self-start sm:self-auto">
            {user.city ? `${user.city} / ${user.uf}` : 'Claro Brasil'}
          </div>
        </div>

        {/* Card Principal: Treinamento Consultivo */}
        <div className="bg-white p-6 sm:p-8 md:p-10 rounded-[28px] sm:rounded-[40px] shadow-sm border-2 border-red-100/60 hover:border-red-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border border-green-200">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Disponível
              </span>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Prática Multimodal
              </span>
            </div>

            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black claro-text-red tracking-tight mb-2">
                  Treinamento Consultivo
                </h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  Pratique sua abordagem com situações reais do dia a dia da Claro. Grave sua explicação em vídeo e receba avaliação imediata com feedback personalizado da Inteligência Artificial.
                </p>
              </div>
              <div className="hidden sm:flex w-16 h-16 rounded-3xl bg-red-50 items-center justify-center text-[#ee0000] shrink-0 border border-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 my-5 sm:my-6">
              <div className="bg-gray-50/80 p-3 sm:p-3.5 rounded-2xl border border-gray-100 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">🎯</span>
                  <p className="text-xs font-black text-gray-800 uppercase tracking-tight">Cenários Reais</p>
                </div>
                <p className="text-[11px] text-gray-500 leading-tight">Casos práticos de clientes e produtos Claro</p>
              </div>

              <div className="bg-gray-50/80 p-3 sm:p-3.5 rounded-2xl border border-gray-100 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">📹</span>
                  <p className="text-xs font-black text-gray-800 uppercase tracking-tight">Vídeo & Voz</p>
                </div>
                <p className="text-[11px] text-gray-500 leading-tight">Grave sua explicação na câmera ou microfone</p>
              </div>

              <div className="bg-gray-50/80 p-3 sm:p-3.5 rounded-2xl border border-gray-100 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">✨</span>
                  <p className="text-xs font-black text-gray-800 uppercase tracking-tight">Feedback I.A</p>
                </div>
                <p className="text-[11px] text-gray-500 leading-tight">Análise de dicção, postura e argumentos</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('consultivo')}
            className="w-full py-4 sm:py-5 px-6 claro-red hover:bg-red-700 text-white font-black text-sm sm:text-base rounded-2xl sm:rounded-full uppercase tracking-widest shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.01] active:scale-95 cursor-pointer flex items-center justify-center gap-3 mt-2"
          >
            <span>Iniciar Treinamento Consultivo</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // VISÃO COMPLETA PARA ADMINISTRADORES E GESTORES
  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-fadeIn px-1 sm:px-0">
      {/* Seção de Boas-vindas Simplificada */}
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-[24px] sm:rounded-[36px] md:rounded-[40px] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <p className="text-[#ee0000] text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-0.5 sm:mb-1">Bem-vindo ao Portal</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-800 tracking-tight leading-tight">Olá, {user.name.split(' ')[0]}!</h2>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 uppercase font-bold tracking-widest">
            {user.role === 'superadmin' ? 'Super Administrador' : user.role === 'admin' ? 'Gestor Regional' : user.role === 'commercial' ? 'Consultor Comercial' : 'Consultor Técnico'}
          </p>
        </div>
        <div className="bg-red-50 text-[#ee0000] px-3.5 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black border border-red-100 text-center uppercase tracking-widest self-start md:self-auto">
          {user.city} / {user.uf}
        </div>
      </div>

      {/* Cards de Menu - Responsivos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        <button 
          onClick={() => onNavigate('consultivo')}
          className="group p-4 sm:p-6 md:p-8 bg-white border-2 border-transparent hover:claro-border-red rounded-[24px] sm:rounded-[36px] md:rounded-[40px] shadow-sm transition-all text-left flex items-center justify-between hover:shadow-xl active:scale-[0.98]"
        >
          <div className="flex-1 pr-2">
            <h3 className="text-lg sm:text-xl md:text-2xl font-black claro-text-red mb-1 sm:mb-2">Treinamento Consultivo</h3>
            <p className="text-gray-500 text-xs sm:text-sm md:text-base leading-snug">Pratique sua abordagem e receba feedback imediato da IA.</p>
            <div className="mt-3 sm:mt-4 flex items-center gap-1.5 sm:gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[9px] sm:text-[10px] font-black text-green-600 uppercase tracking-widest">Disponível</span>
            </div>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-red-50 flex items-center justify-center text-[#ee0000] group-hover:bg-[#ee0000] group-hover:text-white transition-all shadow-inner ml-2 sm:ml-4 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            </svg>
          </div>
        </button>

        {aiConfig.simulatorEnabled ? (
          <button 
            onClick={() => onNavigate('simulator')}
            className="group p-4 sm:p-6 md:p-8 bg-white border-2 border-transparent hover:claro-border-red rounded-[24px] sm:rounded-[36px] md:rounded-[40px] shadow-sm transition-all text-left flex items-center justify-between hover:shadow-xl active:scale-[0.98]"
          >
            <div className="flex-1 pr-2">
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-gray-800 group-hover:claro-text-red transition-colors mb-1 sm:mb-2">Simulador I.A Cliente</h3>
              <p className="text-gray-500 text-xs sm:text-sm md:text-base leading-snug">Simule diálogos por voz ou texto e receba diagnósticos do Coach I.A.</p>
              <div className="mt-3 sm:mt-4 flex items-center gap-1.5 sm:gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-[9px] sm:text-[10px] text-[#ee0000] font-black uppercase tracking-widest">Novo Recurso</span>
              </div>
            </div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-red-50 flex items-center justify-center text-[#ee0000] group-hover:bg-[#ee0000] group-hover:text-white transition-all shadow-inner ml-2 sm:ml-4 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
          </button>
        ) : isAdmin ? (
          <button 
            onClick={() => onNavigate('admin')}
            className="group p-4 sm:p-6 md:p-8 bg-amber-50/40 border-2 border-dashed border-amber-200 hover:border-amber-400 rounded-[24px] sm:rounded-[36px] md:rounded-[40px] shadow-sm transition-all text-left flex items-center justify-between active:scale-[0.98]"
          >
            <div className="flex-1 pr-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-black uppercase rounded-full tracking-wider">Desativado</span>
                <span className="text-[9px] text-amber-700 font-bold uppercase tracking-wider">Apenas Admin</span>
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-gray-700 mb-1 sm:mb-2">Simulador I.A Cliente</h3>
              <p className="text-gray-500 text-xs sm:text-sm md:text-base leading-snug">Módulo atualmente desativado. Clique para ativar no Painel de Gestão.</p>
            </div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 ml-2 sm:ml-4 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </button>
        ) : (
          <div className="p-4 sm:p-6 md:p-8 bg-gray-50 border-2 border-gray-100 rounded-[24px] sm:rounded-[36px] md:rounded-[40px] shadow-sm text-left flex items-center justify-between opacity-60">
            <div className="flex-1 pr-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-gray-200 text-gray-600 text-[9px] font-black uppercase rounded-full tracking-wider">Indisponível</span>
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-gray-500 mb-1 sm:mb-2">Simulador I.A Cliente</h3>
              <p className="text-gray-400 text-xs sm:text-sm md:text-base leading-snug">Este módulo de treinamento foi desativado temporariamente pelo gestor.</p>
            </div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 ml-2 sm:ml-4 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
        )}

        {isAdmin && (
          <button 
            onClick={() => onNavigate('admin')}
            className="group p-4 sm:p-6 md:p-8 bg-white border-2 border-dashed border-gray-200 hover:claro-border-red rounded-[24px] sm:rounded-[36px] md:rounded-[40px] shadow-sm transition-all text-left flex items-center justify-between hover:shadow-xl active:scale-[0.98] md:col-span-2"
          >
            <div className="flex-1 pr-2">
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-gray-800 mb-1 sm:mb-2">Painel de Gestão</h3>
              <p className="text-gray-500 text-xs sm:text-sm md:text-base leading-snug">Acompanhe indicadores, relatórios e performance da rede.</p>
              <div className="mt-3 sm:mt-4">
                <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-black text-white text-[9px] font-black rounded-full uppercase tracking-widest">Acesso Restrito</span>
              </div>
            </div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-all shadow-inner ml-2 sm:ml-4 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10m10-10V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v14m10-4V7a2 2 0 00-2-2h-2a2 2 0 00-2 2v12" />
              </svg>
            </div>
          </button>
        )}
      </div>

      {/* Carrossel de Dicas Rápidas de Atendimento */}
      <QuickTipsCarousel />

      {/* Seção de Gráficos e Insights */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Gráfico de Evolução de Desempenho */}
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-[24px] sm:rounded-[36px] md:rounded-[40px] shadow-sm border border-gray-100 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-gray-800 uppercase tracking-widest">
                {user.role === 'tech' ? 'Sua Evolução de Desempenho' : 'Evolução de Desempenho Geral'}
              </h3>
              <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase mt-0.5">Progressão das Notas ao Longo do Tempo</p>
            </div>
            <span className="self-start sm:self-center text-[9px] sm:text-[10px] bg-red-50 text-[#ee0000] px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full font-black uppercase tracking-wider">
              {performanceEvolutionData.length} {performanceEvolutionData.length === 1 ? 'Avaliação' : 'Avaliações'}
            </span>
          </div>

          <div className="h-56 sm:h-72 w-full">
            {performanceEvolutionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceEvolutionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorNota" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ee0000" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#ee0000" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                  <XAxis 
                    dataKey="dataStr" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 9, fontWeight: 'bold', fill: '#9CA3AF'}} 
                  />
                  <YAxis 
                    domain={[0, 10]}
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF'}}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 sm:p-4 border border-gray-100 rounded-2xl sm:rounded-3xl shadow-xl text-left space-y-1 z-30 max-w-[220px]">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{data.dataStr}</p>
                            <p className="text-xs font-black text-gray-800 truncate">{data.name}</p>
                            {user.role !== 'tech' && data.colaborador && (
                              <p className="text-[10px] text-gray-500 font-semibold truncate">Técnico: <span className="text-gray-700 font-bold">{data.colaborador}</span></p>
                            )}
                            <p className="text-[10px] text-gray-500 font-semibold">Modo: <span className="claro-text-red font-black text-[9px] bg-red-50 px-2 py-0.5 rounded-full">{data.mode}</span></p>
                            <div className="pt-2 mt-2 border-t border-gray-100 flex items-center gap-1.5">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nota:</span>
                              <span className="text-base sm:text-lg font-black text-[#ee0000]">{data.nota.toFixed(1)}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="nota" 
                    stroke="#ee0000" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorNota)" 
                    activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2, fill: '#ee0000' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 space-y-2 text-center px-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <p className="text-[11px] uppercase font-black tracking-widest">Nenhuma simulação registrada ainda</p>
                <p className="text-[10px] text-gray-400 max-w-xs">Suas notas aparecerão aqui conforme você realizar treinamentos.</p>
              </div>
            )}
          </div>
        </div>

        {/* Distribution Chart (Only for Admins) */}
        {isAdmin && (
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-[24px] sm:rounded-[36px] md:rounded-[40px] shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h3 className="text-xs sm:text-sm font-black text-gray-800 uppercase tracking-widest">Distribuição de Notas</h3>
                <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase mt-0.5">Volume de Avaliações por Faixa</p>
              </div>
              <span className="text-[9px] text-gray-400 font-bold uppercase">Geral</span>
            </div>
            <div className="h-56 sm:h-64 w-full">
              {evaluations.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 9, fontWeight: 'bold', fill: '#9CA3AF'}} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF'}}
                    />
                    <Tooltip 
                      cursor={{fill: '#f9fafb'}}
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold'}}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-300 space-y-2 text-center px-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10m10-10V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v14m10-4V7a2 2 0 00-2-2h-2a2 2 0 00-2 2v12" />
                  </svg>
                  <p className="text-[11px] uppercase font-black tracking-widest">Aguardando avaliações</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
