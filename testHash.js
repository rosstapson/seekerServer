var bcrypt = require('bcrypt');
const saltRounds = 4;
const myPlaintextPassword = 'bacon';
const someOtherPlaintextPassword = 'not_bacon';

bcrypt
  .hash(myPlaintextPassword, saltRounds)
  .then(function (hash) {
    console.log(hash);

    bcrypt
      .compare(myPlaintextPassword, hash)
      .then(function (res) {
        console.log(myPlaintextPassword + ":" + hash + " = " + res);
      });
    bcrypt
      .compare(someOtherPlaintextPassword, hash)
      .then(function (res) {
        console.log(myPlaintextPassword + ":" + hash + " = " + res);
      });
  });
