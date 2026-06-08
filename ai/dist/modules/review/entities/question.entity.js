"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Question = exports.QuestionClassLevel = exports.QuestionDifficultyType = exports.QuestionTagType = exports.QuestionType = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const version_entity_1 = require("./version.entity");
const test_suite_entity_1 = require("./test_suite.entity");
var QuestionType;
(function (QuestionType) {
    QuestionType["MULTIPLE_CHOICE"] = "MULTIPLE_CHOICE";
    QuestionType["MULTIPLE_SELECT"] = "MULTIPLE_SELECT";
    QuestionType["FILL_IN"] = "FILL_IN";
    QuestionType["SHORT_ANSWER"] = "SHORT_ANSWER";
})(QuestionType || (exports.QuestionType = QuestionType = {}));
var QuestionTagType;
(function (QuestionTagType) {
    QuestionTagType["TAG_GENERAL"] = "TAG_GENERAL";
    QuestionTagType["TAG_NUMBER_AND_NUMERATION"] = "TAG_NUMBER_AND_NUMERATION";
    QuestionTagType["TAG_ALGEBRA"] = "TAG_ALGEBRA";
    QuestionTagType["TAG_GEOMETRY"] = "TAG_GEOMETRY";
    QuestionTagType["TAG_MENSURATION"] = "TAG_MENSURATION";
    QuestionTagType["TAG_STATISTICS_AND_PROBABILITY"] = "TAG_STATISTICS_AND_PROBABILITY";
    QuestionTagType["TAG_TRIGONOMETRY"] = "TAG_TRIGONOMETRY";
    QuestionTagType["TAG_CALCULUS"] = "TAG_CALCULUS";
    QuestionTagType["TAG_VECTORS_AND_MATRICES"] = "TAG_VECTORS_AND_MATRICES";
    QuestionTagType["TAG_SETS"] = "TAG_SETS";
    QuestionTagType["TAG_READING_COMPREHENSION"] = "TAG_READING_COMPREHENSION";
    QuestionTagType["TAG_SUMMARY_WRITING"] = "TAG_SUMMARY_WRITING";
    QuestionTagType["TAG_ESSAY_WRITING"] = "TAG_ESSAY_WRITING";
    QuestionTagType["TAG_GRAMMAR_AND_USAGE"] = "TAG_GRAMMAR_AND_USAGE";
    QuestionTagType["TAG_VOCABULARY"] = "TAG_VOCABULARY";
    QuestionTagType["TAG_ORAL_ENGLISH"] = "TAG_ORAL_ENGLISH";
    QuestionTagType["TAG_PHYSICAL_PROCESSES"] = "TAG_PHYSICAL_PROCESSES";
    QuestionTagType["TAG_LIFE_PROCESSES"] = "TAG_LIFE_PROCESSES";
    QuestionTagType["TAG_EARTH_AND_SPACE"] = "TAG_EARTH_AND_SPACE";
    QuestionTagType["TAG_DIVERSITY_OF_MATTER"] = "TAG_DIVERSITY_OF_MATTER";
    QuestionTagType["TAG_GHANA_HISTORY"] = "TAG_GHANA_HISTORY";
    QuestionTagType["TAG_GOVERNMENT_AND_CITIZENSHIP"] = "TAG_GOVERNMENT_AND_CITIZENSHIP";
    QuestionTagType["TAG_ECONOMIC_DEVELOPMENT"] = "TAG_ECONOMIC_DEVELOPMENT";
    QuestionTagType["TAG_POPULATION_AND_DEVELOPMENT"] = "TAG_POPULATION_AND_DEVELOPMENT";
    QuestionTagType["TAG_ENVIRONMENT_AND_SOCIETY"] = "TAG_ENVIRONMENT_AND_SOCIETY";
    QuestionTagType["TAG_CULTURE_AND_VALUES"] = "TAG_CULTURE_AND_VALUES";
    QuestionTagType["TAG_MECHANICS"] = "TAG_MECHANICS";
    QuestionTagType["TAG_WAVES_AND_OPTICS"] = "TAG_WAVES_AND_OPTICS";
    QuestionTagType["TAG_ELECTRICITY_AND_MAGNETISM"] = "TAG_ELECTRICITY_AND_MAGNETISM";
    QuestionTagType["TAG_HEAT_AND_THERMODYNAMICS"] = "TAG_HEAT_AND_THERMODYNAMICS";
    QuestionTagType["TAG_ATOMIC_AND_NUCLEAR_PHYSICS"] = "TAG_ATOMIC_AND_NUCLEAR_PHYSICS";
    QuestionTagType["TAG_MEASUREMENT"] = "TAG_MEASUREMENT";
    QuestionTagType["TAG_ATOMIC_STRUCTURE"] = "TAG_ATOMIC_STRUCTURE";
    QuestionTagType["TAG_CHEMICAL_BONDING"] = "TAG_CHEMICAL_BONDING";
    QuestionTagType["TAG_STOICHIOMETRY"] = "TAG_STOICHIOMETRY";
    QuestionTagType["TAG_ORGANIC_CHEMISTRY"] = "TAG_ORGANIC_CHEMISTRY";
    QuestionTagType["TAG_ACIDS_BASES_AND_SALTS"] = "TAG_ACIDS_BASES_AND_SALTS";
    QuestionTagType["TAG_ELECTROCHEMISTRY"] = "TAG_ELECTROCHEMISTRY";
    QuestionTagType["TAG_PERIODIC_TABLE"] = "TAG_PERIODIC_TABLE";
    QuestionTagType["TAG_AIR_AND_WATER"] = "TAG_AIR_AND_WATER";
    QuestionTagType["TAG_CELL_BIOLOGY"] = "TAG_CELL_BIOLOGY";
    QuestionTagType["TAG_GENETICS_AND_EVOLUTION"] = "TAG_GENETICS_AND_EVOLUTION";
    QuestionTagType["TAG_ECOLOGY"] = "TAG_ECOLOGY";
    QuestionTagType["TAG_HUMAN_PHYSIOLOGY"] = "TAG_HUMAN_PHYSIOLOGY";
    QuestionTagType["TAG_PLANT_BIOLOGY"] = "TAG_PLANT_BIOLOGY";
    QuestionTagType["TAG_MICROORGANISMS_AND_DISEASE"] = "TAG_MICROORGANISMS_AND_DISEASE";
    QuestionTagType["TAG_CLASSIFICATION"] = "TAG_CLASSIFICATION";
    QuestionTagType["TAG_DEMAND_AND_SUPPLY"] = "TAG_DEMAND_AND_SUPPLY";
    QuestionTagType["TAG_PRODUCTION_AND_COSTS"] = "TAG_PRODUCTION_AND_COSTS";
    QuestionTagType["TAG_NATIONAL_INCOME"] = "TAG_NATIONAL_INCOME";
    QuestionTagType["TAG_MONEY_AND_BANKING"] = "TAG_MONEY_AND_BANKING";
    QuestionTagType["TAG_INTERNATIONAL_TRADE"] = "TAG_INTERNATIONAL_TRADE";
    QuestionTagType["TAG_PUBLIC_FINANCE"] = "TAG_PUBLIC_FINANCE";
    QuestionTagType["TAG_MAP_READING"] = "TAG_MAP_READING";
    QuestionTagType["TAG_PHYSICAL_GEOGRAPHY"] = "TAG_PHYSICAL_GEOGRAPHY";
    QuestionTagType["TAG_HUMAN_GEOGRAPHY"] = "TAG_HUMAN_GEOGRAPHY";
    QuestionTagType["TAG_REGIONAL_GEOGRAPHY"] = "TAG_REGIONAL_GEOGRAPHY";
    QuestionTagType["TAG_ECONOMIC_GEOGRAPHY"] = "TAG_ECONOMIC_GEOGRAPHY";
    QuestionTagType["TAG_PRECOLONIAL_AFRICA"] = "TAG_PRECOLONIAL_AFRICA";
    QuestionTagType["TAG_COLONIAL_PERIOD"] = "TAG_COLONIAL_PERIOD";
    QuestionTagType["TAG_INDEPENDENCE_MOVEMENTS"] = "TAG_INDEPENDENCE_MOVEMENTS";
    QuestionTagType["TAG_GHANA_POLITICAL_HISTORY"] = "TAG_GHANA_POLITICAL_HISTORY";
    QuestionTagType["TAG_CONSTITUTION_AND_LAW"] = "TAG_CONSTITUTION_AND_LAW";
    QuestionTagType["TAG_DEMOCRATIC_INSTITUTIONS"] = "TAG_DEMOCRATIC_INSTITUTIONS";
    QuestionTagType["TAG_PROSE"] = "TAG_PROSE";
    QuestionTagType["TAG_POETRY"] = "TAG_POETRY";
    QuestionTagType["TAG_DRAMA"] = "TAG_DRAMA";
    QuestionTagType["TAG_COMPUTER_HARDWARE"] = "TAG_COMPUTER_HARDWARE";
    QuestionTagType["TAG_SOFTWARE_AND_APPLICATIONS"] = "TAG_SOFTWARE_AND_APPLICATIONS";
    QuestionTagType["TAG_INTERNET_AND_NETWORKING"] = "TAG_INTERNET_AND_NETWORKING";
    QuestionTagType["TAG_PROGRAMMING_BASICS"] = "TAG_PROGRAMMING_BASICS";
    QuestionTagType["TAG_DATA_MANAGEMENT"] = "TAG_DATA_MANAGEMENT";
    QuestionTagType["TAG_FRENCH_GRAMMAR"] = "TAG_FRENCH_GRAMMAR";
    QuestionTagType["TAG_FRENCH_VOCABULARY"] = "TAG_FRENCH_VOCABULARY";
    QuestionTagType["TAG_FRENCH_COMPREHENSION"] = "TAG_FRENCH_COMPREHENSION";
    QuestionTagType["TAG_CHRISTIANITY"] = "TAG_CHRISTIANITY";
    QuestionTagType["TAG_ISLAM"] = "TAG_ISLAM";
    QuestionTagType["TAG_AFRICAN_TRADITIONAL_RELIGION"] = "TAG_AFRICAN_TRADITIONAL_RELIGION";
})(QuestionTagType || (exports.QuestionTagType = QuestionTagType = {}));
var QuestionDifficultyType;
(function (QuestionDifficultyType) {
    QuestionDifficultyType["EASY"] = "EASY";
    QuestionDifficultyType["MEDIUM"] = "MEDIUM";
    QuestionDifficultyType["HARD"] = "HARD";
})(QuestionDifficultyType || (exports.QuestionDifficultyType = QuestionDifficultyType = {}));
var QuestionClassLevel;
(function (QuestionClassLevel) {
    QuestionClassLevel["JHS_1"] = "jhs_1";
    QuestionClassLevel["JHS_2"] = "jhs_2";
    QuestionClassLevel["JHS_3"] = "jhs_3";
    QuestionClassLevel["SHS_1"] = "shs_1";
    QuestionClassLevel["SHS_2"] = "shs_2";
    QuestionClassLevel["SHS_3"] = "shs_3";
})(QuestionClassLevel || (exports.QuestionClassLevel = QuestionClassLevel = {}));
(0, graphql_1.registerEnumType)(QuestionType, {
    name: 'QuestionType',
    description: 'Question types',
});
(0, graphql_1.registerEnumType)(QuestionTagType, {
    name: 'QuestionTagType',
    description: 'Question tag types',
});
(0, graphql_1.registerEnumType)(QuestionDifficultyType, {
    name: 'QuestionDifficultyType',
    description: 'Question difficulty types',
});
(0, graphql_1.registerEnumType)(QuestionClassLevel, {
    name: 'QuestionClassLevel',
    description: 'Syllabus class level the question originates from',
});
let Question = class Question {
};
exports.Question = Question;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Question.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Question.prototype, "question_number", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Question.prototype, "description", void 0);
__decorate([
    (0, graphql_1.Field)(() => [String]),
    (0, typeorm_1.Column)('text', { array: true }),
    __metadata("design:type", Array)
], Question.prototype, "hints", void 0);
__decorate([
    (0, graphql_1.Field)(() => [String]),
    (0, typeorm_1.Column)('text', { array: true }),
    __metadata("design:type", Array)
], Question.prototype, "solution_steps", void 0);
__decorate([
    (0, graphql_1.Field)(() => [String], { nullable: true }),
    (0, typeorm_1.Column)('text', { array: true, nullable: true }),
    __metadata("design:type", Array)
], Question.prototype, "options", void 0);
__decorate([
    (0, graphql_1.Field)(() => QuestionType),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: QuestionType,
        default: QuestionType.MULTIPLE_CHOICE,
    }),
    __metadata("design:type", String)
], Question.prototype, "type", void 0);
__decorate([
    (0, graphql_1.Field)(() => [QuestionTagType]),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: QuestionTagType,
        array: true,
        default: [QuestionTagType.TAG_GENERAL],
    }),
    __metadata("design:type", Array)
], Question.prototype, "tags", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Question.prototype, "correct_answer", void 0);
__decorate([
    (0, graphql_1.Field)(() => QuestionDifficultyType),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: QuestionDifficultyType,
        default: QuestionDifficultyType.EASY,
    }),
    __metadata("design:type", String)
], Question.prototype, "difficulty", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Question.prototype, "estimated_time_in_ms", void 0);
__decorate([
    (0, graphql_1.Field)(() => QuestionClassLevel, { nullable: true }),
    (0, typeorm_1.Column)({ type: 'enum', enum: QuestionClassLevel, nullable: true }),
    __metadata("design:type", String)
], Question.prototype, "class_level", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int, { nullable: true }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Question.prototype, "exam_year", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], Question.prototype, "marks", void 0);
__decorate([
    (0, graphql_1.Field)(() => version_entity_1.Version, { nullable: true }),
    (0, typeorm_1.ManyToOne)(() => version_entity_1.Version, (version) => version.questions),
    __metadata("design:type", version_entity_1.Version)
], Question.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => test_suite_entity_1.TestSuite, (test_suite) => test_suite.questions),
    __metadata("design:type", test_suite_entity_1.TestSuite)
], Question.prototype, "test_suite", void 0);
exports.Question = Question = __decorate([
    (0, graphql_1.ObjectType)('Question'),
    (0, typeorm_1.Entity)('questions')
], Question);
//# sourceMappingURL=question.entity.js.map