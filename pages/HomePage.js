/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { Component } from 'react';
import {
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

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
  ctrlBtn: {
    width: '40%',
    textAlign: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  text: {
    textAlign: 'center',
  },
  input: {
    width: '60%',
    height: 35,
    borderWidth: 1,
    padding: 10,
  },
  inputBox: {
    width: '50%',
    height: 50,
  }
});

export default class HomePage extends Component {
  currentUserID;
  currentUserName;
  currentUserIcon = "https://img.icons8.com/color/48/000000/avatar.png"; // TODO for test only
  serverUrl;
  appData;
  state = {
    targetUserID: ''
  }
  constructor(props) {
    super(props);
    console.log('Home constructor: ', props)
    this.appData = props.route.params.appData;
    this.currentUserID = this.appData.userID;
    this.currentUserName = this.currentUserID.toUpperCase(); // TODO user name for test only
    this.serverUrl = this.appData.serverUrl;
    // Construct with room id is call by incoming call
    if (props.route.params.roomID) {
      this.handleIncomingCall(props.route.params.roomID);
    }
  }
  // Call by Routes's instance which would be trigger in the APP component by user click the notification
  handleIncomingCall(roomID)
  {
    this.jumpToCallPage(roomID);
    console.log("Handle incoming call with room id: ",roomID)
  }
  // Post a request to backend service will the targetUserID
  // Because every device(FCM token) has been binding with a specific user id at APP launched, 
  // so the server can find out who you are trying to call
  async sendCallInvite(roomID) {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUserID: this.state.targetUserID,
        callerUserID: this.currentUserID,
        callerUserName: this.currentUserName,
        callerIconUrl: this.currentUserIcon,
        roomID: roomID,
        callType: 'Video' // TODO For test only
      })
    };
    const reps = await fetch(`${this.serverUrl}/call_invite`, requestOptions);
    console.log('Send call invite reps: ', reps);
  }
  jumpToCallPage(roomID) {
    this.props.navigation.navigate('CallPage', { appData: this.appData, roomID: roomID, userName: this.currentUserName });
  }
  // Start call by click the call button
  startCall() {
    if (this.state.targetUserID == '') {
      console.warn('Invalid user id');
      return;
    }
    // TODO the caller use he/her own user id to join room, for test only
    this.jumpToCallPage(this.currentUserID);
    this.sendCallInvite(this.currentUserID);
  }

  render() {
    return (
      <View
        style={[
          styles.homePage,
          styles.showPage,
        ]}>
        <Text style={styles.logo}>ZEGOCLOUD</Text>
        <View style={[styles.container, { flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }]}>
          <View style={[styles.inputBox, styles.container, { flexDirection: 'row' }]}>
            <Text style={[styles.text]}>Your ID: </Text>
            <TextInput
              style={styles.input}
              editable={false}
              selectTextOnFocus={false}
              value={this.currentUserID}
            />
          </View>

          <View style={[styles.inputBox, styles.container, { flexDirection: 'row' }]}>
            <TextInput
              style={styles.input}
              onChangeText={(text) => { this.setState({ targetUserID: text }) }}
              placeholder='Target ID'
            />
            <View style={styles.ctrlBtn}>
              <Button onPress={this.startCall.bind(this)} title="📞" />
            </View>
          </View>
        </View>

      </View>
    );
  }
}
