FROM maven:3.6.1-jdk-8-alpine AS MAVEN_TOOL_CHAIN
WORKDIR /tmp/
RUN \
    curl -LO https://github.com/datakurre/camunda-bpm-graphql/archive/hasunda.tar.gz; \
    tar xzvf hasunda.tar.gz; \
    cd camunda-bpm-graphql-hasunda; \
    mvn package; \
    mvn install:install-file -Dfile=extension/target/camunda-bpm-graphql-0.4.0-SNAPSHOT.jar -DgroupId=org.camunda.bpm.extension -DartifactId=camunda-bpm-graphql -Dversion=0.4.0-SNAPSHOT -Dpackaging=jar -DgeneratePom=true; \
    cd ..
COPY . .
RUN mvn package

FROM openjdk:8-jre-slim
ENV MAIL_TRANSPORT_PROTOCOL smtp
ENV MAIL_SMTP_HOST mailhog
ENV MAIL_SMTP_PORT 1025
ENV MAIL_SMTP_AUTH false
ENV MAIL_SMTP_SSL_ENABLE false
ENV MAIL_SENDER noreply@exapmle.com
COPY --from=MAVEN_TOOL_CHAIN /tmp/app/target/hasunda-camunda-app-0.1.0-SNAPSHOT.jar /
CMD ["java", "-jar", "hasunda-camunda-app-0.1.0-SNAPSHOT.jar" ]
