import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Bed,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  User,
  Users,
  Plus
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Label } from '../ui/label';
import { housekeepingServices } from '../../lib/firebaseServices';
import { useToast } from '../../hooks/use-toast';

// UI Interface matches the component's internal logic
type RoomStatus = 'clean' | 'dirty' | 'cleaning' | 'inspection' | 'maintenance';

interface Room {
  id: string;
  number: string;
  floor: number;
  type: string;
  status: RoomStatus; // Mapped from cleaningStatus
  assignedTo?: string; // Mapped from assignedCleanerName
  priority: 'low' | 'medium' | 'high'; // Mapped from cleaningPriority
  lastCleaned?: string; // Mapped from lastCleanedAt
  nextCheckIn?: string; // Mapped from checkInDate/checkOutDate
  occupancyStatus?: string; // Original status field
}

interface Staff {
  id: string;
  name: string;
  status: string;
  role?: string;
}

const statusConfig: Record<string, { label: string; color: string; textColor: string; bgColor: string }> = {
  clean: { label: 'Clean', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' },
  dirty: { label: 'Dirty', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50' },
  cleaning: { label: 'Cleaning', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
  inspection: { label: 'Inspection', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  maintenance: { label: 'Maintenance', color: 'bg-orange-500', textColor: 'text-orange-700', bgColor: 'bg-orange-50' },
};

export function HousekeepingManagement() {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [assignStaffDialog, setAssignStaffDialog] = useState<{ open: boolean; room: Room | null }>({
    open: false,
    room: null,
  });
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

  // New Request State
  const [isNewRequestDialogOpen, setIsNewRequestDialogOpen] = useState(false);
  const [newRequestData, setNewRequestData] = useState({
    roomId: '',
    status: 'dirty',
    priority: 'medium',
    assignedToId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, staffRes] = await Promise.all([
        housekeepingServices.getTasks(),
        housekeepingServices.getStaff()
      ]);

      if (roomsRes.success && roomsRes.data) {
        const mappedRooms = roomsRes.data.map((r: any) => ({
          id: r.id,
          number: r.roomNumber || r.number || '?',
          floor: Number(r.floor) || 1,
          type: r.type || 'Standard',
          // Map cleaningStatus to status, default to 'clean'
          status: (r.cleaningStatus || 'clean') as RoomStatus,
          // Map assignedCleanerName to assignedTo
          assignedTo: r.assignedCleanerName || undefined,
          // Map cleaningPriority, default to 'low'
          priority: (r.cleaningPriority || 'low') as 'low' | 'medium' | 'high',
          // Format lastCleaned
          lastCleaned: r.lastCleanedAt ? (typeof r.lastCleanedAt === 'string' ? r.lastCleanedAt : new Date(r.lastCleanedAt.seconds * 1000).toISOString()) : undefined,
          // Show check-in/out info
          nextCheckIn: r.checkInDate || r.checkOutDate || undefined,
          occupancyStatus: r.status // Keep original status for reference if needed
        }));
        setRooms(mappedRooms);
      } else {
        console.error("Failed to load rooms:", roomsRes.error);
        toast({ title: "Error", description: "Failed to load rooms.", variant: "destructive" });
      }

      if (staffRes.success && staffRes.data) {
        setStaff(staffRes.data as Staff[]);
      }
    } catch (error) {
      console.error("Error fetching housekeeping data:", error);
      toast({ title: "Error", description: "An unexpected error occurred loading data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStaff = async () => {
    if (!assignStaffDialog.room || !selectedStaffId) return;

    try {
      const staffMember = staff.find(s => s.id === selectedStaffId);
      const staffName = staffMember ? staffMember.name : selectedStaffId;

      // We need to update specifically the housekeeping fields
      // The service updateTaskStatus needs to be smart or we pass raw fields?
      // Let's assume updateTaskStatus handles the 'status' arg as 'cleaningStatus' in DB
      const result = await housekeepingServices.updateTaskStatus(
        assignStaffDialog.room.id,
        'cleaning',
        staffName
      );

      if (result.success) {
        toast({ title: "Success", description: "Staff assigned successfully." });
        setAssignStaffDialog({ open: false, room: null });
        setSelectedStaffId('');
        fetchData();
      } else {
        toast({ title: "Error", description: result.error || "Failed to assign staff.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to assign staff.", variant: "destructive" });
    }
  };

  const handleCreateRequest = async () => {
    if (!newRequestData.roomId) {
      toast({ title: "Validation Error", description: "Please select a room.", variant: "destructive" });
      return;
    }

    try {
      const staffMember = staff.find(s => s.id === newRequestData.assignedToId);
      const staffName = staffMember ? staffMember.name : (newRequestData.assignedToId || undefined);

      const result = await housekeepingServices.updateTaskStatus(
        newRequestData.roomId,
        newRequestData.status,
        staffName,
        newRequestData.priority
      );

      if (result.success) {
        toast({ title: "Success", description: "Request created successfully." });
        setIsNewRequestDialogOpen(false);
        setNewRequestData({ roomId: '', status: 'dirty', priority: 'medium', assignedToId: '' });
        fetchData();
      } else {
        toast({ title: "Error", description: result.error || "Failed to create request.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create request.", variant: "destructive" });
    }
  };

  const handleStatusUpdate = async (room: Room, newStatus: RoomStatus) => {
    try {
      const result = await housekeepingServices.updateTaskStatus(
        room.id,
        newStatus,
        room.assignedTo || ''
      );

      if (result.success) {
        toast({ title: "Success", description: `Room marked as ${newStatus}` });
        fetchData();
      } else {
        toast({ title: "Error", description: result.error || "Failed to update status", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An error occurred", variant: "destructive" });
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.number.includes(searchTerm) || room.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || room.status === filterStatus;
    const matchesFloor = selectedFloor === 'all' || room.floor.toString() === selectedFloor;
    return matchesSearch && matchesStatus && matchesFloor;
  });

  const staffRoomCounts = staff.map(s => {
    const count = rooms.filter(r => r.assignedTo === s.name).length;
    return { ...s, roomCount: count };
  });

  const stats = [
    {
      label: 'Clean Rooms',
      value: rooms.filter(r => r.status === 'clean').length,
      total: rooms.length,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      label: 'In Progress',
      value: rooms.filter(r => r.status === 'cleaning').length,
      total: rooms.length,
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'Needs Cleaning',
      value: rooms.filter(r => r.status === 'dirty').length,
      total: rooms.length,
      icon: Bed,
      color: 'text-red-600',
      bg: 'bg-red-50'
    },
    {
      label: 'Maintenance',
      value: rooms.filter(r => r.status === 'maintenance').length,
      total: rooms.length,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
                    <h3 className="text-3xl font-bold">
                      {stat.value}
                      <span className="text-lg text-slate-400">/{stat.total}</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Room Grid */}
        <div className="lg:col-span-2 space-y-4">
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
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="clean">Clean</SelectItem>
                <SelectItem value="dirty">Dirty</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
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
              </SelectContent>
            </Select>

            <Button onClick={() => setIsNewRequestDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Room Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredRooms.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No rooms found matching your filters.</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredRooms.map((room, index) => {
                    const status = statusConfig[room.status] || statusConfig.clean;
                    return (
                      <motion.div
                        key={room.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${status.bgColor}`}
                        onClick={() => {
                          if (room.status === 'dirty' || room.status === 'cleaning' || room.status === 'inspection') {
                            setAssignStaffDialog({ open: true, room });
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="text-lg font-bold">{room.number}</div>
                            <div className="text-xs text-slate-600">{room.type}</div>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${status.color}`} />
                        </div>
                        <Badge className={`text-xs ${status.textColor}`} variant="outline">
                          {status.label}
                        </Badge>
                        {room.occupancyStatus === 'occupied' && (
                          <Badge variant="secondary" className="ml-1 text-xs">Occupied</Badge>
                        )}
                        {room.assignedTo && (
                          <div className="mt-2 text-xs text-slate-600 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="truncate">{room.assignedTo}</span>
                          </div>
                        )}
                        {room.nextCheckIn && (
                          <div className="mt-2 text-xs text-red-600 font-medium truncate">
                            {room.occupancyStatus === 'occupied' ? `Out: ${room.nextCheckIn}` : `In: ${room.nextCheckIn}`}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Requests Table View */}
          <Card>
            <CardHeader>
              <CardTitle>Housekeeping Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredRooms.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No rooms found matching your filters.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRooms.map((room: Room) => {
                      const status = statusConfig[room.status] || statusConfig.clean;
                      return (
                        <TableRow key={room.id}>
                          <TableCell className="font-medium">{room.number}</TableCell>
                          <TableCell>{room.type}</TableCell>
                          <TableCell>
                            <Badge className={`${status.bgColor} ${status.textColor} border-0`}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              room.priority === 'high' ? 'text-red-600 bg-red-50 border-red-200' :
                                room.priority === 'medium' ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
                                  'text-slate-600 bg-slate-50 border-slate-200'
                            }>
                              {room.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {room.assignedTo ? (
                              <div className="flex items-center gap-2">
                                <User className="w-3 h-3 text-slate-400" />
                                <span className="text-sm">{room.assignedTo}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-sm italic">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setAssignStaffDialog({ open: true, room })}
                            >
                              Manage
                            </Button>
                            {room.status === 'dirty' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="ml-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() => handleStatusUpdate(room, 'cleaning')}
                              >
                                In Process
                              </Button>
                            )}
                            {(room.status === 'dirty' || room.status === 'cleaning' || room.status === 'inspection') && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="ml-2 text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => handleStatusUpdate(room, 'clean')}
                              >
                                Cleaned
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Staff Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Housekeeping Staff</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {staffRoomCounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-slate-500 text-sm">
                  <Users className="w-8 h-8 mb-2 opacity-50" />
                  <p>No staff found.</p>
                  <p className="text-xs mt-1">Add users with role 'Cleaner'</p>
                </div>
              ) : (
                staffRoomCounts.map((member: Staff & { roomCount: number }, index: number) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-slate-600">
                          {member.roomCount} rooms assigned
                        </div>
                      </div>
                      <Badge variant={member.status === 'active' ? 'default' : 'outline'}>
                        {member.status || 'Active'}
                      </Badge>
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Priority Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredRooms
                .filter(r => r.priority === 'high' && r.status === 'dirty')
                .map((room, index) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Room {room.number}</span>
                      <Badge className="bg-red-100 text-red-800">Urgent</Badge>
                    </div>
                    <Button size="sm" className="w-full mt-2" onClick={() => setAssignStaffDialog({ open: true, room })}>
                      Assign Staff
                    </Button>
                  </motion.div>
                ))}
              {filteredRooms.filter(r => r.priority === 'high' && r.status === 'dirty').length === 0 && (
                <p className="text-sm text-slate-500 text-center">No urgent priority tasks.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assign Staff Dialog */}
      <Dialog open={assignStaffDialog.open} onOpenChange={(open) => setAssignStaffDialog({ open, room: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Staff to Room {assignStaffDialog.room?.number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Select Staff Member</Label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose a staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((member: Staff) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {assignStaffDialog.room && (
              <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Room Type:</span>
                  <span className="font-medium">{assignStaffDialog.room.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Priority:</span>
                  <Badge className={
                    assignStaffDialog.room.priority === 'high' ? 'bg-red-100 text-red-800' :
                      assignStaffDialog.room.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-slate-100 text-slate-800'
                  }>
                    {assignStaffDialog.room.priority}
                  </Badge>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAssignStaffDialog({ open: false, room: null })}>
              Cancel
            </Button>
            <Button onClick={handleAssignStaff} disabled={!selectedStaffId}>
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Request Dialog */}
      <Dialog open={isNewRequestDialogOpen} onOpenChange={setIsNewRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Housekeeping Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Room</Label>
              <Select
                value={newRequestData.roomId}
                onValueChange={(val) => setNewRequestData({ ...newRequestData, roomId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a room" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      Room {room.number} ({room.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Request Type / Status</Label>
              <Select
                value={newRequestData.status}
                onValueChange={(val) => setNewRequestData({ ...newRequestData, status: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dirty">Needs Cleaning (Dirty)</SelectItem>
                  <SelectItem value="inspection">Needs Inspection</SelectItem>
                  <SelectItem value="maintenance">Maintenance Issue</SelectItem>
                  <SelectItem value="cleaning">In Progress (Cleaning)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={newRequestData.priority}
                onValueChange={(val) => setNewRequestData({ ...newRequestData, priority: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assign Staff (Optional)</Label>
              <Select
                value={newRequestData.assignedToId}
                onValueChange={(val) => setNewRequestData({ ...newRequestData, assignedToId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((member: Staff) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsNewRequestDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRequest} disabled={!newRequestData.roomId}>
              Create Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}