import React, { Component } from 'react';
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
    FlatList,
} from 'react-native';
import { color } from 'react-native-reanimated';
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

/// AudioGroupCallPage use for display the Caller Video view and the Callee Video view
///
/// TODO You can copy the completed class to your project
export default class AudioGroupCallPage extends Component {
    appID;
    token;
    roomID;
    userID;
    userName;
    constructor(props) {
        super(props);
        this.appID = parseInt(props.appID);
        this.token = props.token;
        this.roomID = props.roomID;
        this.userID = props.userID;
        this.userName = props.userName;
    }
    state = {
        cameraEnable: true,
        micEnable: true,
        userIDList: [],
    };

    componentDidMount() {
        this.grantPermissions();

        console.warn('init SDK');
        const profile = {
            appID: this.appID,
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
                    var array = [...this.state.userIDList, ...userList];
                    this.setState(
                        {
                            userIDList: array
                        }
                    )
                    userList.forEach(userID => {
                        console.log("User add", userID)
                    });
                } else {
                    var array = [...this.state.userIDList];

                    userList.forEach(userID => {
                        console.log("User remove", userID)
                        const index = array.indexOf(userID);
                        array.splice(index, 1);
                    });
                    this.setState({ userIDList: array });
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
        ZegoExpressManager.instance().onRoomStateUpdate(state => {
            console.warn('out roomStateUpdate', state);
        });
    }
    unRegisterCallback() {
        // If the parameter is null, the previously registered callback is cleared
        ZegoExpressManager.instance().onRoomUserUpdate();
        ZegoExpressManager.instance().onRoomUserDeviceUpdate();
        ZegoExpressManager.instance().onRoomTokenWillExpire();
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
                { userID: this.userID, userName: this.userName },
                [
                    ZegoMediaOptions.PublishLocalAudio,
                    ZegoMediaOptions.AutoPlayAudio,
                ],
            )
            .then(result => {
                if (result) {
                    console.warn('Login successful');
                    // Local user show in the first seat
                    this.setState({
                        userIDList: [this.userID]
                    })
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
                <FlatList
                    data={this.state.userIDList}
                    renderItem={({ item }) => (
                        <View
                            style={{
                                flex: 1,
                                flexDirection: 'column',
                                margin: 1,
                                backgroundColor: 'gray',
                                width: '30%',
                                height: 100,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                            <Text style={{ justifyContent: 'center', color: 'white' }}>
                                {item}
                            </Text>
                        </View>
                    )}
                    //Setting the number of column
                    numColumns={3}
                    keyExtractor={(item, index) => index.toString()}
                />

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
                </View>
            </View>
        );
    }
}