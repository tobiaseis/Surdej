import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type BadgeStatus = 'active' | 'delayed' | 'completed' | 'info';

interface StatusBadgeProps {
  label: string;
  status: BadgeStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, status }) => {
  const getBackgroundColor = () => {
    switch (status) {
      case 'active':
        return colors.secondary;
      case 'completed':
        return colors.success;
      case 'delayed':
        return colors.warning;
      case 'info':
        return colors.border;
      default:
        return colors.border;
    }
  };

  const getTextColor = () => {
    if (status === 'info') return colors.textMain;
    return '#FFF';
  };

  return (
    <View style={[styles.badge, { backgroundColor: getBackgroundColor() }]}>
      <Text style={[typography.bodySmall, { color: getTextColor(), fontWeight: '600' }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
});
