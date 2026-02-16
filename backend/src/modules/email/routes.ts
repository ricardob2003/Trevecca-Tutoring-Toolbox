import type { FastifyInstance } from "fastify";
import { z } from "zod";

const sendTestEmailSchema = z.object({
  to: z.array(z.string().email()).min(1),
  subject: z.string().min(1).default("Tutoring Toolbox Test Email"),
  text: z.string().min(1).default("This is a test email from Tutoring Toolbox."),
});

export async function emailRoutes(app: FastifyInstance) {
  app.post("/test", async (request, reply) => {
    const parsed = sendTestEmailSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        message: "Invalid email payload",
        issues: parsed.error.flatten(),
      });
    }

    const result = await app.emailService.send({
      to: parsed.data.to,
      subject: parsed.data.subject,
      text: parsed.data.text,
    });

    return {
      ok: true,
      provider: app.emailService.providerName,
      messageId: result.id,
    };
  });
}
