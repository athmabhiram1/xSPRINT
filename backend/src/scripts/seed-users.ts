/**
 * Database Seed Script with Auth Users
 * 
 * Seeds the database with sample users for testing.
 * Run with: npx ts-node src/scripts/seed-users.ts
 */

import { Role } from '@prisma/client';
import { createUsers } from '../lib/user-utils';
import prisma from '../lib/db';

async function seedUsers() {
    console.log('🌱 Seeding users...\\n');

    const users = [
        {
            name: 'Admin User',
            email: 'admin@xsprint.com',
            password: 'admin123',
            role: Role.ADMIN,
        },
        {
            name: 'John Umpire',
            email: 'umpire@xsprint.com',
            password: 'umpire123',
            role: Role.UMPIRE,
        },
        {
            name: 'Sarah Organizer',
            email: 'organizer@xsprint.com',
            password: 'organizer123',
            role: Role.ORGANIZER,
        },
        {
            name: 'Mike Viewer',
            email: 'viewer@xsprint.com',
            password: 'viewer123',
            role: Role.VIEWER,
        },
    ];

    const results = await createUsers(users);

    console.log('📊 Results:\\n');
    results.forEach((result, index) => {
        if (result.success && result.user) {
            console.log(`✅ Created: ${result.user.email} (${result.user.role})`);
        } else {
            console.log(`⚠️  Skipped: ${result.email} - ${result.error}`);
        }
    });

    console.log('\\n✨ Seeding complete!\\n');
    console.log('📝 Test Credentials:');
    console.log('   Admin:     admin@xsprint.com / admin123');
    console.log('   Umpire:    umpire@xsprint.com / umpire123');
    console.log('   Organizer: organizer@xsprint.com / organizer123');
    console.log('   Viewer:    viewer@xsprint.com / viewer123');
}

seedUsers()
    .catch((error) => {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
