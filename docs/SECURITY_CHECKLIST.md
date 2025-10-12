# Security Checklist for MargWatch

## 🔒 Pre-Commit Security Checks

Before committing any changes, ensure the following security measures are in place:

### ✅ Environment Variables
- [ ] No hardcoded API keys, passwords, or secrets in source code
- [ ] All sensitive values use environment variables
- [ ] `.env.example` files exist with placeholder values
- [ ] `.env` files are in `.gitignore`

### ✅ API Keys & Secrets
- [ ] Google Maps API key uses environment variable
- [ ] Database passwords use environment variables
- [ ] JWT secrets use environment variables
- [ ] Cloudinary credentials use environment variables
- [ ] Firebase credentials use environment variables

### ✅ Default Credentials
- [ ] No hardcoded admin passwords in seed files
- [ ] Default passwords documented as environment variables
- [ ] Test credentials use environment variables

### ✅ File Security
- [ ] `local.properties` files use environment variables
- [ ] Docker Compose files use environment variables
- [ ] Configuration files don't contain secrets

## 🚨 Common Security Issues to Avoid

1. **Hardcoded API Keys**: Never commit real API keys
2. **Database Passwords**: Always use environment variables
3. **JWT Secrets**: Never use default/weak secrets
4. **Admin Credentials**: Don't hardcode admin passwords
5. **Firebase Keys**: Use environment variables for all Firebase config

## 🔍 Security Scan Commands

Run these commands to check for exposed secrets:

```bash
# Check for API keys
grep -r "AIzaSy" . --exclude-dir=node_modules --exclude-dir=.git

# Check for hardcoded passwords
grep -r "password.*=" . --exclude-dir=node_modules --exclude-dir=.git

# Check for secrets
grep -r "secret.*=" . --exclude-dir=node_modules --exclude-dir=.git

# Check for tokens
grep -r "token.*=" . --exclude-dir=node_modules --exclude-dir=.git
```

## 📝 Security Best Practices

1. **Environment Variables**: Use `.env` files for all sensitive data
2. **Git Ignore**: Ensure `.env` files are never committed
3. **Example Files**: Provide `.env.example` with placeholder values
4. **Documentation**: Document required environment variables
5. **Default Values**: Use secure defaults or require explicit configuration