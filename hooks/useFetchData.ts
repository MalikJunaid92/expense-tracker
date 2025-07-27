import { firestore } from "@/config/firebase";
import { collection, onSnapshot, query, QueryConstraint } from "firebase/firestore";
import { useEffect, useState } from "react";

export const useFetchData = <T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Prevent running if collection is missing or constraints contain undefined
    if (!collectionName || constraints.some((c) => c === undefined)) return;

    const collectionRef = collection(firestore, collectionName);
    const q = query(collectionRef, ...constraints);

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const fetchedData = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as T)
        );
        setData(fetchedData);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore query error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [collectionName, JSON.stringify(constraints)]);

  return { data, loading, error };
};
