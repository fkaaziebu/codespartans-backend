import { CategoryGradingSystemType } from '../entities/category.entity';

export interface GradeBand {
  min: number;
  max: number;
  grade: string;
  points: number;
}

export interface GradedCourse {
  course_id: string;
  course_title: string;
  is_mandatory: boolean;
  score: number;
}

export interface GradingStrategy {
  coreCount: number;
  electiveCount: number;
  gradeBands: GradeBand[];
  getGrade(score: number): { grade: string; points: number };
}

const WASSCE_GRADE_BANDS: GradeBand[] = [
  { min: 75, max: 100, grade: 'A1', points: 1 },
  { min: 70, max: 74, grade: 'B2', points: 2 },
  { min: 65, max: 69, grade: 'B3', points: 3 },
  { min: 60, max: 64, grade: 'C4', points: 4 },
  { min: 55, max: 59, grade: 'C5', points: 5 },
  { min: 50, max: 54, grade: 'C6', points: 6 },
  { min: 45, max: 49, grade: 'D7', points: 7 },
  { min: 40, max: 44, grade: 'E8', points: 8 },
  { min: 0, max: 39, grade: 'F9', points: 9 },
];

const BECE_GRADE_BANDS: GradeBand[] = [
  { min: 90, max: 100, grade: '1', points: 1 },
  { min: 80, max: 89, grade: '2', points: 2 },
  { min: 70, max: 79, grade: '3', points: 3 },
  { min: 60, max: 69, grade: '4', points: 4 },
  { min: 55, max: 59, grade: '5', points: 5 },
  { min: 50, max: 54, grade: '6', points: 6 },
  { min: 40, max: 49, grade: '7', points: 7 },
  { min: 35, max: 39, grade: '8', points: 8 },
  { min: 0, max: 34, grade: '9', points: 9 },
];

function makeGetGrade(
  bands: GradeBand[],
): (score: number) => { grade: string; points: number } {
  return (score: number) => {
    const clamped = Math.min(100, Math.max(0, score));
    const band =
      bands.find((b) => clamped >= b.min && clamped <= b.max) ??
      bands[bands.length - 1];
    return { grade: band.grade, points: band.points };
  };
}

export const GRADING_STRATEGIES: Record<
  CategoryGradingSystemType,
  GradingStrategy | null
> = {
  [CategoryGradingSystemType.WASSCE]: {
    coreCount: 3,
    electiveCount: 3,
    gradeBands: WASSCE_GRADE_BANDS,
    getGrade: makeGetGrade(WASSCE_GRADE_BANDS),
  },
  [CategoryGradingSystemType.BECE]: {
    coreCount: 4,
    electiveCount: 2,
    gradeBands: BECE_GRADE_BANDS,
    getGrade: makeGetGrade(BECE_GRADE_BANDS),
  },
  [CategoryGradingSystemType.NONE]: null,
};

// The exact range formula is unspecified by product; widening each selected
// subject's score by a fixed margin to derive a low/high grade-points bound is a
// placeholder heuristic, isolated here so it can be swapped later without
// touching resolver/service plumbing.
const RANGE_MARGIN_PERCENTAGE_POINTS = 5;

export interface AggregateResult {
  range: string;
  low: number;
  high: number;
  requiredCoreRemaining: number;
  requiredElectiveRemaining: number;
  selectedCourseIds: string[];
}

export function computeAggregateRange(
  strategy: GradingStrategy,
  testedCourses: GradedCourse[],
): AggregateResult | null {
  const core = testedCourses
    .filter((c) => c.is_mandatory)
    .sort((a, b) => b.score - a.score)
    .slice(0, strategy.coreCount);
  const elective = testedCourses
    .filter((c) => !c.is_mandatory)
    .sort((a, b) => b.score - a.score)
    .slice(0, strategy.electiveCount);

  const selected = [...core, ...elective];
  if (selected.length === 0) return null;

  let low = 0;
  let high = 0;
  for (const course of selected) {
    const bestCaseScore = Math.min(
      100,
      course.score + RANGE_MARGIN_PERCENTAGE_POINTS,
    );
    const worstCaseScore = Math.max(
      0,
      course.score - RANGE_MARGIN_PERCENTAGE_POINTS,
    );
    low += strategy.getGrade(bestCaseScore).points;
    high += strategy.getGrade(worstCaseScore).points;
  }

  return {
    range: low === high ? String(low) : `${low}-${high}`,
    low,
    high,
    requiredCoreRemaining: Math.max(0, strategy.coreCount - core.length),
    requiredElectiveRemaining: Math.max(
      0,
      strategy.electiveCount - elective.length,
    ),
    selectedCourseIds: selected.map((c) => c.course_id),
  };
}

export type AggregateState = 'ZERO_DATA' | 'PARTIAL_DATA' | 'COMPLETE_DATA';

export function buildAggregateMessage({
  state,
  gradingConfigured,
  missingCourseTitles,
  requiredSlots,
}: {
  state: AggregateState;
  gradingConfigured: boolean;
  missingCourseTitles: string[];
  requiredSlots: number;
}): string {
  if (!gradingConfigured) {
    return 'Aggregate grading is not yet configured for this category.';
  }
  switch (state) {
    case 'ZERO_DATA':
      return 'Not enough data yet. Take tests in your registered subjects to see your estimated aggregate.';
    case 'PARTIAL_DATA':
      return missingCourseTitles.length
        ? `Missing data for ${missingCourseTitles.join(', ')}. Take a few tests to narrow this range.`
        : 'Take a few more tests to narrow this range.';
    case 'COMPLETE_DATA':
      return `Estimated range, based on ${requiredSlots} of ${requiredSlots} subjects.`;
  }
}
