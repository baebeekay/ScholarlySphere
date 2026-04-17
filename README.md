# ScholarlySphere
A cross-platform React Native application built with Expo designed to help Lecturers manage their weekly academic schedule and also manage students academic records. The app features a smart notification system that ensures you never miss a lecture by providing recurring weekly reminders.

## Features
Weekly Timetable: Organizes lectures by day (Monday to Friday) for easy viewing.

Smart Scheduling: When adding or editing a lecture, the app automatically detects if the time for the current week has already passed and schedules the notification for the following week.

Custom Reminders: Choose how early you want to be notified (5 minutes, 15 minutes, 1 hour before, etc.).

Persistent Storage: Uses AsyncStorage to keep your schedule saved locally on your device.

Recurring Notifications: Set it once and get notified every week at the same time.

Full CRUD Operations: Add, edit, and delete lectures with a clean, modal-based interface.

Logout/Reset: Securely clear all scheduled notifications and local data.

### Tech Stack
Framework: React Native (Expo)

Notifications: expo-notifications

Storage: @react-native-async-storage/async-storage

Pickers: @react-native-picker/picker & @react-native-community/datetimepicker

Icons/Styling: Native StyleSheet with emoji support.

## Installation
Clone the repository:

Bash
git clone https://github.com/baebeekay/ScholarlySphere.git
cd lecture-scheduler
Install dependencies:

Bash
npm install
# OR
yarn install
Start the Expo server:

Bash
npx expo start
Run on your device:

Download the Expo Go app on iOS or Android.

Scan the QR code displayed in your terminal.


### Notification Configuration
The app is configured to handle foreground and background notifications.

Note for Testing: * Physical Device: You must use a physical device to test notifications reliably.

Permissions: Upon first launch, the app will request permission to send alerts.

Calculation Logic: Notifications are calculated based on the initialTriggerDate and reminderOffset. If you set a lecture for Monday at 10:00 AM with a 10-minute reminder, the notification trigger is set for 9:50 AM.

## Usage
Adding a Lecture
Click the Add Lecture button.

Select the Day (Mon-Fri).

Set the Time using the native time picker.

Enter the Course Name and select a Lecture Hall.

Choose your Reminder offset.

Hit Save.

Editing/Deleting
Tap the ✏️ icon on any lecture card to modify its details.

Tap the 🗑️ icon to remove a lecture and automatically cancel its scheduled notification.

Logging Out
Tap the Logout button in the header.

This will trigger a confirmation alert.

Upon confirmation, the app will:

Cancel all pending notifications on the OS level.

Wipe the lectures_global key from local storage.

Reset the application state.




### Troubleshooting

Notifications not appearing? Ensure "Do Not Disturb" is off and that you are testing on a physical device.

Time Picker issues on Android? The app uses the native Android clock; ensure your system time is set correctly.

Storage Reset: If the app behaves unexpectedly after an update, use the Logout button to clear the cache and start fresh.

