# User Authentication Implementation Plan

## Current State

✅ Database schema ready (User model with email, name, role)  
✅ NextAuth v4.24.13 already installed  
✅ Hardcoded user (`'admin@local'`) in API routes  
✅ User foreign keys on Rating table  

## Implementation Complexity: MEDIUM
**Estimated Time: 2-4 hours**

---

## Implementation Options

### Option 1: Simple Email/Password Auth (Recommended for Personal Use)
**Effort:** LOW (1-2 hours)

#### Setup Steps:

1. **Create NextAuth API route**
   - File: `src/app/api/auth/[...nextauth]/route.ts`
   ```typescript
   import NextAuth from 'next-auth'
   import CredentialsProvider from 'next-auth/providers/credentials'
   import { prisma } from '@/lib/db'

   export const authOptions = {
     providers: [
       CredentialsProvider({
         name: 'Email',
         credentials: {
           email: { label: "Email", type: "email" },
           password: { label: "Password", type: "password" }
         },
         async authorize(credentials) {
           // Simple check (add bcrypt for production)
           if (credentials?.email === 'admin@local' && credentials?.password === 'your-password') {
             const user = await prisma.user.upsert({
               where: { email: 'admin@local' },
               create: { email: 'admin@local', name: 'Admin', role: 'admin' },
               update: {},
             })
             return { id: user.id, email: user.email, name: user.name }
           }
           return null
         }
       })
     ],
     session: { strategy: 'jwt' },
     pages: {
       signIn: '/auth/signin',
     },
   }

   const handler = NextAuth(authOptions)
   export { handler as GET, handler as POST }
   ```

2. **Create login page**
   - File: `src/app/auth/signin/page.tsx`

3. **Wrap app with SessionProvider**
   - Update: `src/app/layout.tsx`

4. **Update API routes**
   - Use `session.user.id` instead of hardcoded user

**Changes needed:**
- 4 new files (auth route, login page, session provider wrapper, middleware)
- Update 3 existing API routes to get user from session
- Update layout to show login/logout

---

### Option 2: OAuth (Google/GitHub) - Better UX
**Effort:** MEDIUM (2-3 hours)

Uses Google/GitHub login (no password management needed):

```typescript
providers: [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }),
  GitHubProvider({
    clientId: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET,
  }),
]
```

**Additional setup:**
- Create OAuth app on Google/GitHub (10-15 min)
- Add environment variables
- Otherwise same as Option 1

---

### Option 3: Magic Link (Email-based, No Password)
**Effort:** MEDIUM (2-3 hours)

User gets login link via email:

```typescript
providers: [
  EmailProvider({
    server: process.env.EMAIL_SERVER,
    from: 'noreply@yourdomain.com'
  })
]
```

**Requires:**
- Email service (SendGrid, Resend, etc.)
- Email template setup

---

## Files to Create/Modify

### New Files (5-7 files):
```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts          # NextAuth config
│   └── auth/
│       └── signin/
│           └── page.tsx               # Login page
├── components/
│   └── UserMenu.tsx                   # Login/logout UI
├── lib/
│   └── auth.ts                        # Auth utilities
└── middleware.ts                      # Protect routes (optional)
```

### Files to Modify (6 files):
```
src/
├── app/
│   ├── layout.tsx                     # Add SessionProvider
│   └── (api)/api/
│       ├── ratings/route.ts           # Use session.user.id
│       ├── albums/route.ts            # Filter by user
│       └── artists/route.ts           # Filter by user
├── components/
│   └── Header.tsx                     # Add user menu
```

---

## Implementation Checklist

### Phase 1: Basic Auth (1-2 hours)
- [ ] Create NextAuth API route
- [ ] Create login page
- [ ] Add SessionProvider to layout
- [ ] Add login/logout button to Header

### Phase 2: Protect API Routes (30 min)
- [ ] Create `getCurrentUser()` utility
- [ ] Update ratings API to use session user
- [ ] Update album modifiers API

### Phase 3: Filter Data by User (1 hour)
- [ ] Update album queries to filter ratings by user
- [ ] Update artist queries to filter ratings by user
- [ ] Test multi-user scenarios

---

## Minimal Working Example

### 1. Create auth route
```bash
mkdir -p src/app/api/auth/[...nextauth]
```

### 2. Add simple config
```typescript
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      credentials: { email: { type: "email" } },
      async authorize(credentials) {
        return { id: 'user-1', email: credentials?.email }
      }
    })
  ],
  session: { strategy: 'jwt' }
})

export { handler as GET, handler as POST }
```

### 3. Add provider to layout
```typescript
import { SessionProvider } from 'next-auth/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

### 4. Use in components
```typescript
import { useSession } from 'next-auth/react'

function Header() {
  const { data: session } = useSession()
  return <div>Logged in as: {session?.user?.email}</div>
}
```

---

## Recommendation

For a personal music manager:

**Start Simple:**
1. **Option 1 (Email/Password)** - 1-2 hours total
2. No external OAuth setup needed
3. Good enough for personal/family use
4. Can upgrade to OAuth later

**Or Skip for Now:**
- Keep the hardcoded `'admin@local'` user
- Focus on features
- Add auth when you need multi-user

**Key Insight:** The current setup already stores `userId` with ratings, so adding auth later is easy - just swap the hardcoded user for `session.user.id`.

---

## Next Steps

1. Choose implementation option
2. Follow phase-by-phase checklist
3. Test with multiple users
4. Consider adding proper password hashing (bcrypt) for production
