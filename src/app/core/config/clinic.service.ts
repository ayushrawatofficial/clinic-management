import { Injectable } from '@angular/core';
import { CLINIC_CONFIG } from './clinic.config';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  clinic = CLINIC_CONFIG;
}