import { HeaderProps } from "@/types";
import React from "react";
import { StyleSheet, View } from "react-native";
import Typo from "./Typo";

const Header = ({ title = "", leftIcon, style }: HeaderProps) => {
  return (
    <View style={[styles.headerContainer, style]}>
      {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
      {title && (
        <Typo
          style={{ textAlign: "center", width: leftIcon ? "82%" : "100%" }}
          size={22}
          fontWeight={"600"}
        >
          {title}
        </Typo>
      )}
    </View>
  );
};

export default Header;
const styles = StyleSheet.create({
  headerContainer: {
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
  },
  leftIcon: {
    alignSelf: "flex-start",
  },
});
