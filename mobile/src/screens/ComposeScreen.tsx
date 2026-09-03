import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import * as tweetsApi from '../api/tweets';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { colors, spacing } from '../theme';
import type { MainTabParamList } from '../navigation/types';

const MAX = 280;

export function ComposeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const remaining = MAX - content.length;
  const canPost = content.trim().length > 0 && content.length <= MAX;

  async function onPost() {
    if (!canPost) return;
    setLoading(true);
    try {
      await tweetsApi.createTweet({ content: content.trim() });
      setContent('');
      navigation.navigate('HomeTab');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not post chirp.';
      Alert.alert('Failed', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Compose</Text>
        <Button
          title="Post"
          onPress={onPost}
          loading={loading}
          disabled={!canPost}
          style={styles.postBtn}
        />
      </View>

      <View style={styles.composer}>
        <Avatar
          name={user?.display_name || user?.username || '?'}
          uri={user?.avatar_url}
          size={44}
        />
        <TextInput
          style={styles.input}
          multiline
          autoFocus
          placeholder="What's happening?"
          placeholderTextColor={colors.textSecondary}
          value={content}
          onChangeText={setContent}
          maxLength={MAX}
        />
      </View>

      <Text style={[styles.counter, remaining < 20 && { color: colors.danger }]}>
        {remaining}
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  postBtn: {
    minHeight: 36,
    paddingHorizontal: spacing.lg,
  },
  composer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    flex: 1,
  },
  input: {
    flex: 1,
    fontSize: 18,
    lineHeight: 26,
    color: colors.text,
    textAlignVertical: 'top',
    minHeight: 160,
  },
  counter: {
    textAlign: 'right',
    padding: spacing.lg,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
