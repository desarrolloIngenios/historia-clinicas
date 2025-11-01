
import React from 'react';
import { Stethoscope } from 'lucide-react';

interface HeaderProps {
  setCurrentPage: (page: 'dashboard' | 'patientList') => void;
}

const Header: React.FC<HeaderProps> = ({ setCurrentPage }) => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button onClick={() => setCurrentPage('dashboard')} className="flex items-center space-x-2 text-blue-600">
              <Stethoscope size={28} />
              <span className="font-bold text-xl">Clinical Records AI</span>
            </button>
          </div>
          <nav className="hidden md:flex md:space-x-8">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentPage('patientList')}
              className="font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              Pacientes
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
