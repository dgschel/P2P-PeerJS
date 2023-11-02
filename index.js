import { Peer } from 'peerjs';
export function renderVideoStream(stream, canvas) {
    const videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    videoElement.onloadedmetadata = () => {
        videoElement.play();
        // Stellen Sie sicher, dass das Canvas die gleiche Größe wie das Video hat.
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        // Fügen Sie das Video-Element als Kind zum Canvas hinzu
        canvas.appendChild(videoElement);
        // Zeichnen Sie das Video auf das Canvas.
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const drawVideoFrame = () => {
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                requestAnimationFrame(drawVideoFrame);
            };
            drawVideoFrame();
        }
    };
}
export class User {
    userId;
    _peer;
    _stream;
    constructor(userId) {
        this.userId = userId;
        this._peer = connectToPeerJSServer(userId);
        this.getUserMedia();
        this.listenToCall();
    }
    getUserMedia = async () => {
        this._stream = await navigator.mediaDevices.getUserMedia(getUserMediaConstraints());
    };
    listenToCall = () => {
        this._peer?.on('call', this.handleCall);
    };
    handleCall = async (call) => {
        try {
            call.answer(this._stream);
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            document.body.appendChild(canvas);
            call.on("stream", (userVideoStream) => {
                console.log('*** "stream" event received, calling renderVideoStream(userVideoStream, canvas)');
                renderVideoStream(userVideoStream, canvas);
            });
        }
        catch (err) {
            console.error('*** ERROR during call handling: ' + err);
        }
    };
    getPeer = () => this._peer;
    getStream = () => this._stream;
}
export const findUser = (users, userId) => users.find((user) => user.userId === userId);
export const connectToPeerJSServer = (userId) => {
    const peer = new Peer(userId, {
        host: "0.peerjs.com",
        port: 443,
        path: "/",
        pingInterval: 5000,
    });
    peer.on('open', (id) => {
        console.log(`Ihr PeerJS-ID : ${id}`);
    });
    return peer;
};
export const makeCall = (user, userId) => {
    const [peer, stream] = [user.getPeer(), user.getStream()];
    if (peer && stream)
        peer.call(userId, stream);
};
// export const connectToUser = (user: User) => {
//   const peer = user.getPeer();
//   const stream = user.getStream();
//   if (!peer) throw new Error('PeerJS-Server nicht verbunden');
//   if (!stream) throw new Error('Stream nicht verfügbar');
//   const call = peer.call(user.userId, stream);
//   call.on('stream', (stream: MediaStream) => { });
//   peer.on('call', (call: MediaConnection) => {
//     console.log('received call')
//     // call.answer(stream)
//     renderVideoStream(stream);
//   });
//   // handleCall(call);
// }
export const handleCall = (call) => {
    call.answer(); // Anruf annehmen
    call.on('stream', (stream) => {
        console.log('received stream');
        // Hier empfangen Sie den Videostream und den Audiostream.
        // renderVideoStream(stream);
    });
    // Optional: Wenn der Anruf beendet wird, können Sie Aktionen ausführen.
    call.on('close', () => {
        // Anruf wurde beendet
    });
};
export const getUserMediaConstraints = () => {
    return { video: true, audio: true };
};
