import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import type { FastifyRequest } from "fastify";
import { env } from "../config/env.js";

const SESSION_COOKIE_NAME = "tt_session";

type JwtUser = {
  sub: string;
  email: string;
  roles: string[];
  authProvider: "local" | "microsoft";
};

function getSessionTokenFromCookie(request: FastifyRequest): string | null {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) {
    return null;
  }

  for (const entry of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = entry.trim().split("=");
    if (rawName !== SESSION_COOKIE_NAME) {
      continue;
    }

    const value = rawValue.join("=");
    if (!value) {
      return null;
    }

    try {
      return decodeURIComponent(value);
    } catch {
      return null;
    }
  }

  return null;
}

function getTokenFromRequest(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  if (authHeader) {
    const [scheme, token] = authHeader.split(" ");
    if (scheme?.toLowerCase() === "bearer" && token) {
      return token;
    }
  }

  return getSessionTokenFromCookie(request);
}

export const authPlugin = fp(async (app) => {
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  });

  app.decorate("authenticate", async (request, reply) => {
    const token = getTokenFromRequest(request);
    if (!token) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    try {
      const user = app.jwt.verify<JwtUser>(token);
      (request as FastifyRequest & { user: JwtUser }).user = user;
    } catch {
      return reply.code(401).send({ message: "Unauthorized" });
    }
  });
});
