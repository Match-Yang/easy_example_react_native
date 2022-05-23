import React, {Component} from 'react';
import {
  PermissionsAndroid,
  Platform,
  StyleSheet,
  View,
  findNodeHandle,
  Image,
  TouchableOpacity,
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
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: '100%',
    display: 'flex',
  },
  previewView: {
    width: '100%',
    height: '100%',
  },
  play: {
    display: 'flex',
    height: '25%',
    width: '40%',
    position: 'absolute',
    top: 80,
    right: 20,
    zIndex: 2,
  },
  playView: {
    width: '100%',
    height: '100%',
  },
  hideView: {
    display: 'none',
    opacity: 0,
  },
  showView: {
    display: 'flex',
    opacity: 1,
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
  imageCon: {
    width: 60,
    height: 60,
    borderRadius: 40,
    backgroundColor: '#c2c2c2',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginLeft: 10,
  },
  phoneCon: {
    backgroundColor: 'red',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  phoneImage: {
    width: 35,
    height: 35,
  },
  seatImage: {
    width: 35,
    height: 35,
  },
  hide: {
    display: 'none',
  },
  show: {
    display: 'flex',
  },
});

export default class CallPage extends Component {
  viewRef1;
  viewRef2;
  appID;
  token;
  roomID;
  userID;
  userName;
  data = {
    cameraEnable: true,
    micEnable: true,
    isHost: true,
    isSeat: false,
    coHostID: null,
    hostID: null,
  };
  state = {
    hideView1: false,
    hideView2: false,
    hideCameraView: true,
    hideMicView: true,
    hideSeatView: true,
  };
  constructor(props) {
    super(props);
    this.viewRef1 = React.createRef();
    this.viewRef2 = React.createRef();
    this.appID = parseInt(props.appID, 10);
    this.token = props.token;
    this.roomID = props.roomID;
    this.userID = props.userID;
    this.userName = props.userName;
    this.data.isHost = props.isHost;
  }
  async componentDidMount() {
    await this.grantPermissions();

    console.warn('init SDK');
    const profile = {
      appID: this.appID,
      scenario: ZegoScenario.General,
    };
    ZegoExpressManager.createEngine(profile).then(async () => {
      console.warn('ZegoExpressEngine created!');
      // Register callback
      this.registerCallback();

      // Join room and wait...
      this.joinRoom();
    });
  }
  componentWillUnmount() {
    this.leaveRoom();
  }

  registerCallback() {
    ZegoExpressManager.instance().onRoomUserUpdate(
      (updateType, userList, roomID) => {
        console.warn('out roomUserUpdate', updateType, userList, roomID);
        if (updateType === ZegoUpdateType.Add) {
          userList.forEach(userID => {
            if (updateType === 0) {
              if (this.data.hostID === userID) {
                this.triggerRenderViewCon1(true, 'remote', userID);
              }
            } else {
              if (this.data.coHostID === userID) {
                ZegoExpressManager.instance().setRoomExtraInfo('coHostID', '-');
                this.data.coHostID = '-';
                this.triggerRenderViewCon2(false);
              }
            }
          });
        }
      },
    );
    ZegoExpressManager.instance().onRoomUserDeviceUpdate(
      (updateType, userID, roomID) => {
        console.warn('out roomUserDeviceUpdate', updateType, userID, roomID);
      },
    );
    ZegoExpressManager.instance().onRoomTokenWillExpire(
      async (roomID, remainTimeInSecond) => {
        console.warn('out roomTokenWillExpire', roomID, remainTimeInSecond);
        const token = (await this.generateToken()).token;
        ZegoExpressEngine.instance().renewToken(roomID, token);
      },
    );
    ZegoExpressManager.instance().onRoomExtraInfoUpdate(roomExtraInfoList => {
      console.warn(
        '[ZEGOCLOUD Log][Demo][onRoomExtraInfoUpdate]',
        roomExtraInfoList,
      );
      roomExtraInfoList.forEach(roomExtraInfo => {
        if (roomExtraInfo.key === 'coHostID') {
          // Audience
          this.data.coHostID = roomExtraInfo.value;

          if (roomExtraInfo.value === '-') {
            this.triggerRenderViewCon2(false);
          } else {
            this.triggerRenderViewCon2(true, 'remote', this.data.coHostID);
          }
        } else if (roomExtraInfo.key === 'hostID') {
          // Host
          this.data.hostID = roomExtraInfo.value;

          this.triggerRenderViewCon1(true, 'remote', this.data.hostID);
        }
      });
    });
    ZegoExpressManager.instance().onRoomStateUpdate(state => {
      console.warn('[ZEGOCLOUD Log][Demo][onRoomStateUpdate]', state);
      // state: 0 "DISCONNECTED" | 1 "CONNECTING" | 2 "CONNECTED"
      if (state === 2 && this.data.isHost) {
        ZegoExpressManager.instance().setRoomExtraInfo('hostID', this.userID);
        this.data.hostID = this.userID;
      }
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
          console.warn('requestMultiple', data);
        },
      );
    }
  }
  joinRoom() {
    const options = this.data.isHost
      ? [
          ZegoMediaOptions.PublishLocalAudio,
          ZegoMediaOptions.PublishLocalVideo,
          ZegoMediaOptions.AutoPlayAudio,
          ZegoMediaOptions.AutoPlayVideo,
        ]
      : [ZegoMediaOptions.AutoPlayAudio, ZegoMediaOptions.AutoPlayVideo];
    ZegoExpressManager.instance()
      .joinRoom(
        this.roomID,
        this.token,
        {userID: this.userID, userName: this.userName},
        options,
      )
      .then(result => {
        if (result) {
          console.warn('Login successful');
          if (this.data.isHost) {
            this.triggerRenderViewCon1(true, 'local');
            this.triggerCameraView(true);
            this.triggerMicView(true);
            this.triggerSeatView(false);
          } else {
            this.triggerCameraView(false);
            this.triggerMicView(false);
            this.triggerSeatView(true);
          }
        } else {
          console.warn('Login failed!', result);
        }
      });
  }
  // Switch camera
  enableCamera() {
    ZegoExpressManager.instance()
      .enableCamera(!this.data.cameraEnable)
      .then(() => {
        this.data.cameraEnable = !this.data.cameraEnable;
      });
  }
  // Switch microphone
  enableMic() {
    ZegoExpressManager.instance()
      .enableMic(!this.data.micEnable)
      .then(() => {
        this.data.micEnable = !this.data.micEnable;
      });
  }
  seatHandle() {
    if (this.data.isHost) {
      return;
    }
    !this.data.isSeat ? this.up() : this.down();
  }
  async up() {
    if (this.data.coHostID && this.data.coHostID !== '-') {
      // There's someone at the mic
      return;
    }
    this.triggerRenderViewCon2(true, 'local');

    await ZegoExpressManager.instance().enableCamera(true);
    await ZegoExpressManager.instance().enableMic(true);
    await ZegoExpressManager.instance().setRoomExtraInfo(
      'coHostID',
      this.userID,
    );

    this.data.coHostID = this.userID;
    this.data.isSeat = true;

    this.triggerCameraView(true);
    this.triggerMicView(true);
  }
  async down() {
    await ZegoExpressManager.instance().enableCamera(false);
    await ZegoExpressManager.instance().enableMic(false);
    await ZegoExpressManager.instance().setRoomExtraInfo('coHostID', '-');

    this.data.coHostID = '-';
    this.data.isSeat = false;

    this.triggerRenderViewCon2(false);
    this.triggerCameraView(false);
    this.triggerMicView(false);
  }
  // Leave room
  leaveRoom() {
    ZegoExpressManager.instance()
      .leaveRoom()
      .then(() => {
        console.warn('Leave successful');
        this.triggerRenderViewCon1(false);
        this.triggerRenderViewCon2(false);
        ZegoExpressManager.destroyEngine();
        // Back to home page
        Actions.home();
      });
  }
  triggerRenderViewCon1(show, type, userID) {
    if (show) {
      this.setState({hideView1: false});
      const renderView = findNodeHandle(this.viewRef1.current);
      if (type === 'remote') {
        ZegoExpressManager.instance().setRemoteVideoView(userID, renderView);
      } else {
        ZegoExpressManager.instance().setLocalVideoView(renderView);
      }
    } else {
      this.setState({hideView1: true});
    }
  }
  triggerRenderViewCon2(show, type, userID) {
    if (show) {
      this.setState({hideView2: false});
      const renderView = findNodeHandle(this.viewRef2.current);
      if (type === 'remote') {
        ZegoExpressManager.instance().setRemoteVideoView(userID, renderView);
      } else {
        ZegoExpressManager.instance().setLocalVideoView(renderView);
      }
    } else {
      this.setState({hideView2: true});
    }
  }
  triggerSeatView(show) {
    this.setState({hideSeatView: !show});
  }
  triggerCameraView(show) {
    this.setState({hideCameraView: !show});
  }
  triggerMicView(show) {
    this.setState({hideMicView: !show});
  }
  render() {
    return (
      <View style={[styles.callPage]}>
        <View
          style={[
            styles.preview,
            this.state.hideView1 ? styles.hideView : styles.showView,
          ]}>
          <ZegoTextureView
            ref={this.viewRef1}
            // @ts-ignore
            style={styles.previewView}
          />
        </View>
        <View
          style={[
            styles.play,
            this.state.hideView2 ? styles.hideView : styles.showView,
          ]}>
          <ZegoTextureView
            ref={this.viewRef2}
            // @ts-ignore
            style={styles.playView}
          />
        </View>
        <View style={styles.btnCon}>
          <TouchableOpacity
            style={[styles.imageCon, styles.phoneCon]}
            onPress={this.leaveRoom.bind(this)}>
            <Image
              style={styles.phoneImage}
              source={require('../img/icon_phone.png')}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.imageCon,
              this.state.hideCameraView ? styles.hide : styles.show,
            ]}
            onPress={this.enableCamera.bind(this)}>
            <Image
              style={styles.image}
              source={require('../img/icon_camera.png')}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.imageCon,
              this.state.hideMicView ? styles.hide : styles.show,
            ]}
            onPress={this.enableMic.bind(this)}>
            <Image
              style={styles.image}
              source={require('../img/icon_mic.png')}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.imageCon,
              this.state.hideSeatView ? styles.hide : styles.show,
            ]}
            onPress={this.seatHandle.bind(this)}>
            <Image
              style={styles.seatImage}
              source={require('../img/icon_cohost.png')}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}
