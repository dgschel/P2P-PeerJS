import { MediaConnection, Peer } from 'peerjs';

export function renderVideoStream(stream: MediaStream, canvas: HTMLCanvasElement) {
  const videoElement = document.createElement('video');
  videoElement.srcObject = stream;
  videoElement.onloadedmetadata = () => {
    videoElement.play();
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    canvas.appendChild(videoElement);

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

  handleCall = (call: MediaConnection) => {
    call.answer(this._stream);
    const canvas = createCanvasElement(640, 480);

    if (this._stream) renderVideoStream(this._stream, canvas);

    call.on("stream", (userVideoStream) => {
      renderVideoStream(userVideoStream, canvas);
    });
  }

  sendOwnMediaStream = (remoteUserId: string) => {
    const peer = this.getPeer();
    const stream = this.getStream();

    if (peer && stream) {
      const caller = peer.call(remoteUserId, stream);
      caller.answer(stream);
      const canvas = createCanvasElement(640, 480);
      caller.on('stream', (userVideoStream) => {
        renderVideoStream(userVideoStream, canvas);
      });
    }
  }

  getPeer = (): Peer | undefined => this._peer;
  getStream = (): MediaStream | undefined => this._stream;
}

export const findUser = (users: User[], userId: string): User | undefined => users.find((user) => user.userId === userId)

export function createCanvasElement(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  document.body.appendChild(canvas);
  return canvas;
}

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

export const makeCall = async (currentUser: User, remoteUserId: string) => {
  currentUser.sendOwnMediaStream(remoteUserId);
}

export const getUserMediaConstraints = (): MediaStreamConstraints => ({ video: true, audio: true });