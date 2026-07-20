import React from "react";
import { View } from "react-native";

// Never actually rendered — MainTabs intercepts the tab press and opens the
// full-screen camera modal (root "Scan" screen) instead of switching to this tab.
export default function ScanTabPlaceholder() {
  return <View />;
}
