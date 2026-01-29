import 'dotenv/config';
import sweetIdeas from '../data/sweet-ideas.json';

// This file is a placeholder for seeding.
// Since we're storing ideas in a JSON file (not the database),
// this script just validates the data.

function validateSeedData() {
  console.log('Validating sweet ideas seed data...');

  const { ideas } = sweetIdeas;

  if (!Array.isArray(ideas)) {
    throw new Error('Ideas must be an array');
  }

  if (ideas.length < 20) {
    console.warn(`Warning: Only ${ideas.length} ideas found, expected at least 20`);
  }

  const categories = new Set(ideas.map((i) => i.category));
  console.log(`Found ${ideas.length} sweet ideas across ${categories.size} categories:`);
  console.log(`Categories: ${Array.from(categories).join(', ')}`);

  // Validate each idea has required fields
  ideas.forEach((idea, index) => {
    if (!idea.id || !idea.title || !idea.description || !idea.category) {
      throw new Error(`Invalid idea at index ${index}: missing required fields`);
    }
  });

  console.log('All seed data is valid!');
}

validateSeedData();
