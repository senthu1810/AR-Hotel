
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Building2,
  Users,

  Shield,
  Globe,
  Save,
  Upload,
  Mail,
  Phone,
  MapPin,
  Clock,
  Plus,
  Edit,
  Trash2,
  Settings as SettingsIcon,
  LayoutDashboard,
  Calendar,
  DoorOpen,
  Hotel,
  Wrench,
  ShoppingCart,
  TrendingUp,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Checkbox } from '../ui/checkbox';
import { settingsServices } from '../../lib/firebaseServices';
import { useToast } from '../../hooks/use-toast';

interface User {
  id: string;
  name: string;
  employeeId: string;
  phone: string;
  email: string;
  address: string;
  role: string;
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  permissions?: {
    dashboard?: boolean;
    bookings?: boolean;
    guests?: boolean;
    rooms?: boolean;
    housekeeping?: boolean;
    maintenance?: boolean;
    pos?: boolean;
    revenue?: boolean;
    settings?: boolean;
  };
}



interface PageSettings {
  id: string;
  name: string;
  icon: any;
  enabled: boolean;
}

export function SettingsManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showUserPassword, setShowUserPassword] = useState(false);

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handleUpdatePassword = async () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }

    if (passwordData.new !== passwordData.confirm) {
      toast({ title: "Error", description: "New passwords do not match", variant: "destructive" });
      return;
    }

    if (passwordData.new.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const { authServices } = await import('../../lib/firebaseServices');
      const res = await authServices.changePassword(passwordData.current, passwordData.new);

      if (res.success) {
        toast({ title: "Success", description: "Password updated successfully" });
        setPasswordData({ current: '', new: '', confirm: '' });
      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      console.error("Password update failed:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update password. Please check your current password.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Hotel Profile Form State
  const [hotelProfile, setHotelProfile] = useState({
    name: 'AR Hotels - Downtown',
    type: 'luxury',
    totalRooms: '100',
    starRating: '5',
    description: 'Experience luxury and comfort at AR Hotels Downtown.',
    email: 'contact@arhotels.com',
    phone: '+1 (555) 123-4567',
    website: 'https://arhotels.com',
    timezone: 'est',
    address: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zip: '10001'
    }
  });



  const [users, setUsers] = useState<User[]>([]);

  const [userFormData, setUserFormData] = useState<Partial<User>>({
    name: '',
    employeeId: '',
    phone: '',
    email: '',
    address: '',
    role: 'Receptionist',
    status: 'active',
  });

  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({
    dashboard: true,
    bookings: true,
    guests: true,
    rooms: true,
    housekeeping: false,
    maintenance: false,
    pos: true,
    revenue: false,
    settings: false,
  });



  const [pageSettings, setPageSettings] = useState<PageSettings[]>([
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, enabled: true },
    { id: 'bookings', name: 'Bookings', icon: Calendar, enabled: true },
    { id: 'guests', name: 'Guests', icon: Users, enabled: true },
    { id: 'rooms', name: 'Rooms', icon: DoorOpen, enabled: true },
    { id: 'housekeeping', name: 'Housekeeping', icon: Hotel, enabled: true },
    { id: 'maintenance', name: 'Maintenance', icon: Wrench, enabled: true },
    { id: 'pos', name: 'Point of Sale', icon: ShoppingCart, enabled: true },
    { id: 'revenue', name: 'Revenue', icon: TrendingUp, enabled: true },
  ]);

  const availableRoles = [
    'Admin',
    'Manager',
    'Receptionist',
    'Restaurant Staff',
    'Cleaner',
    'Maintenance Staff',
    'Spa Staff',
    'Bar Attendant',
  ];

  // Helper function to get default permissions based on role
  const getDefaultPermissions = (role: string): Record<string, boolean> => {
    const permissionsMap: Record<string, Record<string, boolean>> = {
      'Admin': { dashboard: true, bookings: true, guests: true, rooms: true, housekeeping: true, maintenance: true, pos: true, revenue: true, settings: true },
      'Manager': { dashboard: true, bookings: true, guests: true, rooms: true, housekeeping: true, maintenance: true, pos: true, revenue: true, settings: false },
      'Receptionist': { dashboard: true, bookings: true, guests: true, rooms: true, housekeeping: false, maintenance: false, pos: true, revenue: false, settings: false },
      'Restaurant Staff': { dashboard: true, bookings: false, guests: false, rooms: false, housekeeping: false, maintenance: false, pos: true, revenue: false, settings: false },
      'Cleaner': { dashboard: true, bookings: false, guests: false, rooms: false, housekeeping: true, maintenance: false, pos: false, revenue: false, settings: false },
      'Maintenance Staff': { dashboard: true, bookings: false, guests: false, rooms: false, housekeeping: false, maintenance: true, pos: false, revenue: false, settings: false },
      'Spa Staff': { dashboard: true, bookings: false, guests: false, rooms: false, housekeeping: false, maintenance: false, pos: true, revenue: false, settings: false },
      'Bar Attendant': { dashboard: true, bookings: false, guests: false, rooms: false, housekeeping: false, maintenance: false, pos: true, revenue: false, settings: false },
    };

    return permissionsMap[role] || permissionsMap['Receptionist'];
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load Hotel Profile
      const profileRes = await settingsServices.getHotelProfile();
      if (profileRes.success && profileRes.data) {
        setHotelProfile(prev => ({ ...prev, ...profileRes.data }));
        if (profileRes.data.logo) {
          setLogoPreview(profileRes.data.logo);
        }
      }

      // Load Users
      const usersRes = await settingsServices.getUsers();
      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data as User[]);
      }

      // Load Page Settings
      const pageRes = await settingsServices.getPageSettings();
      if (pageRes.success && pageRes.data && pageRes.data.pages) {
        // Merge loaded settings with default structure to preserve icons
        const loadedPages = pageRes.data.pages as { id: string, enabled: boolean }[];
        setPageSettings(prev => prev.map(p => {
          const loaded = loadedPages.find(lp => lp.id === p.id);
          return loaded ? { ...p, enabled: loaded.enabled } : p;
        }));
      }





    } catch (error) {
      console.error("Error loading settings:", error);
      toast({
        title: "Error",
        description: "Failed to load settings. Please try refreshing.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };



  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const profileData = {
        ...hotelProfile,
        logo: logoPreview
      };
      const res = await settingsServices.updateHotelProfile(profileData);
      if (res.success) {
        toast({ title: "Success", description: "Hotel profile updated successfully" });
      } else {
        throw new Error(res.error);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save profile", variant: "destructive" });
    }
  };

  const handleAddUser = async () => {
    try {
      const newUser = {
        name: userFormData.name || '',
        employeeId: userFormData.employeeId || '',
        phone: userFormData.phone || '',
        email: userFormData.email || '',
        address: userFormData.address || '',
        role: userFormData.role || 'Receptionist',
        status: userFormData.status || 'active',
        // NOTE: Password isn't being used here to create Auth user to avoid logging out admin.
        // Ideally we'd send this to a backend function.
      };
      const res = await settingsServices.addUser(newUser);
      if (res.success) {
        toast({ title: "Success", description: "User added successfully" });
        setIsAddUserDialogOpen(false);
        resetUserForm();
        loadData(); // Reload list
      } else {
        throw new Error(res.error);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to add user", variant: "destructive" });
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    try {
      // Update user data with current permissions
      const updateData = {
        ...userFormData,
        permissions: userPermissions
      };
      const res = await settingsServices.updateUser(selectedUser.id, updateData);
      if (res.success) {
        toast({ title: "Success", description: "User updated successfully" });
        setIsEditUserDialogOpen(false);
        setSelectedUser(null);
        resetUserForm();
        loadData();
      } else {
        throw new Error(res.error);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await settingsServices.deleteUser(selectedUser.id);
      if (res.success) {
        toast({ title: "Success", description: "User deleted successfully" });
        setIsDeleteUserDialogOpen(false);
        setSelectedUser(null);
        loadData();
      } else {
        throw new Error(res.error);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    }
  };

  const openEditUserDialog = (user: User) => {
    setSelectedUser(user);
    setUserFormData(user);
    // Initialize permissions from user data or use defaults based on role
    if (user.permissions) {
      setUserPermissions(user.permissions);
    } else {
      setUserPermissions(getDefaultPermissions(user.role || 'Receptionist'));
    }
    setIsEditUserDialogOpen(true);
  };

  const openDeleteUserDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteUserDialogOpen(true);
  };



  const resetUserForm = () => {
    setUserFormData({
      name: '',
      employeeId: '',
      phone: '',
      email: '',
      address: '',
      role: 'Receptionist',
      status: 'active',
    });
    setUserPermissions(getDefaultPermissions('Receptionist'));
  };



  const handlePageToggle = async (pageId: string, enabled: boolean) => {
    // Optimistic update
    const updatedPages = pageSettings.map(page =>
      page.id === pageId
        ? { ...page, enabled }
        : page
    );
    setPageSettings(updatedPages);

    // Persist (save simplified array {id, enabled})
    const simplifiedPages = updatedPages.map(p => ({ id: p.id, enabled: p.enabled }));
    try {
      await settingsServices.updatePageSettings({ pages: simplifiedPages });
    } catch (error) {
      console.error("Failed to save page setting", error);
      toast({ title: "Error", description: "Failed to save page setting", variant: "destructive" });
    }
  };





  const [isApproveUserDialogOpen, setIsApproveUserDialogOpen] = useState(false);
  const [approveFormData, setApproveFormData] = useState({ role: 'Receptionist', employeeId: '' });

  // Filter users
  const activeUsers = users.filter(u => u.status === 'active' || !u.status); // Default to active if undefined
  const pendingUsers = users.filter(u => u.status === 'pending');
  const rejectedUsers = users.filter(u => u.status === 'rejected');

  const handleApproveUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await settingsServices.approveUser(
        selectedUser.id,
        approveFormData.role,
        approveFormData.employeeId,
        userPermissions // Pass the configured permissions
      );
      if (res.success) {
        toast({ title: "Success", description: "User approved successfully" });
        setIsApproveUserDialogOpen(false);
        setSelectedUser(null);
        setApproveFormData({ role: 'Receptionist', employeeId: '' });
        loadData();
      } else {
        throw new Error(res.error);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to approve user", variant: "destructive" });
    }
  };

  const handleRejectUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await settingsServices.rejectUser(selectedUser.id);
      if (res.success) {
        toast({ title: "Success", description: "User rejected/deleted" });
        setIsDeleteUserDialogOpen(false); // Reuse delete dialog or add new one
        setSelectedUser(null);
        loadData();
      } else {
        throw new Error(res.error);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to reject user", variant: "destructive" });
    }
  };

  const openApproveDialog = (user: User) => {
    setSelectedUser(user);
    setApproveFormData({ role: 'Receptionist', employeeId: '' });
    // Initialize permissions based on default Receptionist role
    setUserPermissions(getDefaultPermissions('Receptionist'));
    setIsApproveUserDialogOpen(true);
  };

  // Update permissions when role changes in approve dialog
  useEffect(() => {
    if (isApproveUserDialogOpen && approveFormData.role) {
      setUserPermissions(getDefaultPermissions(approveFormData.role));
    }
  }, [approveFormData.role, isApproveUserDialogOpen]);

  const UserFormFields = ({ isEdit = false }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Employee Name *</Label>
          <Input
            id="name"
            placeholder="John Doe"
            value={userFormData.name}
            onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
            disabled={isEdit} // Read-only in edit mode
            className={isEdit ? "bg-slate-100" : ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="employeeId">Employee ID *</Label>
          <Input
            id="employeeId"
            placeholder="EMP001"
            value={userFormData.employeeId}
            onChange={(e) => setUserFormData({ ...userFormData, employeeId: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            placeholder="+1 555-0000"
            value={userFormData.phone}
            onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
            disabled={isEdit}
            className={isEdit ? "bg-slate-100" : ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="employee@arhotels.com"
            value={userFormData.email}
            onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
            disabled={isEdit}
            className={isEdit ? "bg-slate-100" : ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address *</Label>
        <Textarea
          id="address"
          placeholder="Street Address, City, State, ZIP"
          value={userFormData.address}
          onChange={(e) => setUserFormData({ ...userFormData, address: e.target.value })}
          rows={3}
          disabled={isEdit}
          className={isEdit ? "bg-slate-100" : ""}
        />
      </div>

      {!isEdit && (
        <div className="space-y-2">
          <Label htmlFor="user-password">Password *</Label>
          <div className="relative">
            <Input
              id="user-password"
              type={showUserPassword ? 'text' : 'password'}
              placeholder="Enter password"
            />
            <button
              type="button"
              onClick={() => setShowUserPassword(!showUserPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Password will be stored, but user account must be created manually in Firebase Auth to prevent admin logout.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Select value={userFormData.role} onValueChange={(value) => setUserFormData({ ...userFormData, role: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map(role => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select value={userFormData.status} onValueChange={(value: 'active' | 'inactive') => setUserFormData({ ...userFormData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  // Permissions configurator component
  const PermissionsConfigurator = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Page Access Permissions</Label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {pageSettings.map((page) => (
          <div key={page.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
            <div className="flex items-center gap-2">
              <page.icon className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium">{page.name}</span>
            </div>
            <Switch
              checked={userPermissions[page.id] || false}
              onCheckedChange={(checked) => setUserPermissions({ ...userPermissions, [page.id]: checked })}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="flex flex-row w-full justify-start overflow-x-auto bg-transparent p-0 border-b rounded-none h-auto">
            <TabsTrigger
              value="profile"
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Team Members</span>
              {pendingUsers.length > 0 && (
                <Badge variant="destructive" className="ml-2 px-1 py-0 h-5 text-xs">
                  {pendingUsers.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="pages"
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Page Management</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Hotel Profile */}
          <TabsContent value="profile" className="space-y-6">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Hotel Profile</CardTitle>
                  <CardDescription>Manage your hotel information and contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo Upload */}
                  <div>
                    <Label>Hotel Logo</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center overflow-hidden">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Hotel Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-10 h-10 text-white" />
                        )}
                      </div>
                      <div>
                        <input
                          type="file"
                          id="logo-upload"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('logo-upload')?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Logo
                        </Button>
                        <p className="text-xs text-slate-500 mt-2">Recommended: 200x200px, PNG or JPG (Stored as Base64)</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hotel-name">Hotel Name</Label>
                      <Input
                        id="hotel-name"
                        value={hotelProfile.name}
                        onChange={(e) => setHotelProfile({ ...hotelProfile, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hotel-type">Hotel Type</Label>
                      <Select
                        value={hotelProfile.type}
                        onValueChange={(val) => setHotelProfile({ ...hotelProfile, type: val })}
                      >
                        <SelectTrigger id="hotel-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="budget">Budget</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="luxury">Luxury</SelectItem>
                          <SelectItem value="resort">Resort</SelectItem>
                          <SelectItem value="boutique">Boutique</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total-rooms">Total Rooms</Label>
                      <Input
                        id="total-rooms"
                        type="number"
                        value={hotelProfile.totalRooms}
                        onChange={(e) => setHotelProfile({ ...hotelProfile, totalRooms: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="star-rating">Star Rating</Label>
                      <Select
                        value={hotelProfile.starRating}
                        onValueChange={(val) => setHotelProfile({ ...hotelProfile, starRating: val })}
                      >
                        <SelectTrigger id="star-rating">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 Stars</SelectItem>
                          <SelectItem value="4">4 Stars</SelectItem>
                          <SelectItem value="5">5 Stars</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contact-email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <Input
                            id="contact-email"
                            type="email"
                            className="pl-10"
                            value={hotelProfile.email}
                            onChange={(e) => setHotelProfile({ ...hotelProfile, email: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-phone">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <Input
                            id="contact-phone"
                            className="pl-10"
                            value={hotelProfile.phone}
                            onChange={(e) => setHotelProfile({ ...hotelProfile, phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <Input
                            id="website"
                            className="pl-10"
                            value={hotelProfile.website}
                            onChange={(e) => setHotelProfile({ ...hotelProfile, website: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <Select
                            value={hotelProfile.timezone}
                            onValueChange={(val) => setHotelProfile({ ...hotelProfile, timezone: val })}
                          >
                            <SelectTrigger id="timezone" className="pl-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                              <SelectItem value="mst">Mountain Time (MST)</SelectItem>
                              <SelectItem value="cst">Central Time (CST)</SelectItem>
                              <SelectItem value="est">Eastern Time (EST)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Address */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Address</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="street-address">Street Address</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                          <Textarea
                            id="street-address"
                            className="pl-10"
                            value={hotelProfile.address.street}
                            onChange={(e) => setHotelProfile({
                              ...hotelProfile,
                              address: { ...hotelProfile.address, street: e.target.value }
                            })}
                            rows={2}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={hotelProfile.address.city}
                            onChange={(e) => setHotelProfile({
                              ...hotelProfile,
                              address: { ...hotelProfile.address, city: e.target.value }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={hotelProfile.address.state}
                            onChange={(e) => setHotelProfile({
                              ...hotelProfile,
                              address: { ...hotelProfile.address, state: e.target.value }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zip">ZIP Code</Label>
                          <Input
                            id="zip"
                            value={hotelProfile.address.zip}
                            onChange={(e) => setHotelProfile({
                              ...hotelProfile,
                              address: { ...hotelProfile.address, zip: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Hotel Description</Label>
                    <Textarea
                      id="description"
                      rows={4}
                      value={hotelProfile.description}
                      onChange={(e) => setHotelProfile({ ...hotelProfile, description: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button size="lg" onClick={handleSaveProfile} disabled={loading}>
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* User Management */}

          <TabsContent value="users" className="space-y-6">
            {/* Pending Approvals */}
            {pendingUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-orange-200 bg-orange-50/50">
                  <CardHeader>
                    <CardTitle className="text-orange-900">Pending Approvals</CardTitle>
                    <CardDescription className="text-orange-700">New team members waiting for access</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pendingUsers.map((user, index) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-orange-100 text-orange-600">
                                {user.name ? user.name.split(' ').map(n => n[0]).join('') : '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-slate-900">{user.name}</div>
                              <div className="text-sm text-slate-600">{user.email}</div>
                              <div className="text-xs text-slate-500">{user.phone} • {user.address}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => openApproveDialog(user)}
                              style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                            >
                              APPROVE
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => openDeleteUserDialog(user)}>
                              Decline
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage active user accounts and roles</CardDescription>
                  </div>

                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeUsers.map((member, index) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                              {member.name ? member.name.split(' ').map(n => n[0]).join('') : '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-slate-600">{member.email}</div>
                            <div className="text-xs text-slate-500">ID: {member.employeeId || 'N/A'} • {member.phone}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={member.status === 'active' ? 'default' : 'outline'}>
                            {member.role || 'No Role'}
                          </Badge>
                          <Badge variant={member.status === 'active' ? 'outline' : 'secondary'}>
                            {member.status}
                          </Badge>
                          <Button variant="ghost" size="sm" onClick={() => openEditUserDialog(member)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openDeleteUserDialog(member)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                    {activeUsers.length === 0 && !loading && (
                      <div className="text-center py-8 text-slate-500">
                        No active users found. Appove pending requests or add new users.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>



          {/* Page Management */}
          <TabsContent value="pages" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Page Management</CardTitle>
                  <CardDescription>Enable or disable dashboard pages across the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pageSettings.map((page, index) => {
                      const PageIcon = page.icon;
                      return (
                        <div key={page.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${page.enabled ? 'bg-blue-100' : 'bg-slate-200'}`}>
                              <PageIcon className={`w-5 h-5 ${page.enabled ? 'text-blue-600' : 'text-slate-400'}`} />
                            </div>
                            <div>
                              <div className="font-medium">{page.name}</div>
                              <div className="text-sm text-slate-600">
                                {page.enabled ? 'Currently visible in dashboard' : 'Hidden from dashboard'}
                              </div>
                            </div>
                          </div>
                          <Switch
                            checked={page.enabled}
                            onCheckedChange={(checked) => handlePageToggle(page.id, checked)}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Disabling a page will hide it from all users in the navigation menu.
                      Users without permission to a page won't see it even if it's enabled.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>



          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your password and account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Change Password Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                    <div className="space-y-4 max-w-md">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="current-password"
                            type={showCurrentPassword ? 'text' : 'password'}
                            placeholder="Enter current password"
                            value={passwordData.current}
                            onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder="Enter new password"
                            value={passwordData.new}
                            onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-slate-500">
                          Minimum 8 characters
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm new password"
                            value={passwordData.confirm}
                            onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <Button className="w-full" onClick={handleUpdatePassword} disabled={loading}>
                        <Lock className="w-4 h-4 mr-2" />
                        {loading ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Password Requirements */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Password Requirements</h3>
                    <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                        <span>Minimum 8 characters</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                        <span>At least one uppercase letter</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                        <span>At least one lowercase letter</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                        <span>At least one number</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                        <span>At least one special character (!@#$%^&*)</span>
                      </div>
                    </div>
                  </div>


                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Add a new team member to your hotel management system</DialogDescription>
          </DialogHeader>
          <UserFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddUserDialogOpen(false); resetUserForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and settings</DialogDescription>
          </DialogHeader>
          <UserFormFields isEdit={true} />
          <PermissionsConfigurator />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditUserDialogOpen(false); resetUserForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleEditUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={isDeleteUserDialogOpen} onOpenChange={setIsDeleteUserDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve User Dialog */}
      <Dialog open={isApproveUserDialogOpen} onOpenChange={setIsApproveUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve User Access</DialogTitle>
            <DialogDescription>
              Assign a role and employee ID to <strong>{selectedUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Employee ID</Label>
              <Input
                value={approveFormData.employeeId}
                onChange={(e) => setApproveFormData({ ...approveFormData, employeeId: e.target.value })}
                placeholder="EMP001"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={approveFormData.role}
                onValueChange={(val) => setApproveFormData({ ...approveFormData, role: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <PermissionsConfigurator />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveUserDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleApproveUser}>Approve Access</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
}
