import type { FastifyInstance } from "fastify";

export async function courseRoutes(app: FastifyInstance) {
  app.get(
    "/",
    { preHandler: [app.authenticate] },
    async (_request, reply) => {
      const courses = await app.prisma.course.findMany({
        orderBy: { code: "asc" },
      });

      return reply.send(courses);
    }
  );
}