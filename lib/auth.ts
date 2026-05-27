import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { organization } from 'better-auth/plugins'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'mongodb' }),
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'],
  advanced: {
    database: {
      // MongoDB ObjectId = 24 hex chars (12 bytes). BetterAuth gera strings
      // incompatíveis por padrão; forçamos hex de 24 chars aqui.
      generateId: () => randomBytes(12).toString('hex'),
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      requireEmailVerificationOnInvitation: false,
    }),
  ],
})

export type Session = typeof auth.$Infer.Session
