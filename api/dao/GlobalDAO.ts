import * as admin from 'firebase-admin';
import { db } from "../config/firebase";

/**
 * Generic Firestore DAO using the Firebase Admin SDK.
 * T is the document shape and may include `id`.
 */
export class GlobalDAO<T extends { id?: string }> {
    protected collection: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>;

    constructor(collectionName: string) {
        this.collection = db.collection(collectionName);
    }

    /** Create a document with an auto-generated id. Returns the new id. */
    async create(doc: Omit<T, 'id'>): Promise<string> {
        const now = admin.firestore.FieldValue.serverTimestamp();
        const data = { ...doc, createdAt: now, updatedAt: now } as FirebaseFirestore.DocumentData;
        const ref = await this.collection.add(data);
        return ref.id;
    }

    /** Create a document using a specific id (useful when using auth uid as key). */
    async createWithId(id: string, doc: Omit<T, 'id'>): Promise<void> {
        const now = admin.firestore.FieldValue.serverTimestamp();
        await this.collection.doc(id).set({ ...doc, createdAt: now, updatedAt: now } as FirebaseFirestore.DocumentData);
    }

    /** Get all documents in the collection. */
    async getAll(): Promise<T[]> {
        const snapshot = await this.collection.get();
        return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as T) } as T));
    }

    /** Get a single document by id or null if not found. */
    async getById(id: string): Promise<T | null> {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists) return null;
        const data = doc.data() as Omit<T, 'id'> | undefined;
        return { id: doc.id, ...(data || {}) } as T;
    }

    /** Simple single-field query helper. */
    async findBy(field: string, op: FirebaseFirestore.WhereFilterOp, value: any): Promise<T[]> {
        const snapshot = await this.collection.where(field, op, value).get();
        return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as T) } as T));
    }

    /** Update document fields by id. */
        async update(id: string, data: Partial<T>): Promise<void> {
            await this.collection.doc(id).update({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() } as any);
        }

    /** Delete document by id. */
    async delete(id: string): Promise<boolean> {
        const docRef = this.collection.doc(id);
        const doc = await docRef.get();
        // debug: log existence and a small preview of the document to help troubleshooting
        try {
            console.log(`[GlobalDAO.delete] checking id=${id} exists=${doc.exists}`);
            if (doc.exists) {
                const preview = doc.data();
                // limit large payloads in logs
                console.log('[GlobalDAO.delete] doc preview:', JSON.stringify(preview).slice(0, 1000));
            }
        } catch (e) {
            console.error('[GlobalDAO.delete] failed to log doc preview', e);
        }

        if (!doc.exists) return false;
        await docRef.delete();
        return true;
    }
}
