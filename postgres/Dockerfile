FROM postgres:11.2-alpine
# See also: https://docs.camunda.org/manual/latest/introduction/supported-environments/

ADD create-multiple-postgresql-databases.sh /docker-entrypoint-initdb.d/00.create.multiple.postgresql.databases.sh
ADD initialize-vasara-tables.sql /docker-entrypoint-initdb.d/00.initialize.vasara.tables.sql
