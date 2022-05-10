"use strict";
exports.__esModule = true;
exports.ZegoVideoViewType = exports.ZegoStreamQualityLevel = exports.ZegoDeviceUpdateType = exports.ZegoMediaOptions = void 0;
var ZegoMediaOptions;
(function (ZegoMediaOptions) {
    ZegoMediaOptions[ZegoMediaOptions["AutoPlayAudio"] = 1] = "AutoPlayAudio";
    ZegoMediaOptions[ZegoMediaOptions["AutoPlayVideo"] = 2] = "AutoPlayVideo";
    ZegoMediaOptions[ZegoMediaOptions["PublishLocalAudio"] = 4] = "PublishLocalAudio";
    ZegoMediaOptions[ZegoMediaOptions["PublishLocalVideo"] = 8] = "PublishLocalVideo";
})(ZegoMediaOptions = exports.ZegoMediaOptions || (exports.ZegoMediaOptions = {}));
var ZegoDeviceUpdateType;
(function (ZegoDeviceUpdateType) {
    ZegoDeviceUpdateType[ZegoDeviceUpdateType["CameraOpen"] = 0] = "CameraOpen";
    ZegoDeviceUpdateType[ZegoDeviceUpdateType["CameraClose"] = 1] = "CameraClose";
    ZegoDeviceUpdateType[ZegoDeviceUpdateType["MicUnmute"] = 2] = "MicUnmute";
    ZegoDeviceUpdateType[ZegoDeviceUpdateType["MicMute"] = 3] = "MicMute";
})(ZegoDeviceUpdateType = exports.ZegoDeviceUpdateType || (exports.ZegoDeviceUpdateType = {}));
var ZegoStreamQualityLevel;
(function (ZegoStreamQualityLevel) {
    ZegoStreamQualityLevel[ZegoStreamQualityLevel["Excellent"] = 0] = "Excellent";
    ZegoStreamQualityLevel[ZegoStreamQualityLevel["Good"] = 1] = "Good";
    ZegoStreamQualityLevel[ZegoStreamQualityLevel["Medium"] = 2] = "Medium";
    ZegoStreamQualityLevel[ZegoStreamQualityLevel["Bad"] = 3] = "Bad";
    ZegoStreamQualityLevel[ZegoStreamQualityLevel["Die"] = 4] = "Die";
})(ZegoStreamQualityLevel = exports.ZegoStreamQualityLevel || (exports.ZegoStreamQualityLevel = {}));
var ZegoVideoViewType;
(function (ZegoVideoViewType) {
    ZegoVideoViewType[ZegoVideoViewType["Local"] = 0] = "Local";
    ZegoVideoViewType[ZegoVideoViewType["Remote"] = 1] = "Remote";
})(ZegoVideoViewType = exports.ZegoVideoViewType || (exports.ZegoVideoViewType = {}));
