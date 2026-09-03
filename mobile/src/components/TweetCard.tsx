import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TweetWithAuthor } from '../types';
import { colors, spacing } from '../theme';
import { Avatar } from './Avatar';

type Props = {
  tweet: TweetWithAuthor;
  onPress?: () => void;
  onAuthorPress?: () => void;
  onLikePress?: () => void;
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function TweetCard({ tweet, onPress, onAuthorPress, onLikePress }: Props) {
  const displayName = tweet.author_display_name || tweet.author_username;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Pressable
        onPress={(event) => {
          event.stopPropagation();
          onAuthorPress?.();
        }}
        hitSlop={8}
      >
        <Avatar name={displayName} uri={tweet.author_avatar_url} size={44} />
      </Pressable>

      <View style={styles.body}>
        <View style={styles.header}>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onAuthorPress?.();
            }}
            style={styles.nameRow}
          >
            <Text style={styles.displayName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.username} numberOfLines={1}>
              @{tweet.author_username}
            </Text>
          </Pressable>
          <Text style={styles.time}>{formatTime(tweet.created_at)}</Text>
        </View>

        <Text style={styles.content}>{tweet.content}</Text>

        <View style={styles.actions}>
          <View style={styles.action}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.actionCount}>{tweet.reply_count}</Text>
          </View>

          <Pressable
            style={styles.action}
            onPress={(event) => {
              event.stopPropagation();
              onLikePress?.();
            }}
            hitSlop={8}
          >
            <Ionicons
              name={tweet.liked_by_viewer ? 'heart' : 'heart-outline'}
              size={18}
              color={tweet.liked_by_viewer ? colors.like : colors.textSecondary}
            />
            <Text
              style={[
                styles.actionCount,
                tweet.liked_by_viewer && { color: colors.like },
              ]}
            >
              {tweet.like_count}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  displayName: {
    fontWeight: '700',
    fontSize: 15,
    color: colors.text,
    maxWidth: '55%',
  },
  username: {
    fontSize: 15,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  time: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  content: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xxl,
    marginTop: spacing.sm,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionCount: {
    fontSize: 13,
    color: colors.textSecondary,
    minWidth: 16,
  },
});
