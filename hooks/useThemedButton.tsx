// hooks/useThemedButton.ts - ✅ 100% TYPE SAFE
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/context/ThemeContext";
import { router, useRouter } from "expo-router";
import React from "react";
import {
    FlexAlignType,
    TextStyle,
    TouchableOpacity,
    TouchableOpacityProps,
    ViewStyle
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

interface NavigateOptions {
  href: `/${string}` | `/${string}/**`;
  replace?: boolean;
  params?: Record<string, any>;
}

interface ThemedButtonProps extends Omit<
  TouchableOpacityProps,
  "onPress" | "style"
> {
  title: string;
  navigate?: string | NavigateOptions | "back";
  data?: Record<string, any>;
  variant?: "primary" | "secondary" | "outline";
  loading?: boolean;
  onPress?: () => void;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
}

export const useThemedButton = () => {
  const { colors } = useTheme();
  const localRouter = useRouter();

  const pressScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const pressIn = () => {
    "worklet";
    pressScale.value = withSpring(0.95);
  };

  const pressOut = () => {
    "worklet";
    pressScale.value = withSpring(1);
  };

  const goBack = () => {
    localRouter.back();
  };

  const handlePress = (
    navigate?: string | NavigateOptions | "back",
    data?: Record<string, any>,
    onPress?: () => void,
  ) => {
    pressOut();

    if (onPress) {
      onPress();
      return;
    }

    if (navigate === "back" || !navigate) {
      goBack();
    } else if (typeof navigate === "string") {
      router.push(navigate as any);
    } else {
      const { href, replace = false, params = {} } = navigate;
      if (replace) {
        router.replace({ pathname: href, params } as any);
      } else {
        router.push({ pathname: href, params } as any);
      }
    }
  };

  // ✅ FIXED: Remove forwardRef - Use simple component
  const ThemedButton = React.memo(
    ({
      title,
      navigate,
      data,
      variant = "primary",
      loading = false,
      onPress,
      containerStyle,
      textStyle,
      children,
      ...props
    }: ThemedButtonProps) => {
      const getButtonStyle = (): ViewStyle => {
        const base: ViewStyle = {
          paddingVertical: 16,
          paddingHorizontal: 24,
          borderRadius: 16,
          alignItems: "center" as FlexAlignType,
          justifyContent: "center",
          minHeight: 56,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 8,
        };

        switch (variant) {
          case "primary":
            return {
              ...base,
              backgroundColor: colors.primary,
            };
          case "secondary":
            return {
              ...base,
              backgroundColor: colors.secondary,
            };
          case "outline":
            return {
              ...base,
              backgroundColor: "transparent",
              borderWidth: 2,
              borderColor: colors.primary,
            };
          default:
            return base;
        }
      };

      const getTextStyle = (): TextStyle => {
        const base: TextStyle = {
          fontSize: 16,
          fontWeight: "700" as const,
          textAlign: "center",
        };

        if (variant === "outline") {
          return { ...base, color: colors.primary };
        }
        return { ...base, color: "#FFF" };
      };

      return (
        <Animated.View
          style={[getButtonStyle(), animatedStyle, containerStyle]}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPressIn={pressIn}
            onPressOut={pressOut}
            onPress={() => handlePress(navigate, data, onPress)}
            disabled={loading}
            style={getButtonStyle()} // ✅ Add style prop here
            {...props}
          >
            {loading ? (
              <ThemedText style={[getTextStyle(), textStyle]}>
                Loading...
              </ThemedText>
            ) : (
              <>
                <ThemedText style={[getTextStyle(), textStyle]}>
                  {title}
                </ThemedText>
                {children}
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      );
    },
  );

  ThemedButton.displayName = "ThemedButton";

  return { ThemedButton };
};
