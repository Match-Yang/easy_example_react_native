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
exports.ZegoExpressMediaPlayer = void 0;
// Interface call order
// Step1: new ZegoExpressMediaPlayer()
// Step2: init()
// Step3: onMediaPlayerPlayingProgress(), onMediaPlayerStateUpdate()
// Step4: setPlayerView(), loadResource(), start(), setAudioTrackIndex()
// Step5: destroyMediaPlayer()
var zego_express_engine_reactnative_1 = require('zego-express-engine-reactnative');
var ZegoExpressMediaPlayer = /** @class */ (function () {
  function ZegoExpressMediaPlayer() {
    this.videoConfig = {
      encodeHeight: 400,
      encodeWidth: 200,
      captureHeight: 400,
      captureWidth: 200,
      bitrate: 800,
      fps: 15,
      codecID: zego_express_engine_reactnative_1.ZegoVideoCodecID.Default,
    };
  }
  ZegoExpressMediaPlayer.prototype.init = function () {
    return __awaiter(this, void 0, void 0, function () {
      var _a, error_1;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            _b.trys.push([0, 4, , 5]);
            if (this.mediaPlayer) {
              return [3 /*break*/, 3];
            }
            _a = this;
            return [4 /*yield*/, this.createMediaPlayerHandle()];
          case 1:
            _a.mediaPlayer = _b.sent();
            return [4 /*yield*/, this.postCreateMediaPlayerHandle()];
          case 2:
            _b.sent();
            _b.label = 3;
          case 3:
            console.warn('[ZEGOCLOUD LOG][MediaPlayer][init] - Success');
            return [2 /*return*/, Promise.resolve()];
          case 4:
            error_1 = _b.sent();
            console.error('[ZEGOCLOUD LOG][MediaPlayer][init]', error_1);
            Promise.reject();
            return [3 /*break*/, 5];
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  ZegoExpressMediaPlayer.prototype.destroyMediaPlayer = function () {
    return zego_express_engine_reactnative_1.default
      .instance()
      .destroyMediaPlayer(this.mediaPlayer)
      .then(function () {
        console.warn(
          '[ZEGOCLOUD LOG][MediaPlayer][destroyMediaPlayer] - Success',
        );
      });
  };
  ZegoExpressMediaPlayer.prototype.onMediaPlayerPlayingProgress = function (
    fun,
  ) {
    this.mediaPlayer.on(
      'mediaPlayerPlayingProgress',
      function (mediaPlayer, millisecond) {
        console.warn(
          '[ZEGOCLOUD LOG][MediaPlayer][onMediaPlayerPlayingProgress]',
          millisecond,
        );
        fun(millisecond);
      },
    );
  };
  ZegoExpressMediaPlayer.prototype.onMediaPlayerStateUpdate = function (fun) {
    this.mediaPlayer.on(
      'mediaPlayerStateUpdate',
      function (mediaPlayer, state, errorCode) {
        console.warn(
          '[ZEGOCLOUD LOG][MediaPlayer][onMediaPlayerStateUpdate]',
          state,
          errorCode,
        );
        fun(state, errorCode);
      },
    );
  };
  ZegoExpressMediaPlayer.prototype.onMediaPlayerNetworkEvent = function (fun) {
    this.mediaPlayer.on(
      'mediaPlayerNetworkEvent',
      function (mediaPlayer, networkEvent) {
        console.warn(
          '[ZEGOCLOUD LOG][MediaPlayer][onMediaPlayerNetworkEvent]',
          networkEvent,
        );
        fun(networkEvent);
      },
    );
  };
  ZegoExpressMediaPlayer.prototype.setPlayerView = function (view) {
    return this.mediaPlayer.setPlayerView(view).then(function () {
      console.warn('[ZEGOCLOUD LOG][MediaPlayer][setPlayerView] - Success');
    });
  };
  ZegoExpressMediaPlayer.prototype.loadResource = function (path) {
    return this.mediaPlayer
      .loadResource(path)
      .then(function (loadResourceResult) {
        console.warn(
          '[ZEGOCLOUD LOG][MediaPlayer][loadResource]',
          loadResourceResult,
        );
        return loadResourceResult;
      });
  };
  ZegoExpressMediaPlayer.prototype.start = function () {
    return __awaiter(this, void 0, void 0, function () {
      var error_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 4, , 5]);
            return [4 /*yield*/, this.mediaPlayer.start()];
          case 1:
            _a.sent();
            return [4 /*yield*/, this.setAudioTrackIndex(1)];
          case 2:
            _a.sent();
            return [4 /*yield*/, this.prePublishMediaPlayerStream()];
          case 3:
            _a.sent();
            console.warn('[ZEGOCLOUD LOG][MediaPlayer][start] - Success');
            return [2 /*return*/, Promise.resolve()];
          case 4:
            error_2 = _a.sent();
            console.error('[ZEGOCLOUD LOG][MediaPlayer][start]', error_2);
            return [2 /*return*/, Promise.reject()];
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  ZegoExpressMediaPlayer.prototype.pause = function () {
    return this.mediaPlayer.pause().then(function () {
      console.warn('[ZEGOCLOUD LOG][MediaPlayer][pause] - Success');
    });
  };
  ZegoExpressMediaPlayer.prototype.resume = function () {
    return this.mediaPlayer.resume().then(function () {
      console.warn('[ZEGOCLOUD LOG][MediaPlayer][resume] - Success');
    });
  };
  ZegoExpressMediaPlayer.prototype.seekTo = function (millisecond) {
    return this.mediaPlayer.seekTo(millisecond).then(function (seekToResult) {
      console.warn('[ZEGOCLOUD LOG][MediaPlayer][seekTo] - Success');
      return seekToResult;
    });
  };
  ZegoExpressMediaPlayer.prototype.getCurrentProgress = function () {
    return this.mediaPlayer
      .getCurrentProgress()
      .then(function (currentProgress) {
        console.warn(
          '[ZEGOCLOUD LOG][MediaPlayer][getCurrentProgress]',
          currentProgress,
        );
        return currentProgress;
      });
  };
  ZegoExpressMediaPlayer.prototype.getTotalDuration = function () {
    return this.mediaPlayer.getTotalDuration().then(function (totalDuration) {
      console.warn(
        '[ZEGOCLOUD LOG][MediaPlayer][getTotalDuration]',
        totalDuration,
      );
      return totalDuration;
    });
  };
  ZegoExpressMediaPlayer.prototype.stop = function () {
    return this.mediaPlayer.stop().then(function () {
      console.warn('[ZEGOCLOUD LOG][MediaPlayer][stop] - Success');
    });
  };
  ZegoExpressMediaPlayer.prototype.getAudioTrackCount = function () {
    return this.mediaPlayer
      .getAudioTrackCount()
      .then(function (audioTrackCount) {
        console.warn(
          '[ZEGOCLOUD LOG][MediaPlayer][getAudioTrackCount] - Success',
        );
        return audioTrackCount;
      });
  };
  ZegoExpressMediaPlayer.prototype.setAudioTrackIndex = function (index) {
    return this.mediaPlayer.setAudioTrackIndex(index).then(function () {
      console.warn(
        '[ZEGOCLOUD LOG][MediaPlayer][setAudioTrackIndex] - Success',
      );
    });
  };
  ZegoExpressMediaPlayer.prototype.prePublishMediaPlayerStream = function () {
    // Bind player and push channel
    var attachMediaPlayer = JSON.stringify({
      method: 'liveroom.video.attach_mediaplayer_to_publishchannel',
      params: {
        player_index: this.mediaPlayer.getIndex(),
        channel: zego_express_engine_reactnative_1.ZegoPublishChannel.Aux,
      },
    });
    return zego_express_engine_reactnative_1.default
      .instance()
      .callExperimentalAPI(attachMediaPlayer)
      .then(function (result) {
        console.warn(
          '[ZEGOCLOUD LOG][MediaPlayer][prePublishMediaPlayerStream] - Call experimental API success',
          result,
        );
        return result;
      });
  };
  ZegoExpressMediaPlayer.prototype.postCreateMediaPlayerHandle = function () {
    return __awaiter(this, void 0, void 0, function () {
      var setVideoSource, error_3;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 4, , 5]);
            // Bind the player audio source to the secondary channel
            return [
              4 /*yield*/,
              zego_express_engine_reactnative_1.default
                .instance()
                .enableCustomAudioIO(
                  true,
                  {
                    sourceType:
                      zego_express_engine_reactnative_1.ZegoAudioSourceType
                        .MediaPlayer,
                  },
                  zego_express_engine_reactnative_1.ZegoPublishChannel.Aux,
                ),
            ];
          case 1:
            // Bind the player audio source to the secondary channel
            _a.sent();
            setVideoSource = JSON.stringify({
              method: 'express.video.set_video_source',
              params: {
                source: 5,
                channel:
                  zego_express_engine_reactnative_1.ZegoPublishChannel.Aux,
              },
            });
            return [
              4 /*yield*/,
              zego_express_engine_reactnative_1.default
                .instance()
                .callExperimentalAPI(setVideoSource),
            ];
          case 2:
            _a.sent();
            // Modify the bypass collection and coding width and height
            return [
              4 /*yield*/,
              zego_express_engine_reactnative_1.default
                .instance()
                .setVideoConfig(
                  this.videoConfig,
                  zego_express_engine_reactnative_1.ZegoPublishChannel.Aux,
                ),
            ];
          case 3:
            // Modify the bypass collection and coding width and height
            _a.sent();
            console.warn(
              '[ZEGOCLOUD LOG][MediaPlayer][postCreateMediaPlayerHandle] - Success',
            );
            return [2 /*return*/, Promise.resolve()];
          case 4:
            error_3 = _a.sent();
            console.error(
              '[ZEGOCLOUD LOG][MediaPlayer][postCreateMediaPlayerHandle]',
              error_3,
            );
            return [2 /*return*/, Promise.reject()];
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  ZegoExpressMediaPlayer.prototype.createMediaPlayerHandle = function () {
    var _this = this;
    return new Promise(function (resolve, reject) {
      return __awaiter(_this, void 0, void 0, function () {
        var result, error_4;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 2, , 3]);
              return [
                4 /*yield*/,
                zego_express_engine_reactnative_1.default
                  .instance()
                  .createMediaPlayer(),
              ];
            case 1:
              result = _a.sent();
              if (!result) {
                console.error(
                  '[ZEGOCLOUD LOG][MediaPlayer][createMediaPlayerHandle]',
                  result,
                );
                reject(false);
              } else {
                console.warn(
                  '[ZEGOCLOUD LOG][MediaPlayer][createMediaPlayerHandle] - Success',
                );
                resolve(result);
              }
              return [3 /*break*/, 3];
            case 2:
              error_4 = _a.sent();
              console.error(
                '[ZEGOCLOUD LOG][MediaPlayer][createMediaPlayerHandle]',
                error_4,
              );
              reject(false);
              return [3 /*break*/, 3];
            case 3:
              return [2 /*return*/];
          }
        });
      });
    });
  };
  return ZegoExpressMediaPlayer;
})();
exports.ZegoExpressMediaPlayer = ZegoExpressMediaPlayer;
