import { User, AccessLog, Evaluation, Attempt, Scenario, QuizQuestion, AIConfig, Category } from './types';
import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc,
  getDocFromServer,
  onSnapshot
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

// --- ENUMS & ERRORS AS REQUESTED BY FIREBASE INTEGRATION SKILL ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  
  console.warn('Firestore Operation Notification (Dual-Write Resilient Offline Fallback Active): ', JSON.stringify(errInfo));
  
  // If the error is a permission denied, disabled auth provider, network error, or any other authentication restriction, 
  // we gracefully warning-log it and swallow the exception so the user is never blocked or crashed.
  const isAuthOrPermissionError = 
    errMsg.toLowerCase().includes('permission-denied') || 
    errMsg.toLowerCase().includes('permissions') ||
    errMsg.toLowerCase().includes('auth/') ||
    errMsg.toLowerCase().includes('restricted-operation') ||
    errMsg.toLowerCase().includes('not-found') ||
    errMsg.toLowerCase().includes('unavailable') ||
    errMsg.toLowerCase().includes('failed-precondition') ||
    errMsg.toLowerCase().includes('offline') ||
    errMsg.toLowerCase().includes('quota') ||
    errMsg.toLowerCase().includes('resource-exhausted') ||
    errMsg.toLowerCase().includes('deadline-exceeded');

  if (isAuthOrPermissionError || typeof window !== 'undefined') {
    return;
  }
  
  throw new Error(JSON.stringify(errInfo));
}

// --- LOCAL STORAGE SYNCHRONIZER LAYER ---
const KEYS = {
  USERS: 'explica_users',
  ACCESSES: 'explica_accesses',
  EVALUATIONS: 'explica_evaluations',
  ATTEMPTS: 'explica_attempts',
  SCENARIOS: 'explica_scenarios',
  QUIZZES: 'explica_quizzes',
  AI_CONFIG: 'explica_ai_config',
  CATEGORIES: 'explica_categories'
};

const DEFAULT_SCENARIOS: Scenario[] = [
  {
    id: 'c1',
    type: 'consultivo',
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
    ],
    aiSystemInstruction: 'Você é um avaliador de excelência pedagógica Claro. Avalie a didática na explicação do Claro TV+ com comando de voz para uma senhora aposentada. Priorize verificar se o atendente usou linguagem acessível, acolhimento empático e clareza sobre o catálogo integrado sem termos técnicos difíceis.'
  },
  {
    id: 'c2',
    type: 'consultivo',
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
    ],
    aiSystemInstruction: 'Avalie a precisão técnica na explicação do Wi-Fi Mesh para um médico em home office. Verifique se destacou a rede única inteligente, estabilidade para telemedicina/videochamadas e a ausência de obras físicas.'
  },
  {
    id: 'c3',
    type: 'consultivo',
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
    ],
    aiSystemInstruction: 'Avalie a argumentação técnica para um público jovem gamer. Dê ênfase à explicação de latência (ping), estabilidade da Claro Fibra, taxa de upload e vantagens do Wi-Fi 6.'
  },
  {
    id: 'c4',
    type: 'consultivo',
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
    ],
    aiSystemInstruction: 'Avalie a capacidade de traduzir o recurso Band Steering e a diferença entre 2.4GHz e 5GHz em termos práticos do dia a dia, transmitindo segurança ao cliente.'
  },
  {
    id: 'c5',
    type: 'consultivo',
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
    ],
    aiSystemInstruction: 'Avalie o conhecimento sobre dispositivos IoT e a explicação de como o roteador inteligente e os pontos Mesh gerenciam dezenas de conexões simultâneas sem perdas de sinal.'
  },
  {
    id: 'c6',
    type: 'consultivo',
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
    ],
    aiSystemInstruction: 'Avalie a demonstração das funcionalidades de Replay TV e Gravação em Nuvem da Claro TV+, com ênfase na comodidade para famílias com rotina agitada e facilidade de acesso em múltiplos dispositivos.'
  },
  {
    id: 'sim1',
    type: 'simulator',
    title: 'Objeção de Preço e Estabilidade de Conexão',
    character: 'Sandra Azevedo',
    difficulty: 'Avançado',
    category: 'Retenção / Vendas',
    scenario: 'Sandra é designer freelancer, trabalha 100% em home office e está enfurecida porque sua internet atual (cabo metálico concorrente) cai no meio de reuniões com clientes importantes. Ela quer cancelar ou encontrar uma solução definitiva, mas está extremamente desconfiada e acha os planos de fibra óptica caros.',
    script: 'Apresente a estabilidade da Claro Fibra óptica, dê ênfase absoluta ao fato de que o UPLOAD é de 50% em relação ao download (essencial para videoconferências e envio de projetos dela) e supere a objeção de preço demonstrando o valor de não perder clientes pelo sinal caindo.',
    evalCriteria: [
      'Acolhimento empático inicial sem confrontar a irritação da cliente',
      'Explicação detalhada da taxa de Upload de 50% para home office',
      'Superação da objeção de preço conectando o custo com a segurança do trabalho dela',
      'Fechamento confiante oferecendo a migração para a fibra'
    ],
    aiSystemInstruction: 'Você é o avaliador da simulação de atendimento com Sandra Azevedo. Dê nota alta se o consultor explicou de forma contundente os 50% de upload e a estabilidade da Claro Fibra, acolheu a cliente com paciência e não discutiu sobre preço, demonstrando valor.'
  },
  {
    id: 'sim2',
    type: 'simulator',
    title: 'Família Conectada e Jogos Online',
    character: 'Marcos Oliveira',
    difficulty: 'Médio',
    category: 'Vendas Consultivas',
    scenario: 'Marcos quer contratar internet para sua casa nova. Ele tem dois filhos adolescentes que jogam online competitivamente (latência/ping é crítico) e sua esposa faz lives de culinária à noite. Ele quer entender o que a Claro Fibra oferece para aguentar todos os aparelhos simultaneamente.',
    script: 'Explique como funciona a rede de fibra óptica Claro, mencione a baixíssima latência (ping estável) e reforce que os 50% de upload garantem que as lives da esposa aconteçam perfeitamente sem travar o jogo dos filhos.',
    evalCriteria: [
      'Sondagem dos hábitos de uso e aparelhos da residência',
      'Explicação técnica sobre estabilidade e baixa latência (ping)',
      'Argumentação sobre a importância dos 50% de upload para lives e jogos simultâneos',
      'Oferta de solução completa (plano alto ou Wi-Fi Mesh/Wi-Fi 6)'
    ],
    aiSystemInstruction: 'Você é o avaliador pedagógico da simulação com Marcos Oliveira. Avalie se o colaborador atuou no modo Consultivo, investigando a rotina da casa e justificando a velocidade e o Wi-Fi 6 com base nos jogos dos filhos e lives da esposa.'
  },
  {
    id: 'sim3',
    type: 'simulator',
    title: 'Nova Assinante e Dúvida de Instalação',
    character: 'Juliana Mendes',
    difficulty: 'Básico',
    category: 'Atendimento & Suporte',
    scenario: 'Juliana acabou de se mudar para um apartamento novo e quer contratar Claro Fibra. Ela é simpática, mas está preocupada com o prazo de instalação porque precisa da rede ativa em até 3 dias para começar um novo emprego remoto.',
    script: 'Demonstre cordialidade, valide a pressa dela com empatia, ofereça o agendamento prioritário e garanta que nosso SLA é de até 48 horas com ativação imediata após a instalação física.',
    evalCriteria: [
      'Cordialidade e simpatia no primeiro contato',
      'Validação da urgência e apoio ao início do novo emprego',
      'Esclarecimento claro do prazo de agendamento e SLA de até 48 horas',
      'Confirmação de que o técnico realiza os testes de velocidade na entrega'
    ],
    aiSystemInstruction: 'Você é o avaliador da simulação com Juliana Mendes. Analise a simpatia, clareza e segurança transmitidas pelo atendente quanto aos prazos de instalação e início imediato de uso.'
  }
];

const DEFAULT_QUIZZES: QuizQuestion[] = [
  {
    id: 'q1',
    quizTitle: 'Questionário Geral de Conhecimento Técnico',
    question: 'Qual é a taxa de upload padrão oferecida pela Claro Fibra em relação à velocidade de download contratada?',
    options: ['10%', '25%', '50% (Metade da taxa)', '100% (Simétrico)'],
    correctOptionIndex: 2,
    explanation: 'A Claro Fibra oferece um excelente diferencial onde a taxa de upload corresponde a 50% do download contratado (ex: plano de 500 Mega oferece 250 Mega de upload). Isso é vital para videoconferências, backups de arquivos e jogos.',
    targetRole: 'all'
  },
  {
    id: 'q2',
    quizTitle: 'Questionário Geral de Conhecimento Técnico',
    question: 'Qual o principal benefício da tecnologia Wi-Fi 6 incluída nos roteadores premium da Claro Fibra?',
    options: ['Reduzir o consumo elétrico dos eletrodomésticos da casa', 'Menor latência (ping estável), maior velocidade e suporte a muito mais conexões simultâneas', 'Bloquear anúncios de sites de terceiros de forma nativa', 'Dispensar totalmente a instalação de cabos de fibra na rua'],
    correctOptionIndex: 1,
    explanation: 'O Wi-Fi 6 é uma revolução na transmissão sem fio, garantindo que mesmo com muitos aparelhos conectados na residência, a conexão de cada um permaneça estável, rápida e com ping baixo.',
    targetRole: 'tech'
  },
  {
    id: 'q3',
    quizTitle: 'Questionário Geral de Conhecimento Técnico',
    question: 'O que faz o recurso inteligente "Band Steering" presente nos roteadores da Claro?',
    options: ['Grava as chamadas telefônicas do plano fixo', 'Aumenta a velocidade contratada em 100% nas primeiras duas horas do dia', 'Unifica as frequências de 2.4Ghz e 5Ghz em uma única rede Wi-Fi e redireciona os dispositivos de forma automática para a melhor opção', 'Rastreia a localização física do roteador para evitar furtos'],
    correctOptionIndex: 2,
    explanation: 'O Band Steering unifica as duas frequências em um único nome de Wi-Fi. Assim, quando o usuário está perto do roteador, ele é conectado à rede rápida de 5Ghz. Ao se distanciar, ele muda automaticamente e sem quedas para a de 2.4Ghz.',
    targetRole: 'all'
  }
];

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Retenção / Vendas',
    description: 'Táticas de contorno de objeções e ofertas de fidelização',
    icon: '🎯',
    module: 'all',
    active: true,
    script: '1. Acolha a insatisfação do cliente com empatia.\n2. Identifique o motivo real do pedido de cancelamento.\n3. Apresente os benefícios do plano atual antes de oferecer desconto.\n4. Realize a oferta de retenção com benefícios exclusivos (ex: degrau de velocidade ou ponto de TV extra).',
    evalCriteria: [
      'Empatia e escuta ativa no acolhimento do cliente',
      'Sondagem assertiva do motivo do cancelamento',
      'Argumentação sobre os diferenciais da Claro',
      'Clareza e transparência nas condições da oferta de retenção'
    ],
    aiSystemInstruction: 'Você é um avaliador e simulador especializado em Retenção e Fidelização da Claro. Priorize verificar se o atendente manteve a calma, evitou discussões e apresentou a proposta de retenção com clareza.',
    aiModel: 'gemini-3.5-flash',
    aiTemperature: 0.7,
    createdAt: new Date().toISOString()
  },
  {
    id: 'cat-2',
    name: 'Vendas Consultivas',
    description: 'Abordagem focada em entender a necessidade do cliente',
    icon: '💼',
    module: 'all',
    active: true,
    script: '1. Cumprimente o cliente de forma acolhedora.\n2. Faça perguntas abertas sobre os hábitos da família (quantas pessoas navegam, se jogam online ou trabalham de casa).\n3. Recomende o plano Claro Fibra ideal justificando pelo uso citado.\n4. Apresente o combo ou Wi-Fi Mesh como solução complementar.',
    evalCriteria: [
      'Sondagem de perfil de uso antes do preço',
      'Recomendação técnica personalizada',
      'Explicação dos diferenciais do Wi-Fi 6 / Mesh',
      'Fechamento de venda com pergunta de confirmação'
    ],
    aiSystemInstruction: 'Sua função é avaliar o atendimento no modelo de Venda Consultiva. O foco é garantir que o vendedor não seja apenas um tirador de pedidos, mas um consultor de conectividade.',
    aiModel: 'gemini-3.5-flash',
    aiTemperature: 0.6,
    createdAt: new Date().toISOString()
  },
  {
    id: 'cat-3',
    name: 'Atendimento & Suporte',
    description: 'Resolução de dúvidas técnicas e auxílio em planos',
    icon: '🎧',
    module: 'all',
    active: true,
    script: '1. Verifique o cadastro e confirme o endereço.\n2. Diagnostique se o problema é de sinal, equipamento ou cobrança.\n3. Oriente o procedimento técnico passo a passo de forma simples.\n4. Confirme a resolução e coloque-se à disposição para novos auxílios.',
    evalCriteria: [
      'Validação de dados e cordialidade',
      'Diagnóstico preciso da dúvida ou falha',
      'Linguagem acessível e sem jargões excessivos',
      'Confirmação de satisfação do cliente ao final'
    ],
    aiSystemInstruction: 'Examine o atendimento focado em resolução no primeiro contato (FCR) e empatia no suporte ao cliente.',
    aiModel: 'gemini-3.5-flash',
    aiTemperature: 0.5,
    createdAt: new Date().toISOString()
  },
  {
    id: 'cat-4',
    name: 'Produtos Claro (Virtua / TV+ / Mesh / Móvel)',
    description: 'Recursos específicos de fibra, TV e Wi-Fi inteligente',
    icon: '📡',
    module: 'consultivo',
    active: true,
    script: '1. Destaque a tecnologia Fibra Óptica Claro.\n2. Explique que o upload é de 50% da velocidade contratada.\n3. Apresente os aplicativos de conteúdo incluídos na Claro TV+.\n4. Explique a cobertura sem sombras do Wi-Fi Mesh.',
    evalCriteria: [
      'Explicação clara da taxa de Upload (50%)',
      'Apresentação dos benefícios do Wi-Fi Mesh em casas grandes',
      'Demonstração do catálogo do Claro TV+',
      'Veracidade técnica dos produtos apresentados'
    ],
    aiSystemInstruction: 'Audite a precisão técnica das informações sobre os produtos da Claro (Fibra, TV, Mesh e Móvel).',
    aiModel: 'gemini-3.5-flash',
    aiTemperature: 0.5,
    createdAt: new Date().toISOString()
  },
  {
    id: 'cat-5',
    name: 'Postura & Oratória',
    description: 'Linguagem corporal, tom de voz e clareza de argumentos',
    icon: '🗣️',
    module: 'all',
    active: true,
    script: '1. Mantenha postura ereta e contato visual com a câmera/cliente.\n2. Articule bem as palavras sem vícios de linguagem (né, tipo, tá).\n3. Mantenha tom de voz firme, empático e seguro.\n4. Conclua com fala objetiva e motivadora.',
    evalCriteria: [
      'Dicção, ritmo e entonação vocal',
      'Ausência de vícios de linguagem',
      'Segurança e clareza na exposição dos argumentos',
      'Contato visual e postura profissional'
    ],
    aiSystemInstruction: 'Avalie especificamente o domínio de oratória, entonação, postura e presença cênica/atendimento do colaborador.',
    aiModel: 'gemini-3.5-flash',
    aiTemperature: 0.7,
    createdAt: new Date().toISOString()
  }
];

const getItems = <T,>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setItems = <T,>(key: string, items: T[]): void => {
  localStorage.setItem(key, JSON.stringify(items));
};

const setupRealtimeListeners = () => {
  // Users Snapshot
  onSnapshot(collection(db, 'users'), (snapshot) => {
    const list: User[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as User);
    });
    if (list.length > 0) {
      setItems(KEYS.USERS, list);
    }
  }, (error) => {
    console.warn('Erro ao sincronizar usuários do Firestore:', error.message);
  });

  // Evaluations Snapshot
  onSnapshot(collection(db, 'evaluations'), (snapshot) => {
    const list: Evaluation[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as Evaluation);
    });
    setItems(KEYS.EVALUATIONS, list);
  }, (error) => {
    if (error.message.toLowerCase().includes('permission-denied') || error.message.toLowerCase().includes('missing or insufficient')) {
      // Slipped silently as expected when offline or unauthorized
    } else {
      console.warn('Erro na sincronização de avaliações:', error.message);
    }
  });

  // Accesses Snapshot
  onSnapshot(collection(db, 'accesses'), (snapshot) => {
    const list: AccessLog[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as AccessLog);
    });
    setItems(KEYS.ACCESSES, list);
  }, (error) => {
    if (!error.message.toLowerCase().includes('permission-denied') && !error.message.toLowerCase().includes('missing or insufficient')) {
      console.warn('Erro na sincronização de acessos:', error.message);
    }
  });

  // Attempts Snapshot
  onSnapshot(collection(db, 'attempts'), (snapshot) => {
    const list: Attempt[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as Attempt);
    });
    setItems(KEYS.ATTEMPTS, list);
  }, (error) => {
    if (!error.message.toLowerCase().includes('permission-denied') && !error.message.toLowerCase().includes('missing or insufficient')) {
      console.warn('Erro na sincronização de tentativas:', error.message);
    }
  });

  // Scenarios Snapshot
  onSnapshot(collection(db, 'scenarios'), (snapshot) => {
    const list: Scenario[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as Scenario);
    });
    if (list.length > 0) {
      setItems(KEYS.SCENARIOS, list);
    }
  }, (error) => {
    // Slipped silently
  });

  // Quizzes Snapshot
  onSnapshot(collection(db, 'quizzes'), (snapshot) => {
    const list: QuizQuestion[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as QuizQuestion);
    });
    if (list.length > 0) {
      setItems(KEYS.QUIZZES, list);
    }
  }, (error) => {
    // Slipped silently
  });

  // AI Config Snapshot
  onSnapshot(collection(db, 'ai_config'), (snapshot) => {
    const list: AIConfig[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as AIConfig);
    });
    if (list.length > 0) {
      setItems(KEYS.AI_CONFIG, list);
    }
  }, (error) => {
    // Slipped silently
  });

  // Categories Snapshot
  onSnapshot(collection(db, 'categories'), (snapshot) => {
    const list: Category[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as Category);
    });
    if (list.length > 0) {
      setItems(KEYS.CATEGORIES, list);
    }
  }, (error) => {
    // Slipped silently
  });
};

// --- REAL-TIME FIRESTORE LISTENER SYNC AND DEFAULT SEED ---
export const initFirestoreSync = () => {
  // 1. Authenticate user anonymously if possible, to satisfy Firestore security rules
  signInAnonymously(auth)
    .then((cred) => {
      console.log("Firebase Auth registrado com sucesso:", cred.user.uid);
    })
    .catch((err) => {
      console.warn("Aviso: Autenticação anônima do Firebase está desativada ou restrita. Detalhe:", err.message);
      console.warn("Utilizando persistência resiliente dual-write (Gravação local principal + Nuvem assíncrona)");
    })
    .finally(() => {
      // ALWAYS call testConnection and setupRealtimeListeners so that even if auth fails, the app still functions perfectly from Local Cache
      testConnection();
      setupRealtimeListeners();
    });
};

// --- VALIDATE FIRESTORE CONNECTION ON BOOT ---
async function testConnection() {
  try {
    const testDocPath = 'test/connection';
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration. Client appears to be offline.");
    }
  }
}

// --- CORE EXPORTED DATABASE ACTIONS (DUAL-WRITE LAYER FOR ACCELERATED EXPERIENCE) ---
export const DB = {
  users: {
    all: () => getItems<User>(KEYS.USERS),
    add: async (user: User) => {
      const users = getItems<User>(KEYS.USERS);
      setItems(KEYS.USERS, [...users, user]);
      
      const docPath = `users/${user.id}`;
      try {
        await setDoc(doc(db, 'users', user.id), user);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
    },
    update: async (updatedUser: User) => {
      const users = getItems<User>(KEYS.USERS);
      const index = users.findIndex(u => u.id === updatedUser.id);
      if (index !== -1) {
        users[index] = updatedUser;
        setItems(KEYS.USERS, users);
      }
      const docPath = `users/${updatedUser.id}`;
      try {
        await setDoc(doc(db, 'users', updatedUser.id), updatedUser);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
    },
    delete: async (id: string) => {
      const users = getItems<User>(KEYS.USERS).filter(u => u.id !== id);
      setItems(KEYS.USERS, users);
      const docPath = `users/${id}`;
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, docPath);
      }
    },
    findByCpf: (cpf: string) => getItems<User>(KEYS.USERS).find(u => u.cpf === cpf),
    findByEmail: (email: string) => getItems<User>(KEYS.USERS).find(u => u.email?.toLowerCase().trim() === email?.toLowerCase().trim()),
    findById: (id: string) => getItems<User>(KEYS.USERS).find(u => u.id === id)
  },
  accesses: {
    all: () => getItems<AccessLog>(KEYS.ACCESSES),
    add: async (log: AccessLog) => {
      const logs = getItems<AccessLog>(KEYS.ACCESSES);
      setItems(KEYS.ACCESSES, [...logs, log]);
      const docPath = `accesses/${log.id}`;
      try {
        await setDoc(doc(db, 'accesses', log.id), log);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
    },
    deleteByUserId: async (userId: string) => {
      const logs = getItems<AccessLog>(KEYS.ACCESSES).filter(l => l.userId !== userId);
      setItems(KEYS.ACCESSES, logs);
      
      // Batch-style delete from Firestore
      const targets = getItems<AccessLog>(KEYS.ACCESSES).filter(l => l.userId === userId);
      for (const log of targets) {
        const docPath = `accesses/${log.id}`;
        try {
          await deleteDoc(doc(db, 'accesses', log.id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, docPath);
        }
      }
    },
    deleteAll: async () => {
      const items = getItems<AccessLog>(KEYS.ACCESSES);
      setItems(KEYS.ACCESSES, []);
      for (const log of items) {
        try {
          await deleteDoc(doc(db, 'accesses', log.id));
        } catch (err) {
          // Suppress errors during mass purge
        }
      }
    }
  },
  evaluations: {
    all: () => getItems<Evaluation>(KEYS.EVALUATIONS),
    add: async (evalData: Evaluation) => {
      const evaluations = getItems<Evaluation>(KEYS.EVALUATIONS);
      setItems(KEYS.EVALUATIONS, [...evaluations, evalData]);
      const docPath = `evaluations/${evalData.id}`;
      try {
        await setDoc(doc(db, 'evaluations', evalData.id), evalData);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
    },
    delete: async (id: string) => {
      const evaluations = getItems<Evaluation>(KEYS.EVALUATIONS).filter(ev => ev.id !== id);
      setItems(KEYS.EVALUATIONS, evaluations);
      const docPath = `evaluations/${id}`;
      try {
        await deleteDoc(doc(db, 'evaluations', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, docPath);
      }
    },
    deleteByUserId: async (userId: string) => {
      const evaluations = getItems<Evaluation>(KEYS.EVALUATIONS).filter(ev => ev.userId !== userId);
      const targets = getItems<Evaluation>(KEYS.EVALUATIONS).filter(ev => ev.userId === userId);
      setItems(KEYS.EVALUATIONS, evaluations);
      for (const ev of targets) {
        const docPath = `evaluations/${ev.id}`;
        try {
          await deleteDoc(doc(db, 'evaluations', ev.id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, docPath);
        }
      }
    },
    deleteAll: async () => {
      const items = getItems<Evaluation>(KEYS.EVALUATIONS);
      setItems(KEYS.EVALUATIONS, []);
      for (const ev of items) {
        try {
          await deleteDoc(doc(db, 'evaluations', ev.id));
        } catch (err) {}
      }
    }
  },
  attempts: {
    all: () => getItems<Attempt>(KEYS.ATTEMPTS),
    add: async (attempt: Attempt) => {
      const attempts = getItems<Attempt>(KEYS.ATTEMPTS);
      setItems(KEYS.ATTEMPTS, [...attempts, attempt]);
      const docPath = `attempts/${attempt.id}`;
      try {
        await setDoc(doc(db, 'attempts', attempt.id), attempt);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
    }
  },
  scenarios: {
    all: (): Scenario[] => {
      const data = localStorage.getItem(KEYS.SCENARIOS);
      if (!data) {
        setItems(KEYS.SCENARIOS, DEFAULT_SCENARIOS);
        return DEFAULT_SCENARIOS;
      }
      try {
        const parsed: Scenario[] = JSON.parse(data);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          setItems(KEYS.SCENARIOS, DEFAULT_SCENARIOS);
          return DEFAULT_SCENARIOS;
        }
        return parsed;
      } catch {
        setItems(KEYS.SCENARIOS, DEFAULT_SCENARIOS);
        return DEFAULT_SCENARIOS;
      }
    },
    resetToDefaults: async (): Promise<Scenario[]> => {
      setItems(KEYS.SCENARIOS, DEFAULT_SCENARIOS);
      for (const sc of DEFAULT_SCENARIOS) {
        const docPath = `scenarios/${sc.id}`;
        try {
          await setDoc(doc(db, 'scenarios', sc.id), sc);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, docPath);
        }
      }
      return DEFAULT_SCENARIOS;
    },
    add: async (scenario: Scenario) => {
      const list = DB.scenarios.all();
      const filtered = list.filter(s => s.id !== scenario.id);
      setItems(KEYS.SCENARIOS, [...filtered, scenario]);
      const docPath = `scenarios/${scenario.id}`;
      try {
        await setDoc(doc(db, 'scenarios', scenario.id), scenario);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
    },
    addAll: async (newScenarios: Scenario[]) => {
      const list = DB.scenarios.all();
      const newIds = new Set(newScenarios.map(s => s.id));
      const existing = list.filter(s => !newIds.has(s.id));
      const merged = [...existing, ...newScenarios];
      setItems(KEYS.SCENARIOS, merged);
      
      for (const sc of newScenarios) {
        const docPath = `scenarios/${sc.id}`;
        try {
          await setDoc(doc(db, 'scenarios', sc.id), sc);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, docPath);
        }
      }
    },
    update: async (updated: Scenario) => {
      const list = DB.scenarios.all();
      const index = list.findIndex(s => s.id === updated.id);
      if (index !== -1) {
        list[index] = updated;
        setItems(KEYS.SCENARIOS, list);
      }
      const docPath = `scenarios/${updated.id}`;
      try {
        await setDoc(doc(db, 'scenarios', updated.id), updated);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
    },
    delete: async (id: string) => {
      const list = DB.scenarios.all().filter(s => s.id !== id);
      setItems(KEYS.SCENARIOS, list);
      const docPath = `scenarios/${id}`;
      try {
        await deleteDoc(doc(db, 'scenarios', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, docPath);
      }
    }
  },
  quizzes: {
    all: (): QuizQuestion[] => {
      const data = localStorage.getItem(KEYS.QUIZZES);
      if (!data) {
        setItems(KEYS.QUIZZES, DEFAULT_QUIZZES);
        return DEFAULT_QUIZZES;
      }
      try {
        const parsed: QuizQuestion[] = JSON.parse(data);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          setItems(KEYS.QUIZZES, DEFAULT_QUIZZES);
          return DEFAULT_QUIZZES;
        }
        return parsed;
      } catch {
        setItems(KEYS.QUIZZES, DEFAULT_QUIZZES);
        return DEFAULT_QUIZZES;
      }
    },
    resetToDefaults: async (): Promise<QuizQuestion[]> => {
      setItems(KEYS.QUIZZES, DEFAULT_QUIZZES);
      for (const qz of DEFAULT_QUIZZES) {
        const docPath = `quizzes/${qz.id}`;
        try {
          await setDoc(doc(db, 'quizzes', qz.id), qz);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, docPath);
        }
      }
      return DEFAULT_QUIZZES;
    },
    add: async (quiz: QuizQuestion) => {
      const list = getItems<QuizQuestion>(KEYS.QUIZZES);
      const filtered = list.filter(q => q.id !== quiz.id);
      setItems(KEYS.QUIZZES, [...filtered, quiz]);
      const docPath = `quizzes/${quiz.id}`;
      try {
        await setDoc(doc(db, 'quizzes', quiz.id), quiz);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
    },
    addAll: async (newQuizzes: QuizQuestion[]) => {
      const list = getItems<QuizQuestion>(KEYS.QUIZZES);
      const newIds = new Set(newQuizzes.map(q => q.id));
      const existing = list.filter(q => !newIds.has(q.id));
      const merged = [...existing, ...newQuizzes];
      setItems(KEYS.QUIZZES, merged);
      
      for (const q of newQuizzes) {
        const docPath = `quizzes/${q.id}`;
        try {
          await setDoc(doc(db, 'quizzes', q.id), q);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, docPath);
        }
      }
    },
    update: async (updated: QuizQuestion) => {
      const list = getItems<QuizQuestion>(KEYS.QUIZZES);
      const index = list.findIndex(q => q.id === updated.id);
      if (index !== -1) {
        list[index] = updated;
        setItems(KEYS.QUIZZES, list);
      }
      const docPath = `quizzes/${updated.id}`;
      try {
        await setDoc(doc(db, 'quizzes', updated.id), updated);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
    },
    delete: async (id: string) => {
      const list = getItems<QuizQuestion>(KEYS.QUIZZES).filter(q => q.id !== id);
      setItems(KEYS.QUIZZES, list);
      const docPath = `quizzes/${id}`;
      try {
        await deleteDoc(doc(db, 'quizzes', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, docPath);
      }
    }
  },
  aiConfig: {
    get: (): AIConfig => {
      const list = getItems<AIConfig>(KEYS.AI_CONFIG);
      if (list.length > 0) {
        const item = list[0];
        const evalModel = (!item.evaluationModel || item.evaluationModel.includes('1.5') || item.evaluationModel.includes('2.0') || item.evaluationModel.includes('2.5')) 
          ? 'gemini-3.6-flash' 
          : item.evaluationModel;
        const simModel = (!item.simulatorModel || item.simulatorModel.includes('1.5') || item.simulatorModel.includes('2.0') || item.simulatorModel.includes('2.5')) 
          ? 'gemini-3.6-flash' 
          : item.simulatorModel;
        return {
          simulatorEnabled: false,
          ...item,
          evaluationModel: evalModel,
          simulatorModel: simModel
        };
      }
      
      return {
        id: 'default',
        evaluationModel: 'gemini-3.6-flash',
        evaluationSystemInstruction: 'Você é um avaliador de excelência de atendimento da Claro. Analise o vídeo do técnico explicando o produto. Critérios: Naturalidade, Clareza, Empatia e Correção Técnica.',
        simulatorModel: 'gemini-3.6-flash',
        simulatorSystemInstruction: 'Você é um cliente corporativo fictício em um simulador de treinamento para funcionários da Claro. Suas diretrizes são responder diretamente como o personagem, mantendo a emoção correspondente.',
        temperature: 0.7,
        simulatorEnabled: false
      };
    },
    save: async (config: AIConfig) => {
      setItems(KEYS.AI_CONFIG, [config]);
      const docPath = `ai_config/${config.id}`;
      try {
        await setDoc(doc(db, 'ai_config', config.id), config);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
    }
  },
  categories: {
    all: (): Category[] => {
      const data = localStorage.getItem(KEYS.CATEGORIES);
      if (data === null) {
        setItems(KEYS.CATEGORIES, DEFAULT_CATEGORIES);
        return DEFAULT_CATEGORIES;
      }
      try {
        return JSON.parse(data);
      } catch {
        return [];
      }
    },
    add: async (category: Category) => {
      const list = DB.categories.all();
      const updated = [...list, category];
      setItems(KEYS.CATEGORIES, updated);
      const docPath = `categories/${category.id}`;
      try {
        await setDoc(doc(db, 'categories', category.id), category);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
    },
    update: async (updatedCategory: Category) => {
      const list = DB.categories.all();
      const index = list.findIndex(c => c.id === updatedCategory.id);
      if (index !== -1) {
        list[index] = updatedCategory;
        setItems(KEYS.CATEGORIES, list);
      }
      const docPath = `categories/${updatedCategory.id}`;
      try {
        await setDoc(doc(db, 'categories', updatedCategory.id), updatedCategory);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
    },
    delete: async (id: string) => {
      const list = DB.categories.all().filter(c => c.id !== id);
      setItems(KEYS.CATEGORIES, list);
      const docPath = `categories/${id}`;
      try {
        await deleteDoc(doc(db, 'categories', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, docPath);
      }
    }
  }
};

// --- BOOTSTRAP DEFAULT ADMIN AND SUPERADMIN RECORDS TO FIRESTORE ON LOAD ---
const seedSampleCollaborators = async () => {
  const currentUsers = DB.users.all();
  const techUsers = currentUsers.filter(u => u.role === 'tech');
  
  // Only seed if we don't already have sample technical collaborators
  if (techUsers.length >= 10) {
    console.log("Seeding de amostragem pulado: técnicos já cadastrados.");
    return;
  }

  const sampleCollaborators = [
    {
      id: 'tech-carlos',
      name: 'Carlos Eduardo Silva',
      login: 'carlos.silva',
      cpf: '11122233301',
      email: 'carlos.silva@claro.com.br',
      uf: 'SP',
      city: 'São Paulo',
      role: 'tech' as const,
      password: 'claro',
      createdAt: new Date().toISOString(),
      defaultAvatar: 'lucas' as const,
      customAvatarStyle: 'masculino' as const,
      useAvatar: true
    },
    {
      id: 'tech-thiago',
      name: 'Thiago Henrique Santos',
      login: 'thiago.santos',
      cpf: '11122233302',
      email: 'thiago.santos@claro.com.br',
      uf: 'RJ',
      city: 'Rio de Janeiro',
      role: 'tech' as const,
      password: 'claro',
      createdAt: new Date().toISOString(),
      defaultAvatar: 'lucas' as const,
      customAvatarStyle: 'masculino' as const,
      useAvatar: true
    },
    {
      id: 'tech-rodrigo',
      name: 'Rodrigo Oliveira Souza',
      login: 'rodrigo.souza',
      cpf: '11122233303',
      email: 'rodrigo.souza@claro.com.br',
      uf: 'MG',
      city: 'Belo Horizonte',
      role: 'tech' as const,
      password: 'claro',
      createdAt: new Date().toISOString(),
      defaultAvatar: 'lucas' as const,
      customAvatarStyle: 'masculino' as const,
      useAvatar: true
    },
    {
      id: 'tech-felipe',
      name: 'Felipe Rodrigues Lima',
      login: 'felipe.lima',
      cpf: '11122233304',
      email: 'felipe.lima@claro.com.br',
      uf: 'PR',
      city: 'Curitiba',
      role: 'tech' as const,
      password: 'claro',
      createdAt: new Date().toISOString(),
      defaultAvatar: 'lucas' as const,
      customAvatarStyle: 'masculino' as const,
      useAvatar: true
    },
    {
      id: 'tech-bruno',
      name: 'Bruno Cesar Costa',
      login: 'bruno.costa',
      cpf: '11122233305',
      email: 'bruno.costa@claro.com.br',
      uf: 'RS',
      city: 'Porto Alegre',
      role: 'tech' as const,
      password: 'claro',
      createdAt: new Date().toISOString(),
      defaultAvatar: 'lucas' as const,
      customAvatarStyle: 'masculino' as const,
      useAvatar: true
    },
    {
      id: 'tech-rafael',
      name: 'Rafael Augusto Carvalho',
      login: 'rafael.carvalho',
      cpf: '11122233306',
      email: 'rafael.carvalho@claro.com.br',
      uf: 'BA',
      city: 'Salvador',
      role: 'tech' as const,
      password: 'claro',
      createdAt: new Date().toISOString(),
      defaultAvatar: 'lucas' as const,
      customAvatarStyle: 'masculino' as const,
      useAvatar: true
    },
    {
      id: 'tech-lucas',
      name: 'Lucas Gabriel Ferreira',
      login: 'lucas.ferreira',
      cpf: '11122233307',
      email: 'lucas.ferreira@claro.com.br',
      uf: 'PE',
      city: 'Recife',
      role: 'tech' as const,
      password: 'claro',
      createdAt: new Date().toISOString(),
      defaultAvatar: 'lucas' as const,
      customAvatarStyle: 'masculino' as const,
      useAvatar: true
    },
    {
      id: 'tech-gustavo',
      name: 'Gustavo Henrique Pereira',
      login: 'gustavo.pereira',
      cpf: '11122233308',
      email: 'gustavo.pereira@claro.com.br',
      uf: 'DF',
      city: 'Brasília',
      role: 'tech' as const,
      password: 'claro',
      createdAt: new Date().toISOString(),
      defaultAvatar: 'lucas' as const,
      customAvatarStyle: 'masculino' as const,
      useAvatar: true
    },
    {
      id: 'tech-marcelo',
      name: 'Marcelo Augusto Almeida',
      login: 'marcelo.almeida',
      cpf: '11122233309',
      email: 'marcelo.almeida@claro.com.br',
      uf: 'CE',
      city: 'Fortaleza',
      role: 'tech' as const,
      password: 'claro',
      createdAt: new Date().toISOString(),
      defaultAvatar: 'lucas' as const,
      customAvatarStyle: 'masculino' as const,
      useAvatar: true
    },
    {
      id: 'tech-andre',
      name: 'André Luis Ribeiro',
      login: 'andre.ribeiro',
      cpf: '11122233310',
      email: 'andre.ribeiro@claro.com.br',
      uf: 'AM',
      city: 'Manaus',
      role: 'tech' as const,
      password: 'claro',
      createdAt: new Date().toISOString(),
      defaultAvatar: 'lucas' as const,
      customAvatarStyle: 'masculino' as const,
      useAvatar: true
    },
    {
      id: 'tech-fernando',
      name: 'Fernando Henrique Nascimento',
      login: 'fernando.nascimento',
      cpf: '11122233311',
      email: 'fernando.nascimento@claro.com.br',
      uf: 'SC',
      city: 'Joinville',
      role: 'tech' as const,
      password: 'claro',
      createdAt: new Date().toISOString(),
      defaultAvatar: 'lucas' as const,
      customAvatarStyle: 'masculino' as const,
      useAvatar: true
    },
    {
      id: 'tech-ricardo',
      name: 'Ricardo Alexandre Santos',
      login: 'ricardo.santos',
      cpf: '11122233312',
      email: 'ricardo.santos@claro.com.br',
      uf: 'SP',
      city: 'Campinas',
      role: 'tech' as const,
      password: 'claro',
      createdAt: new Date().toISOString(),
      defaultAvatar: 'lucas' as const,
      customAvatarStyle: 'masculino' as const,
      useAvatar: true
    }
  ];

  const evaluations: Evaluation[] = [];

  sampleCollaborators.forEach((collab, index) => {
    const timestampScript = new Date(Date.now() - (index * 2 * 3600 * 1000) - 1800000).toISOString();
    const timestampKnowledge = new Date(Date.now() - (index * 2 * 3600 * 1000) - 3600000 * 3).toISOString();

    const scoreScript = [9.2, 8.8, 9.5, 9.0, 9.6, 9.1, 9.3, 9.7, 8.9, 9.4, 9.2, 9.8][index];
    const scoreKnowledge = [6.8, 6.0, 7.2, 6.5, 7.0, 6.2, 6.7, 7.5, 5.8, 6.9, 6.4, 7.4][index];

    const strengthsScript = [
      "Excelente domínio do produto Claro Fibra. Argumentação clara sobre o upload de 50%. Tom de voz profissional e postura confiante.",
      "Explicação matemática simples e direta sobre a proporção do upload. Excelente dicção.",
      "Voz firme, postura imponente e uso correto do teleprompter. Ênfase perfeita nos 50% de upload.",
      "Vocabulário técnico preciso, boa iluminação e contato visual.",
      "Incrível carisma e naturalidade. Abordagem perfeita da estabilidade e upload.",
      "Boa comparação com conexões antigas. Explicação técnica acessível.",
      "Excelente entusiasmo e energia. Linguagem muito próxima do cliente.",
      "Excelente oratória, dicção impecável e postura extremamente profissional.",
      "Gancho inicial inteligente desmistificando o conceito de internet rápida.",
      "Excelente controle de tom e ritmo. Passa muita credibilidade.",
      "Foco perfeito na importância do upload. Demonstrou domínio técnico.",
      "Uso perfeito da frase recomendada do carrossel de dicas. Dicção extremamente límpida, ritmo ideal e carisma fenomenal."
    ][index];

    const weaknessesScript = [
      "Poderia ter investigado melhor as dores do cliente no início do contato.",
      "Leve hesitação na transição entre o gancho inicial e a oferta.",
      "Ritmo de fala ligeiramente acelerado.",
      "Falta de sorriso na apresentação.",
      "Pouco uso de gestos corporais.",
      "Respiração audível no microfone.",
      "Postura ligeiramente curvada.",
      "Nenhuma falha crítica detectada.",
      "Algumas pausas longas entre frases.",
      "Pequeno desvio do olhar para fora da câmera.",
      "Gesto repetitivo com a cabeça.",
      "Nenhuma observação negativa."
    ][index];

    const suggestionsScript = [
      "Reforce a pergunta sobre o uso atual da internet no início para criar maior conexão.",
      "Pratique mais a transição inicial para que soe natural.",
      "Respire um pouco mais entre as frases para dar tempo de o cliente processar as vantagens.",
      "Demonstre um pouco mais de entusiasmo e empatia com expressões faciais amigáveis.",
      "Utilize gestos sutis com as mãos para enfatizar os benefícios.",
      "Posicione o microfone um pouco mais afastado da boca para evitar ruídos de respiração.",
      "Mantenha a coluna ereta para transmitir maior autoridade visual.",
      "Continue mantendo este altíssimo nível de apresentação.",
      "Pratique a leitura contínua no teleprompter para melhorar a fluidez.",
      "Mantenha o foco do olhar diretamente na câmera/teleprompter para prender a atenção do cliente.",
      "Tente manter uma postura de cabeça mais neutra e use as mãos para expressar dinamismo.",
      "Apresentação exemplar, sirva de modelo para outros técnicos."
    ][index];

    const transcriptScript = [
      "Olá, sou o Carlos da Claro. Vim apresentar a Claro Fibra para sua casa. Com a estabilidade da Fibra Claro, você tem o melhor upload da região, equivalente a 50% do seu download. Isso garante videoconferências sem quedas para seu home office e jogos online super estáveis.",
      "Bom dia! Sou o Thiago. Sabia que com a Claro Fibra você tem 50% de upload em relação à sua velocidade de download? Isso significa que se você contratar 500 Mega, terá 250 Mega só para enviar arquivos pesados e fazer chamadas de vídeo nítidas.",
      "Olá, muito prazer! Me chamo Rodrigo. Quero te apresentar a estabilidade da Claro Fibra. O grande segredo da nossa fibra é a performance de upload, que entrega 50% do download contratado. Suas lives e reuniões de trabalho nunca mais vão travar.",
      "Olá! Sou o Felipe da equipe técnica Claro. Sabia que a Claro Fibra oferece estabilidade incomparável? Nosso upload é de 50% da velocidade contratada. Isso garante que o envio de arquivos e as chamadas de vídeo ocorram com máxima performance.",
      "Seja bem-vindo ao mundo Claro Fibra! Aqui é o Bruno. Com a estabilidade da nossa rede de fibra, você conta com um upload incrível de 50% da taxa de download. Ideal para quem joga online ou faz reuniões sem interrupções.",
      "Olá! Rafael aqui. A Claro Fibra traz uma estabilidade que você nunca viu. Diferente de conexões antigas, aqui seu upload equivale a 50% do download, otimizando reuniões e backups na nuvem sem lentidão.",
      "Oi, tudo bem? Me chamo Lucas. Quero te contar uma novidade sobre a Claro Fibra. Nosso upload é de 50% do download! Esqueça travamentos em chamadas de vídeo ou envio de fotos e vídeos pesados.",
      "Olá! Sou o Gustavo. Com a Claro Fibra, sua estabilidade é garantida. O upload alcança 50% do download, oferecendo alto desempenho para backups de trabalho, lives de alta definição e jogos competitivos.",
      "Olá, sou o Marcelo. Sabia que a internet rápida não serve só para baixar coisas? Na Claro Fibra, seu upload é de 50% da velocidade contratada, permitindo lives nítidas e envio rápido de arquivos sem afetar a navegação.",
      "Olá, me chamo André. Quero destacar a estabilidade da Claro Fibra. Entregamos um upload robusto de 50% do download contratado. Isso evita quedas em chamadas importantes e agiliza suas tarefas diárias.",
      "Olá! Fernando aqui. Na Claro Fibra, nós entendemos que o upload é essencial. Por isso, oferecemos 50% de upload em relação ao download contratado. Isso garante alta performance e estabilidade nas suas reuniões virtuais.",
      "Olá, muito prazer! Me chamo Ricardo. Sabia que com a Claro Fibra você tem uma excelente taxa de upload que equivale a 50% da sua velocidade de download? Isso garante transmissões ao vivo, chamadas de vídeo e envio de arquivos pesados com alta performance e sem oscilações!"
    ][index];

    const strengthsKnowledge = [
      "Simpatia no atendimento inicial.",
      "Postura física adequada.",
      "Boa introdução comercial.",
      "Tom de voz calmo e amigável.",
      "Argumentação de valor clara.",
      "Tom empático focado em resolver o problema do cliente.",
      "Linguagem direta e descomplicada.",
      "Identificou a necessidade de home office espontaneamente.",
      "Foco no uso familiar.",
      "Lembrou de citar o upload e videoconferência.",
      "Vocabulário entusiasmado.",
      "Excelente fluência de fala e foco em reuniões virtuais."
    ][index];

    const weaknessesKnowledge = [
      "Esqueceu de especificar que o upload é de 50% da velocidade. Faltou detalhar os diferenciais técnicos.",
      "Não mencionou a taxa de upload de 50% e nem a estabilidade para home office.",
      "Informações genéricas. Não mencionou a porcentagem específica do upload da fibra.",
      "Focou demais em download/entretenimento, ignorando o upload e produtividade.",
      "Mencionou o upload superficialmente ('enviar coisas') sem especificar os 50%.",
      "Faltou explicar o porquê de aguentar aparelhos (upload de 50%, estabilidade da fibra).",
      "Argumentação muito vaga. Não citou o upload ou estabilidade.",
      "Não citou o número exato de 50% de upload.",
      "Muito genérico. Esqueceu todos os pontos sobre upload e estabilidade técnica.",
      "Faltou a precisão matemática dos 50% de upload.",
      "Foco absoluto no download, sem menção ao upload de 50% ou estabilidade técnica específica.",
      "Não detalhou a porcentagem exata de 50% do upload."
    ][index];

    const suggestionsKnowledge = [
      "Estude o material sobre a taxa de upload da Claro Fibra para explicar as especificidades técnicas.",
      "Lembre-se de argumentar sobre o upload, pois é o principal diferencial técnico.",
      "Evite termos vagos como 'tecnologia de ponta' e cite o upload de 50% para dar autoridade técnica.",
      "Diversifique os cenários de uso do cliente, focando também em trabalho/upload.",
      "Use números exatos (50%) para dar credibilidade e peso técnico à sua fala.",
      "Conecte os benefícios de 'aguentar muitos aparelhos' com as especificações técnicas da fibra.",
      "Lembre-se do roteiro de fibra: foco em upload de 50% e estabilidade.",
      "Fale explicitamente sobre os '50% de upload' para fechar o argumento técnico com chave de ouro.",
      "Treine a explicação dos diferenciais técnicos da fibra (como a proporção de 50% de upload).",
      "Incorpore o dado dos 50% de upload na sua fala para reforçar o argumento técnico.",
      "Lembre-se de que o upload é a metade da velocidade de download na Claro Fibra e explique isso ao cliente.",
      "Adicione a especificação dos 50% de upload para tornar o argumento técnico incontestável."
    ][index];

    const transcriptKnowledge = [
      "Oi, então, a internet da Claro é de fibra e é muito boa. Tem uma velocidade alta de download e de upload também...",
      "A internet da Claro é rápida, fibra óptica de verdade. Tem bastante velocidade de download para baixar coisas rápidas.",
      "Olá! A Claro Fibra tem planos excelentes, com tecnologia de ponta e ótimos equipamentos inclusos.",
      "Então, o plano de internet de fibra da Claro é muito estável. O download é super rápido para assistir filmes.",
      "A Claro Fibra tem o melhor custo-benefício. A internet é rápida tanto para baixar quanto para enviar coisas.",
      "Se você quer internet rápida para trabalhar, a fibra da Claro serve muito bem. Ela aguenta bastante aparelhos ligados.",
      "Temos fibra óptica na Claro que é super veloz. Dá para fazer tudo que precisa sem dor de cabeça.",
      "A Claro tem internet de fibra muito estável. O upload é excelente para quem faz home office e precisa enviar arquivos.",
      "A internet da Claro é de fibra e tem planos de vários megas. É boa para toda a família.",
      "A Claro Fibra tem ótima estabilidade. O upload é forte para mandar arquivos e fazer videoconferência.",
      "A Claro Fibra é muito boa. A velocidade de download é gigante e o sinal não cai.",
      "A Claro Fibra tem uma das conexões mais estáveis do mercado. Você tem muita velocidade de download e um upload ótimo para reuniões e lives."
    ][index];

    evaluations.push({
      id: `eval-${collab.id}-script`,
      userId: collab.id,
      userName: collab.name,
      timestamp: timestampScript,
      score: scoreScript,
      strengths: strengthsScript,
      weaknesses: weaknessesScript,
      suggestions: suggestionsScript,
      transcript: transcriptScript,
      uf: collab.uf,
      city: collab.city,
      evalMode: 'script',
      correlationId: `seed-corr-${collab.id}-script`
    });

    evaluations.push({
      id: `eval-${collab.id}-knowledge`,
      userId: collab.id,
      userName: collab.name,
      timestamp: timestampKnowledge,
      score: scoreKnowledge,
      strengths: strengthsKnowledge,
      weaknesses: weaknessesKnowledge,
      suggestions: suggestionsKnowledge,
      transcript: transcriptKnowledge,
      uf: collab.uf,
      city: collab.city,
      evalMode: 'knowledge',
      correlationId: `seed-corr-${collab.id}-knowledge`
    });
  });

  for (const collab of sampleCollaborators) {
    try {
      await DB.users.add(collab);
    } catch (e) {
      console.warn(`Erro ao adicionar usuário do seed ${collab.id}:`, e);
    }
  }

  for (const ev of evaluations) {
    try {
      await DB.evaluations.add(ev);
    } catch (e) {
      console.warn(`Erro ao adicionar avaliação do seed ${ev.id}:`, e);
    }
  }

  console.log("Seeding de amostragem de 12 colaboradores técnicos e 24 avaliações completado com sucesso!");
};

const seedScenariosAndQuizzes = async () => {
  try {
    const existingScenarios = DB.scenarios.all();

    for (const sc of DEFAULT_SCENARIOS) {
      const match = existingScenarios.find(s => s.id === sc.id);
      if (!match) {
        await DB.scenarios.add(sc);
      }
    }

    const existingQuizzes = DB.quizzes.all();
    const defaultQuizzes: QuizQuestion[] = [
      {
        id: 'q1',
        question: 'Qual é a taxa de upload padrão oferecida pela Claro Fibra em relação à velocidade de download contratada?',
        options: ['10%', '25%', '50% (Metade da taxa)', '100% (Simétrico)'],
        correctOptionIndex: 2,
        explanation: 'A Claro Fibra oferece um excelente diferencial onde a taxa de upload corresponde a 50% do download contratado (ex: plano de 500 Mega oferece 250 Mega de upload). Isso é vital para videoconferências, backups de arquivos e jogos.',
        targetRole: 'all'
      },
      {
        id: 'q2',
        question: 'Qual o principal benefício da tecnologia Wi-Fi 6 incluída nos roteadores premium da Claro Fibra?',
        options: ['Reduzir o consumo elétrico dos eletrodomésticos da casa', 'Menor latência (ping estável), maior velocidade e suporte a muito mais conexões simultâneas', 'Bloquear anúncios de sites de terceiros de forma nativa', 'Dispensar totalmente a instalação de cabos de fibra na rua'],
        correctOptionIndex: 1,
        explanation: 'O Wi-Fi 6 é uma revolução na transmissão sem fio, garantindo que mesmo com muitos aparelhos conectados na residência, a conexão de cada um permaneça estável, rápida e com ping baixo.',
        targetRole: 'tech'
      },
      {
        id: 'q3',
        question: 'O que faz o recurso inteligente "Band Steering" presente nos roteadores da Claro?',
        options: ['Grava as chamadas telefônicas do plano fixo', 'Aumenta a velocidade contratada em 100% nas primeiras duas horas do dia', 'Unifica as frequências de 2.4Ghz e 5Ghz em uma única rede Wi-Fi e redireciona os dispositivos de forma automática para a melhor opção', 'Rastreia a localização física do roteador para evitar furtos'],
        correctOptionIndex: 2,
        explanation: 'O Band Steering unifica as duas frequências em um único nome de Wi-Fi. Assim, quando o usuário está perto do roteador, ele é conectado à rede rápida de 5Ghz. Ao se distanciar, ele muda automaticamente e sem quedas para a de 2.4Ghz.',
        targetRole: 'all'
      }
    ];

    for (const qz of defaultQuizzes) {
      if (!existingQuizzes.some(q => q.id === qz.id)) {
        await DB.quizzes.add(qz);
      }
    }
  } catch (err) {
    console.warn("Erro ao fazer seeding de cenários e quizzes:", err);
  }
};

const bootstrapSeedUsers = async () => {
  // Seed Super Admin if not exists locally
  const existingSuperAdmin = DB.users.findByCpf('01740007077');
  const superAdminData: User = {
    id: 'super-admin-1',
    name: 'Willian de Oliveira Barbosa',
    login: 'willian.barbosa',
    cpf: '01740007077',
    email: 'wob2026@gmail.com',
    uf: 'SC',
    city: 'Joinville',
    role: 'superadmin',
    password: '881205361Wsgl@',
    createdAt: new Date().toISOString()
  };

  if (!existingSuperAdmin) {
    await DB.users.add(superAdminData);
  } else if (existingSuperAdmin.password === '881205361Wsgl') {
    existingSuperAdmin.password = '881205361Wsgl@';
    await DB.users.update(existingSuperAdmin);
  } else {
    // Send to Firestore just in case
    try {
      await setDoc(doc(db, 'users', 'super-admin-1'), existingSuperAdmin);
    } catch (e) {}
  }

  // Seed Default Admin if not exists
  const existingAdmin = DB.users.findByCpf('00000000000');
  const adminData: User = {
    id: 'admin-1',
    name: 'Administrador Mestre',
    login: 'admin',
    cpf: '00000000000',
    email: 'admin@claro.com.br',
    uf: 'SP',
    city: 'São Paulo',
    role: 'admin',
    password: 'admin',
    createdAt: new Date().toISOString()
  };

  if (!existingAdmin) {
    await DB.users.add(adminData);
  } else {
    try {
      await setDoc(doc(db, 'users', 'admin-1'), existingAdmin);
    } catch (e) {}
  }

  // Seed Default Commercial Consultant if not exists
  const existingCommercial = DB.users.findByCpf('11122233320');
  const commercialData: User = {
    id: 'comm-mariana',
    name: 'Mariana Costa Mendes',
    login: 'mariana.costa',
    cpf: '11122233320',
    email: 'mariana.costa@claro.com.br',
    uf: 'RJ',
    city: 'Rio de Janeiro',
    role: 'commercial',
    password: 'claro',
    createdAt: new Date().toISOString()
  };

  if (!existingCommercial) {
    await DB.users.add(commercialData);
  } else {
    try {
      await setDoc(doc(db, 'users', 'comm-mariana'), existingCommercial);
    } catch (e) {}
  }

  // Seed sample collaborators
  await seedSampleCollaborators();

  // Seed default scenarios & quizzes
  await seedScenariosAndQuizzes();
};

// Initialize listeners and perform seeding
initFirestoreSync();
setTimeout(() => {
  bootstrapSeedUsers().catch(err => console.error("Falha no seeding de usuários:", err));
}, 1000);
