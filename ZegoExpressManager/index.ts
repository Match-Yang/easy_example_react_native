import ZegoExpressEngine, {
  ZegoUser,
  ZegoRoomConfig,
  ZegoEngineProfile,
  ZegoView,
  ZegoViewMode,
  ZegoUpdateType,
  ZegoRemoteDeviceState,
  ZegoPublishStreamQuality,
  ZegoPlayStreamQuality,
  ZegoStream,
  ZegoRoomState,
} from 'zego-express-engine-reactnative';

import {
  ZegoDeviceUpdateType,
  ZegoMediaOptions,
  ZegoParticipant,
} from './index.entity';

/// A wrapper for using ZegoExpressEngine's methods
///
/// We do some basic logic inside this class, if you use it somewhere then we will recommend you use it anywhere.
/// If you don't understand ZegoExpressEngine very well, do not mix two of the class on your code.
/// Instead you should use every methods call of ZegoExpressEngine inside this class
/// and do everything you want via ZegoExpressManager
/// Read more about ZegoExpressEngine: https://docs.zegocloud.com/article/13577
export class ZegoExpressManager {
  // key is UserID, value is participant model
  private participantDic: Map<string, ZegoParticipant> = new Map();
  // key is streamID, value is participant model
  private streamDic: Map<string, ZegoParticipant> = new Map();
  private localParticipant!: ZegoParticipant;
  private roomID = '';
  private mediaOptions: ZegoMediaOptions[] = [
    ZegoMediaOptions.AutoPlayAudio,
    ZegoMediaOptions.AutoPlayVideo,
    ZegoMediaOptions.PublishLocalAudio,
    ZegoMediaOptions.PublishLocalVideo,
  ];
  private deviceUpdateCallback: ((
    updateType: ZegoDeviceUpdateType,
    userID: string,
    roomID: string,
  ) => void)[] = [];
  private roomStateUpdateCallback: ((state: ZegoRoomState) => void)[] = [];
  private roomTokenWillExpireCallback: ((
    roomID: string,
    remainTimeInSecond: number,
  ) => void)[] = [];
  private roomUserUpdateCallback: ((
    updateType: ZegoUpdateType,
    userList: string[],
    roomID: string,
  ) => void)[] = [];
  private onOtherEventSwitch = false;
  static shared: ZegoExpressManager;
  private constructor() {
    if (!ZegoExpressManager.shared) {
      this.localParticipant = {} as ZegoParticipant;
      ZegoExpressManager.shared = this;
    }
    return ZegoExpressManager.shared;
  }

  /// Instance of ZegoExpressManager
  ///
  /// You should call all of the method via this instance
  static instance() {
    return ZegoExpressManager.shared;
  }

  /// Create SDK instance and setup some callbacks
  ///
  /// You need to call createEngine before call any of other methods of the SDK
  /// Read more about it: https://doc-en-api.zego.im/ReactNative/classes/_zegoexpressengine_.zegoexpressengine.html#createengine
  static createEngine(profile: ZegoEngineProfile): Promise<ZegoExpressEngine> {
    ZegoExpressManager.shared = new ZegoExpressManager();
    return ZegoExpressEngine.createEngineWithProfile(profile).then(
      (engine: ZegoExpressEngine) => {
        console.warn('ZEGO RN LOG - createEngine success');
        if (!ZegoExpressManager.shared.onOtherEventSwitch) {
          ZegoExpressManager.shared.onOtherEvent();
          ZegoExpressManager.shared.onOtherEventSwitch = true;
        }
        return engine;
      },
    );
  }
  /// Destroy the SDK instance if you have no need to use ZEGOCLOUD's API anymore.
  static destroyEngine(): Promise<void> {
    ZegoExpressManager.shared.offOtherEvent();
    ZegoExpressManager.shared.onOtherEventSwitch = false;
    return ZegoExpressEngine.destroyEngine().then(() => {
      console.warn(
        '[ZEGOCLOUD LOG][Manager][destroyEngine] - Destroy engine success',
      );
      ZegoExpressManager.shared.deviceUpdateCallback.length = 0;
      ZegoExpressManager.shared.roomStateUpdateCallback.length = 0;
      ZegoExpressManager.shared.roomTokenWillExpireCallback.length = 0;
      ZegoExpressManager.shared.roomUserUpdateCallback.length = 0;
      // @ts-ignore
      ZegoExpressManager.shared = null;
    });
  }
  /// User [user] joins into the room with id [roomID] with [options] and then can talk to others who are in the room
  ///
  /// Options are different from scenario to scenario, here are some example
  /// Video Call: [ZegoMediaOption.autoPlayVideo, ZegoMediaOption.autoPlayAudio, ZegoMediaOption.publishLocalAudio, ZegoMediaOption.publishLocalVideo]
  /// Live Streaming: - host: [ZegoMediaOption.autoPlayVideo, ZegoMediaOption.autoPlayAudio, ZegoMediaOption.publishLocalAudio, ZegoMediaOption.publishLocalVideo]
  /// Live Streaming: - audience:[ZegoMediaOption.autoPlayVideo, ZegoMediaOption.autoPlayAudio]
  /// Chat Room: - host:[ZegoMediaOption.autoPlayAudio, ZegoMediaOption.publishLocalAudio]
  /// Chat Room: - audience:[ZegoMediaOption.autoPlayAudio]
  joinRoom(
    roomID: string,
    token: string,
    user: ZegoUser,
    options?: ZegoMediaOptions[],
  ): Promise<boolean> {
    if (!token) {
      console.error('ZEGO RN LOG - token is empty, please enter a right token');
      return Promise.resolve(false);
    }
    this.roomID = roomID;
    options && (this.mediaOptions = options);

    this.localParticipant.userID = user.userID;
    this.localParticipant.name = user.userName;
    this.localParticipant.streamID = this.generateStreamID(user.userID, roomID);

    this.participantDic.set(
      this.localParticipant.userID,
      this.localParticipant,
    );
    this.streamDic.set(this.localParticipant.streamID, this.localParticipant);

    const roomConfig = new ZegoRoomConfig(0, true, token);
    return ZegoExpressEngine.instance()
      .loginRoom(roomID, user, roomConfig)
      .then(async () => {
        console.warn('ZEGO RN LOG - joinRoom success');
        this.localParticipant.camera = this.mediaOptions.includes(
          ZegoMediaOptions.PublishLocalVideo,
        );
        this.localParticipant.mic = this.mediaOptions.includes(
          ZegoMediaOptions.PublishLocalAudio,
        );
        if (this.localParticipant.camera || this.localParticipant.mic) {
          await ZegoExpressEngine.instance().startPublishingStream(
            this.localParticipant.streamID,
          );
          console.warn('ZEGO RN LOG - startPublishingStream success');
          await ZegoExpressEngine.instance().enableCamera(
            this.localParticipant.camera,
          );
          console.warn(
            'ZEGO RN LOG - enableCamera success',
            this.localParticipant.camera,
          );
          await ZegoExpressEngine.instance().muteMicrophone(
            !this.localParticipant.mic,
          );
          console.warn(
            'ZEGO RN LOG - muteMicrophone success',
            !this.localParticipant.mic,
          );
        }
        return true;
      });
  }
  /// Turn on your camera if [enable] is true
  enableCamera(enable: boolean): Promise<void> {
    this.localParticipant.camera = enable;
    return ZegoExpressEngine.instance()
      .enableCamera(enable)
      .then(() => {
        console.warn('ZEGO RN LOG - enableCamera success', enable);
      });
  }
  /// Turn on your microphone if [enable] is true
  enableMic(enable: boolean): Promise<void> {
    this.localParticipant.mic = enable;
    return ZegoExpressEngine.instance()
      .muteMicrophone(!enable)
      .then(() => {
        console.warn('ZEGO RN LOG - enableMic success', enable);
      });
  }
  enableSpeaker(enable: boolean): Promise<void> {
    this.localParticipant.speaker = enable;
    return ZegoExpressEngine.instance().muteSpeaker(!enable).then(() => {
      console.warn('[ZEGOCLOUD LOG][Manager][enableSpeaker] - Enable success',
      enable,);
    });
  }
  /// Set the tag value of ref control which can obtain by findNodeHandle method to render your own video
  setLocalVideoView(renderView: number) {
    if (!this.roomID) {
      console.error(
        'ZEGO RN LOG - You need to join the room first and then set the videoView',
      );
      return;
    }
    if (renderView === null) {
      console.error('ZEGO RN LOG - setLocalVideoView: You need to pass in the correct element');
      return;
    }
    const zegoView = new ZegoView(renderView, ZegoViewMode.AspectFit, 0);
    ZegoExpressEngine.instance()
      .startPreview(zegoView)
      .then(() => {
        console.warn('ZEGO RN LOG - startPreview success');
      });
  }
  /// Set the tag value of ref control which can obtain by findNodeHandle method to render video of user with id [userID]
  setRemoteVideoView(userID: string, renderView: number) {
    if (renderView === null) {
      console.error('ZEGO RN LOG - setRemoteVideoView: You need to pass in the correct element');
      return;
    }
    if (!userID) {
      console.error(
        'ZEGO RN LOG - userID is empty, please enter a right userID',
      );
    }
    const participant = this.participantDic.get(userID) as ZegoParticipant;
    participant.renderView = renderView;
    this.participantDic.set(userID, participant);
    if (participant.streamID) {
      // inner roomStreamUpdate -> inner roomUserUpdate -> out roomUserUpdate
      this.streamDic.set(participant.streamID, participant);
    } else {
      // inner roomUserUpdate -> out roomUserUpdate -> inner roomStreamUpdate
    }
    this.playStream(userID);
  }
  /// Leave the room when you are done the talk or if you want to join another room
  leaveRoom(): Promise<void> {
    const roomID = this.roomID;
    ZegoExpressEngine.instance().stopPublishingStream();
    console.warn('ZEGO RN LOG - stopPublishingStream');
    ZegoExpressEngine.instance().stopPreview();
    console.warn('ZEGO RN LOG - stopPreview');
    this.participantDic.forEach(participant => {
      ZegoExpressEngine.instance().stopPlayingStream(participant.streamID);
      console.warn('ZEGO RN LOG - stopPlayingStream', participant.streamID);
    });
    this.participantDic.clear();
    this.streamDic.clear();
    this.roomID = '';
    // @ts-ignore
    this.localParticipant = {};
    this.mediaOptions = [
      ZegoMediaOptions.AutoPlayAudio,
      ZegoMediaOptions.AutoPlayVideo,
      ZegoMediaOptions.PublishLocalAudio,
      ZegoMediaOptions.PublishLocalVideo,
    ];

    return ZegoExpressEngine.instance()
      .logoutRoom(roomID)
      .then(() => {
        console.warn('ZEGO RN LOG - logoutRoom success');
      });
  }

  /// Set a new token to keep access ZEGOCLOUD's SDK while onRoomTokenWillExpire has been triggered
  renewToken(roomID: string, token: string): Promise<void> {
    return ZegoExpressEngine.instance()
      .renewToken(roomID, token)
      .then(() => {
        console.warn('ZEGO RN LOG - renewToken success');
      });
  }
  /// When you join in the room it will let you know who is in the room right now with [userIDList] and will let you know who is joining the room or who is leaving after you have joined
  onRoomUserUpdate(
    fun?: (
      updateType: ZegoUpdateType,
      userList: string[],
      roomID: string,
    ) => void,
  ) {
    // If the parameter is null, the previously registered callback is cleared
    if (fun) {
      this.roomUserUpdateCallback.push(fun);
    } else {
      this.roomUserUpdateCallback.length = 0;
    }
  }
  /// Trigger when device's status of user with [userID] has been update
  onRoomUserDeviceUpdate(
    fun?: (
      updateType: ZegoDeviceUpdateType,
      userID: string,
      roomID: string,
    ) => void,
  ) {
    // If the parameter is null, the previously registered callback is cleared
    if (fun) {
      this.deviceUpdateCallback.push(fun);
    } else {
      this.deviceUpdateCallback.length = 0;
    }
  }
  /// Trigger when the access token will expire which mean you should call renewToken to set new token
  onRoomTokenWillExpire(
    fun?: (roomID: string, remainTimeInSecond: number) => void,
  ) {
    // If the parameter is null, the previously registered callback is cleared
    if (fun) {
      this.roomTokenWillExpireCallback.push(fun);
    } else {
      this.roomTokenWillExpireCallback.length = 0;
    }
  }
  /// Trigger when room's state changed
  onRoomStateUpdate(fun?: (state: ZegoRoomState) => void) {
    // If the parameter is null, the previously registered callback is cleared
    if (fun) {
      this.roomStateUpdateCallback.push(fun);
    } else {
      this.roomStateUpdateCallback.length = 0;
    }
  }
  private generateStreamID(userID: string, roomID: string): string {
    if (!userID) {
      console.error(
        'ZEGO RN LOG - userID is empty, please enter a right userID',
      );
    }
    if (!roomID) {
      console.error(
        'ZEGO RN LOG - roomID is empty, please enter a right roomID',
      );
    }

    // The streamID can use any character.
    // For the convenience of query, roomID + UserID + suffix is used here.
    const streamID = roomID + userID + '_main';
    return streamID;
  }
  private onOtherEvent() {
    ZegoExpressEngine.instance().on(
      'roomUserUpdate',
      (roomID: string, updateType: ZegoUpdateType, userList: ZegoUser[]) => {
        console.warn(
          'ZEGO RN LOG - roomUserUpdate callback',
          roomID,
          updateType,
          userList,
        );
        const userIDList: string[] = [];
        userList.forEach(user => {
          userIDList.push(user.userID);
          if (updateType === ZegoUpdateType.Add) {
            const participant = this.participantDic.get(user.userID);
            if (participant) {
              // inner roomStreamUpdate -> inner roomUserUpdate -> out roomUserUpdate
            } else {
              // inner roomUserUpdate -> out roomUserUpdate -> inner roomStreamUpdate
              this.participantDic.set(user.userID, {
                userID: user.userID,
                name: user.userName,
              } as ZegoParticipant);
            }
          } else {
            this.participantDic.delete(user.userID);
          }
        });
        this.roomUserUpdateCallback.forEach(fun => {
          fun(updateType, userIDList, roomID);
        });
      },
    );
    // Register callback, read more about: https://doc-en-api.zego.im/ReactNative/classes/_zegoexpressengine_.zegoexpressengine.html#on
    ZegoExpressEngine.instance().on(
      'roomStreamUpdate',
      (
        roomID: string,
        updateType: ZegoUpdateType,
        streamList: ZegoStream[],
      ) => {
        console.warn(
          'ZEGO RN LOG - roomStreamUpdate callback',
          roomID,
          updateType,
          streamList,
        );
        streamList.forEach(stream => {
          const participant = this.participantDic.get(stream.user.userID);
          if (updateType === ZegoUpdateType.Add) {
            const participant_ = {
              userID: stream.user.userID,
              name: stream.user.userName,
              streamID: stream.streamID,
            };
            if (participant) {
              // inner roomUserUpdate -> out roomUserUpdate -> inner roomStreamUpdate
              participant.streamID = stream.streamID;
              this.participantDic.set(stream.user.userID, participant);
              this.streamDic.set(stream.streamID, participant);
            } else {
              // inner roomStreamUpdate -> inner roomUserUpdate -> out roomUserUpdate
              this.participantDic.set(
                stream.user.userID,
                participant_ as ZegoParticipant,
              );
              this.streamDic.set(
                stream.streamID,
                participant_ as ZegoParticipant,
              );
            }
            this.playStream(stream.user.userID);
          } else {
            ZegoExpressEngine.instance().stopPlayingStream(stream.streamID);
            this.streamDic.delete(stream.streamID);
          }
        });
      },
    );
    ZegoExpressEngine.instance().on(
      'publisherQualityUpdate',
      (streamID: string, quality: ZegoPublishStreamQuality) => {
        const participant = this.streamDic.get(streamID);
        if (!participant) {
          return;
        }

        participant.publishQuality = quality.level;

        this.streamDic.set(streamID, participant);
        this.participantDic.set(participant.userID, participant);
      },
    );
    ZegoExpressEngine.instance().on(
      'playerQualityUpdate',
      (streamID: string, quality: ZegoPlayStreamQuality) => {
        const participant = this.streamDic.get(streamID);
        if (!participant) {
          return;
        }

        participant.playQuality = quality.level;

        this.streamDic.set(streamID, participant);
        this.participantDic.set(participant.userID, participant);
      },
    );
    ZegoExpressEngine.instance().on(
      'remoteCameraStateUpdate',
      (streamID: string, state: ZegoRemoteDeviceState) => {
        const participant = this.streamDic.get(streamID);
        if (participant) {
          const updateType =
            state === ZegoRemoteDeviceState.Open
              ? ZegoDeviceUpdateType.CameraOpen
              : ZegoDeviceUpdateType.CameraClose;
          participant.camera = state === ZegoRemoteDeviceState.Open;
          this.streamDic.set(streamID, participant);
          this.participantDic.set(participant.userID, participant);
          this.deviceUpdateCallback.forEach(fun => {
            fun(updateType, participant.userID, this.roomID);
          });
        }
      },
    );
    ZegoExpressEngine.instance().on(
      'remoteMicStateUpdate',
      (streamID: string, state: ZegoRemoteDeviceState) => {
        const participant = this.streamDic.get(streamID);
        if (participant) {
          const updateType =
            state === ZegoRemoteDeviceState.Open
              ? ZegoDeviceUpdateType.MicUnmute
              : ZegoDeviceUpdateType.MicMute;
          participant.mic = state === ZegoRemoteDeviceState.Open;
          this.streamDic.set(streamID, participant);
          this.participantDic.set(participant.userID, participant);
          this.deviceUpdateCallback.forEach(fun => {
            fun(updateType, participant.userID, this.roomID);
          });
        }
      },
    );
    ZegoExpressEngine.instance().on(
      'roomTokenWillExpire',
      (roomID: string, remainTimeInSecond: number) => {
        console.warn(
          '[ZEGOCLOUD LOG][Manager][roomTokenWillExpire]',
          roomID,
          remainTimeInSecond,
        );
        this.roomTokenWillExpireCallback.forEach(fun => {
          fun(roomID, remainTimeInSecond);
        });
      },
    );
    ZegoExpressEngine.instance().on(
      'roomStateUpdate',
      (roomID, state, errorCode) => {
        console.warn(
          'ZEGO RN LOG - roomStateUpdate callback',
          roomID,
          state,
          errorCode,
        );
        this.roomStateUpdateCallback.forEach(fun => {
          fun(state);
        });
      },
    );
  }
  private offOtherEvent() {
    ZegoExpressEngine.instance().off('roomUserUpdate');
    ZegoExpressEngine.instance().off('roomStreamUpdate');
    ZegoExpressEngine.instance().off('publisherQualityUpdate');
    ZegoExpressEngine.instance().off('playerQualityUpdate');
    ZegoExpressEngine.instance().off('remoteCameraStateUpdate');
    ZegoExpressEngine.instance().off('remoteMicStateUpdate');
    ZegoExpressEngine.instance().off('roomStateUpdate');
    ZegoExpressEngine.instance().off('roomTokenWillExpire');
  }
  private playStream(userID: string) {
    if (
      this.mediaOptions.includes(ZegoMediaOptions.AutoPlayAudio) ||
      this.mediaOptions.includes(ZegoMediaOptions.AutoPlayVideo)
    ) {
      const participant = this.participantDic.get(userID);
      if (participant && participant.streamID) {
        if (participant.renderView) {
          const zegoView = new ZegoView(
            participant.renderView,
            ZegoViewMode.AspectFill,
            0,
          );
          ZegoExpressEngine.instance().startPlayingStream(
            participant.streamID,
            zegoView,
          );
        } else {
          ZegoExpressEngine.instance().startPlayingStream(participant.streamID);
        }
        ZegoExpressEngine.instance().mutePlayStreamAudio(
          participant.streamID,
          !this.mediaOptions.includes(ZegoMediaOptions.AutoPlayAudio),
        );
        ZegoExpressEngine.instance().mutePlayStreamVideo(
          participant.streamID,
          !this.mediaOptions.includes(ZegoMediaOptions.AutoPlayVideo),
        );
      }
    }
  }
}
