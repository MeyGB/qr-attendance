import AsyncStorage from "@react-native-async-storage/async-storage";

// Change this to your backend's address.
// - Physical device: use your computer's LAN IP, e.g. http://192.168.1.10:4000
// - Android emulator: http://10.0.2.2:4000
// - iOS simulator: http://localhost:4000
const BASE_URL = "https://demo.lionkingfc.com/api";

async function getToken() {
  return AsyncStorage.getItem("authToken");
}

async function request(path, { method = "GET", body } = {}) {
  const token = await getToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }
  return data;
}

export const api = {
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password } }),

  checkIn: (token) =>
    request("/attendance/check-in", { method: "POST", body: { token } }),

  checkOut: (token) =>
    request("/attendance/check-out", { method: "POST", body: { token } }),

  getHistory: () => request("/attendance/history"),

  getMe: () => request("/employees/me"),
};

export async function saveSession(token) {
  await AsyncStorage.setItem("authToken", token);
}

export async function clearSession() {
  await AsyncStorage.removeItem("authToken");
}
