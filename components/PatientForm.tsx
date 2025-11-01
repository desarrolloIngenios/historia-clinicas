
import React, { useState, useEffect } from 'react';
import { usePatients } from '../context/PatientContext.tsx';
import { Patient, ClinicalRecord } from '../types.ts';
import { calculateAge } from '../lib/utils.ts';
import { generateManagementPlan } from '../lib/gemini.ts';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/Card.tsx';
import { Input } from './ui/Input.tsx';
import { Textarea } from './ui/Textarea.tsx';
import { Button } from './ui/Button.tsx';
import { Sparkles, LoaderCircle, ArrowLeft } from 'lucide-react';

interface PatientFormProps {
  onBack: () => void;
  onSaveSuccess: (patientId: string) => void;
}

const PatientForm: React.FC<PatientFormProps> = ({ onBack, onSaveSuccess }) => {
  const { dispatch } = usePatients();
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    reasonForVisit: '',
    history: '',
    physicalExam: '',
    diagnosis: '',
    analysis: '',
    managementPlan: '',
  });
  const [age, setAge] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (formData.birthDate) {
      setAge(calculateAge(formData.birthDate));
    } else {
      setAge(null);
    }
  }, [formData.birthDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    const plan = await generateManagementPlan({
      reasonForVisit: formData.reasonForVisit,
      history: formData.history,
      physicalExam: formData.physicalExam,
      diagnosis: formData.diagnosis,
    });
    setFormData(prev => ({ ...prev, managementPlan: plan }));
    setIsGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patientId = 'P' + Date.now();
    const patient: Patient = {
      id: patientId,
      name: formData.name,
      birthDate: formData.birthDate,
    };
    const record: ClinicalRecord = {
      id: 'R' + Date.now(),
      patientId: patientId,
      createdAt: new Date().toISOString(),
      reasonForVisit: formData.reasonForVisit,
      history: formData.history,
      physicalExam: formData.physicalExam,
      diagnosis: formData.diagnosis,
      analysis: formData.analysis,
      managementPlan: formData.managementPlan,
    };
    dispatch({ type: 'ADD_PATIENT_AND_RECORD', payload: { patient, record } });
    onSaveSuccess(patientId);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Volver">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle>Nueva Historia Clínica</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="name" className="font-medium">Nombre del paciente</label>
              <Input id="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="birthDate" className="font-medium">Fecha de nacimiento</label>
              <Input id="birthDate" type="date" value={formData.birthDate} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="age" className="font-medium">Edad</label>
              <Input id="age" type="text" value={age !== null ? `${age} años` : ''} readOnly disabled />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="reasonForVisit" className="font-medium">Motivo de consulta</label>
            <Textarea id="reasonForVisit" value={formData.reasonForVisit} onChange={handleChange} rows={2} />
          </div>
          <div className="space-y-2">
            <label htmlFor="history" className="font-medium">Antecedentes</label>
            <Textarea id="history" value={formData.history} onChange={handleChange} rows={3} />
          </div>
          <div className="space-y-2">
            <label htmlFor="physicalExam" className="font-medium">Examen físico</label>
            <Textarea id="physicalExam" value={formData.physicalExam} onChange={handleChange} rows={3} />
          </div>
          <div className="space-y-2">
            <label htmlFor="diagnosis" className="font-medium">Diagnóstico</label>
            <Textarea id="diagnosis" value={formData.diagnosis} onChange={handleChange} required rows={2} />
          </div>
          <div className="space-y-2">
            <label htmlFor="analysis" className="font-medium">Análisis</label>
            <Textarea id="analysis" value={formData.analysis} onChange={handleChange} rows={2} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="managementPlan" className="font-medium">Plan de manejo</label>
              <Button type="button" variant="outline" size="sm" onClick={handleGeneratePlan} disabled={isGenerating || !formData.diagnosis}>
                {isGenerating ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
                )}
                Generar con IA
              </Button>
            </div>
            <Textarea id="managementPlan" value={formData.managementPlan} onChange={handleChange} rows={4} />
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button type="submit" form="patient-form" onClick={handleSubmit}>Guardar Historia Clínica</Button>
      </CardFooter>
    </Card>
  );
};

export default PatientForm;
