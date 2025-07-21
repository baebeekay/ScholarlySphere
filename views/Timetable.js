import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Calendar from 'expo-calendar';
import Constants from 'expo-constants';
import { Picker } from '@react-native-picker/picker';

// Configure Expo Notifications handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, 
    shouldShowList: true, 
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});


export default function TimeTableScreen() {
  const [lectures, setLectures] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentLecture, setCurrentLecture] = useState(null); 
  const [day, setDay] = useState('Monday');
  const [selectedHour, setSelectedHour] = useState('09'); 
  const [selectedMinute, setSelectedMinute] = useState('00'); 
  const [selectedAmPm, setSelectedAmPm] = useState('AM'); 
  const [course, setCourse] = useState('');
  const [hall, setHall] = useState('');
  const [upcomingNotifications, setUpcomingNotifications] = useState([]);

  const notificationListener = useRef();
  const responseListener = useRef();

  const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const HOURS = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, '0')
  ); // 01 to 12
  const MINUTES = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, '0')
  ); // 00 to 59
  const AMPM = ['AM', 'PM'];

  // --- AsyncStorage Operations ---
  const STORAGE_KEY = 'lectureSchedule';

  const saveLectures = async (newLectures) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newLectures));
      setLectures(newLectures);
    } catch (e) {
      console.error('Failed to save lectures to AsyncStorage', e);
      showCustomAlert('Error', 'Failed to save lecture data.');
    }
  };

  const loadLectures = async () => {
    try {
      const storedLectures = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedLectures !== null) {
        setLectures(JSON.parse(storedLectures));
      }
    } catch (e) {
      console.error('Failed to load lectures from AsyncStorage', e);
      showCustomAlert('Error', 'Failed to load lecture data.');
    }
  };

  // --- Notification Functions ---
  const registerForPushNotificationsAsync = async () => {
    let token;
    if (Constants.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        showCustomAlert(
          'Permission Required',
          'Failed to get push token for push notification!'
        );
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } else {
      showCustomAlert(
        'Not on Device',
        'Must use physical device for Push Notifications'
      );
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    return token;
  };

  const scheduleLectureNotification = async (lecture) => {
    if (lecture.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(
        lecture.notificationId
      );
    }

    // Parse time from HH:MM AM/PM format
    const [timePart, ampmPart] = lecture.time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    if (ampmPart === 'PM' && hours !== 12) {
      hours += 12;
    } else if (ampmPart === 'AM' && hours === 12) {
      hours = 0; // 12 AM is 00 hours
    }

    const now = new Date();
    let notificationTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0
    );

    const todayIndex = now.getDay();
    const lectureDayIndex = DAYS_OF_WEEK.indexOf(lecture.day) + 1;

    let daysToAdd = lectureDayIndex - todayIndex;
    if (daysToAdd < 0) {
      daysToAdd += 7;
    }
    if (daysToAdd === 0 && notificationTime.getTime() < now.getTime()) {
      daysToAdd = 7;
    }

    notificationTime.setDate(now.getDate() + daysToAdd);
    notificationTime.setMinutes(notificationTime.getMinutes() - 10);

    if (notificationTime.getTime() < now.getTime()) {
      notificationTime.setDate(notificationTime.getDate() + 7);
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Upcoming Lecture: ${lecture.course}`,
          body: `Your lecture for ${lecture.course} in ${lecture.hall} is starting in 10 minutes!`,
          data: { lectureId: lecture.id, type: 'lecture_reminder' },
        },
        trigger: {
          date: notificationTime,
          repeats: true,
        },
      });
      console.log(
        `Notification scheduled for ${lecture.course} with ID: ${notificationId}`
      );
      return notificationId;
    } catch (e) {
      console.error('Failed to schedule notification:', e);
      showCustomAlert(
        'Notification Error',
        `Failed to schedule notification for ${lecture.course}.`
      );
      return null;
    }
  };

  const cancelLectureNotification = async (notificationId) => {
    if (notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        console.log(`Notification with ID ${notificationId} cancelled.`);
      } catch (e) {
        console.error('Failed to cancel notification:', e);
      }
    }
  };

  const fetchScheduledNotifications = async () => {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const upcoming = scheduled
      .filter(
        (n) => n.content.data && n.content.data.type === 'lecture_reminder'
      )
      .sort((a, b) => {
        const triggerA = a.trigger.date
          ? new Date(a.trigger.date)
          : new Date(0);
        const triggerB = b.trigger.date
          ? new Date(b.trigger.date)
          : new Date(0);
        return triggerA.getTime() - triggerB.getTime();
      });
    setUpcomingNotifications(upcoming);
  };

  // --- Calendar Functions ---
  const getDefaultCalendarSource = async () => {
    const calendars = await Calendar.getCalendarsAsync(
      Calendar.EntityTypes.EVENT
    );
    const defaultCalendars = calendars.filter(
      (each) => each.source.name === 'Default' || each.isPrimary
    );
    return defaultCalendars.length > 0 ? defaultCalendars[0].source : null;
  };

  const createCalendarEvent = async (lecture) => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      showCustomAlert(
        'Permission Required',
        'Permission to access calendar is required to add events!'
      );
      return null;
    }

    const defaultCalendar = await getDefaultCalendarSource();
    if (!defaultCalendar) {
      showCustomAlert(
        'Calendar Error',
        'No default calendar found on your device.'
      );
      return null;
    }

    // Parse time from HH:MM AM/PM format
    const [timePart, ampmPart] = lecture.time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    if (ampmPart === 'PM' && hours !== 12) {
      hours += 12;
    } else if (ampmPart === 'AM' && hours === 12) {
      hours = 0; 
    }

    const now = new Date();
    let eventStartTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0
    );

    const todayIndex = now.getDay();
    const lectureDayIndex = DAYS_OF_WEEK.indexOf(lecture.day) + 1;

    let daysToAdd = lectureDayIndex - todayIndex;
    if (daysToAdd < 0) {
      daysToAdd += 7;
    }
    if (daysToAdd === 0 && eventStartTime.getTime() < now.getTime()) {
      daysToAdd = 7;
    }

    eventStartTime.setDate(now.getDate() + daysToAdd);

    if (eventStartTime.getTime() < now.getTime()) {
      eventStartTime.setDate(eventStartTime.getDate() + 7);
    }

    const eventEndTime = new Date(eventStartTime.getTime() + 60 * 60 * 1000); // Assuming 1 hour lecture

    try {
      const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
        title: `${lecture.course} Lecture`,
        startDate: eventStartTime,
        endDate: eventEndTime,
        location: lecture.hall,
        notes: `Your lecture for ${lecture.course} in ${lecture.hall}.`,
        alarms: [{ relativeOffset: -10 }],
        recurrenceRule: {
          frequency: Calendar.Frequency.WEEKLY,
          interval: 1,
          daysOfWeek: [lectureDayIndex],
        },
      });
      console.log(
        `Calendar event created for ${lecture.course} with ID: ${eventId}`
      );
      return eventId;
    } catch (e) {
      console.error('Failed to create calendar event:', e);
      showCustomAlert(
        'Calendar Error',
        `Failed to create calendar event for ${lecture.course}.`
      );
      return null;
    }
  };

  const deleteCalendarEvent = async (eventId) => {
    if (eventId) {
      try {
        await Calendar.deleteEventAsync(eventId);
        console.log(`Calendar event with ID ${eventId} cancelled.`);
      } catch (e) {
        console.error('Failed to delete calendar event:', e);
      }
    }
  };

  // --- Lifecycle Effects ---
  useEffect(() => {
    loadLectures();
    registerForPushNotificationsAsync();
    Calendar.requestCalendarPermissionsAsync();

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('Notification received:', notification);
        fetchScheduledNotifications();
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('Notification response received:', response);
      });

    fetchScheduledNotifications();
    const interval = setInterval(fetchScheduledNotifications, 5000);

    return () => {
      
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      clearInterval(interval);
    };
  }, );

  useEffect(() => {
    const updateNotificationsAndCalendarEvents = async () => {
      const scheduledNotifications =
        await Notifications.getAllScheduledNotificationsAsync();
      for (const notif of scheduledNotifications) {
        if (
          notif.content.data &&
          notif.content.data.type === 'lecture_reminder'
        ) {
          await Notifications.cancelScheduledNotificationAsync(
            notif.identifier
          );
        }
      }

      const updatedLecturesWithIds = await Promise.all(
        lectures.map(async (lecture) => {
          if (lecture.calendarEventId) {
            await deleteCalendarEvent(lecture.calendarEventId);
          }

          const notificationId = await scheduleLectureNotification(lecture);
          const calendarEventId = await createCalendarEvent(lecture);
          return { ...lecture, notificationId, calendarEventId };
        })
      );
      
      if (JSON.stringify(updatedLecturesWithIds) !== JSON.stringify(lectures)) {
        saveLectures(updatedLecturesWithIds);
      }
      fetchScheduledNotifications();
    };

    updateNotificationsAndCalendarEvents();
  }, [lectures]);

  // --- UI Logic ---
  const showCustomAlert = (title, message, buttons = [{ text: 'OK' }]) => {
    Alert.alert(title, message, buttons);
  };

  const openAddModal = () => {
    setCurrentLecture(null);
    setDay('Monday');
    setSelectedHour('09');
    setSelectedMinute('00');
    setSelectedAmPm('AM');
    setCourse('');
    setHall('');
    setModalVisible(true);
  };

  const openEditModal = (lecture) => {
    setCurrentLecture(lecture);
    setDay(lecture.day);

    // Parse existing time string (e.g., "09:00 AM")
    const [timePart, ampmPart] = lecture.time.split(' ');
    const [hour, minute] = timePart.split(':');
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedAmPm(ampmPart);

    setCourse(lecture.course);
    setHall(lecture.hall);
    setModalVisible(true);
  };

  const handleSaveLecture = async () => {
    const time = `${selectedHour}:${selectedMinute} ${selectedAmPm}`; 
    if (!day || !time || !course || !hall) {
      showCustomAlert('Validation Error', 'All fields are required.');
      return;
    }

    const newLecture = {
      id: currentLecture ? currentLecture.id : Date.now().toString(),
      day,
      time, 
      course,
      hall,
      notificationId: currentLecture?.notificationId || null,
      calendarEventId: currentLecture?.calendarEventId || null,
    };

    const notificationId = await scheduleLectureNotification(newLecture);
    if (notificationId) {
      newLecture.notificationId = notificationId;
    }

    const calendarEventId = await createCalendarEvent(newLecture);
    if (calendarEventId) {
      newLecture.calendarEventId = calendarEventId;
    }

    let updatedLectures;
    if (currentLecture) {
      updatedLectures = lectures.map((lec) =>
        lec.id === newLecture.id ? newLecture : lec
      );
    } else {
      updatedLectures = [...lectures, newLecture];
    }

    saveLectures(updatedLectures);
    setModalVisible(false);
  };

  const handleDeleteLecture = async (id, notificationId, calendarEventId) => {
    showCustomAlert(
      'Confirm Delete',
      'Are you sure you want to delete this lecture?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            const updatedLectures = lectures.filter((lec) => lec.id !== id);
            await cancelLectureNotification(notificationId);
            await deleteCalendarEvent(calendarEventId);
            saveLectures(updatedLectures);
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderLectureItem = ({ item: lecture }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.cellContent]}>{lecture.time}</Text>
      <Text style={[styles.tableCell, styles.cellContent]}>
        {lecture.course}
      </Text>
      <Text style={[styles.tableCell, styles.cellContent]}>{lecture.hall}</Text>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          onPress={() => openEditModal(lecture)}
          style={styles.actionButton}>
          <Text style={styles.actionButtonText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            handleDeleteLecture(
              lecture.id,
              lecture.notificationId,
              lecture.calendarEventId
            )
          }
          style={styles.actionButton}>
          <Text style={styles.actionButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Lecture Scheduler</Text>

      <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
        <Text style={styles.addButtonText}>Add New Lecture</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scheduleContainer}>
        {DAYS_OF_WEEK.map((dayOfWeek) => (
          <View key={dayOfWeek} style={styles.daySection}>
            <Text style={styles.dayHeader}>{dayOfWeek}</Text>
            <View style={styles.tableHeaderRow}>
              <Text style={styles.tableHeaderCell}>Time</Text>
              <Text style={styles.tableHeaderCell}>Course</Text>
              <Text style={styles.tableHeaderCell}>Hall</Text>
              <Text style={styles.tableHeaderCell}>Actions</Text>
            </View>
            <FlatList
              data={lectures
                .filter((lec) => lec.day === dayOfWeek)
                .sort((a, b) => a.time.localeCompare(b.time))}
              renderItem={renderLectureItem}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={() => (
                <Text style={styles.noLecturesText}>
                  No lectures scheduled for this day.
                </Text>
              )}
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.notificationSection}>
        <Text style={styles.notificationHeader}>Upcoming Notifications</Text>
        <ScrollView style={styles.notificationList}>
          {upcomingNotifications.length > 0 ? (
            upcomingNotifications.map((notification) => (
              <View
                key={notification.identifier}
                style={styles.notificationItem}>
                <Text style={styles.notificationTitle}>
                  {notification.content.title}
                </Text>
                <Text style={styles.notificationBody}>
                  {notification.content.body}
                </Text>
                {notification.trigger.date && (
                  <Text style={styles.notificationTime}>
                    Scheduled for:{' '}
                    {new Date(notification.trigger.date).toLocaleString()}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noNotificationsText}>
              No upcoming lecture notifications.
            </Text>
          )}
        </ScrollView>
      </View>

      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>
              {currentLecture ? 'Edit Lecture' : 'Add New Lecture'}
            </Text>

            <Text style={styles.inputLabel}>Day:</Text>
            <View style={styles.dayPickerContainer}>
              {DAYS_OF_WEEK.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.dayOption,
                    day === d && styles.selectedDayOption,
                  ]}
                  onPress={() => setDay(d)}>
                  <Text
                    style={[
                      styles.dayOptionText,
                      day === d && styles.selectedDayOptionText,
                    ]}>
                    {d.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Time:</Text>
            <View style={styles.timePickerRow}>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedHour}
                  onValueChange={(itemValue) => setSelectedHour(itemValue)}
                  style={styles.timePicker}
                  itemStyle={styles.timePickerItem}>
                  {HOURS.map((hour) => (
                    <Picker.Item key={hour} label={hour} value={hour} />
                  ))}
                </Picker>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedMinute}
                  onValueChange={(itemValue) => setSelectedMinute(itemValue)}
                  style={styles.timePicker}
                  itemStyle={styles.timePickerItem}>
                  {MINUTES.map((minute) => (
                    <Picker.Item key={minute} label={minute} value={minute} />
                  ))}
                </Picker>
              </View>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedAmPm}
                  onValueChange={(itemValue) => setSelectedAmPm(itemValue)}
                  style={styles.timePicker}
                  itemStyle={styles.timePickerItem}>
                  {AMPM.map((ampm) => (
                    <Picker.Item key={ampm} label={ampm} value={ampm} />
                  ))}
                </Picker>
              </View>
            </View>

            <Text style={styles.inputLabel}>Course Name:</Text>
            <TextInput
              style={styles.input}
              value={course}
              onChangeText={setCourse}
              placeholder="e.g., CSC 401"
            />

            <Text style={styles.inputLabel}>Lecture Hall:</Text>
            <TextInput
              style={styles.input}
              value={hall}
              onChangeText={setHall}
              placeholder="e.g., Hall 4"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveLecture}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
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
    flex: 2,
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

  
  notificationSection: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  notificationHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2980b9',
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
    paddingBottom: 5,
  },
  notificationList: {
    flex: 1,
  },
  notificationItem: {
    backgroundColor: '#ecf0f1',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 5,
    borderLeftColor: '#3498db',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  notificationBody: {
    fontSize: 14,
    color: '#34495e',
    marginTop: 3,
  },
  notificationTime: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 5,
    fontStyle: 'italic',
  },
  noNotificationsText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontStyle: 'italic',
    paddingVertical: 10,
  },

  
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 15,
  },
  pickerWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 5,
    height: 50, 
  },
  timePicker: {
    height: 50, 
    width: '100%',
  },
  timePickerItem: {
    fontSize: 18,
    height: 50, 
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34495e',
    marginHorizontal: 5,
  },
});

// import React, { useState, useEffect, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Modal,
//   TextInput,
//   ScrollView,
//   Platform,
//   Alert,
//   FlatList,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as Notifications from 'expo-notifications';
// import * as Calendar from 'expo-calendar';
// import Constants from 'expo-constants';
//  import Picker from '@react-native-picker/picker';

// // Configure Expo Notifications handler
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//      shouldShowBanner: true,
//     shouldShowList: true,
//      shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

// export default function TimeTable() {
//   const [lectures, setLectures] = useState([]);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [currentLecture, setCurrentLecture] = useState(null);
//   const [day, setDay] = useState('Monday');
//   const [time, setTime] = useState('');
//   const [course, setCourse] = useState('');
//   const [hall, setHall] = useState('');
//   const [upcomingNotifications, setUpcomingNotifications] = useState([]);
//     const [selectedHour, setSelectedHour] = useState('09'); // New state for hour picker
//   const [selectedMinute, setSelectedMinute] = useState('00'); // New state for minute picker
//   const [selectedAmPm, setSelectedAmPm] = useState('AM'); // New state for AM/PM picker

//   const notificationListener = useRef();
//   const responseListener = useRef();

//   const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

//      const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')); // 01 to 12
//    const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')); // 00 to 59
//   const AMPM = ['AM', 'PM'];

//   // --- AsyncStorage Operations ---
//   const STORAGE_KEY = 'lectureSchedule';

//   const saveLectures = async (newLectures) => {
//     try {
//       await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newLectures));
//       setLectures(newLectures);
//     } catch (e) {
//       console.error('Failed to save lectures to AsyncStorage', e);

//       showCustomAlert('Error', 'Failed to save lecture data.');
//     }
//   };

//   const loadLectures = async () => {
//     try {
//       const storedLectures = await AsyncStorage.getItem(STORAGE_KEY);
//       if (storedLectures !== null) {
//         setLectures(JSON.parse(storedLectures));
//       }
//     } catch (e) {
//       console.error('Failed to load lectures from AsyncStorage', e);
//       showCustomAlert('Error', 'Failed to load lecture data.');
//     }
//   };

//   // --- Notification Functions ---
//   const registerForPushNotificationsAsync = async () => {
//     let token;
//     if (Constants.isDevice) {
//       const { status: existingStatus } = await Notifications.getPermissionsAsync();
//       let finalStatus = existingStatus;
//       if (existingStatus !== 'granted') {
//         const { status } = await Notifications.requestPermissionsAsync();
//         finalStatus = status;
//       }
//       if (finalStatus !== 'granted') {
//         showCustomAlert('Permission Required', 'Failed to get push token for push notification!');
//         return;
//       }
//       token = (await Notifications.getExpoPushTokenAsync()).data;
//     } else {
//       showCustomAlert('Not on Device', 'Must use physical device for Push Notifications');
//     }

//     if (Platform.OS === 'android') {
//       Notifications.setNotificationChannelAsync('default', {
//         name: 'default',
//         importance: Notifications.AndroidImportance.MAX,
//         vibrationPattern: [0, 250, 250, 250],
//         lightColor: '#FF231F7C',
//       });
//     }
//     return token;
//   };

//   const scheduleLectureNotification = async (lecture) => {
//     // Cancel any existing notification for this lecture first
//     if (lecture.notificationId) {
//       await Notifications.cancelScheduledNotificationAsync(lecture.notificationId);
//     }

//     const [hours, minutes] = lecture.time.split(':').map(Number);
//     const now = new Date();
//     let notificationTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

//     // Adjust date to the correct day of the week
//     const todayIndex = now.getDay();
//     const lectureDayIndex = DAYS_OF_WEEK.indexOf(lecture.day) + 1;

//     let daysToAdd = lectureDayIndex - todayIndex;
//     if (daysToAdd < 0) { // If lecture day is earlier in the week, schedule for next week
//       daysToAdd += 7;
//     }
//     // If it's the same day but the time has passed, schedule for next week
//     if (daysToAdd === 0 && notificationTime.getTime() < now.getTime()) {
//       daysToAdd = 7;
//     }

//     notificationTime.setDate(now.getDate() + daysToAdd);

//     // Schedule 10 minutes before
//     notificationTime.setMinutes(notificationTime.getMinutes() - 10);

//     // Ensure the notification time is in the future
//     if (notificationTime.getTime() < now.getTime()) {
//       // If it's still in the past (e.g., scheduled for next week but time already passed today),
//       // then schedule for the week after
//       notificationTime.setDate(notificationTime.getDate() + 7);
//     }

//     try {
//       const notificationId = await Notifications.scheduleNotificationAsync({
//         content: {
//           title: `Upcoming Lecture: ${lecture.course}`,
//           body: `Your lecture for ${lecture.course} in ${lecture.hall} is starting in 10 minutes!`,
//           data: { lectureId: lecture.id, type: 'lecture_reminder' },
//         },
//         trigger: {
//           date: notificationTime,
//           repeats: true, // Repeat weekly
//         },
//       });
//       console.log(`Notification scheduled for ${lecture.course} with ID: ${notificationId}`);
//       return notificationId;
//     } catch (e) {
//       console.error('Failed to schedule notification:', e);
//       showCustomAlert('Notification Error', `Failed to schedule notification for ${lecture.course}.`);
//       return null;
//     }
//   };

//   const cancelLectureNotification = async (notificationId) => {
//     if (notificationId) {
//       try {
//         await Notifications.cancelScheduledNotificationAsync(notificationId);
//         console.log(`Notification with ID ${notificationId} cancelled.`);
//       } catch (e) {
//         console.error('Failed to cancel notification:', e);
//       }
//     }
//   };

//   const fetchScheduledNotifications = async () => {
//     const scheduled = await Notifications.getAllScheduledNotificationsAsync();
//     // Filter for lecture reminders and sort by trigger time
//     const upcoming = scheduled
//       .filter(n => n.content.data && n.content.data.type === 'lecture_reminder')
//       .sort((a, b) => {
//         const triggerA = a.trigger.date ? new Date(a.trigger.date) : new Date(0);
//         const triggerB = b.trigger.date ? new Date(b.trigger.date) : new Date(0);
//         return triggerA.getTime() - triggerB.getTime();
//       });
//     setUpcomingNotifications(upcoming);
//   };

//   // --- Calendar Functions ---
//   const getDefaultCalendarSource = async () => {
//     const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
//     const defaultCalendars = calendars.filter(each => each.source.name === 'Default' || each.isPrimary);
//     return defaultCalendars.length > 0 ? defaultCalendars[0].source : null;
//   };

//   const createCalendarEvent = async (lecture) => {
//     const { status } = await Calendar.requestCalendarPermissionsAsync();
//     if (status !== 'granted') {
//       showCustomAlert('Permission Required', 'Permission to access calendar is required to add events!');
//       return null;
//     }

//     const defaultCalendar = await getDefaultCalendarSource();
//     if (!defaultCalendar) {
//       showCustomAlert('Calendar Error', 'No default calendar found on your device.');
//       return null;
//     }

//     const [hours, minutes] = lecture.time.split(':').map(Number);
//     const now = new Date();
//     let eventStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

//     const todayIndex = now.getDay(); // 0 for Sunday, 1 for Monday...
//     const lectureDayIndex = DAYS_OF_WEEK.indexOf(lecture.day) + 1; // 1 for Monday, 2 for Tuesday...

//     let daysToAdd = lectureDayIndex - todayIndex;
//     if (daysToAdd < 0) {
//       daysToAdd += 7;
//     }
//     if (daysToAdd === 0 && eventStartTime.getTime() < now.getTime()) {
//       daysToAdd = 7;
//     }

//     eventStartTime.setDate(now.getDate() + daysToAdd);

//     // Ensure the event time is in the future
//     if (eventStartTime.getTime() < now.getTime()) {
//       eventStartTime.setDate(eventStartTime.getDate() + 7);
//     }

//     const eventEndTime = new Date(eventStartTime.getTime() + 60 * 60 * 1000); // Assuming 1 hour lecture

//     try {
//       const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
//         title: `${lecture.course} Lecture`,
//         startDate: eventStartTime,
//         endDate: eventEndTime,
//         location: lecture.hall,
//         notes: `Your lecture for ${lecture.course} in ${lecture.hall}.`,
//         alarms: [{ relativeOffset: -10 }], // 10 minutes before
//         recurrenceRule: {
//           frequency: Calendar.Frequency.WEEKLY,
//           interval: 1,
//           daysOfWeek: [lectureDayIndex], // Use the correct day index for recurrence
//         },
//       });
//       console.log(`Calendar event created for ${lecture.course} with ID: ${eventId}`);
//       return eventId;
//     } catch (e) {
//       console.error('Failed to create calendar event:', e);
//       showCustomAlert('Calendar Error', `Failed to create calendar event for ${lecture.course}.`);
//       return null;
//     }
//   };

//   const deleteCalendarEvent = async (eventId) => {
//     if (eventId) {
//       try {
//         await Calendar.deleteEventAsync(eventId);
//         console.log(`Calendar event with ID ${eventId} deleted.`);
//       } catch (e) {
//         console.error('Failed to delete calendar event:', e);
//       }
//     }
//   };

//   useEffect(() => {
//     loadLectures();
//     registerForPushNotificationsAsync();
//     // Request calendar permissions on app start
//     Calendar.requestCalendarPermissionsAsync();

//     // Listener for foreground notifications
//     notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
//       console.log('Notification received:', notification);
//       fetchScheduledNotifications(); // Refresh upcoming notifications
//     });

//     // Listener for user interacting with notification
//     responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
//       console.log('Notification response received:', response);

//     });

//     // Fetch scheduled notifications initially and periodically
//     fetchScheduledNotifications();
//     const interval = setInterval(fetchScheduledNotifications, 5000); // Refresh every 5 seconds

//  return () => {
//       // Updated to use subscription.remove()
//       if (notificationListener.current) {
//         notificationListener.current.remove();
//       }
//       if (responseListener.current) {
//         responseListener.current.remove();
//       }
//       clearInterval(interval);
//     };
//   }, []);

//   useEffect(() => {
//     // When lectures change, re-schedule all notifications
//     const updateNotificationsAndCalendarEvents = async () => {
//       // First, cancel all existing lecture notifications
//       const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
//       for (const notif of scheduledNotifications) {
//         if (notif.content.data && notif.content.data.type === 'lecture_reminder') {
//           await Notifications.cancelScheduledNotificationAsync(notif.identifier);
//         }
//       }

//       // Re-schedule new ones for all current lectures and update calendar events
//       const updatedLecturesWithIds = await Promise.all(
//         lectures.map(async (lecture) => {
//           // If editing, delete old calendar event first
//           if (lecture.calendarEventId) {
//             await deleteCalendarEvent(lecture.calendarEventId);
//           }

//           const notificationId = await scheduleLectureNotification(lecture);
//           const calendarEventId = await createCalendarEvent(lecture);
//           return { ...lecture, notificationId, calendarEventId };
//         })
//       );
//       // Only update state if notificationId or calendarEventId actually changed for any lecture
//       if (JSON.stringify(updatedLecturesWithIds) !== JSON.stringify(lectures)) {
//         saveLectures(updatedLecturesWithIds); // Save with updated notification and calendar event IDs
//       }
//       fetchScheduledNotifications(); // Refresh the list of upcoming notifications
//     };

//     updateNotificationsAndCalendarEvents();
//   }, [lectures]); // Re-run when lectures state changes

//   // --- UI Logic ---
//   const showCustomAlert = (title, message, buttons = [{ text: 'OK' }]) => {
//     Alert.alert(title, message, buttons);
//   };

//   const openAddModal = () => {
//     setCurrentLecture(null);
//     setDay('Monday');
//     setTime('');
//     setCourse('');
//     setHall('');
//     setModalVisible(true);
//   };

//   const openEditModal = (lecture) => {
//     setCurrentLecture(lecture);
//     setDay(lecture.day);
//     setTime(lecture.time);
//     setCourse(lecture.course);
//     setHall(lecture.hall);
//     setModalVisible(true);
//   };

//      // Parse existing time string (e.g., "09:00 AM")
//     const [timePart, ampmPart] = lecture.time.split(' ');
//     const [hour, minute] = timePart.split(':');
//     setSelectedHour(hour);
//     setSelectedMinute(minute);
//     setSelectedAmPm(ampmPart);
//   const handleSaveLecture = async () => {
//     if (!day || !time || !course || !hall) {
//       showCustomAlert('Validation Error', 'All fields are required.');
//       return;
//     }

//     const newLecture = {
//       id: currentLecture ? currentLecture.id : Date.now().toString(),
//       day,
//       time,
//       course,
//       hall,
//       notificationId: currentLecture?.notificationId || null, // Preserve existing ID or set null
//       calendarEventId: currentLecture?.calendarEventId || null, // Preserve existing ID or set null
//     };

//     // Schedule notification and get its ID
//     const notificationId = await scheduleLectureNotification(newLecture);
//     if (notificationId) {
//       newLecture.notificationId = notificationId;
//     }

//     // Create/Update calendar event and get its ID
//     const calendarEventId = await createCalendarEvent(newLecture);
//     if (calendarEventId) {
//       newLecture.calendarEventId = calendarEventId;
//     }

//     let updatedLectures;
//     if (currentLecture) {
//       // Edit existing lecture
//       updatedLectures = lectures.map((lec) =>
//         lec.id === newLecture.id ? newLecture : lec
//       );
//     } else {
//       // Add new lecture
//       updatedLectures = [...lectures, newLecture];
//     }

//     saveLectures(updatedLectures);
//     setModalVisible(false);
//   };

//   const handleDeleteLecture = async (id, notificationId, calendarEventId) => {
//     showCustomAlert('Confirm Delete', 'Are you sure you want to delete this lecture?', [
//       {
//         text: 'Cancel',
//         style: 'cancel',
//       },
//       {
//         text: 'Delete',
//         onPress: async () => {
//           const updatedLectures = lectures.filter((lec) => lec.id !== id);
//           await cancelLectureNotification(notificationId); // Cancel associated notification
//           await deleteCalendarEvent(calendarEventId); // Delete associated calendar event
//           saveLectures(updatedLectures);
//         },
//         style: 'destructive',
//       },
//     ]);
//   };

//   const renderLectureItem = ({ item: lecture }) => (
//     <View style={styles.tableRow}>
//       <Text style={[styles.tableCell, styles.cellContent]}>{lecture.time}</Text>
//       <Text style={[styles.tableCell, styles.cellContent]}>{lecture.course}</Text>
//       <Text style={[styles.tableCell, styles.cellContent]}>{lecture.hall}</Text>
//       <View style={styles.actionButtons}>
//         <TouchableOpacity onPress={() => openEditModal(lecture)} style={styles.actionButton}>
//           <Text style={styles.actionButtonText}>✏️</Text>
//         </TouchableOpacity>
//         <TouchableOpacity onPress={() => handleDeleteLecture(lecture.id, lecture.notificationId, lecture.calendarEventId)} style={styles.actionButton}>
//           <Text style={styles.actionButtonText}>🗑️</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <Text style={styles.header}>Lecture Scheduler</Text>

//       <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
//         <Text style={styles.addButtonText}>Add New Lecture</Text>
//       </TouchableOpacity>

//       <ScrollView style={styles.scheduleContainer}>
//         {DAYS_OF_WEEK.map((dayOfWeek) => (
//           <View key={dayOfWeek} style={styles.daySection}>
//             <Text style={styles.dayHeader}>{dayOfWeek}</Text>
//             <View style={styles.tableHeaderRow}>
//               <Text style={styles.tableHeaderCell}>Time</Text>
//               <Text style={styles.tableHeaderCell}>Course</Text>
//               <Text style={styles.tableHeaderCell}>Hall</Text>
//               <Text style={styles.tableHeaderCell}>Actions</Text>
//             </View>
//             <FlatList
//               data={lectures.filter((lec) => lec.day === dayOfWeek).sort((a, b) => a.time.localeCompare(b.time))}
//               renderItem={renderLectureItem}
//               keyExtractor={(item) => item.id}
//               ListEmptyComponent={() => (
//                 <Text style={styles.noLecturesText}>No lectures scheduled for this day.</Text>
//               )}
//             />
//           </View>
//         ))}
//       </ScrollView>

//       <View style={styles.notificationSection}>
//         <Text style={styles.notificationHeader}>Upcoming Notifications</Text>
//         <ScrollView style={styles.notificationList}>
//           {upcomingNotifications.length > 0 ? (
//             upcomingNotifications.map((notification) => (
//               <View key={notification.identifier} style={styles.notificationItem}>
//                 <Text style={styles.notificationTitle}>{notification.content.title}</Text>
//                 <Text style={styles.notificationBody}>{notification.content.body}</Text>
//                 {notification.trigger.date && (
//                   <Text style={styles.notificationTime}>
//                     Scheduled for: {new Date(notification.trigger.date).toLocaleString()}
//                   </Text>
//                 )}
//               </View>
//             ))
//           ) : (
//             <Text style={styles.noNotificationsText}>No upcoming lecture notifications.</Text>
//           )}
//         </ScrollView>
//       </View>

//       {/* Add/Edit Lecture Modal */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={modalVisible}
//         onRequestClose={() => setModalVisible(false)}
//       >
//         <View style={styles.centeredView}>
//           <View style={styles.modalView}>
//             <Text style={styles.modalTitle}>
//               {currentLecture ? 'Edit Lecture' : 'Add New Lecture'}
//             </Text>

//             <Text style={styles.inputLabel}>Day:</Text>
//             <View style={styles.dayPickerContainer}>
//               {DAYS_OF_WEEK.map((d) => (
//                 <TouchableOpacity
//                   key={d}
//                   style={[styles.dayOption, day === d && styles.selectedDayOption]}
//                   onPress={() => setDay(d)}
//                 >
//                   <Text style={[styles.dayOptionText, day === d && styles.selectedDayOptionText]}>
//                     {d.substring(0, 3)}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>

//             <Text style={styles.inputLabel}>Time (HH:MM):</Text>
//                        <View style={styles.timePickerRow}>
//               <View style={styles.pickerWrapper}>
//                 <Picker
//                   selectedValue={selectedHour}
//                   onValueChange={(itemValue) => setSelectedHour(itemValue)}
//                   style={styles.timePicker}
//                   itemStyle={styles.timePickerItem}
//                 >
//                   {HOURS.map((hour) => (
//                     <Picker.Item key={hour} label={hour} value={hour} />
//                   ))}
//                 </Picker>
//               </View>
//               <Text style={styles.timeSeparator}>:</Text>
//               <View style={styles.pickerWrapper}>
//                 <Picker
//                   selectedValue={selectedMinute}
//                   onValueChange={(itemValue) => setSelectedMinute(itemValue)}
//                   style={styles.timePicker}
//                   itemStyle={styles.timePickerItem}
//                 >
//                   {MINUTES.map((minute) => (
//                     <Picker.Item key={minute} label={minute} value={minute} />
//                   ))}
//                 </Picker>
//               </View>
//               <View style={styles.pickerWrapper}>
//                 <Picker
//                   selectedValue={selectedAmPm}
//                   onValueChange={(itemValue) => setSelectedAmPm(itemValue)}
//                   style={styles.timePicker}
//                   itemStyle={styles.timePickerItem}
//                 >
//                   {AMPM.map((ampm) => (
//                     <Picker.Item key={ampm} label={ampm} value={ampm} />
//                   ))}
//                 </Picker>
//               </View>
//             </View>

//             <Text style={styles.inputLabel}>Course Code:</Text>
//             <TextInput
//               style={styles.input}
//               value={course}
//               onChangeText={setCourse}
//               placeholder="e.g., CSC 401"
//             />

//             <Text style={styles.inputLabel}>Lecture Hall:</Text>
//             <TextInput
//               style={styles.input}
//               value={hall}
//               onChangeText={setHall}
//               placeholder="e.g., Hall 4"
//             />

//             <View style={styles.modalButtons}>
//               <TouchableOpacity style={styles.saveButton} onPress={handleSaveLecture}>
//                 <Text style={styles.buttonText}>Save</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={styles.cancelButton}
//                 onPress={() => setModalVisible(false)}
//               >
//                 <Text style={styles.buttonText}>Cancel</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// // --- Styles ---
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingTop: Constants.statusBarHeight + 20,
//     backgroundColor: '#f0f4f8',
//     paddingHorizontal: 15,
//   },
//   header: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   addButton: {
//     backgroundColor: '#3498db',
//     paddingVertical: 12,
//     paddingHorizontal: 25,
//     borderRadius: 10,
//     alignSelf: 'center',
//     marginBottom: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   addButtonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '600',
//   },
//   scheduleContainer: {
//     flex: 2,
//     marginBottom: 20,
//     borderRadius: 10,
//     backgroundColor: '#fff',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 3,
//   },
//   daySection: {
//     marginBottom: 15,
//     padding: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#ecf0f1',
//   },
//   dayHeader: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#2980b9',
//     marginBottom: 10,
//     borderBottomWidth: 2,
//     borderBottomColor: '#3498db',
//     paddingBottom: 5,
//   },
//   tableHeaderRow: {
//     flexDirection: 'row',
//     backgroundColor: '#eaf2f8',
//     paddingVertical: 8,
//     borderTopLeftRadius: 5,
//     borderTopRightRadius: 5,
//   },
//   tableHeaderCell: {
//     flex: 1,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     color: '#34495e',
//     fontSize: 14,
//   },
//   tableRow: {
//     flexDirection: 'row',
//     backgroundColor: '#ffffff',
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#ecf0f1',
//     alignItems: 'center',
//   },
//   tableCell: {
//     flex: 1,
//     textAlign: 'center',
//     fontSize: 14,
//     color: '#34495e',
//   },
//   cellContent: {
//     paddingHorizontal: 5,
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     flex: 1,
//     justifyContent: 'space-around',
//   },
//   actionButton: {
//     padding: 5,
//     borderRadius: 5,
//     backgroundColor: '#f8f8f8',
//     borderWidth: 1,
//     borderColor: '#ddd',
//   },
//   actionButtonText: {
//     fontSize: 16,
//   },
//   noLecturesText: {
//     textAlign: 'center',
//     color: '#7f8c8d',
//     fontStyle: 'italic',
//     paddingVertical: 10,
//   },

//   // Notification Section Styles
//   notificationSection: {
//     flex: 1,
//     backgroundColor: '#fff',
//     borderRadius: 10,
//     padding: 15,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 3,
//   },
//   notificationHeader: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#2980b9',
//     marginBottom: 10,
//     borderBottomWidth: 2,
//     borderBottomColor: '#3498db',
//     paddingBottom: 5,
//   },
//   notificationList: {
//     flex: 1,
//   },
//   notificationItem: {
//     backgroundColor: '#ecf0f1',
//     padding: 10,
//     borderRadius: 8,
//     marginBottom: 8,
//     borderLeftWidth: 5,
//     borderLeftColor: '#3498db',
//   },
//   notificationTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//   },
//   notificationBody: {
//     fontSize: 14,
//     color: '#34495e',
//     marginTop: 3,
//   },
//   notificationTime: {
//     fontSize: 12,
//     color: '#7f8c8d',
//     marginTop: 5,
//     fontStyle: 'italic',
//   },
//   noNotificationsText: {
//     textAlign: 'center',
//     color: '#7f8c8d',
//     fontStyle: 'italic',
//     paddingVertical: 10,
//   },

//   // Modal Styles
//   centeredView: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.5)',
//   },
//   modalView: {
//     margin: 20,
//     backgroundColor: 'white',
//     borderRadius: 20,
//     padding: 35,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//     elevation: 5,
//     width: '90%',
//     maxWidth: 400,
//   },
//   modalTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//     color: '#2c3e50',
//   },
//   inputLabel: {
//     alignSelf: 'flex-start',
//     fontSize: 16,
//     color: '#34495e',
//     marginBottom: 5,
//     marginTop: 10,
//   },
//   input: {
//     width: '100%',
//     padding: 12,
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 8,
//     marginBottom: 15,
//     fontSize: 16,
//     color: '#34495e',
//   },
//   dayPickerContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'center',
//     marginBottom: 15,
//   },
//   dayOption: {
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: '#3498db',
//     margin: 4,
//   },
//   selectedDayOption: {
//     backgroundColor: '#3498db',
//   },
//   dayOptionText: {
//     color: '#3498db',
//     fontWeight: 'bold',
//   },
//   selectedDayOptionText: {
//     color: '#fff',
//   },
//   modalButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//     marginTop: 20,
//   },
//   saveButton: {
//     backgroundColor: '#2ecc71',
//     paddingVertical: 12,
//     paddingHorizontal: 25,
//     borderRadius: 10,
//     flex: 1,
//     marginRight: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
//   // New styles for time pickers
//   timePickerRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     width: '100%',
//     marginBottom: 15,
//   },
//   pickerWrapper: {
//     flex: 1,
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 8,
//     overflow: 'hidden',
//     marginHorizontal: 5,
//     height: 150, // Adjust height to make picker visible
//   },
//   timePicker: {
//     height: 150, // Ensure picker itself takes full height of wrapper
//     width: '100%',
//   },
//   timePickerItem: {
//     fontSize: 18,
//     height: 150, // Match item height to picker height
//   },
//   timeSeparator: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#34495e',
//     marginHorizontal: 5,
//   },
// });
