"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditCardPage() {
  const params = useParams();
  const router = useRouter();
  const month = params.month as string;
  const cardId = params.id as string;

  useEffect(() => {
    router.replace(`/${month}/cards/${cardId}`);
  }, [router, month, cardId]);

  return null;
}
