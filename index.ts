import { MediaConnection, Peer } from 'peerjs';

export function renderVideoStream(stream: MediaStream, canvas: HTMLCanvasElement) {
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
  private _peer: Peer | undefined;
  private _stream: MediaStream | undefined;

  constructor(public userId: string, public useOwnMedia: boolean = false) {
    this._peer = connectToPeerJSServer(userId);
    this.getUserMedia();
    this.listenToCall();
  }

  getUserMedia = async () => {
    if (!this.useOwnMedia) return;
    this._stream = await navigator.mediaDevices.getUserMedia(getUserMediaConstraints());
  }

  listenToCall = () => {
    this._peer?.on('call', this.handleCall);
  }

  handleCall = async (call: MediaConnection) => {
    try {
      call.answer(this._stream);
      console.log('*** "answer" event sent', this._stream, call)

      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      document.body.appendChild(canvas);
      
      if (this._stream) renderVideoStream(this._stream, canvas);

      // call.on("stream", (userVideoStream) => {
      //   console.log('*** "stream" event received, calling renderVideoStream(userVideoStream, canvas)');
      //   renderVideoStream(userVideoStream, canvas);
      // });
    } catch (err) {
      console.error('*** ERROR during call handling: ' + err);
    }
  }

  getPeer = (): Peer | undefined => this._peer;
  getStream = (): MediaStream | undefined => this._stream;
}

export const findUser = (users: User[], userId: string): User | undefined => users.find((user) => user.userId === userId)

export const connectToPeerJSServer = (userId: string): Peer => {
  const peer = new Peer(userId, {
    host: "0.peerjs.com",
    port: 443,
    path: "/",
    pingInterval: 5000,
  });

  peer.on('open', (id: string) => {
    console.log(`Ihr PeerJS-ID : ${id}`);
  });

  return peer;
}

export const makeCall = (user: User, userId: string) => {
  const peer = user.getPeer();
  const stream = user.getStream();

  if (peer && stream) peer.call(userId, stream);
}

export const getUserMediaConstraints = (): MediaStreamConstraints => ({ video: true, audio: true });

