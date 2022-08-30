import Cell from "./cell.js";
import * as Recorder from "./recorder.js";

//dimensions of the cell grid
const GRID_WIDTH = 5;
const GRID_HEIGHT = 5;

let BPM = 120;
//ms per beat
let BEAT_MULTIPLIER = 1 / (BPM / 60 / 1000);

//the class used for when a key button is in assigning mode
const ASSIGNING_CLASS = "assigning";

//called on page load
$(function () {
  //map (array) from cell id to cell object
  //TODO this and other state stuff should probably go in an object
  var cells = [];

  //a pointer to the cell currently waiting for a hotkey key,
  //or null if no cell is waiting
  var waitingCell = null;

  //dictionary from keyboard key to cell object
  var hotkeys = {};

  //list of Howl objects
  //TODO is this needed?
  //var sounds = [];
  //sound right after uploading or recording
  var pendingSound = null;

  //if true, currently assigning the pending sound to a cell
  var assigning = false;

  document.getElementById("bpmInput").addEventListener("change", (e) => {
    BPM = e.target.value;
    BEAT_MULTIPLIER = 1 / (BPM / 60 / 1000);
  });

  //called when a cell is clicked
  function handleGrid(event, id) {
    var target = $(event.target);

    //for whatever reason, clicking on buttons inside the cell
    //also triggers this cell click handler
    //so we only do stuff if we're clicking on the cell itself
    if (!target.hasClass("cell")) {
      return;
    }

    console.log(event);

    var cell = cells[id];

    if (assigning) {
      cell.assign(pendingSound);

      pendingSound = null;
      assigning = false;

      //TODO could flesh this out, making buttons disabled at times, etc
      $("#assign").text("assign");
      $("#status").text("sound assigned to cell " + id);
    } else {
      cell.run();
    }
  }

  //called when a mode button is clicked on
  function changeMode(event, id) {
    //TODO event is unused.
    //in general, it might make sense to put 3 functions in the
    //cell object and have it handle the three clicks
    var cell = cells[id];

    cell.cycleMode();
  }

  //called when a key-assign button is clicked
  function toggleKeyButton(event, id) {
    if (waitingCell !== null) {
      //TODO probably better way to do this
      waitingCell.keyButton.removeClass(ASSIGNING_CLASS);
    }

    var cell = cells[id];

    cell.keyButton.addClass(ASSIGNING_CLASS);
    waitingCell = cell;
  }

  //calls a function with an event and id
  //we use this to make a closure, so each cell has a different id value
  //without this, all cells would report the same (highest/last) id
  function eventWithId(func, id) {
    return function (event) {
      func(event, id);
    };
  }

  //TODO could change table to css grid?

  //create the grid
  var grid = $("#grid");
  for (var i = 0; i < GRID_HEIGHT; i++) {
    var row = $("<tr/>");

    for (var j = 0; j < GRID_WIDTH; j++) {
      //id is 0 to width*height-1
      var id = i * GRID_HEIGHT + j;

      var cell = $("<div class='cell'></div>");
      cell.click(eventWithId(handleGrid, id));

      var modeButton = $("<button class='cellButton'>Cut</button>");
      modeButton.click(eventWithId(changeMode, id));

      var keyButton = $("<button class='cellButton keyButton'>&nbsp;</button>");
      keyButton.click(eventWithId(toggleKeyButton, id));

      //append to array
      //this makes the new Cell object have jquery "pointers" to the elements in the dom
      cells.push(new Cell(id, cell, modeButton, keyButton));

      cell.append(modeButton, keyButton);
      row.append($("<td/>").html(cell));
    }

    grid.append(row);
  }

  function beat(x) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(x);
      }, 1 * BEAT_MULTIPLIER);
    });
  }

  //id of the timeout that clicks the stop button
  var timeoutId = null;

  //TODO could probably remove the "Button" suffix on these

  $("#recordButton").click(async function () {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (!Recorder.isRecording()) {
      var tempst = document.getElementById("recordButton").innerHTML;

      for (var x = 4; x > 0; x--) {
        $("#recordButton").text(x);
        var t = await beat(x);
      }

      document.getElementById("recordButton").innerHTML = tempst;

      await Recorder.start();

      //TODO should probably rename recordTime to something about beats

      timeoutId = setTimeout(function () {
        $("#recordButton").click();
      }, parseInt($("#recordTime").val() * BEAT_MULTIPLIER));
    } else {
      pendingSound = await Recorder.stop();

      $("#status").text("sound from recording loaded");
    }

    //toggles between the two icons
    $("#recordIcon").toggleClass("fa-microphone fa-stop");
  });

  $("#fileInput").change(function (event) {
    console.log("file event fired");

    if (event.target.files.length === 0) {
      return;
    }

    // Read the file from the input
    var file = event.target.files[0];
    var reader = new FileReader();

    console.log("reader");

    reader.addEventListener("load", function () {
      console.log("in event listener");
      var data = reader.result;

      pendingSound = new Howl({
        src: data,
        format: file.name.split(".").pop().toLowerCase(),
      });

      $("#status").text("sound from upload loaded");
    });

    console.log("reading");
    reader.readAsDataURL(file);
  });

  $("#pendingPlay").click(function () {
    if (pendingSound !== null) {
      console.log("playing");
      pendingSound.play();
    }
  });

  $("#assign").click(function () {
    if (assigning || pendingSound === null) {
      return;
    }

    assigning = true;
    $("#assign").text("assigning...");
  });

  //handle key presses on the page
  //if we're waiting for a key, bind it to the waiting cell
  //otherwise activate the bound cell, if there is one
  $("html").keydown(function (event) {
    var key = event.key;
    //console.log("keypress:", key);

    //if we're waiting for a new hotkey key
    if (waitingCell !== null) {
      //if this cell already has a hotkey, remove the old mapping
      if (waitingCell.hasHotkey()) {
        delete hotkeys[waitingCell.hotkey];
      }

      //if another cell is using this key,
      //un-register that key from that cell
      if (key in hotkeys) {
        hotkeys[key].clearHotkey();
      }

      //now, we add the new hotkey
      waitingCell.setHotkey(key);
      hotkeys[key] = waitingCell;

      //mark this cell as not waiting for a key anymore
      waitingCell.keyButton.removeClass(ASSIGNING_CLASS);
      waitingCell = null;
    } else {
      //otherwise it's a normal keypress that could trigger a cell

      if (key in hotkeys) {
        //trigger the bound cell's code
        hotkeys[key].run();
      }
    }
  });

  console.log("ready");
});
