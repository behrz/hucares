# 🌐 Domain Setup Guide - Connecting Your Namecheap Domain

**What this does**: This connects your domain name (like `hucares.com`) to your website so people can visit it.

**Time needed**: 30 minutes

**Difficulty**: Easy (just clicking and copy-pasting)

---

## 📋 **What You'll Need**

- ✅ Your Namecheap account login
- ✅ Your domain name (the one you bought)
- 📝 A notepad to write down important information

---

## 🎯 **Step 1: Log Into Namecheap**

1. **Open your web browser** (Chrome, Safari, Firefox, etc.)

2. **Go to Namecheap**: Type `namecheap.com` in the address bar and press Enter

3. **Click "Sign In"** (top right corner)

4. **Enter your login information**:
   - Email address
   - Password
   - Click "Sign In"

5. **You should see your dashboard** with a list of your domains

---

## 🎯 **Step 2: Find Your Domain**

1. **Look for your domain** in the list (it should show `hucares.com` or whatever you bought)

2. **Click "Manage"** next to your domain name
   - If you don't see "Manage", click on the domain name itself

3. **You're now in the domain control panel**
   - This is where we'll make changes

---

## 🎯 **Step 3: Set Up DNS Records**

**What is DNS?** Think of it like a phone book for the internet. When someone types your domain name, DNS tells their computer where to find your website.

### Part A: Go to DNS Settings

1. **Look for a tab called "Advanced DNS"** and click it
   - It might also be called "DNS" or "DNS Management"

2. **You'll see a table with DNS records**
   - This might look confusing, but we'll add simple ones

### Part B: Add the First Record (A Record)

1. **Click "Add New Record"** (usually a button or link)

2. **Choose "A Record"** from the dropdown menu

3. **Fill in these fields exactly**:
   - **Type**: A Record (already selected)
   - **Host**: @ (just the @ symbol)
   - **Value**: `76.76.19.19` (this is Vercel's IP address)
   - **TTL**: Leave as "Automatic" or "1 min"

4. **Click "Save" or "Add Record"**

### Part C: Add the Second Record (CNAME Record)

1. **Click "Add New Record"** again

2. **Choose "CNAME Record"** from the dropdown menu

3. **Fill in these fields exactly**:
   - **Type**: CNAME Record (already selected)
   - **Host**: www
   - **Value**: `cname.vercel-dns.com`
   - **TTL**: Leave as "Automatic" or "1 min"

4. **Click "Save" or "Add Record"**

---

## 🎯 **Step 4: Save Your Settings**

1. **Look for a "Save Changes" button** at the bottom of the page
   - Click it if you see one

2. **You should see a confirmation message**
   - Something like "DNS records updated successfully"

3. **Write down what you just did**:
   ```
   Domain: [your domain name]
   Date: [today's date]
   Added A Record: @ → 76.76.19.19
   Added CNAME Record: www → cname.vercel-dns.com
   ```

---

## 🎯 **Step 5: Wait for Changes to Take Effect**

**Important**: DNS changes take time to spread across the internet.

1. **Wait 15-30 minutes** before testing
   - Changes can take up to 48 hours, but usually work within 30 minutes

2. **Don't worry if it doesn't work immediately**
   - This is completely normal

3. **You can continue with the next guide** while you wait

---

## ✅ **How to Test If It's Working**

After waiting 30 minutes:

1. **Open a new browser tab**

2. **Type your domain name**: `yourdomain.com`
   - Replace "yourdomain" with your actual domain

3. **What you might see**:
   - ✅ **"This site can't be reached"** or **"404 Not Found"** = DNS is working! (We haven't built the website yet)
   - ❌ **"DNS error"** or **"Server not found"** = Wait longer, or check your DNS settings

---

## 🆘 **Troubleshooting Common Problems**

### Problem: "I don't see Advanced DNS"
**Solution**: 
- Look for "DNS", "Domain", or "Nameservers" tabs
- Some accounts show "DNS Management" instead

### Problem: "It says my domain is locked"
**Solution**:
- Look for "Domain Lock" or "Registrar Lock" settings
- Turn OFF the lock temporarily
- You can turn it back on later

### Problem: "I made a mistake in the DNS records"
**Solution**:
- Find the record you want to change
- Click "Edit" or the pencil icon
- Fix the information
- Click "Save"

### Problem: "I don't see where to add records"
**Solution**:
- Look for buttons like:
  - "Add New Record"
  - "Add Record" 
  - "+"
  - "Create Record"

---

## 📝 **What to Write Down (Save This Information)**

Copy this template and fill in your information:

```
DOMAIN SETUP COMPLETED
Date: ___________
Domain: ___________

DNS Records Added:
1. A Record: @ → 76.76.19.19
2. CNAME Record: www → cname.vercel-dns.com

Login Information:
- Namecheap Username: ___________
- Domain Status: Active
- DNS Management: Completed

Next Steps: 
- ✅ Domain setup complete
- ⏳ Continue to Database Setup Guide
```

---

## 🎉 **Success! What You Just Accomplished**

You've successfully:
- ✅ Connected your domain to point to Vercel (where your website will live)
- ✅ Set up both main domain (`hucares.com`) and www version (`www.hucares.com`)
- ✅ Prepared your domain to show your website when it's ready

---

## ➡️ **Next Step**

**Continue to**: [Database Setup Guide](./database-setup.md)

**What's next**: We'll create a place to store all your app's data (user accounts, check-ins, groups).

---

**Questions?** Write down exactly what you see on your screen and ask your developer for help. Include screenshots if possible! 