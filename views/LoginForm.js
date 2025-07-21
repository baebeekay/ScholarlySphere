import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Button,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';

function LoginForm() {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const db = useSQLiteContext();

  const handleLogin = async () => {
    setError(''); // Clear previous errors
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
        navigation.navigate('Home', {username: username });
      } else {
        setError('Account does not exist .');
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
      <TextInput
        style={loginStyles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

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

// --- Styles for LoginScreen ---
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButton: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
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

// function LoginForm() {
//   const navigation = useNavigation();
//    const [error, setError] = useState('');
//  const [form, setForm] = useState({
//         username: '',
//         password: '',

//     });
//     const db= useSQLiteContext();

//     const handleSubmit = async () => {
//         try{
//             //validate form data
//             if (!form.username || !form.password) {
//                 setError('All fields are required.');
//             }

//               const results = await db.getAllAsync(` SELECT * FROM users
//                 ORDER BY id DESC`);
//             setUsers(results);

//             Alert.alert('Success', 'User added successfully!');
//             setForm({
//                 firstName: '',
//                 lastName: '',
//                 email: '',
//                 phone: ''
//             });
//         } catch (error) {
//             console.error(error);
//             Alert.alert('Error', error.message || 'An error occurred while adding the user.');
//         }
// };

//     return (
//       <View style={loginStyles.container}>
//         <Text style={loginStyles.logo}>ScholarlySphere</Text>
//         {this.state.err ? <Text style={loginStyles.errorText}>{this.state.err}</Text> : null}

//         <TextInput
//           style={loginStyles.input}
//           placeholder="Username"
//           placeholderTextColor="#888"
//           value={this.state.username}
//           onChangeText={this.handleUsernameUpdate}
//           autoCapitalize="none"
//         />
//         <TextInput
//           style={loginStyles.input}
//           placeholder="Password"
//           placeholderTextColor="#888"
//           value={this.state.password}
//           onChangeText={this.handlePasswordUpdate}
//           secureTextEntry
//         />

//         <TouchableOpacity
//           style={loginStyles.loginButton}
//           onPress={this._login}
//         >
//           <Text style={loginStyles.buttonText}>Login</Text>
//         </TouchableOpacity>
//  <TouchableOpacity
//           style={loginStyles.signupLink}
//           onPress={() => navigation.navigate('SignUp')}
//         >
//           <Text style={loginStyles.signupLinkText}>Don't have an account? Sign Up</Text>
//         </TouchableOpacity>

//       </View>
//     );

// }

// const loginStyles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#e0f2f7',
//     paddingHorizontal: 20,
//   },
//   logo: {
//     fontSize: 40,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginBottom: 40,
//     textShadowColor: 'rgba(0, 0, 0, 0.1)',
//     textShadowOffset: { width: 2, height: 2 },
//     textShadowRadius: 5,
//   },
//   errorText: {
//     color: '#e74c3c',
//     marginBottom: 15,
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   input: {
//     width: '100%',
//     maxWidth: 300,
//     padding: 15,
//     borderWidth: 1,
//     borderColor: '#b0e0e6',
//     borderRadius: 12,
//     backgroundColor: '#fff',
//     marginBottom: 20,
//     fontSize: 16,
//     color: '#34495e',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   loginButton: {
//     width: '100%',
//     maxWidth: 300,
//     backgroundColor: '#3498db',
//     paddingVertical: 15,
//     borderRadius: 12,
//     alignItems: 'center',
//     marginTop: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.2,
//     shadowRadius: 5,
//     elevation: 6,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },

//   signupLink: {
//     marginTop: 20,
//   },
//   signupLinkText: {
//     color: '#3498db',
//     fontSize: 16,
//     textDecorationLine: 'underline',
//   },
// });

export default LoginForm;
