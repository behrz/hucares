# 🏪 Hosting Setup Guide - Making Your App Live on the Internet

**What this does**: This turns your code into a live website that people can visit from anywhere in the world.

**Time needed**: 45 minutes

**Difficulty**: Medium (more steps, but still just clicking)

---

## 📋 **What You'll Need**

- ✅ Your GitHub account and repository (from previous step)
- ✅ Your Supabase database information (from database setup)
- ✅ Your domain setup (from domain setup)
- ✅ A web browser
- 📝 All the information you wrote down from previous steps

---

## 🎯 **Step 1: Create Your Vercel Account**

**What is Vercel?** Think of it like renting space in a mall for your restaurant. Vercel gives your app a place to live on the internet.

1. **Open your web browser** (Chrome, Safari, Firefox, etc.)

2. **Go to Vercel**: Type `vercel.com` in the address bar and press Enter

3. **Click "Sign Up"** (top right corner)

4. **Choose "Continue with GitHub"**
   - This connects your GitHub account to Vercel
   - Click "Authorize Vercel" when asked

5. **Fill in any additional information** if prompted

6. **You should now see the Vercel dashboard**

---

## 🎯 **Step 2: Import Your Repository**

1. **Click "Add New..."** (usually a button with a plus sign)

2. **Select "Project"** from the dropdown

3. **Find your repository**:
   - Look for `hucares-app` in the list
   - If you don't see it, click "Import Git Repository" 
   - Paste your GitHub repository URL: `https://github.com/yourusername/hucares-app`

4. **Click "Import"** next to your repository

---

## 🎯 **Step 3: Configure Your Frontend Deployment**

### Part A: Basic Settings

1. **You'll see a configuration screen**

2. **Fill in these settings**:
   - **Project Name**: `hucares-frontend` (or just `hucares`)
   - **Framework Preset**: Select "Vite" (if you see it) or "Other"
   - **Root Directory**: `frontend` (this tells Vercel where your website code is)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Part B: Environment Variables

**Important**: Your app needs to know how to connect to your database and backend.

1. **Look for "Environment Variables" section**

2. **Click "Add" or the plus button**

3. **Add these variables one by one**:

   **Variable 1:**
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: `https://your-backend-app.onrender.com/api` (we'll update this later)

   **Variable 2:**
   - **Name**: `VITE_APP_NAME`
   - **Value**: `HuCares`

   **Variable 3:**
   - **Name**: `VITE_SITE_PASSWORD`
   - **Value**: `your-chosen-site-password` (choose a password for your site)

4. **Click "Add" after each variable**

5. **Click "Deploy"** when you're done

---

## 🎯 **Step 4: Wait for Your First Deployment**

1. **You'll see a deployment screen** with logs scrolling by

2. **Wait for it to complete** (usually 2-5 minutes)
   - You'll see lots of text scrolling
   - This is normal - it's building your website

3. **Look for "Build Completed" or a green checkmark**

4. **You should get a URL** like `https://hucares-123abc.vercel.app`
   - Write this down!

---

## 🎯 **Step 5: Set Up Your Backend on Render**

**What is Render?** Another hosting service, but this one is perfect for your backend (the part that handles data).

### Part A: Create Render Account

1. **Open a new browser tab**

2. **Go to Render**: Type `render.com` in the address bar and press Enter

3. **Click "Get Started"** 

4. **Sign up with GitHub** (easiest way)

5. **Authorize Render** to access your GitHub

### Part B: Deploy Your Backend

1. **Click "New +"** (top right)

2. **Select "Web Service"**

3. **Connect your repository**:
   - Find `hucares-app` and click "Connect"

4. **Configure the service**:
   - **Name**: `hucares-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Select "Free" (for now)

### Part C: Add Backend Environment Variables

1. **Scroll down to "Environment Variables"**

2. **Add these variables**:

   **Variable 1:**
   - **Key**: `DATABASE_URL`
   - **Value**: [Your Supabase connection string from Step 2]

   **Variable 2:**
   - **Key**: `JWT_SECRET`
   - **Value**: `your-super-secret-jwt-key-12345` (make this long and random)

   **Variable 3:**
   - **Key**: `PORT`
   - **Value**: `10000`

   **Variable 4:**
   - **Key**: `NODE_ENV`
   - **Value**: `production`

   **Variable 5:**
   - **Key**: `CORS_ORIGIN`
   - **Value**: `https://your-frontend-url.vercel.app` (from Step 4)

3. **Click "Create Web Service"**

4. **Wait for deployment** (5-10 minutes)

5. **Copy your backend URL** when it's ready
   - It looks like: `https://hucares-backend-abc123.onrender.com`

---

## 🎯 **Step 6: Connect Frontend to Backend**

Now we need to tell your frontend where to find your backend.

1. **Go back to Vercel** (your frontend)

2. **Click on your project** (`hucares-frontend`)

3. **Go to "Settings"**

4. **Click "Environment Variables"**

5. **Find `VITE_API_BASE_URL`** and click "Edit"

6. **Update the value** to your Render backend URL + `/api`
   - Example: `https://hucares-backend-abc123.onrender.com/api`

7. **Click "Save"**

8. **Go to "Deployments" tab**

9. **Click "Redeploy"** to update your frontend with the new backend URL

---

## 🎯 **Step 7: Connect Your Custom Domain**

Now let's connect your Namecheap domain to your Vercel app.

1. **In Vercel, go to your project settings**

2. **Click "Domains"**

3. **Type your domain name**: `yourdomain.com`

4. **Click "Add"**

5. **Vercel will show you some DNS records**
   - These should match what you set up in Namecheap earlier
   - If they don't match, update your Namecheap DNS settings

6. **Wait 15-30 minutes** for DNS to propagate

7. **Test your domain**: Type `yourdomain.com` in a browser

---

## 🎯 **Step 8: Test Everything**

Let's make sure your entire app works:

1. **Visit your custom domain**: `yourdomain.com`

2. **You should see the HuCares site password screen**

3. **Enter your site password** (the one you set in environment variables)

4. **Try to create an account**:
   - Choose a username and password
   - Click register

5. **If registration works**:
   - ✅ Your frontend and backend are connected
   - ✅ Your database is working
   - ✅ Everything is set up correctly!

6. **If you get errors**:
   - Check the troubleshooting section below
   - Contact your developer with screenshots

---

## 📝 **What to Write Down (Save This Information)**

Copy this template and fill in your information:

```
HOSTING SETUP COMPLETED
Date: ___________

Frontend (Vercel):
- Project Name: hucares-frontend
- Vercel URL: https://[project]-[random].vercel.app
- Custom Domain: yourdomain.com
- Status: Deployed ✅

Backend (Render):
- Service Name: hucares-backend  
- Render URL: https://hucares-backend-[random].onrender.com
- Status: Deployed ✅

Environment Variables Set:
- ✅ VITE_API_BASE_URL: [backend URL]/api
- ✅ VITE_APP_NAME: HuCares
- ✅ VITE_SITE_PASSWORD: [your password]
- ✅ DATABASE_URL: [Supabase connection]
- ✅ JWT_SECRET: [your secret key]
- ✅ CORS_ORIGIN: [frontend URL]

Testing Results:
- ✅ Domain loads correctly
- ✅ Site password screen appears
- ✅ Can create user accounts
- ✅ Backend connection working

Next Steps:
- ✅ Hosting setup complete
- ⏳ Continue to Final Connection Guide
```

---

## 🎉 **Success! What You Just Accomplished**

You've successfully:
- ✅ Deployed your frontend to Vercel
- ✅ Deployed your backend to Render
- ✅ Connected them together
- ✅ Connected your custom domain
- ✅ Made your app accessible worldwide
- ✅ Set up secure environment variables

---

## 🆘 **Common Problems and Solutions**

### Problem: "Build failed" during Vercel deployment
**Solution**: 
- Check that you selected the right root directory (`frontend`)
- Make sure your build command is correct (`npm run build`)
- Look at the build logs for specific error messages

### Problem: "Can't connect to backend" 
**Solution**:
- Make sure your backend URL is correct in environment variables
- Check that your backend is actually running on Render
- Verify CORS_ORIGIN is set to your frontend URL

### Problem: "Database connection failed"
**Solution**:
- Double-check your DATABASE_URL is exactly right
- Make sure your Supabase database is still running
- Check for any typos in the connection string

### Problem: "Domain not working"
**Solution**:
- Wait longer (DNS can take up to 48 hours)
- Check your Namecheap DNS settings match Vercel's requirements
- Try visiting the domain in an incognito/private browser window

### Problem: "Environment variables not working"
**Solution**:
- Make sure you redeploy after changing environment variables
- Check for typos in variable names (they're case sensitive)
- Verify all required variables are set

---

## 🔒 **Security Check**

Before you finish:
- ✅ **Your repository is private** on GitHub
- ✅ **Environment variables are set** (not hardcoded in code)
- ✅ **Database password is secure** and not shared
- ✅ **JWT secret is long and random**
- ✅ **Site password is set** for initial access control

---

## ➡️ **Next Step**

**Continue to**: [Final Connection Guide](./final-connection.md)

**What's next**: We'll do final testing and make sure everything works perfectly together.

---

**Questions?** Write down exactly what you see on your screen and ask your developer for help. Include screenshots if possible! 