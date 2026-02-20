import type { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function buildRoles(baseRole: string, isActiveTutor: boolean) {
  const roles = new Set<string>([baseRole]);
  if (isActiveTutor) {
    roles.add("tutor");
  }
  return Array.from(roles);
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

    return {
      token,
      user: {
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
        authProvider: "local",
      },
    };
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
