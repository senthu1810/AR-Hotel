import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  LogOut,
  Hotel,
  Wrench,
  ShoppingCart,
  ChevronLeft,
  DoorOpen,
  TrendingUp,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { DashboardHome } from './dashboard/DashboardHome';
import { BookingManagement } from './dashboard/BookingManagement';
import { GuestManagement } from './dashboard/GuestManagement';
import { RoomsManagement } from './dashboard/RoomsManagement';
import { HousekeepingManagement } from './dashboard/HousekeepingManagement';
import { MaintenanceManagement } from './dashboard/MaintenanceManagement';
import { POSManagement } from './dashboard/POSManagement';
import { RevenueManagement } from './dashboard/RevenueManagement';
import { SettingsManagement } from './dashboard/SettingsManagement';

type DashboardView = 'home' | 'bookings' | 'guests' | 'rooms' | 'housekeeping' | 'maintenance' | 'pos' | 'revenue' | 'settings';



export function Dashboard({ onBackToLanding }: { onBackToLanding: () => void }) {
  const [activeView, setActiveView] = useState<DashboardView>('home');
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
  const [allowedPages, setAllowedPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { authServices, settingsServices } = await import('../lib/firebaseServices');
        const user = authServices.getCurrentUser();

        if (user) {
          // 1. Get User Profile for Name, Role & Permissions
          const profileRes = await settingsServices.getUserProfile(user.uid);
          if (profileRes.success && profileRes.data) {
            setCurrentUser({
              name: profileRes.data.name,
              role: profileRes.data.role
            });

            // 2. Get User's Permissions & Page Settings
            const userRole = profileRes.data.role;
            const userPermissions = profileRes.data.permissions; // User-specific permissions

            // Get Page Settings to check globally enabled pages
            const pageRes = await settingsServices.getPageSettings();
            console.log("Dashboard: Page Settings Response", pageRes);
            // Default to all enabled if no settings found
            const pageSettings = pageRes.success && pageRes.data ? pageRes.data.pages : [];
            console.log("Dashboard: Parsed Page Settings", pageSettings);

            // 3. Filter allowed pages
            // Page is allowed if: (It's enabled globally) AND (User has permission OR User is Admin)
            const allowed = menuItems.map(item => item.id).filter(pageId => {
              if (pageId === 'home') return true; // Always allow dashboard home

              const pageSetting = pageSettings?.find((p: any) => p.id === pageId);
              const isGloballyEnabled = pageSetting ? pageSetting.enabled : true; // Default to true if setting missing

              console.log(`Checking page ${pageId}: Global=${isGloballyEnabled}, Role=${userRole}`);

              if (!isGloballyEnabled) return false;

              if (userRole === 'Admin') return true; // Admin sees all enabled pages

              // Use user-specific permissions if available
              if (userPermissions && typeof userPermissions === 'object') {
                return userPermissions[pageId] === true;
              }

              // Fallback: if no user permissions, deny access (except for Admin handled above)
              return false;
            });

            console.log("Allowed Pages:", allowed);
            setAllowedPages(allowed);
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);



  const menuItems = [
    { id: 'home' as DashboardView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings' as DashboardView, label: 'Bookings', icon: Calendar },
    { id: 'guests' as DashboardView, label: 'Guests', icon: Users },
    { id: 'rooms' as DashboardView, label: 'Rooms', icon: DoorOpen },
    { id: 'housekeeping' as DashboardView, label: 'Housekeeping', icon: Hotel },
    { id: 'maintenance' as DashboardView, label: 'Maintenance', icon: Wrench },
    { id: 'pos' as DashboardView, label: 'Point of Sale', icon: ShoppingCart },
    { id: 'revenue' as DashboardView, label: 'Revenue', icon: TrendingUp },
    { id: 'settings' as DashboardView, label: 'Settings', icon: Settings },
  ];

  // Filter menu items based on allowed pages
  const visibleMenuItems = menuItems.filter(item =>
    loading || allowedPages.includes(item.id) || item.id === 'home'
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 280 }}
        className="bg-slate-900 text-white flex flex-col relative"
      >
        {/* Logo */}
        <div className="p-6 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            animate={{ opacity: sidebarCollapsed ? 0 : 1 }}
          >
            <Hotel className="w-8 h-8" />
            {!sidebarCollapsed && (
              <span className="font-['Playfair_Display'] text-xl font-bold">AR Hotels</span>
            )}
          </motion.div>
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-20 bg-slate-900 border border-slate-700 rounded-full p-1 hover:bg-slate-800 transition-colors z-10"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          {visibleMenuItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-2 transition-colors ${activeView === item.id
                ? 'bg-white text-slate-900'
                : 'text-slate-300 hover:bg-slate-800'
                }`}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </motion.button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-800">
          <motion.button
            onClick={onBackToLanding}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-['Playfair_Display'] font-bold text-slate-900">
              {menuItems.find((item) => item.id === activeView)?.label}
            </h1>
            <p className="text-sm text-slate-600">
              {loading ? 'Loading...' : `Welcome back, ${currentUser?.name || 'User'}`}
            </p>
          </div>

        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {activeView === 'home' && <DashboardHome />}
              {activeView === 'bookings' && <BookingManagement />}
              {activeView === 'guests' && <GuestManagement />}
              {activeView === 'rooms' && <RoomsManagement />}
              {activeView === 'housekeeping' && <HousekeepingManagement />}
              {activeView === 'maintenance' && <MaintenanceManagement />}
              {activeView === 'pos' && <POSManagement />}
              {activeView === 'revenue' && <RevenueManagement />}
              {activeView === 'settings' && <SettingsManagement />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}