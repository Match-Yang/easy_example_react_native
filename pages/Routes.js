import React from 'react';
import {Router, Scene} from 'react-native-router-flux';
import Home from './Home.js';
import LivePage from './LivePage.js';

const Routes = () => (
  <Router>
    <Scene key="root">
      <Scene key="home" component={Home} title="Home" initial={true} />
      <Scene key="live" component={LivePage} title="Live" />
    </Scene>
  </Router>
);
export default Routes;
