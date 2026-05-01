import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { Auth } from '@angular/fire/auth';
import { UserService } from '../../../../core/services/user';
import { ServiceService } from '../../../../core/services/service';
import { PatientService } from '../../../../core/services/patient';
import { ProductService } from '../../../../core/services/product';
import { VisitService } from '../../../../core/services/visit';
import { RepairService } from '../../../../core/services/repair';

import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent implements OnInit {

  userName: string = '';
  currentDate: string = '';

  stats = {
    patients: 0,
    services: 0,
    products: 0,
    visits: 0,
    revenue: 0,
    patientsTrend: 0,
    servicesTrend: 0,
    productsTrend: 0,
    revenueTrend: 0,
    repairsInShop: 0,
    repairRevenueMonth: 0,
    repairsOutwardMonth: 0,
    repairsInwardMonth: 0
  };

  recentActivities: any[] = [];

  quickActions = [
    { name: 'Add Patient', route: '/patients', queryParams: { add: 'true' }, icon: '👤', color: '#4F46E5' },
    { name: 'Manage Services', route: '/services', icon: '🧾', color: '#059669' },
    { name: 'Manage Products', route: '/products', icon: '💊', color: '#DC2626' },
    { name: 'Repairing', route: '/repairing', icon: '🔧', color: '#EA580C' },
    { name: 'View Patients', route: '/patients', icon: '📅', color: '#7C3AED' }
  ];

  constructor(
    private router: Router,
    private auth: Auth,
    private userService: UserService,
    private serviceService: ServiceService,
    private patientService: PatientService,
    private productService: ProductService,
    private visitService: VisitService,
    private repairService: RepairService,
    private cdr: ChangeDetectorRef

  ) {}

  async ngOnInit() {
    this.currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const user = this.auth.currentUser;
    if (!user) return;

    const dbUser = await this.userService.getUserByEmail(user.email!);
    this.userName = dbUser?.name || user.displayName || 'User';

    this.loadDashboardData();
  }

  loadDashboardData() {
    combineLatest([
      this.patientService.getPatients(),
      this.serviceService.getServices(),
      this.productService.getProducts(),
      this.visitService.getVisits(),
      this.repairService.getRepairJobs()
    ]).subscribe(([patients, services, products, visits, repairJobs]) => {
      this.stats.patients = patients.length;
      this.stats.services = services.length;
      this.stats.products = products.length;
      this.stats.visits = visits.length;

      // Calculate revenue from visits
      this.stats.revenue = visits.reduce((total, visit) => total + (visit.total || 0), 0);

      // Calculate trends (current month vs last month)
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      // Patients trend
      const currentMonthPatients = patients.filter(p =>
        p.createdAt && new Date(p.createdAt).getMonth() === currentMonth &&
        new Date(p.createdAt).getFullYear() === currentYear
      ).length;

      const lastMonthPatients = patients.filter(p =>
        p.createdAt && new Date(p.createdAt).getMonth() === lastMonth &&
        new Date(p.createdAt).getFullYear() === lastMonthYear
      ).length;

      this.stats.patientsTrend = lastMonthPatients > 0 ?
        ((currentMonthPatients - lastMonthPatients) / lastMonthPatients * 100) : 0;

      // Services trend
      const currentMonthServices = services.filter(s =>
        s.createdAt && new Date(s.createdAt).getMonth() === currentMonth &&
        new Date(s.createdAt).getFullYear() === currentYear
      ).length;

      const lastMonthServices = services.filter(s =>
        s.createdAt && new Date(s.createdAt).getMonth() === lastMonth &&
        new Date(s.createdAt).getFullYear() === lastMonthYear
      ).length;

      this.stats.servicesTrend = lastMonthServices > 0 ?
        ((currentMonthServices - lastMonthServices) / lastMonthServices * 100) : 0;

      // Products trend
      const currentMonthProducts = products.filter(p =>
        p.createdAt && new Date(p.createdAt).getMonth() === currentMonth &&
        new Date(p.createdAt).getFullYear() === currentYear
      ).length;

      const lastMonthProducts = products.filter(p =>
        p.createdAt && new Date(p.createdAt).getMonth() === lastMonth &&
        new Date(p.createdAt).getFullYear() === lastMonthYear
      ).length;

      this.stats.productsTrend = lastMonthProducts > 0 ?
        ((currentMonthProducts - lastMonthProducts) / lastMonthProducts * 100) : 0;

      // Revenue trend (current month vs last month visits)
      const currentMonthRevenue = visits
        .filter(v => v.visitDate &&
          new Date(v.visitDate).getMonth() === currentMonth &&
          new Date(v.visitDate).getFullYear() === currentYear
        )
        .reduce((total, visit) => total + (visit.total || 0), 0);

      const lastMonthRevenue = visits
        .filter(v => v.visitDate &&
          new Date(v.visitDate).getMonth() === lastMonth &&
          new Date(v.visitDate).getFullYear() === lastMonthYear
        )
        .reduce((total, visit) => total + (visit.total || 0), 0);

      this.stats.revenueTrend = lastMonthRevenue > 0 ?
        ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 0;

      const jobs = repairJobs || [];
      this.stats.repairsInShop = jobs.filter((j: any) => j.status === 'inward').length;

      this.stats.repairsInwardMonth = jobs.filter((j: any) => {
        const d = new Date(j.inwardDate || j.createdAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).length;

      this.stats.repairsOutwardMonth = jobs.filter((j: any) => {
        if (!j.outwardDate) return false;
        const d = new Date(j.outwardDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).length;

      this.stats.repairRevenueMonth = jobs
        .filter((j: any) => {
          const d = new Date(j.inwardDate || j.createdAt);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum: number, j: any) => sum + Number(j.total || 0), 0);

      // Collect all recent activities
      const activities: any[] = [];

      // Recent patients
      patients
        .filter(p => p.createdAt)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)
        .forEach(patient => {
          activities.push({
            type: 'patient',
            description: `New patient: ${patient.name}`,
            details: `Mobile: ${patient.mobile}`,
            date: patient.createdAt,
            amount: null,
            icon: '👤',
            timestamp: new Date(patient.createdAt).getTime()
          });
        });

      // Recent services
      services
        .filter(s => s.createdAt)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)
        .forEach(service => {
          activities.push({
            type: 'service',
            description: `New service: ${service.name}`,
            details: `Price: ₹${service.price || service.finalPrice || 0}`,
            date: service.createdAt,
            amount: service.price || service.finalPrice || 0,
            icon: '🧾',
            timestamp: new Date(service.createdAt).getTime()
          });
        });

      // Recent products
      products
        .filter(p => p.createdAt)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)
        .forEach(product => {
          activities.push({
            type: 'product',
            description: `New product: ${product.name}`,
            details: `Price: ₹${product.price || 0}, Stock: ${product.stock || 0}`,
            date: product.createdAt,
            amount: product.price || 0,
            icon: '💊',
            timestamp: new Date(product.createdAt).getTime()
          });
        });

      // Recent visits
      visits
        .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
        .slice(0, 3)
        .forEach(visit => {
          const patient = patients.find(p => p.id === visit.patientId);
          activities.push({
            type: 'visit',
            description: `Visit with ${patient?.name || 'Patient'}`,
            details: `Mobile: ${patient?.mobile || 'N/A'}, Amount: ₹${visit.total || 0}`,
            date: visit.visitDate,
            amount: visit.total || 0,
            icon: '📅',
            timestamp: new Date(visit.visitDate).getTime()
          });
        });

      jobs
        .filter((j: any) => j.createdAt || j.inwardDate)
        .sort((a: any, b: any) =>
          new Date(b.inwardDate || b.createdAt).getTime() - new Date(a.inwardDate || a.createdAt).getTime()
        )
        .slice(0, 3)
        .forEach((job: any) => {
          activities.push({
            type: 'repair',
            description: `Repair ${job.status}: ${job.inwardInvoiceNumber || ''}`,
            details: `${job.model || ''} · ${job.serviceName || ''}`,
            date: job.inwardDate || job.createdAt,
            amount: Number(job.total || 0),
            icon: '🔧',
            timestamp: new Date(job.inwardDate || job.createdAt).getTime()
          });
        });

      // Sort all activities by timestamp and take top 8
      this.recentActivities = activities
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 3);


      this.cdr.detectChanges();
    });
  }

  navigate(route: string, queryParams?: any) {
    if (queryParams) {
      this.router.navigate([route], { queryParams });
    } else {
      this.router.navigate([route]);
    }
  }
}