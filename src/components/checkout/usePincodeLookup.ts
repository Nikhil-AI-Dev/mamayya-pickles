"use client";

import { useRef, useState } from "react";

/** India Post pincode directory - fills city/state from a 6-digit pin.
 *  Fail-open: any error, slow or malformed response leaves the form manual. */
async function lookupPincode(pin: string): Promise<{ district: string; state: string } | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return null;
    const first: unknown = data[0];
    if (typeof first !== "object" || first === null) return null;
    const { Status, PostOffice } = first as { Status?: unknown; PostOffice?: unknown };
    if (Status !== "Success" || !Array.isArray(PostOffice)) return null;
    const po: unknown = PostOffice[0];
    if (typeof po !== "object" || po === null) return null;
    const { District, State } = po as { District?: unknown; State?: unknown };
    if (typeof District !== "string" || typeof State !== "string") return null;
    if (!District.trim() || !State.trim()) return null;
    return { district: District.trim(), state: State.trim() };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function usePincodeLookup(cityRef: React.RefObject<HTMLInputElement | null>) {
  const [pinHint, setPinHint] = useState<string | null>(null);
  const requestSeq = useRef(0);
  const cityAutofilled = useRef(false);

  const onPincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pin = e.target.value.trim();
    setPinHint(null);
    if (!/^\d{6}$/.test(pin)) return;
    const mine = ++requestSeq.current;
    const found = await lookupPincode(pin);
    // A slower answer for an earlier pin must not overwrite the current one.
    if (mine !== requestSeq.current || !found) return;
    setPinHint(`${found.district}, ${found.state}`);
    const city = cityRef.current;
    if (city && (city.value.trim() === "" || cityAutofilled.current)) {
      city.value = found.district;
      cityAutofilled.current = true;
      // programmatic fill fires no input event; nudge the recap manually
      city.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };

  return { pinHint, onPincodeChange };
}
