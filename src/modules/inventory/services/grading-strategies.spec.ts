import { CategoryGradingSystemType } from '../entities/category.entity';
import {
  AggregateState,
  GRADING_STRATEGIES,
  GradedCourse,
  buildAggregateMessage,
  computeAggregateRange,
} from './grading-strategies';

describe('grading-strategies', () => {
  const wassce = GRADING_STRATEGIES[CategoryGradingSystemType.WASSCE]!;
  const bece = GRADING_STRATEGIES[CategoryGradingSystemType.BECE]!;

  describe('WASSCE getGrade', () => {
    it.each([
      [100, 'A1', 1],
      [75, 'A1', 1],
      [74, 'B2', 2],
      [69, 'B3', 3],
      [64, 'C4', 4],
      [59, 'C5', 5],
      [54, 'C6', 6],
      [49, 'D7', 7],
      [44, 'E8', 8],
      [39, 'F9', 9],
      [0, 'F9', 9],
    ])('maps score %i to grade %s (%i points)', (score, grade, points) => {
      expect(wassce.getGrade(score)).toEqual({ grade, points });
    });

    it('clamps out-of-range scores', () => {
      expect(wassce.getGrade(-10)).toEqual({ grade: 'F9', points: 9 });
      expect(wassce.getGrade(120)).toEqual({ grade: 'A1', points: 1 });
    });
  });

  describe('BECE getGrade', () => {
    it.each([
      [100, '1', 1],
      [90, '1', 1],
      [89, '2', 2],
      [79, '3', 3],
      [69, '4', 4],
      [59, '5', 5],
      [54, '6', 6],
      [49, '7', 7],
      [39, '8', 8],
      [34, '9', 9],
      [0, '9', 9],
    ])('maps score %i to grade %s (%i points)', (score, grade, points) => {
      expect(bece.getGrade(score)).toEqual({ grade, points });
    });
  });

  describe('computeAggregateRange', () => {
    it('returns null when there are no tested courses', () => {
      expect(computeAggregateRange(wassce, [])).toBeNull();
    });

    it('selects best 3 core + best 3 elective for WASSCE and reports no remaining slots when full', () => {
      const testedCourses: GradedCourse[] = [
        { course_id: 'c1', course_title: 'English', is_mandatory: true, score: 80 },
        { course_id: 'c2', course_title: 'Maths', is_mandatory: true, score: 72 },
        { course_id: 'c3', course_title: 'Science', is_mandatory: true, score: 66 },
        { course_id: 'c4', course_title: 'Social Studies', is_mandatory: true, score: 20 },
        { course_id: 'e1', course_title: 'Physics', is_mandatory: false, score: 62 },
        { course_id: 'e2', course_title: 'Chemistry', is_mandatory: false, score: 57 },
        { course_id: 'e3', course_title: 'Biology', is_mandatory: false, score: 52 },
      ];

      const result = computeAggregateRange(wassce, testedCourses);

      expect(result).not.toBeNull();
      expect(result!.requiredCoreRemaining).toBe(0);
      expect(result!.requiredElectiveRemaining).toBe(0);
      // Social Studies (score 20) should be excluded — only the best 3 core are selected.
      expect(result!.selectedCourseIds).toEqual(
        expect.arrayContaining(['c1', 'c2', 'c3', 'e1', 'e2', 'e3']),
      );
      expect(result!.selectedCourseIds).not.toContain('c4');
    });

    it('reports remaining slots when fewer than required subjects are tested', () => {
      const testedCourses: GradedCourse[] = [
        { course_id: 'c1', course_title: 'English', is_mandatory: true, score: 80 },
        { course_id: 'e1', course_title: 'Physics', is_mandatory: false, score: 62 },
      ];

      const result = computeAggregateRange(wassce, testedCourses);

      expect(result).not.toBeNull();
      expect(result!.requiredCoreRemaining).toBe(2);
      expect(result!.requiredElectiveRemaining).toBe(2);
    });

    it('produces a low <= high range widened by the score margin', () => {
      const testedCourses: GradedCourse[] = [
        { course_id: 'c1', course_title: 'English', is_mandatory: true, score: 72 },
      ];

      const result = computeAggregateRange(wassce, testedCourses);

      expect(result).not.toBeNull();
      expect(result!.low).toBeLessThanOrEqual(result!.high);
      expect(result!.range).toBe(
        result!.low === result!.high
          ? String(result!.low)
          : `${result!.low}-${result!.high}`,
      );
    });

    it('uses BECE core/elective counts (4 core + 2 elective)', () => {
      const testedCourses: GradedCourse[] = [
        { course_id: 'c1', course_title: 'English', is_mandatory: true, score: 95 },
        { course_id: 'c2', course_title: 'Maths', is_mandatory: true, score: 85 },
        { course_id: 'c3', course_title: 'Science', is_mandatory: true, score: 75 },
        { course_id: 'c4', course_title: 'Social Studies', is_mandatory: true, score: 65 },
        { course_id: 'c5', course_title: 'RME', is_mandatory: true, score: 10 },
        { course_id: 'e1', course_title: 'French', is_mandatory: false, score: 55 },
        { course_id: 'e2', course_title: 'ICT', is_mandatory: false, score: 45 },
      ];

      const result = computeAggregateRange(bece, testedCourses);

      expect(result!.requiredCoreRemaining).toBe(0);
      expect(result!.requiredElectiveRemaining).toBe(0);
      expect(result!.selectedCourseIds).not.toContain('c5');
    });
  });

  describe('buildAggregateMessage', () => {
    it('returns the not-configured message when grading is not set up', () => {
      const message = buildAggregateMessage({
        state: 'ZERO_DATA',
        gradingConfigured: false,
        missingCourseTitles: [],
        requiredSlots: 6,
      });
      expect(message).toBe(
        'Aggregate grading is not yet configured for this category.',
      );
    });

    it.each<[AggregateState, string]>([
      [
        'ZERO_DATA',
        'Not enough data yet. Take tests in your registered subjects to see your estimated aggregate.',
      ],
    ])('returns the expected message for %s', (state, expected) => {
      const message = buildAggregateMessage({
        state,
        gradingConfigured: true,
        missingCourseTitles: [],
        requiredSlots: 6,
      });
      expect(message).toBe(expected);
    });

    it('lists missing subjects for PARTIAL_DATA', () => {
      const message = buildAggregateMessage({
        state: 'PARTIAL_DATA',
        gradingConfigured: true,
        missingCourseTitles: ['Chemistry', 'Physics', 'Government'],
        requiredSlots: 6,
      });
      expect(message).toBe(
        'Missing data for Chemistry, Physics, Government. Take a few tests to narrow this range.',
      );
    });

    it('reports subject count for COMPLETE_DATA', () => {
      const message = buildAggregateMessage({
        state: 'COMPLETE_DATA',
        gradingConfigured: true,
        missingCourseTitles: [],
        requiredSlots: 6,
      });
      expect(message).toBe('Estimated range, based on 6 of 6 subjects.');
    });
  });
});
