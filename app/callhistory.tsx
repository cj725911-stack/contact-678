import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Linking,
  Platform,
  PermissionsAndroid,
  RefreshControl,
  ActivityIndicator,
  AppState,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../_ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import CallLogs from "react-native-call-log";

const { width } = Dimensions.get("window");

interface CallRecord {
  id: string;
  type: "incoming" | "outgoing" | "missed" | "rejected" | "blocked";
  duration: number;
  timestamp: Date;
  phoneNumber: string;
  name?: string;
}

export default function CallHistoryScreen() {
  const router = useRouter();
  const { id, name, phone } = useLocalSearchParams();
  const { theme, isDark } = useTheme();

  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true); // NEW: Track initial load
  const [refreshing, setRefreshing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const appState = useRef(AppState.currentState);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const lastCallCount = useRef(0);

  // Monitor app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("App came to foreground, refreshing call history...");
        if (hasPermission && Platform.OS === "android") {
          loadCallHistory();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [hasPermission]);

  // Set up polling interval for real-time updates
  useEffect(() => {
    if (hasPermission && Platform.OS === "android" && phone) {
      console.log("Starting call history polling...");
      
      // Initial load
      loadCallHistory();
      
      // Poll every 3 seconds for new call logs
      pollInterval.current = setInterval(() => {
        console.log("Polling for call history updates...");
        loadCallHistory();
      }, 3000);
    }

    return () => {
      if (pollInterval.current) {
        console.log("Stopping call history polling");
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }
    };
  }, [hasPermission, phone]);

  useEffect(() => {
    isMounted.current = true;
    
    if (Platform.OS === "android") {
      initializeCallHistory();
    } else {
      setLoading(false);
      setInitialLoading(false);
    }

    return () => {
      isMounted.current = false;
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, []);

  const initializeCallHistory = async () => {
    try {
      const granted = await checkAndRequestPermissions();
      if (granted) {
        await loadCallHistory();
      } else {
        setPermissionDenied(true);
      }
    } catch (error) {
      console.error("Initialization error:", error);
      setPermissionDenied(true);
    } finally {
      setLoading(false);
      setInitialLoading(false); // Initial load complete
    }
  };

  const checkAndRequestPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== "android") {
      console.log("Not Android platform");
      return false;
    }

    try {
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG
      );

      if (hasPermission) {
        console.log("Permission already granted");
        setHasPermission(true);
        setPermissionDenied(false);
        return true;
      }

      console.log("Requesting call log permission...");
      
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        {
          title: "Call Log Access Required",
          message:
            "This app needs access to your call logs to display your call history with this contact in real-time.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Deny",
          buttonPositive: "Allow",
        }
      );

      console.log("Permission result:", granted);

      const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      setHasPermission(isGranted);
      setPermissionDenied(!isGranted);

      if (!isGranted) {
        console.log("Permission denied by user");
        
        Alert.alert(
          "Permission Denied",
          "Call log access was denied. Without this permission, we cannot display your call history with this contact.\n\nYou can grant permission later in your device settings.",
          [
            { text: "OK", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                Linking.openSettings().catch(err => 
                  console.error("Error opening settings:", err)
                );
              },
            },
          ]
        );
      }

      return isGranted;
    } catch (error) {
      console.error("Permission error:", error);
      setPermissionDenied(true);
      
      Alert.alert(
        "Permission Error",
        "An error occurred while requesting call log permission. Please try again or grant the permission manually in your device settings."
      );
      
      return false;
    }
  };

  const loadCallHistory = async () => {
    if (Platform.OS !== "android" || !phone) {
      console.log("Cannot load call history: wrong platform or no phone");
      return;
    }

    if (!hasPermission) {
      console.log("Cannot load call history: no permission");
      return;
    }

    if (!isMounted.current) {
      console.log("Component unmounted, skipping load");
      return;
    }

    try {
      // Load all call logs from the last 90 days
      const filter = {
        minTimestamp: Date.now() - 90 * 24 * 60 * 60 * 1000,
      };

      const allCalls = await CallLogs.load(-1, filter);
      console.log(`Loaded ${allCalls.length} total call records`);

      if (!allCalls || allCalls.length === 0) {
        console.log("No calls found in device");
        if (isMounted.current) {
          setCallHistory([]);
          setLastUpdate(new Date());
          setInitialLoading(false); // Finished loading
        }
        return;
      }

      // Normalize the target phone number
      const targetPhone = normalizePhoneNumber(phone as string);
      console.log(`Looking for calls matching: ${targetPhone}`);

      // Filter and map calls for this specific contact
      const relevantCalls = allCalls
        .filter((call: any) => {
          const callPhone = normalizePhoneNumber(call.phoneNumber || "");
          
          // More flexible matching - match last 7-10 digits
          const callLast10 = callPhone.slice(-10);
          const targetLast10 = targetPhone.slice(-10);
          const callLast7 = callPhone.slice(-7);
          const targetLast7 = targetPhone.slice(-7);
          
          const isMatch = 
            callPhone === targetPhone ||
            callLast10 === targetLast10 ||
            callLast7 === targetLast7 ||
            (callLast10.length >= 7 && targetLast10.length >= 7 && 
             (callLast10.endsWith(targetLast7) || targetLast10.endsWith(callLast7)));
          
          if (isMatch) {
            console.log(`Match found: ${callPhone} matches ${targetPhone}`);
          }
          
          return isMatch && callPhone.length >= 7;
        })
        .map((call: any, index: number): CallRecord => {
          let callType: CallRecord["type"] = "outgoing";

          if (call.type === "MISSED") {
            callType = "missed";
          } else if (call.type === "INCOMING") {
            callType = "incoming";
          } else if (call.type === "OUTGOING") {
            callType = "outgoing";
          } else if (call.type === "REJECTED") {
            callType = "rejected";
          } else if (call.type === "BLOCKED") {
            callType = "blocked";
          }

          return {
            id: `${call.timestamp || Date.now()}-${index}`,
            type: callType,
            duration: parseInt(call.duration || "0", 10),
            timestamp: new Date(parseInt(call.timestamp || Date.now().toString(), 10)),
            phoneNumber: call.phoneNumber || (phone as string),
            name: call.name || (name as string),
          };
        })
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      console.log(`Found ${relevantCalls.length} matching calls`);
      
      // Check if there are actually changes
      if (relevantCalls.length !== lastCallCount.current) {
        console.log(`Call count changed: ${lastCallCount.current} -> ${relevantCalls.length}`);
        lastCallCount.current = relevantCalls.length;
        
        if (isMounted.current) {
          setCallHistory(relevantCalls);
          setLastUpdate(new Date());
          setInitialLoading(false); // Finished loading
        }
      } else {
        // Check for changes in the most recent call
        if (relevantCalls.length > 0 && callHistory.length > 0) {
          const newestCall = relevantCalls[0];
          const currentNewest = callHistory[0];
          
          if (newestCall.timestamp.getTime() !== currentNewest?.timestamp.getTime()) {
            console.log("New call detected!");
            if (isMounted.current) {
              setCallHistory(relevantCalls);
              setLastUpdate(new Date());
            }
          }
        } else if (relevantCalls.length > 0 && callHistory.length === 0) {
          // First call loaded
          if (isMounted.current) {
            setCallHistory(relevantCalls);
            setLastUpdate(new Date());
          }
        }
        
        // Finished initial loading regardless
        if (isMounted.current) {
          setInitialLoading(false);
        }
      }
    } catch (error) {
      console.error("Error loading call history:", error);
      if (isMounted.current) {
        setInitialLoading(false); // Stop loading even on error
      }
      
      if (refreshing && isMounted.current) {
        Alert.alert(
          "Error Loading Calls",
          "Failed to retrieve call history from your device. Please ensure the app has permission to access call logs.",
          [
            { text: "OK" },
            {
              text: "Check Permissions",
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      }
    }
  };

  const normalizePhoneNumber = (phoneNumber: string): string => {
    if (!phoneNumber) return "";
    let normalized = phoneNumber.replace(/\D/g, "");
    if (normalized.length > 10 && normalized.startsWith("1")) {
      normalized = normalized.substring(1);
    }
    if (normalized.length > 10 && normalized.startsWith("0")) {
      normalized = normalized.substring(1);
    }
    return normalized;
  };

  const onRefresh = useCallback(async () => {
    if (!hasPermission) {
      Alert.alert(
        "Permission Required",
        "Please grant call log permission to refresh call history."
      );
      return;
    }
    
    setRefreshing(true);
    await loadCallHistory();
    setRefreshing(false);
  }, [phone, hasPermission]);

  const retryPermission = async () => {
    setLoading(true);
    setInitialLoading(true);
    setPermissionDenied(false);
    await initializeCallHistory();
  };

  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return "0s";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (diffMins < 1) {
      return `Just now`;
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return `Yesterday at ${timeStr}`;
    } else if (diffDays < 7) {
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
      return `${dayName} at ${timeStr}`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: diffDays > 365 ? "numeric" : undefined,
      });
    }
  };

  const getCallColor = (type: CallRecord["type"]) => {
    switch (type) {
      case "incoming":
        return "#34C759";
      case "outgoing":
        return theme.accent;
      case "missed":
        return "#FF3B30";
      case "rejected":
        return "#FF9500";
      case "blocked":
        return "#8E8E93";
      default:
        return theme.text;
    }
  };

  const getCallIcon = (type: CallRecord["type"]) => {
    switch (type) {
      case "missed":
        return "call-outline";
      case "rejected":
        return "close-circle-outline";
      case "blocked":
        return "ban-outline";
      default:
        return "call-outline";
    }
  };

  const getCallLabel = (type: CallRecord["type"]) => {
    switch (type) {
      case "incoming":
        return "Incoming";
      case "outgoing":
        return "Outgoing";
      case "missed":
        return "Missed";
      case "rejected":
        return "Rejected";
      case "blocked":
        return "Blocked";
      default:
        return "Unknown";
    }
  };

  const handleCallPress = (record: CallRecord) => {
    const details = [
      `Type: ${getCallLabel(record.type)}`,
      `Duration: ${formatDuration(record.duration)}`,
      `Time: ${record.timestamp.toLocaleString()}`,
      `Phone: ${record.phoneNumber}`,
    ].join("\n");

    Alert.alert("Call Details", details, [
      {
        text: "Call Back",
        onPress: () => makeCall(record.phoneNumber),
      },
      { text: "Close", style: "cancel" },
    ]);
  };

  const makeCall = (phoneNumber: string) => {
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneUrl);
        } else {
          throw new Error("Phone calls not supported");
        }
      })
      .catch((err) => {
        console.error("Error making call:", err);
        Alert.alert("Error", "Unable to make phone calls on this device");
      });
  };

  const totalIncoming = callHistory.filter((c) => c.type === "incoming").length;
  const totalOutgoing = callHistory.filter((c) => c.type === "outgoing").length;
  const totalMissed = callHistory.filter((c) => c.type === "missed").length;
  const totalDuration = callHistory
    .filter((c) => c.type === "incoming" || c.type === "outgoing")
    .reduce((acc, call) => acc + call.duration, 0);

  const styles = createStyles(theme, isDark);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <Stack.Screen
          options={{
            title: "Call History",
            headerTitleStyle: { color: theme.text },
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.accent,
          }}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading call history...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // iOS platform restriction
  if (Platform.OS === "ios") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <Stack.Screen
          options={{
            title: "Call History",
            headerTitleStyle: { color: theme.text },
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.accent,
          }}
        />
        <View style={styles.centerContainer}>
          <Ionicons name="lock-closed" size={64} color={theme.secondaryText} />
          <Text style={[styles.title, { color: theme.text }]}>
            Not Available on iOS
          </Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
            iOS restricts access to call logs for privacy reasons. This is a
            platform limitation that cannot be bypassed.
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.accent }]}
            onPress={() => makeCall(phone as string)}
          >
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Call {name || phone}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Permission denied state
  if (permissionDenied || !hasPermission) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <Stack.Screen
          options={{
            title: "Call History",
            headerTitleStyle: { color: theme.text },
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.accent,
          }}
        />
        <View style={styles.centerContainer}>
          <View style={[styles.warningIconContainer, { backgroundColor: `${theme.accent}15` }]}>
            <Ionicons
              name="shield-checkmark-outline"
              size={64}
              color={theme.accent}
            />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>
            Permission Required
          </Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
            To view your call history with this contact in real-time, we need permission to
            access your device's call logs. Without this permission, call history
            cannot be displayed.
          </Text>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.accent }]}
            onPress={retryPermission}
          >
            <Ionicons name="shield-checkmark" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Grant Permission</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.accent }]}
            onPress={() => Linking.openSettings()}
          >
            <Ionicons name="settings-outline" size={20} color={theme.accent} />
            <Text style={[styles.secondaryButtonText, { color: theme.accent }]}>
              Open Settings
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={[styles.callButton, { backgroundColor: theme.inputBg }]}
            onPress={() => makeCall(phone as string)}
          >
            <Ionicons name="call" size={20} color={theme.accent} />
            <Text style={[styles.callButtonText, { color: theme.text }]}>
              Call {name || phone}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Main content with permission granted
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack.Screen
        options={{
          title: "Call History",
          headerTitleStyle: { color: theme.text },
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.accent,
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 10, marginRight: 10, alignItems: "center" }}>
              <View style={[styles.liveBadge, { backgroundColor: `${theme.accent}20` }]}>
                <View style={[styles.liveDot, { backgroundColor: theme.accent }]} />
                <Text style={[styles.liveText, { color: theme.accent }]}>LIVE</Text>
              </View>
              {lastUpdate && (
                <Text
                  style={[styles.lastUpdateText, { color: theme.secondaryText }]}
                >
                  {lastUpdate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              )}
            </View>
          ),
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      >
        {/* Contact Header */}
        <View style={[styles.contactCard, { backgroundColor: theme.inputBg }]}>
          <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
            <Text style={styles.avatarText}>
              {name ? (name as string).charAt(0).toUpperCase() : "?"}
            </Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={[styles.contactName, { color: theme.text }]}>
              {name || "Unknown Contact"}
            </Text>
            <Text style={[styles.contactPhone, { color: theme.secondaryText }]}>
              {phone || "No phone number"}
            </Text>
            <TouchableOpacity
              onPress={() => makeCall(phone as string)}
              style={[styles.callNowButton, { backgroundColor: theme.accent }]}
            >
              <Ionicons name="call" size={16} color="#fff" />
              <Text style={styles.callNowButtonText}>Call Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Show loading indicator during initial load */}
        {initialLoading ? (
          <View style={styles.contentLoadingContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.contentLoadingText, { color: theme.text }]}>
              Loading call history...
            </Text>
          </View>
        ) : (
          <>
            {/* Statistics */}
            {callHistory.length > 0 && (
              <View style={styles.statsContainer}>
                <View style={[styles.statsCard, { backgroundColor: theme.inputBg }]}>
                  <View style={styles.statItem}>
                    <View
                      style={[styles.statIconContainer, { backgroundColor: "#34C75920" }]}
                    >
                      <Ionicons name="arrow-down" size={20} color="#34C759" />
                    </View>
                    <Text style={[styles.statNumber, { color: theme.text }]}>
                      {totalIncoming}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.secondaryText }]}>
                      Incoming
                    </Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <View
                      style={[
                        styles.statIconContainer,
                        { backgroundColor: `${theme.accent}20` },
                      ]}
                    >
                      <Ionicons name="arrow-up" size={20} color={theme.accent} />
                    </View>
                    <Text style={[styles.statNumber, { color: theme.text }]}>
                      {totalOutgoing}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.secondaryText }]}>
                      Outgoing
                    </Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <View
                      style={[styles.statIconContainer, { backgroundColor: "#FF3B3020" }]}
                    >
                      <Ionicons name="close" size={20} color="#FF3B30" />
                    </View>
                    <Text style={[styles.statNumber, { color: theme.text }]}>
                      {totalMissed}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.secondaryText }]}>
                      Missed
                    </Text>
                  </View>
                </View>

                {totalDuration > 0 && (
                  <View
                    style={[styles.durationCard, { backgroundColor: theme.inputBg }]}
                  >
                    <Ionicons name="time-outline" size={24} color={theme.accent} />
                    <View style={styles.durationInfo}>
                      <Text
                        style={[styles.durationLabel, { color: theme.secondaryText }]}
                      >
                        Total Talk Time
                      </Text>
                      <Text style={[styles.durationValue, { color: theme.text }]}>
                        {formatDuration(totalDuration)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Call History List */}
            {callHistory.length > 0 ? (
              <View style={[styles.historySection, { backgroundColor: theme.inputBg }]}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Recent Calls
                  </Text>
                  <Text style={[styles.sectionCount, { color: theme.secondaryText }]}>
                    {callHistory.length} {callHistory.length === 1 ? "call" : "calls"}
                  </Text>
                </View>

                {callHistory.map((record, index) => (
                  <TouchableOpacity
                    key={record.id}
                    style={[
                      styles.historyItem,
                      {
                        borderBottomColor: theme.itemBorder,
                        borderBottomWidth: index < callHistory.length - 1 ? 0.5 : 0,
                      },
                    ]}
                    onPress={() => handleCallPress(record)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.callIconContainer,
                        { backgroundColor: `${getCallColor(record.type)}15` },
                      ]}
                    >
                      <Ionicons
                        name={getCallIcon(record.type)}
                        size={22}
                        color={getCallColor(record.type)}
                      />
                    </View>

                    <View style={styles.callDetails}>
                      <View style={styles.callHeader}>
                        <Text style={[styles.callType, { color: theme.text }]}>
                          {getCallLabel(record.type)}
                        </Text>
                        {record.duration > 0 && (
                          <Text style={[styles.callDuration, { color: theme.text }]}>
                            {formatDuration(record.duration)}
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.callTime, { color: theme.secondaryText }]}>
                        {formatTimestamp(record.timestamp)}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={theme.secondaryText}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: theme.inputBg }]}>
                <View
                  style={[
                    styles.emptyIconContainer,
                    { backgroundColor: `${theme.accent}15` },
                  ]}
                >
                  <Ionicons name="call-outline" size={48} color={theme.accent} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  No Call History
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.secondaryText }]}>
                  No calls found with this contact in the last 90 days.
                </Text>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.accent }]}
                  onPress={() => makeCall(phone as string)}
                >
                  <Ionicons name="call" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Make First Call</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
    },
    loadingText: {
      fontSize: 16,
      marginTop: 16,
      fontWeight: "500",
    },
    contentLoadingContainer: {
      paddingVertical: 60,
      alignItems: "center",
      justifyContent: "center",
    },
    contentLoadingText: {
      fontSize: 15,
      marginTop: 16,
      fontWeight: "500",
    },
    liveBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 4,
    },
    liveText: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    lastUpdateText: {
      fontSize: 12,
      alignSelf: "center",
    },
    warningIconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 12,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 15,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 32,
      paddingHorizontal: 20,
    },
    divider: {
      width: "80%",
      height: 1,
      backgroundColor: "#E5E5EA",
      marginVertical: 20,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: 12,
      minWidth: 200,
      marginBottom: 12,
    },
    actionButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    secondaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: 12,
      minWidth: 200,
      borderWidth: 2,
      marginBottom: 12,
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    callButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: 12,
      minWidth: 200,
    },
    callButtonText: {
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    contactCard: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      flexDirection: "row",
      alignItems: "center",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    avatarText: {
      color: "#fff",
      fontSize: 28,
      fontWeight: "bold",
    },
    contactInfo: {
      flex: 1,
    },
    contactName: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 4,
    },
    contactPhone: {
      fontSize: 14,
      marginBottom: 12,
    },
    callNowButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      alignSelf: "flex-start",
    },
    callNowButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 6,
    },
    statsContainer: {
      marginBottom: 16,
    },
    statsCard: {
      borderRadius: 16,
      padding: 20,
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 12,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    statItem: {
      alignItems: "center",
      flex: 1,
    },
    statIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: "700",
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      fontWeight: "500",
    },
    statDivider: {
      width: 1,
      backgroundColor: "#E5E5EA",
      marginHorizontal: 8,
    },
    durationCard: {
      borderRadius: 16,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    durationInfo: {
      marginLeft: 12,
      flex: 1,
    },
    durationLabel: {
      fontSize: 13,
      marginBottom: 4,
      fontWeight: "500",
    },
    durationValue: {
      fontSize: 22,
      fontWeight: "700",
    },
    historySection: {
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 16,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
    },
    sectionCount: {
      fontSize: 13,
      fontWeight: "500",
    },
    historyItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    callIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    callDetails: {
      flex: 1,
    },
    callHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    callType: {
      fontSize: 16,
      fontWeight: "600",
    },
    callDuration: {
      fontSize: 15,
      fontWeight: "500",
    },
    callTime: {
      fontSize: 13,
    },
    emptyState: {
      borderRadius: 16,
      padding: 40,
      alignItems: "center",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    emptyIconContainer: {
      width: 96,
      height: 96,
      borderRadius: 48,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 24,
    },
  });