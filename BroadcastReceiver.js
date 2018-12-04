const dgram = require("dgram");
const Receiver = dgram.createSocket("udp4");

Receiver.on("listening", function() {
  let address = Receiver.address();
  console.log("UDP Receiver listening on " + address.address + ":" + address.port);
  Receiver.setBroadcast(true);
});

Receiver.on("message", function(message, rinfo) {
  console.log("Message from: " + rinfo.address + ":" + rinfo.port + " - " + message);
  console.log(message.toString());

  let task = message.toString();
  if (task === "discovery") {
    
  }
});

Receiver.bind(6024);
