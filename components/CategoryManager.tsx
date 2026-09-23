import React, { useState, useEffect } from 'react';
import { DB } from '../db';
import { Category } from '../types';
import { Plus, Trash2, Edit3, Tag, Search, FolderPlus, X, FileText, CheckCircle2, Cpu, Sliders, Eye } from 'lucide-react';

const PRESET_ICONS = ['🎯', '💼', '🎧', '📡', '🗣️', '🚀', '💡', '🛡️', '📱', '📊', '🏆', '🌟', '📚', '⚡'];

export const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'script' | 'eval' | 'aiConfig'>('general');
  const [previewCat, setPreviewCat] = useState<Category | null>(null);
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [refresh, setRefresh] = useState<number>(0);

  // Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    icon: '🎯',
    module: 'all' as 'all' | 'consultivo' | 'simulator',
    active: true,
    script: '',
    evalCriteriaText: '',
    aiSystemInstruction: '',
    aiModel: 'gemini-3.5-flash',
    aiTemperature: 0.7
  });

  useEffect(() => {
    setCategories(DB.categories.all());
  }, [refresh]);

  const handleOpenNewModal = () => {
    setEditingId(null);
    setActiveTab('general');
    setForm({
      name: '',
      description: '',
      icon: '🎯',
      module: 'all',
      active: true,
      script: '',
      evalCriteriaText: '',
      aiSystemInstruction: '',
      aiModel: 'gemini-3.5-flash',
      aiTemperature: 0.7
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    setEditingId(cat.id);
    setActiveTab('general');
    setForm({
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon || '🎯',
      module: cat.module || 'all',
      active: cat.active !== false,
      script: cat.script || '',
      evalCriteriaText: cat.evalCriteria ? cat.evalCriteria.join('\n') : '',
      aiSystemInstruction: cat.aiSystemInstruction || '',
      aiModel: cat.aiModel || 'gemini-3.5-flash',
      aiTemperature: cat.aiTemperature ?? 0.7
    });
    setShowModal(true);
  };

  const handleDeleteCategory = (cat: Category) => {
    setDeletingCat(cat);
  };

  const confirmDeleteCategory = async () => {
    if (deletingCat) {
      await DB.categories.delete(deletingCat.id);
      setDeletingCat(null);
      setRefresh(prev => prev + 1);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    const updated = { ...cat, active: !cat.active };
    await DB.categories.update(updated);
    setRefresh(prev => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Por favor, informe o nome da categoria.');
      return;
    }

    // Process criteria text into array
    const parsedCriteria = form.evalCriteriaText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (editingId) {
      // Editar
      const original = categories.find(c => c.id === editingId);
      const updated: Category = {
        id: editingId,
        name: form.name.trim(),
        description: form.description.trim(),
        icon: form.icon,
        module: form.module,
        active: form.active,
        script: form.script.trim(),
        evalCriteria: parsedCriteria,
        aiSystemInstruction: form.aiSystemInstruction.trim(),
        aiModel: form.aiModel,
        aiTemperature: Number(form.aiTemperature),
        createdAt: original?.createdAt || new Date().toISOString()
      };
      await DB.categories.update(updated);
      alert('Categoria atualizada com sucesso!');
    } else {
      // Cadastrar
      const newCat: Category = {
        id: 'cat-' + Math.random().toString(36).substring(2, 9),
        name: form.name.trim(),
        description: form.description.trim(),
        icon: form.icon,
        module: form.module,
        active: form.active,
        script: form.script.trim(),
        evalCriteria: parsedCriteria,
        aiSystemInstruction: form.aiSystemInstruction.trim(),
        aiModel: form.aiModel,
        aiTemperature: Number(form.aiTemperature),
        createdAt: new Date().toISOString()
      };
      await DB.categories.add(newCat);
      alert('Nova categoria cadastrada no menu!');
    }

    setShowModal(false);
    setRefresh(prev => prev + 1);
  };

  const filteredCategories = categories.filter(c => {
    const term = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) || (c.description && c.description.toLowerCase().includes(term));
  });

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-[#ee0000]">
              <Tag className="h-4 w-4" />
            </div>
            <h3 className="font-black text-gray-800 text-lg uppercase tracking-tight">Gerenciador de Categorias e I.A do Menu</h3>
          </div>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Cadastre e personalize categorias do menu, edite roteiros guia, critérios de avaliação da I.A e prompts para cada cenário.
          </p>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="claro-red text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-95 transition-all self-start md:self-center"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          Cadastrar Categoria
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar categorias por nome, descrição ou conteúdo..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-gray-200 focus:claro-border-red outline-none text-xs font-semibold text-gray-700 shadow-sm"
        />
      </div>

      {/* Grid de Categorias */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center space-y-3">
          <FolderPlus className="h-10 w-10 text-gray-300 mx-auto" />
          <h4 className="font-bold text-gray-600 text-sm">Nenhuma categoria encontrada</h4>
          <p className="text-xs text-gray-400">Clique em "Cadastrar Categoria" para incluir a primeira categoria no menu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCategories.map(cat => (
            <div
              key={cat.id}
              className={`bg-white p-5 rounded-3xl border shadow-sm transition-all flex flex-col justify-between space-y-4 relative ${
                cat.active !== false ? 'border-gray-200 hover:border-red-200' : 'border-gray-200/60 bg-gray-50/60 opacity-60'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-2 bg-gray-50 rounded-2xl border border-gray-100">{cat.icon || '🎯'}</span>
                    <div>
                      <h4 className="font-black text-gray-800 text-sm leading-tight">{cat.name}</h4>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        cat.module === 'consultivo'
                          ? 'bg-purple-100 text-purple-700'
                          : cat.module === 'simulator'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {cat.module === 'consultivo' ? 'Consultivo +' : cat.module === 'simulator' ? 'Simulador I.A' : 'Todos'}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Ativo */}
                  <button
                    onClick={() => handleToggleActive(cat)}
                    title={cat.active !== false ? "Desativar categoria" : "Ativar categoria"}
                    className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${
                      cat.active !== false
                        ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200'
                        : 'bg-gray-200 text-gray-600 border border-gray-300 hover:bg-gray-300'
                    }`}
                  >
                    {cat.active !== false ? 'Ativa' : 'Inativa'}
                  </button>
                </div>

                {/* Badges de Conteúdo da Categoria (Exibe apenas os configurados de forma limpa) */}
                {(cat.script || (cat.evalCriteria && cat.evalCriteria.length > 0) || cat.aiSystemInstruction) && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {cat.script && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Roteiro OK
                      </span>
                    )}

                    {cat.evalCriteria && cat.evalCriteria.length > 0 && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> {cat.evalCriteria.length} Critérios IA
                      </span>
                    )}

                    {cat.aiSystemInstruction && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold flex items-center gap-1">
                        <Cpu className="h-3 w-3" /> Prompt IA
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Ações do Card */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setPreviewCat(cat)}
                  className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold rounded-xl transition-all flex items-center gap-1 border border-gray-200"
                >
                  <Eye className="h-3.5 w-3.5 text-gray-500" />
                  Inspecionar
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(cat)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                    title="Remover categoria"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Confirmação de Exclusão / Remoção */}
      {deletingCat && (
        <div className="fixed inset-0 z-[280] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-4 animate-scaleUp relative border border-gray-100">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-2">
              <Trash2 className="h-6 w-6" />
            </div>
            
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-gray-900">Remover Categoria</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Tem certeza que deseja remover a categoria <strong className="text-gray-800">"{deletingCat.name}"</strong>?
              </p>
              <p className="text-[11px] text-gray-400">
                Esta ação removerá o roteiro, critérios e configurações de I.A associados a esta categoria.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCat(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/20 transition-all"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Inspeção Rápida */}
      {previewCat && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-2xl p-6 rounded-3xl shadow-2xl space-y-5 animate-scaleUp relative border border-gray-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setPreviewCat(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <span className="text-3xl p-2 bg-gray-50 rounded-2xl border border-gray-100">{previewCat.icon || '🎯'}</span>
              <div>
                <h3 className="font-black text-gray-800 text-lg">{previewCat.name}</h3>
                <p className="text-xs text-gray-500 font-medium">{previewCat.description || 'Sem descrição.'}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Roteiro */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Roteiro de Atendimento / Teleprompter
                </div>
                {previewCat.script ? (
                  <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-xl border border-gray-200">
                    {previewCat.script}
                  </pre>
                ) : (
                  <p className="text-xs text-gray-400 italic">Nenhum roteiro cadastrado para esta categoria.</p>
                )}
              </div>

              {/* Critérios da IA */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  O que a I.A irá Avaliar (Critérios de Sucesso)
                </div>
                {previewCat.evalCriteria && previewCat.evalCriteria.length > 0 ? (
                  <ul className="space-y-1.5 pl-1">
                    {previewCat.evalCriteria.map((crit, idx) => (
                      <li key={idx} className="text-xs font-semibold text-gray-800 flex items-start gap-2 bg-white p-2.5 rounded-xl border border-gray-200">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{crit}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400 italic">Nenhum critério específico de avaliação configurado.</p>
                )}
              </div>

              {/* Config da IA */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase">
                  <Cpu className="h-4 w-4 text-amber-600" />
                  Configuração da I.A para o Cenário
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Modelo I.A</span>
                    <span className="font-mono font-bold text-gray-800">{previewCat.aiModel || 'gemini-3.5-flash'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Temperatura / Criatividade</span>
                    <span className="font-mono font-bold text-gray-800">{previewCat.aiTemperature ?? 0.7}</span>
                  </div>
                </div>
                {previewCat.aiSystemInstruction ? (
                  <div className="bg-white p-3 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Diretriz do Sistema (Prompt)</span>
                    <p className="text-xs text-gray-800 font-medium leading-relaxed whitespace-pre-wrap">
                      {previewCat.aiSystemInstruction}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Usando as instruções padrão globais do sistema.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  const catToEdit = previewCat;
                  setPreviewCat(null);
                  handleOpenEditModal(catToEdit);
                }}
                className="px-5 py-2.5 claro-red text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Edit3 className="h-4 w-4" />
                Editar esta Categoria
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro / Edição Avançada */}
      {showModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-2xl p-6 rounded-3xl shadow-2xl space-y-5 animate-scaleUp relative border border-gray-100 max-h-[92vh] flex flex-col">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-[#ee0000]">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-gray-800 text-base uppercase">
                    {editingId ? 'Editar Categoria & Configurações da IA' : 'Cadastrar Categoria com IA'}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Menu e Inteligência Artificial</p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navegação por Abas do Form */}
            <div className="flex border-b border-gray-100 gap-1 shrink-0 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'general' ? 'claro-red text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Tag className="h-3.5 w-3.5" /> Dados Gerais
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('script')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'script' ? 'claro-red text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FileText className="h-3.5 w-3.5" /> Roteiro de Atendimento
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('eval')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'eval' ? 'claro-red text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> O que a I.A irá Avaliar
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('aiConfig')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'aiConfig' ? 'claro-red text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Cpu className="h-3.5 w-3.5" /> Configuração I.A
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* TAB 1: Dados Gerais */}
              {activeTab === 'general' && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1">
                      Nome da Categoria <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Ex: Retenção & Vendas"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full p-3 bg-gray-50 rounded-2xl border border-gray-200 focus:claro-border-red outline-none text-xs font-bold text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1">
                      Descrição Explicativa
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Táticas para argumentação de permanência e superação de objeções..."
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      className="w-full p-3 bg-gray-50 rounded-2xl border border-gray-200 focus:claro-border-red outline-none text-xs font-medium text-gray-700"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="shrink-0">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1">
                        Ícone
                      </label>
                      <div className="w-12 h-12 bg-white rounded-2xl border-2 border-red-500 shadow-sm flex items-center justify-center text-2xl">
                        {form.icon || '🎯'}
                      </div>
                    </div>

                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1">
                        Escolha um Ícone Rápido
                      </label>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        {['🎯', '💼', '🎧', '📡', '🗣️', '🛡️', '⚡', '💰', '🚀', '⭐', '🤝'].map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setForm({ ...form, icon: emoji })}
                            className={`text-lg w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                              form.icon === emoji ? 'bg-red-50 border border-red-300 scale-105' : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1">
                      Módulo do Sistema
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, module: 'all' })}
                        className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all border ${
                          form.module === 'all'
                            ? 'bg-red-50 text-red-700 border-red-300 font-black'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        Todos
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, module: 'consultivo' })}
                        className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all border ${
                          form.module === 'consultivo'
                            ? 'bg-purple-50 text-purple-700 border-purple-300 font-black'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        Consultivo +
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, module: 'simulator' })}
                        className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all border ${
                          form.module === 'simulator'
                            ? 'bg-blue-50 text-blue-700 border-blue-300 font-black'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        Simulador I.A
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-200">
                    <span className="text-xs font-bold text-gray-700 uppercase">Status da Categoria</span>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, active: !form.active })}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase transition-all ${
                        form.active ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'
                      }`}
                    >
                      {form.active ? 'Ativa no Menu' : 'Inativa'}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: Roteiro de Atendimento */}
              {activeTab === 'script' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100 flex items-start gap-2">
                    <FileText className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 font-medium leading-snug">
                      Cadastre o <strong>Roteiro de Atendimento (Teleprompter)</strong> recomendado para esta categoria. Este texto servirá de guia para o colaborador durante a simulação e gravação.
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1">
                      Texto do Roteiro / Passos do Diálogo
                    </label>
                    <textarea
                      rows={8}
                      placeholder="Ex:
1. Cumprimento inicial caloroso e identificação do atendente.
2. Escuta ativa da reclamação ou pedido do cliente.
3. Apresentação do diferencial do upload de 50% e Wi-Fi Mesh.
4. Fechamento do acordo com confirmação do plano."
                      value={form.script}
                      onChange={e => setForm({ ...form, script: e.target.value })}
                      className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 focus:claro-border-red outline-none text-xs font-mono font-medium text-gray-800 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: O que a IA irá Avaliar */}
              {activeTab === 'eval' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100 flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-800 font-medium leading-snug">
                      Insira os <strong>Critérios de Êxito</strong> que a I.A irá auditar no desempenho do colaborador. Digite <strong>um critério por linha</strong>.
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1">
                      Critérios de Avaliação (1 por linha)
                    </label>
                    <textarea
                      rows={8}
                      placeholder="Ex:
Empatia e escuta ativa no acolhimento do cliente
Explicação clara da taxa de upload de 50% da fibra Claro
Sondagem dos hábitos de uso e recomendação do plano adequado
Contorno de objeções com argumentos de valor e segurança"
                      value={form.evalCriteriaText}
                      onChange={e => setForm({ ...form, evalCriteriaText: e.target.value })}
                      className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 focus:claro-border-red outline-none text-xs font-semibold text-gray-800 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: Configuração da IA */}
              {activeTab === 'aiConfig' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100 flex items-start gap-2">
                    <Cpu className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 font-medium leading-snug">
                      Defina a <strong>Instrução e Comportamento da I.A</strong> para esta categoria específica. O prompt abaixo direciona tanto o cliente virtual quanto o avaliador de notas.
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1">
                      Instrução / Prompt do Sistema da I.A
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Ex: Você é um avaliador e simulador especializado no segmento de Retenção da Claro. Dê nota máxima se o colaborador souber contornar o pedido de cancelamento com calma, sugerindo os benefícios do Wi-Fi 6..."
                      value={form.aiSystemInstruction}
                      onChange={e => setForm({ ...form, aiSystemInstruction: e.target.value })}
                      className="w-full p-3 bg-gray-50 rounded-2xl border border-gray-200 focus:claro-border-red outline-none text-xs font-medium text-gray-800 leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1">
                        Modelo de I.A (Gemini)
                      </label>
                      <select
                        value={form.aiModel}
                        onChange={e => setForm({ ...form, aiModel: e.target.value })}
                        className="w-full p-3 bg-gray-50 rounded-2xl border border-gray-200 focus:claro-border-red outline-none text-xs font-bold text-gray-800"
                      >
                        <option value="gemini-3.5-flash">Gemini 3.5 Flash (Recomendado / Ultra Rápido)</option>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Rápido e Estável)</option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro (Análise Profunda)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1">
                        Temperatura / Nível de Criatividade ({form.aiTemperature})
                      </label>
                      <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-2xl border border-gray-200">
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.1"
                          value={form.aiTemperature}
                          onChange={e => setForm({ ...form, aiTemperature: parseFloat(e.target.value) })}
                          className="w-full accent-red-600"
                        />
                        <span className="font-mono font-bold text-xs text-gray-700 shrink-0">
                          {form.aiTemperature}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões do Rodapé */}
              <div className="flex gap-3 pt-3 border-t border-gray-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-black text-xs uppercase tracking-wider transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 claro-red text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {editingId ? 'Salvar Categoria & I.A' : 'Cadastrar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
