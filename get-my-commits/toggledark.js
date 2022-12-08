let toggle = () => {
    document.getElementsByTagName("body")[0].classList.toggle("darkmode");
    [...document.getElementsByTagName("input")].map((e) => {
      e.classList.toggle("darkmode");
    });
    [...document.getElementsByTagName("button")].map((e) => {
      e.classList.toggle("darkmode");
    });
  
    document.cookie = JSON.stringify({
      dark: document.getElementById("darkmodecheckbox").checked,
    });
}

if (
    document.cookie != "" &&
    "dark" in JSON.parse(document.cookie) &&
    JSON.parse(document.cookie)["dark"]
  ) {
    document.getElementById("darkmodecheckbox").click();
    toggle();
}

document.getElementById("darkmodecheckbox").addEventListener("change", toggle);
