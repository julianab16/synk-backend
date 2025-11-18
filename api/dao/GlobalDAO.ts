import { db } from "../config/firebase"

export class GlobalDAO<T extends {id?: string}>
    {
        private collection
    constructor(collectionName: string){
        this.collection = db.collection(collectionName);
    }

    async create(doc: Omit<T, 'id'>): Promise<string>{
        const ref = await this.collection.add(doc);
        return ref.id
    }

    async getAll(): Promise<T[]>{
        const documents = await this.collection.get()
        return documents.docs.map(doc => ({
            id: doc.id, ... doc.data()
        })) as T[]
    }

    async getById(id: string): Promise<T | null>{
        const doc = await this.collection.doc(id).get()
        if (!doc.exists) return null;
        const data = doc.data() as Omit<T, 'id'> | undefined;
        return { id: doc.id, ...(data || {}) } as T
    }

    async update(id: string, data: Partial<T>): Promise<void>{
        await this.collection.doc(id).update(data)
    }

    async delete(id: string): Promise<void>{
        await this.collection.doc(id).delete()
    }
}
