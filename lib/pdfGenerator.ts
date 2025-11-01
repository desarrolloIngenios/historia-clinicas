
import jsPDF from 'jspdf';
import { Prescription, Patient } from '../types.ts';

export const generatePrescriptionPdf = (prescription: Prescription, patient: Patient) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Fórmula Médica', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Dr. Asistente Virtual', 20, 30);
  doc.text('Medicina General', 20, 36);
  
  doc.line(20, 45, 190, 45); // Separator

  // Patient Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Paciente:', 20, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(patient.name, 45, 55);

  doc.setFont('helvetica', 'bold');
  doc.text('Fecha:', 140, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(prescription.createdAt).toLocaleDateString('es-ES'), 160, 55);

  doc.line(20, 65, 190, 65); // Separator

  // Prescription Body
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Rp/', 20, 75);

  // Medicamentos
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Medicamentos:', 20, 85);
  doc.setFont('helvetica', 'normal');
  const medsText = doc.splitTextToSize(prescription.medications, 170);
  doc.text(medsText, 20, 92);
  
  const medsHeight = doc.getTextDimensions(medsText).h;

  // Indicaciones
  doc.setFont('helvetica', 'bold');
  doc.text('Indicaciones:', 20, 97 + medsHeight);
  doc.setFont('helvetica', 'normal');
  const indText = doc.splitTextToSize(prescription.indications, 170);
  doc.text(indText, 20, 104 + medsHeight);

  // Footer
  doc.line(20, 270, 190, 270);
  doc.setFontSize(10);
  doc.text('Firma del Médico', 105, 280, { align: 'center' });
  doc.text('Este documento es una representación digital de una fórmula médica.', 105, 285, { align: 'center' });

  doc.save(`formula_${patient.name.replace(/\s/g, '_')}_${new Date(prescription.createdAt).toLocaleDateString('es-ES')}.pdf`);
};
