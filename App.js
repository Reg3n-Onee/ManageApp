import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const App = () => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(null); // State to hold notification
  const [requestId, setRequestId] = useState(''); // State to hold request ID
  const [isRequestHandled, setIsRequestHandled] = useState(false); // State to track if request has been handled

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    // Listener to handle notifications received while the app is in the foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      setRequestId(notification.request.content.data.requestId); // Extract requestId from notification data
      setIsRequestHandled(false); // Reset request handled state when a new notification is received
    });

    // Listener to handle notifications opened while the app is in the background or closed
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      setNotification(response.notification);
      setRequestId(data.requestId); // Extract requestId from the notification data
      setIsRequestHandled(false); // Reset request handled state when a new notification is received
    });

    return () => {
      foregroundSubscription.remove(); // Clean up foreground subscription on unmount
      responseSubscription.remove(); // Clean up response subscription on unmount
    };
  }, []);

  async function registerForPushNotificationsAsync() {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        alert('Push notification permissions required!');
        return;
      }

      // Get the push notification token with the projectId
      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: '29fc60a0-62da-41ff-ba63-4c1a24f64e20', // Replace with your actual projectId
      })).data;

      console.log(token); // Log the token for testing
      return token;
    } else {
      alert('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }

  const sendApprovalStatus = async (status) => {
    const endpoint = status === 'approve' ? '/approve' : '/decline'; // Determine the correct endpoint
    const response = await fetch(`https://d733-2001-8f8-1735-caa-6465-18f2-cd74-818a.ngrok-free.app${endpoint}`, { // Use your ngrok URL here
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestId: requestId,
      }),
    });

    if (response.ok) {
      const data = await response.json(); // Optional: Handle response data if needed
      Alert.alert(`Successfully sent ${status} for request ID: ${data.requestId}`);
      setIsRequestHandled(true); // Update state to indicate that the request has been handled
      setRequestId(''); // Clear requestId after handling
    } else {
      Alert.alert('Failed to send approval status. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {isRequestHandled ? (
        <Text style={styles.title}>No Request Approval</Text>
      ) : requestId ? ( // Only show request ID and buttons if it exists
        <View style={styles.notificationContainer}>
          <Text style={styles.requestIdText}>Request ID: {requestId}</Text>
          <TouchableOpacity style={styles.button} onPress={() => sendApprovalStatus('approve')}>
            <Text style={styles.buttonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => sendApprovalStatus('decline')}>
            <Text style={styles.buttonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.title}>No Request Approval</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Takes up the full height of the screen
    justifyContent: 'center', // Centers the content vertically
    alignItems: 'center', // Centers the content horizontally
    backgroundColor: '#f8f8f8', // Background color of the app
  },
  title: {
    fontSize: 24, // Title font size
    fontWeight: 'bold', // Title font weight
    marginBottom: 20, // Space between title and request ID
  },
  notificationContainer: {
    alignItems: 'center', // Center the buttons and text
  },
  requestIdText: {
    fontSize: 18, // Request ID font size
    marginBottom: 20, // Space between request ID and buttons
  },
  button: {
    backgroundColor: '#007BFF', // Button background color
    padding: 15, // Padding inside the button
    borderRadius: 5, // Rounded corners
    borderWidth: 1, // Border width
    borderColor: '#0056b3', // Border color
    marginVertical: 10, // Space between buttons
    width: '80%', // Button width
    alignItems: 'center', // Center the text inside the button
  },
  buttonText: {
    color: '#FFFFFF', // Text color
    fontSize: 18, // Text font size
    fontWeight: 'bold', // Text font weight
  },
});

export default App;
