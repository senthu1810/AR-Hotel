import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { bookingsServices, posServices, roomsServices } from '../../lib/firebaseServices';

export function RevenueManagement() {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);

  // State for real data
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<any[]>([]);
  const [dailyRevenueData, setDailyRevenueData] = useState<any[]>([]);
  // Use a stats object to hold the calculated metrics
  const [financeStats, setFinanceStats] = useState({
    yearlyRevenue: 0,
    adr: 0,
    revpar: 0,
    occupancyRate: 0,
    revenueChange: 0
  });

  useEffect(() => {
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    try {
      setLoading(true);

      // Fetch all data
      const [bookingsResult, ordersResult, roomsResult] = await Promise.all([
        bookingsServices.getBookings(),
        posServices.getOrders(1000), // Get all orders
        roomsServices.getRooms()
      ]);

      let roomsData: any[] = [];
      let bookingsData: any[] = [];
      let ordersData: any[] = [];

      // Process rooms data
      if (roomsResult.success && roomsResult.data) {
        roomsData = roomsResult.data;
      }

      // Process bookings data
      if (bookingsResult.success && bookingsResult.data) {
        bookingsData = bookingsResult.data;
      }

      // Process orders data
      if (ordersResult.success && ordersResult.data) {
        ordersData = ordersResult.data;
      }

      // 1. Calculate Revenue Arrays
      const monthlyData = processMonthlyRevenue(bookingsData, ordersData);
      const dailyData = processDailyRevenue(bookingsData, ordersData);

      setMonthlyRevenueData(monthlyData);
      setDailyRevenueData(dailyData);

      // 2. Calculate Summary Metrics
      const stats = calculateMetrics(bookingsData, roomsData, monthlyData);
      setFinanceStats(stats);

    } catch (error) {
      console.error('Error loading revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyRevenue = (bookings: any[], orders: any[]) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    const monthlyRevenue = monthNames.map((month, index) => ({
      month,
      revenue: 0,
      rooms: 0,
      pos: 0
    }));

    // Rooms Revenue
    bookings.forEach((booking: any) => {
      const checkInDate = new Date(booking.checkIn);
      const amount = Number(booking.amount) || Number(booking.totalAmount) || 0;

      if (checkInDate.getFullYear() === currentYear) {
        const monthIndex = checkInDate.getMonth();
        if (monthlyRevenue[monthIndex]) {
          monthlyRevenue[monthIndex].rooms += amount;
          monthlyRevenue[monthIndex].revenue += amount;
        }
      }
    });

    // POS Revenue
    orders.forEach((order: any) => {
      if (order.createdAt) {
        let orderDate;
        if (order.createdAt.toDate) {
          orderDate = order.createdAt.toDate();
        } else {
          orderDate = new Date(order.createdAt);
        }

        if (orderDate.getFullYear() === currentYear) {
          const monthIndex = orderDate.getMonth();
          if (monthlyRevenue[monthIndex]) {
            const total = Number(order.total) || 0;
            monthlyRevenue[monthIndex].pos += total;
            monthlyRevenue[monthIndex].revenue += total;
          }
        }
      }
    });

    return monthlyRevenue;
  };

  const processDailyRevenue = (bookings: any[], orders: any[]) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const last7Days = [];

    // Map for O(1) lookup: dateString -> { room: 0, pos: 0 }
    const revenueMap = new Map<string, { room: number, pos: number, dayName: string }>();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toDateString();
      revenueMap.set(dateKey, {
        room: 0,
        pos: 0,
        dayName: dayNames[date.getDay()]
      });
    }

    // Bookings
    bookings.forEach((booking: any) => {
      const checkIn = new Date(booking.checkIn);
      checkIn.setHours(0, 0, 0, 0);
      const key = checkIn.toDateString();
      if (revenueMap.has(key)) {
        const amount = Number(booking.amount) || Number(booking.totalAmount) || 0;
        revenueMap.get(key)!.room += amount;
      }
    });

    // Orders
    orders.forEach((order: any) => {
      if (order.createdAt) {
        let orderDate;
        if (order.createdAt.toDate) {
          orderDate = order.createdAt.toDate();
        } else {
          orderDate = new Date(order.createdAt);
        }
        orderDate.setHours(0, 0, 0, 0);
        const key = orderDate.toDateString();

        if (revenueMap.has(key)) {
          const total = Number(order.total) || 0;
          revenueMap.get(key)!.pos += total;
        }
      }
    });

    // Convert Map to Array
    // Iterate 0 to 6 to keep order
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const key = date.toDateString();
      const data = revenueMap.get(key);
      if (data) {
        last7Days.push({
          day: data.dayName,
          roomRevenue: data.room,
          posRevenue: data.pos
        });
      }
    }

    return last7Days;
  };

  const calculateMetrics = (bookings: any[], rooms: any[], monthlyData: any[]) => {
    // 1. Total Revenue (Yearly)
    const yearlyRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);

    // 2. Revenue Change (vs last month)
    const currentMonth = new Date().getMonth();
    const currentMonthRev = monthlyData[currentMonth]?.revenue || 0;
    const prevMonthRev = monthlyData[currentMonth - 1]?.revenue || 0;
    const change = prevMonthRev > 0
      ? ((currentMonthRev - prevMonthRev) / prevMonthRev) * 100
      : (currentMonthRev > 0 ? 100 : 0);

    // 3. Occupancy Rate (Current Snapshot)
    const totalRooms = rooms.length || 1;
    const occupiedRooms = rooms.filter((r: any) => r.status?.toLowerCase() === 'occupied').length;
    const occupancyRate = (occupiedRooms / totalRooms) * 100;

    // 4. ADR (Average Daily Rate)
    // Method: Total Room Revenue / Total Room Nights Sold
    // Since we don't have exact nights for all historical bookings easily normalized to "this year",
    // let's calculate based on ALL fetched bookings (as an approximation of lifetime or recent ADR)
    // OR use the current month's performance.
    // Let's use ALL bookings for a stable "Average" if selectedPeriod is default.

    let totalRevenueForAdr = 0;
    let totalNightsForAdr = 0;

    bookings.forEach((b: any) => {
      const amt = Number(b.amount) || Number(b.totalAmount) || 0;
      let nights = Number(b.nights) || 0;
      if (nights === 0 && b.checkIn && b.checkOut) {
        const start = new Date(b.checkIn).getTime();
        const end = new Date(b.checkOut).getTime();
        if (!isNaN(start) && !isNaN(end)) {
          const diff = end - start;
          nights = Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)));
        }
      }
      if (nights === 0) nights = 1; // Fallback

      totalRevenueForAdr += amt;
      totalNightsForAdr += nights;
    });

    const adr = totalNightsForAdr > 0 ? totalRevenueForAdr / totalNightsForAdr : 0;

    // 5. RevPAR (Revenue Per Available Room)
    // Formula: ADR * Occupancy Rate
    // Or: Total Revenue / Total Available Rooms
    // Let's use ADR * (OccupancyRate / 100)
    const revpar = adr * (occupancyRate / 100);

    return {
      yearlyRevenue,
      revenueChange: change,
      occupancyRate,
      adr,
      revpar
    };
  };

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 10000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val.toLocaleString()}`;
  };

  const stats = [
    {
      label: 'Total Revenue',
      value: formatCurrency(financeStats.yearlyRevenue),
      subValue: 'This Year',
      change: financeStats.revenueChange,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      label: 'ADR (Avg Daily Rate)',
      value: `$${financeStats.adr.toFixed(2)}`,
      subValue: 'Avg Price per Night',
      change: 0, // Need historical ADR to diff
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      label: 'RevPAR',
      value: `$${financeStats.revpar.toFixed(2)}`,
      subValue: 'Rev Per Available Room',
      change: 0,
      icon: DollarSign,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      label: 'Occupancy Rate',
      value: `${financeStats.occupancyRate.toFixed(1)}%`,
      subValue: 'Current Occupancy',
      change: 0,
      icon: Percent,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: ${entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-slate-600">Loading revenue data...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header with Period Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-['Playfair_Display']">Revenue Analytics</h2>
          <p className="text-slate-600">Track and analyze your hotel's financial performance</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`border-l-4 ${stat.borderColor}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                    <h3 className="text-3xl mb-1">{stat.value}</h3>
                    <p className="text-xs text-slate-500">{stat.subValue}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {stat.change !== 0 && (
                        <>
                          {stat.change >= 0 ? (
                            <ArrowUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArrowDown className="w-4 h-4 text-red-600" />
                          )}
                          <span className={`text-sm ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Math.abs(stat.change).toFixed(1)}%
                          </span>
                          <span className="text-xs text-slate-500">vs last period</span>
                        </>
                      )}
                    </div>
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

      {/* Revenue Trends Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>Monthly revenue performance over the year</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={monthlyRevenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(0) + 'K' : value}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="Total Revenue"
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Daily Revenue Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Daily Revenue Breakdown</CardTitle>
            <CardDescription>Room revenue vs Point of Sale revenue comparison (Last 7 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={dailyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(0) + 'K' : value}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="roomRevenue"
                  fill="#3b82f6"
                  name="Room Revenue"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="posRevenue"
                  fill="#f59e0b"
                  name="POS Revenue"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 mb-1">Total Room Revenue</p>
                  <h3 className="text-2xl text-blue-900">
                    ${monthlyRevenueData.reduce((sum, m) => sum + m.rooms, 0).toLocaleString()}
                  </h3>
                  <p className="text-xs text-blue-600 mt-1">
                    {financeStats.yearlyRevenue > 0 ? Math.round((monthlyRevenueData.reduce((sum, m) => sum + m.rooms, 0) / financeStats.yearlyRevenue) * 100) : 0}% of total revenue
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700 mb-1">Total POS Revenue</p>
                  <h3 className="text-2xl text-orange-900">
                    ${monthlyRevenueData.reduce((sum, m) => sum + m.pos, 0).toLocaleString()}
                  </h3>
                  <p className="text-xs text-orange-600 mt-1">
                    {financeStats.yearlyRevenue > 0 ? Math.round((monthlyRevenueData.reduce((sum, m) => sum + m.pos, 0) / financeStats.yearlyRevenue) * 100) : 0}% of total revenue
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-orange-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 mb-1">Average Monthly Revenue</p>
                  <h3 className="text-2xl text-green-900">
                    ${(financeStats.yearlyRevenue / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </h3>
                  <p className="text-xs text-green-600 mt-1">Based on 12 months</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
