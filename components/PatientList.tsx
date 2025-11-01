
import React, { useState, useMemo } from 'react';
import { usePatients } from '../context/PatientContext.tsx';
import { Patient } from '../types.ts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card.tsx';
import { Input } from './ui/Input.tsx';
import { User, Search } from 'lucide-react';

interface PatientListProps {
  onSelectPatient: (patientId: string) => void;
}

const PatientList: React.FC<PatientListProps> = ({ onSelectPatient }) => {
  const { state } = usePatients();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = useMemo(() => {
    return state.patients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [state.patients, searchTerm]);

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Lista de Pacientes</CardTitle>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar paciente por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredPatients.length > 0 ? (
          <ul className="divide-y divide-slate-200">
            {filteredPatients.map(patient => (
              <li key={patient.id}>
                <button
                  onClick={() => onSelectPatient(patient.id)}
                  className="w-full text-left flex items-center p-4 hover:bg-slate-50 rounded-lg transition-colors"
                  aria-label={`Ver detalles de ${patient.name}`}
                >
                  <div className="p-3 bg-blue-100 rounded-full mr-4">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{patient.name}</p>
                    <p className="text-sm text-slate-500">ID: {patient.id}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-500">No se encontraron pacientes.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientList;
