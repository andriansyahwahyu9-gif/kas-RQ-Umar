import { 
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  getDoc, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Transaction, Member, MemberDuesRecord, PengajianConfig, WeeklyDuty } from '../types';
import { DEFAULT_CONFIG, INITIAL_MEMBERS, INITIAL_TRANSACTIONS, INITIAL_WEEKLY_DUTIES } from '../data/initialData';

const CONFIG_DOC_PATH = 'main';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 1. Subscribe to Config
export function subscribeConfig(onData: (config: PengajianConfig) => void) {
  const docRef = doc(db, 'config', CONFIG_DOC_PATH);
  
  return onSnapshot(docRef, async (snapshot) => {
    if (snapshot.exists()) {
      onData(snapshot.data() as PengajianConfig);
    } else {
      // Seed default config
      try {
        await setDoc(docRef, DEFAULT_CONFIG);
      } catch (err) {
        console.error('Error seeding initial config:', err);
      }
      onData(DEFAULT_CONFIG);
    }
  });
}

// 2. Subscribe to Transactions
export function subscribeTransactions(onData: (transactions: Transaction[]) => void) {
  const colRef = collection(db, 'transactions');

  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty) {
      // Check if already seeded to prevent re-seeding when user deletes all transactions
      try {
        const configSnap = await getDoc(doc(db, 'config', CONFIG_DOC_PATH));
        const configData = configSnap.data();
        if (!configData?.isSeeded) {
          const docsSnap = await getDocs(colRef);
          if (docsSnap.empty) {
            const batch = writeBatch(db);
            INITIAL_TRANSACTIONS.forEach((trx) => {
              batch.set(doc(db, 'transactions', trx.id), trx);
            });
            batch.set(doc(db, 'config', CONFIG_DOC_PATH), { isSeeded: true }, { merge: true });
            await batch.commit();
            onData(INITIAL_TRANSACTIONS);
            return;
          }
        }
      } catch (err) {
        console.error('Error checking or seeding initial transactions:', err);
      }
    }

    const items: Transaction[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as Transaction);
    });

    // Sort descending by tanggal then createdAt
    items.sort((a, b) => {
      if (b.tanggal !== a.tanggal) {
        return b.tanggal.localeCompare(a.tanggal);
      }
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    onData(items);
  });
}

// 3. Subscribe to Members
export function subscribeMembers(onData: (members: Member[]) => void) {
  const colRef = collection(db, 'members');

  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty) {
      try {
        const configSnap = await getDoc(doc(db, 'config', CONFIG_DOC_PATH));
        const configData = configSnap.data();
        if (!configData?.isMembersSeeded) {
          const docsSnap = await getDocs(colRef);
          if (docsSnap.empty) {
            const batch = writeBatch(db);
            INITIAL_MEMBERS.forEach((m) => {
              batch.set(doc(db, 'members', m.id), m);
            });
            batch.set(doc(db, 'config', CONFIG_DOC_PATH), { isMembersSeeded: true }, { merge: true });
            await batch.commit();
            onData(INITIAL_MEMBERS);
            return;
          }
        }
      } catch (err) {
        console.error('Error checking or seeding initial members:', err);
      }
    }

    const items: Member[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as Member);
    });

    items.sort((a, b) => a.nama.localeCompare(b.nama));
    onData(items);
  });
}

// 4. Subscribe to Dues Records
export function subscribeDuesRecords(onData: (dues: MemberDuesRecord[]) => void) {
  const colRef = collection(db, 'duesRecords');

  return onSnapshot(colRef, (snapshot) => {
    const items: MemberDuesRecord[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as MemberDuesRecord);
    });

    items.sort((a, b) => b.tanggalBayar.localeCompare(a.tanggalBayar));
    onData(items);
  });
}

// 5. Subscribe to Weekly Duties (MC, Kultum, Khutbah)
export function subscribeWeeklyDuties(onData: (duties: WeeklyDuty[]) => void) {
  const colRef = collection(db, 'weeklyDuties');

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        try {
          const configSnap = await getDoc(doc(db, 'config', CONFIG_DOC_PATH));
          const configData = configSnap.data();
          if (!configData?.isWeeklyDutiesSeeded) {
            const docsSnap = await getDocs(colRef);
            if (docsSnap.empty) {
              const batch = writeBatch(db);
              INITIAL_WEEKLY_DUTIES.forEach((duty) => {
                batch.set(doc(db, 'weeklyDuties', duty.id), duty);
              });
              batch.set(
                doc(db, 'config', CONFIG_DOC_PATH),
                { isWeeklyDutiesSeeded: true },
                { merge: true }
              );
              await batch.commit();
              onData(INITIAL_WEEKLY_DUTIES);
              return;
            }
          }
        } catch (err) {
          console.error('Error checking or seeding initial weekly duties:', err);
        }
      }

      const items: WeeklyDuty[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as WeeklyDuty);
      });

      items.sort((a, b) => {
        if (a.bulan !== b.bulan) return b.bulan.localeCompare(a.bulan);
        if (a.pekanKe !== b.pekanKe) return a.pekanKe - b.pekanKe;
        return a.tanggal.localeCompare(b.tanggal);
      });

      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'weeklyDuties');
    }
  );
}

// === CRUD FUNCTIONS ===

export async function saveConfig(newConfig: PengajianConfig) {
  const docRef = doc(db, 'config', CONFIG_DOC_PATH);
  await setDoc(docRef, newConfig, { merge: true });
}

export async function saveTransaction(trx: Transaction) {
  const docRef = doc(db, 'transactions', trx.id);
  await setDoc(docRef, trx);
}

export async function deleteTransaction(id: string) {
  const docRef = doc(db, 'transactions', id);
  await deleteDoc(docRef);
}

export async function deleteAllTransactions() {
  const colRef = collection(db, 'transactions');
  const snap = await getDocs(colRef);
  if (!snap.empty) {
    const batch = writeBatch(db);
    snap.forEach((docItem) => {
      batch.delete(docItem.ref);
    });
    // Mark as seeded so auto-seeding won't re-trigger
    const configRef = doc(db, 'config', CONFIG_DOC_PATH);
    batch.set(configRef, { isSeeded: true }, { merge: true });
    await batch.commit();
  }
}

export async function saveMember(member: Member) {
  const docRef = doc(db, 'members', member.id);
  await setDoc(docRef, member);
}

export async function deleteMember(id: string) {
  const docRef = doc(db, 'members', id);
  await deleteDoc(docRef);
}

export async function recordDuesAndTransaction(
  duesData: Omit<MemberDuesRecord, 'id'>, 
  memberName: string
) {
  const batch = writeBatch(db);

  const duesId = `dues-${Date.now()}`;
  const duesRef = doc(db, 'duesRecords', duesId);
  const duesRecord: MemberDuesRecord = {
    ...duesData,
    id: duesId,
  };
  batch.set(duesRef, duesRecord);

  const trxId = `trx-dues-${Date.now()}`;
  const trxRef = doc(db, 'transactions', trxId);
  const newTrx: Transaction = {
    id: trxId,
    tanggal: duesData.tanggalBayar,
    jenis: 'pemasukan',
    kategori: 'Iuran Anggota',
    nominal: duesData.nominal,
    keterangan: duesData.catatan || `Iuran kas periode ${duesData.periode} - ${memberName}`,
    pembayarAtauPenerima: memberName,
    metode: 'Tunai',
    createdAt: Date.now(),
  };
  batch.set(trxRef, newTrx);

  await batch.commit();
}

export async function saveWeeklyDuty(duty: WeeklyDuty) {
  try {
    const docRef = doc(db, 'weeklyDuties', duty.id);
    await setDoc(docRef, duty);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `weeklyDuties/${duty.id}`);
  }
}

export async function saveWeeklyDutiesBatch(duties: WeeklyDuty[]) {
  if (!duties.length) return;
  try {
    const batch = writeBatch(db);
    duties.forEach((duty) => {
      batch.set(doc(db, 'weeklyDuties', duty.id), duty);
    });
    batch.set(
      doc(db, 'config', CONFIG_DOC_PATH),
      { isWeeklyDutiesSeeded: true },
      { merge: true }
    );
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'weeklyDuties');
  }
}

export async function deleteWeeklyDuty(id: string) {
  try {
    const docRef = doc(db, 'weeklyDuties', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `weeklyDuties/${id}`);
  }
}

export async function importAllData(data: {
  config?: PengajianConfig;
  transactions?: Transaction[];
  members?: Member[];
  duesRecords?: MemberDuesRecord[];
  weeklyDuties?: WeeklyDuty[];
}) {
  if (data.config) {
    await saveConfig(data.config);
  }

  if (Array.isArray(data.transactions)) {
    const trxSnap = await getDocs(collection(db, 'transactions'));
    const batchDelete = writeBatch(db);
    trxSnap.forEach((d) => batchDelete.delete(d.ref));
    await batchDelete.commit();

    const batchAdd = writeBatch(db);
    data.transactions.forEach((t) => {
      batchAdd.set(doc(db, 'transactions', t.id), t);
    });
    await batchAdd.commit();
  }

  if (Array.isArray(data.members)) {
    const memSnap = await getDocs(collection(db, 'members'));
    const batchDelete = writeBatch(db);
    memSnap.forEach((d) => batchDelete.delete(d.ref));
    await batchDelete.commit();

    const batchAdd = writeBatch(db);
    data.members.forEach((m) => {
      batchAdd.set(doc(db, 'members', m.id), m);
    });
    await batchAdd.commit();
  }

  if (Array.isArray(data.duesRecords)) {
    const duesSnap = await getDocs(collection(db, 'duesRecords'));
    const batchDelete = writeBatch(db);
    duesSnap.forEach((d) => batchDelete.delete(d.ref));
    await batchDelete.commit();

    const batchAdd = writeBatch(db);
    data.duesRecords.forEach((d) => {
      batchAdd.set(doc(db, 'duesRecords', d.id), d);
    });
    await batchAdd.commit();
  }

  if (Array.isArray(data.weeklyDuties)) {
    const dutiesSnap = await getDocs(collection(db, 'weeklyDuties'));
    const batchDelete = writeBatch(db);
    dutiesSnap.forEach((d) => batchDelete.delete(d.ref));
    await batchDelete.commit();

    const batchAdd = writeBatch(db);
    data.weeklyDuties.forEach((duty) => {
      batchAdd.set(doc(db, 'weeklyDuties', duty.id), duty);
    });
    await batchAdd.commit();
  }
}

export async function resetDataToDefault() {
  const collectionsToClear = ['transactions', 'members', 'duesRecords', 'weeklyDuties'];

  for (const colName of collectionsToClear) {
    const snap = await getDocs(collection(db, colName));
    const batch = writeBatch(db);
    snap.forEach((docItem) => batch.delete(docItem.ref));
    await batch.commit();
  }

  await setDoc(doc(db, 'config', CONFIG_DOC_PATH), {
    ...DEFAULT_CONFIG,
    isSeeded: true,
    isMembersSeeded: true,
    isWeeklyDutiesSeeded: true,
  });

  const batch = writeBatch(db);
  INITIAL_TRANSACTIONS.forEach((t) => {
    batch.set(doc(db, 'transactions', t.id), t);
  });
  INITIAL_MEMBERS.forEach((m) => {
    batch.set(doc(db, 'members', m.id), m);
  });
  INITIAL_WEEKLY_DUTIES.forEach((duty) => {
    batch.set(doc(db, 'weeklyDuties', duty.id), duty);
  });
  await batch.commit();
}
