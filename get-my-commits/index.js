var personname = "";
var projname = "";

var FETCHSINCE = "2022-08-20T00:00:00Z";

let commitlinks = {};
let statslinks = {};
let stats = {};

let heatmap_data = {};

var reset = () => {
  commitlinks = {};
  statslinks = {};
  stats = {};

  heatmap_data = {};

  personname = "";
  projname = "";
};

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

document.getElementById("copylinks").addEventListener("click", () => {
  navigator.clipboard.writeText(Object.keys(commitlinks).reverse().join("\n"));
});

document.getElementById("download").addEventListener("click", () => {
  download(
    "contributions.txt",
    personname +
      (personname.length == 0 ? "" : "\n") +
      projname +
      "\n\nCommits:\n" +
      Object.keys(commitlinks).reverse().join("\n")
  );
});

var main = () => {
  try {
    document.getElementById("loadinggif").style.display = "block";

    document.getElementById("copylinks").style.display = "none";

    document.getElementById("download").style.display = "none";

    document.getElementById("commitlinks").innerHTML = "";
    document.getElementById("cal-heatmap").innerHTML = "";

    document.getElementById("errormsg").style.color = "transparent";

    reset();

    var repolink = document.getElementById("inputrepolink").value.trim();
    let owner = repolink.substring(
      repolink.indexOf("github.com") + 11,
      repolink.indexOf("/", repolink.indexOf("github.com") + 11)
    );
    let repo = repolink.substring(repolink.indexOf(owner) + owner.length + 1);

    let token = document.getElementById("inputtoken").value.trim();

    let headerobj = {};

    if (token.length == 40) {
      headerobj.Authorization = "token " + token;
    }

    projname = repo;

    if (repo.charAt(repo.length - 1) == "/") {
      repo = repo.substring(0, repo.length - 1);
    }

    // request format:
    // https://api.github.com/repos/bnidevs/ButtonParty/commits?author=bill.8ni@gmail.com

    var getcommitlinks = async (branchlatest) => {
      var k = 100;
      var ctr = 0;
      var sha = "";
      var latestsha = await fetch(branchlatest, {
        method: "GET",
        headers: headerobj,
      })
        .then((response) => response.json())
        .then((leaf) => {
          if (leaf["commit"]["author"]["date"] < FETCHSINCE) {
            return null;
          }
          return leaf["sha"];
        });
      var lastsha = latestsha;
      if (lastsha == null) {
        return;
      }
      while (k == 100) {
        lastsha = await fetch(
          "https://api.github.com/repos/" +
            owner +
            "/" +
            repo +
            "/commits?author=" +
            encodeURIComponent(
              document.getElementById("inputemail").value.trim()
            ) +
            "&per_page=100&sha=" +
            lastsha +
            "&since=" +
            FETCHSINCE,
          {
            method: "GET",
            headers: headerobj,
          }
        )
          .then((resp) => resp.json())
          .then((data) => {
            k = data.length;
            if (k == 0) {
              return "";
            }
            for (var i = 0; i < data.length; i++) {
              if (
                data[i]["commit"]["author"]["date"] < FETCHSINCE ||
                data[i]["html_url"] in commitlinks
              ) {
                k = 0;
              }
              commitlinks[data[i]["html_url"]] =
                data[i]["commit"]["author"]["date"];
              statslinks[data[i]["url"]] = data[i]["html_url"];
              personname = data[i]["commit"]["author"]["name"];
              // document.getElementById("commitlinks").innerHTML += '<a href="' + data[i]["html_url"] + '">' + data[i]["html_url"] + "</a>" + "<br>";
            }
            return data[data.length - 1]["sha"];
          });
      }
    };

    var getstats = async (commitlink) => {
      await fetch(commitlink, {
        method: "GET",
        headers: headerobj,
      })
        .then((resp) => resp.json())
        .then((data) => {
          stats[statslinks[commitlink]] = data.stats;
        });
    };

    var display = (runstats = false) => {
      var alllinks = Object.keys(commitlinks);

      alllinks.sort(function (a, b) {
        var keyA = new Date(commitlinks[a]),
          keyB = new Date(commitlinks[b]);
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
      });

      for (var i = 0; i < alllinks.length; i++) {
        console.log(stats[alllinks[i]]);
        document.getElementById("commitlinks").innerHTML +=
          '<tr><td><a href="' +
          alllinks[i] +
          '">' +
          alllinks[i] +
          "</a></td>" +
          (runstats
            ? '<td class="add">&nbsp;+' +
              stats[alllinks[i]].additions +
              '</td><td class="del">&nbsp;-' +
              stats[alllinks[i]].deletions +
              "</td>"
            : "") +
          "<td>" +
          new Date(commitlinks[alllinks[i]]).toDateString().substring(4) +
          "</td>" +
          "</tr>";
      }

      for (var i = 0; i < alllinks.length; i++) {
        heatmap_data[new Date(commitlinks[alllinks[i]]).getTime() / 1000] = 1;
      }

      var cal = new CalHeatMap();
      cal.init({
        start: new Date(FETCHSINCE),
        range: 5,
        domain: "month",
        subDomain: "day",
        subDomainTextFormat: "%d",
        cellRadius: 2,
        cellSize: 20,
        weekStartOnMonday: false,
        data: heatmap_data,
        highlight: "now",
        tooltip: true,
        considerMissingDataAsZero: true,
        displayLegend: false,
        legend: [1, 2, 4, 8, 16],
        legendColors: {
          min: "#fff",
          max: "#000",
        },
      });

      document.getElementById("copylinks").style.display = "block";

      document.getElementById("download").style.display = "block";

      document.getElementById("loadinggif").style.display = "none";
    };

    fetch(
      "https://api.github.com/repos/" +
        owner +
        "/" +
        repo +
        "/branches?per_page=100",
      {
        method: "GET",
        headers: headerobj,
      }
    )
      .then((response) => response.json())
      .then((branches) => {
        var rtrn = [];
        for (var i = 0; i < branches.length; i++) {
          rtrn.push(branches[i]["commit"]["url"]);
        }
        return rtrn;
      })
      .then((branchurls) => {
        Promise.all(branchurls.map(getcommitlinks)).then(() => {
          console.log(commitlinks);

          if (document.getElementById("statscheckbox").checked) {
            Promise.all(Object.keys(statslinks).map(getstats))
              .then(() => {
                console.log(stats);
              })
              .then(() => display(true));

            return true;
          } else {
            display();
          }
        });
      });

    return true;
  } catch (error) {
    console.log(error);
    document.getElementById("errormsg").style.color = "red";

    return false;
  }
};
