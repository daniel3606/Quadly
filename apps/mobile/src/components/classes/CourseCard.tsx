import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, shadowStyle, borderRadius, fontSize, spacing } from '../../constants';

interface CourseCardProps {
  course: {
    id: string;
    subject: string;
    catalog_number: string;
    title: string;
    credits_min: number;
    credits_max: number;
    review_count: number;
    avg_rating: number | null;
  };
  onPress: (courseId: string) => void;
}

function RatingStars({ rating }: { rating: number | null }) {
  if (rating === null) {
    return <Text style={styles.noRating}>No reviews</Text>;
  }

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;

  return (
    <View style={styles.ratingContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Text key={star} style={styles.star}>
          {star <= fullStars
            ? '★'
            : star === fullStars + 1 && hasHalfStar
            ? '☆'
            : '☆'}
        </Text>
      ))}
      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
    </View>
  );
}

export function CourseCard({ course, onPress }: CourseCardProps) {
  const credits =
    course.credits_min === course.credits_max
      ? `${course.credits_min} cr`
      : `${course.credits_min}-${course.credits_max} cr`;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(course.id)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.courseCode}>
          {course.subject} {course.catalog_number}
        </Text>
        <Text style={styles.credits}>{credits}</Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {course.title}
      </Text>

      <View style={styles.footer}>
        <RatingStars rating={course.avg_rating} />
        <Text style={styles.reviewCount}>
          {course.review_count} {course.review_count === 1 ? 'review' : 'reviews'}
        </Text>
      </View>
    </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  courseCode: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.primary,
  },
  credits: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  title: {
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    fontSize: fontSize.md,
    color: '#FFD700',
  },
  ratingText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  noRating: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  reviewCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
