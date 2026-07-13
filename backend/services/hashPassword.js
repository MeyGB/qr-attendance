// Run: node services/hashPassword.js "YourPasswordHere"
// Copy the printed hash into the employees.password_hash column via phpMyAdmin.

const bcrypt = require('bcryptjs');

const plainPassword = process.argv[2];

if (!plainPassword) {
  console.log('Usage: node services/hashPassword.js "YourPasswordHere"');
  process.exit(1);
}

bcrypt.hash(plainPassword, 10).then((hash) => {
  console.log('Bcrypt hash:');
  console.log(hash);
});
