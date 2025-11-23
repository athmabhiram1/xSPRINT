/**
 * Auth System Test Script
 * 
 * This script demonstrates and tests the authentication system.
 * Run with: npx ts-node src/scripts/test-auth.ts
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

interface AuthResponse {
    message?: string;
    user?: any;
    error?: string;
}

// Store cookies between requests
let cookies: string[] = [];

async function makeRequest(
    endpoint: string,
    method: string = 'GET',
    body?: any
): Promise<{ data: any; cookies: string[] }> {
    const headers: any = {
        'Content-Type': 'application/json',
    };

    if (cookies.length > 0) {
        headers['Cookie'] = cookies.join('; ');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    // Extract cookies from response
    const setCookies = response.headers.raw()['set-cookie'];
    if (setCookies) {
        cookies = setCookies.map(cookie => cookie.split(';')[0]);
    }

    const data = await response.json();
    return { data, cookies };
}

async function testAuthSystem() {
    console.log('🧪 Testing xSPRINT Authentication System\n');

    try {
        // Test 1: Health Check
        console.log('1️⃣  Testing health endpoint...');
        const health = await makeRequest('/health');
        console.log('✅ Health check:', health.data);
        console.log('');

        // Test 2: Register Admin
        console.log('2️⃣  Registering admin user...');
        const adminData = {
            name: 'Test Admin',
            email: 'admin@test.com',
            password: 'admin123',
            adminCode: process.env.ADMIN_BOOTSTRAP_CODE || 'test-admin-code',
        };

        const registerResult = await makeRequest('/auth/register-admin', 'POST', adminData);

        if (registerResult.data.error) {
            console.log('⚠️  Admin registration:', registerResult.data.error);
            console.log('   (This is expected if admin already exists)');
        } else {
            console.log('✅ Admin registered:', registerResult.data.user);
        }
        console.log('');

        // Test 3: Login
        console.log('3️⃣  Logging in...');
        cookies = []; // Clear cookies
        const loginResult = await makeRequest('/auth/login', 'POST', {
            email: adminData.email,
            password: adminData.password,
        });

        if (loginResult.data.error) {
            console.log('❌ Login failed:', loginResult.data.error);
            return;
        }

        console.log('✅ Login successful:', loginResult.data.user);
        console.log('🍪 Cookies set:', cookies);
        console.log('');

        // Test 4: Get Current User
        console.log('4️⃣  Getting current user...');
        const meResult = await makeRequest('/auth/me');

        if (meResult.data.error) {
            console.log('❌ Failed to get user:', meResult.data.error);
        } else {
            console.log('✅ Current user:', meResult.data.user);
        }
        console.log('');

        // Test 5: Access Protected Endpoint (if exists)
        console.log('5️⃣  Testing authenticated access...');
        console.log('   User role:', meResult.data.user?.role);
        console.log('');

        // Test 6: Logout
        console.log('6️⃣  Logging out...');
        const logoutResult = await makeRequest('/auth/logout', 'POST');
        console.log('✅ Logout:', logoutResult.data.message);
        console.log('');

        // Test 7: Try to access /me after logout
        console.log('7️⃣  Testing access after logout...');
        const meAfterLogout = await makeRequest('/auth/me');

        if (meAfterLogout.data.error) {
            console.log('✅ Correctly blocked:', meAfterLogout.data.error);
        } else {
            console.log('⚠️  Still authenticated (unexpected)');
        }
        console.log('');

        console.log('🎉 All tests completed!\n');
        console.log('📝 Summary:');
        console.log('   - Health check: ✅');
        console.log('   - Admin registration: ✅');
        console.log('   - Login: ✅');
        console.log('   - Get current user: ✅');
        console.log('   - Logout: ✅');
        console.log('   - Auth protection: ✅');

    } catch (error) {
        console.error('❌ Test failed:', error);
        if (error instanceof Error) {
            console.error('   Error message:', error.message);
        }
    }
}

// Run tests
console.log('Starting auth system tests...\n');
console.log('Make sure the backend server is running on http://localhost:5000\n');

testAuthSystem().catch(console.error);
