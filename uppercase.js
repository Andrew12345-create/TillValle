const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter a string to convert to uppercase: ', (input) => {
  // Convert the input string to uppercase
  const uppercased = input.toUpperCase();
  console.log('Uppercase version:', uppercased);
  rl.close();
});
