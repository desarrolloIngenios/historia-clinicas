
export interface Patient {
  id: string;
  name: string;
  birthDate: string;
}

export interface ClinicalRecord {
  id: string;
  patientId: string;
  createdAt: string;
  reasonForVisit: string;
  history: string;
  physicalExam: string;
  diagnosis: string;
  analysis: string;
  managementPlan: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  createdAt: string;
  medications: string;
  indications: string;
}

export type AppState = {
  patients: Patient[];
  records: ClinicalRecord[];
  prescriptions: Prescription[];
};

export type Action =
  | { type: 'ADD_PATIENT_AND_RECORD'; payload: { patient: Patient; record: ClinicalRecord } }
  | { type: 'ADD_PRESCRIPTION'; payload: Prescription }
  | { type: 'SET_STATE'; payload: AppState };
