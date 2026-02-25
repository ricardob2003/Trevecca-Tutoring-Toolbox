import type { FastifyReply, FastifyRequest } from "fastify";
import type { PrismaClient } from "@prisma/client";
import type { EmailService } from "../modules/email/email.service.js";
import "fastify";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
    prisma: any;
    emailService: any;
  }
}
declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
    emailService: EmailService;
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }

  interface FastifyJWT {
    payload: {
      sub: string;
      email: string;
      roles: string[];
      authProvider: "local" | "microsoft";
    };
    user: {
      sub: string;
      email: string;
      roles: string[];
      authProvider: "local" | "microsoft";
    };
  }
}
