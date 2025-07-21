import { useCallback, useState } from 'react';
import {
  FlatList,
  Text,
  View,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const CourseList = () => {
  const navigation = useNavigation();
  const [Courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const db = useSQLiteContext();

  const loadCourses = async () => {
    try {
      setIsLoading(true);

      const results = await db.getAllAsync(
        ` SELECT * FROM courses ORDER BY courseCode ASC`
      );
      setCourses(results);
    } catch (error) {
      console.error('Database error loading courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this course? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await db.runAsync('DELETE FROM courses WHERE courseId = ?', [
                courseId,
              ]);
              Alert.alert('Success', 'Course deleted successfully!');
              loadCourses();
            } catch (error) {
              console.error('Error deleting course:', error);
              Alert.alert(
                'Error',
                error.message || 'An error occurred while deleting the course.'
              );
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  // useEffect(() => {
  //   loadCourses();
  // }, []);
  useFocusEffect(
    useCallback(() => {
      loadCourses();
    }, [])
  );

  if (isLoading) {
    return (
      <View style={courseListStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={courseListStyles.loadingText}>Loading Courses...</Text>
      </View>
    );
  }

  return (
    <View style={courseListStyles.container}>
      <FlatList
        data={Courses}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadCourses}
            tintColor="#3498db"
          />
        }
        keyExtractor={(item) => item.courseCode.toString()}
        renderItem={({ item }) => (
          <Pressable
            style={courseListStyles.courseCard}
            onPress={() =>
              navigation.navigate('StudentList', {
                courseCode: item.courseCode,
                courseTitle: item.courseTitle,
              })
            }>
            <View style={courseListStyles.cardContent}>
              <Text style={courseListStyles.courseCode}>{item.courseCode}</Text>
              <Text style={courseListStyles.courseTitle}>
                {item.courseTitle}
              </Text>
            </View>
            <TouchableOpacity
              style={courseListStyles.deleteButton}
              onPress={() => handleDeleteCourse(item.courseId)}>
              <Text style={courseListStyles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          </Pressable>
        )}
        ListEmptyComponent={() => (
          <View style={courseListStyles.emptyListContainer}>
            <Text style={courseListStyles.emptyListText}>
              No courses found.
            </Text>
            <Text style={courseListStyles.emptyListSubText}>
              Add courses to see them here.
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const courseListStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    paddingTop: 10,
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

  courseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    borderLeftColor: '#3498db',
  },
  cardContent: {
    flex: 1,
  },
  courseCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  courseTitle: {
    fontSize: 16,
    color: '#555',
  },
  deleteButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#e74c3c',
    marginLeft: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
export default CourseList;
