# FROM node:20-alpine
# WORKDIR /review_service 
# # this means create a directory with name ravi and go inside it basically mkdir ravi and then cd ravi
# COPY package*.json ./
# # this means copy package.json file in current directory(ravi)
# RUN npm install pm2 -g
# RUN npm install
# COPY . .
# EXPOSE 3000
# CMD ["pm2", "start", "ecosystem.config.js"]


# 1. Use a lightweight Node.js image

FROM node:20-slim

# 2. Install PM2 and system dependencies for monitoring
# 'procps' is needed for PM2 to monitor CPU/RAM on Linux
# RUN apt-get update && apt-get install -y procps && \
#     npm install pm2 -g && \
#     rm -rf /var/lib/apt/lists/*

RUN npm install pm2 -g
# 3. Set the working directory
WORKDIR /app

# 4. Copy ONLY package files first (This is the trick for speed!)
COPY package*.json ./

# 5. Install ALL dependencies (node_modules)
# Using 'npm ci' is faster and more reliable for Docker/Production
RUN npm install

# 6. Now copy the rest of your application code
COPY . .

# 7. Start the app with pm2-runtime
CMD ["pm2-runtime", "start", "ecosystem.config.js"]