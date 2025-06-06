# 🔧 Troubleshooting Guide - Fixing Common Problems

**What this is**: A simple guide to fix the most common problems you might encounter with your HuCares app.

**When to use this**: When something isn't working right and you want to try fixing it yourself before calling for help.

---

## 🚨 **Emergency Quick Fixes**

### My Website Is Down - Everyone Sees Error Messages

**Quick Check:**
1. **Visit your domain**: `yourdomain.com`
2. **Try the Vercel URL**: `https://your-app.vercel.app`
3. **Try the backend URL**: `https://your-backend.onrender.com`

**If Domain is Down but Vercel URL Works:**
- **Problem**: DNS/Domain issue
- **Fix**: Wait 30 minutes, then check Namecheap DNS settings
- **Urgency**: Medium (people can still use Vercel URL temporarily)

**If Everything is Down:**
- **Problem**: Major hosting issue
- **Fix**: Contact your developer immediately
- **Urgency**: High (entire app is broken)

### Users Can't Create Accounts

**Quick Test:**
1. **Go to your website**
2. **Try creating a test account**
3. **Check if you get specific error messages**

**Common Fixes:**
- **"Database connection error"**: Check Supabase is running
- **"Server error"**: Check Render backend is running
- **"Invalid credentials"**: Check environment variables

---

## 🔍 **Diagnostic Steps**

### Step 1: Check Service Status

**Vercel (Frontend):**
1. **Log into Vercel**: `vercel.com`
2. **Go to your project**
3. **Check "Deployments" tab**
4. **Look for red X's or errors**

**Render (Backend):**
1. **Log into Render**: `render.com`
2. **Go to your backend service**
3. **Check if it says "Live" (green)**
4. **Look at "Logs" for error messages**

**Supabase (Database):**
1. **Log into Supabase**: `supabase.com`
2. **Go to your project**
3. **Check if project is "Active"**
4. **Look for any warning messages**

### Step 2: Check Domain Connection

1. **Go to Namecheap domain management**
2. **Check DNS records are still there**:
   - A Record: @ → 76.76.19.19
   - CNAME Record: www → cname.vercel-dns.com
3. **Check domain isn't expired**

### Step 3: Test Each Part Separately

**Test 1: Frontend Only**
- Visit your Vercel URL directly
- If this works, problem is domain-related

**Test 2: Backend Only**  
- Visit your Render URL + `/health` (if you have a health endpoint)
- Should show some response, not an error

**Test 3: Database Only**
- Log into Supabase
- Go to Table Editor
- Try viewing your tables

---

## 🛠️ **Common Problems & Solutions**

### Problem: "This site can't be reached"

**Symptoms**: Browser shows connection error when visiting your domain

**Possible Causes:**
- DNS not set up correctly
- Domain expired
- Vercel deployment failed

**Solutions:**
1. **Check DNS settings** in Namecheap
2. **Try the Vercel URL** instead of your domain
3. **Wait 30 minutes** for DNS changes to take effect
4. **Check domain expiration** in Namecheap

---

### Problem: "500 Internal Server Error"

**Symptoms**: Website loads but shows server error when trying to use features

**Possible Causes:**
- Backend is down
- Database connection failed
- Environment variables missing

**Solutions:**
1. **Check Render backend status**
2. **Check Supabase database status**
3. **Verify environment variables** in both Vercel and Render
4. **Look at backend logs** in Render

---

### Problem: "Can't create account" or "Login failed"

**Symptoms**: Registration/login forms don't work

**Possible Causes:**
- Backend not connected to frontend
- Database issues
- Wrong API URL

**Solutions:**
1. **Check `VITE_API_BASE_URL`** in Vercel environment variables
2. **Make sure backend is running** on Render
3. **Test backend URL directly** (visit it in browser)
4. **Check CORS settings** in backend environment variables

---

### Problem: Website loads but looks broken/blank

**Symptoms**: Site loads but content is missing or looks wrong

**Possible Causes:**
- Frontend build failed
- Missing files
- JavaScript errors

**Solutions:**
1. **Check browser console** for error messages (F12 key)
2. **Look at Vercel build logs**
3. **Try clearing browser cache** (Ctrl+F5 or Cmd+Shift+R)
4. **Check if all files uploaded** to GitHub

---

### Problem: "Database connection failed"

**Symptoms**: Backend errors mentioning database

**Possible Causes:**
- Wrong DATABASE_URL
- Supabase project paused/stopped
- Database password changed

**Solutions:**
1. **Check DATABASE_URL** in Render environment variables
2. **Copy fresh connection string** from Supabase
3. **Make sure Supabase project is active**
4. **Test database connection** in Supabase SQL editor

---

### Problem: Friends can't access the app

**Symptoms**: You can use it, but friends get errors

**Possible Causes:**
- Site password not working
- Regional access issues
- Browser compatibility

**Solutions:**
1. **Check site password** is set correctly
2. **Test in different browsers** (Chrome, Firefox, Safari)
3. **Try incognito/private browsing mode**
4. **Ask friends to clear their browser cache**

---

## 📱 **Browser-Specific Issues**

### Safari Issues
- **Problem**: Some features don't work in Safari
- **Solution**: Make sure friends use Chrome or Firefox

### Mobile Issues  
- **Problem**: App doesn't work well on phones
- **Solution**: Check responsive design settings

### Internet Explorer Issues
- **Problem**: Nothing works in IE
- **Solution**: Tell friends to use a modern browser (Chrome, Firefox, Safari, Edge)

---

## 🔧 **Self-Service Fixes**

### Restart Everything (Nuclear Option)

**When to use**: When nothing else works and you're desperate

**Steps:**
1. **Redeploy frontend**:
   - Go to Vercel
   - Click "Deployments"
   - Click "Redeploy" on latest deployment

2. **Restart backend**:
   - Go to Render
   - Find your backend service
   - Look for "Manual Deploy" button and click it

3. **Wait 10 minutes** for everything to restart

### Clear All Caches

**When to use**: When changes aren't showing up

**Steps:**
1. **Clear your browser cache**: Ctrl+F5 (PC) or Cmd+Shift+R (Mac)
2. **Try incognito/private browsing mode**
3. **Ask friends to do the same**

### Update Environment Variables

**When to use**: When you've changed passwords or URLs

**Steps:**
1. **Update Vercel variables**:
   - Go to Project Settings → Environment Variables
   - Update the changed values
   - Redeploy

2. **Update Render variables**:
   - Go to Service → Environment
   - Update the changed values
   - Service will restart automatically

---

## 📞 **When to Call for Help**

### Call Developer Immediately If:
- ✅ **Entire app is down** for more than 30 minutes
- ✅ **Users can't access their data**
- ✅ **Security alerts** from any service
- ✅ **Database corruption** warnings
- ✅ **You accidentally deleted something important**

### Can Wait for Normal Support If:
- ✅ **Minor visual issues**
- ✅ **One feature not working** but others work
- ✅ **Performance is slow** but functional
- ✅ **Questions about usage/features**

---

## 📝 **Information to Gather Before Calling for Help**

**Always Include:**
1. **What were you doing** when the problem started?
2. **What error message** do you see (exact text)?
3. **Screenshots** of any error messages
4. **What browser** are you using?
5. **When did this start** happening?

**Check These URLs and Report Status:**
- Your domain: `yourdomain.com` (working/broken)
- Vercel app: `https://your-app.vercel.app` (working/broken)  
- Backend: `https://your-backend.onrender.com` (working/broken)

**Include Recent Changes:**
- Did you change any passwords?
- Did you modify any settings?
- Did you update anything in the last 24 hours?

---

## 🎯 **Prevention Tips**

### Daily Health Checks (5 minutes)
1. **Visit your website** once a day
2. **Try creating a test account** (then delete it)
3. **Check one check-in submission**
4. **Look for any error messages**

### Weekly Monitoring
1. **Check Vercel deployment status**
2. **Check Render service status**  
3. **Check Supabase project status**
4. **Review any error logs**

### Monthly Maintenance
1. **Update passwords** if needed
2. **Check domain expiration date**
3. **Review user feedback** for issues
4. **Clean up test data** if any

---

## ✅ **Quick Reference Checklist**

**When Something Breaks:**
- [ ] Take screenshots of error messages
- [ ] Check service status (Vercel, Render, Supabase)
- [ ] Try the diagnostic steps above
- [ ] Test with different browsers
- [ ] Wait 30 minutes (sometimes fixes itself)
- [ ] Contact developer with all information gathered

**Remember**: Most problems are temporary and have simple fixes. Don't panic! 🌟 