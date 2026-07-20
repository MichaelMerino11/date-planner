import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator, RefreshControl
} from 'react-native'
import { placesService } from '../../src/services/api'
import { useAuthStore } from '../../src/store/authStore'

const CATEGORIES = [
  { key: 'restaurante', label: '🍽️ Restaurante' },
  { key: 'cafe', label: '☕ Café' },
  { key: 'parque', label: '🌳 Parque' },
  { key: 'cine', label: '🎬 Cine' },
  { key: 'playa', label: '🏖️ Playa' },
  { key: 'museo', label: '🏛️ Museo' },
  { key: 'otro', label: '📍 Otro' },
]

interface Place {
  id: string
  name: string
  address: string
  category: string
  added_by: string
  added_by_name: string
}

export default function PlacesScreen() {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [category, setCategory] = useState('otro')
  const [saving, setSaving] = useState(false)
  const { user } = useAuthStore()

  const fetchPlaces = async () => {
    try {
      const res = await placesService.getAll()
      setPlaces(res.data)
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los lugares')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPlaces()
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchPlaces()
  }, [])

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es requerido')
      return
    }
    setSaving(true)
    try {
      const res = await placesService.create({ name, address, category })
      setPlaces(prev => [res.data, ...prev])
      setName('')
      setAddress('')
      setCategory('otro')
      setModalVisible(false)
    } catch {
      Alert.alert('Error', 'No se pudo agregar el lugar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (id: string, placeName: string) => {
    Alert.alert(
      'Eliminar lugar',
      `¿Eliminar "${placeName}" de la lista?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await placesService.delete(id)
              setPlaces(prev => prev.filter(p => p.id !== id))
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el lugar')
            }
          }
        }
      ]
    )
  }

  const getCategoryEmoji = (cat: string) => {
    return CATEGORIES.find(c => c.key === cat)?.label.split(' ')[0] || '📍'
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E91E8C" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lugares 📍</Text>
        <Text style={styles.headerSub}>{places.length} lugares en tu lista</Text>
      </View>

      <FlatList
        data={places}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E91E8C']} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🗺️</Text>
            <Text style={styles.emptyTitle}>Sin lugares aún</Text>
            <Text style={styles.emptyDesc}>Agrega lugares que quieran visitar juntos</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onLongPress={() => handleDelete(item.id, item.name)}
            activeOpacity={0.8}
          >
            <View style={styles.cardEmoji}>
              <Text style={styles.emojiText}>{getCategoryEmoji(item.category)}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.name}</Text>
              {item.address ? <Text style={styles.cardAddress}>{item.address}</Text> : null}
              <Text style={styles.cardAdded}>
                Agregado por {item.added_by === user?.id ? 'ti' : item.added_by_name}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo lugar</Text>

            <Text style={styles.label}>Nombre del lugar</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Café Mosaico"
              placeholderTextColor="#C9A0B0"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Dirección (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: González Suárez, Quito"
              placeholderTextColor="#C9A0B0"
              value={address}
              onChangeText={setAddress}
            />

            <Text style={styles.label}>Categoría</Text>
            <View style={styles.categories}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.catChip, category === cat.key && styles.catChipActive]}
                  onPress={() => setCategory(cat.key)}
                >
                  <Text style={[styles.catChipText, category === cat.key && styles.catChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleCreate}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveButtonText}>Agregar lugar</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F3' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF0F3' },
  header: {
    paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    shadowColor: '#C2185B', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3
  },
  headerTitle: { fontFamily: 'Nunito_700Bold', fontSize: 28, color: '#C2185B' },
  headerSub: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: '#AD7090', marginTop: 2 },
  list: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    shadowColor: '#C2185B', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2
  },
  cardEmoji: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#FFF0F3', justifyContent: 'center', alignItems: 'center',
    marginRight: 14
  },
  emojiText: { fontSize: 24 },
  cardInfo: { flex: 1 },
  cardName: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#3D1A2E' },
  cardAddress: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: '#AD7090', marginTop: 2 },
  cardAdded: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: '#C9A0B0', marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontFamily: 'Nunito_700Bold', fontSize: 20, color: '#C2185B', marginBottom: 8 },
  emptyDesc: { fontFamily: 'Nunito_400Regular', fontSize: 15, color: '#AD7090', textAlign: 'center' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#E91E8C', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#E91E8C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6
  },
  fabText: { fontSize: 32, color: '#fff', lineHeight: 36 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(61,26,46,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 40
  },
  modalTitle: { fontFamily: 'Nunito_700Bold', fontSize: 22, color: '#C2185B', marginBottom: 20 },
  label: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#7D3C5E', marginBottom: 6 },
  input: {
    backgroundColor: '#FFF0F3', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: 'Nunito_400Regular', fontSize: 15,
    color: '#3D1A2E', marginBottom: 16,
    borderWidth: 1, borderColor: '#F8C8D8'
  },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#FFF0F3',
    borderWidth: 1, borderColor: '#F8C8D8'
  },
  catChipActive: { backgroundColor: '#E91E8C', borderColor: '#E91E8C' },
  catChipText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#AD7090' },
  catChipTextActive: { color: '#fff' },
  saveButton: {
    backgroundColor: '#E91E8C', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 12
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#fff' },
  cancelButton: { alignItems: 'center', paddingVertical: 8 },
  cancelButtonText: { fontFamily: 'Nunito_400Regular', fontSize: 15, color: '#AD7090' }
})