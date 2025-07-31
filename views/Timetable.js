import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  FlatList,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';

// Updated DAYS_OF_WEEK to only include Monday to Friday
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
const REMINDER_OPTIONS = [
  { label: 'No Reminder', value: '0' },
  { label: '5 minutes before', value: '5' },
  { label: '10 minutes before', value: '10' },
  { label: '15 minutes before', value: '15' },
  { label: '30 minutes before', value: '30' },
  { label: '1 hour before', value: '60' },
];

export default function TimeTableScreen() {
  const [lectures, setLectures] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [day, setDay] = useState('Monday');
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [course, setCourse] = useState('');
  const [hall, setHall] = useState('Select Hall');
  const [reminder, setReminder] = useState('10');

  // Track app state for notification handling
  const [appState, setAppState] = useState(AppState.currentState);
  const appStateRef = useRef(appState);

  // Storage functions - now uses a global key
  const getStorageKey = () => `lectures_global`;

  const loadLectures = async () => {
    try {
      const saved = await AsyncStorage.getItem(getStorageKey());
      if (saved) setLectures(JSON.parse(saved));
    } catch (e) {
      console.error('Load error:', e);
    }
  };

  const saveLectures = async (newLectures) => {
    try {
      await AsyncStorage.setItem(getStorageKey(), JSON.stringify(newLectures));
      setLectures(newLectures);
    } catch (e) {
      console.error('Save error:', e);
    }
  };

  // Notification setup with foreground handling
  const setupNotifications = async () => {
    if (!Device.isDevice) return;

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    // Set notification handler to suppress banners in foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: appStateRef.current !== 'active',
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  };

  // Track app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      appStateRef.current = nextAppState;
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );
    return () => subscription.remove();
  }, []);

  // Helper to get day of week string from Date object
  const getDayOfWeekString = (date) => {
    const dayIndex = date.getDay();
    if (dayIndex === 0) return 'Sunday';
    if (dayIndex === 6) return 'Saturday';
    return DAYS_OF_WEEK[dayIndex - 1];
  };

  // Calculate the next valid notification time for a lecture
  const calculateNotificationTime = (initialTriggerDateISO, reminderMins) => {
    if (reminderMins <= 0) return null;

    const now = new Date();
    let notificationTime = new Date(initialTriggerDateISO);
    notificationTime.setMinutes(notificationTime.getMinutes() - reminderMins);

    // If notification time is in past, move to next week
    if (notificationTime.getTime() <= now.getTime()) {
      notificationTime.setDate(notificationTime.getDate() + 7);
    }

    return notificationTime;
  };

  // Schedule recurring notifications for lectures
  const scheduleNotification = async (lecture) => {
    const notificationTime = calculateNotificationTime(
      lecture.initialTriggerDate,
      parseInt(lecture.reminderOffset, 10)
    );

    if (!notificationTime) return null;

    try {
      const reminderMins = parseInt(lecture.reminderOffset, 10);
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Upcoming: ${lecture.course}`,
          body:
            reminderMins === 0
              ? `Your lecture for ${lecture.course} in ${lecture.hall} is starting now!`
              : `Starts in ${reminderMins} minutes in ${lecture.hall}`,
          data: { lectureId: lecture.id, type: 'lecture_reminder' },
        },
        trigger: {
          date: notificationTime,
          repeats: true, // Send weekly notifications
        },
        identifier: lecture.id,
      });
      console.log(
        `Scheduled recurring notification for ${
          lecture.course
        } at ${notificationTime.toLocaleString()}`
      );
      return notificationId;
    } catch (e) {
      console.error('Notification error:', e);
      Alert.alert(
        'Notification Error',
        `Failed to schedule notification for ${lecture.course}.`
      );
      return null;
    }
  };

  // Cancel a single notification
  const cancelNotification = async (id) => {
    if (id) {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
        console.log(`Cancelled notification with ID: ${id}`);
      } catch (e) {
        console.error('Cancel error:', e);
      }
    }
  };

  // Update all notifications when lectures change
  const updateAllNotifications = useCallback(async () => {
    // Cancel all existing lecture notifications
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const lectureNotifications = scheduled.filter(
      (n) => n.content.data && n.content.data.type === 'lecture_reminder'
    );

    await Promise.all(
      lectureNotifications.map((n) =>
        Notifications.cancelScheduledNotificationAsync(n.identifier)
      )
    );

    // Schedule new notifications only for lectures with a reminder offset > 0
    const updatedLectures = await Promise.all(
      lectures.map(async (lecture) => {
        if (parseInt(lecture.reminderOffset, 10) > 0) {
          const notificationId = await scheduleNotification(lecture);
          return { ...lecture, notificationId };
        } else {
          return { ...lecture, notificationId: null };
        }
      })
    );

    if (JSON.stringify(updatedLectures) !== JSON.stringify(lectures)) {
      saveLectures(updatedLectures);
    }
  }, [lectures]);

  // Initial setup
  useFocusEffect(
    useCallback(() => {
      loadLectures();
      setupNotifications();
    }, [])
  );

  // Update notifications when lectures change
  useEffect(() => {
    if (lectures.length > 0) {
      updateAllNotifications();
    }
  }, [lectures, updateAllNotifications]);

  // Lecture CRUD operations
  const openAddModal = () => {
    setCurrentLecture(null);
    const now = new Date();
    const currentDayString = getDayOfWeekString(now);
    setDay(
      DAYS_OF_WEEK.includes(currentDayString) ? currentDayString : 'Monday'
    );
    setTime(now);
    setCourse('');
    setHall('Select Hall');
    setReminder('10');
    setModalVisible(true);
  };

  const openEditModal = (lecture) => {
    setCurrentLecture(lecture);
    setDay(lecture.day);
    const storedDateTime = new Date(lecture.initialTriggerDate);
    setTime(storedDateTime);
    setCourse(lecture.course);
    setHall(lecture.hall);
    setReminder(lecture.reminderOffset);
    setModalVisible(true);
  };

  const handleSave = async () => {
    const hours = time.getHours();
    const mins = time.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedTime = `${formattedHours}:${mins
      .toString()
      .padStart(2, '0')} ${ampm}`;

    if (!course || hall === 'Select Hall') {
      Alert.alert(
        'Validation Error',
        'Please fill all fields and select a valid hall.'
      );
      return;
    }

    const lecture = {
      id: currentLecture?.id || Date.now().toString(),
      day: getDayOfWeekString(time),
      time: formattedTime,
      initialTriggerDate: time.toISOString(),
      course,
      hall,
      reminderOffset: reminder,
      notificationId: null,
    };

    const updatedLectures = currentLecture
      ? lectures.map((l) => (l.id === lecture.id ? lecture : l))
      : [...lectures, lecture];

    saveLectures(updatedLectures);
    setModalVisible(false);
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const handleDelete = async (id, notificationId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this lecture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            await cancelNotification(notificationId);
            saveLectures(lectures.filter((l) => l.id !== id));
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleDateTimeChange = (event, selectedValue) => {
    if (event.type === 'set') {
      setTime(selectedValue);
      setDay(getDayOfWeekString(selectedValue));
    }
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const renderLecture = ({ item }) => (
    <View style={lectureSchedulerStyles.tableRow}>
      <Text style={lectureSchedulerStyles.tableCell}>{item.time}</Text>
      <Text style={lectureSchedulerStyles.tableCell}>{item.course}</Text>
      <Text style={lectureSchedulerStyles.tableCell}>{item.hall}</Text>
      <View style={lectureSchedulerStyles.actionButtons}>
        <TouchableOpacity
          style={lectureSchedulerStyles.actionButton}
          onPress={() => openEditModal(item)}>
          <Text style={lectureSchedulerStyles.actionButtonText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={lectureSchedulerStyles.actionButton}
          onPress={() => handleDelete(item.id, item.notificationId)}>
          <Text style={lectureSchedulerStyles.actionButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={lectureSchedulerStyles.container}>
      <Text style={lectureSchedulerStyles.header}>Lecture Schedule</Text>

      <TouchableOpacity
        style={lectureSchedulerStyles.addButton}
        onPress={openAddModal}>
        <Text style={lectureSchedulerStyles.addButtonText}>Add Lecture</Text>
      </TouchableOpacity>

      <ScrollView style={lectureSchedulerStyles.scheduleContainer}>
        {DAYS_OF_WEEK.map((dayOfWeek) => (
          <View key={dayOfWeek} style={lectureSchedulerStyles.daySection}>
            <Text style={lectureSchedulerStyles.dayHeader}>{dayOfWeek}</Text>
            <View style={lectureSchedulerStyles.tableHeaderRow}>
              <Text style={lectureSchedulerStyles.tableHeaderCell}>Time</Text>
              <Text style={lectureSchedulerStyles.tableHeaderCell}>Course</Text>
              <Text style={lectureSchedulerStyles.tableHeaderCell}>Hall</Text>
              <Text style={lectureSchedulerStyles.tableHeaderCell}>
                Actions
              </Text>
            </View>

            <FlatList
              data={lectures
                .filter((l) => l.day === dayOfWeek)
                .sort((a, b) => {
                  const dateA = new Date(a.initialTriggerDate);
                  const dateB = new Date(b.initialTriggerDate);
                  return dateA.getTime() - dateB.getTime();
                })}
              renderItem={renderLecture}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={() => (
                <Text style={lectureSchedulerStyles.noLecturesText}>
                  No lectures scheduled
                </Text>
              )}
            />
          </View>
        ))}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setModalVisible(false);
          setShowDatePicker(false);
          setShowTimePicker(false);
        }}>
        <View style={lectureSchedulerStyles.centeredView}>
          <View style={lectureSchedulerStyles.modalContainer}>
            <ScrollView
              contentContainerStyle={lectureSchedulerStyles.modalContent}
              keyboardShouldPersistTaps="handled">
              <View style={lectureSchedulerStyles.modalView}>
                <Text style={lectureSchedulerStyles.modalTitle}>
                  {currentLecture ? 'Edit Lecture' : 'Add Lecture'}
                </Text>

                <Text style={lectureSchedulerStyles.inputLabel}>Day:</Text>
                <View style={lectureSchedulerStyles.dayPickerContainer}>
                  {DAYS_OF_WEEK.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        lectureSchedulerStyles.dayOption,
                        day === d && lectureSchedulerStyles.selectedDayOption,
                      ]}
                      onPress={() => setDay(d)}>
                      <Text
                        style={
                          day === d
                            ? lectureSchedulerStyles.selectedDayOptionText
                            : lectureSchedulerStyles.dayOptionText
                        }>
                        {d.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={lectureSchedulerStyles.inputLabel}>Date:</Text>
                <TouchableOpacity
                  style={lectureSchedulerStyles.timeDisplayButton}
                  onPress={() => setShowDatePicker(true)}>
                  <Text style={lectureSchedulerStyles.timeDisplayText}>
                    {time.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    testID="datePicker"
                    value={time}
                    mode="date"
                    display="default"
                    onChange={handleDateTimeChange}
                  />
                )}

                <Text style={lectureSchedulerStyles.inputLabel}>Time:</Text>
                <TouchableOpacity
                  style={lectureSchedulerStyles.timeDisplayButton}
                  onPress={() => setShowTimePicker(true)}>
                  <Text style={lectureSchedulerStyles.timeDisplayText}>
                    {time.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    testID="timePicker"
                    value={time}
                    mode="time"
                    is24Hour={false}
                    display="default"
                    onChange={handleDateTimeChange}
                  />
                )}

                <Text style={lectureSchedulerStyles.inputLabel}>Course:</Text>
                <TextInput
                  style={lectureSchedulerStyles.input}
                  value={course}
                  onChangeText={setCourse}
                  placeholder="Course name"
                />

                <Text style={lectureSchedulerStyles.inputLabel}>Hall:</Text>
                <View style={lectureSchedulerStyles.pickerContainer}>
                  <Picker
                    selectedValue={hall}
                    onValueChange={setHall}
                    style={lectureSchedulerStyles.picker}
                    itemStyle={lectureSchedulerStyles.pickerItem}>
                    {HALLS.map((h) => (
                      <Picker.Item key={h} label={h} value={h} />
                    ))}
                  </Picker>
                </View>

                <Text style={lectureSchedulerStyles.inputLabel}>Reminder:</Text>
                <View style={lectureSchedulerStyles.pickerContainer}>
                  <Picker
                    selectedValue={reminder}
                    onValueChange={setReminder}
                    style={lectureSchedulerStyles.picker}
                    itemStyle={lectureSchedulerStyles.pickerItem}>
                    {REMINDER_OPTIONS.map((o) => (
                      <Picker.Item
                        key={o.value}
                        label={o.label}
                        value={o.value}
                      />
                    ))}
                  </Picker>
                </View>

                <View style={lectureSchedulerStyles.modalButtons}>
                  <TouchableOpacity
                    style={lectureSchedulerStyles.saveButton}
                    onPress={handleSave}>
                    <Text style={lectureSchedulerStyles.buttonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={lectureSchedulerStyles.cancelButton}
                    onPress={() => {
                      setModalVisible(false);
                      setShowDatePicker(false);
                      setShowTimePicker(false);
                    }}>
                    <Text style={lectureSchedulerStyles.buttonText}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const lectureSchedulerStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Constants.statusBarHeight + 20,
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 15,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  scheduleContainer: {
    flex: 1,
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  daySection: {
    marginBottom: 15,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  dayHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2980b9',
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
    paddingBottom: 5,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#eaf2f8',
    paddingVertical: 8,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  tableHeaderCell: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#34495e',
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    alignItems: 'center',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#34495e',
  },
  cellContent: {
    paddingHorizontal: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
  },
  actionButton: {
    padding: 5,
    borderRadius: 5,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  actionButtonText: {
    fontSize: 16,
  },
  noLecturesText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontStyle: 'italic',
    paddingVertical: 10,
  },

  // Modal Styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxWidth: 400,
  },
  modalScrollViewContent: { // New style for ScrollView content container
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
  },
  inputLabel: {
    alignSelf: 'flex-start',
    fontSize: 16,
    color: '#34495e',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    color: '#34495e',
  },
  dayPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 15,
  },
  dayOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3498db',
    margin: 4,
  },
  selectedDayOption: {
    backgroundColor: '#3498db',
  },
  dayOptionText: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  selectedDayOptionText: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  cancelButton: {
    backgroundColor: '#e74c3c', 
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    flex: 1,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  timeDisplayButton: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  timeDisplayText: {
    fontSize: 16,
    color: '#34495e',
  },
  pickerContainer: {
    
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 15,
    backgroundColor: '#f8f8f8',
  },
  picker: {
    
    height: 50,
    width: '100%',
  },
  pickerItem: {
    
    fontSize: 16,
  },
});