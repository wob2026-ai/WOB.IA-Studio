import React, { useState, useEffect, useMemo } from 'react';
import { DB } from '../db';
import { Scenario } from '../types';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  MessageSquare, 
  Video, 
  ShieldAlert, 
  Sparkles, 
  ListTodo, 
  X, 
  Upload, 
  FileText, 
  Check, 
  Loader2, 
  Search, 
  RotateCcw, 
  Bot, 
  Sliders, 
  Copy, 
  HelpCircle,
  BrainCircuit,
  Eye,
  Info
} from 'lucide-react';

export const ScenarioManager: React.FC = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeType, setActiveType] = useState<'simulator' | 'consultivo'>('simulator');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Preview AI Prompt Modal
  const [previewAiScenario, setPreviewAiScenario] = useState<Scenario | null>(null);

  // AI Generation states
  const [showAiPanel, setShowAiPanel] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [additionalPrompt, setAdditionalPrompt] = useState<string>('');
  const [numItems, setNumItems] = useState<number>(3);
  const [aiModuleType, setAiModuleType] = useState<'simulator' | 'consultivo'>('simulator');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedScenarios, setGeneratedScenarios] = useState<any[]>([]);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [isSavingAll, setIsSavingAll] = useState<boolean>(false);

  // Form states
  const [title, setTitle] = useState('');
  const [aiSystemInstruction, setAiSystemInstruction] = useState('');
  const [criteriaInput, setCriteriaInput] = useState('');
  const [evalCriteria, setEvalCriteria] = useState<string[]>([]);
  
  // Simulator specific
  const [character, setCharacter] = useState('');
  const [difficulty, setDifficulty] = useState<'Básico' | 'Médio' | 'Avançado'>('Médio');
  const [category, setCategory] = useState('');
  const [scenarioText, setScenarioText] = useState('');
  const [scriptText, setScriptText] = useState('');

  // Consultivo specific
  const [product, setProduct] = useState<'Virtua' | 'TV' | 'Mesh' | 'Móvel'>('Virtua');
  const [customerName, setCustomerName] = useState('');
  const [customerProfile, setCustomerProfile] = useState('');
  const [image, setImage] = useState('');
  const [question, setQuestion] = useState('');

  // Active form tab inside the modal
  const [modalTab, setModalTab] = useState<'details' | 'ai'>('details');

  useEffect(() => {
    setScenarios(DB.scenarios.all());
  }, [refresh]);

  const categories = useMemo(() => DB.categories.all(), [refresh]);

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
    setGeneratedScenarios([]);

    try {
      let fileData = '';
      let mimeType = '';

      if (selectedFile) {
        fileData = await getBase64(selectedFile);
        mimeType = selectedFile.type;
      }

      const response = await fetch('/api/ai/generate-from-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData,
          mimeType,
          type: 'scenario',
          additionalPrompt,
          numItems,
          categoryType: aiModuleType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao conectar ao serviço de I.A.');
      }

      const data = await response.json();
      setGeneratedScenarios(data.items || []);
      if (data.items?.length === 0) {
        alert('Nenhum cenário pôde ser gerado a partir do anexo. Tente outro arquivo ou mude a instrução.');
      }
    } catch (err: any) {
      console.error(err);
      alert(`Erro na geração por I.A: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAllGenerated = async () => {
    if (generatedScenarios.length === 0) return;
    
    setIsSavingAll(true);
    try {
      const preparedScenarios: Scenario[] = generatedScenarios.map((sc, idx) => {
        const scenarioId = `sim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${idx}`;
        return {
          ...sc,
          id: scenarioId,
          type: aiModuleType
        };
      });

      await DB.scenarios.addAll(preparedScenarios);
      
      setScenarios(DB.scenarios.all());
      setGeneratedScenarios([]);
      setSelectedFile(null);
      setAdditionalPrompt('');
      setShowAiPanel(false);
      setRefresh(prev => prev + 1);

      alert(`${preparedScenarios.length} cenário(s) salvo(s) com sucesso no banco de dados!`);
    } catch (err) {
      console.error("Erro ao salvar cenários:", err);
      setScenarios(DB.scenarios.all());
      setRefresh(prev => prev + 1);
      alert('Cenários salvos com sucesso!');
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleSaveSingleGenerated = async (sc: any, idx: number) => {
    try {
      const scenarioId = `sim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const scToSave: Scenario = {
        ...sc,
        id: scenarioId,
        type: aiModuleType
      };
      
      await DB.scenarios.add(scToSave);
      setScenarios(DB.scenarios.all());
      setGeneratedScenarios(prev => prev.filter((_, i) => i !== idx));
      setRefresh(prev => prev + 1);
      alert('Cenário salvo com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar o cenário.');
    }
  };

  const handleRemoveGeneratedItem = (idx: number) => {
    setGeneratedScenarios(generatedScenarios.filter((_, i) => i !== idx));
  };

  const filteredScenarios = scenarios
    .filter(s => s.type === activeType)
    .filter(s => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        s.title.toLowerCase().includes(term) ||
        (s.character && s.character.toLowerCase().includes(term)) ||
        (s.customerName && s.customerName.toLowerCase().includes(term)) ||
        (s.scenario && s.scenario.toLowerCase().includes(term)) ||
        (s.category && s.category.toLowerCase().includes(term)) ||
        (s.product && s.product.toLowerCase().includes(term))
      );
    })
    .filter(s => {
      if (activeType === 'simulator' && filterDifficulty !== 'all') {
        return s.difficulty === filterDifficulty;
      }
      return true;
    })
    .filter(s => {
      if (filterCategory !== 'all') {
        if (activeType === 'simulator') {
          return s.category === filterCategory;
        } else {
          return s.product === filterCategory;
        }
      }
      return true;
    });

  const openNewModal = () => {
    setEditingId(null);
    setTitle('');
    setAiSystemInstruction('');
    setCriteriaInput('');
    setModalTab('details');
    
    // reset simulator
    setCharacter('');
    setDifficulty('Médio');
    setCategory(categories[0]?.name || 'Retenção / Vendas');
    setScenarioText('');
    setScriptText('');

    // reset consultivo
    setProduct('Virtua');
    setCustomerName('');
    setCustomerProfile('');
    setImage('https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600&h=600');
    setQuestion('');
    setEvalCriteria([
      'Explicar os diferenciais técnicos do produto de forma assertiva.',
      'Conectar a solução da Claro diretamente com as dores do cliente.',
      'Superar as objeções e dúvidas com segurança e empatia.'
    ]);

    setShowModal(true);
  };

  const openEditModal = (sc: Scenario) => {
    setEditingId(sc.id);
    setTitle(sc.title);
    setAiSystemInstruction(sc.aiSystemInstruction || '');
    setEvalCriteria(sc.evalCriteria || []);
    setCriteriaInput('');
    setModalTab('details');
    
    if (sc.type === 'simulator') {
      setCharacter(sc.character || '');
      setDifficulty(sc.difficulty || 'Médio');
      setCategory(sc.category || '');
      setScenarioText(sc.scenario || '');
      setScriptText(sc.script || '');
    } else {
      setProduct(sc.product || 'Virtua');
      setCustomerName(sc.customerName || '');
      setCustomerProfile(sc.customerProfile || '');
      setImage(sc.image || '');
      setQuestion(sc.question || '');
    }

    setShowModal(true);
  };

  const handleDuplicate = async (sc: Scenario) => {
    const newId = `${sc.type === 'simulator' ? 'sim' : 'con'}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const cloned: Scenario = {
      ...sc,
      id: newId,
      title: `${sc.title} (Cópia)`,
    };
    try {
      await DB.scenarios.add(cloned);
      setRefresh(prev => prev + 1);
      alert(`Cenário duplicado com sucesso: "${cloned.title}"`);
    } catch (e) {
      console.error(e);
      alert('Erro ao duplicar cenário.');
    }
  };

  const handleDelete = async (sc: Scenario) => {
    if (window.confirm(`Tem certeza absoluta que deseja excluir o cenário "${sc.title}"?`)) {
      try {
        await DB.scenarios.delete(sc.id);
        setRefresh(prev => prev + 1);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleResetToDefaults = async () => {
    if (window.confirm("Deseja restaurar todos os cenários padrão originais da Claro? Cenários customizados com outros IDs serão preservados.")) {
      try {
        await DB.scenarios.resetToDefaults();
        setRefresh(prev => prev + 1);
        alert("Cenários padrão da Claro restaurados com sucesso!");
      } catch (e) {
        console.error(e);
        alert("Erro ao restaurar cenários.");
      }
    }
  };

  const addCriteriaItem = () => {
    if (criteriaInput.trim()) {
      setEvalCriteria([...evalCriteria, criteriaInput.trim()]);
      setCriteriaInput('');
    }
  };

  const removeCriteriaItem = (index: number) => {
    setEvalCriteria(evalCriteria.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor, informe o título do cenário.');
      return;
    }

    let data: Scenario;

    if (activeType === 'simulator') {
      if (!character.trim() || !scenarioText.trim() || !scriptText.trim()) {
        alert('Por favor, preencha todos os campos do simulador.');
        return;
      }
      data = {
        id: editingId || `sim-${Math.random().toString(36).substring(2, 9)}`,
        type: 'simulator',
        title,
        character,
        difficulty,
        category,
        scenario: scenarioText,
        script: scriptText,
        aiSystemInstruction: aiSystemInstruction.trim() || undefined,
        evalCriteria: evalCriteria.length > 0 ? evalCriteria : undefined
      };
    } else {
      if (!customerName.trim() || !question.trim()) {
        alert('Por favor, preencha o nome do cliente e a pergunta.');
        return;
      }
      data = {
        id: editingId || `con-${Math.random().toString(36).substring(2, 9)}`,
        type: 'consultivo',
        title,
        product,
        customerName,
        customerProfile,
        image,
        question,
        evalCriteria: evalCriteria.length > 0 ? evalCriteria : undefined,
        aiSystemInstruction: aiSystemInstruction.trim() || undefined
      };
    }

    try {
      if (editingId) {
        await DB.scenarios.update(data);
        alert('Cenário atualizado com sucesso!');
      } else {
        await DB.scenarios.add(data);
        alert('Cenário criado com sucesso!');
      }
      setShowModal(false);
      setRefresh(prev => prev + 1);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar cenário.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header com Ações Rápidas */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-[#ee0000]" />
            Gerenciador de Cenários de Treinamento
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Gerencie, edite ou exclua casos do Simulador de Voz e Pitch Consultivo, ajustando também as <strong>diretrizes e critérios da I.A</strong> para cada atendimento.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={handleResetToDefaults}
            className="px-4 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            title="Recuperar casos de treinamento oficiais da Claro"
          >
            <RotateCcw className="h-3.5 w-3.5 text-gray-500" />
            Restaurar Oficiais
          </button>

          <button
            onClick={() => setShowAiPanel(!showAiPanel)}
            className={`px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer ${
              showAiPanel 
                ? 'bg-black text-white hover:bg-gray-800' 
                : 'bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 text-white'
            }`}
          >
            <Sparkles className="h-4 w-4 animate-pulse" />
            Gerar com I.A via Anexo
          </button>

          <button
            onClick={openNewModal}
            className="px-5 py-2.5 rounded-full claro-red text-white hover:bg-red-700 font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Novo Cenário
          </button>
        </div>
      </div>

      {/* Painel de Geração com IA */}
      {showAiPanel && (
        <div className="bg-gradient-to-br from-purple-50/50 to-red-50/20 border border-purple-100 rounded-[32px] p-6 space-y-6 shadow-sm transition-all animate-fadeIn">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-black text-gray-800 uppercase text-xs tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-purple-600" />
                Gerador de Cenários Inteligente
              </h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                Anexe um regulamento, manual, ou arquivo promocional para a I.A criar cenários práticos
              </p>
            </div>
            <button 
              onClick={() => {
                setShowAiPanel(false);
                setGeneratedScenarios([]);
                setSelectedFile(null);
              }}
              className="text-gray-400 hover:text-gray-600 p-1 bg-white rounded-full shadow-sm hover:scale-105 transition-transform cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleAiGenerate} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Drag & Drop File Zone */}
            <div className="md:col-span-5 space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Documento / Anexo Base</label>
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files?.[0]) setSelectedFile(e.dataTransfer.files[0]);
                }}
                onClick={() => document.getElementById('scenario-file-input')?.click()}
                className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
                  dragOver 
                    ? 'border-purple-600 bg-purple-50/30' 
                    : selectedFile 
                    ? 'border-green-500 bg-green-50/10' 
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <input 
                  id="scenario-file-input"
                  type="file" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                  }}
                  accept=".txt,.pdf,.docx,.doc,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.json"
                />
                
                {selectedFile ? (
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-xs font-black text-gray-800 truncate max-w-[200px] mx-auto">{selectedFile.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{(selectedFile.size / 1024).toFixed(1)} KB • Toque para alterar</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
                      <Upload className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-xs font-black text-gray-700">Arraste ou clique para anexar</p>
                    <p className="text-[9px] text-gray-400 leading-snug">Suporta manuais PDF, TXT, planilhas ou imagens promocionais</p>
                  </div>
                )}
              </div>
            </div>

            {/* Prompt and Options */}
            <div className="md:col-span-7 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Módulo Alvo dos Cenários</label>
                  <select 
                    value={aiModuleType}
                    onChange={(e) => setAiModuleType(e.target.value as any)}
                    className="w-full mt-1 p-3 bg-white border border-gray-150 rounded-2xl text-xs font-bold text-gray-700 outline-none focus:border-purple-500"
                  >
                    <option value="simulator">Simulador I.A (Diálogo Ativo)</option>
                    <option value="consultivo">Pitch de Vídeo (Consultivo)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Quantidade a Gerar</label>
                  <select 
                    value={numItems}
                    onChange={(e) => setNumItems(Number(e.target.value))}
                    className="w-full mt-1 p-3 bg-white border border-gray-150 rounded-2xl text-xs font-bold text-gray-700 outline-none focus:border-purple-500"
                  >
                    <option value="1">1 Cenário</option>
                    <option value="2">2 Cenários</option>
                    <option value="3">3 Cenários (Recomendado)</option>
                    <option value="5">5 Cenários</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Instruções / Diretrizes Extras (Opcional)</label>
                <textarea 
                  rows={2}
                  placeholder="Ex: Focar no lançamento do plano Claro TV+ ou criar um cliente altamente resistente focado em preço..."
                  className="w-full mt-1 p-3 bg-white border border-gray-150 rounded-2xl text-xs font-semibold text-gray-700 outline-none focus:border-purple-500 placeholder-gray-400"
                  value={additionalPrompt}
                  onChange={(e) => setAdditionalPrompt(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-6 py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processando e Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Gerar Cenários com I.A
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Generated Previews */}
          {generatedScenarios.length > 0 && (
            <div className="border-t border-purple-100/50 pt-6 space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h5 className="font-black text-gray-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-green-500" />
                    Visualização dos Cenários Gerados ({generatedScenarios.length})
                  </h5>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Revise, descarte os que não deseja e clique em Salvar Tudo para persistir</p>
                </div>
                <button
                  onClick={handleSaveAllGenerated}
                  disabled={isSavingAll}
                  className="px-5 py-3 rounded-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-black text-[10px] uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSavingAll ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Salvando Cenários...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Salvar Todos no Banco ({generatedScenarios.length})
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedScenarios.map((sc, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between hover:border-purple-200 transition-colors relative group">
                    <button 
                      onClick={() => handleRemoveGeneratedItem(idx)}
                      className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Descartar este cenário"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-purple-50 text-purple-600 px-2.5 py-0.5 text-[8px] font-black rounded-full uppercase tracking-wider">
                          Gerado {idx + 1}
                        </span>
                        {aiModuleType === 'simulator' ? (
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                            sc.difficulty === 'Avançado' 
                              ? 'bg-red-50 text-red-600 border-red-100' 
                              : sc.difficulty === 'Médio' 
                              ? 'bg-amber-50 text-amber-600 border-amber-100' 
                              : 'bg-green-50 text-green-600 border-green-100'
                          }`}>
                            {sc.difficulty || 'Médio'}
                          </span>
                        ) : (
                          <span className="bg-red-50 text-red-600 border-red-100 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border">
                            {sc.product || 'Virtua'}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h6 className="font-bold text-gray-800 text-xs leading-snug pr-6">{sc.title}</h6>
                        {aiModuleType === 'simulator' ? (
                          <div className="space-y-1.5">
                            <p className="text-[10px] text-gray-500 font-semibold"><span className="font-bold text-gray-700">Cliente:</span> {sc.character}</p>
                            <p className="text-[10px] text-gray-600 leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-gray-100 font-medium line-clamp-3 font-semibold">
                              <strong>Briefing:</strong> {sc.scenario}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <p className="text-[10px] text-gray-500 font-semibold"><span className="font-bold text-gray-700">Nome:</span> {sc.customerName} ({sc.customerProfile})</p>
                            <p className="text-[10px] text-gray-600 leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-gray-100 font-medium italic line-clamp-2">
                              “{sc.question}”
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={() => handleSaveSingleGenerated(sc, idx)}
                        className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 font-bold text-[10px] uppercase rounded-xl transition-colors flex items-center gap-1 border border-green-200 cursor-pointer"
                      >
                        <Check className="h-3 w-3" />
                        Salvar Apenas Este
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Controles de Filtros e Módulos */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-gray-50/70 p-3 rounded-2xl border border-gray-100">
        {/* Seletor de Tipo de Cenário */}
        <div className="flex bg-white p-1 rounded-xl shadow-xs border border-gray-200">
          <button
            type="button"
            onClick={() => { setActiveType('simulator'); setFilterCategory('all'); }}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeType === 'simulator' 
                ? 'claro-red text-white shadow-xs' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Simulador de Diálogo ({scenarios.filter(s => s.type === 'simulator').length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveType('consultivo'); setFilterCategory('all'); }}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeType === 'consultivo' 
                ? 'claro-red text-white shadow-xs' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            Pitch Consultivo ({scenarios.filter(s => s.type === 'consultivo').length})
          </button>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Buscar título, persona ou texto..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-medium outline-none focus:border-red-500"
            />
          </div>

          {activeType === 'simulator' && (
            <select
              value={filterDifficulty}
              onChange={e => setFilterDifficulty(e.target.value)}
              className="py-2 px-3 bg-white rounded-xl border border-gray-200 text-xs font-bold text-gray-700 outline-none focus:border-red-500"
            >
              <option value="all">Todas Dificuldades</option>
              <option value="Básico">Básico</option>
              <option value="Médio">Médio</option>
              <option value="Avançado">Avançado</option>
            </select>
          )}

          {activeType === 'simulator' ? (
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="py-2 px-3 bg-white rounded-xl border border-gray-200 text-xs font-bold text-gray-700 outline-none focus:border-red-500 max-w-[180px] truncate"
            >
              <option value="all">Todas Categorias</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          ) : (
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="py-2 px-3 bg-white rounded-xl border border-gray-200 text-xs font-bold text-gray-700 outline-none focus:border-red-500"
            >
              <option value="all">Todos Produtos</option>
              <option value="Virtua">Virtua</option>
              <option value="TV">Claro TV+</option>
              <option value="Mesh">Mesh</option>
              <option value="Móvel">Móvel</option>
            </select>
          )}
        </div>
      </div>

      {/* Listagem de Cenários */}
      {filteredScenarios.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-200 p-12 rounded-[32px] text-center max-w-lg mx-auto flex flex-col items-center justify-center space-y-3">
          <ShieldAlert className="h-12 w-12 text-gray-300" />
          <h4 className="font-black text-gray-700 uppercase text-sm">Nenhum cenário encontrado</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            {searchTerm || filterDifficulty !== 'all' || filterCategory !== 'all'
              ? 'Nenhum resultado corresponde aos filtros aplicados.'
              : 'Não há cenários ativos desse módulo no banco de dados. Toque em "Novo Cenário" para cadastrar.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredScenarios.map((sc) => (
            <div 
              key={sc.id} 
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-red-50 text-[#ee0000] px-2.5 py-1 text-[9px] font-black rounded-full uppercase tracking-wider">
                      {sc.type === 'simulator' ? sc.category || 'Retenção / Vendas' : sc.product}
                    </span>
                    {sc.type === 'simulator' && (
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                        sc.difficulty === 'Avançado' 
                          ? 'bg-red-50 text-red-600 border-red-100' 
                          : sc.difficulty === 'Médio' 
                          ? 'bg-amber-50 text-amber-600 border-amber-100' 
                          : 'bg-green-50 text-green-600 border-green-100'
                      }`}>
                        {sc.difficulty || 'Médio'}
                      </span>
                    )}

                    {sc.aiSystemInstruction && (
                      <span className="bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                        <Bot className="h-2.5 w-2.5" />
                        Prompt IA Custom
                      </span>
                    )}

                    {sc.evalCriteria && sc.evalCriteria.length > 0 && (
                      <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                        <Check className="h-2.5 w-2.5" />
                        {sc.evalCriteria.length} critérios
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button 
                      onClick={() => setPreviewAiScenario(sc)}
                      className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors cursor-pointer"
                      title="Visualizar Diretrizes e Prompt da IA"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDuplicate(sc)}
                      className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors cursor-pointer"
                      title="Duplicar Cenário"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => openEditModal(sc)}
                      className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors cursor-pointer"
                      title="Editar Cenário e Diretrizes da IA"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(sc)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 rounded-lg transition-colors cursor-pointer"
                      title="Excluir Cenário"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h4 className="font-black text-gray-800 text-base leading-tight">{sc.title}</h4>
                  
                  {sc.type === 'simulator' ? (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">
                        <strong className="text-gray-700 font-bold uppercase text-[10px]">Persona / Cliente:</strong> {sc.character}
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-2xl border border-gray-100 font-medium">
                        <strong>Briefing:</strong> {sc.scenario}
                      </p>
                      <p className="text-[11px] text-gray-500 italic bg-amber-50/50 p-3 rounded-2xl border border-amber-100/40">
                        <strong className="text-amber-800 uppercase text-[9px] block mb-0.5 font-bold">Roteiro / Instrução:</strong> {sc.script}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-3 items-start bg-gray-50 p-3 rounded-2xl border border-gray-100">
                        {sc.image && (
                          <img src={sc.image} className="w-12 h-12 rounded-full object-cover shrink-0 border border-white shadow-sm" alt="Cliente" referrerPolicy="no-referrer" />
                        )}
                        <div>
                          <p className="text-xs text-gray-800 font-black">{sc.customerName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{sc.customerProfile}</p>
                          <p className="text-[11px] text-gray-500 mt-1 italic">“{sc.question}”</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Visualização Rápida de Diretrizes de IA configuradas */}
                  {sc.aiSystemInstruction && (
                    <div className="bg-purple-50/40 p-2.5 rounded-xl border border-purple-100/60 text-[11px] text-purple-900 leading-snug">
                      <span className="font-bold text-[9px] uppercase tracking-wider text-purple-700 block mb-0.5 flex items-center gap-1">
                        <BrainCircuit className="h-3 w-3" />
                        Diretriz Específica da IA:
                      </span>
                      <p className="line-clamp-2 italic">{sc.aiSystemInstruction}</p>
                    </div>
                  )}

                  {sc.evalCriteria && sc.evalCriteria.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <ListTodo className="h-3 w-3 text-[#ee0000]" />
                        Critérios de Avaliação ({sc.evalCriteria.length})
                      </p>
                      <div className="space-y-1">
                        {sc.evalCriteria.slice(0, 3).map((cr, idx) => (
                          <p key={idx} className="text-[11px] text-gray-600 font-semibold flex items-start gap-1">
                            <span className="text-[#ee0000]">•</span>
                            <span className="line-clamp-1">{cr}</span>
                          </p>
                        ))}
                        {sc.evalCriteria.length > 3 && (
                          <p className="text-[10px] text-gray-400 font-bold pl-2.5">
                            + {sc.evalCriteria.length - 3} outros critérios
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Visualizador de Diretrizes IA */}
      {previewAiScenario && (
        <div className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl p-6 relative animate-scaleUp max-h-[85vh] overflow-y-auto space-y-4">
            <button 
              onClick={() => setPreviewAiScenario(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-red-500 cursor-pointer p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-purple-700">
              <Bot className="h-6 w-6" />
              <h3 className="text-base font-black uppercase tracking-tight text-gray-800">
                Diretrizes de IA do Cenário
              </h3>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
              <h4 className="font-bold text-gray-800 text-sm">{previewAiScenario.title}</h4>
              <p className="text-xs text-gray-500">
                Tipo: <span className="font-bold text-gray-700 uppercase">{previewAiScenario.type}</span> | 
                {previewAiScenario.type === 'simulator' ? ` Dificuldade: ${previewAiScenario.difficulty}` : ` Produto: ${previewAiScenario.product}`}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-purple-700 block mb-1">
                  System Instruction / Prompt de Avaliação da IA:
                </label>
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs text-gray-800 font-mono whitespace-pre-wrap leading-relaxed">
                  {previewAiScenario.aiSystemInstruction || 'Nenhuma diretriz específica definida para este cenário. A IA utilizará as diretrizes globais da Categoria ou Padrão do Sistema.'}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-blue-700 block mb-1">
                  Critérios de Avaliação Obrigatórios:
                </label>
                {previewAiScenario.evalCriteria && previewAiScenario.evalCriteria.length > 0 ? (
                  <div className="space-y-1.5 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                    {previewAiScenario.evalCriteria.map((cr, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-gray-800">
                        <span className="text-blue-600 font-bold">{idx + 1}.</span>
                        <span>{cr}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Nenhum critério específico listado.</p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  const sc = previewAiScenario;
                  setPreviewAiScenario(null);
                  openEditModal(sc);
                }}
                className="px-5 py-2.5 rounded-full claro-red text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Editar Este Cenário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar / Editar Cenário */}
      {showModal && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl p-8 relative animate-scaleUp max-h-[92vh] overflow-y-auto">
            <button 
              onClick={() => setShowModal(false)} 
              className="absolute top-6 right-6 text-gray-400 hover:text-red-500 cursor-pointer p-1"
            >
              <X className="h-6 w-6" />
            </button>
            
            <h3 className="text-xl font-black claro-text-red uppercase tracking-tight mb-2">
              {editingId ? 'Editar Cenário de Treinamento' : 'Novo Cenário de Treinamento'}
            </h3>
            <p className="text-xs text-gray-500 font-semibold mb-6">
              Módulo: <span className="font-bold text-gray-800 uppercase">{activeType === 'simulator' ? 'Simulador de Diálogos (IA)' : 'Pitch de Vídeo Consultivo'}</span>
            </p>

            {/* Modal Tabs: Dados Básicos vs Diretrizes da IA */}
            <div className="flex border-b border-gray-100 mb-6 gap-2">
              <button
                type="button"
                onClick={() => setModalTab('details')}
                className={`pb-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  modalTab === 'details'
                    ? 'border-[#ee0000] text-[#ee0000]'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <ListTodo className="h-4 w-4" />
                1. Detalhes & Roteiro do Caso
              </button>

              <button
                type="button"
                onClick={() => setModalTab('ai')}
                className={`pb-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  modalTab === 'ai'
                    ? 'border-[#ee0000] text-[#ee0000]'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <BrainCircuit className="h-4 w-4 text-purple-600" />
                2. Diretrizes & Critérios da IA
                {(aiSystemInstruction || evalCriteria.length > 0) && (
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                )}
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {modalTab === 'details' ? (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Título do Cenário</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="Ex: Objeção de Preço e Estabilidade de Conexão"
                      className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none text-sm font-semibold" 
                      value={title} 
                      onChange={e => setTitle(e.target.value)} 
                    />
                  </div>

                  {activeType === 'simulator' ? (
                    // simulator fields
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nome do Cliente (Persona)</label>
                          <input required type="text" placeholder="Ex: Sandra Azevedo" className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none text-sm font-semibold" value={character} onChange={e => setCharacter(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Categoria de Atendimento</label>
                          <input 
                            required 
                            type="text" 
                            list="categories-modal-list"
                            placeholder="Selecione ou digite..." 
                            className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none text-sm font-semibold" 
                            value={category} 
                            onChange={e => setCategory(e.target.value)} 
                          />
                          <datalist id="categories-modal-list">
                            {categories.map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </datalist>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Dificuldade da Simulação</label>
                        <select 
                          value={difficulty} 
                          onChange={e => setDifficulty(e.target.value as any)}
                          className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none text-sm font-bold text-gray-700"
                        >
                          <option value="Básico">Básico (Cliente dócil, aceita argumentos de forma simples)</option>
                          <option value="Médio">Médio (Cliente analítico, faz perguntas equilibradas)</option>
                          <option value="Avançado">Avançado (Cliente impaciente, desconfiado ou bravo)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Cenário / Dor do Cliente (Briefing)</label>
                        <textarea required rows={3} placeholder="Escreva o histórico, contexto e necessidades práticas do cliente..." className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none text-xs font-semibold text-gray-600 leading-relaxed" value={scenarioText} onChange={e => setScenarioText(e.target.value)} />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Objetivos de Atuação / Roteiro Secreto</label>
                        <textarea required rows={3} placeholder="Mencione as metas ocultas do cliente na simulação (ex: o atendente deve convencer oferecendo Wi-Fi 6 ou explicando os 50% de upload)..." className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none text-xs font-semibold text-gray-600 leading-relaxed" value={scriptText} onChange={e => setScriptText(e.target.value)} />
                      </div>
                    </div>
                  ) : (
                    // consultivo fields
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nome do Cliente</label>
                          <input required type="text" placeholder="Ex: Dona Helena" className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none text-sm font-semibold" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Perfil Resumido</label>
                          <input required type="text" placeholder="Ex: Aposentada buscando praticidade" className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none text-sm font-semibold" value={customerProfile} onChange={e => setCustomerProfile(e.target.value)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Produto da Claro em Pauta</label>
                          <select 
                            value={product} 
                            onChange={e => setProduct(e.target.value as any)}
                            className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none text-sm font-bold text-gray-700"
                          >
                            <option value="Virtua">Virtua (Internet Fibra)</option>
                            <option value="TV">Claro TV+ (Entretenimento/Voz)</option>
                            <option value="Mesh">Wi-Fi Mesh (Cobertura Premium)</option>
                            <option value="Móvel">Móvel (Planos Celulares)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">URL de Imagem (Avatar)</label>
                          <input required type="text" className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none text-xs font-semibold" value={image} onChange={e => setImage(e.target.value)} />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Fala / Dúvida do Cliente (Vídeo)</label>
                        <textarea required rows={3} placeholder="O que o cliente diz ou pergunta ao atendente na simulação de vídeo..." className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 focus:claro-border-red outline-none text-xs font-semibold text-gray-600 leading-relaxed" value={question} onChange={e => setQuestion(e.target.value)} />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // AI Directives & Evaluation Tab
                <div className="space-y-5 animate-fadeIn">
                  <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-2">
                    <div className="flex items-center gap-2 text-purple-700">
                      <BrainCircuit className="h-4 w-4" />
                      <h4 className="font-black text-xs uppercase tracking-wider">
                        Personalização de Prompt e Critérios da IA
                      </h4>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      As instruções e critérios inseridos aqui terão prioridade absoluta sobre as diretrizes gerais. A IA usará este prompt para simular o cliente e avaliar as notas pedagógicas do colaborador.
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-1">
                      <Bot className="h-3.5 w-3.5 text-purple-600" />
                      Diretrizes Específicas da IA (System Instruction)
                    </label>
                    <textarea 
                      rows={4} 
                      placeholder="Ex: Você é o avaliador da simulação de Sandra. Dê nota alta se o consultor explicou a taxa de Upload de 50%, acolheu a cliente com paciência e não discutiu sobre preço..."
                      className="w-full mt-1.5 p-3.5 bg-gray-50 rounded-2xl border border-gray-200 focus:border-purple-500 outline-none text-xs font-semibold text-gray-700 leading-relaxed font-mono" 
                      value={aiSystemInstruction} 
                      onChange={e => setAiSystemInstruction(e.target.value)} 
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Deixe em branco para herdar as diretrizes padrão da categoria selecionada.
                    </p>
                  </div>

                  {/* Checklist de Critérios de Avaliação */}
                  <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-gray-600 uppercase flex items-center gap-1">
                        <ListTodo className="h-3.5 w-3.5 text-[#ee0000]" />
                        Checklist de Critérios Obrigatórios para a IA ({evalCriteria.length})
                      </label>
                    </div>
                    
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Ex: Explicar detalhadamente a taxa de 50% de Upload..." 
                        className="flex-1 p-2.5 bg-white rounded-xl border border-gray-200 text-xs font-semibold outline-none focus:border-red-500" 
                        value={criteriaInput}
                        onChange={e => setCriteriaInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCriteriaItem(); } }}
                      />
                      <button 
                        type="button" 
                        onClick={addCriteriaItem}
                        className="px-4 bg-black hover:bg-gray-800 text-white font-black text-xs uppercase rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer"
                      >
                        Adicionar
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pt-1">
                      {evalCriteria.length === 0 ? (
                        <p className="text-[11px] text-gray-400 italic text-center py-2">
                          Nenhum critério específico adicionado. A IA usará os critérios padrão da Claro.
                        </p>
                      ) : (
                        evalCriteria.map((cr, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white border border-gray-150 p-2.5 rounded-xl text-xs font-medium group">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-red-50 text-[#ee0000] text-[10px] font-black flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="text-gray-700 leading-snug">{cr}</span>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => removeCriteriaItem(idx)}
                              className="text-gray-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Remover critério"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                {modalTab === 'details' ? (
                  <button
                    type="button"
                    onClick={() => setModalTab('ai')}
                    className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-xl uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <BrainCircuit className="h-4 w-4 text-purple-600" />
                    Ajustar Diretrizes de IA →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setModalTab('details')}
                    className="py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl uppercase tracking-wider text-xs transition-colors cursor-pointer"
                  >
                    ← Voltar
                  </button>
                )}

                <button 
                  type="submit" 
                  className="flex-1 py-3.5 claro-red text-white font-black rounded-xl uppercase tracking-widest hover:bg-red-700 transition-colors shadow-md text-xs cursor-pointer"
                >
                  {editingId ? 'Salvar Alterações' : 'Criar Cenário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
