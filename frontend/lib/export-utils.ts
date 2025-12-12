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
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 25;

  // Header with background
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(data.title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(240, 240, 240);
  doc.text(`Generated: ${data.date}`, pageWidth / 2, yPosition, { align: 'center' });

  // Reset text color
  doc.setTextColor(0, 0, 0);
  yPosition = 60;

  // Statistics Section with better formatting
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246);
  doc.text('Summary Statistics', 14, yPosition);
  yPosition += 8;

  // Draw separator line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(14, yPosition, pageWidth - 14, yPosition);
  yPosition += 5;

  doc.setTextColor(0, 0, 0);

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
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      fontSize: 11,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { halign: 'right', cellWidth: 'auto' }
    },
    margin: { left: 14, right: 14 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Charts Section
  if (data.chartImages?.pieChart || data.chartImages?.barChart) {
    // Check if we need a new page
    if (yPosition > 180) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('Visualizations', 14, yPosition);
    yPosition += 8;

    // Draw separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(14, yPosition, pageWidth - 14, yPosition);
    yPosition += 10;

    doc.setTextColor(0, 0, 0);

    // Add Pie Chart
    if (data.chartImages.pieChart) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Sentiment Distribution', 14, yPosition);
      yPosition += 8;

      const imgWidth = 120;
      const imgHeight = 120;
      const xPosition = (pageWidth - imgWidth) / 2;

      // Add border around chart
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.rect(xPosition - 2, yPosition - 2, imgWidth + 4, imgHeight + 4);

      doc.addImage(data.chartImages.pieChart, 'PNG', xPosition, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 20;
    }

    // Add Bar Chart
    if (data.chartImages.barChart) {
      // Check if we need a new page for bar chart
      if (yPosition > 150) {
        doc.addPage();
        yPosition = 20;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246);
        doc.text('Visualizations (continued)', 14, yPosition);
        yPosition += 8;

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(14, yPosition, pageWidth - 14, yPosition);
        yPosition += 10;

        doc.setTextColor(0, 0, 0);
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Sentiment Trend Over Time', 14, yPosition);
      yPosition += 8;

      const imgWidth = pageWidth - 28;
      const imgHeight = 100;

      // Add border around chart
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.rect(14 - 2, yPosition - 2, imgWidth + 4, imgHeight + 4);

      doc.addImage(data.chartImages.barChart, 'PNG', 14, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 20;
    }
  }

  // AI Insights Section
  if (data.aiInsights) {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('AI Insights', 14, yPosition);
    yPosition += 8;

    // Draw separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(14, yPosition, pageWidth - 14, yPosition);
    yPosition += 10;

    // Format AI Insights with better parsing
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    // Split insights into sections and format
    const insightLines = data.aiInsights.split('\n');
    let currentY = yPosition;

    insightLines.forEach((line) => {
      // Check for new page
      if (currentY > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }

      const trimmedLine = line.trim();

      // Format headers (lines starting with ### or **)
      if (trimmedLine.startsWith('###') || trimmedLine.startsWith('##')) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        const text = trimmedLine.replace(/#+\s*/, '').replace(/\*\*/g, '');
        doc.text(text, 14, currentY);
        currentY += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
      } else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        // Bullet points
        const text = doc.splitTextToSize(trimmedLine.replace(/^[-*]\s*/, '• '), pageWidth - 32);
        doc.text(text, 18, currentY);
        currentY += text.length * 5;
      } else if (trimmedLine.length > 0) {
        // Regular text
        const text = doc.splitTextToSize(trimmedLine, pageWidth - 28);
        doc.text(text, 14, currentY);
        currentY += text.length * 5;
      } else {
        currentY += 4;
      }
    });

    yPosition = currentY + 10;
  }

  // Add new page for detailed results
  doc.addPage();
  yPosition = 20;

  // Detailed Results Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246);
  doc.text('Detailed Analysis Results', 14, yPosition);
  yPosition += 8;

  // Draw separator line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(14, yPosition, pageWidth - 14, yPosition);
  yPosition += 5;

  doc.setTextColor(0, 0, 0);

  const resultsData = data.results.slice(0, 100).map((result, index) => {
    const sentiment = result.sentiment.label.charAt(0).toUpperCase() + result.sentiment.label.slice(1);
    const score = (result.sentiment.score * 100).toFixed(1) + '%';
    const text = result.text.length > 100 ? result.text.substring(0, 97) + '...' : result.text;

    return [
      (index + 1).toString(),
      text,
      sentiment,
      score
    ];
  });

  autoTable(doc, {
    startY: yPosition,
    head: [['#', 'Text', 'Sentiment', 'Confidence']],
    body: resultsData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 120, halign: 'left' },
      2: {
        cellWidth: 28,
        halign: 'center',
        fontStyle: 'bold'
      },
      3: { cellWidth: 25, halign: 'center' }
    },
    didParseCell: (data: any) => {
      // Color code sentiment cells
      if (data.column.index === 2 && data.section === 'body') {
        const sentiment = data.cell.raw;
        if (sentiment === 'Positive') {
          data.cell.styles.textColor = [34, 197, 94]; // green
        } else if (sentiment === 'Negative') {
          data.cell.styles.textColor = [239, 68, 68]; // red
        } else {
          data.cell.styles.textColor = [107, 114, 128]; // gray
        }
      }
    },
    margin: { left: 14, right: 14 },
    showHead: 'firstPage',
  });

  // Add footer with page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      'SentiScope Analysis Report',
      14,
      pageHeight - 10
    );
  }

  // Save the PDF
  const fileName = `${data.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
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
