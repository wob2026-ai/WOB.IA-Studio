
export type UserRole = 'tech' | 'commercial' | 'admin' | 'superadmin';
export type EvalMode = 'knowledge' | 'script' | 'simulator';

export interface User {
  id: string;
  name: string;
  login: string;
  cpf: string;
  email: string;
  uf: string;
  city: string;
  role: UserRole;
  password?: string;
  createdAt: string;
  defaultAvatar?: 'alex' | 'beatriz' | 'lucas' | 'mariana' | 'custom';
  customAvatarPhoto?: string;
  customAvatarStyle?: 'masculino' | 'feminino' | 'neutro';
  useAvatar?: boolean;
  authProvider?: 'google' | 'local';
  googlePhotoUrl?: string;
  customGeminiApiKey?: string;
}

export interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  timestamp: string;
  uf: string;
  city: string;
}

export interface Evaluation {
  id: string;
  userId: string;
  userName: string;
  timestamp: string;
  score: number;
  strengths: string;
  weaknesses: string;
  suggestions: string;
  videoUrl?: string;
  transcript: string;
  uf: string;
  city: string;
  evalMode: EvalMode;
  correlationId: string;
}

export interface Attempt {
  id: string;
  userId: string;
  timestamp: string;
  status: 'completed' | 'abandoned';
}

export interface Scenario {
  id: string;
  type: 'consultivo' | 'simulator';
  title: string;
  // Fields for consultivo
  product?: 'Virtua' | 'TV' | 'Mesh' | 'Móvel';
  customerName?: string;
  customerProfile?: string;
  image?: string;
  question?: string;
  // Fields for simulator
  scenario?: string;
  script?: string;
  character?: string;
  difficulty?: "Básico" | "Médio" | "Avançado";
  category?: string;
  // AI Evaluation Customization & Checklists
  evalCriteria?: string[];
  aiSystemInstruction?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  targetRole: 'tech' | 'commercial' | 'all';
  quizTitle?: string;
  quizSetId?: string;
}

export interface AIConfig {
  id: string;
  evaluationModel: string;
  evaluationSystemInstruction: string;
  simulatorModel: string;
  simulatorSystemInstruction: string;
  temperature: number;
  simulatorEnabled?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  module?: 'all' | 'consultivo' | 'simulator';
  active?: boolean;
  createdAt?: string;
  
  // Roteiro de Atendimento / Guia
  script?: string;
  
  // O que a I.A irá avaliar (Critérios de Sucesso)
  evalCriteria?: string[];
  
  // Configuração da I.A para aquele cenário/categoria
  aiSystemInstruction?: string;
  aiModel?: string;
  aiTemperature?: number;
}

export interface AppState {
  currentUser: User | null;
  isAuthenticated: boolean;
}

