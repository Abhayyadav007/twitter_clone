import { useCallback, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as tweetsApi from '../api/tweets';
import * as likesApi from '../api/likes';
import { LoadingState } from '../components/LoadingState';
import { TweetCard } from '../components/TweetCard';
import type { TweetWithAuthor } from '../types';
import { colors, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [tweets, setTweets] = useState<TweetWithAuthor[]>([]);
  const tweetsRef = useRef(tweets);
  tweetsRef.current = tweets;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (mode: 'initial' | 'refresh' | 'more') => {
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    if (mode === 'more') setLoadingMore(true);

    try {
      const current = tweetsRef.current;
      const before =
        mode === 'more' && current.length > 0
          ? current[current.length - 1]?.created_at
          : undefined;
      const data = await tweetsApi.getTimeline({
        limit: 20,
        before,
      });
      setTweets((prev) => (mode === 'more' ? [...prev, ...data] : data));
    } catch {
      // keep existing list on error
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load('initial');
    }, [load]),
  );

  async function toggleLike(tweet: TweetWithAuthor) {
    const nextLiked = !tweet.liked_by_viewer;
    setTweets((prev) =>
      prev.map((t) =>
        t.id === tweet.id
          ? {
              ...t,
              liked_by_viewer: nextLiked,
              like_count: t.like_count + (nextLiked ? 1 : -1),
            }
          : t,
      ),
    );

    try {
      if (nextLiked) {
        await likesApi.likeTweet(tweet.id);
      } else {
        await likesApi.unlikeTweet(tweet.id);
      }
    } catch {
      setTweets((prev) => prev.map((t) => (t.id === tweet.id ? tweet : t)));
    }
  }

  if (loading && tweets.length === 0) {
    return <LoadingState label="Loading timeline…" />;
  }

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
      </View>
      <FlatList
        data={tweets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TweetCard
            tweet={item}
            onPress={() => navigation.navigate('TweetDetail', { tweetId: item.id })}
            onAuthorPress={() =>
              navigation.navigate('UserProfile', {
                username: item.author_username,
              })
            }
            onLikePress={() => void toggleLike(item)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load('refresh')}
            tintColor={colors.primary}
          />
        }
        onEndReached={() => {
          if (!loadingMore && tweets.length > 0) {
            void load('more');
          }
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Your feed is empty</Text>
            <Text style={styles.emptyBody}>Follow people or share your first post.</Text>
          </View>
        }
        contentContainerStyle={tweets.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  emptyContainer: { flexGrow: 1 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  emptyBody: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
