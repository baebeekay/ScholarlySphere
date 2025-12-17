import { SQLiteProvider } from 'expo-sqlite';
import SignUpForm from '../views/SignUpForm';

export default function LoginScreen() {
  return (
    <SQLiteProvider
     databaseName="scholarlySphere.db"
        assetSource={{ assetId: require('../assets/scholarlySphere.db') }}
        options={{ useNewConnection: false }}>
      <SignUpForm />
    </SQLiteProvider>
  );
}










