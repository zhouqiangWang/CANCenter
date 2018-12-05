const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('ascii');

const CANBus = require("./CANBus.js");
const CanAPI = CANBus.CanLib;

class CANInterface {
  constructor() {
    let boardInfo = new CANBus.VCI_BOARD_INFO_EX();
    let deviceN = CanAPI.VCI_ScanDevice(1);
    let retDeviceInfo = CanAPI.VCI_ReadBoardInfoEx(0, boardInfo.ref());

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

    let retInit = CanAPI.VCI_InitCAN(CANBus.VCI_USBCAN1, 0, 0, initConfig.ref());
    console.log("Init device result = ", retInit);

    // let retStart = CanAPI.VCI_StartCAN(CANBus.VCI_USBCAN2, 0, 0);
    // console.log("result of VCI_StartCAN : ", retStart);
  }
  static getInstance() {
    return CANInterface.instance || (CANInterface.instance = new CANInterface());
  }
  setInterval(id, seconds) {
    let idNum = parseInt(id);
    console.log("setInterval - id = " + id + ", seconds = " + seconds);
    console.log("setInterval - typeof(idNum) = " + typeof idNum + ", seconds = " + seconds);

    let canSendData = new CANBus.CanObjArray(1);

    canSendData[0].DataLen = 8;
    for (let j = 0; j < canSendData[0].DataLen; j++) {
      canSendData[0].Data[j] = 0 + j + 3;
    }
    canSendData[0].Data[7] = seconds;
    canSendData[0].ExternFlag = 0;
    canSendData[0].RemoteFlag = 0;
    canSendData[0].ID = idNum;
    canSendData[0].SendType = 0;

    let resSent = CanAPI.VCI_Transmit(CANBus.VCI_USBCAN1, 0, 0, canSendData.ref(), 1);
    console.log("result of send : ", resSent);
  }
}


module.exports = CANInterface.getInstance()
