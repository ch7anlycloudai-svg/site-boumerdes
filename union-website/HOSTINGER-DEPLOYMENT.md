# Hostinger Cloud Hosting Deployment Guide

## Step 1: Prepare Files for Upload

Upload these folders/files to your Hostinger `public_html` directory:

```
public_html/
├── frontend/          (entire folder)
├── backend/           (entire folder, WITHOUT node_modules)
│   ├── server.js
│   ├── package.json
│   ├── .env           (create this file on server)
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── admin/
```

**Important:** Do NOT upload `node_modules/` folder - it will be installed on the server.

## Step 2: Configure Node.js in hPanel

1. Login to your Hostinger hPanel
2. Go to **Advanced** → **Node.js**
3. Configure:
   - **Node.js version:** 18.x or 20.x (latest LTS)
   - **Application root:** `/public_html/backend`
   - **Application startup file:** `server.js`
   - **Application URL:** Your domain

4. Click **Create** or **Save**

## Step 3: Create Environment Variables

In hPanel Node.js section, set these environment variables:

```
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-very-long-random-secret-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Or create a `.env` file in the `backend/` folder on the server with:

```
NODE_ENV=production
PORT=3000
SESSION_SECRET=change-this-to-a-very-long-random-string-for-security
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**IMPORTANT:** If you set environment variables in BOTH hPanel AND the `.env` file,
the `.env` file values will take priority (override is enabled).

## Step 4: Install Dependencies

In hPanel:
1. Go to **Advanced** → **SSH Access** (or use File Manager terminal)
2. Navigate to the backend folder:
   ```bash
   cd public_html/backend
   ```
3. Install dependencies:
   ```bash
   npm install --production
   ```

## Step 5: Start the Application

In hPanel Node.js section:
1. Click **Restart** to start/restart your application
2. Check the logs for any errors

## Step 6: Configure Domain (if needed)

Make sure your domain points to the Node.js application:
1. In hPanel, go to **Domains**
2. Ensure your domain is properly configured

## Troubleshooting

### Error: "Internal server error"
- Check the Node.js logs in hPanel
- Ensure `.env` file exists with correct values
- Make sure the `data/` folder can be created (write permissions)

### Error: "Cannot find module"
- Run `npm install` in the backend folder
- Make sure you're in the correct directory

### Database errors
- The database will be auto-created in `backend/data/database.sqlite`
- Make sure the backend folder has write permissions

### Static files not loading
- Check that `frontend/` folder is at the same level as `backend/`
- The server serves frontend from `../frontend` relative to backend

## File Structure on Hostinger

After deployment, your structure should look like:

```
public_html/
├── frontend/
│   ├── index.html
│   ├── about.html
│   ├── news.html
│   ├── guide.html
│   ├── programs.html
│   ├── services.html
│   ├── contact.html
│   ├── css/
│   └── js/
│
└── backend/
    ├── server.js
    ├── package.json
    ├── .env
    ├── data/
    │   └── database.sqlite  (auto-created)
    ├── node_modules/        (after npm install)
    ├── models/
    ├── routes/
    ├── middleware/
    └── admin/
```

## Admin Access

After deployment:
- Admin panel: `https://yourdomain.com/admin`
- Default login: `admin` / `admin123`
- **Change the password immediately after first login!**
