import type { FastifyInstance, FastifyRequest } from "fastify";

function norm(s: string) {
  return (s || "").trim().toLowerCase();
}

function hasRole(request: FastifyRequest, role: string) {
  const roles = (request.user as any)?.roles as string[] | undefined;
  if (!roles) return false;
  return roles.some((r) => norm(r) === norm(role));
}

export async function tutorRoutes(app: FastifyInstance) {
  app.get(
    "/",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      if (!hasRole(request, "admin")) {
        return reply.code(403).send({ message: "Admin only" });
      }

      const tutors = await app.prisma.tutor.findMany({
        where: { active: true },
        include: {
          user: true,
        },
        orderBy: {
          user: {
            firstName: "asc",
          },
        },
      });

      return reply.send(tutors);
    }
  );
}