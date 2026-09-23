import { User, AccessLog, Evaluation, Attempt, Scenario, QuizQuestion, AIConfig, Category } from './types';
import { supabase } from './supabase';

// --- CHAVES DE CACHE LOCAL PARA PERFORMANCE IMEDIATA ---
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

const DEFAULT_USERS: User[] = [
  {
    id: 'admin-1',
    name: 'Administrador Mestre',
    login: 'admin',
    cpf: '00000000000',
    email: 'admin@claro.com.br',
    uf: 'SP',
    city: 'São Paulo',
    role: 'admin',
    password: 'admin',
    authProvider: 'local',
    createdAt: new Date().toISOString()
  },
  {
    id: 'super-admin-1',
    name: 'Willian de Oliveira Barbosa',
    login: 'willian.barbosa',
    cpf: '01740007077',
    email: 'wob2026@gmail.com',
    uf: 'SC',
    city: 'Joinville',
    role: 'superadmin',
    password: 'admin',
    authProvider: 'local',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tech-carlos',
    name: 'Carlos Eduardo Silva',
    login: 'carlos.silva',
    cpf: '11122233301',
    email: 'carlos.silva@claro.com.br',
    uf: 'SP',
    city: 'São Paulo',
    role: 'tech',
    password: 'claro',
    authProvider: 'local',
    createdAt: new Date().toISOString()
  },
  {
    id: 'comm-mariana',
    name: 'Mariana Costa Mendes',
    login: 'mariana.costa',
    cpf: '11122233320',
    email: 'mariana.costa@claro.com.br',
    uf: 'RJ',
    city: 'Rio de Janeiro',
    role: 'commercial',
    password: 'claro',
    authProvider: 'local',
    createdAt: new Date().toISOString()
  }
];

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
      'Garantir ao cliente que a transição entre frequências é automática.'
    ],
    aiSystemInstruction: 'Avalie a capacidade de traduzir o recurso Band Steering e a diferença entre 2.4GHz e 5GHz em termos práticos do dia a dia, transmitindo segurança ao cliente.'
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
    script: '1. Acolha a insatisfação do cliente com empatia.\n2. Identifique o motivo real do pedido de cancelamento.\n3. Apresente os benefícios do plano atual antes de oferecer desconto.\n4. Realize a oferta de retenção com benefícios exclusivos.',
    evalCriteria: [
      'Empatia e escuta ativa no acolhimento do cliente',
      'Sondagem assertiva do motivo do cancelamento',
      'Argumentação sobre os diferenciais da Claro',
      'Clareza e transparência nas condições da oferta de retenção'
    ]
  },
  {
    id: 'cat-2',
    name: 'Vendas Consultivas',
    description: 'Abordagem focada em entender a necessidade do cliente',
    icon: '💼',
    module: 'all',
    active: true,
    script: '1. Cumprimente o cliente de forma acolhedora.\n2. Faça perguntas abertas sobre os hábitos da família.\n3. Recomende o plano Claro Fibra ideal justificando pelo uso citado.\n4. Apresente o combo ou Wi-Fi Mesh como solução complementar.',
    evalCriteria: [
      'Sondagem de perfil de uso antes do preço',
      'Recomendação técnica personalizada',
      'Explicação dos diferenciais do Wi-Fi 6 / Mesh',
      'Fechamento de venda com pergunta de confirmação'
    ]
  }
];

const DEFAULT_AI_CONFIG: AIConfig = {
  id: 'default',
  evaluationModel: 'gemini-3.6-flash',
  evaluationSystemInstruction: 'Você é um avaliador de excelência pedagógica Claro. Avalie a didática na explicação do colaborador. Verifique se usou linguagem acessível, acolhimento empático e clareza técnica sem complicação.',
  simulatorModel: 'gemini-3.6-flash',
  simulatorSystemInstruction: 'Você é um cliente real da Claro participando de um treinamento interativo.',
  temperature: 0.30,
  simulatorEnabled: true
};

// Funções auxiliares para leitura e escrita síncrona no LocalStorage
function getLocal<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Erro ao salvar cache local para chave ${key}:`, err);
  }
}

// --- MAPEADORES DE DADOS SUPABASE <-> DOMÍNIO APP ---

function mapProfileToUser(p: any): User {
  return {
    id: p.id,
    name: p.name || 'Colaborador',
    login: p.login || p.email || '',
    cpf: p.cpf || '',
    email: p.email || '',
    uf: p.uf || 'SP',
    city: p.city || 'São Paulo',
    role: p.role || 'tech',
    password: p.password || (p.role === 'admin' || p.role === 'superadmin' ? 'admin' : 'claro'),
    authProvider: p.auth_provider || 'local',
    customAvatarStyle: p.avatar_style || 'masculino',
    googlePhotoUrl: p.custom_photo_url || undefined,
    createdAt: p.created_at || new Date().toISOString()
  };
}

function mapUserToProfile(u: User) {
  return {
    id: u.id,
    name: u.name,
    login: u.login || u.email,
    cpf: u.cpf,
    email: u.email,
    uf: u.uf || 'SP',
    city: u.city || 'São Paulo',
    role: u.role,
    auth_provider: u.authProvider || 'local',
    avatar_style: u.customAvatarStyle || 'masculino',
    custom_photo_url: u.googlePhotoUrl || u.customAvatarPhoto || null
  };
}

function mapRowToEvaluation(row: any): Evaluation {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    score: Number(row.score) || 0,
    strengths: row.strengths || '',
    weaknesses: row.weaknesses || '',
    suggestions: row.suggestions || '',
    transcript: row.transcript || '',
    uf: row.uf || 'SP',
    city: row.city || 'São Paulo',
    evalMode: row.eval_mode || 'knowledge',
    correlationId: row.correlation_id || '',
    timestamp: row.created_at || new Date().toISOString()
  };
}

function mapEvaluationToRow(ev: Evaluation) {
  return {
    id: ev.id,
    user_id: ev.userId,
    user_name: ev.userName,
    score: ev.score,
    strengths: ev.strengths,
    weaknesses: ev.weaknesses,
    suggestions: ev.suggestions,
    transcript: ev.transcript || '',
    uf: ev.uf || 'SP',
    city: ev.city || 'São Paulo',
    eval_mode: ev.evalMode || 'knowledge',
    correlation_id: ev.correlationId || null
  };
}

function mapRowToScenario(row: any): Scenario {
  return {
    id: row.id,
    type: row.type || 'consultivo',
    title: row.title,
    product: row.product,
    customerName: row.customer_name,
    customerProfile: row.customer_profile,
    image: row.image_url,
    question: row.question,
    difficulty: row.difficulty,
    evalCriteria: Array.isArray(row.eval_criteria) ? row.eval_criteria : [],
    aiSystemInstruction: row.ai_system_instruction
  };
}

function mapScenarioToRow(sc: Scenario) {
  return {
    id: sc.id,
    type: sc.type || 'consultivo',
    title: sc.title,
    product: sc.product || null,
    customer_name: sc.customerName || null,
    customer_profile: sc.customerProfile || null,
    image_url: sc.image || null,
    question: sc.question || null,
    difficulty: sc.difficulty || 'Básico',
    eval_criteria: sc.evalCriteria || [],
    ai_system_instruction: sc.aiSystemInstruction || null
  };
}

function mapRowToCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    module: row.module || 'all',
    active: row.active ?? true,
    script: row.script,
    evalCriteria: Array.isArray(row.eval_criteria) ? row.eval_criteria : [],
    createdAt: row.created_at
  };
}

function mapCategoryToRow(cat: Category) {
  return {
    id: cat.id,
    name: cat.name,
    description: cat.description || null,
    icon: cat.icon || '💼',
    module: cat.module || 'all',
    active: cat.active ?? true,
    script: cat.script || null,
    eval_criteria: cat.evalCriteria || []
  };
}

function mapRowToQuiz(row: any): QuizQuestion {
  return {
    id: row.id,
    question: row.question,
    options: Array.isArray(row.options) ? row.options : [],
    correctOptionIndex: Number(row.correct_option_index) || 0,
    explanation: row.explanation || '',
    targetRole: row.target_role || 'all',
    quizTitle: row.quiz_title || undefined
  };
}

function mapQuizToRow(qz: QuizQuestion) {
  return {
    id: qz.id,
    question: qz.question,
    options: qz.options || [],
    correct_option_index: qz.correctOptionIndex,
    explanation: qz.explanation || '',
    target_role: qz.targetRole || 'all',
    quiz_title: qz.quizTitle || null
  };
}

function mapRowToAccessLog(row: any): AccessLog {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    uf: row.uf || 'SP',
    city: row.city || 'São Paulo',
    timestamp: row.created_at || new Date().toISOString()
  };
}

function mapAccessLogToRow(log: AccessLog) {
  return {
    id: log.id,
    user_id: log.userId,
    user_name: log.userName,
    uf: log.uf || 'SP',
    city: log.city || 'São Paulo'
  };
}

// --- SINCRONIZAÇÃO EM SEGUNDO PLANO COM SUPABASE ---

export const initSupabaseSync = async () => {
  try {
    // 1. Sincronizar Perfis / Usuários
    const { data: profilesData } = await supabase.from('profiles').select('*');
    if (profilesData && profilesData.length > 0) {
      const users = profilesData.map(mapProfileToUser);
      setLocal(KEYS.USERS, users);
    } else {
      // Se a tabela estiver vazia, popula com os usuários padrão no Supabase e no cache
      for (const u of DEFAULT_USERS) {
        await supabase.from('profiles').insert(mapUserToProfile(u));
      }
      setLocal(KEYS.USERS, DEFAULT_USERS);
    }

    // 2. Sincronizar Avaliações
    const { data: evalsData } = await supabase.from('evaluations').select('*').order('created_at', { ascending: false });
    if (evalsData) {
      const evals = evalsData.map(mapRowToEvaluation);
      setLocal(KEYS.EVALUATIONS, evals);
    }

    // 3. Sincronizar Cenários
    const { data: scData } = await supabase.from('scenarios').select('*');
    if (scData && scData.length > 0) {
      const scenarios = scData.map(mapRowToScenario);
      setLocal(KEYS.SCENARIOS, scenarios);
    } else {
      for (const sc of DEFAULT_SCENARIOS) {
        await supabase.from('scenarios').insert(mapScenarioToRow(sc));
      }
      setLocal(KEYS.SCENARIOS, DEFAULT_SCENARIOS);
    }

    // 4. Sincronizar Categorias
    const { data: catData } = await supabase.from('categories').select('*');
    if (catData && catData.length > 0) {
      const categories = catData.map(mapRowToCategory);
      setLocal(KEYS.CATEGORIES, categories);
    } else {
      for (const cat of DEFAULT_CATEGORIES) {
        await supabase.from('categories').insert(mapCategoryToRow(cat));
      }
      setLocal(KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    }

    // 5. Sincronizar Quizzes
    const { data: qzData } = await supabase.from('quizzes').select('*');
    if (qzData && qzData.length > 0) {
      const quizzes = qzData.map(mapRowToQuiz);
      setLocal(KEYS.QUIZZES, quizzes);
    }

    // 6. Sincronizar Logs de Acesso
    const { data: logData } = await supabase.from('access_logs').select('*').order('created_at', { ascending: false });
    if (logData) {
      const logs = logData.map(mapRowToAccessLog);
      setLocal(KEYS.ACCESSES, logs);
    }

    // 7. Sincronizar Configurações da IA
    const { data: aiData } = await supabase.from('ai_config').select('*').eq('id', 'default').single();
    if (aiData) {
      const aiConf: AIConfig = {
        id: 'default',
        evaluationModel: aiData.evaluation_model || 'gemini-3.6-flash',
        evaluationSystemInstruction: aiData.evaluation_system_instruction || '',
        simulatorModel: aiData.simulator_model || 'gemini-3.6-flash',
        simulatorSystemInstruction: aiData.simulator_system_instruction || '',
        temperature: Number(aiData.temperature) || 0.3,
        simulatorEnabled: aiData.simulator_enabled ?? true
      };
      setLocal(KEYS.AI_CONFIG, aiConf);
    }

    console.log('✅ Supabase: sincronização inicial de dados concluída.');
  } catch (err) {
    console.warn('Supabase sync notice (usando cache local):', err);
  }
};

// Alias para manter compatibilidade com qualquer referência anterior
export const initFirestoreSync = initSupabaseSync;

// --- INTERFACE PRINCIPAL DO BANCO DE DADOS (DB) ---

export const DB = {
  users: {
    all: (): User[] => getLocal<User[]>(KEYS.USERS, DEFAULT_USERS),
    
    add: async (user: User) => {
      const users = getLocal<User[]>(KEYS.USERS, DEFAULT_USERS);
      const updated = [...users.filter(u => u.id !== user.id), user];
      setLocal(KEYS.USERS, updated);

      try {
        await supabase.from('profiles').upsert(mapUserToProfile(user));
      } catch (err) {
        console.warn('Erro ao salvar profile no Supabase:', err);
      }
    },

    update: async (updatedUser: User) => {
      const users = getLocal<User[]>(KEYS.USERS, DEFAULT_USERS);
      const index = users.findIndex(u => u.id === updatedUser.id);
      if (index !== -1) {
        users[index] = updatedUser;
        setLocal(KEYS.USERS, [...users]);
      }

      try {
        await supabase.from('profiles').update(mapUserToProfile(updatedUser)).eq('id', updatedUser.id);
      } catch (err) {
        console.warn('Erro ao atualizar profile no Supabase:', err);
      }
    },

    delete: async (id: string) => {
      const users = getLocal<User[]>(KEYS.USERS, DEFAULT_USERS).filter(u => u.id !== id);
      setLocal(KEYS.USERS, users);

      try {
        await supabase.from('profiles').delete().eq('id', id);
      } catch (err) {
        console.warn('Erro ao excluir profile no Supabase:', err);
      }
    },

    findByCpf: (cpf: string) => {
      const clean = cpf.replace(/\D/g, '');
      return getLocal<User[]>(KEYS.USERS, DEFAULT_USERS).find(u => (u.cpf || '').replace(/\D/g, '') === clean);
    },

    findByEmail: (email: string) => {
      const target = (email || '').toLowerCase().trim();
      return getLocal<User[]>(KEYS.USERS, DEFAULT_USERS).find(u => (u.email || '').toLowerCase().trim() === target);
    },

    findById: (id: string) => {
      return getLocal<User[]>(KEYS.USERS, DEFAULT_USERS).find(u => u.id === id);
    }
  },

  evaluations: {
    all: (): Evaluation[] => getLocal<Evaluation[]>(KEYS.EVALUATIONS, []),

    add: async (ev: Evaluation) => {
      const evals = getLocal<Evaluation[]>(KEYS.EVALUATIONS, []);
      const updated = [ev, ...evals.filter(e => e.id !== ev.id)];
      setLocal(KEYS.EVALUATIONS, updated);

      try {
        await supabase.from('evaluations').insert(mapEvaluationToRow(ev));
      } catch (err) {
        console.warn('Erro ao salvar avaliação no Supabase:', err);
      }
    },

    delete: async (id: string) => {
      const evals = getLocal<Evaluation[]>(KEYS.EVALUATIONS, []).filter(e => e.id !== id);
      setLocal(KEYS.EVALUATIONS, evals);

      try {
        await supabase.from('evaluations').delete().eq('id', id);
      } catch (err) {
        console.warn('Erro ao excluir avaliação no Supabase:', err);
      }
    },

    deleteByUserId: async (userId: string) => {
      const evals = getLocal<Evaluation[]>(KEYS.EVALUATIONS, []).filter(e => e.userId !== userId);
      setLocal(KEYS.EVALUATIONS, evals);

      try {
        await supabase.from('evaluations').delete().eq('user_id', userId);
      } catch (err) {
        console.warn('Erro ao excluir avaliações do usuário no Supabase:', err);
      }
    },

    deleteAll: async () => {
      setLocal(KEYS.EVALUATIONS, []);
      try {
        await supabase.from('evaluations').delete().neq('id', 'placeholder_keep_none');
      } catch (err) {
        console.warn('Erro ao limpar avaliações no Supabase:', err);
      }
    }
  },

  accesses: {
    all: (): AccessLog[] => getLocal<AccessLog[]>(KEYS.ACCESSES, []),

    add: async (log: AccessLog) => {
      const logs = getLocal<AccessLog[]>(KEYS.ACCESSES, []);
      setLocal(KEYS.ACCESSES, [log, ...logs]);

      try {
        await supabase.from('access_logs').insert(mapAccessLogToRow(log));
      } catch (err) {
        console.warn('Erro ao registrar log no Supabase:', err);
      }
    },

    deleteByUserId: async (userId: string) => {
      const logs = getLocal<AccessLog[]>(KEYS.ACCESSES, []).filter(l => l.userId !== userId);
      setLocal(KEYS.ACCESSES, logs);

      try {
        await supabase.from('access_logs').delete().eq('user_id', userId);
      } catch (err) {
        console.warn('Erro ao remover logs de acesso no Supabase:', err);
      }
    },

    deleteAll: async () => {
      setLocal(KEYS.ACCESSES, []);
      try {
        await supabase.from('access_logs').delete().neq('id', 'placeholder_keep_none');
      } catch (err) {
        console.warn('Erro ao limpar logs de acesso no Supabase:', err);
      }
    }
  },

  scenarios: {
    all: (): Scenario[] => getLocal<Scenario[]>(KEYS.SCENARIOS, DEFAULT_SCENARIOS),

    add: async (scenario: Scenario) => {
      const scs = getLocal<Scenario[]>(KEYS.SCENARIOS, DEFAULT_SCENARIOS);
      setLocal(KEYS.SCENARIOS, [...scs, scenario]);

      try {
        await supabase.from('scenarios').insert(mapScenarioToRow(scenario));
      } catch (err) {
        console.warn('Erro ao adicionar cenário no Supabase:', err);
      }
    },

    addAll: async (newScenarios: Scenario[]) => {
      const scs = getLocal<Scenario[]>(KEYS.SCENARIOS, DEFAULT_SCENARIOS);
      const updated = [...scs, ...newScenarios];
      setLocal(KEYS.SCENARIOS, updated);

      try {
        for (const s of newScenarios) {
          await supabase.from('scenarios').insert(mapScenarioToRow(s));
        }
      } catch (err) {
        console.warn('Erro ao adicionar cenários em lote no Supabase:', err);
      }
    },

    update: async (updatedScenario: Scenario) => {
      const scs = getLocal<Scenario[]>(KEYS.SCENARIOS, DEFAULT_SCENARIOS);
      const index = scs.findIndex(s => s.id === updatedScenario.id);
      if (index !== -1) {
        scs[index] = updatedScenario;
        setLocal(KEYS.SCENARIOS, [...scs]);
      }

      try {
        await supabase.from('scenarios').update(mapScenarioToRow(updatedScenario)).eq('id', updatedScenario.id);
      } catch (err) {
        console.warn('Erro ao atualizar cenário no Supabase:', err);
      }
    },

    delete: async (id: string) => {
      const scs = getLocal<Scenario[]>(KEYS.SCENARIOS, DEFAULT_SCENARIOS).filter(s => s.id !== id);
      setLocal(KEYS.SCENARIOS, scs);

      try {
        await supabase.from('scenarios').delete().eq('id', id);
      } catch (err) {
        console.warn('Erro ao remover cenário no Supabase:', err);
      }
    },

    resetToDefaults: async () => {
      setLocal(KEYS.SCENARIOS, DEFAULT_SCENARIOS);
      try {
        await supabase.from('scenarios').delete().neq('id', 'keep_none');
        for (const s of DEFAULT_SCENARIOS) {
          await supabase.from('scenarios').insert(mapScenarioToRow(s));
        }
      } catch (err) {
        console.warn('Erro ao resetar cenários no Supabase:', err);
      }
    }
  },

  categories: {
    all: (): Category[] => getLocal<Category[]>(KEYS.CATEGORIES, DEFAULT_CATEGORIES),

    add: async (cat: Category) => {
      const cats = getLocal<Category[]>(KEYS.CATEGORIES, DEFAULT_CATEGORIES);
      setLocal(KEYS.CATEGORIES, [...cats, cat]);

      try {
        await supabase.from('categories').insert(mapCategoryToRow(cat));
      } catch (err) {
        console.warn('Erro ao adicionar categoria no Supabase:', err);
      }
    },

    update: async (updatedCat: Category) => {
      const cats = getLocal<Category[]>(KEYS.CATEGORIES, DEFAULT_CATEGORIES);
      const index = cats.findIndex(c => c.id === updatedCat.id);
      if (index !== -1) {
        cats[index] = updatedCat;
        setLocal(KEYS.CATEGORIES, [...cats]);
      }

      try {
        await supabase.from('categories').update(mapCategoryToRow(updatedCat)).eq('id', updatedCat.id);
      } catch (err) {
        console.warn('Erro ao atualizar categoria no Supabase:', err);
      }
    },

    delete: async (id: string) => {
      const cats = getLocal<Category[]>(KEYS.CATEGORIES, DEFAULT_CATEGORIES).filter(c => c.id !== id);
      setLocal(KEYS.CATEGORIES, cats);

      try {
        await supabase.from('categories').delete().eq('id', id);
      } catch (err) {
        console.warn('Erro ao remover categoria no Supabase:', err);
      }
    },

    resetToDefaults: async () => {
      setLocal(KEYS.CATEGORIES, DEFAULT_CATEGORIES);
      try {
        await supabase.from('categories').delete().neq('id', 'keep_none');
        for (const c of DEFAULT_CATEGORIES) {
          await supabase.from('categories').insert(mapCategoryToRow(c));
        }
      } catch (err) {
        console.warn('Erro ao resetar categorias no Supabase:', err);
      }
    }
  },

  quizzes: {
    all: (): QuizQuestion[] => getLocal<QuizQuestion[]>(KEYS.QUIZZES, []),

    add: async (q: QuizQuestion) => {
      const qz = getLocal<QuizQuestion[]>(KEYS.QUIZZES, []);
      setLocal(KEYS.QUIZZES, [...qz, q]);

      try {
        await supabase.from('quizzes').insert(mapQuizToRow(q));
      } catch (err) {
        console.warn('Erro ao adicionar quiz no Supabase:', err);
      }
    },

    addAll: async (newQuizzes: QuizQuestion[]) => {
      const qz = getLocal<QuizQuestion[]>(KEYS.QUIZZES, []);
      const updated = [...qz, ...newQuizzes];
      setLocal(KEYS.QUIZZES, updated);

      try {
        for (const q of newQuizzes) {
          await supabase.from('quizzes').insert(mapQuizToRow(q));
        }
      } catch (err) {
        console.warn('Erro ao adicionar quizzes em lote no Supabase:', err);
      }
    },

    update: async (updatedQuiz: QuizQuestion) => {
      const qz = getLocal<QuizQuestion[]>(KEYS.QUIZZES, []);
      const index = qz.findIndex(q => q.id === updatedQuiz.id);
      if (index !== -1) {
        qz[index] = updatedQuiz;
        setLocal(KEYS.QUIZZES, [...qz]);
      }

      try {
        await supabase.from('quizzes').update(mapQuizToRow(updatedQuiz)).eq('id', updatedQuiz.id);
      } catch (err) {
        console.warn('Erro ao atualizar quiz no Supabase:', err);
      }
    },

    delete: async (id: string) => {
      const qz = getLocal<QuizQuestion[]>(KEYS.QUIZZES, []).filter(q => q.id !== id);
      setLocal(KEYS.QUIZZES, qz);

      try {
        await supabase.from('quizzes').delete().eq('id', id);
      } catch (err) {
        console.warn('Erro ao remover quiz no Supabase:', err);
      }
    },

    resetToDefaults: async () => {
      setLocal(KEYS.QUIZZES, []);
      try {
        await supabase.from('quizzes').delete().neq('id', 'keep_none');
      } catch (err) {
        console.warn('Erro ao limpar quizzes no Supabase:', err);
      }
    }
  },

  aiConfig: {
    get: (): AIConfig => getLocal<AIConfig>(KEYS.AI_CONFIG, DEFAULT_AI_CONFIG),

    set: async (config: AIConfig) => {
      setLocal(KEYS.AI_CONFIG, config);

      try {
        await supabase.from('ai_config').upsert({
          id: 'default',
          evaluation_model: config.evaluationModel,
          evaluation_system_instruction: config.evaluationSystemInstruction,
          simulator_model: config.simulatorModel,
          simulator_system_instruction: config.simulatorSystemInstruction,
          temperature: config.temperature,
          simulator_enabled: config.simulatorEnabled,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Erro ao atualizar ai_config no Supabase:', err);
      }
    },

    save: async (config: AIConfig) => {
      return DB.aiConfig.set(config);
    }
  },

  attempts: {
    all: (): Attempt[] => getLocal<Attempt[]>(KEYS.ATTEMPTS, []),
    add: async (att: Attempt) => {
      const atts = getLocal<Attempt[]>(KEYS.ATTEMPTS, []);
      setLocal(KEYS.ATTEMPTS, [...atts, att]);
    }
  }
};

// Iniciar a sincronização com Supabase assim que o arquivo é importado
initSupabaseSync();
