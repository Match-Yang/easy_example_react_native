import React, {Component} from 'react';
import {
  PermissionsAndroid,
  Platform,
  StyleSheet,
  View,
  findNodeHandle,
  Image,
  TouchableOpacity,
  Button,
} from 'react-native';
import {Actions} from 'react-native-router-flux';

import ZegoExpressEngine, {
  ZegoTextureView,
  ZegoScenario,
  ZegoUpdateType,
} from 'zego-express-engine-reactnative';
import {ZegoExpressManager} from '../ZegoExpressManager';
import {ZegoMediaOptions} from '../ZegoExpressManager/index.entity';

const styles = StyleSheet.create({
  // ZegoEasyExample
  callPage: {
    width: '100%',
    height: '100%',
    display: 'flex',
  },
  userCon: {
    width: '100%',
    height: '20%',
    display: 'flex',
    flexDirection: 'row',
  },
  preview: {
    flex: 1,
    height: '100%',
    display: 'flex',
    opacity: 1,
  },
  previewView: {
    width: '100%',
    height: '100%',
  },
  play: {
    flex: 1,
    height: '100%',
    display: 'flex',
    opacity: 1,
  },
  playView: {
    width: '100%',
    height: '100%',
  },
  btnCon: {
    width: '100%',
    position: 'absolute',
    display: 'flex',
    bottom: 40,
    zIndex: 3,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  phoneCon: {
    width: 60,
    height: 60,
    borderRadius: 40,
    backgroundColor: 'red',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginLeft: 10,
  },
  cameraCon: {
    width: 60,
    height: 60,
    borderRadius: 40,
    // backgroundColor: 'gainsboro',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginLeft: 10,
  },
  micCon: {
    width: 60,
    height: 60,
    borderRadius: 40,
    // backgroundColor: 'gainsboro',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginLeft: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  phoneImage: {
    width: 35,
    height: 35,
  },
  resourcePreview: {
    width: '100%',
    height: '35%',
    display: 'flex',
    opacity: 1,
  },
  resourcePreviewView: {
    width: '100%',
    height: '100%',
  },
  mediaBtnCon: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  mediaBtn: {
    width: 160,
    marginTop: 10,
    marginLeft: 10,
    marginRight: 10,
  },
});

export default class CallPage extends Component {
  localViewRef;
  localResourceViewRef;
  remoteViewRef;
  appID;
  token;
  roomID;
  userID;
  userName;
  cameraEnable = true;
  micEnable = true;
  constructor(props) {
    super(props);
    this.localViewRef = React.createRef();
    this.localResourceViewRef = React.createRef();
    this.remoteViewRef = React.createRef();
    this.appID = parseInt(props.appID, 10);
    this.token = props.token;
    this.roomID = props.roomID;
    this.userID = props.userID;
    this.userName = props.userName;
  }

  async componentDidMount() {
    await this.grantPermissions();
    console.warn('[ZEGOCLOUD LOG][CallPage][componentDidMount] - Init SDK');
    const profile = {
      appID: this.appID,
      scenario: ZegoScenario.General,
    };
    ZegoExpressManager.createEngine(profile).then(async () => {
      console.warn(
        '[ZEGOCLOUD LOG][CallPage][componentDidMount] - ZegoExpressEngine created',
      );
      // Register callback
      this.registerCallback();

      // Join room and wait...
      this.joinRoom();
    });
  }
  async componentWillUnmount() {
    await ZegoExpressManager.instance().leaveRoom();
    await ZegoExpressEngine.destroyEngine();
    console.warn(
      '[ZEGOCLOUD LOG][CallPage][componentWillUnmount] - Destroy engine success',
    );
  }

  registerCallback() {
    ZegoExpressManager.instance().onRoomUserUpdate(
      (updateType, userList, roomID) => {
        console.warn(
          '[ZEGOCLOUD LOG][CallPage][onRoomUserUpdate]',
          updateType,
          userList,
          roomID,
        );
        if (updateType === ZegoUpdateType.Add) {
          userList.forEach(userID => {
            ZegoExpressManager.instance().setRemoteVideoView(
              userID,
              findNodeHandle(this.remoteViewRef.current),
              findNodeHandle(this.localResourceViewRef.current),
            );
          });
        }
      },
    );
    ZegoExpressManager.instance().onRoomUserDeviceUpdate(
      (updateType, userID, roomID) => {
        console.warn(
          '[ZEGOCLOUD LOG][CallPage][onRoomUserDeviceUpdate]',
          updateType,
          userID,
          roomID,
        );
      },
    );
    ZegoExpressManager.instance().onRoomTokenWillExpire(
      async (roomID, remainTimeInSecond) => {
        console.warn(
          '[ZEGOCLOUD LOG][CallPage][onRoomTokenWillExpire]',
          roomID,
          remainTimeInSecond,
        );
        const token = (await this.generateToken()).token;
        ZegoExpressEngine.instance().renewToken(roomID, token);
      },
    );
  }
  registerVideoResourceCallback() {
    ZegoExpressManager.instance().onMediaPlayerPlayingProgress(millisecond => {
      console.warn(
        '[ZEGOCLOUD LOG][CallPage][onMediaPlayerPlayingProgress]',
        millisecond,
      );
    });
    ZegoExpressManager.instance().onMediaPlayerStateUpdate(
      (state, errorCode) => {
        console.warn(
          '[ZEGOCLOUD LOG][CallPage][onMediaPlayerStateUpdate]',
          state,
        );
        switch (state) {
          case 0:
            // Play stop state
            break;
          case 1:
            // Playing state
            break;
          case 2:
            // Pause state
            break;
          case 3:
            // After the current track is played, you can perform operations such as playing the next track
            break;
        }
      },
    );
    ZegoExpressManager.instance().onMediaPlayerNetworkEvent(networkEvent => {
      console.warn(
        '[ZEGOCLOUD LOG][CallPage][onMediaPlayerNetworkEvent]',
        networkEvent,
      );
    });
  }
  async grantPermissions() {
    // Android: Dynamically obtaining device permissions
    if (Platform.OS === 'android') {
      // Check if permission granted
      let grantedAudio = PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );
      let grantedCamera = PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      const ungrantedPermissions = [];
      try {
        const isAudioGranted = await grantedAudio;
        const isVideoGranted = await grantedCamera;
        if (!isAudioGranted) {
          ungrantedPermissions.push(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          );
        }
        if (!isVideoGranted) {
          ungrantedPermissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
        }
      } catch (error) {
        ungrantedPermissions.push(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        );
      }
      // If not, request it
      return PermissionsAndroid.requestMultiple(ungrantedPermissions).then(
        data => {
          console.warn('[ZEGOCLOUD LOG][CallPage][grantPermissions]', data);
        },
      );
    }
  }
  // Switch camera
  enableCamera() {
    ZegoExpressManager.instance()
      .enableCamera(!this.cameraEnable)
      .then(() => {
        this.cameraEnable = !this.cameraEnable;
      });
  }

  // Switch microphone
  enableMic() {
    ZegoExpressManager.instance()
      .enableMic(!this.micEnable)
      .then(() => {
        this.micEnable = !this.micEnable;
      });
  }
  async joinRoom() {
    ZegoExpressManager.instance()
      .joinRoom(
        this.roomID,
        this.token,
        {userID: this.userID, userName: this.userName},
        [
          ZegoMediaOptions.PublishLocalAudio,
          ZegoMediaOptions.PublishLocalVideo,
          ZegoMediaOptions.AutoPlayAudio,
          ZegoMediaOptions.AutoPlayVideo,
        ],
      )
      .then(result => {
        if (result) {
          console.warn('[ZEGOCLOUD LOG][CallPage][joinRoom] - Success');
          ZegoExpressManager.instance().setLocalVideoView(
            findNodeHandle(this.localViewRef.current),
          );
          // The sharing video side calls this interface
          ZegoExpressManager.instance()
            .setLocalVideoResourceView(
              findNodeHandle(this.localResourceViewRef.current),
            )
            .then(() => {
              console.warn(
                '[ZEGOCLOUD LOG][CallPage][joinRoom] - Set local video resource view success',
              );
              // After setLocalVideoResourceView successfully registered callback
              this.registerVideoResourceCallback();
            });
        } else {
          console.error('[ZEGOCLOUD LOG][CallPage][joinRoom]');
        }
      });
  }

  // Load resource
  loadResource() {
    // If other media resources are playing, stop them first
    console.warn('[ZEGOCLOUD LOG][CallPage][loadResource] - Start');
    ZegoExpressManager.instance()
      .loadResource('https://storage.zego.im/demo/201808270915.mp4')
      .then(data => {
        console.warn(
          '[ZEGOCLOUD LOG][CallPage][loadResource] - End',
          data.errorCode,
        );
      });
  }

  // Start play
  start() {
    ZegoExpressManager.instance().start();
  }

  // Pause play
  pause() {
    ZegoExpressManager.instance().pause();
  }

  // Resume play
  resume() {
    ZegoExpressManager.instance().resume();
  }

  // SeekTo 30s
  seekTo() {
    ZegoExpressManager.instance().seekTo(30000);
  }

  getCurrentProgress() {
    ZegoExpressManager.instance().getCurrentProgress();
  }
  getTotalDuration() {
    ZegoExpressManager.instance().getTotalDuration();
  }

  // Stop play
  stop() {
    ZegoExpressManager.instance().stop();
  }

  // Leave room
  async leaveRoom() {
    await ZegoExpressManager.instance().leaveRoom();
    // Back to home page
    Actions.home();
  }

  render() {
    return (
      <View style={[styles.callPage]}>
        <View style={[styles.resourcePreview]}>
          <ZegoTextureView
            ref={this.localResourceViewRef}
            // @ts-ignore
            style={styles.resourcePreviewView}
          />
        </View>
        <View style={[styles.userCon]}>
          <View style={[styles.preview]}>
            <ZegoTextureView
              ref={this.localViewRef}
              // @ts-ignore
              style={styles.previewView}
            />
          </View>
          <View style={[styles.play]}>
            <ZegoTextureView
              ref={this.remoteViewRef}
              // @ts-ignore
              style={styles.playView}
            />
          </View>
        </View>
        <View style={styles.mediaBtnCon}>
          <View style={styles.mediaBtn}>
            <Button
              onPress={this.loadResource.bind(this)}
              title="loadResource"
              color="#841584"
            />
          </View>
          <View style={styles.mediaBtn}>
            <Button
              onPress={this.start.bind(this)}
              title="start"
              color="#841584"
            />
          </View>
          <View style={styles.mediaBtn}>
            <Button
              onPress={this.pause.bind(this)}
              title="pause"
              color="#841584"
            />
          </View>
          <View style={styles.mediaBtn}>
            <Button
              onPress={this.resume.bind(this)}
              title="resume"
              color="#841584"
            />
          </View>
          <View style={styles.mediaBtn}>
            <Button
              onPress={this.seekTo.bind(this)}
              title="seekTo"
              color="#841584"
            />
          </View>
          <View style={styles.mediaBtn}>
            <Button
              onPress={this.getCurrentProgress.bind(this)}
              title="currentProgress"
              color="#841584"
            />
          </View>
          <View style={styles.mediaBtn}>
            <Button
              onPress={this.getTotalDuration.bind(this)}
              title="totalDuration"
              color="#841584"
            />
          </View>
          <View style={styles.mediaBtn}>
            <Button
              onPress={this.stop.bind(this)}
              title="stop"
              color="#841584"
            />
          </View>
        </View>
        <View style={styles.btnCon}>
          <TouchableOpacity
            style={styles.micCon}
            onPress={this.enableMic.bind(this)}>
            <Image style={styles.image} source={require('../img/mic.png')} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.phoneCon}
            onPress={this.leaveRoom.bind(this)}>
            <Image
              style={styles.phoneImage}
              source={require('../img/phone.png')}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cameraCon}
            onPress={this.enableCamera.bind(this)}>
            <Image style={styles.image} source={require('../img/camera.png')} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}
