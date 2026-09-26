# Mauritanian Students Union Website
# موقع اتحاد الطلبة الموريتانيين بالجزائر

A full-stack dynamic website for the Mauritanian Students Union in Algeria.

## Project Structure

```
union-website/
├── frontend/           # Original front-end files (your design preserved)
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
├── backend/            # Node.js/Express server
│   ├── server.js       # Main server file
│   ├── package.json
│   ├── routes/         # API routes
│   │   ├── auth.js     # Login/logout
│   │   ├── news.js     # News CRUD
│   │   ├── messages.js # Contact messages
│   │   ├── pages.js    # Page content
│   │   └── memberships.js
│   ├── models/
│   │   └── database.js # SQLite database setup
│   └── middleware/
│       └── auth.js     # Authentication middleware
│
└── admin/              # Admin dashboard
    ├── index.html      # Login page
    ├── dashboard.html  # Main dashboard
    ├── news.html       # News management
    ├── messages.html   # Messages management
    ├── memberships.html# Membership applications
    ├── pages.html      # Page content editor
    ├── css/
    └── js/
```

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. Open terminal in the project folder:
```bash
cd union-website/backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and visit:
   - **Website**: http://localhost:3000
   - **Admin Dashboard**: http://localhost:3000/admin

### Default Admin Credentials
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change the password after first login!

## Features

### Public Website
- All your original pages preserved (home, about, news, guide, programs, services, contact)
- Contact form now saves to database
- Membership form now saves to database
- News loaded dynamically from database

### Admin Dashboard

#### 1. News Management
- Create new articles
- Edit existing articles
- Delete articles
- Publish/unpublish articles
- Categories: News, Events, Announcements

#### 2. Contact Messages
- View all messages
- Mark as read/unread
- Reply via email
- Delete messages

#### 3. Membership Applications
- View all applications
- Approve/reject applications
- Filter by status
- Delete applications

#### 4. Page Content Editor
- Edit ALL text content on every page
- Changes apply instantly
- No need to edit HTML files

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/check` - Check auth status
- `PUT /api/auth/change-password` - Change password

### News
- `GET /api/news` - Get published news
- `GET /api/news/all` - Get all news (admin)
- `POST /api/news` - Create news (admin)
- `PUT /api/news/:id` - Update news (admin)
- `DELETE /api/news/:id` - Delete news (admin)

### Messages
- `POST /api/messages` - Submit contact form
- `GET /api/messages` - Get all messages (admin)
- `PATCH /api/messages/:id/read` - Mark as read (admin)
- `DELETE /api/messages/:id` - Delete message (admin)

### Page Content
- `GET /api/pages` - Get all pages content
- `GET /api/pages/:pageName` - Get page content
- `PUT /api/pages/:pageName/:sectionId` - Update section (admin)
- `PUT /api/pages/:pageName/bulk` - Bulk update (admin)

### Memberships
- `POST /api/memberships` - Submit application
- `GET /api/memberships` - Get all applications (admin)
- `PATCH /api/memberships/:id/status` - Update status (admin)
- `DELETE /api/memberships/:id` - Delete application (admin)

## Database

The project uses **SQLite** - a simple file-based database that requires no setup.

- Database file: `backend/database.sqlite`
- Created automatically on first run
- All your existing content is preserved

### Tables
- `admins` - Admin users
- `news` - News articles
- `messages` - Contact form messages
- `page_content` - Editable page content
- `memberships` - Membership applications

## Customization

### Adding New Page Content Sections

To make a text element editable from admin:

1. Add `data-content="section_id"` to your HTML:
```html
<h1 data-content="hero_title">Your Title</h1>
```

2. Add the section to the database in `database.js`:
```javascript
insert.run('pageName', 'section_id', 'Section Title', 'Content', 'text', 1);
```

### Changing the Port

Edit `backend/server.js` or create `.env`:
```
PORT=8080
```

## Development

### Run in development mode (with auto-restart):
```bash
npm run dev
```

### Production Deployment

1. Set environment variables:
```
NODE_ENV=production
SESSION_SECRET=your-secure-secret-key
```

2. Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start server.js
```

## Troubleshooting

### "Cannot find module" error
Run `npm install` in the backend folder.

### Port already in use
Change the port in `.env` or stop the other process.

### Database errors
Delete `database.sqlite` and restart the server to recreate it.

### Admin login not working
Default credentials: admin / admin123

## Support

For issues or questions, contact the development team.

---

Built with ❤️ for the Mauritanian Students Union in Algeria
