import { digitsOnly } from "@/lib/aadhar";

export type FieldErrors = Record<string, string>;

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
  bedNumber: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRoomForm(values: RoomFormValues): FieldErrors {
  const errors: FieldErrors = {};
  const roomNumber = values.roomNumber.trim();
  const bedCount = Number(values.bedCount);

  if (!roomNumber) {
    errors.roomNumber = "Room number is required.";
  }

  if (!values.bedCount.trim()) {
    errors.bedCount = "Number of beds is required.";
  } else if (!Number.isInteger(bedCount) || bedCount < 1) {
    errors.bedCount = "Enter at least 1 bed.";
  } else if (bedCount > 50) {
    errors.bedCount = "Bed count cannot exceed 50.";
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
    errors.workOrStudentIn = "Work / student location is required.";
  }

  if (!values.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  const aadhar = digitsOnly(values.aadhar);
  if (!aadhar) {
    errors.aadhar = "Aadhar number is required.";
  } else if (aadhar.length !== 12) {
    errors.aadhar = "Enter a 12-digit Aadhar number.";
  }

  if (!values.roomId) {
    errors.roomId = "Select a room.";
  }

  if (!values.bedNumber) {
    errors.bedNumber = "Select a bed.";
  }

  return errors;
}
