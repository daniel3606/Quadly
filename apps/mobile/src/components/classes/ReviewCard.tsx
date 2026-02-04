import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, shadowStyle, borderRadius, fontSize, spacing } from '../../constants';

interface ReviewCardProps {
  review: {
    id: string;
    rating_overall: number;
    difficulty: number;
    workload: number;
    exams: number;
    attendance_required: boolean;
    text_body: string;
    created_at: string;
    author?: {
      nickname: string;
    };
  };
}

function RatingBar({
  label,
  value,
  maxValue = 5,
}: {
  label: string;
  value: number;
  maxValue?: number;
}) {
  const percentage = (value / maxValue) * 100;

  return (
    <View style={styles.ratingBar}>
      <Text style={styles.ratingBarLabel}>{label}</Text>
      <View style={styles.ratingBarTrack}>
        <View
          style={[
            styles.ratingBarFill,
            { width: `${percentage}%` },
            percentage > 60 && styles.ratingBarHigh,
            percentage <= 40 && styles.ratingBarLow,
          ]}
        />
      </View>
      <Text style={styles.ratingBarValue}>{value}</Text>
    </View>
  );
}

export function ReviewCard({ review }: ReviewCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.overallRating}>
          <Text style={styles.overallRatingValue}>{review.rating_overall}</Text>
          <Text style={styles.overallRatingMax}>/5</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.author}>
            {review.author?.nickname || 'Anonymous'}
          </Text>
          <Text style={styles.date}>{formatDate(review.created_at)}</Text>
        </View>
      </View>

      <View style={styles.ratings}>
        <RatingBar label="Difficulty" value={review.difficulty} />
        <RatingBar label="Workload" value={review.workload} />
        <RatingBar label="Exams" value={review.exams} maxValue={3} />
      </View>

      <View style={styles.badges}>
        {review.attendance_required && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Attendance Required</Text>
          </View>
        )}
      </View>

      <Text style={styles.body}>{review.text_body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadowStyle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  overallRating: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.md,
  },
  overallRatingValue: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.background,
  },
  overallRatingMax: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  headerInfo: {
    flex: 1,
  },
  author: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  date: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ratings: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBarLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    width: 80,
  },
  ratingBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 4,
  },
  ratingBarHigh: {
    backgroundColor: colors.error,
  },
  ratingBarLow: {
    backgroundColor: colors.success,
  },
  ratingBarValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    width: 20,
    textAlign: 'right',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  badge: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: fontSize.xs,
    color: colors.textLight,
  },
  body: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },
});
