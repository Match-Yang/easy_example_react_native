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
} from 'zego-express-engine-reactnative';

import {
  ZegoDeviceUpdateType,
  ZegoMediaOptions,
  ZegoParticipant,
} from './index.entity';

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
  static shared: ZegoExpressManager;
  private constructor() {
    if (!ZegoExpressManager.shared) {
      this.localParticipant = {} as ZegoParticipant;
      ZegoExpressManager.shared = this;
    }
    return ZegoExpressManager.shared;
  }
  static instance() {
    return ZegoExpressManager.shared;
  }
  static createEngine(profile: ZegoEngineProfile): Promise<ZegoExpressEngine> {
    ZegoExpressManager.shared = new ZegoExpressManager();
    return ZegoExpressEngine.createEngineWithProfile(profile).then(
      (engine: ZegoExpressEngine) => {
        console.warn('ZEGO RN LOG - createEngine success');
        ZegoExpressManager.shared.onOtherEvent();
        return engine;
      },
    );
  }
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
  enableCamera(enable: boolean): Promise<void> {
    this.localParticipant.camera = enable;
    return ZegoExpressEngine.instance()
      .enableCamera(enable)
      .then(() => {
        console.warn('ZEGO RN LOG - enableCamera success', enable);
      });
  }
  enableMic(enable: boolean): Promise<void> {
    this.localParticipant.mic = enable;
    return ZegoExpressEngine.instance()
      .muteMicrophone(!enable)
      .then(() => {
        console.warn('ZEGO RN LOG - muteMicrophone success', !enable);
      });
  }
  setLocalVideoView(renderView: number) {
    if (!this.roomID) {
      console.error(
        'ZEGO RN LOG - You need to join the room first and then set the videoView',
      );
      return;
    }
    if (renderView === null) {
      console.error('ZEGO RN LOG - You need to pass in the correct element');
      return;
    }
    const zegoView = new ZegoView(renderView, ZegoViewMode.AspectFit, 0);
    ZegoExpressEngine.instance()
      .startPreview(zegoView)
      .then(() => {
        console.warn('ZEGO RN LOG - startPreview success');
      });
  }
  setRemoteVideoView(userID: string, renderView: number) {
    if (renderView === null) {
      console.error('ZEGO RN LOG - You need to pass in the correct element');
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
    this.deviceUpdateCallback.length = 0;
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
  onRoomUserUpdate(
    fun: (
      updateType: ZegoUpdateType,
      userList: string[],
      roomID: string,
    ) => void,
  ) {
    return ZegoExpressEngine.instance().on(
      'roomUserUpdate',
      (roomID: string, updateType: ZegoUpdateType, userList: ZegoUser[]) => {
        const userIDList: string[] = [];
        userList.forEach((user: ZegoUser) => {
          userIDList.push(user.userID);
        });
        fun(updateType, userIDList, roomID);
      },
    );
  }
  onRoomUserDeviceUpdate(
    fun: (
      updateType: ZegoDeviceUpdateType,
      userID: string,
      roomID: string,
    ) => void,
  ) {
    this.deviceUpdateCallback.push(fun);
  }
  onRoomTokenWillExpire(
    fun: (roomID: string, remainTimeInSecond: number) => void,
  ) {
    return ZegoExpressEngine.instance().on('roomTokenWillExpire', fun);
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
        userList.forEach(user => {
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
      },
    );
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
      'roomStateUpdate',
      (roomID, state, errorCode) => {
        console.warn(
          'ZEGO RN LOG - roomStateUpdate callback',
          roomID,
          state,
          errorCode,
        );
      },
    );
  }

  private playStream(userID: string) {
    if (
      this.mediaOptions.includes(ZegoMediaOptions.AutoPlayAudio) ||
      this.mediaOptions.includes(ZegoMediaOptions.AutoPlayVideo)
    ) {
      const participant = this.participantDic.get(userID);
      if (participant && participant.streamID && participant.renderView) {
        const zegoView = new ZegoView(
          participant.renderView,
          ZegoViewMode.AspectFit,
          0,
        );
        ZegoExpressEngine.instance().startPlayingStream(
          participant.streamID,
          zegoView,
        );
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
