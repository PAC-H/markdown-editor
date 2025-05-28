# Markdown Editor

A full-stack Markdown editor application with a React frontend and Go backend. This application allows you to create, edit, and save Markdown files directly from your browser.

## Features

- Monaco Editor integration for a powerful editing experience
- Real-time Markdown preview
- Save files to the server's local filesystem
- Load existing Markdown files
- Modern and responsive UI

## Prerequisites

- Node.js (v14 or later)
- Go (v1.16 or later)

## Setup

1. Clone this repository
2. Set up the backend:
   ```bash
   cd backend
   go run main.go
   ```
   The backend server will start on http://localhost:8080

3. Set up the frontend:
   ```bash
   cd frontend
   npm install
   npm start
   ```
   The frontend development server will start on http://localhost:3000

## Usage

1. Open your browser and navigate to http://localhost:3000
2. Start writing Markdown in the left panel
3. See the rendered preview in the right panel
4. Enter a filename (with .md extension) in the input field
5. Click "Save" to save your file to the server
6. Click "Load" to load an existing file from the server

## File Storage

Files are stored in the `files` directory within the backend server's root directory. Each file is saved with the `.md` extension.

## Technologies Used

- Frontend:
  - React
  - TypeScript
  - Monaco Editor
  - Marked (for Markdown parsing)
  
- Backend:
  - Go
  - Standard library (net/http) 