import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { api } from "../services/api";

const STATUS_COLORS = {
  present: "#16a34a",
  late: "#d97706",
  absent: "#dc2626",
  half_day: "#7c3aed",
};

export default function HistoryScreen() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getHistory()
      .then(setRecords)
      .finally(() => setLoading(false));
  }, []);

  // if (loading) {
  //   return (
  //     <View style={styles.center}>
  //       <ActivityIndicator size="large" color="#2563eb" />
  //     </View>
  //   );
  // }

  return (
    <FlatList
      style={styles.container}
      data={records}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: 16 }}
      ListEmptyComponent={
        <Text style={styles.empty}>No attendance records yet.</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View>
            <Text style={styles.date}>{item.date}</Text>
            <Text style={styles.times}>
              In:{" "}
              {item.check_in_time
                ? new Date(item.check_in_time).toLocaleTimeString()
                : "—"}
              {"  "}
              Out:{" "}
              {item.check_out_time
                ? new Date(item.check_out_time).toLocaleTimeString()
                : "—"}
            </Text>
          </View>
          <Text
            style={[
              styles.status,
              { color: STATUS_COLORS[item.status] || "#333" },
            ]}
          >
            {item.status}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  date: { fontSize: 16, fontWeight: "600" },
  times: { fontSize: 13, color: "#666", marginTop: 2 },
  status: { fontWeight: "700", textTransform: "capitalize" },
});
