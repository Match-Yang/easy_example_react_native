import React, { Component } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createNavigationContainerRef , StackActions} from '@react-navigation/native';
import CallPage from './CallPage';
import HomePage from './HomePage'

const Stack = createNativeStackNavigator();

class AppNavigation extends Component {
    state = {
        appData: {},
     }
     constructor(props) {
        super(props);
     }
     // getDerivedStateFromProps is invoked right before calling the render method
     static getDerivedStateFromProps(props, state) {
        if (props.appData !== state.appData) {
           return {
              appData: props.appData
           };
        }
  
        // Return null to indicate no change to state.
        return null;
     }

    render() {
        return(
            <Stack.Navigator initialRouteName="HomePage">
            <Stack.Screen name="HomePage" component={HomePage} initialParams={{'appData': this.state.appData}}/>                  
            <Stack.Screen name="CallPage" component={CallPage} /> 
          </Stack.Navigator>
        );
    }
}

 const navigationRef = createNavigationContainerRef()

 function pushToScreen(...args) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.push(...args));
  }
}

export {
   AppNavigation,
   navigationRef,
   pushToScreen
}