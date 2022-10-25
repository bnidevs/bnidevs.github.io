document.getElementById("datepicker").max = new Date()
  .toISOString()
  .split("T")[0];
document.getElementById("datepicker").min =
  new Date().toISOString().split("-")[0] + "-01-01";

document.getElementById("datecheckbox").addEventListener("change", (e) => {
  document.getElementById("datepicker").style.display = e.target.checked
    ? "block"
    : "none";
});
