import { useState, useEffect } from "react";
import { supabase } from "./supabase-client";
import { projectId } from "../../utils/supabase/info";

interface Subscription {
  status: "active" | "inactive";
  startDate?: string;
  endDate?: string;
}

/**
 * Hook to check subscription status
 */
export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription>({ status: "inactive" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        setSubscription({ status: "inactive" });
        setLoading(false);
        return;
      }

      const userId = session.data.session.user.id;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ff738703/subscription/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        setSubscription({ status: "inactive" });
        setLoading(false);
        return;
      }

      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error("Error checking subscription:", error);
      setSubscription({ status: "inactive" });
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    setLoading(true);
    checkSubscription();
  };

  return {
    subscription,
    loading,
    refresh,
    isActive: subscription.status === "active",
  };
}
