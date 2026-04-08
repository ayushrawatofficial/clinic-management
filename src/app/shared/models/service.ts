export interface Service {
  id?: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  discountType: 'percent' | 'flat';
  discountValue: number;
  finalPrice: number;
  createdAt: any;
}