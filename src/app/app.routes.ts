import { Routes } from '@angular/router';
import { LoginComponent } from './modules/auth/pages/login/login';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';
import { MainLayout } from './shared/layout/main-layout/main-layout';


export const routes: Routes = [
  { path: '', component: LoginComponent },

  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./modules/dashboard/pages/home/home')
            .then(m => m.HomeComponent)
      },

      {
        path: 'services',
        canActivate: [roleGuard(['admin'])], // 🔥 only admin
        loadComponent: () =>
          import('./modules/services/pages/services/services')
            .then(m => m.ServicesComponent)
      },

      {
        path: 'admin',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./modules/admin/pages/user-management/user-management')
            .then(m => m.UserManagementComponent)
      },

      {
        path: 'patients',
        loadComponent: () =>
          import('./modules/patients/pages/patient-list/patient-list')
            .then(m => m.PatientListComponent)
      },
      

      {
  path: 'patients/:code',
  loadComponent: () =>
    import('./modules/patients/pages/patient-detail/patient-detail')
      .then(m => m.PatientDetailComponent)
},
{
  path: 'products',
  loadComponent: () =>
    import('./modules/products/pages/product-list/product-list')
      .then(m => m.ProductListComponent)
},
{
  path: 'revenue',
  loadComponent: () =>
    import('./modules/revenue/pages/revenue/revenue')
      .then(m => m.RevenueComponent)
},
// {
//   path: 'whatsapp-broadcast',
//   loadComponent: () =>
//     import('./modules/whatsapp/pages/broadcast/broadcast')
//       .then(m => m.WhatsAppBroadcastComponent)
// }
    ]
  }
];