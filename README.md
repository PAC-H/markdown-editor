# Markdown Editor

A full-stack Markdown editor application with a React frontend and Go backend. This application allows you to create, edit, and save Markdown files directly from your browser.

## Features

- Monaco Editor integration for a powerful editing experience
- Real-time Markdown preview
- Save files to the server's local filesystem
- Load existing Markdown files
- Modern and responsive UI

## Prerequisites

- Node.js (v14 or later) - for local development
- Go (v1.16 or later) - for local development
- Docker and Docker Compose - for containerized deployment

## Local Development Setup

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

## Docker Deployment

### Quick Start

1. Make sure Docker and Docker Compose are installed on your system
2. Clone this repository
3. From the project root directory, run:
   ```bash
   docker-compose up --build
   ```
4. Access the application at http://localhost:3000

### Docker Commands

- Build and start the containers:
  ```bash
  docker-compose up --build
  ```

- Start existing containers:
  ```bash
  docker-compose up
  ```

- Stop the containers:
  ```bash
  docker-compose down
  ```

- View container logs:
  ```bash
  docker-compose logs -f
  ```

### Container Structure

- Frontend Container:
  - Runs on port 3000
  - Nginx server serving the React application
  - Automatically proxies API requests to the backend

- Backend Container:
  - Runs on port 8080
  - Go server handling file operations
  - Persistent volume for file storage

### Volumes and Persistence

The backend's `files` directory is persisted using a Docker volume. Files saved through the application will be stored in:
```
./backend/files
```

### Troubleshooting

1. If the containers fail to start:
   - Check if ports 3000 or 8080 are already in use
   - Run `docker-compose down` and try again
   
2. If changes aren't reflected:
   - Rebuild the containers with `docker-compose up --build`
   
3. If file permissions issues occur:
   - Ensure the `backend/files` directory exists and has proper permissions
   - Run `chmod 777 backend/files` if needed

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

- Deployment:
  - Docker
  - Docker Compose
  - Nginx 