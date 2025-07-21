import { SQLiteProvider } from 'expo-sqlite';
import LoginForm from '../views/LoginForm';

export default function LoginScreen() {
  return (
    <SQLiteProvider
     databaseName="scholarlySphere.db"
        assetSource={{ assetId: require('../assets/scholarlySphere.db') }}
        options={{ useNewConnection: false }}>
      <LoginForm />
    </SQLiteProvider>
  );
}
