/**
 * Firebase Database Seeding Script
 * 
 * This script populates your Firebase Firestore with initial sample data
 * Run this ONCE after setting up your Firebase project to initialize the database
 * 
 * Usage:
 * 1. Ensure Firebase SDK is installed
 * 2. Run: npx ts-node src/utils/seedDatabase.ts
 * OR import and call from your app's initialization
 */

import { collection, doc, setDoc, addDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../lib/firebase';

const ADMIN_EMAIL = 'admin@arhotels.com';
const ADMIN_PASSWORD = 'Admin123!'; // Change this in production!

export async function seedDatabase() {
    console.log('🌱 Starting database seeding...');

    try {
        // 1. CREATE ADMIN USER
        console.log('Creating admin user...');
        try {
            await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
            console.log(`✅ Admin user created: ${ADMIN_EMAIL}`);
            console.log(`📧 Password: ${ADMIN_PASSWORD}`);
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                console.log('⚠️  Admin user already exists');
            } else {
                throw error;
            }
        }

        // 2. SEED ROOMS
        console.log('\nSeeding rooms...');
        const roomsData = [
            {
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
        ];

        for (const roomData of roomsData) {
            await addDoc(collection(db, 'rooms'), roomData);
        }
        console.log(`✅ Seeded ${roomsData.length} rooms`);

        // 3. SEED MENU ITEMS (POS)
        console.log('\nSeeding menu items...');
        const menuItems = [
            { name: 'Club Sandwich', category: 'food', price: 18, description: 'Triple decker with bacon', available: true },
            { name: 'Caesar Salad', category: 'food', price: 14, description: 'Fresh romaine lettuce', available: true },
            { name: 'Grilled Salmon', category: 'food', price: 32, description: 'With seasonal vegetables', available: true },
            { name: 'Cappuccino', category: 'beverage', price: 5, description: 'Espresso with steamed milk', available: true },
            { name: 'Mojito', category: 'beverage', price: 12, description: 'Classic Cuban cocktail', available: true },
            { name: 'Spa Massage (60min)', category: 'spa', price: 120, description: 'Full body relaxation', available: true },
        ];

        for (const item of menuItems) {
            await addDoc(collection(db, 'menuItems'), item);
        }
        console.log(`✅ Seeded ${menuItems.length} menu items`);

        // 4. SEED GUESTS
        console.log('\nSeeding guests...');
        const guests = [
            {
                name: 'John Smith',
                email: 'john@email.com',
                phone: '+1 234 567 890',
                location: 'New York, USA',
                visits: 8,
                totalSpent: 5640,
                rating: 4.8,
                status: 'vip',
                lastVisit: '2025-09-15',
                preferences: ['Late checkout', 'High floor', 'King bed'],
                notes: 'Prefers rooms with city view. Allergic to feather pillows.',
            },
            {
                name: 'Sarah Johnson',
                email: 'sarah@email.com',
                phone: '+1 234 567 891',
                location: 'Los Angeles, USA',
                visits: 3,
                totalSpent: 1850,
                rating: 4.5,
                status: 'regular',
                lastVisit: '2025-08-22',
                preferences: ['Ocean view', 'Queen bed'],
                notes: 'Business traveler. Requires early check-in.',
            },
        ];

        for (const guest of guests) {
            await addDoc(collection(db, 'guests'), guest);
        }
        console.log(`✅ Seeded ${guests.length} guests`);

        // 5. SEED USERS (Staff)
        console.log('\nSeeding staff users...');
        const users = [
            { name: 'Admin User', employeeId: 'EMP001', phone: '+1 555-0001', email: 'admin@arhotels.com', address: '123 Main St, NY', role: 'Admin', status: 'active' },
            { name: 'John Manager', employeeId: 'EMP002', phone: '+1 555-0002', email: 'john@arhotels.com', address: '456 Park Ave, NY', role: 'Manager', status: 'active' },
            { name: 'Sarah Staff', employeeId: 'EMP003', phone: '+1 555-0003', email: 'sarah@arhotels.com', address: '789 Oak St, NY', role: 'Receptionist', status: 'active' },
        ];

        for (const user of users) {
            await addDoc(collection(db, 'users'), user);
        }
        console.log(`✅ Seeded ${users.length} staff users`);

        // 6. SEED HOTEL PROFILE
        console.log('\nSeeding hotel profile...');
        await setDoc(doc(db, 'settings', 'hotelProfile'), {
            hotelName: 'AR Hotels - Downtown',
            hotelType: 'luxury',
            totalRooms: 100,
            starRating: 5,
            email: 'contact@arhotels.com',
            phone: '+1 (555) 123-4567',
            website: 'https://arhotels.com',
            timezone: 'est',
            address: '123 Main Street',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            description: 'Experience luxury and comfort at AR Hotels Downtown. Our modern facilities and exceptional service ensure an unforgettable stay.',
        });
        console.log('✅ Seeded hotel profile');

        // 7. SEED PAGE SETTINGS
        console.log('\nSeeding page settings...');
        await setDoc(doc(db, 'settings', 'pageSettings'), {
            pages: [
                { id: 'dashboard', enabled: true },
                { id: 'bookings', enabled: true },
                { id: 'guests', enabled: true },
                { id: 'rooms', enabled: true },
                { id: 'housekeeping', enabled: true },
                { id: 'maintenance', enabled: true },
                { id: 'pos', enabled: true },
                { id: 'revenue', enabled: true },
                { id: 'settings', enabled: true },
            ],
            updatedAt: new Date().toISOString()
        });
        console.log('✅ Seeded page settings');

        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📝 LOGIN CREDENTIALS:');
        console.log(`   Email: ${ADMIN_EMAIL}`);
        console.log(`   Password: ${ADMIN_PASSWORD}`);
        console.log('\n⚠️  IMPORTANT: Change the admin password after first login!');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
}

// Auto-run if executed directly
if (require.main === module) {
    seedDatabase()
        .then(() => {
            console.log('\nSeeding complete. You can now log in to the application.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\nSeeding failed:', error);
            process.exit(1);
        });
}
