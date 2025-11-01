
import React, { createContext, useReducer, useContext, useEffect, ReactNode } from 'react';
import { AppState, Action, Patient, ClinicalRecord, Prescription } from '../types.ts';

const initialState: AppState = {
  patients: [],
  records: [],
  prescriptions: [],
};

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'ADD_PATIENT_AND_RECORD': {
      const { patient, record } = action.payload;
      const patientExists = state.patients.some(p => p.id === patient.id);
      return {
        ...state,
        patients: patientExists ? state.patients : [...state.patients, patient],
        records: [...state.records, record],
      };
    }
    case 'ADD_PRESCRIPTION':
      return {
        ...state,
        prescriptions: [...state.prescriptions, action.payload],
      };
    case 'SET_STATE':
      return action.payload;
    default:
      return state;
  }
};

const PatientContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

export const PatientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    try {
      const storedState = localStorage.getItem('clinicalRecordsState');
      if (storedState) {
        dispatch({ type: 'SET_STATE', payload: JSON.parse(storedState) });
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('clinicalRecordsState', JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [state]);

  return (
    <PatientContext.Provider value={{ state, dispatch }}>
      {children}
    </PatientContext.Provider>
  );
};

export const usePatients = () => {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
};
