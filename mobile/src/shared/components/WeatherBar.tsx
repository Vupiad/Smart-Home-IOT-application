import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WeatherBar: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <Ionicons name="partly-sunny" size={16} color="#FFD700" />
        <Text style={styles.text}>28°C</Text>
      </View>
      <View style={styles.item}>
        <Ionicons name="water" size={16} color="#87CEEB" />
        <Text style={styles.text}>70%</Text>
      </View>
      <View style={styles.item}>
        <Ionicons name="calendar" size={16} color="#FF6B6B" />
        <Text style={styles.text}>Wed, May 24th</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default WeatherBar;
