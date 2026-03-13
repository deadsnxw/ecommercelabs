FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache postgresql-client

COPY package*.json ./
RUN npm install

COPY . .

RUN npx nodemon --version || npm install -g nodemon

EXPOSE 5000

CMD ["sh", "-c", "./wait-for.sh postgres npm run migrate:up && npm run dev"]