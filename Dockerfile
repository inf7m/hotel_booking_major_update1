# Use Node 20 as base
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json separately for caching
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies for both frontend and backend
RUN npm install --prefix frontend --include=dev
RUN npm install --prefix backend

# Copy all source files
COPY . .

# Build frontend
RUN npm run build --prefix frontend

# Expose port
EXPOSE 5000

# Start backend
CMD ["npm", "run", "start", "--prefix", "backend"]