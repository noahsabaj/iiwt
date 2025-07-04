import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportData {
  title: string;
  timestamp: Date;
  conflictLevel: number;
  timeline: any[];
  casualties: any;
  facilities: any[];
  threats: any;
}

// PDF Export functionality
export const exportToPDF = async (data: ExportData) => {
  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    
    // Header
    pdf.setFontSize(20);
    pdf.setTextColor(211, 47, 47); // Red color
    pdf.text('ISRAEL-IRAN CONFLICT TRACKER', pageWidth / 2, 20, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Report Generated: ${data.timestamp.toLocaleString()}`, pageWidth / 2, 30, { align: 'center' });
    
    let yPosition = 50;
    
    // Conflict Intensity
    pdf.setFontSize(16);
    pdf.text('Conflict Intensity', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(12);
    pdf.text(`Current Level: ${data.conflictLevel}%`, 25, yPosition);
    yPosition += 15;
    
    // Timeline Events
    if (data.timeline && data.timeline.length > 0) {
      pdf.setFontSize(16);
      pdf.text('Recent Timeline Events', 20, yPosition);
      yPosition += 10;
      
      const timelineData = data.timeline.slice(0, 10).map(event => [
        new Date(event.timestamp).toLocaleString(),
        event.title,
        event.severity.toUpperCase(),
        event.location || 'N/A'
      ]);
      
      autoTable(pdf, {
        head: [['Time', 'Event', 'Severity', 'Location']],
        body: timelineData,
        startY: yPosition,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [211, 47, 47] }
      });
      
      yPosition = (pdf as any).lastAutoTable.finalY + 20;
    }
    
    // Casualties
    if (data.casualties) {
      pdf.setFontSize(16);
      pdf.text('Casualty Information', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(12);
      if (data.casualties.killed !== undefined) {
        pdf.text(`Confirmed Fatalities: ${data.casualties.killed}`, 25, yPosition);
        yPosition += 8;
      }
      if (data.casualties.injured !== undefined) {
        pdf.text(`Confirmed Injuries: ${data.casualties.injured}`, 25, yPosition);
        yPosition += 8;
      }
      yPosition += 10;
    }
    
    // Facilities
    if (data.facilities && data.facilities.length > 0) {
      pdf.setFontSize(16);
      pdf.text('Nuclear Facilities Status', 20, yPosition);
      yPosition += 10;
      
      const facilityData = data.facilities.map(facility => [
        facility.name,
        facility.status || 'Unknown',
        facility.lastUpdate ? new Date(facility.lastUpdate).toLocaleDateString() : 'N/A'
      ]);
      
      autoTable(pdf, {
        head: [['Facility', 'Status', 'Last Update']],
        body: facilityData,
        startY: yPosition,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [211, 47, 47] }
      });
    }
    
    // Footer
    const totalPages = (pdf as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128);
      pdf.text(
        `Page ${i} of ${totalPages} | Generated by Israel-Iran Conflict Tracker`,
        pageWidth / 2,
        pdf.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    // Save the PDF
    const fileName = `conflict-report-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

// CSV Export functionality
export const exportToCSV = (data: ExportData) => {
  try {
    const csvContent = [];
    
    // Header
    csvContent.push(['Israel-Iran Conflict Tracker Report']);
    csvContent.push(['Generated:', data.timestamp.toISOString()]);
    csvContent.push(['Conflict Level:', `${data.conflictLevel}%`]);
    csvContent.push([]);
    
    // Timeline Events
    if (data.timeline && data.timeline.length > 0) {
      csvContent.push(['Timeline Events']);
      csvContent.push(['Timestamp', 'Event', 'Severity', 'Type', 'Location', 'Description']);
      
      data.timeline.forEach(event => {
        csvContent.push([
          new Date(event.timestamp).toISOString(),
          event.title,
          event.severity,
          event.type,
          event.location || '',
          event.description || ''
        ]);
      });
      csvContent.push([]);
    }
    
    // Casualties
    if (data.casualties) {
      csvContent.push(['Casualty Information']);
      csvContent.push(['Type', 'Count']);
      if (data.casualties.killed !== undefined) {
        csvContent.push(['Fatalities', data.casualties.killed]);
      }
      if (data.casualties.injured !== undefined) {
        csvContent.push(['Injuries', data.casualties.injured]);
      }
      csvContent.push([]);
    }
    
    // Convert to CSV string
    const csvString = csvContent
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    // Download CSV
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `conflict-data-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Error generating CSV:', error);
    return false;
  }
};

// JSON Export functionality
export const exportToJSON = (data: ExportData) => {
  try {
    const exportData = {
      metadata: {
        title: data.title,
        generated: data.timestamp.toISOString(),
        conflictLevel: data.conflictLevel
      },
      timeline: data.timeline,
      casualties: data.casualties,
      facilities: data.facilities,
      threats: data.threats
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `conflict-data-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Error generating JSON:', error);
    return false;
  }
};

// Main export function with format selection
export const exportData = async (data: ExportData, format: 'pdf' | 'csv' | 'json' = 'pdf') => {
  switch (format) {
    case 'pdf':
      return await exportToPDF(data);
    case 'csv':
      return exportToCSV(data);
    case 'json':
      return exportToJSON(data);
    default:
      console.error('Unsupported export format:', format);
      return false;
  }
};