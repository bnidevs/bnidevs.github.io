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
  fetch(m.k.link).then((response) => {
    document.querySelector(`.${k}.status`).innerText = response.status;
  });
});
