import { addDays, todayKey } from "@/lib/dates";
import { createId } from "@/lib/id";
import type { PgData, Room, Tenant, TenantStatus } from "@/lib/types";

/**
 * Fictional demo data for the client pitch. Emails use example.com and the
 * Aadhaar numbers start with 0, which real Aadhaar numbers never do.
 */
const DEMO_ROOMS: { roomNumber: string; beds: number }[] = [
  { roomNumber: "101", beds: 4 },
  { roomNumber: "102", beds: 4 },
  { roomNumber: "201", beds: 4 },
  { roomNumber: "202", beds: 4 },
  { roomNumber: "301", beds: 4 },
  { roomNumber: "302", beds: 4 },
];

type DemoTenant = {
  name: string;
  phone: string;
  address: string;
  occupation: string;
  workOrStudentIn: string;
  roomNumber: string;
  bedNumber: number;
  /** Days from today until the next rent payment. */
  dueInDays: number;
  status?: TenantStatus;
};

const DEMO_TENANTS: DemoTenant[] = [
  {
    name: "John Doe",
    phone: "9876543210",
    address: "12 Lake View Road, Kochi",
    occupation: "Software Engineer",
    workOrStudentIn: "Northwind Labs, Tidel Park",
    roomNumber: "101",
    bedNumber: 2,
    dueInDays: 12,
  },
  {
    name: "Priya Sharma",
    phone: "9123456780",
    address: "45 Green Park, Jaipur",
    occupation: "UX Designer",
    workOrStudentIn: "Contoso Studio, OMR",
    roomNumber: "101",
    bedNumber: 3,
    dueInDays: 17,
  },
  {
    name: "Rahul Kumar",
    phone: "9988776655",
    address: "8 Station Street, Patna",
    occupation: "Student",
    workOrStudentIn: "City Institute of Technology",
    roomNumber: "201",
    bedNumber: 1,
    dueInDays: 3,
  },
  {
    name: "Sneha Reddy",
    phone: "9012345678",
    address: "221 Hill Colony, Hyderabad",
    occupation: "Data Analyst",
    workOrStudentIn: "Fabrikam Analytics, Guindy",
    roomNumber: "201",
    bedNumber: 2,
    dueInDays: -2,
  },
  {
    name: "Amit Verma",
    phone: "9900112233",
    address: "17 Mall Road, Lucknow",
    occupation: "Sales Executive",
    workOrStudentIn: "Tailspin Retail, T. Nagar",
    roomNumber: "201",
    bedNumber: 3,
    dueInDays: 22,
    status: "notice",
  },
  {
    name: "Kavya Nair",
    phone: "9988665544",
    address: "3 Temple Lane, Thrissur",
    occupation: "Medical Student",
    workOrStudentIn: "Riverside Medical College",
    roomNumber: "301",
    bedNumber: 1,
    dueInDays: 14,
  },
];

export function createDemoData(): PgData {
  const now = new Date().toISOString();
  const today = todayKey();

  const rooms: Room[] = DEMO_ROOMS.map((demo) => ({
    id: createId(),
    roomNumber: demo.roomNumber,
    beds: Array.from({ length: demo.beds }, (_, index) => ({
      id: createId(),
      bedNumber: index + 1,
    })),
    createdAt: now,
    updatedAt: now,
  }));

  const tenants: Tenant[] = DEMO_TENANTS.map((demo, index) => {
    const room = rooms.find((item) => item.roomNumber === demo.roomNumber)!;
    const bed = room.beds.find((item) => item.bedNumber === demo.bedNumber)!;
    const handle = demo.name.toLowerCase().replace(/[^a-z]+/g, ".");
    return {
      id: createId(),
      name: demo.name,
      phone: demo.phone,
      address: demo.address,
      occupation: demo.occupation,
      workOrStudentIn: demo.workOrStudentIn,
      email: `${handle}@example.com`,
      aadhar: `0000-0000-${String(1001 + index).padStart(4, "0")}`,
      roomId: room.id,
      bedId: bed.id,
      nextPaymentDate: addDays(today, demo.dueInDays),
      status: demo.status ?? "active",
      createdAt: now,
      updatedAt: now,
    };
  });

  return { rooms, tenants };
}
