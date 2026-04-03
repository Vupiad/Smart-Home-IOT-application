import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import WeatherBar from '../../shared/components/WeatherBar';
import SceneModeCard from '../../shared/components/SceneModeCard';
import DeviceCard from '../../shared/components/DeviceCard';

const HomeScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with gradient */}
        <LinearGradient
          colors={['#3B6DF8', '#2B5CE6']}
          style={styles.header}
        >
          <WeatherBar />

          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>Hi, Hoang Trang</Text>
              <Text style={styles.subtitle}>
                Welcome to "Smart Living"! Take control as you begin your seamless journey of home automation
              </Text>
            </View>
            <TouchableOpacity style={styles.avatarContainer}>
              <Ionicons name="person-circle" size={44} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>

          {/* Notification bell */}
          <TouchableOpacity style={styles.bellIcon}>
            <Ionicons name="notifications" size={22} color="#FFD700" />
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>1</Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>

        {/* Scene Modes */}
        <View style={styles.sceneModes}>
          <SceneModeCard
            name="Get up"
            icon="sunny"
            iconColor="#FFA500"
            isActive={true}
          />
          <SceneModeCard
            name="Goodnight"
            icon="moon"
            iconColor="#4A6FA5"
            isActive={false}
          />
          <SceneModeCard
            name="Go out"
            icon="partly-sunny"
            iconColor="#FFD700"
            isActive={false}
          />
        </View>

        {/* Quick Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick access</Text>
          <View style={styles.deviceGrid}>
            <DeviceCard
              name="Air condition"
              icon="snow-outline"
              isOn={true}
              subtitle="25 degree"
            />
            <DeviceCard
              name="Coffee machine"
              icon="cafe-outline"
              isOn={true}
              subtitle="Kitchen"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#3B6DF8',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
    maxWidth: '90%',
  },
  avatarContainer: {
    marginLeft: 8,
  },
  bellIcon: {
    position: 'absolute',
    right: 20,
    top: 80,
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
  sceneModes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: -16,
    marginBottom: 20,
    gap: 10,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 14,
  },
  deviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default HomeScreen;
