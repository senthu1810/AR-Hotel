import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    onSnapshot,
    QueryConstraint
} from 'firebase/firestore';
import {
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword,
    User
} from 'firebase/auth';
import { db, auth } from './firebase';

// ============================================================================
// AUTHENTICATION SERVICES
// ============================================================================

export const authServices = {
    /**
     * Login user with email and password
     */
    async loginUser(email: string, password: string) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Logout current user
     */
    async logoutUser() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Get current authenticated user
     */
    getCurrentUser(): User | null {
        return auth.currentUser;
    },

    /**
     * Create new user (for admin use - simple)
     */
    async createUser(email: string, password: string) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Register new user (Public Sign Up)
     * Creates Auth account AND Firestore Profile with 'pending' status
     */
    async registerUser(userData: any, password: string) {
        try {
            // 1. Create User in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);
            const user = userCredential.user;

            // 2. Create User Profile in Firestore
            const { setDoc, doc, Timestamp } = await import('firebase/firestore');
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                address: userData.address,
                role: null, // No role until approved
                status: 'pending',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });

            return { success: true, user };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Get User Profile status
     */
    /**
     * Get User Profile status
     */
    async getUserProfile(uid: string) {
        try {
            const { doc, getDoc } = await import('firebase/firestore');
            const userRef = doc(db, 'users', uid);
            const snapshot = await getDoc(userRef);
            if (snapshot.exists()) {
                return { success: true, data: snapshot.data() };
            }
            return { success: false, error: 'User profile not found' };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Change user password
     */
    async changePassword(currentPassword: string, newPassword: string) {
        try {
            const user = auth.currentUser;
            if (!user || !user.email) return { success: false, error: "No user logged in" };

            // 1. Re-authenticate
            const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import('firebase/auth');
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // 2. Update Password
            await updatePassword(user, newPassword);

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
};

// ... existing code ...




// ============================================================================
// ROOMS SERVICES
// ============================================================================

export const roomsServices = {
    /**
     * Get all rooms
     */
    async getRooms() {
        try {
            const roomsRef = collection(db, 'rooms');
            const snapshot = await getDocs(roomsRef);
            const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return { success: true, data: rooms };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Add new room
     */
    async addRoom(roomData: any) {
        try {
            const roomsRef = collection(db, 'rooms');
            const docRef = await addDoc(roomsRef, {
                ...roomData,
                createdAt: Timestamp.now()
            });
            return { success: true, id: docRef.id };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Update room
     */
    async updateRoom(roomId: string, roomData: any) {
        try {
            const roomRef = doc(db, 'rooms', roomId);
            await updateDoc(roomRef, {
                ...roomData,
                updatedAt: Timestamp.now()
            });
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Delete room
     */
    async deleteRoom(roomId: string) {
        try {
            const roomRef = doc(db, 'rooms', roomId);
            await deleteDoc(roomRef);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Listen to rooms changes in real-time
     */
    subscribeToRooms(callback: (rooms: any[]) => void) {
        const roomsRef = collection(db, 'rooms');
        return onSnapshot(roomsRef, (snapshot) => {
            const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(rooms);
        });
    }
};

// ============================================================================
// BOOKINGS SERVICES
// ============================================================================

export const bookingsServices = {
    /**
     * Get all bookings
     */
    async getBookings() {
        try {
            const bookingsRef = collection(db, 'bookings');
            const snapshot = await getDocs(query(bookingsRef, orderBy('checkIn', 'desc')));
            const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return { success: true, data: bookings };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Add new booking
     */
    async addBooking(bookingData: any) {
        try {
            const bookingsRef = collection(db, 'bookings');
            const docRef = await addDoc(bookingsRef, {
                ...bookingData,
                createdAt: Timestamp.now()
            });
            return { success: true, id: docRef.id };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Update booking
     */
    async updateBooking(bookingId: string, bookingData: any) {
        try {
            const bookingRef = doc(db, 'bookings', bookingId);
            await updateDoc(bookingRef, {
                ...bookingData,
                updatedAt: Timestamp.now()
            });
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Get booking by ID
     */
    async getBookingById(bookingId: string) {
        try {
            const bookingRef = doc(db, 'bookings', bookingId);
            const snapshot = await getDoc(bookingRef);
            if (snapshot.exists()) {
                return { success: true, data: { id: snapshot.id, ...snapshot.data() } };
            } else {
                return { success: false, error: 'Booking not found' };
            }
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
};

// ============================================================================
// GUESTS SERVICES
// ============================================================================

export const guestsServices = {
    /**
     * Get all guests
     */
    async getGuests() {
        try {
            const guestsRef = collection(db, 'guests');
            const snapshot = await getDocs(guestsRef);
            const guests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return { success: true, data: guests };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Add new guest
     */
    async addGuest(guestData: any) {
        try {
            const guestsRef = collection(db, 'guests');
            const docRef = await addDoc(guestsRef, {
                ...guestData,
                createdAt: Timestamp.now()
            });
            return { success: true, id: docRef.id };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Update guest
     */
    async updateGuest(guestId: string, guestData: any) {
        try {
            const guestRef = doc(db, 'guests', guestId);
            await updateDoc(guestRef, {
                ...guestData,
                updatedAt: Timestamp.now()
            });
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Get guest by ID
     */
    async getGuestById(guestId: string) {
        try {
            const guestRef = doc(db, 'guests', guestId);
            const snapshot = await getDoc(guestRef);
            if (snapshot.exists()) {
                return { success: true, data: { id: snapshot.id, ...snapshot.data() } };
            } else {
                return { success: false, error: 'Guest not found' };
            }
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
};

// ===========================================================================================
// HOUSEKEEPING SERVICES
// ============================================================================

export const housekeepingServices = {
    /**
     * Get all housekeeping tasks (returns rooms with housekeeping status)
     */
    async getTasks() {
        try {
            const roomsRef = collection(db, 'rooms');
            const snapshot = await getDocs(roomsRef);
            const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return { success: true, data: tasks };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Update task status
     */
    async updateTaskStatus(roomId: string, status: string, assignedTo?: string, priority?: string) {
        try {
            const roomRef = doc(db, 'rooms', roomId);
            const updateData: any = {
                cleaningStatus: status,
                updatedAt: Timestamp.now()
            };
            if (assignedTo) {
                updateData.assignedCleanerName = assignedTo;
            }
            if (priority) {
                updateData.cleaningPriority = priority;
            }
            if (status === 'clean') {
                updateData.lastCleanedAt = new Date().toISOString();
            }
            await updateDoc(roomRef, updateData);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Get housekeeping staff
     */
    async getStaff() {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('role', '==', 'Cleaner'));
            const snapshot = await getDocs(q);
            const staff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return { success: true, data: staff };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
};

// ============================================================================
// MAINTENANCE SERVICES
// ============================================================================

export const maintenanceServices = {
    /**
     * Get all maintenance requests
     */
    async getRequests() {
        try {
            const requestsRef = collection(db, 'maintenance');
            const snapshot = await getDocs(query(requestsRef, orderBy('reportedDate', 'desc')));
            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return { success: true, data: requests };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Add new maintenance request
     */
    async addRequest(requestData: any) {
        try {
            const requestsRef = collection(db, 'maintenance');
            const docRef = await addDoc(requestsRef, {
                ...requestData,
                reportedDate: new Date().toISOString(),
                createdAt: Timestamp.now()
            });
            return { success: true, id: docRef.id };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Update maintenance request
     */
    async updateRequest(requestId: string, requestData: any) {
        try {
            const requestRef = doc(db, 'maintenance', requestId);
            await updateDoc(requestRef, {
                ...requestData,
                updatedAt: Timestamp.now()
            });
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Assign technician to request
     */
    async assignTechnician(requestId: string, technicianName: string) {
        try {
            const requestRef = doc(db, 'maintenance', requestId);
            await updateDoc(requestRef, {
                assignedTo: technicianName,
                status: 'in-progress',
                updatedAt: Timestamp.now()
            });
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Get maintenance staff
     */
    async getStaff() {
        try {
            const usersRef = collection(db, 'users');
            // Matching the role string used in SettingsManagement ('Maintenance Staff')
            const q = query(usersRef, where('role', '==', 'Maintenance Staff'));
            const snapshot = await getDocs(q);
            const staff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return { success: true, data: staff };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
};

// ============================================================================
// POS SERVICES
// ============================================================================

export const posServices = {
    /**
     * Get all menu items
     */
    async getMenuItems() {
        try {
            const menuRef = collection(db, 'menuItems');
            const snapshot = await getDocs(menuRef);
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return { success: true, data: items };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Create new order with custom order ID
     */
    async createOrder(orderData: any) {
        try {
            // Get and increment order counter
            const counterRef = doc(db, 'settings', 'orderCounter');
            const counterSnap = await getDoc(counterRef);

            let orderNumber = 1;
            if (counterSnap.exists()) {
                orderNumber = (counterSnap.data().lastOrderNumber || 0) + 1;
            }

            // Generate custom order ID (e.g., OD0001, OD0002)
            const customOrderId = `OD${orderNumber.toString().padStart(4, '0')}`;

            // Update counter
            await updateDoc(counterRef, {
                lastOrderNumber: orderNumber,
                updatedAt: Timestamp.now()
            }).catch(async () => {
                // If counter doesn't exist, create it
                await addDoc(collection(db, 'settings'), {
                    lastOrderNumber: orderNumber,
                    createdAt: Timestamp.now()
                });
            });

            // Create order with custom ID
            const ordersRef = collection(db, 'orders');
            const docRef = await addDoc(ordersRef, {
                ...orderData,
                orderId: customOrderId,
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                createdAt: Timestamp.now()
            });

            return { success: true, id: docRef.id, orderId: customOrderId };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Get recent orders
     */
    async getOrders(limit: number = 10) {
        try {
            const ordersRef = collection(db, 'orders');
            const snapshot = await getDocs(query(ordersRef, orderBy('createdAt', 'desc')));
            const orders = snapshot.docs.slice(0, limit).map(doc => ({ id: doc.id, ...doc.data() }));
            return { success: true, data: orders };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
};

// ============================================================================
// SETTINGS SERVICES
// ============================================================================

export const settingsServices = {
    /**
     * Get hotel profile
     */
    async getHotelProfile() {
        try {
            const profileRef = doc(db, 'settings', 'hotelProfile');
            const snapshot = await getDoc(profileRef);
            if (snapshot.exists()) {
                return { success: true, data: snapshot.data() };
            } else {
                return { success: false, error: 'Profile not found' };
            }
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Update hotel profile
     */
    async updateHotelProfile(profileData: any) {
        try {
            const profileRef = doc(db, 'settings', 'hotelProfile');
            await updateDoc(profileRef, {
                ...profileData,
                updatedAt: Timestamp.now()
            });
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Get user profile by ID
     */
    async getUserProfile(userId: string) {
        try {
            const userRef = doc(db, 'users', userId);
            const snapshot = await getDoc(userRef);
            if (snapshot.exists()) {
                return { success: true, data: snapshot.data() };
            } else {
                return { success: false, error: 'User profile not found' };
            }
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Get all users
     */
    async getUsers() {
        try {
            const usersRef = collection(db, 'users');
            const snapshot = await getDocs(usersRef);
            const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return { success: true, data: users };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Add new user
     */
    async addUser(userData: any) {
        try {
            const usersRef = collection(db, 'users');
            const docRef = await addDoc(usersRef, {
                ...userData,
                createdAt: Timestamp.now()
            });
            return { success: true, id: docRef.id };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Update user
     */
    async updateUser(userId: string, userData: any) {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                ...userData,
                updatedAt: Timestamp.now()
            });
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Delete user
     */
    async deleteUser(userId: string) {
        try {
            const userRef = doc(db, 'users', userId);
            await deleteDoc(userRef);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Get role permissions
     */
    async getRolePermissions() {
        try {
            const permissionsRef = doc(db, 'settings', 'rolePermissions');
            const snapshot = await getDoc(permissionsRef);
            if (snapshot.exists()) {
                return { success: true, data: snapshot.data() };
            } else {
                return { success: false, error: 'Permissions not found' };
            }
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Update role permissions
     */
    async updateRolePermissions(permissionsData: any) {
        try {
            const permissionsRef = doc(db, 'settings', 'rolePermissions');
            await updateDoc(permissionsRef, {
                ...permissionsData,
                updatedAt: Timestamp.now()
            });
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Get page settings
     */
    async getPageSettings() {
        try {
            const pageSettingsRef = doc(db, 'settings', 'pageSettings');
            const snapshot = await getDoc(pageSettingsRef);
            if (snapshot.exists()) {
                return { success: true, data: snapshot.data() };
            } else {
                return { success: false, error: 'Page settings not found' };
            }
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Update page settings
     */
    async updatePageSettings(pageSettingsData: any) {
        try {
            const pageSettingsRef = doc(db, 'settings', 'pageSettings');
            await updateDoc(pageSettingsRef, {
                ...pageSettingsData,
                updatedAt: Timestamp.now()
            }).catch(async () => {
                // If doc doesn't exist, create it (setDoc)
                const { setDoc } = await import('firebase/firestore');
                await setDoc(pageSettingsRef, {
                    ...pageSettingsData,
                    updatedAt: Timestamp.now()
                });
            });
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Get notification preferences
     */
    async getNotificationPreferences() {
        try {
            const prefsRef = doc(db, 'settings', 'notificationPreferences');
            const snapshot = await getDoc(prefsRef);
            if (snapshot.exists()) {
                return { success: true, data: snapshot.data() };
            } else {
                return { success: false, error: 'Preferences not found' };
            }
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Update notification preferences
     */
    async updateNotificationPreferences(prefsData: any) {
        try {
            const prefsRef = doc(db, 'settings', 'notificationPreferences');
            await updateDoc(prefsRef, {
                ...prefsData,
                updatedAt: Timestamp.now()
            }).catch(async () => {
                const { setDoc } = await import('firebase/firestore');
                await setDoc(prefsRef, {
                    ...prefsData,
                    updatedAt: Timestamp.now()
                });
            });
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Approve user with permissions
     */
    async approveUser(userId: string, role: string, employeeId: string, permissions?: any) {
        try {
            const userRef = doc(db, 'users', userId);
            const updateData: any = {
                status: 'active',
                role,
                employeeId,
                updatedAt: Timestamp.now()
            };

            if (permissions) {
                updateData.permissions = permissions;
            }

            await updateDoc(userRef, updateData);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Reject/Decline user
     */
    async rejectUser(userId: string) {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                status: 'rejected',
                updatedAt: Timestamp.now()
            });
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Get user permissions
     */
    async getUserPermissions(userId: string) {
        try {
            const userRef = doc(db, 'users', userId);
            const snapshot = await getDoc(userRef);
            if (snapshot.exists() && snapshot.data().permissions) {
                return { success: true, data: snapshot.data().permissions };
            } else {
                return { success: false, error: 'Permissions not found' };
            }
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Update user permissions
     */
    async updateUserPermissions(userId: string, permissions: any) {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                permissions,
                updatedAt: Timestamp.now()
            });
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
};

// ============================================================================
// NOTIFICATIONS SERVICES
// ============================================================================

export const notificationsServices = {
    /**
     * Get notifications for current user
     */
    async getNotifications() {
        try {
            const notifRef = collection(db, 'notifications');
            const snapshot = await getDocs(query(notifRef, orderBy('createdAt', 'desc')));
            const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return { success: true, data: notifications };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string) {
        try {
            const notifRef = doc(db, 'notifications', notificationId);
            await updateDoc(notifRef, {
                read: true,
                updatedAt: Timestamp.now()
            });
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Delete notification
     */
    async deleteNotification(notificationId: string) {
        try {
            const notifRef = doc(db, 'notifications', notificationId);
            await deleteDoc(notifRef);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Clear all notifications
     */
    async clearAll() {
        try {
            const notifRef = collection(db, 'notifications');
            const snapshot = await getDocs(notifRef);
            const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Add new notification
     */
    async addNotification(notificationData: any) {
        try {
            const notifRef = collection(db, 'notifications');
            const docRef = await addDoc(notifRef, {
                ...notificationData,
                read: false,
                createdAt: Timestamp.now()
            });
            return { success: true, id: docRef.id };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
};
