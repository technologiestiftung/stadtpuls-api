FROM node:14.17-slim as builder
ENV NODE_ENV=development
WORKDIR /usr/src/app/
COPY ["package.json", "package-lock.json*", "./"]
RUN npm ci --silent
COPY . .
RUN npm run build

FROM node:14.17-slim as runner
WORKDIR /usr/app/
COPY ["package.json", "package-lock.json*", "./"]
ENV NODE_ENV=production
RUN npm ci --silent
COPY --from=builder /usr/src/app/dist/ /usr/app/
COPY ./config/ /usr/app/config/
# Add Tini
ENV TINI_VERSION v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

USER node
EXPOSE 4000
# TODO: [STADTPULS-415] Add pino-syslog to log to syslog https://github.com/pinojs/pino-syslog
# RUN npm install --production -g pino-syslog
# CMD ["node", "/usr/app/index.js", "|", "pino-syslog"]
CMD ["node", "/usr/app/index.js"]
