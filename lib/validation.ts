import { digitsOnly } from "@/lib/aadhar";
import { isValidDateKey } from "@/lib/dates";

export type FieldErrors = Record<string, string>;

export const MAX_BEDS_PER_ROOM = 20;

export type RoomFormValues = {
  roomNumber: string;
  bedCount: string;
};

export type TenantFormValues = {
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRoomForm(values: RoomFormValues): FieldErrors {
  const errors: FieldErrors = {};
  const roomNumber = values.roomNumber.trim();
  const bedCount = Number(values.bedCount);

  if (!roomNumber) {
    errors.roomNumber = "Room number is required.";
  } else if (roomNumber.length > 12) {
    errors.roomNumber = "Keep the room number under 12 characters.";
  }

  if (!values.bedCount.trim()) {
    errors.bedCount = "Number of beds is required.";
  } else if (!Number.isInteger(bedCount) || bedCount < 1) {
    errors.bedCount = "Enter at least 1 bed.";
  } else if (bedCount > MAX_BEDS_PER_ROOM) {
    errors.bedCount = `A room can have at most ${MAX_BEDS_PER_ROOM} beds.`;
  }

  return errors;
}

export function validateTenantForm(values: TenantFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.name.trim()) {
    errors.name = "Tenant name is required.";
  }

  const phone = digitsOnly(values.phone);
  if (!phone) {
    errors.phone = "Phone number is required.";
  } else if (phone.length !== 10) {
    errors.phone = "Enter a 10-digit phone number.";
  }

  if (!values.address.trim()) {
    errors.address = "Address is required.";
  }

  if (!values.occupation.trim()) {
    errors.occupation = "Occupation is required.";
  }

  if (!values.workOrStudentIn.trim()) {
    errors.workOrStudentIn = "Work / study location is required.";
  }

  if (!values.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  const aadhar = digitsOnly(values.aadhar);
  if (!aadhar) {
    errors.aadhar = "Aadhaar number is required.";
  } else if (aadhar.length !== 12) {
    errors.aadhar = "Enter a 12-digit Aadhaar number.";
  }

  if (!values.roomId) {
    errors.roomId = "Select a room.";
  }

  if (!values.bedId) {
    errors.bedId = "Select an available bed.";
  }

  if (!values.nextPaymentDate) {
    errors.nextPaymentDate = "Next payment date is required.";
  } else if (!isValidDateKey(values.nextPaymentDate)) {
    errors.nextPaymentDate = "Enter a valid date.";
  }

  return errors;
}
