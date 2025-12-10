import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface AnalysisResult {
  text: string;
  sentiment: {
    label: string;
    score: number;
  };
  explanation?: string;
  keyPhrases?: string[];
}

interface AnalysisStatistics {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  averageScore: number;
}

interface ExportData {
  title: string;
  date: string;
  results: AnalysisResult[];
  statistics: AnalysisStatistics;
  aiInsights?: string;
  chartImages?: {
    pieChart?: string;
    barChart?: string;
  };
}

/**
 * Export analysis results to PDF
 */
export async function exportToPDF(data: ExportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${data.date}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Statistics Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary Statistics', 14, yPosition);
  yPosition += 10;

  const statsData = [
    ['Total Analyzed', data.statistics.total.toString()],
    ['Positive', `${data.statistics.positive} (${((data.statistics.positive / data.statistics.total) * 100).toFixed(1)}%)`],
    ['Negative', `${data.statistics.negative} (${((data.statistics.negative / data.statistics.total) * 100).toFixed(1)}%)`],
    ['Neutral', `${data.statistics.neutral} (${((data.statistics.neutral / data.statistics.total) * 100).toFixed(1)}%)`],
    ['Average Score', data.statistics.averageScore.toFixed(3)],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: statsData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 14, right: 14 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Charts Section
  if (data.chartImages?.pieChart || data.chartImages?.barChart) {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Visualizations', 14, yPosition);
    yPosition += 10;

    // Add Pie Chart
    if (data.chartImages.pieChart) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Sentiment Distribution', 14, yPosition);
      yPosition += 5;

      const imgWidth = 80;
      const imgHeight = 80;
      const xPosition = (pageWidth - imgWidth) / 2;

      doc.addImage(data.chartImages.pieChart, 'PNG', xPosition, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 15;
    }

    // Add Bar Chart
    if (data.chartImages.barChart) {
      // Check if we need a new page for bar chart
      if (yPosition > 180) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Top Keywords', 14, yPosition);
      yPosition += 5;

      const imgWidth = pageWidth - 28;
      const imgHeight = 60;

      doc.addImage(data.chartImages.barChart, 'PNG', 14, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 15;
    }
  }

  // AI Insights Section
  if (data.aiInsights) {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Insights', 14, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const insights = doc.splitTextToSize(data.aiInsights, pageWidth - 28);
    doc.text(insights, 14, yPosition);
    yPosition += insights.length * 5 + 10;
  }

  // Add new page for detailed results
  doc.addPage();
  yPosition = 20;

  // Detailed Results Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Analysis Results', 14, yPosition);
  yPosition += 10;

  const resultsData = data.results.slice(0, 100).map((result, index) => {
    const sentiment = result.sentiment.label.charAt(0).toUpperCase() + result.sentiment.label.slice(1);
    const score = result.sentiment.score.toFixed(3);
    const text = result.text.length > 80 ? result.text.substring(0, 77) + '...' : result.text;

    return [
      (index + 1).toString(),
      text,
      sentiment,
      score,
      result.keyPhrases?.slice(0, 2).join(', ') || '-'
    ];
  });

  autoTable(doc, {
    startY: yPosition,
    head: [['#', 'Text', 'Sentiment', 'Score', 'Key Phrases']],
    body: resultsData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 80 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 50 },
    },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 3 },
  });

  // Save the PDF
  doc.save(`${data.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`);
}

/**
 * Export analysis results to Excel
 */
export function exportToExcel(data: ExportData) {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['Analysis Report'],
    ['Title', data.title],
    ['Date', data.date],
    [],
    ['Summary Statistics'],
    ['Metric', 'Value'],
    ['Total Analyzed', data.statistics.total],
    ['Positive', `${data.statistics.positive} (${((data.statistics.positive / data.statistics.total) * 100).toFixed(1)}%)`],
    ['Negative', `${data.statistics.negative} (${((data.statistics.negative / data.statistics.total) * 100).toFixed(1)}%)`],
    ['Neutral', `${data.statistics.neutral} (${((data.statistics.neutral / data.statistics.total) * 100).toFixed(1)}%)`],
    ['Average Score', data.statistics.averageScore.toFixed(3)],
  ];

  if (data.aiInsights) {
    summaryData.push([], ['AI Insights'], [data.aiInsights]);
  }

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Detailed Results Sheet
  const resultsData = [
    ['#', 'Text', 'Sentiment', 'Score', 'Explanation', 'Key Phrases'],
    ...data.results.map((result, index) => [
      index + 1,
      result.text,
      result.sentiment.label.charAt(0).toUpperCase() + result.sentiment.label.slice(1),
      result.sentiment.score.toFixed(3),
      result.explanation || '-',
      result.keyPhrases?.join(', ') || '-',
    ]),
  ];

  const resultsSheet = XLSX.utils.aoa_to_sheet(resultsData);

  // Set column widths
  resultsSheet['!cols'] = [
    { wch: 5 },   // #
    { wch: 60 },  // Text
    { wch: 12 },  // Sentiment
    { wch: 10 },  // Score
    { wch: 50 },  // Explanation
    { wch: 40 },  // Key Phrases
  ];

  XLSX.utils.book_append_sheet(workbook, resultsSheet, 'Detailed Results');

  // Save the Excel file
  XLSX.writeFile(workbook, `${data.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.xlsx`);
}

/**
 * Export analysis results to CSV
 */
export function exportToCSV(data: ExportData) {
  const csvData = [
    ['#', 'Text', 'Sentiment', 'Score', 'Explanation', 'Key Phrases'],
    ...data.results.map((result, index) => [
      index + 1,
      `"${result.text.replace(/"/g, '""')}"`,
      result.sentiment.label.charAt(0).toUpperCase() + result.sentiment.label.slice(1),
      result.sentiment.score.toFixed(3),
      `"${(result.explanation || '-').replace(/"/g, '""')}"`,
      `"${(result.keyPhrases?.join(', ') || '-').replace(/"/g, '""')}"`,
    ]),
  ];

  const csvContent = csvData.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${data.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
