const m = {
  webpage: {
    hrn: "Webpage",
    link: "https://new.rcos.io",
  },
  users: {
    hrn: "Users",
    link: "https://new.rcos.io/users",
  },
  projects: {
    hrn: "Projects",
    link: "https://new.rcos.io/projects",
  },
  meetings: {
    hrn: "Meetings",
    link: "https://new.rcos.io/meetings",
  },
  small_groups: {
    hrn: "Small Groups",
    link: "https://new.rcos.io/small_groups",
  },
  organizations: {
    hrn: "Organizations",
    link: "https://new.rcos.io/organizations",
  },
};

Object.keys(m).map((k) => {
  fetch(m[k].link, {
    cache: "no-cache",
    mode: "no-cors"
  }).then((response) => {
    console.log(response);
    console.log(response.status);
    document.querySelector(`.${k} .status`).innerText = "&#128994; 200 OK";
  });
});
