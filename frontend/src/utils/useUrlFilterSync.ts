import { useEffect, useRef, useState } from "react";

/**
 * Sincroniza filtros da página com a query string da URL.
 *
 * - Ao montar, chama `restore` com os parâmetros atuais da URL, para a página aplicar os filtros.
 * - Depois disso, grava `params` na URL a cada mudança (valores vazios são omitidos),
 *   usando replaceState para não criar entradas no histórico.
 *
 * Retorna `ready`: só fica true após a leitura da URL. Use-o para segurar consultas à API
 * e evitar uma busca com os valores padrão antes dos filtros da URL serem aplicados.
 */
export function useUrlFilterSync(
  restore: (params: URLSearchParams) => void,
  params: Record<string, string | null | undefined>,
): boolean {
  const [ready, setReady] = useState(false);
  const restoreRef = useRef(restore);
  restoreRef.current = restore;

  useEffect(() => {
    restoreRef.current(new URLSearchParams(window.location.search));
    setReady(true);
  }, []);

  const serialized = JSON.stringify(params);

  useEffect(() => {
    if (!ready) return;
    const search = new URLSearchParams();
    Object.entries(JSON.parse(serialized) as Record<string, string | null | undefined>).forEach(
      ([key, value]) => {
        if (value) search.set(key, value);
      },
    );
    const query = search.toString();
    window.history.replaceState(
      window.history.state,
      "",
      query ? `?${query}` : window.location.pathname,
    );
  }, [ready, serialized]);

  return ready;
}

export const parsePositiveInt = (value: string | null): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};
