# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the application code to the container
COPY . .

# Install necessary dependencies (if you have any)
RUN npm install express

# Expose port 3001
EXPOSE 3001

# Start the application
CMD ["node", "app.js"]
