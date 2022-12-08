document.getElementById(
  "img_container"
).innerHTML += `<img src="https://github.com/ITWSDataScience/Group3_Fall2022/blob/main/map.png?raw=true" alt="Map" class="overlay">`;

let overlays = {
  Population:
    "https://github.com/ITWSDataScience/Group3_Fall2022/blob/main/population_count/population.png?raw=true",
  "Wind Speed":
    "https://github.com/ITWSDataScience/Group3_Fall2022/blob/main/energy_strength/wind/wind.png?raw=true",
  "Solar Energy":
    "https://github.com/ITWSDataScience/Group3_Fall2022/blob/main/energy_strength/solar/solar.png?raw=true",
  Earthquakes:
    "https://github.com/ITWSDataScience/Group3_Fall2022/blob/main/natural_disasters/earthquakes/earthquakes.png?raw=true",
  Tsunamis:
    "https://github.com/ITWSDataScience/Group3_Fall2022/blob/main/natural_disasters/tsunamis/tsunamis.png?raw=true",
  Hurricanes:
    "https://github.com/ITWSDataScience/Group3_Fall2022/blob/main/natural_disasters/hurricanes/hurricanes.png?raw=true",
  Vegetation:
    "https://github.com/ITWSDataScience/Group3_Fall2022/blob/main/surface_properties/vegetation/vegetation.png?raw=true",
};

for (let overlay in overlays) {
  document.getElementById(
    "img_container"
  ).innerHTML += `<img id="${overlay}" src="${overlays[overlay]}" alt="${overlay}" class="hidden overlay">`;
  document.getElementById(
    "toggle_menu"
  ).innerHTML += `<input type="checkbox" id="${overlay}_toggle" name="${overlay}"><label for="${overlay}">${overlay}</label><br>`;
}

let toggles = document.querySelectorAll("input[type=checkbox]");
for (let toggle of toggles) {
  toggle.addEventListener("change", function () {
    let overlay = document.getElementById(toggle.name);
    if (toggle.checked) {
      overlay.classList.remove("hidden");
    } else {
      overlay.classList.add("hidden");
    }
  });
}

const vw = Math.max(
  document.documentElement.clientWidth || 0,
  window.innerWidth || 0
);
let cw = 0;
document.querySelectorAll(".overlay").forEach((k) => {
  k.width = 0.8 * vw + 100 * cw;
});

document.getElementById("zoomin").addEventListener("click", () => {
  cw += 1;
  document.querySelectorAll(".overlay").forEach((k) => {
    k.width = 0.8 * vw + 100 * cw;
  });
});

document.getElementById("zoomout").addEventListener("click", () => {
  if (cw == 0) {
    return;
  }
  cw -= 1;
  document.querySelectorAll(".overlay").forEach((k) => {
    k.width = 0.8 * vw + 100 * cw;
  });
});
