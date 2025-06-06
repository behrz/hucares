# 📝 GitHub Setup Guide - Storing Your Code Safely

**What this does**: This creates a safe place on the internet to store your app's code so it can be deployed to your website.

**Time needed**: 15 minutes

**Difficulty**: Easy (just clicking and uploading)

---

## 📋 **What You'll Need**

- ✅ An email address (to create your account)
- ✅ Your HuCares app code folder on your computer
- ✅ A web browser
- 📝 A notepad to write down important information

---

## 🎯 **Step 1: Create Your GitHub Account**

**What is GitHub?** Think of it like Google Drive, but specifically designed for storing computer code safely and keeping track of changes.

1. **Open your web browser** (Chrome, Safari, Firefox, etc.)

2. **Go to GitHub**: Type `github.com` in the address bar and press Enter

3. **Click "Sign up"** (top right corner)

4. **Fill in your information**:
   - **Email**: Your email address
   - **Password**: Create a strong password
   - **Username**: Choose something simple like `yourname-hucares`
     - This will be public, so keep it professional
     - You can't change it easily later

5. **Complete the verification** (you might need to solve a puzzle)

6. **Check your email** and click the verification link

7. **Skip any optional setup questions** by clicking "Skip" or "Continue"

8. **You should now see your GitHub dashboard**

---

## 🎯 **Step 2: Create a New Repository**

**What is a repository?** It's like a folder that holds all your app's code files.

1. **Look for a green "New" button** or **"Create repository"** button and click it

2. **Fill in the repository details**:
   - **Repository name**: `hucares-app` (use lowercase and dashes)
   - **Description**: `HuCares - Private Social Network for Weekly Check-ins`
   - **Visibility**: Choose **"Private"** (this keeps your code private)
   - **Initialize repository**: 
     - ✅ Check "Add a README file"
     - ❌ Don't check the other boxes

3. **Click "Create repository"**

4. **You should now see your new empty repository**

---

## 🎯 **Step 3: Upload Your Code Files**

**Important**: Make sure you have your HuCares app folder ready on your computer first.

### Option A: Using the Web Interface (Easiest)

1. **Click "uploading an existing file"** (you'll see this link on the main page)

2. **Drag and drop your entire HuCares app folder** into the upload area
   - OR click "choose your files" and select all files

3. **Wait for all files to upload** (this might take a few minutes)

4. **Scroll down to "Commit changes"**

5. **Fill in the commit message**:
   - Title: `Initial HuCares app upload`
   - Description: `Complete HuCares application ready for deployment`

6. **Click "Commit changes"**

### Option B: If Upload Doesn't Work

If the web upload fails (sometimes happens with many files):

1. **Create folders first**:
   - Click "Create new file"
   - Type `frontend/README.md` (this creates a frontend folder)
   - Add some text like "Frontend code goes here"
   - Click "Commit new file"

2. **Repeat for backend**:
   - Click "Create new file" 
   - Type `backend/README.md`
   - Add text "Backend code goes here"
   - Click "Commit new file"

3. **Upload files to each folder**:
   - Go into the frontend folder
   - Click "Upload files"
   - Drag your frontend files
   - Commit changes
   - Repeat for backend folder

---

## 🎯 **Step 4: Verify Your Upload**

1. **Go back to the main repository page**

2. **You should see your file structure**:
   - ✅ `frontend/` folder with React app files
   - ✅ `backend/` folder with Node.js server files
   - ✅ `README.md` file
   - ✅ `package.json` files
   - ✅ Other project files

3. **Click on a few folders** to make sure files are there

4. **If anything is missing**:
   - Use "Upload files" to add missing items
   - Or ask your developer for help

---

## 🎯 **Step 5: Set Up Repository Settings**

1. **Click on "Settings"** (top of the repository page)

2. **Scroll down to "Danger Zone"** (at the bottom)

3. **Make sure "Make this repository private" is selected**
   - If it says "Change visibility", leave it alone

4. **Go back to the main repository page** by clicking the repository name

---

## 🎯 **Step 6: Get Your Repository URL**

1. **Click the green "Code" button**

2. **Copy the HTTPS URL**:
   - It should look like: `https://github.com/yourusername/hucares-app.git`
   - Click the copy button next to the URL

3. **Write this URL down** - you'll need it for deployment

---

## 📝 **What to Write Down (Save This Information)**

Copy this template and fill in your information:

```
GITHUB SETUP COMPLETED
Date: ___________

Account Information:
- GitHub Username: ___________
- GitHub Email: ___________
- GitHub Password: ___________ (KEEP THIS SAFE!)

Repository Information:
- Repository Name: hucares-app
- Repository URL: https://github.com/[username]/hucares-app
- Visibility: Private
- Status: All code uploaded ✅

File Structure Confirmed:
- ✅ frontend/ folder with React app
- ✅ backend/ folder with Node.js server  
- ✅ README.md file
- ✅ package.json files
- ✅ All necessary code files

Next Steps:
- ✅ GitHub setup complete
- ✅ Code safely stored online
- ⏳ Continue to Hosting Setup Guide
```

---

## 🎉 **Success! What You Just Accomplished**

You've successfully:
- ✅ Created a secure GitHub account
- ✅ Created a private repository for your code
- ✅ Uploaded all your HuCares app files safely
- ✅ Made your code ready for deployment
- ✅ Protected your code with a private repository

---

## 🆘 **Common Problems and Solutions**

### Problem: "Upload failed" or "Files too large"
**Solution**: 
- Try uploading smaller batches of files
- Skip any `node_modules` folders (these can be recreated)
- Ask your developer to help with command line upload

### Problem: "I can't find the green Code button"
**Solution**: 
- Make sure you're on the main repository page
- Look for "Code" near the green "Add file" button
- Refresh the page if needed

### Problem: "Repository is public instead of private"
**Solution**:
- Go to Settings
- Scroll to "Danger Zone"
- Click "Change repository visibility"
- Select "Private"

### Problem: "I accidentally deleted something"
**Solution**:
- Don't panic! GitHub keeps history
- Look for "History" or "Commits" 
- You can restore previous versions
- Ask your developer for help

### Problem: "I can't see my files after upload"
**Solution**:
- Refresh the page
- Check that the upload completed fully
- Look in different folders
- Make sure you committed the changes

---

## 🔒 **Security Reminders**

- ✅ **Keep your GitHub password safe** - write it down somewhere secure
- ✅ **Don't share your repository** with strangers
- ✅ **Keep your repository private** - only you and people you trust should have access
- ✅ **Don't upload passwords or secret keys** in your code files

---

## ➡️ **Next Step**

**Continue to**: [Hosting Setup Guide](./hosting-setup.md)

**What's next**: We'll connect your code to Vercel so it becomes a live website.

---

**Questions?** Write down exactly what you see on your screen and ask your developer for help. Include screenshots if possible! 