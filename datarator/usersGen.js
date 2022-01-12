const fs = require('fs');
const crypto = require('crypto');
const names = require('./json/names.json');
const domains = require('./json/domains.json');

// due to the relative small poolsize (less than 50.000.000) is virtually impossible to get duplicates on 20bits ids
// therefore, i'm commenting out the recursion, no need to check duplicates for now since it has a tremendous computing cost
const generateID = (users, idSize) => {
  let id = crypto.randomBytes(idSize).toString('hex');
  // let idExists = users.find((user) => user.id === id);

  // if (idExists) {
  // return generateID(users, idSize);
  // } else {
  return id;
  // }
};

const generateName = (names) => {
  let name = '';
  const nameSize = Math.ceil(Math.random() * 4 + 1);

  for (let i = 0; i <= nameSize; i++) {
    const nameIndex = Math.floor(Math.random() * names.length);
    name += names[nameIndex] + ' ';
  }

  return name.trim();
};

const generateEmail = (name, users, domains) => {
  const domainIndex = Math.floor(Math.random() * domains.length);
  let email =
    name.split(' ').slice(0)[0].toLowerCase() +
    name.split(' ').slice(-1)[0].toLowerCase() +
    '@' +
    domains[domainIndex];

  let emailExists = users.find((user) => user.email === email);

  if (emailExists) {
    return generateEmail(name, users, domains);
  } else {
    return email;
  }
};

// just for testing find() vs for()
// no significant differences in memory usage and process time were found.
// in this case find() is preferred due to readability
const generateEmail2 = (name, users, domains) => {
  const domainIndex = Math.floor(Math.random() * domains.length);
  let email =
    name.split(' ').slice(0)[0].toLowerCase() +
    name.split(' ').slice(-1)[0].toLowerCase() +
    '@' +
    domains[domainIndex];

  let emailExists = false;

  for (let i = 0, n = users.length; i < n; i++) {
    if (users[i].email === email) {
      emailExists = true;
      break;
    }
  }

  if (emailExists) {
    return generateEmail(name, users, domains);
  } else {
    return email;
  }
};

const logs = (poolSize, idSize) => {
  console.timeEnd('Time elapsed:');

  const scriptMemory = process.memoryUsage();

  console.log(`\n${__filename.split('/').at(-1)} Memory Use:`);

  for (let key in scriptMemory) {
    console.log(
      `${key}: ${Math.ceil(scriptMemory[key] / (1024 * 1024))} MB`
    );
  }

  console.log(
    `\nThe json file containing ${poolSize} users with ${idSize}bits ids has been created at /home/dudeful/coding/misc/json`
  );
};

// currently limited to ~10.000.000 items due to array size limits, use the alternative userPool_streamWriting for larger pools
// for now this is the preferred method, since the output is an usable array of objects requiring no post-processing
const usersPool_simpleWriting = (poolSize, idSize) => {
  console.time('Time elapsed:');
  const users = [];

  for (let i = 0; i <= poolSize; i++) {
    let userID = generateID(users, idSize);
    let userName = generateName(names);
    let userEmail = generateEmail(userName, users, domains);
    let user = { id: userID, name: userName, email: userEmail };

    users.push(user);

    // careful: logs in loops will slow down the script
    // console.log(`${i} users created`);
  }

  fs.writeFile('json/users.json', JSON.stringify(users), (err) => {
    if (err) {
      return console.log(err);
    }
  });
  logs(poolSize, idSize);
};

// currently limited to ~50.000.000 items, probably an issue with garbage collector
// the data is being saved in streams, therefore it requires post-processing to use the data as an array of objects
// such post-processig needs implementation
const usersPool_streamWriting = (poolSize, idSize) => {
  console.time('Time elapsed:');
  const file = fs.createWriteStream('./json/users.json');
  const users = [];

  for (let i = 0; i <= poolSize; i++) {
    let userID = generateID(users, idSize);
    let userName = generateName(names);
    let userEmail = generateEmail(userName, users, domains);
    let user = { id: userID, name: userName, email: userEmail };

    users.push(user);

    file.write(JSON.stringify(user));

    // careful: logs in loops will slow down the script
    // console.log(`${i} users created`);
  }

  file.end();
  logs(poolSize, idSize);
};

// when executing the script use the following command to make node allocate more than the default 4gb of ram
// node --max-old-space-size=32768 usersGen.js
// the above command will run the script with a maximum of 32gb of ram (if available)

const poolSize = 10000;
const idSize = 20;

usersPool_simpleWriting(poolSize, idSize);
// usersPool_streamWriting(poolSize, idSize);
