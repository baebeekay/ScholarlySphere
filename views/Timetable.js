import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const HALLS = [
  'Select Hall',
  'Physical Science Auditorium',
  'Computer Science Lecture Hall 1',
  'Computer Science Lecture Hall 2',
  'Computer Science Lecture Hall 3',
  'Computer Science Lecture Hall 4',
  'Computer Lab',
];

export default function TimeTableScreen() {
  const [lectures, setLectures] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [day, setDay] = useState('Monday');
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [course, setCourse] = useState('');
  const [hall, setHall] = useState('Select Hall');

  const STORAGE_KEY = `lectures_global`;

  
  const setupNotifications = async () => {
    if (!Device.isDevice) return;
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Enable notifications to receive lecture reminders.'
      );
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
  };

  const scheduleWeeklyNotification = async (lecture) => {
    const triggerDate = new Date(lecture.initialTriggerDate);
    // Subtract 10 minutes from the start time for the reminder
    const reminderTime = new Date(triggerDate.getTime() - 10 * 60000);

    const weekdayMap = {
      Monday: 2,
      Tuesday: 3,
      Wednesday: 4,
      Thursday: 5,
      Friday: 6,
    };

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Upcoming Lecture: ${lecture.course}`,
          body: `${lecture.course} in ${lecture.hall} starts in 10 minutes!`,
          data: { type: 'lecture_reminder' },
          sound: true,
        },
        trigger: {
          weekday: weekdayMap[lecture.day],
          hour: reminderTime.getHours(),
          minute: reminderTime.getMinutes(),
          repeats: true,
        },
      });
      return id;
    } catch (e) {
      console.error('Scheduling failed', e);
      return null;
    }
  };

  
  const loadLectures = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setLectures(JSON.parse(saved));
    } catch (e) {
      console.error('Load error', e);
    }
  };

  const saveLectures = async (newLectures) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newLectures));
      setLectures(newLectures);
    } catch (e) {
      console.error('Save error', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLectures();
      setupNotifications();
    }, [])
  );

  
  const handleSave = async () => {
    if (!course || hall === 'Select Hall') {
      Alert.alert(
        'Missing Info',
        'Please provide a course name and select a hall.'
      );
      return;
    }

    const hours = time.getHours();
    const mins = time.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedTime = `${hours % 12 || 12}:${mins
      .toString()
      .padStart(2, '0')} ${ampm}`;

    
    if (currentLecture?.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(
        currentLecture.notificationId
      );
    }

    const lectureData = {
      id: currentLecture?.id || Date.now().toString(),
      day: day,
      time: formattedTime,
      initialTriggerDate: time.toISOString(),
      course,
      hall,
    };

    
    const notificationId = await scheduleWeeklyNotification(lectureData);
    lectureData.notificationId = notificationId;

    const updatedList = currentLecture
      ? lectures.map((l) => (l.id === lectureData.id ? lectureData : l))
      : [...lectures, lectureData];

    saveLectures(updatedList);
    setModalVisible(false);
  };

  const handleDelete = (id, notificationId) => {
    Alert.alert('Delete Lecture', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (notificationId) {
            await Notifications.cancelScheduledNotificationAsync(
              notificationId
            );
          }
          const filtered = lectures.filter((l) => l.id !== id);
          saveLectures(filtered);
        },
      },
    ]);
  };

  const handleTimeChange = (event, selectedDate) => {
    setShowTimePicker(false);
    if (selectedDate) setTime(selectedDate);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Lecture Schedule</Text>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setCurrentLecture(null);
          setCourse('');
          setHall('Select Hall');
          setDay('Monday');
          setTime(new Date());
          setModalVisible(true);
        }}>
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add New Lecture</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scheduleContainer}>
        {DAYS_OF_WEEK.map((dayOfWeek) => (
          <View key={dayOfWeek} style={styles.daySection}>
            <Text style={styles.dayHeader}>{dayOfWeek}</Text>

            {lectures.filter((l) => l.day === dayOfWeek).length === 0 ? (
              <Text style={styles.noLecturesText}>No lectures scheduled</Text>
            ) : (
              lectures
                .filter((l) => l.day === dayOfWeek)
                .sort(
                  (a, b) =>
                    new Date(a.initialTriggerDate) -
                    new Date(b.initialTriggerDate)
                )
                .map((item) => (
                  <View key={item.id} style={styles.tableRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.timeText}>{item.time}</Text>
                    </View>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.courseText}>{item.course}</Text>
                      <Text style={styles.hallText}>{item.hall}</Text>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        onPress={() => {
                          setCurrentLecture(item);
                          setCourse(item.course);
                          setHall(item.hall);
                          setDay(item.day);
                          setTime(new Date(item.initialTriggerDate));
                          setModalVisible(true);
                        }}>
                        <MaterialCommunityIcons
                          name="pencil-outline"
                          size={22}
                          color="#3498db"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          handleDelete(item.id, item.notificationId)
                        }>
                        <MaterialCommunityIcons
                          name="trash-can-outline"
                          size={22}
                          color="#e74c3c"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
            )}
          </View>
        ))}
      </ScrollView>

      
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>
              {currentLecture ? 'Edit Lecture' : 'New Lecture'}
            </Text>

            <Text style={styles.inputLabel}>Day of Week</Text>
            <View style={styles.dayPickerRow}>
              {DAYS_OF_WEEK.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayChip, day === d && styles.selectedDayChip]}
                  onPress={() => setDay(d)}>
                  <Text
                    style={[
                      styles.dayChipText,
                      day === d && { color: '#fff' },
                    ]}>
                    {d.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Start Time</Text>
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => setShowTimePicker(true)}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color="#555"
              />
              <Text style={styles.timePickerText}>
                {time.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                is24Hour={false}
                onChange={handleTimeChange}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Course Name (e.g. CSC 301)"
              value={course}
              onChangeText={setCourse}
            />

            <View style={styles.pickerBorder}>
              <Picker selectedValue={hall} onValueChange={setHall}>
                {HALLS.map((h) => (
                  <Picker.Item key={h} label={h} value={h} />
                ))}
              </Picker>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.btnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#f4f7f9',
    padding: 15,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginVertical: 15,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scheduleContainer: { flex: 1 },
  daySection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
  },
  dayHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2980b9',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    paddingBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#fafafa',
    alignItems: 'center',
  },
  timeText: { fontSize: 14, color: '#7f8c8d', fontWeight: '600' },
  courseText: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  hallText: { fontSize: 12, color: '#95a5a6' },
  noLecturesText: {
    textAlign: 'center',
    color: '#bdc3c7',
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    width: 60,
    justifyContent: 'space-between',
  },

  centeredView: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 8,
  },
  dayPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dayChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  selectedDayChip: { backgroundColor: '#3498db' },
  dayChipText: { color: '#3498db', fontSize: 12, fontWeight: 'bold' },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  timePickerText: { marginLeft: 10, fontSize: 16, color: '#2c3e50' },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  pickerBorder: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    marginBottom: 25,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  saveBtn: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 12,
    flex: 1,
  },
  cancelBtn: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 12,
    flex: 1,
  },
  btnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
