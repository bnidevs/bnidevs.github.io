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

  data = data.data // isolate rows
    .slice(1) // remove header
    .filter((e) => e[1].length > 0) // clear empty rows
    .map((e) => [
      // total tops
      ...e,
      e.reduce((a, cv) => (cv.includes("Top") ? a + 1 : a), 0),
    ])
    .map((e) => [
      // total zones
      ...e,
      e.reduce((a, cv) => (cv == "Zone" ? a + 1 : a), 0) + e[28],
    ])
    .map((e) => {
      // cast numbers
      for (let i = 5; i <= 26; i += 3) {
        e[i] = Number(e[i]);
        e[i + 1] = Number(e[i + 1]);
      }
      return e;
    })
    .map((e) => {
      let z_attempts = 0;
      for (let i = 5; i <= 26; i += 3) {
        z_attempts += e[i];
      }

      let t_attempts = 0;
      for (let i = 6; i <= 27; i += 3) {
        t_attempts += e[i];
      }

      e.push(z_attempts);
      e.push(t_attempts);

      return e;
    });

  data.sort(comparator);

  let categories = [
    data.filter((r) => r[3] == "MNB"),
    data.filter((r) => r[3] == "FNB"),
  ];

  console.log(categories);

  const output = document.getElementById("output");

  let current_category = "";
  current_category += '<table class="results">';

  current_category += `<tr class="results">
  <th class="results">Email</th>
  <th class="results">Name</th>
  <th class="results">1</th>
  <th class="results">2</th>
  <th class="results">3</th>
  <th class="results">4</th>
  <th class="results">5</th>
  <th class="results">6</th>
  <th class="results">7</th>
  <th class="results">8</th>
  <th class="results">Tops</th>
  <th class="results">Zones</th>
  <th class="results">Attempts to Top</th>
  <th class="results">Attempts to Zone</th>`;

  categories.forEach((g) => {
    //console.log(g);
    g.forEach((r) => {
      console.log(r);
      current_category += `<tr class="results">`;
      current_category += `<td class="results">${r[1]}</td>`;
      current_category += `<td class="results"><strong>${r[2]}</strong></td>`;
      for (let i = 4; i <= 25; i += 3) {
        if (r[i].includes("Top")) {
          current_category += `<td class="results">&#9608;</td>`;
        } else if (r[i].includes("Zone")) {
          current_category += `<td class="results">&#9604;</td>`;
        } else {
          current_category += `<td class="results"></td>`;
        }
      }
      current_category += `<td class="results"><strong>${r[28]}</strong></td>`;
      current_category += `<td class="results"><strong>${r[29]}</strong></td>`;
      current_category += `<td class="results">${r[30]}</td>`;
      current_category += `<td class="results">${r[31]}</td>`;
      current_category += "</tr>";
    });
    current_category += '<tr class="blank_row"></tr>';
  });

  current_category += "</table><br><br>";
  output.innerHTML += current_category;
};

const comparator = (a, b) => {
  if (a[28] != b[28]) {
    return b[28] - a[28];
  }

  if (a[29] != b[29]) {
    return b[29] - a[29];
  }

  if (a[30] != b[30]) {
    return a[30] - b[30];
  }

  return b[31] - a[31];
};
