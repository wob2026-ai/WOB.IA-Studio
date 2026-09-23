
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { 
  Key, Sparkles, Check, CheckCircle2, AlertCircle, ExternalLink, 
  ShieldCheck, User as UserIcon, X, Loader2, Home, Video, Bot, Settings, LogOut 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  onHome?: () => void;
  onAdminClick?: () => void;
  onNavigate?: (page: any) => void;
  currentPage?: string;
  onUpdateUser?: (updatedUser: User) => void;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  user, 
  onLogout, 
  onHome, 
  onAdminClick, 
  onNavigate,
  currentPage = 'dashboard',
  onUpdateUser, 
  title 
}) => {
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSimplifiedRole = user?.role === 'tech' || user?.role === 'commercial';
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('explica_font_size');
    return saved ? parseInt(saved, 10) : 16;
  });

  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>(user?.customGeminiApiKey || '');
  const [testingKey, setTestingKey] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savingUser, setSavingUser] = useState<boolean>(false);

  useEffect(() => {
    if (user?.customGeminiApiKey !== undefined) {
      setApiKeyInput(user.customGeminiApiKey || '');
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem('explica_font_size', fontSize.toString());
  }, [fontSize]);

  const adjustFontSize = (delta: number) => {
    setFontSize(prev => {
      const next = prev + delta;
      return Math.min(Math.max(next, 12), 24); // Limit between 12px and 24px
    });
  };

  const handleTestKey = async () => {
    if (!apiKeyInput.trim()) {
      setTestResult({ success: false, message: 'Digite uma chave de API para testar.' });
      return;
    }

    setTestingKey(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/ai/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() })
      });
      const data = await response.json();
      setTestResult({
        success: data.success,
        message: data.message || (data.success ? 'Chave validada com sucesso!' : 'Falha na validação.')
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Erro de comunicação ao testar chave.'
      });
    } finally {
      setTestingKey(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!user || !onUpdateUser) return;
    setSavingUser(true);
    try {
      const updated: User = {
        ...user,
        customGeminiApiKey: apiKeyInput.trim() || undefined
      };
      await onUpdateUser(updated);
      setTestResult({ success: true, message: 'Chave de API salva com sucesso no seu perfil!' });
      setTimeout(() => {
        setShowProfileModal(false);
      }, 1200);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar as configurações.');
    } finally {
      setSavingUser(false);
    }
  };

  const handleClearApiKey = async () => {
    if (!user || !onUpdateUser) return;
    setApiKeyInput('');
    setTestResult(null);
    setSavingUser(true);
    try {
      const updated: User = {
        ...user,
        customGeminiApiKey: undefined
      };
      await onUpdateUser(updated);
      setTestResult({ success: true, message: 'Chave removida. Usando contingência padrão do sistema.' });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingUser(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <header 
        className="claro-red text-white shadow-md px-3 sm:px-4 py-2.5 sm:py-3 sticky top-0 z-50 transition-all"
        style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top, 0px))' }}
      >
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-2">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button 
              onClick={user ? onHome : undefined}
              className={`flex items-center gap-1.5 sm:gap-2 outline-none transition-opacity ${user ? 'hover:opacity-85 active:scale-95 cursor-pointer' : 'cursor-default'}`}
              title={user ? "Voltar ao menu principal" : "Explica+"}
              disabled={!user}
            >
              <div className="bg-white text-[#ee0000] font-black rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] sm:text-xs shadow-sm shrink-0">
                E+
              </div>
              <h1 className="text-base sm:text-xl font-black tracking-tighter whitespace-nowrap">EXPLICA +</h1>
            </button>

            {/* Font Adjuster */}
            <div className="flex items-center bg-white/15 rounded-lg p-0.5 ml-1 sm:ml-2 shrink-0">
              <button 
                onClick={() => adjustFontSize(-1)}
                className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center hover:bg-white/20 active:bg-white/30 rounded-md transition-colors text-[10px] font-bold"
                title="Diminuir tamanho da fonte"
              >
                A-
              </button>
              <button 
                onClick={() => adjustFontSize(1)}
                className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center hover:bg-white/20 active:bg-white/30 rounded-md transition-colors text-xs sm:text-sm font-bold"
                title="Aumentar tamanho da fonte"
              >
                A+
              </button>
            </div>
          </div>
          
          {/* Header Actions when logged in */}
          {user && (
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Botão de Perfil / Chave IA */}
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-1.5 sm:gap-2 bg-white/15 hover:bg-white/25 active:scale-95 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border border-white/20 transition-all cursor-pointer text-left"
                title="Meu Perfil e Consumo de IA"
              >
                {user.googlePhotoUrl ? (
                  <img src={user.googlePhotoUrl} alt={user.name} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-white/40 shrink-0" />
                ) : (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 text-white font-black text-[9px] sm:text-[10px] flex items-center justify-center shrink-0">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:flex flex-col">
                  <span className="text-xs font-bold leading-tight flex items-center gap-1 max-w-[110px] truncate">
                    {user.name.split(' ')[0]}
                    {user.customGeminiApiKey && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" title="Chave de IA Própria Ativa"></span>
                    )}
                  </span>
                  <span className="text-[9px] opacity-75 font-semibold leading-none">
                    {user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : user.role === 'commercial' ? 'Comercial' : 'Técnico'}
                  </span>
                </div>
              </button>

              {/* Botão Admin no Header Desktop */}
              {isAdmin && (
                <button 
                  onClick={onAdminClick}
                  className="hidden sm:flex bg-white text-[#ee0000] px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter hover:bg-red-50 transition-all shadow-sm items-center gap-1 cursor-pointer active:scale-95"
                  title="Acessar Painel Administrativo"
                >
                  <Settings className="w-3 h-3" />
                  Admin
                </button>
              )}

              {/* Botão Sair */}
              <button 
                onClick={onLogout}
                className="bg-white/10 hover:bg-white/25 active:scale-95 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-colors border border-white/10 cursor-pointer flex items-center gap-1"
                title="Sair do aplicativo"
              >
                <LogOut className="w-3.5 h-3.5 sm:hidden" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Screen Container - optimized for mobile single column and safe area bottom */}
      <main className={`flex-1 max-w-4xl w-full mx-auto px-3 sm:px-4 py-3 sm:py-6 ${user ? 'pb-24 md:pb-8' : 'pb-6'}`}>
        {title && <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 claro-text-red animate-fadeIn">{title}</h2>}
        {children}
      </main>

      {/* NATIVE MOBILE BOTTOM NAVIGATION (iOS & Android) */}
      {user && (
        <nav 
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 pt-1.5"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
          aria-label="Navegação inferior mobile"
        >
          <div className="flex justify-around items-center max-w-md mx-auto">
            {/* Início / Dashboard */}
            <button
              onClick={() => onNavigate ? onNavigate('dashboard') : (onHome && onHome())}
              className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                currentPage === 'dashboard' ? 'text-[#ee0000]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${currentPage === 'dashboard' ? 'bg-red-50' : ''}`}>
                <Home className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className={`text-[10px] tracking-tight ${currentPage === 'dashboard' ? 'font-black' : 'font-semibold'}`}>
                Início
              </span>
            </button>

            {/* Consultivo */}
            <button
              onClick={() => onNavigate ? onNavigate('consultivo') : undefined}
              className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                currentPage === 'consultivo' || currentPage === 'recorder' ? 'text-[#ee0000]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${currentPage === 'consultivo' || currentPage === 'recorder' ? 'bg-red-50' : ''}`}>
                <Video className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className={`text-[10px] tracking-tight ${currentPage === 'consultivo' || currentPage === 'recorder' ? 'font-black' : 'font-semibold'}`}>
                Treinar
              </span>
            </button>

            {/* Simulador IA (apenas para perfis com acesso) */}
            {!isSimplifiedRole && (
              <button
                onClick={() => onNavigate ? onNavigate('simulator') : undefined}
                className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                  currentPage === 'simulator' ? 'text-[#ee0000]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={`p-1 rounded-xl transition-all ${currentPage === 'simulator' ? 'bg-red-50' : ''}`}>
                  <Bot className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className={`text-[10px] tracking-tight ${currentPage === 'simulator' ? 'font-black' : 'font-semibold'}`}>
                  Simulador
                </span>
              </button>
            )}

            {/* Admin (se admin ou superadmin) */}
            {isAdmin && (
              <button
                onClick={onAdminClick || (() => onNavigate && onNavigate('admin'))}
                className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                  currentPage === 'admin' ? 'text-[#ee0000]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={`p-1 rounded-xl transition-all ${currentPage === 'admin' ? 'bg-red-50' : ''}`}>
                  <Settings className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className={`text-[10px] tracking-tight ${currentPage === 'admin' ? 'font-black' : 'font-semibold'}`}>
                  Admin
                </span>
              </button>
            )}

            {/* Perfil & IA */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex-1 py-1 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer text-gray-400 hover:text-gray-600"
            >
              <div className="p-1 rounded-xl">
                {user.googlePhotoUrl ? (
                  <img src={user.googlePhotoUrl} alt="Foto" className="w-5 h-5 rounded-full object-cover border border-gray-300" />
                ) : (
                  <UserIcon className="w-5 h-5 stroke-[2.2]" />
                )}
              </div>
              <span className="text-[10px] font-semibold tracking-tight">
                Perfil
              </span>
            </button>
          </div>
        </nav>
      )}

      {/* Modal de Perfil do Usuário e Chave Própria Google AI */}
      {showProfileModal && user && (
        <div className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[24px] sm:rounded-[32px] shadow-2xl p-5 sm:p-8 relative animate-scaleUp max-h-[88dvh] overflow-y-auto scroll-touch">
            <button 
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-red-500 cursor-pointer p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho do Perfil */}
            <div className="flex items-center gap-4 border-b border-gray-100 pb-5 mb-5">
              {user.googlePhotoUrl ? (
                <img src={user.googlePhotoUrl} alt={user.name} className="w-14 h-14 rounded-full border-2 border-red-500 object-cover shadow-sm" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 font-black text-lg flex items-center justify-center">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-lg font-black text-gray-800 leading-tight">{user.name}</h3>
                <p className="text-xs text-gray-500">{user.email || user.login}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                    {user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Administrador' : user.role === 'commercial' ? 'Consultor Comercial' : 'Técnico de Campo'}
                  </span>
                  {user.authProvider === 'google' && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      Google Auth
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Seção BYOK - Chave Própria do Google AI Studio */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-red-50/50 to-orange-50/30 p-4 rounded-2xl border border-red-100">
                <div className="flex items-center gap-2 mb-2 text-[#ee0000]">
                  <Key className="w-4 h-4" />
                  <h4 className="text-xs font-black uppercase tracking-wider">Consumo Próprio de I.A (Google AI Studio)</h4>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Você pode usar a sua <strong>própria cota gratuita</strong> do Google AI Studio. 
                  Ao preencher sua chave, todas as avaliações de vídeo, simulações de atendimento e geração de quizzes serão debitadas da sua conta Google, <strong>mantendo integralmente todas as diretrizes pedagógicas e critérios da Claro</strong>.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
                  Sua Chave de API Gemini (AIza...)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Cole sua API Key do Google AI Studio aqui"
                    className="w-full p-3.5 pr-10 bg-gray-50 rounded-xl border border-gray-200 focus:claro-border-red outline-none text-xs font-mono text-gray-800"
                  />
                  {apiKeyInput && (
                    <button
                      onClick={() => setApiKeyInput('')}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                      title="Limpar campo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-bold text-[11px] flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Obter chave gratuita no Google AI Studio
                </a>

                {apiKeyInput.trim() && (
                  <button
                    type="button"
                    onClick={handleTestKey}
                    disabled={testingKey}
                    className="text-xs font-black text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {testingKey ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-gray-600" />
                        Testando...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3 h-3 text-green-600" />
                        Testar Conexão
                      </>
                    )}
                  </button>
                )}
              </div>

              {testResult && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-fadeIn ${testResult.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span className="font-semibold">{testResult.message}</span>
                </div>
              )}

              <div className="pt-3 flex gap-2">
                {user.customGeminiApiKey && (
                  <button
                    type="button"
                    onClick={handleClearApiKey}
                    disabled={savingUser}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Usar Padrão do Sistema
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  disabled={savingUser}
                  className="flex-1 py-3 claro-red hover:bg-red-700 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  {savingUser ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Configurações'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-gray-100 p-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Copyright - Willian O. Barbosa
      </footer>
    </div>
  );
};

