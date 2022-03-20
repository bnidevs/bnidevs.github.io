var name = "";
var projname = "";

var download = (filename, text) => {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

document.getElementById("copylinks").addEventListener("click", () => {
	navigator.clipboard.writeText(document.getElementById("commitlinks").innerText);
});

document.getElementById("download").addEventListener("click", () => {
	download("contributions.txt", name + (name.length == 0 ? "" : "\n") + projname + "\n\nCommits:\n" + document.getElementById("commitlinks").innerText);
});

var main = () => {
	try {
		document.getElementById("loadinggif").style.display = "block";

		document.getElementById("copylinks").style.display = "none";

		document.getElementById("download").style.display = "none";

		document.getElementById("commitlinks").innerHTML = "";

		document.getElementById("errormsg").style.color = "transparent";

		var repolink = document.getElementById("inputrepolink").value;
		let owner = repolink.substring(repolink.indexOf("github.com") + 11, repolink.indexOf("/", repolink.indexOf("github.com") + 11));
		let repo = repolink.substring(repolink.indexOf(owner) + owner.length + 1);

		projname = repo;

		if(repo.charAt(repo.length - 1) == "/"){
			repo = repo.substring(0, repo.length - 1);
		}

		var commitlinks = {};

		// request format:
		// https://api.github.com/repos/bnidevs/ButtonParty/commits?author=bill.8ni@gmail.com

		var getcommitlinks = async (branchlatest) => {
			var k = 100;
			var ctr = 0;
			var sha = "";
			var latestsha = await fetch(branchlatest)
				.then(response => response.json())
				.then(leaf => {
					name = leaf["commit"]["author"]["name"];
					return leaf["sha"];
			});
			var lastsha = latestsha;
			while(k > 1){
				lastsha = await fetch("https://api.github.com/repos/" + owner + "/" + repo + "/commits?author=" + document.getElementById("inputemail").value + "&per_page=100&sha=" + lastsha)
					.then(resp => resp.json())
					.then(data => {
						k = data.length;
						for(var i = 0; i < data.length; i++){
							commitlinks[data[i]["html_url"]] = data[i]["commit"]["author"]["date"];
							// document.getElementById("commitlinks").innerHTML += '<a href="' + data[i]["html_url"] + '">' + data[i]["html_url"] + "</a>" + "<br>";
						}
						return data[data.length - 1]["sha"];
					});
			}
		}

		fetch("https://api.github.com/repos/" + owner + "/" + repo + "/branches")
			.then(response => response.json())
			.then(branches => {
				var rtrn = [];
				for(var i = 0; i < branches.length; i++){
					rtrn.push(branches[i]["commit"]["url"]);
				}
				return rtrn;
			}).then(branchurls => {
				Promise
					.all(branchurls.map(getcommitlinks))
					.then(() => {

						var alllinks = Object.keys(commitlinks);

						alllinks.sort(function(a, b) {
						  var keyA = new Date(commitlinks[a]),
						    keyB = new Date(commitlinks[b]);
						  if (keyA < keyB) return -1;
						  if (keyA > keyB) return 1;
						  return 0;
						});

						for(var i = 0; i < alllinks.length; i++){
							document.getElementById("commitlinks").innerHTML += '<a href="' + alllinks[i] + '">' + alllinks[i] + "</a>" + "<br>";
						}

						document.getElementById("copylinks").style.display = "block";

						document.getElementById("download").style.display = "block";

						document.getElementById("loadinggif").style.display = "none";
					});
			});

		return true;
	}catch (error){
		console.log(error);
		document.getElementById("errormsg").style.color = "red";

		return false;
	}
}