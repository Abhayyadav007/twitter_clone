import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as tweetsApi from '../api/tweets';
import * as likesApi from '../api/likes';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/Button';
import { LoadingState } from '../components/LoadingState';
import type { Tweet } from '../types';
import { colors, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'TweetDetail'>;

export function TweetDetailScreen({ route, navigation }: Props) {
  const { tweetId } = route.params;
  const { user } = useAuth();
  const [tweet, setTweet] = useState<Tweet | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tweetsApi.getTweet(tweetId);
      setTweet(data);
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Post not found');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [tweetId, navigation]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function toggleLike() {
    if (!tweet) return;
    const next = !liked;
    setLiked(next);
    setTweet({
      ...tweet,
      like_count: tweet.like_count + (next ? 1 : -1),
    });
    try {
      if (next) await likesApi.likeTweet(tweet.id);
      else await likesApi.unlikeTweet(tweet.id);
    } catch {
      setLiked(!next);
      setTweet(tweet);
    }
  }

  async function onDelete() {
    if (!tweet) return;
    Alert.alert('Delete post?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await tweetsApi.deleteTweet(tweet.id);
            navigation.goBack();
          } catch (err) {
            Alert.alert(
              'Failed',
              err instanceof ApiError ? err.message : 'Could not delete',
            );
          }
        },
      },
    ]);
  }

  if (loading || !tweet) {
    return <LoadingState />;
  }

  const isOwner = user?.id === tweet.user_id;

  return (
    <View style={styles.container}>
      <Text style={styles.content}>{tweet.content}</Text>
      <Text style={styles.meta}>{new Date(tweet.created_at).toLocaleString()}</Text>
      <Text style={styles.stats}>
        {tweet.like_count} likes · {tweet.reply_count} replies
      </Text>

      <View style={styles.actions}>
        <Button
          title={liked ? 'Unlike' : 'Like'}
          variant="secondary"
          onPress={() => void toggleLike()}
        />
        {isOwner ? <Button title="Delete" variant="danger" onPress={onDelete} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  content: {
    fontSize: 22,
    lineHeight: 30,
    color: colors.text,
    fontWeight: '500',
  },
  meta: { color: colors.textSecondary, fontSize: 14 },
  stats: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  actions: { gap: spacing.md, marginTop: spacing.md },
});
