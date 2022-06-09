import React from 'react';
import {Router, Scene} from 'react-native-router-flux';
import Home from './Home.js';
import CallPage from './CallPage.js';
import AudioGroupCallPage from './AudioGroupCallPage.js';

const Routes = () => (
  <Router>
    <Scene key="root">
      <Scene key="home" component={Home} title="Home" initial={true} />
      <Scene key="call" component={CallPage} title="Call" />
      <Scene key="audio_group_call" component={AudioGroupCallPage} title="Audio Group Call" />
    </Scene>
  </Router>
);
export default Routes;
