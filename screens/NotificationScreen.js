import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import * as Notifications from 'expo-notifications';
import { useFocusEffect, useRoute } from '@react-navigation/native';

import Constants from 'expo-constants';

export default function NotificationsScreen() {
  // const route = useRoute();
  // const { username } = route.params  // Get username from route params

  const [upcomingNotifications, setUpcomingNotifications] = useState([]);
  const notificationListener = useRef();
  const responseListener = useRef();

  const fetchScheduledNotifications = useCallback(async () => {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const upcoming = scheduled
      .filter(n => n.content.data && n.content.data.type === 'lecture_reminder' && n.content.data.username === username) // Filter by username
      .sort((a, b) => {
        const triggerA = a.trigger.date ? new Date(a.trigger.date) : new Date(0);
        const triggerB = b.trigger.date ? new Date(b.trigger.date) : new Date(0);
        return triggerA.getTime() - triggerB.getTime();
      });
    setUpcomingNotifications(upcoming);
  }, []); // Re-fetch when username changes

  useFocusEffect(
    useCallback(() => {
      fetchScheduledNotifications();
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received in UpcomingNotificationsScreen:', notification);
        fetchScheduledNotifications();
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response received in UpcomingNotificationsScreen:', response);
      });

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
    }, [fetchScheduledNotifications])
  );

  return (
    <View style={upcomingNotificationsStyles.container}>
      <Text style={upcomingNotificationsStyles.header}>Upcoming Notifications</Text>
      <ScrollView style={upcomingNotificationsStyles.notificationList}>
        {upcomingNotifications.length > 0 ? (
          upcomingNotifications.map((notification) => (
            <View key={notification.identifier} style={upcomingNotificationsStyles.notificationItem}>
              <Text style={upcomingNotificationsStyles.notificationTitle}>{notification.content.title}</Text>
              <Text style={upcomingNotificationsStyles.notificationBody}>{notification.content.body}</Text>
              {notification.trigger.date && (
                <Text style={upcomingNotificationsStyles.notificationTime}>
                  Scheduled for: {new Date(notification.trigger.date).toLocaleString()}
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text style={upcomingNotificationsStyles.noNotificationsText}>No upcoming lecture notifications.</Text>
        )}
      </ScrollView>
    </View>
  );
}

// --- Styles for UpcomingNotificationsScreen ---
const upcomingNotificationsStyles = StyleSheet.create({
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
  notificationList: {
    flex: 1,
  },
  notificationItem: {
    backgroundColor: '#ecf0f1',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#3498db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  notificationBody: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 5,
  },
  notificationTime: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  noNotificationsText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontStyle: 'italic',
    paddingVertical: 20,
    fontSize: 16,
  },
});