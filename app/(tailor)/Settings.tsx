import { useAuth } from "@/context/AuthContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Ensure notifications show up and make sound even when the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function SettingsScreen() {
  const { userId, API_URL } = useAuth();

  // State for the Alarm (Shop Closing Time)
  const [alarmTime, setAlarmTime] = useState(
    new Date(new Date().setHours(21, 30, 0, 0)),
  ); // Default 9:30 PM
  const [showPicker, setShowPicker] = useState(false);

  // State for toggles
  const [autoUnavailable, setAutoUnavailable] = useState(true);
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [reviewAlerts, setReviewAlerts] = useState(true);

  // Ask for notification permissions and set up Android channels on mount
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please enable notifications for the closing alarm to work.",
        );
      }

      // ✅ FIX 1: Android requires a dedicated channel for high-priority alarms
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("closing-alarm", {
          name: "Closing Alarms",
          importance: Notifications.AndroidImportance.HIGH,
          sound: "default",
          vibrationPattern: [0, 250, 250, 250],
        });
      }
    })();
  }, []);

  // Handle Time Selection
  const onTimeChange = async (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === "ios"); // iOS picker stays open, Android auto-closes
    if (selectedDate) {
      setAlarmTime(selectedDate);
      await scheduleClosingAlarm(selectedDate);
    }
  };

  // Schedule the local notification
  const scheduleClosingAlarm = async (time: Date) => {
    // Cancel previously scheduled alarms first to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    const hours = time.getHours();
    const minutes = time.getMinutes();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Time to close up!",
        body: "Your shop closing time has arrived. Great work today!",
        sound: true,
      },
      // ✅ FIX 2: Explicitly define the trigger 'type' and 'channelId' for Android
      trigger: {
        type: "calendar",
        hour: hours,
        minute: minutes,
        repeats: true,
        channelId: "closing-alarm", // Links to the channel we created in useEffect
      } as any,
    });

    Alert.alert("Alarm Set", `Closing alarm set for ${formatTime(time)}`);
  };

  // Sync Auto-Unavailable setting with backend
  const toggleAutoUnavailable = async (value: boolean) => {
    setAutoUnavailable(value); // Optimistic UI update

    // Safety check: Is the user logged in properly?
    if (!userId) {
      console.error("❌ No userId found! Cannot update settings.");
      setAutoUnavailable(!value);
      return;
    }

    try {
      console.log(
        `📤 Sending autoCloseEnabled: ${value} for tailor: ${userId}`,
      );

      const response = await fetch(
        `${API_URL}/api/tailor/${userId}/settings/autoclose`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ autoCloseEnabled: value }),
        },
      );

      // Parse whatever the server sends back
      const data = await response.json();

      if (!response.ok) {
        // If status is not 2xx, throw an error to trigger the catch block
        throw new Error(
          `Server Error ${response.status}: ${data.error || data.message || "Unknown error"}`,
        );
      }

      console.log("✅ Successfully updated in DB:", data);
    } catch (error) {
      console.error("❌ Failed to update auto-close setting:", error);
      setAutoUnavailable(!value); // Revert the switch if it failed
    }
  };
  // Helper to format Date to "9:30 PM"
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Settings</Text>

      {/* ALARM SETTING */}
      <View style={[styles.settingBlock, { backgroundColor: "#ffeef2" }]}>
        <View style={styles.textStack}>
          <Text style={styles.title}>Shop Closing Time</Text>
          <Text style={styles.subtitle}>Set alarm for shop close time</Text>
        </View>
        <TouchableOpacity
          style={styles.timeBadge}
          onPress={() => setShowPicker(true)}
        >
          <Text style={styles.timeText}>{formatTime(alarmTime)}</Text>
        </TouchableOpacity>
      </View>

      {showPicker && (
        <DateTimePicker
          value={alarmTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={onTimeChange}
        />
      )}

      {/* AUTO UNAVAILABLE SETTING */}
      <View style={[styles.settingBlock, { backgroundColor: "#e6fffa" }]}>
        <View style={styles.textStack}>
          <Text style={styles.title}>Automatic Unavailability</Text>
          <Text style={styles.subtitle}>
            Automatically switch to "Unavailable" at 11:00 PM
          </Text>
        </View>
        <Switch value={autoUnavailable} onValueChange={toggleAutoUnavailable} />
      </View>

      <Text style={styles.sectionHeader}>Order Notifications</Text>

      <View style={[styles.settingBlock, { backgroundColor: "#fff0f5" }]}>
        <View style={styles.textStack}>
          <Text style={styles.title}>Receive notifications</Text>
          <Text style={styles.subtitle}>when a new order is received</Text>
        </View>
        <Switch
          value={orderNotifications}
          onValueChange={setOrderNotifications}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, paddingTop: 60 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  settingBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  textStack: { flex: 1, paddingRight: 10 },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 12, color: "gray" },
  timeBadge: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f0b0c0",
  },
  timeText: { fontSize: 14, fontWeight: "bold", color: "#d03060" },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "bold",
    color: "gray",
    marginTop: 10,
    marginBottom: 15,
    marginLeft: 5,
  },
});
