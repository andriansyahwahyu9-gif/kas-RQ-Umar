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
import { db, auth } from '../lib/firebase';
import { Transaction, Member, MemberDuesRecord, PengajianConfig, WeeklyDuty, HafalanRecord, MasterLoginRecord } from '../types';
import { DEFAULT_CONFIG, INITIAL_MEMBERS, INITIAL_TRANSACTIONS, INITIAL_WEEKLY_DUTIES, INITIAL_HAFALAN } from '../data/initialData';

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
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const cleaned: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  });
  return cleaned as T;
}

// 1. Subscribe to Config
export function subscribeConfig(onData: (config: PengajianConfig) => void) {
  const docRef = doc(db, 'config', CONFIG_DOC_PATH);

  return onSnapshot(
    docRef,
    async (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as PengajianConfig);
      } else {
        try {
          await setDoc(docRef, stripUndefined(DEFAULT_CONFIG), { merge: true });
        } catch (err) {
          console.error('Error seeding initial config:', err);
        }
        onData(DEFAULT_CONFIG);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `config/${CONFIG_DOC_PATH}`);
    }
  );
}

// 2. Subscribe to Transactions
export function subscribeTransactions(onData: (transactions: Transaction[]) => void) {
  const colRef = collection(db, 'transactions');

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        try {
          const configRef = doc(db, 'config', CONFIG_DOC_PATH);
          const configSnap = await getDoc(configRef);
          const configData = configSnap.data();
          if (!configData?.isSeeded) {
            const docsSnap = await getDocs(colRef);
            if (docsSnap.empty) {
              const batch = writeBatch(db);
              INITIAL_TRANSACTIONS.forEach((trx) => {
                batch.set(doc(db, 'transactions', trx.id), stripUndefined(trx));
              });
              const configUpdate = configSnap.exists()
                ? { isSeeded: true }
                : { ...DEFAULT_CONFIG, isSeeded: true };
              batch.set(configRef, configUpdate, { merge: true });
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

      items.sort((a, b) => {
        if (b.tanggal !== a.tanggal) {
          return b.tanggal.localeCompare(a.tanggal);
        }
        return (b.createdAt || 0) - (a.createdAt || 0);
      });

      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    }
  );
}

// 3. Subscribe to Members
export function subscribeMembers(onData: (members: Member[]) => void) {
  const colRef = collection(db, 'members');

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        try {
          const configRef = doc(db, 'config', CONFIG_DOC_PATH);
          const configSnap = await getDoc(configRef);
          const configData = configSnap.data();
          if (!configData?.isMembersSeeded) {
            const docsSnap = await getDocs(colRef);
            if (docsSnap.empty) {
              const batch = writeBatch(db);
              INITIAL_MEMBERS.forEach((m) => {
                batch.set(doc(db, 'members', m.id), stripUndefined(m));
              });
              const configUpdate = configSnap.exists()
                ? { isMembersSeeded: true }
                : { ...DEFAULT_CONFIG, isMembersSeeded: true };
              batch.set(configRef, configUpdate, { merge: true });
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
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'members');
    }
  );
}

// 4. Subscribe to Dues Records
export function subscribeDuesRecords(onData: (dues: MemberDuesRecord[]) => void) {
  const colRef = collection(db, 'duesRecords');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: MemberDuesRecord[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as MemberDuesRecord);
      });

      items.sort((a, b) => b.tanggalBayar.localeCompare(a.tanggalBayar));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'duesRecords');
    }
  );
}

// 5. Subscribe to Weekly Duties (MC, Kultum, Khutbah)
export function subscribeWeeklyDuties(onData: (duties: WeeklyDuty[]) => void) {
  const colRef = collection(db, 'weeklyDuties');

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        try {
          const configRef = doc(db, 'config', CONFIG_DOC_PATH);
          const configSnap = await getDoc(configRef);
          const configData = configSnap.data();
          if (!configData?.isWeeklyDutiesSeeded) {
            const docsSnap = await getDocs(colRef);
            if (docsSnap.empty) {
              const batch = writeBatch(db);
              INITIAL_WEEKLY_DUTIES.forEach((duty) => {
                batch.set(doc(db, 'weeklyDuties', duty.id), stripUndefined(duty));
              });
              const configUpdate = configSnap.exists()
                ? { isWeeklyDutiesSeeded: true }
                : { ...DEFAULT_CONFIG, isWeeklyDutiesSeeded: true };
              batch.set(configRef, configUpdate, { merge: true });
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

// 6. Subscribe to Hafalan Records
export function subscribeHafalanRecords(onData: (records: HafalanRecord[]) => void) {
  const colRef = collection(db, 'hafalanRecords');

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        try {
          const configRef = doc(db, 'config', CONFIG_DOC_PATH);
          const configSnap = await getDoc(configRef);
          const configData = configSnap.data();
          if (!configData?.isHafalanSeeded) {
            const docsSnap = await getDocs(colRef);
            if (docsSnap.empty) {
              const batch = writeBatch(db);
              INITIAL_HAFALAN.forEach((item) => {
                batch.set(doc(db, 'hafalanRecords', item.id), stripUndefined(item));
              });
              const configUpdate = configSnap.exists()
                ? { isHafalanSeeded: true }
                : { ...DEFAULT_CONFIG, isHafalanSeeded: true };
              batch.set(configRef, configUpdate, { merge: true });
              await batch.commit();
              onData(INITIAL_HAFALAN);
              return;
            }
          }
        } catch (err) {
          console.error('Error checking or seeding initial hafalan records:', err);
        }
      }

      const items: HafalanRecord[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as HafalanRecord);
      });

      items.sort((a, b) => {
        if (b.tanggal !== a.tanggal) return b.tanggal.localeCompare(a.tanggal);
        return (b.createdAt || 0) - (a.createdAt || 0);
      });

      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'hafalanRecords');
    }
  );
}

// 7. Subscribe to Master Logins
export function subscribeMasterLogins(onData: (records: MasterLoginRecord[]) => void) {
  const colRef = collection(db, 'masterLogins');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: MasterLoginRecord[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as MasterLoginRecord);
      });

      items.sort((a, b) => a.loginId.localeCompare(b.loginId));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'masterLogins');
    }
  );
}

// === CRUD FUNCTIONS ===

export async function saveConfig(newConfig: PengajianConfig) {
  try {
    const docRef = doc(db, 'config', CONFIG_DOC_PATH);
    await setDoc(docRef, stripUndefined(newConfig), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `config/${CONFIG_DOC_PATH}`);
  }
}

export async function saveTransaction(trx: Transaction) {
  try {
    const docRef = doc(db, 'transactions', trx.id);
    await setDoc(docRef, stripUndefined(trx));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `transactions/${trx.id}`);
  }
}

export async function deleteTransaction(id: string) {
  try {
    const docRef = doc(db, 'transactions', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
  }
}

export async function deleteAllTransactions() {
  try {
    const colRef = collection(db, 'transactions');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.forEach((docItem) => {
        batch.delete(docItem.ref);
      });
      const configRef = doc(db, 'config', CONFIG_DOC_PATH);
      batch.set(configRef, { isSeeded: true }, { merge: true });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'transactions');
  }
}

export async function saveMember(member: Member) {
  try {
    const docRef = doc(db, 'members', member.id);
    await setDoc(docRef, stripUndefined(member));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `members/${member.id}`);
  }
}

export async function deleteMember(id: string) {
  try {
    const docRef = doc(db, 'members', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `members/${id}`);
  }
}

export async function recordDuesAndTransaction(
  duesData: Omit<MemberDuesRecord, 'id'>,
  memberName: string
) {
  try {
    const batch = writeBatch(db);
    const now = Date.now();

    const duesId = `dues-${now}`;
    const duesRef = doc(db, 'duesRecords', duesId);
    const duesRecord: MemberDuesRecord = {
      ...duesData,
      id: duesId,
    };
    batch.set(duesRef, stripUndefined(duesRecord));

    const trxId = `trx-dues-${now}`;
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
      createdAt: now,
    };
    batch.set(trxRef, stripUndefined(newTrx));

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'duesRecords');
  }
}

export async function saveWeeklyDuty(duty: WeeklyDuty) {
  try {
    const docRef = doc(db, 'weeklyDuties', duty.id);
    await setDoc(docRef, stripUndefined(duty));
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

export async function saveHafalanRecord(record: HafalanRecord) {
  try {
    const docRef = doc(db, 'hafalanRecords', record.id);
    await setDoc(docRef, stripUndefined(record));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `hafalanRecords/${record.id}`);
  }
}

export async function deleteHafalanRecord(id: string) {
  try {
    const docRef = doc(db, 'hafalanRecords', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `hafalanRecords/${id}`);
  }
}

export async function saveMasterLogin(record: MasterLoginRecord) {
  try {
    const docRef = doc(db, 'masterLogins', record.id);
    await setDoc(docRef, stripUndefined(record));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `masterLogins/${record.id}`);
  }
}

export async function deleteMasterLogin(id: string) {
  try {
    const docRef = doc(db, 'masterLogins', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `masterLogins/${id}`);
  }
}

export async function importAllData(data: {
  config?: PengajianConfig;
  transactions?: Transaction[];
  members?: Member[];
  duesRecords?: MemberDuesRecord[];
  weeklyDuties?: WeeklyDuty[];
  hafalanRecords?: HafalanRecord[];
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
      batchAdd.set(doc(db, 'transactions', t.id), stripUndefined(t));
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
      batchAdd.set(doc(db, 'members', m.id), stripUndefined(m));
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
      batchAdd.set(doc(db, 'duesRecords', d.id), stripUndefined(d));
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
      batchAdd.set(doc(db, 'weeklyDuties', duty.id), stripUndefined(duty));
    });
    await batchAdd.commit();
  }

  if (Array.isArray(data.hafalanRecords)) {
    const hafSnap = await getDocs(collection(db, 'hafalanRecords'));
    const batchDelete = writeBatch(db);
    hafSnap.forEach((d) => batchDelete.delete(d.ref));
    await batchDelete.commit();

    const batchAdd = writeBatch(db);
    data.hafalanRecords.forEach((item) => {
      batchAdd.set(doc(db, 'hafalanRecords', item.id), stripUndefined(item));
    });
    await batchAdd.commit();
  }
}

export async function resetDataToDefault() {
  const collectionsToClear = ['transactions', 'members', 'duesRecords', 'weeklyDuties', 'hafalanRecords'];

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
    isHafalanSeeded: true,
  });

  const batch = writeBatch(db);
  INITIAL_TRANSACTIONS.forEach((t) => {
    batch.set(doc(db, 'transactions', t.id), stripUndefined(t));
  });
  INITIAL_MEMBERS.forEach((m) => {
    batch.set(doc(db, 'members', m.id), stripUndefined(m));
  });
  INITIAL_WEEKLY_DUTIES.forEach((duty) => {
    batch.set(doc(db, 'weeklyDuties', duty.id), stripUndefined(duty));
  });
  INITIAL_HAFALAN.forEach((item) => {
    batch.set(doc(db, 'hafalanRecords', item.id), stripUndefined(item));
  });
  await batch.commit();
}
