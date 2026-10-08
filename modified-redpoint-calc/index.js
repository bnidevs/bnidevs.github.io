let upload;

document.getElementById("f").addEventListener("change", async (e) => {
  const file = e.target.files[0]; // grab file upload
  upload = await file.text();
});

document.getElementById("submit").addEventListener("click", (e) => {
  process();
});

const process = () => {
  let data = Papa.parse(upload);
  // console.log(data); // check console for malformed data here

  const category_names = ['RECREATIONAL', 'INTERMEDIATE', 'ADVANCED'];

  const thresholds = {
    RECREATIONAL: document.getElementById("recreational").value,
    INTERMEDIATE: document.getElementById("intermediate").value,
    ADVANCED: document.getElementById("advanced").value,
  };

  const bumps = {
    RECREATIONAL: "INTERMEDIATE",
    INTERMEDIATE: "ADVANCED",
  };

  data = data.data                    // isolate rows
    .slice(1)                         // remove header
    .filter(e => e[1].length > 0)     // clear empty rows
    .map(e => {                       // cast numbers
      for(let i = 5; i < 11; i++){
        e[i] = Number(e[i]);
        if (isNaN(e[i])) {
          e[i] = 0;
        }
      }
      return e;
    })
    .map((e) => [
      ...e,
      e.slice(5, 10).reduce((a, cv) => a + cv, 0), // add totals
    ])
    .map((e) => [
      ...e.slice(0, 5), // sort boulders
      ...e.slice(5, 10).sort((a, b) => b - a),
      ...e.slice(10),
    ])
    .map(e => {                       // bump category
      if (e[5] > thresholds[e[4]]) {
        e.push("bumped!");
        while (e[5] > thresholds[e[4]]) {
          e[4] = category_names[category_names.indexOf(e[4]) + 1];
        }
      }
      return e;
    });

  let categories = Object.keys(thresholds).map((k) =>
    data.filter((e) => e[4] == k),
  ); // divide by category

  categories = categories
    .map((c) => c.sort(comparator)) // sort by score
    .map((c) => [
      c.filter((r) => r[3].startsWith("MALE")),
      c.filter((r) => r[3].startsWith("FEMALE")),
    ]); // divide by gender

  const output = document.getElementById("output");

  const ranks = ["gold", "silver", "bronze", "no_podium"];

  let current_category = "";
  current_category += '<table class="results">';

  categories.forEach((c) => {
    //console.log(c);
    c.forEach((g) => {
      //console.log(g);
      let current_rank = 0;
      let current_best = [g[0][10], g[0][11]];
      g.forEach((r) => {
        if (r[11] < current_best[1] || r[10] > current_best[0]) {
          current_best = [r[10], r[11]];
          current_rank += 1;
          current_rank = Math.min(current_rank, ranks.length - 1);
        }
        current_category += `<tr class="results ${ranks[current_rank]}">`;
        current_category += `<td class="results">${r[1]}</td>`;
        current_category += `<td class="results"><strong>${r[2]}</strong></td>`;
        for (let k = 3; k < 11; k++) {
          current_category += `<td class="results">${r[k]}</td>`;
        }
        current_category += `<td class="results"><strong>${r[11]}</strong></td>`;
        if (r.length > 12) {
          current_category += `<td class="results">${r[12]}</td>`;
        }
        current_category += '</tr>';
      });
      current_category += '<tr class="blank_row"></tr>';
    });
  });

  current_category += "</table><br><br>";
  output.innerHTML += current_category;
};

const comparator = (a, b) => {
  if (a[11] == b[11]) {
    return a[10] - b[10];
  } else {
    return b[11] - a[11];
  }
};
