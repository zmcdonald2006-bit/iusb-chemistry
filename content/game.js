// Sea Lion Splash — the study game.
//
// ✏️ Everything here is safe to edit: outfit and ocean names, their prices (in fish, earned by
// playing) and the little messages. Keep each `id` unchanged once released — purchases are saved
// by id. Outfits and oceans are drawn by js/game/draw.js; a new id needs a drawing there too.

export const GAME = {
  name: 'Sea Lion Splash',
  tagline: 'Swim through the ring with the right answer. Three lives, endless questions.',
};

export const OUTFITS = [
  { id: 'natural', name: 'Just me', price: 0 },
  { id: 'goggles', name: 'Lab goggles', price: 120 },
  { id: 'bow', name: 'Pink bow', price: 200 },
  { id: 'party', name: 'Party hat', price: 300 },
  { id: 'shades', name: 'Sunglasses', price: 400 },
  { id: 'flowers', name: 'Flower crown', price: 600 },
  { id: 'captain', name: "Captain's hat", price: 800 },
  { id: 'crown', name: 'Golden crown', price: 1500 },
];

export const THEMES = [
  { id: 'bay', name: 'Sunny bay', price: 0 },
  { id: 'sunset', name: 'Sunset pier', price: 350 },
  { id: 'kelp', name: 'Kelp forest', price: 700 },
  { id: 'night', name: 'Moonlit cove', price: 1000 },
];

// Shown on a streak of correct answers (every 5 in a row).
export const STREAK_CHEERS = ['Fin-tastic!', 'Flipping brilliant!', 'Sea-riously good!', 'Whisker-perfect!', 'Making waves!', 'Unstoppable!'];

// Shown at the end of a run, by how it went.
export const RUN_MESSAGES = {
  great: ['That was a splash hit! 🌊', 'Top of the food chain. 🐟', 'Your sea lion is so proud of you.'],
  good: ['Nice swimming! Every run makes it stick.', 'Solid run — the misses are in your Mistakes list now.', 'Getting stronger every dive.'],
  rough: ['Rough waters! Read the explanations, then dive back in.', 'Even sea lions bump into buoys. Try a Chill speed run?', 'Every miss is a lesson — check them below.'],
};
