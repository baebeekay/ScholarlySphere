import React from 'react';
import { SQLiteProvider } from 'expo-sqlite';
import { useNavigation } from '@react-navigation/native';
import AddCoursesForm from '../views/AddCoursesForm';

class AddCourseScreen extends React.Component {
  render() {
    const { navigation } = this.props;
    return (
      <SQLiteProvider
        databaseName="scholarlySphere.db"
        assetSource={{ assetId: require('../assets/scholarlySphere.db') }}
        options={{ useNewConnection: false }}>
        <AddCoursesForm />
      </SQLiteProvider>
    );
  }
}

export default function (props) {
  const navigation = useNavigation();

  return <AddCourseScreen {...props} navigation={navigation} />;
}
