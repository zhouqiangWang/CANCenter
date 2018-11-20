const CANBus = require("./CANBus.js");

const ffi = require("ffi");
const ref = require("ref");
const refStruct = require("ref-struct");
const refArray = require("ref-array");

const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('ascii');

//5.definition of CAN initialization data type
let VCI_INIT_CONFIG = refStruct({
	"AccCode": ref.types.uint32,	//ACC code (for verification)
	"AccMask": ref.types.uint32,	//Mask code
	"Reserved": ref.types.uint32,	//reserved
	"Filter": ref.types.uint8,		//filter type.0: double filter, 1: single filter
	"Timing0": ref.types.uint8,	  //Timer 0(BTR0).
	"Timing1": ref.types.uint8,	  //Timer 1(BTR1).
	"Mode": ref.types.uint8		    //Mode
});

let VCI_INIT_CONFIG_EX = refStruct({
  "CAN_BRP": ref.types.uint32,    // range: 1~1024, CAN baudrate = 36MHz/(CAN_BRP)/(CAN_SJW+CAN_BS1+CAN_BS2)
  "CAN_SJW": ref.types.uint8,     // range: 1~4
  "CAN_BS1": ref.types.uint8,     // range: 1~16
  "CAN_BS2": ref.types.uint8,     // range: 1~8
  "CAN_Mode": ref.types.uint8,    // CAN working mode. 0: normal,1: git@github.com:zhouqiangWang/CANCenter.gitloopback,2: silent,3: silent loopback
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

let VCI_CAN_OBJ = refStruct({
  ID: 'uint32',			    //text ID.
	TimeStamp: 'uint32',	//timestamp of the frame arriving, started from initialization of CAN controller
	TimeFlag: 'uint8',  	// if using timestamp, 1: use TimeStamp, 0��not use. TimeFlag and TimeStamp is available when the frame is received frame
	SendType: 'uint8',  	//send frame type. 0: normal send, 1: single send, 2: self send/receive, 3: single self send/receive, only available when
						//the frame is send frame.(when device type is EG20T-CAN, send type will be set at VCI_InitCan and it's invalid set herein
						//When set to self send/receive mode, EG20T-CAN can not receive from bus, only can receive from itself)
	RemoteFlag: 'uint8',	//remote frame flag
	ExternFlag: 'uint8',	//extended frame flag
	DataLen: 'uint8',    	//Data length(<=8), how many uint8_ts of data
	Data: refArray('uint8', 8),		  //text data
	Reserved: refArray('uint8', 3)	//reserved
});

const CanObjArray = refArray(VCI_CAN_OBJ);

let VciConfigPtr = ref.refType(VCI_INIT_CONFIG);
let VciConfigExPtr = ref.refType(VCI_INIT_CONFIG_EX);
let VciBoardInfoPtr = ref.refType(VCI_BOARD_INFO_EX);

const canLib = ffi.Library("./lib/linux/64bit/libGinkgo_Driver.so", {
  'VCI_ScanDevice': ['uint32', ['uint8']],
  'VCI_OpenDevice': ['uint32', ['uint32', 'uint32', 'uint32']],
  'VCI_CloseDevice': ['uint32', ['uint32', 'uint32']],
  'VCI_InitCAN': ['uint32', ['uint32', 'uint32', 'uint32', VciConfigPtr]],
  'VCI_InitCANEx': ['uint32', ['uint32', 'uint32', 'uint32', VciConfigExPtr]],
  'VCI_ReadBoardInfoEx': ['uint32', ['uint32', VciBoardInfoPtr]],
  'VCI_GetReceiveNum': ['uint32', ['uint32', 'uint32', 'uint32']],
  'VCI_ClearBuffer': ['uint32', ['uint32', 'uint32', 'uint32']],
  'VCI_StartCAN': ['uint32', ['uint32', 'uint32', 'uint32']],
  'VCI_ResetCAN': ['uint32', ['uint32', 'uint32', 'uint32']],
  'VCI_RegisterReceiveCallback': ['uint32', ['uint32', 'pointer']],
  'VCI_LogoutReceiveCallback': ['uint32', ['uint32']],
  'VCI_Transmit': ['uint32', ['uint32', 'uint32', 'uint32', CanObjArray, 'uint32']],
  'VCI_Receive': ['uint32', ['uint32', 'uint32', 'uint32', CanObjArray, 'uint32' ,'uint32']]
});

let boardInfo = new CANBus.VCI_BOARD_INFO_EX();
let deviceN = canLib.VCI_ScanDevice(1);
let retDeviceInfo = canLib.VCI_ReadBoardInfoEx(0, boardInfo.ref());

console.log("deviceN = ", deviceN);
console.log("retDeviceInfo = ", retDeviceInfo);
console.log("--CAN_BoardInfo.ProductName = ", decoder.write(Buffer.from(boardInfo.ProductName)));
console.log("--CAN_BoardInfo.FirmwareVersion = ", boardInfo.FirmwareVersion);
console.log("--CAN_BoardInfo.HardwareVersion = ", boardInfo.HardwareVersion);
console.log("--CAN_BoardInfo.SerialNumber = ", boardInfo.SerialNumber);

let initConfig = new CANBus.VCI_INIT_CONFIG();
initConfig.AccCode = 0x00000000;
initConfig.AccMask = 0xFFFFFFFF;
initConfig.Filter = 1;
initConfig.Mode = 0;
initConfig.Timing0 = 0x00;
initConfig.Timing1 = 0x1C;

let retInit = canLib.VCI_InitCAN(CANBus.VCI_USBCAN2, 0, 0, initConfig.ref());
console.log("Init device result = ", retInit);

let getDataCallback = ffi.Callback('void', ['uint32', 'uint32', 'uint32'],
    function(devIndex, canIndex, len) {
      console.log("getDataCallback :");
      console.log("devIndex: ", devIndex);
      console.log("canIndex: ", canIndex);
      console.log("len: ", len);
      let dataNum = canLib.VCI_GetReceiveNum(CANBus.VCI_USBCAN2, devIndex, canIndex);
      console.log("dataNum: ", dataNum);
      if (dataNum > 0) {
        canReceiveData = new CanObjArray(2);
        canLib.VCI_Receive(CANBus.VCI_USBCAN2, devIndex, canIndex, canReceiveData, dataNum, 0);
        // console.log("receiveData = ", canReceiveData);
        for (let i = 0; i < dataNum; i++) {
          console.log("callback got");
          console.log("--CAN_ReceiveData.RemoteFlag = ", canReceiveData[i].RemoteFlag);
          console.log("--CAN_ReceiveData.ExternFlag = ", canReceiveData[i].ExternFlag);
          console.log("--CAN_ReceiveData.ID = ", canReceiveData[i].ID);
          console.log("--CAN_ReceiveData.DataLen = ", canReceiveData[i].DataLen);
          console.log("--CAN_ReceiveData.Data:");
          for (let j = 0; j < canReceiveData[i].DataLen; j++) {
            console.log("%02X ", canReceiveData[i].Data[j]);
          }

          console.log("callback TimeStamp")
          console.log("--CAN_ReceiveData.TimeStamp = ", canReceiveData[i].TimeStamp)
        }
      }
    });
let resReg = canLib.VCI_RegisterReceiveCallback(0, getDataCallback);
console.log("result of VCI_RegisterReceiveCallback = ", resReg);

let retStart = canLib.VCI_StartCAN(CANBus.VCI_USBCAN2, 0, 0);
console.log("result of VCI_StartCAN : ", retStart);

let canSendData = new CanObjArray(2);

for (let i = 0; i < 2; i++) {
  canSendData[i].DataLen = 8;
  for (let j = 0; j < canSendData[i].DataLen; j++) {
    canSendData[i].Data[j] = i + j + 3;
  }
  canSendData[i].ExternFlag = 0;
  canSendData[i].RemoteFlag = 0;
  canSendData[i].ID = 0x155+i;
  canSendData[i].SendType = 2;
}
// console.log("canSendData[1] = ", canSendData[1]);
console.log("typeof canSendData = ", typeof canSendData);
resSent = canLib.VCI_Transmit(CANBus.VCI_USBCAN2, 0, 0, canSendData.ref(), 2);
console.log("result of send : ", resSent);

setTimeout(() => {
  console.log("Enter the enter to continue");
  let stdin = process.openStdin();

  stdin.addListener("data", function(d) {
      // note:  d is an object, and when converted to a string it will
      // end with a linefeed.  so we (rather crudely) account for that
      // with toString() and then trim()
      console.log("you entered: [" +
          d.toString().trim() + "]");
    });
}, 3000);
