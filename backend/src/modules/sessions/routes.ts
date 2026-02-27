import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";

//Used for role comparisons (case insensitive)
function norm(s:string) {
    return (s || "").trim().toLowerCase();
}

//Checks if user has a given role.
//Roles are stored on request.user from auth plugin.
function hasRole(request: FastifyRequest, role: string){
    const roles = (request.user as any)?.roles as string[] | undefined;
    if (!roles) return false;

    return roles.some((r) => norm(r) === norm(role));
}

//Gets user's Trevecca ID.
//Puts the ID inside request.user.sub.
function getUserId(request: FastifyRequest){
    const sub = (request.user as any)?.sub;
    const id = Number(sub);
    return Number.isFinite(id) ? id : null;
}

/**
 * 
 * Validates request inputs before touching database.
 * 
 */

//GET query parameters
const listQuerySchema = z.object({
    tutor_id: z.coerce.number().optional(),
    user_id: z.coerce.number().optional(),
});

//POST body (create session)
const createBodySchema = z.object({
    request_id: z.coerce.number(),
    start_time: z.string(),
    end_time: z.string(),
});

//PATCH body (reschedule)
const rescheduleSchema = z.object({
    start_time: z.string(),
    end_time:z.string(),
});

//PATCH body (complete session)
const completeSchema = z.object({
    attended: z.boolean(),
    notes: z.string().optional(),
});


/**
 * 
 * Getting /api/v1/sessions
 * 
 * Lists sessions.
 * -Admin sees all sessions.
 * - Students/Tutors only see sessions they are part of.
 * - Can optionally filter by tutor_id or user_id.
 * 
 */

export async function sessionRoutes(app: FastifyInstance) {
    app.get(
        "/",
        {preHandler: [app.authenticate] }, //requires athentication
        async(request, reply) => {

            //Validate query parameters
            const parsed = listQuerySchema.safeParse(request.query);
            if(!parsed.success){
                return reply.code(400).send({
                    message: "Invalid query",
                    issues: parsed.error.flatten(),
                });
            }

            //Get User's ID
            const me = getUserId(request);
            if(!me) {
                return reply.code(401).send({message: "Unauthorized"});
            }
            const isAdmin = hasRole(request, "admin");

            const where: any = {};

            //Applies optional filters if provided
            if(parsed.data.tutor_id) where.tutorID = parsed.data.tutor_id;
            if(parsed.data.user_id) where.userID = parsed.data.user_id;

            //if not admin, only show sessoins where user is tutor or student
            if (!isAdmin) {
                where.OR = [{ tutorId: me }, { userId: me}];
            }

            //Fetch sessions from database
            const rows = await app.prisma.tutoringSession.findMany({
                where,
                include:{
                    tutor: { include: { user: true}},
                    user: true,
                    course: true,
                    request: true,
                },
                orderBy: {id: "desc"},
            });

            return rows;
        }
    );

    /**
     * 
     * POST /api/v1/sessions
     * 
     * Tutor creates a session AFTER a request is approved.
     * - request must exist
     * -request must be approved by Admin
     * - Logged in user must be the assigned tutor
     */
    app.post(
        "/",
        {preHandler: [app.authenticate]},
        async(request, reply) => {
            //validate body
            const bodyParsed = createBodySchema.safeParse(request.body);
            if(!bodyParsed.success){
                return reply.code(400).send({
                    message: "Invalid body",
                    issues: bodyParsed.error.flatten(),
                });
            }
            
            const me = getUserId(request);
            if (!me) {
                return reply.code(401).send({message: "Unauthorized" });

            }
            //find the tutoring request
            const requestRow = await app.prisma.tutoringRequest.findUnique({
                where: {id: bodyParsed.data.request_id},
            });

            if(!requestRow){
                return reply.code(404).send({message: "Request not found"});
            }
            //Only approved requests can create sessions
            if (requestRow.requestedTutorId !== me) {
                return reply.code(403).send({
                    message: "Only assigned tutor can create session",
                });
            }

            //Convert incoming times to date objects
            const start = new Date(bodyParsed.data.start_time);
            const end = new Date(bodyParsed.data.end_time);

            if(end <= start){
                return reply.code(400).send({
                    message: "End time must be after start time",
                });
            }
            //calculate new session duration ( inhours)
            const newDurationHours =
            (end.getTime() - start.getTime()) / (1000 * 60 * 60);

            //Fetch Tutor Record (for hourly Limit)
            const tutor = await app.prisma.tutor.findUnique({
                where:{ id: me},
            });

            if(!tutor){
                return reply.code(404).send({message: "Tutor not found" });
            }

            if(tutor.hourlyLimit !== null && tutor.hourlyLimit !== undefined) {
                //Week = Sunday - Saturday
                const now = new Date();
                const dayOfWeek = now.getDay(); //0 = Sunday

                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - dayOfWeek);
                weekStart.setHours(0, 0, 0, 0);

                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 7);
                //get all sessions for this tutor this week
                //counts both scheduled and completed
                const sessionsThisWeek =
                await app.prisma.tutoringSession.findMany({
                    where: {
                        tutorId:me,
                        startTime:{
                            gte: weekStart,
                            It: weekEnd,
                        },
                        status:{
                            in: ["sceduled", "completed"],
                        },
                    },
                });
                //sum total hours used this week
                const hoursUsed = sessionsThisWeek.reduce((sum: any, session: any) => {
                    const duration =
                        (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60 * 60);

                    return sum + duration;                
                }, 0);

                //if new total exceeds tutors weekly limit
                if(hoursUsed + newDurationHours > tutor.hourlyLimit) {
                    return reply.code(400).send({
                        message:"Weekly hourly limit exceeded",
                        hoursUsed,
                        attemptingToAdd: newDurationHours,
                        weeklyLimit:tutor.hourlyLimit,
                    });
                }
            }

            //create session record
            const session = await app.prisma.tutoringSession.create({
                data:{
                    tutorId: me,
                    userId: requestRow.userId,
                    requestId: requestRow.id,
                    courseId: requestRow.courseId,
                    startTime: new Date(bodyParsed.data.start_time),
                    endTime: new Date(bodyParsed.data.end_time),
                    status: "scheduled",
                },
            });

            return reply.code(201).send(session);
        }
    );

    /**
     * 
     * PATCH /api/v1/sessions/:id
     * 
     * Reschedule a session.
     * - Session must exist
     * - Only tutor can reschedule
     * - Sesson must be scheduled
     */
    app.patch(
        "/:id",
        { preHandler: [app.authenticate] },
        async (request, reply) => {

            const id = Number((request.params as any).id);
            if (!Number.isFinite(id)) {
                return reply.code(400).send({ message: "Invalid id" });
            }

            const bodyParsed = rescheduleSchema.safeParse(request.body);
            if (!bodyParsed.success){
                return reply.code(400).send({
                    message: "Invalid body", 
                    issues: bodyParsed.error.flatten(),
                });
            }

            const me = getUserId(request);
            if (!me) {
                return reply.code(401).send({ message: "Unauthorized"});
            }

            //Find session
            const session = await app.prisma.tutoringSession.findUnique({
                where: {id},
            });

            if (!session) {
                return reply.code(404).send({message: "Session not found"});
            }

            // ONly tutor can reschedule
            if (session.tutorID !== me) {
                return reply.code(403).send({
                    message: "Only tutor can reschedule",
                });
            }

            //can not reschedule completed/cancelled session
            if (session.status !== "scheduled") {
                return reply.code(400).send({
                    message: "Can not rescedule non-scheduled session",
                });
            }

            const updated = await app.prisma.tutoringSession.update({
                where:{id},
                data:{
                    startTime: new Date(bodyParsed.data.start_time),
                    endTime: new Date(bodyParsed.data.end_time),
                },
            });

            return updated;
        }
    );


    /**
     * 
     * PATCH /api/v1/session/:id/complete
     * 
     * Marks a session as completed.
     * - Sessions must exist
     * - Only tutor can complete 
     * - Session must be scheduled
     * 
     */
    app.patch(
        "/:id/complete",
        {preHandler: [app.authenticate]},
        async(request, reply) => {

            const id = Number((request.params as any).id);
            if(!Number.isFinite(id)) {
                return reply.code(400).send({message: "Invalid id" });
            }

            const bodyParsed = completeSchema.safeParse(request.body);
            if(!bodyParsed.success) {
                return reply.code(400).send({
                    message: "Invalid body",
                    issues: bodyParsed.error.flatten(),
                });
            }

            const me = getUserId(request);
            if(!me) {
                return reply.code(401).send({message: "unauthorized"});
            }
            const session = await app.prisma.tutoringSession.findUnique({
                where: {id},
            });

            if(!session){
                return reply.code(404).send({ message: "session not found" });
            }

            if (session.tutorId !== me){
                return reply.code(403).send({
                    message: "Only tutor can complete session",
                });
            }

            if(session.status !== "scheduled"){
                return reply.code(400).send({
                    message: "session not scheduled",
                });
            }

            const updated = await app.prisma.tutoringSession.update({
                where: {id},
                data:{
                    attended: bodyParsed.data.attended,
                    notes:bodyParsed.data.notes,
                    status: "completed",
                },
            });
        }
    );
}