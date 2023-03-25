let rand360 = Math.floor(Math.random() * 360);
let background_color = `hsl(${rand360} 90% 70%)`;
let text_color = `hsl(${(rand360 + 180) % 360} 90% 70%)`;

document.body.style.background = background_color;
document.getElementById('intro_title').style.color = text_color;
document.getElementById('wiper').style.backgroundColor = text_color;
document.getElementById('lines').style.color = background_color;

const intro_title = 'DYNOSAUR';

const multchar = (c, x) => {
    let s = '';
    while (x > 0) {
        s += c;
        x--;
    }
    return s;
}

for (let k = 0; k < intro_title.length; k++) {
    setTimeout(() => {
        document.getElementById('intro_title').innerText = intro_title.substring(0, k + 1);
        document.getElementById('intro_invis').innerText = intro_title.substring(k + 1);
    }, (1000 / intro_title.length) * k)
}

for (let k = 0; k < 7; k++) {
    setTimeout(() => {
        const track = document.createElement("img");
        track.src = 'trax.png';
        track.style.position = 'absolute';
        track.style.transform = `translateX(${k * (100 / 7) + (12.5 / 7)}vw) translateY(${(Math.random() - 0.5) * 10}em) rotate(${Math.random() * 40 + 70}deg)`;
        document.getElementById('trax').appendChild(track);
    }, 3000 + k * 200);
}

setTimeout(() => {
    document.getElementById('intro_title').style.display = 'none';
    document.getElementById('lines').style.display = 'flex';
}, 7000)