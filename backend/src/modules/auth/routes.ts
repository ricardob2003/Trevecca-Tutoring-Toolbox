import type { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";
import { env } from "../../config/env.js";

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const SESSION_COOKIE_NAME = "tt_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function buildRoles(baseRole: string, isActiveTutor: boolean) {
  const roles = new Set<string>([baseRole]);
  if (isActiveTutor) {
    roles.add("tutor");
  }
  return Array.from(roles);
}

function buildSessionCookie(token: string) {
  const attributes = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ];

  if (env.NODE_ENV === "production") {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}

function buildSessionCookieClear() {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function mapUserResponse(user: {
  treveccaId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tutor:
    | {
        subjects: string[];
        hourlyLimit: number;
        active: boolean;
      }
    | null;
}) {
  return {
    id: user.treveccaId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    tutor: user.tutor
      ? {
          subjects: user.tutor.subjects,
          hourlyLimit: user.tutor.hourlyLimit,
          active: user.tutor.active,
        }
      : null,
    authProvider: "local" as const,
  };
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/login", async (request, reply) => {
    const parsed = loginBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        message: "Invalid login payload",
        issues: parsed.error.flatten(),
      });
    }

    const user = await app.prisma.user.findUnique({
      where: {
        email: parsed.data.email.toLowerCase(),
      },
      include: {
        tutor: true,
      },
    });

    if (!user) {
      return reply.code(401).send({ message: "Invalid email or password" });
    }

    // Verify password
    if (!user.passwordHash) {
      return reply.code(401).send({ message: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(
      parsed.data.password,
      user.passwordHash
    );
    if (!passwordMatch) {
      return reply.code(401).send({ message: "Invalid email or password" });
    }

    const token = app.jwt.sign({
      sub: String(user.treveccaId),
      email: user.email,
      roles: buildRoles(user.role, Boolean(user.tutor?.active)),
      authProvider: "local",
    });

    reply.header("Set-Cookie", buildSessionCookie(token));

    return {
      token,
      user: mapUserResponse({
        treveccaId: user.treveccaId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tutor: user.tutor
          ? {
              subjects: user.tutor.subjects,
              hourlyLimit: user.tutor.hourlyLimit,
              active: user.tutor.active,
            }
          : null,
      }),
    };
  });

  app.get("/me", { preHandler: app.authenticate }, async (request, reply) => {
    const jwtUser = request.user as { sub?: string };
    const treveccaId = Number(jwtUser.sub);
    if (!Number.isInteger(treveccaId)) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const user = await app.prisma.user.findUnique({
      where: { treveccaId },
      include: { tutor: true },
    });

    if (!user) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    return {
      user: mapUserResponse({
        treveccaId: user.treveccaId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tutor: user.tutor
          ? {
              subjects: user.tutor.subjects,
              hourlyLimit: user.tutor.hourlyLimit,
              active: user.tutor.active,
            }
          : null,
      }),
    };
  });

  app.post("/logout", async (_request, reply) => {
    reply.header("Set-Cookie", buildSessionCookieClear());
    return reply.code(204).send();
  });

  // Future Microsoft Entra ID login routes (placeholders for now)

  app.get("/microsoft/start", async (_request, reply) => {
    return reply.code(501).send({
      enabled: false,
      message:
        "Microsoft Entra ID login is planned but not configured yet.",
    });
  });

  app.get("/microsoft/callback", async (_request, reply) => {
    return reply.code(501).send({
      enabled: false,
      message:
        "Microsoft callback endpoint placeholder. Configure Entra ID to enable this flow.",
    });
  });
}
