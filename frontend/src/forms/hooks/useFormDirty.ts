import { useEffect, useRef, useState } from "react";

/**
 * Indica se o formulário de um modal foi alterado desde que ele abriu.
 *
 * O estado inicial é capturado logo após a abertura (no tick seguinte), depois que o
 * modal já preencheu os campos com os dados do registro em edição. Para modais que
 * carregam dados de forma assíncrona, passe `ready` = true só quando a carga terminar.
 */
export function useFormDirty(isOpen: boolean, value: unknown, ready = true): boolean {
  const serialized = JSON.stringify(value);
  const latestRef = useRef(serialized);
  latestRef.current = serialized;
  const [baseline, setBaseline] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !ready) {
      setBaseline(null);
      return;
    }
    const timer = setTimeout(() => setBaseline(latestRef.current), 0);
    return () => clearTimeout(timer);
  }, [isOpen, ready]);

  return isOpen && baseline !== null && baseline !== serialized;
}
