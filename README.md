Note: Project has been renamed and moved to https://gitlab.com/vasara-bpm/vasara

Getting started:

* Add `/etc/hosts` alias for `localhost` as `keycloak` (for OIDC login)
* `docker-compose up` (may take a while)
* `yarn && yarn start` (with credentials camunda-admin:admin)

Exposed services:

* Keycloack at  http://localhost:8080/ (with admin:admin)
* Camunda at  http://localhost:8800/ (with camunda-admin:admin)
* Mailhog at http://localhost:8025/
* Hasura at http://localhost:8900/
* Node RED at http://localhost:1880/
* React-Admin at http://localhost:3000/
