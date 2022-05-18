'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) {
            throw t[1];
          }
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = {next: verb(0), throw: verb(1), return: verb(2)}),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) {
        throw new TypeError('Generator is already executing.');
      }
      while (_) {
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y.return
                  : op[0]
                  ? y.throw || ((t = y.return) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          ) {
            return t;
          }
          if (((y = 0), t)) {
            op = [op[0] & 2, t.value];
          }
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return {value: op[1], done: false};
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) {
                _.ops.pop();
              }
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      }
      if (op[0] & 5) {
        throw op[1];
      }
      return {value: op[0] ? op[1] : void 0, done: true};
    }
  };
exports.__esModule = true;
exports.ZegoExpressManager = void 0;
var zego_express_engine_reactnative_1 = require('zego-express-engine-reactnative');
var index_entity_1 = require('./index.entity');
var mediaPlayer_1 = require('./mediaPlayer');
var ZegoExpressManager = /** @class */ (function () {
  function ZegoExpressManager() {
    // key is UserID, value is participant model
    this.participantDic = new Map();
    // key is streamID, value is participant model
    this.streamDic = new Map();
    this.roomID = '';
    this.mediaOptions = [];
    this.deviceUpdateCallback = [];
    this.maxMemberCount = 2;
    this.previewViewMode =
      zego_express_engine_reactnative_1.ZegoViewMode.AspectFit;
    this.playViewMode =
      zego_express_engine_reactnative_1.ZegoViewMode.AspectFit;
    this.previewViewBgColor = 0;
    this.playViewViewBgColor = 0;
    if (!ZegoExpressManager.shared) {
      this.localParticipant = {};
      ZegoExpressManager.shared = this;
    }
    return ZegoExpressManager.shared;
  }
  ZegoExpressManager.instance = function () {
    return ZegoExpressManager.shared;
  };
  ZegoExpressManager.createEngine = function (profile) {
    ZegoExpressManager.shared = new ZegoExpressManager();
    return zego_express_engine_reactnative_1.default
      .createEngineWithProfile(profile)
      .then(function (engine) {
        console.warn(
          '[ZEGOCLOUD LOG][Manager][createEngine] - Create engine with profile success',
        );
        ZegoExpressManager.shared.onOtherEvent();
        return engine;
      });
  };
  ZegoExpressManager.prototype.joinRoom = function (
    roomID,
    token,
    user,
    options,
  ) {
    var _this = this;
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
    var roomConfig = new zego_express_engine_reactnative_1.ZegoRoomConfig(
      this.maxMemberCount,
      true,
      token,
    );
    return zego_express_engine_reactnative_1.default
      .instance()
      .loginRoom(roomID, user, roomConfig)
      .then(function () {
        return __awaiter(_this, void 0, void 0, function () {
          var _this = this;
          return __generator(this, function (_a) {
            console.warn(
              '[ZEGOCLOUD LOG][Manager][joinRoom] - Login room success',
            );
            this.localParticipant.camera = this.mediaOptions.includes(
              index_entity_1.ZegoMediaOptions.PublishLocalVideo,
            );
            this.localParticipant.mic = this.mediaOptions.includes(
              index_entity_1.ZegoMediaOptions.PublishLocalAudio,
            );
            if (this.localParticipant.camera || this.localParticipant.mic) {
              zego_express_engine_reactnative_1.default
                .instance()
                .startPublishingStream(this.localParticipant.streamID)
                .then(function () {
                  console.warn(
                    '[ZEGOCLOUD LOG][Manager][joinRoom] - Start publishing stream success',
                  );
                });
              zego_express_engine_reactnative_1.default
                .instance()
                .enableCamera(this.localParticipant.camera)
                .then(function () {
                  console.warn(
                    '[ZEGOCLOUD LOG][Manager][joinRoom] - Enable camera success',
                    _this.localParticipant.camera,
                  );
                });
              zego_express_engine_reactnative_1.default
                .instance()
                .muteMicrophone(!this.localParticipant.mic)
                .then(function () {
                  console.warn(
                    '[ZEGOCLOUD LOG][Manager][joinRoom] - Mute microphone success',
                    !_this.localParticipant.mic,
                  );
                });
            }
            return [2 /*return*/, true];
          });
        });
      });
  };
  ZegoExpressManager.prototype.enableCamera = function (enable) {
    var _this = this;
    return zego_express_engine_reactnative_1.default
      .instance()
      .enableCamera(enable)
      .then(function () {
        _this.localParticipant.camera = enable;
        console.warn(
          '[ZEGOCLOUD LOG][Manager][enableCamera] - Enable camera success',
          enable,
        );
      });
  };
  ZegoExpressManager.prototype.enableMic = function (enable) {
    var _this = this;
    return zego_express_engine_reactnative_1.default
      .instance()
      .muteMicrophone(!enable)
      .then(function () {
        _this.localParticipant.mic = enable;
        console.warn(
          '[ZEGOCLOUD LOG][Manager][muteMicrophone] - Mute microphone success',
          !enable,
        );
      });
  };
  ZegoExpressManager.prototype.setLocalVideoView = function (renderView) {
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
    var zegoView = new zego_express_engine_reactnative_1.ZegoView(
      renderView,
      this.previewViewMode,
      this.previewViewBgColor,
    );
    zego_express_engine_reactnative_1.default
      .instance()
      .startPreview(zegoView)
      .then(function () {
        console.warn(
          '[ZEGOCLOUD LOG][Manager][setLocalVideoView] - Start preview success',
        );
      });
  };
  ZegoExpressManager.prototype.setLocalVideoResourceView = function (
    renderView,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      var zegoView, error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!this.roomID) {
              console.error(
                '[ZEGOCLOUD LOG][Manager][setLocalVideoResourceView] - You need to join the room first and then set the videoView',
              );
              return [2 /*return*/, Promise.reject()];
            }
            if (renderView === null) {
              console.error(
                '[ZEGOCLOUD LOG][Manager][setLocalVideoResourceView] - You need to pass in the correct element',
              );
              return [2 /*return*/, Promise.reject()];
            }
            _a.label = 1;
          case 1:
            _a.trys.push([1, 5, , 6]);
            if (this.expressPlayerMedia) {
              return [3 /*break*/, 3];
            }
            this.expressPlayerMedia =
              new mediaPlayer_1.ZegoExpressMediaPlayer();
            return [4 /*yield*/, this.expressPlayerMedia.init()];
          case 2:
            _a.sent();
            _a.label = 3;
          case 3:
            zegoView = new zego_express_engine_reactnative_1.ZegoView(
              renderView,
              this.playViewMode,
              this.playViewViewBgColor,
            );
            return [
              4 /*yield*/,
              this.expressPlayerMedia.setPlayerView(zegoView),
            ];
          case 4:
            _a.sent();
            console.warn(
              '[ZEGOCLOUD LOG][Manager][setLocalVideoResourceView] - Set player view Success',
            );
            return [2 /*return*/, Promise.resolve()];
          case 5:
            error_1 = _a.sent();
            console.error(
              '[ZEGOCLOUD LOG][Manager][setLocalVideoResourceView]',
              error_1,
            );
            return [2 /*return*/, Promise.reject()];
          case 6:
            return [2 /*return*/];
        }
      });
    });
  };
  ZegoExpressManager.prototype.onMediaPlayerPlayingProgress = function (fun) {
    this.expressPlayerMedia.onMediaPlayerPlayingProgress(fun);
  };
  ZegoExpressManager.prototype.onMediaPlayerStateUpdate = function (fun) {
    this.expressPlayerMedia.onMediaPlayerStateUpdate(fun);
  };
  ZegoExpressManager.prototype.onMediaPlayerNetworkEvent = function (fun) {
    this.expressPlayerMedia.onMediaPlayerNetworkEvent(fun);
  };
  ZegoExpressManager.prototype.loadResource = function (path) {
    var _this = this;
    return this.expressPlayerMedia
      .loadResource(path)
      .then(function (loadResourceResult) {
        if (loadResourceResult && loadResourceResult.errorCode === 0) {
          console.warn('[ZEGOCLOUD LOG][Manager][loadResource] - Success');
          // Publish media player stream
          var userID = _this.localParticipant.userID;
          _this.localParticipant.auxiliaryStreamID = _this.generateStreamID(
            userID,
            _this.roomID,
            zego_express_engine_reactnative_1.ZegoPublishChannel.Aux,
          );
          _this.participantDic.set(userID, _this.localParticipant);
          _this.streamDic.set(
            _this.localParticipant.auxiliaryStreamID,
            _this.localParticipant,
          );
          zego_express_engine_reactnative_1.default
            .instance()
            .startPublishingStream(
              _this.localParticipant.auxiliaryStreamID,
              zego_express_engine_reactnative_1.ZegoPublishChannel.Aux,
            )
            .then(function () {
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
  };
  ZegoExpressManager.prototype.start = function () {
    return this.expressPlayerMedia.start();
  };
  ZegoExpressManager.prototype.pause = function () {
    return this.expressPlayerMedia.pause();
  };
  ZegoExpressManager.prototype.resume = function () {
    return this.expressPlayerMedia.resume();
  };
  ZegoExpressManager.prototype.seekTo = function (millisecond) {
    return this.expressPlayerMedia.seekTo(millisecond);
  };
  ZegoExpressManager.prototype.getCurrentProgress = function () {
    return this.expressPlayerMedia.getCurrentProgress();
  };
  ZegoExpressManager.prototype.getTotalDuration = function () {
    return this.expressPlayerMedia.getTotalDuration();
  };
  ZegoExpressManager.prototype.stop = function () {
    return this.expressPlayerMedia.stop();
  };
  ZegoExpressManager.prototype.setRemoteVideoView = function (
    userID,
    renderView,
    resourceRenderView,
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
    var participant = this.participantDic.get(userID);
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
    this.playStream(
      userID,
      zego_express_engine_reactnative_1.ZegoPublishChannel.Main,
    );
    this.playStream(
      userID,
      zego_express_engine_reactnative_1.ZegoPublishChannel.Aux,
    );
  };
  ZegoExpressManager.prototype.leaveRoom = function () {
    return __awaiter(this, void 0, void 0, function () {
      var roomID;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            console.warn(
              '[ZEGOCLOUD LOG][Manager][leaveRoom] - Stop publishing stream success',
            );
            console.warn(
              '[ZEGOCLOUD LOG][Manager][leaveRoom] - Stop preview success',
            );
            roomID = this.roomID;
            zego_express_engine_reactnative_1.default
              .instance()
              .stopPublishingStream();
            zego_express_engine_reactnative_1.default
              .instance()
              .stopPublishingStream(
                zego_express_engine_reactnative_1.ZegoPublishChannel.Aux,
              );
            zego_express_engine_reactnative_1.default.instance().stopPreview();
            zego_express_engine_reactnative_1.default
              .instance()
              .stopPreview(
                zego_express_engine_reactnative_1.ZegoPublishChannel.Aux,
              );
            return [4 /*yield*/, this.expressPlayerMedia.destroyMediaPlayer()];
          case 1:
            _a.sent();
            // @ts-ignore
            this.expressPlayerMedia = null;
            this.participantDic.forEach(function (participant) {
              zego_express_engine_reactnative_1.default
                .instance()
                .stopPlayingStream(participant.streamID);
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
            return [
              2 /*return*/,
              zego_express_engine_reactnative_1.default
                .instance()
                .logoutRoom(roomID)
                .then(function () {
                  console.warn(
                    '[ZEGOCLOUD LOG][Manager][leaveRoom] - Logout room success',
                    roomID,
                  );
                }),
            ];
        }
      });
    });
  };
  ZegoExpressManager.prototype.onRoomUserUpdate = function (fun) {
    return zego_express_engine_reactnative_1.default
      .instance()
      .on('roomUserUpdate', function (roomID, updateType, userList) {
        console.warn(
          '[ZEGOCLOUD LOG][Manager][onRoomUserUpdate]',
          roomID,
          updateType,
          userList,
        );
        var userIDList = [];
        userList.forEach(function (user) {
          userIDList.push(user.userID);
        });
        fun(updateType, userIDList, roomID);
      });
  };
  ZegoExpressManager.prototype.onRoomUserDeviceUpdate = function (fun) {
    this.deviceUpdateCallback.push(fun);
  };
  ZegoExpressManager.prototype.onRoomTokenWillExpire = function (fun) {
    return zego_express_engine_reactnative_1.default
      .instance()
      .on('roomTokenWillExpire', function (roomID, remainTimeInSecond) {
        console.warn(
          '[ZEGOCLOUD LOG][Manager][onRoomTokenWillExpire]',
          roomID,
          remainTimeInSecond,
        );
        fun(roomID, remainTimeInSecond);
      });
  };
  ZegoExpressManager.prototype.onRoomStateUpdate = function (fun) {
    return zego_express_engine_reactnative_1.default
      .instance()
      .on('roomStateUpdate', function (roomID, state) {
        console.warn(
          '[ZEGOCLOUD LOG][Manager][onRoomStateUpdate]',
          roomID,
          state,
        );
        fun(state);
      });
  };
  ZegoExpressManager.prototype.generateStreamID = function (
    userID,
    roomID,
    streamChannel,
  ) {
    if (streamChannel === void 0) {
      streamChannel = zego_express_engine_reactnative_1.ZegoPublishChannel.Main;
    }
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
    var streamID =
      roomID +
      userID +
      (streamChannel ===
      zego_express_engine_reactnative_1.ZegoPublishChannel.Main
        ? '_main'
        : '_aux');
    console.warn('[ZEGOCLOUD LOG][Manager][generateStreamID]', streamID);
    return streamID;
  };
  ZegoExpressManager.prototype.onOtherEvent = function () {
    var _this = this;
    zego_express_engine_reactnative_1.default
      .instance()
      .on('roomUserUpdate', function (roomID, updateType, userList) {
        console.warn(
          '[ZEGOCLOUD LOG][Manager][roomUserUpdate]',
          roomID,
          updateType,
          userList,
        );
        userList.forEach(function (user) {
          var participant = _this.participantDic.get(user.userID);
          if (
            updateType === zego_express_engine_reactnative_1.ZegoUpdateType.Add
          ) {
            if (participant) {
              // inner roomStreamUpdate -> inner roomUserUpdate -> out roomUserUpdate
            } else {
              // inner roomUserUpdate -> out roomUserUpdate -> inner roomStreamUpdate
              _this.participantDic.set(user.userID, {
                userID: user.userID,
                name: user.userName,
              });
            }
          } else {
            if (participant) {
              var streamID = participant.streamID,
                auxiliaryStreamID = participant.auxiliaryStreamID;
              streamID && _this.streamDic.delete(streamID);
              auxiliaryStreamID && _this.streamDic.delete(auxiliaryStreamID);
              _this.participantDic.delete(user.userID);
            }
          }
        });
        console.warn(
          '[ZEGOCLOUD LOG][Manager][participantDic]',
          _this.participantDic,
        );
        console.warn('[ZEGOCLOUD LOG][Manager][streamDic]', _this.streamDic);
      });
    zego_express_engine_reactnative_1.default
      .instance()
      .on('roomStreamUpdate', function (roomID, updateType, streamList) {
        console.warn(
          '[ZEGOCLOUD LOG][Manager][roomStreamUpdate]',
          roomID,
          updateType,
          streamList,
        );
        streamList.forEach(function (stream) {
          var _a;
          var streamChannel = _this.getStreamChannel(stream.streamID);
          var participant = _this.participantDic.get(stream.user.userID);
          var key =
            streamChannel ===
            zego_express_engine_reactnative_1.ZegoPublishChannel.Main
              ? 'streamID'
              : 'auxiliaryStreamID';
          if (
            updateType === zego_express_engine_reactnative_1.ZegoUpdateType.Add
          ) {
            var participant_ =
              ((_a = {
                userID: stream.user.userID,
                name: stream.user.userName,
              }),
              (_a[key] = stream.streamID),
              _a);
            if (participant) {
              // inner roomUserUpdate -> out roomUserUpdate -> inner roomStreamUpdate
              participant[key] = stream.streamID;
              _this.participantDic.set(stream.user.userID, participant);
              _this.streamDic.set(stream.streamID, participant);
            } else {
              // inner roomStreamUpdate -> inner roomUserUpdate -> out roomUserUpdate
              // @ts-ignore
              _this.participantDic.set(stream.user.userID, participant_);
              // @ts-ignore
              _this.streamDic.set(stream.streamID, participant_);
            }
            _this.playStream(stream.user.userID, streamChannel);
          } else {
            zego_express_engine_reactnative_1.default
              .instance()
              .stopPlayingStream(stream.streamID);
            _this.streamDic.delete(stream.streamID);
          }
        });
        console.warn(
          '[ZEGOCLOUD LOG][Manager][participantDic]',
          _this.participantDic,
        );
        console.warn('[ZEGOCLOUD LOG][Manager][streamDic]', _this.streamDic);
      });
    zego_express_engine_reactnative_1.default
      .instance()
      .on('publisherQualityUpdate', function (streamID, quality) {
        var participant = _this.streamDic.get(streamID);
        if (!participant) {
          return;
        }
        participant.publishQuality = quality.level;
        _this.streamDic.set(streamID, participant);
        _this.participantDic.set(participant.userID, participant);
      });
    zego_express_engine_reactnative_1.default
      .instance()
      .on('playerQualityUpdate', function (streamID, quality) {
        var participant = _this.streamDic.get(streamID);
        if (!participant) {
          return;
        }
        participant.playQuality = quality.level;
        _this.streamDic.set(streamID, participant);
        _this.participantDic.set(participant.userID, participant);
      });
    zego_express_engine_reactnative_1.default
      .instance()
      .on('remoteCameraStateUpdate', function (streamID, state) {
        console.warn(
          '[ZEGOCLOUD LOG][Manager][remoteCameraStatusUpdate]',
          streamID,
          state,
        );
        var participant = _this.streamDic.get(streamID);
        if (participant) {
          var updateType_1 =
            state ===
            zego_express_engine_reactnative_1.ZegoRemoteDeviceState.Open
              ? index_entity_1.ZegoDeviceUpdateType.CameraOpen
              : index_entity_1.ZegoDeviceUpdateType.CameraClose;
          participant.camera =
            state ===
            zego_express_engine_reactnative_1.ZegoRemoteDeviceState.Open;
          _this.streamDic.set(streamID, participant);
          _this.participantDic.set(participant.userID, participant);
          _this.deviceUpdateCallback.forEach(function (fun) {
            fun(updateType_1, participant.userID, _this.roomID);
          });
        }
        console.warn(
          '[ZEGOCLOUD LOG][Manager][participantDic]',
          _this.participantDic,
        );
        console.warn('[ZEGOCLOUD LOG][Manager][streamDic]', _this.streamDic);
      });
    zego_express_engine_reactnative_1.default
      .instance()
      .on('remoteMicStateUpdate', function (streamID, state) {
        console.warn(
          '[ZEGOCLOUD LOG][Manager][remoteMicStatusUpdate]',
          streamID,
          state,
        );
        var participant = _this.streamDic.get(streamID);
        if (participant) {
          var updateType_2 =
            state ===
            zego_express_engine_reactnative_1.ZegoRemoteDeviceState.Open
              ? index_entity_1.ZegoDeviceUpdateType.MicUnmute
              : index_entity_1.ZegoDeviceUpdateType.MicMute;
          participant.mic =
            state ===
            zego_express_engine_reactnative_1.ZegoRemoteDeviceState.Open;
          _this.streamDic.set(streamID, participant);
          _this.participantDic.set(participant.userID, participant);
          _this.deviceUpdateCallback.forEach(function (fun) {
            fun(updateType_2, participant.userID, _this.roomID);
          });
        }
        console.warn(
          '[ZEGOCLOUD LOG][Manager][participantDic]',
          _this.participantDic,
        );
        console.warn('[ZEGOCLOUD LOG][Manager][streamDic]', _this.streamDic);
      });
  };
  ZegoExpressManager.prototype.playStream = function (userID, streamChannel) {
    if (streamChannel === void 0) {
      streamChannel = zego_express_engine_reactnative_1.ZegoPublishChannel.Main;
    }
    var autoPlayAudio = this.mediaOptions.includes(
      index_entity_1.ZegoMediaOptions.AutoPlayAudio,
    );
    var autoPlayVideo = this.mediaOptions.includes(
      index_entity_1.ZegoMediaOptions.AutoPlayVideo,
    );
    if (autoPlayAudio || autoPlayVideo) {
      var participant = this.participantDic.get(userID);
      if (!participant) {
        return;
      }
      var streamID_1 = participant.streamID;
      var renderView_1 = participant.renderView;
      if (
        streamChannel ===
        zego_express_engine_reactnative_1.ZegoPublishChannel.Aux
      ) {
        streamID_1 = participant.auxiliaryStreamID;
        renderView_1 = participant.resourceRenderView;
      }
      if (streamID_1 && renderView_1) {
        var zegoView = new zego_express_engine_reactnative_1.ZegoView(
          renderView_1,
          this.playViewMode,
          this.playViewViewBgColor,
        );
        zego_express_engine_reactnative_1.default
          .instance()
          .startPlayingStream(streamID_1, zegoView)
          .then(function () {
            console.warn(
              '[ZEGOCLOUD LOG][Manager][playStream] - Start playing stream success',
              streamID_1,
              streamChannel,
              renderView_1,
            );
          });
        zego_express_engine_reactnative_1.default
          .instance()
          .mutePlayStreamAudio(streamID_1, !autoPlayAudio)
          .then(function () {
            console.warn(
              '[ZEGOCLOUD LOG][Manager][playStream] - Mute play stream audio success',
              !autoPlayAudio,
            );
          });
        zego_express_engine_reactnative_1.default
          .instance()
          .mutePlayStreamVideo(streamID_1, !autoPlayVideo)
          .then(function () {
            console.warn(
              '[ZEGOCLOUD LOG][Manager][playStream] - Mute play stream video success',
              !autoPlayVideo,
            );
          });
      }
    }
  };
  ZegoExpressManager.prototype.getStreamChannel = function (streamID) {
    return streamID.includes('_aux')
      ? zego_express_engine_reactnative_1.ZegoPublishChannel.Aux
      : zego_express_engine_reactnative_1.ZegoPublishChannel.Main;
  };
  return ZegoExpressManager;
})();
exports.ZegoExpressManager = ZegoExpressManager;
