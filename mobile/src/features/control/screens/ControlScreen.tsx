import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import WeatherBar from '../../../shared/components/WeatherBar';
import DeviceCard from '../../../shared/components/DeviceCard';

const ControlScreen: React.FC = () => {
  const [searchText, setSearchText] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#3B6DF8', '#2B5CE6']}
          style={styles.header}
        >
          <WeatherBar />

          <View style={styles.headerRow}>
            <Text style={styles.title}>Control</Text>
            <TouchableOpacity>
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

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        {/* Welcome text */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Welcome to "Smart Living"! Take control as you begin your seamless journey of home automation
          </Text>
        </View>

        {/* Add device button */}
        <View style={styles.addDeviceRow}>
          <TouchableOpacity style={styles.addDeviceBtn}>
            <Ionicons name="add-circle-outline" size={20} color="#3B6DF8" />
            <Text style={styles.addDeviceText}>Add device</Text>
          </TouchableOpacity>
        </View>

        {/* Device List */}
        <View style={styles.section}>
          <View style={styles.deviceGrid}>
            <View style={styles.controlCard}>
              <View style={styles.controlIconContainer}>
                <Ionicons name="snow-outline" size={48} color="#666" />
              </View>
              <Text style={styles.controlDeviceName}>Air condition</Text>
              <Text style={styles.controlDeviceCount}>1 device</Text>
              <View style={styles.switchRow}>
                <TouchableOpacity style={[styles.toggleTrack, styles.toggleActive]}>
                  <View style={[styles.toggleThumb, styles.toggleThumbActive]} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.controlCard}>
              <View style={styles.controlIconContainer}>
                <Ionicons name="bulb-outline" size={48} color="#666" />
              </View>
              <Text style={styles.controlDeviceName}>Smart Light</Text>
              <Text style={styles.controlDeviceCount}>1 device</Text>
              <View style={styles.switchRow}>
                <TouchableOpacity style={styles.toggleTrack}>
                  <View style={styles.toggleThumb} />
                </TouchableOpacity>
              </View>
            </View>
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
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bellIcon: {
    position: 'absolute',
    right: 20,
    top: 60,
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
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: -14,
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  welcomeSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  welcomeText: {
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
  },
  addDeviceRow: {
    paddingHorizontal: 20,
    marginTop: 16,
    alignItems: 'flex-end',
  },
  addDeviceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  addDeviceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
  },
  deviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  controlCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  controlIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  controlDeviceName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B6DF8',
    marginBottom: 2,
  },
  controlDeviceCount: {
    fontSize: 11,
    color: '#999',
    marginBottom: 8,
  },
  switchRow: {
    alignItems: 'center',
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#3B82F6',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
});

export default ControlScreen;
