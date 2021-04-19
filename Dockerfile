FROM node:14.16-slim as builder
ENV NODE_ENV=development
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm ci --silent
COPY . .
RUN npm run build

FROM node:14.16-slim as runner
COPY ["package.json", "package-lock.json*", "./"]
RUN npm ci --silent
COPY --from=builder /usr/src/app/dist ./
USER node
EXPOSE 4000
CMD ["node", "index.js"]
