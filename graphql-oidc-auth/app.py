#!/app/bin/python
# -*- coding: utf-8 -*-
from aiohttp import client
from aiohttp import web
from os import environ as env

import logging
import aiocache


AIOHTTP_PORT = env.get(
    "AIOHTTP_PORT",
    "8080"
)
USER_INFO = env.get(
    "USER_INFO",
    "http://localhost:8100/auth/realms/master/protocol/openid-connect/userinfo"
)
TOKEN_INFO = env.get(
    "TOKEN_INFO",
    "http://localhost:8100/auth/realms/master/protocol/openid-connect/token/introspect"
)


logger = logging.getLogger("hasura-auth-webhook")
logging.basicConfig(level=logging.DEBUG)
routes = web.RouteTableDef()


@aiocache.cached(ttl=60, serializer=aiocache.serializers.JsonSerializer())
async def get_user_info(authorization):
    async with client.ClientSession(headers={
        "Authorization": authorization,
    }) as session:
        async with session.get(TOKEN_INFO) as response:
            token_json = await response.json()
            if True or "openid" in ((token_json or {}).get("scope") or []):
                async with session.get(USER_INFO) as response:
                    return await response.json() or {}
    return {}


@routes.get("/")
async def read_authorize_header(request):
    if "Authorization" in request.headers:
        authorization = request.headers["Authorization"]
        if authorization.startswith("Bearer "):
            user_info = await get_user_info(authorization)
            if "preferred_username" in user_info:
                logger.debug(f"Valid user_info: {user_info}")
                return web.json_response({
                    "X-Hasura-Role": "authenticated",
                    "X-Hasura-User-Id": user_info["preferred_username"],
                })
            logger.warning(f"Invalid user_info: {user_info}")
            logger.debug({
                "X-Hasura-Role": "anonymous",
            })
            return web.json_response({
                "X-Hasura-Role": "anonymous"}
            )
    logger.debug({
        "X-Hasura-Role": "anonymous",
    })
    return web.json_response({
        "X-Hasura-Role": "anonymous",
    })


def main():
    app = web.Application()
    app.add_routes(routes)
    web.run_app(app, port=int(AIOHTTP_PORT))


if __name__ == "__main__":
    main()
