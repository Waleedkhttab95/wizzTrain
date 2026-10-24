import { Prisma } from '@prisma/client';

/** The full template tree, ordered for display. */
export const templateSelect = {
  id: true,
  title: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  days: {
    orderBy: { orderIndex: 'asc' },
    select: {
      id: true,
      dayLabel: true,
      orderIndex: true,
      exercises: {
        orderBy: { orderIndex: 'asc' },
        select: {
          id: true,
          name: true,
          sets: true,
          reps: true,
          restInterval: true,
          notes: true,
          videoUrl: true,
          videoFile: true,
          orderIndex: true,
        },
      },
    },
  },
} satisfies Prisma.ProgramTemplateSelect;

export type TemplateRow = Prisma.ProgramTemplateGetPayload<{ select: typeof templateSelect }>;

/** List view: counts instead of the whole tree. */
export const templateSummarySelect = {
  id: true,
  title: true,
  notes: true,
  updatedAt: true,
  days: {
    orderBy: { orderIndex: 'asc' },
    select: { _count: { select: { exercises: true } } },
  },
} satisfies Prisma.ProgramTemplateSelect;

export type TemplateSummaryRow = Prisma.ProgramTemplateGetPayload<{
  select: typeof templateSummarySelect;
}>;
