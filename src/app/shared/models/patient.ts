export interface Patient {
  id?: string;
  patientCode: string;
  name: string;
  age: number;
  gender: string;
  mobile: string;
  concerns: string;
  referredBy: string;
  createdAt: any;
}