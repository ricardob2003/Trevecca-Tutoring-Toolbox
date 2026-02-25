import type { FastifyInstance } from "fastify";

export async function coursesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/", async (_request, reply) => {
    const courses = await app.prisma.course.findMany({
      orderBy: { code: "asc" },
    });

    return reply.code(200).send(courses);
  });
}

