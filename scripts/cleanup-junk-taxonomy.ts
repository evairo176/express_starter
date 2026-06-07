/**
 * Cleanup for corrupted tech-stack / tag records whose `name` is itself a UUID.
 * These were created when the portfolio create flow treated submitted IDs as
 * names. For each junk record we resolve the REAL record it ultimately points
 * to (following chains), remap any portfolio relations to the real record, then
 * delete the junk record.
 *
 * Run: npx ts-node scripts/cleanup-junk-taxonomy.ts
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

async function cleanupTech() {
  const all = await db.techStack.findMany();
  const byId = new Map(all.map((t) => [t.id, t]));

  /** Follow name->id chain until we reach a record with a human name. */
  const resolveReal = (id: string, seen = new Set<string>()): string | null => {
    const rec = byId.get(id);
    if (!rec) return null;
    if (!isUuid(rec.name)) return rec.id; // real record
    if (seen.has(id)) return null;
    seen.add(id);
    return resolveReal(rec.name, seen);
  };

  const junk = all.filter((t) => isUuid(t.name));
  for (const j of junk) {
    const realId = resolveReal(j.id);
    if (!realId || realId === j.id) {
      console.warn(`TECH: cannot resolve real record for ${j.id}; skipping`);
      continue;
    }
    // Remap portfolio relations from junk -> real, avoiding duplicates.
    const links = await db.techStackOnPortfolio.findMany({
      where: { techId: j.id },
    });
    for (const link of links) {
      const exists = await db.techStackOnPortfolio.findFirst({
        where: { portfolioId: link.portfolioId, techId: realId },
      });
      if (exists) {
        await db.techStackOnPortfolio.deleteMany({
          where: { portfolioId: link.portfolioId, techId: j.id },
        });
      } else {
        await db.techStackOnPortfolio.updateMany({
          where: { portfolioId: link.portfolioId, techId: j.id },
          data: { techId: realId },
        });
      }
    }
    await db.techStack.delete({ where: { id: j.id } });
    console.log(`TECH: ${j.id} -> ${byId.get(realId)?.name} (cleaned)`);
  }
}

async function cleanupTags() {
  const all = await db.portfolioTag.findMany();
  const byId = new Map(all.map((t) => [t.id, t]));

  const resolveReal = (id: string, seen = new Set<string>()): string | null => {
    const rec = byId.get(id);
    if (!rec) return null;
    if (!isUuid(rec.name)) return rec.id;
    if (seen.has(id)) return null;
    seen.add(id);
    return resolveReal(rec.name, seen);
  };

  const junk = all.filter((t) => isUuid(t.name));
  for (const j of junk) {
    const realId = resolveReal(j.id);
    if (!realId || realId === j.id) {
      console.warn(`TAG: cannot resolve real record for ${j.id}; skipping`);
      continue;
    }
    const links = await db.portfolioTagOnPortfolio.findMany({
      where: { tagId: j.id },
    });
    for (const link of links) {
      const exists = await db.portfolioTagOnPortfolio.findFirst({
        where: { portfolioId: link.portfolioId, tagId: realId },
      });
      if (exists) {
        await db.portfolioTagOnPortfolio.deleteMany({
          where: { portfolioId: link.portfolioId, tagId: j.id },
        });
      } else {
        await db.portfolioTagOnPortfolio.updateMany({
          where: { portfolioId: link.portfolioId, tagId: j.id },
          data: { tagId: realId },
        });
      }
    }
    await db.portfolioTag.delete({ where: { id: j.id } });
    console.log(`TAG: ${j.id} -> ${byId.get(realId)?.name} (cleaned)`);
  }
}

async function main() {
  await cleanupTech();
  await cleanupTags();
  const techLeft = (await db.techStack.findMany()).filter((t) => isUuid(t.name));
  const tagLeft = (await db.portfolioTag.findMany()).filter((t) =>
    isUuid(t.name),
  );
  console.log(
    `\nDone. Remaining junk -> tech: ${techLeft.length}, tags: ${tagLeft.length}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
