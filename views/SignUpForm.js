import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { useSQLiteContext } from 'expo-sqlite';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function SignUpForm() {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const db = useSQLiteContext();

  const handleSignUp = async () => {
    setError(''); 
    if (!username || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      // Check if username already exists
      const existingUser = await db.getFirstAsync(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      if (existingUser) {
        setError('Username already exists. Please choose a different one.');
        return;
      }

      // Insert new user into the database
      await db.runAsync(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [username, password]
      );

      Alert.alert('Success', 'Account created successfully! Please log in.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      console.error('Error during sign up:', err);
      setError(err.message || 'An error occurred during sign up.');
    }
  };

  return (
    <View style={signUpStyles.container}>
      <Text style={signUpStyles.header}>Create Account</Text>
      {error ? <Text style={signUpStyles.errorText}>{error}</Text> : null}

      {/* Username Field */}
      <TextInput
        style={signUpStyles.input}
        placeholder="Username"
        placeholderTextColor="#888"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      {/* Password Field */}
      <View style={signUpStyles.passwordInputContainer}>
        <TextInput
          style={signUpStyles.passwordInput}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          style={signUpStyles.togglePasswordButton}
          onPress={() => setShowPassword(!showPassword)}>
          <MaterialCommunityIcons 
            name={showPassword ? "eye-off" : "eye"} 
            size={22} 
            color="#555" 
          />
        </TouchableOpacity>
      </View>

      {/* Confirm Password Field */}
      <View style={signUpStyles.passwordInputContainer}>
        <TextInput
          style={signUpStyles.passwordInput}
          placeholder="Confirm Password"
          placeholderTextColor="#888"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
        />
        <TouchableOpacity
          style={signUpStyles.togglePasswordButton}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <MaterialCommunityIcons 
            name={showConfirmPassword ? "eye-off" : "eye"} 
            size={22} 
            color="#555" 
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={signUpStyles.signupButton}
        onPress={handleSignUp}>
        <Text style={signUpStyles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={signUpStyles.loginLink}
        onPress={() => navigation.navigate('Login')}>
        <Text style={signUpStyles.loginLinkText}>
          Already have an account? Log In
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// --- Styles ---
const signUpStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0f2f7',
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 30,
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 15,
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    maxWidth: 300,
    padding: 15,
    borderWidth: 1,
    borderColor: '#b0e0e6',
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 20,
    fontSize: 16,
    color: '#34495e',
    elevation: 3,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: '#b0e0e6',
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 20,
    elevation: 3,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#34495e',
  },
  togglePasswordButton: {
    paddingRight: 15, 
  },
  signupButton: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#28a745',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    elevation: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 20,
  },
  loginLinkText: {
    color: '#3498db',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default SignUpForm;
