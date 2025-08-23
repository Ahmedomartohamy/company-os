# Debug Route Lockdown Implementation

## Overview
This document explains the security measures implemented to lock down the `/debug` route in production environments, preventing unauthorized access to sensitive application information.

## Security Implementation

### Environment-Based Access Control
The debug route is now controlled by the `VITE_ENABLE_DEBUG` environment variable:

- **Production Default**: `VITE_ENABLE_DEBUG=false` (debug route disabled)
- **Development**: Always enabled regardless of environment variable
- **Staging/Testing**: Can be temporarily enabled by setting `VITE_ENABLE_DEBUG=true`

### Role-Based Access Control
Even when debug is enabled, access is restricted to:
- **Admin users only**: Only users with `role='admin'` can access the debug page
- **Authentication required**: Users must be logged in and have a valid session

### Token Masking
Sensitive information is now masked on the debug page:
- **Access tokens**: Display first 4 and last 2 characters, middle replaced with `***`
- **Refresh tokens**: Same masking pattern applied
- **Raw session data**: Tokens are masked in the JSON output

## Configuration

### Environment Variables
Add to your `.env` file:
```bash
# Disable debug in production (default: false)
VITE_ENABLE_DEBUG=false
```

### Temporarily Enable Debug in Staging
To enable debug access in staging environments:

1. **Set environment variable**:
   ```bash
   VITE_ENABLE_DEBUG=true
   ```

2. **Restart the application**:
   ```bash
   npm run build
   npm run preview
   ```

3. **Login as admin user**:
   - Use an account with `role='admin'` in the profiles table
   - Navigate to `/debug` after authentication

## Security Benefits

### Production Safety
- **No debug access**: Debug route is completely disabled in production
- **No token exposure**: Even if accessed, sensitive tokens are masked
- **Admin-only access**: Additional layer of role-based protection

### Development Flexibility
- **Always available**: Debug route works in development mode
- **Easy staging access**: Can be temporarily enabled for troubleshooting
- **Secure by default**: Production deployments are secure without configuration

## Implementation Details

### Router Logic
```typescript
// Debug route only rendered if:
// 1. Development mode OR explicitly enabled
// 2. User has admin role
const isDebugEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEBUG === 'true';
const isAdmin = role === 'admin';
```

### Token Masking Function
```typescript
function maskToken(token: string | undefined): string {
  if (!token) return 'N/A';
  if (token.length <= 6) return '***';
  return `${token.substring(0, 4)}${'*'.repeat(Math.max(token.length - 6, 3))}${token.substring(token.length - 2)}`;
}
```

## Why Admin-Only Access?

### Sensitive Information Exposure
The debug page contains:
- User session details and authentication tokens
- Application configuration and environment variables
- Database connection information
- Internal application state

### Risk Mitigation
- **Principle of least privilege**: Only administrators need debug access
- **Audit trail**: Admin actions can be logged and monitored
- **Reduced attack surface**: Limits potential for information disclosure

## Best Practices

### Production Deployment
1. **Never set** `VITE_ENABLE_DEBUG=true` in production
2. **Verify** environment variables before deployment
3. **Test** that debug route returns 404 in production builds

### Staging/Testing
1. **Temporarily enable** debug only when needed
2. **Disable immediately** after troubleshooting
3. **Use admin accounts** for debug access
4. **Document** when and why debug was enabled

### Security Monitoring
- Monitor for unauthorized debug route access attempts
- Log admin access to debug functionality
- Regular security audits of environment configurations

## Troubleshooting

### Debug Route Not Accessible
1. **Check environment**: Verify `VITE_ENABLE_DEBUG=true` in staging
2. **Check user role**: Ensure logged-in user has `role='admin'`
3. **Check authentication**: Verify user is properly logged in
4. **Restart application**: Environment changes require restart

### Tokens Still Visible
- All tokens should be masked with pattern: `abcd***xy`
- If tokens appear unmasked, check the `maskToken()` function implementation
- Raw session data should show masked tokens in JSON output