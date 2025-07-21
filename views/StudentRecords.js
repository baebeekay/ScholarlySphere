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
  const { id, name, regNo, courseCode } = route.params;

  const [courseWork, setCourseWork] = useState('');
  const [testScore, setTestScore] = useState('');
  const [examScore, setExamScore] = useState('');
  const [total, setTotal] = useState(0);
  const [grade, setGrade] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const db = useSQLiteContext();

  const calculateTotalScore = (ca, test, exam) => {
    const parsedCa = parseFloat(ca || 0);
    const parsedTest = parseFloat(test || 0);
    const parsedExam = parseFloat(exam || 0);
    return parsedCa + parsedTest + parsedExam;
  };

  useEffect(() => {
    const loadStudentScores = async () => {
      setIsLoading(true);
      try {
        const result = await db.getFirstAsync(
          'SELECT * FROM enrollment WHERE id = ? AND courseCode = ?',
          [id, courseCode]
        );
        if (result) {
          setCourseWork(result.courseWork || '');
          setTestScore(result.testScore || '');
          setExamScore(result.examScore || '');
          setTotal(result.total || 0);
          setGrade(result.grade || '');
        } else {
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
          error.message || 'An error occurred while loading student score.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadStudentScores();
  }, [id, courseCode]); // Re-run when studentId or courseCode changes

  // Recalculate total score whenever input fields change
  useEffect(() => {
    setTotal(calculateTotalScore(courseWork, testScore, examScore));
  }, [courseWork, testScore, examScore]);

  const handleSaveScores = async () => {
    // // Basic validation
    // if (
    //   courseWork === '' ||
    //   testScore === '' ||
    //   examScore === '' ||
    //   grade === ''
    // ) {
    //   Alert.alert(
    //     'Validation Error',
    //     'All fields (CA, Test, Exam, Grade) are required.'
    //   );
    //   return;
    // }
    // if (
    //   isNaN(parseFloat(caScore)) ||
    //   isNaN(parseFloat(testScore)) ||
    //   isNaN(parseFloat(examScore))
    // ) {
    //   Alert.alert(
    //     'Validation Error',
    //     'Please enter valid numbers for CA, Test, and Exam scores.'
    //   );
    //   return;
    // }

    try {
      const existingRecord = await db.getFirstAsync(
        'SELECT * FROM enrollment WHERE id = ? AND courseCode = ?',
        [id, courseCode]
      );

      if (existingRecord) {
        await db.runAsync(
          `UPDATE enrollment SET courseWork = ?, testScore = ?, examScore = ?, total = ?, grade = ? WHERE id = ?`,
          [
            parseFloat(courseWork),
            parseFloat(testScore),
            parseFloat(examScore),
            total,
            grade,
            existingRecord.id,
          ]
        );
        Alert.alert('Success', 'Scores updated successfully!');
      } else {
        await db.runAsync(
          `INSERT INTO enrollment (id, courseCode, courseWork, testScore, examScore, total, grade) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            courseCode,
            parseFloat(courseWork),
            parseFloat(testScore),
            parseFloat(examScore),
            total,
            grade,
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

        <Text style={studentRecordStyles.sectionTitle}>Enter Scores</Text>

        <Text style={studentRecordStyles.inputLabel}>courseWork:</Text>
        <TextInput
          style={studentRecordStyles.input}
          keyboardType="numeric"
          value={courseWork}
          onChangeText={(text) => setCourseWork(text.replace(/[^0-9.]/g, ''))}
          placeholder="e.g., 12"
          maxLength={2}
        />

        <Text style={studentRecordStyles.inputLabel}>Test Score:</Text>
        <TextInput
          style={studentRecordStyles.input}
          keyboardType="numeric"
          value={testScore}
          onChangeText={(text) => setTestScore(text.replace(/[^0-9.]/g, ''))}
          placeholder="e.g., 12"
          maxLength={2}
        />

        <Text style={studentRecordStyles.inputLabel}>Exam Score:</Text>
        <TextInput
          style={studentRecordStyles.input}
          keyboardType="numeric"
          value={examScore}
          onChangeText={(text) => setExamScore(text.replace(/[^0-9.]/g, ''))}
          placeholder="e.g., 50"
          maxLength={2}
        />

        <Text style={studentRecordStyles.inputLabel}>Grade:</Text>
        <TextInput
          style={studentRecordStyles.input}
          value={grade}
          onChangeText={setGrade}
          placeholder="e.g., A"
          maxLength={2}
          autoCapitalize="characters"
        />

        <Text style={studentRecordStyles.sectionTitle}>Summary</Text>

        <View style={studentRecordStyles.scoreTable}>
          <View style={studentRecordStyles.tableHeaderRow}>
            <Text style={studentRecordStyles.tableHeaderCell}>Category</Text>
            <Text style={studentRecordStyles.tableHeaderCell}>Score</Text>
            <Text style={studentRecordStyles.tableHeaderCell}>Grade</Text>
          </View>
          <View style={studentRecordStyles.tableRow}>
            <Text style={studentRecordStyles.tableCell}>courseWork</Text>
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
            <Text style={studentRecordStyles.tableCell}>Total Score</Text>
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
