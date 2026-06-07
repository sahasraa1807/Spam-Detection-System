import { useState } from "react";
import { Platform } from "react-native";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import axios from "axios";

const LABEL_MAP: Record<
  string,
  { label: string; emoji: string; color: string }
> = {
  ham: { label: "Safe Message", emoji: "✅", color: "#15803d" },
  spam: { label: "Spam Detected", emoji: "❌", color: "#dc2626" },
  smishing: { label: "Fraud Alert", emoji: "⚠️", color: "#ea580c" },
};

export default function Index() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<number | string>("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("message");
  const resultInfo =
    typeof result === "string" ? (LABEL_MAP[result] ?? null) : null;

  const confidencePct = confidence !== null ? (Math.min(confidence * 50 + 50, 100)).toFixed(1) : "0.0";

  const API_URL =
    Platform.OS === "android"
      ? (process.env.EXPO_PUBLIC_ANDROIDAPI ?? "")
      : (process.env.EXPO_PUBLIC_IOSAPI ?? "");

  const handlePredict = async () => {
    if (!text) {
      setResult("Enter some text");
      setConfidence(null);
      return;
    }

    try {
      setLoading(true);
      setResult("");
      setConfidence(null);

      const res = await axios.post(API_URL, {
        text: text,
        type: type,
      });

      setResult(res.data.prediction);
      setConfidence(res.data.confidence !== undefined ? res.data.confidence : null);
    } catch (error: any) {
      console.log("ERROR:", error);
      setResult("Error: " + error.message);
      setConfidence(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spam Detection</Text>

      <View style={styles.selectorContainer}>
        <TouchableOpacity
          style={[
            styles.selectorButton,
            type === "message" && styles.activeButton,
          ]}
          onPress={() => setType("message")}
        >
          <Text
            style={[
              styles.selectorText,
              type === "message" && styles.activeText,
            ]}
          >
            Message
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.selectorButton,
            type === "email" && styles.activeButton,
          ]}
          onPress={() => setType("email")}
        >
          <Text
            style={[styles.selectorText, type === "email" && styles.activeText]}
          >
            Email
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder={`Enter your ${type}...`}
        value={text}
        onChangeText={setText}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handlePredict}>
        <Text style={styles.buttonText}>Predict</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" />}

      {resultInfo ? (
        <View style={styles.resultContainer}>
          <View
            style={[
              styles.resultBox,
              {
                borderColor: resultInfo.color,
                backgroundColor: resultInfo.color + "18",
              },
            ]}
          >
            <Text style={[styles.resultEmoji]}>{resultInfo.emoji}</Text>
            <Text style={[styles.resultLabel, { color: resultInfo.color }]}>
              {resultInfo.label}
            </Text>
          </View>

          {confidence !== null && (
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceText}>
                Model Confidence: {confidencePct}%
              </Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: resultInfo.color,
                      width: `${confidencePct}%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </View>
      ) : result === "Enter some text" ? (
        <Text style={styles.resultError}>Please enter a message first.</Text>
      ) : result !== "" ? (
        <Text style={styles.resultError}>
          Error: could not classify message.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#dbeafe",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  selectorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },
  selectorButton: {
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: "#bfdbfe",
  },
  activeButton: {
    backgroundColor: "#2563eb",
  },
  selectorText: {
    color: "#1e3a8a",
    fontWeight: "600",
  },
  activeText: {
    color: "#fff",
  },

  input: {
    borderWidth: 1,
    borderColor: "#93c5fd",
    padding: 15,
    borderRadius: 10,
    height: 120,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  resultBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
  },
  resultEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  resultLabel: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  resultError: {
    marginTop: 20,
    fontSize: 15,
    textAlign: "center",
    color: "#6b7280",
  },
  resultContainer: {
    marginTop: 20,
  },
  confidenceContainer: {
    marginTop: 15,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
    marginBottom: 6,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
});
