/**
 * Script to create an admin user for the application
 * Usage: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=yourpassword tsx scripts/create-admin-user.ts
 */

import { auth } from "@/lib/auth";

async function createAdminUser() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || "Admin";

    if (!email || !password) {
        console.error("❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required");
        console.log("\nUsage:");
        console.log('  ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=yourpassword tsx scripts/create-admin-user.ts');
        console.log('\nOptional:');
        console.log('  ADMIN_NAME="Your Name" (defaults to "Admin")');
        process.exit(1);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.error("❌ Error: Invalid email format");
        process.exit(1);
    }

    // Validate password length
    if (password.length < 8) {
        console.error("❌ Error: Password must be at least 8 characters long");
        process.exit(1);
    }

    try {
        console.log(`Creating admin user: ${email}...`);

        // Use better-auth's built-in API to create user
        const result = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name,
            },
        });

        if (result?.user) {
            console.log(`✅ User created with ID: ${result.user.id}`);
            console.log("\n✨ Admin user created successfully!");
            console.log(`   Email: ${email}`);
            console.log(`   Name: ${name}`);
            console.log("\nYou can now sign in with these credentials.");
        } else {
            console.error("❌ Error: Failed to create user");
            process.exit(1);
        }

    } catch (error: any) {
        console.error("❌ Error creating admin user:", error?.message || error);
        process.exit(1);
    }
}

createAdminUser();
