let toggle = () => {
  const dark = document.getElementById("darkmodecheckbox").checked;

  [
    ...document.getElementsByTagName("input"),
    ...document.getElementsByTagName("body"),
    ...document.getElementsByTagName("button"),
  ].map((e) => {
    if (dark != e.classList.contains("darkmode")) {
      e.classList.toggle("darkmode");
    }
  });

  document.cookie = JSON.stringify({
    dark: document.getElementById("darkmodecheckbox").checked,
  });
};

if (
  document.cookie != "" &&
  "dark" in JSON.parse(document.cookie) &&
  JSON.parse(document.cookie)["dark"]
) {
  document.getElementById("darkmodecheckbox").checked = true;
  toggle();
}

document.getElementById("darkmodecheckbox").addEventListener("change", toggle);
