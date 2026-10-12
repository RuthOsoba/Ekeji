import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { fetchProfile, fetchSavedIds, toggleSaved } from "@/lib/ekeji";
import type { FitProfile } from "@/lib/fit";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export function useProfile() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });
}

export function useFitProfile(): FitProfile | null {
  const { data: profile } = useProfile();
  if (!profile) return null;
  const bust = profile.fit_bust_cm === null ? null : Number(profile.fit_bust_cm);
  const waist = profile.fit_waist_cm === null ? null : Number(profile.fit_waist_cm);
  const hip = profile.fit_hip_cm === null ? null : Number(profile.fit_hip_cm);
  if (bust === null && waist === null && hip === null) return null;
  return {
    bust_cm: bust,
    waist_cm: waist,
    hip_cm: hip,
    height_cm: profile.fit_height_cm === null ? null : Number(profile.fit_height_cm),
    preferred_fit: (profile.preferred_fit as FitProfile["preferred_fit"]) ?? "fitted",
    unit: profile.unit_preference === "in" ? "in" : "cm",
  };
}

export function useSaved() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["saved", user?.id],
    queryFn: () => fetchSavedIds(user!.id),
    enabled: !!user,
  });

  const savedIds = query.data ?? [];

  async function toggle(listingId: string) {
    if (!user) return false;
    const isSaved = savedIds.includes(listingId);
    await toggleSaved(user.id, listingId, isSaved);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["saved", user.id] }),
      queryClient.invalidateQueries({ queryKey: ["listings"] }),
      queryClient.invalidateQueries({ queryKey: ["listing", listingId] }),
    ]);
    return !isSaved;
  }

  return { savedIds, isSaved: (id: string) => savedIds.includes(id), toggle, signedIn: !!user };
}
