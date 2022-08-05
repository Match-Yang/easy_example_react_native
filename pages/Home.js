/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { Component } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { Actions } from 'react-native-router-flux';

const now = new Date().getTime();
const config = {
  // Get your AppID and AppSign from ZEGOCLOUD Console [My Projects] : https://console.zegocloud.com/project
  appID: ,
  appSign: ,
  userID: 'rn_user_' + now,
  userName: 'rn_user_' + now,
  roomID: '123456',
};

export default class Home extends Component {
  constructor(props) {
    super(props);
  }

  async startCall(isVideoCall) {
    if (isVideoCall) {
      Actions.videoCall({
        appID: config.appID,
        appSign: config.appSign,
        roomID: config.roomID,
        userID: config.userID,
        userName: config.userName,
      });
    } else {
      Actions.audioCall({
        appID: config.appID,
        appSign: config.appSign,
        roomID: config.roomID,
        userID: config.userID,
        userName: config.userName,
      });
    }

  }
  
  render() {
    return (
      <View style={[styles.homePage, styles.showPage]}>
        <Text style={styles.logo}>ZEGOCLOUD</Text>
        <View style={styles.joinRoomBtnView}>
          <Button onPress={this.startCall.bind(this, true)} title="Start Video Call" />
          <Button onPress={this.startCall.bind(this, false)} title="Start Audio Call" />
        </View>
      </View>
    );
  }
}


const styles = StyleSheet.create({
  // ZegoEasyExample
  homePage: {
    width: '100%',
    height: '100%',
  },
  showPage: {
    display: 'flex',
  },
  hidePage: {
    display: 'none',
  },
  logo: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    marginTop: '50%',
    marginBottom: 100,
  },
  joinRoomBtnView: {
    width: '50%',
    flex: 1,
    justifyContent: 'space-evenly',
    textAlign: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
});