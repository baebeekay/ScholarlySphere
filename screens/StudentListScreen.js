
import React from 'react';
import { SQLiteProvider } from 'expo-sqlite';
import { useNavigation } from '@react-navigation/native';
import StudentList from '../views/StudentList';

class StudentListScreen extends React.Component {


  render() {
    const { navigation } = this.props;

    return (
      <SQLiteProvider
        databaseName="scholarlySphere.db"
        assetSource={{ assetId: require('../assets/scholarlySphere.db') }}
        options={{ useNewConnection: false }}>
        <StudentList/>
      </SQLiteProvider>
    );
  }
}



export default function (props) {
  const navigation = useNavigation();

  return <StudentListScreen {...props} navigation={navigation} />;
}