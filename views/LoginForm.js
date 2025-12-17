import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function LoginForm() {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const db = useSQLiteContext();

  const handleLogin = async () => {
    setError('');
    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }

    try {
      const user = await db.getFirstAsync(
        'SELECT * FROM users WHERE username = ? AND password = ?',
        [username, password]
      );

      if (user) {
        navigation.navigate('Home', {
          screen: 'Home',
          params: { username: username },
        });
      } else {
        setError('Account does not exist.');
      }
    } catch (err) {
      console.error('Error during login:', err);
      setError(err.message || 'An error occurred during login.');
    }
  };

  return (
    <View style={loginStyles.container}>
      <Text style={loginStyles.logo}>ScholarlySphere</Text>
      {error ? <Text style={loginStyles.errorText}>{error}</Text> : null}

      <TextInput
        style={loginStyles.input}
        placeholder="Username"
        placeholderTextColor="#888"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <View style={loginStyles.passwordInputContainer}>
        <TextInput
          style={loginStyles.passwordInput}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          style={loginStyles.togglePasswordButton}
          onPress={() => setShowPassword(!showPassword)}>
          <MaterialCommunityIcons
            name={showPassword ? 'eye-off' : 'eye'}
            size={24}
            color="#555"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={loginStyles.loginButton} onPress={handleLogin}>
        <Text style={loginStyles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={loginStyles.signupLink}
        onPress={() => navigation.navigate('SignUp')}>
        <Text style={loginStyles.signupLinkText}>
          Don't have an account? Sign Up
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0f2f7',
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
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
  loginButton: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#3498db',
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
  signupLink: {
    marginTop: 20,
  },
  signupLinkText: {
    color: '#3498db',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default LoginForm;
