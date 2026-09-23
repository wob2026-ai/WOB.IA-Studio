import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ExternalLink, 
  Download, 
  Upload, 
  Check, 
  AlertCircle, 
  Loader2, 
  X, 
  Sparkles, 
  Share2, 
  Layers, 
  RefreshCw, 
  UserCheck, 
  LogOut,
  HelpCircle,
  BarChart2
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  signInWithGoogleForms, 
  logoutGoogleForms, 
  getFormsAccessToken, 
  setFormsAccessToken,
  initFormsAuth, 
  listUserGoogleForms, 
  getGoogleForm, 
  getGoogleFormResponses,
  exportQuizzesToGoogleForm,
  GoogleDriveFormFile,
  GoogleFormDetails
} from '../services/googleFormsService';
import { DB } from '../db';
import { QuizQuestion } from '../types';

interface GoogleFormsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshQuizzes?: () => void;
}

export const GoogleFormsManager: React.FC<GoogleFormsManagerProps> = ({
  isOpen,
  onClose,
  onRefreshQuizzes
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getFormsAccessToken());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'myForms'>('export');

  // Export state
  const [exportTitle, setExportTitle] = useState('Avaliação de Conhecimento Técnico Claro - Explica+');
  const [exportDescription, setExportDescription] = useState('Questionário de validação técnica sobre fibra óptica, Wi-Fi 6, Band Steering e atendimento Claro.');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | 'tech' | 'commercial'>('all');
  const [selectedQuizGroup, setSelectedQuizGroup] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [createdFormResult, setCreatedFormResult] = useState<{ formId: string; editUrl: string; responderUri: string } | null>(null);

  // Import / Drive Forms state
  const [driveForms, setDriveForms] = useState<GoogleDriveFormFile[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [selectedFormForImport, setSelectedFormForImport] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Responses state
  const [viewingResponsesFor, setViewingResponsesFor] = useState<string | null>(null);
  const [formResponses, setFormResponses] = useState<any>(null);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);

  useEffect(() => {
    const unsubscribe = initFormsAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
      },
      () => {
        // Not authenticated
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (token && activeTab === 'myForms') {
      loadDriveForms();
    }
  }, [token, activeTab]);

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    try {
      const result = await signInWithGoogleForms();
      setUser(result.user);
      setToken(result.accessToken);
    } catch (err: any) {
      console.error(err);
      alert(`Falha ao conectar com o Google Forms: ${err.message || 'Verifique as permissões da conta.'}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogleForms();
    setUser(null);
    setToken(null);
    setDriveForms([]);
    setCreatedFormResult(null);
  };

  const loadDriveForms = async () => {
    if (!token) return;
    setIsLoadingForms(true);
    try {
      const forms = await listUserGoogleForms(token);
      setDriveForms(forms);
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao buscar formulários do Google Drive: ${err.message}`);
    } finally {
      setIsLoadingForms(false);
    }
  };

  const handleExport = async () => {
    if (!token) {
      alert('Por favor, conecte-se à sua conta Google primeiro.');
      return;
    }

    const allQuizzes = DB.quizzes.all();
    const filteredQuizzes = allQuizzes.filter(q => {
      const matchRole = selectedRoleFilter === 'all' || q.targetRole === selectedRoleFilter || q.targetRole === 'all';
      const qGroup = q.quizTitle || 'Questionário Geral de Conhecimento';
      const matchGroup = selectedQuizGroup === 'all' || qGroup === selectedQuizGroup;
      return matchRole && matchGroup;
    });

    if (filteredQuizzes.length === 0) {
      alert('Nenhuma pergunta encontrada com os filtros selecionados.');
      return;
    }

    const confirm = window.confirm(
      `Deseja criar um novo Google Form com ${filteredQuizzes.length} questão(ões) no seu Google Drive?`
    );
    if (!confirm) return;

    setIsExporting(true);
    setCreatedFormResult(null);

    try {
      const result = await exportQuizzesToGoogleForm(
        exportTitle,
        exportDescription,
        filteredQuizzes,
        token
      );
      setCreatedFormResult(result);
    } catch (err: any) {
      console.error(err);
      alert(`Falha ao exportar para o Google Forms: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportForm = async (formId: string) => {
    if (!token) return;

    const confirm = window.confirm(
      'Deseja importar as questões de múltipla escolha deste formulário para o banco de Quizzes do Explica+?'
    );
    if (!confirm) return;

    setIsImporting(true);
    try {
      const formDetails: GoogleFormDetails = await getGoogleForm(formId, token);
      const items = formDetails.items || [];
      const newQuizzes: QuizQuestion[] = [];
      const groupName = formDetails.info.title || 'Questionário Importado do Google Forms';

      items.forEach((item, idx) => {
        const choiceQuestion = item.questionItem?.question?.choiceQuestion;
        if (choiceQuestion && choiceQuestion.options && choiceQuestion.options.length >= 2) {
          const rawOptions = choiceQuestion.options.map(o => o.value || 'Opção');
          // Pad to 4 options if needed
          while (rawOptions.length < 4) {
            rawOptions.push(`Opção ${String.fromCharCode(65 + rawOptions.length)}`);
          }

          newQuizzes.push({
            id: `gform-${formId.substring(0, 5)}-${idx}-${Date.now()}`,
            quizTitle: groupName,
            question: item.title || 'Pergunta importada do Google Form',
            options: rawOptions.slice(0, 4),
            correctOptionIndex: 0, // default first option
            explanation: item.description || `Importado do Google Form: ${groupName}`,
            targetRole: 'all'
          });
        }
      });

      if (newQuizzes.length === 0) {
        alert('Nenhuma questão de múltipla escolha (tipo escolha única) foi encontrada neste formulário.');
        return;
      }

      await DB.quizzes.addAll(newQuizzes);
      if (onRefreshQuizzes) onRefreshQuizzes();
      alert(`Sucesso! ${newQuizzes.length} questão(ões) foram importadas para o Explica+!`);
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao importar formulário: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleViewResponses = async (formId: string) => {
    if (!token) return;
    setIsLoadingResponses(true);
    setViewingResponsesFor(formId);
    setFormResponses(null);

    try {
      const res = await getGoogleFormResponses(formId, token);
      setFormResponses(res);
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao buscar respostas do formulário: ${err.message}`);
    } finally {
      setIsLoadingResponses(false);
    }
  };

  if (!isOpen) return null;

  const totalQuizzes = DB.quizzes.all().length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[32px] w-full max-w-4xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 p-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <FileText className="h-6 w-6 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg tracking-wide uppercase">Integração Google Forms</h3>
                <span className="bg-purple-500/30 text-purple-200 border border-purple-300/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-purple-200/80 font-medium">
                Crie formulários automáticos no Google Drive e sincronize questionários do Explica+
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Auth Banner */}
        <div className="bg-purple-50/70 border-b border-purple-100 px-6 py-3.5 flex justify-between items-center flex-wrap gap-3 shrink-0">
          {token && user ? (
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'Google'} className="w-8 h-8 rounded-full border border-purple-200" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-xs">
                  {user.email?.[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-green-600" />
                  Conectado como <span className="text-purple-700">{user.displayName || user.email}</span>
                </p>
                <p className="text-[10px] text-gray-500 font-medium">Permissões ativas: Google Forms e Google Drive</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-purple-600 shrink-0" />
              <p className="text-xs text-gray-700 font-semibold">
                Conecte sua conta Google para criar e sincronizar formulários oficiais no seu Google Drive.
              </p>
            </div>
          )}

          {token && user ? (
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 font-bold text-[11px] rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <LogOut className="h-3.5 w-3.5 text-red-500" />
              Desconectar Google
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={isAuthenticating}
              className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm text-gray-800 font-bold text-xs rounded-xl flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  Conectando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>Conectar com Google</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-150 px-6 bg-gray-50/50 shrink-0">
          <button
            onClick={() => setActiveTab('export')}
            className={`py-3.5 px-4 font-black text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'export' 
                ? 'border-purple-600 text-purple-700 bg-white' 
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Upload className="h-4 w-4" />
            Exportar Quizzes para Google Forms
          </button>

          <button
            onClick={() => setActiveTab('myForms')}
            className={`py-3.5 px-4 font-black text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'myForms' 
                ? 'border-purple-600 text-purple-700 bg-white' 
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Layers className="h-4 w-4" />
            Meus Formulários no Drive
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50/30 border border-purple-100 rounded-2xl p-5">
                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  Gerar Formulário de Avaliação Oficial
                </h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Esta ferramenta cria um formulário completo no seu Google Forms contendo todas as perguntas cadastradas no Explica+, com as 4 opções de resposta e as justificativas pedagógicas de cada gabarito.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Título do Formulário</label>
                  <input
                    type="text"
                    value={exportTitle}
                    onChange={(e) => setExportTitle(e.target.value)}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-purple-500"
                    placeholder="Ex: Treinamento Claro Fibra e Wi-Fi 6"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Filtrar por Questionário</label>
                  <select
                    value={selectedQuizGroup}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedQuizGroup(val);
                      if (val !== 'all') {
                        setExportTitle(`Avaliação: ${val}`);
                      }
                    }}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-purple-500"
                  >
                    <option value="all">Todos os Questionários</option>
                    {Array.from(new Set(DB.quizzes.all().map(q => q.quizTitle || 'Questionário Geral de Conhecimento'))).map(title => (
                      <option key={title} value={title}>{title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Filtro de Público Alvo</label>
                  <select
                    value={selectedRoleFilter}
                    onChange={(e: any) => setSelectedRoleFilter(e.target.value)}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-purple-500"
                  >
                    <option value="all">Todas as Perguntas ({totalQuizzes} disponíveis)</option>
                    <option value="tech">Apenas Técnicos</option>
                    <option value="commercial">Apenas Comercial</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Total Selecionado</label>
                  <div className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-between">
                    <span>Questões prontas para envio:</span>
                    <span className="text-purple-600 font-black">
                      {DB.quizzes.all().filter(q => {
                        const matchRole = selectedRoleFilter === 'all' || q.targetRole === selectedRoleFilter || q.targetRole === 'all';
                        const qGroup = q.quizTitle || 'Questionário Geral de Conhecimento';
                        const matchGroup = selectedQuizGroup === 'all' || qGroup === selectedQuizGroup;
                        return matchRole && matchGroup;
                      }).length} questão(ões)
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Descrição do Formulário</label>
                  <textarea
                    rows={2}
                    value={exportDescription}
                    onChange={(e) => setExportDescription(e.target.value)}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-purple-500"
                    placeholder="Instruções para os técnicos e colaboradores que irão responder..."
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs font-bold text-gray-500">
                  Total de perguntas prontas no app: <strong className="text-gray-800">{totalQuizzes}</strong>
                </span>

                <button
                  onClick={handleExport}
                  disabled={isExporting || !token}
                  className="px-6 py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Criando no Google Forms...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Criar Formulário no Google Forms
                    </>
                  )}
                </button>
              </div>

              {/* Created Form Success Banner */}
              {createdFormResult && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-green-800 font-black text-xs uppercase tracking-wide">
                    <Check className="h-4 w-4 text-green-600" />
                    Formulário Criado com Sucesso no seu Google Drive!
                  </div>
                  <p className="text-xs text-green-700">
                    O formulário está pronto para ser enviado para sua equipe técnica ou editado diretamente no Google Forms.
                  </p>

                  <div className="flex items-center gap-3 pt-1 flex-wrap">
                    <a
                      href={createdFormResult.editUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Abrir Editor no Google Forms
                    </a>

                    <a
                      href={createdFormResult.responderUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white hover:bg-green-100 text-green-800 border border-green-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <Share2 className="h-3.5 w-3.5 text-green-600" />
                      Link Público de Resposta
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY FORMS & IMPORT */}
          {activeTab === 'myForms' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">Formulários no seu Google Drive</h4>
                  <p className="text-xs text-gray-400">Importe perguntas existentes do Google Forms para o Explica+ ou consulte respostas</p>
                </div>

                <button
                  onClick={loadDriveForms}
                  disabled={isLoadingForms || !token}
                  className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingForms ? 'animate-spin' : ''}`} />
                  Atualizar Lista
                </button>
              </div>

              {!token ? (
                <div className="bg-gray-50 border border-dashed border-gray-200 p-8 rounded-2xl text-center space-y-2">
                  <AlertCircle className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="text-xs font-bold text-gray-600">Autenticação com Google Necessária</p>
                  <p className="text-[11px] text-gray-400">Conecte sua conta no botão acima para listar seus formulários do Drive.</p>
                </div>
              ) : isLoadingForms ? (
                <div className="py-12 text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
                  <p className="text-xs font-bold text-gray-500">Buscando formulários no Google Drive...</p>
                </div>
              ) : driveForms.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-200 p-8 rounded-2xl text-center space-y-2">
                  <FileText className="h-8 w-8 text-gray-300 mx-auto" />
                  <p className="text-xs font-bold text-gray-600">Nenhum formulário encontrado no Google Drive</p>
                  <p className="text-[11px] text-gray-400">Crie um novo formulário na aba Exportar acima para vê-lo aqui.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {driveForms.map((form) => (
                    <div 
                      key={form.id} 
                      className="bg-white border border-gray-200 hover:border-purple-300 rounded-2xl p-4 shadow-sm space-y-3 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-black text-[10px]">
                            <FileText className="h-4 w-4" />
                          </span>
                          <h5 className="font-bold text-gray-800 text-xs truncate max-w-[240px]" title={form.name}>
                            {form.name}
                          </h5>
                        </div>
                        {form.modifiedTime && (
                          <p className="text-[10px] text-gray-400">
                            Modificado em: {new Date(form.modifiedTime).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100 flex-wrap">
                        <button
                          onClick={() => handleImportForm(form.id)}
                          disabled={isImporting}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[10px] rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          title="Importar perguntas de múltipla escolha para o Explica+"
                        >
                          <Download className="h-3 w-3" />
                          Importar para Quizzes
                        </button>

                        <button
                          onClick={() => handleViewResponses(form.id)}
                          disabled={isLoadingResponses}
                          className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-[10px] rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          title="Consultar total de respostas recebidas"
                        >
                          <BarChart2 className="h-3 w-3 text-indigo-600" />
                          Ver Respostas
                        </button>

                        {form.webViewLink && (
                          <a
                            href={form.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-lg transition-colors ml-auto"
                            title="Abrir no Google Forms"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Form Responses Viewer */}
              {viewingResponsesFor && (
                <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-5 space-y-3 animate-fadeIn mt-4">
                  <div className="flex justify-between items-center">
                    <h5 className="font-bold text-xs text-indigo-900 flex items-center gap-2">
                      <BarChart2 className="h-4 w-4 text-indigo-600" />
                      Respostas Recebidas no Google Forms
                    </h5>
                    <button
                      onClick={() => setViewingResponsesFor(null)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {isLoadingResponses ? (
                    <div className="py-4 text-center">
                      <Loader2 className="h-5 w-5 animate-spin text-indigo-600 mx-auto" />
                    </div>
                  ) : formResponses ? (
                    <div className="text-xs text-indigo-800 space-y-1">
                      <p>
                        Total de Envios/Respostas Coletadas: <strong>{formResponses.responses?.length || 0}</strong>
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Os dados detalhados podem ser visualizados na aba "Respostas" diretamente no Google Forms ou vinculados a uma planilha Google Sheets.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Nenhuma resposta registrada ainda para este formulário.</p>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-150 px-6 py-4 flex justify-between items-center shrink-0">
          <p className="text-[10px] text-gray-400 font-medium">
            Integração segura via Google Identity Services & Firebase Auth
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
