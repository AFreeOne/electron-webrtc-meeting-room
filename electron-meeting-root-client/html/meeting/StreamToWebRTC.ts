export default class StreamToWebRTC{

    public roomNumber;
    public remoteStream;
    public rtcPeerConnection;
    public isCaller;
    public dataChannel;
    public run(localStream){
        // 目前是局域网内，iceServers不生效
        const iceServers = {
            iceServers: [
                {urls: 'stun:192.168.0.142:13478'},
                {urls: 'stun:192.168.0.142:13479'}

            ]
        };

        let log = console.log;

        //@ts-ignore
        const socket = io((window as any).config.nodeRoomServer,{path:'/socket.io'});

        // @ts-ignore
        localVideo.onloadedmetadata = (e) => localVideo.play()
        console.log('video will be played');

        socket.on('created', room => {
            log(`socket.on('created'`)
            // @ts-ignore
            // localVideo.srcObject = localStream
            this.isCaller = true;

        })
        socket.on('joined', room => {
            log(`socket.on('joined'`)
            // @ts-ignore
            // localVideo.srcObject = localStream
            socket.emit('ready', this.roomNumber);
        })

        socket.on('ready', () => {
            log(`socket.on('ready'`)
            if (this.isCaller) {
                this.rtcPeerConnection = new RTCPeerConnection(iceServers)
                log(this.rtcPeerConnection)
                this.rtcPeerConnection.onicecandidate = function onIceCandidate(event) {
                    if(event.candidate) {
                        console.log('sending ice candidate', event.candidate);
                        socket.emit('candidate', {
                            type: 'candidate',
                            label: event.candidate.sdpMLineIndex,
                            id: event.candidate.sdMid,
                            candidate: event.candidate.candidate,
                            room: this.roomNumber
                        })
                    }
                }
                this.rtcPeerConnection.ontrack = function onAddStream(event) {
                    // @ts-ignore
                    remoteVideo.srcObject = event.streams[0];
                    this.remoteStream = event.streams[0];
                    try {
                        // @ts-ignore
                        remoteVideo.play()
                    } catch (error) {

                    }
                };
                this.rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
                if(localStream.getTracks().length > 1) {
                    this.rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
                }
                this.rtcPeerConnection.createOffer()
                    .then(sessionDescription => {
                        this.rtcPeerConnection.setLocalDescription(sessionDescription);
                        socket.emit('offer', {
                            type: 'offer',
                            sdp: sessionDescription,
                            room: this.roomNumber
                        })
                    })
                    .catch(err => {
                        console.log('error here');
                    })
                this.dataChannel = this.rtcPeerConnection.createDataChannel(this.roomNumber);
                this.dataChannel.onmessage = event => {
                    console.log(event.data, "rollercoaster");
                    // h2CallName.innerText = event.data
                }
            }
        })

        socket.on('offer', (event) => {
            log(` socket.on('offer'`)
            if (!this.isCaller) {
                this.rtcPeerConnection = new RTCPeerConnection(iceServers)
                log(this.rtcPeerConnection)
                this.rtcPeerConnection.onicecandidate = function onIceCandidate(event) {
                    if(event.candidate) {
                        console.log('sending ice candidate', event.candidate);
                        socket.emit('candidate', {
                            type: 'candidate',
                            label: event.candidate.sdpMLineIndex,
                            id: event.candidate.sdMid,
                            candidate: event.candidate.candidate,
                            room: this.roomNumber
                        })
                    }
                }
                this.rtcPeerConnection.ontrack = function onAddStream(event) {
                    // @ts-ignore
                    this.remoteVideo.srcObject = event.streams[0];
                    this.remoteStream = event.streams[0];
                };
                this.rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
                if(localStream.getTracks().length > 1){
                    this.rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
                }
                this.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
                this.rtcPeerConnection.createAnswer()
                    .then(sessionDescription => {
                        this.rtcPeerConnection.setLocalDescription(sessionDescription);
                        socket.emit('answer', {
                            type: 'answer',
                            sdp: sessionDescription,
                            room: this.roomNumber
                        })
                    })
                    .catch(err => {
                        console.log('error here');
                    })
                this.rtcPeerConnection.ondatachannel = event => {
                    this.dataChannel = event.channel;
                    this.dataChannel.onmessage = event => {
                        // h2CallName.innerText = event.data
                    }
                }
            }
        })

        socket.on('answer', (event) => {
            log(`socket.on('answer'`)
            console.log('answered done');
            this.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
        })

        socket.on('candidate', event => {
            log(`socket.on('candidate'`)
            console.log('am her for Ice', event);
            const candidate = new RTCIceCandidate({
                sdpMLineIndex: event.label,
                candidate: event.candidate
            });
            this.rtcPeerConnection.addIceCandidate(candidate);
        })

        document.getElementById('callBtn').onclick = () => {
            // @ts-ignore
            socket.emit('create or join', roomInput.value);
            // @ts-ignore
            roomNumber = roomInput.value;
        }


    }

    constructor(number) {
        this.roomNumber = number;
    }
}
