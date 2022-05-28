import React, { Component } from 'react';
import {
  PermissionsAndroid,
  Platform,
  StyleSheet,
  View,
  findNodeHandle,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Actions } from 'react-native-router-flux';

import ZegoExpressEngine, {
  ZegoTextureView,
  ZegoScenario,
  ZegoUpdateType,
} from 'zego-express-engine-reactnative';
import { ZegoExpressManager } from '../ZegoExpressManager';
import { ZegoMediaOptions } from '../ZegoExpressManager/index.entity';

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

/// LivePage use for display the Host and the Co-Host Video view
///
/// TODO You can copy the completed class to your project
export default class LivePage extends Component {
  hostViewRef;
  coHostViewRef;
  appID;
  token;
  roomID;
  userID;
  userName;
  data = {
    cameraEnable: true,
    micEnable: true,
    isHost: true,
    isCoHost: false,
    coHostID: null,
    hostID: null,
  };
  state = {
    hideHostView: false,
    hideCoHostView: false,
    cameraIconVisible: false,
    micIconVisible: false,
    coHostIconVisible: false,
  };
  constructor(props) {
    super(props);
    this.hostViewRef = React.createRef();
    this.coHostViewRef = React.createRef();
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
                this.showHostView(true, 'remote', userID);
              }
            } else {
              if (this.data.coHostID === userID) {
                // We use room's extra info to mark the host and co-host
                ZegoExpressManager.instance().setRoomExtraInfo('coHostID', '-');
                this.data.coHostID = '-';
                this.showCoHostView(false);
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
            this.showCoHostView(false);
          } else {
            this.showCoHostView(true, 'remote', this.data.coHostID);
          }
        } else if (roomExtraInfo.key === 'hostID') {
          // Host
          this.data.hostID = roomExtraInfo.value;

          this.showHostView(true, 'remote', this.data.hostID);
        }
      });
    });
    ZegoExpressManager.instance().onRoomStateUpdate(state => {
      console.warn('[ZEGOCLOUD Log][Demo][onRoomStateUpdate]', state);
      // state: 0 "DISCONNECTED" | 1 "CONNECTING" | 2 "CONNECTED"
      if (state === 2 && this.data.isHost) {
        // We use room's extra info to mark the host and co-host
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
  // For host join the room and start live streaming and for audience join room and play straming
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
        { userID: this.userID, userName: this.userName },
        options,
      )
      .then(result => {
        if (result) {
          console.warn('Login successful');
          if (this.data.isHost) {
            this.showHostView(true, 'local');
            this.setCameraIconVisible(true);
            this.setMicIconVisible(true);
            this.setCoHostIconVisible(false);
          } else {
            this.setCameraIconVisible(false);
            this.setMicIconVisible(false);
            this.setCoHostIconVisible(true);
          }
        } else {
          console.warn('Login failed!', result);
        }
      });
  }
  // Switch camera on/off
  toggleCamera() {
    ZegoExpressManager.instance()
      .enableCamera(!this.data.cameraEnable)
      .then(() => {
        this.data.cameraEnable = !this.data.cameraEnable;
      });
  }
  // Switch microphone on/off
  toggleMic() {
    ZegoExpressManager.instance()
      .enableMic(!this.data.micEnable)
      .then(() => {
        this.data.micEnable = !this.data.micEnable;
      });
  }
  toggleCoHost() {
    if (this.data.isHost) {
      return;
    }
    !this.data.isCoHost ? this.requestcohost() : this.leavecohost();
  }
  async requestcohost() {
    if (this.data.coHostID && this.data.coHostID !== '-') {
      // There's someone at the mic
      return;
    }
    this.showCoHostView(true, 'local');

    await ZegoExpressManager.instance().enableCamera(true);
    await ZegoExpressManager.instance().enableMic(true);
    // We use room's extra info to mark the host and co-host
    await ZegoExpressManager.instance().setRoomExtraInfo(
      'coHostID',
      this.userID,
    );

    this.data.coHostID = this.userID;
    this.data.isCoHost = true;

    this.setCameraIconVisible(true);
    this.setMicIconVisible(true);
  }
  async leavecohost() {
    await ZegoExpressManager.instance().enableCamera(false);
    await ZegoExpressManager.instance().enableMic(false);
    // We use room's extra info to mark the host and co-host
    await ZegoExpressManager.instance().setRoomExtraInfo('coHostID', '-');

    this.data.coHostID = '-';
    this.data.isCoHost = false;

    this.showCoHostView(false);
    this.setCameraIconVisible(false);
    this.setMicIconVisible(false);
  }
  leaveRoom() {
    ZegoExpressManager.instance()
      .leaveRoom()
      .then(() => {
        console.warn('Leave successful');
        this.showHostView(false);
        this.showCoHostView(false);
        ZegoExpressManager.destroyEngine();
        // Back to home page
        Actions.home();
      });
  }
  showHostView(show, type, userID) {
    if (show) {
      this.setState({ hideHostView: false });
      const renderView = findNodeHandle(this.hostViewRef.current);
      if (type === 'remote') {
        ZegoExpressManager.instance().setRemoteVideoView(userID, renderView);
      } else {
        ZegoExpressManager.instance().setLocalVideoView(renderView);
      }
    } else {
      this.setState({ hideHostView: true });
    }
  }
  showCoHostView(show, type, userID) {
    if (show) {
      this.setState({ hideCoHostView: false });
      const renderView = findNodeHandle(this.coHostViewRef.current);
      if (type === 'remote') {
        ZegoExpressManager.instance().setRemoteVideoView(userID, renderView);
      } else {
        ZegoExpressManager.instance().setLocalVideoView(renderView);
      }
    } else {
      this.setState({ hideCoHostView: true });
    }
  }
  setCoHostIconVisible(visible) {
    this.setState({ coHostIconVisible: visible });
  }
  setCameraIconVisible(visible) {
    this.setState({ cameraIconVisible: visible });
  }
  setMicIconVisible(visible) {
    this.setState({ micIconVisible: visible });
  }
  render() {
    return (
      <View style={[styles.callPage]}>
        <View
          style={[
            styles.preview,
            this.state.hideHostView ? styles.hideView : styles.showView,
          ]}>
          <ZegoTextureView
            ref={this.hostViewRef}
            // @ts-ignore
            style={styles.previewView}
          />
        </View>
        <View
          style={[
            styles.play,
            this.state.hideCoHostView ? styles.hideView : styles.showView,
          ]}>
          <ZegoTextureView
            ref={this.coHostViewRef}
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
              this.state.cameraIconVisible ? styles.show : styles.hide,
            ]}
            onPress={this.toggleCamera.bind(this)}>
            <Image
              style={styles.image}
              source={require('../img/icon_camera.png')}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.imageCon,
              this.state.micIconVisible ? styles.show : styles.hide,
            ]}
            onPress={this.toggleMic.bind(this)}>
            <Image
              style={styles.image}
              source={require('../img/icon_mic.png')}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.imageCon,
              this.state.coHostIconVisible ? styles.show : styles.hide,
            ]}
            onPress={this.toggleCoHost.bind(this)}>
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
