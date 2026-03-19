FROM node:20-alpine
WORKDIR /user_service 
# this means create a directory with name ravi and go inside it basically mkdir ravi and then cd ravi
COPY package*.json ./
# this means copy package.json file in current directory(ravi)
RUN npm install
COPY . .
EXPOSE 4500
CMD [ "node","index.js" ]
