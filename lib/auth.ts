import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    database: prismaAdapter(prisma, {
        provider: "mongodb",
    }),
    emailAndPassword: {
        enabled: true,
        // autoSignIn: true,
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 12 * 60 * 60, // Cache session for 12 hours
        },
    },
    advanced: {
        database: {
            generateId: false, // Let MongoDB generate ObjectId automatically
        },
        cookiePrefix: "better-auth",
        useSecureCookies: process.env.NODE_ENV === "production",
        crossSubDomainCookies: {
            enabled: true,
        },
    },
});
