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
