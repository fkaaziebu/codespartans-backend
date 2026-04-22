import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import {
  Admin,
  Cart,
  Category,
  Course,
  Image,
  Instructor,
  Organization,
  Question,
  Student,
  TestSuite,
  Version,
} from './database/entities';
import { HashHelper } from './helpers';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CurrencyType,
  DomainType,
  LevelType,
} from './database/types/course.type';
import { QuestionInput } from './modules/inventory/inputs';
import {
  QuestionDifficultyType,
  QuestionTagType,
  QuestionType,
} from './database/types/question.type';
import { VersionStatusType } from './database/types/version.type';

@Injectable()
export class SetupDbService {
  constructor(
    @InjectRepository(Instructor)
    private instructorRepository: Repository<Instructor>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Version)
    private versionRepository: Repository<Version>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(TestSuite)
    private testSuiteRepository: Repository<TestSuite>,
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
    private configService: ConfigService,
  ) {}

  async setupDatabase() {
    try {
      /** Step One
       * (1) Create Organization with genpop email (knust@st.edu.gh)
       * (2) Create an instructor and an admin for the genpop organization
       * (3) Create a student under the organization
       */
      const organization = new Organization();
      organization.name = 'Kwame Nkrumah Senior High School';
      organization.email = 'knust@st.edu.gh';
      organization.password = await HashHelper.encrypt('password');

      await this.organizationRepository.save(organization);

      const instructor = new Instructor();
      instructor.name = 'Johnson Ameyaw';
      instructor.email = 'johnsonameyaw@gmail.com';
      instructor.password = await HashHelper.encrypt('password');
      instructor.organizations = [organization];

      await this.instructorRepository.save(instructor);

      const admin = new Admin();
      admin.name = 'stephen grider';
      admin.email = 'stephengrider@gmail.com';
      admin.password = await HashHelper.encrypt('password');
      admin.organization = organization;

      await this.adminRepository.save(admin);

      const cart = new Cart();

      await this.cartRepository.save(cart);

      const student = new Student();
      student.name = 'Frederick Aziebu';
      student.email = 'frederickaziebu1998@gmail.com';
      student.password = await HashHelper.encrypt('password');
      student.cart = cart;
      student.organizations = [organization];

      await this.studentRepository.save(student);

      /** Step Two
       * (1) Instructor should create a course
       * (2) Attach questions to course
       * (3) Request course review
       * (4) Organization should assign course to admin
       * (5) Admin should approve course
       */
      // create course
      const wassce_courses = [
        'Mathematics',
        'English Language',
        'Physics',
        'Chemistry',
        'Biology',
        'Economics',
        'Geography',
        'Literature',
        'Government',
        'History',
      ];

      const new_wassce_courses: Course[] = await Promise.all(
        wassce_courses.map(async (course_name, idx) => {
          const wassce_course = new Course();
          wassce_course.avatar_url = 'https://example.com/avatar.jpg';
          wassce_course.currency = CurrencyType.USD;
          wassce_course.description = 'This is a test course';
          wassce_course.domains = [DomainType.ENGLISH];
          wassce_course.level = LevelType.BEGINNER;
          wassce_course.price = 100;
          wassce_course.title = course_name;
          wassce_course.is_mandatory = idx > 4 ? false : true;
          wassce_course.instructor = instructor;
          wassce_course.organization = organization;

          return wassce_course;
        }),
      );

      await this.courseRepository.save(new_wassce_courses);

      // create course versions
      const new_wassce_course_versions: Version[] = await Promise.all(
        new_wassce_courses.map(async (course) => {
          const version = new Version();
          version.status = VersionStatusType.APPROVED;
          version.version_number = 1;
          version.course = course;
          version.assigned_admin = admin;
          await this.versionRepository.save(version);

          course.approved_version = version;
          await this.courseRepository.save(course);

          return version;
        }),
      );

      const getImageBuffer = (filename: string): Buffer => {
        const filePath = path.resolve(process.cwd(), 'data', filename);
        const imageBuffer = fs.readFileSync(filePath);
        return imageBuffer;
      };

      const studentUrl = this.configService.get<string>('STUDENT_URL');

      const subjectImageFiles: Record<
        string,
        { filename: string; mime: string; ext: string }
      > = {
        Mathematics: { filename: 'math_1.jpeg', mime: 'image/jpeg', ext: 'jpeg' },
        'English Language': { filename: 'english_1.jpeg', mime: 'image/jpeg', ext: 'jpeg' },
        Physics: { filename: 'physics_1.jpeg', mime: 'image/jpeg', ext: 'jpeg' },
        Chemistry: { filename: 'chemistry_1.jpeg', mime: 'image/jpeg', ext: 'jpeg' },
        Biology: { filename: 'biology_1.jpeg', mime: 'image/jpeg', ext: 'jpeg' },
        Economics: { filename: 'economics_1.jpeg', mime: 'image/jpeg', ext: 'jpeg' },
        Geography: { filename: 'geography_1.jpeg', mime: 'image/jpeg', ext: 'jpeg' },
        Literature: { filename: 'literature_1.jpeg', mime: 'image/jpeg', ext: 'jpeg' },
        Government: { filename: 'government_1.jpeg', mime: 'image/jpeg', ext: 'jpeg' },
        History: { filename: 'history_1.png', mime: 'image/png', ext: 'png' },
      };

      const subjectImageUrls: Record<string, string> = {};
      for (const [subject, { filename, mime, ext }] of Object.entries(
        subjectImageFiles,
      )) {
        const img = new Image();
        img.path = `seed-${subject.toLowerCase().replace(/\s+/g, '-')}-question.${ext}`;
        img.original_name = filename;
        img.mime_type = mime;
        img.buffer = getImageBuffer(filename);
        await this.imageRepository.save(img);
        subjectImageUrls[subject] = `${studentUrl}/api/images/${img.path}`;
      }

      const courseQuestionsMap: Record<
        string,
        Array<{
          suiteTitle: string;
          suiteDescription: string;
          suiteKeywords: string[];
          questions: QuestionInput[];
        }>
      > = {
        Mathematics: [
          {
            suiteTitle: 'WASSCE Mathematics — Number, Numeration & Algebra',
            suiteDescription:
              '8 questions covering Number & Numeration (fractions, decimals, HCF) and Algebra (equations, simplification, expansion).',
            suiteKeywords: ['WASSCE', 'Mathematics', 'Number', 'Algebra'],
            questions: [
              {
                question_number: 1,
                description: `## Number & Numeration: Adding Fractions\n\n![image](/v1/images/seed-sample-question.png)\n\nAdding fractions with **unlike denominators** is one of the most frequently tested skills in WASSCE Mathematics, appearing in topics from ratio and proportion to algebraic fractions.\n\n### Key Concepts\n\n- **Lowest Common Denominator (LCD):** The smallest integer divisible by all denominators — find it before combining any fractions\n- **Equivalent fractions:** Multiply both numerator and denominator by the same factor (e.g. 3/4 → 15/20 when multiplied by 5)\n- **Combining numerators:** Only after converting to a common denominator can you add the numerators directly\n- **Mixed numbers:** If the result is an improper fraction, convert it (e.g. 23/20 = 1 3/20)\n- **Simplification:** Always check whether the final answer can be reduced further\n\n> **Exam tip:** Never add denominators together — only the numerators change once a common denominator is established.\n\n---\n\n**Question:** What is the value of 3/4 + 2/5?`,
                hints: ['Find a common denominator for 4 and 5.', 'LCD = 20.'],
                solution_steps: [
                  '3/4 = 15/20',
                  '2/5 = 8/20',
                  '15/20 + 8/20 = 23/20 = 1 3/20',
                ],
                options: ['23/20', '7/9', '1 7/20', '17/20'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_NUMBER_AND_NUMERATION],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 60000,
                correct_answer: '1 7/20',
              },
              {
                question_number: 2,
                description: 'Simplify: 0.75 × 0.4 = ___',
                hints: ['Convert to fractions: 0.75 = 3/4, 0.4 = 2/5.'],
                solution_steps: ['(3/4) × (2/5) = 6/20 = 3/10 = 0.3'],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_NUMBER_AND_NUMERATION],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 60000,
                correct_answer: '0.3',
              },
              {
                question_number: 3,
                description: 'The HCF of 12 and 18 is ___.',
                hints: [
                  'List factors of 12 and 18.',
                  'Pick the largest common factor.',
                ],
                solution_steps: [
                  'Factors of 12: 1,2,3,4,6,12',
                  'Factors of 18: 1,2,3,6,9,18',
                  'HCF = 6',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_NUMBER_AND_NUMERATION],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 60000,
                correct_answer: '6',
              },
              {
                question_number: 4,
                description:
                  'Express 0.625 as a fraction in its simplest form: ___',
                hints: ['Write as 625/1000 then simplify by dividing by 125.'],
                solution_steps: [
                  '0.625 = 625/1000',
                  '625 ÷ 125 = 5, 1000 ÷ 125 = 8',
                  'Result: 5/8',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_NUMBER_AND_NUMERATION],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 60000,
                correct_answer: '5/8',
              },
              {
                question_number: 5,
                description:
                  'If x + 5 = 12, find x. (Enter the numerical value only)',
                hints: ['Subtract 5 from both sides.'],
                solution_steps: ['x = 12 − 5 = 7'],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_ALGEBRA],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: '7',
              },
              {
                question_number: 6,
                description: 'Simplify: 2x + 3x − x',
                hints: ['Collect like terms.'],
                solution_steps: ['(2 + 3 − 1)x = 4x'],
                options: ['4x', '5x', '6x', '3x'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_ALGEBRA],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: '4x',
              },
              {
                question_number: 7,
                description: 'If 3y = 21, find y.',
                hints: ['Divide both sides by 3.'],
                solution_steps: ['y = 21 ÷ 3 = 7'],
                options: ['6', '7', '8', '9'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_ALGEBRA],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: '7',
              },
              {
                question_number: 8,
                description: `## Algebra: Expanding Brackets Using FOIL\n\n![image](/v1/images/seed-sample-question.png)\n\nThe **FOIL method** (First, Outer, Inner, Last) is the standard WASSCE technique for expanding the product of two binomial expressions without missing any partial product.\n\n### Key Concepts\n\n- **First:** Multiply the first terms of each bracket (x · x = x²)\n- **Outer:** Multiply the outer terms (x · 3 = 3x)\n- **Inner:** Multiply the inner terms (2 · x = 2x)\n- **Last:** Multiply the last terms (2 · 3 = 6)\n- **Collect like terms:** Combine 3x + 2x = 5x to reach the final answer\n\n> **Exam tip:** After expanding, always substitute a simple value like x = 1 into both the original and expanded forms to verify they match.\n\n---\n\n**Question:** Expand: (x + 2)(x + 3)`,
                hints: ['Use FOIL: First, Outer, Inner, Last.'],
                solution_steps: [
                  'x·x = x²',
                  'x·3 = 3x',
                  '2·x = 2x',
                  '2·3 = 6',
                  'Total: x² + 5x + 6',
                ],
                options: ['x² + 5x + 6', 'x² + 6', 'x² + 5x', 'x² + 6x + 6'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_ALGEBRA],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 90000,
                correct_answer: 'x² + 5x + 6',
              },
            ],
          },
          {
            suiteTitle:
              'WASSCE Mathematics — Geometry, Statistics & Applied Maths',
            suiteDescription:
              '22 questions covering Mensuration, Geometry, Statistics, Probability, Sets, Ratio, Percentages, Trigonometry, Indices and Word Problems.',
            suiteKeywords: ['WASSCE', 'Mathematics', 'Geometry', 'Statistics'],
            questions: [
              {
                question_number: 1,
                description:
                  'The area of a rectangle of length 8 cm and width 5 cm is ___ cm².',
                hints: ['Area = length × width.'],
                solution_steps: ['Area = 8 × 5 = 40 cm²'],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_MENSURATION],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: '40 cm²',
              },
              {
                question_number: 2,
                description:
                  'The perimeter of a square with side 6 cm is ___ cm.',
                hints: ['Perimeter of square = 4 × side.'],
                solution_steps: ['P = 4 × 6 = 24 cm'],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_MENSURATION],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: '24 cm',
              },
              {
                question_number: 3,
                description: 'The volume of a cube with side 3 cm is ___ cm³.',
                hints: ['Volume = side³.'],
                solution_steps: ['V = 3³ = 27 cm³'],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_MENSURATION],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: '27 cm³',
              },
              {
                question_number: 4,
                description: `## Geometry: Angles and Lines\n\n![image](/v1/images/seed-sample-question.png)\n\nUnderstanding angle relationships is fundamental to geometry and trigonometry in the WASSCE syllabus, from parallel-line proofs to polygon angle sums.\n\n### Key Concepts\n\n- **Full rotation:** A complete turn about a point equals 360°\n- **Straight angle:** A straight line represents half a full rotation, creating an angle of 180°\n- **Supplementary angles:** Two adjacent angles on a straight line add up to 180°\n- **Vertically opposite angles:** When two lines cross, opposite angles are equal\n- **Applications:** These facts underpin triangle angle sums, exterior angles of polygons, and co-interior angle proofs\n\n> **Exam tip:** Memorise that a straight angle = 180° — it is the single most frequently applied angle fact across all WASSCE geometry questions.\n\n---\n\n**Question:** How many degrees are in a straight line?`,
                hints: ['A straight angle is half a full rotation.'],
                solution_steps: ['A straight angle = 180°'],
                options: ['90°', '180°', '270°', '360°'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_GEOMETRY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: '180°',
              },
              {
                question_number: 5,
                description: `## Geometry: Interior Angles of Triangles\n\n![image](/v1/images/seed-sample-question.png)\n\nThe triangle angle-sum theorem is one of the most fundamental results in Euclidean geometry, underpinning a vast range of WASSCE examination questions on polygons, parallel lines, and trigonometry.\n\n### Key Concepts\n\n- **Angle sum:** The three interior angles of any triangle always add up to a fixed total\n- **Any triangle:** The rule holds for acute, obtuse, right-angled, scalene, isosceles, and equilateral triangles\n- **Finding the third angle:** If two angles are known, subtract their sum from the total to find the third\n- **Equilateral triangle:** All three angles are equal, so each must be 60°\n- **Polygon extension:** The sum of interior angles of an n-sided polygon is (n − 2) × 180°\n\n> **Exam tip:** The triangle angle-sum theorem is the foundation from which all polygon angle calculations are derived — master it first.\n\n---\n\n**Question:** What is the sum of angles in a triangle?`,
                hints: ['Recall the triangle angle sum theorem.'],
                solution_steps: [
                  'Interior angles of any triangle add up to 180°',
                ],
                options: ['90°', '180°', '270°', '360°'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_GEOMETRY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: '180°',
              },
              {
                question_number: 6,
                description: 'An angle greater than 90° but less than 180° is?',
                hints: [
                  'Recall angle classification: acute < 90°, right = 90°, obtuse 90–180°.',
                ],
                solution_steps: ['An obtuse angle lies between 90° and 180°'],
                options: ['Acute', 'Right', 'Obtuse', 'Reflex'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_GEOMETRY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: 'Obtuse',
              },
              {
                question_number: 7,
                description: 'The mean of 2, 4, 6, 8 is ___.',
                hints: ['Mean = sum ÷ count.'],
                solution_steps: ['(2 + 4 + 6 + 8) ÷ 4 = 20 ÷ 4 = 5'],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_STATISTICS_AND_PROBABILITY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: '5',
              },
              {
                question_number: 8,
                description: 'The mode of 1, 2, 2, 3, 4 is?',
                hints: ['Mode = the value that appears most often.'],
                solution_steps: ['2 appears twice; all others once. Mode = 2'],
                options: ['1', '2', '3', '4'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_STATISTICS_AND_PROBABILITY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: '2',
              },
              {
                question_number: 9,
                description: 'The range of 5, 7, 10, 15 is ___.',
                hints: ['Range = highest − lowest.'],
                solution_steps: ['Range = 15 − 5 = 10'],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_STATISTICS_AND_PROBABILITY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: '10',
              },
              {
                question_number: 10,
                description: `## Statistics & Probability: Basic Probability\n\n![image](/v1/images/seed-sample-question.png)\n\nProbability quantifies the likelihood of events on a scale from 0 (impossible) to 1 (certain) and is tested extensively in the WASSCE syllabus through coin and dice problems, tree diagrams, and Venn diagrams.\n\n### Key Concepts\n\n- **Classical probability:** P(event) = number of favourable outcomes ÷ total equally likely outcomes\n- **Fair coin:** Two equally likely outcomes (heads, tails), so P(head) = 1/2\n- **Complementary rule:** P(event does NOT occur) = 1 − P(event occurs)\n- **Mutually exclusive events:** Their probabilities add up to 1\n- **Independent events:** Use the multiplication rule to combine them\n\n> **Exam tip:** All probabilities for a complete set of mutually exclusive outcomes must sum to 1 — use this as a quick check on your answers.\n\n---\n\n**Question:** What is the probability of getting a head when tossing a fair coin?`,
                hints: ['A fair coin has 2 equally likely outcomes.'],
                solution_steps: ['P(head) = 1/2'],
                options: ['0', '1', '1/2', '2'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_STATISTICS_AND_PROBABILITY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: '1/2',
              },
              {
                question_number: 11,
                description: 'A die is thrown. Probability of getting 6?',
                hints: ['A fair die has 6 outcomes.'],
                solution_steps: ['P(6) = 1/6'],
                options: ['1/2', '1/3', '1/6', '1/12'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_STATISTICS_AND_PROBABILITY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: '1/6',
              },
              {
                question_number: 12,
                description: 'How many elements are in the set {1, 2, 3, 4}?',
                hints: ['Count each distinct element.'],
                solution_steps: ['Elements: 1, 2, 3, 4 — total = 4'],
                options: ['2', '3', '4', '5'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_SETS],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: '4',
              },
              {
                question_number: 13,
                description: 'A universal set contains?',
                hints: ['Think about the broadest possible set.'],
                solution_steps: [
                  'The universal set contains all elements under consideration.',
                ],
                options: ['All elements', 'None', 'Some elements', 'Empty set'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_SETS],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: 'All elements',
              },
              {
                question_number: 14,
                description: 'Divide 20 in ratio 1:3.',
                hints: ['Total parts = 1 + 3 = 4.', 'Each part = 20 ÷ 4 = 5.'],
                solution_steps: ['1 part = 5, 3 parts = 15 → 5 and 15'],
                options: ['5 and 15', '10 and 10', '8 and 12', '6 and 14'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_NUMBER_AND_NUMERATION],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 60000,
                correct_answer: '5 and 15',
              },
              {
                question_number: 15,
                description: 'If 2:5 = x:15, find x.',
                hints: ['Cross multiply: 2 × 15 = 5 × x.'],
                solution_steps: ['30 = 5x', 'x = 6'],
                options: ['4', '5', '6', '7'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_NUMBER_AND_NUMERATION],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 60000,
                correct_answer: '6',
              },
              {
                question_number: 16,
                description: '20% of 150 = ___',
                hints: ['20% = 20/100 = 0.2.'],
                solution_steps: ['0.2 × 150 = 30'],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_NUMBER_AND_NUMERATION],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: '30',
              },
              {
                question_number: 17,
                description: `## Number & Numeration: Percentage Increase\n\n![image](/v1/images/seed-sample-question.png)\n\nReverse-percentage questions — where the final value after an increase is given and the original must be found — are high-priority in WASSCE and appear across profit/loss, interest, taxation, and discount problems.\n\n### Key Concepts\n\n- **Percentage increase formula:** new value = original × (1 + percentage/100)\n- **10% increase:** original is multiplied by 1.10, so 1.10x = new value\n- **Solving for the original:** Divide the new value by the multiplier (e.g. 110 ÷ 1.10 = 100)\n- **Common error:** Do NOT subtract the percentage of the *new* value — always apply the percentage to the *original* unknown\n- **Applications:** Markup pricing, tax-inclusive totals, compound interest, population growth\n\n> **Exam tip:** Set up the equation first — let the original be x, write x × multiplier = given result, then solve.\n\n---\n\n**Question:** A number increased by 10% becomes 110. What is the original number?`,
                hints: ['Let the number be x.', '1.1x = 110.'],
                solution_steps: ['1.1x = 110', 'x = 110 ÷ 1.1 = 100'],
                options: ['90', '100', '110', '120'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_NUMBER_AND_NUMERATION],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: '100',
              },
              {
                question_number: 18,
                description: 'sin 90° = ___',
                hints: ['Recall the special angle table.'],
                solution_steps: ['sin 90° = 1'],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_TRIGONOMETRY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: '1',
              },
              {
                question_number: 19,
                description: 'cos 0° = ___',
                hints: ['Recall the special angle table.'],
                solution_steps: ['cos 0° = 1'],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_TRIGONOMETRY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: '1',
              },
              {
                question_number: 20,
                description: `## Algebra: Laws of Indices\n\n![image](/v1/images/seed-sample-question.png)\n\nThe **laws of indices** (exponent rules) are tested extensively in WASSCE across standard form, logarithms, surds, and algebraic simplification, making them among the most important rules to master.\n\n### Key Concepts\n\n- **Multiplication rule:** aᵐ × aⁿ = a^(m+n) — same base, add the exponents\n- **Division rule:** aᵐ ÷ aⁿ = a^(m−n) — same base, subtract the exponents\n- **Zero exponent:** a⁰ = 1 for any non-zero base (follows from the division rule when m = n)\n- **Power of a power:** (aᵐ)ⁿ = a^(mn) — multiply the exponents\n- **Application:** 2³ × 2² = 2^(3+2) = 2⁵ — far faster than expanding manually\n\n> **Exam tip:** These four rules handle virtually every index expression in WASSCE — no lengthy expansion needed.\n\n---\n\n**Question:** Simplify: 2³ × 2²`,
                hints: [
                  'When multiplying powers with the same base, add the exponents.',
                ],
                solution_steps: ['2³ × 2² = 2^(3+2) = 2⁵'],
                options: ['2⁵', '2⁶', '4⁵', '8²'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_ALGEBRA],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: '2⁵',
              },
              {
                question_number: 21,
                description: '9⁰ = ___',
                hints: ['Any non-zero number raised to power 0 equals 1.'],
                solution_steps: ['9⁰ = 1'],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_ALGEBRA],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: '1',
              },
              {
                question_number: 22,
                description: 'A book costs GH₵10. How much for 5 books?',
                hints: ['Multiply cost per book by quantity.'],
                solution_steps: ['10 × 5 = GH₵50'],
                options: ['GH₵40', 'GH₵45', 'GH₵50', 'GH₵60'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_NUMBER_AND_NUMERATION],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: 'GH₵50',
              },
            ],
          },
        ],
        'English Language': [
          {
            suiteTitle: 'WASSCE English Language — Grammar & Vocabulary',
            suiteDescription:
              '5 questions spanning Grammar, Vocabulary and Figures of Speech.',
            suiteKeywords: ['WASSCE', 'English', 'Grammar', 'Vocabulary'],
            questions: [
              {
                question_number: 1,
                description: 'Choose the grammatically correct sentence.',
                hints: ['Subject and verb must agree in number.'],
                solution_steps: [
                  '"Each of the boys has a book." — "each" is singular, so "has" is correct.',
                ],
                options: [
                  'Each of the boys have a book.',
                  'Each of the boys has a book.',
                  'Each of the boys are having a book.',
                  'Each of the boys were having a book.',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_GRAMMAR_AND_USAGE],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 60000,
                correct_answer: 'Each of the boys has a book.',
              },
              {
                question_number: 2,
                description: 'What does the word "verbose" mean?',
                hints: ['Think about someone who talks too much.'],
                solution_steps: [
                  '"Verbose" describes speech or writing that uses more words than necessary.',
                ],
                options: [
                  'Silent and reserved',
                  'Using more words than necessary',
                  'Precise and concise',
                  'Rude and aggressive',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_VOCABULARY],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'Using more words than necessary',
              },
              {
                question_number: 3,
                description: `## English Language: Figures of Speech\n\n![image](/v1/images/seed-sample-question.png)\n\nThe WASSCE English syllabus requires candidates to identify figures of speech — devices that convey meaning beyond the literal — including simile, metaphor, personification, hyperbole, and irony.\n\n### Key Concepts\n\n- **Simile:** A comparison using "like" or "as" (e.g. "brave as a lion")\n- **Metaphor:** An implicit comparison stating one thing *is* another (e.g. "the wind is a whisperer")\n- **Personification:** Attributing human qualities, actions, or emotions to a non-human entity\n- **Distinguishing personification from metaphor:** Personification gives a human trait to a non-human subject; metaphor equates two unlike things directly\n- **Approach:** First determine *what kind of non-literal meaning* is being expressed, then match it to the correct device\n\n> **Exam tip:** "The wind whispered" gives a human action to wind — that is personification, not metaphor, because no direct equation is stated.\n\n---\n\n**Question:** Identify the figure of speech in: "The wind whispered through the trees."`,
                hints: ['Is the wind being given a human quality?'],
                solution_steps: [
                  'Giving a non-human thing a human quality = Personification.',
                ],
                options: ['Simile', 'Metaphor', 'Personification', 'Hyperbole'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_GRAMMAR_AND_USAGE],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'Personification',
              },
              {
                question_number: 4,
                description: 'The plural of "criterion" is ___.',
                hints: ['This word has a Latin/Greek plural form.'],
                solution_steps: ['"criterion" → "criteria" (Greek origin).'],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_GRAMMAR_AND_USAGE],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: 'criteria',
              },
              {
                question_number: 5,
                description:
                  'A synonym of "laconic" (using very few words) is ___.',
                hints: ['"Laconic" describes a style of speaking.'],
                solution_steps: [
                  '"Laconic" means using very few words — synonym: concise.',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_VOCABULARY],
                difficulty: QuestionDifficultyType.HARD,
                estimated_time_in_ms: 60000,
                correct_answer: 'Concise',
              },
            ],
          },
          {
            suiteTitle:
              'WASSCE English Language — Usage, Phonetics & Oral English',
            suiteDescription:
              '5 questions spanning Sentence Construction, Phonetics, Antonyms and Oral English.',
            suiteKeywords: ['WASSCE', 'English', 'Oral', 'Phonetics'],
            questions: [
              {
                question_number: 1,
                description:
                  'Choose the word that best completes the sentence: "The committee ___ yet to reach a decision."',
                hints: [
                  'Is "committee" treated as singular or plural in formal English?',
                ],
                solution_steps: [
                  'In formal (British) English, collective nouns can take a plural verb: "are".',
                ],
                options: ['is', 'are', 'was', 'were'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_GRAMMAR_AND_USAGE],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'are',
              },
              {
                question_number: 2,
                description:
                  'In phonetics, which sound does the underlined letter represent in the word "church"? (the "ch")',
                hints: ['The "ch" in church is an affricate consonant.'],
                solution_steps: [
                  'The "ch" in "church" is the voiceless palato-alveolar affricate /tʃ/.',
                ],
                options: ['/s/', '/ʃ/', '/tʃ/', '/k/'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_ORAL_ENGLISH],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: '/tʃ/',
              },
              {
                question_number: 3,
                description: 'The antonym of "benevolent" is ___.',
                hints: ['"Benevolent" means kind and generous.'],
                solution_steps: [
                  'The opposite of benevolent (kind) is malevolent (wishing harm).',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_VOCABULARY],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'Malevolent',
              },
              {
                question_number: 4,
                description: `## English Language: Active and Passive Voice\n\n![image](/v1/images/seed-sample-question.png)\n\nThe active/passive distinction is one of the most tested grammar concepts in WASSCE English, appearing in both identification questions and essay composition tasks.\n\n### Key Concepts\n\n- **Active voice:** The subject performs the action (e.g. "Ama writes the letter")\n- **Passive voice:** The subject receives the action (e.g. "The letter was written by Ama")\n- **Passive structure:** Subject + auxiliary "be" (correct tense) + past participle + "by" + agent (optional)\n- **Key signal:** The main verb must be a past participle — not every sentence with "to be" is passive\n- **Converting between voices:** A tested skill in both grammar questions and essay writing\n\n> **Exam tip:** Check for the past participle after an auxiliary "be" — that combination is the hallmark of the passive voice.\n\n---\n\n**Question:** Which sentence uses the passive voice correctly?`,
                hints: ['Passive voice: the subject receives the action.'],
                solution_steps: [
                  '"The letter was written by Ama." — subject "letter" receives the action.',
                ],
                options: [
                  'Ama writes the letter.',
                  'The letter was written by Ama.',
                  'Ama has written the letter.',
                  'Ama is writing the letter.',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_GRAMMAR_AND_USAGE],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 60000,
                correct_answer: 'The letter was written by Ama.',
              },
              {
                question_number: 5,
                description:
                  'When "record" is used as a verb, the stress falls on the ___ syllable.',
                hints: [
                  'In English, many two-syllable nouns stress the first syllable and verbs the second.',
                ],
                solution_steps: [
                  'Noun: RE-cord (stress on 1st). Verb: re-CORD (stress on 2nd).',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_ORAL_ENGLISH],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 're-CORD',
              },
            ],
          },
        ],
        Physics: [
          {
            suiteTitle: 'WASSCE Physics — Mechanics, Waves & Electricity',
            suiteDescription:
              '5 questions spanning Mechanics, Waves and Electricity.',
            suiteKeywords: ['WASSCE', 'Physics', 'Mechanics'],
            questions: [
              {
                question_number: 1,
                description:
                  'A body of mass 5 kg acted on by a net force of 20 N has an acceleration of ___ m/s².',
                hints: ["Use Newton's second law: F = ma."],
                solution_steps: ['a = F/m = 20/5 = 4 m/s²'],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_MECHANICS],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 60000,
                correct_answer: '4 m/s²',
              },
              {
                question_number: 2,
                description:
                  'A car travels 120 km in 2 hours. Find its average speed.',
                hints: ['Speed = Distance ÷ Time.'],
                solution_steps: ['Speed = 120/2 = 60 km/h'],
                options: ['40 km/h', '60 km/h', '80 km/h', '240 km/h'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_MECHANICS],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: '60 km/h',
              },
              {
                question_number: 3,
                description: 'What type of wave is sound?',
                hints: ['Does sound require a medium? How do particles move?'],
                solution_steps: [
                  'Sound is a mechanical wave where particles vibrate parallel to the direction of propagation — longitudinal.',
                ],
                options: [
                  'Transverse',
                  'Longitudinal',
                  'Electromagnetic',
                  'Surface',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_WAVES_AND_OPTICS],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: 'Longitudinal',
              },
              {
                question_number: 4,
                description: `## Physics: Parallel Resistors\n\n![image](/v1/images/seed-sample-question.png)\n\nResistors in **parallel** share the same voltage, and their combined resistance is always less than the smallest individual resistor — a key distinction from series circuits tested regularly in WASSCE Physics.\n\n### Key Concepts\n\n- **Series vs. parallel:** Series — same current, resistances add; Parallel — same voltage, use the reciprocal formula\n- **Reciprocal formula:** 1/R_total = 1/R₁ + 1/R₂ + 1/R₃ + ...\n- **Identical resistors shortcut:** n identical resistors of value R in parallel give R_total = R/n\n- **Physical intuition:** Parallel paths give more routes for current, so overall resistance decreases\n- **Household application:** Appliances are wired in parallel so each operates at full mains voltage independently\n\n> **Exam tip:** Parallel resistance is always *less* than the smallest individual resistor — use this as a quick sanity check.\n\n---\n\n**Question:** Three 6 Ω resistors are connected in parallel. Find the total resistance.`,
                hints: ['1/R_total = 1/R₁ + 1/R₂ + 1/R₃.'],
                solution_steps: [
                  '1/R = 1/6 + 1/6 + 1/6 = 3/6 = 1/2',
                  'R = 2 Ω',
                ],
                options: ['1 Ω', '2 Ω', '3 Ω', '18 Ω'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_ELECTRICITY_AND_MAGNETISM],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 90000,
                correct_answer: '2 Ω',
              },
              {
                question_number: 5,
                description: '100°C converted to Kelvin = ___ K.',
                hints: ['K = °C + 273.'],
                solution_steps: ['K = 100 + 273 = 373 K'],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_HEAT_AND_THERMODYNAMICS],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: '373 K',
              },
            ],
          },
          {
            suiteTitle: 'WASSCE Physics — Heat, Atomic Physics & Measurement',
            suiteDescription:
              '5 questions spanning Heat & Thermodynamics, Atomic Physics, Measurement and Wave Speed.',
            suiteKeywords: ['WASSCE', 'Physics', 'Heat', 'Atomic'],
            questions: [
              {
                question_number: 1,
                description: `## Physics: Kinematics — Vertical Projection\n\n![image](/v1/images/seed-sample-question.png)\n\nVertical projectile motion is one of the most frequently tested WASSCE Physics topics, governed by the equations of uniformly accelerated motion (v = u + at, s = ut + ½at², v² = u² + 2as).\n\n### Key Concepts\n\n- **At maximum height:** Instantaneous velocity = 0 (gravity has decelerated the object completely)\n- **Maximum height formula:** From v² = u² − 2gh with v = 0 → h = u²/(2g)\n- **Sign convention:** Define upward as positive, downward as negative — apply consistently throughout\n- **Symmetry:** The object spends equal time ascending and descending, returning at the same speed\n- **Common error:** Sign mistakes — the most frequent source of errors in kinematics problems\n\n> **Exam tip:** Set v = 0 at maximum height — this single condition directly gives h = u²/(2g) without needing time.\n\n---\n\n**Question:** A body is thrown vertically upward with an initial velocity of 20 m/s. Find the maximum height reached. (g = 10 m/s²)`,
                hints: ['At max height, v = 0. Use v² = u² − 2gh.'],
                solution_steps: ['0 = 20² − 2(10)h', '20h = 400', 'h = 20 m'],
                options: ['10 m', '20 m', '40 m', '200 m'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_MECHANICS],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 90000,
                correct_answer: '20 m',
              },
              {
                question_number: 2,
                description:
                  "Using Ohm's law, if V = 12 V and R = 4 Ω, the current I = ___ A.",
                hints: ["Ohm's law: V = IR."],
                solution_steps: ['I = V/R = 12/4 = 3 A'],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_ELECTRICITY_AND_MAGNETISM],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: '3 A',
              },
              {
                question_number: 3,
                description:
                  'Which particle determines the atomic number of an element?',
                hints: [
                  'Atomic number = number of a specific particle in the nucleus.',
                ],
                solution_steps: [
                  'The atomic number equals the number of protons in the nucleus.',
                ],
                options: ['Neutron', 'Electron', 'Proton', 'Positron'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_ATOMIC_AND_NUCLEAR_PHYSICS],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: 'Proton',
              },
              {
                question_number: 4,
                description: 'The SI unit of power is ___.',
                hints: ['Power = Work done / Time.'],
                solution_steps: ['The SI unit of power is the Watt (W).'],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_MEASUREMENT],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: 'Watt',
              },
              {
                question_number: 5,
                description:
                  'A wave has a frequency of 500 Hz and a wavelength of 0.4 m. Find its speed.',
                hints: ['Wave speed = frequency × wavelength.'],
                solution_steps: ['v = 500 × 0.4 = 200 m/s'],
                options: ['0.8 m/s', '125 m/s', '200 m/s', '1250 m/s'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_WAVES_AND_OPTICS],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 90000,
                correct_answer: '200 m/s',
              },
            ],
          },
        ],
        Chemistry: [
          {
            suiteTitle:
              'WASSCE Chemistry — Atomic Structure, Bonding & Stoichiometry',
            suiteDescription:
              '5 questions spanning Atomic Structure, Periodic Table, Chemical Bonding, Acids/Bases and Stoichiometry.',
            suiteKeywords: ['WASSCE', 'Chemistry', 'Atomic', 'Bonding'],
            questions: [
              {
                question_number: 1,
                description: 'The atomic number of Carbon is ___.',
                hints: ['Atomic number = number of protons.'],
                solution_steps: [
                  'Carbon has 6 protons, so its atomic number is 6.',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_ATOMIC_STRUCTURE],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: '6',
              },
              {
                question_number: 2,
                description:
                  'Noble gases are found in which group of the periodic table?',
                hints: ['Noble gases are the last group on the right.'],
                solution_steps: [
                  'Noble gases are in Group 18 (also called Group 0 in older notation).',
                ],
                options: ['Group 1', 'Group 7', 'Group 17', 'Group 18'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_PERIODIC_TABLE],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: 'Group 18',
              },
              {
                question_number: 3,
                description:
                  'The type of bond formed when atoms share electrons is called ___.',
                hints: ['Sharing vs. transfer of electrons.'],
                solution_steps: [
                  'Shared electrons form a covalent bond; transferred electrons form an ionic bond.',
                ],
                options: [
                  'Ionic bond',
                  'Covalent bond',
                  'Metallic bond',
                  'Hydrogen bond',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_CHEMICAL_BONDING],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: 'Covalent bond',
              },
              {
                question_number: 4,
                description: 'The pH of a neutral solution is ___.',
                hints: ['The pH scale runs from 0 to 14.'],
                solution_steps: ['A neutral solution has pH = 7.'],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_ACIDS_BASES_AND_SALTS],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: '7',
              },
              {
                question_number: 5,
                description: `## Chemistry: Mole Calculations and Stoichiometry\n\n![image](/v1/images/seed-sample-question.png)\n\nThe **mole** links macroscopic mass measurements to microscopic particle counts and is the gateway to all stoichiometric calculations in WASSCE Chemistry.\n\n### Key Concepts\n\n- **Avogadro's number:** One mole contains 6.022 × 10²³ elementary entities\n- **Molar mass:** Sum the relative atomic masses of all atoms in the formula (H₂O = 2×1 + 16 = 18 g/mol)\n- **Moles formula:** moles = mass (g) ÷ molar mass (g/mol)\n- **Reverse calculation:** mass = moles × molar mass\n- **Applications:** Balanced equations, limiting reagents, percentage yield, and gas volumes at STP\n\n> **Exam tip:** Always calculate molar mass first before dividing — confusing mass number with molar mass is the most common error.\n\n---\n\n**Question:** How many moles of H₂O are contained in 36 g of water? (H = 1, O = 16)`,
                hints: [
                  'Moles = mass / molar mass.',
                  'Molar mass of H₂O = 18 g/mol.',
                ],
                solution_steps: ['Moles = 36/18 = 2 mol'],
                options: ['1', '2', '3', '4'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_STOICHIOMETRY],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 90000,
                correct_answer: '2',
              },
            ],
          },
          {
            suiteTitle:
              'WASSCE Chemistry — Organic Chemistry, Electrochemistry & Air',
            suiteDescription:
              '5 questions spanning Organic Chemistry, Electrochemistry, Air & Water and Mass Number.',
            suiteKeywords: [
              'WASSCE',
              'Chemistry',
              'Organic',
              'Electrochemistry',
            ],
            questions: [
              {
                question_number: 1,
                description: 'What is the functional group of alcohols?',
                hints: ['Alcohols contain a hydroxyl group.'],
                solution_steps: [
                  'The functional group of alcohols is −OH (hydroxyl).',
                ],
                options: ['−COOH', '−CHO', '−OH', '−CO−'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_ORGANIC_CHEMISTRY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: '−OH',
              },
              {
                question_number: 2,
                description:
                  'During electrolysis, oxidation occurs at the ___.',
                hints: [
                  'OIL RIG: Oxidation Is Loss, Reduction Is Gain.',
                  'Anode vs. cathode.',
                ],
                solution_steps: [
                  'Oxidation (loss of electrons) occurs at the anode.',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_ELECTROCHEMISTRY],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'Anode',
              },
              {
                question_number: 3,
                description: 'Approximately ___% of dry air is nitrogen.',
                hints: ['Nitrogen is the most abundant gas in the atmosphere.'],
                solution_steps: ['Dry air is approximately 78% nitrogen.'],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_AIR_AND_WATER],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: '78%',
              },
              {
                question_number: 4,
                description:
                  'An atom has 11 protons and 12 neutrons. What is its mass number?',
                hints: ['Mass number = protons + neutrons.'],
                solution_steps: ['Mass number = 11 + 12 = 23'],
                options: ['11', '12', '22', '23'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_ATOMIC_STRUCTURE],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: '23',
              },
              {
                question_number: 5,
                description: `## Chemistry: Balancing Chemical Equations\n\n![image](/v1/images/seed-sample-question.png)\n\nBalancing chemical equations enforces the **Law of Conservation of Mass** — atoms are neither created nor destroyed, so each element must have equal counts on both sides of the equation.\n\n### Key Concepts\n\n- **Adjust coefficients only:** Change the numbers in front of formulas, never the formulas themselves\n- **Balancing order:** Balance elements in the fewest compounds first; leave H and O until last when water is involved\n- **Step-by-step for H₂ + O₂ → H₂O:** Place 2 in front of H₂O to fix oxygen, then 2 in front of H₂ to fix hydrogen\n- **Balanced result:** 2H₂ + O₂ → 2H₂O — coefficient of O₂ is 1\n- **Stoichiometric ratios:** The coefficients directly give the mole ratios for mass and volume calculations\n\n> **Exam tip:** Check every element on both sides after balancing — oxygen is the most common element left unbalanced.\n\n---\n\n**Question:** What is the coefficient of O₂ when the equation H₂ + O₂ → H₂O is balanced?`,
                hints: [
                  'Balance each element; hydrogen and oxygen must both balance.',
                ],
                solution_steps: ['2H₂ + O₂ → 2H₂O — coefficient of O₂ is 1.'],
                options: ['1', '2', '3', '4'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_STOICHIOMETRY],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 90000,
                correct_answer: '1',
              },
            ],
          },
        ],
        Biology: [
          {
            suiteTitle: 'WASSCE Biology — Cell Biology, Genetics & Ecology',
            suiteDescription:
              '5 questions spanning Cell Biology, Genetics and Ecology.',
            suiteKeywords: ['WASSCE', 'Biology', 'Cell', 'Genetics'],
            questions: [
              {
                question_number: 1,
                description: `## Cell Organelles: The Powerhouse\n\n![image](/v1/images/seed-sample-question.png)\n\nAmong the eukaryotic cell's organelles, one stands out for producing nearly all the cell's energy as ATP through aerobic respiration — making it indispensable to all multicellular life.\n\n### Key Concepts\n\n- **Function:** Converts nutrients into ATP via aerobic cellular respiration (Krebs cycle + electron transport chain)\n- **Structure:** Double membrane with inner folds called **cristae** that increase surface area for ATP production\n- **Own DNA:** Contains circular DNA and ribosomes — evidence for the endosymbiotic theory\n- **Endosymbiotic theory:** Proposes it evolved from an ancient prokaryote engulfed by a host cell ~1.5 billion years ago\n- **Vital processes enabled:** Active transport, muscle contraction, biosynthesis, and all energy-requiring cellular activities\n\n> **Exam tip:** The double membrane and presence of own DNA are the two distinguishing structural features to cite in any written response.\n\n---\n\n**Question:** Which organelle is known as the powerhouse of the cell?`,
                hints: [
                  'This organelle produces ATP through cellular respiration.',
                  'It has a double membrane with inner folds called cristae.',
                ],
                solution_steps: [
                  "The mitochondrion produces most of the cell's ATP via aerobic respiration.",
                  'It contains its own DNA, supporting the endosymbiotic theory.',
                ],
                options: ['Nucleus', 'Ribosome', 'Mitochondrion', 'Vacuole'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_CELL_BIOLOGY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 60000,
                correct_answer: 'Mitochondrion',
              },
              {
                question_number: 2,
                description: `## Cell Organelles: Protein Synthesis\n\n![image](/v1/images/seed-sample-question.png)\n\nEvery living cell continuously produces proteins to support growth, repair, enzyme activity, and hormonal signalling — a process carried out by specialised organelles during **translation**.\n\n### Key Concepts\n\n- **Translation:** The process of reading mRNA codons and assembling the corresponding chain of amino acids\n- **Location:** Found free in the cytoplasm (soluble proteins) or attached to the rough endoplasmic reticulum (secretory/membrane proteins)\n- **Structure:** Two subunits (large and small) made of ribosomal RNA (rRNA) and proteins — no membrane\n- **Process:** Reads mRNA codons, recruits tRNA carrying matching amino acids, assembles proteins rapidly\n- **Errors:** Misfolded proteins from translation errors are linked to diseases such as cystic fibrosis and Alzheimer's\n\n> **Exam tip:** These organelles are the only ones with no surrounding membrane — that structural fact alone often identifies them in exam questions.\n\n---\n\n**Question:** Which organelle is responsible for protein synthesis in the cell?`,
                hints: [
                  'It reads mRNA and assembles amino acids.',
                  'It is found on the rough ER and free in the cytoplasm.',
                ],
                solution_steps: [
                  'Ribosomes translate mRNA into proteins by reading codons.',
                  'They are composed of rRNA and protein, forming large and small subunits.',
                ],
                options: [
                  'Golgi apparatus',
                  'Ribosome',
                  'Lysosome',
                  'Centriole',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_CELL_BIOLOGY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 60000,
                correct_answer: 'Ribosome',
              },
              {
                question_number: 3,
                description: `## Genetics: Unit of Heredity\n\n![image](/v1/images/seed-sample-question.png)\n\nGenetics explains how traits are passed between generations via discrete heritable units transmitted through gametes — a field founded by Gregor Mendel and confirmed by modern molecular biology.\n\n### Key Concepts\n\n- **Basic unit:** A specific segment of DNA located at a fixed position (**locus**) on a chromosome\n- **Human genome:** 46 chromosomes in 23 pairs, carrying an estimated 20,000–25,000 heritable units\n- **Alleles:** Two copies of each unit (one from each parent) — identical = homozygous, different = heterozygous\n- **Function:** Encodes instructions for producing proteins that determine an organism's phenotype\n- **Mutations:** Changes in the sequence drive natural selection, cause inherited disorders, or can be edited via CRISPR-Cas9\n\n> **Exam tip:** The term for this unit means "give birth to" in Greek — it encodes the blueprint for a single functional protein.\n\n---\n\n**Question:** The discrete heritable segment of DNA that codes for a functional protein and determines a specific trait is called the ___.`,
                hints: [
                  'It is a segment of DNA that codes for a trait.',
                  'It occupies a specific locus on a chromosome.',
                ],
                solution_steps: [
                  'A gene is the basic unit of heredity.',
                  'Genes are segments of DNA that encode proteins determining traits.',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_GENETICS_AND_EVOLUTION],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'Gene',
              },
              {
                question_number: 4,
                description: `## Human Physiology: Red Blood Cells\n\n![image](/v1/images/seed-sample-question.png)\n\nRed blood cells (erythrocytes) are the primary oxygen-transport cells of the circulatory system, uniquely adapted in structure and composition to maximise gas exchange throughout the body.\n\n### Key Concepts\n\n- **Shape:** Biconcave disc — maximises surface area for gas exchange and allows flexibility in narrow capillaries\n- **Haemoglobin:** Iron-containing protein that reversibly binds up to four oxygen molecules (one per haem group)\n- **No nucleus:** Mature red blood cells lack a nucleus and most organelles, maximising space for haemoglobin\n- **Production:** Erythropoiesis occurs in the red bone marrow, stimulated by erythropoietin (EPO) from the kidneys\n- **Lifespan:** Approximately 120 days — broken down by the spleen with iron recycled for new haemoglobin\n\n> **Exam tip:** The absence of a nucleus is the key structural adaptation — it increases haemoglobin content and is a common exam focus.\n\n---\n\n**Question:** Select **all** correct statements about red blood cells.`,
                hints: [
                  'They contain haemoglobin which binds oxygen.',
                  'They are produced in the red bone marrow.',
                ],
                solution_steps: [
                  'Red blood cells transport oxygen via haemoglobin from lungs to tissues.',
                  'They are biconcave and lack a nucleus to maximise haemoglobin content.',
                ],
                options: [
                  'They contain haemoglobin that binds oxygen',
                  'They are biconcave to maximise surface area for gas exchange',
                  'They retain a nucleus in their mature form',
                  'They are produced in the red bone marrow',
                ],
                type: QuestionType.MULTIPLE_SELECT,
                tags: [QuestionTagType.TAG_HUMAN_PHYSIOLOGY],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer:
                  'They contain haemoglobin that binds oxygen,They are biconcave to maximise surface area for gas exchange,They are produced in the red bone marrow',
              },
              {
                question_number: 5,
                description: `## Plant Biology: Food Production in Green Plants\n\n![image](/v1/images/seed-sample-question.png)\n\nGreen plants are **autotrophs** (producers) — they synthesise organic food from inorganic materials using light energy, forming the foundation of virtually all food chains on Earth.\n\n### Key Concepts\n\n- **Site:** Occurs in chloroplasts, which contain the green pigment chlorophyll\n- **Light-dependent reactions:** On the thylakoid membranes — photolysis splits water, releasing O₂, and generates ATP and NADPH\n- **Light-independent reactions (Calvin cycle):** In the stroma — uses ATP and NADPH to fix CO₂ into glucose\n- **Overall equation:** 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂\n- **Ecological role:** Replenishes atmospheric oxygen and removes CO₂, making it climatically significant\n\n> **Exam tip:** Oxygen is a *by-product* of photolysis (water splitting), not a direct product of carbon fixation — a distinction frequently tested.\n\n---\n\n**Question:** What is the process by which green plants produce their own food using sunlight?`,
                hints: [
                  'It involves chlorophyll, sunlight, water and CO₂.',
                  'The overall equation is 6CO₂ + 6H₂O + light → glucose + O₂.',
                ],
                solution_steps: [
                  'Photosynthesis is the process by which green plants use light to convert CO₂ and water into glucose.',
                  'It occurs in the chloroplasts and releases oxygen as a by-product.',
                ],
                options: [
                  'Respiration',
                  'Transpiration',
                  'Photosynthesis',
                  'Germination',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_PLANT_BIOLOGY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 60000,
                correct_answer: 'Photosynthesis',
              },
            ],
          },
          {
            suiteTitle:
              'WASSCE Biology — Human Physiology, Disease & Classification',
            suiteDescription:
              '5 questions spanning Ecology, Microorganisms & Disease, Classification, Human Physiology and Genetics.',
            suiteKeywords: ['WASSCE', 'Biology', 'Physiology', 'Disease'],
            questions: [
              {
                question_number: 1,
                description:
                  'Organisms that produce their own food through photosynthesis are called ___.',
                hints: ['They form the base of every food chain.'],
                solution_steps: [
                  'Autotrophs (producers) make their own food; heterotrophs cannot.',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_ECOLOGY],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'Autotrophs',
              },
              {
                question_number: 2,
                description: 'The causative agent of malaria is ___.',
                hints: [
                  'It is a protozoan parasite transmitted by the Anopheles mosquito.',
                ],
                solution_steps: [
                  'Malaria is caused by the protozoan Plasmodium.',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_MICROORGANISMS_AND_DISEASE],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'Plasmodium',
              },
              {
                question_number: 3,
                description:
                  'Select **all** statements that correctly describe the taxonomic hierarchy of biological classification.',
                hints: [
                  'Remember: King Philip Came Over For Good Soup.',
                  'More than one answer may be correct.',
                ],
                solution_steps: [
                  'The correct order from broadest to most specific is: Kingdom → Phylum → Class → Order → Family → Genus → Species.',
                  'Genus and Species together form the binomial nomenclature used to name organisms.',
                ],
                options: [
                  'Kingdom is the broadest classification level',
                  'Species is the most specific classification level',
                  'Class comes before Phylum in the hierarchy',
                  'Genus and Species form binomial nomenclature',
                ],
                type: QuestionType.MULTIPLE_SELECT,
                tags: [QuestionTagType.TAG_CLASSIFICATION],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 90000,
                correct_answer:
                  'Kingdom is the broadest classification level,Species is the most specific classification level,Genus and Species form binomial nomenclature',
              },
              {
                question_number: 4,
                description: `## Biology: The Endocrine System — Insulin Production\n\n![image](/v1/images/seed-sample-question.png)\n\nThe endocrine system regulates metabolism, growth, and homeostasis through hormones secreted directly into the bloodstream — and **insulin** is one of its most critical hormones in the WASSCE syllabus.\n\n### Key Concepts\n\n- **Insulin's function:** Enables liver, muscle, and adipose cells to take up glucose from the blood after a meal\n- **Produced by:** Beta cells of the **islets of Langerhans** — specialised endocrine clusters within a mixed gland\n- **Dual-function gland:** The producing organ acts as both an exocrine gland (digestive enzymes via ducts) and an endocrine gland (insulin/glucagon into blood)\n- **Location:** Posterior to the stomach\n- **Diabetes:** Type 1 = insufficient insulin production; Type 2 = cells do not respond to insulin — both cause chronic hyperglycaemia\n\n> **Exam tip:** The dual exocrine/endocrine nature of this organ is a key distinguishing fact and is commonly tested in WASSCE Biology.\n\n---\n\n**Question:** Which organ in the human body produces insulin?`,
                hints: ['This organ is both an exocrine and endocrine gland.'],
                solution_steps: [
                  'The pancreas secretes insulin from its beta cells to regulate blood glucose.',
                ],
                options: ['Liver', 'Kidney', 'Pancreas', 'Stomach'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_HUMAN_PHYSIOLOGY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: 'Pancreas',
              },
              {
                question_number: 5,
                description:
                  'Select **all** correct statements about a monohybrid cross TT × tt.',
                hints: [
                  'T is dominant, t is recessive.',
                  'Each parent contributes one allele per offspring.',
                ],
                solution_steps: [
                  'TT × tt → all F₁ offspring are Tt (heterozygous).',
                  'All F₁ offspring express the dominant phenotype because Tt carries one T allele.',
                ],
                options: [
                  'All F₁ offspring have genotype Tt',
                  'All F₁ offspring express the dominant phenotype',
                  'Some F₁ offspring will be TT',
                  'The F₁ generation shows a 3:1 phenotypic ratio',
                ],
                type: QuestionType.MULTIPLE_SELECT,
                tags: [QuestionTagType.TAG_GENETICS_AND_EVOLUTION],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 90000,
                correct_answer:
                  'All F₁ offspring have genotype Tt,All F₁ offspring express the dominant phenotype',
              },
            ],
          },
        ],
        Economics: [
          {
            suiteTitle: 'WASSCE Economics — Demand, Supply & Production',
            suiteDescription:
              '5 questions spanning Demand & Supply, Production Costs and National Income.',
            suiteKeywords: ['WASSCE', 'Economics', 'Demand', 'Supply'],
            questions: [
              {
                question_number: 1,
                description:
                  'A rise in the price of a good leads to a decrease in the quantity demanded. This illustrates the ___.',
                hints: [
                  'This is one of the most fundamental laws in economics.',
                ],
                solution_steps: [
                  'The inverse relationship between price and quantity demanded is the Law of Demand.',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_DEMAND_AND_SUPPLY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 60000,
                correct_answer: 'Law of Demand',
              },
              {
                question_number: 2,
                description: `## Economics: Demand and Supply — Equilibrium Price\n\n![image](/v1/images/seed-sample-question.png)\n\nThe **equilibrium price** is where quantity demanded equals quantity supplied, and any shift in either curve creates a chain reaction that drives the market to a new equilibrium.\n\n### Key Concepts\n\n- **Law of Demand:** Consumers buy more at lower prices — demand curve slopes downward\n- **Law of Supply:** Producers offer more at higher prices — supply curve slopes upward\n- **Rightward demand shift:** Caused by rising income, changing tastes, or more expensive substitutes\n- **Excess demand (shortage):** When demand shifts right at a fixed supply, quantity demanded exceeds quantity supplied at the old price\n- **Price adjustment:** Sellers raise prices in response to the shortage until a new, higher equilibrium is reached\n\n> **Exam tip:** Distinguish a *shift* of the demand curve (caused by external factors) from a *movement along* it (caused by a price change itself).\n\n---\n\n**Question:** When demand increases and supply remains constant, price will ___?`,
                hints: ['Think of a shortage — sellers can charge more.'],
                solution_steps: [
                  'Excess demand at the original price bids price up until a new equilibrium is reached.',
                ],
                options: ['Fall', 'Rise', 'Stay the same', 'Become zero'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_DEMAND_AND_SUPPLY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 60000,
                correct_answer: 'Rise',
              },
              {
                question_number: 3,
                description:
                  'A cost that does not change regardless of the level of output is called ___.',
                hints: ['Rent and salaries are examples.'],
                solution_steps: [
                  'Fixed costs remain constant whether a firm produces 0 or 1000 units.',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_PRODUCTION_AND_COSTS],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 60000,
                correct_answer: 'Fixed cost',
              },
              {
                question_number: 4,
                description: 'GDP stands for ___.',
                hints: [
                  'It measures the total value of goods and services produced.',
                ],
                solution_steps: ['GDP = Gross Domestic Product.'],
                options: [
                  'Gross Domestic Product',
                  'Gross Development Plan',
                  'General Demand Price',
                  'Government Domestic Payment',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_NATIONAL_INCOME],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: 'Gross Domestic Product',
              },
              {
                question_number: 5,
                description: 'The primary function of money is ___.',
                hints: ['Without money, we rely on barter.'],
                solution_steps: [
                  'The primary function of money is to serve as a medium of exchange.',
                ],
                options: [
                  'Store of value',
                  'Standard of deferred payment',
                  'Medium of exchange',
                  'Unit of account',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_MONEY_AND_BANKING],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: 'Medium of exchange',
              },
            ],
          },
          {
            suiteTitle:
              'WASSCE Economics — International Trade, Public Finance & Banking',
            suiteDescription:
              '5 questions spanning International Trade, Public Finance, Economies of Scale, National Income and Money & Banking.',
            suiteKeywords: ['WASSCE', 'Economics', 'Trade', 'Finance'],
            questions: [
              {
                question_number: 1,
                description:
                  'The policy of protecting domestic industries from foreign competition through tariffs and quotas is called ___.',
                hints: ['It is the opposite of free trade.'],
                solution_steps: [
                  'Protectionism shields domestic industries from imports.',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_INTERNATIONAL_TRADE],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'Protectionism',
              },
              {
                question_number: 2,
                description:
                  "A tax system where the tax rate increases as the taxpayer's income increases is called ___.",
                hints: ['Higher earners pay a higher percentage.'],
                solution_steps: [
                  'A progressive tax increases with income; regressive does the opposite.',
                ],
                options: [
                  'Regressive tax',
                  'Proportional tax',
                  'Progressive tax',
                  'Flat tax',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_PUBLIC_FINANCE],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'Progressive tax',
              },
              {
                question_number: 3,
                description: `## Economics: Production — Economies of Scale\n\n![image](/v1/images/seed-sample-question.png)\n\n**Economies of scale** are the cost advantages a firm gains as it expands output — reducing average cost per unit even as total costs rise.\n\n### Key Concepts\n\n- **Internal economies:** Achieved within one firm — technical, managerial, financial, marketing, and risk-bearing\n- **External economies:** Arise from growth of the whole industry (shared infrastructure, skilled labour pools, supplier networks)\n- **Average cost falls** because fixed costs are spread over more units as output increases\n- **Geographic clustering:** Industries concentrate where external economies are strong (e.g. tech in Silicon Valley)\n- **Diseconomies of scale:** When a firm grows too large, average cost rises due to management inefficiency and communication breakdown\n\n> **Exam tip:** There is an *optimal* scale of production — beyond it, diseconomies set in and average cost starts rising again.\n\n---\n\n**Question:** Economies of scale refer to ___?`,
                hints: [
                  'Think about what happens to average cost as output increases.',
                ],
                solution_steps: [
                  'Economies of scale are cost advantages gained when a firm increases its output.',
                ],
                options: [
                  'Increasing costs as output rises',
                  'Cost advantages gained by increased output',
                  'Benefits of a small firm',
                  'The law of diminishing returns',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_PRODUCTION_AND_COSTS],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'Cost advantages gained by increased output',
              },
              {
                question_number: 4,
                description:
                  'Net National Product (NNP) is equal to GNP minus ___.',
                hints: ['Capital wears out over time.'],
                solution_steps: [
                  'NNP = GNP − Depreciation (Capital Consumption Allowance).',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_NATIONAL_INCOME],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'Depreciation',
              },
              {
                question_number: 5,
                description: 'The central bank of Ghana is ___.',
                hints: [
                  'It regulates monetary policy and the financial sector in Ghana.',
                ],
                solution_steps: [
                  'The Bank of Ghana is the central bank of Ghana.',
                ],
                options: [
                  'Ghana Commercial Bank',
                  'Ecobank Ghana',
                  'Bank of Ghana',
                  'Agricultural Development Bank',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_MONEY_AND_BANKING],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: 'Bank of Ghana',
              },
            ],
          },
        ],
        Geography: [
          {
            suiteTitle: 'WASSCE Geography — Physical & Human Geography',
            suiteDescription:
              '5 questions spanning Physical Geography, Human Geography and Regional Geography.',
            suiteKeywords: ['WASSCE', 'Geography', 'Physical', 'Human'],
            questions: [
              {
                question_number: 1,
                description: 'What is the largest desert in the world?',
                hints: ['It is located in North Africa.'],
                solution_steps: [
                  "The Sahara Desert in North Africa is the world's largest hot desert.",
                ],
                options: [
                  'Arabian Desert',
                  'Gobi Desert',
                  'Sahara Desert',
                  'Kalahari Desert',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_PHYSICAL_GEOGRAPHY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: 'Sahara Desert',
              },
              {
                question_number: 2,
                description:
                  'The process by which rocks are broken down by weather conditions is called ___.',
                hints: ['It does NOT involve movement of material.'],
                solution_steps: [
                  'Weathering is the in-situ breakdown of rocks by physical, chemical or biological agents.',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_PHYSICAL_GEOGRAPHY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: 'Weathering',
              },
              {
                question_number: 3,
                description:
                  'The movement of people from rural areas to urban areas is known as ___.',
                hints: ['People move seeking jobs and better services.'],
                solution_steps: [
                  'Rural-urban migration describes movement from the countryside to cities.',
                ],
                options: [
                  'Emigration',
                  'Rural-urban migration',
                  'Immigration',
                  'Counter-urbanisation',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_HUMAN_GEOGRAPHY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: 'Rural-urban migration',
              },
              {
                question_number: 4,
                description: `## Geography: Regional Geography of Africa\n\n![image](/v1/images/seed-sample-question.png)\n\nAfrica is the world's second-largest continent with 54 sovereign states, and the ranking of its countries by land area changed significantly in 2011 — a distinction that is regularly tested in WASSCE Geography.\n\n### Key Concepts\n\n- **Continent size:** Africa covers approximately 30.3 million km² and is second largest by area and population\n- **Post-2011 change:** When South Sudan seceded from Sudan in 2011, the political map of North Africa changed\n- **Largest country (post-2011):** Algeria (Maghreb region) — approximately 2.38 million km²\n- **Algeria's geography:** ~90% Sahara Desert (sparsely populated); fertile Mediterranean coastal strip in the north; leading gas and oil producer\n- **Common distractor:** Sudan was the largest before 2011 — candidates must know the post-2011 answer\n\n> **Exam tip:** If an exam asks for Africa's largest country, the answer is Algeria (post-2011) — not Sudan.\n\n---\n\n**Question:** Which is the largest country in Africa by land area?`,
                hints: [
                  'It is in North Africa and was formerly part of a larger country.',
                ],
                solution_steps: [
                  'Algeria is the largest country in Africa since South Sudan split Sudan.',
                ],
                options: [
                  'Sudan',
                  'Democratic Republic of Congo',
                  'Libya',
                  'Algeria',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_REGIONAL_GEOGRAPHY],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'Algeria',
              },
              {
                question_number: 5,
                description:
                  "Ghana's most important cash crop for export is ___.",
                hints: [
                  "Ghana is one of the world's leading producers of this crop.",
                ],
                solution_steps: [
                  "Cocoa is Ghana's primary cash crop and export commodity.",
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_ECONOMIC_GEOGRAPHY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: 'Cocoa',
              },
            ],
          },
          {
            suiteTitle:
              'WASSCE Geography — Map Reading, Rainfall & Economic Geography',
            suiteDescription:
              '5 questions covering Map Reading, Convectional Rainfall, Oceans, Regional Geography and Economic Geography.',
            suiteKeywords: ['WASSCE', 'Geography', 'Map', 'Economic'],
            questions: [
              {
                question_number: 1,
                description: `## Geography: Map Reading — Scale and Distance\n\n![image](/v1/images/seed-sample-question.png)\n\nUsing a map's **representative fraction (RF)** to calculate real-world distances is one of the most frequently tested map-reading skills in WASSCE Geography.\n\n### Key Concepts\n\n- **Representative fraction (RF):** A ratio like 1:50,000 — every 1 unit on the map equals 50,000 of the same unit on the ground\n- **Converting scale:** 1 cm on a 1:50,000 map = 50,000 cm = 500 m = 0.5 km on the ground\n- **Calculating actual distance:** Multiply map distance by the scale denominator, then convert units\n- **Large-scale maps (e.g. 1:1,000):** Show small areas in great detail — used for town planning and engineering\n- **Small-scale maps (e.g. 1:1,000,000):** Show large areas with less detail — used for regional or national planning\n\n> **Exam tip:** Always convert your answer to the most convenient unit (m or km) — leaving it in centimetres will lose marks.\n\n---\n\n**Question:** On a map with scale 1:50,000, a distance of 2 cm on the map represents what actual distance?`,
                hints: [
                  '1 cm = 50,000 cm on the ground.',
                  '50,000 cm = 0.5 km.',
                ],
                solution_steps: [
                  '2 cm × 50,000 = 100,000 cm = 1,000 m = 1 km.',
                ],
                options: ['500 m', '1 km', '2 km', '5 km'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_MAP_READING],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 90000,
                correct_answer: '1 km',
              },
              {
                question_number: 2,
                description:
                  'The type of rainfall commonly experienced in West Africa during summer is ___ rainfall.',
                hints: [
                  'Hot land heats the air above it, which rises and cools.',
                ],
                solution_steps: [
                  'Convectional rainfall results from intense surface heating causing warm air to rise, cool and condense.',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_PHYSICAL_GEOGRAPHY],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'Convectional rainfall',
              },
              {
                question_number: 3,
                description: 'The largest ocean in the world is the ___.',
                hints: ["It covers more than 30% of the Earth's surface."],
                solution_steps: [
                  'The Pacific Ocean is the largest and deepest ocean.',
                ],
                options: [
                  'Atlantic Ocean',
                  'Indian Ocean',
                  'Arctic Ocean',
                  'Pacific Ocean',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_PHYSICAL_GEOGRAPHY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: 'Pacific Ocean',
              },
              {
                question_number: 4,
                description:
                  'Lake Volta in Ghana was created by the construction of the ___.',
                hints: [
                  'This dam harnesses the Volta River for hydroelectric power.',
                ],
                solution_steps: [
                  "The Akosombo Dam, completed in 1965, created Lake Volta — one of the world's largest man-made lakes.",
                ],
                options: ['Bui Dam', 'Kpong Dam', 'Akosombo Dam', 'Volta Dam'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_REGIONAL_GEOGRAPHY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: 'Akosombo Dam',
              },
              {
                question_number: 5,
                description: 'The main mineral exported by Ghana is ___.',
                hints: ['Ghana was formerly known as the "Gold Coast".'],
                solution_steps: ["Gold is Ghana's leading mineral export."],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_ECONOMIC_GEOGRAPHY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: 'Gold',
              },
            ],
          },
        ],
        Literature: [
          {
            suiteTitle:
              'WASSCE Literature in English — Prose, Poetry & Drama Basics',
            suiteDescription:
              '5 questions spanning Prose (Fiction, Narration), Poetry (Alliteration, Sonnet) and Drama (Tragedy).',
            suiteKeywords: ['WASSCE', 'Literature', 'Prose', 'Poetry'],
            questions: [
              {
                question_number: 1,
                description:
                  'A story that is not based on real events is called ___.',
                hints: ['The opposite of non-fiction.'],
                solution_steps: [
                  'Fiction refers to imaginative narratives not based on real events.',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_PROSE],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: 'Fiction',
              },
              {
                question_number: 2,
                description:
                  'The repetition of consonant sounds at the beginning of closely linked words is called ___.',
                hints: [
                  '"Peter Piper picked a peck of pickled peppers" is a famous example.',
                ],
                solution_steps: [
                  'Alliteration is the repetition of initial consonant sounds.',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_POETRY],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'Alliteration',
              },
              {
                question_number: 3,
                description:
                  'A play that ends in the downfall or death of the hero is called ___.',
                hints: ['Romeo and Juliet is a classic example.'],
                solution_steps: [
                  'A tragedy ends unhappily, usually in the death or ruin of the protagonist.',
                ],
                options: ['Comedy', 'Farce', 'Tragedy', 'Satire'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_DRAMA],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: 'Tragedy',
              },
              {
                question_number: 4,
                description: `## Literature in English: Narrative Perspective\n\n![image](/v1/images/seed-sample-question.png)\n\nNarrative perspective — the vantage point from which a story is told — determines reader access, reliability, and intimacy, making it one of the most significant craft choices an author makes.\n\n### Key Concepts\n\n- **First person:** Narrator uses "I" and is a character in the story — immediate and immersive but potentially unreliable\n- **Second person:** Extremely rare — uses "you" to address the reader directly\n- **Third person omniscient:** Narrator knows all characters' thoughts and stands outside the story\n- **Third person limited:** Restricted to one character's viewpoint\n- **Unreliable narrator:** A first-person narrator who is self-deceived, biased, or withholding (e.g. Nick Carraway in *The Great Gatsby*)\n\n> **Exam tip:** First-person narration gains intimacy but loses objectivity — the narrator can only report what they personally experienced or were told.\n\n---\n\n**Question:** A narrator who refers to themselves as "I" and is a character in the story is called a ___.`,
                hints: ['They speak from inside the story.'],
                solution_steps: [
                  'A first-person narrator participates in events and uses "I".',
                ],
                options: [
                  'Third-person narrator',
                  'Omniscient narrator',
                  'First-person narrator',
                  'Unreliable narrator',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_PROSE],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'First-person narrator',
              },
              {
                question_number: 5,
                description:
                  'A poem consisting of exactly fourteen lines is called a ___.',
                hints: ['Shakespeare wrote many of these.'],
                solution_steps: [
                  'A sonnet has exactly 14 lines, typically in iambic pentameter.',
                ],
                options: ['Haiku', 'Ode', 'Sonnet', 'Ballad'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_POETRY],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'Sonnet',
              },
            ],
          },
          {
            suiteTitle:
              'WASSCE Literature in English — Drama Techniques & Advanced Devices',
            suiteDescription:
              '5 questions covering dramatic plot, simile, protagonist, soliloquy and assonance.',
            suiteKeywords: ['WASSCE', 'Literature', 'Drama', 'Devices'],
            questions: [
              {
                question_number: 1,
                description:
                  'The turning point or highest point of tension in a dramatic plot is called ___.',
                hints: [
                  'It is where things change direction for the protagonist.',
                ],
                solution_steps: [
                  'The climax is the peak of conflict and tension in a play or story.',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_DRAMA],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'Climax',
              },
              {
                question_number: 2,
                description:
                  'A comparison of two unlike things using "like" or "as" is called a ___.',
                hints: ['"As brave as a lion" — which device is this?'],
                solution_steps: [
                  'A simile makes a comparison using "like" or "as"; a metaphor does so without.',
                ],
                options: ['Metaphor', 'Simile', 'Personification', 'Hyperbole'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_POETRY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: 'Simile',
              },
              {
                question_number: 3,
                description:
                  'The central character in a story who drives the plot forward is called the ___.',
                hints: ['They are usually the hero or main character.'],
                solution_steps: [
                  'The protagonist is the main character; the antagonist opposes them.',
                ],
                options: ['Antagonist', 'Foil', 'Protagonist', 'Narrator'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_PROSE],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: 'Protagonist',
              },
              {
                question_number: 4,
                description: `## Literature: Dramatic Devices — The Soliloquy\n\n![image](/v1/images/seed-sample-question.png)\n\nPlaywrights use specialised theatrical devices to reveal characters' interior lives to an audience that can only observe external action — and the **soliloquy** is the most direct of these.\n\n### Key Concepts\n\n- **Soliloquy:** A character speaks their private thoughts aloud while alone on stage (or believing themselves unobserved) — addressed to the audience, not other characters\n- **Monologue:** A long speech delivered *to* other characters who are present on stage\n- **Aside:** A brief remark to the audience while other characters remain on stage but cannot hear it by convention\n- **Power of the soliloquy:** No other character is present to be deceived, so the audience accepts it as a truthful window into the speaker's soul\n- **Famous examples:** Hamlet's "To be or not to be" and Macbeth's dagger hallucination\n\n> **Exam tip:** The key distinction — soliloquy = alone on stage; monologue = speaking to others present; aside = brief, overheard only by the audience.\n\n---\n\n**Question:** When a character in a play speaks their thoughts aloud while alone on stage, this is called a ___.`,
                hints: ['It allows the audience to hear private thoughts.'],
                solution_steps: [
                  'A soliloquy is a dramatic device where a character voices inner thoughts to the audience.',
                ],
                options: ['Dialogue', 'Monologue', 'Soliloquy', 'Aside'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_DRAMA],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'Soliloquy',
              },
              {
                question_number: 5,
                description:
                  'The repetition of vowel sounds in closely placed words, e.g. "the rain in Spain", is called ___.',
                hints: [
                  'It involves vowel sounds, not consonant sounds at the start.',
                ],
                solution_steps: [
                  'Assonance is the repetition of vowel sounds within nearby words.',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_POETRY],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'Assonance',
              },
            ],
          },
        ],
        Government: [
          {
            suiteTitle:
              'WASSCE Government — Constitution, Democratic Institutions & Independence',
            suiteDescription:
              "5 questions spanning the Constitution, Democratic Institutions and Ghana's Political History.",
            suiteKeywords: ['WASSCE', 'Government', 'Constitution'],
            questions: [
              {
                question_number: 1,
                description: 'The supreme law of Ghana is ___.',
                hints: ['All other laws must conform to it.'],
                solution_steps: [
                  'The Constitution of Ghana is the supreme law; any law inconsistent with it is void.',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_CONSTITUTION_AND_LAW],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: 'The Constitution',
              },
              {
                question_number: 2,
                description: `## Government: Ghana's Presidential System\n\n![image](/v1/images/seed-sample-question.png)\n\nGhana operates under a **presidential system of government**, as established by the 1992 Fourth Republican Constitution, in which the executive power of the state is concentrated in a single directly elected official who serves simultaneously as the ceremonial head of state, the political head of government, and the commander-in-chief of the armed forces — a combination of roles that exists in most presidential systems and sharply distinguishes them from **parliamentary systems** (such as the United Kingdom) where the head of state (monarch or president) is a separate figure from the head of government (prime minister). The President of Ghana is elected directly by the Ghanaian people through a national popular vote and must obtain more than 50% of valid votes cast to win outright; if no candidate achieves this in the first round, a run-off between the top two candidates is conducted, and the winner serves a four-year term renewable once, meaning no individual can serve more than eight years in total as president under the 1992 Constitution. This structural design — with the President as both head of state and head of government, directly accountable to voters rather than to Parliament — is a defining feature of Ghana's constitutional architecture and contrasts with the roles of the Speaker of Parliament (who presides over the legislature), the Chief Justice (who heads the judiciary), and the Vice President (who assumes presidential duties if the presidency becomes vacant).\n\nThe head of state and government in Ghana is ___.`,
                hints: ['Ghana operates a presidential system.'],
                solution_steps: [
                  "Under Ghana's 1992 Constitution, the President is both head of state and head of government.",
                ],
                options: [
                  'The Speaker of Parliament',
                  'The Chief Justice',
                  'The President',
                  'The Prime Minister',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_DEMOCRATIC_INSTITUTIONS],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: 'The President',
              },
              {
                question_number: 3,
                description:
                  'Select **all** that are arms of government in Ghana.',
                hints: [
                  'Think of who makes, executes, and interprets the law.',
                ],
                solution_steps: [
                  'Legislature (makes laws), Executive (enforces laws), Judiciary (interprets laws).',
                ],
                options: [
                  'The Legislature',
                  'The Executive',
                  'The Judiciary',
                  'The Military',
                  'The Police Service',
                ],
                type: QuestionType.MULTIPLE_SELECT,
                tags: [QuestionTagType.TAG_GOVERNMENT_AND_CITIZENSHIP],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: 'The Legislature,The Executive,The Judiciary',
              },
              {
                question_number: 4,
                description: `## Government: Ghana's Constitutional History\n\n![image](/v1/images/seed-sample-question.png)\n\nGhana's constitutional development since independence in 1957 has been characterised by alternating periods of democratic civilian rule and military intervention, each associated with a different constitutional document: the First Republic operated under the 1960 Constitution; the Second Republic (1969–1972) was governed by the 1969 Constitution under Prime Minister Kofi Busia; and the Third Republic, abruptly ended by the military coup of 31 December 1981, operated briefly under the 1979 Constitution. The transition to the **Fourth Republic** began with a Consultative Assembly that drafted a new constitution in 1991–1992, which was then submitted to a national referendum on 28 April 1992 and approved by a majority of Ghanaian voters; the new Constitution formally came into force on 7 January 1993 when President Jerry John Rawlings, having won the November 1992 presidential election, was inaugurated, marking the beginning of Ghana's longest uninterrupted period of democratic multiparty governance. The 1992 Constitution established a strong presidential system, a unicameral Parliament, an independent judiciary, a Council of State, and numerous independent constitutional bodies including the Electoral Commission and the Commission on Human Rights and Administrative Justice (CHRAJ), making it a comprehensive framework for democratic governance that has served as the foundation of Ghana's political stability for over three decades.\n\nGhana's current constitution was adopted in ___.`,
                hints: [
                  'It followed a referendum and ushered in the Fourth Republic.',
                ],
                solution_steps: [
                  "Ghana's Fourth Republican Constitution was adopted in 1992.",
                ],
                options: ['1957', '1966', '1979', '1992'],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_CONSTITUTION_AND_LAW],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: '1992',
              },
              {
                question_number: 5,
                description: 'Ghana achieved independence from Britain in ___.',
                hints: [
                  'It was the first sub-Saharan African country to gain independence.',
                ],
                solution_steps: [
                  'Ghana declared independence on 6th March 1957.',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_GHANA_POLITICAL_HISTORY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: '1957',
              },
              {
                question_number: 6,
                description:
                  'The body responsible for conducting elections in Ghana is the ___.',
                hints: ['It is an independent constitutional body.'],
                solution_steps: [
                  'The Electoral Commission (EC) of Ghana organises and supervises all public elections.',
                ],
                options: [
                  'Ghana Police Service',
                  'National Commission for Civic Education',
                  'Electoral Commission',
                  'Parliament of Ghana',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_DEMOCRATIC_INSTITUTIONS],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: 'Electoral Commission',
              },
            ],
          },
          {
            suiteTitle:
              'WASSCE Government — Elections, Federal Systems & Ghana Regions',
            suiteDescription:
              "5 questions spanning Electoral Commission, Federalism, Voting Age and Ghana's administrative regions.",
            suiteKeywords: ['WASSCE', 'Government', 'Elections', 'Federalism'],
            questions: [
              {
                question_number: 1,
                description:
                  'A system of government in which power is shared between a central government and regional units is called ___.',
                hints: ['The USA and Nigeria are examples.'],
                solution_steps: [
                  'Federalism divides sovereignty between central and regional governments.',
                ],
                options: [
                  'Unitary system',
                  'Confederation',
                  'Federalism',
                  'Monarchy',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_GOVERNMENT_AND_CITIZENSHIP],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'Federalism',
              },
              {
                question_number: 2,
                description: 'The minimum voting age in Ghana is ___.',
                hints: ['Check the Constitution.'],
                solution_steps: [
                  "Article 42 of Ghana's 1992 Constitution sets the voting age at 18.",
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_CONSTITUTION_AND_LAW],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: '18',
              },
              {
                question_number: 3,
                description: `## Government: Ghana's Political History — First President\n\n![image](/v1/images/seed-sample-question.png)\n\nDr. **Kwame Nkrumah** was one of the most significant political figures in twentieth-century African history, combining the roles of nationalist agitator, independence negotiator, founding statesman, and Pan-Africanist ideologue into a single career that began with his return to the Gold Coast in 1947 to become General Secretary of the United Gold Coast Convention (UGCC) and culminated in his leadership of Ghana as the first sub-Saharan African country to achieve independence from colonial rule; he broke away from the UGCC in 1949 to found his own party, the **Convention People's Party (CPP)**, which mobilised mass popular support through strikes, boycotts, and Positive Action campaigns, resulting in his election as Prime Minister in 1952 even while briefly imprisoned by the British. Ghana became independent on 6 March 1957 with Nkrumah as Prime Minister, and in 1960 a republican constitution transformed the country into a republic, making Nkrumah its **first President** — a position he used to pursue his vision of a socialist, pan-African Ghana, establishing state enterprises, building the Akosombo Dam, and championing the Organisation of African Unity (OAU) founded in 1963, before being overthrown in a military coup on 24 February 1966. Students must be careful to distinguish Nkrumah's two roles: he was Prime Minister at independence in 1957 and became President only in 1960 when Ghana became a republic, a distinction that is regularly tested in WASSCE Government and History examinations.\n\nThe first President of Ghana was ___.`,
                hints: [
                  'He was also the independence leader and founder of the CPP.',
                ],
                solution_steps: [
                  "Dr. Kwame Nkrumah became Ghana's first Prime Minister (1957) and then first President (1960).",
                ],
                options: [
                  'J.B. Danquah',
                  'Kofi Abrefa Busia',
                  'Kwame Nkrumah',
                  'Hilla Limann',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_GHANA_POLITICAL_HISTORY],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: 'Kwame Nkrumah',
              },
              {
                question_number: 4,
                description: 'As of 2019, Ghana has ___ regions.',
                hints: [
                  'Six new regions were created from existing ones in 2019.',
                ],
                solution_steps: [
                  'Ghana was divided into 16 regions after the 2018 referendum created 6 new regions.',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_DEMOCRATIC_INSTITUTIONS],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: '16',
              },
            ],
          },
        ],
        History: [
          {
            suiteTitle:
              'WASSCE History — Pre-colonial Africa & Independence Movements',
            suiteDescription:
              '5 questions spanning Pre-colonial Africa, the Colonial Period and Independence Movements.',
            suiteKeywords: ['WASSCE', 'History', 'Ghana', 'Colonial'],
            questions: [
              {
                question_number: 1,
                description: `## History: Pre-colonial Africa — The Ashanti Kingdom\n\n![image](/v1/images/seed-sample-question.png)\n\nThe Ashanti Kingdom, known formally as the **Asante Empire**, was one of the most powerful and sophisticated pre-colonial states in West Africa, emerging in the late seventeenth century from the forest zone of present-day Ghana through a process of political consolidation led by the Oyoko clan of Kumasi, and its founding is attributed to **Osei Tutu I**, who reigned from approximately 1695 to 1717 and unified the previously fragmented Akan states into a single confederacy; the unification was symbolised and legitimised by the **Golden Stool (Sika Dwa)**, which the priest and political strategist **Okomfo Anokye** is said to have called down from the heavens and declared to be the repository of the soul (*sunsum*) of the Ashanti nation, making political authority and national identity inseparable from this sacred object. Under Osei Tutu I and his successors, the Ashanti Kingdom expanded significantly through military conquest and diplomacy, establishing control over major trade routes in gold and kola nuts to the north and European-traded goods to the south, and developing sophisticated administrative institutions including the division of the state into territorial units (*oman*), a system of chiefs with defined roles, and the Great Council (*Asantemanhyiamu*) which included the heads of all constituent states. The Ashanti Kingdom successfully resisted British colonial encroachment for much of the nineteenth century through a series of Anglo-Ashanti Wars, finally being incorporated into the British Gold Coast Colony in 1902, and its cultural and political legacy remains central to Ghanaian national identity today.\n\nThe Ashanti Kingdom was founded by ___.`,
                hints: [
                  'He united the Akan states with the help of the Golden Stool.',
                ],
                solution_steps: [
                  'Osei Tutu I, together with the priest Okomfo Anokye, founded the Ashanti Kingdom around 1701.',
                ],
                options: [
                  'Opoku Ware I',
                  'Osei Tutu I',
                  'Prempeh I',
                  'Agyeman Prempeh',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_PRECOLONIAL_AFRICA],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'Osei Tutu I',
              },
              {
                question_number: 2,
                description:
                  'The conference at which European powers formally divided Africa among themselves was held in ___.',
                hints: ['It took place in the 1880s in Germany.'],
                solution_steps: [
                  'The Berlin Conference of 1884–1885 formalised the "Scramble for Africa".',
                ],
                options: [
                  'London, 1870',
                  'Paris, 1880',
                  'Berlin, 1884–1885',
                  'Brussels, 1890',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_COLONIAL_PERIOD],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'Berlin, 1884–1885',
              },
              {
                question_number: 3,
                description: 'The Gold Coast (Ghana) was colonised by ___.',
                hints: ["English is Ghana's official language."],
                solution_steps: [
                  'Britain colonised the Gold Coast, making it a British Crown Colony.',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_COLONIAL_PERIOD],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: 'Britain',
              },
              {
                question_number: 4,
                description: 'Ghana declared independence on ___.',
                hints: [
                  'It was the first sub-Saharan African country to gain independence.',
                ],
                solution_steps: [
                  "Ghana's independence was declared on 6th March 1957.",
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_INDEPENDENCE_MOVEMENTS],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: '6th March 1957',
              },
              {
                question_number: 5,
                description:
                  "Who led the movement for Ghana's independence and became its first Prime Minister?",
                hints: ["He founded the Convention People's Party (CPP)."],
                solution_steps: [
                  "Dr. Kwame Nkrumah led the CPP and negotiated Ghana's independence from Britain.",
                ],
                options: [
                  'J.B. Danquah',
                  'Kwame Nkrumah',
                  'Kofi Abrefa Busia',
                  'Edward Akufo-Addo',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_INDEPENDENCE_MOVEMENTS],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 30000,
                correct_answer: 'Kwame Nkrumah',
              },
            ],
          },
          {
            suiteTitle:
              'WASSCE History — Ghana Political History & Pre-colonial Trade',
            suiteDescription:
              "5 questions covering Ghana's Political History, Culture and Pre-colonial African Empires.",
            suiteKeywords: ['WASSCE', 'History', 'Ghana', 'Empire'],
            questions: [
              {
                question_number: 1,
                description:
                  "The military coup that overthrew Nkrumah's government occurred in ___.",
                hints: ['Nkrumah was on a visit abroad when it happened.'],
                solution_steps: [
                  'The National Liberation Council (NLC) overthrew Nkrumah on 24 February 1966.',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_GHANA_POLITICAL_HISTORY],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: '1966',
              },
              {
                question_number: 2,
                description:
                  'The traditional political symbol of the Ashanti Kingdom is the ___.',
                hints: ['Legend says it descended from the sky.'],
                solution_steps: [
                  'The Golden Stool (Sika Dwa) is the sacred symbol of the soul and unity of the Ashanti people.',
                ],
                options: [],
                type: QuestionType.FILL_IN,
                tags: [QuestionTagType.TAG_CULTURE_AND_VALUES],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 45000,
                correct_answer: 'Golden Stool',
              },
              {
                question_number: 3,
                description: `## History: Pre-colonial Africa — The Trans-Saharan Trade\n\n![image](/v1/images/seed-sample-question.png)\n\nThe trans-Saharan trade network was one of the most consequential economic and cultural exchange systems in pre-colonial African history, operating for more than a thousand years from roughly the third century CE through the nineteenth century, and it linked the prosperous savanna empires of West Africa — Ghana, Mali, and Songhai — with the Berber and Arab merchants of North Africa who then connected West African goods to Mediterranean and Middle Eastern markets; the two most important commodities driving this trade were **gold**, which was mined in abundance in the Bambuk and Bure goldfields of the western Sudan and was highly prized throughout the Islamic and European worlds, and **salt**, which was extracted from the mines of Taghaza in the Sahara and was critically needed by West African populations, giving it equal or sometimes greater value than gold in certain markets. The trade routes crossed the Sahara Desert using **camel caravans** following established paths that linked oasis towns such as Timbuktu (a major entrepôt), Djenné, and Gao, and the wealth generated by taxing this trade funded the rise of powerful empires and city-states, stimulated the spread of Islam across West Africa through the movement of Muslim merchants and scholars, and produced remarkable cultural and architectural achievements such as the mud-brick mosques and manuscript libraries of Timbuktu. The trans-Saharan trade thus primarily connected **North Africa** with **West Africa**, and understanding its role in the rise and fall of West African empires is a core requirement of the WASSCE History syllabus.\n\nThe trans-Saharan trade route primarily connected ___.`,
                hints: [
                  'It crossed the Sahara Desert linking two broad regions.',
                ],
                solution_steps: [
                  'The trans-Saharan trade linked North Africa with West Africa, exchanging gold and slaves for salt and manufactured goods.',
                ],
                options: [
                  'East Africa and Southern Africa',
                  'North Africa and West Africa',
                  'West Africa and East Africa',
                  'Central Africa and North Africa',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_PRECOLONIAL_AFRICA],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'North Africa and West Africa',
              },
              {
                question_number: 4,
                description:
                  'Under colonialism, the practice of compelling Africans to work without pay for colonial governments or settlers was called ___.',
                hints: [
                  'It was widely used on plantations and infrastructure projects.',
                ],
                solution_steps: [
                  'Forced labour (compulsory labour) was a common colonial policy across Africa.',
                ],
                options: [
                  'Serfdom',
                  'Indenture',
                  'Forced labour',
                  'Sharecropping',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_COLONIAL_PERIOD],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'Forced labour',
              },
              {
                question_number: 5,
                description:
                  'The largest pre-colonial empire in West Africa, known for its gold and salt trade, was the ___.',
                hints: [
                  'It succeeded the Mali Empire and its capital was Gao.',
                ],
                solution_steps: [
                  'The Songhai Empire (15th–16th century) was the largest empire in West African history.',
                ],
                options: [
                  'Ghana Empire',
                  'Mali Empire',
                  'Songhai Empire',
                  'Benin Kingdom',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_PRECOLONIAL_AFRICA],
                difficulty: QuestionDifficultyType.MEDIUM,
                estimated_time_in_ms: 60000,
                correct_answer: 'Songhai Empire',
              },
            ],
          },
        ],
      };

      const new_wassce_course_version_questions: Question[][] =
        await Promise.all(
          new_wassce_course_versions.map(async (version) => {
            const courseTitle = version.course.title;
            const suites = courseQuestionsMap[courseTitle];
            const subjectImageUrl =
              subjectImageUrls[courseTitle] ||
              subjectImageUrls['Mathematics'];

            const allQuestions: Question[] = [];

            for (const suiteData of suites) {
              const new_suite = new TestSuite();
              new_suite.title = suiteData.suiteTitle;
              new_suite.description = suiteData.suiteDescription;
              new_suite.keywords = suiteData.suiteKeywords;
              new_suite.course_version = version;

              await this.testSuiteRepository.save(new_suite);

              const new_questions: Question[] = await Promise.all(
                suiteData.questions.map(async (question) => {
                  const new_question = new Question();
                  new_question.correct_answer = question.correct_answer;
                  new_question.description = question.description.replace(
                    '/v1/images/seed-sample-question.png',
                    subjectImageUrl,
                  );
                  new_question.difficulty = question.difficulty;
                  new_question.estimated_time_in_ms =
                    question.estimated_time_in_ms;
                  new_question.hints = question.hints;
                  new_question.options = question.options;
                  new_question.question_number = question.question_number;
                  new_question.solution_steps = question.solution_steps;
                  new_question.tags = question.tags;
                  new_question.type = question.type;
                  new_question.version = version;
                  new_question.test_suite = new_suite;

                  return new_question;
                }),
              );

              allQuestions.push(...new_questions);
            }

            return allQuestions;
          }),
        );

      await this.questionRepository.save(
        new_wassce_course_version_questions.flat(),
      );

      /** Step Three
       * (1) Admin should create a category
       * (2) Admin should add course to category
       */
      const categories = [
        'WAEC / WASSCE',
        'JAMB / UTME',
        'BECE',
        'SAT / A-Levels',
        'University Exams',
        'General Study',
      ];

      const new_categories: Category[] = await Promise.all(
        categories.map(async (category_name) => {
          const category = new Category();
          category.avatar_url = 'https://example.com/avatar.jpg';
          category.name = category_name;
          category.organization = organization;
          category.courses = new_wassce_courses;

          return category;
        }),
      );

      await this.categoryRepository.save([...new_categories]);

      return 'Done!';
    } catch (err) {
      console.log(err);
    }
  }
}
