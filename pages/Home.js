/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {Component} from 'react';
import {Button, StyleSheet, Alert, View} from 'react-native';
import {Actions} from 'react-native-router-flux';
// import {generateToken, getUserID} from './util';
import ZIM from 'zim_reactnative_sdk';

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
    width: '100%',
    textAlign: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
});
const generateToken = function (tokerServerUrl, userID) {
  // Obtain the token interface provided by the App Server
  return fetch(`${tokerServerUrl}/access_token?uid=${userID}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  }).then(data => {
    console.warn('generateToken', data);
    return data.json();
  });
};
const getUserID = function (len) {
  let result = '';
  var chars = '12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP',
    maxPos = chars.length,
    i;
  len = len || 5;
  for (i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return result;
};

const now = new Date().getTime();
const config = {
  // Get your AppID from ZEGOCLOUD Console [My Projects] : https://console.zegocloud.com/project
  appID: 3417014186,
  // Heroku server url for example
  // Heroku server url for example
  // Get the server from: https://github.com/ZEGOCLOUD/dynamic_token_server_nodejs
  // e.g. https://xxx.herokuapp.com
  tokenServerUrl: 'https://choui-zim.herokuapp.com',
  userID: 'rn_user_' + getUserID(5),
  userName: 'rn_user_' + now,
  roomID: '123456',
  appID_IM: 3417014186,
};

export default class Home extends Component {
  zim;
  callUserID;
  token;
  state = {
    userList: [],
  };

  constructor(props) {
    super(props);
  }

  async componentDidMount() {
    this.zim = ZIM.create(config.appID_IM);

    var tokenObj = await generateToken(config.tokenServerUrl, config.userID);
    this.token = tokenObj.token;
    console.warn('start login');
    const res = await this.zim.login(
      {userID: config.userID, userName: config.userName},
      tokenObj.token,
    );
    console.warn('end login');
    this.zim.enterRoom({roomID: config.roomID, roomName: config.roomID});

    this.zim // Callback for the callee to receive the call invitation.
      .on(
        'callInvitationReceived',
        (zim, {callID, inviter, timeout, extendedData}) => {
          // console.log('callInvitationReceived', { callID, inviter, timeout, extendedData })
          Alert.alert('call invitation', inviter + ' calling', [
            {
              text: 'Accept',
              onPress: () => {
                this.zim.callAccept(callID, {extendedData: 'Accept'});
                this.leave();
                Actions.call({
                  appID: config.appID,
                  userID: config.userID,
                  userName: config.userName,
                  roomID: config.userID,
                  token: this.token,
                });
              },
            },
            {
              text: 'Refuse',
              onPress: () => {
                this.zim.callReject(callID, {extendedData: 'Accept'});
              },
            },
          ]);
        },
      );

    // Callback for the results of the call invitation has been accepted.
    this.zim.on(
      'callInvitationAccepted',
      (zim, {callID, invitee, extendedData}) => {
        this.leave();
        Actions.call({
          appID: config.appID,
          userID: config.userID,
          userName: config.userName,
          roomID: this.callUserID,
          token: this.token,
        });
      },
    );

    // Callback for the results of the call invitation has been refused.
    this.zim.on(
      'callInvitationRejected',
      (zim, {callID, invitee, extendedData}) => {
        // console.log('callInvitationRejected', { callID, invitee, extendedData })
      },
    );

    // Callback for receiving event notification when new room members join the room. And it also returns the information of the user who just joined the room.
    this.zim.on('roomMemberJoined', (zim, {roomID, memberList}) => {
      this.setState(state => {
        const _memberList = memberList.filter(
          item => !state.userList.some(u => u.userID == item.userID),
        );
        return {
          userList: [...state.userList, ..._memberList],
        };
      });
    });

    // Callback for receiving event notification when existing room members leave the room. And it also returns the information of the user who just left the room.
    this.zim.on('roomMemberLeft', (zim, {roomID, memberList}) => {
      this.setState(state => {
        const userList = state.userList.filter(
          user => !memberList.some(item => user.userID == item.userID),
        );

        return {userList};
      });
    });
  }

  componentWillUnmount() {
    this.leave();
  }

  leave() {
    if (this.zim) {
      this.zim.off('callInvitationReceived');
      this.zim.off('callInvitationAccepted');
      this.zim.off('callInvitationRejected');
      this.zim.off('roomMemberJoined');
      this.zim.off('roomMemberLeft');

      this.zim.leaveRoom(config.roomID);
      this.zim.logout();
      this.zim.destroy();
    }
  }

  async startCall(toUserID) {
    const _config = {timeout: 200}; //The timeout duration for the call invitation. Range: 1-600.
    this.callUserID = toUserID;
    this.zim
      .callInvite([toUserID], _config)
      .then(function ({callID, timeout, errorInvitees}) {
        // Operation successful.
        // The callID here is a ID generated by SDK after the caller made a call invitation.
        // And this callID will also be used when the caller cancel the call invitation, the callee accept/refuse a call invitation.
        console.warn('callInvite success');
      })
      .catch(function (err) {
        // Operation failed.
        console.warn('callInvite', err);
      });
  }

  render() {
    return (
      <View style={[styles.homePage, styles.showPage]}>
        <View style={styles.joinRoomBtn}>
          {this.state.userList.map(user => {
            return (
              <Button
                key={user.userID}
                style={styles.callButton}
                onPress={this.startCall.bind(this, user.userID)}
                title={'call: ' + user.userID}
              />
            );
          })}
        </View>
      </View>
    );
  }
}
