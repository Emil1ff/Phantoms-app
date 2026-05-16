import { Text, View } from 'react-native';

const mockEvents = [
  { id: 'ev1', title: 'Hackathon Opening', date: '2026-05-20', place: 'Main Campus Hall' },
  { id: 'ev2', title: 'AI Workshop', date: '2026-05-22', place: 'Lab 4' },
  { id: 'ev3', title: 'Team Match Night', date: '2026-05-24', place: 'Innovation Space' },
];

export function ClientEventsTab({ styles }: { styles: any }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Events</Text>
      {mockEvents.map(event => (
        <View key={event.id} style={styles.ordersCard}>
          <Text style={styles.ordersTitle}>{event.title}</Text>
          <Text style={styles.ordersText}>{event.date} • {event.place}</Text>
        </View>
      ))}
    </View>
  );
}
