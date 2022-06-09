/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {Component} from 'react';
import {Button, StyleSheet, Text, View} from 'react-native';
import {Actions} from 'react-native-router-flux';

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
  joinRoomBtn: {
    width: '50%',
    textAlign: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: 30,
  },
});

const now = new Date().getTime();
const config = {
  // Get your AppID from ZEGOCLOUD Console [My Projects] : https://console.zegocloud.com/project
  appID: ,
  // Heroku server url for example
  // Heroku server url for example
  // Get the server from: https://github.com/ZEGOCLOUD/dynamic_token_server_nodejs
  // e.g. https://xxx.herokuapp.com
  tokerServerUrl: ,
  userID: 'rn_user_' + now,
  userName: 'rn_user_' + now,
  roomID: '123456',
};

export default class Home extends Component {
  constructor(props) {
    super(props);
  }

  async startCall() {
    var tokenObj = await this.generateToken();
    Actions.call({
      appID: config.appID,
      token: tokenObj.token,
      roomID: config.roomID,
      userID: config.userID,
      userName: config.userName,
    });
  }
  async startAudioGroupCall() {
    var tokenObj = await this.generateToken();
    Actions.audio_group_call({
      appID: config.appID,
      token: tokenObj.token,
      roomID: config.roomID,
      userID: config.userID,
      userName: config.userName,
    });
  }
  generateToken() {
    // Obtain the token interface provided by the App Server
    return fetch(`${config.tokerServerUrl}/access_token?uid=${config.userID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    }).then(data => data.json());
  }
  render() {
    return (
      <View style={[styles.homePage, styles.showPage]}>
        <Text style={styles.logo}>ZEGOCLOUD</Text>
        <View style={styles.joinRoomBtn}>
          <Button onPress={this.startCall.bind(this)} style={{marginBottom: 10, }} title="Start Call" />
        </View>
        <View style={styles.joinRoomBtn}>
          <Button onPress={this.startAudioGroupCall.bind(this)} title="Start Audio Group Call" />
        </View>
      </View>
    );
  }
}
