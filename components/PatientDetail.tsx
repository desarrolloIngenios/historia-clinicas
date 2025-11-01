
import React, { useState, useMemo } from 'react';
import { usePatients } from '../context/PatientContext.tsx';
import { Patient, ClinicalRecord, Prescription } from '../types.ts';
import { calculateAge } from '../lib/utils.ts';
import { generatePrescriptionPdf } from '../lib/pdfGenerator.ts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card.tsx';
import { Button } from './ui/Button.tsx';
import { Textarea } from './ui/Textarea.tsx';
import { ArrowLeft, User, Calendar, FileText, Download, Plus } from 'lucide-react';

interface PatientDetailProps {
  patient: Patient;
  onBack: () => void;
}

const PrescriptionForm: React.FC<{ patientId: string; onSave: () => void }> = ({ patientId, onSave }) => {
  const { dispatch } = usePatients();
  const [medications, setMedications] = useState('');
  const [indications, setIndications] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medications) return;
    const newPrescription: Prescription = {
      id: 'PRES' + Date.now(),
      patientId,
      createdAt: new Date().toISOString(),
      medications,
      indications,
    };
    dispatch({ type: 'ADD_PRESCRIPTION', payload: newPrescription });
    onSave();
  };

  return (
    <Card className="mt-6 bg-slate-50 border-blue-200">
      <CardHeader>
        <CardTitle>Nueva Fórmula Médica</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="medicamentos" className="font-medium text-sm">Medicamentos</label>
            <Textarea id="medicamentos" value={medications} onChange={(e) => setMedications(e.target.value)} required rows={4} />
          </div>
          <div>
            <label htmlFor="indicaciones" className="font-medium text-sm">Indicaciones</label>
            <Textarea id="indicaciones" value={indications} onChange={(e) => setIndications(e.target.value)} rows={3} />
          </div>
          <Button type="submit">Guardar Fórmula</Button>
        </form>
      </CardContent>
    </Card>
  );
};

const PatientDetail: React.FC<PatientDetailProps> = ({ patient, onBack }) => {
  const { state } = usePatients();
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);

  const patientRecords = useMemo(() => {
    const records = state.records.filter(r => r.patientId === patient.id);
    const prescriptions = state.prescriptions.filter(p => p.patientId === patient.id);
    return [...records, ...prescriptions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [state.records, state.prescriptions, patient.id]);

  const age = calculateAge(patient.birthDate);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack} aria-label="Volver a la lista">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <CardTitle className="text-3xl">{patient.name}</CardTitle>
              </div>
              <CardDescription className="mt-2 flex items-center gap-4 text-base">
                <span className="flex items-center gap-2"><User className="h-4 w-4" /> {age} años</span>
                <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Nacimiento: {new Date(patient.birthDate).toLocaleDateString('es-ES')}</span>
              </CardDescription>
            </div>
            <Button onClick={() => setShowPrescriptionForm(s => !s)}>
              <Plus className="mr-2 h-4 w-4" />
              {showPrescriptionForm ? 'Cerrar Fórmula' : 'Nueva Fórmula'}
            </Button>
          </div>
        </CardHeader>
        {showPrescriptionForm && (
          <CardContent>
            <PrescriptionForm patientId={patient.id} onSave={() => setShowPrescriptionForm(false)} />
          </CardContent>
        )}
      </Card>

      <h2 className="text-2xl font-semibold text-slate-700">Historial de Registros</h2>
      {patientRecords.length > 0 ? (
        <div className="space-y-4">
          {patientRecords.map(item => {
            if ('diagnosis' in item) { // It's a ClinicalRecord
              const record = item as ClinicalRecord;
              return (
                <Card key={record.id}>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2"><FileText className="h-5 w-5 text-blue-500" /> Historia Clínica</CardTitle>
                    <CardDescription>{new Date(record.createdAt).toLocaleString('es-ES')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div><strong>Motivo de consulta:</strong> <p className="text-slate-700">{record.reasonForVisit}</p></div>
                    <div><strong>Diagnóstico:</strong> <p className="text-slate-700">{record.diagnosis}</p></div>
                    <div><strong>Plan de manejo:</strong> <p className="text-slate-700">{record.managementPlan}</p></div>
                  </CardContent>
                </Card>
              );
            } else { // It's a Prescription
              const prescription = item as Prescription;
              return (
                <Card key={prescription.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2"><FileText className="h-5 w-5 text-green-500" /> Fórmula Médica</CardTitle>
                        <CardDescription>{new Date(prescription.createdAt).toLocaleString('es-ES')}</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => generatePrescriptionPdf(prescription, patient)}>
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div><strong>Medicamentos:</strong> <pre className="text-slate-700 bg-slate-50 p-2 rounded-md font-sans whitespace-pre-wrap">{prescription.medications}</pre></div>
                    <div><strong>Indicaciones:</strong> <p className="text-slate-700">{prescription.indications}</p></div>
                  </CardContent>
                </Card>
              );
            }
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-10">
            <p className="text-slate-500">No hay registros para este paciente.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PatientDetail;
