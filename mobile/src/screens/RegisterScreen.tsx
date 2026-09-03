import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as authApi from '../api/auth';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { colors, spacing } from '../theme';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (username.trim().length < 3) {
      Alert.alert('Invalid username', 'Username must be at least 3 characters.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Invalid password', 'Password must be at least 8 characters.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Missing email', 'Enter an email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      await signIn(res);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not create account.';
      Alert.alert('Sign up failed', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.brand}>BlueGram</Text>
        <Text style={styles.title}>Create your account</Text>

        <View style={styles.form}>
          <TextField
            label="Username"
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
          />
          <TextField
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            label="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Button title="Sign up" onPress={onSubmit} loading={loading} />
        </View>

        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.link}>
            Already have an account? <Text style={styles.linkBold}>Log in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  brand: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  form: {
    gap: spacing.lg,
  },
  link: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 15,
  },
  linkBold: {
    color: colors.primary,
    fontWeight: '700',
  },
});
