let cookie = document.cookie;

const LEFT = "L";
const RIGHT = "R";

const directions = { L: -1, R: 1 };

const categories = { todo: 0, inprogress: 1, done: 2 };
const inv_categories = { 0: "todo", 1: "inprogress", 2: "done" };

let tasks;
let resettasks = () => {
  tasks = { todo: [], inprogress: [], done: [] };
};
resettasks();

const TEMPLATE_item = `
<div class="kanban_item flex">
    <button class="move_btn left"><</button>
    <div class="item_ctnr flex">
        <p class="item_txt"></p>
        <div class="item_fxn_col flex">
            <button class="edit_btn">Edit</button>
            <button class="del_btn">Delete</button>
        </div>
    </div>
    <button class="move_btn right">></button>
</div>
`;

let HTMLgen = (s) => {
  let placeholder_elem = document.createElement("div");
  placeholder_elem.innerHTML = s;
  return placeholder_elem.firstChild;
};

if (cookie !== "") {
  try {
    tasks = JSON.parse(cookie);
  } catch (err) {
    alert("Cookie corrupted, tasks reset");
    resettasks();
  }
}

let deltask = (e, k = null) => {
  let pk;
  if (k !== null) {
    pk = k;
  } else {
    pk = e.target;
  }

  const item_txt =
    pk.parentNode.parentNode.getElementsByClassName("item_txt")[0].innerText;
  let col = pk;
  while (!col.id.endsWith("_col")) {
    col = col.parentNode;
  }

  const col_categ = col.id.split("_")[0];

  tasks[col_categ].splice(tasks[col_categ].indexOf(item_txt), 1);

  col.removeChild(pk.parentNode.parentNode.parentNode);

  savetasks();
};

let edittask = (e) => {
  const item_txt =
    e.target.parentNode.parentNode.getElementsByClassName("item_txt")[0]
      .innerText;
  var field = document.createElement("input");
  field.value = item_txt;
  field.classList.add("item_txt");
  field.addEventListener("keydown", (e) => {
    if (e.enterKey) {
      let col = e.target;
      while (!col.id.endsWith("_col")) {
        col = col.parentNode;
      }

      const col_categ = col.id.split("_")[0];

      tasks[col_categ][tasks[col_categ].indexOf(item_txt)] = field.value;
      e.target.parentNode.replaceChild(
        HTMLgen(`<p class="item_txt">${field.value}</p>`),
        e.target
      );
    }
  });
  field.addEventListener("blur", (e) => {
    let col = e.target;
    while (!col.id.endsWith("_col")) {
      col = col.parentNode;
    }

    const col_categ = col.id.split("_")[0];

    tasks[col_categ][tasks[col_categ].indexOf(item_txt)] = field.value;
    e.target.parentNode.replaceChild(
      HTMLgen(`<p class="item_txt">${field.value}</p>`),
      e.target
    );
  });

  e.target.parentNode.parentNode.replaceChild(
    field,
    e.target.parentNode.parentNode.getElementsByClassName("item_txt")[0]
  );

  savetasks();
};

let movetask = (editbtn, currcol, dir) => {
  const item_txt =
    editbtn.parentNode.parentNode.getElementsByClassName("item_txt")[0]
      .innerText;
  if (
    (currcol === "todo" && dir === LEFT) ||
    (currcol === "done" && dir === RIGHT)
  ) {
    return;
  }

  deltask(null, editbtn);

  addtask(nextcol, item_txt);

  savetasks();
};

let addtask = (whichcol, tasktext = "", fromsave = false) => {
  // VISUAL

  let col = document.getElementById(`${whichcol}_col`);
  col.innerHTML += TEMPLATE_item;
  let colitems = col.getElementsByClassName("kanban_item");
  let latest = colitems[colitems.length - 1];

  latest.getElementsByClassName("item_txt")[0].innerText = tasktext;

  latest
    .getElementsByClassName("del_btn")[0]
    .addEventListener("click", deltask);
  latest
    .getElementsByClassName("edit_btn")[0]
    .addEventListener("click", edittask);

  latest
    .getElementsByClassName("left")[0]
    .addEventListener("click", (e) => movetask(e.target, whichcol, LEFT));
  latest
    .getElementsByClassName("right")[0]
    .addEventListener("click", (e) => movetask(e.target, whichcol, RIGHT));

  // LOGICAL

  if (!fromsave) {
    tasks[whichcol].push(tasktext);
  }

  savetasks();
};

let loadtasks = () => {
  Object.keys(tasks).forEach((col) => {
    col.forEach((t) => addtask(col, t, true));
  });
};

let savetasks = () => {
  document.cookie = JSON.stringify(tasks);

  Object.keys(categories).forEach((k) => {
    document
      .getElementById(`${k}_add`)
      .addEventListener("click", () => addtask(k, ""));
  });
};

Object.keys(categories).forEach((k) => {
  document
    .getElementById(`${k}_add`)
    .addEventListener("click", () => addtask(k, ""));
});
