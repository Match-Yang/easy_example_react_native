// Interface call order
// Step1: new ZegoExpressMediaPlayer()
// Step2: init()
// Step3: onMediaPlayerPlayingProgress(), onMediaPlayerStateUpdate()
// Step4: setPlayerView(), loadResource(), start(), setAudioTrackIndex()
// Step5: destroyMediaPlayer()
import ZegoExpressEngine, {
  ZegoAudioSourceType,
  ZegoMediaPlayer,
  ZegoMediaPlayerLoadResourceResult,
  ZegoMediaPlayerNetworkEvent,
  ZegoMediaPlayerSeekToResult,
  ZegoMediaPlayerState,
  ZegoPublishChannel,
  ZegoVideoCodecID,
  ZegoVideoConfig,
  ZegoView,
} from 'zego-express-engine-reactnative';

export class ZegoExpressMediaPlayer {
  private mediaPlayer!: ZegoMediaPlayer;
  private videoConfig: ZegoVideoConfig = {
    encodeHeight: 400,
    encodeWidth: 200,
    captureHeight: 400,
    captureWidth: 200,
    bitrate: 800,
    fps: 15,
    codecID: ZegoVideoCodecID.Default,
  };
  constructor() {}
  async init() {
    try {
      if (!this.mediaPlayer) {
        this.mediaPlayer = await this.createMediaPlayerHandle();
        await this.postCreateMediaPlayerHandle();
      }
      console.warn('[ZEGOCLOUD LOG][MediaPlayer][init] - Success');
      return Promise.resolve();
    } catch (error) {
      console.error('[ZEGOCLOUD LOG][MediaPlayer][init]', error);
      Promise.reject();
    }
  }
  destroyMediaPlayer() {
    return ZegoExpressEngine.instance()
      .destroyMediaPlayer(this.mediaPlayer)
      .then(() => {
        console.warn(
          '[ZEGOCLOUD LOG][MediaPlayer][destroyMediaPlayer] - Success',
        );
      });
  }
  onMediaPlayerPlayingProgress(fun: (millisecond: number) => void) {
    this.mediaPlayer.on(
      'mediaPlayerPlayingProgress',
      (mediaPlayer: ZegoMediaPlayer, millisecond: number) => {
        console.warn(
          '[ZEGOCLOUD LOG][MediaPlayer][onMediaPlayerPlayingProgress]',
          millisecond,
        );
        fun(millisecond);
      },
    );
  }
  onMediaPlayerStateUpdate(
    fun: (state: ZegoMediaPlayerState, errorCode: number) => void,
  ) {
    this.mediaPlayer.on(
      'mediaPlayerStateUpdate',
      (
        mediaPlayer: ZegoMediaPlayer,
        state: ZegoMediaPlayerState,
        errorCode: number,
      ) => {
        console.warn(
          '[ZEGOCLOUD LOG][MediaPlayer][onMediaPlayerStateUpdate]',
          state,
          errorCode,
        );
        fun(state, errorCode);
      },
    );
  }
  onMediaPlayerNetworkEvent(
    fun: (networkEvent: ZegoMediaPlayerNetworkEvent) => void,
  ) {
    this.mediaPlayer.on(
      'mediaPlayerNetworkEvent',
      (
        mediaPlayer: ZegoMediaPlayer,
        networkEvent: ZegoMediaPlayerNetworkEvent,
      ) => {
        console.warn(
          '[ZEGOCLOUD LOG][MediaPlayer][onMediaPlayerNetworkEvent]',
          networkEvent,
        );
        fun(networkEvent);
      },
    );
  }
  setPlayerView(view: ZegoView) {
    return this.mediaPlayer.setPlayerView(view).then(() => {
      console.warn('[ZEGOCLOUD LOG][MediaPlayer][setPlayerView] - Success');
    });
  }
  loadResource(path: string) {
    return this.mediaPlayer
      .loadResource(path)
      .then((loadResourceResult: ZegoMediaPlayerLoadResourceResult | void) => {
        console.warn(
          '[ZEGOCLOUD LOG][MediaPlayer][loadResource]',
          loadResourceResult,
        );
        return loadResourceResult;
      });
  }
  async start() {
    try {
      await this.mediaPlayer.start();
      await this.setAudioTrackIndex(1);
      await this.prePublishMediaPlayerStream();
      console.warn('[ZEGOCLOUD LOG][MediaPlayer][start] - Success');
      return Promise.resolve();
    } catch (error) {
      console.error('[ZEGOCLOUD LOG][MediaPlayer][start]', error);
      return Promise.reject();
    }
  }
  pause() {
    return this.mediaPlayer.pause().then(() => {
      console.warn('[ZEGOCLOUD LOG][MediaPlayer][pause] - Success');
    });
  }
  resume() {
    return this.mediaPlayer.resume().then(() => {
      console.warn('[ZEGOCLOUD LOG][MediaPlayer][resume] - Success');
    });
  }
  seekTo(millisecond: number) {
    return this.mediaPlayer
      .seekTo(millisecond)
      .then((seekToResult: ZegoMediaPlayerSeekToResult) => {
        console.warn('[ZEGOCLOUD LOG][MediaPlayer][seekTo] - Success');
        return seekToResult;
      });
  }
  getCurrentProgress() {
    return this.mediaPlayer
      .getCurrentProgress()
      .then((currentProgress: number) => {
        console.warn(
          '[ZEGOCLOUD LOG][MediaPlayer][getCurrentProgress]',
          currentProgress,
        );
        return currentProgress;
      });
  }
  getTotalDuration() {
    return this.mediaPlayer.getTotalDuration().then((totalDuration: number) => {
      console.warn(
        '[ZEGOCLOUD LOG][MediaPlayer][getTotalDuration]',
        totalDuration,
      );
      return totalDuration;
    });
  }
  stop() {
    return this.mediaPlayer.stop().then(() => {
      console.warn('[ZEGOCLOUD LOG][MediaPlayer][stop] - Success');
    });
  }
  getAudioTrackCount() {
    return this.mediaPlayer
      .getAudioTrackCount()
      .then((audioTrackCount: number) => {
        console.warn(
          '[ZEGOCLOUD LOG][MediaPlayer][getAudioTrackCount] - Success',
        );
        return audioTrackCount;
      });
  }
  setAudioTrackIndex(index: number) {
    return this.mediaPlayer.setAudioTrackIndex(index).then(() => {
      console.warn(
        '[ZEGOCLOUD LOG][MediaPlayer][setAudioTrackIndex] - Success',
      );
    });
  }
  private prePublishMediaPlayerStream() {
    // Bind player and push channel
    const attachMediaPlayer = JSON.stringify({
      method: 'liveroom.video.attach_mediaplayer_to_publishchannel',
      params: {
        player_index: this.mediaPlayer.getIndex(),
        channel: ZegoPublishChannel.Aux,
      },
    });
    return ZegoExpressEngine.instance()
      .callExperimentalAPI(attachMediaPlayer)
      .then((result: string) => {
        console.warn(
          '[ZEGOCLOUD LOG][MediaPlayer][prePublishMediaPlayerStream] - Call experimental API success',
          result,
        );
        return result;
      });
  }
  private async postCreateMediaPlayerHandle() {
    try {
      // Bind the player audio source to the secondary channel
      await ZegoExpressEngine.instance().enableCustomAudioIO(
        true,
        {sourceType: ZegoAudioSourceType.MediaPlayer},
        ZegoPublishChannel.Aux,
      );
      // Bind the player video source to the secondary channel
      const setVideoSource = JSON.stringify({
        method: 'express.video.set_video_source',
        params: {
          source: 5,
          channel: ZegoPublishChannel.Aux,
        },
      });
      await ZegoExpressEngine.instance().callExperimentalAPI(setVideoSource);
      // Modify the bypass collection and coding width and height
      await ZegoExpressEngine.instance().setVideoConfig(
        this.videoConfig,
        ZegoPublishChannel.Aux,
      );
      console.warn(
        '[ZEGOCLOUD LOG][MediaPlayer][postCreateMediaPlayerHandle] - Success',
      );
      return Promise.resolve();
    } catch (error) {
      console.error(
        '[ZEGOCLOUD LOG][MediaPlayer][postCreateMediaPlayerHandle]',
        error,
      );
      return Promise.reject();
    }
  }
  private createMediaPlayerHandle(): Promise<ZegoMediaPlayer> {
    return new Promise(
      async (
        resolve: (mediaPlayer: ZegoMediaPlayer) => void,
        reject: (error: any) => void,
      ) => {
        try {
          const result = await ZegoExpressEngine.instance().createMediaPlayer();
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
        } catch (error) {
          console.error(
            '[ZEGOCLOUD LOG][MediaPlayer][createMediaPlayerHandle]',
            error,
          );
          reject(false);
        }
      },
    );
  }
}
