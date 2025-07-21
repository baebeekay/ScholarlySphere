import React from 'react';
import { View, Text, ScrollView, Button, StyleSheet } from 'react-native';

export default class TiimeTableScreen extends React.Component {
  render() {
    return (
      <ScrollView style={styles.container}>
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text>Coming soon....</Text>
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: 'black',
    minWidth: 100,
    marginTop: 20,
    marginHorizontal: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 3,
  },
});
