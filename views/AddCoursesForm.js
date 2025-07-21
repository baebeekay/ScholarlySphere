import React, { useState, useEffect } from 'react';
import { Picker } from '@react-native-picker/picker';
import { Button } from '@react-navigation/elements';
import CourseData from './Courses';
import {
  View,
  StyleSheet,
  Image,
  Text,
  TextInput,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';


const AddCoursesForm = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    courseCode: '',
    courseTitle: ''
  });

      const [Courses, setCourses] = useState([]);
 const db= useSQLiteContext();

  useEffect(() => {
    setCourses(CourseData);
  }, []);

  

  const handleSubmit = async () => {
    try {
      // Validate form data
      if (!form.courseCode || !form.courseTitle) {
        throw new Error('Both Course Code and Course Title are required.');
      }

      // Check if course already exists 
      const existingCourse = await db.getFirstAsync('SELECT * FROM courses WHERE courseCode = ?', [form.courseCode]);
      if (existingCourse) {
        throw new Error(`Course with code ${form.courseCode} already exists.`);
      }

      await db.runAsync(
        'INSERT INTO courses (courseCode, courseTitle) VALUES (?, ?)',
        [form.courseCode, form.courseTitle],
      );
      
      Alert.alert('Success', 'Course added successfully!');
      setForm({
        courseCode: '',
        courseTitle: '',
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error adding course:', error);
      Alert.alert('Error', error.message || 'An error occurred while adding the course.');
    }
  };

  return (
    <ScrollView contentContainerStyle={addCoursesFormStyles.scrollContainer}>
      <View style={addCoursesFormStyles.container}>
        <Text style={addCoursesFormStyles.header}>Add New Course</Text>

        <Text style={addCoursesFormStyles.label}>Course Code:</Text>
        <View style={addCoursesFormStyles.pickerContainer}>
        
          <Picker
            selectedValue={form.courseCode}
            onValueChange={(itemValue) => {
              setForm({ ...form, courseCode: itemValue })

           
            }}
            style={addCoursesFormStyles.picker}
            itemStyle={addCoursesFormStyles.pickerItem}
          >
            <Picker.Item label="-- Select Course Code --" value="" />
            {Courses.map((course) => (
              <Picker.Item
                key={course.code}
                label={course.code}
                value={course.code}
              />
            ))}
          </Picker>
        </View>

        <Text style={addCoursesFormStyles.label}>Course Title:</Text>
        <View style={addCoursesFormStyles.pickerContainer}>
          <Picker
            selectedValue={form.courseTitle}
            onValueChange={(itemValue) => {
              setForm({ ...form, courseTitle: itemValue });
              // // Automatically set code if a matching title is selected
              // const selectedCourse = Courses.find(c => c.title === itemValue);
              // if (selectedCourse) {
              //   setForm(prevForm => ({ ...prevForm, courseCode: selectedCourse.code }));
              // }
            }}
            style={addCoursesFormStyles.picker}
            itemStyle={addCoursesFormStyles.pickerItem}
          >
            <Picker.Item label="-- Select Course Title --" value="" />
            {Courses.map((course) => (
              <Picker.Item
                key={course.title}
                label={course.title}
                value={course.title}
              />
            ))}
          </Picker>
        </View>

       

        <TouchableOpacity style={addCoursesFormStyles.submitButton} onPress={handleSubmit}>
          <Text style={addCoursesFormStyles.submitButtonText}>Add Course</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// --- Styles for AddCoursesForm Component ---
const addCoursesFormStyles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8', // Light background
    paddingVertical: 20,
  },
  container: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 30,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 8,
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#b0e0e6',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#34495e',
  },
  pickerItem: {
    fontSize: 16,
  },
 
  submitButton: {
    backgroundColor: '#3498db', 
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});


export default  AddCoursesForm;
  







