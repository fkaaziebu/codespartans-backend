# Question Population Template

Use the JSON structure below as a template for populating questions.

## JSON Template

```json
{
  "questions": [
    {
      "question_number": 1,
      "description": "What is the value of x in the equation 2x + 4 = 10?",
      "hints": [
        "Isolate the variable by subtracting 4 from both sides",
        "Divide both sides by 2"
      ],
      "solution_steps": [
        "2x + 4 = 10",
        "2x = 10 - 4",
        "2x = 6",
        "x = 3"
      ],
      "options": ["2", "3", "4", "5"],
      "type": "MULTIPLE_CHOICE",
      "tags": ["TAG_ALGEBRA"],
      "correct_answer": "3",
      "difficulty": "EASY",
      "estimated_time_in_ms": 60000,
      "class_level": "jhs_3",
      "exam_year": 2022,
      "marks": 1
    }
  ]
}
```

---

## Field Reference

| Field | Required | Type | Notes |
|---|---|---|---|
| `question_number` | Yes | Integer | Ordering within the test |
| `description` | Yes | String | The question text |
| `hints` | Yes | String[] | Hints to guide the student; use `[]` if none |
| `solution_steps` | Yes | String[] | Step-by-step solution walkthrough |
| `options` | No | String[] | Required for `MULTIPLE_CHOICE` / `MULTIPLE_SELECT`; omit for `FILL_IN` / `SHORT_ANSWER` |
| `type` | Yes | Enum | See **Question Types** below |
| `tags` | Yes | Enum[] | At least one tag required; see **Tags** below |
| `correct_answer` | Yes | String | For multiple choice, must exactly match one of the `options` values |
| `difficulty` | Yes | Enum | See **Difficulty Levels** below |
| `estimated_time_in_ms` | Yes | Integer | Time in milliseconds, e.g. `60000` = 1 minute |
| `class_level` | No | Enum | See **Class Levels** below |
| `exam_year` | No | Integer | Year the question appeared in an exam, e.g. `2023` |
| `marks` | Yes | Integer | Points awarded; defaults to `1` |

---

## Allowed Enum Values

### Question Types

| Value | Description |
|---|---|
| `MULTIPLE_CHOICE` | Single correct answer from a list of options |
| `MULTIPLE_SELECT` | Multiple correct answers from a list of options |
| `FILL_IN` | Student fills in a blank |
| `SHORT_ANSWER` | Student writes a short free-text answer |

### Difficulty Levels

| Value |
|---|
| `EASY` |
| `MEDIUM` |
| `HARD` |

### Class Levels

| Value |
|---|
| `jhs_1` |
| `jhs_2` |
| `jhs_3` |
| `shs_1` |
| `shs_2` |
| `shs_3` |

### Tags

Pick one or more tags per question.

**General**
- `TAG_GENERAL`

**Mathematics**
- `TAG_NUMBER_AND_NUMERATION`
- `TAG_ALGEBRA`
- `TAG_GEOMETRY`
- `TAG_MENSURATION`
- `TAG_STATISTICS_AND_PROBABILITY`
- `TAG_TRIGONOMETRY`
- `TAG_CALCULUS`
- `TAG_VECTORS_AND_MATRICES`
- `TAG_SETS`

**English Language**
- `TAG_READING_COMPREHENSION`
- `TAG_SUMMARY_WRITING`
- `TAG_ESSAY_WRITING`
- `TAG_GRAMMAR_AND_USAGE`
- `TAG_VOCABULARY`
- `TAG_ORAL_ENGLISH`

**Integrated Science**
- `TAG_PHYSICAL_PROCESSES`
- `TAG_LIFE_PROCESSES`
- `TAG_EARTH_AND_SPACE`
- `TAG_DIVERSITY_OF_MATTER`

**Physics**
- `TAG_MECHANICS`
- `TAG_WAVES_AND_OPTICS`
- `TAG_ELECTRICITY_AND_MAGNETISM`
- `TAG_HEAT_AND_THERMODYNAMICS`
- `TAG_ATOMIC_AND_NUCLEAR_PHYSICS`
- `TAG_MEASUREMENT`

**Chemistry**
- `TAG_ATOMIC_STRUCTURE`
- `TAG_CHEMICAL_BONDING`
- `TAG_STOICHIOMETRY`
- `TAG_ORGANIC_CHEMISTRY`
- `TAG_ACIDS_BASES_AND_SALTS`
- `TAG_ELECTROCHEMISTRY`
- `TAG_PERIODIC_TABLE`
- `TAG_AIR_AND_WATER`

**Biology**
- `TAG_CELL_BIOLOGY`
- `TAG_GENETICS_AND_EVOLUTION`
- `TAG_ECOLOGY`
- `TAG_HUMAN_PHYSIOLOGY`
- `TAG_PLANT_BIOLOGY`
- `TAG_MICROORGANISMS_AND_DISEASE`
- `TAG_CLASSIFICATION`

**Social Studies**
- `TAG_GHANA_HISTORY`
- `TAG_GOVERNMENT_AND_CITIZENSHIP`
- `TAG_ECONOMIC_DEVELOPMENT`
- `TAG_POPULATION_AND_DEVELOPMENT`
- `TAG_ENVIRONMENT_AND_SOCIETY`
- `TAG_CULTURE_AND_VALUES`

**Economics**
- `TAG_DEMAND_AND_SUPPLY`
- `TAG_PRODUCTION_AND_COSTS`
- `TAG_NATIONAL_INCOME`
- `TAG_MONEY_AND_BANKING`
- `TAG_INTERNATIONAL_TRADE`
- `TAG_PUBLIC_FINANCE`

**Geography**
- `TAG_MAP_READING`
- `TAG_PHYSICAL_GEOGRAPHY`
- `TAG_HUMAN_GEOGRAPHY`
- `TAG_REGIONAL_GEOGRAPHY`
- `TAG_ECONOMIC_GEOGRAPHY`

**History & Government**
- `TAG_PRECOLONIAL_AFRICA`
- `TAG_COLONIAL_PERIOD`
- `TAG_INDEPENDENCE_MOVEMENTS`
- `TAG_GHANA_POLITICAL_HISTORY`
- `TAG_CONSTITUTION_AND_LAW`
- `TAG_DEMOCRATIC_INSTITUTIONS`

**Literature**
- `TAG_PROSE`
- `TAG_POETRY`
- `TAG_DRAMA`

**ICT**
- `TAG_COMPUTER_HARDWARE`
- `TAG_SOFTWARE_AND_APPLICATIONS`
- `TAG_INTERNET_AND_NETWORKING`
- `TAG_PROGRAMMING_BASICS`
- `TAG_DATA_MANAGEMENT`

**French**
- `TAG_FRENCH_GRAMMAR`
- `TAG_FRENCH_VOCABULARY`
- `TAG_FRENCH_COMPREHENSION`

**Religious & Moral Education**
- `TAG_CHRISTIANITY`
- `TAG_ISLAM`
- `TAG_AFRICAN_TRADITIONAL_RELIGION`
