import Fastify from "fastify";
import { describe, expect, it, vi } from "vitest";
import { sessionRoutes } from "./routes.js";

function buildPrismaMock(initialSession: { id: number; tutorId: number; status: string; attended?: boolean | null; notes?: string | null }) {
  const store = new Map<number, any>([[initialSession.id, { ...initialSession }]]);

  return {
    tutoringSession: {
      findUnique: vi.fn(async ({ where: { id } }: any) => store.get(id) ?? null),
      update: vi.fn(async ({ where: { id }, data }: any) => {
        const current = store.get(id);
        const updated = { ...current, ...data };
        store.set(id, updated);
        return updated;
      }),
      findMany: vi.fn(async () => []),
    },
    tutoringRequest: {
      findUnique: vi.fn(),
    },
    tutor: {
      findUnique: vi.fn(),
    },
  };
}

async function buildApp(prisma: any) {
  const app = Fastify();

  app.decorate("prisma", prisma);
  app.decorate("authenticate", async (request: any, reply: any) => {
    const auth = request.headers.authorization;
    if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const sub = auth.slice(7).trim();
    request.user = {
      sub,
      email: "test@example.com",
      roles: ["tutor"],
      authProvider: "local",
    };
  });

  await app.register(sessionRoutes, { prefix: "/api/v1/sessions" });
  return app;
}

describe("PATCH /api/v1/sessions/:id/complete", () => {
  it("returns 200 and completed session for assigned tutor", async () => {
    const prisma = buildPrismaMock({ id: 1, tutorId: 200, status: "scheduled" });
    const app = await buildApp(prisma);

    const res = await app.inject({
      method: "PATCH",
      url: "/api/v1/sessions/1/complete",
      headers: { authorization: "Bearer 200" },
      payload: { attended: true, notes: "Good progress" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("completed");
    expect(body.attended).toBe(true);
    expect(body.notes).toBe("Good progress");

    await app.close();
  });

  it("returns 400 when completing an already completed session", async () => {
    const prisma = buildPrismaMock({ id: 1, tutorId: 200, status: "scheduled" });
    const app = await buildApp(prisma);

    const first = await app.inject({
      method: "PATCH",
      url: "/api/v1/sessions/1/complete",
      headers: { authorization: "Bearer 200" },
      payload: { attended: true, notes: "Done" },
    });

    expect(first.statusCode).toBe(200);

    const second = await app.inject({
      method: "PATCH",
      url: "/api/v1/sessions/1/complete",
      headers: { authorization: "Bearer 200" },
      payload: { attended: true, notes: "Done" },
    });

    expect(second.statusCode).toBe(400);
    expect(second.json().message).toContain("session not scheduled");

    await app.close();
  });

  it("returns 403 for wrong tutor", async () => {
    const prisma = buildPrismaMock({ id: 1, tutorId: 200, status: "scheduled" });
    const app = await buildApp(prisma);

    const res = await app.inject({
      method: "PATCH",
      url: "/api/v1/sessions/1/complete",
      headers: { authorization: "Bearer 201" },
      payload: { attended: true, notes: "Nope" },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json().message).toContain("Only tutor can complete session");

    await app.close();
  });

  it("returns 400 when attended is missing", async () => {
    const prisma = buildPrismaMock({ id: 1, tutorId: 200, status: "scheduled" });
    const app = await buildApp(prisma);

    const res = await app.inject({
      method: "PATCH",
      url: "/api/v1/sessions/1/complete",
      headers: { authorization: "Bearer 200" },
      payload: { notes: "Missing attended" },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toContain("Invalid body");

    await app.close();
  });
});
