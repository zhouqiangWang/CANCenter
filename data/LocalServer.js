const http = require('http');

const HOST = "10.1.15.90";
const PORT = 5000;

class LocalServerAPI {
  constructor() {

  }
  postDeviceInfo(data) {
    let dataStr = JSON.stringify(data);
    console.log("/api/v1/dh11 - post : " + dataStr);
    let options = {
      hostname: HOST,
      port: PORT,
      path: "/api/v1/dh11",
      method: "POST",
      headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(dataStr)
      }
    };

    let postReq = http.request(options, function (res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ', chunk);
        });
    });

    postReq.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    postReq.write(dataStr);
    postReq.end();
  }

}

LocalServerAPI.getInstance = function () {
  return LocalServerAPI.instance || (LocalServerAPI.instance = new LocalServerAPI());
}

module.exports = LocalServerAPI.getInstance();
