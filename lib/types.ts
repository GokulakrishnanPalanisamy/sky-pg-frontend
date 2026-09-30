/* ------------------------------------------------------------------ */
/* Persisted entities — these mirror what a backend API would return. */
/* ------------------------------------------------------------------ */

export type Bed = {
  id: string;
  bedNumber: number;
};

export type Room = {
  id: string;
  roomNumber: string;
  beds: Bed[];
  createdAt: string;
  updatedAt: string;
};

export type TenantStatus = "active" | "notice";

export type Tenant = {
  id: string;
  name: string;
  phone: string;
  address: string;
  occupation: string;
  workOrStudentIn: string;
  email: string;
  aadhar: string;
  roomId: string;
  bedId: string;
  /** Calendar date, `YYYY-MM-DD`. */
  nextPaymentDate: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
};

export type PgData = {
  rooms: Room[];
  tenants: Tenant[];
};

/* ------------------------------------------------------------------ */
/* Derived view models — computed from entities, never persisted.      */
/* ------------------------------------------------------------------ */

export type PaymentStatus = "paid" | "due_soon" | "overdue";

export type Payment = {
  dueDate: string;
  status: PaymentStatus;
  /** Negative when overdue. */
  daysUntilDue: number;
};

export type BedStatus = "available" | "occupied";

export type BedOccupancy = Bed & {
  roomId: string;
  status: BedStatus;
  tenant?: Tenant;
  payment?: Payment;
};

export type RoomOccupancy = {
  room: Room;
  beds: BedOccupancy[];
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  /** 0–100, rounded. */
  occupancyRate: number;
};

export type TenantAssignment = {
  tenant: Tenant;
  room?: Room;
  bed?: Bed;
  payment: Payment;
};

export type DashboardStats = {
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  totalTenants: number;
  paymentsDueSoon: number;
  paymentsOverdue: number;
};

/* ------------------------------------------------------------------ */
/* Inputs and results for data operations.                             */
/* ------------------------------------------------------------------ */

export type RoomInput = {
  roomNumber: string;
  bedCount: number;
};

export type TenantInput = {
  name: string;
  phone: string;
  address: string;
  occupation: string;
  workOrStudentIn: string;
  email: string;
  aadhar: string;
  roomId: string;
  bedId: string;
  nextPaymentDate: string;
};

export type ActionResult = { ok: true } | { ok: false; error: string };
