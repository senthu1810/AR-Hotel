import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Mail, Phone, MapPin, Star } from 'lucide-react';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { bookingsServices, roomsServices } from '../../lib/firebaseServices';

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  visits: number;
  totalSpent: number;
  lastVisit: string;
  history: any[];
}

export function GuestManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingRes, roomRes] = await Promise.all([
        bookingsServices.getBookings(),
        roomsServices.getRooms()
      ]);

      if (bookingRes.success && roomRes.success) {
        processGuests(bookingRes.data || [], roomRes.data || []);
      } else {
        console.error("Failed to load data", bookingRes.error, roomRes.error);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching guest data:", error);
      setLoading(false);
    }
  };

  const processGuests = (bookings: any[], rooms: any[]) => {
    try {
      const guestMap = new Map();

      // Sort bookings by date (newest first) to get latest info
      // Check for valid dates
      const sortedBookings = [...bookings].sort((a, b) => {
        const dateA = a.checkIn ? new Date(a.checkIn).getTime() : 0;
        const dateB = b.checkIn ? new Date(b.checkIn).getTime() : 0;
        return dateB - dateA;
      });

      sortedBookings.forEach(booking => {
        // Normalize email as key. If no email, maybe use guest name + phone?
        // Fallback to guest name if email is missing to show something
        const email = booking.email?.toLowerCase();
        const guestIdKey = email || `${booking.guest}-${booking.phone}`;

        if (!guestIdKey) return;

        if (!guestMap.has(guestIdKey)) {
          // First time seeing this guest (most recent booking due to sort)
          // Schema uses 'guest' for name
          const guestName = booking.guest || booking.guestName || 'Unknown Guest';

          guestMap.set(guestIdKey, {
            id: booking.id,
            name: guestName,
            email: booking.email || 'No Email',
            phone: booking.phone || 'N/A',
            location: 'N/A',
            visits: 0,
            totalSpent: 0,
            lastVisit: booking.checkOut || null,
            history: []
          });
        }

        const guest = guestMap.get(guestIdKey);
        guest.visits += 1;
        // Handle string/number amount
        const amount = Number(booking.amount) || Number(booking.totalAmount) || 0;
        guest.totalSpent += amount;

        // Find room name
        // Schema: booking.room is roomNumber (string like "203")
        // Room schema: roomNumber, type
        const roomIdentifier = booking.room || booking.roomNumber || booking.roomId;
        const room = rooms.find(r => r.id === roomIdentifier || r.roomNumber === roomIdentifier);
        const roomName = room ? `Room ${room.roomNumber} - ${room.type}` : `Room ${roomIdentifier || '??'}`;

        guest.history.push({
          id: booking.id,
          roomName: roomName,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          amount: amount,
          status: booking.status
        });
      });

      const guestList = Array.from(guestMap.values());
      setGuests(guestList);
      if (guestList.length > 0) {
        setSelectedGuest(guestList[0]);
      }
    } catch (e) {
      console.error("Error processing guests", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredGuests = guests.filter(guest =>
    (guest.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (guest.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString();
  };

  if (loading) {
    return <div className="p-8 flex justify-center text-slate-500">Loading guests...</div>;
  }

  if (guests.length === 0) {
    return <div className="p-8 flex justify-center text-slate-500">No guests found from booking history.</div>;
  }

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Guest List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search guests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Card className="max-h-[calc(100vh-220px)] overflow-y-auto">
            <CardHeader>
              <CardTitle>Guest Directory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredGuests.map((guest, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedGuest(guest)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${selectedGuest?.id === guest.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {getInitials(guest.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium truncate">{guest.name}</div>
                      </div>
                      <div className="text-sm text-slate-600 truncate">{guest.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-slate-500">{guest.visits} visits</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Guest Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedGuest && (
            <motion.div
              key={selectedGuest.id} // Changed to ID to be safe
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xl">
                          {getInitials(selectedGuest.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-2xl font-bold">{selectedGuest.name}</h2>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="details">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-6 mt-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-semibold mb-3">Contact Information</h3>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Mail className="w-4 h-4" />
                              <span>{selectedGuest.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <Phone className="w-4 h-4" />
                              <span>{selectedGuest.phone}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">Guest Statistics</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-slate-600">Total Visits:</span>
                              <span className="font-medium">{selectedGuest.visits}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Total Spent:</span>
                              <span className="font-medium">${selectedGuest.totalSpent.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Last Visit:</span>
                              <span className="font-medium">{formatDate(selectedGuest.lastVisit)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="history" className="space-y-4 mt-6">
                      <div className="space-y-3">
                        {selectedGuest.history.map((stay: any, idx: number) => (
                          <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-medium">Stay #{selectedGuest.visits - idx}</div>
                                <div className="text-sm text-slate-600">{stay.roomName}</div>
                              </div>
                              <Badge variant={stay.status === 'checked-out' ? 'secondary' : 'default'}>
                                {stay.status || 'Completed'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                              <span>Check-in: {formatDate(stay.checkIn)}</span>
                              <span>Check-out: {formatDate(stay.checkOut)}</span>
                              <span>Amount: ${stay.amount}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}