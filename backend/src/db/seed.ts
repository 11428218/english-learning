import pool from './pool';

/**
 * Database Seeding
 * Populates the database with sample TOEIC, Business, and Electrical Engineering vocabulary
 */

const seedDatabase = async () => {
  try {
    console.log('Seeding database with sample vocabulary...');

    // Sample TOEIC words
    const toeicWords = [
      {
        word: 'comprehensive',
        definition: 'Complete and including all or most aspects',
        part_of_speech: 'adjective',
        domain: 'toeic',
        difficulty_level: 3,
        examples: [
          { sentence: 'The comprehensive report covered all major aspects of the project.', type: 'daily' },
          { sentence: 'Our company offers a comprehensive insurance package for all employees.', type: 'business' },
          { sentence: 'A comprehensive understanding of electrical circuits is essential.', type: 'technical' },
        ],
      },
      {
        word: 'facilitate',
        definition: 'To make easier or assist the progress of',
        part_of_speech: 'verb',
        domain: 'toeic',
        difficulty_level: 3,
        examples: [
          { sentence: 'Good communication can facilitate better understanding between teams.', type: 'daily' },
          { sentence: 'Technology helps facilitate faster business transactions.', type: 'business' },
          { sentence: 'Software tools can facilitate electrical circuit analysis.', type: 'technical' },
        ],
      },
      {
        word: 'meticulous',
        definition: 'Very careful and precise; paying close attention to details',
        part_of_speech: 'adjective',
        domain: 'toeic',
        difficulty_level: 3,
        examples: [
          { sentence: 'She completed the task with meticulous attention to detail.', type: 'daily' },
          { sentence: 'Accounting requires meticulous record-keeping.', type: 'business' },
          { sentence: 'Engineers must be meticulous when designing circuits.', type: 'technical' },
        ],
      },
      {
        word: 'ambiguous',
        definition: 'Open to more than one interpretation; unclear',
        part_of_speech: 'adjective',
        domain: 'toeic',
        difficulty_level: 2,
        examples: [
          { sentence: 'The ambiguous wording of the contract led to disputes.', type: 'daily' },
          { sentence: 'Avoid ambiguous language in business communications.', type: 'business' },
          { sentence: 'The technical specification contained ambiguous instructions.', type: 'technical' },
        ],
      },
      {
        word: 'resilient',
        definition: 'Able to recover quickly; adaptable',
        part_of_speech: 'adjective',
        domain: 'toeic',
        difficulty_level: 2,
        examples: [
          { sentence: 'A resilient economy can weather economic downturns.', type: 'daily' },
          { sentence: 'The company is resilient despite market challenges.', type: 'business' },
          { sentence: 'Resilient materials are essential in electrical engineering.', type: 'technical' },
        ],
      },
    ];

    // Sample Business words
    const businessWords = [
      {
        word: 'leverage',
        definition: 'Use something to maximum advantage; financial advantage',
        part_of_speech: 'verb',
        domain: 'business',
        difficulty_level: 2,
        examples: [
          { sentence: 'We can leverage our existing resources to reduce costs.', type: 'business' },
          { sentence: 'The company leveraged its brand reputation for expansion.', type: 'business' },
          { sentence: 'Leverage in financial terms refers to using borrowed capital.', type: 'business' },
        ],
      },
      {
        word: 'synergy',
        definition: 'The interaction of elements producing a combined effect greater than their separate effects',
        part_of_speech: 'noun',
        domain: 'business',
        difficulty_level: 2,
        examples: [
          { sentence: 'The merger created significant synergy between the two companies.', type: 'business' },
          { sentence: 'Team synergy is crucial for project success.', type: 'business' },
          { sentence: 'The partnership aims to achieve synergy in product development.', type: 'business' },
        ],
      },
      {
        word: 'scalable',
        definition: 'Able to be increased or decreased in size, number, or extent',
        part_of_speech: 'adjective',
        domain: 'business',
        difficulty_level: 2,
        examples: [
          { sentence: 'Cloud services provide a scalable solution for growing businesses.', type: 'business' },
          { sentence: 'The business model is designed to be highly scalable.', type: 'business' },
          { sentence: 'Scalable architecture is important in software development.', type: 'technical' },
        ],
      },
      {
        word: 'benchmark',
        definition: 'A standard or measure used for comparison',
        part_of_speech: 'noun',
        domain: 'business',
        difficulty_level: 2,
        examples: [
          { sentence: 'We use industry benchmarks to measure our performance.', type: 'business' },
          { sentence: 'This product sets the benchmark for quality.', type: 'business' },
          { sentence: 'Benchmarking against competitors helps identify improvement areas.', type: 'business' },
        ],
      },
      {
        word: 'milestone',
        definition: 'An important event or stage in development',
        part_of_speech: 'noun',
        domain: 'business',
        difficulty_level: 1,
        examples: [
          { sentence: 'Reaching 1 million users was a major milestone for the startup.', type: 'business' },
          { sentence: 'The project has achieved several key milestones.', type: 'business' },
          { sentence: 'Product launch is a critical milestone in the timeline.', type: 'business' },
        ],
      },
    ];

    // Sample Electrical Engineering words
    const electricalWords = [
      {
        word: 'impedance',
        definition: 'The total opposition to alternating current flow in a circuit',
        part_of_speech: 'noun',
        domain: 'electrical',
        difficulty_level: 3,
        examples: [
          { sentence: 'The impedance of the circuit affects the current flow.', type: 'technical' },
          { sentence: 'Impedance matching is critical in transmission line design.', type: 'technical' },
          { sentence: 'Calculate the total impedance using the formula Z = R + jX.', type: 'technical' },
        ],
      },
      {
        word: 'capacitance',
        definition: 'The property of a circuit element to store electrical energy',
        part_of_speech: 'noun',
        domain: 'electrical',
        difficulty_level: 3,
        examples: [
          { sentence: 'Capacitance is measured in farads (F).', type: 'technical' },
          { sentence: 'The capacitor has a capacitance of 10 microfarads.', type: 'technical' },
          { sentence: 'Increasing capacitance increases the energy storage capability.', type: 'technical' },
        ],
      },
      {
        word: 'rectification',
        definition: 'The conversion of alternating current to direct current',
        part_of_speech: 'noun',
        domain: 'electrical',
        difficulty_level: 3,
        examples: [
          { sentence: 'A bridge rectifier performs full-wave rectification.', type: 'technical' },
          { sentence: 'The rectification process removes the negative half-cycle.', type: 'technical' },
          { sentence: 'Rectification efficiency affects the power supply performance.', type: 'technical' },
        ],
      },
      {
        word: 'voltage',
        definition: 'The electrical potential difference between two points',
        part_of_speech: 'noun',
        domain: 'electrical',
        difficulty_level: 1,
        examples: [
          { sentence: 'The voltage across the resistor is 5 volts.', type: 'technical' },
          { sentence: 'High voltage transmission lines carry power over long distances.', type: 'technical' },
          { sentence: 'Power supplies regulate the output voltage.', type: 'technical' },
        ],
      },
      {
        word: 'conductor',
        definition: 'A material that allows electric current to flow easily',
        part_of_speech: 'noun',
        domain: 'electrical',
        difficulty_level: 1,
        examples: [
          { sentence: 'Copper is an excellent electrical conductor.', type: 'technical' },
          { sentence: 'Conductors have low electrical resistance.', type: 'technical' },
          { sentence: 'The circuit needs proper conductors to function correctly.', type: 'technical' },
        ],
      },
    ];

    // Insert words
    for (const wordData of [...toeicWords, ...businessWords, ...electricalWords]) {
      const wordResult = await pool.query(
        `INSERT INTO words (word, definition, part_of_speech, domain, difficulty_level)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (word) DO NOTHING
         RETURNING id`,
        [
          wordData.word,
          wordData.definition,
          wordData.part_of_speech,
          wordData.domain,
          wordData.difficulty_level,
        ]
      );

      if (wordResult.rows.length > 0) {
        const wordId = wordResult.rows[0].id;

        // Insert examples
        for (const example of wordData.examples) {
          await pool.query(
            `INSERT INTO examples (word_id, sentence, type)
             VALUES ($1, $2, $3)`,
            [wordId, example.sentence, example.type]
          );
        }
      }
    }

    console.log('✓ Database seeded with sample vocabulary');
  } catch (err) {
    console.error('Error seeding database:', err);
    throw err;
  }
};

export default seedDatabase;

if (require.main === module) {
  seedDatabase()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Failed to seed database from CLI:', err);
      await pool.end();
      process.exit(1);
    });
}
