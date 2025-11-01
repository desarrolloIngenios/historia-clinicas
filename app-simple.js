import React from 'react';
import ReactDOM from 'react-dom/client';

// Datos de prueba para pacientes
const samplePatients = [
  {
    id: '1',
    personalInfo: {
      firstName: 'Juan',
      lastName: 'Pérez',
      dateOfBirth: '1985-05-15',
      phone: '555-0123',
      email: 'juan.perez@email.com',
      address: 'Calle Principal 123'
    },
    records: [
      {
        id: 'r1',
        date: '2024-10-31',
        reasonForVisit: 'Dolor de cabeza',
        diagnosis: 'Cefalea tensional',
        treatmentPlan: 'Analgésicos según necesidad'
      }
    ]
  }
];

// Componente principal simplificado
function App() {
  const [currentView, setCurrentView] = React.useState('dashboard');
  const [patients, setPatients] = React.useState(samplePatients);

  const DashboardView = () => (
    React.createElement('div', { className: 'space-y-6' }, [
      React.createElement('h1', { 
        key: 'title',
        className: 'text-3xl font-bold text-slate-800' 
      }, 'Sistema de Historias Clínicas'),
      
      React.createElement('div', { 
        key: 'stats',
        className: 'grid grid-cols-1 md:grid-cols-3 gap-6' 
      }, [
        React.createElement('div', {
          key: 'patients-card',
          className: 'bg-white p-6 rounded-lg shadow-md'
        }, [
          React.createElement('h3', {
            key: 'patients-title',
            className: 'text-lg font-semibold text-slate-700'
          }, 'Total Pacientes'),
          React.createElement('p', {
            key: 'patients-count',
            className: 'text-3xl font-bold text-blue-600'
          }, patients.length.toString())
        ]),
        
        React.createElement('div', {
          key: 'records-card',
          className: 'bg-white p-6 rounded-lg shadow-md'
        }, [
          React.createElement('h3', {
            key: 'records-title',
            className: 'text-lg font-semibold text-slate-700'
          }, 'Historias Clínicas'),
          React.createElement('p', {
            key: 'records-count',
            className: 'text-3xl font-bold text-green-600'
          }, patients.reduce((acc, p) => acc + p.records.length, 0).toString())
        ]),
        
        React.createElement('div', {
          key: 'actions-card',
          className: 'bg-white p-6 rounded-lg shadow-md'
        }, [
          React.createElement('h3', {
            key: 'actions-title',
            className: 'text-lg font-semibold text-slate-700 mb-4'
          }, 'Acciones Rápidas'),
          React.createElement('button', {
            key: 'new-patient-btn',
            className: 'w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 transition-colors font-medium',
            onClick: () => {
              console.log('Dashboard new patient button clicked'); // Debug log
              setCurrentView('newPatient');
            }
          }, '+ Nuevo Paciente')
        ])
      ])
    ])
  );

  const PatientListView = () => (
    React.createElement('div', { className: 'space-y-6' }, [
      React.createElement('div', {
        key: 'header',
        className: 'flex justify-between items-center'
      }, [
        React.createElement('h1', {
          key: 'title',
          className: 'text-3xl font-bold text-slate-800'
        }, 'Lista de Pacientes'),
        React.createElement('button', {
          key: 'back-btn',
          className: 'bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700',
          onClick: () => setCurrentView('dashboard')
        }, 'Volver al Dashboard')
      ]),
      
      React.createElement('div', {
        key: 'patients',
        className: 'grid gap-4'
      }, patients.map((patient, index) => 
        React.createElement('div', {
          key: patient.id,
          className: 'bg-white p-6 rounded-lg shadow-md'
        }, [
          React.createElement('h3', {
            key: 'name',
            className: 'text-xl font-semibold text-slate-800'
          }, `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`),
          React.createElement('p', {
            key: 'phone',
            className: 'text-slate-600'
          }, `Tel: ${patient.personalInfo.phone}`),
          React.createElement('p', {
            key: 'records',
            className: 'text-slate-600'
          }, `Historias clínicas: ${patient.records.length}`)
        ])
      ))
    ])
  );

  const NewPatientView = () => {
    const [formData, setFormData] = React.useState({
      firstName: '',
      lastName: '',
      phone: '',
      reasonForVisit: '',
      diagnosis: ''
    });

    const handleInputChange = (field, value) => {
      setFormData(prevData => ({
        ...prevData,
        [field]: value
      }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      console.log('Submitting form with data:', formData);
      
      if (!formData.firstName || !formData.lastName || !formData.phone) {
        alert('Por favor completa todos los campos obligatorios');
        return;
      }
      
      const newPatient = {
        id: Date.now().toString(),
        personalInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: '',
          phone: formData.phone,
          email: '',
          address: ''
        },
        records: [{
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          reasonForVisit: formData.reasonForVisit,
          diagnosis: formData.diagnosis,
          treatmentPlan: 'Plan de tratamiento a definir'
        }]
      };
      
      setPatients(prevPatients => [...prevPatients, newPatient]);
      alert('Paciente creado exitosamente!');
      setCurrentView('patientList');
    };

    return React.createElement('div', { className: 'max-w-4xl mx-auto space-y-6' }, [
      React.createElement('div', {
        key: 'header',
        className: 'flex justify-between items-center'
      }, [
        React.createElement('h1', {
          key: 'title',
          className: 'text-3xl font-bold text-slate-800'
        }, 'Nuevo Paciente'),
        React.createElement('button', {
          key: 'back-btn',
          className: 'bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition-colors',
          onClick: () => setCurrentView('dashboard')
        }, 'Volver')
      ]),
      
      React.createElement('div', {
        key: 'form-container',
        className: 'bg-white p-8 rounded-lg shadow-md'
      }, [
        React.createElement('h2', {
          key: 'form-title',
          className: 'text-xl font-semibold text-slate-800 mb-6'
        }, 'Información del Paciente'),
        
        React.createElement('form', {
          key: 'form',
          className: 'space-y-6',
          onSubmit: handleSubmit
        }, [
          // Nombre
          React.createElement('div', { key: 'firstName-group', className: 'space-y-2' }, [
            React.createElement('label', {
              key: 'firstName-label',
              className: 'block text-sm font-medium text-slate-700',
              htmlFor: 'firstName'
            }, 'Nombre *'),
            React.createElement('input', {
              key: 'firstName-input',
              id: 'firstName',
              type: 'text',
              required: true,
              placeholder: 'Ingrese el nombre',
              className: 'w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              value: formData.firstName,
              onChange: (e) => handleInputChange('firstName', e.target.value)
            })
          ]),
          
          // Apellido
          React.createElement('div', { key: 'lastName-group', className: 'space-y-2' }, [
            React.createElement('label', {
              key: 'lastName-label',
              className: 'block text-sm font-medium text-slate-700',
              htmlFor: 'lastName'
            }, 'Apellido *'),
            React.createElement('input', {
              key: 'lastName-input',
              id: 'lastName',
              type: 'text',
              required: true,
              placeholder: 'Ingrese el apellido',
              className: 'w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              value: formData.lastName,
              onChange: (e) => handleInputChange('lastName', e.target.value)
            })
          ]),
          
          // Teléfono
          React.createElement('div', { key: 'phone-group', className: 'space-y-2' }, [
            React.createElement('label', {
              key: 'phone-label',
              className: 'block text-sm font-medium text-slate-700',
              htmlFor: 'phone'
            }, 'Teléfono *'),
            React.createElement('input', {
              key: 'phone-input',
              id: 'phone',
              type: 'tel',
              required: true,
              placeholder: 'Ej: 555-0123',
              className: 'w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              value: formData.phone,
              onChange: (e) => handleInputChange('phone', e.target.value)
            })
          ]),
          
          // Motivo de consulta
          React.createElement('div', { key: 'reason-group', className: 'space-y-2' }, [
            React.createElement('label', {
              key: 'reason-label',
              className: 'block text-sm font-medium text-slate-700',
              htmlFor: 'reasonForVisit'
            }, 'Motivo de consulta'),
            React.createElement('textarea', {
              key: 'reason-input',
              id: 'reasonForVisit',
              rows: 3,
              placeholder: 'Describa el motivo de la consulta',
              className: 'w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical',
              value: formData.reasonForVisit,
              onChange: (e) => handleInputChange('reasonForVisit', e.target.value)
            })
          ]),
          
          // Diagnóstico
          React.createElement('div', { key: 'diagnosis-group', className: 'space-y-2' }, [
            React.createElement('label', {
              key: 'diagnosis-label',
              className: 'block text-sm font-medium text-slate-700',
              htmlFor: 'diagnosis'
            }, 'Diagnóstico preliminar'),
            React.createElement('input', {
              key: 'diagnosis-input',
              id: 'diagnosis',
              type: 'text',
              placeholder: 'Ingrese el diagnóstico preliminar',
              className: 'w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              value: formData.diagnosis,
              onChange: (e) => handleInputChange('diagnosis', e.target.value)
            })
          ]),
          
          // Botones
          React.createElement('div', { key: 'buttons', className: 'flex gap-4 pt-4' }, [
            React.createElement('button', {
              key: 'cancel',
              type: 'button',
              className: 'flex-1 bg-slate-500 text-white px-6 py-3 rounded-md hover:bg-slate-600 transition-colors',
              onClick: () => setCurrentView('dashboard')
            }, 'Cancelar'),
            React.createElement('button', {
              key: 'submit',
              type: 'submit',
              className: 'flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium',
            }, 'Guardar Paciente')
          ])
        ])
      ])
    ]);
  };

  // Navegación
  const Navigation = () => (
    React.createElement('nav', {
      className: 'bg-white shadow-md mb-6'
    }, React.createElement('div', {
      className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
    }, React.createElement('div', {
      className: 'flex justify-between h-16'
    }, [
      React.createElement('div', {
        key: 'logo',
        className: 'flex items-center'
      }, React.createElement('h1', {
        className: 'text-xl font-bold text-slate-800'
      }, 'Clinical Records AI')),
      
      React.createElement('div', {
        key: 'nav-buttons',
        className: 'flex items-center space-x-4'
      }, [
        React.createElement('button', {
          key: 'dashboard-btn',
          className: `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            currentView === 'dashboard' 
              ? 'bg-blue-600 text-white' 
              : 'text-slate-600 hover:text-slate-800'
          }`,
          onClick: () => setCurrentView('dashboard')
        }, 'Dashboard'),
        
        React.createElement('button', {
          key: 'patients-btn',
          className: `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            currentView === 'patientList' 
              ? 'bg-blue-600 text-white' 
              : 'text-slate-600 hover:text-slate-800'
          }`,
          onClick: () => setCurrentView('patientList')
        }, 'Pacientes'),
        
        React.createElement('button', {
          key: 'new-btn',
          className: `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentView === 'newPatient' 
              ? 'bg-green-600 text-white' 
              : 'bg-green-500 text-white hover:bg-green-600'
          }`,
          onClick: () => {
            console.log('Nuevo Paciente button clicked'); // Debug log
            setCurrentView('newPatient');
          }
        }, '+ Nuevo Paciente')
      ])
    ])))
  );

  // Renderizar vista actual
  const renderCurrentView = () => {
    console.log('Current view:', currentView); // Debug log
    
    switch (currentView) {
      case 'dashboard':
        return DashboardView();
      case 'patientList':
        return PatientListView();
      case 'newPatient':
        console.log('Rendering NewPatientView'); // Debug log
        return NewPatientView();
      default:
        console.log('Rendering default dashboard'); // Debug log
        return DashboardView();
    }
  };

  return React.createElement('div', {
    className: 'min-h-screen bg-slate-50'
  }, [
    React.createElement(Navigation, { key: 'nav' }),
    React.createElement('main', {
      key: 'main',
      className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'
    }, renderCurrentView())
  ]);
}

// Montar la aplicación
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(React.createElement(App));
}