import { motion } from 'motion/react';
import {
  Users,
  DollarSign,
  Bed,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useEffect, useState } from 'react';
import { roomsServices, bookingsServices } from '../../lib/firebaseServices';

export function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    {
      title: 'Total Revenue',
      value: '$0',
      change: '+0%',
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Occupancy Rate',
      value: '0%',
      change: '+0%',
      icon: Bed,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Active Guests',
      value: '0',
      change: '+0',
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Avg. Daily Rate',
      value: '$0',
      change: '+0%',
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ]);

  const [occupancyData, setOccupancyData] = useState<any[]>([]);
  const [roomStatusData, setRoomStatusData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [roomsRes, bookingsRes] = await Promise.all([
        roomsServices.getRooms(),
        bookingsServices.getBookings()
      ]);

      if (roomsRes.success && bookingsRes.success) {
        const rooms = roomsRes.data || [];
        const bookings = bookingsRes.data || [];

        calculateStats(rooms, bookings);
        calculateCharts(rooms, bookings);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (rooms: any[], bookings: any[]) => {
    // 1. Total Revenue
    const totalRevenue = bookings.reduce((sum, booking) => sum + (Number(booking.amount) || Number(booking.totalAmount) || 0), 0);

    // 2. Occupancy Rate
    const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
    const totalRooms = rooms.length;
    const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : '0';

    // 3. Active Guests (Guests currently checked in)
    // Assuming 'checked-in' status or filtering by date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeBookings = bookings.filter(b => {
      // Check if status is checked-in OR if checkIn <= today <= checkOut
      if (b.status === 'checked-in') return true;
      // Fallback to date check if status not reliable
      const start = new Date(b.checkIn);
      const end = new Date(b.checkOut);
      return start <= today && today <= end;
    });
    const activeGuests = activeBookings.reduce((sum, b) => sum + (Number(b.guests) || 1), 0);

    // 4. Avg Daily Rate (Revenue / Total Bookings)
    // Or Average Price per Night across all bookings
    const adr = bookings.length > 0 ? (totalRevenue / bookings.length).toFixed(2) : '0';

    setStats([
      {
        title: 'Total Revenue',
        value: `$${totalRevenue.toLocaleString()}`,
        change: '+0%', // Placeholder for now - would need historical data
        icon: DollarSign,
        color: 'text-green-600',
        bg: 'bg-green-50',
      },
      {
        title: 'Occupancy Rate',
        value: `${occupancyRate}%`,
        change: '+0%',
        icon: Bed,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
      },
      {
        title: 'Active Guests',
        value: activeGuests.toString(),
        change: '+0',
        icon: Users,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
      },
      {
        title: 'Avg. Daily Rate',
        value: `$${adr}`,
        change: '+0%',
        icon: TrendingUp,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
      },
    ]);
  };

  const calculateCharts = (rooms: any[], bookings: any[]) => {
    // 1. Room Status Pie Chart
    const statusCounts = {
      occupied: 0,
      clean: 0,
      dirty: 0,
      maintenance: 0
    };

    rooms.forEach(room => {
      const status = room.status?.toLowerCase() || 'clean';
      if (status === 'occupied') statusCounts.occupied++;
      else if (status === 'dirty' || status === 'cleanup') statusCounts.dirty++;
      else if (status === 'maintenance') statusCounts.maintenance++;
      else statusCounts.clean++; // Default to clean/available
    });

    const newRoomStatusData = [
      { name: 'Occupied', value: statusCounts.occupied, color: '#22c55e' }, // green
      { name: 'Clean', value: statusCounts.clean, color: '#3b82f6' }, // blue
      { name: 'Dirty', value: statusCounts.dirty, color: '#f59e0b' }, // amber
      { name: 'Maintenance', value: statusCounts.maintenance, color: '#ef4444' }, // red
    ].filter(item => item.value >= 0); // Allow 0 to show empty slice if needed, or filter > 0

    setRoomStatusData(newRoomStatusData);

    // 2. Weekly Occupancy Bar Chart
    // Last 7 days
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = [];

    // Create map of active bookings by date
    // This is O(N*7) which is fine for dashboard

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      d.setHours(0, 0, 0, 0);

      // Find occupancy for this day
      let occupiedCount = 0;
      bookings.forEach(b => {
        const start = new Date(b.checkIn);
        const end = new Date(b.checkOut);
        // Normalize times
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        // A booking counts if date is >= start AND date < end (for overnight stay logic)
        // If check-in and check-out same day (day use), usually >= start and <= end?
        // Let's stick to standard d >= start && d < end.
        // If start == end, then maybe allow d == start.
        if (start.getTime() === end.getTime()) {
          if (d.getTime() === start.getTime()) occupiedCount++;
        } else {
          if (d >= start && d < end) {
            occupiedCount++;
          }
        }
      });

      // Calculate percentage
      const totalRooms = rooms.length || 1;
      const rate = Math.round((occupiedCount / totalRooms) * 100);

      weeklyData.push({
        day: dayName,
        rate: rate
      });
    }

    setOccupancyData(weeklyData);
  };

  if (loading) {
    return <div className="p-8 flex justify-center text-slate-500">Loading dashboard...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">{stat.title}</p>
                    <h3 className="text-3xl font-bold mb-2">{stat.value}</h3>
                    <p className="text-sm text-green-600">{stat.change}</p>
                  </div>
                  <div className={`${stat.bg} p-3 rounded-lg`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Weekly Occupancy</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={occupancyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  />
                  <Bar dataKey="rate" fill="#22c55e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Room Status */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Room Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center mb-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={roomStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {roomStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {roomStatusData.map((status, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                      <span className="text-sm text-slate-600">{status.name}</span>
                    </div>
                    <span className="text-sm font-semibold">{status.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}