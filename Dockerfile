# Use the official Node.js 20 image based on Alpine Linux
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available) to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy the rest of your application code to the working directory
COPY . .

# Build your application, if needed (optional based on your application)
# RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Command to run your application
CMD ["node", "app.js"]
