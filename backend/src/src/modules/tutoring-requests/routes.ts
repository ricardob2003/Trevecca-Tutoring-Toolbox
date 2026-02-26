import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";

type ReqStatus = "pending" | "pending_tutor" | "approved" | "denied";

function norm(s: string) {
  return (s || "").trim().toLowerCase();
}

function hasRole(request: FastifyRequest, role: string) {
  const roles = (request.user as any)?.roles as string[] | undefined;
  if (!roles) return false;
  const target = norm(role);
  return roles.some((r) => norm(r) === target);
}

function getUserId(request: FastifyRequest) {
  const sub = (request.user as any)?.sub;
  const id = Number(sub);
  return Number.isFinite(id) ? id : null;
}

function assertTransition(current: ReqStatus, next: ReqStatus) {
  const allowed: Record<ReqStatus, ReqStatus[]> = {
    pending: ["pending_tutor", "denied"],
    pending_tutor: ["approved", "pending", "denied"],
    approved: [],
    denied: [],
  };

  if (!allowed[current].includes(next)) {
    throw new Error(`Invalid status transition: ${current} -> ${next}`);
  }
}

function toStatus(value: string): ReqStatus | null {
  const v = norm(value);

  if (v === "pending") return "pending";
  if (v === "pending_tutor") return "pending_tutor";
  if (v === "approved") return "approved";
  if (v === "denied") return "denied";

  if (value === "PENDING") return "pending";
  if (value === "PENDING_TUTOR") return "pending_tutor";
  if (value === "APPROVED") return "approved";
  if (value === "DENIED") return "denied";

  return null;
}

const listQuerySchema = z.object({
  status: z.string().optional(),
  user_id: z.coerce.number().optional(),
  requested_tutor_id: z.coerce.number().optional(),
});

const assignBodySchema = z.object({
  tutor_id: z.coerce.number(),
});

const tutorResponseBodySchema = z.object({
  accepted: z.boolean(),
});

export async function tutoringRequestRoutes(app: FastifyInstance) {
  app.get(
    "/",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const parsed = listQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          message: "Invalid query",
          issues: parsed.error.flatten(),
        });
      }

      const isAdmin = hasRole(request, "admin");
      const me = getUserId(request);

      if (!me) {
        return reply.code(401).send({ message: "Unauthorized" });
      }

      const where: any = {};

      if (parsed.data.status) {
        const status = toStatus(parsed.data.status);
        if (!status) {
          return reply.code(400).send({ message: "Invalid status" });
        }
        where.status = status;
      }

      if (parsed.data.user_id) {
        where.user_id = parsed.data.user_id;
      }

      if (parsed.data.requested_tutor_id) {
        where.requested_tutor_id = parsed.data.requested_tutor_id;
      }

      if (!isAdmin) {
        where.OR = [{ user_id: me }, { requested_tutor_id: me }];
      }

      const rows = await app.prisma.tutoring_request.findMany({
        where,
        orderBy: { created_at: "desc" },
        include: {
          user: true,
          course: true,
          tutor: {
            include: {
              user: true,
            },
          },
        },
      });

      return rows;
    }
  );

  app.put(
    "/:id/assign",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      if (!hasRole(request, "admin")) {
        return reply.code(403).send({ message: "Admin only" });
      }

      const id = Number((request.params as any).id);
      if (!Number.isFinite(id)) {
        return reply.code(400).send({ message: "Invalid id" });
      }

      const bodyParsed = assignBodySchema.safeParse(request.body);
      if (!bodyParsed.success) {
        return reply.code(400).send({
          message: "Invalid body",
          issues: bodyParsed.error.flatten(),
        });
      }

      const reqRow = await app.prisma.tutoring_request.findUnique({
        where: { id },
      });

      if (!reqRow) {
        return reply.code(404).send({ message: "Request not found" });
      }

      const current = toStatus(String(reqRow.status));
      if (!current) {
        return reply.code(400).send({ message: "Invalid request status in DB" });
      }

      try {
        assertTransition(current, "pending_tutor");
      } catch (e: any) {
        return reply.code(400).send({ message: e.message });
      }

      const tutorId = bodyParsed.data.tutor_id;

      const tutorRow = await app.prisma.tutor.findUnique({
        where: { user_id: tutorId },
      });

      if (!tutorRow || tutorRow.active !== true) {
        return reply.code(400).send({ message: "Tutor not active" });
      }

      const updated = await app.prisma.tutoring_request.update({
        where: { id },
        data: {
          requested_tutor_id: tutorId,
          status: "pending_tutor",
        },
        include: {
          user: true,
          course: true,
          tutor: {
            include: {
              user: true,
            },
          },
        },
      });

      return updated;
    }
  );

  app.put(
    "/:id/deny",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      if (!hasRole(request, "admin")) {
        return reply.code(403).send({ message: "Admin only" });
      }

      const id = Number((request.params as any).id);
      if (!Number.isFinite(id)) {
        return reply.code(400).send({ message: "Invalid id" });
      }

      const reqRow = await app.prisma.tutoring_request.findUnique({
        where: { id },
      });

      if (!reqRow) {
        return reply.code(404).send({ message: "Request not found" });
      }

      const current = toStatus(String(reqRow.status));
      if (!current) {
        return reply.code(400).send({ message: "Invalid request status in DB" });
      }

      try {
        assertTransition(current, "denied");
      } catch (e: any) {
        return reply.code(400).send({ message: e.message });
      }

      const updated = await app.prisma.tutoring_request.update({
        where: { id },
        data: {
          status: "denied",
        },
        include: {
          user: true,
          course: true,
          tutor: {
            include: {
              user: true,
            },
          },
        },
      });

      return updated;
    }
  );

  app.patch(
    "/:id/tutor-response",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const id = Number((request.params as any).id);
      if (!Number.isFinite(id)) {
        return reply.code(400).send({ message: "Invalid id" });
      }

      const bodyParsed = tutorResponseBodySchema.safeParse(request.body);
      if (!bodyParsed.success) {
        return reply.code(400).send({
          message: "Invalid body",
          issues: bodyParsed.error.flatten(),
        });
      }

      const me = getUserId(request);
      if (!me) {
        return reply.code(401).send({ message: "Unauthorized" });
      }

      const reqRow = await app.prisma.tutoring_request.findUnique({
        where: { id },
      });

      if (!reqRow) {
        return reply.code(404).send({ message: "Request not found" });
      }

      const current = toStatus(String(reqRow.status));
      if (!current) {
        return reply.code(400).send({ message: "Invalid request status in DB" });
      }

      if (current !== "pending_tutor") {
        return reply.code(400).send({ message: "Request is not awaiting tutor response" });
      }

      if (reqRow.requested_tutor_id !== me) {
        return reply.code(403).send({ message: "Only assigned tutor can respond" });
      }

      if (bodyParsed.data.accepted) {
        try {
          assertTransition("pending_tutor", "approved");
        } catch (e: any) {
          return reply.code(400).send({ message: e.message });
        }

        const updated = await app.prisma.tutoring_request.update({
          where: { id },
          data: {
            status: "approved",
          },
          include: {
            user: true,
            course: true,
            tutor: {
              include: {
                user: true,
              },
            },
          },
        });

        return updated;
      }

      try {
        assertTransition("pending_tutor", "pending");
      } catch (e: any) {
        return reply.code(400).send({ message: e.message });
      }

      const updated = await app.prisma.tutoring_request.update({
        where: { id },
        data: {
          status: "pending",
          requested_tutor_id: null,
        },
        include: {
          user: true,
          course: true,
          tutor: {
            include: {
              user: true,
            },
          },
        },
      });

      return updated;
    }
  );
}