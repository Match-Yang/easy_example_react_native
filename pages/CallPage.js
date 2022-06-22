import React, { Component } from 'react'
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
});

export default class CallPage extends Component {
    localViewRef;
    remoteViewRef;
    appID;
    token;
    roomID;
    userID;
    userName;
    appData; // pass back to home page
    constructor(props) {
        super(props)
        console.log('Call page: ', props.route)
        this.appData = props.route.params.appData;
        this.localViewRef = React.createRef();
        this.remoteViewRef = React.createRef();
        this.appID = parseInt(this.appData.appID);
        this.token = this.appData.zegoToken;
        this.roomID = props.route.params.roomID;
        this.userID = this.appData.userID;
        this.userName = props.route.params.userName;
        

    }
    state = {
        cameraEnable: true,
        micEnable: true,
    };

    componentDidMount() {
        this.grantPermissions();

        console.warn('init SDK');
        const profile = {
            appID: this.appID,
            scenario: ZegoScenario.General,
        };
        ZegoExpressManager.createEngine(profile).then(async () => {
            console.warn('ZegoExpressEngine created!')
            // Register callback
            this.registerCallback();

            // Join room and wait...
            this.joinRoom();
        });
    }
    componentWillUnmount() {
        ZegoExpressManager.instance().leaveRoom();
    }

    registerCallback() {
        // When other user join in the same room, this method will get call
        // Read more doc: https://doc-en-api.zego.im/ReactNative/interfaces/_zegoexpresseventhandler_.zegoeventlistener.html#roomuserupdate
        ZegoExpressManager.instance().onRoomUserUpdate(
            (updateType, userList, roomID) => {
                console.warn('out roomUserUpdate', updateType, userList, roomID);
                if (updateType == ZegoUpdateType.Add) {
                    console.log("&&&&&&&&&", this.remoteViewRef.current, findNodeHandle(this.remoteViewRef.current))
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
        ZegoExpressManager.instance().onRoomTokenWillExpire(
            async (roomID, remainTimeInSecond) => {
                console.warn('out roomTokenWillExpire', roomID, remainTimeInSecond);
                const token = (await this.generateToken()).token;
                ZegoExpressEngine.instance().renewToken(roomID, token);
            },
        );
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
                    ungrantedPermissions.push(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
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
    enableCamera() {
        ZegoExpressManager.instance()
            .enableCamera(!this.cameraEnable)
            .then(() => {
                this.cameraEnable = !this.cameraEnable;
                this.setState({
                    showPreview: this.cameraEnable,
                });
            });
    };

    // Switch microphone
    enableMic() {
        ZegoExpressManager.instance()
            .enableMic(!this.micEnable)
            .then(() => {
                this.micEnable = !this.micEnable;
            });
    };
    // Join in ZEGOCLOUD's room and wait for other.
    // While user on the same room, they can talk to each other
    async joinRoom() {
        console.log("Join room: ", this.roomID, this.token)
        ZegoExpressManager.instance().joinRoom(this.roomID, this.token, { userID: this.userID, userName: this.userName },
            [ZegoMediaOptions.PublishLocalAudio, ZegoMediaOptions.PublishLocalVideo, ZegoMediaOptions.AutoPlayAudio, ZegoMediaOptions.AutoPlayVideo]).then(result => {
                if (result) {
                    console.warn('Login successful');
                    ZegoExpressManager.instance().setLocalVideoView(
                        findNodeHandle(this.localViewRef.current),
                    );
                } else {
                    console.warn('Login failed!', result)
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
                // Back to home page
                this.props.navigation.navigate('HomePage', {appData: this.appData});
            });
    };

    render() {
        return (
            <View
                style={[
                    styles.callPage,
                    styles.showPage,
                ]}>
                <View
                    style={[
                        styles.preview,
                        styles.showPreviewView,
                    ]}>
                    <ZegoTextureView
                        ref={this.localViewRef}
                        // @ts-ignore
                        style={styles.previewView}
                    />
                </View>
                <View
                    style={[
                        styles.play,
                        styles.showPlayView,
                    ]}>
                    <ZegoTextureView
                        ref={this.remoteViewRef}
                        // @ts-ignore
                        style={styles.playView}
                    />
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
                        <Image
                            style={styles.image}
                            source={require('../img/camera.png')}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }
}