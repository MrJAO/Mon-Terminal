FROM node:18

# Create app directory
WORKDIR /app

# Install Python3 and pip
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

# Copy package files and install Node dependencies
COPY mcp-server/package*.json ./
RUN npm install

# Copy the rest of the app
COPY mcp-server/ ./

# Install Python dependencies
RUN pip3 install --no-cache-dir requests

# Expose the port your Express app listens on
EXPOSE 3001

# Start the Express server
CMD ["node", "index.js"]
