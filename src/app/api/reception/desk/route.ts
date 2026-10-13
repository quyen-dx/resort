import { NextResponse } from 'next/server';
import { receptionService } from '@/server/services/reception.service';

export async function GET() {
  const bookings = await receptionService.getDeskBookings();

  // If local database has not been seeded, return dynamic sample data for instant demonstration
  if (bookings.length === 0) {
    const today = new Date().toISOString().split('T')[0];
    const twoDaysLater = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

    const sampleDeskData = [
      {
        id: 'sample-book-01',
        bookingCode: 'AN-202610-8A3F',
        customerName: 'Nguyễn Thanh Hằng',
        customerPhone: '0903 123 456',
        customerEmail: 'hang.nguyen@gmail.com',
        checkInDate: today,
        checkOutDate: twoDaysLater,
        numberOfRooms: 1,
        totalNights: 2,
        amountDue: 13000000,
        amountPaid: 0,
        balance: 13000000,
        status: 'CONFIRMED',
        roomType: {
          id: 'rt-villa-ocean',
          code: 'VILLA_OCEAN',
          name: 'Beachfront Pool Villa',
          physicalRooms: [
            { id: 'rm-v01', roomNumber: 'V-01', status: 'AVAILABLE' },
            { id: 'rm-v02', roomNumber: 'V-02', status: 'AVAILABLE' },
            { id: 'rm-v03', roomNumber: 'V-03', status: 'AVAILABLE' },
          ],
        },
        assignedRoom: null,
        payments: [],
      },
      {
        id: 'sample-book-02',
        bookingCode: 'AN-202610-5C9B',
        customerName: 'Trần Quốc Bảo',
        customerPhone: '0918 789 012',
        customerEmail: 'bao.tran@yahoo.com',
        checkInDate: today,
        checkOutDate: twoDaysLater,
        numberOfRooms: 1,
        totalNights: 2,
        amountDue: 6400000,
        amountPaid: 3200000,
        balance: 3200000,
        status: 'CHECKED_IN',
        roomType: {
          id: 'rt-deluxe-ocean',
          code: 'DELUXE_OCEAN',
          name: 'Ocean View Deluxe',
          physicalRooms: [
            { id: 'rm-101', roomNumber: '101', status: 'OCCUPIED' },
            { id: 'rm-102', roomNumber: '102', status: 'AVAILABLE' },
          ],
        },
        assignedRoom: { id: 'rm-101', roomNumber: '101' },
        payments: [
          {
            id: 'pay-01',
            receiptNumber: 'RCT-202610-101',
            amount: 3200000,
            method: 'COUNTER_TRANSFER',
            createdAt: new Date().toISOString(),
            actor: { fullName: 'Trần Thị Lễ Tân' },
          },
        ],
      },
    ];

    return NextResponse.json({
      success: true,
      data: sampleDeskData,
    });
  }

  return NextResponse.json({
    success: true,
    data: bookings,
  });
}
