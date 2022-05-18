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
  ZegoMediaPlayerState,
  ZegoPublishChannel,
  ZegoMediaPlayerLoadResourceResult,
  ZegoMediaPlayerNetworkEvent,
} from 'zego-express-engine-reactnative';

import {
  ZegoDeviceUpdateType,
  ZegoMediaOptions,
  ZegoParticipant,
} from './index.entity';
import {ZegoExpressMediaPlayer} from './mediaPlayer';

export class ZegoExpressManager {
  // key is UserID, value is participant model
  private participantDic: Map<string, ZegoParticipant> = new Map();
  // key is streamID, value is participant model
  private streamDic: Map<string, ZegoParticipant> = new Map();
  private localParticipant!: ZegoParticipant;
  private roomID = '';
  private mediaOptions: ZegoMediaOptions[] = [];
  private deviceUpdateCallback: ((
    updateType: ZegoDeviceUpdateType,
    userID: string,
    roomID: string,
  ) => void)[] = [];
  private expressPlayerMedia!: ZegoExpressMediaPlayer;
  private maxMemberCount = 2;
  private previewViewMode = ZegoViewMode.AspectFit;
  private playViewMode = ZegoViewMode.AspectFit;
  private previewViewBgColor = 0;
  private playViewViewBgColor = 0;
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
        console.warn(
          '[ZEGOCLOUD LOG][Manager][createEngine] - Create engine with profile success',
        );
        ZegoExpressManager.shared.onOtherEvent();
        return engine;
      },
    );
  }
  joinRoom(
    roomID: string,
    token: string,
    user: ZegoUser,
    options: ZegoMediaOptions[],
  ): Promise<boolean> {
    if (!token) {
      console.error(
        '[ZEGOCLOUD LOG][Manager][joinRoom] - Token is empty, please enter a right token',
      );
      return Promise.resolve(false);
    }
    if (!options) {
      console.error(
        '[ZEGOCLOUD LOG][Manager][joinRoom] - Options is empty, please enter a right options',
      );
      return Promise.resolve(false);
    }
    this.roomID = roomID;
    this.mediaOptions = options;

    this.localParticipant.userID = user.userID;
    this.localParticipant.name = user.userName;
    this.localParticipant.streamID = this.generateStreamID(user.userID, roomID);

    this.participantDic.set(
      this.localParticipant.userID,
      this.localParticipant,
    );
    this.streamDic.set(this.localParticipant.streamID, this.localParticipant);

    const roomConfig = new ZegoRoomConfig(this.maxMemberCount, true, token);
    return ZegoExpressEngine.instance()
      .loginRoom(roomID, user, roomConfig)
      .then(async () => {
        console.warn('[ZEGOCLOUD LOG][Manager][joinRoom] - Login room success');
        this.localParticipant.camera = this.mediaOptions.includes(
          ZegoMediaOptions.PublishLocalVideo,
        );
        this.localParticipant.mic = this.mediaOptions.includes(
          ZegoMediaOptions.PublishLocalAudio,
        );
        if (this.localParticipant.camera || this.localParticipant.mic) {
          ZegoExpressEngine.instance()
            .startPublishingStream(this.localParticipant.streamID)
            .then(() => {
              console.warn(
                '[ZEGOCLOUD LOG][Manager][joinRoom] - Start publishing stream success',
              );
            });
          ZegoExpressEngine.instance()
            .enableCamera(this.localParticipant.camera)
            .then(() => {
              console.warn(
                '[ZEGOCLOUD LOG][Manager][joinRoom] - Enable camera success',
                this.localParticipant.camera,
              );
            });
          ZegoExpressEngine.instance()
            .muteMicrophone(!this.localParticipant.mic)
            .then(() => {
              console.warn(
                '[ZEGOCLOUD LOG][Manager][joinRoom] - Mute microphone success',
                !this.localParticipant.mic,
              );
            });
        }
        return true;
      });
  }
  enableCamera(enable: boolean): Promise<void> {
    return ZegoExpressEngine.instance()
      .enableCamera(enable)
      .then(() => {
        this.localParticipant.camera = enable;
        console.warn(
          '[ZEGOCLOUD LOG][Manager][enableCamera] - Enable camera success',
          enable,
        );
      });
  }
  enableMic(enable: boolean): Promise<void> {
    return ZegoExpressEngine.instance()
      .muteMicrophone(!enable)
      .then(() => {
        this.localParticipant.mic = enable;
        console.warn(
          '[ZEGOCLOUD LOG][Manager][muteMicrophone] - Mute microphone success',
          !enable,
        );
      });
  }
  setLocalVideoView(renderView: number) {
    if (!this.roomID) {
      console.error(
        '[ZEGOCLOUD LOG][Manager][setLocalVideoView] - You need to join the room first and then set the videoView',
      );
      return;
    }
    if (renderView === null) {
      console.error(
        '[ZEGOCLOUD LOG][Manager][setLocalVideoView] - You need to pass in the correct element',
      );
      return;
    }
    const zegoView = new ZegoView(
      renderView,
      this.previewViewMode,
      this.previewViewBgColor,
    );
    ZegoExpressEngine.instance()
      .startPreview(zegoView)
      .then(() => {
        console.warn(
          '[ZEGOCLOUD LOG][Manager][setLocalVideoView] - Start preview success',
        );
      });
  }
  async setLocalVideoResourceView(renderView: number): Promise<void> {
    if (!this.roomID) {
      console.error(
        '[ZEGOCLOUD LOG][Manager][setLocalVideoResourceView] - You need to join the room first and then set the videoView',
      );
      return Promise.reject();
    }
    if (renderView === null) {
      console.error(
        '[ZEGOCLOUD LOG][Manager][setLocalVideoResourceView] - You need to pass in the correct element',
      );
      return Promise.reject();
    }
    try {
      if (!this.expressPlayerMedia) {
        this.expressPlayerMedia = new ZegoExpressMediaPlayer();
        await this.expressPlayerMedia.init();
      }
      const zegoView = new ZegoView(
        renderView,
        this.playViewMode,
        this.playViewViewBgColor,
      );
      await this.expressPlayerMedia.setPlayerView(zegoView);
      console.warn(
        '[ZEGOCLOUD LOG][Manager][setLocalVideoResourceView] - Set player view Success',
      );
      return Promise.resolve();
    } catch (error) {
      console.error(
        '[ZEGOCLOUD LOG][Manager][setLocalVideoResourceView]',
        error,
      );
      return Promise.reject();
    }
  }
  onMediaPlayerPlayingProgress(fun: (millisecond: number) => void) {
    this.expressPlayerMedia.onMediaPlayerPlayingProgress(fun);
  }
  onMediaPlayerStateUpdate(
    fun: (state: ZegoMediaPlayerState, errorCode: number) => void,
  ) {
    this.expressPlayerMedia.onMediaPlayerStateUpdate(fun);
  }
  onMediaPlayerNetworkEvent(
    fun: (networkEvent: ZegoMediaPlayerNetworkEvent) => void,
  ) {
    this.expressPlayerMedia.onMediaPlayerNetworkEvent(fun);
  }
  loadResource(path: string) {
    return this.expressPlayerMedia
      .loadResource(path)
      .then((loadResourceResult: ZegoMediaPlayerLoadResourceResult | void) => {
        if (loadResourceResult && loadResourceResult.errorCode === 0) {
          console.warn('[ZEGOCLOUD LOG][Manager][loadResource] - Success');
          // Publish media player stream
          const {userID} = this.localParticipant;
          this.localParticipant.auxiliaryStreamID = this.generateStreamID(
            userID,
            this.roomID,
            ZegoPublishChannel.Aux,
          );
          this.participantDic.set(userID, this.localParticipant);
          this.streamDic.set(
            this.localParticipant.auxiliaryStreamID,
            this.localParticipant,
          );
          ZegoExpressEngine.instance()
            .startPublishingStream(
              this.localParticipant.auxiliaryStreamID,
              ZegoPublishChannel.Aux,
            )
            .then(() => {
              console.warn(
                '[ZEGOCLOUD LOG][Manager][startPublishingStream] - Publish success',
              );
            });
        } else {
          console.error(
            '[ZEGOCLOUD LOG][Manager][loadResource]',
            loadResourceResult,
          );
        }
        return loadResourceResult;
      });
  }
  start() {
    return this.expressPlayerMedia.start();
  }
  pause() {
    return this.expressPlayerMedia.pause();
  }
  resume() {
    return this.expressPlayerMedia.resume();
  }
  seekTo(millisecond: number) {
    return this.expressPlayerMedia.seekTo(millisecond);
  }
  getCurrentProgress() {
    return this.expressPlayerMedia.getCurrentProgress();
  }
  getTotalDuration() {
    return this.expressPlayerMedia.getTotalDuration();
  }
  stop() {
    return this.expressPlayerMedia.stop();
  }
  setRemoteVideoView(
    userID: string,
    renderView: number,
    resourceRenderView: number,
  ) {
    if (renderView === null) {
      console.error(
        '[ZEGOCLOUD LOG][Manager][setRemoteVideoView] - You need to pass in the correct element',
      );
      return;
    }
    if (resourceRenderView === null) {
      console.error(
        '[ZEGOCLOUD LOG][Manager][setRemoteVideoView] - You need to pass in the correct resource element',
      );
      return;
    }
    if (!userID) {
      console.error(
        '[ZEGOCLOUD LOG][Manager][setRemoteVideoView] - UserID is empty, please enter a right userID',
      );
    }
    const participant = this.participantDic.get(userID) as ZegoParticipant;
    participant.renderView = renderView;
    participant.resourceRenderView = resourceRenderView;
    this.participantDic.set(userID, participant);
    if (participant.streamID) {
      // inner roomStreamUpdate -> inner roomUserUpdate -> out roomUserUpdate
      this.streamDic.set(participant.streamID, participant);
    } else {
      // inner roomUserUpdate -> out roomUserUpdate -> inner roomStreamUpdate
    }
    if (participant.auxiliaryStreamID) {
      // inner roomStreamUpdate -> inner roomUserUpdate -> out roomUserUpdate
      this.streamDic.set(participant.auxiliaryStreamID, participant);
    } else {
      // inner roomUserUpdate -> out roomUserUpdate -> inner roomStreamUpdate
    }
    this.playStream(userID, ZegoPublishChannel.Main);
    this.playStream(userID, ZegoPublishChannel.Aux);
  }
  async leaveRoom(): Promise<void> {
    console.warn(
      '[ZEGOCLOUD LOG][Manager][leaveRoom] - Stop publishing stream success',
    );
    console.warn('[ZEGOCLOUD LOG][Manager][leaveRoom] - Stop preview success');
    const roomID = this.roomID;
    ZegoExpressEngine.instance().stopPublishingStream();
    ZegoExpressEngine.instance().stopPublishingStream(ZegoPublishChannel.Aux);
    ZegoExpressEngine.instance().stopPreview();
    ZegoExpressEngine.instance().stopPreview(ZegoPublishChannel.Aux);
    await this.expressPlayerMedia.destroyMediaPlayer();
    // @ts-ignore
    this.expressPlayerMedia = null;
    this.participantDic.forEach(participant => {
      ZegoExpressEngine.instance().stopPlayingStream(participant.streamID);
      console.warn(
        '[ZEGOCLOUD LOG][Manager][leaveRoom] - Stop playing stream success',
        participant.streamID,
      );
    });
    this.participantDic.clear();
    this.streamDic.clear();
    this.roomID = '';
    // @ts-ignore
    this.localParticipant = {};
    this.deviceUpdateCallback.length = 0;
    this.mediaOptions = [];

    return ZegoExpressEngine.instance()
      .logoutRoom(roomID)
      .then(() => {
        console.warn(
          '[ZEGOCLOUD LOG][Manager][leaveRoom] - Logout room success',
          roomID,
        );
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
        console.warn(
          '[ZEGOCLOUD LOG][Manager][onRoomUserUpdate]',
          roomID,
          updateType,
          userList,
        );
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
    return ZegoExpressEngine.instance().on(
      'roomTokenWillExpire',
      (roomID: string, remainTimeInSecond: number) => {
        console.warn(
          '[ZEGOCLOUD LOG][Manager][onRoomTokenWillExpire]',
          roomID,
          remainTimeInSecond,
        );
        fun(roomID, remainTimeInSecond);
      },
    );
  }
  onRoomStateUpdate(fun: (state: ZegoRoomState) => void) {
    return ZegoExpressEngine.instance().on(
      'roomStateUpdate',
      (roomID: string, state: ZegoRoomState) => {
        console.warn(
          '[ZEGOCLOUD LOG][Manager][onRoomStateUpdate]',
          roomID,
          state,
        );
        fun(state);
      },
    );
  }
  private generateStreamID(
    userID: string,
    roomID: string,
    streamChannel: ZegoPublishChannel = ZegoPublishChannel.Main,
  ): string {
    if (!userID) {
      console.error(
        '[ZEGOCLOUD LOG][Manager][generateStreamID] - UserID is empty, please enter a right userID',
      );
    }
    if (!roomID) {
      console.error(
        '[ZEGOCLOUD LOG][Manager][generateStreamID] - RoomID is empty, please enter a right roomID',
      );
    }

    // The streamID can use any character.
    // For the convenience of query, roomID + UserID + suffix is used here.
    const streamID =
      roomID +
      userID +
      (streamChannel === ZegoPublishChannel.Main ? '_main' : '_aux');
    console.warn('[ZEGOCLOUD LOG][Manager][generateStreamID]', streamID);
    return streamID;
  }
  private onOtherEvent() {
    ZegoExpressEngine.instance().on(
      'roomUserUpdate',
      (roomID: string, updateType: ZegoUpdateType, userList: ZegoUser[]) => {
        console.warn(
          '[ZEGOCLOUD LOG][Manager][roomUserUpdate]',
          roomID,
          updateType,
          userList,
        );
        userList.forEach(user => {
          const participant = this.participantDic.get(user.userID);
          if (updateType === ZegoUpdateType.Add) {
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
            if (participant) {
              const {streamID, auxiliaryStreamID} = participant;
              streamID && this.streamDic.delete(streamID);
              auxiliaryStreamID && this.streamDic.delete(auxiliaryStreamID);
              this.participantDic.delete(user.userID);
            }
          }
        });
        console.warn(
          '[ZEGOCLOUD LOG][Manager][participantDic]',
          this.participantDic,
        );
        console.warn('[ZEGOCLOUD LOG][Manager][streamDic]', this.streamDic);
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
          '[ZEGOCLOUD LOG][Manager][roomStreamUpdate]',
          roomID,
          updateType,
          streamList,
        );
        streamList.forEach(stream => {
          const streamChannel = this.getStreamChannel(stream.streamID);
          const participant = this.participantDic.get(stream.user.userID);
          const key =
            streamChannel === ZegoPublishChannel.Main
              ? 'streamID'
              : 'auxiliaryStreamID';
          if (updateType === ZegoUpdateType.Add) {
            const participant_ = {
              userID: stream.user.userID,
              name: stream.user.userName,
              [key]: stream.streamID,
            };
            if (participant) {
              // inner roomUserUpdate -> out roomUserUpdate -> inner roomStreamUpdate
              participant[key] = stream.streamID;
              this.participantDic.set(stream.user.userID, participant);
              this.streamDic.set(stream.streamID, participant);
            } else {
              // inner roomStreamUpdate -> inner roomUserUpdate -> out roomUserUpdate
              // @ts-ignore
              this.participantDic.set(stream.user.userID, participant_);
              // @ts-ignore
              this.streamDic.set(stream.streamID, participant_);
            }
            this.playStream(stream.user.userID, streamChannel);
          } else {
            ZegoExpressEngine.instance().stopPlayingStream(stream.streamID);
            this.streamDic.delete(stream.streamID);
          }
        });
        console.warn(
          '[ZEGOCLOUD LOG][Manager][participantDic]',
          this.participantDic,
        );
        console.warn('[ZEGOCLOUD LOG][Manager][streamDic]', this.streamDic);
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
        console.warn(
          '[ZEGOCLOUD LOG][Manager][remoteCameraStatusUpdate]',
          streamID,
          state,
        );
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
        console.warn(
          '[ZEGOCLOUD LOG][Manager][participantDic]',
          this.participantDic,
        );
        console.warn('[ZEGOCLOUD LOG][Manager][streamDic]', this.streamDic);
      },
    );
    ZegoExpressEngine.instance().on(
      'remoteMicStateUpdate',
      (streamID: string, state: ZegoRemoteDeviceState) => {
        console.warn(
          '[ZEGOCLOUD LOG][Manager][remoteMicStatusUpdate]',
          streamID,
          state,
        );
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
        console.warn(
          '[ZEGOCLOUD LOG][Manager][participantDic]',
          this.participantDic,
        );
        console.warn('[ZEGOCLOUD LOG][Manager][streamDic]', this.streamDic);
      },
    );
  }
  private playStream(
    userID: string,
    streamChannel: ZegoPublishChannel = ZegoPublishChannel.Main,
  ) {
    const autoPlayAudio = this.mediaOptions.includes(
      ZegoMediaOptions.AutoPlayAudio,
    );
    const autoPlayVideo = this.mediaOptions.includes(
      ZegoMediaOptions.AutoPlayVideo,
    );
    if (autoPlayAudio || autoPlayVideo) {
      const participant = this.participantDic.get(userID);
      if (!participant) {
        return;
      }

      let streamID = participant.streamID;
      let renderView = participant.renderView;
      if (streamChannel === ZegoPublishChannel.Aux) {
        streamID = participant.auxiliaryStreamID;
        renderView = participant.resourceRenderView;
      }
      if (streamID && renderView) {
        const zegoView = new ZegoView(
          renderView,
          this.playViewMode,
          this.playViewViewBgColor,
        );
        ZegoExpressEngine.instance()
          .startPlayingStream(streamID, zegoView)
          .then(() => {
            console.warn(
              '[ZEGOCLOUD LOG][Manager][playStream] - Start playing stream success',
              streamID,
              streamChannel,
              renderView,
            );
          });
        ZegoExpressEngine.instance()
          .mutePlayStreamAudio(streamID, !autoPlayAudio)
          .then(() => {
            console.warn(
              '[ZEGOCLOUD LOG][Manager][playStream] - Mute play stream audio success',
              !autoPlayAudio,
            );
          });
        ZegoExpressEngine.instance()
          .mutePlayStreamVideo(streamID, !autoPlayVideo)
          .then(() => {
            console.warn(
              '[ZEGOCLOUD LOG][Manager][playStream] - Mute play stream video success',
              !autoPlayVideo,
            );
          });
      }
    }
  }
  private getStreamChannel(streamID: string) {
    return streamID.includes('_aux')
      ? ZegoPublishChannel.Aux
      : ZegoPublishChannel.Main;
  }
}
