import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShoppingCart,
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  Package,
  Receipt,
  Minus,
  X,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { posServices } from '../../lib/firebaseServices';
import { useToast } from '../../hooks/use-toast';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface MenuItem {
  id: string;
  name: string;
  category: 'food' | 'beverage' | 'spa' | 'amenity';
  price: number;
  description: string;
  available: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  room: string;
  items: number;
  total: number;
  time: string;
  status: string;
  orderItems: OrderItem[];
}

export function POSManagement() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [roomNumber, setRoomNumber] = useState('');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddMenuItemOpen, setIsAddMenuItemOpen] = useState(false);
  const [isEditMenuItemOpen, setIsEditMenuItemOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    category: 'food' as 'food' | 'beverage' | 'spa' | 'amenity',
    price: 0,
    description: ''
  });
  const { toast } = useToast();

  // Load menu items and orders from Firebase
  useEffect(() => {
    loadMenuItems();
    loadOrders();
  }, []);

  const loadMenuItems = async () => {
    try {
      const result = await posServices.getMenuItems();
      if (result.success && result.data) {
        setMenu(result.data as MenuItem[]);
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const result = await posServices.getOrders(10);
      if (result.success && result.data) {
        setOrders(result.data as Order[]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const addToCart = (item: MenuItem, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const existingItem = cart.find(i => i.id === item.id);
    if (existingItem) {
      setCart(cart.map(i =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemId: string, change: number) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const addMenuItem = async () => {
    if (!newMenuItem.name || !newMenuItem.price || !newMenuItem.description) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const menuItemData = {
        name: newMenuItem.name,
        category: newMenuItem.category,
        price: newMenuItem.price,
        description: newMenuItem.description,
        available: true
      };

      const menuRef = collection(db, 'menuItems');
      await addDoc(menuRef, menuItemData);

      toast({
        title: 'Success',
        description: 'Menu item added successfully',
      });

      setNewMenuItem({ name: '', category: 'food', price: 0, description: '' });
      setIsAddMenuItemOpen(false);
      loadMenuItems();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add menu item',
        variant: 'destructive',
      });
    }
  };

  const updateMenuItem = async () => {
    if (!editingMenuItem) return;

    try {
      const menuRef = doc(db, 'menuItems', editingMenuItem.id);
      await updateDoc(menuRef, {
        name: editingMenuItem.name,
        category: editingMenuItem.category,
        price: editingMenuItem.price,
        description: editingMenuItem.description,
      });

      toast({
        title: 'Success',
        description: 'Menu item updated successfully',
      });

      setEditingMenuItem(null);
      setIsEditMenuItemOpen(false);
      loadMenuItems();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update menu item',
        variant: 'destructive',
      });
    }
  };

  const deleteMenuItem = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const menuRef = doc(db, 'menuItems', itemId);
      await deleteDoc(menuRef);

      toast({
        title: 'Success',
        description: 'Menu item deleted successfully',
      });

      loadMenuItems();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete menu item',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMenuItem(item);
    setIsEditMenuItemOpen(true);
  };

  const completeOrder = async () => {
    if (!roomNumber || cart.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add items and enter room number',
        variant: 'destructive',
      });
      return;
    }

    try {
      const orderItems = cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));

      const orderData = {
        room: roomNumber,
        items: cart.reduce((sum, item) => sum + item.quantity, 0),
        total: parseFloat(total.toFixed(2)),
        status: 'preparing',
        orderItems: orderItems
      };

      await posServices.createOrder(orderData);

      toast({
        title: 'Success',
        description: 'Order placed successfully',
      });

      // Reset cart and room number
      setCart([]);
      setRoomNumber('');

      // Reload orders
      loadOrders();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to place order',
        variant: 'destructive',
      });
    }
  };

  const filteredItems = menu.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  // Calculate stats from orders
  const todaySales = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const avgOrder = totalOrders > 0 ? todaySales / totalOrders : 0;
  const itemsSold = orders.reduce((sum, order) => sum + order.items, 0);

  const stats = [
    { label: 'Today\'s Sales', value: `$${todaySales.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Orders', value: totalOrders.toString(), icon: Receipt, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Avg. Order', value: `$${avgOrder.toFixed(0)}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Items Sold', value: itemsSold.toString(), icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="p-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Items */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Menu Items</CardTitle>
                <div className="flex gap-2 items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Dialog open={isAddMenuItemOpen} onOpenChange={setIsAddMenuItemOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Menu Item</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="item-name">Item Name</Label>
                          <Input
                            id="item-name"
                            placeholder="Enter item name"
                            value={newMenuItem.name}
                            onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="item-category">Category</Label>
                          <Select
                            value={newMenuItem.category}
                            onValueChange={(value: 'food' | 'beverage' | 'spa' | 'amenity') =>
                              setNewMenuItem({ ...newMenuItem, category: value })
                            }
                          >
                            <SelectTrigger id="item-category">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="food">Food</SelectItem>
                              <SelectItem value="beverage">Beverage</SelectItem>
                              <SelectItem value="spa">Spa</SelectItem>
                              <SelectItem value="amenity">Amenity</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="item-price">Price ($)</Label>
                          <Input
                            id="item-price"
                            type="number"
                            placeholder="0.00"
                            value={newMenuItem.price || ''}
                            onChange={(e) => setNewMenuItem({ ...newMenuItem, price: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="item-description">Description</Label>
                          <Textarea
                            id="item-description"
                            placeholder="Enter item description"
                            value={newMenuItem.description}
                            onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddMenuItemOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={addMenuItem}>Add Item</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-slate-500">Loading menu items...</div>
              ) : (
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                  <TabsList className="grid w-full grid-cols-5 mb-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="food">Food</TabsTrigger>
                    <TabsTrigger value="beverage">Drinks</TabsTrigger>
                    <TabsTrigger value="spa">Spa</TabsTrigger>
                    <TabsTrigger value="amenity">Amenities</TabsTrigger>
                  </TabsList>

                  <TabsContent value={selectedCategory} className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
                      {filteredItems.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors relative group"
                        >
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={(e) => openEditDialog(item, e)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 hover:text-red-600"
                              onClick={(e) => deleteMenuItem(item.id, e)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex justify-between items-start mb-2 cursor-pointer" onClick={() => addToCart(item)}>
                            <div className="flex-1 pr-16">
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-slate-600">{item.description}</p>
                            </div>
                            <Badge variant="outline" className="ml-2">{item.category}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold">${item.price}</span>
                            <Button size="sm" variant="ghost" onClick={(e) => addToCart(item, e)}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart & Checkout */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Current Order
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Room Number */}
              <div>
                <label className="text-sm font-medium mb-2 block">Room Number</label>
                <Input
                  placeholder="Enter room number"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                />
              </div>

              <Separator />

              {/* Cart Items */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Cart is empty</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-slate-600">${item.price} each</div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="h-7 w-7 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="h-7 w-7 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <>
                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Tax (10%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-xl">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <Button className="w-full" size="lg" disabled={!roomNumber} onClick={completeOrder}>
                      Complete Order
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setCart([])}
                    >
                      Clear Cart
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {orders.length === 0 ? (
                <div className="text-center py-4 text-slate-500">No recent orders</div>
              ) : (
                orders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <div className="font-medium">{order.orderId || order.id}</div>
                        <div className="text-sm text-slate-600">Room {order.room} • {order.items} items</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">{order.time}</span>
                      <span className="font-bold">${order.total}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Menu Item Dialog */}
      <Dialog open={isEditMenuItemOpen} onOpenChange={setIsEditMenuItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
          </DialogHeader>
          {editingMenuItem && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-item-name">Item Name</Label>
                <Input
                  id="edit-item-name"
                  placeholder="Enter item name"
                  value={editingMenuItem.name}
                  onChange={(e) => setEditingMenuItem({ ...editingMenuItem, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-item-category">Category</Label>
                <Select
                  value={editingMenuItem.category}
                  onValueChange={(value: 'food' | 'beverage' | 'spa' | 'amenity') =>
                    setEditingMenuItem({ ...editingMenuItem, category: value })
                  }
                >
                  <SelectTrigger id="edit-item-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="beverage">Beverage</SelectItem>
                    <SelectItem value="spa">Spa</SelectItem>
                    <SelectItem value="amenity">Amenity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-item-price">Price ($)</Label>
                <Input
                  id="edit-item-price"
                  type="number"
                  placeholder="0.00"
                  value={editingMenuItem.price}
                  onChange={(e) => setEditingMenuItem({ ...editingMenuItem, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-item-description">Description</Label>
                <Textarea
                  id="edit-item-description"
                  placeholder="Enter item description"
                  value={editingMenuItem.description}
                  onChange={(e) => setEditingMenuItem({ ...editingMenuItem, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditMenuItemOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateMenuItem}>Update Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.orderId || selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-600">Room Number</p>
                  <p className="font-medium">{selectedOrder.room}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Time</p>
                  <p className="font-medium">{selectedOrder.time}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold">Order Items</h4>
                {selectedOrder.orderItems?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-slate-600">Qty: {item.quantity} × ${item.price}</p>
                    </div>
                    <p className="font-bold">${(item.quantity * item.price).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span>${(selectedOrder.total / 1.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tax (10%)</span>
                  <span>${(selectedOrder.total - selectedOrder.total / 1.1).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-xl">${selectedOrder.total}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}