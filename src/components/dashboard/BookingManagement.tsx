import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Plus,
  Filter,
  Calendar,
  User,
  Bed,
  DollarSign,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { bookingsServices, roomsServices } from '../../lib/firebaseServices';
import { useToast } from '../../hooks/use-toast';

interface Booking {
  id: string;
  guest: string;
  email: string;
  phone: string;
  room: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  amount: number;
  status: 'confirmed' | 'pending' | 'checked-in' | 'checked-out' | 'cancelled';
  guests?: number;
}

const statusColors = {
  confirmed: 'bg-blue-100 text-blue-800',
  pending: 'bg-yellow-100 text-yellow-800',
  'checked-in': 'bg-green-100 text-green-800',
  'checked-out': 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function BookingManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [availableRooms, setAvailableRooms] = useState<{ roomNumber: string; price: number }[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBookingData, setNewBookingData] = useState({
    guestName: '',
    email: '',
    phone: '',
    roomNumber: '',
    guests: 1,
    amount: 0,
  });
  const { toast } = useToast();

  // Load bookings from Firebase
  useEffect(() => {
    loadBookings();
  }, []);

  // Auto-calculate total amount
  useEffect(() => {
    if (newBookingData.roomNumber && checkInDate && checkOutDate && availableRooms.length > 0) {
      const room = availableRooms.find(r => r.roomNumber === newBookingData.roomNumber);
      if (room) {
        const nights = calculateNights(checkInDate, checkOutDate);
        if (nights > 0) {
          const total = nights * room.price;
          setNewBookingData(prev => ({ ...prev, amount: total }));
        }
      }
    }
  }, [newBookingData.roomNumber, checkInDate, checkOutDate, availableRooms]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const result = await bookingsServices.getBookings();
      if (result.success && result.data) {
        setBookings(result.data as Booking[]);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to load bookings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load bookings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);



  // Get available rooms based on room type and dates
  const getAvailableRooms = async (roomType: string, checkIn: string, checkOut: string, excludeBookingId?: string) => {
    if (!roomType || !checkIn || !checkOut) return [];

    try {
      // Get all rooms from Firebase
      const roomsResult = await roomsServices.getRooms();
      if (!roomsResult.success || !roomsResult.data) return [];

      const allRooms = roomsResult.data;

      // Filter by room type (normalize names for comparison)
      const normalizeType = (type: string) => type.toLowerCase().replace(/\s+/g, '');
      const roomsByType = allRooms.filter(
        (room: any) => normalizeType(room.type) === normalizeType(roomType)
      );

      // Get occupied room numbers for the date range
      const occupiedRooms = bookings
        .filter((booking) => {
          // If editing, exclude the current booking from occupied check
          if (excludeBookingId && booking.id === excludeBookingId) return false;

          // Check if booking dates overlap with selected dates
          const bookingCheckIn = new Date(booking.checkIn);
          const bookingCheckOut = new Date(booking.checkOut);
          const selectedCheckIn = new Date(checkIn);
          const selectedCheckOut = new Date(checkOut);

          return (
            booking.status !== 'cancelled' &&
            booking.status !== 'checked-out' &&
            ((selectedCheckIn >= bookingCheckIn && selectedCheckIn < bookingCheckOut) ||
              (selectedCheckOut > bookingCheckIn && selectedCheckOut <= bookingCheckOut) ||
              (selectedCheckIn <= bookingCheckIn && selectedCheckOut >= bookingCheckOut))
          );
        })
        .map((booking) => booking.room);

      // Return available rooms (only active rooms not under maintenance)
      return roomsByType
        .filter((room: any) =>
          room.isActive === true &&
          room.status !== 'maintenance' &&
          !occupiedRooms.includes(room.roomNumber)
        )
        .map((room: any) => ({
          roomNumber: room.roomNumber,
          price: room.perNightCost || room.pricePerNight || room.price || 0
        }));
    } catch (error) {
      console.error('Error getting available rooms:', error);
      return [];
    }
  };

  // Update available rooms when room type or dates change
  const handleRoomTypeChange = async (value: string) => {
    setSelectedRoomType(value);
    if (value && checkInDate && checkOutDate) {
      const rooms = await getAvailableRooms(value, checkInDate, checkOutDate, editingBookingId || undefined);
      setAvailableRooms(rooms);
    }
  };

  const handleCheckInChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setCheckInDate(e.target.value);
    if (selectedRoomType && e.target.value && checkOutDate) {
      const rooms = await getAvailableRooms(selectedRoomType, e.target.value, checkOutDate, editingBookingId || undefined);
      setAvailableRooms(rooms);
    }
  };

  const handleCheckOutChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setCheckOutDate(e.target.value);
    if (selectedRoomType && checkInDate && e.target.value) {
      const rooms = await getAvailableRooms(selectedRoomType, checkInDate, e.target.value, editingBookingId || undefined);
      setAvailableRooms(rooms);
    }
  };

  // Calculate number of nights
  const calculateNights = (checkIn: string, checkOut: string): number => {
    if (!checkIn || !checkOut) return 0;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    if (diffTime <= 0) return 0;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleEditBooking = async (booking: Booking) => {
    setNewBookingData({
      guestName: booking.guest,
      email: booking.email,
      phone: booking.phone,
      roomNumber: booking.room,
      guests: booking.guests || 1,
      amount: booking.amount,
    });
    setSelectedRoomType(booking.roomType);
    setCheckInDate(booking.checkIn);
    setCheckOutDate(booking.checkOut);
    setEditingBookingId(booking.id);

    // Fetch available rooms including the one currently assigned to this booking
    const rooms = await getAvailableRooms(booking.roomType, booking.checkIn, booking.checkOut, booking.id);
    setAvailableRooms(rooms);

    setSelectedBooking(null);
    setIsNewBookingOpen(true);
  };

  // Handle create/update booking
  const handleCreateBooking = async () => {
    // Validation
    if (!newBookingData.guestName || !newBookingData.email || !newBookingData.phone ||
      !selectedRoomType || !checkInDate || !checkOutDate || !newBookingData.roomNumber) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const nights = calculateNights(checkInDate, checkOutDate);

    const bookingData = {
      guest: newBookingData.guestName,
      email: newBookingData.email,
      phone: newBookingData.phone,
      room: newBookingData.roomNumber,
      roomType: selectedRoomType,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights: nights,
      amount: newBookingData.amount,
      guests: newBookingData.guests,
      status: 'confirmed',
    };

    try {
      if (editingBookingId) {
        // Update existing booking
        const result = await bookingsServices.updateBooking(editingBookingId, bookingData);
        if (result.success) {
          // Note: Ideally we should update room statuses if room changed.
          // For simplicity in this step, we'll assume the room management logic 
          // might need a separate pass or backend trigger, but we will ensure
          // the new room is marked occupied in the next block.

          // Update room to occupied (in case it changed)
          const allRooms = await roomsServices.getRooms();
          if (allRooms.success && allRooms.data) {
            const room = allRooms.data.find((r: any) => r.roomNumber === newBookingData.roomNumber);
            if (room) {
              await roomsServices.updateRoom(room.id, {
                status: 'occupied',
                currentGuest: newBookingData.guestName,
                checkInDate: checkInDate,
                checkOutDate: checkOutDate,
              });
            }
          }

          toast({ title: 'Success', description: 'Booking updated successfully' });
        } else {
          toast({ title: 'Error', description: result.error || 'Failed to update booking', variant: 'destructive' });
          return;
        }
      } else {
        // Create new booking
        const result = await bookingsServices.addBooking(bookingData);
        if (result.success) {
          // Update room status
          const allRooms = await roomsServices.getRooms();
          if (allRooms.success && allRooms.data) {
            const room = allRooms.data.find((r: any) => r.roomNumber === newBookingData.roomNumber);
            if (room) {
              await roomsServices.updateRoom(room.id, {
                status: 'occupied',
                currentGuest: newBookingData.guestName,
                checkInDate: checkInDate,
                checkOutDate: checkOutDate,
              });
            }
          }
          toast({ title: 'Success', description: 'Booking created successfully' });
        } else {
          toast({ title: 'Error', description: result.error || 'Failed to create booking', variant: 'destructive' });
          return;
        }
      }

      // Reset and Cleanup
      setIsNewBookingOpen(false);
      setEditingBookingId(null);
      setNewBookingData({
        guestName: '',
        email: '',
        phone: '',
        roomNumber: '',
        guests: 1,
        amount: 0,
      });
      setSelectedRoomType('');
      setCheckInDate('');
      setCheckOutDate('');
      setAvailableRooms([]);
      loadBookings();

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save booking',
        variant: 'destructive',
      });
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      const result = await bookingsServices.updateBooking(bookingId, { status: newStatus });
      if (result.success) {
        toast({ title: 'Success', description: `Booking marked as ${newStatus}` });

        // If checking in/out, we might want to update room status too?
        // For now, just reloading bookings to reflect status change in UI
        loadBookings();
      } else {
        toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An error occurred', variant: 'destructive' });
    }
  };

  // ... (existing code)

  // In the Dialog Trigger or reset
  // Note: We need to ensure we reset editing state if user cancels
  const filteredBookings = bookings.filter(booking =>
    booking.guest.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.room.includes(searchTerm)
  );

  // Calculate stats from actual bookings
  const today = new Date().toISOString().split('T')[0];
  const totalBookings = bookings.length;
  const checkInsToday = bookings.filter(b => b.checkIn === today).length;
  const checkOutsToday = bookings.filter(b => b.checkOut === today).length;
  const revenueToday = bookings
    .filter(b => b.checkIn === today)
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="p-8 space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Dialog open={isNewBookingOpen} onOpenChange={(open) => {
            setIsNewBookingOpen(open);
            if (!open) {
              setEditingBookingId(null);
              setNewBookingData({
                guestName: '',
                email: '',
                phone: '',
                roomNumber: '',
                guests: 1,
                amount: 0,
              });
              setSelectedRoomType('');
              setCheckInDate('');
              setCheckOutDate('');
              setAvailableRooms([]);
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingBookingId(null)}>
                <Plus className="w-4 h-4 mr-2" />
                New Booking
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingBookingId ? 'Edit Booking' : 'Create New Booking'}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="guest-name">Guest Name</Label>
                  <Input
                    id="guest-name"
                    placeholder="Enter guest name"
                    value={newBookingData.guestName}
                    onChange={(e) => setNewBookingData({ ...newBookingData, guestName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="guest@email.com"
                    value={newBookingData.email}
                    onChange={(e) => setNewBookingData({ ...newBookingData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+1 234 567 890"
                    value={newBookingData.phone}
                    onChange={(e) => setNewBookingData({ ...newBookingData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room-type">Room Type</Label>
                  <Select
                    onValueChange={handleRoomTypeChange}
                    value={selectedRoomType}
                  >
                    <SelectTrigger id="room-type">
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Standard">Standard Room</SelectItem>
                      <SelectItem value="Deluxe">Deluxe Suite</SelectItem>
                      <SelectItem value="Suite">Suite</SelectItem>
                      <SelectItem value="Executive">Executive Room</SelectItem>
                      <SelectItem value="Presidential">Presidential Suite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="check-in">Check-in Date</Label>
                  <Input
                    id="check-in"
                    type="date"
                    value={checkInDate}
                    onChange={handleCheckInChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="check-out">Check-out Date</Label>
                  <Input
                    id="check-out"
                    type="date"
                    value={checkOutDate}
                    onChange={handleCheckOutChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guests">Number of Guests</Label>
                  <Input
                    id="guests"
                    type="number"
                    value={newBookingData.guests}
                    onChange={(e) => setNewBookingData({ ...newBookingData, guests: parseInt(e.target.value) || 1 })}
                  />
                </div>
                {availableRooms.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="room-number">Room Number</Label>
                    <Select
                      onValueChange={(value) => setNewBookingData({ ...newBookingData, roomNumber: value })}
                      value={newBookingData.roomNumber}
                    >
                      <SelectTrigger id="room-number">
                        <SelectValue placeholder="Select available room" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRooms.map((room) => (
                          <SelectItem key={room.roomNumber} value={room.roomNumber}>
                            Room {room.roomNumber} (${room.price}/night)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="amount">Total Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={newBookingData.amount}
                    onChange={(e) => setNewBookingData({ ...newBookingData, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsNewBookingOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateBooking}>
                  {editingBookingId ? 'Update Booking' : 'Create Booking'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: totalBookings.toString(), icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Check-ins Today', value: checkInsToday.toString(), icon: User, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Check-outs Today', value: checkOutsToday.toString(), icon: Bed, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Revenue Today', value: `$${revenueToday.toLocaleString()}`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                  </div>
                  <div className={`${stat.bg} p-3 rounded-lg`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Bookings Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>All Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading bookings...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No bookings found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Nights</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.guest}</div>
                          <div className="text-sm text-slate-600">{booking.roomType}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-600">{booking.email}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-600">{booking.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{booking.room}</TableCell>
                      <TableCell>{booking.checkIn}</TableCell>
                      <TableCell>{booking.checkOut}</TableCell>
                      <TableCell>{booking.nights}</TableCell>
                      <TableCell>${booking.amount}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[booking.status]}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          View
                        </Button>
                        {booking.status === 'confirmed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(booking.id, 'checked-in');
                            }}
                          >
                            Check In
                          </Button>
                        )}
                        {booking.status === 'checked-in' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(booking.id, 'checked-out');
                            }}
                          >
                            Check Out
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* View Booking Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details - {selectedBooking?.id}</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Guest Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>{selectedBooking.guest}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{selectedBooking.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{selectedBooking.phone}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Room Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Room Number:</span>
                      <span className="font-medium">{selectedBooking.room}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Room Type:</span>
                      <span className="font-medium">{selectedBooking.roomType}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Booking Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Check-in:</span>
                    <span className="font-medium">{selectedBooking.checkIn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Check-out:</span>
                    <span className="font-medium">{selectedBooking.checkOut}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Nights:</span>
                    <span className="font-medium">{selectedBooking.nights}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Amount:</span>
                    <span className="font-medium">${selectedBooking.amount}</span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span className="text-slate-600">Status:</span>
                    <Badge className={statusColors[selectedBooking.status]}>
                      {selectedBooking.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedBooking(null)}>
                  Close
                </Button>
                <Button onClick={() => selectedBooking && handleEditBooking(selectedBooking)}>Edit Booking</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div >
  );
}