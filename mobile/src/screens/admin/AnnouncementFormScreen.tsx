import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import type { RootStackParamList } from "../../types";
import { api } from "../../services/api";
import { colors, radius, spacing } from "../../theme/theme";
import Button from "../../components/Button";

type Nav = NativeStackNavigationProp<RootStackParamList, "AnnouncementForm">;
type FormRoute = RouteProp<RootStackParamList, "AnnouncementForm">;

export default function AnnouncementFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<FormRoute>();
  const insets = useSafeAreaInsets();
  const editing = route.params?.announcement ?? null;
  const isEdit = Boolean(editing);

  const [title, setTitle] = useState(editing?.title ?? "");
  const [body, setBody] = useState(editing?.body ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert("Missing info", "Please add both a title and a message.");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && editing) {
        await api.updateAnnouncement(editing.id, {
          title: title.trim(),
          body: body.trim(),
        });
      } else {
        await api.createAnnouncement({
          title: title.trim(),
          body: body.trim(),
        });
      }
      navigation.goBack();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      Alert.alert("Couldn't save", message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEdit ? "Edit Announcement" : "New Announcement"}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Office closed for public holiday"
            placeholderTextColor={colors.inkFaint}
          />
        </View>

        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={styles.textArea}
            value={body}
            onChangeText={setBody}
            placeholder="Write the announcement details..."
            placeholderTextColor={colors.inkFaint}
            multiline
            numberOfLines={8}
          />
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <Button
            label={
              saving
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Post Announcement"
            }
            onPress={handleSave}
            disabled={saving}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backButton: { padding: 4 },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: colors.ink,
  },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },

  fieldWrap: { gap: 6 },
  label: { fontSize: 13, color: colors.inkSoft, fontWeight: "600" },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.ink,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.ink,
    minHeight: 160,
    textAlignVertical: "top",
  },
});
