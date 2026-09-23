
import React, { useState, useEffect } from 'react';
import { DB } from '../db';

interface Scenario {
  id: string;
  title: string;
  product: 'Virtua' | 'TV' | 'Mesh' | 'Móvel';
  customerName: string;
  customerProfile: string;
  image: string;
  question: string;
  evalCriteria: string[];
}

const SCENARIOS: Scenario[] = [
  {
    id: '1',
    title: 'Facilidade com Voz',
    product: 'TV',
    customerName: 'Dona Helena',
    customerProfile: 'Aposentada buscando praticidade',
    image: 'https://images.unsplash.com/photo-1581579438747-104c53d7fbc4?auto=format&fit=crop&q=80&w=600&h=600',
    question: '“Meu filho, eu vi na TV que agora tem esse Claro TV+ que a gente fala com o controle remoto e ele acha o filme sozinho. É verdade que eu não preciso mais decorar o número dos canais e que já vem com a Netflix dentro dele?”',
    evalCriteria: [
      'Explicar o funcionamento do comando de voz de forma simples.',
      'Confirmar a integração de apps (Netflix/Globoplay) no decodificador.',
      'Usar linguagem acolhedora e evitar termos técnicos complexos.',
      'Destacar a facilidade de não precisar decorar números de canais.'
    ]
  },
  {
    id: '2',
    title: 'Sombra de Sinal',
    product: 'Mesh',
    customerName: 'Dr. Marcos',
    customerProfile: 'Médico com Home Office',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600&h=600',
    question: '“Trabalho muito por telemedicina e meu escritório fica no andar de cima. O sinal do Wi-Fi chega oscilando muito lá. Como essa tecnologia Wi-Fi Mesh da Claro garante que eu não tenha quedas durante uma consulta importante sem eu precisar cabear a casa toda?”',
    evalCriteria: [
      'Diferenciar Wi-Fi comum de Wi-Fi Mesh (cobertura vs. velocidade).',
      'Explicar a formação da "rede única" sem troca manual de conexão.',
      'Focar na estabilidade para videochamadas (baixa latência).',
      'Mencionar a facilidade de instalação sem obras ou cabos aparentes.'
    ]
  },
  {
    id: '3',
    title: 'Performance Gamer',
    product: 'Virtua',
    customerName: 'Enzo',
    customerProfile: 'Estudante e Gamer Competitivo',
    image: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=600&h=600',
    question: '“Eu jogo campeonatos online de FPS e o ping é tudo pra mim. Por que a internet da Claro Virtua com Wi-Fi 6 é melhor que a fibra do bairro? Tem alguma vantagem real de latência ou estabilidade pra quem é gamer?”',
    evalCriteria: [
      'Explicar os benefícios do Wi-Fi 6 (OFDMA e menor latência).',
      'Abordar a estabilidade da rede Claro em horários de pico.',
      'Falar sobre a velocidade de download/upload para patches de jogos.',
      'Demonstrar autoridade técnica sobre "ping" e "jitter".'
    ]
  },
  {
    id: '4',
    title: 'Wi-Fi Inteligente',
    product: 'Virtua',
    customerName: 'Seu Roberto',
    customerProfile: 'Comerciante querendo entender tecnologia',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=600&h=600',
    question: '“Esqueci de perguntar ontem pro vendedor... o que que é esse negócio de \'Band Steering\' que tá escrito no folder do roteador novo? E qual a diferença real da rede de 2.4Ghz e da de 5Ghz? Eu preciso ficar mudando de rede no celular toda hora?”',
    evalCriteria: [
      'Explicar de forma clara e didática o conceito de "Band Steering" (gerenciamento inteligente).',
      'Explicar que o Band Steering unifica as frequências em um único nome de rede.',
      'Diferenciar as redes 2.4Ghz (maior alcance, menos velocidade) e 5Ghz (muito mais velocidade, menor alcance).',
      'Garantir ao cliente que a transição entre frequências é automática e sutil de acordo com a distância.'
    ]
  },
  {
    id: '5',
    title: 'Desafio Casa Conectada',
    product: 'Mesh',
    customerName: 'Dona Sandra',
    customerProfile: 'Iniciando em Automação Residencial',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600&h=600',
    question: '“Eu ouvi falar desse tal de \'IoT\' ou Internet das Coisas. Comprei umas lâmpadas inteligentes e uma câmera Wi-Fi, mas diz no manual que elas só funcionam na rede de 2.4Ghz e ficam desconectando direto aqui em casa. Como a rede inteligente e o Mesh da Claro evitam que esses aparelhos fiquem caindo?”',
    evalCriteria: [
      'Explicar o termo IoT (Internet das Coisas) de maneira acessível.',
      'Esclarecer por que dispositivos IoT normalmente usam a rede de 2.4Ghz (necessitam de alcance físico, não de alta banda).',
      'Explicar como o Wi-Fi Premium/Mesh da Claro lida com múltiplos endpoints sem gargalos de processamento.',
      'Demonstrar confiança de que a cobertura unificada resolve as quedas das automações de rotina.'
    ]
  },
  {
    id: '6',
    title: 'TV+ Sob Demanda',
    product: 'TV',
    customerName: 'Patrícia',
    customerProfile: 'Mãe de família com rotina corrida',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600&h=600',
    question: '“Na correria de arrumar as crianças, eu nunca consigo chegar a tempo de assistir ao telejornal das 20h, e meus filhos sempre perdem o desenho preferido deles. Como funciona esse tal de \'Replay TV\' e a \'Gravação em Nuvem\' da Claro TV+? Preciso comprar algum aparelho de gravação ou HD externo pra colocar na sala?”',
    evalCriteria: [
      'Explicar o Replay TV (permitir assistir a programas retroativos de até 7 dias da grade ao vivo).',
      'Explicar a Gravação em Nuvem (salvamento digital nos servidores dedicados Claro, livre de mídias físicas locais).',
      'Deixar claro que não há necessidade de quaisquer aparelhos adicionais na residência.',
      'Destacar que as gravações e replays podem ser acessados simultaneamente noutros suportes, como smartphones e tablets.'
    ]
  }
];

interface ConsultivoProps {
  onStart: (scenario: Scenario) => void;
  onBack: () => void;
}

export const Consultivo: React.FC<ConsultivoProps> = ({ onStart, onBack }) => {
  const [currentScenario, setCurrentScenario] = useState<any | null>(null);
  const [isChanging, setIsChanging] = useState(false);

  const pickRandomScenario = () => {
    setIsChanging(true);
    setTimeout(() => {
      const dbScenarios = DB.scenarios.all().filter(s => s.type === 'consultivo');
      const activeScenarios = dbScenarios.length > 0 ? dbScenarios : SCENARIOS;
      let next;
      do {
        next = activeScenarios[Math.floor(Math.random() * activeScenarios.length)];
      } while (currentScenario && next.id === currentScenario.id && activeScenarios.length > 1);
      
      setCurrentScenario(next);
      setIsChanging(false);
    }, 300);
  };

  useEffect(() => {
    pickRandomScenario();
  }, []);

  if (!currentScenario) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-5 sm:space-y-8 animate-fadeIn px-2 sm:px-4 py-4 sm:py-8 max-w-4xl mx-auto">
      <div className="text-center space-y-1 sm:space-y-2 mb-2 sm:mb-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black claro-text-red uppercase tracking-tighter">Consultivo +</h2>
        <p className="text-gray-400 font-medium text-xs sm:text-sm">Treinamento de abordagem em tempo real</p>
      </div>

      <div className={`flex flex-col md:flex-row items-center gap-6 sm:gap-10 w-full transition-all duration-300 ${isChanging ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-red-200 rounded-full blur-[40px] sm:blur-[60px] opacity-30 animate-pulse"></div>
          <div className="relative w-32 h-32 sm:w-44 sm:h-44 md:w-56 md:h-56 rounded-full border-4 sm:border-[6px] border-white shadow-2xl overflow-hidden z-10 animate-talk">
            <img 
              src={currentScenario.image} 
              alt={currentScenario.customerName} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-[#ee0000] text-white p-2.5 sm:p-4 rounded-full shadow-2xl z-20 animate-bounce border-2 sm:border-4 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
        </div>

        <div className="flex-1 space-y-4 sm:space-y-6 w-full">
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-[24px] sm:rounded-[36px] md:rounded-[40px] shadow-xl border border-gray-100 relative">
            <div className="absolute -left-3 top-10 w-6 h-6 bg-white rotate-45 border-l border-b border-gray-100 hidden md:block"></div>
            <p className="text-base sm:text-xl md:text-2xl font-black text-gray-800 leading-snug sm:leading-tight">
              {currentScenario.question}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {currentScenario.customerName} • {currentScenario.customerProfile}
              </p>
              <span className={`px-2 py-0.5 rounded text-[8px] font-black text-white uppercase ${
                currentScenario.product === 'Virtua' ? 'bg-blue-600' : currentScenario.product === 'TV' ? 'bg-purple-600' : currentScenario.product === 'Mesh' ? 'bg-orange-600' : 'bg-red-600'
              }`}>
                {currentScenario.product === 'TV' ? 'Claro TV+' : currentScenario.product === 'Mesh' ? 'Wi-Fi Mesh' : `Claro ${currentScenario.product}`}
              </span>
            </div>
          </div>

          <div className="bg-gray-50/80 backdrop-blur-sm p-4 sm:p-6 rounded-[20px] sm:rounded-[32px] border border-gray-100">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#ee0000]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h5 className="font-black text-[10px] sm:text-[11px] text-[#ee0000] uppercase tracking-widest">Dicas para uma nota 10:</h5>
            </div>
            <ul className="space-y-2">
              {currentScenario.evalCriteria.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2.5 sm:gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">{tip}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-2xl pt-3 sm:pt-6">
        <button 
          onClick={pickRandomScenario}
          disabled={isChanging}
          className="order-2 sm:order-1 flex-1 text-gray-500 hover:text-gray-700 font-black text-xs uppercase tracking-widest py-3.5 sm:py-5 px-6 sm:px-8 transition-colors border border-gray-200 sm:border-2 sm:border-transparent sm:hover:border-gray-200 rounded-full flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isChanging ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Trocar cliente
        </button>
        <button 
          onClick={() => onStart(currentScenario)}
          disabled={isChanging}
          className="order-1 sm:order-2 flex-[2] claro-red hover:bg-red-700 text-white text-base sm:text-xl font-black py-4 sm:py-6 px-6 sm:px-10 rounded-full shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 sm:gap-4 group disabled:opacity-50 cursor-pointer"
        >
          <div className="flex flex-col items-center">
            <span className="flex items-center gap-2">
              <span>INICIAR PRÁTICA</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-100 opacity-90">
              Gravação em Vídeo com IA
            </span>
          </div>
        </button>
      </div>

      <button 
        onClick={onBack}
        className="text-gray-400 hover:text-[#ee0000] font-black text-[10px] uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 py-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Voltar ao menu
      </button>
    </div>
  );
};
