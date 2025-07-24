import { colors, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Icons from "phosphor-react-native";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
export default function CustomTabs({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const tabbarIcons: any = {
    index: (isFocused: boolean) => (
      <Icons.HouseIcon
        size={verticalScale(30)}
        color={isFocused ? colors.primary : colors.neutral400}
        weight={isFocused ? "fill" : "regular"}
      />
    ),
    statistics: (isFocused: boolean) => (
      <Icons.ChartBarIcon
        size={verticalScale(30)}
        color={isFocused ? colors.primary : colors.neutral400}
        weight={isFocused ? "fill" : "regular"}
      />
    ),
    wallet: (isFocused: boolean) => (
      <Icons.WallIcon
        size={verticalScale(30)}
        color={isFocused ? colors.primary : colors.neutral400}
        weight={isFocused ? "fill" : "regular"}
      />
    ),
    profile: (isFocused: boolean) => (
      <Icons.UserIcon
        size={verticalScale(30)}
        color={isFocused ? colors.primary : colors.neutral400}
        weight={isFocused ? "fill" : "regular"}
      />
    ),
  };
  return (
    <View style={styles.tabbar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label: any =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            // href={buildHref(route.name, route.params)}
            key={route.name}
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabbarItem}
          >
            {tabbarIcons[route.name] && tabbarIcons[route.name](isFocused)}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabbar: {
    flexDirection: "row",
    width: "100%",
    height: Platform.OS == "ios" ? verticalScale(73) : verticalScale(55),
    backgroundColor: colors.neutral800,
    justifyContent: "space-around",
    alignItems: "center",
    borderTopColor: colors.neutral700,
    borderTopWidth: 1,
  },
  tabbarItem: {
    marginBottom: Platform.OS == "ios" ? spacingY._10 : spacingY._5,
    justifyContent: "center",
    alignItems: "center",
  },
});
