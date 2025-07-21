import * as React from 'react';
import { Button} from '@react-navigation/elements';
import Ionicons from '@expo/vector-icons/Ionicons';
//navigation
import {
  createStaticNavigation,
  useNavigation,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importing screens
import SignUpScreen from './screens/SignUpScreen';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import AddCourseScreen from './screens/AddCourseScreen';
import CourseListScreen from './screens/CourseListScreen';
import TimeTableScreen from './screens/TimeTableScreen';
import StudentListScreen from './screens/StudentListScreen';
import SettingsScreen from './screens/SettingsScreen';
import StudentRecordScreen from './screens/StudentRecordScreen';

const HomeTabs = createBottomTabNavigator({
  
  screenOptions: ({ route }) => ({
    tabBarIcon: ({ focused, color, size }) => {
      let iconName;

      if (route.name === 'Home') {
        iconName = focused
          ? 'home'
          : 'home';
      } else if (route.name === 'Settings') {
        iconName = focused ? 'settings' : 'settings';
      }

      
      return <Ionicons name={iconName} size={size} color={color} />;
    },
    tabBarActiveTintColor: 'tomato',
    tabBarInactiveTintColor: 'gray',
  }),
  screens: {
    Home: HomeScreen,
    Settings: SettingsScreen,
  },
 
});






const RootStack = createNativeStackNavigator({
  initialRouteName: 'Home',
  screens: {
    AddCourses: AddCourseScreen,
    StudentList: StudentListScreen,
    StudentRecord: StudentRecordScreen,
    TimeTable:{
      screen: TimeTableScreen,
      options:{
         headerShown: false 
         }
    },
    SignUp:{
       screen: SignUpScreen,
      options:{
         headerShown: false 
         }
    },
    Login:{
      screen: LoginScreen,
      options:{
         headerShown: false 
         }
    },
    Home: {
      screen: HomeTabs,
      options:{
         headerShown: false ,
         }
    },
    CourseList: {
      screen: CourseListScreen,
      options: {
        headerTitle: 'Courses',
        headerRight: () => MyAddButton(),
      },
    },
  },
});

function MyAddButton() {
  const navigation = useNavigation();

  return <Button onPress={() => navigation.navigate('AddCourses')}>Add</Button>;
}

const Navigation = createStaticNavigation(RootStack);

export default class App extends React.Component {
  render() {
    return <Navigation />;
  }
}
