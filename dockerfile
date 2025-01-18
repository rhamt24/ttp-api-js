FROM node:18-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
  libpixman-1-dev \
  libcairo2-dev

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Install project dependencies
RUN npm install

# Start application
CMD ["npm", "start"]

