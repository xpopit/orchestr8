---
id: security-authentication-oauth
category: skill
tags: [security, authentication, oauth, oauth2, pkce, openid-connect, sso]
capabilities:
  - OAuth 2.0 flow implementation
  - PKCE for public clients
  - Authorization code flow
  - OpenID Connect integration
  - OAuth security best practices
estimatedTokens: 600
useWhen:
  - Implementing OAuth 2.0 authorization code flow for third-party authentication with PKCE for enhanced security
  - Building OAuth provider integration with Google, GitHub, and Facebook for social login functionality
  - Designing OAuth token management with secure storage, automatic refresh, and revocation handling
  - Creating OAuth consent screen implementation with granular permission scopes and user authorization tracking
  - Implementing OpenID Connect on top of OAuth 2.0 for standardized identity layer with JWT ID tokens
---

# OAuth 2.0 Authentication Security

## Authorization Code Flow (Server-Side)

```typescript
import { randomBytes } from 'crypto';
import axios from 'axios';

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  scope: string;
}

// Step 1: Redirect user to OAuth provider
app.get('/auth/oauth/login', (req, res) => {
  const state = randomBytes(32).toString('hex');

  // Store state in session to verify callback
  req.session.oauthState = state;

  const params = new URLSearchParams({
    client_id: oauthConfig.clientId,
    redirect_uri: oauthConfig.redirectUri,
    response_type: 'code',
    scope: oauthConfig.scope,
    state,
  });

  res.redirect(`${oauthConfig.authorizationUrl}?${params}`);
});

// Step 2: Handle callback and exchange code for token
app.get('/auth/oauth/callback', async (req, res) => {
  const { code, state } = req.query;

  // Verify state to prevent CSRF
  if (state !== req.session.oauthState) {
    return res.status(400).json({
      error: { code: 'INVALID_STATE', message: 'State mismatch - possible CSRF' }
    });
  }

  delete req.session.oauthState;

  try {
    // Exchange authorization code for access token
    const tokenResponse = await axios.post(
      oauthConfig.tokenUrl,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: oauthConfig.redirectUri,
        client_id: oauthConfig.clientId,
        client_secret: oauthConfig.clientSecret,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Fetch user info from provider
    const userResponse = await axios.get('https://provider.com/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const oauthUser = userResponse.data;

    // Create or update user in database
    const user = await findOrCreateUser(oauthUser);

    // Create session
    req.session.userId = user.id;

    res.redirect('/dashboard');
  } catch (error) {
    logger.error('OAuth callback error', { error });
    res.status(500).json({
      error: { code: 'OAUTH_ERROR', message: 'Authentication failed' }
    });
  }
});
```

## PKCE Flow (Public Clients - SPAs, Mobile)

```typescript
import { createHash, randomBytes } from 'crypto';

// Client-side: Generate code verifier and challenge
function generatePKCEPair() {
  const codeVerifier = randomBytes(32).toString('base64url');

  const codeChallenge = createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  return { codeVerifier, codeChallenge };
}

// Step 1: Authorization request with PKCE
app.get('/auth/oauth/login-pkce', (req, res) => {
  const state = randomBytes(32).toString('hex');
  const { codeVerifier, codeChallenge } = generatePKCEPair();

  // Store code_verifier in session
  req.session.codeVerifier = codeVerifier;
  req.session.oauthState = state;

  const params = new URLSearchParams({
    client_id: oauthConfig.clientId,
    redirect_uri: oauthConfig.redirectUri,
    response_type: 'code',
    scope: oauthConfig.scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  res.redirect(`${oauthConfig.authorizationUrl}?${params}`);
});

// Step 2: Token exchange with code_verifier (no client_secret)
app.get('/auth/oauth/callback-pkce', async (req, res) => {
  const { code, state } = req.query;

  if (state !== req.session.oauthState) {
    return res.status(400).json({ error: 'State mismatch' });
  }

  const codeVerifier = req.session.codeVerifier;
  delete req.session.codeVerifier;
  delete req.session.oauthState;

  try {
    const tokenResponse = await axios.post(
      oauthConfig.tokenUrl,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: oauthConfig.redirectUri,
        client_id: oauthConfig.clientId,
        code_verifier: codeVerifier, // Instead of client_secret
      })
    );

    const { access_token } = tokenResponse.data;

    // Fetch and create user...
    res.redirect('/dashboard');
  } catch (error) {
    logger.error('PKCE callback error', { error });
    res.status(500).json({ error: 'Authentication failed' });
  }
});
```

## OpenID Connect (ID Token)

```typescript
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Verify ID token from OIDC provider
const client = jwksClient({
  jwksUri: 'https://provider.com/.well-known/jwks.json',
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

async function verifyIdToken(idToken: string) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      idToken,
      getKey,
      {
        audience: oauthConfig.clientId,
        issuer: 'https://provider.com',
        algorithms: ['RS256'],
      },
      (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      }
    );
  });
}

// Use ID token for user info (faster than /userinfo endpoint)
app.get('/auth/oidc/callback', async (req, res) => {
  const { code } = req.query;

  const tokenResponse = await exchangeCodeForToken(code as string);
  const { id_token, access_token } = tokenResponse.data;

  try {
    // Verify and decode ID token
    const userInfo = await verifyIdToken(id_token);

    const user = await findOrCreateUser({
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
    });

    req.session.userId = user.id;
    res.redirect('/dashboard');
  } catch (error) {
    logger.error('ID token verification failed', { error });
    res.status(401).json({ error: 'Invalid ID token' });
  }
});
```

## Token Storage (Best Practices)

```typescript
// ✅ Server-side: Store tokens securely
interface OAuthToken {
  userId: string;
  provider: string;
  accessToken: string; // Encrypted
  refreshToken: string; // Encrypted
  expiresAt: Date;
}

import { encrypt, decrypt } from './encryption';

async function saveOAuthToken(userId: string, tokenData: any) {
  await db.oauthToken.create({
    data: {
      userId,
      provider: 'google',
      accessToken: encrypt(tokenData.access_token),
      refreshToken: encrypt(tokenData.refresh_token),
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
    },
  });
}

async function getOAuthToken(userId: string, provider: string) {
  const token = await db.oauthToken.findFirst({
    where: { userId, provider },
  });

  if (!token) return null;

  return {
    accessToken: decrypt(token.accessToken),
    refreshToken: decrypt(token.refreshToken),
    expiresAt: token.expiresAt,
  };
}
```

## Refresh Token Flow

```typescript
async function refreshOAuthToken(userId: string, provider: string) {
  const storedToken = await getOAuthToken(userId, provider);

  if (!storedToken || !storedToken.refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await axios.post(
      oauthConfig.tokenUrl,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: storedToken.refreshToken,
        client_id: oauthConfig.clientId,
        client_secret: oauthConfig.clientSecret,
      })
    );

    const { access_token, refresh_token, expires_in } = response.data;

    // Update stored tokens
    await db.oauthToken.update({
      where: { userId_provider: { userId, provider } },
      data: {
        accessToken: encrypt(access_token),
        refreshToken: refresh_token ? encrypt(refresh_token) : undefined,
        expiresAt: new Date(Date.now() + expires_in * 1000),
      },
    });

    return access_token;
  } catch (error) {
    logger.error('Token refresh failed', { userId, provider, error });
    throw new Error('Failed to refresh token');
  }
}
```

## Security Anti-Patterns

```typescript
// ❌ NEVER: Skip state validation (CSRF vulnerability)
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  // Missing state validation!
  const token = await exchangeCode(code);
});

// ❌ NEVER: Use implicit flow (deprecated)
const params = {
  response_type: 'token', // Don't use - tokens exposed in URL
};

// ❌ NEVER: Store access tokens in localStorage
localStorage.setItem('oauth_token', token); // XSS vulnerability

// ❌ NEVER: Expose client_secret in frontend
const config = {
  client_secret: 'secret123', // NEVER in client-side code
};

// ✅ ALWAYS: Use authorization code flow with PKCE
```

## Best Practices

1. **Always validate state**: Prevent CSRF attacks
2. **Use PKCE for public clients**: SPAs, mobile apps, desktop apps
3. **Verify ID tokens**: Check signature, issuer, audience, expiration
4. **Encrypt stored tokens**: In database
5. **Set minimal scopes**: Only request what you need
6. **Implement token refresh**: Before expiration
7. **Use HTTPS**: Required for OAuth 2.0
8. **Validate redirect URIs**: Whitelist exact matches
9. **Implement logout**: Revoke tokens on logout
10. **Monitor for abuse**: Rate limiting, anomaly detection

## Compliance

- **OWASP**: A07:2021 Identification and Authentication Failures
- **OAuth 2.0 Security Best Practices**: RFC 8252, RFC 8628
- **GDPR**: User consent for data access
- **SOC 2**: Access control and authentication
