export type BookingStatus =
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface Booking {
  id: string;
  bookingCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  roomTypeId: string;
  roomTypeName: string;
  assignedRoomNumber?: string;
  checkInDate: string;   // YYYY-MM-DD
  checkOutDate: string;  // YYYY-MM-DD
  actualCheckOutDate?: string;
  numberOfRooms: number;
  numberOfGuests: number;
  totalNights: number;
  amountDue: number;     // In VND (integer)
  amountPaid: number;    // In VND (integer)
  balance: number;       // In VND (integer)
  status: BookingStatus;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NightlyRate {
  date: string;
  pricePerNight: number; // Integer VND
  availableCount: number;
}
