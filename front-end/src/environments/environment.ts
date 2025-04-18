//FOR LOCALHOST
//export const environment = {
//wssocketIp:'ws://192.168.2.95:8080'
//}

//FOR PRODUCTION
// Environment Configuration
export const environment = {
    wssocketIp: `ws://${window.location.hostname}:8080`, // Dynamically uses the hostname and port for the WebSocket connection
    socketIp: `ws://${window.location.hostname}:3007`, // Dynamically uses the hostname and port for the Socket connection
    //wssocketIp: `ws://192.168.2.95:8080`,

};