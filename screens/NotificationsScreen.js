import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';

export default function NotificationsScreen() {
  const [upcomingNotifications, setUpcomingNotifications] = useState([]);
  const notificationListener = useRef();
  const responseListener = useRef();

  const fetchScheduledNotifications = useCallback(async () => {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      
      // Filter and sort lecture notifications
      const lectureNotifications = scheduled
        .filter(n => n.content.data && n.content.data.type === 'lecture_reminder')
        .sort((a, b) => {
          const triggerA = a.trigger.date ? new Date(a.trigger.date) : new Date(0);
          const triggerB = b.trigger.date ? new Date(b.trigger.date) : new Date(0);
          return triggerA.getTime() - triggerB.getTime();
        });
      
      setUpcomingNotifications(lectureNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchScheduledNotifications();
      
      // Listen for new notifications
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
        fetchScheduledNotifications();
      });

      // Listen for notification responses
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
      });

      return () => {
        // Clean up listeners
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
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
              <Text style={upcomingNotificationsStyles.notificationTitle}>
                {notification.content.title}
              </Text>
              <Text style={upcomingNotificationsStyles.notificationBody}>
                {notification.content.body}
              </Text>
              {notification.trigger.date && (
                <Text style={upcomingNotificationsStyles.notificationTime}>
                  Scheduled for: {new Date(notification.trigger.date).toLocaleString()}
                </Text>
              )}
            </View>
          ))
        ) : (
          <View style={upcomingNotificationsStyles.noNotificationsContainer}>
            <Text style={upcomingNotificationsStyles.noNotificationsText}>
              No upcoming lecture notifications
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

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
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: '#3498db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  noNotificationsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  noNotificationsText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 18,
    fontStyle: 'italic',
  },
});
