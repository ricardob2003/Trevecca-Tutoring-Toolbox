import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data in correct order (respect foreign keys)
  await prisma.tutoringSession.deleteMany({});
  await prisma.tutoringRequest.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.tutor.deleteMany({});
  await prisma.user.deleteMany({});

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const userPasswordHash = await bcrypt.hash("password123", 10);

  // Create users
  const users = await Promise.all([
    // Admin
    prisma.user.create({
      data: {
        treveccaId: 100001,
        email: "admin@trevecca.edu",
        firstName: "Sarah",
        lastName: "Johnson",
        passwordHash: adminPasswordHash,
        role: "admin",
        major: "Administration",
        year: null,
      },
    }),
    // Tutors
    prisma.user.create({
      data: {
        treveccaId: 100002,
        email: "jsmith@trevecca.edu",
        firstName: "John",
        lastName: "Smith",
        passwordHash: userPasswordHash,
        role: "student",
        major: "Computer Science",
        year: 3,
      },
    }),
    prisma.user.create({
      data: {
        treveccaId: 100003,
        email: "emily.davis@trevecca.edu",
        firstName: "Emily",
        lastName: "Davis",
        passwordHash: userPasswordHash,
        role: "student",
        major: "Mathematics",
        year: 4,
      },
    }),
    prisma.user.create({
      data: {
        treveccaId: 100004,
        email: "jessica.wilson@trevecca.edu",
        firstName: "Jessica",
        lastName: "Wilson",
        passwordHash: userPasswordHash,
        role: "student",
        major: "Biology",
        year: 3,
      },
    }),
    // Students
    prisma.user.create({
      data: {
        treveccaId: 100005,
        email: "michael.brown@trevecca.edu",
        firstName: "Michael",
        lastName: "Brown",
        passwordHash: userPasswordHash,
        role: "student",
        major: "Business",
        year: 2,
      },
    }),
    prisma.user.create({
      data: {
        treveccaId: 100006,
        email: "david.martinez@trevecca.edu",
        firstName: "David",
        lastName: "Martinez",
        passwordHash: userPasswordHash,
        role: "student",
        major: "Engineering",
        year: 1,
      },
    }),
  ]);

  console.log(`✓ Created ${users.length} users`);

  // Create tutors (John Smith, Emily Davis, Jessica Wilson)
  const tutors = await Promise.all([
    prisma.tutor.create({
      data: {
        userId: 100002, // John Smith
        subjects: ["Computer Science", "Programming", "Algorithms"],
        hourlyLimit: 15,
        active: true,
      },
    }),
    prisma.tutor.create({
      data: {
        userId: 100003, // Emily Davis
        subjects: ["Mathematics", "Calculus", "Statistics"],
        hourlyLimit: 12,
        active: true,
      },
    }),
    prisma.tutor.create({
      data: {
        userId: 100004, // Jessica Wilson
        subjects: ["Biology", "Chemistry", "Anatomy"],
        hourlyLimit: 10,
        active: true,
      },
    }),
  ]);

  console.log(`✓ Created ${tutors.length} tutors`);

  // Create courses
  const courses = await Promise.all([
    prisma.course.create({
      data: {
        code: "CS101",
        title: "Introduction to Computer Science",
        department: "Computer Science",
      },
    }),
    prisma.course.create({
      data: {
        code: "CS201",
        title: "Data Structures",
        department: "Computer Science",
      },
    }),
    prisma.course.create({
      data: {
        code: "MATH101",
        title: "Calculus I",
        department: "Mathematics",
      },
    }),
    prisma.course.create({
      data: {
        code: "MATH201",
        title: "Calculus II",
        department: "Mathematics",
      },
    }),
    prisma.course.create({
      data: {
        code: "BIO101",
        title: "General Biology",
        department: "Biology",
      },
    }),
    prisma.course.create({
      data: {
        code: "BIO201",
        title: "Human Anatomy",
        department: "Biology",
      },
    }),
    prisma.course.create({
      data: {
        code: "CHEM101",
        title: "General Chemistry",
        department: "Chemistry",
      },
    }),
    prisma.course.create({
      data: {
        code: "PHYS101",
        title: "Physics I",
        department: "Physics",
      },
    }),
    prisma.course.create({
      data: {
        code: "ENG101",
        title: "English Composition",
        department: "English",
      },
    }),
    prisma.course.create({
      data: {
        code: "HIST101",
        title: "World History",
        department: "History",
      },
    }),
  ]);

  console.log(`✓ Created ${courses.length} courses`);

  // Create sample tutoring requests
  const requests = await Promise.all([
    // Pending request from Michael Brown for CS101
    prisma.tutoringRequest.create({
      data: {
        userId: 100005, // Michael Brown
        courseId: courses[0].id, // CS101
        description: "Need help understanding loops and conditionals",
        status: "pending",
      },
    }),
    // Approved request from David Martinez for MATH101, assigned to Emily Davis
    prisma.tutoringRequest.create({
      data: {
        userId: 100006, // David Martinez
        requestedTutorId: 100003, // Emily Davis
        courseId: courses[2].id, // MATH101
        description: "Struggling with derivatives and limits",
        status: "approved",
      },
    }),
    // Pending tutor approval from Michael Brown for BIO101, assigned to Jessica Wilson
    prisma.tutoringRequest.create({
      data: {
        userId: 100005, // Michael Brown
        requestedTutorId: 100004, // Jessica Wilson
        courseId: courses[4].id, // BIO101
        description: "Need review for upcoming exam on cell biology",
        status: "pending_tutor",
      },
    }),
  ]);

  console.log(`✓ Created ${requests.length} tutoring requests`);

  // Create sample tutoring sessions
  const sessions = await Promise.all([
    // Scheduled session between David Martinez and Emily Davis
    prisma.tutoringSession.create({
      data: {
        tutorId: 100003, // Emily Davis
        userId: 100006, // David Martinez
        requestId: requests[1].id, // Approved request
        courseId: courses[2].id, // MATH101
        startTime: new Date("2026-02-20T14:00:00Z"),
        endTime: new Date("2026-02-20T15:00:00Z"),
        status: "scheduled",
        notes: "First session - review derivatives",
      },
    }),
    // Completed session between Michael Brown and John Smith
    prisma.tutoringSession.create({
      data: {
        tutorId: 100002, // John Smith
        userId: 100005, // Michael Brown
        requestId: requests[0].id, // CS101 request
        courseId: courses[0].id, // CS101
        startTime: new Date("2026-02-15T10:00:00Z"),
        endTime: new Date("2026-02-15T11:00:00Z"),
        status: "completed",
        attended: true,
        notes: "Covered for loops and while loops. Student understood concepts well.",
      },
    }),
  ]);

  console.log(`✓ Created ${sessions.length} tutoring sessions`);

  console.log("\n✅ Database seeded successfully");
  console.log("\nTest credentials:");
  console.log("  Admin:   admin@trevecca.edu / admin123");
  console.log("  Tutors:  jsmith@trevecca.edu / password123");
  console.log("           emily.davis@trevecca.edu / password123");
  console.log("           jessica.wilson@trevecca.edu / password123");
  console.log("  Students: michael.brown@trevecca.edu / password123");
  console.log("            david.martinez@trevecca.edu / password123");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
