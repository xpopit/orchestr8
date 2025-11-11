---
id: security-auth-oauth
category: pattern
tags: [security, authentication, oauth, oauth2, social-auth, third-party, sso, google, github]
capabilities:
  - OAuth 2.0 authentication implementation
  - Third-party provider integration
  - Social authentication setup
  - SSO (Single Sign-On) implementation
  - Passport.js OAuth strategy configuration
  - User account linking with OAuth
useWhen:
  - Third-party authentication implementation with Google, GitHub, Facebook, or enterprise OAuth 2.0 providers using Passport.js strategies
  - SSO (Single Sign-On) functionality requiring delegated authentication with provider callback handling and user profile extraction
  - Social login features needing account linking logic to merge OAuth profiles with existing email-based user accounts
  - Multi-provider OAuth integration requiring find-or-create user patterns with provider ID tracking and email verification
  - Delegated authorization scenarios where users grant access to their data from external services without sharing passwords
  - Enterprise identity provider integration with CSRF protection via state parameter validation and secure token storage
estimatedTokens: 450
---

# OAuth 2.0 Authentication Pattern

## When to Use OAuth
- Third-party authentication (Google, GitHub, Facebook)
- SSO (Single Sign-On) implementations
- Delegated authorization scenarios
- Social login functionality
- Enterprise identity provider integration

## OAuth 2.0 Flow with Passport.js

### Google OAuth Strategy
```typescript
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user from OAuth profile
      const user = await findOrCreateUser({
        provider: 'google',
        providerId: profile.id,
        email: profile.emails?.[0]?.value,
        name: profile.displayName,
        avatar: profile.photos?.[0]?.value
      });

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
));
```

### GitHub OAuth Strategy
```typescript
import { Strategy as GitHubStrategy } from 'passport-github2';

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    callbackURL: "/auth/github/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    const user = await findOrCreateUser({
      provider: 'github',
      providerId: profile.id,
      email: profile.emails?.[0]?.value,
      username: profile.username,
      avatar: profile.photos?.[0]?.value
    });

    done(null, user);
  }
));
```

### Route Setup
```typescript
import express from 'express';

const router = express.Router();

// Initiate OAuth flow
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// OAuth callback
router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to app
    res.redirect('/dashboard');
  }
);

// GitHub OAuth
router.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);
```

### Find or Create User Pattern
```typescript
interface OAuthProfile {
  provider: string;
  providerId: string;
  email: string;
  name?: string;
  username?: string;
  avatar?: string;
}

async function findOrCreateUser(profile: OAuthProfile) {
  // Try to find existing user by provider ID
  let user = await prisma.user.findUnique({
    where: {
      provider_providerId: {
        provider: profile.provider,
        providerId: profile.providerId
      }
    }
  });

  if (user) return user;

  // Try to find by email (link accounts)
  if (profile.email) {
    user = await prisma.user.findUnique({
      where: { email: profile.email }
    });

    if (user) {
      // Link OAuth account to existing user
      return await prisma.user.update({
        where: { id: user.id },
        data: {
          provider: profile.provider,
          providerId: profile.providerId
        }
      });
    }
  }

  // Create new user
  return await prisma.user.create({
    data: {
      email: profile.email,
      name: profile.name || profile.username,
      avatar: profile.avatar,
      provider: profile.provider,
      providerId: profile.providerId,
      emailVerified: true // OAuth email is pre-verified
    }
  });
}
```

## Security Best Practices
- Validate state parameter to prevent CSRF attacks
- Use HTTPS for all OAuth redirects
- Store OAuth secrets securely (environment variables, vaults)
- Verify email addresses from OAuth providers
- Handle account linking carefully (verify email ownership)
- Implement proper error handling for OAuth failures
- Consider refresh token rotation for long-lived sessions

## Comparison with Other Auth Methods

| Pattern | Use Case | Pros | Cons |
|---------|----------|------|------|
| OAuth | Third-party auth | User convenience, no password management | Complex setup, provider dependency |
| JWT | APIs, SPAs | Stateless, scalable | Can't revoke easily |
| Session | Traditional apps | Easy revocation | Server state required |
