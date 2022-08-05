import React, { Component } from 'react';
import {
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Actions } from 'react-native-router-flux';

import ZegoExpressEngine, {
  ZegoScenario,
  ZegoUpdateType,
} from 'zego-express-engine-reactnative';
import { ZegoExpressManager } from '../ZegoExpressManager';
import { ZegoMediaOptions } from '../ZegoExpressManager/index.entity';


/// AudioCallPage use for display Callee info and control buttons
///
/// TODO You can copy the completed class to your project
export default class AudioCallPage extends Component {
  appID;
  appSign;
  roomID;
  userID;
  userName;
  remoteUserName;
  constructor(props) {
    super(props);
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
    ZegoExpressManager.createEngine(profile).then(async () => {
      console.warn('ZegoExpressEngine created!');
      // Clear previously registered callbacks
      this.unRegisterCallback();
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
    // When other user join in the same room, this method will get call
    // Read more doc: https://doc-en-api.zego.im/ReactNative/interfaces/_zegoexpresseventhandler_.zegoeventlistener.html#roomuserupdate
    ZegoExpressManager.instance().onRoomUserUpdate(
      (updateType, userList, roomID) => {
        console.warn('out roomUserUpdate', updateType, userList, roomID);
        if (updateType == ZegoUpdateType.Add) {
          userList.forEach(userID => {
            this.setState({
              remoteUserName: userID
            })
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
          cameraEnable: !this.state.cameraEnable
        })
      });
  }
  // Switch microphone
  toggleMic() {
    ZegoExpressManager.instance()
      .enableMic(!this.state.micEnable)
      .then(() => {
        this.setState({
          micEnable: !this.state.micEnable
        })
      });
  }
  toggleSpeaker() {
    ZegoExpressManager.instance().enableSpeaker(!this.state.speakerEnable).then(() => {
      this.setState({
        speakerEnable: !this.state.speakerEnable
      })
    })
  }
  async joinRoom() {
    ZegoExpressManager.instance()
      .joinRoom(
        this.roomID,
        { userID: this.userID, userName: this.userName },
        [
          ZegoMediaOptions.PublishLocalAudio,
          ZegoMediaOptions.AutoPlayAudio,
        ],
      )
      .then(result => {
        if (result) {
          console.warn('Login successful');
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
        <View style={[styles.remoteView, styles.showPreviewView]}>
          <Text style={styles.remoteName}>{this.state.remoteUserName}</Text>
        </View>
        <View style={styles.btnCon}>
          <TouchableOpacity
            style={styles.micCon}
            onPress={this.toggleMic.bind(this)}>
            {
              this.state.micEnable ? <Image style={styles.image} source={require('../img/mic.png')} /> : <Image style={styles.image} source={require('../img/mic_off.png')} />
            }
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
            onPress={this.toggleSpeaker.bind(this)}>
            <Image style={styles.image} source={this.state.speakerEnable ? require('../img/speaker.png') : require('../img/speaker_off.png')} />
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
    remoteView: {
      width: '100%',
      height: '100%',
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
    remoteName: {
      height: '25%',
      width: '100%',
      zIndex: 2,
      textAlign: 'center',
    }
  });