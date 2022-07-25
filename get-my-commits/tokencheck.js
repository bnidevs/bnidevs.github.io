const check = "&#x2705";
const xmark = "&#x274C";

document.getElementById("tokencheckbutton").addEventListener("click", () => {
  const tokenfield = document.getElementById("inputtoken");
  const tokenstatus = document.getElementById("tokenstatus");

  const tokenval = tokenfield.value.trim();

  let headerobj = {};

  if (tokenval.length == 40) {
    headerobj.Authorization = "token " + tokenval;
  }else{
    tokenstatus.innerHTML = xmark;
    return;
  }

  fetch(
    "https://api.github.com/repos/bnidevs/bnidevs.github.io/commits",
    {
      method: "GET",
      headers: headerobj,
    }
  ).then(response => {
    for(let i of response.headers.entries()){
      if(i[0] == "x-ratelimit-limit"){
        document.getElementById("statscheckbox").disabled = !(i[1] === "5000");
        tokenfield.disabled = (i[1] === "5000");
        tokenstatus.innerHTML = i[1] === "5000" ? check : xmark;
        break;
      }
    }
  });
});