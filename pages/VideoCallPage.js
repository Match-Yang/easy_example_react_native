import React, {Component} from 'react';
import {
  Button,
  TextInput,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
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

/// CallPage use for display the Caller Video view and the Callee Video view
///
/// TODO You can copy the completed class to your project
export default class VideoCallPage extends Component {
  localViewRef;
  remoteViewRef;
  appID;
  appSign;
  roomID;
  userID;
  userName;
  constructor(props) {
    super(props);
    this.localViewRef = React.createRef();
    this.remoteViewRef = React.createRef();
    this.appID = parseInt(props.appID);
    this.appSign = props.appSign;
    this.roomID = props.roomID;
    this.userID = props.userID;
    this.userName = props.userName;
  }
  state = {
    cameraEnable: true,
    micEnable: true,
    speakerEnable: true,
  };

  componentDidMount() {
    this.grantPermissions();

    console.warn('init SDK');
    const profile = {
      appID: this.appID,
      appSign: this.appSign,
      scenario: ZegoScenario.General,
    };
    ZegoExpressManager.createEngine(profile).then(async engine => {
      console.warn('ZegoExpressEngine created!');
      // Clear previously registered callbacks
      this.unRegisterCallback();
      // Register callback
      this.registerCallback(engine);

      // Join room and wait...
      this.joinRoom();
    });
  }
  componentWillUnmount() {
    this.leaveRoom();
  }
  registerCallback(engin) {
    // When other user join in the same room, this method will get call
    // Read more doc: https://doc-en-api.zego.im/ReactNative/interfaces/_zegoexpresseventhandler_.zegoeventlistener.html#roomuserupdate
    ZegoExpressManager.instance().onRoomUserUpdate(
      (updateType, userList, roomID) => {
        console.warn('out roomUserUpdate', updateType, userList, roomID);
        if (updateType == ZegoUpdateType.Add) {
          userList.forEach(userID => {
            ZegoExpressManager.instance().setRemoteVideoView(
              userID,
              findNodeHandle(this.remoteViewRef.current),
            );
          });
        }
      },
    );
    ZegoExpressManager.instance().onRoomUserDeviceUpdate(
      (updateType, userID, roomID) => {
        console.warn('out roomUserDeviceUpdate', updateType, userID, roomID);
      },
    );
    ZegoExpressManager.instance().onRoomStateUpdate(state => {
      console.warn('out roomStateUpdate', state);
    });
    engin.on('roomOnlineUserCountUpdate', (roomID, count) => {
      console.warn('roomOnlineUserCountUpdate', count);
    });
  }
  unRegisterCallback() {
    // If the parameter is null, the previously registered callback is cleared
    ZegoExpressManager.instance().onRoomUserUpdate();
    ZegoExpressManager.instance().onRoomUserDeviceUpdate();
    ZegoExpressManager.instance().onRoomStateUpdate();
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
      PermissionsAndroid.requestMultiple(ungrantedPermissions).then(data => {
        console.warn('requestMultiple', data);
      });
    }
  }
  // Switch camera
  toggleCamera() {
    ZegoExpressManager.instance()
      .enableCamera(!this.state.cameraEnable)
      .then(() => {
        this.setState({
          cameraEnable: !this.state.cameraEnable,
        });
      });
  }
  // Switch microphone
  toggleMic() {
    ZegoExpressManager.instance()
      .enableMic(!this.state.micEnable)
      .then(() => {
        this.setState({
          micEnable: !this.state.micEnable,
        });
      });
  }
  toggleSpeaker() {
    ZegoExpressManager.instance()
      .enableSpeaker(!this.state.speakerEnable)
      .then(() => {
        this.setState({
          speakerEnable: !this.state.speakerEnable,
        });
      });
  }
  async joinRoom() {
    ZegoExpressManager.instance()
      .joinRoom(
        this.roomID,
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
          console.warn('Login successful');
          ZegoExpressManager.instance().setLocalVideoView(
            findNodeHandle(this.localViewRef.current),
          );
        } else {
          console.warn('Login failed!', result);
        }
      });
  }
  // Leave room
  leaveRoom() {
    this.setState({
      showPreview: false,
      showPlay: false,
    });
    ZegoExpressManager.instance()
      .leaveRoom()
      .then(() => {
        console.warn('Leave successful');
        console.warn('ZegoExpressEngine destroyed!');
        ZegoExpressManager.destroyEngine();
        // Back to home page
        Actions.home();
      });
  }
  render() {
    return (
      <View style={[styles.callPage, styles.showPage]}>
        <View style={[styles.preview, styles.showPreviewView]}>
          <ZegoTextureView
            ref={this.localViewRef}
            // @ts-ignore
            style={styles.previewView}
          />
        </View>
        <View style={[styles.play, styles.showPlayView]}>
          <ZegoTextureView
            ref={this.remoteViewRef}
            // @ts-ignore
            style={styles.playView}
          />
        </View>
        <View style={styles.btnCon}>
          <TouchableOpacity
            style={styles.micCon}
            onPress={this.toggleMic.bind(this)}>
            <Image
              style={styles.image}
              source={
                this.state.micEnable
                  ? require('../img/mic.png')
                  : require('../img/mic_off.png')
              }
            />
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
            onPress={this.toggleCamera.bind(this)}>
            <Image
              style={styles.image}
              source={
                this.state.cameraEnable
                  ? require('../img/camera.png')
                  : require('../img/camera_off.png')
              }
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  // ZegoEasyExample
  callPage: {
    width: '100%',
    height: '100%',
  },
  showPage: {
    display: 'flex',
  },
  showPreviewView: {
    display: 'flex',
    opacity: 1,
  },
  showPlayView: {
    display: 'flex',
    opacity: 1,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  previewView: {
    width: '100%',
    height: '100%',
  },
  play: {
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
    backgroundColor: 'gainsboro',
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
    backgroundColor: 'gainsboro',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginLeft: 10,
  },
  image: {
    width: '50%',
    height: '50%',
  },
  phoneImage: {
    width: 35,
    height: 35,
  },
});
