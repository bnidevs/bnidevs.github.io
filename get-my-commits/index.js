var main = () => {
	try {
		document.getElementById("errormsg").style.color = "transparent";

		var repolink = document.getElementById("inputrepolink").value;
		let owner = repolink.substring(repolink.indexOf("github.com") + 11, repolink.indexOf("/", repolink.indexOf("github.com") + 11));
		let repo = repolink.substring(repolink.indexOf(owner) + owner.length + 1);

		if(repo.charAt(repo.length - 1) == "/"){
			repo = repo.substring(0, repo.length - 1);
		}

		var commitlinks = [];

		// request format:
		// https://api.github.com/repos/bnidevs/ButtonParty/commits?author=bill.8ni@gmail.com

		var k = 0;
		var lastsha = null;

		fetch("https://api.github.com/repos/" + owner + "/" + repo + "/commits?author=" + document.getElementById("inputemail").value + "&per_page=100")
			.then(resp => resp.json())
			.then(data => {
				k = data.length;
				for(var i = 0; i < data.length; i++){
					document.getElementById("commitlinks").innerHTML += '<a href="' + data[i]["html_url"] + '">' + data[i]["html_url"] + "</a>" + "<br>";
				}
				lastsha = data[data.length - 1]["sha"];
			});

		while(k > 1){
			fetch("https://api.github.com/repos/" + owner + "/" + repo + "/commits?author=" + document.getElementById("inputemail").value + "&per_page=100&sha=" + lastsha)
				.then(resp => resp.json())
				.then(data => {
					k = data.length;
					for(var i = 0; i < data.length; i++){
						document.getElementById("commitlinks").innerHTML += data[i]["html_url"] + "<br>"
					}
					lastsha = data[data.length - 1]["sha"];
				});
		}

		return true;
	}catch (error){
		console.log(error);
		document.getElementById("errormsg").style.color = "red";

		return false;
	}
}