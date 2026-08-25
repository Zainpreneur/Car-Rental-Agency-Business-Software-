export type Role = "ADMIN" | "STAFF" | "CUSTOMER";

export type VehicleCategory =
  | "ECONOMY"
  | "COMPACT"
  | "SEDAN"
  | "SUV"
  | "LUXURY"
  | "VAN"
  | "TRUCK"
  | "CONVERTIBLE";

export type VehicleStatus = "AVAILABLE" | "RENTED" | "MAINTENANCE" | "RETIRED";
export type Transmission = "AUTOMATIC" | "MANUAL";
export type FuelType = "PETROL" | "DIESEL" | "HYBRID" | "ELECTRIC";

export type BookingStatus = "PENDING" | "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type PaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER" | "ONLINE";
export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED" | "FAILED";
export type MaintenanceType = "SERVICE" | "REPAIR" | "INSPECTION" | "CLEANING" | "TIRE_CHANGE" | "OTHER";
export type MaintenanceStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  address?: string | null;
  licenseNumber?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  category: VehicleCategory;
  licensePlate: string;
  color?: string | null;
  seats: number;
  transmission: Transmission;
  fuelType: FuelType;
  dailyRate: number;
  mileage: number;
  status: VehicleStatus;
  imageUrl?: string | null;
  description?: string | null;
  features?: string | null;
  createdAt: string;
}

export interface BookingCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  customer?: BookingCustomer;
  vehicleId: string;
  vehicle?: Vehicle;
  startDate: string;
  endDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  status: BookingStatus;
  dailyRate: number;
  totalAmount: number;
  notes?: string | null;
  actualPickupAt?: string | null;
  actualReturnAt?: string | null;
  createdAt: string;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  bookingId: string;
  booking?: Booking;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  type: MaintenanceType;
  description: string;
  cost: number;
  startDate: string;
  endDate?: string | null;
  status: MaintenanceStatus;
  createdAt: string;
}

export interface DashboardStats {
  fleet: {
    total: number;
    available: number;
    rented: number;
    maintenance: number;
    utilization: number;
    byCategory: { category: string; count: number }[];
  };
  bookings: {
    active: number;
    pending: number;
    upcomingReturns: Booking[];
    recent: Booking[];
  };
  customers: { total: number };
  revenue: { monthly: number };
}
