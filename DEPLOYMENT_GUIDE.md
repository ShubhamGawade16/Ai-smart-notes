# Planify - Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Configuration
Copy `.env.example` to `.env` and configure all required variables:

**Required Variables:**
- `DATABASE_URL` - Your PostgreSQL database connection string
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `RAZORPAY_KEY_ID` - Razorpay key ID for payments
- `RAZORPAY_KEY_SECRET` - Razorpay secret key
- `VITE_RAZORPAY_KEY_ID` - Razorpay key ID for frontend
- `JWT_SECRET` - Strong random string for JWT signing
- `SESSION_SECRET` - Strong random string for session management

**Optional Variables:**
- Email configuration for notifications
- Push notification keys (FCM, APNS)
- VAPID keys for web push

### 2. Database Setup
1. Ensure your PostgreSQL database is accessible
2. Run database migrations: `npm run db:push`
3. Verify database connection with health check

### 3. Build Process
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

### 4. Security Considerations
- All API endpoints are rate-limited in production
- Security headers are automatically applied
- Admin access is restricted to authorized UIDs only
- Payment processing is secured with Razorpay integration

## Production Features

### Health Monitoring
- **Health Check**: `GET /health` - Application health status
- **Readiness Check**: `GET /ready` - Deployment readiness verification

### Performance Optimizations
- Response compression enabled
- Static file caching
- Database connection pooling
- Request/response logging

### Error Handling
- Global error handler with secure error responses
- Request ID tracking for debugging
- Slow request monitoring and logging

### Rate Limiting
- General API: 100 requests per 15 minutes per IP
- AI features: 10 requests per minute per IP
- Payment endpoints: Additional security measures

## Monitoring & Maintenance

### Key Metrics to Monitor
- Response times (alert if > 1s)
- Error rates
- Database connection health
- Memory usage (alert if > 500MB)
- AI API usage and costs

### Log Analysis
Production logs include:
- Request/response details
- Error tracking with request IDs
- Performance metrics
- Security events

### Scaling Considerations
- Horizontal scaling supported
- Session storage compatible
- Database connection pooling configured
- Static assets can be CDN-cached

## Troubleshooting

### Common Issues
1. **Database Connection Failures**: Check DATABASE_URL and network connectivity
2. **Payment Issues**: Verify Razorpay credentials and webhook setup
3. **AI Features Not Working**: Check OpenAI API key and usage limits
4. **Authentication Problems**: Verify Supabase configuration and keys

### Health Check Responses
- Status 200: All systems operational
- Status 503: Service unavailable (check database/external services)

### Emergency Procedures
1. Check `/health` endpoint first
2. Review application logs for errors
3. Verify all environment variables are set
4. Test database connectivity separately
5. Monitor external service status (OpenAI, Supabase, Razorpay)

## Security Best Practices
- Keep all API keys secure and rotate regularly
- Monitor for unusual traffic patterns
- Review admin access logs periodically
- Keep dependencies updated
- Regular security audits of payment flows

## Performance Optimization
- Enable compression in reverse proxy
- Set up proper caching headers
- Monitor and optimize database queries
- Consider CDN for static assets
- Implement proper session management