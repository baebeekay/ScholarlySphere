import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert
} from 'react-native';

import { useSQLiteContext } from 'expo-sqlite';
import { useNavigation } from '@react-navigation/native';

function SignUpForm() {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const db = useSQLiteContext();

  // useEffect(() => {
  //   // Create the users table when the component mounts
  //   const setupDatabase = async () => {
  //     try {
  //       await db.runAsync(`
  //         CREATE TABLE IF NOT EXISTS users (
  //           id INTEGER PRIMARY KEY AUTOINCREMENT,
  //           username TEXT UNIQUE NOT NULL,
  //           password TEXT NOT NULL
  //         );
  //       `);
  //       console.log('Users table checked/created successfully.');
  //     } catch (err) {
  //       console.error('Error setting up users table:', err);
  //       Alert.alert('Database Error', 'Could not set up user database.');
  //     }
  //   };
  //   setupDatabase();
  // }, []); // Run only once on component mount

  const handleSignUp = async () => {
    setError(''); // Clear previous errors
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
      const existingUser = await db.getFirstAsync('SELECT * FROM users WHERE username = ?', [username]);
      if (existingUser) {
        setError('Username already exists. Please choose a different one.');
        return;
      }

      // Insert new user into the database
      await db.runAsync(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [username, password] // In a real app, you'd hash the password!
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

      <TextInput
        style={signUpStyles.input}
        placeholder="Username"
        placeholderTextColor="#888"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={signUpStyles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={signUpStyles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#888"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

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

// --- Styles for SignUpScreen ---
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signupButton: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#28a745', // Green for sign up
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
  loginLink: {
    marginTop: 20,
  },
  loginLinkText: {
    color: '#3498db',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});








// function SignUpForm() {
//   const navigation = useNavigation();
//   const [error, setError] = useState('');
//     const [form, setForm] = useState({
//         username: '',
//         password: '',
//         confirmPassword: ''
      
//     });

//     const db= useSQLiteContext();

//     const handleSignUp = async () => {
//         try{

//               setError('');
//               if (!username || !password || !confirmPassword) {
//                 setError('All fields are required.');
//                 return;
//               }
    
//             await db.runAsync(
//                 'INSERT INTO users (username, password) VALUES (?, ?)',
//                 [form.username, form.password]
//                   );
//           if (password !== confirmPassword) {
//             setError('Passwords do not match.');
//             return;
//           }
   
//     Alert.alert('Success', 'Account created successfully! Please log in.', [
//       { text: 'OK', onPress: () => navigation.navigate('Login') },
//     ]);
  

           


//             // Alert.alert('Success', 'User added successfully!');
//             // setForm({
//             //     firstName: '',
//             //     lastName: '',
//             //     email: '',
//             //     phone: ''
//             // });
//         } catch (error) {
//             console.error(error);
//             Alert.alert('Error', error.message || 'An error occurred while adding the user.');
//         }
// };



 
//   return (
//     <View style={signUpStyles.container}>
//       <Text style={signUpStyles.header}>Create Account</Text>
//       {error ? <Text style={signUpStyles.errorText}>{error}</Text> : null}

//       <TextInput
//         style={signUpStyles.input}
//         placeholder="Username"
//         placeholderTextColor="#888"
//         value={username}
//         onChangeText={setUsername}
//         autoCapitalize="none"
//       />
//       <TextInput
//         style={signUpStyles.input}
//         placeholder="Password"
//         placeholderTextColor="#888"
//         value={password}
//         onChangeText={setPassword}
//         secureTextEntry
//       />
//       <TextInput
//         style={signUpStyles.input}
//         placeholder="Confirm Password"
//         placeholderTextColor="#888"
//         value={confirmPassword}
//         onChangeText={setConfirmPassword}
//         secureTextEntry
//       />

//       <TouchableOpacity
//         style={signUpStyles.signupButton}
//         onPress={handleSignUp}>
//         <Text style={signUpStyles.buttonText}>Sign Up</Text>
//       </TouchableOpacity>

//       <TouchableOpacity
//         style={signUpStyles.loginLink}
//         onPress={() => navigation.navigate('Login')}>
//         <Text style={signUpStyles.loginLinkText}>
//           Already have an account? Log In
//         </Text>
//       </TouchableOpacity>
//     </View>
//   );
// }


// const signUpStyles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#e0f2f7',
//     paddingHorizontal: 20,
//   },
//   header: {
//     fontSize: 32,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginBottom: 30,
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
//   signupButton: {
//     width: '100%',
//     maxWidth: 300,
//     backgroundColor: '#28a745', 
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
//   loginLink: {
//     marginTop: 20,
//   },
//   loginLinkText: {
//     color: '#3498db',
//     fontSize: 16,
//     textDecorationLine: 'underline',
//   },
// });

export default SignUpForm;