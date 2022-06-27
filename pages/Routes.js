import React from 'react';
import {Router, Scene} from 'react-native-router-flux';
import Home from './Home.js';
import VideoCallPage from './VideoCallPage.js';
import AudioCallPage from './AudioCallPage.js';

const Routes = () => (
  <Router>
    <Scene key="root">
      <Scene key="home" component={Home} title="Home" initial={true} />
      <Scene key="videoCall" component={VideoCallPage} title="Video Call" />
      <Scene key="audioCall" component={AudioCallPage} title="Audio Call" />
    </Scene>
  </Router>
);
export default Routes;
