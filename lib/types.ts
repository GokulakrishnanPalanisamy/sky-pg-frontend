export type Room = {
  id: string;
  roomNumber: string;
  bedCount: number;
  createdAt: string;
  updatedAt: string;
};

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
  roomNumber: string;
  bedNumber: number;
  createdAt: string;
  updatedAt: string;
};

export type RoomAvailability = {
  room: Room;
  occupiedBeds: number;
  availableBeds: number;
  occupiedBedNumbers: number[];
};

export type DashboardStats = {
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  totalTenants: number;
};

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };
