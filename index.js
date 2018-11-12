const ffi = require("ffi");
const ref = require("ref");
const refStruct = require("ref-struct");
const refArray = require("ref-array");

const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('ascii');

let VCI_INIT_CONFIG_EX = refStruct({
  "CAN_BRP": ref.types.uint32,    // range: 1~1024, CAN baudrate = 36MHz/(CAN_BRP)/(CAN_SJW+CAN_BS1+CAN_BS2)
  "CAN_SJW": ref.types.uint8,     // range: 1~4
  "CAN_BS1": ref.types.uint8,     // range: 1~16
  "CAN_BS2": ref.types.uint8,     // range: 1~8
  "CAN_Mode": ref.types.uint8,    // CAN working mode. 0: normal,1: loopback,2: silent,3: silent loopback
  "CAN_ABOM": ref.types.uint8,    // auto off line management. 0: prohibit,1: enable
  "CAN_NART": ref.types.uint8,    // text repeat send management. 0: enable text repeat sending,1: disable text repeat sending
  "CAN_RFLM": ref.types.uint8,    // FIFO lock management. 0: new text overwrite old, 1: ignore new text
  "CAN_TXFP": ref.types.uint8,    // send priority management, 0: by ID, 1: by order
  "CAN_RELAY": ref.types.uint8,   // relay feature enable. 0x00: close relay function,0x10: relay from CAN1 to CAN2,0x01: relay from CAN2 to CAN1, 0x11: bidirectionaly relay
  "Reserved": ref.types.uint32    // reserved
});

let VCI_BOARD_INFO_EX = refStruct({
  "ProductName": refArray('uint8', 32),	    //hardware name,for example: ��Ginkgo-CAN-Adapter\0��(note: include string null end'\0��)
	"FirmwareVersion": refArray('uint8', 4),	//firmware version
	"HardwareVersion": refArray('uint8', 4),	//hardware version
	"SerialNumber": refArray('uint8', 12)   	//adapter serial number
});

let VciConfigExPtr = ref.refType(VCI_INIT_CONFIG_EX);
let VciBoardInfoPtr = ref.refType(VCI_BOARD_INFO_EX);

const canLib = ffi.Library("./lib/linux/64bit/libGinkgo_Driver.so", {
  'VCI_ScanDevice': ['uint32', ['uint8']],
  'VCI_OpenDevice': ['uint32', ['uint32', 'uint32', 'uint32']],
  'VCI_CloseDevice': ['uint32', ['uint32', 'uint32']],
  'VCI_InitCAN': ['uint32', ['uint32', 'uint32', 'uint32', VciConfigExPtr]],
  'VCI_ReadBoardInfoEx': ['uint32', ['uint32', VciBoardInfoPtr]]
});

let boardInfo = new VCI_BOARD_INFO_EX();
let deviceN = canLib.VCI_ScanDevice(1);
let retDeviceInfo = canLib.VCI_ReadBoardInfoEx(0, boardInfo.ref());

console.log("deviceN = ", deviceN);
console.log("retDeviceInfo = ", retDeviceInfo);
console.log("--CAN_BoardInfo.ProductName = ", decoder.write(Buffer.from(boardInfo.ProductName)));
console.log("--CAN_BoardInfo.FirmwareVersion = ", boardInfo.FirmwareVersion);
console.log("--CAN_BoardInfo.HardwareVersion = ", boardInfo.HardwareVersion);
console.log("--CAN_BoardInfo.SerialNumber = ", boardInfo.SerialNumber);
console.log("hello from CAN");
