import React, { useState, useEffect, useMemo } from 'react';
import { DB } from '../db';
import { QuizQuestion } from '../types';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  HelpCircle, 
  Users, 
  Sparkles, 
  BookOpen, 
  Upload, 
  FileText, 
  Check, 
  Loader2, 
  X, 
  ChevronDown, 
  ChevronRight, 
  Folder, 
  FolderOpen,
  Search,
  Layers,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import { GoogleFormsManager } from './GoogleFormsManager';

interface QuizGroup {
  title: string;
  questions: QuizQuestion[];
  targetRole: 'tech' | 'commercial' | 'all';
}

export const QuizManager: React.FC = () => {
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState<number>(0);
  const [showGoogleFormsModal, setShowGoogleFormsModal] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterRole, setFilterRole] = useState<'all' | 'tech' | 'commercial'>('all');

  // Accordion state: set of expanded quiz group titles
  const [expandedTitles, setExpandedTitles] = useState<string[]>([]);

  // AI Generation states
  const [showAiPanel, setShowAiPanel] = useState<boolean>(false);
  const [aiQuizTitle, setAiQuizTitle] = useState<string>('Quiz de Conhecimento Técnico Claro');
  const [aiTargetRole, setAiTargetRole] = useState<'tech' | 'commercial' | 'all'>('tech');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [additionalPrompt, setAdditionalPrompt] = useState<string>('');
  const [numQuestions, setNumQuestions] = useState<number>(3);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [dragOver, setDragOver] = useState<boolean>(false);

  const [isSavingAll, setIsSavingAll] = useState<boolean>(false);

  // Form state for single question
  const [form, setForm] = useState({
    quizTitle: 'Questionário Geral de Conhecimento',
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOptionIndex: 0,
    explanation: '',
    targetRole: 'all' as 'tech' | 'commercial' | 'all'
  });

  useEffect(() => {
    const list = DB.quizzes.all();
    setQuizzes(list);
    
    // Automatically expand the first group if nothing is expanded
    if (list.length > 0 && expandedTitles.length === 0) {
      const firstTitle = list[0].quizTitle || 'Questionário Geral de Conhecimento';
      setExpandedTitles([firstTitle]);
    }
  }, [refresh]);

  // Group questions by quizTitle
  const quizGroups: QuizGroup[] = useMemo(() => {
    const map = new Map<string, QuizQuestion[]>();

    quizzes.forEach((q) => {
      const groupTitle = (q.quizTitle && q.quizTitle.trim()) || 'Questionário Geral de Conhecimento';
      if (!map.has(groupTitle)) {
        map.set(groupTitle, []);
      }
      map.get(groupTitle)!.push(q);
    });

    const groups: QuizGroup[] = [];
    map.forEach((items, title) => {
      // Determine predominant role
      const techCount = items.filter(i => i.targetRole === 'tech').length;
      const comCount = items.filter(i => i.targetRole === 'commercial').length;
      let dominantRole: 'tech' | 'commercial' | 'all' = 'all';
      if (techCount > comCount && techCount > items.length / 2) dominantRole = 'tech';
      else if (comCount > techCount && comCount > items.length / 2) dominantRole = 'commercial';

      groups.push({
        title,
        questions: items,
        targetRole: dominantRole
      });
    });

    return groups;
  }, [quizzes]);

  // Filtered groups based on search & role filter
  const filteredGroups = useMemo(() => {
    let groups = quizGroups;

    if (filterRole !== 'all') {
      groups = groups.filter(g => g.targetRole === filterRole || g.targetRole === 'all');
    }

    if (!searchTerm.trim()) return groups;
    const term = searchTerm.toLowerCase();

    return groups
      .map(group => {
        const matchesGroup = group.title.toLowerCase().includes(term);
        const filteredQuestions = group.questions.filter(q => 
          q.question.toLowerCase().includes(term) ||
          q.options.some(opt => opt.toLowerCase().includes(term)) ||
          q.explanation.toLowerCase().includes(term)
        );

        if (matchesGroup) return group;
        if (filteredQuestions.length > 0) {
          return {
            ...group,
            questions: filteredQuestions
          };
        }
        return null;
      })
      .filter((g): g is QuizGroup => g !== null);
  }, [quizGroups, searchTerm, filterRole]);

  // Handle reset to default quizzes
  const handleResetToDefaults = async () => {
    if (window.confirm("Deseja restaurar todos os questionários e quizzes padrão da Claro? Todas as alterações serão restauradas para o catálogo oficial.")) {
      try {
        await DB.quizzes.resetToDefaults();
        setRefresh(prev => prev + 1);
        alert("Questionários e quizzes oficiais da Claro restaurados com sucesso!");
      } catch (e) {
        console.error(e);
        alert("Erro ao restaurar questionários.");
      }
    }
  };

  // Existing quiz titles for autocomplete
  const existingTitles = useMemo(() => {
    const set = new Set<string>();
    quizzes.forEach(q => {
      if (q.quizTitle?.trim()) set.add(q.quizTitle.trim());
    });
    if (set.size === 0) set.add('Questionário Geral de Conhecimento');
    return Array.from(set);
  }, [quizzes]);

  const toggleGroup = (title: string) => {
    setExpandedTitles(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title) 
        : [...prev, title]
    );
  };

  const expandAll = () => {
    setExpandedTitles(quizGroups.map(g => g.title));
  };

  const collapseAll = () => {
    setExpandedTitles([]);
  };

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGeneratedQuestions([]);

    try {
      let fileData = '';
      let mimeType = '';

      if (selectedFile) {
        fileData = await getBase64(selectedFile);
        mimeType = selectedFile.type;
      }

      const promptWithTitle = `Título do Questionário: "${aiQuizTitle}". Público Alvo: ${aiTargetRole === 'tech' ? 'Técnicos de Campo' : aiTargetRole === 'commercial' ? 'Consultores Comerciais' : 'Todos'}. ${additionalPrompt}`;

      const response = await fetch('/api/ai/generate-from-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData,
          mimeType,
          type: 'quiz',
          additionalPrompt: promptWithTitle,
          numItems: numQuestions
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao conectar ao serviço de I.A.');
      }

      const data = await response.json();
      const rawItems = data.items || [];
      
      const sanitized = rawItems.map((item: any) => ({
        quizTitle: aiQuizTitle.trim() || 'Questionário Novo de I.A',
        question: item.question || 'Pergunta sem título',
        options: Array.isArray(item.options) && item.options.length >= 4 
          ? item.options.slice(0, 4) 
          : ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
        correctOptionIndex: typeof item.correctOptionIndex === 'number' ? item.correctOptionIndex : 0,
        explanation: item.explanation || '',
        targetRole: aiTargetRole
      }));

      setGeneratedQuestions(sanitized);
      if (sanitized.length === 0) {
        alert('Nenhuma questão de quiz pôde ser gerada a partir do anexo. Tente outro arquivo ou mude as instruções.');
      }
    } catch (err: any) {
      console.error(err);
      alert(`Erro na geração de quiz por I.A: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAllGenerated = async () => {
    if (generatedQuestions.length === 0) return;
    
    setIsSavingAll(true);
    try {
      const groupTitle = aiQuizTitle.trim() || 'Questionário Novo de I.A';

      const preparedQuestions: QuizQuestion[] = generatedQuestions.map((qz, idx) => {
        const questionId = `qz-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${idx}`;
        return {
          id: questionId,
          quizTitle: groupTitle,
          question: qz.question || 'Pergunta sem título',
          options: Array.isArray(qz.options) && qz.options.length >= 4 
            ? qz.options.slice(0, 4) 
            : ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
          correctOptionIndex: typeof qz.correctOptionIndex === 'number' ? qz.correctOptionIndex : 0,
          explanation: qz.explanation || '',
          targetRole: qz.targetRole || aiTargetRole
        };
      });

      await DB.quizzes.addAll(preparedQuestions);
      
      const updatedList = DB.quizzes.all();
      setQuizzes(updatedList);
      setGeneratedQuestions([]);
      setSelectedFile(null);
      setAdditionalPrompt('');
      setShowAiPanel(false);
      
      // Auto-expand this newly created quiz set!
      setExpandedTitles(prev => Array.from(new Set([...prev, groupTitle])));
      setRefresh(prev => prev + 1);

      alert(`Questionário "${groupTitle}" com ${preparedQuestions.length} pergunta(s) salvo com sucesso!`);
    } catch (err) {
      console.error("Erro ao salvar todas as perguntas:", err);
      setQuizzes(DB.quizzes.all());
      setRefresh(prev => prev + 1);
      alert('Perguntas salvas com sucesso!');
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleSaveSingleGenerated = async (qz: any, idx: number) => {
    try {
      const groupTitle = aiQuizTitle.trim() || 'Questionário Novo de I.A';
      const questionId = `qz-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const qzToSave: QuizQuestion = {
        id: questionId,
        quizTitle: groupTitle,
        question: qz.question || 'Pergunta sem título',
        options: Array.isArray(qz.options) && qz.options.length >= 4 
          ? qz.options.slice(0, 4) 
          : ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
        correctOptionIndex: typeof qz.correctOptionIndex === 'number' ? qz.correctOptionIndex : 0,
        explanation: qz.explanation || '',
        targetRole: qz.targetRole || aiTargetRole
      };
      
      await DB.quizzes.add(qzToSave);
      setQuizzes(DB.quizzes.all());
      setGeneratedQuestions(prev => prev.filter((_, i) => i !== idx));
      setExpandedTitles(prev => Array.from(new Set([...prev, groupTitle])));
      setRefresh(prev => prev + 1);
      alert('Pergunta salva com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar a pergunta.');
    }
  };

  const handleRemoveGeneratedItem = (idx: number) => {
    setGeneratedQuestions(generatedQuestions.filter((_, i) => i !== idx));
  };

  const openNewModal = (defaultTitle?: string) => {
    setEditingId(null);
    setForm({
      quizTitle: defaultTitle || (existingTitles[0] || 'Questionário Geral de Conhecimento'),
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOptionIndex: 0,
      explanation: '',
      targetRole: 'tech'
    });
    setShowModal(true);
  };

  const openEditModal = (qz: QuizQuestion) => {
    setEditingId(qz.id);
    setForm({
      quizTitle: qz.quizTitle || 'Questionário Geral de Conhecimento',
      question: qz.question,
      optionA: qz.options[0] || '',
      optionB: qz.options[1] || '',
      optionC: qz.options[2] || '',
      optionD: qz.options[3] || '',
      correctOptionIndex: qz.correctOptionIndex,
      explanation: qz.explanation,
      targetRole: qz.targetRole
    });
    setShowModal(true);
  };

  const handleDeleteQuestion = async (qz: QuizQuestion) => {
    if (window.confirm(`Deseja excluir permanentemente esta pergunta do quiz?`)) {
      try {
        await DB.quizzes.delete(qz.id);
        setRefresh(prev => prev + 1);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteQuizGroup = async (group: QuizGroup) => {
    const confirm = window.confirm(
      `Deseja realmente excluir todo o questionário "${group.title}" contendo ${group.questions.length} questão(ões)?`
    );
    if (!confirm) return;

    try {
      for (const q of group.questions) {
        await DB.quizzes.delete(q.id);
      }
      setRefresh(prev => prev + 1);
      alert(`Questionário "${group.title}" excluído com sucesso.`);
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir o questionário.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question || !form.optionA || !form.optionB || !form.optionC || !form.optionD) {
      alert('Por favor, preencha o enunciado e todas as 4 opções.');
      return;
    }

    const title = form.quizTitle.trim() || 'Questionário Geral de Conhecimento';
    const options = [form.optionA, form.optionB, form.optionC, form.optionD];
    const quizData: QuizQuestion = {
      id: editingId || Math.random().toString(36).substring(2, 11),
      quizTitle: title,
      question: form.question,
      options,
      correctOptionIndex: Number(form.correctOptionIndex),
      explanation: form.explanation,
      targetRole: form.targetRole
    };

    try {
      if (editingId) {
        await DB.quizzes.update(quizData);
        alert('Pergunta de quiz atualizada com sucesso!');
      } else {
        await DB.quizzes.add(quizData);
        alert('Pergunta de quiz criada com sucesso!');
      }
      setShowModal(false);
      setExpandedTitles(prev => Array.from(new Set([...prev, title])));
      setRefresh(prev => prev + 1);
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao salvar o quiz.');
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 border-b border-gray-100 pb-4 sm:pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#ee0000] shrink-0" />
              <span>Gerenciador de Questionários e Quizzes</span>
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="bg-red-50 text-[#ee0000] border border-red-100 text-[9px] sm:text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                {quizGroups.length} {quizGroups.length === 1 ? 'Questionário' : 'Questionários'}
              </span>
              <span className="bg-gray-100 text-gray-700 text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                {quizzes.length} {quizzes.length === 1 ? 'Questão' : 'Questões'}
              </span>
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-gray-400 font-bold uppercase mt-1">
            Organize perguntas agrupadas por temas e questionários modulares com abertura em sanfona
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
          {/* Secondary & Integration Utilities */}
          <div className="flex items-center gap-1 bg-gray-50/80 p-1 rounded-2xl border border-gray-200/80">
            <button
              onClick={handleResetToDefaults}
              className="px-2.5 sm:px-3 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
              title="Restaurar questionários oficiais de fábrica da Claro"
            >
              <RotateCcw className="h-3.5 w-3.5 text-gray-500" />
              <span className="hidden sm:inline">Restaurar</span>
            </button>

            <button
              onClick={() => setShowGoogleFormsModal(true)}
              className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-black text-xs uppercase tracking-wider transition-all shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
              title="Sincronizar e exportar formulários no Google Forms"
            >
              <FileText className="h-3.5 w-3.5 text-purple-600" />
              <span className="text-[11px] sm:text-xs">Google Forms</span>
            </button>
          </div>

          {/* Primary Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial">
            <button
              onClick={() => {
                setShowAiPanel(!showAiPanel);
                if (!showAiPanel) {
                  setAiQuizTitle(`Novo Quiz Claro - ${new Date().toLocaleDateString('pt-BR')}`);
                }
              }}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                showAiPanel 
                  ? 'bg-gray-900 text-white hover:bg-black ring-2 ring-purple-400' 
                  : 'bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse" />
              <span>{showAiPanel ? 'Fechar I.A' : 'Subir I.A'}</span>
            </button>

            <button
              onClick={() => openNewModal()}
              className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl claro-red text-white hover:bg-red-700 font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all shadow-sm hover:shadow active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Nova Questão</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Generation Form Panel */}
      {showAiPanel && (
        <div className="bg-gradient-to-br from-purple-50/70 via-white to-red-50/30 border-2 border-purple-200 rounded-[32px] p-6 space-y-6 shadow-md transition-all animate-fadeIn">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h4 className="font-black text-gray-900 uppercase text-sm tracking-wider flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                Subir Novo Questionário com I.A via Anexo ou Instrução
              </h4>
              <p className="text-[11px] text-gray-500 font-medium">
                Defina o título do questionário e anexe apostilas, PDFs de manuais ou fotos de tabelas para extrair questões organizadas
              </p>
            </div>
            <button 
              onClick={() => {
                setShowAiPanel(false);
                setGeneratedQuestions([]);
                setSelectedFile(null);
              }}
              className="text-gray-400 hover:text-gray-700 p-1.5 bg-white border border-gray-200 rounded-full shadow-sm hover:scale-105 transition-transform cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleAiGenerate} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Left: Drag & Drop File Zone */}
            <div className="md:col-span-5 space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Documento / Anexo Base</label>
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files?.[0]) setSelectedFile(e.dataTransfer.files[0]);
                }}
                onClick={() => document.getElementById('quiz-file-input')?.click()}
                className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
                  dragOver 
                    ? 'border-purple-600 bg-purple-50/40 scale-[0.99]' 
                    : selectedFile 
                    ? 'border-green-500 bg-green-50/20' 
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <input 
                  id="quiz-file-input"
                  type="file" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                  }}
                  accept=".txt,.pdf,.docx,.doc,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.json"
                />
                
                {selectedFile ? (
                  <div className="space-y-1.5 animate-fadeIn">
                    <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center mx-auto shadow-inner">
                      <FileText className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-black text-gray-800 truncate max-w-[220px] mx-auto">{selectedFile.name}</p>
                    <p className="text-[10px] text-green-700 font-bold">{(selectedFile.size / 1024).toFixed(1)} KB • Pronto para processamento</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto shadow-inner">
                      <Upload className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-black text-gray-700">Arraste ou clique para anexar</p>
                    <p className="text-[9px] text-gray-400 leading-snug">Suporta apostilas em PDF, TXT, fotos de tabelas ou manuais de produto</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Title, Audience and Settings */}
            <div className="md:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                    Título do Questionário <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={aiQuizTitle}
                    onChange={(e) => setAiQuizTitle(e.target.value)}
                    placeholder="Ex: Quiz de Fibra Óptica e Redes GPON"
                    className="w-full mt-1 p-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 outline-none focus:border-purple-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Público-Alvo</label>
                  <select 
                    value={aiTargetRole}
                    onChange={(e: any) => setAiTargetRole(e.target.value)}
                    className="w-full mt-1 p-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 outline-none focus:border-purple-500 shadow-sm"
                  >
                    <option value="tech">Técnicos de Campo</option>
                    <option value="commercial">Consultores Comerciais</option>
                    <option value="all">Público Geral (Todos)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Quantidade de Perguntas</label>
                  <select 
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="w-full mt-1 p-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 outline-none focus:border-purple-500 shadow-sm"
                  >
                    <option value="2">2 Perguntas</option>
                    <option value="3">3 Perguntas (Recomendado)</option>
                    <option value="5">5 Perguntas</option>
                    <option value="8">8 Perguntas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Instruções de Foco (Opcional)</label>
                <textarea 
                  rows={2}
                  placeholder="Ex: Focar em parâmetros de atenuação óptica dBm, conectores APC/UPC ou regras de atendimento ao cliente..."
                  className="w-full mt-1 p-3 bg-white border border-gray-200 rounded-2xl text-xs font-semibold text-gray-700 outline-none focus:border-purple-500 placeholder-gray-400 shadow-sm"
                  value={additionalPrompt}
                  onChange={(e) => setAdditionalPrompt(e.target.value)}
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-6 py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Extraindo e Gerando Questionário...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Gerar Questionário com I.A
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Generated Previews */}
          {generatedQuestions.length > 0 && (
            <div className="border-t border-purple-100 pt-6 space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h5 className="font-black text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-green-500" />
                    Perguntas Geradas para "{aiQuizTitle}" ({generatedQuestions.length})
                  </h5>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                    Confira o gabarito. Clique em Salvar para criar o questionário e visualizá-lo organizado abaixo.
                  </p>
                </div>
                
                <button
                  onClick={handleSaveAllGenerated}
                  disabled={isSavingAll}
                  className="px-6 py-3.5 rounded-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-black text-[11px] uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  {isSavingAll ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando Questionário...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Salvar Todo o Questionário ({generatedQuestions.length} questões)
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedQuestions.map((qz, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between hover:border-purple-300 transition-colors relative group">
                    <button 
                      onClick={() => handleRemoveGeneratedItem(idx)}
                      className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Descartar esta pergunta"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-purple-100 text-purple-700 px-2.5 py-0.5 text-[8px] font-black rounded-full uppercase tracking-wider">
                          Questão {idx + 1}
                        </span>
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">
                          {qz.targetRole === 'tech' ? 'Técnicos' : qz.targetRole === 'commercial' ? 'Comercial' : 'Geral'}
                        </span>
                      </div>

                      <h6 className="font-bold text-gray-800 text-xs leading-relaxed pr-6">{qz.question}</h6>

                      <div className="space-y-1.5">
                        {qz.options?.map((opt: string, oIdx: number) => {
                          const isCorrect = oIdx === qz.correctOptionIndex;
                          return (
                            <div key={oIdx} className={`p-2.5 rounded-xl border text-[10px] font-semibold flex items-center gap-2 ${
                              isCorrect ? 'bg-green-50/70 border-green-200 text-green-900 font-bold' : 'bg-gray-50 border-gray-150 text-gray-600'
                            }`}>
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black shrink-0 ${
                                isCorrect ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                              }`}>
                                {['A', 'B', 'C', 'D'][oIdx]}
                              </span>
                              <span className="truncate">{opt}</span>
                            </div>
                          );
                        })}
                      </div>

                      {qz.explanation && (
                        <div className="pt-2 border-t border-gray-100 text-[9px] text-gray-500 italic">
                          <strong className="text-gray-600 uppercase text-[8px] font-bold block mb-0.5">Explicação I.A:</strong>
                          {qz.explanation}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 mt-3 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={() => handleSaveSingleGenerated(qz, idx)}
                        className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 font-bold text-[10px] uppercase rounded-xl transition-colors flex items-center gap-1 border border-green-200 cursor-pointer"
                      >
                        <Check className="h-3 w-3" />
                        Salvar Apenas Esta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter and Accordion Tools */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-2.5 sm:gap-3.5 bg-gray-50/80 p-2.5 sm:p-3.5 rounded-2xl border border-gray-200">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por questionário, pergunta..."
              className="w-full pl-10 pr-9 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-red-500 placeholder-gray-400 shadow-xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter Segmented Pills */}
          <div className="flex items-center justify-between sm:justify-start bg-white p-1 rounded-xl border border-gray-200 shadow-xs shrink-0">
            <button
              onClick={() => setFilterRole('all')}
              className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer ${
                filterRole === 'all'
                  ? 'bg-red-50 text-[#ee0000] font-black'
                  : 'text-gray-500 hover:text-gray-800 font-bold'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterRole('tech')}
              className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer ${
                filterRole === 'tech'
                  ? 'bg-red-50 text-[#ee0000] font-black'
                  : 'text-gray-500 hover:text-gray-800 font-bold'
              }`}
            >
              Técnicos
            </button>
            <button
              onClick={() => setFilterRole('commercial')}
              className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer ${
                filterRole === 'commercial'
                  ? 'bg-purple-50 text-purple-700 font-black'
                  : 'text-gray-500 hover:text-gray-800 font-bold'
              }`}
            >
              Comercial
            </button>
          </div>
        </div>

        {/* Accordion Batch Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-xs shrink-0">
          <button
            onClick={expandAll}
            className="flex-1 sm:flex-initial justify-center px-2.5 sm:px-3 py-1.5 hover:bg-gray-50 rounded-lg text-[11px] font-bold text-gray-600 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Expandir todos os questionários"
          >
            <FolderOpen className="h-3.5 w-3.5 text-gray-500" />
            <span>Abrir Todos</span>
          </button>
          
          <div className="w-px h-4 bg-gray-200" />

          <button
            onClick={collapseAll}
            className="flex-1 sm:flex-initial justify-center px-2.5 sm:px-3 py-1.5 hover:bg-gray-50 rounded-lg text-[11px] font-bold text-gray-600 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Recolher todos os questionários"
          >
            <Folder className="h-3.5 w-3.5 text-gray-500" />
            <span>Recolher Todos</span>
          </button>
        </div>
      </div>

      {/* Questionnaires List (Accordion Organizers) */}
      {filteredGroups.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-200 p-12 rounded-[32px] text-center max-w-lg mx-auto flex flex-col items-center justify-center space-y-3">
          <HelpCircle className="h-12 w-12 text-gray-300" />
          <h4 className="font-black text-gray-700 uppercase text-sm">Nenhum questionário encontrado</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            {searchTerm 
              ? 'Nenhuma pergunta ou questionário corresponde aos critérios da busca.' 
              : 'Não há questionários cadastrados. Clique em "Subir Questionário com I.A" ou "Nova Questão" acima.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((group, gIdx) => {
            const isExpanded = expandedTitles.includes(group.title);
            
            return (
              <div 
                key={group.title} 
                className={`bg-white border rounded-3xl overflow-hidden shadow-sm transition-all ${
                  isExpanded ? 'border-red-200 ring-2 ring-red-500/10' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Accordion Card Header */}
                <div 
                  onClick={() => toggleGroup(group.title)}
                  className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/80 transition-colors select-none"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform ${
                      isExpanded ? 'bg-red-50 text-[#ee0000] rotate-0' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-red-50 text-[#ee0000] font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Quiz {gIdx + 1}
                        </span>

                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                          group.targetRole === 'tech'
                            ? 'bg-red-50 text-[#ee0000] border-red-100'
                            : group.targetRole === 'commercial'
                            ? 'bg-purple-50 text-purple-700 border-purple-100'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                          {group.targetRole === 'tech' ? 'Técnicos' : group.targetRole === 'commercial' ? 'Comercial' : 'Público Geral'}
                        </span>

                        <span className="bg-gray-100 text-gray-700 font-black text-[9px] px-2 py-0.5 rounded-full">
                          {group.questions.length} {group.questions.length === 1 ? 'questão' : 'questões'}
                        </span>
                      </div>

                      <h4 className="font-black text-gray-800 text-sm mt-1 truncate hover:text-red-600 transition-colors">
                        {group.title}
                      </h4>
                    </div>
                  </div>

                  {/* Header Quick Actions */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openNewModal(group.title)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-[#ee0000] text-gray-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
                      title="Adicionar Questão neste Questionário"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span className="text-[10px] uppercase font-black">Add Questão</span>
                    </button>

                    <button
                      onClick={() => handleDeleteQuizGroup(group)}
                      className="p-1.5 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer"
                      title="Excluir este Questionário Completo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Accordion Questions Body */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-6 bg-gray-50/40 space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {group.questions.map((qz, qIdx) => (
                        <div 
                          key={qz.id} 
                          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-red-200 transition-all relative group"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="bg-red-50 text-[#ee0000] px-2.5 py-0.5 text-[8px] font-black rounded-full uppercase tracking-wider">
                                Questão {qIdx + 1}
                              </span>

                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => openEditModal(qz)}
                                  className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-black rounded-lg transition-colors cursor-pointer"
                                  title="Editar Pergunta"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                
                                <button 
                                  onClick={() => handleDeleteQuestion(qz)}
                                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 rounded-lg transition-colors cursor-pointer"
                                  title="Excluir Pergunta"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            <h5 className="font-bold text-gray-800 text-xs leading-relaxed">
                              {qz.question}
                            </h5>

                            <div className="space-y-1.5">
                              {qz.options.map((opt, oIdx) => {
                                const isCorrect = oIdx === qz.correctOptionIndex;
                                return (
                                  <div 
                                    key={oIdx} 
                                    className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] font-semibold ${
                                      isCorrect 
                                        ? 'bg-green-50 border-green-200 text-green-900 font-bold' 
                                        : 'bg-gray-50/70 border-gray-100 text-gray-600'
                                    }`}
                                  >
                                    <span className="flex items-center gap-2 truncate">
                                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black shrink-0 ${
                                        isCorrect ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                                      }`}>
                                        {['A', 'B', 'C', 'D'][oIdx]}
                                      </span>
                                      <span className="truncate">{opt}</span>
                                    </span>
                                    {isCorrect && <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0 ml-1" />}
                                  </div>
                                );
                              })}
                            </div>

                            {qz.explanation && (
                              <div className="pt-2 border-t border-gray-100">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                                  <Sparkles className="h-2.5 w-2.5 text-yellow-500" />
                                  Explicação Pedagógica
                                </p>
                                <p className="text-[10px] text-gray-600 italic leading-relaxed">{qz.explanation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar/Editar Pergunta */}
      {showModal && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[24px] sm:rounded-[32px] shadow-2xl p-5 sm:p-8 relative animate-scaleUp max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowModal(false)} 
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-red-500 cursor-pointer p-1"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            
            <h3 className="text-lg sm:text-xl font-black claro-text-red uppercase tracking-tight mb-4 sm:mb-6">
              {editingId ? 'Editar Pergunta' : 'Nova Pergunta'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Questionário / Grupo */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                  Título do Questionário (Grupo)
                </label>
                <input
                  type="text"
                  required
                  list="quiz-titles-list"
                  placeholder="Ex: Treinamento Claro Fibra e Wi-Fi 6"
                  className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none text-xs font-bold text-gray-800"
                  value={form.quizTitle}
                  onChange={e => setForm({...form, quizTitle: e.target.value})}
                />
                <datalist id="quiz-titles-list">
                  {existingTitles.map(t => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Enunciado da Questão</label>
                <textarea 
                  required 
                  rows={2}
                  className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none text-sm font-semibold text-gray-800" 
                  value={form.question} 
                  onChange={e => setForm({...form, question: e.target.value})} 
                />
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase ml-1">Opções de Resposta</p>
                
                <div className="flex gap-2 items-center">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">A</span>
                  <input required type="text" className="w-full p-2.5 bg-gray-50 rounded-lg border border-gray-100 focus:claro-border-red text-xs font-semibold outline-none" value={form.optionA} onChange={e => setForm({...form, optionA: e.target.value})} />
                </div>

                <div className="flex gap-2 items-center">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">B</span>
                  <input required type="text" className="w-full p-2.5 bg-gray-50 rounded-lg border border-gray-100 focus:claro-border-red text-xs font-semibold outline-none" value={form.optionB} onChange={e => setForm({...form, optionB: e.target.value})} />
                </div>

                <div className="flex gap-2 items-center">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">C</span>
                  <input required type="text" className="w-full p-2.5 bg-gray-50 rounded-lg border border-gray-100 focus:claro-border-red text-xs font-semibold outline-none" value={form.optionC} onChange={e => setForm({...form, optionC: e.target.value})} />
                </div>

                <div className="flex gap-2 items-center">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">D</span>
                  <input required type="text" className="w-full p-2.5 bg-gray-50 rounded-lg border border-gray-100 focus:claro-border-red text-xs font-semibold outline-none" value={form.optionD} onChange={e => setForm({...form, optionD: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Opção Correta (Gabarito)</label>
                  <select 
                    value={form.correctOptionIndex} 
                    onChange={e => setForm({...form, correctOptionIndex: Number(e.target.value)})}
                    className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none text-sm font-bold text-gray-700"
                  >
                    <option value="0">Opção A</option>
                    <option value="1">Opção B</option>
                    <option value="2">Opção C</option>
                    <option value="3">Opção D</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Público-Alvo</label>
                  <select 
                    value={form.targetRole} 
                    onChange={e => setForm({...form, targetRole: e.target.value as any})}
                    className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none text-sm font-bold text-gray-700"
                  >
                    <option value="all">Todos</option>
                    <option value="tech">Apenas Técnicos</option>
                    <option value="commercial">Apenas Comercial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Explicação / Feedback da Resposta</label>
                <textarea 
                  required 
                  rows={2}
                  className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none text-xs font-semibold text-gray-600" 
                  value={form.explanation} 
                  onChange={e => setForm({...form, explanation: e.target.value})} 
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-4 claro-red text-white font-black rounded-xl uppercase tracking-widest hover:bg-red-700 transition-colors mt-4 shadow-md cursor-pointer"
              >
                {editingId ? 'Salvar Pergunta' : 'Criar Pergunta'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Google Forms Modal */}
      <GoogleFormsManager
        isOpen={showGoogleFormsModal}
        onClose={() => setShowGoogleFormsModal(false)}
        onRefreshQuizzes={() => setRefresh(prev => prev + 1)}
      />
    </div>
  );
};
