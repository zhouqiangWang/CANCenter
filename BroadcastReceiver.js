const dgram = require("dgram");
const Receiver = dgram.createSocket("udp4");

const CANInterface = require('./CAN/CANInterface');

Receiver.on("listening", function() {
  let address = Receiver.address();
  console.log("UDP Receiver listening on " + address.address + ":" + address.port);
  Receiver.setBroadcast(true);
});

Receiver.on("message", function(message, rinfo) {
  console.log("Message from: " + rinfo.address + ":" + rinfo.port + " - " + message);
  let msgObj = JSON.parse(message);

  console.log("action = " + msgObj.action + ", value = " + msgObj.value);
  CANInterface[msgObj.action].apply(CANInterface, msgObj.value);
});

Receiver.bind(6024);
