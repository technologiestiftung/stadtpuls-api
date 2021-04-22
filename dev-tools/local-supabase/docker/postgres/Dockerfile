FROM supabase/postgres:0.13.0

COPY docker-entrypoint-initdb.d/ /docker-entrypoint-initdb.d/

# Run time values
ENV POSTGRES_DB=postgres
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV POSTGRES_PORT=5432

EXPOSE 5432
