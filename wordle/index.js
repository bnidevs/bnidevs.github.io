let accepted_words = null;

fetch(
  "https://gist.githubusercontent.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b/raw/5d752e5f0702da315298a6bb5a771586d6ff445c/wordle-answers-alphabetical.txt"
)
  .then((resp) => resp.text())
  .then((data) => data.split("\n"))
  .then((data) => {
    accepted_words = data;
  });

let all_words = null;

fetch(
  "https://gist.githubusercontent.com/cfreshman/cdcdf777450c5b5301e439061d29694c/raw/de1df631b45492e0974f7affe266ec36fed736eb/wordle-allowed-guesses.txt"
)
  .then((resp) => resp.text())
  .then((data) => data.split("\n"))
  .then((data) => {
    all_words = data;
  });

const div_insert = document.getElementById("main");

document.getElementById("curr").addEventListener("keydown", function (e) {
  if (e.code === "Enter") {
    validate(e);
  }
});

// negative number -> letter not in that spot [-5,-4,-3,-2,-1]
// null -> letter not in word
// positive number -> letter in that spot [0,1,2,3,4]

const alphabet = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
];

let info = {};

alphabet.forEach((c) => {
  info[c] = [];
});

var satisfy = (w) => {
  for (let i = 0; i < 5; i++) {
    if (info[w[i]].includes("-")) {
      console.log("eliminated: " + w + " -- does not contain " + w[i]);
      return false;
    }

    if (info[w[i]].includes(i * -1 - 1)) {
      console.log("eliminated: " + w + " -- " + w[i] + " is in the wrong pos");
      return false;
    }
  }

  for (const [k, v] of Object.entries(info)) {
    if (!v.includes("-")) {
      for (let i = 0; i < v.length; i++) {
        if (v[i] >= 0 && w[v[i]] != k) {
          console.log(
            "eliminated: " + w + " -- " + w[i] + " is in place of " + k
          );
          return false;
        }

        if (v[i] < 0 && !w.includes(k)) {
          console.log("eliminated: " + w + " -- word missing a " + k);
          return false;
        }
      }
    }
  }

  console.log("accepted: " + w);
  return true;
};

// r-,o~,a~,t-,e-

var validate = (e) => {
  let text = e.target.value;
  let spli = [];
  for (let i = 0; i < 10; i += 2) {
    spli.push(text.substr(i, i + 2));
  }

  // ~ = right letter, wrong spot
  // - = wrong letter
  // + = right letter, right spot

  for (let i = 0; i < 5; i++) {
    if (spli[i][1] == "-") {
      info[spli[i][0]].push("-");
    } else if (spli[i][1] == "+") {
      info[spli[i][0]].push(i);
    } else {
      info[spli[i][0]].push(i * -1 - 1);
    }
  }

  let possible_answers = [];

  for (let i = 0; i < accepted_words.length; i++) {
    if (satisfy(accepted_words[i])) {
      possible_answers.push(accepted_words[i]);
    }
  }

  div_insert.innerHTML = '<input type="text" id="curr"><br>';

  accepted_words = possible_answers;

  accepted_words.forEach((w) => {
    div_insert.innerHTML += w + "<br>";
  });

  document.getElementById("curr").addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
      validate(e);
    }
  });
};
