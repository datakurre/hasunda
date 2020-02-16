FROM python:3-alpine AS PYTHON_TOOLCHAIN
RUN apk add gcc musl-dev libffi-dev
RUN python -m venv /app
RUN /app/bin/pip install aiohttp aiocache aiodns ujson

FROM python:3-alpine
COPY --from=PYTHON_TOOLCHAIN /app /app
ADD app.py /app/bin/app.py
ENTRYPOINT [ "/app/bin/app.py" ]
