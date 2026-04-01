import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Bed,
  Plus,
  Search,
  Edit,
  Trash2,
  DoorOpen,
  DoorClosed,
  Power,
  Users,
  DollarSign,
  Wifi,
  Coffee,
  Wine,
  Waves,
  Mountain,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';

type RoomStatus = 'available' | 'occupied' | 'maintenance';
type RoomType = 'Standard' | 'Deluxe' | 'Suite' | 'Executive' | 'Presidential';

interface RoomFacilities {
  wifi: boolean;
  breakfast: boolean;
  miniBar: boolean;
  balcony: boolean;
  oceanView: boolean;
  airConditioning: boolean;
  tv: boolean;
  jacuzzi: boolean;
}

interface Room {
  id: string;
  roomNumber: string;
  type: RoomType;
  floor: number;
  perNightCost: number;
  maxGuests: number;
  bedType: string;
  facilities: RoomFacilities;
  status: RoomStatus;
  isActive: boolean;
  description: string;
  currentGuest?: string;
  checkInDate?: string;
  checkOutDate?: string;
}

const initialRooms: Room[] = [
  {
    id: '1',
    roomNumber: '101',
    type: 'Standard',
    floor: 1,
    perNightCost: 120,
    maxGuests: 2,
    bedType: 'Queen',
    facilities: {
      wifi: true,
      breakfast: true,
      miniBar: false,
      balcony: false,
      oceanView: false,
      airConditioning: true,
      tv: true,
      jacuzzi: false,
    },
    status: 'available',
    isActive: true,
    description: 'Comfortable standard room with modern amenities',
  },
  {
    id: '2',
    roomNumber: '102',
    type: 'Standard',
    floor: 1,
    perNightCost: 120,
    maxGuests: 2,
    bedType: 'Queen',
    facilities: {
      wifi: true,
      breakfast: true,
      miniBar: false,
      balcony: false,
      oceanView: false,
      airConditioning: true,
      tv: true,
      jacuzzi: false,
    },
    status: 'occupied',
    isActive: true,
    description: 'Comfortable standard room with modern amenities',
    currentGuest: 'John Smith',
    checkInDate: 'Oct 28',
    checkOutDate: 'Oct 30',
  },
  {
    id: '3',
    roomNumber: '201',
    type: 'Deluxe',
    floor: 2,
    perNightCost: 200,
    maxGuests: 3,
    bedType: 'King',
    facilities: {
      wifi: true,
      breakfast: true,
      miniBar: true,
      balcony: true,
      oceanView: false,
      airConditioning: true,
      tv: true,
      jacuzzi: false,
    },
    status: 'available',
    isActive: true,
    description: 'Spacious deluxe room with premium amenities and balcony',
  },
  {
    id: '4',
    roomNumber: '202',
    type: 'Deluxe',
    floor: 2,
    perNightCost: 200,
    maxGuests: 3,
    bedType: 'King',
    facilities: {
      wifi: true,
      breakfast: true,
      miniBar: true,
      balcony: true,
      oceanView: false,
      airConditioning: true,
      tv: true,
      jacuzzi: false,
    },
    status: 'maintenance',
    isActive: true,
    description: 'Spacious deluxe room with premium amenities and balcony',
  },
  {
    id: '5',
    roomNumber: '301',
    type: 'Suite',
    floor: 3,
    perNightCost: 350,
    maxGuests: 4,
    bedType: 'King + Sofa Bed',
    facilities: {
      wifi: true,
      breakfast: true,
      miniBar: true,
      balcony: true,
      oceanView: true,
      airConditioning: true,
      tv: true,
      jacuzzi: true,
    },
    status: 'available',
    isActive: true,
    description: 'Luxurious suite with ocean view and jacuzzi',
  },
  {
    id: '6',
    roomNumber: '302',
    type: 'Suite',
    floor: 3,
    perNightCost: 350,
    maxGuests: 4,
    bedType: 'King + Sofa Bed',
    facilities: {
      wifi: true,
      breakfast: true,
      miniBar: true,
      balcony: true,
      oceanView: true,
      airConditioning: true,
      tv: true,
      jacuzzi: true,
    },
    status: 'occupied',
    isActive: true,
    description: 'Luxurious suite with ocean view and jacuzzi',
    currentGuest: 'Sarah Johnson',
    checkInDate: 'Oct 27',
    checkOutDate: 'Nov 1',
  },
  {
    id: '7',
    roomNumber: '401',
    type: 'Executive',
    floor: 4,
    perNightCost: 280,
    maxGuests: 3,
    bedType: 'King',
    facilities: {
      wifi: true,
      breakfast: true,
      miniBar: true,
      balcony: true,
      oceanView: true,
      airConditioning: true,
      tv: true,
      jacuzzi: false,
    },
    status: 'available',
    isActive: true,
    description: 'Executive room with business amenities and ocean view',
  },
  {
    id: '8',
    roomNumber: '103',
    type: 'Standard',
    floor: 1,
    perNightCost: 120,
    maxGuests: 2,
    bedType: 'Queen',
    facilities: {
      wifi: true,
      breakfast: true,
      miniBar: false,
      balcony: false,
      oceanView: false,
      airConditioning: true,
      tv: true,
      jacuzzi: false,
    },
    status: 'available',
    isActive: false,
    description: 'Comfortable standard room (Currently Inactive)',
  },
];

const statusConfig = {
  available: { label: 'Available', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50', icon: DoorOpen },
  occupied: { label: 'Occupied', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50', icon: DoorClosed },
  maintenance: { label: 'Maintenance', color: 'bg-orange-500', textColor: 'text-orange-700', bgColor: 'bg-orange-50', icon: AlertTriangle },
};

const facilityIcons = {
  wifi: { icon: Wifi, label: 'WiFi' },
  breakfast: { icon: Coffee, label: 'Free Breakfast' },
  miniBar: { icon: Wine, label: 'Mini Bar' },
  balcony: { icon: Mountain, label: 'Balcony' },
  oceanView: { icon: Waves, label: 'Ocean View' },
  airConditioning: { icon: Mountain, label: 'Air Conditioning' },
  tv: { icon: CheckCircle, label: 'TV' },
  jacuzzi: { icon: Waves, label: 'Jacuzzi' },
};

export function RoomsManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<Partial<Room>>({
    roomNumber: '',
    type: 'Standard',
    floor: 1,
    perNightCost: 0,
    maxGuests: 2,
    bedType: 'Queen',
    facilities: {
      wifi: true,
      breakfast: false,
      miniBar: false,
      balcony: false,
      oceanView: false,
      airConditioning: true,
      tv: true,
      jacuzzi: false,
    },
    status: 'available',
    isActive: true,
    description: '',
  });

  // Load rooms from Firebase on component mount
  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const { roomsServices } = await import('../../lib/firebaseServices');
      const result = await roomsServices.getRooms();
      if (result.success && result.data) {
        setRooms(result.data as Room[]);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter(room => {
    // Safety checks for required fields
    if (!room) return false;

    const roomNumber = room.roomNumber || '';
    const roomType = room.type || 'Standard';
    const roomStatus = room.status || 'available';
    const roomFloor = room.floor || 1;

    const matchesSearch =
      roomNumber.includes(searchTerm) ||
      roomType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || roomStatus === filterStatus;
    const matchesType = filterType === 'all' || roomType === filterType;
    const matchesFloor = selectedFloor === 'all' || roomFloor.toString() === selectedFloor;
    return matchesSearch && matchesStatus && matchesType && matchesFloor;
  });

  const stats = [
    {
      label: 'Available Rooms',
      value: rooms.filter(r => r.status === 'available' && r.isActive).length,
      total: rooms.filter(r => r.isActive).length,
      icon: DoorOpen,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      label: 'Occupied Rooms',
      value: rooms.filter(r => r.status === 'occupied').length,
      total: rooms.length,
      icon: DoorClosed,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'Under Maintenance',
      value: rooms.filter(r => r.status === 'maintenance').length,
      total: rooms.length,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    {
      label: 'Total Revenue',
      value: `$${rooms.filter(r => r.status === 'occupied').reduce((acc, r) => acc + r.perNightCost, 0)}`,
      total: '/night',
      icon: DollarSign,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
  ];

  const handleAddRoom = async () => {
    try {
      const { roomsServices } = await import('../../lib/firebaseServices');
      const roomData = {
        roomNumber: formData.roomNumber || '',
        type: formData.type || 'Standard',
        floor: formData.floor || 1,
        perNightCost: formData.perNightCost || 0,
        maxGuests: formData.maxGuests || 2,
        bedType: formData.bedType || 'Queen',
        facilities: formData.facilities || {
          wifi: true,
          breakfast: false,
          miniBar: false,
          balcony: false,
          oceanView: false,
          airConditioning: true,
          tv: true,
          jacuzzi: false,
        },
        status: formData.status || 'available',
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        description: formData.description || '',
      };

      const result = await roomsServices.addRoom(roomData);
      if (result.success) {
        await loadRooms(); // Reload rooms from Firebase
        setIsAddDialogOpen(false);
        resetForm();
      } else {
        console.error('Failed to add room:', result.error);
        alert('Failed to add room. Please try again.');
      }
    } catch (error) {
      console.error('Error adding room:', error);
      alert('An error occurred while adding the room.');
    }
  };

  const handleEditRoom = async () => {
    if (!selectedRoom) return;
    try {
      const { roomsServices } = await import('../../lib/firebaseServices');
      const result = await roomsServices.updateRoom(selectedRoom.id, formData);
      if (result.success) {
        await loadRooms(); // Reload rooms from Firebase
        setIsEditDialogOpen(false);
        setSelectedRoom(null);
        resetForm();
      } else {
        console.error('Failed to update room:', result.error);
        alert('Failed to update room. Please try again.');
      }
    } catch (error) {
      console.error('Error updating room:', error);
      alert('An error occurred while updating the room.');
    }
  };

  const handleDeleteRoom = async () => {
    if (!selectedRoom) return;
    try {
      const { roomsServices } = await import('../../lib/firebaseServices');
      const result = await roomsServices.deleteRoom(selectedRoom.id);
      if (result.success) {
        await loadRooms(); // Reload rooms from Firebase
        setIsDeleteDialogOpen(false);
        setSelectedRoom(null);
      } else {
        console.error('Failed to delete room:', result.error);
        alert('Failed to delete room. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('An error occurred while deleting the room.');
    }
  };

  const handleToggleRoomStatus = async (roomId: string) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      if (!room) return;

      const { roomsServices } = await import('../../lib/firebaseServices');
      const result = await roomsServices.updateRoom(roomId, { isActive: !room.isActive });
      if (result.success) {
        await loadRooms(); // Reload rooms from Firebase
      } else {
        console.error('Failed to toggle room status:', result.error);
      }
    } catch (error) {
      console.error('Error toggling room status:', error);
    }
  };

  const openEditDialog = (room: Room) => {
    setSelectedRoom(room);
    setFormData(room);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (room: Room) => {
    setSelectedRoom(room);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      roomNumber: '',
      type: 'Standard',
      floor: 1,
      perNightCost: 0,
      maxGuests: 2,
      bedType: 'Queen',
      facilities: {
        wifi: true,
        breakfast: false,
        miniBar: false,
        balcony: false,
        oceanView: false,
        airConditioning: true,
        tv: true,
        jacuzzi: false,
      },
      status: 'available',
      isActive: true,
    });
  };

  const updateFacility = (facility: keyof RoomFacilities, value: boolean) => {
    setFormData({
      ...formData,
      facilities: {
        ...formData.facilities!,
        [facility]: value,
      }
    });
  };

  const RoomFormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="roomNumber">Room Number *</Label>
          <Input
            id="roomNumber"
            placeholder="e.g., 101"
            value={formData.roomNumber}
            onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Room Type *</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as RoomType })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Standard">Standard</SelectItem>
              <SelectItem value="Deluxe">Deluxe</SelectItem>
              <SelectItem value="Suite">Suite</SelectItem>
              <SelectItem value="Executive">Executive</SelectItem>
              <SelectItem value="Presidential">Presidential</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="floor">Floor *</Label>
          <Input
            id="floor"
            type="number"
            min="1"
            value={formData.floor}
            onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 1 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="perNightCost">Per Night Cost ($) *</Label>
          <Input
            id="perNightCost"
            type="number"
            min="0"
            placeholder="e.g., 120"
            value={formData.perNightCost}
            onChange={(e) => setFormData({ ...formData, perNightCost: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="maxGuests">Max Guests *</Label>
          <Input
            id="maxGuests"
            type="number"
            min="1"
            value={formData.maxGuests}
            onChange={(e) => setFormData({ ...formData, maxGuests: parseInt(e.target.value) || 1 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bedType">Bed Type *</Label>
          <Input
            id="bedType"
            placeholder="e.g., Queen, King"
            value={formData.bedType}
            onChange={(e) => setFormData({ ...formData, bedType: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Facilities</Label>
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-lg">
          {Object.entries(facilityIcons).map(([key, { label }]) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={key}
                checked={formData.facilities?.[key as keyof RoomFacilities] || false}
                onCheckedChange={(checked) => updateFacility(key as keyof RoomFacilities, checked as boolean)}
              />
              <label
                htmlFor={key}
                className="text-sm cursor-pointer"
              >
                {label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div>
          <Label htmlFor="isActive">Room Active Status</Label>
          <p className="text-sm text-slate-600">Mark this room as active or inactive</p>
        </div>
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
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
                    <h3 className="text-3xl">
                      {typeof stat.value === 'number' ? stat.value : stat.value}
                      {typeof stat.value === 'number' && (
                        <span className="text-lg text-slate-400">
                          /{typeof stat.total === 'number' ? stat.total : stat.total}
                        </span>
                      )}
                      {typeof stat.value === 'string' && (
                        <span className="text-lg text-slate-400">{stat.total}</span>
                      )}
                    </h3>
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

      {/* Filters and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Search rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="occupied">Occupied</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Standard">Standard</SelectItem>
            <SelectItem value="Deluxe">Deluxe</SelectItem>
            <SelectItem value="Suite">Suite</SelectItem>
            <SelectItem value="Executive">Executive</SelectItem>
            <SelectItem value="Presidential">Presidential</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedFloor} onValueChange={setSelectedFloor}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Floor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Floors</SelectItem>
            <SelectItem value="1">Floor 1</SelectItem>
            <SelectItem value="2">Floor 2</SelectItem>
            <SelectItem value="3">Floor 3</SelectItem>
            <SelectItem value="4">Floor 4</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Room
        </Button>
      </div>

      {/* Rooms Grid */}
      <Card>
        <CardHeader>
          <CardTitle>All Rooms ({filteredRooms.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className={`relative p-5 rounded-lg border-2 transition-all hover:shadow-lg ${!room.isActive ? 'opacity-60 border-slate-300' : (statusConfig[room.status || 'available']?.bgColor || 'bg-slate-50')
                  }`}
              >
                {/* Room Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xl">{room.roomNumber}</div>
                    <div className="text-sm text-slate-600">{room.type}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`w-3 h-3 rounded-full ${statusConfig[room.status || 'available']?.color || 'bg-slate-500'}`} />
                    <button
                      onClick={() => handleToggleRoomStatus(room.id)}
                      className={`p-1 rounded transition-colors ${room.isActive
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      title={room.isActive ? 'Mark as Inactive' : 'Mark as Active'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Status Badge */}
                <Badge
                  className={`text-xs mb-3 ${statusConfig[room.status || 'available']?.textColor || 'text-slate-700'}`}
                  variant="outline"
                >
                  {statusConfig[room.status || 'available']?.label || 'Unknown'}
                </Badge>

                {!room.isActive && (
                  <Badge className="text-xs mb-3 ml-2 bg-slate-200 text-slate-700" variant="outline">
                    Inactive
                  </Badge>
                )}

                {/* Room Details */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Price:</span>
                    <span className="font-medium">${room.perNightCost}/night</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Floor:</span>
                    <span>{room.floor}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Max Guests:</span>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{room.maxGuests}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Bed:</span>
                    <span>{room.bedType}</span>
                  </div>
                </div>

                {/* Facilities */}
                <div className="mb-3">
                  <div className="text-xs text-slate-600 mb-2">Facilities:</div>
                  <div className="flex flex-wrap gap-2">
                    {room.facilities && Object.entries(room.facilities).map(([key, value]) => {
                      if (!value) return null;
                      const Icon = facilityIcons[key as keyof RoomFacilities]?.icon || CheckCircle;
                      return (
                        <div
                          key={key}
                          className="flex items-center gap-1 px-2 py-1 bg-white rounded text-xs"
                          title={facilityIcons[key as keyof RoomFacilities]?.label}
                        >
                          <Icon className="w-3 h-3" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Guest Info (if occupied) */}
                {room.status === 'occupied' && room.currentGuest && (
                  <div className="mb-3 p-2 bg-blue-50 rounded text-xs">
                    <div className="text-slate-600">Guest: {room.currentGuest}</div>
                    <div className="text-slate-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {room.checkInDate} - {room.checkOutDate}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-slate-200">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => openEditDialog(room)}
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => openDeleteDialog(room)}
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredRooms.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Bed className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No rooms found matching your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Room Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
          </DialogHeader>
          <RoomFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddRoom}>Add Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Room {selectedRoom?.roomNumber}</DialogTitle>
          </DialogHeader>
          <RoomFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleEditRoom}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room {selectedRoom?.roomNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the room from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRoom} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
