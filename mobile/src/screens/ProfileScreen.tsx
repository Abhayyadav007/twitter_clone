import { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as usersApi from '../api/users';
import * as tweetsApi from '../api/tweets';
import * as followsApi from '../api/follows';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { LoadingState } from '../components/LoadingState';
import { TextField } from '../components/TextField';
import type { FollowCounts, Tweet, User } from '../types';
import { colors, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

export function ProfileScreen() {
  const { signOut, setUser } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [me, setMe] = useState<User | null>(null);
  const [counts, setCounts] = useState<FollowCounts | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const profile = await usersApi.getMe();
      setMe(profile);
      setDisplayName(profile.display_name ?? '');
      setBio(profile.bio ?? '');
      const [c, t] = await Promise.all([
        followsApi.getFollowCounts(profile.id),
        tweetsApi.getTweetsByUser(profile.id, { limit: 30 }),
      ]);
      setCounts(c);
      setTweets(t);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function saveProfile() {
    setSaving(true);
    try {
      const updated = await usersApi.updateMe({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
      });
      setUser(updated);
      setMe((prev) =>
        prev
          ? {
              ...prev,
              display_name: updated.display_name,
              bio: updated.bio,
            }
          : prev,
      );
      setEditing(false);
    } catch (err) {
      Alert.alert('Update failed', err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !me) {
    return <LoadingState label="Loading profile…" />;
  }

  const display = me.display_name || me.username;

  return (
    <View style={styles.flex}>
      <FlatList
        data={tweets}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => void load()}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Avatar name={display} uri={me.avatar_url} size={72} />
            <Text style={styles.name}>{display}</Text>
            <Text style={styles.handle}>@{me.username}</Text>
            {me.bio ? <Text style={styles.bio}>{me.bio}</Text> : null}

            <View style={styles.counts}>
              <Text style={styles.countText}>
                <Text style={styles.countNum}>{counts?.following ?? 0}</Text> Following
              </Text>
              <Text style={styles.countText}>
                <Text style={styles.countNum}>{counts?.followers ?? 0}</Text> Followers
              </Text>
            </View>

            {editing ? (
              <View style={styles.editForm}>
                <TextField
                  label="Display name"
                  value={displayName}
                  onChangeText={setDisplayName}
                />
                <TextField
                  label="Bio"
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                />
                <Button title="Save" onPress={saveProfile} loading={saving} />
                <Button
                  title="Cancel"
                  variant="ghost"
                  onPress={() => setEditing(false)}
                />
              </View>
            ) : (
              <View style={styles.actions}>
                <Button
                  title="Edit profile"
                  variant="secondary"
                  onPress={() => setEditing(true)}
                />
                <Button
                  title="Log out"
                  variant="ghost"
                  onPress={() =>
                    Alert.alert('Log out', 'Are you sure?', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Log out',
                        style: 'destructive',
                        onPress: () => void signOut(),
                      },
                    ])
                  }
                />
              </View>
            )}

            <Text style={styles.section}>Your posts</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.tweetRow}>
            <Text style={styles.tweetContent}>{item.content}</Text>
            <Text style={styles.tweetMeta}>
              {item.like_count} likes · {new Date(item.created_at).toLocaleString()}
            </Text>
            <Button
              title="Open"
              variant="ghost"
              onPress={() => navigation.navigate('TweetDetail', { tweetId: item.id })}
            />
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No posts yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  header: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  handle: { fontSize: 15, color: colors.textSecondary },
  bio: { fontSize: 15, color: colors.text, marginTop: spacing.xs },
  counts: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  countText: { color: colors.textSecondary, fontSize: 14 },
  countNum: { color: colors.text, fontWeight: '700' },
  actions: { gap: spacing.sm, marginTop: spacing.md },
  editForm: { gap: spacing.md, marginTop: spacing.md },
  section: {
    marginTop: spacing.lg,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  tweetRow: {
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  tweetContent: { fontSize: 15, color: colors.text, lineHeight: 21 },
  tweetMeta: { fontSize: 13, color: colors.textSecondary },
  empty: {
    textAlign: 'center',
    color: colors.textSecondary,
    padding: spacing.xxl,
  },
});
