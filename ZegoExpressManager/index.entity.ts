export enum ZegoMediaOptions {
  AutoPlayAudio = 1,
  AutoPlayVideo = 2,
  PublishLocalAudio = 4,
  PublishLocalVideo = 8,
}

export enum ZegoDeviceUpdateType {
  CameraOpen,
  CameraClose,
  MicUnmute,
  MicMute,
}

export enum ZegoStreamQualityLevel {
  Excellent = 0,
  Good,
  Medium,
  Bad,
  Die,
}

export interface ZegoRoomConfig {
  userUpdate: boolean;
  maxMemberCount: number;
}

export interface ZegoParticipant {
  userID: string;
  name?: string;
  streamID: string;
  camera: boolean;
  mic: boolean;
  speaker: boolean;
  renderView: number;
  playQuality: ZegoStreamQualityLevel;
  publishQuality: ZegoStreamQualityLevel;
}

export enum ZegoVideoViewType {
  Local = 0,
  Remote = 1,
}
