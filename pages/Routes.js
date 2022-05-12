import React, { Component } from 'react'
import { Actions, Router, Scene } from 'react-native-router-flux'
import Home from './Home.js'
import CallPage from './CallPage.js'

class Routes extends Component {
   homeInstance;
   state = {
      incomingCall: false,
      handleIncomingCallback: null,
      appData: {}
   }
   constructor(props) {
      super(props);
   }
   static getDerivedStateFromProps(props, state) {
      if (props.appData !== state.appData) {
         return {
            appData: props.appData
         };
      }

      // Return null to indicate no change to state.
      return null;
   }
   handleIncomingCall(roomID) {
      Actions.refs.home.handleIncomingCall(roomID)
   }
   render() {
      return <Router>
         <Scene key="root">
            <Scene key="home" component={Home} title="Home" initial={true} appData={this.state.appData}/>
            <Scene key="call" component={CallPage} title="Call" />
         </Scene>
      </Router>
   }
}


export default Routes
