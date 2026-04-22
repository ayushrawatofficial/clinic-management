export interface PatientVisit {
  id?: string;
  patientId: string;
  visitDate: any;
  services: any[];
  products?: any[];
}