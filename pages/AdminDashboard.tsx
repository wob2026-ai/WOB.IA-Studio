
import React, { useState, useMemo, useEffect } from 'react';
import { DB } from '../db';
import { User, AccessLog, Evaluation, UserRole } from '../types';
import { MediaStorage } from '../services/storageService';
import { validateCPF, cleanCPF, formatCPF } from '../utils/validators';
import { ScenarioManager } from '../components/ScenarioManager';
import { QuizManager } from '../components/QuizManager';
import { AIConfigManager } from '../components/AIConfigManager';
import { CategoryManager } from '../components/CategoryManager';

interface IBGECity {
  id: number;
  nome: string;
}

const BRAZIL_STATES = [
  { uf: 'AC', nome: 'Acre' }, { uf: 'AL', nome: 'Alagoas' }, { uf: 'AP', nome: 'Amapá' },
  { uf: 'AM', nome: 'Amazonas' }, { uf: 'BA', nome: 'Bahia' }, { uf: 'CE', nome: 'Ceará' },
  { uf: 'DF', nome: 'Distrito Federal' }, { uf: 'ES', nome: 'Espírito Santo' }, { uf: 'GO', nome: 'Goiás' },
  { uf: 'MA', nome: 'Maranhão' }, { uf: 'MT', nome: 'Mato Grosso' }, { uf: 'MS', nome: 'Mato Grosso do Sul' },
  { uf: 'MG', nome: 'Minas Gerais' }, { uf: 'PA', nome: 'Pará' }, { uf: 'PB', nome: 'Paraíba' },
  { uf: 'PR', nome: 'Paraná' }, { uf: 'PE', nome: 'Pernambuco' }, { uf: 'PI', nome: 'Piauí' },
  { uf: 'RJ', nome: 'Rio de Janeiro' }, { uf: 'RN', nome: 'Rio Grande do Norte' }, { uf: 'RS', nome: 'Rio Grande do Sul' },
  { uf: 'RO', nome: 'Rondônia' }, { uf: 'RR', nome: 'Roraima' }, { uf: 'SC', nome: 'Santa Catarina' },
  { uf: 'SP', nome: 'São Paulo' }, { uf: 'SE', nome: 'Sergipe' }, { uf: 'TO', nome: 'Tocantins' }
];

const ExpandableSection: React.FC<{ title: string; content: string; colorClass: string; textColor: string }> = ({ title, content, colorClass, textColor }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = content.length > 150;
  return (
    <div className={`border-l-4 ${colorClass} pl-4 relative group`}>
      <h4 className={`text-xs font-black ${textColor} uppercase flex items-center justify-between`}>
        {title}
        {isLong && (
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
        )}
      </h4>
      <p className={`text-sm text-gray-600 leading-relaxed ${!isExpanded && isLong ? 'line-clamp-3' : ''}`}>{content}</p>
    </div>
  );
};

export const AdminDashboard: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'accesses' | 'evaluations' | 'users' | 'scenarios' | 'categories' | 'quizzes' | 'aiConfig'>('evaluations');
  const [refresh, setRefresh] = useState(0);
  const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // States para criação/edição de usuário
  const [showUserModal, setShowUserModal] = useState(false);
  const [cities, setCities] = useState<IBGECity[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // Se null, é criação. Se tem ID, é edição.
  
  const [userForm, setUserForm] = useState({
    name: '',
    login: '',
    cpf: '',
    email: '',
    uf: '',
    city: '',
    role: 'tech' as UserRole,
    password: ''
  });

  const accesses = useMemo(() => DB.accesses.all().sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [refresh]);
  const evaluations = useMemo(() => DB.evaluations.all().sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [refresh]);
  const users = useMemo(() => DB.users.all().sort((a, b) => a.name.localeCompare(b.name)), [refresh]);

  useEffect(() => {
    if (selectedEval) {
      MediaStorage.get(selectedEval.id).then(blob => { if (blob) setVideoUrl(URL.createObjectURL(blob)); });
    } else setVideoUrl(null);
  }, [selectedEval]);

  useEffect(() => {
    if (userForm.uf) {
      setLoadingCities(true);
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${userForm.uf}/municipios?orderBy=nome`)
        .then(res => res.json())
        .then((data: IBGECity[]) => {
          setCities(data);
          setLoadingCities(false);
        })
        .catch(() => setLoadingCities(false));
    }
  }, [userForm.uf]);

  const openNewUserModal = () => {
    setEditingId(null);
    setUserForm({ name: '', login: '', cpf: '', email: '', uf: '', city: '', role: 'tech', password: '' });
    setShowUserModal(true);
  };

  const openEditUserModal = (user: User) => {
    setEditingId(user.id);
    setUserForm({
      name: user.name,
      login: user.login,
      cpf: formatCPF(user.cpf),
      email: user.email,
      uf: user.uf,
      city: user.city,
      role: user.role,
      password: user.password || ''
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userToDelete: User) => {
    if (userToDelete.id === currentUser.id) {
      alert("Você não pode excluir seu próprio usuário.");
      return;
    }
    
    if (window.confirm(`ATENÇÃO: Isso excluirá DEFINITIVAMENTE o usuário ${userToDelete.name}, todas as suas avaliações e registros de acesso. Deseja continuar?`)) {
      try {
        // 1. Identificar avaliações para limpeza de mídia posterior
        const userEvals = DB.evaluations.all().filter(ev => ev.userId === userToDelete.id);
        
        // 2. Excluir dados síncronos do DB imediatamente
        DB.users.delete(userToDelete.id);
        DB.evaluations.deleteByUserId(userToDelete.id);
        DB.accesses.deleteByUserId(userToDelete.id);
        
        // 3. Atualizar a interface imediatamente
        setRefresh(prev => prev + 1);
        
        // 4. Limpar arquivos de mídia (IndexedDB) de forma assíncrona
        // Fazemos isso depois de atualizar a UI para que o administrador não precise esperar
        for (const ev of userEvals) {
          try {
            await MediaStorage.delete(ev.id);
          } catch (mediaErr) {
            console.error(`Erro ao excluir mídia da avaliação ${ev.id}:`, mediaErr);
          }
        }
        
        alert("Usuário excluído com sucesso.");
      } catch (err) {
        console.error("Erro na exclusão do usuário:", err);
        alert("Ocorreu um erro ao tentar excluir o usuário.");
      }
    }
  };

  const handleDeleteEvaluation = async (ev: Evaluation) => {
    if (window.confirm(`Tem certeza que deseja excluir DEFINITIVAMENTE a avaliação de ${ev.userName}? Esta ação não pode ser desfeita.`)) {
      try {
        DB.evaluations.delete(ev.id);
        await MediaStorage.delete(ev.id);
        setRefresh(prev => prev + 1);
        alert("Avaliação excluída definitivamente.");
      } catch (err) {
        console.error(err);
        alert("Erro ao excluir o arquivo de vídeo.");
      }
    }
  };

  const handleClearAllEvaluations = async () => {
    if (window.confirm("ALERTA MÁXIMO: Isso excluirá TODAS as avaliações e TODOS os vídeos de TODOS os usuários definitivamente. Tem certeza absoluta?")) {
      try {
        const allEvals = DB.evaluations.all();
        for (const ev of allEvals) {
          await MediaStorage.delete(ev.id);
        }
        DB.evaluations.deleteAll();
        setRefresh(prev => prev + 1);
        alert("Histórico de avaliações limpo com sucesso.");
      } catch (err) {
        console.error(err);
        alert("Erro ao limpar histórico.");
      }
    }
  };

  const handleExportEvaluationsCSV = () => {
    if (evaluations.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }

    const headers = ['Colaborador', 'ID Usuário', 'Modo', 'Nota', 'Cidade', 'UF', 'Data/Hora'];
    const csvContent = [
      headers.join(','),
      ...evaluations.map(ev => {
        return [
          `"${ev.userName}"`,
          `"${ev.userId}"`,
          `"${ev.evalMode === 'knowledge' ? 'Conhecimento' : 'Com Roteiro'}"`,
          `"${ev.score.toFixed(1)}"`,
          `"${ev.city}"`,
          `"${ev.uf}"`,
          `"${new Date(ev.timestamp).toLocaleString()}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `avaliacoes_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cleanCPF(userForm.cpf);
    const isGoogleAccount = editingId && DB.users.findById(editingId)?.authProvider === 'google';
    
    // Para contas locais, CPF de 11 dígitos é obrigatório. Para contas Google, é opcional.
    if (!isGoogleAccount && clean.length !== 11) {
      alert("O CPF deve conter exatamente 11 números para usuários locais.");
      return;
    }

    if (clean.length > 0 && clean.length !== 11) {
      alert("O CPF informado deve conter exatamente 11 dígitos.");
      return;
    }

    // Validação de duplicidade (ignorar se for o próprio usuário sendo editado ou se vazio)
    if (clean.length === 11) {
      const existingUser = DB.users.findByCpf(clean);
      if (existingUser && existingUser.id !== editingId) {
        alert("Já existe outro usuário cadastrado com este CPF.");
        return;
      }
    }

    if (editingId) {
      const originalUser = DB.users.findById(editingId);
      // Edição
      DB.users.update({
        id: editingId,
        ...userForm,
        cpf: clean,
        authProvider: originalUser?.authProvider || 'local',
        googlePhotoUrl: originalUser?.googlePhotoUrl,
        createdAt: originalUser?.createdAt || new Date().toISOString()
      });
      alert("Usuário atualizado com sucesso!");
    } else {
      // Criação
      DB.users.add({
        id: Math.random().toString(36).substr(2, 9),
        ...userForm,
        cpf: clean,
        authProvider: 'local',
        createdAt: new Date().toISOString()
      });
      alert("Usuário criado com sucesso!");
    }

    setShowUserModal(false);
    setRefresh(prev => prev + 1);
  };

  const handleQuickRoleChange = async (userId: string, newRole: UserRole) => {
    const targetUser = DB.users.findById(userId);
    if (!targetUser) return;
    
    if (targetUser.id === currentUser.id && newRole !== 'superadmin' && newRole !== 'admin') {
      const confirmSelfDemote = window.confirm("Atenção: Você está alterando seu próprio perfil para um nível sem privilégios administrativos. Deseja continuar?");
      if (!confirmSelfDemote) return;
    }

    const updated: User = {
      ...targetUser,
      role: newRole
    };
    await DB.users.update(updated);
    setRefresh(prev => prev + 1);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-24 px-1 sm:px-0">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xs border border-gray-100">
          <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avaliações</p>
          <p className="text-xl sm:text-2xl font-black claro-text-red">{evaluations.length}</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xs border border-gray-100">
          <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider">Acessos Hoje</p>
          <p className="text-xl sm:text-2xl font-black text-blue-600">{accesses.filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString()).length}</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xs border border-gray-100">
          <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider">Equipe (Tec/Com)</p>
          <p className="text-xl sm:text-2xl font-black text-gray-800">{users.filter(u => u.role === 'tech' || u.role === 'commercial').length}</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xs border border-gray-100">
          <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider">Admins</p>
          <p className="text-xl sm:text-2xl font-black text-gray-800">{users.filter(u => u.role === 'admin' || u.role === 'superadmin').length}</p>
        </div>
      </div>

      <div className="flex bg-white p-1 rounded-2xl shadow-xs border border-gray-200 overflow-x-auto whitespace-nowrap gap-1 no-scrollbar -mx-1 sm:mx-0 px-1 sm:px-1">
        <button onClick={() => setActiveTab('evaluations')} className={`px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${activeTab === 'evaluations' ? 'claro-red text-white shadow-xs' : 'text-gray-500 hover:bg-gray-50'}`}>Avaliações</button>
        <button onClick={() => setActiveTab('users')} className={`px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${activeTab === 'users' ? 'claro-red text-white shadow-xs' : 'text-gray-500 hover:bg-gray-50'}`}>Usuários</button>
        <button onClick={() => setActiveTab('scenarios')} className={`px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${activeTab === 'scenarios' ? 'claro-red text-white shadow-xs' : 'text-gray-500 hover:bg-gray-50'}`}>Cenários</button>
        <button onClick={() => setActiveTab('categories')} className={`px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${activeTab === 'categories' ? 'claro-red text-white shadow-xs' : 'text-gray-500 hover:bg-gray-50'}`}>Categorias</button>
        <button onClick={() => setActiveTab('quizzes')} className={`px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${activeTab === 'quizzes' ? 'claro-red text-white shadow-xs' : 'text-gray-500 hover:bg-gray-50'}`}>Quizzes</button>
        <button onClick={() => setActiveTab('aiConfig')} className={`px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${activeTab === 'aiConfig' ? 'claro-red text-white shadow-xs' : 'text-gray-500 hover:bg-gray-50'}`}>Config I.A</button>
        <button onClick={() => setActiveTab('accesses')} className={`px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${activeTab === 'accesses' ? 'claro-red text-white shadow-xs' : 'text-gray-500 hover:bg-gray-50'}`}>Acessos</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 min-h-[400px]">
        {activeTab === 'evaluations' && (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest">Relatórios de Performance</h3>
               <div className="flex items-center gap-3">
                 <button 
                   onClick={handleExportEvaluationsCSV}
                   className="text-gray-600 hover:text-black text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                   </svg>
                   Exportar CSV
                 </button>
                 <button 
                   onClick={handleClearAllEvaluations}
                   className="text-red-500 hover:text-red-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   Limpar Tudo
                 </button>
               </div>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Colaborador</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Modo</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase text-center">Nota</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {evaluations.map((ev) => (
                  <tr key={ev.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-sm text-gray-700">{ev.userName}</p>
                      <p className="text-[10px] text-gray-400">{ev.city}/{ev.uf}</p>
                    </td>
                    <td className="p-4">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${ev.evalMode === 'knowledge' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                        {ev.evalMode === 'knowledge' ? 'Conhecimento' : 'Com Roteiro'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full font-black text-sm ${ev.score >= 8 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{ev.score.toFixed(1)}</span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => setSelectedEval(ev)} className="claro-text-red text-xs font-bold hover:underline">Detalhes</button>
                        <button 
                          onClick={() => handleDeleteEvaluation(ev)} 
                          className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"
                          title="Excluir Avaliação"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

        {activeTab === 'users' && (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <div>
                 <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest">Base de Usuários & Perfis</h3>
                 <p className="text-[11px] text-gray-400 mt-0.5">Gerencie os acessos de técnicos, comerciais e administradores (incluindo contas Google)</p>
               </div>
               <button 
                 onClick={openNewUserModal}
                 className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors flex items-center gap-2 cursor-pointer"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                 Nova Conta
               </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Colaborador</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Login / Acesso</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Região</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Perfil de Acesso</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {u.googlePhotoUrl ? (
                            <img src={u.googlePhotoUrl} alt={u.name} className="w-8 h-8 rounded-full border border-gray-200 object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 font-black text-xs flex items-center justify-center">
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {u.id === currentUser.id && (
                                <span className="text-[9px] bg-red-50 text-red-600 font-black px-1.5 py-0.2 rounded border border-red-200">Você</span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400">{u.email || u.login}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-gray-500">
                        {u.authProvider === 'google' ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-bold text-[10px]">
                            <svg className="w-3 h-3" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                            Conta Google
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium">{u.login}</div>
                            <div className="opacity-70">{formatCPF(u.cpf)}</div>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-xs text-gray-500 font-semibold">{u.city || '-'}/{u.uf || '-'}</td>
                      <td className="p-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleQuickRoleChange(u.id, e.target.value as UserRole)}
                          className={`text-xs font-black px-2.5 py-1.5 rounded-xl border outline-none cursor-pointer transition-all ${
                            u.role === 'superadmin' ? 'bg-black text-white border-black' :
                            u.role === 'admin' ? 'bg-gray-800 text-white border-gray-800' :
                            u.role === 'commercial' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          <option value="tech" className="bg-white text-gray-800">Técnico (Campo)</option>
                          <option value="commercial" className="bg-white text-gray-800">Comercial</option>
                          <option value="admin" className="bg-white text-gray-800">Administrador</option>
                          <option value="superadmin" className="bg-white text-gray-800">Super Admin</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openEditUserModal(u)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all cursor-pointer"
                            title="Editar Usuário"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u)}
                            disabled={u.id === currentUser.id}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              u.id === currentUser.id 
                                ? 'bg-gray-50 text-gray-300 cursor-not-allowed' 
                                : 'text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 cursor-pointer'
                            }`}
                            title={u.id === currentUser.id ? "Você não pode excluir a si mesmo" : "Excluir Usuário"}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'accesses' && (
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Usuário</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Data/Hora</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Local</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {accesses.map((acc) => (
                    <tr key={acc.id}>
                      <td className="p-4 font-bold text-sm text-gray-700">{acc.userName}</td>
                      <td className="p-4 text-xs text-gray-500">{new Date(acc.timestamp).toLocaleString()}</td>
                      <td className="p-4 text-xs text-gray-500 text-right">{acc.city}/{acc.uf}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        )}

        {activeTab === 'scenarios' && (
          <ScenarioManager />
        )}

        {activeTab === 'categories' && (
          <CategoryManager />
        )}

        {activeTab === 'quizzes' && (
          <QuizManager />
        )}

        {activeTab === 'aiConfig' && (
          <AIConfigManager />
        )}
      </div>

      {/* Modal Criar/Editar Usuário */}
      {showUserModal && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[24px] sm:rounded-[32px] shadow-2xl p-5 sm:p-8 relative animate-scaleUp max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowUserModal(false)} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-red-500 p-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            
            <h3 className="text-lg sm:text-xl font-black claro-text-red uppercase tracking-tight mb-4 sm:mb-6">
              {editingId ? 'Editar Usuário' : 'Novo Cadastro'}
            </h3>
            
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nome Completo</label>
                  <input required type="text" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">CPF</label>
                  <input required type="text" maxLength={14} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none" value={userForm.cpf} onChange={e => setUserForm({...userForm, cpf: formatCPF(e.target.value)})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Login</label>
                  <input required type="text" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none" value={userForm.login} onChange={e => setUserForm({...userForm, login: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Email</label>
                  <input required type="email" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">UF</label>
                  <select required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none" value={userForm.uf} onChange={e => setUserForm({...userForm, uf: e.target.value, city: ''})}>
                    <option value="">Selecione</option>
                    {BRAZIL_STATES.map(s => <option key={s.uf} value={s.uf}>{s.uf}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Cidade</label>
                  <select required disabled={loadingCities || !userForm.uf} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none disabled:opacity-50" value={userForm.city} onChange={e => setUserForm({...userForm, city: e.target.value})}>
                    <option value="">{loadingCities ? '...' : 'Selecione'}</option>
                    {cities.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Perfil de Acesso</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                    <label className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center gap-1 text-center ${userForm.role === 'tech' ? 'claro-border-red bg-red-50 text-[#ee0000]' : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                      <input type="radio" name="role" className="hidden" checked={userForm.role === 'tech'} onChange={() => setUserForm({...userForm, role: 'tech'})} />
                      <span className="font-black text-xs uppercase">Técnico</span>
                      <span className="text-[10px] opacity-70">Acesso padrão</span>
                    </label>
                    <label className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center gap-1 text-center ${userForm.role === 'commercial' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                      <input type="radio" name="role" className="hidden" checked={userForm.role === 'commercial'} onChange={() => setUserForm({...userForm, role: 'commercial'})} />
                      <span className="font-black text-xs uppercase">Comercial</span>
                      <span className="text-[10px] opacity-70">Vendas e Retenção</span>
                    </label>
                    <label className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center gap-1 text-center ${userForm.role === 'admin' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                      <input type="radio" name="role" className="hidden" checked={userForm.role === 'admin'} onChange={() => setUserForm({...userForm, role: 'admin'})} />
                      <span className="font-black text-xs uppercase">Admin</span>
                      <span className="text-[10px] opacity-70">Gestão e Quizzes</span>
                    </label>
                    <label className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center gap-1 text-center ${userForm.role === 'superadmin' ? 'border-black bg-black text-white' : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                      <input type="radio" name="role" className="hidden" checked={userForm.role === 'superadmin'} onChange={() => setUserForm({...userForm, role: 'superadmin'})} />
                      <span className="font-black text-xs uppercase">Super Admin</span>
                      <span className="text-[10px] opacity-70">Acesso Total</span>
                    </label>
                  </div>
                </div>
                {editingId && DB.users.findById(editingId)?.authProvider === 'google' ? (
                  <div className="col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0 text-blue-600" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Este usuário faz login direto com a <strong>Conta Google</strong>. Senha e CPF não são obrigatórios.</span>
                  </div>
                ) : (
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Senha de Acesso</label>
                    <input required={!editingId} type="text" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none" placeholder={editingId ? 'Deixe em branco para manter a atual' : 'Defina a senha'} value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                  </div>
                )}
              </div>
              <button type="submit" className="w-full py-4 claro-red text-white font-black rounded-xl uppercase tracking-widest hover:bg-red-700 transition-colors mt-4">
                {editingId ? 'Salvar Alterações' : 'Criar Usuário'}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedEval && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-scaleUp">
            <div className="claro-red p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-4">
                <h3 className="font-bold uppercase">Relatório: {selectedEval.userName}</h3>
                <button 
                  onClick={() => {
                    handleDeleteEvaluation(selectedEval);
                    setSelectedEval(null);
                  }} 
                  className="bg-white/20 hover:bg-white/40 p-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                  title="Excluir Permanentemente"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Excluir
                </button>
              </div>
              <button onClick={() => setSelectedEval(null)} className="p-1 hover:bg-white/20 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black rounded-2xl aspect-video overflow-hidden">
                  {videoUrl && <video src={videoUrl} controls className="w-full h-full object-contain" />}
                </div>
                <div className="space-y-4">
                   <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                     <span className="text-xs font-bold text-gray-400 uppercase">Performance ({selectedEval.evalMode})</span>
                     <span className={`text-4xl font-black ${selectedEval.score >= 8 ? 'text-green-500' : selectedEval.score === 0 ? 'text-red-600' : 'text-amber-500'}`}>
                       {selectedEval.score.toFixed(1)}
                     </span>
                   </div>
                   {selectedEval.score === 0 && (
                     <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-left text-xs text-red-700 font-bold">
                       ⚠️ Nota 0.0: O técnico não explicou o produto para o cliente ou a fala foi desconexa / silêncio.
                     </div>
                   )}
                   {selectedEval.transcript && (
                     <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 text-left space-y-1">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Transcrição do Áudio</span>
                       <p className="text-xs text-gray-700 italic font-mono leading-relaxed">"{selectedEval.transcript}"</p>
                     </div>
                   )}
                   <ExpandableSection title="Pontos Fortes" content={selectedEval.strengths} colorClass="border-green-500" textColor="text-green-700" />
                   <ExpandableSection title="Oportunidades" content={selectedEval.weaknesses} colorClass="border-red-500" textColor="text-red-700" />
                   {selectedEval.suggestions && (
                     <ExpandableSection title="Sugestão Técnica" content={selectedEval.suggestions} colorClass="border-blue-500" textColor="text-blue-700" />
                   )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
