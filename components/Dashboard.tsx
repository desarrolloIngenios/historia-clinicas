
import React from 'react';
import { Users, FileText, PlusCircle } from 'lucide-react';
import { usePatients } from '../context/PatientContext.tsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card.tsx';
import { Button } from './ui/Button.tsx';

interface DashboardProps {
  setCurrentPage: (page: 'newRecord' | 'patientList') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setCurrentPage }) => {
  const { state } = usePatients();
  const totalPatients = state.patients.length;
  const totalRecords = state.records.length;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-800">Dashboard Médico</h1>
        <p className="mt-2 text-lg text-slate-600">Resumen de la actividad clínica.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients}</div>
            <p className="text-xs text-slate-500">Pacientes registrados en el sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Historias Clínicas</CardTitle>
            <FileText className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}</div>
            <p className="text-xs text-slate-500">Registros clínicos totales</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => setCurrentPage('newRecord')} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva Historia Clínica
          </Button>
          <Button onClick={() => setCurrentPage('patientList')} variant="secondary" className="w-full sm:w-auto">
            <Users className="mr-2 h-4 w-4" />
            Ver todos los Pacientes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
