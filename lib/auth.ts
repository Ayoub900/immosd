import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "mongodb",
    }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day (update session every day)
    },
    advanced: {
        database: {
            generateId: false, // Let MongoDB generate ObjectId automatically
        },
    },
    trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
});
