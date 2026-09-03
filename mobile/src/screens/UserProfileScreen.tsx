import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as usersApi from '../api/users';
import * as tweetsApi from '../api/tweets';
import * as followsApi from '../api/follows';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { LoadingState } from '../components/LoadingState';
import type { FollowCounts, Tweet, UserPublic } from '../types';
import { colors, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

export function UserProfileScreen({ route, navigation }: Props) {
  const { username } = route.params;
  const { user: me } = useAuth();
  const [profile, setProfile] = useState<UserPublic | null>(null);
  const [counts, setCounts] = useState<FollowCounts | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const p = await usersApi.getUserByUsername(username);
      setProfile(p);
      const [c, t] = await Promise.all([
        followsApi.getFollowCounts(p.id),
        tweetsApi.getTweetsByUser(p.id, { limit: 30 }),
      ]);
      setCounts(c);
      setTweets(t);
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'User not found');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [username, navigation]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function toggleFollow() {
    if (!profile || me?.id === profile.id) return;
    setFollowBusy(true);
    const next = !following;
    setFollowing(next);
    setCounts((prev) =>
      prev
        ? {
            ...prev,
            followers: prev.followers + (next ? 1 : -1),
          }
        : prev,
    );
    try {
      if (next) await followsApi.follow(profile.id);
      else await followsApi.unfollow(profile.id);
    } catch {
      setFollowing(!next);
      setCounts((prev) =>
        prev
          ? {
              ...prev,
              followers: prev.followers + (next ? -1 : 1),
            }
          : prev,
      );
    } finally {
      setFollowBusy(false);
    }
  }

  if (loading || !profile) {
    return <LoadingState />;
  }

  const display = profile.display_name || profile.username;
  const isSelf = me?.id === profile.id;

  return (
    <View style={styles.flex}>
      <FlatList
        data={tweets}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Avatar name={display} uri={profile.avatar_url} size={72} />
            <Text style={styles.name}>{display}</Text>
            <Text style={styles.handle}>@{profile.username}</Text>
            {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
            <View style={styles.counts}>
              <Text style={styles.countText}>
                <Text style={styles.countNum}>{counts?.following ?? 0}</Text> Following
              </Text>
              <Text style={styles.countText}>
                <Text style={styles.countNum}>{counts?.followers ?? 0}</Text> Followers
              </Text>
            </View>
            {!isSelf ? (
              <Button
                title={following ? 'Following' : 'Follow'}
                variant={following ? 'secondary' : 'primary'}
                loading={followBusy}
                onPress={() => void toggleFollow()}
                style={{ marginTop: spacing.md }}
              />
            ) : null}
            <Text style={styles.section}>Chirps</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.tweetRow}>
            <Text style={styles.tweetContent}>{item.content}</Text>
            <Text style={styles.tweetMeta}>
              {item.like_count} likes · {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No chirps yet.</Text>}
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
  bio: { fontSize: 15, color: colors.text },
  counts: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  countText: { color: colors.textSecondary, fontSize: 14 },
  countNum: { color: colors.text, fontWeight: '700' },
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
