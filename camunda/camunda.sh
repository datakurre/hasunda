#!/bin/bash
set -Eeu

trap "Error on line $LINENO" ERR

CMD="java -jar camunda.jar"

if [ -n "${WAIT_FOR}" ]; then
  CMD="wait-for-it.sh ${WAIT_FOR} -s -t ${WAIT_FOR_TIMEOUT} -- ${CMD}"
fi

exec ${CMD}
