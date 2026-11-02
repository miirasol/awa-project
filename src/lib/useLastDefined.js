import { useState } from "react";

export function useLastDefined(value) {
  const [last, setLast] = useState(value);
  if (value != null && value !== last) setLast(value);
  return value ?? last;
}
