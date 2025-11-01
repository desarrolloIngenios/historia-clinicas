
import React, { useState, useMemo } from 'react';
import { PatientProvider, usePatients } from './context/PatientContext.tsx';
import Header from './components/Header.tsx';
import Dashboard from './components/Dashboard.tsx';
import PatientList from './components/PatientList.tsx';
import PatientDetail from './components/PatientDetail.tsx';
import PatientForm from './components/PatientForm.tsx';
import { Patient } from './types.ts';

type Page = 'dashboard' | 'patientList' | 'patientDetail' | 'newRecord';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const { state } = usePatients();

  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return state.patients.find(p => p.id === selectedPatientId) || null;
  }, [selectedPatientId, state.patients]);

  const navigateToPatientDetail = (patientId: string) => {
    setSelectedPatientId(patientId);
    setCurrentPage('patientDetail');
  };

  const handleBack = () => {
    if (currentPage === 'patientDetail') {
      setCurrentPage('patientList');
      setSelectedPatientId(null);
    } else if (currentPage === 'newRecord') {
      setCurrentPage('dashboard');
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard setCurrentPage={setCurrentPage} />;
      case 'patientList':
        return <PatientList onSelectPatient={navigateToPatientDetail} />;
      case 'patientDetail':
        return selectedPatient ? <PatientDetail patient={selectedPatient} onBack={handleBack} /> : <PatientList onSelectPatient={navigateToPatientDetail} />;
      case 'newRecord':
        return <PatientForm onBack={handleBack} onSaveSuccess={(patientId) => navigateToPatientDetail(patientId)} />;
      default:
        return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Header setCurrentPage={setCurrentPage} />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {renderContent()}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <PatientProvider>
      <AppContent />
    </PatientProvider>
  );
};

export default App;
