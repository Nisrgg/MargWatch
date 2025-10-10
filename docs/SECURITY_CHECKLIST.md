# MargWatch Security Checklist

## 🔐 **SECURITY FILES TO PROTECT**

### **Environment Files**
- `margwatch_project/.env` - Main environment variables
- `margwatch_project/backend/.env` - Backend-specific environment variables
- `margwatch_project/ml-service/.env` - ML service environment variables

### **Firebase Configuration**
- `margwatch_project/firebase-service-account.json` - Firebase Admin SDK credentials
- `margwatch_project/backend/firebase-service-account.json` - Backend Firebase credentials
- `MargWatch/app/google-services.json` - Android Firebase configuration

### **API Keys & Secrets**
- Google Maps API keys in AndroidManifest.xml
- Cloudinary credentials
- JWT secrets
- Database connection strings
- Redis connection strings

## 🚫 **FILES ALREADY PROTECTED BY .gitignore**

✅ **Environment Files**: `.env`, `.env.local`, `.env.production`
✅ **Firebase Files**: `firebase-service-account.json`, `google-services.json`
✅ **Build Artifacts**: `dist/`, `build/`, `node_modules/`
✅ **Cache Files**: `*.cache`, `*.tmp`, `*.temp`, `*.log`
✅ **IDE Files**: `.vscode/`, `.idea/`, `*.swp`
✅ **OS Files**: `.DS_Store`, `Thumbs.db`
✅ **Backup Files**: `*.backup`, `*.bak`, `*.old`
✅ **ML Models**: `*.pkl`, `*.joblib`, `*.h5`, `*.pb`

## 🔍 **SECURITY VERIFICATION COMMANDS**

### **Check for Sensitive Files**
```bash
# Find environment files
find . -name "*.env*" -not -path "./node_modules/*" -not -path "./.git/*"

# Find Firebase files
find . -name "firebase-service-account.json" -o -name "google-services.json"

# Find API keys in code
grep -r "AIzaSy" . --exclude-dir=node_modules --exclude-dir=.git

# Find hardcoded secrets
grep -r "password\|secret\|key\|token" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md"
```

### **Check Git Status**
```bash
# Verify sensitive files are not tracked
git status --porcelain | grep -E "\.(env|json)$|firebase-service-account|google-services"

# Check what files are staged
git diff --cached --name-only
```

## 🛡️ **SECURITY BEST PRACTICES**

### **Environment Variables**
- ✅ Use `.env` files for local development
- ✅ Use environment variables in production
- ✅ Never commit `.env` files to version control
- ✅ Use `.env.example` as template

### **API Keys**
- ✅ Store API keys in environment variables
- ✅ Use different keys for development/production
- ✅ Rotate keys regularly
- ✅ Monitor API key usage

### **Database Security**
- ✅ Use strong passwords
- ✅ Enable SSL connections
- ✅ Restrict database access by IP
- ✅ Regular backups

### **Firebase Security**
- ✅ Use service account files for server-side
- ✅ Configure Firebase security rules
- ✅ Monitor Firebase usage
- ✅ Regular security audits

## 🚨 **SECURITY ALERTS**

### **If You Accidentally Commit Secrets:**
1. **Immediately rotate the compromised credentials**
2. **Remove from git history**: `git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch <file>' --prune-empty --tag-name-filter cat -- --all`
3. **Force push**: `git push origin --force --all`
4. **Notify team members** to pull the cleaned history

### **Before Each Commit:**
```bash
# Run security check
git status --porcelain | grep -E "\.(env|json)$|firebase-service-account|google-services"
if [ $? -eq 0 ]; then
    echo "⚠️  WARNING: Sensitive files detected in staging area!"
    exit 1
fi
```

## 📋 **PRE-COMMIT SECURITY CHECKLIST**

- [ ] No `.env` files in staging area
- [ ] No `firebase-service-account.json` files
- [ ] No `google-services.json` files
- [ ] No hardcoded API keys in code
- [ ] No hardcoded passwords in code
- [ ] No sensitive data in logs
- [ ] All secrets are in environment variables
- [ ] `.gitignore` is up to date

## 🔧 **DEVELOPMENT SECURITY SETUP**

### **Local Development**
1. Copy `env.example` to `.env`
2. Fill in your local development values
3. Never commit `.env` files
4. Use test API keys for development

### **Team Collaboration**
1. Share environment setup via documentation
2. Use secure channels for sharing secrets
3. Regular security reviews
4. Update secrets when team members leave

## 📞 **SECURITY INCIDENT RESPONSE**

### **If Security Breach Suspected:**
1. **Immediately rotate all credentials**
2. **Check git history for exposed secrets**
3. **Notify team members**
4. **Review access logs**
5. **Update security measures**

### **Contact Information**
- **Project Lead**: [Your Name]
- **Security Contact**: [Security Team Contact]
- **Emergency**: [Emergency Contact]

---

**Remember**: Security is everyone's responsibility. When in doubt, ask before committing sensitive information!
