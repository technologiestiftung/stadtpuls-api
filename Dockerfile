FROM node:14.16-buster-slim as builder

ENV NODE_ENV=development
WORKDIR /usr/src/app
RUN npm install -g pnpm
COPY .npmrc package.json pnpm-lock.yaml ./

# for each sub-package, we have to add one extra step to copy its manifest
# to the right place, as docker have no way to filter out only package.json with
# single instruction
COPY packages/next-iot-hub-api/package.json packages/next-iot-hub-api/
COPY packages/fastify-supabase/package.json packages/fastify-supabase/

RUN pnpm multi install
COPY . .
RUN cd packages/fastify-supabase/ && pnpm run build
RUN cd packages/next-iot-hub-api/ && pnpm run build
#-----------------------------
#-----------------------------
#-----------------------------
#-----------------------------
#-----------------------------
FROM node:14.16-buster-slim as runner
ENV NODE_ENV=production
WORKDIR /usr/src/app
RUN npm install -g pnpm@6.0.2
COPY .npmrc package.json pnpm-lock.yaml ./
COPY packages/next-iot-hub-api/package.json packages/next-iot-hub-api/
COPY packages/fastify-supabase/package.json packages/fastify-supabase/
RUN pnpm fetch --prod
COPY --from=builder /usr/src/app/packages/next-iot-hub-api/dist ./
RUN pnpm install -r --prod

ENV TINI_VERSION v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]
EXPOSE 4000
USER node
CMD ["node", "index.js"]
