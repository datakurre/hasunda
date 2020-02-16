FROM maven:3.6.1-jdk-8-alpine AS builder
WORKDIR /tmp/
# camund-bpm-graphql
RUN \
    curl -LO https://github.com/datakurre/camunda-bpm-graphql/archive/hasunda.tar.gz; \
    tar xzvf hasunda.tar.gz; \
    cd camunda-bpm-graphql-hasunda; \
    mvn package; \
    mvn install:install-file -Dfile=extension/target/camunda-bpm-graphql-0.4.0-SNAPSHOT.jar -DgroupId=org.camunda.bpm.extension -DartifactId=camunda-bpm-graphql -Dversion=0.4.0-SNAPSHOT -Dpackaging=jar -DgeneratePom=true; \
    cd ..
# pre-populate maven cache
RUN \
    curl -LO https://github.com/datakurre/hasunda/archive/master.tar.gz; \
    tar xzvf spring-boot.tar.gz; \
    cd hasunda-spring-boot/camunda; \
    mvn package; \
    cd ../..
# camunda
COPY . .
RUN mvn package

##### FINAL IMAGE #####

FROM alpine:3.10
ENV DEBUG=false
ENV JAVA_OPTS="-Xmx768m -XX:MaxMetaspaceSize=256m"
ENV TZ UTC
ENV WAIT_FOR_TIMEOUT 30

# Downgrading wait-for-it is necessary until this PR is merged
# https://github.com/vishnubob/wait-for-it/pull/68
RUN apk add --no-cache \
        bash \
        ca-certificates \
        curl \
        openjdk11-jre-headless \
        tzdata \
        tini \
        xmlstarlet \
    && curl -o /usr/local/bin/wait-for-it.sh \
      "https://raw.githubusercontent.com/vishnubob/wait-for-it/a454892f3c2ebbc22bd15e446415b8fcb7c1cfa4/wait-for-it.sh" \
    && chmod +x /usr/local/bin/wait-for-it.sh

RUN addgroup -g 1000 -S camunda && \
    adduser -u 1000 -S camunda -G camunda -h /camunda -s /bin/bash -D camunda
WORKDIR /camunda
USER camunda

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["./camunda.sh"]

COPY --chown=camunda:camunda camunda.sh /camunda/camunda.sh
COPY --chown=camunda:camunda --from=builder /tmp/app/target/*.jar /camunda/camunda.jar
