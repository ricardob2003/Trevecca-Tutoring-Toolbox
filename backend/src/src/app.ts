import { tutorRoutes } from "./modules/tutors/routes.js";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { authPlugin } from "./plugins/auth.js";
import { prismaPlugin } from "./plugins/prisma.js";
import { authRoutes } from "./modules/auth/routes.js";
import { healthRoutes } from "./modules/health/routes.js";
import { emailRoutes } from "./modules/email/routes.js";
import { createEmailService } from "./modules/email/email.service.js";
import { courseRoutes } from "./modules/courses/routes.js";
import { tutoringRequestRoutes } from "./modules/tutoring-requests/routes.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(authPlugin);
  await app.register(prismaPlugin);

  app.decorate("emailService", createEmailService());

  await app.register(healthRoutes, { prefix: "/api/v1/health" });
  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(emailRoutes, { prefix: "/api/v1/email" });
  await app.register(tutorRoutes, { prefix: "/api/v1/tutors" });
  await app.register(courseRoutes, { prefix: "/api/v1/courses" });
  await app.register(tutoringRequestRoutes, { prefix: "/api/v1/requests" });

  return app;
}