document.getElementById('img_container').innerHTML += `<img src="https://github.com/ITWSDataScience/Group3_Fall2022/blob/main/map.png?raw=true" alt="Map" class="overlay">`

let overlays = {
    'Population': 'https://github.com/ITWSDataScience/Group3_Fall2022/blob/main/population_count/population.png?raw=true',
    'Wind Speed': 'https://github.com/ITWSDataScience/Group3_Fall2022/blob/main/energy_strength/wind/wind.png?raw=true',
    'Earthquakes': 'https://github.com/ITWSDataScience/Group3_Fall2022/blob/main/natural_disasters/earthquakes/earthquakes.png?raw=true',
    'Tsunamis': 'https://github.com/ITWSDataScience/Group3_Fall2022/blob/main/natural_disasters/tsunamis/tsunamis.png?raw=true',
    'Hurricanes': 'https://github.com/ITWSDataScience/Group3_Fall2022/blob/main/natural_disasters/hurricanes/hurricanes.png?raw=true'
}

for (let overlay in overlays) {
    document.getElementById('img_container').innerHTML += `<img id="${overlay}" src="${overlays[overlay]}" alt="${overlay}" class="hidden overlay">`
    document.getElementById('toggle_menu').innerHTML += `<input type="checkbox" id="${overlay}_toggle" name="${overlay}"><label for="${overlay}">${overlay}</label><br>`
}

let toggles = document.querySelectorAll('input[type=checkbox]')
for (let toggle of toggles) {
    toggle.addEventListener('change', function() {
        let overlay = document.getElementById(toggle.name)
        if (toggle.checked) {
            overlay.classList.remove('hidden')
        } else {
            overlay.classList.add('hidden')
        }
    })
}