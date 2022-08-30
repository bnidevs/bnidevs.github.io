
const SOUND_CLASS = "triggeredSound";
const BLANK_CLASS = "triggeredBlank";

//flashes the given cell with the given class
function flash(cell, clazz=SOUND_CLASS) {
	cell.addClass(clazz);
	setTimeout(function() {cell.removeClass(clazz);}, 100);
}

//each mode is an object that holds
//the mode name as text and a function
//the function says what to do with the sound when you click the cell

const modes = {
	CUT: {
		text: "Cut",
		play: function(sound, cell) {
			
			//cut stops the current sound before restarting it
			if (sound.playing()) {
				sound.stop();
			}
			sound.play();
			flash(cell);
		},
	},
	
	OVERLAP: {
		text: "Overlap",
		play: function(sound, cell) {
			
			//overlap plays the sound on top of the old version
			//this is what happens by default with Howler
			sound.play();
			flash(cell);
		}
	},
	
	LOOP: {
		text: "Loop",
		play: function(sound, cell) {
			
			//loop pauses or resumes the sound loop
			if (!sound.playing()) {
				
				sound.play();
				cell.addClass(SOUND_CLASS);
				
			} else {
				
				//we stop the sound, instead of pause,
				//so that we seek the audio back to the start
				sound.stop();
				cell.removeClass(SOUND_CLASS);
			}
			
		}
	}
};

function nextMode(mode) {
		
	switch (mode) {
		case modes.CUT:
			return modes.OVERLAP;
			
		case modes.OVERLAP:
			return modes.LOOP;
			
		case modes.LOOP:
			return modes.CUT;
	}
}

export default class Cell {

	//id is the the cell id
	//the three buttons are "pointers" to jquery objects in the dom
	constructor(id, cellButton, modeButton, keyButton) {
		this.id = id;
		
		this.cellButton = cellButton;
		this.modeButton = modeButton;
		this.keyButton = keyButton;
		
		this.mode = modes.CUT;
		
		this.hotkey = null;
		
		//TODO
		this.sound = null;
		
		//TODO does this need to hold more things?
	}
	
	setMode(mode) {
		this.mode = mode;
		this.modeButton.text(mode.text);
		
		//we need to make sure loop is on if we're in loop mode
		if (this.sound !== null) {
			this.sound.loop(this.mode === modes.LOOP);
		}
	}
	
	//changes to the next mode
	cycleMode() {
		this.setMode(nextMode(this.mode));
	}
	
	hasHotkey() {
		return this.hotkey !== null;
	}
	
	setHotkey(key) {
		this.hotkey = key;
		this.keyButton.text(key);
	}
	
	clearHotkey() {
		this.hotkey = null;
		this.keyButton.html("&nbsp;");
	}
	
	assign(sound) {
		//if there was an existing sound, remove it
		if (this.sound !== null) {
			this.sound.unload();
		}
		
		this.sound = sound;

		this.cellButton.innerHTML = document.getElementById("waveform").innerHTML;
		document.getElementById("waveform").innerHTML = "";
		//we need to check this, in case the mode was switched to loop before a sound was loaded
		this.sound.loop(this.mode === modes.LOOP);
	}
	
	//will be called when the cell is clicked on
	//"performs" its action
	run() {
		//TODO should be fleshed out later
		//this is just a basic example
		
		console.log("clicked on cell", this.id);
		
		if (this.sound !== null) {
			this.mode.play(this.sound, this.cellButton);
		} else {
			flash(this.cellButton, BLANK_CLASS);
		}
	}
}
