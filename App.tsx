import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Todo = {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
};

type Filter = 'all' | 'active' | 'done';

const STORAGE_KEY = 'todos:v1';

export default function App() {
  return (
    <SafeAreaProvider>
      <TodoScreen />
    </SafeAreaProvider>
  );
}

function TodoScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [loaded, setLoaded] = useState(false);

  // Load saved todos once on startup.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setTodos(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Persist whenever the list changes (after the initial load).
  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(todos)).catch(() => {});
  }, [todos, loaded]);

  const addTodo = () => {
    const title = text.trim();
    if (!title) return;
    setTodos((prev) => [
      { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, title, done: false, createdAt: Date.now() },
      ...prev,
    ]);
    setText('');
  };

  const toggleTodo = (id: string) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const deleteTodo = (id: string) => setTodos((prev) => prev.filter((t) => t.id !== id));

  const clearCompleted = () => setTodos((prev) => prev.filter((t) => !t.done));

  const visible = useMemo(() => {
    if (filter === 'active') return todos.filter((t) => !t.done);
    if (filter === 'done') return todos.filter((t) => t.done);
    return todos;
  }, [todos, filter]);

  const remaining = todos.filter((t) => !t.done).length;
  const hasCompleted = todos.some((t) => t.done);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.title}>My Todos</Text>
        <Text style={styles.subtitle}>
          {remaining} {remaining === 1 ? 'task' : 'tasks'} left
        </Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="What needs to be done?"
            placeholderTextColor="#9aa0a6"
            value={text}
            onChangeText={setText}
            onSubmitEditing={addTodo}
            returnKeyType="done"
          />
          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            onPress={addTodo}
            accessibilityRole="button"
            accessibilityLabel="Add todo"
          >
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        <View style={styles.filters}>
          {(['all', 'active', 'done'] as Filter[]).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f[0].toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={visible.length === 0 && styles.emptyContainer}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {loaded ? (filter === 'all' ? 'No todos yet. Add one above!' : 'Nothing here.') : 'Loading…'}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Pressable
                style={styles.itemMain}
                onPress={() => toggleTodo(item.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: item.done }}
              >
                <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
                  {item.done && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.itemText, item.done && styles.itemTextDone]}>{item.title}</Text>
              </Pressable>
              <Pressable
                onPress={() => deleteTodo(item.id)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${item.title}`}
              >
                <Text style={styles.delete}>✕</Text>
              </Pressable>
            </View>
          )}
        />

        {hasCompleted && (
          <Pressable onPress={clearCompleted} style={styles.clearButton}>
            <Text style={styles.clearText}>Clear completed</Text>
          </Pressable>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const ACCENT = '#4f46e5';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f6fa' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  title: { fontSize: 32, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 15, color: '#6b7280', marginTop: 4, marginBottom: 20 },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  addButton: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  pressed: { opacity: 0.8 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  filterChipActive: { backgroundColor: ACCENT },
  filterText: { color: '#374151', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
  },
  itemMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: ACCENT },
  checkmark: { color: '#fff', fontWeight: '700', fontSize: 14 },
  itemText: { flex: 1, fontSize: 16, color: '#111827' },
  itemTextDone: { color: '#9ca3af', textDecorationLine: 'line-through' },
  delete: { fontSize: 18, color: '#ef4444', paddingLeft: 12 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  empty: { textAlign: 'center', color: '#9ca3af', fontSize: 16 },
  clearButton: { alignSelf: 'center', paddingVertical: 14 },
  clearText: { color: ACCENT, fontWeight: '600' },
});
