FROM redis:6.2.6-alpine

COPY redis.conf .
EXPOSE 10000
ENTRYPOINT ["redis-server", "./redis.conf"]