import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { colors, borderRadius, fontSize, spacing, shadowStyle } from '../../constants';
import { University } from '../../store';

interface SchoolSelectorProps {
  universities: University[];
  selectedUniversity: University | null;
  onSelect: (university: University) => void;
}

export function SchoolSelector({
  universities,
  selectedUniversity,
  onSelect,
}: SchoolSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        {selectedUniversity ? (
          <View style={styles.selectedContent}>
            <View style={[styles.logoPlaceholder, { backgroundColor: selectedUniversity.color }]}>
              <Text style={styles.logoText}>{selectedUniversity.short_name.charAt(0)}</Text>
            </View>
            <Text style={styles.selectedText}>{selectedUniversity.name}</Text>
          </View>
        ) : (
          <Text style={styles.placeholder}>Select your school</Text>
        )}
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modal}>
              <View style={styles.header}>
                <Text style={styles.headerText}>Select School</Text>
                <TouchableOpacity onPress={() => setIsOpen(false)}>
                  <Text style={styles.closeButton}>Close</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={universities}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.option,
                      item.id === selectedUniversity?.id && styles.optionSelected,
                    ]}
                    onPress={() => {
                      onSelect(item);
                      setIsOpen(false);
                    }}
                  >
                    <View style={[styles.logoPlaceholder, { backgroundColor: item.color }]}>
                      <Text style={styles.logoText}>{item.short_name.charAt(0)}</Text>
                    </View>
                    <View style={styles.optionInfo}>
                      <Text
                        style={[
                          styles.optionName,
                          item.id === selectedUniversity?.id && styles.optionNameSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text style={styles.optionDomain}>{item.domain}</Text>
                    </View>
                    {item.id === selectedUniversity?.id && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 56,
    ...shadowStyle,
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  logoText: {
    color: colors.background,
    fontWeight: 'bold',
    fontSize: fontSize.md,
  },
  selectedText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  placeholder: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  arrow: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: '70%',
  },
  modal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    fontSize: fontSize.md,
    color: colors.link,
    fontWeight: '600',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.backgroundSecondary,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  optionNameSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  optionDomain: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkmark: {
    fontSize: fontSize.lg,
    color: colors.primary,
  },
});
