//sets up the audio for recording and returns start and stop functions
var wavesurfer = WaveSurfer.create({
	container: '#waveform',
	normalize: false,
	waveColor: '#0F0',
	fillParent: true,
	minPxPerSec: 10
});

const initRecorder = () => new Promise(async resolve => {
	
	const stream = await navigator.mediaDevices.getUserMedia({audio: true});
	const mediaRecorder = new MediaRecorder(stream);
	console.log(mediaRecorder.mimeType);
	
	const audioChunks = [];

	mediaRecorder.addEventListener("dataavailable", event => {
		audioChunks.push(event.data);
	});

	//start recording
	const start = () => mediaRecorder.start();

	//stop recording and return audio
	const stop = () => new Promise(resolve => {
		
		mediaRecorder.addEventListener("stop", () => {
			
			const audioBlob = new Blob(audioChunks);
			const audioUrl = URL.createObjectURL(audioBlob);
			
			const audio = new Howl({
				src: audioUrl,
				format: "webm"
			});

			wavesurfer.load(audioUrl);
			
			//return the sound
			resolve(audio);
		});

		mediaRecorder.stop();
	});

	//return the start and stop functions
	//this is the same as {start: start, stop: stop}
	resolve({start, stop});
});

let recorder = null;

export async function start() {
	recorder = await initRecorder();
	recorder.start();
}

export async function stop() {
	let audio = await recorder.stop();
	recorder = null;
	return audio;
}

export function isRecording() {
	return recorder !== null;
}
