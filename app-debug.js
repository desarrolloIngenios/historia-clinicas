import React from 'react';
import ReactDOM from 'react-dom/client';

console.log('app-debug.js iniciando');

// Componente muy simple para verificar funcionalidad
function SimpleApp() {
  const [view, setView] = React.useState('home');
  const [patients, setPatients] = React.useState([]);
  
  console.log('SimpleApp renderizando, view:', view);

  if (view === 'form') {
    return React.createElement('div', {
      className: 'min-h-screen bg-slate-50 p-8'
    }, [
      React.createElement('div', {
        key: 'header',
        className: 'mb-6'
      }, [
        React.createElement('button', {
          key: 'back',
          className: 'bg-gray-500 text-white px-4 py-2 rounded mb-4',
          onClick: () => setView('home')
        }, '← Volver'),
        React.createElement('h1', {
          key: 'title',
          className: 'text-2xl font-bold text-slate-800'
        }, 'Formulario de Nuevo Paciente')
      ]),
      
      React.createElement('div', {
        key: 'form-container',
        className: 'bg-white p-6 rounded shadow'
      }, [
        React.createElement('div', {
          key: 'name-field',
          className: 'mb-4'
        }, [
          React.createElement('label', {
            key: 'name-label',
            className: 'block text-sm font-medium mb-2'
          }, 'Nombre:'),
          React.createElement('input', {
            key: 'name-input',
            type: 'text',
            className: 'w-full p-2 border rounded',
            placeholder: 'Ingrese el nombre'
          })
        ]),
        
        React.createElement('div', {
          key: 'phone-field',
          className: 'mb-4'
        }, [
          React.createElement('label', {
            key: 'phone-label',
            className: 'block text-sm font-medium mb-2'
          }, 'Teléfono:'),
          React.createElement('input', {
            key: 'phone-input',
            type: 'tel',
            className: 'w-full p-2 border rounded',
            placeholder: 'Ingrese el teléfono'
          })
        ]),
        
        React.createElement('button', {
          key: 'save-btn',
          className: 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600',
          onClick: () => {
            alert('Paciente guardado (demo)');
            setView('home');
          }
        }, 'Guardar Paciente')
      ])
    ]);
  }

  // Vista principal
  return React.createElement('div', {
    className: 'min-h-screen bg-slate-50 p-8'
  }, [
    React.createElement('h1', {
      key: 'title',
      className: 'text-3xl font-bold text-slate-800 mb-6'
    }, 'Sistema de Historias Clínicas'),
    
    React.createElement('div', {
      key: 'actions',
      className: 'space-y-4'
    }, [
      React.createElement('button', {
        key: 'new-patient',
        className: 'bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 text-lg',
        onClick: () => {
          console.log('Botón nuevo paciente clickeado');
          setView('form');
        }
      }, '+ Nuevo Paciente'),
      
      React.createElement('div', {
        key: 'info',
        className: 'bg-white p-4 rounded shadow'
      }, [
        React.createElement('h2', {
          key: 'info-title',
          className: 'text-xl font-semibold mb-2'
        }, 'Estado del Sistema'),
        React.createElement('p', {
          key: 'info-text',
          className: 'text-gray-600'
        }, `Pacientes registrados: ${patients.length}`)
      ])
    ])
  ]);
}

// Renderizar la aplicación
try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    console.log('Renderizando SimpleApp en root');
    const root = ReactDOM.createRoot(rootElement);
    root.render(React.createElement(SimpleApp));
  } else {
    console.error('No se encontró el elemento root');
  }
} catch (error) {
  console.error('Error renderizando SimpleApp:', error);
}