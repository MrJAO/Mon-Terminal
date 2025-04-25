FROM node:18

# Create app directory
WORKDIR /app

# Install Python3, venv, and pip
RUN apt-get update && \
    apt-get install -y python3 python3-venv python3-pip && \
    rm -rf /var/lib/apt/lists/*

# Create a virtual environment for Python dependencies
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies inside the venv
RUN pip install --no-cache-dir requests

# Copy package files and install Node dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app code
COPY . ./

# Expose the port your Express app listens on
EXPOSE 3001

# Start the Express server #
CMD ["node", "index.js"]
