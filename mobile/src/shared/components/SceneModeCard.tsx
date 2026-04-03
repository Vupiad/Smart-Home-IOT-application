import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SceneModeCardProps {
  name: string;
  icon: string;
  iconColor: string;
  isActive: boolean;
  onToggle?: (value: boolean) => void;
}

const SceneModeCard: React.FC<SceneModeCardProps> = ({ name, icon, iconColor, isActive, onToggle }) => {
  const [enabled, setEnabled] = useState(isActive);

  const handleToggle = (value: boolean) => {
    setEnabled(value);
    onToggle?.(value);
  };

  return (
    <TouchableOpacity style={[styles.card, enabled && styles.cardActive]} activeOpacity={0.7}>
      <Ionicons name={icon as any} size={40} color={iconColor} />
      <Text style={styles.name}>{name}</Text>
      <Switch
        value={enabled}
        onValueChange={handleToggle}
        trackColor={{ false: '#E0E0E0', true: '#3B82F6' }}
        thumbColor="#FFFFFF"
        style={styles.switch}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardActive: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 6,
  },
  switch: {
    transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }],
  },
});

export default SceneModeCard;
