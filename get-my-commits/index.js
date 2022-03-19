document.getElementById("trigger").addEventListener("click", ()=>{
	try {
		document.getElementById("errormsg").style.color = "transparent";

		var repolink = document.getElementById("inputrepolink").value;
		let owner = repolink.substring(repolink.indexOf("github.com") + 11, repolink.indexOf("/", repolink.indexOf("github.com") + 11));
		let repo = repolink.substring(repolink.indexOf(owner) + owner.length + 1);

		if(repo.charAt(repo.length - 1) == "/"){
			repo = repo.substring(0, repo.length - 1);
		}

		// request format:
		// https://api.github.com/repos/bnidevs/ButtonParty/commits?author=bill.8ni@gmail.com

		fetch("https://api.github.com/repos/" + owner + "/" + repo + "/commits?" + document.getElementById("inputemail").value)
			.then(resp => resp.json())
			.then(data => {
				for(var i = 0; i < data.length; i++){
					document.getElementById("commitlinks").innerHTML += data[i]["html_url"] + "<br>";
				}
			});
	}catch (error){
		document.getElementById("errormsg").style.color = "red";
	}
});