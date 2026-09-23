import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Evaluation } from '../types';

/**
 * Utilitário para exportação de relatórios em Excel (.xlsx) e PDF
 * Desenvolvido especificamente para o Painel Administrativo do Explica+
 */

export const ReportService = {
  /**
   * Exporta a lista de avaliações e transcrições para planilha Excel (.xlsx)
   */
  exportToExcel: (evaluations: Evaluation[], filenamePrefix = 'Relatorio_Avaliacoes_ExplicaPlus') => {
    if (!evaluations || evaluations.length === 0) {
      alert('Não há avaliações disponíveis para exportação.');
      return;
    }

    const data = evaluations.map((ev, index) => {
      const date = new Date(ev.timestamp);
      const dataFormatada = isNaN(date.getTime()) 
        ? ev.timestamp 
        : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

      let nivel = 'Excelente';
      if (ev.score < 5) nivel = 'Abaixo do Esperado';
      else if (ev.score < 7) nivel = 'Em Desenvolvimento';
      else if (ev.score < 9) nivel = 'Bom';

      return {
        '#': index + 1,
        'Colaborador': ev.userName,
        'ID Usuário': ev.userId,
        'UF': ev.uf,
        'Cidade': ev.city,
        'Data e Hora': dataFormatada,
        'Modo': ev.evalMode === 'script' ? 'Com Roteiro' : ev.evalMode === 'simulator' ? 'Simulador IA' : 'Livre (Conhecimento)',
        'Nota IA (0-10)': Number(ev.score.toFixed(1)),
        'Classificação': nivel,
        'Pontos Fortes': ev.strengths || '',
        'Pontos a Melhorar': ev.weaknesses || '',
        'Dicas e Recomendações': ev.suggestions || '',
        'Transcrição da Fala': ev.transcript || 'Sem transcrição registrada'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Ajuste de largura das colunas para visualização agradável no Excel
    worksheet['!cols'] = [
      { wch: 5 },  // #
      { wch: 25 }, // Colaborador
      { wch: 15 }, // ID
      { wch: 6 },  // UF
      { wch: 18 }, // Cidade
      { wch: 18 }, // Data/Hora
      { wch: 18 }, // Modo
      { wch: 14 }, // Nota
      { wch: 20 }, // Classificação
      { wch: 45 }, // Pontos Fortes
      { wch: 45 }, // Pontos a Melhorar
      { wch: 45 }, // Dicas
      { wch: 60 }  // Transcrição
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Avaliações e Transcrições');

    const hoje = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `${filenamePrefix}_${hoje}.xlsx`);
  },

  /**
   * Exporta relatório gerencial formatado em PDF profissional
   */
  exportToPDF: (evaluations: Evaluation[], title = 'Relatório Geral de Simulações e Avaliações') => {
    if (!evaluations || evaluations.length === 0) {
      alert('Não há avaliações disponíveis para exportação em PDF.');
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);
    let y = 18;

    // Cabeçalho institucional Claro
    const drawHeader = () => {
      // Faixa vermelha superior
      doc.setFillColor(238, 0, 0); // Claro Red (#ee0000)
      doc.rect(0, 0, pageWidth, 5, 'F');

      // Título
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(238, 0, 0);
      doc.text('CLARO | EXPLICA+', margin, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(title, margin, y + 6);

      const dataHoje = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      doc.setFontSize(8);
      doc.text(`Gerado em: ${dataHoje}`, pageWidth - margin, y + 6, { align: 'right' });

      // Linha divisória
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y + 10, pageWidth - margin, y + 10);
      y += 16;
    };

    // Resumo Estatístico no topo da 1ª página
    drawHeader();

    const totalSimulacoes = evaluations.length;
    const mediaGeral = (evaluations.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalSimulacoes).toFixed(1);
    const excelentes = evaluations.filter(e => e.score >= 9).length;
    const regulares = evaluations.filter(e => e.score >= 7 && e.score < 9).length;
    const atencao = evaluations.filter(e => e.score < 7).length;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text('RESUMO GERAL DE DESEMPENHO', margin + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    const statsText = `Total de Simulações: ${totalSimulacoes}   |   Média Geral: ${mediaGeral}/10   |   Excelentes (9-10): ${excelentes}   |   Bons (7-8.9): ${regulares}   |   Requer Atenção (<7): ${atencao}`;
    doc.text(statsText, margin + 4, y + 14);

    y += 28;

    // Iteração pelas avaliações
    evaluations.forEach((ev, idx) => {
      // Estimar espaço necessário
      const dataStr = new Date(ev.timestamp).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const modoStr = ev.evalMode === 'script' ? 'Com Roteiro' : ev.evalMode === 'simulator' ? 'Simulador IA' : 'Livre (Conhecimento)';

      // Se estiver próximo do fim da página, cria nova página
      if (y > pageHeight - 65) {
        doc.addPage();
        y = 18;
        drawHeader();
      }

      // Caixa da Avaliação
      const boxStartY = y;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(229, 231, 235);

      // Barra colorida da nota
      const scoreColor = ev.score >= 9 ? [16, 185, 129] : ev.score >= 7 ? [59, 130, 246] : [239, 68, 68];
      
      // Cabeçalho do Card
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(31, 41, 55);
      doc.text(`${idx + 1}. ${ev.userName}`, margin + 3, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(`Localidade: ${ev.city} - ${ev.uf}  •  Data: ${dataStr}  •  Modo: ${modoStr}`, margin + 3, y + 10);

      // Nota no canto direito
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      doc.text(`Nota: ${ev.score.toFixed(1)}/10`, pageWidth - margin - 3, y + 6, { align: 'right' });

      y += 14;

      // Pontos Fortes
      if (ev.strengths) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(22, 101, 52);
        doc.text('Pontos Fortes:', margin + 3, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        const splitStrengths = doc.splitTextToSize(ev.strengths, contentWidth - 6);
        doc.text(splitStrengths, margin + 3, y + 4);
        y += 4 + (splitStrengths.length * 3.5) + 2;
      }

      // Pontos a Melhorar
      if (ev.weaknesses) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(180, 83, 9);
        doc.text('Pontos a Desenvolver:', margin + 3, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        const splitWeaknesses = doc.splitTextToSize(ev.weaknesses, contentWidth - 6);
        doc.text(splitWeaknesses, margin + 3, y + 4);
        y += 4 + (splitWeaknesses.length * 3.5) + 2;
      }

      // Transcrição da Fala
      if (ev.transcript) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(79, 70, 229);
        doc.text('Transcrição Integral da Fala:', margin + 3, y);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(75, 85, 99);
        const splitTranscript = doc.splitTextToSize(`"${ev.transcript}"`, contentWidth - 6);
        doc.text(splitTranscript, margin + 3, y + 4);
        y += 4 + (splitTranscript.length * 3.5) + 2;
      }

      // Traço separador
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 2, pageWidth - margin, y + 2);
      y += 6;
    });

    // Numeração de páginas no rodapé
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(156, 163, 175);
      doc.text(
        `Explica+ Claro Brasil • Relatório de Desempenho e Conformidade • Página ${i} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
    }

    const hoje = new Date().toISOString().slice(0, 10);
    doc.save(`Relatorio_ExplicaPlus_${hoje}.pdf`);
  }
};
