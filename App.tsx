
import React, { useState, useEffect } from 'react';
import { User, EvalMode, Evaluation as EvalModel } from './types';
import { DB } from './db';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Consultivo } from './pages/Consultivo';
import { Recorder } from './pages/Recorder';
import { EvaluationResult } from './pages/EvaluationResult';
import { AdminDashboard } from './pages/AdminDashboard';
import { AISimulator } from './pages/AISimulator';
import { evaluateExplanation, EvaluationResult as AIResult } from './services/geminiService';
import { MediaStorage } from './services/storageService';

const LOADING_MESSAGES = [
  "A Inteligência Artificial está analisando seu vídeo...",
  "Observando expressões faciais e postura...",
  "Avaliando a nitidez da sua explicação...",
  "Medindo o nível de empatia e conexão...",
  "Comparando com os padrões de excelência Claro...",
  "Gerando seu relatório detalhado de performance..."
];

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('login');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  
  const [lastEval, setLastEval] = useState<(AIResult & { id: string }) | null>(null);
  const [previousEval, setPreviousEval] = useState<AIResult | null>(null);
  const [activeScenario, setActiveScenario] = useState<any>(null);
  const [recordingMode, setRecordingMode] = useState<EvalMode>('knowledge');
  const [correlationId, setCorrelationId] = useState<string>('');

  useEffect(() => {
    MediaStorage.init().catch(err => console.error("Falha ao iniciar IndexedDB:", err));
    const savedUser = localStorage.getItem('explica_session');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      const freshUser = DB.users.findById(u.id);
      if (freshUser) {
        setUser(freshUser);
        setCurrentPage('dashboard');
      }
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleLogin = (cpf: string, pass: string) => {
    const foundUser = DB.users.findByCpf(cpf);
    if (foundUser && foundUser.password === pass) {
      setUser(foundUser);
      localStorage.setItem('explica_session', JSON.stringify(foundUser));
      DB.accesses.add({ id: Math.random().toString(36).substr(2, 9), userId: foundUser.id, userName: foundUser.name, timestamp: new Date().toISOString(), uf: foundUser.uf, city: foundUser.city });
      setCurrentPage('dashboard');
    } else alert("Credenciais inválidas");
  };

  const handleStartScenario = (scenario: any) => {
    setActiveScenario(scenario);
    setRecordingMode('knowledge');
    setCorrelationId(Math.random().toString(36).substr(2, 9));
    setPreviousEval(null);
    setCurrentPage('recorder');
  };

  const handleRecorderComplete = async (video: Blob, finalMode?: EvalMode, liveTranscript?: string) => {
    const modeToUse = finalMode || recordingMode;
    if (finalMode) {
      setRecordingMode(finalMode);
    }
    setLoading(true);
    try {
      const evalId = Math.random().toString(36).substr(2, 9);
      await MediaStorage.save(evalId, video);
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(video);
      });
      const base64Video = await base64Promise;
      
      const scenarioContext = activeScenario ? `Cenário: Atendimento para ${activeScenario.customerName}. Produto: ${activeScenario.product}. Dúvida: ${activeScenario.question}. Modo: ${modeToUse}.` : undefined;

      const result = await evaluateExplanation(
        base64Video, 
        video.type || 'video/mp4', 
        scenarioContext,
        modeToUse,
        previousEval?.score,
        user?.customGeminiApiKey,
        activeScenario?.aiSystemInstruction,
        activeScenario?.evalCriteria,
        liveTranscript
      );
      
      // Se retornou score 0 com mensagem de erro crítico do serviço, mostramos alerta
      if (result.score === 0 && result.strengths.includes("Não foi possível")) {
        alert(`Atenção: ${result.weaknesses}\n\nDica: ${result.suggestions}`);
      }
      
      if (user) {
        DB.evaluations.add({
          id: evalId, userId: user.id, userName: user.name, timestamp: new Date().toISOString(),
          score: result.score, strengths: result.strengths, weaknesses: result.weaknesses,
          suggestions: result.suggestions, transcript: result.transcript,
          uf: user.uf, city: user.city, evalMode: modeToUse, correlationId: correlationId
        });
      }

      setLastEval({ ...result, id: evalId });
      setCurrentPage('result');
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro crítico ao processar o vídeo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const startScriptedMode = () => {
    setPreviousEval(lastEval);
    setRecordingMode('script');
    setCurrentPage('recorder');
  };

  const handleDeleteCurrentEval = async (id: string) => {
    if (window.confirm("Tem certeza que deseja descartar esta avaliação? Ela será excluída permanentemente.")) {
      try {
        DB.evaluations.delete(id);
        await MediaStorage.delete(id);
        setLastEval(null);
        setCurrentPage('dashboard');
      } catch (err) {
        console.error(err);
        alert("Erro ao excluir a gravação.");
      }
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('explica_session', JSON.stringify(updatedUser));
    await DB.users.update(updatedUser);
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('explica_session', JSON.stringify(loggedInUser));
    setCurrentPage('dashboard');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-fadeIn text-center">
          <div className="flex space-x-2"><div className="w-4 h-4 claro-red rounded-full dot-1"></div><div className="w-4 h-4 claro-red rounded-full dot-2"></div><div className="w-4 h-4 claro-red rounded-full dot-3"></div></div>
          <div className="space-y-4 max-w-sm px-6">
            <h3 className="text-xs font-black claro-text-red uppercase tracking-[0.4em] animate-pulse">Explica+ IA Vision</h3>
            <div key={loadingMsgIdx} className="animate-slideUpFade">
              <p className="text-gray-800 font-bold text-lg leading-tight min-h-[3.5rem]">{LOADING_MESSAGES[loadingMsgIdx]}</p>
            </div>
          </div>
          <div className="w-48 h-1 bg-gray-100 rounded-full overflow-hidden"><div className="h-full claro-red w-full animate-[loading_2.5s_ease-in-out_infinite]"></div></div>
          <style>{`@keyframes loading { 0% { transform: translateX(-100%); } 50% { transform: translateX(0); } 100% { transform: translateX(100%); } }`}</style>
        </div>
      );
    }

    switch (currentPage) {
      case 'login': return <Login onLogin={handleLogin} onLoginSuccess={handleLoginSuccess} />;
      case 'dashboard': return user ? <Dashboard user={user} onNavigate={setCurrentPage} onUpdateUser={handleUpdateUser} /> : null;
      case 'consultivo': return <Consultivo onStart={handleStartScenario} onBack={() => setCurrentPage('dashboard')} />;
      case 'simulator': {
        const config = DB.aiConfig.get();
        const isAdminUser = user?.role === 'admin' || user?.role === 'superadmin';
        const isSimplifiedUser = user?.role === 'tech' || user?.role === 'commercial';
        if ((!config.simulatorEnabled || isSimplifiedUser) && !isAdminUser) {
          return user ? <Dashboard user={user} onNavigate={setCurrentPage} onUpdateUser={handleUpdateUser} /> : null;
        }
        return user ? <AISimulator user={user} onBack={() => setCurrentPage('dashboard')} /> : null;
      }
      case 'recorder': return <Recorder techName={user?.name || 'Técnico'} scenario={activeScenario} mode={recordingMode} onComplete={handleRecorderComplete} onCancel={() => setCurrentPage('consultivo')} user={user} />;
      case 'result': return lastEval ? (
        <EvaluationResult 
          result={lastEval} 
          evalId={lastEval.id} 
          mode={recordingMode} 
          onNextStep={startScriptedMode} 
          previousResult={previousEval} 
          onFinish={() => setCurrentPage('dashboard')} 
          onDelete={() => handleDeleteCurrentEval(lastEval.id)} 
          onRetry={() => setCurrentPage('recorder')}
          user={user} 
        />
      ) : null;
      case 'admin': return user ? <AdminDashboard currentUser={user} /> : null;
      default: return <Login onLogin={handleLogin} />;
    }
  };

  return (
    <Layout 
      user={user} 
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onLogout={() => { setUser(null); localStorage.removeItem('explica_session'); setCurrentPage('login'); }} 
      onHome={() => setCurrentPage('dashboard')} 
      onAdminClick={() => setCurrentPage('admin')} 
      onUpdateUser={handleUpdateUser}
      title={currentPage === 'admin' ? 'Painel Administrativo' : undefined}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
