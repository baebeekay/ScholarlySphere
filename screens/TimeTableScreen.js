import React from 'react';
import TimeTable from '../views/Timetable';
import { useNavigation } from '@react-navigation/native';

class TimeTableScreen extends React.Component {
  render() {
    const { navigation } = this.props;

    return <TimeTable />;
  }
}

export default function (props) {
  const navigation = useNavigation();

  return <TimeTableScreen {...props} navigation={navigation} />;
}
