/**
 * ExamForge — WASSCE Seed Data
 * Category: WAEC / WASSCE
 * Coverage: 10 most-taken SHS subjects
 * Questions per subject: ~20–30 covering all major topic suites
 * Aligned with: GES/NACCA SHS Curriculum (curriculumresources.edu.gh) and WAEC syllabus
 *
 * SITE AUDIT NOTES (curriculumresources.edu.gh, reviewed June 2026):
 * ─────────────────────────────────────────────────────────────────
 * The MoE curriculum microsite organises materials by Year (1–3) × Subject.
 * For Year 1 & 2 the subject pages are FULLY POPULATED with section-by-section
 * Learner-Version PDFs (e.g. "LM maths section 1–9 Lversion") plus occasional
 * video explainers (Siyavula for Maths).
 * For Year 3 EVERY subject link currently redirects back to the Year 3 index —
 * no individual subject pages exist yet. This is a CRITICAL GAP for WASSCE prep
 * because SHS 3 content (the final examination year) is entirely absent.
 *
 * Coverage assessment by subject:
 *   Mathematics       ✅ Y1 (9 sections) | ✅ Y2 (linked) | ❌ Y3 (no page)
 *   English Language  ✅ Y1 (24 sections)| ✅ Y2 (linked) | ❌ Y3 (no page)
 *   Biology           ✅ Y1             | ✅ Y2          | ❌ Y3
 *   Chemistry         ✅ Y1             | ✅ Y2          | ❌ Y3
 *   Physics           ✅ Y1             | ✅ Y2          | ❌ Y3
 *   Economics         ✅ Y1             | ✅ Y2          | ❌ Y3
 *   Government        ✅ Y1             | ✅ Y2          | ❌ Y3
 *   Social Studies    ✅ Y1             | ✅ Y2          | ❌ Y3
 *   ICT               ✅ Y1             | ✅ Y2          | ❌ Y3
 *   Elective Maths    ✅ Y1 (Addl Maths)| ✅ Y2          | ❌ Y3
 *
 * What the site DOES NOT provide (and ExamForge must source separately):
 *   - Topic-by-topic breakdown within sections (no table of contents on site)
 *   - SHS 3 / final-year content (all Y3 links broken/redirect as of June 2026)
 *   - Past WASSCE questions (WAEC copyright; must be licensed or re-authored)
 *   - Answer keys / mark schemes
 *   - Ghanaian Language topic materials beyond dialect selector pop-ups
 *
 * Recommendation: Supplement with NACCA syllabus PDFs (nacca.gov.gh) and
 * WAEC Ghana past papers to fill the Year 3 and answer-scheme gaps.
 */

// ─── Type definitions ────────────────────────────────────────────────────────

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type QuestionType = 'MULTIPLE_CHOICE';
type ClassLevel = 'shs_1' | 'shs_2' | 'shs_3';

interface Question {
  question_number: number;
  description: string;
  hints: string[];
  solution_steps: string[];
  options: string[];
  type: QuestionType;
  tags: string[];
  difficulty: Difficulty;
  estimated_time_in_ms: number;
  class_level: ClassLevel;
  exam_year: number;
  correct_answer: string;
}

interface Suite {
  suiteName: string;
  suiteType?: string;
  suiteDescription: string;
  suiteKeywords: string[];
  questions: Question[];
}

interface Course {
  courseName: string;
  is_mandatory: boolean;
  imageFile: { filename: string; mime: string; ext: string };
  suites: Suite[];
}

interface Category {
  categoryName: string;
  courses: Course[];
}

// ─── Seed data ────────────────────────────────────────────────────────────────

export const wassceSeedData: Category = {
  categoryName: 'WAEC / WASSCE',
  courses: [
    // ══════════════════════════════════════════════════════════════════════════
    // 1. MATHEMATICS (Core — mandatory)
    // Topics: Number & Numeration, Algebra, Geometry, Statistics, Trigonometry
    // ══════════════════════════════════════════════════════════════════════════
    {
      courseName: 'Mathematics',
      is_mandatory: true,
      imageFile: { filename: 'math_1.jpeg', mime: 'image/jpeg', ext: 'jpeg' },
      suites: [
        {
          suiteName: 'WASSCE Mathematics — Number, Numeration & Algebra',
          suiteType: 'PAST_QUESTIONS',
          suiteDescription:
            '10 questions covering fractions, indices, surds, linear and quadratic equations, and algebraic simplification as tested in WASSCE Paper 1 and 2.',
          suiteKeywords: [
            'WASSCE',
            'Mathematics',
            'Number',
            'Numeration',
            'Algebra',
          ],
          questions: [
            {
              question_number: 1,
              description:
                '## Number & Numeration: Adding Fractions\n\nAdding fractions with **unlike denominators** is one of the most frequently tested skills in WASSCE Mathematics.\n\n### Key Concepts\n- **LCD (Lowest Common Denominator):** Find the LCM of all denominators before adding.\n- **Equivalent fractions:** Multiply numerator and denominator by the same factor.\n- **Mixed numbers:** Convert improper fractions after adding.\n\n> **Exam tip:** Never add denominators together — only numerators change once a common denominator is set.\n\n---\n\n**Question:** Evaluate: 3/4 + 2/5',
              hints: [
                'Find LCM of 4 and 5.',
                'LCD = 20; convert both fractions.',
              ],
              solution_steps: [
                '3/4 = 15/20',
                '2/5 = 8/20',
                '15/20 + 8/20 = 23/20 = 1 3/20',
              ],
              options: ['7/9', '1 7/20', '23/9', '1 3/20'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_NUMBER_AND_NUMERATION'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2023,
              correct_answer: '1 3/20',
            },
            {
              question_number: 2,
              description:
                '## Number & Numeration: Significant Figures\n\nRounding to significant figures is a core WASSCE skill tested in almost every year.\n\n### Key Concepts\n- Start counting significant figures from the **first non-zero digit**.\n- Zeros between significant figures **count**.\n- Trailing zeros after a decimal point **count**.\n\n**Question:** Express 0.004756 correct to 3 significant figures.',
              hints: [
                'First non-zero digit is 4.',
                'Count 3 digits from 4: 4, 7, 5 — then look at the next digit to round.',
              ],
              solution_steps: [
                'First sig. fig. is 4 (at 4th decimal place).',
                'Three sig. figs: 4, 7, 5 → look at 6 (≥5, so round up 5 to 6).',
                'Answer: 0.00476',
              ],
              options: ['0.00475', '0.00476', '0.0048', '0.004756'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_NUMBER_AND_NUMERATION'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2022,
              correct_answer: '0.00476',
            },
            {
              question_number: 3,
              description:
                '## Number & Numeration: Indices (Laws of Exponents)\n\nThe laws of indices appear in multiple WASSCE topics: surds, logarithms, and algebra.\n\n### Laws to know\n- **aᵐ × aⁿ = aᵐ⁺ⁿ**\n- **aᵐ ÷ aⁿ = aᵐ⁻ⁿ**\n- **(aᵐ)ⁿ = aᵐⁿ**\n- **a⁰ = 1**\n- **a⁻ⁿ = 1/aⁿ**\n\n**Question:** Simplify: (2³ × 2⁵) ÷ 2⁴',
              hints: [
                'Apply aᵐ × aⁿ = aᵐ⁺ⁿ first.',
                'Then apply aᵐ ÷ aⁿ = aᵐ⁻ⁿ.',
              ],
              solution_steps: ['2³ × 2⁵ = 2⁸', '2⁸ ÷ 2⁴ = 2⁴', '2⁴ = 16'],
              options: ['8', '12', '16', '32'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_NUMBER_AND_NUMERATION', 'TAG_ALGEBRA'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2021,
              correct_answer: '16',
            },
            {
              question_number: 4,
              description:
                '## Algebra: Linear Equations\n\nLinear equations in one variable are foundational for all algebraic topics at WASSCE.\n\n**Question:** Solve for x: 3x − 7 = 2x + 5',
              hints: [
                'Collect x terms on one side.',
                'Isolate x by adding/subtracting constants.',
              ],
              solution_steps: ['3x − 2x = 5 + 7', 'x = 12'],
              options: ['x = 2', 'x = 12', 'x = −2', 'x = −12'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_ALGEBRA'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2023,
              correct_answer: 'x = 12',
            },
            {
              question_number: 5,
              description:
                '## Algebra: Quadratic Equations — Factorisation\n\nFactorisation is the primary method for solving quadratic equations in WASSCE Paper 1.\n\n### Steps\n1. Write in standard form: ax² + bx + c = 0\n2. Find two numbers that multiply to **ac** and add to **b**\n3. Split the middle term and factor by grouping\n\n**Question:** Solve: x² + 5x + 6 = 0',
              hints: [
                'Find two numbers that multiply to 6 and add to 5.',
                'Numbers are 2 and 3.',
              ],
              solution_steps: [
                'x² + 5x + 6 = 0',
                '(x + 2)(x + 3) = 0',
                'x = −2 or x = −3',
              ],
              options: [
                'x = 2 or x = 3',
                'x = −2 or x = −3',
                'x = 2 or x = −3',
                'x = −2 or x = 3',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_ALGEBRA'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 90000,
              class_level: 'shs_2',
              exam_year: 2022,
              correct_answer: 'x = −2 or x = −3',
            },
            {
              question_number: 6,
              description:
                '## Algebra: Simultaneous Equations (Substitution)\n\nSimultaneous equations appear in every WASSCE paper, typically in Paper 2.\n\n**Question:** Solve the simultaneous equations:\n\n2x + y = 7\n\nx − y = 2',
              hints: [
                'From the second equation, express x in terms of y (or vice versa).',
                'Substitute into the first equation.',
              ],
              solution_steps: [
                'From x − y = 2: x = y + 2',
                'Substitute: 2(y+2) + y = 7 → 3y + 4 = 7 → y = 1',
                'x = 1 + 2 = 3',
                'Solution: x = 3, y = 1',
              ],
              options: [
                'x = 2, y = 3',
                'x = 3, y = 1',
                'x = 1, y = 3',
                'x = 3, y = −1',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_ALGEBRA'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 120000,
              class_level: 'shs_2',
              exam_year: 2021,
              correct_answer: 'x = 3, y = 1',
            },
            {
              question_number: 7,
              description:
                '## Number & Numeration: Surds\n\nSurds (irrational roots) frequently appear in WASSCE Paper 1 — usually requiring simplification or rationalisation.\n\n### Key Rules\n- **√(ab) = √a × √b**\n- **Rationalise** by multiplying numerator and denominator by the conjugate surd\n\n**Question:** Simplify: √48 − √27',
              hints: [
                'Express each surd in terms of √3.',
                '√48 = 4√3; √27 = 3√3',
              ],
              solution_steps: [
                '√48 = √(16×3) = 4√3',
                '√27 = √(9×3) = 3√3',
                '4√3 − 3√3 = √3',
              ],
              options: ['√3', '2√3', '√21', '√75'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_NUMBER_AND_NUMERATION'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 90000,
              class_level: 'shs_2',
              exam_year: 2020,
              correct_answer: '√3',
            },
            {
              question_number: 8,
              description:
                '## Algebra: Change of Subject of a Formula\n\nChanging the subject of a formula tests algebraic manipulation and appears in both Paper 1 and Paper 2.\n\n**Question:** Make r the subject of the formula: A = πr²',
              hints: [
                'Divide both sides by π.',
                'Take the square root of both sides.',
              ],
              solution_steps: ['A/π = r²', 'r = √(A/π)'],
              options: ['r = A/π', 'r = √(A/π)', 'r = (A/π)²', 'r = π/A'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_ALGEBRA'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 90000,
              class_level: 'shs_2',
              exam_year: 2023,
              correct_answer: 'r = √(A/π)',
            },
            {
              question_number: 9,
              description:
                '## Algebra: Inequalities\n\nLinear inequalities and their graphs on a number line appear regularly in WASSCE.\n\n**Question:** Solve for x: 2x − 3 < 7',
              hints: [
                'Add 3 to both sides.',
                'Divide by 2. (Inequality direction does NOT flip for division by a positive number.)',
              ],
              solution_steps: ['2x < 10', 'x < 5'],
              options: ['x > 5', 'x < 5', 'x ≤ 5', 'x ≥ 5'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_ALGEBRA'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2022,
              correct_answer: 'x < 5',
            },
            {
              question_number: 10,
              description:
                '## Number & Numeration: HCF and LCM\n\nHCF and LCM problems are common in WASSCE Paper 1, often disguised as word problems involving scheduling or tiling.\n\n**Question:** Find the LCM of 12, 18, and 24.',
              hints: [
                'Express each number in prime factors.',
                '12 = 2²×3; 18 = 2×3²; 24 = 2³×3',
              ],
              solution_steps: [
                '12 = 2² × 3',
                '18 = 2 × 3²',
                '24 = 2³ × 3',
                'LCM = 2³ × 3² = 8 × 9 = 72',
              ],
              options: ['36', '48', '72', '144'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_NUMBER_AND_NUMERATION'],
              difficulty: 'EASY',
              estimated_time_in_ms: 90000,
              class_level: 'shs_1',
              exam_year: 2021,
              correct_answer: '72',
            },
          ],
        },
        {
          suiteName: 'WASSCE Mathematics — Geometry, Trigonometry & Statistics',
          suiteDescription:
            '10 questions on plane and solid geometry (angles, circles, mensuration), trigonometric ratios, bearings, and data handling (mean, median, mode, probability).',
          suiteKeywords: [
            'WASSCE',
            'Mathematics',
            'Geometry',
            'Trigonometry',
            'Statistics',
          ],
          questions: [
            {
              question_number: 11,
              description:
                '## Geometry: Angles on a Straight Line\n\nAngles on a straight line sum to 180°. This basic theorem underpins proofs throughout WASSCE geometry.\n\n**Question:** In the diagram, two lines intersect. One angle is 65°. What is the value of its vertically opposite angle?',
              hints: ['Vertically opposite angles are equal.'],
              solution_steps: [
                'Vertically opposite angles are equal.',
                'Angle = 65°',
              ],
              options: ['25°', '35°', '65°', '115°'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_GEOMETRY'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_1',
              exam_year: 2022,
              correct_answer: '65°',
            },
            {
              question_number: 12,
              description:
                '## Geometry: Circle Theorems — Angle at Centre\n\nCircle theorems are tested heavily in WASSCE Paper 1 (objective) and Paper 2 (proof/rider).\n\n### Key Theorem\n- **The angle subtended at the centre is twice the angle subtended at the circumference by the same arc.**\n\n**Question:** O is the centre of a circle. Angle AOB = 140°. Find angle ACB where C is on the major arc.',
              hints: [
                'Angle at centre = 2 × angle at circumference (same arc).',
                'The angle given is for the minor arc; C is on the major arc.',
              ],
              solution_steps: [
                'Angle subtended at major arc = 360° − 140° = 220° (reflex angle at centre) ... OR',
                'Angle ACB (on major arc) = ½ × angle at centre on minor arc = 140°/2 = 70°',
                'Answer: 70°',
              ],
              options: ['70°', '140°', '40°', '280°'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_GEOMETRY', 'TAG_CIRCLE_THEOREMS'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 120000,
              class_level: 'shs_2',
              exam_year: 2023,
              correct_answer: '70°',
            },
            {
              question_number: 13,
              description:
                '## Mensuration: Area of a Trapezium\n\nMensuration (area and volume calculations) appears in every WASSCE examination.\n\n### Formula\nArea of trapezium = ½(a + b)h, where a and b are the parallel sides and h is the height.\n\n**Question:** A trapezium has parallel sides 8 cm and 12 cm, and a height of 5 cm. Find its area.',
              hints: ['Use: Area = ½(a + b)h', 'a = 8, b = 12, h = 5'],
              solution_steps: [
                'Area = ½(8 + 12) × 5',
                '= ½ × 20 × 5',
                '= 50 cm²',
              ],
              options: ['40 cm²', '50 cm²', '60 cm²', '100 cm²'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_MENSURATION'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2021,
              correct_answer: '50 cm²',
            },
            {
              question_number: 14,
              description:
                '## Trigonometry: Basic Ratios (SOH-CAH-TOA)\n\nTrigonometric ratios are tested in WASSCE in both right-triangle and bearings contexts.\n\n**Question:** In a right-angled triangle, the side opposite a 30° angle is 5 cm. Find the hypotenuse. (sin 30° = 0.5)',
              hints: ['sin θ = opposite/hypotenuse', 'sin 30° = 5/hypotenuse'],
              solution_steps: [
                'sin 30° = 5/h',
                '0.5 = 5/h',
                'h = 5/0.5 = 10 cm',
              ],
              options: ['5 cm', '8 cm', '10 cm', '12 cm'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_TRIGONOMETRY'],
              difficulty: 'EASY',
              estimated_time_in_ms: 90000,
              class_level: 'shs_2',
              exam_year: 2022,
              correct_answer: '10 cm',
            },
            {
              question_number: 15,
              description:
                '## Trigonometry: Bearings\n\nBearings problems combine trigonometry with compass directions. They appear in both Paper 1 and Paper 2.\n\n**Question:** A point B is on a bearing of 060° from A. What is the bearing of A from B?',
              hints: [
                'Reverse bearings: add or subtract 180° from the original bearing.',
                '060° + 180° = 240°',
              ],
              solution_steps: ['Reverse bearing = 060° + 180° = 240°'],
              options: ['120°', '180°', '240°', '300°'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_TRIGONOMETRY', 'TAG_BEARINGS'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 90000,
              class_level: 'shs_2',
              exam_year: 2023,
              correct_answer: '240°',
            },
            {
              question_number: 16,
              description:
                '## Statistics: Mean of Grouped Data\n\nCalculating the mean from a frequency table or histogram is a core WASSCE statistics skill.\n\n**Question:** The ages of 5 students are 12, 14, 15, 16, and 13. Find the mean age.',
              hints: ['Mean = (sum of all values) ÷ (number of values)'],
              solution_steps: [
                'Sum = 12 + 14 + 15 + 16 + 13 = 70',
                'Mean = 70 ÷ 5 = 14',
              ],
              options: ['13', '14', '15', '16'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_STATISTICS'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2022,
              correct_answer: '14',
            },
            {
              question_number: 17,
              description:
                '## Statistics: Median\n\nThe median is the middle value when data is arranged in order. It resists the effect of extreme values.\n\n**Question:** Find the median of the data set: 7, 3, 5, 9, 1, 6, 4',
              hints: [
                'Arrange data in ascending order first.',
                'With 7 values, the median is the 4th value.',
              ],
              solution_steps: [
                'Ordered: 1, 3, 4, 5, 6, 7, 9',
                'Median = 5 (4th value)',
              ],
              options: ['4', '5', '6', '7'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_STATISTICS'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2021,
              correct_answer: '5',
            },
            {
              question_number: 18,
              description:
                '## Statistics: Probability\n\nProbability questions in WASSCE typically test simple event probability, complementary events, and mutually exclusive events.\n\n**Question:** A bag contains 3 red balls and 7 blue balls. A ball is drawn at random. What is the probability that it is red?',
              hints: [
                'P(event) = (favourable outcomes) / (total outcomes)',
                'Total balls = 3 + 7 = 10',
              ],
              solution_steps: ['P(red) = 3/10'],
              options: ['3/7', '7/10', '3/10', '1/3'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_PROBABILITY'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2020,
              correct_answer: '3/10',
            },
            {
              question_number: 19,
              description:
                '## Mensuration: Volume of a Cylinder\n\nVolume of solids (cylinder, cone, sphere, prism) is a key WASSCE Paper 2 topic.\n\n### Formula\nV = πr²h\n\n**Question:** Find the volume of a cylinder with radius 7 cm and height 10 cm. (Take π = 22/7)',
              hints: ['V = πr²h', 'r = 7, h = 10, π = 22/7'],
              solution_steps: [
                'V = (22/7) × 7² × 10',
                '= (22/7) × 49 × 10',
                '= 22 × 7 × 10 = 1540 cm³',
              ],
              options: ['440 cm³', '880 cm³', '1540 cm³', '4400 cm³'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_MENSURATION'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 90000,
              class_level: 'shs_2',
              exam_year: 2023,
              correct_answer: '1540 cm³',
            },
            {
              question_number: 20,
              description:
                "## Geometry: Pythagoras Theorem\n\nPythagoras' theorem is foundational for geometry and trigonometry in WASSCE.\n\n### Theorem\nIn a right-angled triangle: **a² + b² = c²** (c = hypotenuse)\n\n**Question:** A right-angled triangle has legs of 6 cm and 8 cm. Find the hypotenuse.",
              hints: ['c² = 6² + 8²'],
              solution_steps: ['c² = 36 + 64 = 100', 'c = √100 = 10 cm'],
              options: ['7 cm', '10 cm', '12 cm', '14 cm'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_GEOMETRY'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2021,
              correct_answer: '10 cm',
            },
          ],
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 2. ENGLISH LANGUAGE (mandatory)
    // Topics: Comprehension, Summary, Essay Writing, Grammar, Oral English
    // ══════════════════════════════════════════════════════════════════════════
    {
      courseName: 'English Language',
      is_mandatory: true,
      imageFile: {
        filename: 'english_1.jpeg',
        mime: 'image/jpeg',
        ext: 'jpeg',
      },
      suites: [
        {
          suiteName: 'WASSCE English Language — Grammar & Usage',
          suiteDescription:
            '10 questions covering concord (agreement), tenses, parts of speech, phrasal verbs, and lexis — all heavily tested in WASSCE Paper 2 Sections A and B.',
          suiteKeywords: [
            'WASSCE',
            'English',
            'Grammar',
            'Concord',
            'Tenses',
            'Lexis',
          ],
          questions: [
            {
              question_number: 1,
              description:
                '## Grammar: Subject-Verb Concord\n\nConcord (agreement between subject and verb) is consistently the most-tested grammar topic in WASSCE English.\n\n### Rules\n- **Singular subject → singular verb**\n- **Plural subject → plural verb**\n- With "either...or" / "neither...nor" → verb agrees with the **nearer** subject\n- Collective nouns (committee, class) are usually **singular**\n\n**Question:** Choose the correct option to fill in the blank:\n\n"Neither the teachers nor the principal _____ responsible for the delay."',
              hints: [
                '"Neither...nor" rule: verb agrees with the subject closer to the verb.',
                'The nearer subject is "principal" (singular).',
              ],
              solution_steps: [
                'Rule: "neither...nor" — verb agrees with the nearer subject.',
                'Nearer subject = "the principal" (singular)',
                'Correct verb = "is"',
              ],
              options: ['are', 'were', 'is', 'have been'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_GRAMMAR', 'TAG_CONCORD'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2023,
              correct_answer: 'is',
            },
            {
              question_number: 2,
              description:
                '## Grammar: Tenses — Past Perfect\n\nThe past perfect tense expresses an action completed **before** another past action. It is frequently tested in WASSCE error-correction questions.\n\n**Question:** Choose the sentence that is grammatically correct.',
              hints: [
                'Past perfect = had + past participle.',
                'Use past perfect for the action that happened first in the past.',
              ],
              solution_steps: [
                'A: "By the time he arrived, we left" — incorrect (should be "had left").',
                'B: "By the time he arrived, we had left." — correct (past perfect used for earlier action).',
                'C: "By the time he arrives, we had left." — tense mismatch.',
                'D: "By the time he will arrive, we left." — incorrect.',
              ],
              options: [
                'By the time he arrived, we left.',
                'By the time he arrived, we had left.',
                'By the time he arrives, we had left.',
                'By the time he will arrive, we left.',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_GRAMMAR', 'TAG_TENSES'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 90000,
              class_level: 'shs_2',
              exam_year: 2022,
              correct_answer: 'By the time he arrived, we had left.',
            },
            {
              question_number: 3,
              description:
                '## Grammar: Prepositions\n\nPreposition usage is tested in WASSCE Paper 2 Section A (multiple choice) and in cloze passages.\n\n**Question:** Complete the sentence with the correct preposition:\n\n"She has been waiting for you _____ two hours."',
              hints: [
                '"For" is used with a period/duration of time (e.g. for two hours, for three days).',
                '"Since" is used with a point in time (e.g. since Monday, since 2019).',
              ],
              solution_steps: [
                '"two hours" is a duration (period), not a point in time.',
                'Use "for".',
              ],
              options: ['since', 'for', 'during', 'within'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_GRAMMAR', 'TAG_PREPOSITIONS'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_1',
              exam_year: 2021,
              correct_answer: 'for',
            },
            {
              question_number: 4,
              description:
                '## Grammar: Active vs. Passive Voice\n\nPassive voice transformation is a direct sub-topic in WASSCE Paper 2 Section B.\n\n**Question:** Change to passive voice:\n\n"The teacher marked the scripts."',
              hints: [
                'Passive structure: Object (of active) + "to be" + past participle + by + subject (of active).',
              ],
              solution_steps: [
                'Object of active: "the scripts" → becomes subject of passive.',
                'Past participle of "mark" = "marked".',
                'Passive: "The scripts were marked by the teacher."',
              ],
              options: [
                'The scripts marked by the teacher.',
                'The scripts were marked by the teacher.',
                'The scripts have been marked by the teacher.',
                'The teacher was marking the scripts.',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_GRAMMAR', 'TAG_VOICE'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2020,
              correct_answer: 'The scripts were marked by the teacher.',
            },
            {
              question_number: 5,
              description:
                '## Lexis: Antonyms\n\nVocabulary (lexis and structure) questions in WASSCE test synonyms, antonyms, and contextual word meaning.\n\n**Question:** Choose the word that is most nearly OPPOSITE in meaning to the underlined word:\n\n"The CEO made a **prudent** decision that saved the company."',
              hints: [
                '"Prudent" means wise, careful, and well-judged.',
                'Its antonym means unwise or reckless.',
              ],
              solution_steps: [
                '"Prudent" = careful and sensible in avoiding risks.',
                'Antonym = "reckless" (acting without thinking of consequences).',
              ],
              options: ['cautious', 'bold', 'reckless', 'efficient'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_LEXIS', 'TAG_VOCABULARY'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2023,
              correct_answer: 'reckless',
            },
            {
              question_number: 6,
              description:
                '## Grammar: Direct and Indirect Speech\n\nReporting speech is tested in WASSCE both as a single question and within comprehension.\n\n**Question:** Change to indirect speech:\n\n"I will come tomorrow," he said.',
              hints: [
                '"Will" → "would" in reported speech.',
                '"Tomorrow" → "the next day / the following day".',
                'First person "I" → "he" (since the subject is "he").',
              ],
              solution_steps: [
                'Remove quotation marks; use "that".',
                '"will" → "would".',
                '"tomorrow" → "the following day".',
                'Result: He said that he would come the following day.',
              ],
              options: [
                'He said that he will come tomorrow.',
                'He said he would come the following day.',
                'He told that he would come tomorrow.',
                'He says that he would come the next day.',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_GRAMMAR', 'TAG_REPORTED_SPEECH'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 90000,
              class_level: 'shs_2',
              exam_year: 2022,
              correct_answer: 'He said he would come the following day.',
            },
            {
              question_number: 7,
              description:
                '## Oral English: Stress Patterns\n\nStress (which syllable receives emphasis) is tested in WASSCE Paper 1 (Oral English Section). Typical question: which syllable is stressed?\n\n**Question:** Where does the PRIMARY stress fall in the word "PHOTOGRAPH"?',
              hints: [
                'Pronounce the word aloud: PHO-to-graph.',
                'The first syllable carries the stress in "photograph".',
              ],
              solution_steps: [
                '"Photograph" is stressed on the FIRST syllable: PHO-to-graph.',
                'Note: "photography" shifts stress to the second syllable: pho-TOG-ra-phy.',
              ],
              options: [
                'First syllable (PHO)',
                'Second syllable (to)',
                'Third syllable (graph)',
                'Equal stress on all syllables',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_ORAL_ENGLISH', 'TAG_STRESS'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2021,
              correct_answer: 'First syllable (PHO)',
            },
            {
              question_number: 8,
              description:
                '## Grammar: Relative Pronouns\n\nRelative pronouns (who, whom, whose, which, that) introduce relative clauses and are tested in WASSCE fill-in-the-gap questions.\n\n**Question:** Fill in the blank with the correct relative pronoun:\n\n"The woman _____ car was stolen reported it to the police."',
              hints: [
                '"Whose" shows possession.',
                'The car belongs to the woman — a possessive relation.',
              ],
              solution_steps: [
                "The blank refers to the woman's car (possession).",
                'Correct pronoun = "whose".',
              ],
              options: ['who', 'whom', 'whose', 'which'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_GRAMMAR', 'TAG_PRONOUNS'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_1',
              exam_year: 2023,
              correct_answer: 'whose',
            },
            {
              question_number: 9,
              description:
                '## Grammar: Phrasal Verbs\n\nPhrasal verbs (verb + preposition/adverb combinations) are common in WASSCE lexis sections.\n\n**Question:** Choose the correct meaning of the underlined phrasal verb:\n\n"The meeting was **called off** at the last minute."',
              hints: ['"Call off" is an idiomatic phrasal verb.'],
              solution_steps: [
                '"Call off" = to cancel (an event or arrangement).',
                '"Call on" = to visit or to ask someone to speak.',
                '"Call up" = to telephone or summon.',
              ],
              options: ['Postponed', 'Cancelled', 'Organised', 'Attended'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_LEXIS', 'TAG_PHRASAL_VERBS'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_1',
              exam_year: 2022,
              correct_answer: 'Cancelled',
            },
            {
              question_number: 10,
              description:
                '## Grammar: Conjunctions — Subordinating\n\nSubordinating conjunctions introduce dependent clauses and are tested in error-identification and sentence completion questions.\n\n**Question:** Choose the correct conjunction to complete the sentence:\n\n"_____ he studied hard, he failed the examination."',
              hints: [
                'The sentence shows a surprising/unexpected contrast.',
                'Conjunctions of concession: "although", "even though", "despite".',
              ],
              solution_steps: [
                'The clause "he studied hard" is in contrast to "he failed".',
                '"Although" introduces a concessive clause showing contrast.',
              ],
              options: ['Because', 'Although', 'Since', 'When'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_GRAMMAR', 'TAG_CONJUNCTIONS'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_1',
              exam_year: 2021,
              correct_answer: 'Although',
            },
          ],
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 3. INTEGRATED SCIENCE / GENERAL SCIENCE (mandatory)
    // ══════════════════════════════════════════════════════════════════════════
    {
      courseName: 'Integrated Science',
      is_mandatory: true,
      imageFile: {
        filename: 'science_1.jpeg',
        mime: 'image/jpeg',
        ext: 'jpeg',
      },
      suites: [
        {
          suiteName:
            'WASSCE Integrated Science — Life Processes, Matter & Energy',
          suiteDescription:
            '10 questions covering cell biology, reproduction, nutrition, matter (elements/compounds/mixtures), force and energy as set out in the WASSCE/GES General Science syllabus.',
          suiteKeywords: [
            'WASSCE',
            'Integrated Science',
            'General Science',
            'Biology',
            'Physics',
            'Chemistry',
          ],
          questions: [
            {
              question_number: 1,
              description:
                '## Cell Biology: Cell Structure\n\nThe cell is the basic unit of life. WASSCE tests the differences between plant and animal cells and the functions of cell organelles.\n\n**Question:** Which of the following structures is found in a plant cell but NOT in an animal cell?',
              hints: [
                'Think about what makes plant cells unique: they can photosynthesize and have a rigid outer boundary.',
              ],
              solution_steps: [
                'Plant cells have: cell wall, chloroplasts, large central vacuole.',
                'Animal cells do NOT have cell walls or chloroplasts.',
                'Both have: cell membrane, nucleus, mitochondria, ribosomes.',
              ],
              options: [
                'Cell membrane',
                'Nucleus',
                'Cell wall',
                'Mitochondria',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_CELL_BIOLOGY'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_1',
              exam_year: 2022,
              correct_answer: 'Cell wall',
            },
            {
              question_number: 2,
              description:
                '## Nutrition: Balanced Diet\n\nKnowledge of food nutrients, their sources, deficiency diseases, and dietary requirements is essential for WASSCE General Science.\n\n**Question:** Which nutrient is primarily responsible for growth and repair of body tissues?',
              hints: ['Think about which food class builds muscles.'],
              solution_steps: [
                'Proteins are the building blocks of the body — they are responsible for growth, repair, and maintenance of tissues.',
                'Carbohydrates = energy; fats = energy store + insulation; vitamins/minerals = regulatory functions.',
              ],
              options: ['Carbohydrates', 'Fats', 'Proteins', 'Vitamins'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_NUTRITION'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_1',
              exam_year: 2021,
              correct_answer: 'Proteins',
            },
            {
              question_number: 3,
              description:
                '## Matter: Elements, Compounds & Mixtures\n\nClassifying matter is a foundational topic tested in both Integrated Science and Chemistry at WASSCE.\n\n**Question:** Which of the following is a COMPOUND?',
              hints: [
                'A compound is made of two or more different elements chemically combined in a fixed ratio.',
              ],
              solution_steps: [
                'Salt water = mixture (water + dissolved salt, no fixed ratio, can be separated by evaporation).',
                'Air = mixture (N₂, O₂, CO₂, etc.).',
                'Oxygen (O₂) = element (one type of atom).',
                'Water (H₂O) = compound (H and O chemically bonded, fixed ratio 2:1).',
              ],
              options: ['Air', 'Salt water', 'Oxygen', 'Water'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_MATTER'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_1',
              exam_year: 2020,
              correct_answer: 'Water',
            },
            {
              question_number: 4,
              description:
                '## Reproduction: Human Reproduction\n\nHuman reproduction is tested in both Integrated Science (SHS 1–2) and Biology (elective).\n\n**Question:** Where does fertilisation of the egg normally occur in the female reproductive system?',
              hints: [
                'Fertilisation occurs where the egg meets sperm after ovulation.',
              ],
              solution_steps: [
                'After ovulation, the egg travels down the Fallopian tube (oviduct).',
                'Sperm travels up from the uterus into the Fallopian tube.',
                'Fertilisation (union of egg and sperm) normally occurs in the Fallopian tube.',
                'The fertilised egg then implants in the uterus (womb).',
              ],
              options: [
                'Ovary',
                'Uterus (womb)',
                'Fallopian tube (oviduct)',
                'Vagina',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_REPRODUCTION'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2022,
              correct_answer: 'Fallopian tube (oviduct)',
            },
            {
              question_number: 5,
              description:
                "## Forces: Newton's Laws\n\nNewton's Laws of Motion are tested in both Integrated Science and Elective Physics at WASSCE.\n\n**Question:** A force of 20 N acts on a mass of 4 kg. What is the acceleration? (F = ma)",
              hints: ['Rearrange F = ma to find a.', 'a = F/m'],
              solution_steps: ['a = F/m = 20/4 = 5 m/s²'],
              options: ['2 m/s²', '4 m/s²', '5 m/s²', '80 m/s²'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_FORCES', 'TAG_NEWTONS_LAWS'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2021,
              correct_answer: '5 m/s²',
            },
            {
              question_number: 6,
              description:
                '## Energy: Forms and Conversion\n\nEnergy conversion (kinetic ↔ potential ↔ thermal ↔ electrical) is a standard WASSCE topic in both Integrated and Elective Physics.\n\n**Question:** A ball thrown upward slows down and momentarily stops before falling. At the highest point, most of its energy is in what form?',
              hints: [
                'At the highest point, velocity = 0, so kinetic energy = 0.',
                'Energy is conserved — it must be in another form.',
              ],
              solution_steps: [
                'At highest point: velocity = 0 → KE = 0.',
                'Height is maximum → gravitational PE is maximum.',
                'All kinetic energy has converted to gravitational potential energy.',
              ],
              options: [
                'Kinetic energy',
                'Thermal energy',
                'Chemical energy',
                'Gravitational potential energy',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_ENERGY'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2023,
              correct_answer: 'Gravitational potential energy',
            },
            {
              question_number: 7,
              description:
                '## Chemistry (Integrated): Acids and Bases\n\nAcid-base chemistry is tested in both Integrated Science and Elective Chemistry.\n\n**Question:** What is the pH of a neutral solution?',
              hints: [
                'The pH scale runs from 0 (strongly acidic) to 14 (strongly alkaline).',
                'Neutral is exactly in the middle.',
              ],
              solution_steps: [
                'Neutral solution: pH = 7',
                'Acids: pH < 7; Bases: pH > 7',
              ],
              options: ['0', '7', '10', '14'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_ACIDS_BASES'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_1',
              exam_year: 2022,
              correct_answer: '7',
            },
            {
              question_number: 8,
              description:
                '## Ecology: Food Chains and Webs\n\nEcology questions (producers, consumers, decomposers, food chains, energy flow) appear annually in WASSCE Integrated Science.\n\n**Question:** In a food chain: Grass → Grasshopper → Frog → Snake\n\nWhat is the PRIMARY PRODUCER?',
              hints: [
                'Producers make their own food through photosynthesis.',
                'They are always plants (or algae) and form the base of any food chain.',
              ],
              solution_steps: [
                'Grass is the producer — it makes food using sunlight (photosynthesis).',
                'Grasshopper = primary consumer; Frog = secondary consumer; Snake = tertiary consumer.',
              ],
              options: ['Grasshopper', 'Grass', 'Frog', 'Snake'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_ECOLOGY'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_1',
              exam_year: 2021,
              correct_answer: 'Grass',
            },
            {
              question_number: 9,
              description:
                '## Diseases: Malaria\n\nKnowledge of communicable diseases (causes, vectors, prevention, treatment) is a key health-science topic in WASSCE Integrated Science.\n\n**Question:** Which of the following organisms is the VECTOR (carrier) of malaria?',
              hints: [
                'A vector transmits the disease from one host to another.',
                'Malaria is caused by Plasmodium parasites, but a different organism carries it.',
              ],
              solution_steps: [
                'Malaria is caused by Plasmodium (a protozoan parasite).',
                'The vector (carrier) is the female Anopheles mosquito.',
                'When the mosquito bites an infected person, it picks up Plasmodium, then transmits it to the next person it bites.',
              ],
              options: [
                'Housefly',
                'Female Anopheles mosquito',
                'Tsetse fly',
                'Male Culex mosquito',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_DISEASES', 'TAG_HEALTH'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_1',
              exam_year: 2022,
              correct_answer: 'Female Anopheles mosquito',
            },
            {
              question_number: 10,
              description:
                '## Physics (Integrated): Pressure\n\nPressure in liquids and gases is an Integrated Science topic tested in WASSCE with both conceptual and calculation questions.\n\n### Formula\nPressure = Force ÷ Area (P = F/A)\n\n**Question:** A force of 60 N acts on an area of 3 m². What is the pressure?',
              hints: ['P = F/A'],
              solution_steps: ['P = 60/3 = 20 N/m² (Pascals)'],
              options: ['10 N/m²', '15 N/m²', '20 N/m²', '180 N/m²'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_PRESSURE'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2023,
              correct_answer: '20 N/m²',
            },
          ],
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 4. SOCIAL STUDIES (mandatory)
    // ══════════════════════════════════════════════════════════════════════════
    {
      courseName: 'Social Studies',
      is_mandatory: true,
      imageFile: {
        filename: 'social_studies_1.jpeg',
        mime: 'image/jpeg',
        ext: 'jpeg',
      },
      suites: [
        {
          suiteName:
            'WASSCE Social Studies — Ghanaian Society, Government & Development',
          suiteDescription:
            '10 questions covering Ghanaian culture and identity, democratic governance, economic development, environmental management, and social issues as per the GES SHS Social Studies curriculum.',
          suiteKeywords: [
            'WASSCE',
            'Social Studies',
            'Ghana',
            'Governance',
            'Development',
            'Culture',
          ],
          questions: [
            {
              question_number: 1,
              description:
                "## Governance: Ghana's Democratic System\n\nGhana operates a multi-party democratic system. WASSCE Social Studies tests knowledge of Ghana's constitution, organs of government, and democratic processes.\n\n**Question:** According to Ghana's 1992 Constitution, the Executive power is vested in which body?",
              hints: [
                'Think about who heads the government and has executive power in Ghana.',
              ],
              solution_steps: [
                "Ghana's 1992 Constitution vests executive power in the President.",
                'The President is the Head of State, Head of Government, and Commander-in-Chief of the Armed Forces.',
                'Legislature = Parliament; Judiciary = Courts.',
              ],
              options: [
                'Parliament',
                'The Council of State',
                'The President',
                'The Supreme Court',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_GOVERNANCE', 'TAG_CONSTITUTION'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_2',
              exam_year: 2023,
              correct_answer: 'The President',
            },
            {
              question_number: 2,
              description:
                "## Culture: Chieftaincy in Ghana\n\nChieftaincy is a traditional institution recognised in Ghana's Constitution. WASSCE frequently tests its role in development and conflict resolution.\n\n**Question:** Which of the following is a PRIMARY function of traditional rulers (chiefs) in Ghanaian society?",
              hints: [
                'Think about what chiefs do in their communities beyond ceremonial roles.',
              ],
              solution_steps: [
                'Traditional rulers serve as custodians of culture and tradition.',
                'They adjudicate disputes and maintain peace.',
                'They mobilise communities for development projects.',
                'They liaise between the government and local communities.',
              ],
              options: [
                'Making national laws',
                'Serving as custodians of culture and settling disputes',
                'Collecting national taxes',
                'Commanding the national military',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_CULTURE', 'TAG_CHIEFTAINCY'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2022,
              correct_answer:
                'Serving as custodians of culture and settling disputes',
            },
            {
              question_number: 3,
              description:
                '## Environment: Deforestation in Ghana\n\nEnvironmental management is a major Social Studies topic. WASSCE questions test causes, effects, and solutions to deforestation.\n\n**Question:** Which of the following is the MOST significant cause of deforestation in Ghana?',
              hints: [
                'Consider the main human economic activity that destroys forests in Ghana.',
              ],
              solution_steps: [
                'Illegal chainsaw lumbering and commercial logging are major causes.',
                'However, farming (slash-and-burn/shifting cultivation) and expansion of agricultural land is recognised as the MOST widespread cause.',
                'Other causes: charcoal production, wildfire, mining.',
              ],
              options: [
                'Bushfires alone',
                'Farming (slash-and-burn cultivation and expansion of agricultural land)',
                'Building of roads',
                'Tourist activities',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_ENVIRONMENT', 'TAG_DEFORESTATION'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2021,
              correct_answer:
                'Farming (slash-and-burn cultivation and expansion of agricultural land)',
            },
            {
              question_number: 4,
              description:
                "## Economic Development: Ghana's Economy\n\nGhana's economic sectors and development challenges are tested annually in WASSCE Social Studies.\n\n**Question:** Ghana's economy is best described as:",
              hints: [
                "Consider the mix of government and private sector roles in Ghana's economy.",
              ],
              solution_steps: [
                'Ghana operates a MIXED ECONOMY — both private enterprises and government participate in economic activities.',
                'Not a command/socialist economy (fully government-controlled) nor purely capitalist.',
              ],
              options: [
                'Command economy',
                'Mixed economy',
                'Capitalist economy',
                'Subsistence economy',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_ECONOMY', 'TAG_DEVELOPMENT'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_1',
              exam_year: 2022,
              correct_answer: 'Mixed economy',
            },
            {
              question_number: 5,
              description:
                "## Population: Population Growth\n\nGhana's population dynamics and their developmental implications are a core Social Studies topic.\n\n**Question:** A high population growth rate in a developing country like Ghana is MOST likely to lead to:",
              hints: [
                'Think about the strain on resources, services, and infrastructure.',
              ],
              solution_steps: [
                'High population growth places strain on social amenities (schools, hospitals, housing, roads).',
                'Leads to unemployment, poverty, and urban congestion.',
                'Can slow economic development per capita.',
              ],
              options: [
                'Increase in standard of living',
                'Rapid industrialisation',
                'Pressure on social amenities and high unemployment',
                'Increase in national savings',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_POPULATION', 'TAG_DEVELOPMENT'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2023,
              correct_answer:
                'Pressure on social amenities and high unemployment',
            },
            {
              question_number: 6,
              description:
                '## Conflict Resolution: Peaceful Means\n\nConflict resolution methods are a standard Social Studies topic. WASSCE tests both traditional and modern approaches.\n\n**Question:** Which of the following is a TRADITIONAL method of conflict resolution in Ghana?',
              hints: [
                'Think about how communities in Ghana traditionally settled disputes before modern courts existed.',
              ],
              solution_steps: [
                'Mediation by chiefs and elders is a long-standing traditional conflict resolution mechanism in Ghana.',
                'Modern methods include litigation (courts), arbitration, and referral to national commissions.',
              ],
              options: [
                'Filing a lawsuit in the High Court',
                'Mediation by chiefs and elders',
                'Arbitration by a foreign body',
                'Referendum',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_CONFLICT_RESOLUTION'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_1',
              exam_year: 2021,
              correct_answer: 'Mediation by chiefs and elders',
            },
            {
              question_number: 7,
              description:
                '## Globalisation: Effects on Ghana\n\nGlobalisation and its socio-economic impacts are tested in WASSCE Social Studies Paper 2.\n\n**Question:** Which of the following is a NEGATIVE effect of globalisation on Ghana?',
              hints: [
                'Think about how global trade and culture can undermine local industries and traditions.',
              ],
              solution_steps: [
                'Globalisation can lead to the dumping of cheap foreign goods, which destroys local industries.',
                'It can also lead to cultural erosion (loss of local cultural values).',
                'Positive effects include access to foreign investment, technology, and markets.',
              ],
              options: [
                'Access to foreign investment',
                'Destruction of local industries due to cheap foreign goods',
                'Exposure to modern technology',
                'Improvement in communication',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_GLOBALISATION'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2022,
              correct_answer:
                'Destruction of local industries due to cheap foreign goods',
            },
            {
              question_number: 8,
              description:
                "## Rights and Responsibilities: Ghana's Constitution\n\nCitizens' rights and responsibilities under Ghana's 1992 Constitution are a major WASSCE Social Studies topic.\n\n**Question:** Article 33 of Ghana's 1992 Constitution guarantees which of the following?",
              hints: [
                'This article protects the fundamental rights of citizens from government abuse.',
              ],
              solution_steps: [
                'Article 33 of the 1992 Constitution provides the ENFORCEMENT of fundamental human rights — citizens can apply to the High Court to enforce their rights.',
                'Chapter 5 (Articles 12–33) deals broadly with fundamental human rights and freedoms.',
              ],
              options: [
                'The right to vote',
                'The enforcement of fundamental human rights',
                'The right to free secondary education',
                'The establishment of Parliament',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_CONSTITUTION', 'TAG_RIGHTS'],
              difficulty: 'HARD',
              estimated_time_in_ms: 90000,
              class_level: 'shs_3',
              exam_year: 2023,
              correct_answer: 'The enforcement of fundamental human rights',
            },
            {
              question_number: 9,
              description:
                '## HIV/AIDS: Prevention\n\nSocial issues including HIV/AIDS awareness are part of the GES Social Studies and Health curriculum.\n\n**Question:** Which of the following is the MOST effective way to prevent the sexual transmission of HIV?',
              hints: [
                'Think about behaviours that eliminate or significantly reduce exposure to the virus.',
              ],
              solution_steps: [
                'Abstinence from sexual activity is 100% effective.',
                'Consistent and correct use of condoms is highly effective.',
                'Being faithful to one tested, uninfected partner also reduces risk greatly.',
                'The ABC approach: Abstinence, Be faithful, use Condom.',
              ],
              options: [
                'Taking antibiotics',
                'Abstinence from sexual activity',
                'Sharing needles only with healthy people',
                'Avoiding shaking hands with infected persons',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_HEALTH', 'TAG_HIV_AIDS'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_1',
              exam_year: 2021,
              correct_answer: 'Abstinence from sexual activity',
            },
            {
              question_number: 10,
              description:
                "## Sustainable Development\n\nSustainable development concepts, including the SDGs and Ghana's development plans, are tested in WASSCE Social Studies.\n\n**Question:** Sustainable development can BEST be defined as:",
              hints: [
                'The key idea in sustainability is meeting current needs without harming future generations.',
              ],
              solution_steps: [
                'The Brundtland Commission (1987) defined sustainable development as: "Development that meets the needs of the present without compromising the ability of future generations to meet their own needs."',
              ],
              options: [
                'Development that maximises profits for the current generation',
                'Development focused only on industrial growth',
                "Development that meets present needs without compromising future generations' ability to meet theirs",
                'Development funded entirely by foreign aid',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_SUSTAINABLE_DEVELOPMENT'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2022,
              correct_answer:
                "Development that meets present needs without compromising future generations' ability to meet theirs",
            },
          ],
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 5. BIOLOGY (Elective — Science programme)
    // ══════════════════════════════════════════════════════════════════════════
    {
      courseName: 'Biology',
      is_mandatory: false,
      imageFile: {
        filename: 'biology_1.jpeg',
        mime: 'image/jpeg',
        ext: 'jpeg',
      },
      suites: [
        {
          suiteName: 'WASSCE Biology — Cell Biology, Genetics & Ecology',
          suiteDescription:
            '10 questions on cell biology (organelles, division), genetics (Mendelian inheritance, DNA), ecology (ecosystems, nutrient cycles), and human physiology as per the WAEC Elective Biology syllabus.',
          suiteKeywords: [
            'WASSCE',
            'Biology',
            'Genetics',
            'Ecology',
            'Cell Biology',
            'Physiology',
          ],
          questions: [
            {
              question_number: 1,
              description:
                '## Cell Biology: Mitosis vs. Meiosis\n\nDistinguishing mitosis from meiosis is tested in every WASSCE Biology paper.\n\n### Key Differences\n| Feature | Mitosis | Meiosis |\n|---------|---------|----------|\n| Purpose | Growth/repair | Sexual reproduction |\n| Divisions | 1 | 2 |\n| Daughter cells | 2 | 4 |\n| Chromosome number | Same as parent (diploid) | Half parent (haploid) |\n\n**Question:** Meiosis differs from mitosis in that it:',
              hints: [
                'Meiosis produces gametes (sex cells) and reduces chromosome number.',
              ],
              solution_steps: [
                'Meiosis produces 4 haploid daughter cells; mitosis produces 2 diploid cells.',
                'Meiosis involves TWO divisions; mitosis involves ONE.',
                'Meiosis produces genetic variation; mitosis produces genetically identical cells.',
              ],
              options: [
                'Produces cells with the same chromosome number as the parent',
                'Results in 4 haploid daughter cells',
                'Occurs only in somatic (body) cells',
                'Does not involve crossing over',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_CELL_BIOLOGY', 'TAG_MITOSIS_MEIOSIS'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 90000,
              class_level: 'shs_2',
              exam_year: 2023,
              correct_answer: 'Results in 4 haploid daughter cells',
            },
            {
              question_number: 2,
              description:
                "## Genetics: Mendel's Laws\n\nMendelian genetics (monohybrid crosses, Punnett squares, dominant/recessive alleles) is one of the most heavily tested topics in WASSCE Biology.\n\n**Question:** In a monohybrid cross between two heterozygous parents (Tt × Tt), what is the expected phenotypic ratio in the offspring?",
              hints: [
                'Draw a Punnett square: T×T, T×t, t×T, t×t.',
                'Dominant allele (T) masks recessive (t) in phenotype.',
              ],
              solution_steps: [
                'Cross: Tt × Tt',
                'Offspring genotypes: TT, Tt, Tt, tt = 1TT : 2Tt : 1tt',
                'Phenotypes: TT and Tt = Tall (dominant); tt = short (recessive)',
                'Phenotypic ratio = 3 Tall : 1 short',
              ],
              options: ['1:1', '1:2:1', '3:1', '2:1'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_GENETICS', 'TAG_MENDELIAN'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 90000,
              class_level: 'shs_2',
              exam_year: 2022,
              correct_answer: '3:1',
            },
            {
              question_number: 3,
              description:
                '## Physiology: Photosynthesis\n\nThe equation and conditions for photosynthesis are foundational in WASSCE Biology.\n\n**Question:** In the light-dependent reaction of photosynthesis, light energy is used to:',
              hints: [
                'The light-dependent stage occurs in the thylakoid membranes.',
              ],
              solution_steps: [
                'Light energy splits water molecules (photolysis) → releases O₂ and energises electrons.',
                'ATP and NADPH are produced from this energy.',
                'These products are then used in the light-independent (Calvin cycle) stage.',
              ],
              options: [
                'Fix CO₂ into glucose',
                'Split water molecules and produce ATP',
                'Produce starch from glucose',
                'Absorb minerals from the soil',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_PHOTOSYNTHESIS', 'TAG_PHYSIOLOGY'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 90000,
              class_level: 'shs_2',
              exam_year: 2021,
              correct_answer: 'Split water molecules and produce ATP',
            },
            {
              question_number: 4,
              description:
                '## Ecology: Nitrogen Cycle\n\nNutrient cycles (nitrogen, carbon, water) are a key WASSCE Biology essay and objective topic.\n\n**Question:** The process by which bacteria in root nodules of leguminous plants convert atmospheric nitrogen (N₂) into ammonia (NH₃) is called:',
              hints: [
                'This is the first step in making atmospheric nitrogen available to plants.',
              ],
              solution_steps: [
                'Nitrogen fixation: Rhizobium bacteria in legume root nodules convert N₂ → NH₃ (ammonia).',
                'Nitrification: NH₃ → nitrites → nitrates (by nitrifying bacteria).',
                'Denitrification: nitrates → N₂ (returns to atmosphere).',
              ],
              options: [
                'Nitrification',
                'Denitrification',
                'Nitrogen fixation',
                'Ammonification',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_ECOLOGY', 'TAG_NITROGEN_CYCLE'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2022,
              correct_answer: 'Nitrogen fixation',
            },
            {
              question_number: 5,
              description:
                '## Human Physiology: Blood Groups\n\nABO blood grouping is a standard WASSCE Biology genetics and physiology topic.\n\n**Question:** A person with blood group O can donate blood to ALL ABO blood groups because their red blood cells:',
              hints: [
                'Blood group O has neither A nor B antigens on red blood cells.',
              ],
              solution_steps: [
                'Blood group O RBCs carry no A or B antigens → no immune reaction in the recipient.',
                'That is why O is the "universal donor" (for packed red cells).',
                'However, O blood DOES have anti-A and anti-B antibodies in plasma.',
              ],
              options: [
                'Have both A and B antigens',
                'Have neither A nor B antigens',
                'Have anti-A and anti-B antibodies',
                'Have the Rhesus factor only',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_GENETICS', 'TAG_BLOOD_GROUPS'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2023,
              correct_answer: 'Have neither A nor B antigens',
            },
            {
              question_number: 6,
              description:
                '## Transport in Plants: Transpiration\n\nTranspiration and the factors that affect it are a core WASSCE Biology topic.\n\n**Question:** Which of the following conditions would INCREASE the rate of transpiration in a plant?',
              hints: [
                'Transpiration is the evaporation of water from leaves. Think about what makes evaporation faster.',
              ],
              solution_steps: [
                'High temperature → increases water vapour pressure, speeds evaporation.',
                'Low humidity → increases the gradient between leaf and air, speeds loss.',
                'High wind speed → removes water vapour from leaf surface, speeds loss.',
                'High light intensity → opens stomata wider, increases transpiration.',
              ],
              options: [
                'High humidity and low temperature',
                'Still air and darkness',
                'High temperature, low humidity, and wind',
                'Blocked stomata',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_TRANSPORT', 'TAG_TRANSPIRATION'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2021,
              correct_answer: 'High temperature, low humidity, and wind',
            },
            {
              question_number: 7,
              description:
                '## Classification of Organisms\n\nThe five-kingdom classification and identification features are tested in WASSCE Biology.\n\n**Question:** Which of the following features BEST distinguishes fungi from plants?',
              hints: ['Think about what plants have that fungi do not.'],
              solution_steps: [
                'Fungi are HETEROTROPHIC (cannot make their own food) — they absorb nutrients from organic matter.',
                'Plants are AUTOTROPHIC — they photosynthesise.',
                'Fungi also lack chlorophyll and have cell walls made of CHITIN (not cellulose).',
              ],
              options: [
                'Fungi have cell walls; plants do not',
                'Fungi are heterotrophic and lack chlorophyll',
                'Fungi reproduce sexually; plants do not',
                'Fungi have true roots; plants do not',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_CLASSIFICATION'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2020,
              correct_answer: 'Fungi are heterotrophic and lack chlorophyll',
            },
            {
              question_number: 8,
              description:
                "## Homeostasis: Osmoregulation\n\nThe kidney's role in osmoregulation and excretion is a classic WASSCE Biology exam topic.\n\n**Question:** Which part of the nephron is primarily responsible for the reabsorption of glucose?",
              hints: [
                "After filtration in the glomerulus/Bowman's capsule, useful substances are reclaimed.",
              ],
              solution_steps: [
                'The PROXIMAL CONVOLUTED TUBULE (PCT) is responsible for the reabsorption of glucose, amino acids, and most salts.',
                'Loop of Henle: water and salt reabsorption (concentration gradient).',
                'Distal convoluted tubule: fine-tuning of salt and water balance (ADH-regulated).',
              ],
              options: [
                'Loop of Henle',
                'Proximal convoluted tubule',
                'Collecting duct',
                "Bowman's capsule",
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_HOMEOSTASIS', 'TAG_EXCRETION'],
              difficulty: 'HARD',
              estimated_time_in_ms: 90000,
              class_level: 'shs_3',
              exam_year: 2022,
              correct_answer: 'Proximal convoluted tubule',
            },
            {
              question_number: 9,
              description:
                "## Evolution: Natural Selection\n\nDarwin's theory of evolution by natural selection is tested in WASSCE Biology Paper 1 and Paper 2.\n\n**Question:** According to Darwin's theory of natural selection, organisms that are BEST ADAPTED to their environment:",
              hints: [
                'Think about what advantage well-adapted organisms have in terms of survival and reproduction.',
              ],
              solution_steps: [
                'Best-adapted organisms → survive longer → reproduce more → pass on their advantageous traits to offspring.',
                '"Survival of the fittest" does not mean strongest physically, but best suited to the environment.',
              ],
              options: [
                'Always produce the largest number of offspring',
                'Survive longer and produce more offspring, passing on their traits',
                'Never experience mutations',
                'Can adapt any trait they choose in one generation',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_EVOLUTION'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_3',
              exam_year: 2023,
              correct_answer:
                'Survive longer and produce more offspring, passing on their traits',
            },
            {
              question_number: 10,
              description:
                '## Ecology: Biotic and Abiotic Factors\n\nDistinguishing biotic (living) from abiotic (non-living) environmental factors is a fundamental ecology topic.\n\n**Question:** Which of the following is an ABIOTIC factor in an ecosystem?',
              hints: [
                'Abiotic factors are non-living physical and chemical components of the environment.',
              ],
              solution_steps: [
                'Abiotic: temperature, light intensity, humidity, rainfall, soil pH, salinity.',
                'Biotic: other organisms — predators, prey, competitors, parasites, decomposers.',
              ],
              options: ['Decomposers', 'Predators', 'Temperature', 'Parasites'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_ECOLOGY'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_1',
              exam_year: 2021,
              correct_answer: 'Temperature',
            },
          ],
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 6. CHEMISTRY (Elective)
    // ══════════════════════════════════════════════════════════════════════════
    {
      courseName: 'Chemistry',
      is_mandatory: false,
      imageFile: {
        filename: 'chemistry_1.jpeg',
        mime: 'image/jpeg',
        ext: 'jpeg',
      },
      suites: [
        {
          suiteName: 'WASSCE Chemistry — Atomic Structure, Bonding & Reactions',
          suiteDescription:
            '10 questions covering atomic structure, the periodic table, chemical bonding, stoichiometry, organic chemistry (hydrocarbons, functional groups), and electrochemistry as per the WAEC Elective Chemistry syllabus.',
          suiteKeywords: [
            'WASSCE',
            'Chemistry',
            'Atomic Structure',
            'Bonding',
            'Stoichiometry',
            'Organic',
          ],
          questions: [
            {
              question_number: 1,
              description:
                '## Atomic Structure: Electron Configuration\n\nElectron configuration underpins the periodic table, bonding, and reactivity.\n\n**Question:** How many electrons are in the outermost shell of a sodium atom (Na, atomic number = 11)?',
              hints: [
                'Fill electron shells in order: 2, 8, 8 ... (for Z ≤ 20)',
                'Na = 11 electrons',
              ],
              solution_steps: [
                'Na: 2 + 8 + 1 = 11 electrons',
                'Shell 1 = 2; Shell 2 = 8; Shell 3 = 1',
                'Outermost shell has 1 electron.',
              ],
              options: ['1', '2', '8', '3'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_ATOMIC_STRUCTURE'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2022,
              correct_answer: '1',
            },
            {
              question_number: 2,
              description:
                '## Periodic Table: Group Properties\n\nGroup trends and properties of elements are heavily tested in WASSCE Chemistry Paper 1.\n\n**Question:** Elements in Group VII (Halogens) of the periodic table are characterised by:',
              hints: [
                'Group VII elements have 7 electrons in their outer shell.',
              ],
              solution_steps: [
                'Halogens have 7 valence electrons → highly reactive non-metals.',
                'They form −1 ions (gain 1 electron to complete the outer shell).',
                'They exist as diatomic molecules (F₂, Cl₂, Br₂, I₂).',
                'Reactivity DECREASES down the group.',
              ],
              options: [
                'Being highly reactive metals',
                'Having 7 valence electrons and forming −1 ions',
                'Having complete outer electron shells',
                'Being noble gases',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_PERIODIC_TABLE', 'TAG_HALOGENS'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2021,
              correct_answer: 'Having 7 valence electrons and forming −1 ions',
            },
            {
              question_number: 3,
              description:
                '## Chemical Bonding: Ionic vs Covalent\n\nDistinguishing ionic and covalent bonding and their properties is a core WASSCE Chemistry topic.\n\n**Question:** Sodium chloride (NaCl) has a high melting point because:',
              hints: [
                'Think about the type of bonding in NaCl and what must be overcome to melt it.',
              ],
              solution_steps: [
                'NaCl has an IONIC BOND — strong electrostatic attraction between Na⁺ and Cl⁻ ions.',
                'The giant ionic lattice requires large amounts of energy to break apart.',
                'Hence NaCl has a HIGH melting point (801°C).',
              ],
              options: [
                'It has weak van der Waals forces',
                'It has strong ionic bonds in a giant lattice structure',
                'It is a molecular compound',
                'It contains covalent bonds between Na and Cl',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_BONDING', 'TAG_IONIC'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2022,
              correct_answer:
                'It has strong ionic bonds in a giant lattice structure',
            },
            {
              question_number: 4,
              description:
                '## Stoichiometry: Mole Calculations\n\nMole calculations (using the Avogadro number and molar mass) appear in almost every WASSCE Chemistry paper.\n\n**Question:** How many moles are in 44 g of CO₂? (C = 12, O = 16)',
              hints: [
                'Molar mass of CO₂ = 12 + (16 × 2) = 44 g/mol',
                'Moles = mass / molar mass',
              ],
              solution_steps: [
                'Molar mass CO₂ = 12 + 32 = 44 g/mol',
                'Moles = 44/44 = 1 mol',
              ],
              options: ['0.5 mol', '1 mol', '2 mol', '44 mol'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_STOICHIOMETRY', 'TAG_MOLES'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2023,
              correct_answer: '1 mol',
            },
            {
              question_number: 5,
              description:
                '## Organic Chemistry: Alkanes vs. Alkenes\n\nFunctional group identification and simple hydrocarbon chemistry are standard WASSCE Elective Chemistry topics.\n\n**Question:** Which of the following is the general formula for alkenes?',
              hints: [
                'Alkenes have one double bond (C=C).',
                'Compare: alkanes CₙH₂ₙ₊₂; alkenes CₙH₂ₙ; alkynes CₙH₂ₙ₋₂',
              ],
              solution_steps: [
                'Alkanes (single bonds only): CₙH₂ₙ₊₂',
                'Alkenes (one double bond): CₙH₂ₙ',
                'Alkynes (one triple bond): CₙH₂ₙ₋₂',
              ],
              options: ['CₙH₂ₙ₊₂', 'CₙH₂ₙ', 'CₙH₂ₙ₋₂', 'CₙHₙ'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_ORGANIC_CHEMISTRY', 'TAG_ALKENES'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2021,
              correct_answer: 'CₙH₂ₙ',
            },
            {
              question_number: 6,
              description:
                '## Electrochemistry: Electrolysis\n\nElectrolysis (preferential discharge of ions, products at electrodes) is tested in WASSCE every year.\n\n**Question:** During the electrolysis of dilute sulphuric acid (H₂SO₄), what is produced at the CATHODE?',
              hints: [
                'At the cathode (negative electrode), positive ions (cations) are discharged.',
                'Dilute H₂SO₄ contains H⁺ and SO₄²⁻ ions.',
              ],
              solution_steps: [
                'Cathode = negative electrode → attracts cations (positive ions).',
                'H⁺ ions are discharged at the cathode → H₂ gas is produced.',
                'At the anode: OH⁻ and SO₄²⁻ compete; OH⁻ is discharged → O₂ gas.',
              ],
              options: [
                'Oxygen gas',
                'Sulphur dioxide',
                'Hydrogen gas',
                'Sulphate ions',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_ELECTROCHEMISTRY', 'TAG_ELECTROLYSIS'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 90000,
              class_level: 'shs_3',
              exam_year: 2022,
              correct_answer: 'Hydrogen gas',
            },
            {
              question_number: 7,
              description:
                '## Acids, Bases & Salts: Neutralisation\n\nNeutralisation reactions and salt preparation are standard WASSCE Elective Chemistry topics.\n\n**Question:** What salt is formed when hydrochloric acid (HCl) reacts with sodium hydroxide (NaOH)?',
              hints: [
                'Acid + Base → Salt + Water',
                'HCl is hydrochloric acid; NaOH is sodium hydroxide.',
              ],
              solution_steps: [
                'HCl + NaOH → NaCl + H₂O',
                'Salt formed = Sodium chloride (NaCl)',
              ],
              options: [
                'Sodium sulphate',
                'Sodium chloride',
                'Sodium carbonate',
                'Sodium nitrate',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_ACIDS_BASES', 'TAG_SALTS'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2022,
              correct_answer: 'Sodium chloride',
            },
            {
              question_number: 8,
              description:
                '## Rates of Reaction: Catalysts\n\nFactors affecting reaction rates (temperature, concentration, surface area, catalysts) are a core WASSCE Chemistry topic.\n\n**Question:** A catalyst increases the rate of a chemical reaction by:',
              hints: ['A catalyst is not consumed in the reaction.'],
              solution_steps: [
                'A catalyst provides an ALTERNATIVE REACTION PATHWAY with a LOWER ACTIVATION ENERGY.',
                'Lower activation energy → more molecules have enough energy to react → faster rate.',
                'The catalyst is not consumed and does not change the products or energy change of the reaction.',
              ],
              options: [
                'Increasing the temperature of the reactants',
                'Providing an alternative pathway with lower activation energy',
                'Increasing the concentration of reactants',
                'Decreasing the activation energy by increasing pressure',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_REACTION_RATES', 'TAG_CATALYSIS'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2023,
              correct_answer:
                'Providing an alternative pathway with lower activation energy',
            },
            {
              question_number: 9,
              description:
                "## Chemical Equilibrium: Le Chatelier's Principle\n\nLe Chatelier's principle is tested in WASSCE Chemistry Paper 2 and Paper 1 application questions.\n\n**Question:** In the Haber process: N₂(g) + 3H₂(g) ⇌ 2NH₃(g) ΔH = −92 kJ/mol\n\nIncreasing temperature shifts the equilibrium to the:",
              hints: [
                'Le Chatelier: a system at equilibrium adjusts to oppose a change.',
                'The reaction is exothermic (ΔH is negative) — it releases heat.',
              ],
              solution_steps: [
                'Increasing temperature adds heat → system opposes by absorbing heat.',
                'Endothermic direction (reverse reaction) is favoured.',
                'Equilibrium shifts LEFT → less NH₃ produced.',
                'In industry, a compromise temperature (~450°C) is used to balance yield and rate.',
              ],
              options: [
                'Right, producing more NH₃',
                'Left, producing more N₂ and H₂',
                'Neither direction; temperature has no effect',
                'Right, because the reaction is exothermic',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_EQUILIBRIUM', 'TAG_LE_CHATELIER'],
              difficulty: 'HARD',
              estimated_time_in_ms: 90000,
              class_level: 'shs_3',
              exam_year: 2022,
              correct_answer: 'Left, producing more N₂ and H₂',
            },
            {
              question_number: 10,
              description:
                '## Metals & Reactivity Series\n\nThe reactivity series and displacement reactions are standard WASSCE Chemistry topics.\n\n**Question:** Iron is added to a solution of copper sulphate (CuSO₄). What will be observed?',
              hints: [
                'Check the reactivity series: Iron is MORE reactive than copper.',
                'A more reactive metal displaces a less reactive metal from its salt solution.',
              ],
              solution_steps: [
                'Iron (Fe) is more reactive than copper (Cu).',
                'Fe displaces Cu from CuSO₄: Fe + CuSO₄ → FeSO₄ + Cu',
                'Observation: blue CuSO₄ solution fades; reddish-brown copper metal is deposited on the iron.',
              ],
              options: [
                'No reaction occurs',
                'Iron dissolves and the solution remains blue',
                'Reddish-brown copper is deposited and the blue colour fades',
                'Blue crystals form in the solution',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_METALS', 'TAG_REACTIVITY_SERIES'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2021,
              correct_answer:
                'Reddish-brown copper is deposited and the blue colour fades',
            },
          ],
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 7. PHYSICS (Elective)
    // ══════════════════════════════════════════════════════════════════════════
    {
      courseName: 'Physics',
      is_mandatory: false,
      imageFile: {
        filename: 'physics_1.jpeg',
        mime: 'image/jpeg',
        ext: 'jpeg',
      },
      suites: [
        {
          suiteName:
            'WASSCE Physics — Mechanics, Waves, Electricity & Modern Physics',
          suiteDescription:
            "10 questions on kinematics, Newton's laws, waves (sound/light), electricity (circuits, Ohm's law), magnetism, and atomic/nuclear physics as per the WAEC Elective Physics syllabus.",
          suiteKeywords: [
            'WASSCE',
            'Physics',
            'Mechanics',
            'Electricity',
            'Waves',
            'Nuclear',
          ],
          questions: [
            {
              question_number: 1,
              description:
                '## Kinematics: Equations of Motion\n\nThe four equations of uniformly accelerated motion (SUVAT) are tested in virtually every WASSCE Physics paper.\n\n### Equations\n- v = u + at\n- s = ut + ½at²\n- v² = u² + 2as\n- s = ½(u + v)t\n\n**Question:** A car starts from rest and accelerates uniformly at 4 m/s² for 5 seconds. What is its final velocity?',
              hints: ['Use v = u + at', 'u = 0 (starts from rest)'],
              solution_steps: ['v = u + at = 0 + (4)(5) = 20 m/s'],
              options: ['4 m/s', '10 m/s', '20 m/s', '40 m/s'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_KINEMATICS'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2023,
              correct_answer: '20 m/s',
            },
            {
              question_number: 2,
              description:
                '## Work, Energy & Power\n\nWork, energy and power calculations are standard in every WASSCE Physics paper.\n\n### Formula\nWork = Force × distance × cos θ\n\n**Question:** A force of 50 N moves an object 6 m in the direction of the force. Calculate the work done.',
              hints: [
                'W = Fs cos θ; θ = 0° when force and motion are in the same direction.',
                'cos 0° = 1',
              ],
              solution_steps: ['W = 50 × 6 × cos 0° = 300 J'],
              options: ['56 J', '8.33 J', '300 J', '1800 J'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_ENERGY', 'TAG_WORK'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2022,
              correct_answer: '300 J',
            },
            {
              question_number: 3,
              description:
                "## Electricity: Ohm's Law\n\nOhm's Law and circuit calculations are among the most commonly tested WASSCE Physics topics.\n\n### Formula: V = IR\n\n**Question:** A resistor has a resistance of 10 Ω and a current of 2 A flows through it. What is the voltage across the resistor?",
              hints: ['V = IR'],
              solution_steps: ['V = 2 × 10 = 20 V'],
              options: ['5 V', '12 V', '20 V', '200 V'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_ELECTRICITY', 'TAG_OHMS_LAW'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2021,
              correct_answer: '20 V',
            },
            {
              question_number: 4,
              description:
                '## Waves: Frequency, Wavelength & Speed\n\nWave equation (v = fλ) is core WASSCE Physics.\n\n**Question:** A wave has a frequency of 500 Hz and a wavelength of 0.6 m. What is its speed?',
              hints: ['v = fλ'],
              solution_steps: ['v = 500 × 0.6 = 300 m/s'],
              options: ['0.0012 m/s', '833 m/s', '300 m/s', '500.6 m/s'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_WAVES'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2022,
              correct_answer: '300 m/s',
            },
            {
              question_number: 5,
              description:
                '## Light: Total Internal Reflection\n\nTotal internal reflection and critical angle are key optics topics at WASSCE.\n\n**Question:** Total internal reflection occurs when light travels from:',
              hints: [
                'Think about which direction light must travel and what angle it must hit the boundary.',
              ],
              solution_steps: [
                'Total internal reflection occurs when:',
                '1. Light travels from a DENSER medium to a LESS DENSE medium (e.g. glass to air)',
                '2. The angle of incidence EXCEEDS the critical angle.',
              ],
              options: [
                'Air to glass at any angle',
                'A dense medium to a less dense medium at an angle greater than the critical angle',
                'A less dense medium to a denser medium',
                'Glass to water at any angle',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_OPTICS', 'TAG_TOTAL_INTERNAL_REFLECTION'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 90000,
              class_level: 'shs_2',
              exam_year: 2023,
              correct_answer:
                'A dense medium to a less dense medium at an angle greater than the critical angle',
            },
            {
              question_number: 6,
              description:
                '## Electricity: Series vs Parallel Circuits\n\nCircuit analysis is one of the most tested WASSCE Physics topics.\n\n**Question:** Two resistors of 4 Ω and 6 Ω are connected in PARALLEL. What is their combined resistance?',
              hints: ['For parallel: 1/R = 1/R₁ + 1/R₂'],
              solution_steps: [
                '1/R = 1/4 + 1/6 = 3/12 + 2/12 = 5/12',
                'R = 12/5 = 2.4 Ω',
              ],
              options: ['10 Ω', '2.4 Ω', '5 Ω', '24 Ω'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_ELECTRICITY', 'TAG_CIRCUITS'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 90000,
              class_level: 'shs_2',
              exam_year: 2021,
              correct_answer: '2.4 Ω',
            },
            {
              question_number: 7,
              description:
                "## Pressure: Archimedes' Principle\n\nArchimedes' principle and upthrust are tested in WASSCE Physics Paper 1 and 2.\n\n**Question:** Archimedes' principle states that when an object is immersed in a fluid, the upthrust (buoyant force) on the object equals:",
              hints: [
                'Think about what causes an object to feel lighter in water.',
              ],
              solution_steps: [
                'Upthrust = Weight of fluid displaced by the object.',
                "This is Archimedes' Principle.",
                'If upthrust ≥ weight of object → object floats.',
              ],
              options: [
                'The weight of the object',
                'The weight of fluid displaced by the object',
                'The mass of fluid displaced',
                'The volume of the object',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_PRESSURE', 'TAG_ARCHIMEDES'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2022,
              correct_answer: 'The weight of fluid displaced by the object',
            },
            {
              question_number: 8,
              description:
                '## Nuclear Physics: Radioactive Decay\n\nAlpha, beta, and gamma radiation properties are a core WASSCE Physics topic (also appears in Chemistry).\n\n**Question:** Which type of radiation is MOST penetrating?',
              hints: [
                'Think about which radiation can pass through lead shielding.',
              ],
              solution_steps: [
                'Alpha (α): least penetrating — stopped by a sheet of paper.',
                'Beta (β): stopped by a few mm of aluminium.',
                'Gamma (γ): most penetrating — requires several cm of lead or metres of concrete.',
              ],
              options: [
                'Alpha radiation',
                'Beta radiation',
                'Gamma radiation',
                'Neutron radiation',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_NUCLEAR', 'TAG_RADIOACTIVITY'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_3',
              exam_year: 'general' as unknown as number,
              correct_answer: 'Gamma radiation',
            },
            {
              question_number: 9,
              description:
                "## Magnetism: Electromagnetic Induction\n\nFaraday's law and Lenz's law are regularly tested in WASSCE Physics Paper 2.\n\n**Question:** According to Faraday's law, an EMF is induced in a conductor when:",
              hints: ['The key word in electromagnetic induction is "change".'],
              solution_steps: [
                'EMF is induced when there is a CHANGE IN MAGNETIC FLUX LINKAGE through the conductor.',
                'This can happen by: moving the conductor, changing the magnetic field, or changing the area of the coil.',
                'Greater rate of change → greater induced EMF.',
              ],
              options: [
                'It is placed in a constant magnetic field',
                'There is a change in the magnetic flux linking the conductor',
                'Current flows through it',
                'It is connected to a battery',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_MAGNETISM', 'TAG_ELECTROMAGNETIC_INDUCTION'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 90000,
              class_level: 'shs_3',
              exam_year: 2023,
              correct_answer:
                'There is a change in the magnetic flux linking the conductor',
            },
            {
              question_number: 10,
              description:
                '## Heat: Specific Heat Capacity\n\nHeat capacity calculations are tested in WASSCE Physics Paper 1 and 2.\n\n### Formula: Q = mcΔT\n\n**Question:** How much heat energy is required to raise the temperature of 2 kg of water by 10°C?\n(Specific heat capacity of water = 4200 J kg⁻¹ °C⁻¹)',
              hints: ['Q = mcΔT', 'm = 2 kg, c = 4200 J/(kg·°C), ΔT = 10°C'],
              solution_steps: ['Q = 2 × 4200 × 10 = 84 000 J = 84 kJ'],
              options: ['420 J', '8 400 J', '42 000 J', '84 000 J'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_HEAT', 'TAG_SPECIFIC_HEAT_CAPACITY'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2022,
              correct_answer: '84 000 J',
            },
          ],
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 8. ECONOMICS (Elective — Business / Humanities)
    // ══════════════════════════════════════════════════════════════════════════
    {
      courseName: 'Economics',
      is_mandatory: false,
      imageFile: {
        filename: 'economics_1.jpeg',
        mime: 'image/jpeg',
        ext: 'jpeg',
      },
      suites: [
        {
          suiteName:
            'WASSCE Economics — Demand & Supply, National Income & Development',
          suiteDescription:
            "10 questions covering microeconomics (demand/supply/price elasticity), macroeconomics (GDP, inflation, unemployment), international trade, and Ghana's economic development as per the WAEC Economics syllabus.",
          suiteKeywords: [
            'WASSCE',
            'Economics',
            'Demand',
            'Supply',
            'GDP',
            'Trade',
            'Ghana',
          ],
          questions: [
            {
              question_number: 1,
              description:
                '## Demand: Law of Demand\n\nThe law of demand is the most fundamental concept in microeconomics and is tested in every WASSCE Economics paper.\n\n**Question:** According to the Law of Demand, when the price of a good RISES (all other things being equal), the quantity demanded:',
              hints: [
                'Think about the relationship between price and quantity demanded.',
              ],
              solution_steps: [
                'Law of Demand: inverse relationship between price and quantity demanded.',
                'When price rises → quantity demanded falls (and vice versa).',
                '"Ceteris paribus" = all other factors held constant.',
              ],
              options: ['Rises', 'Falls', 'Remains unchanged', 'Doubles'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_DEMAND', 'TAG_MICROECONOMICS'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_1',
              exam_year: 2022,
              correct_answer: 'Falls',
            },
            {
              question_number: 2,
              description:
                '## Supply: Determinants of Supply\n\nThe factors that shift the supply curve (versus a movement along it) are frequently tested in WASSCE Paper 1.\n\n**Question:** Which of the following will cause the supply curve for cocoa to SHIFT TO THE RIGHT (increase in supply)?',
              hints: [
                'A shift in supply means more is supplied at EVERY price level.',
              ],
              solution_steps: [
                'An improvement in technology reduces cost of production → suppliers can supply more at every price → supply curve shifts RIGHT.',
                'A rise in price causes a MOVEMENT ALONG the supply curve (not a shift).',
                'A rise in input costs DECREASES supply (shifts left).',
                'A fall in the number of producers decreases supply.',
              ],
              options: [
                'A rise in the price of cocoa',
                'A rise in the cost of fertilisers used in cocoa farming',
                'Improvement in farming technology',
                'A fall in the number of cocoa farmers',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_SUPPLY', 'TAG_MICROECONOMICS'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2023,
              correct_answer: 'Improvement in farming technology',
            },
            {
              question_number: 3,
              description:
                '## Elasticity: Price Elasticity of Demand (PED)\n\nPED is one of the most-tested economics topics in WASSCE, appearing as calculation, classification, and application questions.\n\n**Question:** If a 10% rise in the price of a good leads to a 20% fall in quantity demanded, the PED is:',
              hints: [
                'PED = % change in quantity demanded / % change in price',
                'Take the absolute value for classification.',
              ],
              solution_steps: [
                'PED = (−20%) / (+10%) = −2',
                '|PED| = 2 > 1 → Demand is ELASTIC.',
              ],
              options: [
                '0.5 (inelastic)',
                '1.0 (unit elastic)',
                '2.0 (elastic)',
                '−0.5 (inelastic)',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_ELASTICITY', 'TAG_PED'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 90000,
              class_level: 'shs_2',
              exam_year: 2022,
              correct_answer: '2.0 (elastic)',
            },
            {
              question_number: 4,
              description:
                '## Macroeconomics: GDP\n\nGross Domestic Product (GDP) measurement methods and interpretation are core WASSCE Economics topics.\n\n**Question:** GDP is BEST defined as:',
              hints: [
                "Think about what GDP measures: economic output within a country's borders.",
              ],
              solution_steps: [
                "GDP = total monetary value of all final goods and services produced within a country's borders in a given period (usually a year).",
                'It excludes intermediate goods (to avoid double counting).',
                '"Within borders" distinguishes GDP from GNP (which is based on nationality).',
              ],
              options: [
                'The total value of goods exported by a country',
                'The total monetary value of all final goods and services produced within a country in a given period',
                'The total government expenditure in a given year',
                'The total income earned by citizens abroad',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_MACROECONOMICS', 'TAG_GDP'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2021,
              correct_answer:
                'The total monetary value of all final goods and services produced within a country in a given period',
            },
            {
              question_number: 5,
              description:
                '## Inflation: Types and Causes\n\nInflation (especially demand-pull and cost-push) is a regularly tested WASSCE Economics topic.\n\n**Question:** When inflation is caused by an increase in the costs of production (e.g. rising wages and raw material prices), it is called:',
              hints: [
                'Think about which "side" of the economy is pushing prices up.',
              ],
              solution_steps: [
                'Cost-push inflation: caused by rising production costs (wages, oil, raw materials) → firms pass costs to consumers as higher prices.',
                'Demand-pull inflation: caused by excess aggregate demand exceeding supply.',
              ],
              options: [
                'Demand-pull inflation',
                'Cost-push inflation',
                'Structural inflation',
                'Hyperinflation',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_INFLATION', 'TAG_MACROECONOMICS'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2023,
              correct_answer: 'Cost-push inflation',
            },
            {
              question_number: 6,
              description:
                '## International Trade: Comparative Advantage\n\nComparative advantage and the benefits of international trade are core WASSCE Economics topics.\n\n**Question:** The theory of comparative advantage suggests that a country should specialise in producing goods for which it has:',
              hints: [
                'Comparative advantage is about RELATIVE efficiency, not absolute efficiency.',
              ],
              solution_steps: [
                'A country has a comparative advantage in a good when it can produce it at a LOWER OPPORTUNITY COST than other countries.',
                'Specialisation based on comparative advantage leads to greater total output and mutual gain from trade.',
              ],
              options: [
                'The lowest absolute cost of production',
                'The largest quantity of natural resources',
                'The lowest opportunity cost of production',
                'The highest technology',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_INTERNATIONAL_TRADE', 'TAG_COMPARATIVE_ADVANTAGE'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 90000,
              class_level: 'shs_2',
              exam_year: 2022,
              correct_answer: 'The lowest opportunity cost of production',
            },
            {
              question_number: 7,
              description:
                '## Money and Banking: Functions of Money\n\nFunctions and characteristics of money are tested in WASSCE Economics every year.\n\n**Question:** Which of the following is the PRIMARY function of money?',
              hints: [
                'The most basic reason money was created was to replace barter.',
              ],
              solution_steps: [
                'Primary (original) function of money = MEDIUM OF EXCHANGE.',
                'Secondary functions: store of value, unit of account, standard of deferred payment.',
              ],
              options: [
                'Store of value',
                'Standard of deferred payment',
                'Medium of exchange',
                'Unit of account',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_MONEY', 'TAG_BANKING'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_1',
              exam_year: 2021,
              correct_answer: 'Medium of exchange',
            },
            {
              question_number: 8,
              description:
                '## Market Structures: Perfect Competition\n\nMarket structures (perfect competition, monopoly, oligopoly) are major WASSCE Economics topics.\n\n**Question:** Which feature is characteristic of a PERFECTLY COMPETITIVE market?',
              hints: [
                'In perfect competition, no single buyer or seller can influence the price.',
              ],
              solution_steps: [
                'Perfect competition features: many buyers and sellers, homogeneous products, free entry and exit, perfect information.',
                'Firms are price TAKERS (not makers) — the market sets the price.',
              ],
              options: [
                'One dominant seller who sets prices',
                'Products are highly differentiated',
                'Many buyers and sellers, each too small to influence price',
                'Barriers to entry protect existing firms',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_MARKET_STRUCTURES'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2022,
              correct_answer:
                'Many buyers and sellers, each too small to influence price',
            },
            {
              question_number: 9,
              description:
                '## National Income: Standard of Living\n\nRelating national income to development and living standards is a key WASSCE Economics essay and multiple-choice topic.\n\n**Question:** Which of the following is the BEST indicator of the STANDARD OF LIVING of citizens in a country?',
              hints: [
                'Think about which measure accounts for population size and purchasing power.',
              ],
              solution_steps: [
                'GDP per capita (per head) is a better indicator than total GDP alone, as it accounts for population.',
                'Real GDP per capita (adjusted for inflation and PPP) is even more informative.',
                'HDI also includes education and health outcomes.',
              ],
              options: [
                'Total GDP',
                'Total government revenue',
                'GDP per capita',
                'Volume of exports',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_NATIONAL_INCOME', 'TAG_LIVING_STANDARDS'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2023,
              correct_answer: 'GDP per capita',
            },
            {
              question_number: 10,
              description:
                '## Fiscal Policy: Government Budget\n\nFiscal policy (government spending and taxation) is a core WASSCE macroeconomics topic.\n\n**Question:** A situation where government expenditure EXCEEDS government revenue is known as:',
              hints: [
                'Think about the terms for government financial position.',
              ],
              solution_steps: [
                'Budget deficit: government spends MORE than it earns in revenue.',
                'Budget surplus: government earns MORE than it spends.',
                'Balanced budget: expenditure = revenue.',
              ],
              options: [
                'Budget surplus',
                'Budget deficit',
                'Balanced budget',
                'National debt',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_FISCAL_POLICY', 'TAG_GOVERNMENT_BUDGET'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_2',
              exam_year: 2021,
              correct_answer: 'Budget deficit',
            },
          ],
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 9. GOVERNMENT (Elective — Humanities)
    // ══════════════════════════════════════════════════════════════════════════
    {
      courseName: 'Government',
      is_mandatory: false,
      imageFile: {
        filename: 'government_1.jpeg',
        mime: 'image/jpeg',
        ext: 'jpeg',
      },
      suites: [
        {
          suiteName:
            "WASSCE Government — Constitutions, Democracy & Ghana's Political System",
          suiteDescription:
            "10 questions covering constitutions, government systems, Ghana's political history (colonial to Fourth Republic), legislature/executive/judiciary, and international organisations as per the WAEC Elective Government syllabus.",
          suiteKeywords: [
            'WASSCE',
            'Government',
            'Constitution',
            'Ghana',
            'Democracy',
            'Legislature',
          ],
          questions: [
            {
              question_number: 1,
              description:
                '## Constitutions: Types\n\nWAECC Government tests the difference between written and unwritten, rigid and flexible, federal and unitary constitutions.\n\n**Question:** Which of the following countries does NOT have a written constitution?',
              hints: [
                'Think about countries that rely on parliamentary conventions and common law rather than a single codified document.',
              ],
              solution_steps: [
                'The United Kingdom operates on an UNWRITTEN constitution — conventions, statutes (Acts of Parliament), and common law.',
                'Ghana, USA, and Nigeria all have written, codified constitutions.',
              ],
              options: [
                'Ghana',
                'United States of America',
                'Nigeria',
                'United Kingdom',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_CONSTITUTIONS'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_1',
              exam_year: 2022,
              correct_answer: 'United Kingdom',
            },
            {
              question_number: 2,
              description:
                '## Government Systems: Separation of Powers\n\nThe doctrine of Separation of Powers (Montesquieu) is tested in both conceptual and application questions.\n\n**Question:** The doctrine of Separation of Powers aims to:',
              hints: [
                'Think about why dividing power between three branches is beneficial.',
              ],
              solution_steps: [
                'Separation of Powers divides government into Legislature, Executive, and Judiciary.',
                'Purpose: prevent any one branch from becoming too powerful (tyranny).',
                'Checks and balances: each branch can limit the others.',
              ],
              options: [
                'Give the executive unlimited power to govern',
                'Prevent concentration of power and protect individual liberties',
                'Ensure the legislature controls the judiciary',
                'Allow the army to check the parliament',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_SEPARATION_OF_POWERS', 'TAG_DEMOCRACY'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2021,
              correct_answer:
                'Prevent concentration of power and protect individual liberties',
            },
            {
              question_number: 3,
              description:
                "## Ghana's Political History: Kwame Nkrumah\n\nGhana's political history — from independence (1957) through military rule to the Fourth Republic (1993) — is a core WASSCE Government topic.\n\n**Question:** Dr. Kwame Nkrumah declared Ghana a Republic and became its first President on:",
              hints: [
                'Ghana gained independence in 1957, but became a republic slightly later.',
              ],
              solution_steps: [
                'Ghana became independent on 6 March 1957.',
                'Ghana was declared a Republic on 1 July 1960.',
                'Nkrumah became the first President of the Republic of Ghana on 1 July 1960.',
              ],
              options: [
                '6 March 1957',
                '1 July 1960',
                '24 February 1966',
                '1 January 1964',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_GHANA_HISTORY', 'TAG_NKRUMAH'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2022,
              correct_answer: '1 July 1960',
            },
            {
              question_number: 4,
              description:
                "## Ghana's Legislature: Parliament\n\nThe composition, functions, and procedures of Ghana's Parliament are heavily tested in WASSCE Government.\n\n**Question:** According to Ghana's 1992 Constitution, how many members does Parliament consist of?",
              hints: ['This number has been fixed by the constitution.'],
              solution_steps: [
                "Ghana's Parliament consists of 275 members (Members of Parliament).",
                'MPs are elected from 275 constituencies for a 4-year term.',
                'Note: The number of seats can be altered by Parliament itself (it was increased from 200 under the 1979 constitution).',
              ],
              options: ['200', '230', '275', '300'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_LEGISLATURE', 'TAG_PARLIAMENT_GHANA'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2023,
              correct_answer: '275',
            },
            {
              question_number: 5,
              description:
                "## Electoral System: Elections in Ghana\n\nGhana's electoral system and the role of the Electoral Commission are key WASSCE topics.\n\n**Question:** In Ghana, presidential candidates must obtain what minimum proportion of total valid votes cast to WIN the presidential election in the first round?",
              hints: ['This is the "50% + 1" constitutional requirement.'],
              solution_steps: [
                'Article 63(3) of the 1992 Constitution: A presidential candidate must obtain MORE THAN 50% of the total votes cast.',
                'If no candidate achieves this, a run-off is held between the top two candidates.',
              ],
              options: ['25%', '33.3%', 'More than 50%', 'Exactly 50%'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_ELECTIONS', 'TAG_ELECTORAL_SYSTEM'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2021,
              correct_answer: 'More than 50%',
            },
            {
              question_number: 6,
              description:
                '## Pressure Groups: Definition and Functions\n\nPressure groups (interest groups) and their role in democracy are a standard WASSCE Government topic.\n\n**Question:** A PRESSURE GROUP differs from a POLITICAL PARTY primarily because:',
              hints: [
                'Think about what each group ultimately seeks to achieve.',
              ],
              solution_steps: [
                'Political party: seeks to WIN political power (form the government).',
                'Pressure group: seeks to INFLUENCE government policy without seeking to govern directly.',
                'Example of pressure groups: TUC (Trade Union Congress), Ghana Medical Association, GNAT.',
              ],
              options: [
                'Pressure groups field candidates in elections',
                'Pressure groups seek to influence policy rather than win power',
                'Pressure groups operate outside the law',
                'Pressure groups represent the entire population',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_PRESSURE_GROUPS', 'TAG_POLITICAL_PARTICIPATION'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2022,
              correct_answer:
                'Pressure groups seek to influence policy rather than win power',
            },
            {
              question_number: 7,
              description:
                '## International Organisations: ECOWAS\n\nKnowledge of regional and international organisations (UN, AU, ECOWAS, Commonwealth) is tested in WASSCE Government.\n\n**Question:** The Economic Community of West African States (ECOWAS) was established by the Treaty of Lagos in:',
              hints: [
                'ECOWAS is one of the oldest regional economic blocs in Africa.',
              ],
              solution_steps: [
                'ECOWAS was established on 28 May 1975 by the Treaty of Lagos.',
                'It has 15 member states including Ghana, Nigeria, Ivory Coast, Senegal, etc.',
                'The AU was established in 2002 (successor to OAU, 1963). The UN was established in 1945.',
              ],
              options: ['1963', '1972', '1975', '1980'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_ECOWAS', 'TAG_INTERNATIONAL_ORGANISATIONS'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2023,
              correct_answer: '1975',
            },
            {
              question_number: 8,
              description:
                "## Fundamental Human Rights: Ghana's 1992 Constitution\n\nHuman rights as protected under Chapter 5 of Ghana's 1992 Constitution are tested annually.\n\n**Question:** Which of the following rights is NOT included in the Fundamental Human Rights and Freedoms under Ghana's 1992 Constitution?",
              hints: ['Check what Chapter 5 of the 1992 Constitution covers.'],
              solution_steps: [
                'Chapter 5 of the 1992 Constitution guarantees: right to life, personal liberty, freedom of speech, fair trial, privacy, education, free press, property rights.',
                'The right to own a private army is NOT a protected constitutional right — it is, in fact, prohibited.',
              ],
              options: [
                'Right to personal liberty',
                'Right to fair trial',
                'Freedom of speech and expression',
                'Right to own a private army',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_HUMAN_RIGHTS', 'TAG_CONSTITUTION'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_2',
              exam_year: 2022,
              correct_answer: 'Right to own a private army',
            },
            {
              question_number: 9,
              description:
                "## Military Governments: Ghana's Coup d'états\n\nGhana's history of military interventions is a core WASSCE Government topic.\n\n**Question:** Who led the military coup that overthrew Ghana's First Republic government of Dr. Kwame Nkrumah on 24 February 1966?",
              hints: ["This was Ghana's first military coup."],
              solution_steps: [
                "The National Liberation Council (NLC) led by General J.A. Ankrah (with Col. E.K. Kotoka) overthrew Nkrumah's CPP government on 24 February 1966 while Nkrumah was in Hanoi.",
              ],
              options: [
                'Gen. I.K. Acheampong',
                'Gen. J.A. Ankrah (NLC)',
                'Flt. Lt. J.J. Rawlings',
                'Gen. A.A. Afrifa',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_GHANA_HISTORY', 'TAG_MILITARY_RULE'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2021,
              correct_answer: 'Gen. J.A. Ankrah (NLC)',
            },
            {
              question_number: 10,
              description:
                '## Federalism vs. Unitary State\n\nDistinguishing federal from unitary systems of government and their advantages/disadvantages is a WASSCE Government core topic.\n\n**Question:** Ghana operates a UNITARY system of government. This means:',
              hints: [
                'In a unitary state, where does constitutional power ultimately reside?',
              ],
              solution_steps: [
                'In a unitary state, ALL constitutional authority is vested in the CENTRAL (national) government.',
                'Regional/district authorities exist by delegation from the centre, not by right.',
                'Examples of unitary states: Ghana, UK, France.',
                'Examples of federal states: Nigeria, USA, Germany.',
              ],
              options: [
                'Power is shared between the central government and regional governments by the constitution',
                'All constitutional authority is vested in the central government',
                'Regional governments have sovereignty over the central government',
                'There is no central government',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_FEDERALISM', 'TAG_UNITARY_STATE'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_1',
              exam_year: 2022,
              correct_answer:
                'All constitutional authority is vested in the central government',
            },
          ],
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 10. INFORMATION COMMUNICATION TECHNOLOGY — ICT (Elective)
    // ══════════════════════════════════════════════════════════════════════════
    {
      courseName: 'Information Communication Technology (ICT)',
      is_mandatory: false,
      imageFile: { filename: 'ict_1.jpeg', mime: 'image/jpeg', ext: 'jpeg' },
      suites: [
        {
          suiteName: 'WASSCE ICT — Hardware, Software, Networks & Data',
          suiteDescription:
            '10 questions covering computer hardware and software, data representation, operating systems, networks/internet, spreadsheets, databases, and programming concepts as per the GES/WAEC ICT syllabus.',
          suiteKeywords: [
            'WASSCE',
            'ICT',
            'Hardware',
            'Software',
            'Networking',
            'Data',
            'Programming',
          ],
          questions: [
            {
              question_number: 1,
              description:
                '## Hardware: Input and Output Devices\n\nClassifying computer peripherals as input or output devices is a foundational WASSCE ICT question.\n\n**Question:** Which of the following devices is BOTH an input AND an output device?',
              hints: [
                'Think about a device that can both send data to the computer and receive data from it.',
              ],
              solution_steps: [
                'A touchscreen can receive data (touch input) AND display output (screen).',
                'Keyboard/mouse = input only.',
                'Printer/monitor = output only.',
                'A modem also qualifies (sends and receives data), but touchscreen is the clearest example.',
              ],
              options: ['Keyboard', 'Printer', 'Touchscreen', 'Monitor'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_HARDWARE', 'TAG_INPUT_OUTPUT'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_1',
              exam_year: 2022,
              correct_answer: 'Touchscreen',
            },
            {
              question_number: 2,
              description:
                '## Data Representation: Binary Numbers\n\nBinary (base-2) number representation is heavily tested in WASSCE ICT.\n\n**Question:** What is the decimal equivalent of the binary number 1011?',
              hints: [
                'Binary place values (right to left): 1, 2, 4, 8, 16...',
                '1011 = (1×8) + (0×4) + (1×2) + (1×1)',
              ],
              solution_steps: [
                '1×8 = 8',
                '0×4 = 0',
                '1×2 = 2',
                '1×1 = 1',
                'Total = 8 + 0 + 2 + 1 = 11',
              ],
              options: ['9', '10', '11', '13'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_DATA_REPRESENTATION', 'TAG_BINARY'],
              difficulty: 'MEDIUM',
              estimated_time_in_ms: 90000,
              class_level: 'shs_1',
              exam_year: 2021,
              correct_answer: '11',
            },
            {
              question_number: 3,
              description:
                '## Software: Types of Software\n\nDistinguishing system software, application software, and utility software is a standard WASSCE ICT topic.\n\n**Question:** Which of the following is an example of SYSTEM SOFTWARE?',
              hints: [
                'System software manages computer hardware and provides a platform for other programs.',
              ],
              solution_steps: [
                'Operating Systems (e.g. Windows, Linux, macOS) are system software.',
                'Microsoft Word, Excel, Firefox = application software.',
                'Antivirus, disk defragmenter = utility software (subset of system software).',
              ],
              options: [
                'Microsoft Word',
                'Google Chrome',
                'Windows Operating System',
                'Adobe Photoshop',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_SOFTWARE', 'TAG_OPERATING_SYSTEM'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_1',
              exam_year: 2022,
              correct_answer: 'Windows Operating System',
            },
            {
              question_number: 4,
              description:
                '## Networks: LAN, WAN & the Internet\n\nNetwork types and topology are regularly tested in WASSCE ICT.\n\n**Question:** A network that connects computers within a single building or campus is called a:',
              hints: ['Think about the geographic area covered.'],
              solution_steps: [
                'LAN (Local Area Network): covers a small area — a building, floor, or campus.',
                'WAN (Wide Area Network): covers large geographic areas (countries, continents).',
                'MAN (Metropolitan Area Network): covers a city.',
                'The Internet is the global WAN.',
              ],
              options: ['WAN', 'MAN', 'LAN', 'Internet'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_NETWORKS', 'TAG_LAN'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_1',
              exam_year: 2023,
              correct_answer: 'LAN',
            },
            {
              question_number: 5,
              description:
                '## Spreadsheets: Functions\n\nSpreadsheet functions (SUM, AVERAGE, COUNT, IF) are tested practically and theoretically in WASSCE ICT.\n\n**Question:** In Microsoft Excel, which formula correctly calculates the AVERAGE of values in cells A1 to A5?',
              hints: ['The AVERAGE function takes a range of cells.'],
              solution_steps: [
                '=AVERAGE(A1:A5) calculates the mean of cells A1, A2, A3, A4, and A5.',
                '=SUM(A1:A5) = total; =COUNT(A1:A5) = number of numeric cells.',
              ],
              options: [
                '=SUM(A1:A5)/A5',
                '=MEAN(A1:A5)',
                '=AVERAGE(A1:A5)',
                '=AVG(A1,A5)',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_SPREADSHEETS', 'TAG_EXCEL'],
              difficulty: 'EASY',
              estimated_time_in_ms: 60000,
              class_level: 'shs_2',
              exam_year: 2022,
              correct_answer: '=AVERAGE(A1:A5)',
            },
            {
              question_number: 6,
              description:
                '## Databases: Key Concepts\n\nDatabase concepts (tables, fields, records, primary key) are tested in WASSCE ICT Paper 1 and practicals.\n\n**Question:** In a database table, a field that UNIQUELY identifies each record is called a:',
              hints: ['This field ensures no two records are identical.'],
              solution_steps: [
                'PRIMARY KEY: a field (or combination of fields) that uniquely identifies each record in a table.',
                'Example: Student ID, National ID.',
                'Foreign key: a field in one table that references the primary key of another table.',
              ],
              options: [
                'Foreign key',
                'Index field',
                'Primary key',
                'Lookup field',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_DATABASES', 'TAG_PRIMARY_KEY'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_2',
              exam_year: 2021,
              correct_answer: 'Primary key',
            },
            {
              question_number: 7,
              description:
                '## Internet: Email\n\nInternet concepts and email protocols are tested in WASSCE ICT.\n\n**Question:** What does "CC" stand for in email?',
              hints: [
                'CC is used to send a copy of an email to additional recipients.',
              ],
              solution_steps: [
                'CC = Carbon Copy.',
                'All recipients can see who was CCed.',
                'BCC = Blind Carbon Copy — recipients are hidden from other recipients.',
              ],
              options: [
                'Closed Copy',
                'Carbon Copy',
                'Computer Copy',
                'Confidential Copy',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_INTERNET', 'TAG_EMAIL'],
              difficulty: 'EASY',
              estimated_time_in_ms: 30000,
              class_level: 'shs_1',
              exam_year: 2023,
              correct_answer: 'Carbon Copy',
            },
            {
              question_number: 8,
              description:
                '## Programming: Algorithms\n\nAlgorithmic thinking, flowcharts, and pseudocode are tested in WASSCE ICT Paper 2.\n\n**Question:** What is the first step in solving a problem using a computer?',
              hints: [
                'Before you can write a program, you must understand and define the problem clearly.',
              ],
              solution_steps: [
                'Problem-solving steps in ICT:',
                '1. Problem definition/analysis',
                '2. Algorithm design (flowchart or pseudocode)',
                '3. Coding (writing the program)',
                '4. Testing and debugging',
                '5. Documentation',
                'Step 1 = Problem definition.',
              ],
              options: [
                'Coding the program',
                'Testing the program',
                'Problem definition and analysis',
                'Running the program',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_PROGRAMMING', 'TAG_ALGORITHMS'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_2',
              exam_year: 2022,
              correct_answer: 'Problem definition and analysis',
            },
            {
              question_number: 9,
              description:
                '## Cybersecurity: Computer Viruses\n\nCybersecurity and safe computing are increasingly tested in WASSCE ICT.\n\n**Question:** Which of the following is the BEST practice to protect a computer from virus attacks?',
              hints: [
                'Think about the most proactive and reliable security measure.',
              ],
              solution_steps: [
                'Installing and regularly updating ANTIVIRUS SOFTWARE is the primary defence.',
                'Other good practices: avoid opening unknown email attachments, update OS patches, use strong passwords.',
                'Disconnecting from the internet or never using USB drives is impractical for daily use.',
              ],
              options: [
                'Never connecting to the internet',
                'Installing and regularly updating antivirus software',
                'Using only compact disc drives',
                'Switching off the computer when not in use',
              ],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_CYBERSECURITY', 'TAG_VIRUSES'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_1',
              exam_year: 2021,
              correct_answer:
                'Installing and regularly updating antivirus software',
            },
            {
              question_number: 10,
              description:
                '## Storage: Primary and Secondary Memory\n\nMemory types (RAM, ROM, hard disk, flash) and their characteristics are core WASSCE ICT topics.\n\n**Question:** Which type of memory LOSES its content when the computer is switched off?',
              hints: ['Think about which memory is "volatile".'],
              solution_steps: [
                'RAM (Random Access Memory) = VOLATILE — loses data when power is removed.',
                'ROM (Read-Only Memory) = non-volatile — retains data without power.',
                'Hard disk, flash drive = non-volatile secondary storage.',
              ],
              options: ['ROM', 'Hard Disk Drive', 'RAM', 'Flash drive'],
              type: 'MULTIPLE_CHOICE',
              tags: ['TAG_MEMORY', 'TAG_STORAGE'],
              difficulty: 'EASY',
              estimated_time_in_ms: 45000,
              class_level: 'shs_1',
              exam_year: 2022,
              correct_answer: 'RAM',
            },
          ],
        },
      ],
    },
  ],
};

export default wassceSeedData;
