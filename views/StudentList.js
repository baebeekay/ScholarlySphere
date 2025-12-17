import { useEffect, useState } from 'react';

import {
  FlatList,
  Text,
  View,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Pressable,
  TextInput,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useNavigation, useRoute } from '@react-navigation/native';

const StudentList = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { courseCode, courseTitle } = route.params || {};
  

  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const db = useSQLiteContext();

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      let query = `SELECT * FROM enrollment`;
      let params = [];

      if (courseCode) {
        query = `
         SELECT * FROM enrollment
          WHERE courseCode = ?
          ORDER BY name ASC
        `;
        params = [courseCode];
      } else {
        // Otherwise, load all students
        query = `SELECT * FROM enrollment ORDER BY name ASC`;
      }
      const results = await db.getAllAsync(query, params);
      setStudents(results);
    } catch (error) {
      console.error('Database error loading students:', error);
      Alert.alert(
        'Error',
        error.message || 'An error occurred while loading students.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Reload students whenever the courseCode param changes
    loadStudents();
  }, [courseCode]);

  // Filter students based on search query
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <View style={studentListStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={studentListStyles.loadingText}>Loading Students...</Text>
      </View>
    );
  }

  return (
    <View style={studentListStyles.container}>
      {courseCode ? (
        <View style={studentListStyles.courseFilterHeader}>
          <Text style={studentListStyles.courseFilterText}>
            Students for: {courseTitle || courseCode}
          </Text>
        </View>
      ) : (
        <Text style={studentListStyles.headerTitle}>All Students</Text>
      )}

      <TextInput
        style={studentListStyles.searchBar}
        placeholder="Search students by name..."
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredStudents}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadStudents}
            tintColor="#3498db"
          />
        }
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={studentListStyles.studentCard}
            onPress={() => {
              navigation.navigate('StudentRecord', {
                id: item.id,
                courseCode: item.courseCode,
                name: item.name,
                regNo: item.regNo,
              });
            }}>
            <View style={studentListStyles.cardContent}>
              <Text style={studentListStyles.name}>{item.name}</Text>
              <Text style={studentListStyles.regNo}>{item.regNo}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={() => (
          <View style={studentListStyles.emptyListContainer}>
            <Text style={studentListStyles.emptyListText}>
              {searchQuery
                ? `No students found for "${searchQuery}"`
                : 'No students found.'}
            </Text>
            {searchQuery ? null : (
              <Text style={studentListStyles.emptyListSubText}>
                Add students to see them here.
              </Text>
            )}
          </View>
        )}
      />
    </View>
  );
};

const studentListStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    paddingTop: 10,
  },
  courseFilterHeader: {
    backgroundColor: '#eaf2f8',
    padding: 15,
    marginHorizontal: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  courseFilterText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2980b9',
    marginBottom: 10,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  searchBar: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#34495e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 15,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    borderLeftWidth: 5,
    borderLeftColor: '#2ecc71',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardContent: {
    flex: 1,
  },

  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyListText: {
    fontSize: 18,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  emptyListSubText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
});

export default StudentList;
