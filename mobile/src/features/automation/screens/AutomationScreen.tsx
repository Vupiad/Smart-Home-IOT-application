import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Header from "../../../shared/components/Header";
import SceneModeCard from "../../../shared/components/SceneModeCard";
import { theme } from "../../../theme";
import { useSmartHomeContext } from "../../../shared/state/SmartHomeContext";

export default function AutomationScreen() {
  const { scenes, setSceneActive } = useSmartHomeContext();
  const navigation = useNavigation<any>();
  const handleAvatarPress = () => {
    navigation.getParent()?.navigate("OwnersTab");
  };

  const handleToggleScene = (id: string, newValue: boolean) => {
    setSceneActive(id, newValue);
  };

  // Logic: Nhấn vào Card để mở trang Chỉnh sửa
  const handleCardPress = (id: string) => {
    navigation.navigate("AddAutomation", {
      isEdit: true,
      sceneId: id
    });
  };

  return (
    <View style={styles.container}>
      <Header
        tabName="Automation"
        onAvatarPress={handleAvatarPress}
        onAddPress={() => {
          navigation.navigate("AddAutomation", { isEdit: false });
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* AUTOMATION MODE */}
        <View style={styles.gridContainer}>
          {scenes.map((item) => (
            <SceneModeCard
              key={item.id}
              name={item.name}
              icon={item.icon}
              iconColor={item.iconColor}
              isActive={item.isActive}
              onToggle={(val) => handleToggleScene(item.id, val)}
              onPress={() => handleCardPress(item.id)}
            />
          ))}
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingTop: theme.layout.sectionGap,
    paddingBottom: theme.spacing.xxl,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: theme.layout.pagePaddingX,
    gap: theme.layout.cardGap,
    marginTop: theme.layout.sectionGap,
    width: "100%",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: theme.layout.pagePaddingX,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.layout.sectionGap,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    ...theme.typography.title,
    fontSize: 18,
    color: theme.colors.textPrimary,
    marginBottom: theme.layout.contentGap,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E8ECF2",
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.textPrimary,
    backgroundColor: "#F9FAFC",
    marginBottom: theme.layout.sectionGap,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 15 },
  cancelText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  makeAutoBtn: {
    backgroundColor: theme.colors.headerBlue,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.round,
  },
  makeAutoText: { color: theme.colors.white, fontSize: 16, fontWeight: "600" },
});