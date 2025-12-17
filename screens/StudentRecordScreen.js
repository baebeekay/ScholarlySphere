import React from 'react';
import { SQLiteProvider } from 'expo-sqlite';
import { useNavigation } from '@react-navigation/native';
import StudentRecord from '../views/StudentRecords';

class StudentRecordScreen extends React.Component {
  render() {
    const { navigation } = this.props;
    return (
      <SQLiteProvider
        databaseName="scholarlySphere.db"
        assetSource={{ assetId: require('../assets/scholarlySphere.db') }}>
        <StudentRecord />
      </SQLiteProvider>
    );
  }
}

export default function (props) {
  const navigation = useNavigation();

  return <StudentRecordScreen {...props} navigation={navigation} />;
}
