import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
// Import icons to match your login/signup screens
import { MaterialCommunityIcons } from '@expo/vector-icons';

const HomeForm = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { username } = route.params || {};

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive", 
          onPress: () => navigation.replace('Login') // .replace ensures user can't go back to Home
        }
      ]
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={homeStyles.safeArea}>
        {/* Logout Button Header */}
        <View style={homeStyles.headerContainer}>
          <TouchableOpacity style={homeStyles.logoutIconButton} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={26} color="#e74c3c" />
            <Text style={homeStyles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={homeStyles.welcomeText}>Welcome {username}!</Text>
        
        <View style={homeStyles.row}>
          <TouchableOpacity
            style={homeStyles.cardButton}
            onPress={() => navigation.navigate('TimeTable', { username: username })}>
            <MaterialCommunityIcons name="calendar-clock" size={40} color="#3498db" />
            <Text style={homeStyles.cardButtonText}>Lecture Scheduler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={homeStyles.cardButton}
            onPress={() => navigation.navigate('CourseList', { username: username })}>
            <MaterialCommunityIcons name="book-open-variant" size={40} color="#3498db" />
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  logoutIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  logoutText: {
    color: '#e74c3c',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 16,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#34495e',
    textAlign: 'center',
    marginTop: 20,
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
    width: '85%',
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
    marginTop: 10,
  },
});

export default HomeForm;
