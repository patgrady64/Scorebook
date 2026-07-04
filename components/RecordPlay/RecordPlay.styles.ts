import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  mBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20 },

  modalCountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  countGroup: { alignItems: 'center' },
  countLabel: { fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  countOp: { padding: 8 },
  countOpTxt: { fontSize: 20, color: '#007AFF', fontWeight: 'bold' },
  countDisplayNum: {
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: 20,
    textAlign: 'center',
  },
  smallGhostBtn: { backgroundColor: '#333', padding: 8, borderRadius: 10 },
  smallGhostTxt: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  displayArea: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  mBigInText: { fontSize: 24, fontWeight: 'bold', color: '#007AFF' },
  topActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 10,
  },
  actionBtn: {
    padding: 10,
    backgroundColor: '#eef6ff',
    borderRadius: 8,
    minWidth: 46,
    alignItems: 'center',
  },
  actionBtnTxt: { color: '#007AFF', fontWeight: 'bold' },
  bottomKeys: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  numpad: { flex: 3 },
  numGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  numBtn: {
    width: '31%',
    padding: 12,
    backgroundColor: '#eee',
    borderRadius: 8,
    alignItems: 'center',
  },
  numBtnTxt: { fontWeight: 'bold', fontSize: 18 },
  flightpad: { flex: 1, gap: 5 },
  flightBtn: {
    flex: 1,
    backgroundColor: '#fff0f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flightBtnTxt: { color: '#FF3B30', fontWeight: 'bold' },
  recordBtn: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  recordBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});

export default styles;
