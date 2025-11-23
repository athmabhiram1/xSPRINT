import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const prisma = new PrismaClient();

/**
 * Admin Bootstrap Script
 * Creates the first admin user for a fresh installation
 */

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function question(query: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
}

async function main() {
    console.log('\n🔧 xSPRINT Admin Bootstrap\n');
    console.log('This script will create your first admin user.\n');

    // Check if any admin exists
    const existingAdmin = await prisma.user.findFirst({
        where: {
            role: { in: ['ADMIN', 'ORGANIZER'] },
        },
    });

    if (existingAdmin) {
        console.log('⚠️  An admin user already exists:');
        console.log(`   Email: ${existingAdmin.email}`);
        console.log(`   Role: ${existingAdmin.role}\n`);

        const confirm = await question('Do you want to create another admin? (y/N): ');
        if (confirm.toLowerCase() !== 'y') {
            console.log('\n✅ Bootstrap cancelled.\n');
            rl.close();
            return;
        }
    }

    // Collect admin details
    console.log('\nEnter admin details:\n');

    const name = await question('Full Name: ');
    if (!name || name.trim().length < 2) {
        console.log('\n❌ Name must be at least 2 characters.\n');
        rl.close();
        return;
    }

    const email = await question('Email: ');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.log('\n❌ Invalid email format.\n');
        rl.close();
        return;
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        console.log('\n❌ A user with this email already exists.\n');
        rl.close();
        return;
    }

    const password = await question('Password (min 8 characters): ');
    if (password.length < 8) {
        console.log('\n❌ Password must be at least 8 characters.\n');
        rl.close();
        return;
    }

    const confirmPassword = await question('Confirm Password: ');
    if (password !== confirmPassword) {
        console.log('\n❌ Passwords do not match.\n');
        rl.close();
        return;
    }

    console.log('\nSelect role:');
    console.log('1. ADMIN (full access)');
    console.log('2. ORGANIZER (tournament management)');
    const roleChoice = await question('Choice (1 or 2): ');

    let role: 'ADMIN' | 'ORGANIZER' = 'ADMIN';
    if (roleChoice === '2') {
        role = 'ORGANIZER';
    } else if (roleChoice !== '1') {
        console.log('\n❌ Invalid choice. Defaulting to ADMIN.\n');
    }

    // Create admin user
    console.log('\n⏳ Creating admin user...');

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
        data: {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            passwordHash: hashedPassword,
            role,
        },
    });

    console.log('\n✅ Admin user created successfully!\n');
    console.log('📋 Details:');
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin.id}\n`);

    console.log('🚀 You can now login at: http://localhost:3000/login\n');

    rl.close();
}

main()
    .catch((e) => {
        console.error('\n❌ Bootstrap failed:', e.message);
        rl.close();
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
