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
# Add Tini
ENV TINI_VERSION v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

USER node
EXPOSE 4000
CMD ["node", "index.js"]
