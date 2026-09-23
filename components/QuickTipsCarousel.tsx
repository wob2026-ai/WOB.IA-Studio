import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Lightbulb, 
  Zap, 
  Tv, 
  Volume2, 
  ShieldCheck, 
  Ear,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface Tip {
  id: number;
  category: 'Comercial' | 'Técnico' | 'Postura' | 'Geral';
  title: string;
  context: string;
  emoji: string;
  description: string;
  phraseToUse: string;
  impactType: string;
  highlightColor: string;
}

const CLARO_TIPS: Tip[] = [
  {
    id: 1,
    category: 'Técnico',
    title: 'Performance de Upload na Claro Fibra',
    context: 'Explicando Claro Fibra',
    emoji: '⚡',
    description: 'A maioria dos clientes acha que internet rápida é apenas download. Explique que o upload na Claro Fibra corresponde a 50% da velocidade de download, o que garante excelente estabilidade para lives, chamadas de vídeo nítidas e jogos online sem travamento.',
    phraseToUse: '"Sabia que com a estabilidade de Fibra da Claro, você tem uma excelente taxa de upload que equivale a 50% da sua velocidade de download? Isso garante transmissões ao vivo, chamadas e envio de arquivos pesados com alta performance e sem oscilações!"',
    impactType: 'Reduz cancelamentos por percepção de instabilidade',
    highlightColor: 'text-[#ee0000] border-red-100 bg-red-50'
  },
  {
    id: 2,
    category: 'Comercial',
    title: 'Transforme Custo em Comodidade Diária',
    context: 'Contornando Objeções de Preço',
    emoji: '💰',
    description: 'Quando o cliente alegar que o plano de TV ou Banda Larga é alto, divida o valor total por 30 dias. Mostre que ter todo o catálogo de streaming e internet estável para a família custa menos que um único cafezinho por dia.',
    phraseToUse: '"Se dividirmos pela quantidade de canais, filmes da Netflix e acesso ilimitado para toda a família por dia, esse plano fica com o valor menor que uma única passagem ou um lanche."',
    impactType: 'Eleva taxa de fechamento em combos em até 22%',
    highlightColor: 'text-amber-600 border-amber-100 bg-amber-50'
  },
  {
    id: 3,
    category: 'Postura',
    title: 'A Escuta Ativa que Conecta de Verdade',
    context: 'Acolhimento de Reclamações',
    emoji: '👂',
    description: 'Antes de despejar termos técnicos ou dar desculpas sobre problemas, ouça o cliente desabafar sem interrupções por pelo menos 40 segundos. Repita as palavras dele para demonstrar respeito absoluto com o caso.',
    phraseToUse: '"Compreendo perfeitamente sua insatisfação, Sr. Jorge. O seu tempo é valioso. Vamos resolver esse travamento hoje mesmo para que sua videoconferência ocorra em perfeita ordem."',
    impactType: 'Aumenta satisfação de atendimento (NPS) para 9+',
    highlightColor: 'text-emerald-600 border-emerald-100 bg-emerald-50'
  },
  {
    id: 4,
    category: 'Técnico',
    title: 'Claro Box TV e a Instalação Sem Quebra-Quebra',
    context: 'Venda Consultiva de TV por streaming',
    emoji: '📺',
    description: 'Claro Box TV é prático e sustentável. Destaque que a conexão por Wi-Fi dispensa a necessidade de cabear a casa inteira ou fixar antenas destrutivas no telhado do condomínio.',
    phraseToUse: '"É tecnologia limpa: você mesmo conecta o aparelho no Wi-Fi, liga na TV e já sai assistindo em 4K. Sem necessidade de furo na parede ou visitas complexas de engenharia."',
    impactType: 'Minimiza barreiras de aprovação de moradores',
    highlightColor: 'text-purple-600 border-purple-100 bg-purple-50'
  },
  {
    id: 5,
    category: 'Postura',
    title: 'Termos Honestos e Fidelidade Transparente',
    context: 'Compliance e Retenção Ética',
    emoji: '🛡️',
    description: 'A base da fidelidade é a confiança. Nunca prometa bônus perpétuos que na realidade expiram em 12 meses. Destaque a validade da campanha e os descontos de forma clara para blindar dores futuras no pós-venda.',
    phraseToUse: '"Para garantir o preço promocional ideal de lançamento, temos uma fidelidade padrão de 12 meses. Depois desse período, o plano retorna à tabela padrão de forma muito clara aos Srs."',
    impactType: 'Zera índices de reclamações relativas ao Procon',
    highlightColor: 'text-blue-600 border-blue-100 bg-blue-50'
  },
  {
    id: 6,
    category: 'Comercial',
    title: 'Venda Adicional Sem Chatear (Claro Combo Multi)',
    context: 'Upselling e Vendas de Valor',
    emoji: '🚀',
    description: 'Em vez de apenas empurrar mais gigabytes no chip do celular, vincule a oferta de telefonia móvel ao desconto direto obtido na conta da banda larga de casa. Isso cria um combo imbatível com benefícios exclusivos.',
    phraseToUse: '"Trazendo seu celular para a Claro hoje, garantimos o dobro de dados móveis no seu smartphone e um bônus especial de 100 Mega adicionais na internet de sua residência."',
    impactType: 'Gera aumento médio de 15% na receita por cliente',
    highlightColor: 'text-rose-600 border-rose-100 bg-rose-50'
  }
];

export const QuickTipsCarousel: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Categories
  const categories = ['Todos', 'Comercial', 'Técnico', 'Postura'];

  // Filtered Tips
  const filteredTips = useMemo(() => {
    if (selectedCategory === 'Todos') return CLARO_TIPS;
    return CLARO_TIPS.filter(tip => tip.category === selectedCategory);
  }, [selectedCategory]);

  // Reset index on filter change
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedCategory]);

  // Autoplay Logic
  useEffect(() => {
    if (!isPlaying || filteredTips.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % filteredTips.length);
    }, 7000); // changes every 7 seconds

    return () => clearInterval(timer);
  }, [isPlaying, filteredTips]);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + filteredTips.length) % filteredTips.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % filteredTips.length);
  };

  const currentTip = filteredTips[currentIndex] || CLARO_TIPS[0];

  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case 'Comercial':
        return <TrendingUp className="w-4 h-4 text-amber-500" />;
      case 'Técnico':
        return <Zap className="w-4 h-4 text-red-500" />;
      case 'Postura':
        return <Ear className="w-4 h-4 text-emerald-500" />;
      default:
        return <Lightbulb className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div id="quick-tips-carousel-container" className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
      {/* Banner / Header */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[#ee0000] text-[9px] font-black uppercase tracking-[0.25em] block mb-0.5">Dicas Rápidas</span>
          <h3 className="text-lg md:text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-red-600 animate-pulse" />
            Dicas Rápidas de Atendimento Claro
          </h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
            Posturas, gatilhos de venda e contornos baseados na marca
          </p>
        </div>

        {/* Filter categories tabs */}
        <div className="flex bg-gray-100/80 p-1 rounded-full border border-gray-200">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                selectedCategory === cat
                  ? 'bg-white shadow-sm text-[#ee0000]'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tip Display Screen */}
      <div className="p-6 md:p-8 relative min-h-[290px] flex flex-col justify-between">
        {filteredTips.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">
            Nenhuma dica encontrada para esta categoria.
          </div>
        ) : (
          <div className="space-y-4 animate-fadeIn">
            {/* Context Badge & Impact badge */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-gray-700 text-[10px] uppercase font-black tracking-widest">
                {renderCategoryIcon(currentTip.category)}
                {currentTip.category} • {currentTip.context}
              </span>
              <span className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${currentTip.highlightColor}`}>
                🚀 {currentTip.impactType}
              </span>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h4 className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-snug flex items-center gap-2">
                <span className="text-xl shrink-0">{currentTip.emoji}</span>
                {currentTip.title}
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed md:max-w-4xl">
                {currentTip.description}
              </p>
            </div>

            {/* Suggested Phrase to Use Quotation Card */}
            <div className="border-l-4 border-red-500 bg-red-50/40 p-4 rounded-r-2xl my-3">
              <p className="text-[10px] text-red-600 font-extrabold uppercase tracking-widest mb-1 leading-none flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 shrink-0" /> Como falar com o cliente:
              </p>
              <p className="text-xs sm:text-sm text-gray-700 italic font-medium leading-relaxed">
                {currentTip.phraseToUse}
              </p>
            </div>
          </div>
        )}

        {/* Carousel controls - Bottom bar */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
          {/* Back/Forward Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={filteredTips.length <= 1}
              className="p-2 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            
            <button
              type="button"
              onClick={handleNext}
              disabled={filteredTips.length <= 1}
              className="p-2 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              title="Próxima"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2 w-9 h-9 rounded-full transition-colors flex items-center justify-center ml-2 ${
                isPlaying ? 'bg-red-50 text-[#ee0000] hover:bg-red-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title={isPlaying ? 'Pausar Autoplay' : 'Ativar Autoplay'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 stroke-[2.5]" /> : <Play className="w-3.5 h-3.5 stroke-[2.5]" />}
            </button>
          </div>

          {/* Dots Indicator list */}
          {filteredTips.length > 1 && (
            <div className="flex items-center gap-2">
              {filteredTips.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-6 bg-[#ee0000]'
                      : 'w-2 bg-gray-200 hover:bg-gray-300'
                  }`}
                  title={`Ir para slide ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Sizing indicators */}
          <div className="hidden sm:block text-[10px] text-gray-400 font-mono">
            {currentIndex + 1} de {filteredTips.length} dicas
          </div>
        </div>
      </div>
    </div>
  );
};
