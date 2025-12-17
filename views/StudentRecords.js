import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';

const StudentRecord = () => {
  const navigation = useNavigation();
  const route = useRoute();
  // Removed username from route.params
  const { id, name, regNo, courseCode } = route.params || {}; 

  const [courseWork, setCourseWork] = useState('');
  const [testScore, setTestScore] = useState('');
  const [examScore, setExamScore] = useState('');
  const [total, setTotal] = useState(0);
  const [grade, setGrade] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const db = useSQLiteContext();

  const calculateTotalScore = (courseWork, test, exam) => {
    const parsedCa = parseFloat(courseWork || 0);
    const parsedTest = parseFloat(test || 0);
    const parsedExam = parseFloat(exam || 0);
    // Ensure scores don't exceed their maximums before summing
    const validCa = Math.min(parsedCa, 15);
    const validTest = Math.min(parsedTest, 15);
    const validExam = Math.min(parsedExam, 70);
    return validCa + validTest + validExam;
  };

  const calculateGrade = (total) => {
    if (total >= 70) return 'A';
    if (total >= 60) return 'B';
    if (total >= 50) return 'C';
    if (total >= 45) return 'D';
    if (total >= 40) return 'E';
    return 'F';
  };

  useEffect(() => {
    const loadStudentScores = async () => {
      // Removed username from this check
      if (!id || !courseCode) {
        console.warn("Missing parameters for loading student scores. Skipping load.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        // Removed username from WHERE clause
        const result = await db.getFirstAsync(
          'SELECT * FROM enrollment WHERE id = ? AND courseCode = ?',
          [id, courseCode] 
        );
        if (result) {
          setCourseWork(
            result.courseWork !== null ? result.courseWork.toString() : ''
          );
          setTestScore(
            result.testScore !== null ? result.testScore.toString() : ''
          );
          setExamScore(
            result.examScore !== null ? result.examScore.toString() : ''
          );
          setTotal(result.total !== null ? result.total : 0);
          setGrade(result.grade !== null ? result.grade : '');
        } else {
          // No existing record, reset fields
          setCourseWork('');
          setTestScore('');
          setExamScore('');
          setTotal(0);
          setGrade('');
        }
      } catch (error) {
        console.error('Database error loading student scores:', error);
        Alert.alert(
          'Error',
          error.message || 'An error occurred while loading student scores.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadStudentScores();
  }, [id, courseCode, db]); // Removed username from dependency array

  useEffect(() => {
    const newTotal = calculateTotalScore(courseWork, testScore, examScore);
    setTotal(newTotal);
    setGrade(calculateGrade(newTotal));
  }, [courseWork, testScore, examScore]);

  const handleSaveScores = async () => {
    const parsedCa = parseFloat(courseWork);
    const parsedTest = parseFloat(testScore);
    const parsedExam = parseFloat(examScore);

    if (isNaN(parsedCa) || isNaN(parsedTest) || isNaN(parsedExam)) {
      Alert.alert(
        'Validation Error',
        'Please enter valid numbers for CA, Test, and Exam scores.'
      );
      return;
    }

    if (parsedCa < 0 || parsedTest < 0 || parsedExam < 0) {
      Alert.alert(
        'Validation Error',
        'Scores cannot be negative.'
      );
      return;
    }

    if (parsedCa > 15 || parsedTest > 15) {
      Alert.alert(
        'Validation Error',
        'CA Score and Test Score cannot exceed 15.'
      );
      return;
    }
    if (parsedExam > 70) {
      Alert.alert('Validation Error', 'Exam Score cannot exceed 70.');
      return;
    }

    const finalTotal = calculateTotalScore(courseWork, testScore, examScore);
    if (finalTotal > 100) {
      Alert.alert('Validation Error', 'Total score cannot exceed 100.');
      return;
    }

    try {
      // Check if a record already exists for this student and course (username removed)
      const existingRecord = await db.getFirstAsync(
        'SELECT * FROM enrollment WHERE id = ? AND courseCode = ?',
        [id, courseCode] 
      );

      if (existingRecord) {
        // Update existing record (username removed from WHERE clause)
        await db.runAsync(
          `UPDATE enrollment SET courseWork = ?, testScore = ?, examScore = ?, total = ?, grade = ? WHERE id = ? AND courseCode = ?`,
          [
            parsedCa,
            parsedTest,
            parsedExam,
            finalTotal,
            calculateGrade(finalTotal),
            id,       
            courseCode 
          ]
        );
        Alert.alert('Success', 'Scores updated successfully!');
      } else {
        // Insert new record (username column removed from INSERT statement)
        await db.runAsync(
          `INSERT INTO enrollment (id, courseCode, courseWork, testScore, examScore, total, grade) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            courseCode,
            parsedCa,
            parsedTest,
            parsedExam,
            finalTotal,
            calculateGrade(finalTotal),
          ]
        );
        Alert.alert('Success', 'Scores saved successfully!');
      }
    } catch (error) {
      console.error('Error saving scores:', error);
      Alert.alert(
        'Error',
        error.message || 'An error occurred while saving scores.'
      );
    }
  };

  if (isLoading) {
    return (
      <View style={studentRecordStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={studentRecordStyles.loadingText}>
          Loading Student Record...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={studentRecordStyles.scrollContainer}>
      <View style={studentRecordStyles.container}>
        <Text style={studentRecordStyles.header}>Student Record</Text>

        <View style={studentRecordStyles.studentInfo}>
          <Text style={studentRecordStyles.infoLabel}>Name:</Text>
          <Text style={studentRecordStyles.infoValue}>{name}</Text>
        </View>
        <View style={studentRecordStyles.studentInfo}>
          <Text style={studentRecordStyles.infoLabel}>Reg. No.:</Text>
          <Text style={studentRecordStyles.infoValue}>{regNo}</Text>
        </View>
        <View style={studentRecordStyles.studentInfo}>
          <Text style={studentRecordStyles.infoLabel}>Course Code:</Text>
          <Text style={studentRecordStyles.infoValue}>{courseCode}</Text>
        </View>

        <Text style={studentRecordStyles.inputLabel}>
          CA Score (out of 15):
        </Text>
        <TextInput
          style={studentRecordStyles.input}
          value={courseWork}
          onChangeText={(text) => setCourseWork(text)}
          keyboardType="numeric"
          placeholder="e.g., 12"
          maxLength={2} 
        />

        <Text style={studentRecordStyles.inputLabel}>
          Test Score (out of 15):
        </Text>
        <TextInput
          style={studentRecordStyles.input}
          value={testScore}
          onChangeText={(text) => setTestScore(text)}
          keyboardType="numeric"
          placeholder="e.g., 10"
          maxLength={2} 
        />

        <Text style={studentRecordStyles.inputLabel}>
          Exam Score (out of 70):
        </Text>
        <TextInput
          style={studentRecordStyles.input}
          value={examScore}
          onChangeText={(text) => setExamScore(text)}
          keyboardType="numeric"
          placeholder="e.g., 55"
          maxLength={2} 
        />

        <Text style={studentRecordStyles.sectionTitle}>Summary</Text>

        <View style={studentRecordStyles.scoreTable}>
          <View style={studentRecordStyles.tableHeaderRow}>
            <Text style={studentRecordStyles.tableHeaderCell}>Category</Text>
            <Text style={studentRecordStyles.tableHeaderCell}>Score</Text>
            <Text style={studentRecordStyles.tableHeaderCell}>Grade</Text>
          </View>
          <View style={studentRecordStyles.tableRow}>
            <Text style={studentRecordStyles.tableCell}>CA Score</Text>
            <Text style={studentRecordStyles.tableCell}>
              {courseWork || 'N/A'}
            </Text>
            <Text style={studentRecordStyles.tableCell}>-</Text>
          </View>
          <View style={studentRecordStyles.tableRow}>
            <Text style={studentRecordStyles.tableCell}>Test Score</Text>
            <Text style={studentRecordStyles.tableCell}>
              {testScore || 'N/A'}
            </Text>
            <Text style={studentRecordStyles.tableCell}>-</Text>
          </View>
          <View style={studentRecordStyles.tableRow}>
            <Text style={studentRecordStyles.tableCell}>Exam Score</Text>
            <Text style={studentRecordStyles.tableCell}>
              {examScore || 'N/A'}
            </Text>
            <Text style={studentRecordStyles.tableCell}>-</Text>
          </View>
          <View
            style={[
              studentRecordStyles.tableRow,
              studentRecordStyles.totalRow,
            ]}>
            <Text style={studentRecordStyles.tableCell}>
              Total Score (Max 100)
            </Text>
            <Text style={studentRecordStyles.tableCell}>
              {total.toFixed(2)}
            </Text>
            <Text style={studentRecordStyles.tableCell}>{grade || 'N/A'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={studentRecordStyles.saveButton}
          onPress={handleSaveScores}>
          <Text style={studentRecordStyles.saveButtonText}>Save Scores</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};


const studentRecordStyles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
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
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 25,
    textAlign: 'center',
  },
  studentInfo: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
    marginRight: 10,
  },
  infoValue: {
    fontSize: 18,
    color: '#555',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2980b9',
    marginTop: 20,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#b0e0e6',
    paddingBottom: 5,
  },
  inputLabel: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#b0e0e6',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#34495e',
    marginBottom: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  scoreTable: {
    borderWidth: 1,
    borderColor: '#b0e0e6',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#eaf2f8',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#b0e0e6',
  },
  tableHeaderCell: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#34495e',
    fontSize: 16,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  totalRow: {
    backgroundColor: '#d4edda',
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    color: '#34495e',
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default StudentRecord;