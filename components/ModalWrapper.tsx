import { colors, spacingY } from "@/constants/theme";
import { ModalWrapperProps } from "@/types";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
const isIos = Platform.OS == "ios";
const ModalWrapper = ({
  style,
  children,
  bg = colors.neutral800,
}: ModalWrapperProps) => {
  return (
    <View
      style={[styles.container, style, { backgroundColor: bg }, style && style]}
    >
      {children}
    </View>
  );
};

export default ModalWrapper;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: isIos ? spacingY._15 : 20,
    paddingBottom: isIos ? spacingY._20 : spacingY._10,
  },
});
