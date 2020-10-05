FROM node:14.11.0-alpine3.10

WORKDIR /app
COPY package.json .
COPY package-lock.json dest
RUN npm install --only=prod
COPY . .

CMD [ "npm", "start" ]