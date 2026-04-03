import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DeviceCardProps {
  name: string;
  icon: string;
  isOn: boolean;
  subtitle?: string;
  onToggle?: (value: boolean) => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ name, icon, isOn, subtitle, onToggle }) => {
  const [enabled, setEnabled] = useState(isOn);

  const handleToggle = (value: boolean) => {
    setEnabled(value);
    onToggle?.(value);
  };

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon as any} size={36} color="#555" />
      </View>
      <Text style={[styles.name, enabled && styles.nameActive]}>{name}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <Switch
        value={enabled}
        onValueChange={handleToggle}
        trackColor={{ false: '#E0E0E0', true: '#3B82F6' }}
        thumbColor="#FFFFFF"
        style={styles.switch}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 2,
  },
  nameActive: {
    color: '#3B82F6',
  },
  subtitle: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
});

export default DeviceCard;
