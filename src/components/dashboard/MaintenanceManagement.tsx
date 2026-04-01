import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Search,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Users,
  User
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { maintenanceServices } from '../../lib/firebaseServices';
import { useToast } from '../../hooks/use-toast';

interface MaintenanceRequest {
  id: string;
  room: string;
  issue: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  reportedBy: string;
  assignedTo?: string;
  reportedDate: string;
  completedDate?: string;
  category: string;
}

interface Staff {
  id: string;
  name: string;
  status: string;
  role?: string;
}

const priorityConfig: Record<string, { color: string; icon: string }> = {
  low: { color: 'bg-slate-100 text-slate-800', icon: 'bg-slate-500' },
  medium: { color: 'bg-yellow-100 text-yellow-800', icon: 'bg-yellow-500' },
  high: { color: 'bg-orange-100 text-orange-800', icon: 'bg-orange-500' },
  critical: { color: 'bg-red-100 text-red-800', icon: 'bg-red-500' },
};

const statusConfig: Record<string, { color: string; icon: any }> = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  'in-progress': { color: 'bg-blue-100 text-blue-800', icon: Wrench },
  completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  cancelled: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
};

export function MaintenanceManagement() {
  const { toast } = useToast();
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [viewRequestOpen, setViewRequestOpen] = useState(false);
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; request: MaintenanceRequest | null }>({
    open: false,
    request: null
  });
  const [updateDialog, setUpdateDialog] = useState<{ open: boolean; request: MaintenanceRequest | null }>({
    open: false,
    request: null
  });

  // New Request Form State
  const [newRequestData, setNewRequestData] = useState({
    room: '',
    category: '',
    issue: '',
    priority: 'medium',
    description: '',
    reportedBy: '',
    assignedToId: ''
  });

  const [updateStatusData, setUpdateStatusData] = useState({
    status: '',
    notes: ''
  });

  const [assignTechId, setAssignTechId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [requestsRes, staffRes] = await Promise.all([
        maintenanceServices.getRequests(),
        maintenanceServices.getStaff()
      ]);

      if (requestsRes.success && requestsRes.data) {
        setMaintenanceRequests(requestsRes.data as MaintenanceRequest[]);
      } else {
        toast({ title: "Error", description: requestsRes.error || "Failed to load requests.", variant: "destructive" });
      }

      if (staffRes.success && staffRes.data) {
        setStaff(staffRes.data as Staff[]);
      }
    } catch (error) {
      console.error("Error fetching maintenance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    // Basic validation
    if (!newRequestData.room || !newRequestData.issue || !newRequestData.reportedBy) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    try {
      const assignedStaff = staff.find((s: Staff) => s.id === newRequestData.assignedToId);
      const isAssigned = !!assignedStaff;

      const result = await maintenanceServices.addRequest({
        ...newRequestData,
        assignedTo: assignedStaff ? assignedStaff.name : null,
        status: isAssigned ? 'in-progress' : 'pending'
      });

      if (result.success) {
        toast({ title: "Success", description: "Maintenance request created." });
        setIsNewRequestOpen(false);
        setNewRequestData({
          room: '', category: '', issue: '', priority: 'medium', description: '', reportedBy: '', assignedToId: ''
        });
        fetchData();
      } else {
        toast({ title: "Error", description: "Failed to create request.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdateRequest = async () => {
    if (!updateDialog.request || !updateStatusData.status) return;

    try {
      const updatePayload: any = { status: updateStatusData.status };
      if (updateStatusData.status === 'completed') {
        updatePayload.completedDate = new Date().toISOString();
      }

      const result = await maintenanceServices.updateRequest(updateDialog.request.id, updatePayload);

      if (result.success) {
        toast({ title: "Success", description: "Request updated successfully." });
        setUpdateDialog({ open: false, request: null });
        fetchData();
      } else {
        toast({ title: "Error", description: "Failed to update request.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleAssignTechnician = async () => {
    if (!assignDialog.request || !assignTechId) return;

    const tech = staff.find((s: Staff) => s.id === assignTechId);
    const techName = tech ? tech.name : assignTechId;

    try {
      const result = await maintenanceServices.assignTechnician(assignDialog.request.id, techName);
      if (result.success) {
        toast({ title: "Success", description: "Technician assigned." });
        setAssignDialog({ open: false, request: null });
        setAssignTechId('');
        fetchData();
      } else {
        toast({ title: "Error", description: "Failed to assign technician.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  }


  const filteredRequests = maintenanceRequests.filter(request => {
    const searchLower = searchTerm.toLowerCase();
    return (
      request.room.toLowerCase().includes(searchLower) ||
      request.issue.toLowerCase().includes(searchLower) ||
      request.id.toLowerCase().includes(searchLower)
    );
  });

  const stats = [
    {
      label: 'Total Requests',
      value: maintenanceRequests.length,
      icon: Wrench,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'In Progress',
      value: maintenanceRequests.filter(r => r.status === 'in-progress').length,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: 'Pending',
      value: maintenanceRequests.filter(r => r.status === 'pending').length,
      icon: AlertCircle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      label: 'Completed',
      value: maintenanceRequests.filter(r => r.status === 'completed').length,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
  ];

  const staffTaskCounts = staff.map((s: Staff) => {
    const count = maintenanceRequests.filter((r: MaintenanceRequest) => r.assignedTo === s.name && r.status !== 'completed' && r.status !== 'cancelled').length;
    return { ...s, taskCount: count };
  });

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
                    <h3 className="text-3xl font-bold">{stat.value}</h3>
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
        {/* Main Area: Requests Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search maintenance requests..."
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
              <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Maintenance Request</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="room">Room/Location</Label>
                      <Input id="room" placeholder="e.g., 301 or Lobby"
                        value={newRequestData.room}
                        onChange={(e) => setNewRequestData({ ...newRequestData, room: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={newRequestData.category} onValueChange={(v) => setNewRequestData({ ...newRequestData, category: v })}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hvac">HVAC</SelectItem>
                          <SelectItem value="plumbing">Plumbing</SelectItem>
                          <SelectItem value="electrical">Electrical</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="furniture">Furniture</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="issue">Issue Title</Label>
                      <Input id="issue" placeholder="Brief description"
                        value={newRequestData.issue}
                        onChange={(e) => setNewRequestData({ ...newRequestData, issue: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={newRequestData.priority} onValueChange={(v) => setNewRequestData({ ...newRequestData, priority: v })}>
                        <SelectTrigger id="priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="description">Detailed Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Provide detailed information about the issue"
                        rows={4}
                        value={newRequestData.description}
                        onChange={(e) => setNewRequestData({ ...newRequestData, description: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Input id="reported-by" placeholder="Your name"
                        value={newRequestData.reportedBy}
                        onChange={(e) => setNewRequestData({ ...newRequestData, reportedBy: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assign-new">Assign Technician (Optional)</Label>
                      <Select
                        value={newRequestData.assignedToId}
                        onValueChange={(v: string) => setNewRequestData({ ...newRequestData, assignedToId: v })}
                      >
                        <SelectTrigger id="assign-new">
                          <SelectValue placeholder="Select technician" />
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
                    <Button variant="outline" onClick={() => setIsNewRequestOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateRequest}>
                      Create Request
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Requests Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-6 text-slate-500">No maintenance requests found.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request: MaintenanceRequest) => {
                        const statusVal = statusConfig[request.status] || statusConfig.pending;
                        const StatusIcon = statusVal.icon;
                        const priorityVal = priorityConfig[request.priority] || priorityConfig.medium;

                        return (
                          <TableRow key={request.id}>
                            <TableCell>
                              <div className="font-medium">{request.room}</div>
                              <div className="text-xs text-slate-500">{request.id}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-sm">{request.issue}</div>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] h-5">{request.category}</Badge>
                                <Badge className={`text-[10px] h-5 ${priorityVal.color}`}>{request.priority}</Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <StatusIcon className="w-4 h-4" />
                                <Badge className={statusVal.color}>
                                  {request.status}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              {request.assignedTo ? (
                                <div className="text-sm font-medium">{request.assignedTo}</div>
                              ) : (
                                <span className="text-sm text-slate-400 italic">Unassigned</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setViewRequestOpen(true);
                                }}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar Area: Staff & Priority */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Staff</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {staffTaskCounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-slate-500 text-sm">
                  <Users className="w-8 h-8 mb-2 opacity-50" />
                  <p>No maintenance staff found.</p>
                  <p className="text-xs mt-1">Add users with role 'Maintenance'</p>
                </div>
              ) : (
                staffTaskCounts.map((member: Staff & { taskCount: number }, index: number) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-slate-600">
                          {member.taskCount} active tasks
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
              {filteredRequests
                .filter((r: MaintenanceRequest) => (r.priority === 'high' || r.priority === 'critical') && r.status !== 'completed' && r.status !== 'cancelled')
                .map((request: MaintenanceRequest, index: number) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{request.room} - {request.issue}</span>
                      <Badge className="bg-red-100 text-red-800 text-[10px]">{request.priority}</Badge>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-slate-500">{new Date(request.reportedDate).toLocaleDateString()}</span>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                        if (request.status === 'pending') {
                          setAssignDialog({ open: true, request });
                        } else {
                          setUpdateDialog({ open: true, request });
                        }
                      }}>
                        {request.status === 'pending' ? 'Assign' : 'Update'}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              {filteredRequests.filter((r: MaintenanceRequest) => (r.priority === 'high' || r.priority === 'critical') && r.status !== 'completed' && r.status !== 'cancelled').length === 0 && (
                <p className="text-sm text-slate-500 text-center">No urgent priority tasks.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View Request Dialog */}
      <Dialog open={viewRequestOpen} onOpenChange={setViewRequestOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Maintenance Request - {selectedRequest?.id}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Request Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Room/Location:</span>
                      <span className="font-medium">{selectedRequest.room}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Category:</span>
                      <Badge variant="outline">{selectedRequest.category}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Priority:</span>
                      <Badge className={priorityConfig[selectedRequest.priority]?.color}>
                        {selectedRequest.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Status</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Current Status:</span>
                      <Badge className={statusConfig[selectedRequest.status]?.color}>
                        {selectedRequest.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Reported By:</span>
                      <span className="font-medium">{selectedRequest.reportedBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Assigned To:</span>
                      <span className="font-medium">{selectedRequest.assignedTo || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Issue</h3>
                <p className="font-medium">{selectedRequest.issue}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-slate-600">{selectedRequest.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-600">Reported Date:</span>
                  <p className="font-medium">{new Date(selectedRequest.reportedDate).toLocaleString()}</p>
                </div>
                {selectedRequest.completedDate && (
                  <div>
                    <span className="text-slate-600">Completed Date:</span>
                    <p className="font-medium">{new Date(selectedRequest.completedDate).toLocaleString()}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewRequestOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setViewRequestOpen(false);
                  setUpdateDialog({ open: true, request: selectedRequest });
                }}>Edit Request</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialog.open} onOpenChange={(open) => setAssignDialog({ open, request: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Technician - {assignDialog.request?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Select Technician</Label>
              <Select value={assignTechId} onValueChange={setAssignTechId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose a technician" />
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
            <Button variant="outline" onClick={() => setAssignDialog({ open: false, request: null })}>
              Cancel
            </Button>
            <Button onClick={handleAssignTechnician} disabled={!assignTechId}>
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={updateDialog.open} onOpenChange={(open) => setUpdateDialog({ open, request: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Request - {updateDialog.request?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Update Status</Label>
              <Select defaultValue={updateDialog.request?.status} onValueChange={(v) => setUpdateStatusData({ ...updateStatusData, status: v })}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Progress Notes</Label>
              <Textarea
                className="mt-2"
                placeholder="Add notes about the progress..."
                rows={4}
                onChange={(e) => setUpdateStatusData({ ...updateStatusData, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setUpdateDialog({ open: false, request: null })}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRequest}>
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}