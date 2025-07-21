
import React from 'react';
import { SQLiteProvider } from 'expo-sqlite';
import { useNavigation } from '@react-navigation/native';

import CourseList from '../views/CourseList'

class CourseListScreen extends React.Component {
  render() {
    const { navigation } = this.props;
    return (
      <SQLiteProvider
        databaseName="scholarlySphere.db"
        assetSource={{ assetId: require('../assets/scholarlySphere.db') }}
       
        options={{ useNewConnection: false }}>
        <CourseList />
      </SQLiteProvider>
    );
  }
}

export default function (props) {
  const navigation = useNavigation();

  return <CourseListScreen {...props} navigation={navigation} />;
}
