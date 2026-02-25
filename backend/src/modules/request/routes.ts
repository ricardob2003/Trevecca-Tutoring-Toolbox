import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";

type ReqStatus = "pending" | "pending_tutor" | "approved" | "denied";

const requestStatusSchema = z.enum([
  "pending",
  "pending_tutor",
  "approved",
  "denied",
]);

const requestQuerySchema = z.object({
  status: requestStatusSchema.optional(),
  userId: z.coerce.number().int().positive().optional(),
  requestedTutorId: z.coerce.number().int().positive().optional(),
  courseId: z.coerce.number().int().positive().optional(),
});

const requestIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const createRequestBodySchema = z.object({
  userId: z.number().int().positive(),
  courseId: z.number().int().positive(),
  description: z.string().trim().min(1).max(2000).optional(),
  requestedTutorId: z.number().int().positive().nullable().optional(),
});

const updateRequestBodySchema = z
  .object({
    courseId: z.number().int().positive().optional(),
    description: z.string().trim().min(1).max(2000).nullable().optional(),
    requestedTutorId: z.number().int().positive().nullable().optional(),
    status: requestStatusSchema.optional(),
    declineReason: z.string().trim().min(1).max(2000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

const tutorResponseBodySchema = z.object({
  accepted: z.boolean(),
});

const assignBodySchema = z.object({
  requestedTutorId: z.number().int().positive(),
});

const denyBodySchema = z.object({
  declineReason: z.string().trim().min(1).max(2000).nullable().optional(),
});

function hasRole(request: any, role: string): boolean {
  // Accept FastifyRequest or compatible object with 'user'
  const roles = (request.user as { roles?: unknown } | undefined)?.roles;
  if (!Array.isArray(roles)) return false;
  const target = role.trim().toLowerCase();
  return roles.some(
    (r) => typeof r === "string" && r.trim().toLowerCase() === target
  );
}


function getUserId(request: FastifyRequest): number | null {
  const sub = (request.user as { sub?: string } | undefined)?.sub;
  const id = Number(sub);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Valid transitions: assign only when pending/pending_tutor; deny only when pending/pending_tutor. */
function assertCanAssign(current: ReqStatus): void {
  if (current === "approved" || current === "denied") {
    throw new Error(`Cannot assign tutor when request is already ${current}`);
  }
}

function assertCanDeny(current: ReqStatus): void {
  if (current === "approved" || current === "denied") {
    throw new Error(`Cannot deny request when status is already ${current}`);
  }
}

async function ensureUserExists(app: FastifyInstance, userId: number) {
  const user = await app.prisma.user.findUnique({
    where: { treveccaId: userId },
    select: { treveccaId: true },
  });

  return Boolean(user);
}

async function ensureCourseExists(app: FastifyInstance, courseId: number) {
  const course = await app.prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true },
  });

  return Boolean(course);
}

async function ensureTutorExists(app: FastifyInstance, tutorId: number) {
  const tutor = await app.prisma.tutor.findUnique({
    where: { userId: tutorId },
    select: { userId: true },
  });

  return Boolean(tutor);
}

export async function requestRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  const requestInclude = {
    user: {
      select: {
        treveccaId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    },
    course: {
      select: {
        id: true,
        code: true,
        title: true,
        department: true,
      },
    },
    requestedTutor: {
      select: {
        userId: true,
        subjects: true,
        hourlyLimit: true,
        active: true,
        user: {
          select: {
            treveccaId: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    },
  } as const;

  app.get("/", async (request, reply) => {
    const parsed = requestQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      return reply.code(400).send({
        message: "Invalid query params",
        issues: parsed.error.flatten(),
      });
    }

    const where = {
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.userId ? { userId: parsed.data.userId } : {}),
      ...(parsed.data.requestedTutorId
        ? { requestedTutorId: parsed.data.requestedTutorId }
        : {}),
      ...(parsed.data.courseId ? { courseId: parsed.data.courseId } : {}),
    };

    const items = await app.prisma.tutoringRequest.findMany({
      where,
      include: requestInclude,
      orderBy: { createdAt: "desc" },
    });

    return reply.code(200).send({ items });
  });

  app.get("/:id", async (request, reply) => {
    const parsed = requestIdParamsSchema.safeParse(request.params);

    if (!parsed.success) {
      return reply.code(400).send({
        message: "Invalid request ID in parameters",
        issues: parsed.error.flatten(),
      });
    }

    const item = await app.prisma.tutoringRequest.findUnique({
      where: { id: parsed.data.id },
      include: requestInclude,
    });

    if (!item) {
      return reply.code(404).send({ message: "Tutoring request not found" });
    }

    return reply.code(200).send(item);
  });

  app.post("/", async (request, reply) => {
    const parsed = createRequestBodySchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        message: "Invalid tutoring request payload",
        issues: parsed.error.flatten(),
      });
    }

    const userExists = await ensureUserExists(app, parsed.data.userId);
    if (!userExists) {
      return reply.code(404).send({ message: "User not found" });
    }

    const courseExists = await ensureCourseExists(app, parsed.data.courseId);
    if (!courseExists) {
      return reply.code(404).send({ message: "Course not found" });
    }

    if (
      parsed.data.requestedTutorId !== undefined &&
      parsed.data.requestedTutorId !== null
    ) {
      const tutorExists = await ensureTutorExists(app, parsed.data.requestedTutorId);
      if (!tutorExists) {
        return reply.code(404).send({ message: "Requested tutor not found" });
      }
    }

    const createdRequest = await app.prisma.tutoringRequest.create({
      data: {
        userId: parsed.data.userId,
        courseId: parsed.data.courseId,
        description: parsed.data.description,
        requestedTutorId: parsed.data.requestedTutorId ?? null,
      },
      include: requestInclude,
    });

    return reply.code(201).send(createdRequest);
  });

  app.patch("/:id/tutor-response", async (request, reply) => {
    const parsedParams = requestIdParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.code(400).send({
        message: "Invalid request ID in parameters",
        issues: parsedParams.error.flatten(),
      });
    }
    const parsedBody = tutorResponseBodySchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.code(400).send({
        message: "Invalid tutor response payload",
        issues: parsedBody.error.flatten(),
      });
    }
    const payload = request.user as { sub?: string } | undefined;
    const tutorId = Number(payload?.sub);
    if (!Number.isInteger(tutorId) || tutorId <= 0) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    const existing = await app.prisma.tutoringRequest.findUnique({
      where: { id: parsedParams.data.id },
      select: { id: true, status: true, requestedTutorId: true },
    });
    if (!existing) {
      return reply.code(404).send({ message: "Tutoring request not found" });
    }
    if (existing.status !== "pending_tutor" || existing.requestedTutorId !== tutorId) {
      return reply.code(403).send({
        message: "This request is not awaiting your response or is not assigned to you",
      });
    }
    if (parsedBody.data.accepted) {
      const updatedRequest = await app.prisma.tutoringRequest.update({
        where: { id: parsedParams.data.id },
        data: { status: "approved" },
        include: requestInclude,
      });
      return reply.code(200).send(updatedRequest);
    }
    // Tutor declined: return to pending so admin can reassign or deny
    const updatedRequest = await app.prisma.tutoringRequest.update({
      where: { id: parsedParams.data.id },
      data: { status: "pending", requestedTutorId: null },
      include: requestInclude,
    });
    return reply.code(200).send(updatedRequest);
  });

  app.put("/:id/assign", async (request, reply) => {
    if (!hasRole(request, "admin")) {
      return reply.code(403).send({ message: "Only admins can assign a tutor" });
    }
    const parsedParams = requestIdParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.code(400).send({
        message: "Invalid request ID in parameters",
        issues: parsedParams.error.flatten(),
      });
    }
    const parsedBody = assignBodySchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.code(400).send({
        message: "Invalid assign payload",
        issues: parsedBody.error.flatten(),
      });
    }
    const existing = await app.prisma.tutoringRequest.findUnique({
      where: { id: parsedParams.data.id },
      select: { id: true, status: true },
    });
    if (!existing) {
      return reply.code(404).send({ message: "Tutoring request not found" });
    }
    try {
      assertCanAssign(existing.status as ReqStatus);
    } catch (e) {
      return reply.code(400).send({
        message: e instanceof Error ? e.message : "Invalid status transition",
      });
    }
    const tutorExists = await ensureTutorExists(app, parsedBody.data.requestedTutorId);
    if (!tutorExists) {
      return reply.code(404).send({ message: "Requested tutor not found" });
    }
    const updatedRequest = await app.prisma.tutoringRequest.update({
      where: { id: parsedParams.data.id },
      data: {
        requestedTutorId: parsedBody.data.requestedTutorId,
        status: "pending_tutor",
      },
      include: requestInclude,
    });
    return reply.code(200).send(updatedRequest);
  });

  app.put("/:id/deny", async (request, reply) => {
    if (!hasRole(request, "admin")) {
      return reply.code(403).send({ message: "Only admins can deny a request" });
    }
    const parsedParams = requestIdParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.code(400).send({
        message: "Invalid request ID in parameters",
        issues: parsedParams.error.flatten(),
      });
    }
    const parsedBody = denyBodySchema.safeParse(request.body ?? {});
    const declineReason = parsedBody.success ? parsedBody.data.declineReason ?? null : null;

    const existing = await app.prisma.tutoringRequest.findUnique({
      where: { id: parsedParams.data.id },
      select: { id: true, status: true },
    });
    if (!existing) {
      return reply.code(404).send({ message: "Tutoring request not found" });
    }
    try {
      assertCanDeny(existing.status as ReqStatus);
    } catch (e) {
      return reply.code(400).send({
        message: e instanceof Error ? e.message : "Invalid status transition",
      });
    }
    const updatedRequest = await app.prisma.tutoringRequest.update({
      where: { id: parsedParams.data.id },
      data: { status: "denied", declineReason: declineReason ?? null },
      include: requestInclude,
    });
    return reply.code(200).send(updatedRequest);
  });

  app.patch("/:id", async (request, reply) => {
    const parsedParams = requestIdParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.code(400).send({
        message: "Invalid request ID in parameters",
        issues: parsedParams.error.flatten(),
      });
    }

    const parsedBody = updateRequestBodySchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.code(400).send({
        message: "Invalid tutoring request update payload",
        issues: parsedBody.error.flatten(),
      });
    }

    const existing = await app.prisma.tutoringRequest.findUnique({
      where: { id: parsedParams.data.id },
      select: { id: true },
    });

    if (!existing) {
      return reply.code(404).send({ message: "Tutoring request not found" });
    }

    if (parsedBody.data.courseId !== undefined) {
      const courseExists = await ensureCourseExists(app, parsedBody.data.courseId);
      if (!courseExists) {
        return reply.code(404).send({ message: "Course not found" });
      }
    }

    if (
      parsedBody.data.requestedTutorId !== undefined &&
      parsedBody.data.requestedTutorId !== null
    ) {
      const tutorExists = await ensureTutorExists(app, parsedBody.data.requestedTutorId);
      if (!tutorExists) {
        return reply.code(404).send({ message: "Requested tutor not found" });
      }
    }

    const updatedRequest = await app.prisma.tutoringRequest.update({
      where: { id: parsedParams.data.id },
      data: {
        ...(parsedBody.data.courseId !== undefined
          ? { courseId: parsedBody.data.courseId }
          : {}),
        ...(parsedBody.data.description !== undefined
          ? { description: parsedBody.data.description }
          : {}),
        ...(parsedBody.data.requestedTutorId !== undefined
          ? { requestedTutorId: parsedBody.data.requestedTutorId }
          : {}),
        ...(parsedBody.data.status !== undefined
          ? { status: parsedBody.data.status }
          : {}),
        ...(parsedBody.data.declineReason !== undefined
          ? { declineReason: parsedBody.data.declineReason }
          : {}),
      },
      include: requestInclude,
    });

    return reply.code(200).send(updatedRequest);
  });

  app.delete("/:id", async (request, reply) => {
    const parsed = requestIdParamsSchema.safeParse(request.params);

    if (!parsed.success) {
      return reply.code(400).send({
        message: "Invalid request ID in parameters",
        issues: parsed.error.flatten(),
      });
    }

    const existing = await app.prisma.tutoringRequest.findUnique({
      where: { id: parsed.data.id },
      select: { id: true },
    });

    if (!existing) {
      return reply.code(404).send({ message: "Tutoring request not found" });
    }

    await app.prisma.tutoringRequest.delete({
      where: { id: parsed.data.id },
    });

    return reply.code(200).send({ message: "Tutoring request deleted" });
  });
}