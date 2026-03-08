// components/FunnyScrollView.tsx
import React, { useState } from "react";
import { RefreshControl, ScrollView, ScrollViewProps } from "react-native";

interface FunnyScrollViewProps extends ScrollViewProps {
  onRefreshData: () => Promise<void>;
}

export default function FunnyScrollView({
  onRefreshData,
  children,
  ...props
}: FunnyScrollViewProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    // 1. Start the native spinner
    setRefreshing(true);
    const startTime = Date.now();

    // 2. Random Delay (Between 3 to 5 seconds)
    const targetDelay = Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000;

    try {
      // 3. Fetch the actual database data
      await onRefreshData();
    } catch (error) {
      console.error("Refresh Error:", error);
    }

    // 4. Force the spinner to wait if the data loaded too quickly
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < targetDelay) {
      await new Promise((resolve) =>
        setTimeout(resolve, targetDelay - elapsedTime),
      );
    }

    // 5. Stop the native spinner
    setRefreshing(false);
  };

  return (
    <ScrollView
      {...props}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          // Default OS Spinner colors (Blue to match your theme)
          colors={["#3b82f6"]} // Android spinner color
          tintColor={"#3b82f6"} // iOS spinner color
        />
      }
    >
      {children}
    </ScrollView>
  );
}
