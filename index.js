const ffi = require("ffi");
const canLib = ffi.Library("./lib/linux/64bit/libGinkgo_Driver.so", {
  'VCI_ScanDevice': ['int', ['int']]
});

let deviceN = canLib.VCI_ScanDevice(1);
console.log("deviceN = ", deviceN);
console.log("hello from CAN");
