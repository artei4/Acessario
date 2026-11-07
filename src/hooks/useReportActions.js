import { useCallback, useState } from 'react';
import { reportsService, votesService } from '../services/reportsService.js';
import { useCurrentUser } from '../context/UserContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const VOTE_MESSAGES = {
  confirm: 'Obrigado! Sua confirmação foi registrada.',
  resolved: 'Anotado: você informou que o problema foi resolvido.',
  incorrect: 'Anotado: você informou que a informação está incorreta.',
};

/**
 * Ações de escrita sobre relatos (criar, editar, excluir, votar), com estado de envio
 * e mensagens de retorno. Quem chama decide o que recarregar via `onChange`.
 */
export function useReportActions({ onChange } = {}) {
  const { user } = useCurrentUser();
  const toast = useToast();
  const [pending, setPending] = useState(null);

  const run = useCallback(
    async (key, action, successMessage) => {
      setPending(key);
      try {
        const result = await action();
        if (successMessage) toast.show(successMessage);
        await onChange?.();
        return result;
      } catch (error) {
        toast.show(error.userMessage ?? 'Não foi possível concluir a ação.', { tone: 'danger' });
        throw error;
      } finally {
        setPending(null);
      }
    },
    [onChange, toast],
  );

  const createReport = useCallback(
    (report) =>
      run('create', () => reportsService.create({ ...report, userId: user.id }), 'Relato enviado! Ele entra como “Não verificado”.'),
    [run, user],
  );

  const updateReport = useCallback(
    (id, changes) => run(`update:${id}`, () => reportsService.update(id, changes), 'Relato atualizado.'),
    [run],
  );

  const deleteReport = useCallback(
    (id) => run(`delete:${id}`, () => reportsService.remove(id), 'Relato excluído.'),
    [run],
  );

  const vote = useCallback(
    (reportId, type) =>
      run(`vote:${reportId}`, () => votesService.cast({ reportId, userId: user.id, type }), VOTE_MESSAGES[type]),
    [run, user],
  );

  const undoVote = useCallback(
    (voteId, reportId) => run(`vote:${reportId}`, () => votesService.remove(voteId), 'Voto desfeito.'),
    [run],
  );

  return { createReport, updateReport, deleteReport, vote, undoVote, pending, isPending: (key) => pending === key };
}
