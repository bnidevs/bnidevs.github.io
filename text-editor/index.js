var download = (filename, text) => {
  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
};

document.addEventListener(
  "keydown",
  function (e) {
    if (
      e.keyCode == 83 &&
      (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)
    ) {
      e.preventDefault();
      download("text.txt", document.getElementById("text").value);
    }
  },
  false
);

document.getElementById("btn").addEventListener("click", function (e) {
  download("text.txt", document.getElementById("text").value);
});
