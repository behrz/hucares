# 🗄️ Database Setup Guide - Creating Your Data Storage

**What this does**: This creates a secure place to store all your app's information (user accounts, check-ins, groups).

**Time needed**: 20 minutes

**Difficulty**: Easy (just clicking and copy-pasting)

---

## 📋 **What You'll Need**

- ✅ An email address (to create your account)
- ✅ A web browser
- 📝 A notepad to write down important information

---

## 🎯 **Step 1: Create Your Supabase Account**

**What is Supabase?** Think of it like a very secure filing cabinet that lives on the internet. It stores all your app's data safely.

1. **Open your web browser** (Chrome, Safari, Firefox, etc.)

2. **Go to Supabase**: Type `supabase.com` in the address bar and press Enter

3. **Click "Start your project"** (big green button)

4. **Click "Sign in with GitHub"** OR **"Sign up with email"**
   - **If you choose GitHub**: You'll need to create a GitHub account first (it's free)
   - **If you choose email**: Fill in your email and create a password

5. **Check your email** and click the confirmation link if asked

6. **You should now see the Supabase dashboard**

---

## 🎯 **Step 2: Create Your Project**

1. **Click "New Project"** (usually a green button)

2. **Choose your organization**:
   - If this is your first time, you might need to create an organization
   - Just use your name or "HuCares" as the organization name

3. **Fill in the project details**:
   - **Name**: `HuCares App` (or whatever you prefer)
   - **Database Password**: Click "Generate a password" 
     - **IMPORTANT**: Copy this password and write it down somewhere safe!
   - **Region**: Choose the one closest to where most of your friends live
     - US East (North Virginia) for US East Coast
     - US West (Oregon) for US West Coast
     - Europe (Ireland) for Europe
     - Asia Pacific (Singapore) for Asia

4. **Click "Create new project"**

5. **Wait for the project to be created** (this takes 2-3 minutes)
   - You'll see a progress bar
   - Don't close the browser tab!

---

## 🎯 **Step 3: Get Your Database Connection Information**

Once your project is ready:

1. **Look for "Settings"** in the left sidebar and click it

2. **Click "Database"** in the settings menu

3. **Scroll down to "Connection info"**

4. **Copy and write down these important pieces of information**:
   ```
   Host: [copy this exactly]
   Database name: postgres
   Port: 5432
   User: postgres
   Password: [the password you generated in Step 2]
   ```

5. **Also look for "Connection string"**:
   - It starts with `postgresql://postgres:`
   - Copy this entire long string and save it
   - **This is your DATABASE_URL** - very important!

---

## 🎯 **Step 4: Set Up Your Database Tables**

**What are tables?** Think of them like different filing cabinets for different types of information (users, groups, check-ins).

1. **Go to the "SQL Editor"** in the left sidebar

2. **Click "New query"**

3. **Copy and paste this code** into the big text box:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  access_code VARCHAR(10) UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  max_members INTEGER DEFAULT 20
);

-- Create group memberships table
CREATE TABLE group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  group_id UUID REFERENCES groups(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role VARCHAR(20) DEFAULT 'member',
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, group_id)
);

-- Create check-ins table
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  group_id UUID REFERENCES groups(id),
  week_start_date DATE NOT NULL,
  productive_score INTEGER CHECK (productive_score >= 1 AND productive_score <= 10),
  satisfied_score INTEGER CHECK (satisfied_score >= 1 AND satisfied_score <= 10),
  body_score INTEGER CHECK (body_score >= 1 AND body_score <= 10),
  care_score INTEGER CHECK (care_score >= 1 AND care_score <= 10),
  hu_cares_score INTEGER GENERATED ALWAYS AS (productive_score + satisfied_score + body_score - care_score) STORED,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, group_id, week_start_date)
);

-- Create weekly group summaries table
CREATE TABLE weekly_group_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id),
  week_start_date DATE NOT NULL,
  average_hu_cares_score DECIMAL(4,2),
  total_check_ins INTEGER,
  participation_rate DECIMAL(4,2),
  highest_score INTEGER,
  lowest_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, week_start_date)
);

-- Create performance indexes
CREATE INDEX idx_check_ins_user_group ON check_ins(user_id, group_id);
CREATE INDEX idx_check_ins_week ON check_ins(week_start_date);
CREATE INDEX idx_group_memberships_user ON group_memberships(user_id);
CREATE INDEX idx_group_memberships_group ON group_memberships(group_id);
```

4. **Click "Run"** (usually a play button or "Run" button)

5. **You should see "Success. No rows returned."**
   - This is good! It means your tables were created successfully

6. **If you see an error**:
   - Don't panic! 
   - Take a screenshot
   - Ask your developer for help

---

## 🎯 **Step 5: Test Your Database**

1. **Go to "Table Editor"** in the left sidebar

2. **You should see 5 tables**:
   - ✅ users
   - ✅ groups  
   - ✅ group_memberships
   - ✅ check_ins
   - ✅ weekly_group_summaries

3. **Click on each table** to see the empty columns
   - This confirms everything was set up correctly

---

## 🎯 **Step 6: Set Up Row Level Security (RLS)**

**What is RLS?** This makes sure users can only see their own data and their friends' data, not everyone's data.

1. **Go back to the SQL Editor**

2. **Create a new query**

3. **Copy and paste this code**:

```sql
-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_group_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies (rules for who can see what data)
-- Users can only see their own user record
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Users can see groups they belong to
CREATE POLICY "Users can view groups they belong to" ON groups FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_memberships 
    WHERE group_id = groups.id 
    AND user_id::text = auth.uid()::text 
    AND is_active = true
  )
);

-- Users can see memberships for groups they belong to
CREATE POLICY "Users can view group memberships" ON group_memberships FOR SELECT USING (
  user_id::text = auth.uid()::text OR 
  EXISTS (
    SELECT 1 FROM group_memberships gm 
    WHERE gm.group_id = group_memberships.group_id 
    AND gm.user_id::text = auth.uid()::text 
    AND gm.is_active = true
  )
);

-- Users can see check-ins for groups they belong to
CREATE POLICY "Users can view group check-ins" ON check_ins FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_memberships 
    WHERE group_id = check_ins.group_id 
    AND user_id::text = auth.uid()::text 
    AND is_active = true
  )
);

-- Users can see group summaries for groups they belong to
CREATE POLICY "Users can view group summaries" ON weekly_group_summaries FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_memberships 
    WHERE group_id = weekly_group_summaries.group_id 
    AND user_id::text = auth.uid()::text 
    AND is_active = true
  )
);
```

4. **Click "Run"**

5. **You should see "Success" messages**

---

## 📝 **What to Write Down (Save This Information)**

Copy this template and fill in your information:

```
SUPABASE DATABASE SETUP COMPLETED
Date: ___________

Account Information:
- Supabase Email: ___________
- Project Name: HuCares App
- Region: ___________

Connection Information:
- Host: ___________
- Database: postgres
- Port: 5432
- User: postgres
- Password: ___________ (KEEP THIS SAFE!)

DATABASE_URL (full connection string):
postgresql://postgres:[password]@[host]:5432/postgres

Tables Created:
- ✅ users
- ✅ groups
- ✅ group_memberships  
- ✅ check_ins
- ✅ weekly_group_summaries

Security: 
- ✅ Row Level Security enabled
- ✅ Access policies created

Next Steps:
- ✅ Database setup complete
- ⏳ Continue to GitHub Setup Guide
```

---

## 🎉 **Success! What You Just Accomplished**

You've successfully:
- ✅ Created a secure cloud database
- ✅ Set up all the tables to store your app's data
- ✅ Protected the data so only authorized users can access it
- ✅ Got all the connection information your app needs

---

## 🆘 **Common Problems and Solutions**

### Problem: "I can't find the SQL Editor"
**Solution**: Look for "SQL" or "Query" in the left sidebar menu

### Problem: "The SQL code gave me an error"
**Solution**: 
- Make sure you copied the entire code block
- Try running it again
- Contact your developer with a screenshot

### Problem: "I lost my database password"
**Solution**:
- Go to Settings → Database
- Look for "Reset database password" 
- Generate a new one and write it down

### Problem: "I don't see my tables in Table Editor"
**Solution**:
- Refresh the page
- Check that the SQL ran successfully
- Look for error messages in the SQL Editor

---

## ➡️ **Next Step**

**Continue to**: [GitHub Setup Guide](./github-setup.md)

**What's next**: We'll create a safe place to store your app's code online.

---

**Questions?** Write down exactly what you see on your screen and ask your developer for help. Include screenshots if possible! 