import type { FastifyInstance} from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { create } from "domain";

// Type guard for Prisma errors
function isPrismaNotFoundError(error: unknown): boolean {
    return error instanceof Error && 'code' in error && (error as any).code === "P2025";
}

const tutorIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const createTutorBodySchema = z.object({
    userId: z.number().int().positive(),
    subjects: z.array(z.string().trim().min(1)).min(1),
    hourlyLimit: z.number().int().min(1).max(60).default(10),
    active: z.boolean().default(true),
});

const updateTutorBodySchema = z.object({
    major: z.union([z.string().trim().min(1).max(120), z.null()]),
    subjects: z.array(z.string().trim().min(1)).min(1),
    hourlyLimit: z.number().int().min(1).max(60),
});

const updateTutorActiveBodySchema = z.object({
    active: z.boolean(),
});

const tutorUserSelect = {
    treveccaId: true,
    email: true,
    firstName: true,
    lastName: true,
    major: true,
    year: true,
    role: true,
} as const;

//Optional auth guard for all tutor routes

export async function tutorRoutes(app: FastifyInstance) {

    app.addHook("preHandler", app.authenticate);

    app.get("/", async (_request, reply) => {
        const tutors = await app.prisma.tutor.findMany({
            include: { user: {select: tutorUserSelect}},
            orderBy: { userId: "asc" },
        });
        
        return reply.code(200).send(tutors); 
    });
    //GET /API/v1/tutors/:id/sessions
    //Returns sessions for a tutor (Used for tutor dashboard feed)
    app.get("/:id/sessions", async (request, reply) => {

         //Validate tutor ID param
        const parsedParams = tutorIdParamsSchema.safeParse(request.params);
        if (!parsedParams.success) {
            return reply.code(400).send({
                message: "Invalid tutor ID in parameters",
                issues: parsedParams.error.flatten(),
            });
        }
    
        const tutorId = parsedParams.data.id;
    
       
         //Validate query params (from / to optional)
        
        const dateQuerySchema = z.object({
            from: z.string().optional(),
            to: z.string().optional(),
        });
    
        const parsedQuery = dateQuerySchema.safeParse(request.query);
        if (!parsedQuery.success) {
            return reply.code(400).send({
                message: "Invalid date query parameters",
                issues: parsedQuery.error.flatten(),
            });
        }
    
         //Ensure tutor exists
         
        const existingTutor = await app.prisma.tutor.findUnique({
            where: { userId: tutorId },
            select: { userId: true },
        });
    
        if (!existingTutor) {
            return reply.code(404).send({ message: "Tutor not found" });
        }
    
        /**
         * We filter by tutorId (which equals userId in your schema)
         * and optionally by startTime range
         */
        const where: any = {
            tutorId: tutorId,
        };
    
        if (parsedQuery.data.from || parsedQuery.data.to) {
            where.startTime = {};
    
            if (parsedQuery.data.from) {
                where.startTime.gte = new Date(parsedQuery.data.from);
            }
    
            if (parsedQuery.data.to) {
                where.startTime.lte = new Date(parsedQuery.data.to);
            }
        }
    
        /**
         * Include:
         * - student (user)
         * - course
         * Sort ascending by startTime (required)
         */
        const sessions = await app.prisma.tutoringSession.findMany({
            where,
            include: {
                user: {
                    select: {
                        treveccaId: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                course: {
                    select: {
                        id: true,
                        code: true,
                        title: true,
                    },
                },
            },
            orderBy: {
                startTime: "asc",
            },
        });
    
        /**
         * Shape response for dashboard
         * Return only what frontend needs
         */
        const result = sessions.map((session: any) => ({
            id: session.id,
            studentName: `${session.user.firstName} ${session.user.lastName}`,
            studentId: session.user.treveccaId,
            courseCode: session.course.code,
            startTime: session.startTime,
            endTime: session.endTime,
            status: session.status,
            attended: session.attended,
            notes: session.notes,
        }));
    
        return reply.code(200).send(result);
    });


    
    app.get("/assignable", async (request, reply) => {
        const tutors = await app.prisma.tutor.findMany({
            where: {active: true},
            include: {
                user: {
                    select: {
                        treveccaId: true,
                        firstName: true,
                        lastName:true,
                        email: true,
                    },
                },
            },
            orderBy: { user : { lastName: "asc" } },
        });
        return reply.code(200).send(tutors);
    });

    app.get("/:id/students", async (request, reply) => {
        const parsedParams = tutorIdParamsSchema.safeParse(request.params);
        if (!parsedParams.success) {
            return reply.code(400).send({
                message: "Invalid tutor ID in parameters",
                issues: parsedParams.error.flatten(),
            });
        }

        const tutorId = parsedParams.data.id;

        const existingTutor = await app.prisma.tutor.findUnique({
            where: { userId: tutorId },
            select: { userId: true },
        });

        if (!existingTutor) {
            return reply.code(404).send({ message: "Tutor not found" });
        }

        const approvedRequests = await app.prisma.tutoringRequest.findMany({
            where: {
                requestedTutorId: tutorId,
                status: "approved",
            },
            select: {
                id: true,
                user: {
                    select: {
                        treveccaId: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                course: {
                    select: {
                        id: true,
                        code: true,
                        title: true,
                    },
                },
                sessions: {
                    orderBy: {
                        startTime: "desc",
                    },
                    select: {
                        id: true,
                        startTime: true,
                        endTime: true,
                        status: true,
                        attended: true,
                        notes: true,
                    },
                },
            },
            orderBy: {
                id: "desc",
            },
        });

        const students = approvedRequests.map((requestItem: (typeof approvedRequests)[number]) => {
            const currentSession = requestItem.sessions[0] ?? null;

            return {
                student: {
                    id: requestItem.user.treveccaId,
                    firstName: requestItem.user.firstName,
                    lastName: requestItem.user.lastName,
                    name: `${requestItem.user.firstName} ${requestItem.user.lastName}`,
                    email: requestItem.user.email,
                },
                course: requestItem.course,
                currentSessionStatus: currentSession?.status ?? null,
                sessions: requestItem.sessions,
            };
        });

        return reply.code(200).send(students);
    });


    app.post("/", async (request, reply) => {
        const parsed = createTutorBodySchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.code(400).send({
                message: "Invalid tutor creation payload",
                issues: parsed.error.flatten(),
            });
        }
        const existingUser = await app.prisma.user.findUnique({
            where: {treveccaId: parsed.data.userId},
            include: {tutor: true},
        });

        if (!existingUser) {
            return reply.code(404).send({message: "User not found"});
        }

        if (existingUser.tutor) {
            return reply.code(400).send({message: "User is already a tutor"});
        }

        const createdTutor = await app.prisma.tutor.create({
            data: {
                userId: parsed.data.userId,
                subjects: parsed.data.subjects,
                hourlyLimit:parsed.data.hourlyLimit,
                active: parsed.data.active,
            },
            include: {user: {select: tutorUserSelect}},
        });
        return reply.code(201).send(createdTutor);
    });

    app.put("/:id", async (request, reply) => {
        const parsedParams = tutorIdParamsSchema.safeParse(request.params);
        if (!parsedParams.success) {
            return reply.code(400).send({
                message: "Invalid tutor ID in parameters",
                issues : parsedParams.error.flatten(),
            });
        }

        const parsedBody = updateTutorBodySchema.safeParse(request.body);
        if (!parsedBody.success) {
            return reply.code(400).send({
                message: "Invalid tutor update payload",
                issues: parsedBody.error.flatten(),
            });
        }

        const tutorId = parsedParams.data.id;

        try {
            const updatedTutor = await app.prisma.$transaction(async (tx: Prisma.TransactionClient) => { 
                await tx.user.update({
                    where: {treveccaId: tutorId},
                    data: { major: parsedBody.data.major},
                });

                return tx.tutor.update({
                    where: {userId: tutorId},
                    data: {
                        subjects: parsedBody.data.subjects,
                        hourlyLimit: parsedBody.data.hourlyLimit,
                    },
                    include: { user: {select: tutorUserSelect}},
                });
            });

            return reply.code(200).send(updatedTutor);
        } catch (error) {   
            if (isPrismaNotFoundError(error)) {
                    return reply.code(404).send({message: "Tutor not found"}); 
                }

                throw error;
            }
        });

        app.patch("/:id/active", async (request, reply) => {
            const parsedParams = tutorIdParamsSchema.safeParse(request.params);
            if (!parsedParams.success) {
                return reply.code(400).send({
                    message: "Invalid tutor ID in parameters",
                    issues : parsedParams.error.flatten(),
                });
            }
            const parsedBody = updateTutorActiveBodySchema.safeParse(request.body);
            if (!parsedBody.success) {
                return reply.code(400).send({
                    message: "Invalid tutor active status payload",
                    issues: parsedBody.error.flatten(),
                });
            }

            try {
                const updatedTutor = await app.prisma.tutor.update({
                    where: {userId: parsedParams.data.id},
                    data: {active: parsedBody.data.active},
                    include: { user: {select: tutorUserSelect}},
                });
                return reply.code(200).send(updatedTutor);
            } catch (error) {
                if (isPrismaNotFoundError(error)) {
                        return reply.code(404).send({message: "Tutor not found"});
                    }
                    throw error;
            }
        });
    }
