import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

function HomeScreen() {
  const navigation = useNavigation();
   const route = useRoute();
  const { username } = route.params || { };
  
  return (
    <SafeAreaProvider>
      <SafeAreaView style={homeStyles.safeArea}>
        <Text style={homeStyles.welcomeText}>Welcome { username }!</Text>
        <View style={homeStyles.row}>
          <TouchableOpacity
            style={homeStyles.cardButton}
            onPress={() => navigation.navigate('TimeTable')}>
            <Text style={homeStyles.cardButtonText}>Lecture Scheduler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={homeStyles.cardButton}
            onPress={() => navigation.navigate('CourseList')}>
            <Text style={homeStyles.cardButtonText}>Courses</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}


const homeStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#34495e',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 10,
  },
  row: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 20,
  },
  cardButton: {
    width: '80%',
    height: 150,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardButtonText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#3498db',
    textAlign: 'center',
  },
});

export default HomeScreen;


