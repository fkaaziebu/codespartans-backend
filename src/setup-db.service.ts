import { Repository } from 'typeorm';
import {
  Admin,
  Cart,
  Category,
  Course,
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

      // await this.versionRepository.save(new_wassce_course_versions);

      const courseQuestionsMap: Record<
        string,
        {
          suiteTitle: string;
          suiteDescription: string;
          suiteKeywords: string[];
          questions: QuestionInput[];
        }
      > = {
        Mathematics: {
          suiteTitle: 'WASSCE Mathematics — Core Paper 1',
          suiteDescription:
            '10 questions spanning Algebra, Number, Geometry, Trigonometry, Mensuration, Statistics and Sets.',
          suiteKeywords: ['WASSCE', 'Mathematics', 'Core'],
          questions: [
            {
              question_number: 1,
              description: 'Solve: 2x + 6 = 14',
              hints: ['Subtract 6 from both sides.', '2x = 8.', 'Divide by 2.'],
              solution_steps: ['2x + 6 = 14', '2x = 8', 'x = 4'],
              options: ['x = 3', 'x = 4', 'x = 5', 'x = 2'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_ALGEBRA],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 60000,
              correct_answer: 'x = 4',
            },
            {
              question_number: 2,
              description: 'Factorize: x² − 5x + 6',
              hints: [
                'Find two numbers with product 6 and sum −5.',
                'They are −2 and −3.',
              ],
              solution_steps: ['x² − 5x + 6 = (x − 2)(x − 3)'],
              options: [
                '(x + 2)(x + 3)',
                '(x − 2)(x − 3)',
                '(x + 1)(x − 6)',
                '(x − 1)(x − 6)',
              ],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_ALGEBRA],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 90000,
              correct_answer: '(x − 2)(x − 3)',
            },
            {
              question_number: 3,
              description: 'Find the HCF of 24 and 36.',
              hints: [
                'List factors of each number.',
                '24: 1,2,3,4,6,8,12,24 and 36: 1,2,3,4,6,9,12,18,36.',
              ],
              solution_steps: [
                'Factors of 24: 1,2,3,4,6,8,12,24',
                'Factors of 36: 1,2,3,4,6,9,12,18,36',
                'HCF = 12',
              ],
              options: ['6', '8', '12', '18'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_NUMBER_AND_NUMERATION],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 60000,
              correct_answer: '12',
            },
            {
              question_number: 4,
              description: 'Express 0.00045 in standard form.',
              hints: ['Move the decimal point until one non-zero digit is before it.'],
              solution_steps: ['0.00045 = 4.5 × 10⁻⁴'],
              options: ['4.5 × 10⁻³', '4.5 × 10⁻⁴', '4.5 × 10⁻⁵', '45 × 10⁻⁵'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_NUMBER_AND_NUMERATION],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 60000,
              correct_answer: '4.5 × 10⁻⁴',
            },
            {
              question_number: 5,
              description:
                'The angles of a triangle are in the ratio 1:2:3. Find the largest angle.',
              hints: ['Angles sum to 180°.', 'Largest share is 3 parts out of 6.'],
              solution_steps: ['Total parts = 6', '(3/6) × 180° = 90°'],
              options: ['30°', '60°', '90°', '120°'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_GEOMETRY],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 60000,
              correct_answer: '90°',
            },
            {
              question_number: 6,
              description: 'Find the exact value of sin 30°.',
              hints: ['Recall the special angle table.'],
              solution_steps: ['sin 30° = 1/2'],
              options: ['√3/2', '1/2', '√2/2', '1'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_TRIGONOMETRY],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 45000,
              correct_answer: '1/2',
            },
            {
              question_number: 7,
              description:
                'Find the area of a circle with radius 7 cm. (Take π = 22/7)',
              hints: ['Area = πr².'],
              solution_steps: ['A = (22/7) × 7² = (22/7) × 49 = 154 cm²'],
              options: ['44 cm²', '154 cm²', '22 cm²', '308 cm²'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_MENSURATION],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 60000,
              correct_answer: '154 cm²',
            },
            {
              question_number: 8,
              description:
                'The mean of the numbers 5, 8, x, 12, and 10 is 9. Find x.',
              hints: ['Sum = mean × count.', 'Sum = 9 × 5 = 45.'],
              solution_steps: [
                '5 + 8 + x + 12 + 10 = 45',
                '35 + x = 45',
                'x = 10',
              ],
              options: ['8', '9', '10', '11'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_STATISTICS_AND_PROBABILITY],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 90000,
              correct_answer: '10',
            },
            {
              question_number: 9,
              description:
                'If n(A) = 12, n(B) = 8 and n(A ∩ B) = 4, find n(A ∪ B).',
              hints: ['Use: n(A ∪ B) = n(A) + n(B) − n(A ∩ B).'],
              solution_steps: ['n(A ∪ B) = 12 + 8 − 4 = 16'],
              options: ['12', '14', '16', '20'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_SETS],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 90000,
              correct_answer: '16',
            },
            {
              question_number: 10,
              description: 'Make r the subject of the formula: V = πr²h',
              hints: ['Divide both sides by πh.', 'Take the square root.'],
              solution_steps: ['r² = V/(πh)', 'r = √(V/πh)'],
              options: ['r = V/(πh)', 'r = √(V/πh)', 'r = V²/(πh)', 'r = πh/V'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_ALGEBRA],
              difficulty: QuestionDifficultyType.HARD,
              estimated_time_in_ms: 120000,
              correct_answer: 'r = √(V/πh)',
            },
          ],
        },
        'English Language': {
          suiteTitle: 'WASSCE English Language — Paper 1',
          suiteDescription:
            '10 questions spanning Grammar, Vocabulary, Reading Comprehension and Oral English.',
          suiteKeywords: ['WASSCE', 'English', 'Language'],
          questions: [
            {
              question_number: 1,
              description:
                'Choose the grammatically correct sentence.',
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
              description:
                'Identify the figure of speech in: "The wind whispered through the trees."',
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
              options: ['criterions', 'criterias', 'criteria', 'criterium'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_GRAMMAR_AND_USAGE],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 45000,
              correct_answer: 'criteria',
            },
            {
              question_number: 5,
              description: 'Which word is a synonym of "laconic"?',
              hints: ['"Laconic" describes a style of speaking.'],
              solution_steps: [
                '"Laconic" means using very few words — synonym: concise.',
              ],
              options: ['Wordy', 'Concise', 'Eloquent', 'Verbose'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_VOCABULARY],
              difficulty: QuestionDifficultyType.HARD,
              estimated_time_in_ms: 60000,
              correct_answer: 'Concise',
            },
            {
              question_number: 6,
              description:
                'Choose the word that best completes the sentence: "The committee ___ yet to reach a decision."',
              hints: ['Is "committee" treated as singular or plural in formal English?'],
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
              question_number: 7,
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
              question_number: 8,
              description: 'What is the antonym of "benevolent"?',
              hints: ['"Benevolent" means kind and generous.'],
              solution_steps: [
                'The opposite of benevolent (kind) is malevolent (wishing harm).',
              ],
              options: ['Generous', 'Malevolent', 'Charitable', 'Humble'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_VOCABULARY],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 60000,
              correct_answer: 'Malevolent',
            },
            {
              question_number: 9,
              description:
                'Which sentence uses the passive voice correctly?',
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
              question_number: 10,
              description:
                'Which word has the stress on the SECOND syllable when used as a verb: "record"?',
              hints: [
                'In English, many two-syllable nouns stress the first syllable and verbs the second.',
              ],
              solution_steps: [
                'Noun: RE-cord (stress on 1st). Verb: re-CORD (stress on 2nd).',
              ],
              options: ['RE-cord', 're-CORD', 'Both have the same stress', 'Neither'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_ORAL_ENGLISH],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 60000,
              correct_answer: 're-CORD',
            },
          ],
        },
        Physics: {
          suiteTitle: 'WASSCE Physics — Paper 1',
          suiteDescription:
            '10 questions spanning Mechanics, Waves, Electricity, Heat, Atomic Physics and Measurement.',
          suiteKeywords: ['WASSCE', 'Physics'],
          questions: [
            {
              question_number: 1,
              description:
                'A body of mass 5 kg is acted on by a net force of 20 N. Find its acceleration.',
              hints: ['Use Newton\'s second law: F = ma.'],
              solution_steps: ['a = F/m = 20/5 = 4 m/s²'],
              options: ['2 m/s²', '4 m/s²', '10 m/s²', '100 m/s²'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_MECHANICS],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 60000,
              correct_answer: '4 m/s²',
            },
            {
              question_number: 2,
              description: 'A car travels 120 km in 2 hours. Find its average speed.',
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
              options: ['Transverse', 'Longitudinal', 'Electromagnetic', 'Surface'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_WAVES_AND_OPTICS],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 45000,
              correct_answer: 'Longitudinal',
            },
            {
              question_number: 4,
              description:
                'Three 6 Ω resistors are connected in parallel. Find the total resistance.',
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
              description: 'Convert 100°C to Kelvin.',
              hints: ['K = °C + 273.'],
              solution_steps: ['K = 100 + 273 = 373 K'],
              options: ['273 K', '373 K', '100 K', '473 K'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_HEAT_AND_THERMODYNAMICS],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 45000,
              correct_answer: '373 K',
            },
            {
              question_number: 6,
              description:
                'A body is thrown vertically upward with an initial velocity of 20 m/s. Find the maximum height reached. (g = 10 m/s²)',
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
              question_number: 7,
              description:
                'Using Ohm\'s law, if V = 12 V and R = 4 Ω, find the current I.',
              hints: ['Ohm\'s law: V = IR.'],
              solution_steps: ['I = V/R = 12/4 = 3 A'],
              options: ['1 A', '2 A', '3 A', '48 A'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_ELECTRICITY_AND_MAGNETISM],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 45000,
              correct_answer: '3 A',
            },
            {
              question_number: 8,
              description:
                'Which particle determines the atomic number of an element?',
              hints: ['Atomic number = number of a specific particle in the nucleus.'],
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
              question_number: 9,
              description: 'The SI unit of power is ___.',
              hints: ['Power = Work done / Time.'],
              solution_steps: ['The SI unit of power is the Watt (W).'],
              options: ['Joule', 'Newton', 'Watt', 'Pascal'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_MEASUREMENT],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 30000,
              correct_answer: 'Watt',
            },
            {
              question_number: 10,
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
        Chemistry: {
          suiteTitle: 'WASSCE Chemistry — Paper 1',
          suiteDescription:
            '10 questions spanning Atomic Structure, Periodic Table, Bonding, Acids/Bases, Stoichiometry, Organic Chemistry and Electrochemistry.',
          suiteKeywords: ['WASSCE', 'Chemistry'],
          questions: [
            {
              question_number: 1,
              description: 'What is the atomic number of Carbon?',
              hints: ['Atomic number = number of protons.'],
              solution_steps: ['Carbon has 6 protons, so its atomic number is 6.'],
              options: ['4', '6', '8', '12'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_ATOMIC_STRUCTURE],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 30000,
              correct_answer: '6',
            },
            {
              question_number: 2,
              description: 'Noble gases are found in which group of the periodic table?',
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
              options: ['Ionic bond', 'Covalent bond', 'Metallic bond', 'Hydrogen bond'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_CHEMICAL_BONDING],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 45000,
              correct_answer: 'Covalent bond',
            },
            {
              question_number: 4,
              description: 'What is the pH of a neutral solution?',
              hints: ['The pH scale runs from 0 to 14.'],
              solution_steps: ['A neutral solution has pH = 7.'],
              options: ['0', '7', '10', '14'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_ACIDS_BASES_AND_SALTS],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 30000,
              correct_answer: '7',
            },
            {
              question_number: 5,
              description: 'How many moles of H₂O are contained in 36 g of water? (H = 1, O = 16)',
              hints: ['Moles = mass / molar mass.', 'Molar mass of H₂O = 18 g/mol.'],
              solution_steps: ['Moles = 36/18 = 2 mol'],
              options: ['1', '2', '3', '4'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_STOICHIOMETRY],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 90000,
              correct_answer: '2',
            },
            {
              question_number: 6,
              description: 'What is the functional group of alcohols?',
              hints: ['Alcohols contain a hydroxyl group.'],
              solution_steps: ['The functional group of alcohols is −OH (hydroxyl).'],
              options: ['−COOH', '−CHO', '−OH', '−CO−'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_ORGANIC_CHEMISTRY],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 45000,
              correct_answer: '−OH',
            },
            {
              question_number: 7,
              description:
                'During electrolysis, oxidation occurs at the ___.',
              hints: ['OIL RIG: Oxidation Is Loss, Reduction Is Gain.', 'Anode vs. cathode.'],
              solution_steps: ['Oxidation (loss of electrons) occurs at the anode.'],
              options: ['Cathode', 'Anode', 'Electrolyte', 'Salt bridge'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_ELECTROCHEMISTRY],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 60000,
              correct_answer: 'Anode',
            },
            {
              question_number: 8,
              description:
                'Approximately what percentage of dry air is nitrogen?',
              hints: ['Nitrogen is the most abundant gas in the atmosphere.'],
              solution_steps: ['Dry air is approximately 78% nitrogen.'],
              options: ['21%', '50%', '78%', '95%'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_AIR_AND_WATER],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 45000,
              correct_answer: '78%',
            },
            {
              question_number: 9,
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
              question_number: 10,
              description:
                'What is the coefficient of O₂ when the equation H₂ + O₂ → H₂O is balanced?',
              hints: ['Balance each element; hydrogen and oxygen must both balance.'],
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
        Biology: {
          suiteTitle: 'WASSCE Biology — Paper 1',
          suiteDescription:
            '10 questions spanning Cell Biology, Genetics, Ecology, Human Physiology, Plant Biology, Microorganisms and Classification.',
          suiteKeywords: ['WASSCE', 'Biology'],
          questions: [
            {
              question_number: 1,
              description: 'Which organelle is known as the "powerhouse of the cell"?',
              hints: ['This organelle produces ATP through cellular respiration.'],
              solution_steps: ['The mitochondrion produces most of the cell\'s ATP.'],
              options: ['Nucleus', 'Ribosome', 'Mitochondrion', 'Vacuole'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_CELL_BIOLOGY],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 45000,
              correct_answer: 'Mitochondrion',
            },
            {
              question_number: 2,
              description: 'Which organelle is responsible for protein synthesis?',
              hints: ['It reads mRNA and assembles amino acids.'],
              solution_steps: ['Ribosomes translate mRNA into proteins.'],
              options: ['Golgi apparatus', 'Ribosome', 'Lysosome', 'Centriole'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_CELL_BIOLOGY],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 45000,
              correct_answer: 'Ribosome',
            },
            {
              question_number: 3,
              description: 'The basic unit of heredity is ___.',
              hints: ['It is a segment of DNA that codes for a trait.'],
              solution_steps: ['A gene is the basic unit of heredity.'],
              options: ['Cell', 'Chromosome', 'Gene', 'Allele'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_GENETICS_AND_EVOLUTION],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 45000,
              correct_answer: 'Gene',
            },
            {
              question_number: 4,
              description: 'What is the main function of red blood cells?',
              hints: ['They contain haemoglobin.'],
              solution_steps: [
                'Red blood cells transport oxygen (and some CO₂) around the body via haemoglobin.',
              ],
              options: [
                'Fight infection',
                'Transport oxygen',
                'Produce antibodies',
                'Carry nutrients',
              ],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_HUMAN_PHYSIOLOGY],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 45000,
              correct_answer: 'Transport oxygen',
            },
            {
              question_number: 5,
              description:
                'The process by which green plants manufacture food using sunlight is called ___.',
              hints: ['It involves chlorophyll, sunlight, water and CO₂.'],
              solution_steps: [
                'Photosynthesis: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂.',
              ],
              options: ['Respiration', 'Transpiration', 'Photosynthesis', 'Germination'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_PLANT_BIOLOGY],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 45000,
              correct_answer: 'Photosynthesis',
            },
            {
              question_number: 6,
              description:
                'Organisms that produce their own food through photosynthesis are called ___.',
              hints: ['They form the base of every food chain.'],
              solution_steps: [
                'Autotrophs (producers) make their own food; heterotrophs cannot.',
              ],
              options: ['Heterotrophs', 'Decomposers', 'Autotrophs', 'Consumers'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_ECOLOGY],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 60000,
              correct_answer: 'Autotrophs',
            },
            {
              question_number: 7,
              description: 'The causative agent of malaria is ___.',
              hints: ['It is a protozoan parasite transmitted by the Anopheles mosquito.'],
              solution_steps: ['Malaria is caused by the protozoan Plasmodium.'],
              options: ['Plasmodium', 'Trypanosoma', 'Bacteria', 'Virus'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_MICROORGANISMS_AND_DISEASE],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 60000,
              correct_answer: 'Plasmodium',
            },
            {
              question_number: 8,
              description:
                'Which is the correct order of biological classification from broadest to most specific?',
              hints: ['Remember: King Philip Came Over For Good Soup.'],
              solution_steps: [
                'Kingdom → Phylum → Class → Order → Family → Genus → Species.',
              ],
              options: [
                'Kingdom, Class, Phylum, Order, Family, Genus, Species',
                'Kingdom, Phylum, Class, Order, Family, Genus, Species',
                'Phylum, Kingdom, Class, Order, Family, Genus, Species',
                'Kingdom, Phylum, Order, Class, Family, Genus, Species',
              ],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_CLASSIFICATION],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 90000,
              correct_answer:
                'Kingdom, Phylum, Class, Order, Family, Genus, Species',
            },
            {
              question_number: 9,
              description: 'Which organ in the human body produces insulin?',
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
              question_number: 10,
              description:
                'In a monohybrid cross TT × tt, what are the genotypes of the F₁ offspring?',
              hints: ['T is dominant, t is recessive.', 'Each parent contributes one allele.'],
              solution_steps: [
                'TT × tt → all offspring receive one T and one t → all Tt.',
              ],
              options: ['All TT', 'All tt', 'All Tt', '50% TT, 50% tt'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_GENETICS_AND_EVOLUTION],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 90000,
              correct_answer: 'All Tt',
            },
          ],
        },
        Economics: {
          suiteTitle: 'WASSCE Economics — Paper 1',
          suiteDescription:
            '10 questions spanning Demand & Supply, Production, National Income, Money & Banking, International Trade and Public Finance.',
          suiteKeywords: ['WASSCE', 'Economics'],
          questions: [
            {
              question_number: 1,
              description:
                'A rise in the price of a good leads to a decrease in the quantity demanded. This illustrates ___.',
              hints: ['This is one of the most fundamental laws in economics.'],
              solution_steps: [
                'The inverse relationship between price and quantity demanded is the Law of Demand.',
              ],
              options: [
                'The law of supply',
                'The law of demand',
                'Elasticity of demand',
                'Consumer equilibrium',
              ],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_DEMAND_AND_SUPPLY],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 60000,
              correct_answer: 'The law of demand',
            },
            {
              question_number: 2,
              description:
                'When demand increases and supply remains constant, price will ___.',
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
              options: ['Variable cost', 'Marginal cost', 'Fixed cost', 'Opportunity cost'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_PRODUCTION_AND_COSTS],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 60000,
              correct_answer: 'Fixed cost',
            },
            {
              question_number: 4,
              description: 'GDP stands for ___.',
              hints: ['It measures the total value of goods and services produced.'],
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
            {
              question_number: 6,
              description:
                'The policy of protecting domestic industries from foreign competition through tariffs and quotas is called ___.',
              hints: ['It is the opposite of free trade.'],
              solution_steps: ['Protectionism shields domestic industries from imports.'],
              options: ['Globalisation', 'Protectionism', 'Liberalisation', 'Privatisation'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_INTERNATIONAL_TRADE],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 60000,
              correct_answer: 'Protectionism',
            },
            {
              question_number: 7,
              description:
                'A tax system where the tax rate increases as the taxpayer\'s income increases is called ___.',
              hints: ['Higher earners pay a higher percentage.'],
              solution_steps: [
                'A progressive tax increases with income; regressive does the opposite.',
              ],
              options: ['Regressive tax', 'Proportional tax', 'Progressive tax', 'Flat tax'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_PUBLIC_FINANCE],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 60000,
              correct_answer: 'Progressive tax',
            },
            {
              question_number: 8,
              description:
                'Economies of scale refer to ___.',
              hints: ['Think about what happens to average cost as output increases.'],
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
              question_number: 9,
              description:
                'Net National Product (NNP) is equal to GNP minus ___.',
              hints: ['Capital wears out over time.'],
              solution_steps: ['NNP = GNP − Depreciation (Capital Consumption Allowance).'],
              options: ['Taxes', 'Depreciation', 'Imports', 'Government spending'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_NATIONAL_INCOME],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 60000,
              correct_answer: 'Depreciation',
            },
            {
              question_number: 10,
              description: 'The central bank of Ghana is ___.',
              hints: ['It regulates monetary policy and the financial sector in Ghana.'],
              solution_steps: ['The Bank of Ghana is the central bank of Ghana.'],
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
        Geography: {
          suiteTitle: 'WASSCE Geography — Paper 1',
          suiteDescription:
            '10 questions spanning Physical Geography, Human Geography, Map Reading, Regional Geography and Economic Geography.',
          suiteKeywords: ['WASSCE', 'Geography'],
          questions: [
            {
              question_number: 1,
              description: 'What is the largest desert in the world?',
              hints: ['It is located in North Africa.'],
              solution_steps: [
                'The Sahara Desert in North Africa is the world\'s largest hot desert.',
              ],
              options: ['Arabian Desert', 'Gobi Desert', 'Sahara Desert', 'Kalahari Desert'],
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
              options: ['Erosion', 'Deposition', 'Weathering', 'Transportation'],
              type: QuestionType.MULTIPLE_CHOICE,
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
              description: 'Which is the largest country in Africa by land area?',
              hints: ['It is in North Africa and was formerly part of a larger country.'],
              solution_steps: [
                'Algeria is the largest country in Africa since South Sudan split Sudan.',
              ],
              options: ['Sudan', 'Democratic Republic of Congo', 'Libya', 'Algeria'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_REGIONAL_GEOGRAPHY],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 60000,
              correct_answer: 'Algeria',
            },
            {
              question_number: 5,
              description: 'Ghana\'s most important cash crop for export is ___.',
              hints: ['Ghana is one of the world\'s leading producers of this crop.'],
              solution_steps: ['Cocoa is Ghana\'s primary cash crop and export commodity.'],
              options: ['Coffee', 'Cocoa', 'Cotton', 'Rubber'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_ECONOMIC_GEOGRAPHY],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 45000,
              correct_answer: 'Cocoa',
            },
            {
              question_number: 6,
              description:
                'On a map with scale 1:50,000, a distance of 2 cm on the map represents what actual distance?',
              hints: ['1 cm = 50,000 cm on the ground.', '50,000 cm = 0.5 km.'],
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
              question_number: 7,
              description:
                'The type of rainfall commonly experienced in West Africa during summer is ___.',
              hints: ['Hot land heats the air above it, which rises and cools.'],
              solution_steps: [
                'Convectional rainfall results from intense surface heating causing warm air to rise, cool and condense.',
              ],
              options: [
                'Relief rainfall',
                'Frontal rainfall',
                'Convectional rainfall',
                'Cyclonic rainfall',
              ],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_PHYSICAL_GEOGRAPHY],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 60000,
              correct_answer: 'Convectional rainfall',
            },
            {
              question_number: 8,
              description: 'The largest ocean in the world is the ___.',
              hints: ['It covers more than 30% of the Earth\'s surface.'],
              solution_steps: ['The Pacific Ocean is the largest and deepest ocean.'],
              options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_PHYSICAL_GEOGRAPHY],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 30000,
              correct_answer: 'Pacific Ocean',
            },
            {
              question_number: 9,
              description: 'Lake Volta in Ghana was created by the construction of the ___.',
              hints: ['This dam harnesses the Volta River for hydroelectric power.'],
              solution_steps: [
                'The Akosombo Dam, completed in 1965, created Lake Volta — one of the world\'s largest man-made lakes.',
              ],
              options: ['Bui Dam', 'Kpong Dam', 'Akosombo Dam', 'Volta Dam'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_REGIONAL_GEOGRAPHY],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 45000,
              correct_answer: 'Akosombo Dam',
            },
            {
              question_number: 10,
              description: 'The main mineral exported by Ghana is ___.',
              hints: ['Ghana was formerly known as the "Gold Coast".'],
              solution_steps: ['Gold is Ghana\'s leading mineral export.'],
              options: ['Diamond', 'Bauxite', 'Manganese', 'Gold'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_ECONOMIC_GEOGRAPHY],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 30000,
              correct_answer: 'Gold',
            },
          ],
        },
        Literature: {
          suiteTitle: 'WASSCE Literature in English — Paper 1',
          suiteDescription:
            '10 questions spanning Prose, Poetry and Drama — literary terms and techniques.',
          suiteKeywords: ['WASSCE', 'Literature', 'English'],
          questions: [
            {
              question_number: 1,
              description: 'A story that is not based on real events is called ___.',
              hints: ['The opposite of non-fiction.'],
              solution_steps: ['Fiction refers to imaginative narratives not based on real events.'],
              options: ['Biography', 'Fiction', 'Autobiography', 'Documentary'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_PROSE],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 30000,
              correct_answer: 'Fiction',
            },
            {
              question_number: 2,
              description:
                'The repetition of consonant sounds at the beginning of closely linked words is called ___.',
              hints: ['"Peter Piper picked a peck of pickled peppers" is a famous example.'],
              solution_steps: ['Alliteration is the repetition of initial consonant sounds.'],
              options: ['Assonance', 'Alliteration', 'Onomatopoeia', 'Rhyme'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_POETRY],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 60000,
              correct_answer: 'Alliteration',
            },
            {
              question_number: 3,
              description: 'A play that ends in the downfall or death of the hero is called ___.',
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
              description:
                'A narrator who refers to themselves as "I" and is a character in the story is called a ___.',
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
              description: 'A poem consisting of exactly fourteen lines is called a ___.',
              hints: ['Shakespeare wrote many of these.'],
              solution_steps: ['A sonnet has exactly 14 lines, typically in iambic pentameter.'],
              options: ['Haiku', 'Ode', 'Sonnet', 'Ballad'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_POETRY],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 60000,
              correct_answer: 'Sonnet',
            },
            {
              question_number: 6,
              description: 'The turning point or highest point of tension in a dramatic plot is called ___.',
              hints: ['It is where things change direction for the protagonist.'],
              solution_steps: [
                'The climax is the peak of conflict and tension in a play or story.',
              ],
              options: ['Exposition', 'Rising action', 'Climax', 'Denouement'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_DRAMA],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 60000,
              correct_answer: 'Climax',
            },
            {
              question_number: 7,
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
              question_number: 8,
              description: 'The central character in a story who drives the plot forward is called the ___.',
              hints: ['They are usually the hero or main character.'],
              solution_steps: ['The protagonist is the main character; the antagonist opposes them.'],
              options: ['Antagonist', 'Foil', 'Protagonist', 'Narrator'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_PROSE],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 45000,
              correct_answer: 'Protagonist',
            },
            {
              question_number: 9,
              description:
                'When a character in a play speaks their thoughts aloud while alone on stage, this is called a ___.',
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
              question_number: 10,
              description:
                'The repetition of vowel sounds in closely placed words, e.g. "the rain in Spain", is called ___.',
              hints: ['It involves vowel sounds, not consonant sounds at the start.'],
              solution_steps: [
                'Assonance is the repetition of vowel sounds within nearby words.',
              ],
              options: ['Alliteration', 'Consonance', 'Assonance', 'Rhyme'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_POETRY],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 60000,
              correct_answer: 'Assonance',
            },
          ],
        },
        Government: {
          suiteTitle: 'WASSCE Government — Paper 1',
          suiteDescription:
            '10 questions spanning the Constitution, Democratic Institutions, Ghana\'s Political History and Government & Citizenship.',
          suiteKeywords: ['WASSCE', 'Government', 'Civics'],
          questions: [
            {
              question_number: 1,
              description: 'The supreme law of Ghana is ___.',
              hints: ['All other laws must conform to it.'],
              solution_steps: [
                'The Constitution of Ghana is the supreme law; any law inconsistent with it is void.',
              ],
              options: [
                'The Criminal Code',
                'Acts of Parliament',
                'The Constitution',
                'Presidential decrees',
              ],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_CONSTITUTION_AND_LAW],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 30000,
              correct_answer: 'The Constitution',
            },
            {
              question_number: 2,
              description: 'The head of state and government in Ghana is ___.',
              hints: ['Ghana operates a presidential system.'],
              solution_steps: [
                'Under Ghana\'s 1992 Constitution, the President is both head of state and head of government.',
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
              description: 'The three arms of government are ___.',
              hints: ['Think of who makes, executes, and interprets the law.'],
              solution_steps: [
                'Legislature (makes laws), Executive (enforces laws), Judiciary (interprets laws).',
              ],
              options: [
                'Legislature, Military, Judiciary',
                'Legislature, Executive, Judiciary',
                'President, Parliament, Police',
                'Cabinet, Courts, Army',
              ],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_GOVERNMENT_AND_CITIZENSHIP],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 45000,
              correct_answer: 'Legislature, Executive, Judiciary',
            },
            {
              question_number: 4,
              description: 'Ghana\'s current constitution was adopted in ___.',
              hints: ['It followed a referendum and ushered in the Fourth Republic.'],
              solution_steps: [
                'Ghana\'s Fourth Republican Constitution was adopted in 1992.',
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
              hints: ['It was the first sub-Saharan African country to gain independence.'],
              solution_steps: ['Ghana declared independence on 6th March 1957.'],
              options: ['1947', '1957', '1960', '1966'],
              type: QuestionType.MULTIPLE_CHOICE,
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
            {
              question_number: 7,
              description:
                'A system of government in which power is shared between a central government and regional units is called ___.',
              hints: ['The USA and Nigeria are examples.'],
              solution_steps: [
                'Federalism divides sovereignty between central and regional governments.',
              ],
              options: ['Unitary system', 'Confederation', 'Federalism', 'Monarchy'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_GOVERNMENT_AND_CITIZENSHIP],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 60000,
              correct_answer: 'Federalism',
            },
            {
              question_number: 8,
              description: 'The minimum voting age in Ghana is ___.',
              hints: ['Check the Constitution.'],
              solution_steps: [
                'Article 42 of Ghana\'s 1992 Constitution sets the voting age at 18.',
              ],
              options: ['16', '18', '21', '25'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_CONSTITUTION_AND_LAW],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 30000,
              correct_answer: '18',
            },
            {
              question_number: 9,
              description: 'The first President of Ghana was ___.',
              hints: ['He was also the independence leader and founder of the CPP.'],
              solution_steps: [
                'Dr. Kwame Nkrumah became Ghana\'s first Prime Minister (1957) and then first President (1960).',
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
              question_number: 10,
              description: 'As of 2019, how many regions does Ghana have?',
              hints: ['Six new regions were created from existing ones in 2019.'],
              solution_steps: [
                'Ghana was divided into 16 regions after the 2018 referendum created 6 new regions.',
              ],
              options: ['10', '12', '14', '16'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_DEMOCRATIC_INSTITUTIONS],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 60000,
              correct_answer: '16',
            },
          ],
        },
        History: {
          suiteTitle: 'WASSCE History — Paper 1',
          suiteDescription:
            '10 questions spanning Pre-colonial Africa, the Colonial Period, Independence Movements, Ghana\'s Political History and Culture.',
          suiteKeywords: ['WASSCE', 'History', 'Ghana'],
          questions: [
            {
              question_number: 1,
              description: 'The Ashanti Kingdom was founded by ___.',
              hints: ['He united the Akan states with the help of the Golden Stool.'],
              solution_steps: [
                'Osei Tutu I, together with the priest Okomfo Anokye, founded the Ashanti Kingdom around 1701.',
              ],
              options: ['Opoku Ware I', 'Osei Tutu I', 'Prempeh I', 'Agyeman Prempeh'],
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
              options: ['London, 1870', 'Paris, 1880', 'Berlin, 1884–1885', 'Brussels, 1890'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_COLONIAL_PERIOD],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 60000,
              correct_answer: 'Berlin, 1884–1885',
            },
            {
              question_number: 3,
              description: 'The Gold Coast (Ghana) was colonised by ___.',
              hints: ['English is Ghana\'s official language.'],
              solution_steps: [
                'Britain colonised the Gold Coast, making it a British Crown Colony.',
              ],
              options: ['France', 'Portugal', 'Britain', 'Germany'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_COLONIAL_PERIOD],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 45000,
              correct_answer: 'Britain',
            },
            {
              question_number: 4,
              description: 'Ghana declared independence on ___.',
              hints: ['It was the first sub-Saharan African country to gain independence.'],
              solution_steps: [
                'Ghana\'s independence was declared on 6th March 1957.',
              ],
              options: ['1st January 1956', '6th March 1957', '1st July 1960', '24th February 1966'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_INDEPENDENCE_MOVEMENTS],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 30000,
              correct_answer: '6th March 1957',
            },
            {
              question_number: 5,
              description:
                'Who led the movement for Ghana\'s independence and became its first Prime Minister?',
              hints: ['He founded the Convention People\'s Party (CPP).'],
              solution_steps: [
                'Dr. Kwame Nkrumah led the CPP and negotiated Ghana\'s independence from Britain.',
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
            {
              question_number: 6,
              description: 'The military coup that overthrew Nkrumah\'s government occurred in ___.',
              hints: ['Nkrumah was on a visit abroad when it happened.'],
              solution_steps: [
                'The National Liberation Council (NLC) overthrew Nkrumah on 24 February 1966.',
              ],
              options: ['1960', '1964', '1966', '1972'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_GHANA_POLITICAL_HISTORY],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 60000,
              correct_answer: '1966',
            },
            {
              question_number: 7,
              description: 'The traditional political symbol of the Ashanti Kingdom is the ___.',
              hints: ['Legend says it descended from the sky.'],
              solution_steps: [
                'The Golden Stool (Sika Dwa) is the sacred symbol of the soul and unity of the Ashanti people.',
              ],
              options: ['Bronze Throne', 'Silver Crown', 'Golden Stool', 'Iron Sceptre'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_CULTURE_AND_VALUES],
              difficulty: QuestionDifficultyType.EASY,
              estimated_time_in_ms: 45000,
              correct_answer: 'Golden Stool',
            },
            {
              question_number: 8,
              description:
                'The trans-Saharan trade route primarily connected ___.',
              hints: ['It crossed the Sahara Desert linking two broad regions.'],
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
              question_number: 9,
              description:
                'Under colonialism, the practice of compelling Africans to work without pay for colonial governments or settlers was called ___.',
              hints: ['It was widely used on plantations and infrastructure projects.'],
              solution_steps: [
                'Forced labour (compulsory labour) was a common colonial policy across Africa.',
              ],
              options: ['Serfdom', 'Indenture', 'Forced labour', 'Sharecropping'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_COLONIAL_PERIOD],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 60000,
              correct_answer: 'Forced labour',
            },
            {
              question_number: 10,
              description:
                'The largest pre-colonial empire in West Africa, known for its gold and salt trade, was the ___.',
              hints: ['It succeeded the Mali Empire and its capital was Gao.'],
              solution_steps: [
                'The Songhai Empire (15th–16th century) was the largest empire in West African history.',
              ],
              options: ['Ghana Empire', 'Mali Empire', 'Songhai Empire', 'Benin Kingdom'],
              type: QuestionType.MULTIPLE_CHOICE,
              tags: [QuestionTagType.TAG_PRECOLONIAL_AFRICA],
              difficulty: QuestionDifficultyType.MEDIUM,
              estimated_time_in_ms: 60000,
              correct_answer: 'Songhai Empire',
            },
          ],
        },
      };

      const new_wassce_course_version_questions: Question[][] =
        await Promise.all(
          new_wassce_course_versions.map(async (version) => {
            const courseTitle = version.course.title;
            const courseData = courseQuestionsMap[courseTitle];

            const new_suite = new TestSuite();
            new_suite.title = courseData.suiteTitle;
            new_suite.description = courseData.suiteDescription;
            new_suite.keywords = courseData.suiteKeywords;
            new_suite.course_version = version;

            await this.testSuiteRepository.save(new_suite);

            const questions: QuestionInput[] = courseData.questions;

            const new_questions: Question[] = await Promise.all(
              questions.map(async (question) => {
                const new_question = new Question();
                new_question.correct_answer = question.correct_answer;
                new_question.description = question.description;
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

            return new_questions;
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
    } catch (err) {}
  }
}
