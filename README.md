# FileLiber - Professional Web File Explorer

FileLiber is a modern, professional web-based file sharing and management system built with Node.js and Express. It provides an intuitive, explorer-style interface for users to securely store, organize, and share their files.

## 🚀 Key Features

- **Professional UI/UX**: Clean, corporate-modern design with a sidebar-based file explorer layout.
- **User Authentication**: Secure registration and login system with password hashing (Bcrypt) and session management.
- **User Isolation**: Private storage for each user; files and directories are completely isolated.
- **File Explorer Functionality**:
    - **Directory Management**: Create and navigate through recursive folder structures.
    - **Breadcrumb Navigation**: Easily track and move between folder levels.
    - **Drag & Drop Upload**: Upload files by simply dragging them into the explorer view.
- **File Operations**: Full support for uploading, downloading, and deleting files and folders.
- **Security First**: 
    - Password encryption using Bcrypt.
    - Path traversal protection to prevent unauthorized file access.
    - SQLite database for reliable user management.

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite (via sqlite3)
- **Authentication**: Express-session, Bcrypt
- **File Handling**: Multer
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla ES6+), Bootstrap 5, Material Icons

## 📦 Installation & Setup

1. **Prerequisites**: Ensure you have [Node.js](https://nodejs.org/) installed.
2. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd FileLiber
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start the server**:
   ```bash
   node server.js
   ```
5. **Access the application**: Open your browser and navigate to `http://localhost:3000`.

## 📁 Project Structure

```text
FileLiber/
├── public/              # Frontend assets (HTML, CSS, JS)
│   └── index.html       # Single Page Application UI
├── uploads/             # User-uploaded files (Git ignored, structure kept)
├── server.js            # Main Express server and API logic
├── database.sqlite      # SQLite database file (Git ignored)
├── package.json         # Project dependencies and scripts
└── .gitignore           # Git ignore rules
```

## 🔒 Security Note

- The `uploads/` directory and `database.sqlite` are excluded from version control to protect user data and sensitive information.
- A `.gitkeep` file is maintained in the `uploads/` directory to preserve the folder structure.

## 📄 License

This project is open-source and available under the [ISC License](LICENSE).
